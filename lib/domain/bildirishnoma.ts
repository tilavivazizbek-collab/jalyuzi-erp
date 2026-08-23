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
    `${k.buyurtmaRaqami} · poz. ${String(k.tartib)}`,
    `Usta: ${k.ustaIsmi}`,
    `Sabab: ${k.sabab}`,
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
    `${k.sotuvchiIsmi}: ${k.summa} ${k.valyuta}`,
  ];

  // 22.5.2 — boshqa filialdan kelgan pul qarz tug'diradi
  if (k.begonaFilial !== null) {
    qatorlar.push('', `⚠️ ${k.begonaFilial} sotuvchisi — qarz yoziladi (22.5)`);
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
}): string {
  return [
    '📉 *HISOBDAN CHIQARILDI*',
    '',
    `${k.materialNomi} · ${k.bolakKod}`,
    `Sabab: ${k.sabab}`,
    `Kim: ${k.kim}`,
  ].join('\n');
}

/** 13.9 — kam qolgan material. Faqat xabar. */
export function kamQoldiqMatni(k: {
  readonly materialNomi: string;
  readonly qoldiq: string;
  readonly chegara: string;
}): string {
  return [
    '📦 *KAM QOLDIQ*',
    '',
    `${k.materialNomi}: ${k.qoldiq}`,
    `Chegara: ${k.chegara}`,
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
    `${k.materialNomi}: ${k.ustama}%`,
    `Eng kami: ${k.chegara}%`,
    '',
    'Sotuv narxini yoki tannarxni ko‘rib chiqing (7.8).',
  ].join('\n');
}

/** 13.9 — yetkazib beruvchiga to'lov muddati. Faqat xabar. */
export function yetkazibMuddatMatni(k: {
  readonly nomi: string;
  readonly summa: string;
  readonly kunQoldi: number;
}): string {
  const qachon =
    k.kunQoldi < 0
      ? `🔴 ${String(Math.abs(k.kunQoldi))} kun KECHIKDI`
      : k.kunQoldi === 0
        ? '🔴 Bugun oxirgi kun'
        : `${String(k.kunQoldi)} kun qoldi`;

  return ['🧾 *TO‘LOV MUDDATI*', '', `${k.nomi}: ${k.summa}`, qachon].join('\n');
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
    `${k.buyurtmaRaqami} · ${k.turNomi}`,
    `Usta: ${k.ustaIsmi}`,
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
    k.kassaNomi,
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

  const farq = (Number(k.eskiNarx) - Number(k.yangiNarx)).toFixed(2);
  const belgi = Number(farq) > 0 ? 'Chegirma' : 'Qo‘shimcha';

  return (
    `✅ Buyurtmangiz tasdiqlandi: *${k.raqam}*\n` +
    `Yakuniy narx: *${k.yangiNarx}* (avval ${k.eskiNarx}).\n` +
    `${belgi}: ${Math.abs(Number(farq)).toFixed(2)}.`
  );
}

/** 13.6 — tayyor bo'ldi. */
export function tayyorMatni(raqam: string): string {
  return `🎉 Buyurtmangiz tayyor: *${raqam}*\nOlib ketishingiz mumkin.`;
}

/** 13.6 — bekor qilindi. */
export function bekorMatni(raqam: string, sabab: string): string {
  return `❌ Buyurtmangiz bekor qilindi: *${raqam}*\nSabab: ${sabab}`;
}

/** 13.6 — qarz eslatmasi. */
export function qarzEslatmaMatni(summa: string): string {
  return `🔴 Sizda ${summa} qarz bor.\nTo‘lash uchun do‘konga murojaat qiling.`;
}
