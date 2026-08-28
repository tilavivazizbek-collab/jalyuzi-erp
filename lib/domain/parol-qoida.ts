/**
 * lib/domain/parol-qoida.ts — parol uzunligi qoidasi.
 *
 * ⚠️ NEGA ALOHIDA FAYL
 *
 * Bu qoida EKRANDA ham kerak («kamida 8 belgi» deb yozish uchun),
 * serverda ham. Lekin `lib/kirish/parol.ts` argon2 kutubxonasini
 * olib keladi — u Node uchun mo'ljallangan native modul va uni
 * brauzerga jo'natib bo'lmaydi.
 *
 * Ilgari forma to'g'ridan-to'g'ri `parol.ts` dan o'qirdi va
 * qurilish YIQILARDI. Endi sof qoida shu yerda, xeshlash esa
 * o'z joyida qoldi (§5.1 — `lib/domain/` hech narsaga bog'lanmaydi).
 *
 * ⚠️ TZ da yozilmagan — QARORLAR-KOD P-10. 8 belgi tanlandi:
 *    bundan kamida parol taxmin qilinadi, ko'pi esa xodimlarni
 *    qog'ozga yozishga majbur qiladi.
 */

export const PAROL_ENG_KAM = 8;
export const PAROL_ENG_KOP = 128;

export function parolYaroqlimi(parol: string): boolean {
  return parol.length >= PAROL_ENG_KAM && parol.length <= PAROL_ENG_KOP;
}
