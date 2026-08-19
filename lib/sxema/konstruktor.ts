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
});

export type SlotKirimi = z.infer<typeof slotSxema>;
export type ParametrKirimi = z.infer<typeof parametrSxema>;
export type AksessuarKirimi = z.infer<typeof aksessuarSxema>;
export type MahsulotTurKirimi = z.infer<typeof mahsulotTurSxema>;
