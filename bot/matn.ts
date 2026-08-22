/**
 * bot/matn.ts — TZ 13 · 14.1
 *
 * Botning barcha matnlari BIR JOYDA.
 *
 * ⚠️ 14.1 — sozlamalarda «Bot matnlari» ekrani bo'lishi rejalashtirilgan
 *    (10-bosqich). Shu sabab matn kod ichiga sochilmaydi: keyin ularni
 *    bazaga ko'chirish uchun shu faylni almashtirish kifoya qiladi.
 *
 * ⚠️ Matnlar o'zbekcha va **sodda**: mijoz ham, usta ham telefonda
 *    o'qiydi. Uzun jumla va texnik atama yo'q.
 */

export const MATN = {
  // ── 13.2 · Ro'yxatdan o'tish ──────────────────────────────────────────
  salom:
    '👋 Assalomu alaykum! Jalyuzi buyurtma botiga xush kelibsiz.\n' +
    "Buyurtma berish uchun ro'yxatdan o'ting.",
  ismTasdiq: (ism: string): string =>
    `Ismingiz *${ism}* deb yozilsinmi?\n\nKeyin sotuvchi to‘g‘rilay oladi.`,
  ismSora: 'Ismingizni yozing:',
  telefonSora:
    'Telefon raqamingizni ulashing.\n\n' +
    "⚠️ Pastdagi tugmani bosing — raqamni qo'lda yozib bo'lmaydi.",
  telefonTugma: '📱 Telefon raqamni ulashish',
  royxatdanOtdi: "✅ Ro'yxatdan o'tdingiz.",
  telefonBand:
    "Bu telefon boshqa hisobga bog'langan.\n" +
    "Sotuvchiga murojaat qiling — u qo'lda hal qiladi.",

  // ── 13.3 · Mijoz menyusi ──────────────────────────────────────────────
  menyu: {
    katalog: '🛒 Katalog',
    buyurtma: '📝 Buyurtma berish',
    buyurtmalarim: '📋 Buyurtmalarim',
    balans: '💰 Balansim',
    boglanish: '📞 Bog‘lanish',
  },

  // ── 13.4 · Buyurtma oqimi ─────────────────────────────────────────────
  turTanla: 'Qanday mahsulot kerak?',
  matoTanla: (slot: string): string => `*${slot}* uchun mato tanlang:`,
  matoYoq: "Bu mahsulot uchun hozircha mato yo'q.",
  boshqaTur: '🔄 Boshqa turni tanlash',
  eniSora: 'Enini yozing (sm):',
  boyiSora: "Bo'yini yozing (sm):",
  olchamNotogri: "Noto'g'ri o'lcham, qaytadan kiriting",
  izohSora: 'Xona nomi yoki izoh (ixtiyoriy). Kerak bo‘lmasa «O‘tkazish»:',
  otkazish: '⏭ O‘tkazish',
  orqaga: '⬅️ Orqaga',
  bekor: '❌ Bekor qilish',
  bekorTasdiq: 'Butun savat tozalansinmi?',
  bekorQilindi: 'Savat tozalandi.',
  yanaQosh: '➕ Yana qo‘shish',
  savatYubor: '✅ Buyurtmani yuborish',
  savatBosh: 'Savat bo‘sh.',

  // ── 13.5 · Narx ───────────────────────────────────────────────────────
  narxOzgardi: (yangi: string, eski: string, farq: string): string =>
    `Buyurtmangiz tasdiqlandi.\n` +
    `Yakuniy narx: *${yangi}* (avval ${eski}).\n` +
    `Chegirma: ${farq}.`,

  // ── 13.6 · Holat ──────────────────────────────────────────────────────
  buyurtmaYoq: 'Sizda hali buyurtma yo‘q.',

  // ── 13.7 · Balans ─────────────────────────────────────────────────────
  qarzYoq: 'Qarzingiz yo‘q.',

  // ── 13.8 · Usta paneli ────────────────────────────────────────────────
  usta: {
    navbat: '📋 Umumiy navbat',
    ishlarim: '🔨 Mening ishlarim',
    tugatganlarim: '✔️ Tugatganlarim',
    balans: '💰 Balansim',
    ishniOl: '🟢 Ishga olaman',
    tugatdim: '✅ Tugatdim',
    qaytaKesish: '⚠️ Qayta kesish so‘rayman',
    navbatBosh: 'Navbatda ish yo‘q.',
    ishlarimBosh: 'Sizda olingan ish yo‘q.',
    sababSora: 'Sababni yozing (majburiy):',
    soruvKetdi: 'So‘rov adminga yuborildi.',
    avvalOl: 'Avval ishni olishingiz kerak',
  },

  // ── 13.9 · Admin paneli ───────────────────────────────────────────────
  admin: {
    bugun: '📊 Bugungi tushum',
    kassa: '💵 Kassa qoldig‘i',
    ochiq: '📦 Ochiq buyurtmalar',
    tasdiqla: '✅ Tasdiqlash',
    radEt: '❌ Rad etish',
    tasdiqlandi: 'Tasdiqlandi.',
    radEtildi: 'Rad etildi.',
  },

  // ── 13.1 · Panel almashish ────────────────────────────────────────────
  panelAlmash: '🔄 Panelni almashtirish',

  // ── Umumiy ────────────────────────────────────────────────────────────
  xato: 'Xatolik yuz berdi. Birozdan keyin qayta urinib ko‘ring.',
  tushunmadim: 'Tushunmadim. Menyudan tanlang.',
} as const;

/** 13.10 — takroriy bosishga javob. */
export const TAKROR = {
  ishniOl: 'Bu ish allaqachon olingan',
  tugatdim: 'Bu ish allaqachon tugatilgan',
  tasdiq: 'Allaqachon tasdiqlangan',
  buyurtma: (raqam: string): string =>
    `Buyurtmangiz allaqachon yuborilgan: ${raqam}`,
} as const;
