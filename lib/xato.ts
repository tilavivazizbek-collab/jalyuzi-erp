/**
 * lib/xato.ts — QISM 1 §12
 *
 * Ikki turdagi xato bor:
 *   BiznesXato  — foydalanuvchiga ko'rsatiladi, har biri kodga va TZ bandiga bog'langan
 *   boshqa xato — texnik (baza, tarmoq), foydalanuvchiga umumiy xabar beriladi
 *
 * Yangi kod qo'shilganda XATO_BAND ga TZ band raqami yoziladi va
 * lib/matn/uz.ts ga o'zbekcha matni qo'shiladi. Matn kodga yozilmaydi (§19).
 */

import { XATO_MATNI } from '@/lib/matn/uz';

/** Har biznes xatosi — kod va uni keltirib chiqargan TZ bandi (§12.2). */
export const XATO_BAND = {
  // ── TZ §12.2 da sanalganlar ────────────────────────────────────────────
  MATERIAL_YOQ: 'TZ 7.6, 8.12',
  LIMIT_OSHDI: 'TZ 6.4',
  CHEGIRMA_LIMITI: 'TZ 3.11',
  STAVKA_YOQ: 'TZ 10.12',
  KUN_YOPILGAN: 'TZ 12.17',
  BOLAK_BAND: 'TZ 7.3',

  // ── Poydevor bosqichida qo'shilganlar ──────────────────────────────────
  PUL_NOTOGRI: 'QISM 1 §3.1',
  KURS_NOTOGRI: 'QISM 1 §3.2',
  YAXLITLASH_NOTOGRI: 'QISM 1 §3.3',
  NOLGA_BOLINDI: 'QISM 1 §3',
  OLCHOV_NOTOGRI: 'QISM 1 §4.1',
  FORMULA_XATO: 'TZ 4.5',
  FORMULA_NOMALUM_OZGARUVCHI: 'TZ 4.5',
  MUHIT_NOTOGRI: 'QISM 1 §18',

  // ── Kirish — QISM 1 §8 ─────────────────────────────────────────────────
  PAROL_QISQA: 'QISM 1 §8',
  KIRISH_NOTOGRI: 'QISM 1 §8',
  HISOB_BLOKLANGAN: 'QISM 1 §8',
  USTA_SAYTGA_KIRMAYDI: 'Q-04',
  SESSIYA_TUGAGAN: 'QISM 1 §8',
  RUXSAT_YOQ: 'TZ 14.6',

  // ── Filial — TZ 20.2, 20.4 ─────────────────────────────────────────────
  FILIAL_TIKMAYDI: 'TZ 20.4.1',
  FILIAL_NOFAOL: 'TZ 20.2',

  // ── Narx va material — TZ 5, 6.3, 20.9 ─────────────────────────────────
  NARX_NOTOGRI: 'TZ 5.4',
  KOEFFITSIENT_NOTOGRI: 'TZ 5.3',
  BIRLIK_OZGARMAYDI: 'TZ 5.3',
  KONSTRUKTOR_XATO: 'TZ 4.5',
  TELEFON_NOTOGRI: 'QISM 1 §8',
  MATERIAL_TOPILMADI: 'TZ 5.1',
  MIJOZ_DUBLIKAT: 'TZ 6.5',
  MAHSULOT_TOPILMADI: 'TZ 4.1',
  YETKAZIB_TOPILMADI: 'TZ 9.1',
  TANNARX_NOTOGRI: 'TZ 7.9',
  YETKAZIB_SAQLANMADI: 'TZ 9.1',
  MAHSULOT_SAQLANMADI: 'TZ 4.1',
  MIJOZ_TOPILMADI: 'TZ 6.1',
  MIJOZ_SAQLANMADI: 'TZ 6.2',
  MATERIAL_SAQLANMADI: 'TZ 5.1',
} as const;

export type XatoKod = keyof typeof XATO_BAND;

/**
 * Foydalanuvchiga ko'rsatiladigan xato.
 * `kod` interfeys va bot uchun, `band` — nosozlikni TZ ga qaytarib topish uchun.
 */
export class BiznesXato extends Error {
  readonly kod: XatoKod;
  readonly band: string;
  readonly tafsilot: string | undefined;

  constructor(kod: XatoKod, tafsilot?: string) {
    super(tafsilot ? `${XATO_MATNI[kod]} — ${tafsilot}` : XATO_MATNI[kod]);
    this.name = 'BiznesXato';
    this.kod = kod;
    this.band = XATO_BAND[kod];
    this.tafsilot = tafsilot;
  }
}

export function biznesXatosimi(x: unknown): x is BiznesXato {
  return x instanceof BiznesXato;
}
