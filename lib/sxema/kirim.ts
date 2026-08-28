/**
 * lib/sxema/kirim.ts — QISM 1 §11 · TZ 7.9 · 9.6
 */

import { z } from 'zod';

const musbatSon = (nom: string) =>
  z
    .string()
    .trim()
    .min(1, `${nom} kiritilmagan`)
    .refine((x) => !Number.isNaN(Number(x)) && Number(x) > 0, `${nom} noldan katta bo'lishi kerak`);

const ixtiyoriyMusbat = (nom: string) =>
  z
    .string()
    .trim()
    .transform((x) => (x === '' ? undefined : x))
    .optional()
    .refine(
      (x) => x === undefined || (!Number.isNaN(Number(x)) && Number(x) >= 0),
      `${nom} musbat son bo'lishi kerak`,
    );

export const kirimBolakSxema = z.object({
  eniM: musbatSon('Eni'),
  boyiM: musbatSon("Bo'yi"),
});

export const kirimQatorSxema = z
  .object({
    materialId: z.number().int().positive('Materialni tanlang'),
    miqdorKirim: musbatSon('Miqdor'),
    /**
     * ⚠️ `METR` — narx uzunlik metriga berilgan (mato rulonlari).
     *    Rulonning ENI narxga ta'sir qilmaydi.
     */
    narxAsosi: z.enum(['BIRLIK', 'METR']).default('BIRLIK'),
    narxBirlik: z
      .string()
      .trim()
      .min(1, 'Narx kiritilmagan')
      .refine((x) => !Number.isNaN(Number(x)) && Number(x) >= 0, "Narx manfiy bo'la olmaydi"),
    defektMiqdor: ixtiyoriyMusbat('Defekt miqdori'),
    defektTuri: z.enum(['QAYTARILADI', 'HISOBDAN_CHIQADI']).nullable().optional(),
    /** RULON hisob turida har rulon uchun bitta yozuv (7.9) */
    bolaklar: z.array(kirimBolakSxema),
  })
  .refine(
    (q) => q.defektMiqdor === undefined || Number(q.defektMiqdor) === 0 || q.defektTuri !== null && q.defektTuri !== undefined,
    {
      // TZ 7.9 — defekt ikki yo'ldan biriga ketishi AYTILISHI shart
      message: "Defekt bor — qaytariladimi yoki o'zimizdan brakkami, tanlang",
      path: ['defektTuri'],
    },
  )
  .refine(
    (q) => q.defektMiqdor === undefined || Number(q.defektMiqdor) <= Number(q.miqdorKirim),
    { message: 'Defekt miqdori umumiy miqdordan oshmaydi', path: ['defektMiqdor'] },
  );

export const kirimSxema = z
  .object({
    raqam: z.string().trim().min(1, 'Hujjat raqamini kiriting').max(50),
    sana: z.string().trim().min(1, 'Sanani kiriting'),
    yetkazibBeruvchiId: z.coerce.number().int().positive('Yetkazib beruvchini tanlang'),
    valyuta: z.enum(['SOM', 'USD']).default('SOM'),
    kursSnapshot: ixtiyoriyMusbat('Kurs'),
    transportSumma: ixtiyoriyMusbat('Transport summasi'),
    bojxonaSumma: ixtiyoriyMusbat('Bojxona summasi'),
    tolovMuddati: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : x))
      .optional(),
    qatorlar: z.array(kirimQatorSxema).min(1, "Kamida bitta qator bo'lishi kerak"),
  })
  .refine((k) => k.valyuta !== 'USD' || (k.kursSnapshot !== undefined && Number(k.kursSnapshot) > 0), {
    // TZ 9.6 — tannarx kirim kunidagi kursda QOTADI, kurssiz qotib bo'lmaydi
    message: "Dollarli kirimda kurs majburiy — tannarx shu kursda qotadi",
    path: ['kursSnapshot'],
  });

export type KirimQatorKirimi = z.infer<typeof kirimQatorSxema>;
export type KirimFormaKirimi = z.infer<typeof kirimSxema>;
