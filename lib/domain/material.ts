/**
 * lib/domain/material.ts — TZ 5 · Q-01 · Q-05 · Q-10 · Q-14
 *
 * Material kartochkasining qoidalari. Bazaga tegmaydi (QISM 1 §5.1).
 */

import { BiznesXato } from '@/lib/xato';
import { kvM, m, sm, type KvadratMetr, type Metr, type Santimetr, type SarflashBirligi } from '@/lib/domain/birlik';

// ─── 5.1, 5.2 · Kategoriya va hisob turi ──────────────────────────────────

export const KATEGORIYALAR = ['MATO', 'AKSESSUAR', 'KARNIZ'] as const;
export type Kategoriya = (typeof KATEGORIYALAR)[number];

/** 5.2 — to'rt xil (v1.13 da faqat ikkitasi sanalgan edi) */
export const HISOB_TURLARI = ['RULON', 'KV_M', 'CHIZIQLI', 'DONA'] as const;
export type HisobTuri = (typeof HISOB_TURLARI)[number];

/** 5.3 — ombor qanday qabul qiladi */
export const KIRIM_BIRLIKLARI = ['rulon', 'shtanga', 'quti', 'metr', 'dona'] as const;
export type KirimBirligi = (typeof KIRIM_BIRLIKLARI)[number];

export interface Material {
  readonly id: number;
  readonly nom: string;
  readonly kategoriya: Kategoriya;
  readonly hisobTuri: HisobTuri;
  readonly kirimBirligi: KirimBirligi;
  readonly sarflashBirligi: SarflashBirligi;
  /** Q-01 — 1 kirim birligida nechta sarflash birligi (shtanga → 300 sm) */
  readonly koeffitsient: number;
  /** Q-14 — kam qoldiq chegarasini kv.m ga o'girish uchun */
  readonly standartRulonEni: Metr | null;
  /** Q-10 — uzunlik bo'yicha, metrda */
  readonly kamQoldiqChegarasi: Metr | null;
  /** 5.5 — eni bo'yicha, metrda */
  readonly yaroqsizChegarasi: Metr | null;
  readonly kamIshlatiladiganChegarasi: Metr | null;
  readonly minimalUstamaFoizi: number | null;
  readonly faol: boolean;
}

/** 5.5 standart qiymatlari */
export const STANDART_YAROQSIZ = 0.5;
export const STANDART_KAM_ISHLATILADIGAN = 1.0;

// ─── 5.3 · Konversiya (Q-01) ──────────────────────────────────────────────

/**
 * Kirim birligidan sarflash birligiga.
 *
 * Q-01: koeffitsient = 1 kirim birligida nechta SARFLASH birligi bor.
 *   metr    → 100 sm
 *   shtanga → 300 sm
 *   quti    → 3000 sm
 *
 * ⚠️ 5.3-band o'z ichida ziddiyatli edi (koeffitsient 3 ham, 300 ham).
 * AUDIT Z-01 buni ushlagan, Q-01 hal qilgan: koeffitsient SANTIMETRDA.
 */
export function koeffitsientTekshir(koeffitsient: number): number {
  if (!Number.isFinite(koeffitsient) || koeffitsient <= 0) {
    // 5.8 — «Bloklaydi: koeffitsient 0 yoki manfiy»
    throw new BiznesXato('KOEFFITSIENT_NOTOGRI', String(koeffitsient));
  }
  return koeffitsient;
}

/** Kirimdagi miqdorni sarflash birligiga o'giradi (5.3). */
export function kirimdanSarflashga(
  miqdor: number,
  koeffitsient: number,
  sarflashBirligi: SarflashBirligi,
): Santimetr | KvadratMetr | number {
  koeffitsientTekshir(koeffitsient);
  const natija = miqdor * koeffitsient;
  return sarflashBirligi === 'SM' ? sm(natija) : natija;
}

/** Kirim va sarflash birligi bir xilmi — koeffitsient kerak emasmi (5.3). */
export function koeffitsientKerakmi(kirim: KirimBirligi, sarflash: SarflashBirligi): boolean {
  if (kirim === 'dona' && sarflash === 'DONA') return false;
  return true;
}

/**
 * 5.3 — «Qoldiq 0 dan katta bo'lsa hisob turi va birliklar o'zgartirilmaydi.»
 * Tugma bloklanadi va sabab ko'rsatiladi.
 */
export function birlikOzgartirilsinmi(qoldiq: number): boolean {
  return qoldiq === 0;
}

export function birlikOzgartirishniTalabQil(qoldiq: number): void {
  if (!birlikOzgartirilsinmi(qoldiq)) {
    throw new BiznesXato('BIRLIK_OZGARMAYDI', `qoldiq: ${String(qoldiq)}`);
  }
}

// ─── 5.5 · Chegaralar ─────────────────────────────────────────────────────

/** 7.5 — uchta daraja, ostatka enidan kelib chiqadi (5.5). */
export type OstatkaDarajasi = 'YAROQSIZ' | 'KAM_ISHLATILADIGAN' | 'NORMAL';

/**
 * ⚠️ Maydon emas, aynan ENI bo'yicha (5.5):
 * «`0.20 × 6` bo'lak 1.2 kv.m bo'lsa ham hech narsaga yaramaydi.»
 */
export function ostatkaDarajasi(
  eni: Metr,
  yaroqsizChegarasi: Metr | null,
  kamIshlatiladiganChegarasi: Metr | null,
): OstatkaDarajasi {
  const yaroqsiz = yaroqsizChegarasi ?? m(STANDART_YAROQSIZ);
  const kam = kamIshlatiladiganChegarasi ?? m(STANDART_KAM_ISHLATILADIGAN);

  if (eni < yaroqsiz) return 'YAROQSIZ';
  if (eni < kam) return 'KAM_ISHLATILADIGAN';
  return 'NORMAL';
}

/**
 * Q-14 — kam qoldiq chegarasi metrda saqlanadi, kv.m ga «standart rulon eni»
 * orqali o'giriladi. Bo'sh bo'lsa oxirgi kirimdan olinadi.
 */
export function chegaraKvMda(
  chegaraMetr: Metr,
  standartRulonEni: Metr | null,
  oxirgiKirimEni: Metr | null,
): KvadratMetr | null {
  const eni = standartRulonEni ?? oxirgiKirimEni;
  if (eni === null) return null;
  return kvM(chegaraMetr * eni);
}

/** Kam qoldiq ogohlantirishi — Q-10, materialning o'z birligida (5.5). */
export function kamQoldiqmi(qoldiq: number, chegara: number | null): boolean {
  if (chegara === null) return false;
  return qoldiq < chegara;
}

// ─── 5.8 · Saqlashdagi tekshiruvlar ───────────────────────────────────────

export type Bloklovchi = 'NARX_MANFIY' | 'KOEFFITSIENT_NOTOGRI' | 'MAJBURIY_BOSH';
export type Ogohlantirish =
  | 'NARX_TANNARXDAN_PAST'
  | 'SLOTGA_BOGLANMAGAN'
  | 'CHEGARA_QOLDIQDAN_YUQORI'
  | 'USTAMA_CHEGARADAN_PAST';

export interface SaqlashNatijasi {
  readonly saqlansinmi: boolean;
  readonly bloklovchilar: readonly Bloklovchi[];
  readonly ogohlantirishlar: readonly Ogohlantirish[];
}

export interface SaqlashKirishi {
  readonly nom: string;
  readonly sotuvNarxiSoni: number;
  readonly koeffitsient: number;
  readonly tannarxSoni: number | null;
  readonly slotgaBoglanganmi: boolean;
  readonly kamQoldiqChegarasiSoni: number | null;
  readonly joriyQoldiq: number | null;
  readonly ustamaFoizi: number | null;
  readonly minimalUstamaFoizi: number | null;
}

/**
 * TZ 5.8 — nima bloklaydi, nima faqat ogohlantiradi.
 *
 * «Bloklamaydi, faqat ogohlantiradi» ro'yxati ataylab uzun: admin o'z
 * ishini biladi, tizim uni to'sib qo'ymaydi — faqat ko'rsatadi.
 */
export function saqlashTekshir(k: SaqlashKirishi): SaqlashNatijasi {
  const bloklovchilar: Bloklovchi[] = [];
  const ogohlantirishlar: Ogohlantirish[] = [];

  if (k.nom.trim() === '') bloklovchilar.push('MAJBURIY_BOSH');
  if (k.sotuvNarxiSoni < 0) bloklovchilar.push('NARX_MANFIY');
  if (!Number.isFinite(k.koeffitsient) || k.koeffitsient <= 0) {
    bloklovchilar.push('KOEFFITSIENT_NOTOGRI');
  }

  if (k.tannarxSoni !== null && k.sotuvNarxiSoni < k.tannarxSoni) {
    ogohlantirishlar.push('NARX_TANNARXDAN_PAST');
  }
  if (!k.slotgaBoglanganmi) {
    ogohlantirishlar.push('SLOTGA_BOGLANMAGAN');
  }
  if (
    k.kamQoldiqChegarasiSoni !== null &&
    k.joriyQoldiq !== null &&
    k.kamQoldiqChegarasiSoni > k.joriyQoldiq
  ) {
    ogohlantirishlar.push('CHEGARA_QOLDIQDAN_YUQORI');
  }
  if (
    k.ustamaFoizi !== null &&
    k.minimalUstamaFoizi !== null &&
    k.ustamaFoizi < k.minimalUstamaFoizi
  ) {
    ogohlantirishlar.push('USTAMA_CHEGARADAN_PAST');
  }

  return {
    saqlansinmi: bloklovchilar.length === 0,
    bloklovchilar,
    ogohlantirishlar,
  };
}

// ─── 5.9 · Material holati ────────────────────────────────────────────────

/**
 * 2.1-invariant: harakati bo'lmagan yozuv butunlay o'chiriladi,
 * harakati bori nofaol qilinadi.
 */
export const ochirilsinmi = (harakatBormi: boolean): boolean => !harakatBormi;

export interface NofaolTekshiruvi {
  /** Material biror FAOL mahsulot turining MAJBURIY komplektidami */
  readonly majburiyKomplektda: boolean;
  /** Almashtirish guruhida boshqa faol variant qolganmi */
  readonly guruhdaBoshqaFaolBormi: boolean;
}

/**
 * 5.9 — «Nofaol qilish bloklanadi, agar material biror faol mahsulot
 * turining majburiy komplektida bo'lsa VA almashtirish guruhida boshqa
 * faol variant qolmasa.»
 *
 * Aks holda sotuvchi Rollo tanlaganda mexanizm qatorida bo'sh dropdown
 * chiqadi — muammo mijoz oldida ma'lum bo'ladi.
 */
export function nofaolQilinsinmi(t: NofaolTekshiruvi): boolean {
  return !(t.majburiyKomplektda && !t.guruhdaBoshqaFaolBormi);
}
