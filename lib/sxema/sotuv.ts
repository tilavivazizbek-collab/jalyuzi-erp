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
 *
 * ⚠️ 2026-09-20 — O'LCHAM METRDA. Ilgari `.int()` edi, chunki sm da
 *    kasr ma'nosiz edi. Metrda esa kasr ASOSIY holat: `2.1` m.
 *    `.int()` qoldirilganda 2 metrdan kichik har qanday buyurtma
 *    rad etilardi.
 *
 * ⚠️ `multipleOf(0.01)` — santimetrdan mayda o'lcham qabul
 *    qilinmaydi: baza NUMERIC(8,2) va `2.005` jimgina `2.01` ga
 *    aylanib, brauzerdagi narx bilan serverdagisi ajralardi.
 *
 * ⚠️ Yuqori chegara 1000 m — avvalgi 100 000 sm ning aynan o'zi.
 */
const olcham = (xabar: string) =>
  z
    .number()
    .min(0, xabar)
    .max(1000, xabar)
    .multipleOf(0.01, xabar);

export const sotuvSlotSxema = z.object({
  /**
   * ⚠️ `null` — MATERIALNI O'ZI SOTISH (egasi qarori 2026-09-20).
   *    Mato metrlab kesilganda slot yo'q, lekin band qilish va
   *    kesish zanjiri shu qatordan o'qiydi.
   */
  slotId: z.number().int().positive().nullable().default(null),
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
  birlik: z.enum(['KV_M', 'M', 'DONA']),
  /** AUDIT 1-topilma — kesish sozlamalari (server bandga ishlatadi) */
  koeffitsient: z.coerce.number().optional(),
  kesishTuri: z.enum(['ENIGA', "BO'YIGA"]).optional(),
  /**
   * Qat'iy kesim eni, metrda — «dikkey» (egasi, 2026-09-20).
   *
   * ⚠️ Brauzerdan keladi, LEKIN unga ishonilmaydi: server band
   *    qilishdan oldin `mahsulot_slot` dan qayta o'qiydi
   *    (`lib/amal/buyurtma.ts`). Bu yerdagisi faqat SHU so'rovdagi
   *    kesim to'rtburchagini ekrandagisi bilan bir xil qilish uchun.
   */
  kesimEniM: z.coerce.number().positive().nullable().optional(),
  narxSnapshot: pulMatni("Narx noto'g'ri"),
});

export const sotuvAksessuarSxema = z.object({
  materialId: z.number().int().positive(),
  soni: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Aksessuar soni noto'g'ri"),
  birlik: z.enum(['KV_M', 'M', 'DONA']),
  narxSnapshot: pulMatni("Aksessuar narxi noto'g'ri"),
  qoldaKiritildi: z.boolean().default(false),
});

/**
 * Mijoz tanlagan qo'shimcha — «usti shabalik», «o'rnatish».
 * Egasi qarori 2026-09-20.
 *
 * ⚠️ Nom va narx NUSXA bo'lib keladi (2.3-invariant): qo'shimchaning
 *    narxi keyin o'zgarsa yoki o'chirilsa, eski buyurtma o'zgarmaydi.
 *
 * ⚠️ Material bo'lsa MIQDOR ham shart — aks holda ombordan nechta
 *    yechishni hech kim bilmaydi.
 */
export const sotuvQoshimchaSxema = z
  .object({
    mahsulotQoshimchaId: z.number().int().positive(),
    nomSnapshot: z.string().trim().min(1).max(100),
    narxSnapshot: pulMatni("Qo'shimcha narxi noto'g'ri"),
    materialId: z.number().int().positive().nullable().default(null),
    miqdor: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,4})?$/, "Qo'shimcha miqdori noto'g'ri")
      .nullable()
      .default(null),
    birlik: z.enum(['KV_M', 'M', 'DONA']).nullable().default(null),
  })
  .refine(
    (q) =>
      (q.materialId === null && q.miqdor === null && q.birlik === null) ||
      (q.materialId !== null && q.miqdor !== null && q.birlik !== null),
    { path: ['miqdor'], message: "Material tanlangan — miqdori ham kerak" },
  );

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
    /** TZ 3.4 — o'lcham METRDA (2026-09-20). Qo'shimcha buyumda nol */
    eniM: olcham('Enini metrda kiriting'),
    boyiM: olcham("Bo'yini metrda kiriting"),
    soni: z.number().int().positive().default(1),
  narxSnapshot: pulMatni("Pozitsiya narxi noto'g'ri"),
  chegirmaSumma: pulMatni("Chegirma noto'g'ri").default('0'),
  xizmatHaqi: pulMatni("Xizmat haqi noto'g'ri").default('0'),
    formulaSnapshot: z.unknown(),
    slotlar: z.array(sotuvSlotSxema).default([]),
    aksessuarlar: z.array(sotuvAksessuarSxema).default([]),
    qoshimchalar: z.array(sotuvQoshimchaSxema).default([]),
  })
  // Yo tayyor mahsulot, yo qo'shimcha buyum — ikkalasi ham emas
  .refine(
    (p) =>
      (p.mahsulotTurId !== null && p.qoshimchaMaterialId === null) ||
      (p.mahsulotTurId === null && p.qoshimchaMaterialId !== null),
    { path: ['mahsulotTurId'], message: 'Mahsulot turini tanlang' },
  )
  // Tayyor mahsulotda o'lcham va kamida bitta slot MAJBURIY
  .refine((p) => p.qoshimchaMaterialId !== null || (p.eniM > 0 && p.boyiM > 0), {
    path: ['eniM'],
    message: "O'lchamni smda kiriting",
  })
  .refine((p) => p.qoshimchaMaterialId !== null || p.slotlar.length > 0, {
    path: ['slotlar'],
    message: "Kamida bitta slot to'ldirilsin",
  })
  // Qo'shimcha buyumda o'lcham ham, slot ham YO'Q (3.10)
  .refine((p) => p.qoshimchaMaterialId === null || (p.eniM === 0 && p.boyiM === 0), {
    path: ['eniM'],
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
