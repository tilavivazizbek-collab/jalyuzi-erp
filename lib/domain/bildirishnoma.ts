/**
 * lib/domain/bildirishnoma.ts — TZ 13.9 · 13.6 · 6.7
 *
 * Bildirishnoma matnlari va ularning turi. **Sof funksiyalar** —
 * bazaga ham, Telegramga ham tegmaydi (§5.1).
 *
 * ⚠️ Matn shu yerda turgani muhim: uni bot ham, sayt ham
 *    ko'rsatishi mumkin (6.7 — buyurtma kartochkasidagi
 *    «Eslatmalar» tabi). Ikki joyda yozilsa ikki xil gap chiqardi.
 */

import Decimal from 'decimal.js';

/**
 * Telegram «Markdown» (eski) uchun FOYDALANUVCHI matnini ekranlaydi.
 *
 * ⚠️ Yuboruvchi hamma xabarni `parse_mode: 'Markdown'` bilan jo'natadi.
 *    Ism, sabab yoki material nomida «_», «*», «`», «[» bo'lsa Telegram
 *    xabarni rad etardi («can't parse entities») va u jim «yetmadi»
 *    bo'lib qolardi (2026-10-12 topildi).
 * ⚠️ Faqat ERKIN matnga — sarlavhadagi «*...*» ga emas: entity ichida
 *    ekranlash ishlamaydi, shuning uchun buyurtma raqami «*» ichida qoladi.
 */
export function md(matn: string): string {
  return matn.replace(/([_*`[])/g, '\\$1');
}

// ─── 13.9 · Admin bildirishnomalari ───────────────────────────────────────

export const ADMIN_HODISALARI = [
  'QAYTA_KESISH_SOROVI',
  'PUL_TOPSHIRILDI',
  'HISOBDAN_CHIQARILDI',
  'KAM_QOLDIQ',
  'USTAMA_PAST',
  'YETKAZIB_MUDDAT',
  'STAVKASIZ_ISH',
  'KUN_FARQI',
  // Kun yakuni — kassa yopilish soatida (hisobot/kechki-malumot.ts)
  'KECHKI_HISOBOT',
  // TZ 8.16 — tayyorlik sanasi o'tgan buyurtmalar (kunlik cron)
  'KECHIKKAN_BUYURTMA',
] as const;

export type AdminHodisasi = (typeof ADMIN_HODISALARI)[number];

/**
 * TZ 13.9 — «Botdan bajariladigan ikki amal: qayta kesishni
 * tasdiqlash va pul topshirig'ini tasdiqlash. Qolgan hammasi
 * saytda.»
 *
 * Shuning uchun faqat shu ikkitasida tugma bo'ladi.
 */
export function tugmaliMi(hodisa: AdminHodisasi): boolean {
  return hodisa === 'QAYTA_KESISH_SOROVI' || hodisa === 'PUL_TOPSHIRILDI';
}

export interface AdminXabari {
  readonly hodisa: AdminHodisasi;
  readonly matn: string;
  /** Tugma bosilganda kerak bo'ladigan obyekt */
  readonly obyektId: number | null;
}

/** 13.9 — qayta kesish so'rovi. Tasdiqlash tugmasi bilan. */
export function qaytaKesishSoroviMatni(k: {
  readonly buyurtmaRaqami: string;
  readonly tartib: number;
  readonly ustaIsmi: string;
  readonly sabab: string;
  readonly nechanchiMarta: number;
}): string {
  const qatorlar = [
    '⚠️ *QAYTA KESISH SO‘ROVI*',
    '',
    `${md(k.buyurtmaRaqami)} · poz. ${String(k.tartib)}`,
    `Usta: ${md(k.ustaIsmi)}`,
    `Sabab: ${md(k.sabab)}`,
  ];

  /**
   * ⚠️ Takroriy brak ALOHIDA ko'rsatiladi (8.17.6): bir pozitsiya
   *    ikkinchi marta qayta kesilayotgan bo'lsa, admin buni
   *    ko'rmasdan tasdiqlab yubormasligi kerak.
   */
  if (k.nechanchiMarta > 1) {
    qatorlar.push('', `🔴 Bu pozitsiya ${String(k.nechanchiMarta)}-marta!`);
  }

  qatorlar.push('', 'Tasdiqlansa material IKKINCHI marta yechiladi.');
  return qatorlar.join('\n');
}

/** 13.9 · 12.7 — sotuvchi pul topshirdi. */
export function pulTopshirildiMatni(k: {
  readonly sotuvchiIsmi: string;
  readonly summa: string;
  readonly valyuta: string;
  readonly begonaFilial: string | null;
}): string {
  const qatorlar = [
    '💵 *PUL TOPSHIRILDI*',
    '',
    `${md(k.sotuvchiIsmi)}: ${k.summa} ${k.valyuta}`,
  ];

  // 22.5.2 — boshqa filialdan kelgan pul qarz tug'diradi
  if (k.begonaFilial !== null) {
    qatorlar.push('', `⚠️ ${md(k.begonaFilial)} sotuvchisi — qarz yoziladi (22.5)`);
  }

  qatorlar.push('', 'Pul siz tasdiqlaguningizcha uning kassasida turadi.');
  return qatorlar.join('\n');
}

/** 13.9 · 7.9 — ombordan hisobdan chiqarildi. Faqat xabar. */
export function hisobdanChiqarildiMatni(k: {
  readonly materialNomi: string;
  readonly bolakKod: string;
  readonly sabab: string;
  readonly kim: string;
  /** Formatlangan, «so'm» bilan — foyda-zararga tushgan yo'qotish */
  readonly zarar: string;
}): string {
  return [
    '📉 *HISOBDAN CHIQARILDI*',
    '',
    `${md(k.materialNomi)} · ${md(k.bolakKod)}`,
    `Sabab: ${md(k.sabab)}`,
    `Zarar: ${k.zarar}`,
    `Kim: ${md(k.kim)}`,
  ].join('\n');
}

/** Telefonda o'qiladigan ro'yxat — shundan ko'pi «yana N ta» bo'ladi */
const ROYXAT_CHEGARASI = 15;

function qisqaRoyxat(qatorlar: readonly string[]): string[] {
  return qatorlar.length <= ROYXAT_CHEGARASI
    ? [...qatorlar]
    : [...qatorlar.slice(0, ROYXAT_CHEGARASI), `… yana ${String(qatorlar.length - ROYXAT_CHEGARASI)} ta`];
}

export interface KamQoldiqQatori {
  readonly materialNomi: string;
  /** Birligi bilan: «12.5 m», «3 dona» */
  readonly qoldiq: string;
  /** Buyurtma birligida: «2 rulon»; tezlik bo'lmasa `null` */
  readonly tavsiya: string | null;
}

/**
 * 13.9 — kam qolgan material. Faqat xabar. 2026-10-13: BITTA xabarda
 * hammasi (kunlik cron) — material boshiga alohida xabar telefonni to'ldirardi.
 * ⚠️ Ro'yxat — «Buyurtma kerak» sahifasidan (yo'lda bo'lmaganlari).
 */
export function kamQoldiqMatni(qatorlar: readonly KamQoldiqQatori[]): string {
  return [
    `📦 *BUYURTMA KERAK* — ${String(qatorlar.length)} ta material`,
    '',
    ...qisqaRoyxat(
      qatorlar.map(
        (q) => `• ${md(q.materialNomi)}: ${q.qoldiq}${q.tavsiya === null ? '' : ` → ${q.tavsiya}`}`,
      ),
    ),
    '',
    'Saytda: Ombor → Xarid → Buyurtma kerak',
  ].join('\n');
}

/** 13.9 · 7.8 — ustama chegaradan past. Faqat xabar. */
export function ustamaPastMatni(k: {
  readonly materialNomi: string;
  readonly ustama: string;
  readonly chegara: string;
}): string {
  return [
    '📊 *USTAMA CHEGARADAN PAST*',
    '',
    `${md(k.materialNomi)}: ${k.ustama}%`,
    `Eng kami: ${k.chegara}%`,
    '',
    'Sotuv narxini yoki tannarxni ko‘rib chiqing (7.8).',
  ].join('\n');
}

function muddatHolati(kunQoldi: number): string {
  return kunQoldi < 0
    ? `🔴 ${String(Math.abs(kunQoldi))} kun KECHIKDI`
    : kunQoldi === 0
      ? '🔴 Bugun oxirgi kun'
      : `${String(kunQoldi)} kun qoldi`;
}

/** 13.9 — yetkazib beruvchiga to'lov muddati (bitta hujjat). Faqat xabar. */
export function yetkazibMuddatMatni(k: {
  readonly nomi: string;
  readonly summa: string;
  readonly kunQoldi: number;
}): string {
  return ['🧾 *TO‘LOV MUDDATI*', '', `${md(k.nomi)}: ${k.summa}`, muddatHolati(k.kunQoldi)].join('\n');
}

export interface MuddatQatori {
  readonly nomi: string;
  readonly hujjat: string;
  /** Formatlangan, valyutasi bilan */
  readonly summa: string;
  readonly kunQoldi: number;
}

/**
 * 13.9 — kunlik: muddati yaqin va o'tgan yetkazib beruvchi to'lovlari
 * BITTA xabarda, eng shoshilinchi birinchi. 2026-10-13.
 */
export function yetkazibMuddatlariMatni(qatorlar: readonly MuddatQatori[]): string {
  const tartibli = [...qatorlar].sort((a, b) => a.kunQoldi - b.kunQoldi);
  return [
    `🧾 *TO‘LOV MUDDATI* — ${String(qatorlar.length)} ta hujjat`,
    '',
    ...qisqaRoyxat(
      tartibli.map((q) => `• ${md(q.nomi)} · ${md(q.hujjat)}: ${q.summa} — ${muddatHolati(q.kunQoldi)}`),
    ),
    '',
    'Saytda: Yetkazib beruvchilar',
  ].join('\n');
}

export interface KechikkanQatori {
  readonly raqam: string;
  readonly mijoz: string;
  /** Tayyorlik sanasidan necha kun o'tdi */
  readonly kun: number;
}

/** TZ 8.16 — tayyorlik sanasi o'tgan buyurtmalar, eng ko'p kechikkani birinchi. 2026-10-13 */
export function kechikkanBuyurtmalarMatni(qatorlar: readonly KechikkanQatori[]): string {
  const tartibli = [...qatorlar].sort((a, b) => b.kun - a.kun);
  return [
    `⏰ *KECHIKKAN BUYURTMALAR* — ${String(qatorlar.length)} ta`,
    '',
    ...qisqaRoyxat(tartibli.map((q) => `• ${md(q.raqam)} · ${md(q.mijoz)} — ${String(q.kun)} kun`)),
    '',
    'Saytda: Buyurtmalar → Muddati o‘tgan',
  ].join('\n');
}

/**
 * 13.9 · 10.12 — stavkasiz ish bajarildi. Faqat xabar.
 *
 * ⚠️ «Ish to'xtamaydi, haq 0 hisoblanadi, admin keyin qo'lda
 *    qo'shadi.» Shuning uchun bu xabar **eslatma**, xato emas.
 */
export function stavkasizIshMatni(k: {
  readonly buyurtmaRaqami: string;
  readonly turNomi: string;
  readonly ustaIsmi: string;
}): string {
  return [
    '⚠️ *STAVKASIZ ISH*',
    '',
    `${md(k.buyurtmaRaqami)} · ${md(k.turNomi)}`,
    `Usta: ${md(k.ustaIsmi)}`,
    '',
    'Haq 0 hisoblandi — stavkani qo‘yib, haqni qo‘lda qo‘shing (10.12).',
  ].join('\n');
}

/** 13.9 · 12.17 — kun yopishda farq. Faqat xabar. */
export function kunFarqiMatni(k: {
  readonly kassaNomi: string;
  readonly kutilgan: string;
  readonly sanalgan: string;
  readonly farq: string;
}): string {
  return [
    '🔴 *KUN YOPISHDA FARQ*',
    '',
    md(k.kassaNomi),
    `Tizimda: ${k.kutilgan}`,
    `Sanaldi: ${k.sanalgan}`,
    `Farq: ${k.farq}`,
  ].join('\n');
}

// ─── 13.6 · Mijoz bildirishnomalari ───────────────────────────────────────

export const MIJOZ_HODISALARI = [
  'QABUL_QILINDI',
  'TASDIQLANDI',
  'TAYYOR',
  'BEKOR',
  'QARZ_ESLATMA',
] as const;

export type MijozHodisasi = (typeof MIJOZ_HODISALARI)[number];

/** 13.6 — buyurtma qabul qilindi. */
export function qabulQilindiMatni(raqam: string): string {
  return (
    `✅ Buyurtmangiz qabul qilindi: *${raqam}*\n\n` +
    'Tasdiqlangach yakuniy narxni yuboramiz.'
  );
}

/**
 * TZ 13.5 — «Sotuvchi tasdiqlayotganda narxni o'zgartirsa mijozga
 * xabar ketadi.»
 *
 * ⚠️ «Aks holda mijoz "botda boshqacha yozgan edi" deydi va
 *    sotuvchi tushuntirib o'tiradi.»
 */
export function tasdiqlandiMatni(k: {
  readonly raqam: string;
  readonly yangiNarx: string;
  readonly eskiNarx: string | null;
}): string {
  if (k.eskiNarx === null || k.eskiNarx === k.yangiNarx) {
    return `✅ Buyurtmangiz tasdiqlandi: *${k.raqam}*\nNarx: ${k.yangiNarx}`;
  }

  /**
   * ⚠️ PUL `Decimal` BILAN (QISM 1 §3.1). Ilgari bu yerda
   *    `Number(eski) - Number(yangi)` turardi — domen qatlamida
   *    ikkilik kasr bilan pul hisoblash, qat'iy qoidaning
   *    buzilishi. `.toFixed(2)` xatoni ko'p hollarda yashirardi,
   *    lekin mijozga ketadigan matnda tiyin adashishi mumkin edi.
   */
  const eski = new Decimal(k.eskiNarx);
  const yangi = new Decimal(k.yangiNarx);
  const farq = eski.minus(yangi);
  const belgi = farq.greaterThan(0) ? 'Chegirma' : 'Qo‘shimcha';

  return (
    `✅ Buyurtmangiz tasdiqlandi: *${k.raqam}*\n` +
    `Yakuniy narx: *${k.yangiNarx}* (avval ${k.eskiNarx}).\n` +
    `${belgi}: ${farq.abs().toFixed(2)}.`
  );
}

/** 13.6 — tayyor bo'ldi. */
export function tayyorMatni(raqam: string): string {
  return `🎉 Buyurtmangiz tayyor: *${raqam}*\nOlib ketishingiz mumkin.`;
}

/** 13.6 — bekor qilindi. */
export function bekorMatni(raqam: string, sabab: string): string {
  return `❌ Buyurtmangiz bekor qilindi: *${raqam}*\nSabab: ${md(sabab)}`;
}

/** 13.6 — qarz eslatmasi. */
export function qarzEslatmaMatni(summa: string): string {
  return `🔴 Sizda ${summa} qarz bor.\nTo‘lash uchun do‘konga murojaat qiling.`;
}
