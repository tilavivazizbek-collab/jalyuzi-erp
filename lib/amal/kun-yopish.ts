/**
 * lib/amal/kun-yopish.ts — TZ 12.17 · K-09 · 2.1 · 2.2-invariant
 *
 * «Kassaning yuragi. Har sotuvchi o'z kassasini yopadi.»
 *
 * ⚠️ TZ 12.17 — «Yopilgan kunga ORQADAN YOZUV QO'SHIB BO'LMAYDI. Aks
 *    holda kechagi farqni bugun "tuzatib" qo'yish mumkin bo'ladi va
 *    butun mexanizm ma'nosini yo'qotadi.»
 *
 * ⚠️ «Farq bo'lsa izoh MAJBURIY, lekin yopish BLOKLANMAYDI. Sotuvchini
 *    uyiga qo'ymay turib bo'lmaydi.»
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { kunFarqi, kunHisobi } from '@/lib/domain/balans';
import { dollar, pulKorsat, pulMatn, som } from '@/lib/domain/pul';
import { kunFarqiMatni } from '@/lib/domain/bildirishnoma';
import { BiznesXato } from '@/lib/xato';
import { kassaYozuviQoshTx, xarajatYozTx } from './kassa';
import { adminlarniOgohlantir } from './bildirishnoma';

/**
 * `Sql` ham, `TransactionSql` ham so'rov yubora oladi.
 *
 * ⚠️ `as unknown as` kastini ishlatmaslik uchun ATAYLAB union: kast
 *    turlar himoyasini o'chiradi va keyin xato jimgina o'tib ketadi.
 */
export type Soruvchi = postgres.Sql | postgres.TransactionSql;

export interface KunHolati {
  readonly kassaId: number;
  readonly kassaNomi: string;
  readonly valyuta: string;
  readonly sana: string;
  readonly boshlangich: string;
  readonly kirim: string;
  readonly chiqim: string;
  readonly hisoblangan: string;
  readonly yopilganmi: boolean;
  /**
   * Yopilgan kun yozuvining `id` si — QAYTA OCHISH uchun kerak.
   *
   * ⚠️ 2026-09-22: ilgari qaytarilmasdi va shu sabab «qayta ochish»
   *    tugmasini yasab bo'lmasdi. Amalning o'zi (`kunniQaytaOch`)
   *    2026-08 dan beri to'liq yozilgan, ekranda esa faqat
   *    «kerak bo'lsa admin qayta ochadi» degan VA'DA turardi.
   */
  readonly kunId: number | null;
}

/**
 * TZ 12.17 — kun oxiridagi hisob.
 *
 * ⚠️ 2.2-invariant — boshlang'ich qoldiq SAQLANMAYDI: u shu sanagacha
 *    bo'lgan barcha yozuvning yig'indisi. Aks holda ikki manba paydo
 *    bo'lardi va ular ajralib ketishi mumkin edi.
 */
export async function kunHolati(
  ulanish: Soruvchi,
  kassaId: number,
  sana: string,
): Promise<KunHolati> {
  const k = await ulanish<{ nom: string; valyuta: string }[]>`
    SELECT nom, valyuta FROM kassa WHERE id = ${kassaId}`;

  const kassa = k[0];
  if (kassa === undefined) throw new BiznesXato('KASSA_TOPILMADI', String(kassaId));

  const q = await ulanish<
    { boshlangich: string; kirim: string; chiqim: string }[]
  >`
    SELECT
      COALESCE(SUM(summa) FILTER (WHERE sana::date < ${sana}::date), 0)::text
        AS boshlangich,
      COALESCE(SUM(summa) FILTER (WHERE sana::date = ${sana}::date AND summa > 0), 0)::text
        AS kirim,
      COALESCE(ABS(SUM(summa) FILTER (WHERE sana::date = ${sana}::date AND summa < 0)), 0)::text
        AS chiqim
    FROM kassa_yozuv WHERE kassa_id = ${kassaId}`;

  const r = q[0] ?? { boshlangich: '0', kirim: '0', chiqim: '0' };

  // §2.2 — hisob DOMAINDA, bu yerda takrorlanmaydi
  const h = kunHisobi(som(r.boshlangich), som(r.kirim), som(r.chiqim));

  const yopiq = await ulanish<{ id: number }[]>`
    SELECT id FROM kassa_kun
    WHERE kassa_id = ${kassaId} AND sana = ${sana} AND yopildi IS NOT NULL
    LIMIT 1`;

  return {
    kassaId,
    kassaNomi: kassa.nom,
    valyuta: kassa.valyuta,
    sana,
    boshlangich: pulMatn(h.boshlangich),
    kirim: pulMatn(h.kirim),
    chiqim: pulMatn(h.chiqim),
    hisoblangan: pulMatn(h.hisoblangan),
    yopilganmi: yopiq[0] !== undefined,
    kunId: yopiq[0]?.id ?? null,
  };
}

export interface YopishNatijasi {
  readonly kunId: number;
  readonly hisoblangan: string;
  readonly sanaldi: string;
  readonly farq: string;
  readonly farqBormi: boolean;
}

/**
 * TZ 12.17 — kunni yopadi.
 *
 * ⚠️ Farq bo'lsa IZOH MAJBURIY — lekin bu yopishni BLOKLAMAYDI, faqat
 *    izohsiz yopib bo'lmaydi. Farqning o'zi normal hodisa.
 */
export async function kunniYop(
  ulanish: postgres.Sql,
  kirim: {
    readonly kassaId: number;
    readonly sana: string;
    readonly sanaldi: string;
    readonly izoh: string | null;
  },
  xodimId: number,
): Promise<YopishNatijasi> {
  return ulanish.begin(async (tx) => {
    const bor = await tx<{ id: number; yopildi: Date | null }[]>`
      SELECT id, yopildi FROM kassa_kun
      WHERE kassa_id = ${kirim.kassaId} AND sana = ${kirim.sana}
      FOR UPDATE`;

    if (bor[0]?.yopildi !== null && bor[0]?.yopildi !== undefined) {
      throw new BiznesXato('KUN_YOPILGAN', kirim.sana);
    }

    const h = await kunHolati(tx, kirim.kassaId, kirim.sana);

    const farq = kunFarqi(som(h.hisoblangan), som(kirim.sanaldi));
    const farqBormi = Number(pulMatn(farq)) !== 0;

    // TZ 12.17 — farq bo'lsa izoh MAJBURIY
    if (farqBormi && (kirim.izoh === null || kirim.izoh.trim() === '')) {
      throw new BiznesXato('KUN_IZOH_KERAK', pulMatn(farq));
    }

    const yangi = await tx<{ id: number }[]>`
      INSERT INTO kassa_kun (kassa_id, sana, boshlangich, kirim, chiqim,
                             hisoblangan, sanaldi, farq, yopildi, yopdi_id,
                             izoh, yaratdi_id)
      VALUES (${kirim.kassaId}, ${kirim.sana}, ${h.boshlangich}, ${h.kirim},
              ${h.chiqim}, ${h.hisoblangan}, ${kirim.sanaldi}, ${pulMatn(farq)},
              now(), ${xodimId}, ${kirim.izoh}, ${xodimId})
      ON CONFLICT (kassa_id, sana) DO UPDATE
        SET boshlangich = EXCLUDED.boshlangich, kirim = EXCLUDED.kirim,
            chiqim = EXCLUDED.chiqim, hisoblangan = EXCLUDED.hisoblangan,
            sanaldi = EXCLUDED.sanaldi, farq = EXCLUDED.farq,
            yopildi = now(), yopdi_id = ${xodimId}, izoh = EXCLUDED.izoh,
            ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      RETURNING id`;

    const kunId = yangi[0]?.id;
    if (kunId === undefined) throw new BiznesXato('KUN_SAQLANMADI', kirim.sana);

    /**
     * ── EGASI QARORI 2026-10-11: farq korxona XARAJATI ──
     *
     * Kamomad (sanaldi < hisoblangan) — kassadan chiqim + «Kassa farqi»
     * xarajati; ortiqcha — kassaga kirim + manfiy xarajat. Shunda kassa
     * qoldig'i SANALGAN pulga tenglashadi. Ilgari farq faqat shu jadvalga
     * yozilardi va yo'q pul keyingi kunlarda ham «bor» bo'lib turardi.
     *
     * ⚠️ Yozuv YOPILGAN KUN ichida (23:59:59): o'tgan kun yopilsa ham
     *    tuzatish bugunga emas, o'sha kunga tushadi.
     * ⚠️ Kun qayta ochilsa bu yozuvlar teskari yozuv bilan bekor qilinadi
     *    (`kunniQaytaOch`) — qayta yopishda farq ikki marta tushmaydi.
     */
    if (farqBormi) {
      await farqniYozTx(tx, {
        kunId,
        kassaId: kirim.kassaId,
        sana: kirim.sana,
        valyuta: h.valyuta === 'USD' ? 'USD' : 'SOM',
        farq: pulMatn(farq),
        izoh: kirim.izoh,
      }, xodimId);

      /**
       * TZ 13.9 · 12.17 — «Kun yopishda farq — faqat xabar». 2026-10-13
       * gacha matn (`kunFarqiMatni`) yozilgan, lekin hech qayerdan
       * chaqirilmasdi: kamomad haqida admin bilmay qolardi.
       * ⚠️ Navbatga — tranzaksiya ichida (2.1-invariant), yuborish keyin.
       */
      const k = await tx<{ nom: string; filial_id: number }[]>`
        SELECT nom, filial_id FROM kassa WHERE id = ${kirim.kassaId}`;
      const pul = (s: string): string =>
        `${pulKorsat(h.valyuta === 'USD' ? dollar(s) : som(s))} ${h.valyuta === 'USD' ? '$' : "so'm"}`;
      await adminlarniOgohlantir(
        tx,
        {
          filialId: k[0]?.filial_id ?? 0,
          hodisa: 'KUN_FARQI',
          matn: kunFarqiMatni({
            kassaNomi: `${k[0]?.nom ?? ''} · ${kirim.sana}`,
            kutilgan: pul(h.hisoblangan),
            sanalgan: pul(kirim.sanaldi),
            farq: pul(pulMatn(farq)),
          }),
          manbaTuri: 'kassa_kun',
          manbaId: kunId,
        },
        xodimId,
      );
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId},
              (SELECT filial_id FROM kassa WHERE id = ${kirim.kassaId}),
              'KUN_YOPILDI', 'kassa_kun', ${kunId},
              ${tx.json({
                sana: kirim.sana,
                hisoblangan: h.hisoblangan,
                sanaldi: kirim.sanaldi,
                farq: pulMatn(farq),
              })},
              ${kirim.izoh})`;

    return {
      kunId,
      hisoblangan: h.hisoblangan,
      sanaldi: kirim.sanaldi,
      farq: pulMatn(farq),
      farqBormi,
    };
  });
}

/**
 * TZ 12.17 — «Yopilgan kunga ORQADAN YOZUV QO'SHIB BO'LMAYDI.»
 *
 * Kassa yozuvi qo'shishdan oldin chaqiriladi.
 */
export async function kunYopiqmi(
  ulanish: Soruvchi,
  kassaId: number,
  sana: string,
): Promise<boolean> {
  const q = await ulanish<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_kun
    WHERE kassa_id = ${kassaId} AND sana = ${sana} AND yopildi IS NOT NULL`;
  return (q[0]?.n ?? 0) > 0;
}

/**
 * TZ 12.17 — «Kerak bo'lsa ADMIN kunni qayta ochadi — sabab MAJBURIY,
 * audit jurnaliga tushadi.»
 */
export async function kunniQaytaOch(
  ulanish: postgres.Sql,
  kunId: number,
  sabab: string,
  adminId: number,
): Promise<void> {
  if (sabab.trim() === '') {
    throw new BiznesXato('KUN_IZOH_KERAK', 'qayta ochish sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<{ id: number; kassa_id: number; yopildi: Date | null }[]>`
      SELECT id, kassa_id, yopildi FROM kassa_kun WHERE id = ${kunId} FOR UPDATE`;

    const k = q[0];
    if (k === undefined) throw new BiznesXato('KUN_TOPILMADI', String(kunId));
    if (k.yopildi === null) throw new BiznesXato('KUN_YOPILMAGAN', String(kunId));

    await tx`
      UPDATE kassa_kun
      SET yopildi = NULL, qayta_ochildi = now(),
          ozgartirildi = now(), ozgartirdi_id = ${adminId}
      WHERE id = ${kunId}`;

    // Yopishda yozilgan farq tuzatishi bekor qilinadi — qayta yopilganda yangisi yoziladi
    await farqniBekorQilTx(tx, kunId, sabab.trim(), adminId);

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${adminId},
              (SELECT filial_id FROM kassa WHERE id = ${k.kassa_id}),
              'KUN_QAYTA_OCHILDI', 'kassa_kun', ${kunId},
              ${tx.json({ yopildi: true })},
              ${tx.json({ yopildi: false })},
              ${sabab.trim()})`;
  });
}

export interface KunHarakati {
  readonly id: number;
  readonly sana: Date;
  readonly kod: string;
  readonly summa: string;
  readonly izoh: string | null;
  readonly xodimIsmi: string;
  readonly stornoQilinganmi: boolean;
}

/**
 * TZ 15.4 — kunlik yopish varaqasidagi harakatlar ro'yxati.
 *
 * ⚠️ `kassaKitobi` dan FARQI: u butun filialning oxirgi 200
 *    yozuvini beradi, bu esa BITTA KASSANING BITTA KUNI. Varaqa
 *    aynan shu kunni tasdiqlaydi, shuning uchun boshqa kun
 *    yozuvi unga tushmasligi kerak.
 *
 * ⚠️ Storno qilingan yozuv RO'YXATDA QOLADI (§6.5) — belgi bilan.
 *    Uni yashirish qog'ozdagi summani hisobdan ajratib yuborardi.
 */
export async function kunHarakatlari(
  ulanish: Soruvchi,
  kassaId: number,
  sana: string,
): Promise<readonly KunHarakati[]> {
  const q = await ulanish<
    {
      id: number;
      sana: Date;
      kod: string;
      summa: string;
      izoh: string | null;
      xodim_ismi: string;
      storno_qilinganmi: boolean;
    }[]
  >`
    SELECT k.id, k.sana, k.kod, k.summa::text, k.izoh,
           COALESCE(x.ism, '—') AS xodim_ismi,
           /*
            * ⚠️ 2026-10-11: ilgari manba_turi = 'kassa_storno' qidirilardi,
            *    storno esa storno_id bilan yoziladi — belgi HECH QACHON
            *    chiqmasdi. Kassa kitobi bilan bir xil shart.
            */
           EXISTS (
             SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = k.id
           ) AS storno_qilinganmi
    FROM kassa_yozuv k
    LEFT JOIN xodim x ON x.id = k.xodim_id
    WHERE k.kassa_id = ${kassaId} AND k.sana::date = ${sana}::date
    ORDER BY k.sana, k.id`;

  return q.map((x) => ({
    id: x.id,
    sana: x.sana,
    kod: x.kod,
    summa: x.summa,
    izoh: x.izoh,
    xodimIsmi: x.xodim_ismi,
    stornoQilinganmi: x.storno_qilinganmi,
  }));
}

// ─── 12.17 · Kun yopish farqi — egasi qarori 2026-10-11 ───────────────────

/**
 * Farqni kassa yozuvi va xarajat qilib yozadi (yopish tranzaksiyasida).
 *
 * @param farq sanaldi − hisoblangan: manfiy — kamomad, musbat — ortiqcha
 */
async function farqniYozTx(
  tx: postgres.TransactionSql,
  k: {
    readonly kunId: number;
    readonly kassaId: number;
    readonly sana: string;
    readonly valyuta: 'SOM' | 'USD';
    readonly farq: string;
    readonly izoh: string | null;
  },
  xodimId: number,
): Promise<void> {
  const f = new Decimal(k.farq);
  const kamomad = f.isNegative();
  // Qayta ochilib yopilgan kunda — keyingi qator raqami
  const q = await tx<{ n: number }[]>`
    SELECT COALESCE(MAX(qator), 0)::int AS n FROM kassa_yozuv
    WHERE manba_turi = 'kassa_kun' AND manba_id = ${k.kunId}`;
  const izoh = `Kun yopish farqi ${k.sana}${k.izoh === null || k.izoh.trim() === '' ? '' : ` — ${k.izoh.trim()}`}`;

  const yozuvId = await kassaYozuviQoshTx(
    tx,
    {
      kassaId: k.kassaId,
      kod: kamomad ? 'C13' : 'K12',
      summa: f.toFixed(2),
      valyuta: k.valyuta,
      manbaTuri: 'kassa_kun',
      manbaId: k.kunId,
      qator: (q[0]?.n ?? 0) + 1,
      izoh,
      // ⚠️ Toshkent vaqti doim +05 (yozgi vaqt yo'q)
      sana: `${k.sana} 23:59:59+05`,
    },
    xodimId,
  );

  const filial = await tx<{ filial_id: number }[]>`
    SELECT filial_id FROM kassa WHERE id = ${k.kassaId}`;
  await xarajatYozTx(
    tx,
    {
      sana: k.sana,
      filialId: filial[0]?.filial_id ?? 0,
      modda: 'KASSA_FARQI',
      // Kamomad — xarajat (+), ortiqcha — xarajatni kamaytiradi (−)
      summa: f.negated().toFixed(2),
      valyuta: k.valyuta,
      kassaYozuvId: yozuvId,
      manbaTuri: 'kassa_kun',
      manbaId: k.kunId,
      izoh,
    },
    xodimId,
  );
}

/**
 * Kun qayta ochilganda farq tuzatishini bekor qiladi — TESKARI yozuv bilan
 * (§6.5: kassa yozuvi o'chirilmaydi va o'zgartirilmaydi).
 */
async function farqniBekorQilTx(
  tx: postgres.TransactionSql,
  kunId: number,
  sabab: string,
  xodimId: number,
): Promise<void> {
  const yozuvlar = await tx<
    { id: number; sana: Date; kassa_id: number; kod: string; summa: string; valyuta: string }[]
  >`
    SELECT y.id, y.sana, y.kassa_id, y.kod, y.summa::text, y.valyuta
    FROM kassa_yozuv y
    WHERE y.manba_turi = 'kassa_kun' AND y.manba_id = ${kunId}
      AND y.storno_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = y.id)
    FOR UPDATE`;

  for (const y of yozuvlar) {
    const teskari = await tx<{ id: number }[]>`
      INSERT INTO kassa_yozuv (sana, kassa_id, kod, summa, valyuta, manba_turi, manba_id,
                               qator, storno_id, izoh, xodim_id)
      VALUES (${y.sana}, ${y.kassa_id}, ${y.kod}, ${new Decimal(y.summa).negated().toFixed(2)},
              ${y.valyuta}, 'storno', ${y.id}, 1, ${y.id},
              ${`Kun qayta ochildi — ${sabab}`}, ${xodimId})
      RETURNING id`;
    const tid = teskari[0]?.id;
    if (tid === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'kun farqi storno');

    await tx`
      INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta, kassa_yozuv_id,
                           manba_turi, manba_id, izoh, xodim_id)
      SELECT x.sana, x.filial_id, x.modda, -x.summa, x.valyuta, ${tid},
             'storno', x.id, ${`Kun qayta ochildi — ${sabab}`}, ${xodimId}
      FROM xarajat x WHERE x.kassa_yozuv_id = ${y.id}`;
  }
}

