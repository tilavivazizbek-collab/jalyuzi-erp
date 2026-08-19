/**
 * lib/sxema/yetkazib.ts — QISM 1 §11 · TZ 9.3
 */

import { z } from 'zod';
import { telefonYaroqlimi } from '@/lib/domain/telefon';

export const VALYUTALAR = ['SOM', 'USD'] as const;

const bosMatn = z
  .string()
  .trim()
  .transform((x) => (x === '' ? undefined : x))
  .optional();

const bosTelefon = z
  .string()
  .trim()
  .transform((x) => (x === '' ? undefined : x))
  .optional()
  .refine((x) => x === undefined || telefonYaroqlimi(x), "Telefon raqami noto'g'ri");

export const yetkazibSxema = z.object({
  nom: z.string().trim().min(1, 'Nomini kiriting').max(200),
  nimaYetkazadi: bosMatn,

  kontaktShaxs: bosMatn,
  telefon: bosTelefon,
  qoshimchaTelefon: bosTelefon,
  manzil: bosMatn,

  bankNomi: bosMatn,
  hisobRaqam: bosMatn,
  inn: bosMatn,
  mfo: bosMatn,

  /** TZ 9.3 — kirim hujjatiga avtomatik qo'yiladi, bo'sh → sozlamadagi standart */
  tolovMuddatiKun: z
    .string()
    .trim()
    .transform((x) => (x === '' ? undefined : x))
    .optional()
    .refine(
      (x) => x === undefined || (Number.isInteger(Number(x)) && Number(x) >= 0),
      "To'lov muddati butun va musbat son bo'lishi kerak",
    ),

  valyuta: z.enum(VALYUTALAR).default('SOM'),
  eslatma: bosMatn,
});

export type YetkazibKirimi = z.infer<typeof yetkazibSxema>;
