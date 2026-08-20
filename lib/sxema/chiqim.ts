/**
 * lib/sxema/chiqim.ts — QISM 1 §11 · TZ 7.10 · 7.12 · 14.9
 *
 * Hisobdan chiqarish va storno formalarining tekshiruvi.
 *
 * ⚠️ Sabablar ro'yxati SHU YERDA turadi — `lib/amal/hisobdan.ts` uni shu
 *    yerdan oladi. Forma `lib/amal/` ga tegsa `postgres` brauzer to'plamiga
 *    tushib qolardi; ro'yxatni ikki joyda yozish esa §2.2 ga zid.
 */

import { z } from 'zod';
import { INVENTARIZATSIYA_SABABLARI } from '@/lib/domain/inventarizatsiya';

/** TZ 7.10 — sabablar (14.9 spravochnigi). */
export const CHIQARISH_SABABLARI = [
  'SUV_KETDI',
  'RANG_OCHDI',
  'YIRTILDI',
  'MUDDATI_OTDI',
  'YOQOLDI',
  'YETKAZIB_BERUVCHI_DEFEKTI',
  'BOSHQA',
] as const;

export type ChiqarishSababi = (typeof CHIQARISH_SABABLARI)[number];

export const SABAB_NOMI: Record<ChiqarishSababi, string> = {
  SUV_KETDI: 'Suv ketdi',
  RANG_OCHDI: "Rangi o'chdi",
  YIRTILDI: 'Yirtildi',
  MUDDATI_OTDI: "Muddati o'tdi",
  YOQOLDI: "Yo'qoldi",
  YETKAZIB_BERUVCHI_DEFEKTI: 'Yetkazib beruvchi defekti — keyin topildi',
  BOSHQA: 'Boshqa',
};

const butunSon = (xabar: string) =>
  z
    .string()
    .trim()
    .refine((x) => /^\d+$/.test(x) && Number.isSafeInteger(Number(x)) && Number(x) > 0, xabar)
    .transform((x) => Number(x));

export const chiqimSxema = z
  .object({
    bolakId: butunSon("Bo'lak tanlanmagan"),
    sabab: z.enum(CHIQARISH_SABABLARI, { message: 'Sababni tanlang' }),
    izoh: z
      .string()
      .trim()
      .max(500, "Izoh 500 belgidan uzun bo'lmasin")
      .transform((x) => (x === '' ? undefined : x))
      .optional(),
    davoQilinadimi: z.boolean(),
  })
  // TZ 7.10 — «Boshqa» tanlansa sabab so'z bilan yozilishi shart, aks holda
  // hisobotda «Boshqa: 12 ta» degan foydasiz qator qoladi.
  .refine((d) => d.sabab !== 'BOSHQA' || d.izoh !== undefined, {
    path: ['izoh'],
    message: "«Boshqa» tanlandi — sababni yozing",
  });

export type ChiqimFormasi = z.infer<typeof chiqimSxema>;

/** TZ 7.10 — bekor qilishda sabab MAJBURIY (teskari yozuvga yoziladi). */
export const chiqimBekorSxema = z.object({
  harakatId: butunSon('Yozuv tanlanmagan'),
  izoh: z.string().trim().min(1, 'Bekor qilish sababini yozing').max(500),
});

/** TZ 7.12 — storno sababi majburiy. */
export const stornoSxema = z.object({
  kirimId: butunSon('Hujjat tanlanmagan'),
  sabab: z.string().trim().min(1, 'Storno sababini yozing').max(500),
});

// ─── TZ 15.1 · Inventarizatsiya ───────────────────────────────────────────

const olcham = z
  .string()
  .trim()
  .transform((x) => (x === '' ? null : x))
  .refine((x) => x === null || /^-?\d+(\.\d{1,2})?$/.test(x), "O'lcham noto'g'ri")
  .transform((x) => (x === null ? null : Number(x)));

export const varaqaOchSxema = z.object({
  sana: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sanani tanlang'),
  /** Bo'sh — butun ombor (15.1: to'liq yoki qisman) */
  materialIdlar: z.array(z.number().int().positive()).default([]),
  izoh: z
    .string()
    .trim()
    .max(500)
    .transform((x) => (x === '' ? null : x))
    .nullable()
    .default(null),
});

export const sanashQatoriSxema = z.object({
  qatorId: z.number().int().positive(),
  eniM: olcham,
  boyiM: olcham,
  miqdor: olcham,
  sabab: z.enum(INVENTARIZATSIYA_SABABLARI).nullable().default(null),
  izoh: z
    .string()
    .trim()
    .max(500)
    .transform((x) => (x === '' ? null : x))
    .nullable()
    .default(null),
});

export const varaqaYakunlaSxema = z.object({
  varaqaId: butunSon('Varaqa tanlanmagan'),
  qatorlar: z.array(sanashQatoriSxema),
});

// ─── TZ 7.10 · Boshlang'ich qoldiq ────────────────────────────────────────

/**
 * ⚠️ «Yetkazib beruvchi qarziga TEGMASIN» (QABUL S2.6) — bu tizimga
 *    o'tish amali, xarid emas. Shuning uchun sxemada yetkazib beruvchi
 *    maydoni UMUMAN yo'q.
 */
export const boshlangichSxema = z
  .object({
    materialId: butunSon('Material tanlanmagan'),
    /** RULON uchun — har bo'lak alohida qator */
    bolaklar: z
      .array(
        z.object({
          eniM: z.number().positive("Eni noldan katta bo'lsin"),
          boyiM: z.number().positive("Bo'yi noldan katta bo'lsin"),
        }),
      )
      .default([]),
    /** DONA va CHIZIQLI uchun */
    miqdor: z.number().nonnegative().nullable().default(null),
    /** P-20 — SARFLASH birligi uchun tannarx */
    tannarxBirlik: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,4})?$/, "Tannarx noto'g'ri"),
    izoh: z
      .string()
      .trim()
      .max(500)
      .transform((x) => (x === '' ? null : x))
      .nullable()
      .default(null),
  })
  .refine((d) => d.bolaklar.length > 0 || d.miqdor !== null, {
    path: ['miqdor'],
    message: "O'lcham yoki miqdor kiriting",
  });
