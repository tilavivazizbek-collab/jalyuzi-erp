/**
 * lib/sxema/kirish.ts — QISM 1 §11
 *
 * «Zod sxemasi BIR MARTA yoziladi, uch joyda ishlatiladi: forma, API, bot.»
 * Server hech qachon mijoz tomonidagi tekshiruvga ishonmaydi.
 */

import { z } from 'zod';
import { telefonYaroqlimi } from '@/lib/domain/telefon';
import { PAROL_ENG_KAM, PAROL_ENG_KOP } from '@/lib/kirish/parol';

export const kirishSxema = z.object({
  telefon: z
    .string()
    .trim()
    .min(1, 'Telefon raqamini kiriting')
    .refine(telefonYaroqlimi, "Telefon raqami noto'g'ri"),
  parol: z
    .string()
    .min(1, 'Parolni kiriting')
    // Kirishda uzunlik EMAS, faqat bo'sh emasligi tekshiriladi: eski parol
    // qoidasi qisqaroq bo'lgan xodim ham kira olsin
    .max(PAROL_ENG_KOP, 'Parol juda uzun'),
});

export type KirishKirimi = z.infer<typeof kirishSxema>;

/** Parol o'rnatish/o'zgartirish — bu yerda uzunlik talabi ishlaydi (P-10). */
export const parolSxema = z
  .string()
  .min(PAROL_ENG_KAM, `Parol kamida ${String(PAROL_ENG_KAM)} belgi bo'lishi kerak`)
  .max(PAROL_ENG_KOP, 'Parol juda uzun');
