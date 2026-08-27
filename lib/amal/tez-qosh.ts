/**
 * lib/amal/tez-qosh.ts — ro'yxat ichidan yangi yozuv qo'shish.
 *
 * ⚠️ Bu amallar TO'LIQ kartochkani yaratmaydi — faqat NOMINI. Sabab:
 *    odam boshqa ish ustida turibdi (material kiritmoqda, buyurtma
 *    yozmoqda) va uni to'liq kartochka to'ldirishga majburlash
 *    o'sha ishni to'xtatadi. Qolgan maydonlar keyin, o'z
 *    kartochkasida to'ldiriladi.
 *
 * ⚠️ Ruxsat BU YERDA tekshirilmaydi — u chaqiruvchi server amalining
 *    ishi (`app/(panel)/tez-amal.ts`).
 */

import { ulanishOl } from '@/lib/db';
import { BiznesXato } from '@/lib/xato';

export interface TezBand {
  readonly id: number;
  readonly nom: string;
}

/** Bo'sh yoki haddan uzun nom — `null`. */
export function tezNomTozala(xom: string): string | null {
  const t = xom.trim();
  if (t === '') return null;
  if (t.length > 120) return null;
  return t;
}

// ─── TZ 5.6 · Almashtirish guruhi ─────────────────────────────────────────

/**
 * ⚠️ Bir xil nomli guruh IKKI MARTA yaratilmaydi: sotuvda ikkita
 *    «To'r matolar» chiqsa sotuvchi qaysi birini tanlashni bilmaydi.
 *    Shuning uchun mavjudi QAYTARILADI, dublikat yaratilmaydi.
 */
export async function guruhTezYarat(nom: string, xodimId: number): Promise<TezBand> {
  const t = tezNomTozala(nom);
  if (t === null) throw new BiznesXato('NOM_NOTOGRI', "Nom noto'g'ri");

  const sql = ulanishOl();

  const bor = await sql<TezBand[]>`
    SELECT id, nom FROM almashtirish_guruh
    WHERE lower(nom) = lower(${t}) AND faol = true`;
  if (bor[0] !== undefined) return bor[0];

  const y = await sql<TezBand[]>`
    INSERT INTO almashtirish_guruh (nom, yaratdi_id)
    VALUES (${t}, ${xodimId})
    RETURNING id, nom`;

  const yangi = y[0];
  if (yangi === undefined) throw new BiznesXato('SAQLANMADI', 'Guruh saqlanmadi');
  return yangi;
}

// ─── TZ 9.1 · Yetkazib beruvchi ───────────────────────────────────────────

export async function yetkazibTezYarat(nom: string, xodimId: number): Promise<TezBand> {
  const t = tezNomTozala(nom);
  if (t === null) throw new BiznesXato('NOM_NOTOGRI', "Nom noto'g'ri");

  const sql = ulanishOl();

  const bor = await sql<TezBand[]>`
    SELECT id, nom FROM yetkazib_beruvchi
    WHERE lower(nom) = lower(${t}) AND faol = true`;
  if (bor[0] !== undefined) return bor[0];

  const y = await sql<TezBand[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${t}, ${xodimId})
    RETURNING id, nom`;

  const yangi = y[0];
  if (yangi === undefined) throw new BiznesXato('SAQLANMADI', 'Saqlanmadi');
  return yangi;
}

// ─── TZ 3.10 · 6.5 · Mijoz ────────────────────────────────────────────────

/**
 * ⚠️ TZ 6.5 — mijoz ISM bo'yicha takrorlanmaydi. Sotuvchi «Aziz» deb
 *    yozib yangi mijoz yaratsa, qarz kimga yozilgani chalkashib
 *    ketardi. Shuning uchun mavjudi qaytariladi.
 */
export async function mijozTezYarat(nom: string, xodimId: number): Promise<TezBand> {
  const t = tezNomTozala(nom);
  if (t === null) throw new BiznesXato('NOM_NOTOGRI', "Ism noto'g'ri");

  const sql = ulanishOl();

  const bor = await sql<TezBand[]>`
    SELECT id, ism AS nom FROM mijoz
    WHERE lower(ism) = lower(${t}) AND faol = true`;
  if (bor[0] !== undefined) return bor[0];

  const y = await sql<TezBand[]>`
    INSERT INTO mijoz (ism, yaratdi_id)
    VALUES (${t}, ${xodimId})
    RETURNING id, ism AS nom`;

  const yangi = y[0];
  if (yangi === undefined) throw new BiznesXato('SAQLANMADI', 'Saqlanmadi');
  return yangi;
}
