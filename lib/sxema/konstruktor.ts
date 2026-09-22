/**
 * lib/sxema/konstruktor.ts — QISM 1 §11 · TZ 4
 *
 * Mahsulot turi bir nechta jadvalga yoziladi (tur + slot + parametr +
 * aksessuar), lekin FOYDALANUVCHI uchun bu bitta forma. Shuning uchun
 * sxema ham butun formani birdan tekshiradi.
 */

import { z } from 'zod';

/** Formula tahlilchisi faqat shu shakldagi nomni taniydi (lib/domain/formula.ts). */
const PARAMETR_KODI = /^[A-Z][A-Z0-9_']*$/;

export const slotSxema = z.object({
  id: z.number().int().nonnegative().optional(),
  nom: z.string().trim().min(1, 'Slot nomini kiriting').max(100),
  formula: z.string().trim().min(1, 'Formulani kiriting').max(500),
  majburiy: z.boolean().default(true),
  almashtirishGuruhId: z.number().int().positive().nullable(),
  /**
   * AUDIT 1-topilma tuzatish — sarf koeffitsienti («nechta marta»).
   */
  koeffitsient: z.coerce
    .number()
    .positive('Koeffitsient musbat son bo\'lishi kerak')
    .default(1),
  /**
   * AUDIT 1-topilma tuzatish — kesish yo'nalishi.
   */
  kesishTuri: z.enum(['ENIGA', "BO'YIGA"]).default('ENIGA'),
  /**
   * QAT'IY KESIM ENI, metrda — egasi holati 2026-09-20 («dikkey»).
   *
   * ⚠️ Bo'sh qator `null` ga aylanadi, `0` ga EMAS: nol «eni nol»
   *    degani bo'lardi va kesim hisobini nolga bo'lishga olib
   *    borardi. Bu yerda bo'sh — «qat'iy eni YO'Q».
   */
  kesimEniM: z
    .union([z.literal(''), z.coerce.number().positive("Kesim eni musbat bo'lsin")])
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .default(null),
  /**
   * MIJOZ NARXINI SHU SLOT BELGILAYDI — egasi qarori 2026-09-22 (0048).
   *
   * ⚠️ IXTIYORIY — `default(false)` emas. Ikkalasi bir xil ko'rinadi,
   *    lekin farqi bor: `default` chiqish turini MAJBURIY qiladi va
   *    o'shanda bu maydonni bilmaydigan har bir eski chaqiruvchi
   *    (tuzatish skriptlari, integratsiya testlari) buziladi.
   *
   *    Ixtiyoriy bo'lsa ma'no ham to'g'ri chiqadi: belgi YO'Q =
   *    eski xulq (birinchi darajali mato). Bazaga yozishda
   *    `?? false` qo'llanadi.
   */
  narxBelgilaydi: z.boolean().optional(),
});

export const parametrSxema = z.object({
  id: z.number().int().nonnegative().optional(),
  kod: z
    .string()
    .trim()
    .min(1, 'Kodni kiriting')
    .max(30)
    .refine(
      (x) => PARAMETR_KODI.test(x),
      "Kod KATTA HARFDA bo'lishi kerak, masalan CHET — formula uni shunday taniydi",
    ),
  nom: z.string().trim().min(1, 'Nomini kiriting').max(100),
  standartQiymat: z
    .string()
    .trim()
    .min(1, 'Qiymatni kiriting')
    .refine((x) => !Number.isNaN(Number(x)), 'Qiymat son emas'),
});

export const aksessuarSxema = z.object({
  id: z.number().int().nonnegative().optional(),
  materialId: z.number().int().positive('Materialni tanlang'),
  /** QISM 3 §2.7 — statik son ham formula: `'4'` yaroqli */
  formula: z.string().trim().min(1, "Soni yoki formulani kiriting").max(500),
  majburiy: z.boolean().default(true),
});

/**
 * O'lcham chegarasi katagi — bo'sh bo'lsa `null` (chegara yo'q).
 *
 * ⚠️ Bitta joyda yozilgan: to'rtta katak bir xil qoidaga bo'ysunadi
 *    va biri unutilsa chegara jimgina ishlamay qolardi.
 */
const chegaraSoni = (xabar: string) =>
  z
    .union([z.literal(''), z.coerce.number().positive(xabar)])
    .transform((v) => (v === '' ? null : v))
    .nullable()
    /**
     * ⚠️ IXTIYORIY, `default(null)` emas. Ikkalasi bir xil
     *    ko'rinadi, lekin `default` chiqish turini MAJBURIY qiladi
     *    va o'shanda bu maydonni bilmaydigan har bir eski
     *    chaqiruvchi (tuzatish skriptlari, integratsiya testlari)
     *    buziladi. Ma'no ham to'g'ri chiqadi: maydon yo'q =
     *    chegara yo'q.
     */
    .optional();

export const mahsulotTurSxema = z.object({
  nom: z.string().trim().min(1, 'Nomini kiriting').max(200),
  xizmatHaqi: z
    .string()
    .trim()
    .transform((x) => (x === '' ? undefined : x))
    .optional()
    .refine(
      (x) => x === undefined || (!Number.isNaN(Number(x)) && Number(x) >= 0),
      "Xizmat haqi musbat son bo'lishi kerak",
    ),
  /**
   * JISMONIY O'LCHAM CHEGARASI — egasi qarori 2026-09-22 (0051).
   *
   * ⚠️ Bo'sh satr `null` ga aylanadi = «chegara yo'q». Egasi
   *    turlarni bittalab to'ldiradi, to'ldirilmagani avvalgidek
   *    ishlayveradi.
   *
   * ⚠️ Musbat bo'lishi shart: «eng katta eni 0» degan tur hech
   *    qachon sotilmasdi va sababi ko'rinmasdi.
   */
  minEniM: chegaraSoni("Eng kichik eni noto'g'ri"),
  maksEniM: chegaraSoni("Eng katta eni noto'g'ri"),
  minBoyiM: chegaraSoni("Eng kichik bo'yi noto'g'ri"),
  maksBoyiM: chegaraSoni("Eng katta bo'yi noto'g'ri"),
  tartib: z
    .string()
    .trim()
    .transform((x) => (x === '' ? '0' : x))
    .refine((x) => Number.isInteger(Number(x)), 'Tartib butun son'),
  oynadaKorinadi: z.boolean().default(true),
  botdaKorinadi: z.boolean().default(true),

  slotlar: z.array(slotSxema).min(1, "Kamida bitta mato sloti bo'lishi kerak"),
  parametrlar: z.array(parametrSxema),
  aksessuarlar: z.array(aksessuarSxema),
})
  /**
   * ⚠️ TESKARI CHEGARA SAQLASHDAN OLDIN USHLANADI — 0051.
   *
   *    «Eng kichik 2.50, eng katta 2.00» bo'lsa HECH BIR o'lcham
   *    o'tmaydi va tur butunlay sotilmay qoladi. Bazada ham CHECK
   *    bor, lekin u xom xato beradi; bu yerda sotuvchiga tushunarli
   *    jumla chiqadi.
   */
  .refine(
    (t) =>
      t.minEniM === null ||
      t.minEniM === undefined ||
      t.maksEniM === null ||
      t.maksEniM === undefined ||
      t.minEniM <= t.maksEniM,
    {
      path: ['maksEniM'],
      message: "Eng katta eni eng kichigidan kichik — hech qanday o'lcham o'tmaydi",
    },
  )
  .refine(
    (t) =>
      t.minBoyiM === null ||
      t.minBoyiM === undefined ||
      t.maksBoyiM === null ||
      t.maksBoyiM === undefined ||
      t.minBoyiM <= t.maksBoyiM,
    {
      path: ['maksBoyiM'],
      message: "Eng katta bo'yi eng kichigidan kichik — hech qanday o'lcham o'tmaydi",
    },
  );

export type SlotKirimi = z.infer<typeof slotSxema>;
export type ParametrKirimi = z.infer<typeof parametrSxema>;
export type AksessuarKirimi = z.infer<typeof aksessuarSxema>;
export type MahsulotTurKirimi = z.infer<typeof mahsulotTurSxema>;
