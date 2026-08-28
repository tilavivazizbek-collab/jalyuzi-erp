/**
 * lib/sxema/xodim.ts — TZ 10.2 · 10.3 · QISM 1 §11
 *
 * Zod sxemasi bir marta yoziladi va forma ham, server amali ham
 * shundan foydalanadi.
 */

import { z } from 'zod';
import { telefonYaroqlimi } from '@/lib/domain/telefon';
import { PAROL_ENG_KAM, PAROL_ENG_KOP, parolYaroqlimi } from '@/lib/domain/parol-qoida';

const ixtiyoriyMatn = z
  .string()
  .trim()
  .transform((x) => (x === '' ? undefined : x))
  .optional();

export const xodimSxema = z
  .object({
    ism: z.string().trim().min(1, 'Ismini kiriting').max(120),

    /**
     * ⚠️ Telefon NOYOB — u kirish nomi bo'lib ishlatiladi (§8).
     *    Ikkita xodimda bir raqam bo'lsa kim kirganini aniqlab
     *    bo'lmasdi.
     */
    telefon: z
      .string()
      .trim()
      .min(1, 'Telefon raqamini kiriting')
      .refine(telefonYaroqlimi, "Telefon raqami noto'g'ri"),

    filialId: z
      .string()
      .trim()
      .min(1, 'Filialni tanlang')
      .transform((x) => Number(x))
      .refine((x) => Number.isSafeInteger(x) && x > 0, 'Filialni tanlang'),

    /**
     * ⚠️ TZ 10.3 — xodimda BIR NECHTA rol bo'lishi mumkin va
     *    ruxsatlar ularning yig'indisi (P-05). Shuning uchun
     *    ro'yxat, bitta qiymat emas.
     */
    rolIdlar: z
      .string()
      .trim()
      .transform((x) =>
        x === ''
          ? []
          : x
              .split(',')
              .map((n) => Number(n.trim()))
              .filter((n) => Number.isSafeInteger(n) && n > 0),
      )
      .refine((x) => x.length > 0, 'Kamida bitta rol tanlang'),

    /**
     * ⚠️ Parol IXTIYORIY: usta saytga kirmaydi, u faqat botdan
     *    ishlaydi (Q-04). Unga parol majburlash keraksiz to'siq
     *    bo'lardi.
     */
    parol: z
      .string()
      .transform((x) => (x === '' ? undefined : x))
      .optional()
      .refine(
        (x) => x === undefined || parolYaroqlimi(x),
        `Parol ${String(PAROL_ENG_KAM)}–${String(PAROL_ENG_KOP)} belgi bo'lishi kerak`,
      ),

    ishgaKirdi: ixtiyoriyMatn,
  });

export type XodimKirimi = z.infer<typeof xodimSxema>;
