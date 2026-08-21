/**
 * lib/amal/tolov.ts — TZ 3.12 · 6.8 · 6.9 · 10.15 · 12.1 · 12.5 · 12.6
 *                     2.1 · 2.2-invariant · AUDIT B-04
 *
 * To'lovlar: buyurtma to'lovi, mijoz qarzini to'lash, ish haqi to'lovi.
 *
 * ⚠️ TZ 12.1 — bu yerdagi HECH BIR to'lov XARAJAT EMAS:
 *
 *    · buyurtma to'lovi — kassaga KIRIM, xarajat umuman yo'q
 *    · ish haqi to'lovi — haq allaqachon «Tugatdim» da xarajat bo'lgan
 *
 *    Xarajat yozilishi kerakmi degan qaror `lib/domain/balans.ts` da
 *    (§2.2), shu yerda ro'yxat takrorlanmaydi.
 *
 * ⚠️ QISM 1 §1.3 — «Bitta operatsiyada BITTA VALYUTA» (6.9). So'm ham,
 *    dollar ham qarz bo'lsa — ikkita alohida yozuv.
 */

import type postgres from 'postgres';
import { kassaYozuviQoshTx } from './kassa';
import { kunYopiqmi } from './kun-yopish';
import { tolovniBalansValyutasiga } from '@/lib/domain/balans';
import { BiznesXato } from '@/lib/xato';

export type Valyuta = 'SOM' | 'USD';

export interface TolovQatori {
  readonly kassaId: number;
  readonly summa: string;
  readonly valyuta: Valyuta;
}

/**
 * TZ 12.17 — «Yopilgan kunga ORQADAN YOZUV QO'SHIB BO'LMAYDI.»
 *
 * Har to'lovdan oldin tekshiriladi. Aks holda kechagi farqni bugun
 * «tuzatib» qo'yish mumkin bo'lardi.
 *
 * ⚠️ Tekshiruvning O'ZI `lib/amal/kun-yopish.ts` da (§2.2) — bu yerda
 *    faqat xato tashlanadi.
 */
async function kunOchiqmi(
  tx: postgres.TransactionSql,
  kassaId: number,
): Promise<void> {
  const bugun = new Date().toISOString().slice(0, 10);
  if (await kunYopiqmi(tx, kassaId, bugun)) {
    throw new BiznesXato('KUN_YOPILGAN', bugun);
  }
}

// ─── TZ 3.12 · Buyurtma to'lovi ───────────────────────────────────────────

export interface BuyurtmaTolovi {
  readonly buyurtmaId: number;
  /** TZ 3.12 — «Bir nechta usul birga: naqd + karta» */
  readonly qatorlar: readonly TolovQatori[];
  readonly izoh: string | null;
}

export interface TolovNatijasi {
  readonly kassaYozuvlari: readonly number[];
  /** TZ 3.12 — «To'lov to'liq bo'lmasa, qolgan summa QARZGA yoziladi» */
  readonly qarzgaYozildi: string;
  readonly yangiQarz: string;
}

/**
 * TZ 3.12 — buyurtma to'lovi (K1/K2 kodlari).
 *
 * BITTA TRANZAKSIYADA: har to'lov qatori uchun kassa yozuvi va
 * mijozning qarz harakati (6.8).
 *
 * ⚠️ Mijozsiz buyurtmada qarz yozilmaydi — «ko'chadagi tasodifiy
 *    xaridor» (3.10). U holda to'lov to'liq bo'lishi kerak.
 */
export async function buyurtmaTolovi(
  ulanish: postgres.Sql,
  kirim: BuyurtmaTolovi,
  xodimId: number,
  kod: 'K1' | 'K2' = 'K1',
): Promise<TolovNatijasi> {
  if (kirim.qatorlar.length === 0) {
    throw new BiznesXato('TOLOV_BOSH', String(kirim.buyurtmaId));
  }
  if (kirim.qatorlar.some((q) => Number(q.summa) <= 0)) {
    throw new BiznesXato('TOLOV_MANFIY', String(kirim.buyurtmaId));
  }

  return ulanish.begin(async (tx) => {
    const b = await tx<
      {
        id: number;
        mijoz_id: number | null;
        sotgan_filial_id: number;
        valyuta: string;
        kurs_snapshot: string | null;
        jami: string | null;
      }[]
    >`
      SELECT b.id, b.mijoz_id, b.sotgan_filial_id, b.valyuta, b.kurs_snapshot,
             (SELECT SUM(p.narx_snapshot - COALESCE(p.chegirma_summa, 0))::text
                FROM buyurtma_pozitsiya p
               WHERE p.buyurtma_id = b.id
                 AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')) AS jami
      FROM buyurtma b WHERE b.id = ${kirim.buyurtmaId} FOR UPDATE`;

    const buyurtma = b[0];
    if (buyurtma === undefined) {
      throw new BiznesXato('BUYURTMA_TOPILMADI', String(kirim.buyurtmaId));
    }

    const kassaYozuvlari: number[] = [];
    let tolangan = 0;

    for (const [i, q] of kirim.qatorlar.entries()) {
      await kunOchiqmi(tx, q.kassaId);

      const id = await kassaYozuviQoshTx(
        tx,
        {
          kassaId: q.kassaId,
          kod,
          summa: Number(q.summa).toFixed(2),
          valyuta: q.valyuta,
          manbaTuri: 'buyurtma',
          manbaId: kirim.buyurtmaId,
          // TZ 12.3 — bir buyurtmada bir nechta to'lov qatori bo'ladi
          qator: i + 1,
          izoh: kirim.izoh,
        },
        xodimId,
      );
      kassaYozuvlari.push(id);

      // AUDIT B-04 — buyurtma valyutasi BITTA, boshqa valyutadagi
      // to'lov buyurtmaning kursi bilan o'giriladi
      tolangan += Number(
        tolovniBalansValyutasiga(
          q.summa,
          q.valyuta,
          buyurtma.valyuta as Valyuta,
          buyurtma.kurs_snapshot,
        ),
      );
    }

    const jami = Number(buyurtma.jami ?? 0);
    const qarz = jami - tolangan;

    /**
     * TZ 3.12 — «To'lov to'liq bo'lmasa, qolgan summa QARZGA yoziladi.»
     *
     * ⚠️ TZ 3.10 — mijozsiz buyurtmada qarz yozib bo'lmaydi: tizim
     *    qarzni kimdan undirishni bilmaydi.
     */
    if (qarz > 0.009 && buyurtma.mijoz_id === null) {
      throw new BiznesXato('BUYURTMA_MIJOZ_KERAK', qarz.toFixed(2));
    }

    /**
     * ⚠️ `SOTUV` qatori BU YERDA YOZILMAYDI — u buyurtma yaratilganda
     *    yoziladi (`lib/amal/buyurtma.ts`).
     *
     *    Avval shu yerda edi va ikki marta to'lov qilinsa qarz IKKI
     *    BAROBAR oshardi: har to'lovda yangi `SOTUV` qatori tushardi.
     *    Sotuv bir marta bo'ladi, to'lov esa bir necha marta.
     */
    if (buyurtma.mijoz_id !== null) {
      await tx`
        INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                   kurs_snapshot, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${buyurtma.mijoz_id}, ${buyurtma.sotgan_filial_id}, 'TOLOV',
                ${(-tolangan).toFixed(2)}, ${buyurtma.valyuta},
                ${buyurtma.kurs_snapshot}, 'buyurtma_tolov', ${kirim.buyurtmaId},
                ${kirim.izoh}, ${xodimId})`;
    }

    return {
      kassaYozuvlari,
      qarzgaYozildi: qarz > 0 ? qarz.toFixed(2) : '0.00',
      yangiQarz: qarz.toFixed(2),
    };
  });
}

// ─── TZ 6.9 · Mijoz qarzini to'lash ───────────────────────────────────────

/**
 * TZ 6.9 — «Bu KASSA KIRIM OYNASINING BIR TURI, alohida oyna emas.»
 *
 * ⚠️ «Bitta operatsiyada BITTA VALYUTA. Mijozda so'm ham, dollar ham
 *    qarz bo'lsa — ikkita alohida yozuv.»
 */
export async function qarzniTola(
  ulanish: postgres.Sql,
  kirim: {
    readonly mijozId: number;
    readonly kassaId: number;
    readonly summa: string;
    readonly valyuta: Valyuta;
    readonly izoh: string | null;
  },
  filialId: number,
  xodimId: number,
): Promise<{ kassaYozuvId: number; qolganQarz: string }> {
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', String(kirim.mijozId));
  }

  return ulanish.begin(async (tx) => {
    await kunOchiqmi(tx, kirim.kassaId);

    const kassaYozuvId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kassaId,
        kod: 'K3',
        summa: Number(kirim.summa).toFixed(2),
        valyuta: kirim.valyuta,
        manbaTuri: 'mijoz',
        manbaId: kirim.mijozId,
        // Bir mijoz bir necha marta to'laydi — qator ketma-ket oshadi
        qator: await keyingiQator(tx, 'mijoz', kirim.mijozId),
        izoh: kirim.izoh,
      },
      xodimId,
    );

    await tx`
      INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                 manba_turi, manba_id, izoh, xodim_id)
      VALUES (${kirim.mijozId}, ${filialId}, 'TOLOV',
              ${(-Number(kirim.summa)).toFixed(2)}, ${kirim.valyuta},
              'kassa_yozuv', ${kassaYozuvId}, ${kirim.izoh}, ${xodimId})`;

    // 2.2-invariant — qarz SAQLANMAYDI, jurnaldan chiqadi
    const q = await tx<{ qarz: string | null }[]>`
      SELECT SUM(summa)::text AS qarz FROM mijoz_harakat
      WHERE mijoz_id = ${kirim.mijozId} AND valyuta = ${kirim.valyuta}`;

    return { kassaYozuvId, qolganQarz: q[0]?.qarz ?? '0' };
  });
}

/** Bir manbadan navbatdagi qator raqami — 12.3 uchligini buzmaslik uchun. */
async function keyingiQator(
  tx: postgres.TransactionSql,
  manbaTuri: string,
  manbaId: number,
): Promise<number> {
  const q = await tx<{ n: number }[]>`
    SELECT COALESCE(MAX(qator), 0)::int AS n FROM kassa_yozuv
    WHERE manba_turi = ${manbaTuri} AND manba_id = ${manbaId}`;
  return (q[0]?.n ?? 0) + 1;
}

// ─── TZ 10.15 · Ish haqi to'lovi ──────────────────────────────────────────

/**
 * TZ 10.15 — ish haqi yoki avans to'lovi (C4 / C5).
 *
 * ⚠️ TZ 12.1 — kassadan pul chiqadi, lekin XARAJAT YOZILMAYDI: haq
 *    allaqachon «Tugatdim» da xarajat bo'lgan (10.10). Ikkalasi
 *    sanalsa 140 000 chiqardi, aslida 70 000.
 *
 * ⚠️ TZ 10.15 — «Balansdan ko'p berilsa BLOKLANMAYDI — bu avans
 *    hisoblanadi, balans manfiyga tushadi.»
 *
 * ⚠️ TZ 10.5 — to'lov balans valyutasiga o'giriladi, kurs parametr.
 */
export async function ishHaqiTola(
  ulanish: postgres.Sql,
  kirim: {
    readonly xodimId: number;
    readonly kassaId: number;
    readonly summa: string;
    readonly valyuta: Valyuta;
    /** Balans boshqa valyutada bo'lsa MAJBURIY (10.5) */
    readonly balansValyutasi: Valyuta;
    readonly kurs: string | null;
    readonly avansmi: boolean;
    readonly izoh: string | null;
  },
  filialId: number,
  yozgan: number,
): Promise<{ kassaYozuvId: number; balansdanYechildi: string }> {
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', String(kirim.xodimId));
  }

  return ulanish.begin(async (tx) => {
    await kunOchiqmi(tx, kirim.kassaId);

    const kassaYozuvId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kassaId,
        kod: kirim.avansmi ? 'C5' : 'C4',
        summa: (-Number(kirim.summa)).toFixed(2),
        valyuta: kirim.valyuta,
        manbaTuri: 'xodim',
        manbaId: kirim.xodimId,
        qator: await keyingiQator(tx, 'xodim', kirim.xodimId),
        izoh: kirim.izoh,
      },
      yozgan,
    );

    // §2.2 — o'girish qoidasi domainda
    const balansdan = tolovniBalansValyutasiga(
      kirim.summa,
      kirim.valyuta,
      kirim.balansValyutasi,
      kirim.kurs,
    );

    await tx`
      INSERT INTO xodim_harakat (xodim_id, filial_id, turi, summa, valyuta,
                                 kurs_snapshot, manba_turi, manba_id, izoh,
                                 xodim_yozdi_id)
      VALUES (${kirim.xodimId}, ${filialId},
              ${kirim.avansmi ? 'AVANS' : 'TOLOV'},
              ${(-Number(balansdan)).toFixed(2)}, ${kirim.balansValyutasi},
              ${kirim.kurs}, 'kassa_yozuv', ${kassaYozuvId}, ${kirim.izoh},
              ${yozgan})`;

    return { kassaYozuvId, balansdanYechildi: balansdan };
  });
}
