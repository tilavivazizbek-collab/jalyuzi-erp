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
/**
 * POZITSIYAGA TANLANGAN VARIANT — 0052, SNAPSHOT bilan.
 *
 * ⚠️ Nom va qiymat NUSXA bo'lib keladi (2.3-invariant): admin keyin
 *    variantni o'chirsa yoki nomini o'zgartirsa, eski buyurtmada
 *    o'sha kungi nom turadi.
 *
 * ⚠️ Nom SERVERDA qayta o'qilmaydi — brauzerdan kelgani yoziladi.
 *    Bu ataylab: snapshot AYNI TANLANGAN paytdagi holat bo'lishi
 *    kerak, keyinroq o'zgargan nom emas.
 */
export const sotuvTanlovSxema = z.object({
  mahsulotTanlovId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  tanlovNomi: z.string().trim().min(1).max(100),
  variantNomi: z.string().trim().min(1).max(100),
  qiymat: z.number().nullable().default(null),
  /** So'mda; `null` — narxga tegmaydi */
  narx: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Tanlov narxi noto'g'ri")
    .nullable()
    .default(null),
});

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
    /**
     * O'LCHOV BILAN SOTISH — T-16, egasi qarori 2026-09-21.
     *
     * ⚠️ Chiziqli materialni 2.5 metrlab sotish uchun. `soni`
     *    butun bo'lib qoladi (u dona sanog'i), miqdor shu yerda.
     *
     * ⚠️ MATN, `number` EMAS — bazaga `NUMERIC` bo'lib tushadi va
     *    ikkilik kasr oralig'iga kirmaydi (QISM 1 §3.1 ruhida:
     *    o'lchov ham, pul ham matn bo'lib yuradi).
     *
     * ⚠️ Faqat QO'SHIMCHA BUYUMDA — bazadagi
     *    `pozitsiya_miqdor_qoshimchada` cheklovi bilan bir xil.
     */
    miqdor: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Miqdor noto'g'ri")
      .refine((x) => Number(x) > 0, "Miqdor noldan katta bo'lsin")
      .nullable()
      .default(null),
  narxSnapshot: pulMatni("Pozitsiya narxi noto'g'ri"),
  chegirmaSumma: pulMatni("Chegirma noto'g'ri").default('0'),
  xizmatHaqi: pulMatni("Xizmat haqi noto'g'ri").default('0'),
    /**
     * QAYSI OYNA — «Zal — katta oyna» (0049).
     *
     * ⚠️ Bo'sh satr `null` ga aylanadi: bazadagi
     *    `pozitsiya_yorliq_bosh_emas` cheklovi bilan bir xil. Aks
     *    holda ro'yxatda «yorliq bor» deb ko'rinadigan, lekin
     *    ko'zga hech narsa ko'rinmaydigan qator paydo bo'lardi.
     *
     * ⚠️ Uzunlik chegarasi — chek 80 mm: undan uzun matn
     *    qatorni buzadi.
     */
    yorliq: z
      .string()
      .trim()
      .max(60, "Yorliq juda uzun (60 belgigacha)")
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .default(null),
    /** Ichki eslatma — usta va montajchi uchun. Chekka chiqmaydi (0049) */
    izoh: z
      .string()
      .trim()
      .max(500, 'Izoh juda uzun (500 belgigacha)')
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .default(null),
    /*
     * ─── OYNA O'LCHAMI VA O'RNATISH TURI — 0053 ────────────
     *
     * ⚠️ HAMMASI IXTIYORIY va `.optional()` — `.default()` EMAS.
     *    `.default()` CHIQISH turini majburiy qiladi va bu
     *    maydonlarni yubormaydigan chaqiruvchilar (bot, eski
     *    savat, testlar) TypeScript da yiqilardi. Shu tuzoq
     *    loyihada uch marta ishlagan.
     *
     * ⚠️ Yuqoridagi `eniM`/`boyiM` o'sha-o'sha TAYYOR o'lcham —
     *    narx ham, formula ham, kesim ham ularga tayanadi.
     *    Quyidagilar faqat YOZUV: qaysi oynadan, qaysi qoida bilan
     *    chiqqani.
     */
    oynaEniM: z.number().positive().nullable().optional(),
    oynaBoyiM: z.number().positive().nullable().optional(),
    ornatishId: z.number().int().positive().nullable().optional(),
    /** SNAPSHOT (2.3-invariant) — qoida keyin o'zgarsa ham qotib qoladi */
    ornatishNom: z.string().trim().max(100).nullable().optional(),
    /** ⚠️ MANFIY bo'ladi — proyomga o'rnatishda o'lcham kichrayadi */
    ornatishEniM: z.number().min(-1).max(1).nullable().optional(),
    ornatishBoyiM: z.number().min(-1).max(1).nullable().optional(),
    /** Usta tayyor o'lchamni qo'lda yozganmi — qayta hisoblanmaydi */
    olchamQolda: z.boolean().optional(),
    formulaSnapshot: z.unknown(),
    slotlar: z.array(sotuvSlotSxema).default([]),
    aksessuarlar: z.array(sotuvAksessuarSxema).default([]),
    qoshimchalar: z.array(sotuvQoshimchaSxema).default([]),
    /** 0052 — sotuvchi tanlagan variantlar */
    tanlovlar: z.array(sotuvTanlovSxema).default([]),
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
    message: "O'lchamni METRDA kiriting",
  })
  .refine((p) => p.qoshimchaMaterialId !== null || p.slotlar.length > 0, {
    path: ['slotlar'],
    message: "Kamida bitta slot to'ldirilsin",
  })
  /**
   * ⚠️ Bazadagi `pozitsiya_miqdor_qoshimchada` cheklovi bilan
   *    BIR XIL. Ikki joyda ikki xil qoida bo'lmasligi uchun —
   *    aks holda baza rad etgan narsani sxema o'tkazib yuborardi
   *    va sotuvchi tushunarsiz SQL xatosini ko'rardi.
   */
  .refine((p) => p.miqdor === null || p.qoshimchaMaterialId !== null, {
    path: ['miqdor'],
    message: "O'lchovli miqdor faqat alohida sotiladigan buyumda bo'ladi",
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
