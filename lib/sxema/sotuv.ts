/**
 * lib/sxema/sotuv.ts — QISM 1 §11 · TZ 3
 *
 * Sotuv ekrani formasining tekshiruvi.
 *
 * ⚠️ Pul MATN sifatida keladi va matn bo'lib qoladi (§3.1). `number` ga
 *    o'girilsa 678 400.00 ni JS suzuvchi nuqtasi buzishi mumkin.
 */

import { z } from 'zod';
import { royxat } from './umumiy';

const pulMatni = (xabar: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, xabar);

/**
 * ⚠️ NOL ham o'tadi: qo'shimcha buyumda o'lcham bo'lmaydi (3.10).
 *    Tayyor mahsulotda musbatligi quyida, `refine` da tekshiriladi.
 */
const olcham = (xabar: string) =>
  z
    .number()
    .int(xabar)
    .min(0, xabar)
    .max(100_000, xabar);

export const sotuvSlotSxema = z.object({
  slotId: z.number().int().positive(),
  materialId: z.number().int().positive('Material tanlanmagan'),
  /** TZ 3.6 — ombordan SHU yechiladi */
  hisoblanganMiqdor: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, "Hisoblangan miqdor noto'g'ri"),
  /** TZ 3.5 — sotuvchi tuzatgani, faqat narxga tegadi */
  tuzatilganMiqdor: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, "Tuzatilgan miqdor noto'g'ri")
    .nullable()
    .default(null),
  birlik: z.enum(['KV_M', 'SM', 'DONA']),
  narxSnapshot: pulMatni("Narx noto'g'ri"),
});

export const sotuvAksessuarSxema = z.object({
  materialId: z.number().int().positive(),
  soni: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Aksessuar soni noto'g'ri"),
  birlik: z.enum(['KV_M', 'SM', 'DONA']),
  narxSnapshot: pulMatni("Aksessuar narxi noto'g'ri"),
  qoldaKiritildi: z.boolean().default(false),
});

/**
 * ⚠️ QATOR IKKI XIL BO'LADI (QISM 3 §4.2):
 *
 *   · TAYYOR MAHSULOT — tur, o'lcham va slotlar bilan
 *   · QO'SHIMCHA BUYUM — mijoz «uydagi mexanizm buzilgan, bittasini
 *     alohida olay» desa. U tayyorlanmaydi: o'lchov olinmaydi, usta
 *     ishlamaydi, kesilmaydi. Faqat material va soni.
 *
 * ⚠️ 2026-09-03 gacha bu sxema faqat BIRINCHISINI bilar edi:
 *    `mahsulotTurId` majburiy, o'lcham musbat, slotlar kamida bitta.
 *    Savatga qo'shimcha buyum solingan BUTUN buyurtma «Mahsulot
 *    turini tanlang» degan tushunarsiz xato bilan saqlanmasdi.
 *
 * ⚠️ Shartlar bazadagi cheklovlar bilan BIR XIL
 *    (`pozitsiya_turi_yoki_material`, `pozitsiya_qoshimcha_olchamsiz`,
 *    `buyurtma_pozitsiya_olcham`) — ikki joyda ikki xil qoida
 *    bo'lmasligi uchun.
 */
export const sotuvPozitsiyaSxema = z
  .object({
    /** Qo'shimcha buyumda `null` */
    mahsulotTurId: z.number().int().positive().nullable().default(null),
    /** Tayyor mahsulotda `null` */
    qoshimchaMaterialId: z.number().int().positive().nullable().default(null),
    /** TZ 3.4 — o'lcham SANTIMETRDA. Qo'shimcha buyumda nol */
    eniSm: olcham('Enini smda kiriting'),
    boyiSm: olcham("Bo'yini smda kiriting"),
    soni: z.number().int().positive().default(1),
  narxSnapshot: pulMatni("Pozitsiya narxi noto'g'ri"),
  chegirmaSumma: pulMatni("Chegirma noto'g'ri").default('0'),
  xizmatHaqi: pulMatni("Xizmat haqi noto'g'ri").default('0'),
    formulaSnapshot: z.unknown(),
    slotlar: z.array(sotuvSlotSxema).default([]),
    aksessuarlar: z.array(sotuvAksessuarSxema).default([]),
  })
  // Yo tayyor mahsulot, yo qo'shimcha buyum — ikkalasi ham emas
  .refine(
    (p) =>
      (p.mahsulotTurId !== null && p.qoshimchaMaterialId === null) ||
      (p.mahsulotTurId === null && p.qoshimchaMaterialId !== null),
    { path: ['mahsulotTurId'], message: 'Mahsulot turini tanlang' },
  )
  // Tayyor mahsulotda o'lcham va kamida bitta slot MAJBURIY
  .refine((p) => p.qoshimchaMaterialId !== null || (p.eniSm > 0 && p.boyiSm > 0), {
    path: ['eniSm'],
    message: "O'lchamni smda kiriting",
  })
  .refine((p) => p.qoshimchaMaterialId !== null || p.slotlar.length > 0, {
    path: ['slotlar'],
    message: "Kamida bitta slot to'ldirilsin",
  })
  // Qo'shimcha buyumda o'lcham ham, slot ham YO'Q (3.10)
  .refine((p) => p.qoshimchaMaterialId === null || (p.eniSm === 0 && p.boyiSm === 0), {
    path: ['eniSm'],
    message: "Qo'shimcha buyumda o'lcham bo'lmaydi",
  })
  .refine((p) => p.qoshimchaMaterialId === null || p.slotlar.length === 0, {
    path: ['slotlar'],
    message: "Qo'shimcha buyumda mato tanlanmaydi",
  });

export const sotuvSxema = z
  .object({
    mijozId: z.number().int().positive().nullable().default(null),
    ishlabChiqaruvchiFilialId: z.number().int().positive('Filialni tanlang'),
    valyuta: royxat(['SOM', 'USD'], 'SOM'),
    kursSnapshot: pulMatni("Kurs noto'g'ri").nullable().default(null),
    /** TZ 3.13 — IXTIYORIY */
    tayyorlikSana: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto'g'ri")
      .nullable()
      .default(null),
    qarzgaKetadimi: z.boolean().default(false),
    /**
     * TZ 3.11 — butun savatga kelishilgan summa.
     *
     * ⚠️ Bo'sh bo'lsa hisoblangan summa olinadi. Kiritilsa, farq
     *    chegirma bo'lib pozitsiyalarga TAQSIMLANADI va bazaga
     *    yoziladi (`chegirmaniTaqsimla`). Ilgari bu maydon faqat
     *    ekranda ko'rinardi va saqlanmasdi.
     */
    kelishilganSumma: pulMatni("Kelishilgan summa noto'g'ri").nullable().default(null),
    pozitsiyalar: z.array(sotuvPozitsiyaSxema).min(1, 'Savat bo\'sh'),
  })
  // TZ 3.10 — qarzga sotishda mijoz majburiy
  .refine((d) => !d.qarzgaKetadimi || d.mijozId !== null, {
    path: ['mijozId'],
    message: 'Qarzga sotishda mijoz tanlanishi shart',
  })
  // AUDIT B-04 — dollarli buyurtmada kurs qotishi shart
  .refine((d) => d.valyuta !== 'USD' || d.kursSnapshot !== null, {
    path: ['kursSnapshot'],
    message: 'Dollarli buyurtmada kurs kiritilishi shart',
  });

export type SotuvFormasi = z.infer<typeof sotuvSxema>;
