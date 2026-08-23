/**
 * lib/xato.ts — QISM 1 §12
 *
 * Ikki turdagi xato bor:
 *   BiznesXato  — foydalanuvchiga ko'rsatiladi, har biri kodga va TZ bandiga bog'langan
 *   boshqa xato — texnik (baza, tarmoq), foydalanuvchiga umumiy xabar beriladi
 *
 * Yangi kod qo'shilganda XATO_BAND ga TZ band raqami yoziladi va
 * lib/matn/uz.ts ga o'zbekcha matni qo'shiladi. Matn kodga yozilmaydi (§19).
 */

import { XATO_MATNI } from '@/lib/matn/uz';

/** Har biznes xatosi — kod va uni keltirib chiqargan TZ bandi (§12.2). */
export const XATO_BAND = {
  // ── TZ §12.2 da sanalganlar ────────────────────────────────────────────
  MATERIAL_YOQ: 'TZ 7.6, 8.12',
  LIMIT_OSHDI: 'TZ 6.4',
  CHEGIRMA_LIMITI: 'TZ 3.11',
  STAVKA_YOQ: 'TZ 10.12',
  KUN_YOPILGAN: 'TZ 12.17',
  BOLAK_BAND: 'TZ 7.3',

  // ── Poydevor bosqichida qo'shilganlar ──────────────────────────────────
  PUL_NOTOGRI: 'QISM 1 §3.1',
  KURS_NOTOGRI: 'QISM 1 §3.2',
  KURS_KERAK: 'AUDIT B-04',
  YAXLITLASH_NOTOGRI: 'QISM 1 §3.3',
  NOLGA_BOLINDI: 'QISM 1 §3',
  OLCHOV_NOTOGRI: 'QISM 1 §4.1',
  FORMULA_XATO: 'TZ 4.5',
  FORMULA_NOMALUM_OZGARUVCHI: 'TZ 4.5',
  MUHIT_NOTOGRI: 'QISM 1 §18',

  // ── Kirish — QISM 1 §8 ─────────────────────────────────────────────────
  PAROL_QISQA: 'QISM 1 §8',
  KIRISH_NOTOGRI: 'QISM 1 §8',
  HISOB_BLOKLANGAN: 'QISM 1 §8',
  USTA_SAYTGA_KIRMAYDI: 'Q-04',
  SESSIYA_TUGAGAN: 'QISM 1 §8',
  RUXSAT_YOQ: 'TZ 14.6',

  // ── Filial — TZ 20.2, 20.4 ─────────────────────────────────────────────
  FILIAL_TIKMAYDI: 'TZ 20.4.1',
  FILIAL_NOFAOL: 'TZ 20.2',

  // ── Narx va material — TZ 5, 6.3, 20.9 ─────────────────────────────────
  NARX_NOTOGRI: 'TZ 5.4',
  KOEFFITSIENT_NOTOGRI: 'TZ 5.3',
  BIRLIK_OZGARMAYDI: 'TZ 5.3',
  KONSTRUKTOR_XATO: 'TZ 4.5',
  TELEFON_NOTOGRI: 'QISM 1 §8',
  MATERIAL_TOPILMADI: 'TZ 5.1',
  MIJOZ_DUBLIKAT: 'TZ 6.5',
  MAHSULOT_TOPILMADI: 'TZ 4.1',
  YETKAZIB_TOPILMADI: 'TZ 9.1',
  TANNARX_NOTOGRI: 'TZ 7.9',
  KESIM_NOTOGRI: 'TZ 7.6',
  KIRIM_BOLAK_YETISHMAYDI: 'TZ 7.9',
  KIRIM_ALLAQACHON_STORNO: 'TZ 7.12',
  KIRIM_TOPILMADI: 'TZ 7.12',
  HARAKAT_BRAK_EMAS: 'TZ 7.10',
  HARAKAT_TOPILMADI: 'TZ 7.11',
  BOLAK_ALLAQACHON_CHIQARILGAN: 'TZ 7.10',
  BOLAK_TOPILMADI: 'TZ 7.4',
  CHIQARISH_SAQLANMADI: 'TZ 7.10',
  CHIQARISH_SABAB_KERAK: 'TZ 7.10',
  CHIQARISH_ALLAQACHON_BEKOR: 'TZ 7.10',
  INV_SABAB_KERAK: 'TZ 15.1',
  POZITSIYA_OTISH_MUMKIN_EMAS: 'TZ 8.3',
  ISH_ALLAQACHON_OLINGAN: 'TZ 8.5',
  ISH_SABAB_KERAK: 'TZ 8.6',
  BAND_TOPILMADI: 'TZ 7.6',
  QK_HOLAT_MOS_EMAS: 'TZ 8.17.2',
  QK_SOROV_OCHIQ: 'TZ 8.17.2',
  QK_TOPILMADI: 'TZ 8.17',
  QK_ALLAQACHON_HAL: 'TZ 8.17.9',
  QK_USHLANMA_USTASIZ: 'TZ 10.13',
  KASSA_TAKROR: 'TZ 12.3',
  KASSA_TOPILMADI: 'TZ 12.2',
  KASSA_NOFAOL: 'TZ 12.2',
  KASSA_VALYUTA_MOS_EMAS: 'QISM 1 §1.3',
  KASSA_SUMMA_NOL: 'TZ 12.3',
  KASSA_CHIQIM_MANFIY: 'TZ 12.6',
  KASSA_SAQLANMADI: 'TZ 12.3',
  KASSA_YOZUV_TOPILMADI: 'TZ 12.15',
  KASSA_ALLAQACHON_STORNO: 'TZ 12.15',
  KASSA_SABAB_KERAK: 'TZ 12.15',
  KUN_IZOH_KERAK: 'TZ 12.17',
  TOLOV_BOSH: 'TZ 3.12',
  TOLOV_MANFIY: 'TZ 3.12',
  QAYTARISH_IZOH_KERAK: 'TZ 8.10',
  XARAJAT_IZOH_KERAK: 'TZ 12.10',
  KASSA_ADMIN_EMAS: 'TZ 12.11',
  KUN_SAQLANMADI: 'TZ 12.17',
  KUN_TOPILMADI: 'TZ 12.17',
  KUN_YOPILMAGAN: 'TZ 12.17',
  XARAJAT_KASSA_ZID: 'TZ 12.1',
  XARAJAT_SAQLANMADI: 'TZ 12.1',
  TOPSHIRIQ_TOPILMADI: 'TZ 12.7',
  TOPSHIRIQ_ALLAQACHON_HAL: 'TZ 12.7',
  POZITSIYA_TOPILMADI: 'TZ 8.3',
  POZITSIYA_TAHRIRLANMAYDI: 'TZ 8.7',
  BUYURTMA_TOPILMADI: 'TZ 8.1',
  BUYURTMA_BOSH: 'TZ 3.9',
  BUYURTMA_MIJOZ_KERAK: 'TZ 3.10',
  BUYURTMA_FILIAL_KERAK: 'TZ 20.4.1',
  BUYURTMA_SAQLANMADI: 'TZ 3.9',
  INV_TOPILMADI: 'TZ 15.1',
  INV_YAKUNLANGAN: 'TZ 15.1',
  INV_BOSH: 'TZ 15.1',
  BOSHLANGICH_TAKROR: 'TZ 7.10',
  KIRIM_SAQLANMADI: 'TZ 7.9',
  KIRIM_BOSH: 'TZ 7.9',
  YETKAZIB_SAQLANMADI: 'TZ 9.1',
  MAHSULOT_SAQLANMADI: 'TZ 4.1',
  MIJOZ_TOPILMADI: 'TZ 6.1',
  MIJOZ_SAQLANMADI: 'TZ 6.2',
  MATERIAL_SAQLANMADI: 'TZ 5.1',

  // 6-bosqich — filiallararo (TZ 20.7, 20.8, 22)
  KOCHIRISH_TOPILMADI: 'TZ 20.7.2',
  KOCHIRISH_HOLAT: 'TZ 20.7.1',
  KOCHIRISH_BOSH: 'TZ 20.7.2',
  KOCHIRISH_SABAB_KERAK: 'TZ 22.4.1',
  KOCHIRISH_AYNI_FILIAL: 'TZ 20.6.1',
  BOLAK_YOLDA: 'TZ 20.7.4',
  FILIAL_BALANS_NOL: 'TZ 22.9.4',

  // 20.2 — filial boshqaruvi
  FILIAL_TOPILMADI: 'TZ 20.2',
  FILIAL_SAQLANMADI: 'TZ 20.2',
  FILIAL_ISHLAB_CHIQARUVCHI_KERAK: 'TZ 20.2',
  FILIAL_OZIGA_OZI: 'TZ 20.2',
  FILIAL_BOSH_NOFAOL: 'TZ 20.2.2',
  FILIAL_TAYANCH: 'TZ 20.4.1',

  // 7-bosqich — bot (TZ 13)
  MIJOZ_ISM_KERAK: 'TZ 13.2',
  MIJOZ_TELEFON_KERAK: 'TZ 13.2',
  MIJOZ_TELEFON_BAND: 'TZ 13.2',
  XABAR_SAQLANMADI: 'TZ 13.11',
  BOT_KIRISH_YOQ: 'TZ 13.1',
  BOT_OQIM_BUZUQ: 'TZ 13.4',
  BOT_OQIM_TOLIQ_EMAS: 'TZ 13.4',
} as const;

export type XatoKod = keyof typeof XATO_BAND;

/**
 * Foydalanuvchiga ko'rsatiladigan xato.
 * `kod` interfeys va bot uchun, `band` — nosozlikni TZ ga qaytarib topish uchun.
 */
export class BiznesXato extends Error {
  readonly kod: XatoKod;
  readonly band: string;
  readonly tafsilot: string | undefined;

  constructor(kod: XatoKod, tafsilot?: string) {
    super(tafsilot ? `${XATO_MATNI[kod]} — ${tafsilot}` : XATO_MATNI[kod]);
    this.name = 'BiznesXato';
    this.kod = kod;
    this.band = XATO_BAND[kod];
    this.tafsilot = tafsilot;
  }
}

export function biznesXatosimi(x: unknown): x is BiznesXato {
  return x instanceof BiznesXato;
}
