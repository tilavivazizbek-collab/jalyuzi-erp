/**
 * lib/domain/sana.ts — «BUGUN» TOSHKENT BO'YICHA · QISM 1 §19
 *
 * ⚠️ NEGA KERAK (egasi ruxsati bilan, 2026-10-06)
 *
 *    `new Date().toISOString().slice(0, 10)` 21 joyda «bugun» deb
 *    ishlatilardi. `toISOString()` jarayonning vaqt mintaqasiga
 *    QARAMAYDI — doim UTC beradi. Toshkentda 00:00–05:00 orasida u
 *    KECHAGI sana: tunda qilingan to'lov, xarajat, kirim kechagi kunga
 *    yozilar, kun yopish ekrani kechagi kunni ochardi.
 *
 * ⚠️ BITTA JOY. Sana kerak bo'lgan har joy shu funksiyani chaqiradi —
 *    yangi joyda yana `toISOString()` yozilsa xato qaytadi.
 *
 * ⚠️ BAZAGA TEGMAYDI. Brauzerda ham ishlaydi (forma standart qiymati).
 */

export const VAQT_ZONASI = 'Asia/Tashkent';

const KUN = new Intl.DateTimeFormat('en-CA', {
  timeZone: VAQT_ZONASI,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Toshkent kuni — `YYYY-MM-DD`. Argumentsiz — bugun */
export function toshkentKuni(d: Date = new Date()): string {
  return KUN.format(d);
}
