/**
 * lib/sxema/xarid.ts — xarid buyurtmasi formasi (0063).
 */

import { z } from 'zod';
import { royxat } from './umumiy';

const ixtiyoriyMatn = z
  .string()
  .trim()
  .transform((x) => (x === '' ? null : x));

export const xaridQatorSxema = z.object({
  materialId: z.number().int().positive('Materialni tanlang'),
  miqdor: z
    .string()
    .trim()
    .min(1, 'Miqdor kiritilmagan')
    .refine((x) => /^\d+(\.\d{1,2})?$/.test(x) && Number(x) > 0, "Miqdor noldan katta son bo'lsin"),
  narxAsosi: royxat(['BIRLIK', 'METR', 'KV_M'], 'BIRLIK'),
  /** Bo'sh — narx mol kelganda aniqlanadi */
  narxBirlik: ixtiyoriyMatn.refine(
    (x) => x === null || (/^\d+(\.\d{1,2})?$/.test(x) && Number(x) >= 0),
    "Narx musbat son bo'lsin",
  ),
});

export const xaridSxema = z
  .object({
    yetkazibBeruvchiId: z.coerce.number().int().positive('Yetkazib beruvchini tanlang'),
    sana: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sanani kiriting'),
    kutilganSana: ixtiyoriyMatn.refine(
      (x) => x === null || /^\d{4}-\d{2}-\d{2}$/.test(x),
      'Kutilgan sana noto‘g‘ri',
    ),
    valyuta: royxat(['SOM', 'USD'], 'SOM'),
    izoh: ixtiyoriyMatn.refine((x) => x === null || x.length <= 500, 'Izoh 500 belgidan oshmasin'),
    qatorlar: z.array(xaridQatorSxema).min(1, "Kamida bitta material qo'shing"),
  })
  .refine((d) => d.kutilganSana === null || d.kutilganSana >= d.sana, {
    message: 'Kutilgan sana buyurtma sanasidan oldin bo‘lmaydi',
    path: ['kutilganSana'],
  });
