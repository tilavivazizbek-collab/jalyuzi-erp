/**
 * lib/sxema/stavka.ts — TZ 10.8 · 10.9 · QISM 1 §9.4
 *
 * Usta stavkasi formasi.
 *
 * ⚠️ Bu yerda faqat SHAKL tekshiriladi: raqammi, tanlanganmi,
 *    to'ldirilganmi. Jadvalning MANTIQI (cheksiz bosqich bormi,
 *    chegara takrorlanmaganmi) — `lib/domain/stavka.ts` dagi
 *    `bosqichlarniTekshir()` da, chunki u biznes qoidasi (§2.2).
 */

import { z } from 'zod';
import { royxat } from './umumiy';
import { STAVKA_BIRLIKLARI } from '@/lib/domain/stavka';

/** Bo'sh tanlov = «hammaga» (10.9), ID emas — NULL */
const bosId = z
  .string()
  .trim()
  .transform((x) => (x === '' ? null : Number(x)))
  .refine(
    (x) => x === null || (Number.isSafeInteger(x) && x > 0),
    "Noto'g'ri tanlov",
  );

const pulQiymat = z
  .string()
  .trim()
  .refine((x) => x !== '', 'Summani kiriting')
  .refine((x) => Number.isFinite(Number(x)) && Number(x) >= 0, "Summa noto'g'ri");

/**
 * Bitta bosqich qatori — brauzerdan JSON bo'lib keladi.
 *
 * ⚠️ Chegara BO'SH bo'lishi mumkin va bu MA'NOLI: «bundan
 *    kattasining hammasi». Har jadvalda aynan bitta shunday qator
 *    bo'ladi — buni domen tekshiradi.
 */
const bosqichSxema = z.object({
  chegaraKvM: z
    .union([z.string(), z.number(), z.null()])
    .transform((x) => {
      if (x === null) return null;
      const matn = String(x).trim();
      return matn === '' ? null : Number(matn);
    })
    .refine(
      (x) => x === null || (Number.isFinite(x) && x > 0),
      "Chegara musbat son bo'lishi kerak",
    ),
  qiymat: z
    .union([z.string(), z.number()])
    .transform((x) => String(x).trim())
    .refine((x) => x !== '', 'Bosqich summasini kiriting')
    .refine(
      (x) => Number.isFinite(Number(x)) && Number(x) >= 0,
      "Bosqich summasi noto'g'ri",
    ),
});

export const stavkaSxema = z
  .object({
    mahsulotTurId: z
      .string()
      .trim()
      .refine((x) => x !== '', 'Mahsulot turini tanlang')
      .transform((x) => Number(x))
      .refine((x) => Number.isSafeInteger(x) && x > 0, 'Mahsulot turini tanlang'),

    /** Bo'sh = barcha filialga (10.9) */
    filialId: bosId,
    /** Bo'sh = barcha ustaga (10.9) */
    xodimId: bosId,

    birlik: royxat(STAVKA_BIRLIKLARI, 'DONA'),

    /**
     * DONA va KV_M uchun. BOSQICH da bu maydon ekranda yashiriladi
     * va bo'sh keladi — shuning uchun majburiy EMAS, tekshiruv
     * quyida `superRefine` da.
     */
    qiymat: z.string().trim().default(''),

    /** BOSQICH uchun — brauzer JSON matn qilib yuboradi */
    bosqichlar: z
      .string()
      .trim()
      .transform((x): unknown => {
        if (x === '') return [];
        try {
          return JSON.parse(x);
        } catch {
          return null;
        }
      })
      .pipe(z.array(bosqichSxema).nullable())
      .transform((x) => x ?? []),

    /**
     * 2.3-invariant — stavka QAYSI KUNDAN kuchga kiradi.
     * Bo'sh qolsa bugundan.
     */
    amalQiladiDan: z
      .string()
      .trim()
      .transform((x) => (x === '' ? new Date().toISOString().slice(0, 10) : x))
      .refine((x) => /^\d{4}-\d{2}-\d{2}$/.test(x), "Sana noto'g'ri"),
  })
  .superRefine((v, ctx) => {
    if (v.birlik === 'BOSQICH') {
      if (v.bosqichlar.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['bosqichlar'],
          message: "Bosqichli jadvalda kamida ikkita qator bo'lishi kerak",
        });
      }
      return;
    }

    const r = pulQiymat.safeParse(v.qiymat);
    if (!r.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['qiymat'],
        message: r.error.issues[0]?.message ?? 'Summani kiriting',
      });
    }
  });

export type StavkaFormaKirimi = z.infer<typeof stavkaSxema>;

export const STAVKA_MAYDONLARI = [
  'mahsulotTurId',
  'filialId',
  'xodimId',
  'birlik',
  'qiymat',
  'bosqichlar',
  'amalQiladiDan',
] as const;
