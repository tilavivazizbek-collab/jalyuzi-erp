/**
 * lib/sxema/filial.ts — QISM 1 §11 · TZ 20.2
 *
 * Filial formasining tekshiruvi.
 */

import { z } from 'zod';

/** `HH:MM` yoki `HH:MM:SS` — Postgres `time` ustuni. */
const soat = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Soat noto'g'ri");

const bayroq = z
  .union([z.literal('on'), z.literal('true'), z.literal(''), z.undefined()])
  .transform((v) => v === 'on' || v === 'true');

export const filialSxema = z.object({
  nom: z.string().trim().min(2, 'Nom kamida 2 belgi').max(120),
  manzil: z.string().trim().max(300).optional(),
  telefon: z.string().trim().max(30).optional(),

  // 20.2.1 — rejim SHU IKKI bayroqdan kelib chiqadi
  sotadi: bayroq,
  ishlabChiqaradi: bayroq,

  /** 20.2 — o'zi tikmasa MAJBURIY; tekshiruv `lib/domain/filial.ts` da */
  standartIshlabChiqaruvchiId: z.coerce.number().int().positive().nullable(),

  /** Q-17 — kassa kuni shu soatda tugaydi */
  kassaYopilishSoati: soat,

  faol: bayroq,
});

export const filialYangilashSxema = filialSxema.extend({
  filialId: z.coerce.number().int().positive(),
});
