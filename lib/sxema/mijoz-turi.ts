/**
 * lib/sxema/mijoz-turi.ts — TZ 6.2 · 14.9
 *
 * Mijoz turi — narx darajasi spravochnigi.
 */

import { z } from 'zod';

export const mijozTuriSxema = z.object({
  nom: z.string().trim().min(1, 'Tur nomini kiriting').max(100),

  /**
   * ⚠️ Soliq maydonlari TURNING XUSUSIYATI, nomi emas.
   *
   *    `nom = 'Yuridik'` deb tekshirish xato bo'lardi: «Optom»
   *    turidagi yuridik mijozdan INN so'ralmay qolardi va unga
   *    faktura yozib bo'lmasdi.
   */
  soliqKerak: z
    .string()
    .trim()
    .transform((x) => x === 'ha'),

  tartib: z
    .string()
    .trim()
    .transform((x) => (x === '' ? 0 : Number(x)))
    .refine((x) => Number.isFinite(x) && x >= 0, 'Tartib musbat son'),
});

export type MijozTuriKirimi = z.infer<typeof mijozTuriSxema>;
