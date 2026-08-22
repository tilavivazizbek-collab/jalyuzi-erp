/**
 * lib/domain/bot.ts — TZ 13.1 · 13.4 · 13.6 · 13.10
 *
 * Bot mantiqi. **Bazaga tegmaydi** — sof funksiyalar (QISM 1 §5.1).
 *
 * ⚠️ 13.1 — «Bot hech qachon yagona interfeys emas.» Shuning uchun bu
 *    yerda faqat **ko'rsatish va tekshirish** qoidalari turadi; pul,
 *    material va status o'zgarishi baribir `lib/amal/` da bo'ladi.
 */

import type { PozitsiyaHolati } from './buyurtma';
import type { TizimliRol } from '@/lib/ruxsat/tekshir';
import { sm, type Santimetr } from './birlik';
import { BiznesXato } from '@/lib/xato';

// ─── 13.1 · Qaysi panel ochiladi ──────────────────────────────────────────

export const BOT_PANELLARI = ['MIJOZ', 'USTA', 'ADMIN'] as const;
export type BotPaneli = (typeof BOT_PANELLARI)[number];

/**
 * TZ 13.1 — «`/start` bosilganda Telegram ID xodimlar bazasida
 * tekshiriladi.»
 *
 * | Kim | Panel |
 * |---|---|
 * | roli **usta** | Usta paneli |
 * | roli **admin** | Admin paneli |
 * | Boshqa hamma | Mijoz paneli |
 *
 * ⚠️ «Sotuvchi uchun bot yo'q — u saytda ishlaydi.» Sotuvchi
 *    `/start` bossa mijoz paneliga tushadi, chunki uning bot orqali
 *    bajaradigan ishi yo'q.
 *
 * ⚠️ 10.3 — xodimda bir nechta rol bo'lishi mumkin. Shunda ADMIN
 *    ustun turadi: uning bildirishnomalari kechiktirib bo'lmaydigan
 *    tasdiqlarni o'z ichiga oladi (13.9).
 */
export function panelTanla(rollar: readonly TizimliRol[]): BotPaneli {
  if (rollar.includes('ADMIN')) return 'ADMIN';
  if (rollar.includes('USTA')) return 'USTA';
  return 'MIJOZ';
}

/** 13.1 — «Xodimda bir nechta rol bo'lsa panellar orasida almashish». */
export function almashaOladimi(rollar: readonly TizimliRol[]): boolean {
  return rollar.includes('ADMIN') && rollar.includes('USTA');
}

// ─── 13.6 · Mijoz ko'radigan status ───────────────────────────────────────

export const MIJOZ_STATUSLARI = ['QABUL', 'TAYYORLANMOQDA', 'TAYYOR', 'YOPILGAN'] as const;
export type MijozStatusi = (typeof MIJOZ_STATUSLARI)[number];

export const MIJOZ_STATUS_MATNI: Record<MijozStatusi, string> = {
  QABUL: '⏳ Qabul qilindi, tasdiqlanmoqda',
  TAYYORLANMOQDA: '🏭 Tayyorlanmoqda',
  TAYYOR: '🎉 Tayyor, olib ketishingiz mumkin',
  YOPILGAN: '✔️ Yopilgan',
};

/**
 * TZ 13.6 — «Bot 9 ta statusni ko'rsatmaydi — mijozga to'rttasi
 * yetarli.»
 *
 * ⚠️ «Materialga kutmoqda» mijozga **ko'rsatilmaydi**: bu ichki
 *    muammo, mijozga sabab bo'lmaydi. Shuning uchun u
 *    «Tayyorlanmoqda» ichiga yashiriladi.
 *
 * ⚠️ `TAYYOR_YOLDA` va `YETIB_KELDI` — 20.5 dagi filiallararo
 *    statuslar. Mijoz uchun ikkalasi ham hali «tayyorlanmoqda»:
 *    mahsulot qo'liga tegmagunicha tayyor deb aytish mumkin emas,
 *    aks holda u bekorga kelib ketadi.
 */
export function mijozStatusi(holat: PozitsiyaHolati): MijozStatusi {
  switch (holat) {
    case 'TASDIQ_KUTMOQDA':
      return 'QABUL';

    case 'TASDIQLANGAN':
    case 'MATERIALGA_KUTMOQDA':
    case 'FILIALGA_YUBORILDI':
    case 'ISHLAB_CHIQARILMOQDA':
    case 'TAYYOR_YOLDA':
      return 'TAYYORLANMOQDA';

    case 'TAYYOR':
    case 'YETIB_KELDI':
      return 'TAYYOR';

    case 'TOPSHIRILDI':
    case 'QAYTARILGAN':
    case 'RAD_ETILGAN':
    case 'BEKOR':
      return 'YOPILGAN';
  }
}

/**
 * TZ 13.6 — «Har pozitsiya alohida statusda bo'lishi mumkin (8.2).
 * Botda shunday ko'rsatiladi: *"3 tadan: 1 tayyor, 2 tayyorlanmoqda"*.»
 */
export function pozitsiyaXulosasi(holatlar: readonly PozitsiyaHolati[]): string {
  if (holatlar.length === 0) return 'Pozitsiya yo‘q';

  const sanoq = new Map<MijozStatusi, number>();
  for (const h of holatlar) {
    const s = mijozStatusi(h);
    sanoq.set(s, (sanoq.get(s) ?? 0) + 1);
  }

  // Bitta guruhda bo'lsa sanoq ortiqcha — to'g'ridan-to'g'ri status
  if (sanoq.size === 1) {
    const [yagona] = [...sanoq.keys()];
    return yagona === undefined ? 'Pozitsiya yo‘q' : MIJOZ_STATUS_MATNI[yagona];
  }

  const qism = MIJOZ_STATUSLARI.filter((s) => sanoq.has(s)).map(
    (s) => `${String(sanoq.get(s))} ${QISQA_NOM[s]}`,
  );

  return `${String(holatlar.length)} tadan: ${qism.join(', ')}`;
}

const QISQA_NOM: Record<MijozStatusi, string> = {
  QABUL: 'qabul qilindi',
  TAYYORLANMOQDA: 'tayyorlanmoqda',
  TAYYOR: 'tayyor',
  YOPILGAN: 'yopilgan',
};

// ─── 13.4 · O'lcham tekshiruvi ────────────────────────────────────────────

/**
 * TZ 13.4 — «Validatsiya: 0, manfiy yoki harf → *"Noto'g'ri o'lcham,
 * qaytadan kiriting"*.»
 *
 * ⚠️ O'lcham SANTIMETRDA va **butun son** (3.4): mijoz «210» deb
 *    yozadi, «210.5» emas. Kasr kelsa rad etiladi — usta yarim
 *    santimetrni baribir kesa olmaydi.
 *
 * ⚠️ Brauzerdan emas, Telegramdan kelgan matnga ham ishonilmaydi.
 */
export function olchamTekshir(matn: string): Santimetr {
  const tozalangan = matn.trim().replace(/\s+/g, '');

  if (!/^\d{1,4}$/.test(tozalangan)) {
    throw new BiznesXato('OLCHOV_NOTOGRI', `o'lcham: ${matn}`);
  }

  const son = Number(tozalangan);
  if (son <= 0) throw new BiznesXato('OLCHOV_NOTOGRI', `o'lcham: ${matn}`);

  return sm(son);
}

/** Tekshiruvni xatosiz shaklda — bot javobi uchun qulay. */
export function olchamYaroqlimi(matn: string): boolean {
  try {
    olchamTekshir(matn);
    return true;
  } catch {
    return false;
  }
}

// ─── 13.10 · Takrorlanishdan himoya ───────────────────────────────────────

export const TAKROR_MATNI = {
  ISHNI_OL: 'Bu ish allaqachon olingan',
  TUGATDIM: 'Bu ish allaqachon tugatilgan',
  TASDIQ: 'Allaqachon tasdiqlangan',
  BUYURTMA: 'Buyurtmangiz allaqachon yuborilgan',
} as const;

/**
 * TZ 13.10 — «Botdagi har tugma idempotent bo'lishi shart: Telegram
 * xabarni qayta yuborishi, foydalanuvchi ikki marta bosishi mumkin.»
 *
 * Bu kalit `amal_kaliti` jadvaliga tushadi (13.10, 12.3): bir xil
 * kalit ikkinchi marta kelsa saqlangan natija qaytariladi.
 *
 * ⚠️ Xabar UI darajasida, **haqiqiy himoya bazada**. Shuning uchun
 *    kalit tugma bosilgan paytga emas, AMALGA bog'lanadi: foydalanuvchi
 *    ikki soniyada ikki marta bossa ham kalit bir xil chiqadi.
 */
export function amalKaliti(
  amal: string,
  telegramId: number,
  obyektId: number,
): string {
  return `bot:${amal}:${String(telegramId)}:${String(obyektId)}`;
}
