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
