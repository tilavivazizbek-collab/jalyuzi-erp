/**
 * lib/sxema/sotuv.ts — QISM 1 §11 · TZ 3
 *
 * Sotuv ekrani formasining tekshiruvi.
 *
 * ⚠️ Pul MATN sifatida keladi va matn bo'lib qoladi (§3.1). `number` ga
 *    o'girilsa 678 400.00 ni JS suzuvchi nuqtasi buzishi mumkin.
 */

import { z } from 'zod';

const pulMatni = (xabar: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, xabar);

const olcham = (xabar: string) =>
  z
    .number()
    .int(xabar)
    .positive(xabar)
    .max(100_000, xabar);

export const sotuvSlotSxema = z.object({
  slotId: z.number().int().positive(),
  materialId: z.number().int().positive('Material tanlanmagan'),
  /** TZ 3.6 — ombordan SHU yechiladi */
  hisoblanganMiqdor: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, "Hisoblangan miqdor noto'g'ri"),
  /** TZ 3.5 — sotuvchi tuzatgani, faqat narxga tegadi */
  tuzatilganMiqdor: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, "Tuzatilgan miqdor noto'g'ri")
    .nullable()
    .default(null),
  birlik: z.enum(['KV_M', 'SM', 'DONA']),
  narxSnapshot: pulMatni("Narx noto'g'ri"),
});

export const sotuvAksessuarSxema = z.object({
  materialId: z.number().int().positive(),
  soni: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Aksessuar soni noto'g'ri"),
  birlik: z.enum(['KV_M', 'SM', 'DONA']),
  narxSnapshot: pulMatni("Aksessuar narxi noto'g'ri"),
  qoldaKiritildi: z.boolean().default(false),
});

export const sotuvPozitsiyaSxema = z.object({
  mahsulotTurId: z.number().int().positive('Mahsulot turini tanlang'),
  /** TZ 3.4 — o'lcham SANTIMETRDA */
  eniSm: olcham('Enini smda kiriting'),
  boyiSm: olcham("Bo'yini smda kiriting"),
  soni: z.number().int().positive().default(1),
  narxSnapshot: pulMatni("Pozitsiya narxi noto'g'ri"),
  chegirmaSumma: pulMatni("Chegirma noto'g'ri").default('0'),
  xizmatHaqi: pulMatni("Xizmat haqi noto'g'ri").default('0'),
  formulaSnapshot: z.unknown(),
  slotlar: z.array(sotuvSlotSxema).min(1, 'Kamida bitta slot to\'ldirilsin'),
  aksessuarlar: z.array(sotuvAksessuarSxema).default([]),
});

export const sotuvSxema = z
  .object({
    mijozId: z.number().int().positive().nullable().default(null),
    ishlabChiqaruvchiFilialId: z.number().int().positive('Filialni tanlang'),
    valyuta: z.enum(['SOM', 'USD']).default('SOM'),
    kursSnapshot: pulMatni("Kurs noto'g'ri").nullable().default(null),
    /** TZ 3.13 — IXTIYORIY */
    tayyorlikSana: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto'g'ri")
      .nullable()
      .default(null),
    qarzgaKetadimi: z.boolean().default(false),
    pozitsiyalar: z.array(sotuvPozitsiyaSxema).min(1, 'Savat bo\'sh'),
  })
  // TZ 3.10 — qarzga sotishda mijoz majburiy
  .refine((d) => !d.qarzgaKetadimi || d.mijozId !== null, {
    path: ['mijozId'],
    message: 'Qarzga sotishda mijoz tanlanishi shart',
  })
  // AUDIT B-04 — dollarli buyurtmada kurs qotishi shart
  .refine((d) => d.valyuta !== 'USD' || d.kursSnapshot !== null, {
    path: ['kursSnapshot'],
    message: 'Dollarli buyurtmada kurs kiritilishi shart',
  });

export type SotuvFormasi = z.infer<typeof sotuvSxema>;
