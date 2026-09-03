/**
 * lib/sxema/mijoz.ts — QISM 1 §11 · TZ 6 · Q-23
 */

import { z } from 'zod';
import { telefonYaroqlimi } from '@/lib/domain/telefon';

export const SHAXS_TURLARI = ['JISMONIY', 'YURIDIK'] as const;
export const OFFSET_TURLARI = ['FOIZ', 'SOM', 'USD'] as const;

export type ShaxsTuri = (typeof SHAXS_TURLARI)[number];
export type OffsetTuri = (typeof OFFSET_TURLARI)[number];

export const SHAXS_TURI_NOMI: Record<ShaxsTuri, string> = {
  JISMONIY: 'Jismoniy shaxs',
  YURIDIK: 'Yuridik shaxs (B2B)',
};

export const OFFSET_TURI_NOMI: Record<OffsetTuri, string> = {
  FOIZ: 'Foiz (%)',
  SOM: "So'm",
  USD: 'Dollar',
};

const bosMatn = z
  .string()
  .trim()
  .transform((x) => (x === '' ? undefined : x))
  .optional();

export const mijozSxema = z
  .object({
    ism: z.string().trim().min(1, 'Ismni kiriting').max(200),

    telefon: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine((x) => x === undefined || telefonYaroqlimi(x), "Telefon raqami noto'g'ri"),

    manzil: bosMatn,
    eslatma: bosMatn,

    /**
     * TZ 6.3 — chegirma guruhi (ulgurji, doimiy, VIP).
     *
     * ⚠️ Bo'sh — guruhsiz mijoz, oddiy narx.
     */
    mijozGuruhId: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : Number(x)))
      .optional()
      .refine((x) => x === undefined || (Number.isInteger(x) && x > 0), 'Guruh noto‘g‘ri'),

    // TZ 6.3 — offset turi va qiymati birga to'ladi yoki birga bo'sh qoladi
    offsetTuri: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) => x === undefined || (OFFSET_TURLARI as readonly string[]).includes(x),
        "Offset turi noto'g'ri",
      ),
    offsetQiymat: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine((x) => x === undefined || !Number.isNaN(Number(x)), 'Offset qiymati son emas'),

    // TZ 6.4 — limit DOIM so'mda
    qarzLimiti: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) => x === undefined || (!Number.isNaN(Number(x)) && Number(x) >= 0),
        "Limit musbat son bo'lishi kerak",
      ),

    // ── Q-23 soliq maydonlari ──
    shaxsTuri: z.enum(SHAXS_TURLARI).default('JISMONIY'),

    /**
     * TZ 6.2 — mijoz turi (narx darajasi).
     *
     * ⚠️ `shaxsTuri` bu yerda QOLDIRILDI: u turdan hisoblanadi
     *    (`soliq_kerak` bo'lsa YURIDIK) va bazadagi
     *    `mijoz_yuridik_toliq` cheklovi unga tayanadi.
     */
    mijozTuriId: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : Number(x)))
      .optional()
      .refine((x) => x === undefined || (Number.isSafeInteger(x) && x > 0), {
        message: 'Mijoz turini tanlang',
      }),
    tashkilotNomi: bosMatn,
    inn: bosMatn,
    yuridikManzil: bosMatn,
    bankNomi: bosMatn,
    hisobRaqam: bosMatn,
    mfo: bosMatn,
    shartnomaRaqam: bosMatn,
    ndsStavka: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) => x === undefined || (!Number.isNaN(Number(x)) && Number(x) >= 0),
        "NDS stavkasi musbat son bo'lishi kerak",
      ),
  })
  .refine((m) => (m.offsetTuri === undefined) === (m.offsetQiymat === undefined), {
    // 6.3 — turi bor, qiymati yo'q bo'lsa offset ma'nosiz qoladi
    message: "Offset turi va qiymati birga to'ldiriladi",
    path: ['offsetQiymat'],
  })
  .refine(
    (m) =>
      m.shaxsTuri !== 'YURIDIK' ||
      (m.tashkilotNomi !== undefined && m.inn !== undefined && m.yuridikManzil !== undefined),
    {
      // QISM 3 §2.8 — yuridik shaxsda uchtasi majburiy
      message: 'Yuridik shaxsda tashkilot nomi, INN va yuridik manzil majburiy',
      path: ['tashkilotNomi'],
    },
  );

export type MijozKirimi = z.infer<typeof mijozSxema>;
