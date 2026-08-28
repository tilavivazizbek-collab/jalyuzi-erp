/**
 * lib/sxema/kassa-yarat.ts — TZ 12.2
 *
 * Kassa yaratish. Zod sxemasi bir marta yoziladi va forma ham,
 * server amali ham shundan foydalanadi (QISM 1 §11).
 */

import { z } from 'zod';

export const KASSA_TURLARI = ['NAQD', 'KARTA', 'BANK'] as const;
export const KASSA_VALYUTALARI = ['SOM', 'USD'] as const;

export type KassaTuri = (typeof KASSA_TURLARI)[number];

export const KASSA_TURI_NOMI: Record<KassaTuri, string> = {
  NAQD: 'Naqd',
  KARTA: 'Karta',
  BANK: 'Bank hisobi',
};

export const kassaYaratSxema = z
  .object({
    nom: z.string().trim().min(1, 'Nomini kiriting').max(120),

    filialId: z
      .string()
      .trim()
      .min(1, 'Filialni tanlang')
      .transform((x) => Number(x))
      .refine((x) => Number.isSafeInteger(x) && x > 0, 'Filialni tanlang'),

    /**
     * ⚠️ Bo'sh — ADMIN (filial) kassasi. TZ 12.2: karta puli
     *    sotuvchining qo'lida turmaydi, u to'g'ridan-to'g'ri
     *    admin kassasiga tushadi.
     */
    xodimId: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : Number(x)))
      .optional()
      .refine(
        (x) => x === undefined || (Number.isSafeInteger(x) && x > 0),
        'Xodim tanlanmadi',
      ),

    turi: z.enum(KASSA_TURLARI),
    valyuta: z.enum(KASSA_VALYUTALARI),

    /**
     * TZ 12.2 — «Tizimga o'tishda har kassaning mavjud puli
     * BIRINCHI HARAKAT bo'lib yoziladi (2.2-invariant).»
     *
     * ⚠️ Qoldiq ustun bo'lib SAQLANMAYDI. U K8 yozuvi bo'lib
     *    tushadi va balans doim yozuvlar yig'indisidan chiqadi.
     */
    boshlangichQoldiq: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) => x === undefined || (!Number.isNaN(Number(x)) && Number(x) >= 0),
        "Boshlang'ich qoldiq manfiy bo'la olmaydi",
      ),
  })
  .refine((k) => k.turi !== 'KARTA' || k.xodimId === undefined, {
    /**
     * ⚠️ TZ 12.2 — «Karta to'lovi qaysi sotuvchi sotgan bo'lsa ham
     *    TO'G'RIDAN-TO'G'RI admin kassasiga tushadi.» Bazada ham
     *    shu cheklov bor (`kassa_karta_admin`), lekin bu yerda
     *    tushunarli xabar beriladi.
     */
    message: "Karta kassasi xodimga biriktirilmaydi — u admin kassasi bo'ladi",
    path: ['xodimId'],
  });

export type KassaYaratKirimi = z.infer<typeof kassaYaratSxema>;
