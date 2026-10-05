/**
 * lib/sxema/mijoz.ts — QISM 1 §11 · TZ 6 · Q-23
 */

import { z } from 'zod';
import { royxat } from './umumiy';
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

/**
 * ⚠️ PUL SHAKLI — `Number()` emas, qolip bilan (egasi auditi 2026-10-06).
 *    `Number('1e5')` va `Number('Infinity')` «son» deb o'tib ketardi va
 *    bazada xato bilan yiqilardi.
 */
const PUL = /^\d{1,12}(\.\d{1,2})?$/;
const ISHORALI_PUL = /^-?\d{1,12}(\.\d{1,2})?$/;

/**
 * Faqat raqamlardan iborat rekvizit — bo'sh joy va chiziqcha olib
 * tashlanadi: «2020 8000 …» deb yozilgan hisob raqami ham qabul qilinadi.
 */
const raqamli = (uzunliklar: readonly number[], xabar: string) =>
  z
    .string()
    .transform((x) => x.replace(/[\s-]/g, ''))
    .transform((x) => (x === '' ? undefined : x))
    .optional()
    .refine((x) => x === undefined || (/^\d+$/.test(x) && uzunliklar.includes(x.length)), xabar);

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
    /**
     * ⚠️ ISHORALI: manfiy — chegirma, musbat — ustama (`offsetQolla`).
     *    Ekranda yo'nalish alohida tanlanadi, ishorani forma qo'yadi.
     */
    offsetQiymat: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine((x) => x === undefined || ISHORALI_PUL.test(x), 'Qiymat son bo‘lishi kerak'),

    // TZ 6.4 — limit DOIM so'mda
    qarzLimiti: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x.replace(/\s/g, '')))
      .optional()
      .refine((x) => x === undefined || PUL.test(x), "Limit musbat son bo'lishi kerak"),

    // ── Q-23 soliq maydonlari ──
    /**
     * ⚠️ BO'SH SATR ham `JISMONIY` ga aylanadi.
     *
     *    `.default()` faqat `undefined` da ishlaydi. Forma esa bu
     *    maydonni UMUMAN yubormaydi (u ekranda yo'q), server esa
     *    har maydonni `matnMaydon` bilan o'qiydi va yo'q maydondan
     *    BO'SH SATR qaytadi.
     *
     *    Natijada `''` enum ga tushmay, tekshiruv yiqilardi — va
     *    xato KO'RINMAYDIGAN maydonga tegishli bo'lgani uchun
     *    ekranda «qizil maydonlarni tekshiring» deb turardi,
     *    qizil maydon esa yo'q edi. Ya'ni mijoz qo'shib
     *    bo'lmasdi (2026-09-10, egasi topdi).
     */
    shaxsTuri: royxat(SHAXS_TURLARI, 'JISMONIY'),

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
    /** INN — 9 raqam (yuridik) yoki 14 raqam (JShShIR) */
    inn: raqamli([9, 14], 'INN 9 yoki 14 ta raqam bo‘ladi'),
    yuridikManzil: bosMatn,
    bankNomi: bosMatn,
    hisobRaqam: raqamli([20], 'Hisob raqami 20 ta raqam bo‘ladi'),
    mfo: raqamli([5], 'MFO 5 ta raqam bo‘ladi'),
    shartnomaRaqam: bosMatn,
    /** 2026-10-06 — ustun bazada bor edi, formada yo'q edi */
    shartnomaSana: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) =>
          x === undefined ||
          (/^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(new Date(`${x}T00:00:00Z`).getTime())),
        'Sana noto‘g‘ri',
      ),
    ndsStavka: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) => x === undefined || (/^\d{1,3}(\.\d{1,2})?$/.test(x) && Number(x) <= 100),
        'NDS stavkasi 0 dan 100 gacha',
      ),

    // ── Savdo — 0061, egasi auditi 2026-10-06 ──
    /** Bo'sh — muddat nazorati yo'q (CLAUDE.md §14a) */
    tolovMuddatiKun: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : Number(x)))
      .optional()
      .refine(
        (x) => x === undefined || (Number.isInteger(x) && x >= 1 && x <= 365),
        'Muddat 1 dan 365 kungacha',
      ),
    masulXodimId: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : Number(x)))
      .optional()
      .refine((x) => x === undefined || (Number.isSafeInteger(x) && x > 0), 'Xodim noto‘g‘ri'),
    manba: z
      .string()
      .trim()
      .max(100)
      .transform((x) => (x === '' ? undefined : x))
      .optional(),
  })
  .refine((m) => (m.offsetTuri === undefined) === (m.offsetQiymat === undefined), {
    // 6.3 — turi bor, qiymati yo'q bo'lsa offset ma'nosiz qoladi
    message: "Offset turi va qiymati birga to'ldiriladi",
    path: ['offsetQiymat'],
  })
  /**
   * ⚠️ FOIZ CHEGARASI — egasi auditi 2026-10-06 (2-xato). Ilgari 150% va
   *    −150% ham saqlanardi; −150% chegirma 100 000 so'mlik narxni
   *    −50 000 ga aylantirardi.
   */
  .refine(
    (m) =>
      m.offsetTuri !== 'FOIZ' ||
      m.offsetQiymat === undefined ||
      (Number(m.offsetQiymat) >= -100 && Number(m.offsetQiymat) <= 100),
    { message: 'Foiz 0 dan 100 gacha bo‘ladi', path: ['offsetQiymat'] },
  )
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
