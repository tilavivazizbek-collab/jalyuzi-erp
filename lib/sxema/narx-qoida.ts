/**
 * lib/sxema/narx-qoida.ts — Egasi qarori 2026-09-20 · TZ 3.8 · 6.2 · 20.9
 *
 * «Narxlar va turlar» ekranidan keladigan ma'lumot. Bitta mahsulot
 * turining BARCHA narx qoidalari va qo'shimchalari birdan yuboriladi
 * — konstruktor ekranidagi kabi (QISM 1 §11).
 *
 * ⚠️ Narx MATN bo'lib keladi, `number` emas (QISM 1 §3.1): ikkilik
 *    kasr pulni buzadi. Bazaga ham `NUMERIC` bo'lib tushadi.
 */

import { z } from 'zod';

/** Musbat pul: `8` · `8.50` · `120000` */
const PUL = /^\d+(\.\d{1,2})?$/;

export const bosqichSxema = z
  .object({
    /** Bosqich boshi — `MAYDON` da kv.m, `ENI`/`BO'YI` da metr */
    dan: z.coerce.number().nonnegative("Bosqich boshi manfiy bo'la olmaydi"),
    /**
     * Bosqich oxiri. `null` — CHEKSIZ.
     *
     * ⚠️ Oxirgi bosqich doim cheksiz bo'lishi kerak, aks holda katta
     *    buyurtmaga narx topilmaydi. Buni `lib/domain/narx-qoidasi.ts`
     *    dagi `bosqichlarniTekshir()` ushlaydi.
     */
    gacha: z.coerce.number().positive().nullable().default(null),
    narx: z.string().trim().regex(PUL, "Narx noto'g'ri"),
    valyuta: z.enum(['SOM', 'USD']).default('SOM'),
  })
  .refine((b) => b.gacha === null || b.gacha > b.dan, {
    path: ['gacha'],
    message: "«gacha» «dan» dan katta bo'lishi kerak",
  });

export const narxQoidaSxema = z.object({
  narxGuruhId: z.number().int().positive('Mato darajasini tanlang'),
  /** TZ 6.2 — bo'sh bo'lsa hamma mijoz turiga */
  mijozTuriId: z.number().int().positive().nullable().default(null),
  /** TZ 20.9 — bo'sh bo'lsa hamma filialga */
  filialId: z.number().int().positive().nullable().default(null),
  hisoblashUsuli: z.enum(['MAYDON', 'ENI', "BO'YI", 'DONA']).default('MAYDON'),
  bosqichlar: z.array(bosqichSxema).min(1, 'Kamida bitta bosqich kiriting'),
});

export const qoshimchaSxema = z
  .object({
    nom: z.string().trim().min(1, "Qo'shimcha nomini kiriting").max(100),
    hisoblashUsuli: z.enum(['QATIY', 'MAYDON', 'ENI', "BO'YI"]).default('QATIY'),
    narx: z.string().trim().regex(PUL, "Narx noto'g'ri"),
    valyuta: z.enum(['SOM', 'USD']).default('SOM'),
    /** Bo'sh bo'lsa ombordan hech narsa yechilmaydi */
    materialId: z.number().int().positive().nullable().default(null),
    /** Guruh berilsa sotuvchi material tanlaydi (mato rangi) */
    almashtirishGuruhId: z.number().int().positive().nullable().default(null),
    formula: z.string().trim().max(500).nullable().default(null),
  })
  .refine(
    (q) =>
      (q.materialId === null && q.almashtirishGuruhId === null) ||
      (q.formula !== null && q.formula !== ''),
    {
      path: ['formula'],
      /**
       * ⚠️ Material bor, formula yo'q — jim xato bo'lardi: ombordan
       *    nechta yechishni hech kim bilmaydi va qo'shimcha «bepul»
       *    material yeb ketardi.
       */
      message: 'Material tanlangan — sarf formulasini ham yozing',
    },
  )
  .refine((q) => q.materialId === null || q.almashtirishGuruhId === null, {
    path: ['materialId'],
    message: "Yo aniq material, yo guruh — ikkalasi birga bo'lmaydi",
  });

/** Bitta mahsulot turining butun narx sozlamasi */
export const turNarxiSxema = z.object({
  /**
   * ⚠️ `null` — «materialni o'zi sotish» (egasi qarori 2026-09-20).
   *    Mato metrlab sotilganda mahsulot turi yo'q.
   */
  mahsulotTurId: z.number().int().positive().nullable().default(null),
  qoidalar: z.array(narxQoidaSxema).default([]),
  qoshimchalar: z.array(qoshimchaSxema).default([]),
});

export type BosqichKirimi = z.infer<typeof bosqichSxema>;
export type NarxQoidaKirimi = z.infer<typeof narxQoidaSxema>;
export type QoshimchaKirimi = z.infer<typeof qoshimchaSxema>;
export type TurNarxiKirimi = z.infer<typeof turNarxiSxema>;
