/**
 * lib/sxema/kochirish.ts — QISM 1 §11 · TZ 20.7 · 22
 *
 * Filiallararo formalarning tekshiruvi.
 *
 * ⚠️ Brauzerdan kelgan qiymatga ishonilmaydi: summa shakli, filial
 *    raqami va sabab shu yerda tekshiriladi.
 */

import { z } from 'zod';

/** Pul summasi — `NUMERIC(14,2)` ga tushadigan shakl. */
const pulMatni = z
  .string()
  .trim()
  .regex(/^\d{1,12}(\.\d{1,2})?$/, "Summa noto'g'ri");

const musbatId = z.coerce.number().int().positive();

export const kochirishSoraSxema = z.object({
  kimgaFilialId: musbatId,
  izoh: z.string().trim().max(500).optional(),
});

export const kochirishJonatSxema = z
  .object({
    kochirishId: musbatId,
    bolakIdlar: z.array(musbatId).min(1, "Kamida bitta bo'lak tanlang"),
    /** 22.4.1 — bo'sh bo'lsa tannarx bo'yicha avtomatik */
    qarzSumma: pulMatni.optional(),
    qarzSabab: z.string().trim().max(500).optional(),
  })
  // EC-FQ-06 — qo'lda summa qo'yilsa sabab MAJBURIY
  .refine(
    (v) => v.qarzSumma === undefined || (v.qarzSabab ?? '') !== '',
    { message: "Summa o'zgartirilsa sabab yozilishi shart", path: ['qarzSabab'] },
  );

/** EC-FQ-03 — qabulda o'lchash. */
export const olchovTuzatishSxema = z.object({
  bolakId: musbatId,
  eniM: pulMatni.nullable(),
  boyiM: pulMatni.nullable(),
  miqdor: pulMatni.nullable(),
  izoh: z.string().trim().min(1, 'Izoh majburiy').max(500),
});

export const kochirishQabulSxema = z.object({
  kochirishId: musbatId,
  tuzatishlar: z.array(olchovTuzatishSxema).default([]),
});

export const kochirishBekorSxema = z.object({
  kochirishId: musbatId,
  sabab: z.string().trim().min(1, 'Sabab majburiy').max(500),
});

// ─── TZ 22.6.3 · 22.3.3 ───────────────────────────────────────────────────

export const filialTolovSxema = z.object({
  kimdanKassaId: musbatId,
  kimgaKassaId: musbatId,
  summa: pulMatni,
  izoh: z.string().trim().min(1, 'Izoh majburiy').max(500),
});

export const qoldaTuzatishSxema = z.object({
  kimdanFilialId: musbatId,
  kimgaFilialId: musbatId,
  summa: pulMatni,
  sabab: z.string().trim().min(1, 'Sabab majburiy').max(500),
});
