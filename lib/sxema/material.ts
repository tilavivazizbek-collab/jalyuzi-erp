/**
 * lib/sxema/material.ts — QISM 1 §11 · TZ 5
 *
 * «Zod sxemasi BIR MARTA yoziladi, uch joyda ishlatiladi: forma, API, bot.»
 *
 * Bu yerdagi qoidalar bazadagi CHECK lar bilan JUFT bo'lib ishlaydi:
 * Zod foydalanuvchiga tushunarli xabar beradi, CHECK esa oxirgi to'siq
 * bo'lib qoladi (qo'lda SQL yozilsa ham).
 */

import { z } from 'zod';

export const HISOB_TURLARI = ['RULON', 'CHIZIQLI', 'DONA', 'KV_M'] as const;
export const SARFLASH_BIRLIKLARI = ['SM', 'KV_M', 'DONA'] as const;
export const VALYUTALAR = ['SOM', 'USD'] as const;

export type HisobTuri = (typeof HISOB_TURLARI)[number];
export type SarflashBirligi = (typeof SARFLASH_BIRLIKLARI)[number];

export const HISOB_TURI_NOMI: Record<HisobTuri, string> = {
  RULON: 'Rulon',
  CHIZIQLI: 'Chiziqli',
  DONA: 'Dona',
  KV_M: 'Kvadrat metr',
};

export const SARFLASH_BIRLIGI_NOMI: Record<SarflashBirligi, string> = {
  SM: 'santimetr',
  KV_M: 'kv.m',
  DONA: 'dona',
};

/** Bo'sh matnni `undefined` ga aylantiradi — forma bo'sh maydonni '' yuboradi. */
const ixtiyoriyMatn = z
  .string()
  .trim()
  .transform((x) => (x === '' ? undefined : x))
  .optional();

/** Bo'sh bo'lmasa musbat songa aylantiradi. */
const ixtiyoriySon = (nom: string) =>
  z
    .string()
    .trim()
    .transform((x) => (x === '' ? undefined : x))
    .optional()
    .refine((x) => x === undefined || (!Number.isNaN(Number(x)) && Number(x) >= 0), {
      message: `${nom} — musbat son bo'lishi kerak`,
    });

export const materialSxema = z
  .object({
    nom: z.string().trim().min(1, 'Nomini kiriting').max(200),

    hisobTuri: z.enum(HISOB_TURLARI),
    kirimBirligi: z.string().trim().min(1, "Kirim birligini kiriting").max(50),
    sarflashBirligi: z.enum(SARFLASH_BIRLIKLARI),

    /**
     * Q-01 — 1 kirim birligida nechta sarflash birligi.
     * TZ 5.8: «Bloklaydi — koeffitsient 0 yoki manfiy.»
     * U Q-01 hisobida BO'LUVCHI, nol bo'lsa butun hisob buziladi.
     */
    koeffitsient: z
      .string()
      .trim()
      .min(1, 'Koeffitsientni kiriting')
      .refine((x) => Number(x) > 0, 'Koeffitsient noldan katta bo\'lishi kerak'),

    sotuvNarx: ixtiyoriySon('Sotuv narxi'),
    sotuvValyuta: z.enum(VALYUTALAR).default('SOM'),

    /**
     * ⚠️ TANNARX EMAS (5.4). Kirimni oldindan to'ldirish va
     *    taxminiy ustamani ko'rsatish uchun.
     */
    kutilayotganKelishNarx: ixtiyoriySon('Kelish narxi'),
    kutilayotganKelishValyuta: z.enum(VALYUTALAR).default('SOM'),

    minUstamaFoiz: ixtiyoriySon('Minimal ustama'),

    // TZ 5.5 — ostatka chegaralari ENI bo'yicha, metrda
    yaroqsizChegaraM: ixtiyoriySon('Yaroqsiz chegarasi'),
    kamIshlatiladiganM: ixtiyoriySon('Kam ishlatiladigan chegarasi'),
    // Q-10 — kam qoldiq chegarasi UZUNLIK bo'yicha, metrda
    kamQoldiqChegaraM: ixtiyoriySon('Kam qoldiq chegarasi'),
    // Q-14 — bo'sh bo'lsa oxirgi kirimdan olinadi
    standartRulonEniM: ixtiyoriySon('Rulon eni'),
    /** Kirimni oldindan to'ldirish uchun — hisobga tegmaydi */
    odatdagiRulonBoyiM: ixtiyoriySon("Odatdagi rulon bo'yi"),

    almashtirishGuruhId: z
      .string()
      .trim()
      .transform((x) => (x === '' ? undefined : Number(x)))
      .optional(),

    /**
     * TZ 7.9 — KIRIMDA narx nimaga berilgani.
     *
     * ⚠️ Sotuvga tegmaydi: sotuvda har doim kv.m ishlaydi.
     */
    /**
     * ⚠️ Bo'sh matn STANDART qiymatga aylanadi.
     *
     *    Tanlov faqat RULON mahsulotda ko'rinadi. Dona mahsulotda
     *    forma bu maydonni bo'sh yuboradi va `z.enum` uni rad
     *    etardi — xato esa EKRANDA HECH QAYERDA ko'rinmasdi
     *    (maydonning o'zi yo'q). 2026-08-29 da `sotuvValyuta`
     *    bilan aynan shu bo'lgan va material umuman
     *    saqlanmagan edi.
     */
    kirimNarxAsosi: z.preprocess(
      (x) => (x === '' || x === undefined || x === null ? 'METR' : x),
      z.enum(['BIRLIK', 'METR', 'KV_M']),
    ),

    yaxlitlashQadami: ixtiyoriySon('Yaxlitlash qadami'),
    eslatma: ixtiyoriyMatn,
  })
  .refine(
    (m) =>
      m.yaroqsizChegaraM === undefined ||
      m.kamIshlatiladiganM === undefined ||
      Number(m.yaroqsizChegaraM) <= Number(m.kamIshlatiladiganM),
    {
      // TZ 5.5 — ikki chegara uchta daraja beradi; teskari bo'lsa daraja yo'qoladi
      message: "Yaroqsiz chegarasi kam ishlatiladigan chegarasidan katta bo'lmasligi kerak",
      path: ['yaroqsizChegaraM'],
    },
  );

export type MaterialKirimi = z.infer<typeof materialSxema>;

/**
 * TZ 5.3 — chiziqli material smda sarflanadi (Q-01).
 * Ekranda koeffitsient yonida shu izoh chiqadi.
 */
export function koeffitsientIzohi(
  kirimBirligi: string,
  sarflashBirligi: SarflashBirligi,
): string {
  const b = SARFLASH_BIRLIGI_NOMI[sarflashBirligi];
  return `1 ${kirimBirligi || 'kirim birligi'} = necha ${b}`;
}
