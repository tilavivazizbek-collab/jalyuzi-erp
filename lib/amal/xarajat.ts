/**
 * lib/amal/xarajat.ts — TZ 12.9 · 12.10 · 12.11 · 12.1 · 2.1-invariant
 *
 * Qo'lda kiritiladigan kassa hodisalari: operatsion xarajat,
 * ayirboshlash, egasining puli, boshqa kirim/chiqim.
 *
 * ⚠️ TZ 12.1 ning uch guruhi shu faylda ko'rinadi:
 *
 *    C7  operatsion xarajat  — kassadan chiqadi VA xarajat
 *    C8  egasi pul oldi      — kassadan chiqadi, XARAJAT EMAS
 *    K6  egasi pul qo'shdi   — kassaga kiradi, DAROMAD EMAS
 *
 *    Qaysi biri xarajat ekanini `lib/domain/balans.ts` hal qiladi (§2.2).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { chiqimQil, kassaYozuviQoshTx } from './kassa';
import { kunYopiqmi } from './kun-yopish';
import { type XarajatModdasi } from '@/lib/domain/balans';
import { BiznesXato } from '@/lib/xato';

export type Valyuta = 'SOM' | 'USD';

/** Bir manbadan navbatdagi qator — 12.3 uchligi buzilmasin. */
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

// ─── TZ 12.10 · Operatsion xarajat ────────────────────────────────────────

/**
 * TZ 12.10 — «Sotuvchi ham kirita oladi, chegara yo'q... IZOH MAJBURIY.»
 *
 * ⚠️ «Bu HAQIQIY XARAJAT: kassadan ham chiqadi, foyda-zarar hisobotiga
 *    ham tushadi.»
 */
export async function operatsionXarajat(
  ulanish: postgres.Sql,
  kirim: {
    readonly kassaId: number;
    readonly summa: string;
    readonly valyuta: Valyuta;
    readonly modda: XarajatModdasi;
    readonly izoh: string;
  },
  filialId: number,
  xodimId: number,
): Promise<{ kassaYozuvId: number; xarajatId: number | null }> {
  if (kirim.izoh.trim() === '') {
    throw new BiznesXato('XARAJAT_IZOH_KERAK', kirim.modda);
  }
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', kirim.modda);
  }

  const bugun = new Date().toISOString().slice(0, 10);
  if (await kunYopiqmi(ulanish, kirim.kassaId, bugun)) {
    throw new BiznesXato('KUN_YOPILGAN', bugun);
  }

  // Manba «qo'lda» — 12.3: «Qo'lda kiritilgan yozuvda manba "qo'lda"
  // bo'ladi va u hech qaysi modulga ta'sir qilmaydi.»
  const manbaId = await qolMaManbaId(ulanish);

  return chiqimQil(
    ulanish,
    {
      yozuv: {
        kassaId: kirim.kassaId,
        kod: 'C7',
        summa: (-Number(kirim.summa)).toFixed(2),
        valyuta: kirim.valyuta,
        manbaTuri: 'qolda',
        manbaId,
        qator: 1,
        izoh: kirim.izoh.trim(),
      },
      filialId,
      sana: bugun,
      modda: kirim.modda,
    },
    xodimId,
  );
}

/**
 * Qo'lda kiritilgan yozuv uchun noyob manba raqami.
 *
 * ⚠️ 12.3 uchligi (`manba_turi`, `manba_id`, `qator`) noyob bo'lishi
 *    shart. Qo'lda kiritilgan yozuvning tabiiy manbasi yo'q, shuning
 *    uchun ketma-ketlik ishlatiladi — `bolak_kod_seq` bilan bir xil
 *    yondashuv (P-26).
 */
async function qolMaManbaId(ulanish: postgres.Sql): Promise<number> {
  const q = await ulanish<{ n: number }[]>`SELECT nextval('qolda_manba_seq')::int AS n`;
  const n = q[0]?.n;
  if (n === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'qolda');
  return n;
}

// ─── TZ 12.11 · Egasining puli ────────────────────────────────────────────

/**
 * TZ 12.11 — «FAQAT ADMIN KASSASIDAN. Sotuvchi kassasidan olinmaydi.»
 *
 * ⚠️ «XARAJAT EMAS — foydaga ta'sir qilmaydi. Faqat kassa qoldig'ini
 *    o'zgartiradi va kassa oqimi hisobotida ko'rinadi.»
 *
 *    «Yozilmasa kassa hech qachon to'g'ri chiqmaydi.»
 */
export async function eganingPuli(
  ulanish: postgres.Sql,
  kirim: {
    readonly kassaId: number;
    readonly summa: string;
    readonly valyuta: Valyuta;
    /** true — egasi pul qo'shdi (K6), false — pul oldi (C8) */
    readonly qoshdimi: boolean;
    readonly izoh: string;
  },
  xodimId: number,
): Promise<{ kassaYozuvId: number }> {
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', 'egasi');
  }

  return ulanish.begin(async (tx) => {
    // TZ 12.11 — faqat ADMIN (filial) kassasi
    const k = await tx<{ xodim_id: number | null }[]>`
      SELECT xodim_id FROM kassa WHERE id = ${kirim.kassaId} AND faol = true`;

    const kassa = k[0];
    if (kassa === undefined) throw new BiznesXato('KASSA_TOPILMADI', String(kirim.kassaId));
    if (kassa.xodim_id !== null) {
      throw new BiznesXato('KASSA_ADMIN_EMAS', String(kirim.kassaId));
    }

    const bugun = new Date().toISOString().slice(0, 10);
    if (await kunYopiqmi(tx, kirim.kassaId, bugun)) {
      throw new BiznesXato('KUN_YOPILGAN', bugun);
    }

    const summa = new Decimal(kirim.summa);
    /**
     * Manba — kassaning o'zi, qator esa ketma-ket oshadi: egasi bir
     * kassadan bir necha marta pul olishi mumkin (12.3 uchligi).
     */
    const qator = await keyingiQator(tx, 'egasi', kirim.kassaId);

    const kassaYozuvId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kassaId,
        kod: kirim.qoshdimi ? 'K6' : 'C8',
        summa: kirim.qoshdimi ? summa.toFixed(2) : summa.negated().toFixed(2),
        valyuta: kirim.valyuta,
        manbaTuri: 'egasi',
        manbaId: kirim.kassaId,
        qator,
        izoh: kirim.izoh.trim() === '' ? null : kirim.izoh.trim(),
      },
      xodimId,
    );

    /**
     * ⚠️ `xarajat` jadvaliga YOZILMAYDI (12.11). Bu ataylab: egasining
     *    puli foydaga ta'sir qilmaydi, faqat kassa qoldig'ini
     *    o'zgartiradi.
     */
    return { kassaYozuvId };
  });
}

// ─── TZ 12.5 · K9 · 12.6 · C10 — boshqa kirim/chiqim ──────────────────────

/**
 * TZ 12.5 (K9) va 12.6 (C10) — «boshqa kirim / boshqa chiqim, IZOH
 * MAJBURIY».
 *
 * ⚠️ Chiqim `BOSHQA` moddasi bilan xarajatga tushadi, kirim esa
 *    tushmaydi — 12.1 bo'yicha kirim umuman xarajat emas.
 */
export async function boshqaHodisa(
  ulanish: postgres.Sql,
  kirim: {
    readonly kassaId: number;
    readonly summa: string;
    readonly valyuta: Valyuta;
    readonly kirimmi: boolean;
    readonly izoh: string;
  },
  filialId: number,
  xodimId: number,
): Promise<{ kassaYozuvId: number; xarajatId: number | null }> {
  if (kirim.izoh.trim() === '') {
    throw new BiznesXato('XARAJAT_IZOH_KERAK', 'boshqa');
  }
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('TOLOV_MANFIY', 'boshqa');
  }

  const bugun = new Date().toISOString().slice(0, 10);
  if (await kunYopiqmi(ulanish, kirim.kassaId, bugun)) {
    throw new BiznesXato('KUN_YOPILGAN', bugun);
  }

  const manbaId = await qolMaManbaId(ulanish);
  const summa = new Decimal(kirim.summa);

  if (kirim.kirimmi) {
    const kassaYozuvId = await ulanish.begin(async (tx) =>
      kassaYozuviQoshTx(
        tx,
        {
          kassaId: kirim.kassaId,
          kod: 'K9',
          summa: summa.toFixed(2),
          valyuta: kirim.valyuta,
          manbaTuri: 'qolda',
          manbaId,
          qator: 1,
          izoh: kirim.izoh.trim(),
        },
        xodimId,
      ),
    );
    return { kassaYozuvId, xarajatId: null };
  }

  return chiqimQil(
    ulanish,
    {
      yozuv: {
        kassaId: kirim.kassaId,
        kod: 'C10',
        summa: summa.negated().toFixed(2),
        valyuta: kirim.valyuta,
        manbaTuri: 'qolda',
        manbaId,
        qator: 1,
        izoh: kirim.izoh.trim(),
      },
      filialId,
      sana: bugun,
      modda: 'BOSHQA',
    },
    xodimId,
  );
}
