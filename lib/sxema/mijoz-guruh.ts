/**
 * lib/sxema/mijoz-guruh.ts — TZ 6.3
 *
 * Mijoz guruhi: nom + chegirma.
 */

import { z } from 'zod';

/**
 * ⚠️ `USD` YO'Q. U kursni talab qiladi, kurs esa parametr bo'lib
 *    kelishi shart (§3.2). Mijoz kartochkasida `USD` bor, lekin
 *    u ham qo'llanmaydi — guruhda esa uni umuman taklif
 *    qilmaymiz: tanlab qo'yib «nega ishlamadi» degan savol
 *    tug'ilmasin.
 */
export const GURUH_OFFSET_TURLARI = ['FOIZ', 'SOM'] as const;

export const mijozGuruhSxema = z
  .object({
    nom: z.string().trim().min(1, 'Guruh nomini kiriting').max(100),

    offsetTuri: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine((x) => x === undefined || GURUH_OFFSET_TURLARI.includes(x as never), {
        message: 'Chegirma turi noto‘g‘ri',
      }),

    /**
     * ⚠️ MANFIY BO'LISHI MUMKIN va odatda manfiy: «−10» chegirma,
     *    «+5» ustama. Shuning uchun `>= 0` tekshiruvi YO'Q.
     */
    offsetQiymat: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine((x) => x === undefined || Number.isFinite(Number(x)), {
        message: 'Chegirma — son bo‘lishi kerak',
      }),

    izoh: z
      .string()
      .trim()
      .max(500)
      .transform((x) => (x === '' ? undefined : x))
      .optional(),
  })
  .refine((g) => (g.offsetTuri === undefined) === (g.offsetQiymat === undefined), {
    // Turi bor, qiymati yo'q — chegirma ma'nosiz qoladi
    message: 'Chegirma turi va qiymati birga to‘ldiriladi',
    path: ['offsetQiymat'],
  })
  .refine((g) => g.offsetTuri !== 'FOIZ' || Math.abs(Number(g.offsetQiymat)) <= 100, {
    // 100% dan katta chegirma narxni manfiy qiladi
    message: 'Foiz 100 dan oshmasligi kerak',
    path: ['offsetQiymat'],
  });

export type MijozGuruhKirimi = z.infer<typeof mijozGuruhSxema>;
