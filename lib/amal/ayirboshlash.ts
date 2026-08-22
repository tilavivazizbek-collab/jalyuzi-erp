/**
 * lib/amal/ayirboshlash.ts — TZ 12.9 · 6.10 · 12.1 · 2.1-invariant
 *
 * Ayirboshlash va umidsiz qarz.
 *
 * ⚠️ TZ 12.9 — «Ayirboshlash KIRIM HAM, CHIQIM HAM EMAS — ichki
 *    ko'chish. Foydaga ta'sir qilmaydi.»
 *
 *    «FAQAT KOMISSIYA real yo'qotish. U alohida xarajat moddasiga
 *     tushadi: "Bank komissiyasi". Kurs farqi (9.6) bilan
 *     ARALASHTIRILMAYDI — bu boshqa narsa.»
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { kassaYozuviQoshTx, xarajatYozTx } from './kassa';
import { kunYopiqmi } from './kun-yopish';
import { BiznesXato } from '@/lib/xato';

export type Valyuta = 'SOM' | 'USD';

/** Qo'lda kiritilgan yozuv uchun noyob manba raqami (P-26). */
async function qoldaManbaId(ulanish: postgres.Sql): Promise<number> {
  const q = await ulanish<{ n: number }[]>`SELECT nextval('qolda_manba_seq')::int AS n`;
  const n = q[0]?.n;
  if (n === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'qolda');
  return n;
}

export interface AyirboshlashKirimi {
  readonly kimdanKassaId: number;
  readonly kimgaKassaId: number;
  /** Chiqadigan kassa valyutasidagi summa */
  readonly summa: string;
  /** TZ 12.9 — sozlamadagi qiymat taklif qilinadi, o'zgartiriladi */
  readonly kurs: string;
  /** Bank komissiyasi — KIRADIGAN kassa valyutasida */
  readonly komissiya: string;
  readonly izoh: string;
}

export interface AyirboshlashNatijasi {
  readonly chiqimId: number;
  readonly kirimId: number;
  /** Kursdan keyin, komissiyagacha */
  readonly ogirilgan: string;
  /** Kassaga haqiqatda kirgan summa */
  readonly kirgan: string;
  readonly xarajatId: number | null;
}

/**
 * TZ 12.9 — valyuta yoki shakl almashtirish. **Faqat admin.**
 *
 * ```
 * 1 000 $ → so'm, kurs 13 200 = 13 200 000
 * bank komissiyasi 0.5%       =     66 000
 * kassaga kirdi               = 13 134 000
 * ```
 *
 * ⚠️ «BITTA ATOMAR YOZUV. Ikkita alohida yozuv qilinsa, bittasi storno
 *    qilinib ikkinchisi qolib ketishi mumkin.» Shuning uchun hammasi
 *    bitta tranzaksiyada va BIR MANBAGA bog'langan — storno ikkalasini
 *    birga topadi.
 */
export async function ayirboshlash(
  ulanish: postgres.Sql,
  kirim: AyirboshlashKirimi,
  filialId: number,
  xodimId: number,
): Promise<AyirboshlashNatijasi> {
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', 'ayirboshlash');
  }
  if (Number(kirim.kurs) <= 0) {
    throw new BiznesXato('KURS_NOTOGRI', kirim.kurs);
  }
  if (Number(kirim.komissiya) < 0) {
    throw new BiznesXato('TOLOV_MANFIY', 'komissiya');
  }
  if (kirim.kimdanKassaId === kirim.kimgaKassaId) {
    throw new BiznesXato('KASSA_VALYUTA_MOS_EMAS', "o'ziga o'zi ayirboshlanmaydi");
  }

  const manbaId = await qoldaManbaId(ulanish);

  return ulanish.begin(async (tx) => {
    const kassalar = await tx<
      { id: number; valyuta: string; xodim_id: number | null }[]
    >`
      SELECT id, valyuta, xodim_id FROM kassa
      WHERE id IN (${kirim.kimdanKassaId}, ${kirim.kimgaKassaId}) AND faol = true`;

    if (kassalar.length !== 2) throw new BiznesXato('KASSA_TOPILMADI');

    // TZ 12.9 — «FAQAT ADMIN qila oladi»: ikkala kassa ham filialniki
    if (kassalar.some((k) => k.xodim_id !== null)) {
      throw new BiznesXato('KASSA_ADMIN_EMAS', 'ayirboshlash');
    }

    const dan = kassalar.find((k) => k.id === kirim.kimdanKassaId);
    const ga = kassalar.find((k) => k.id === kirim.kimgaKassaId);
    if (dan === undefined || ga === undefined) throw new BiznesXato('KASSA_TOPILMADI');

    const bugun = new Date().toISOString().slice(0, 10);
    for (const k of [kirim.kimdanKassaId, kirim.kimgaKassaId]) {
      if (await kunYopiqmi(tx, k, bugun)) throw new BiznesXato('KUN_YOPILGAN', bugun);
    }

    const summa = new Decimal(kirim.summa);
    const kurs = new Decimal(kirim.kurs);

    /**
     * Kurs qaysi yo'nalishda qo'llanadi:
     *   USD → SOM   summa × kurs
     *   SOM → USD   summa ÷ kurs
     *   SOM → SOM   kurs ishlatilmaydi (karta → naqd)
     */
    const ogirilgan =
      dan.valyuta === ga.valyuta
        ? summa
        : dan.valyuta === 'USD'
          ? summa.times(kurs)
          : summa.div(kurs);

    const komissiya = new Decimal(kirim.komissiya);
    const kirgan = ogirilgan.minus(komissiya);

    if (kirgan.lessThanOrEqualTo(0)) {
      throw new BiznesXato('TOLOV_MANFIY', 'komissiya summadan katta');
    }

    const chiqimId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kimdanKassaId,
        kod: 'C11',
        summa: summa.negated().toFixed(2),
        valyuta: dan.valyuta as Valyuta,
        manbaTuri: 'ayirboshlash',
        manbaId,
        qator: 1,
        izoh: `Ayirboshlash — ${kirim.izoh.trim()}`,
      },
      xodimId,
    );

    const kirimId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kimgaKassaId,
        kod: 'K10',
        summa: kirgan.toFixed(2),
        valyuta: ga.valyuta as Valyuta,
        manbaTuri: 'ayirboshlash',
        manbaId,
        qator: 2,
        izoh: `Ayirboshlash — ${kirim.izoh.trim()}`,
      },
      xodimId,
    );

    /**
     * TZ 12.9 — «FAQAT KOMISSIYA real yo'qotish.»
     *
     * ⚠️ Bu xarajat kassa yozuviga BOG'LANMAYDI: pul allaqachon
     *    ayirboshlash ichida ushlab qolingan, alohida chiqim yo'q.
     *    Bog'lansa bir xil pul ikki marta sanalardi (12.1).
     */
    let xarajatId: number | null = null;
    if (komissiya.greaterThan(0)) {
      xarajatId = await xarajatYozTx(
        tx,
        {
          sana: bugun,
          filialId,
          modda: 'BANK_KOMISSIYASI',
          summa: komissiya.toFixed(2),
          valyuta: ga.valyuta as Valyuta,
          kassaYozuvId: null,
          manbaTuri: 'ayirboshlash',
          manbaId,
          izoh: kirim.izoh.trim(),
        },
        xodimId,
      );
    }

    return {
      chiqimId,
      kirimId,
      ogirilgan: ogirilgan.toFixed(2),
      kirgan: kirgan.toFixed(2),
      xarajatId,
    };
  });
}

// ─── TZ 6.10 · Umidsiz qarz ───────────────────────────────────────────────

/**
 * TZ 6.10 — «Admin qarzni HISOBDAN CHIQARA oladi. Sabab MAJBURIY,
 * audit jurnaliga tushadi.»
 *
 * ⚠️ Kassaga TEGMAYDI — pul kelmagan, faqat qarz yopiladi. Lekin bu
 *    HAQIQIY XARAJAT (12.1): `UMIDSIZ_QARZ` moddasi, kassa yozuvisiz.
 *
 * ⚠️ «Mijoz keyin kelib to'lasa — pul kassaga "boshqa kirim" (K9)
 *    sifatida kiritiladi... lekin BALANSIGA QO'SHILMAYDI, qarz
 *    allaqachon yopilgan.» Shuning uchun keyingi to'lov `boshqaHodisa`
 *    orqali yoziladi va `mijoz_harakat` ga tegmaydi.
 */
export async function umidsizQarz(
  ulanish: postgres.Sql,
  kirim: {
    readonly mijozId: number;
    readonly summa: string;
    readonly valyuta: Valyuta;
    readonly sabab: string;
  },
  filialId: number,
  xodimId: number,
): Promise<{ xarajatId: number; qolganQarz: string }> {
  if (kirim.sabab.trim() === '') {
    throw new BiznesXato('XARAJAT_IZOH_KERAK', 'umidsiz qarz');
  }
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', 'umidsiz qarz');
  }

  return ulanish.begin(async (tx) => {
    const summa = new Decimal(kirim.summa);

    await tx`
      INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                 manba_turi, manba_id, izoh, xodim_id)
      VALUES (${kirim.mijozId}, ${filialId}, 'UMIDSIZ_QARZ',
              ${summa.negated().toFixed(2)}, ${kirim.valyuta},
              'mijoz', ${kirim.mijozId}, ${kirim.sabab.trim()}, ${xodimId})`;

    // 12.1 — pul chiqmagan xarajat
    const xarajatId = await xarajatYozTx(
      tx,
      {
        sana: new Date().toISOString().slice(0, 10),
        filialId,
        modda: 'UMIDSIZ_QARZ',
        summa: summa.toFixed(2),
        valyuta: kirim.valyuta,
        kassaYozuvId: null,
        manbaTuri: 'mijoz',
        manbaId: kirim.mijozId,
        izoh: kirim.sabab.trim(),
      },
      xodimId,
    );

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'UMIDSIZ_QARZ', 'mijoz', ${kirim.mijozId},
              ${tx.json({ summa: summa.toFixed(2), valyuta: kirim.valyuta })},
              ${kirim.sabab.trim()})`;

    // 2.2-invariant — qarz jurnaldan chiqadi
    const q = await tx<{ qarz: string | null }[]>`
      SELECT SUM(summa)::text AS qarz FROM mijoz_harakat
      WHERE mijoz_id = ${kirim.mijozId} AND valyuta = ${kirim.valyuta}`;

    return { xarajatId, qolganQarz: q[0]?.qarz ?? '0' };
  });
}
