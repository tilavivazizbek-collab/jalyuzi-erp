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
import { birlikTavsifi } from '@/lib/domain/birlik-tanlovi';

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

// ─── TZ 5.2 · 5.3 · Material ──────────────────────────────────────────────

/**
 * ⚠️ Material NOM va O'LCHOV BIRLIGI bilan yaratiladi — faqat nom
 *    yetarli emas. Birliksiz material ombordan noto'g'ri yechiladi:
 *    mato «dona» deb sanalsa qoldiq butunlay xato chiqadi. Keyin
 *    tuzatib ham bo'lmaydi — qoldiq bor material birligi
 *    o'zgartirilmaydi (5.3).
 *
 * ⚠️ Narx, chegara va guruh keyin kartochkasida to'ldiriladi. Ular
 *    bo'sh bo'lsa ham material ombor hisobida to'g'ri yuradi.
 */
export async function materialTezYarat(
  nom: string,
  olchovBirligi: string,
  xodimId: number,
): Promise<TezBand> {
  const t = tezNomTozala(nom);
  if (t === null) throw new BiznesXato('NOM_NOTOGRI', "Nom noto'g'ri");

  const b = birlikTavsifi(olchovBirligi);

  /**
   * ⚠️ Shtanga, quti va metr — «1 shtanga necha metr» degan javobni
   *    talab qiladi. Uni bu yerda so'ramaymiz (ish oqimini
   *    to'xtatmaslik uchun), lekin taxminiy qiymat qo'yish ham
   *    mumkin emas: noto'g'ri koeffitsient ombordan noto'g'ri
   *    miqdorda material yechilishiga olib keladi va buni hech kim
   *    sezmaydi.
   *
   *    Shuning uchun bunday material to'liq kartochkada ochiladi.
   */
  if (b.ozgarishKerak) {
    throw new BiznesXato(
      'BIRLIK_NOTOGRI',
      `«${b.nom}» uchun 1 ${b.kirimBirligi} necha metr ekani kerak — material sahifasida oching`,
    );
  }

  const sql = ulanishOl();

  const bor = await sql<TezBand[]>`
    SELECT id, nom FROM material
    WHERE lower(nom) = lower(${t}) AND faol = true`;
  if (bor[0] !== undefined) return bor[0];

  const y = await sql<TezBand[]>`
    INSERT INTO material (
      nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id
    ) VALUES (
      ${t}, ${b.hisobTuri}, ${b.kirimBirligi}, ${b.sarflashBirligi},
      '1', ${xodimId}
    ) RETURNING id, nom`;

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
