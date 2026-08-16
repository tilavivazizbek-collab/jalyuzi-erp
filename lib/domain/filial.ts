/**
 * lib/domain/filial.ts — TZ 20.2 · 20.2.1 · 20.2.2 · 20.4.1 · Q-21 · Q-24
 *
 * Filial qoidalari. Bazaga tegmaydi (QISM 1 §5.1) — ma'lumot parametr
 * bo'lib keladi, shuning uchun sayt ham, bot ham, test ham bir xil yo'ldan
 * yuradi.
 */

import { BiznesXato } from '@/lib/xato';

/** Filialning domen ko'rinishi — bazadagi qatorning faqat kerakli qismi. */
export interface Filial {
  readonly id: number;
  readonly nom: string;
  /** Q-24 — bu filialda buyurtma qabul qilinadimi */
  readonly sotadi: boolean;
  /** Q-24 — bu filialda sex va ustalar bormi */
  readonly ishlabChiqaradi: boolean;
  /** O'zi tikmasa — qaysi filialga yuboriladi (20.2) */
  readonly standartIshlabChiqaruvchiId: number | null;
  /** 20.2.2 — bosh filial */
  readonly bosh: boolean;
  readonly faol: boolean;
}

// ─── 20.2.1 · To'rt rejim ─────────────────────────────────────────────────

export type Rejim = 'TOLIQ' | 'DOKON' | 'SEX' | 'OMBOR';

export const REJIM_NOMI: Record<Rejim, string> = {
  TOLIQ: "To'liq filial",
  DOKON: "Do'kon",
  SEX: 'Sex',
  OMBOR: 'Ombor',
};

export const REJIM_IZOHI: Record<Rejim, string> = {
  TOLIQ: "o'zi sotadi, o'zi tikadi",
  DOKON: 'sotadi, buyurtma boshqa filialga ketadi',
  SEX: 'mijoz qabul qilmaydi, boshqa filiallarga tikadi',
  OMBOR: 'faqat material saqlaydi va tarqatadi',
};

/**
 * TZ 20.2.1 jadvali.
 *
 * | Sotadi | Tikadi | Rejim |
 * |---|---|---|
 * | ✅ | ✅ | To'liq filial |
 * | ✅ | ❌ | Do'kon |
 * | ❌ | ✅ | Sex |
 * | ❌ | ❌ | Ombor (markaziy ombor — 20.2.1) |
 */
export function rejim(f: Pick<Filial, 'sotadi' | 'ishlabChiqaradi'>): Rejim {
  if (f.sotadi) return f.ishlabChiqaradi ? 'TOLIQ' : 'DOKON';
  return f.ishlabChiqaradi ? 'SEX' : 'OMBOR';
}

/** Markaziy ombor — material qabul qiladi va tarqatadi (20.2.1, 20.7). */
export const markaziyOmbormi = (f: Pick<Filial, 'sotadi' | 'ishlabChiqaradi'>): boolean =>
  rejim(f) === 'OMBOR';

// ─── 20.2 · Sozlama tekshiruvi ────────────────────────────────────────────

export type FilialNuqsoni =
  | 'ISHLAB_CHIQARUVCHI_KERAK'
  | 'OZIGA_OZI'
  | 'ISHLAB_CHIQARUVCHI_TIKMAYDI'
  | 'ISHLAB_CHIQARUVCHI_NOFAOL';

export interface Tekshiruv {
  readonly yaroqli: boolean;
  readonly nuqsonlar: readonly FilialNuqsoni[];
}

/**
 * Filial sozlamasi izchilmi.
 *
 * `boshqalar` — tizimda mavjud filiallar (standart ishlab chiqaruvchini
 * tekshirish uchun).
 */
export function filialTekshir(f: Filial, boshqalar: readonly Filial[]): Tekshiruv {
  const nuqsonlar: FilialNuqsoni[] = [];
  const ishlabChiqaruvchiId = f.standartIshlabChiqaruvchiId;

  // 20.2 — «ishlab_chiqaradi = false bo'lsa standart_ishlab_chiqaruvchi majburiy»
  if (!f.ishlabChiqaradi && ishlabChiqaruvchiId === null) {
    nuqsonlar.push('ISHLAB_CHIQARUVCHI_KERAK');
  }

  if (ishlabChiqaruvchiId !== null) {
    if (ishlabChiqaruvchiId === f.id) {
      nuqsonlar.push('OZIGA_OZI');
    } else {
      const ishlabChiqaruvchi = boshqalar.find((x) => x.id === ishlabChiqaruvchiId);
      if (ishlabChiqaruvchi !== undefined) {
        // Tikmaydigan filialga buyurtma yuborish — sozlama xatosi
        if (!ishlabChiqaruvchi.ishlabChiqaradi) {
          nuqsonlar.push('ISHLAB_CHIQARUVCHI_TIKMAYDI');
        }
        if (!ishlabChiqaruvchi.faol) {
          nuqsonlar.push('ISHLAB_CHIQARUVCHI_NOFAOL');
        }
      }
    }
  }

  return { yaroqli: nuqsonlar.length === 0, nuqsonlar };
}

// ─── 20.2.2 · Bosh filial ─────────────────────────────────────────────────

/** «Bitta filial bosh deb belgilanadi» — 20.2.2 */
export function boshFilial(hammasi: readonly Filial[]): Filial | null {
  return hammasi.find((f) => f.bosh) ?? null;
}

/** «Bosh filialni o'chirib bo'lmaydi» — 20.2.2 */
export function nofaolQilinsinmi(f: Filial): boolean {
  return !f.bosh;
}

/**
 * Bosh filial aynan bitta bo'lishi kerak. Baza `UNIQUE` indeks bilan
 * ikkitasini to'sadi, bu funksiya esa nol holatini ham ushlaydi.
 */
export function boshFilialTekshir(hammasi: readonly Filial[]): boolean {
  return hammasi.filter((f) => f.bosh).length === 1;
}

// ─── 20.4.1 · Ishlab chiqaruvchi filialni tanlash ─────────────────────────

export type ManbaTuri = 'OZI' | 'STANDART' | 'QOLDA';

export type Tanlov =
  | { readonly holat: 'TANLANDI'; readonly filialId: number; readonly manba: ManbaTuri }
  | { readonly holat: 'QOLDA_TANLASH_KERAK' };

/**
 * TZ 20.4.1:
 *
 *   1. Sotgan filial «ishlab chiqaradi» ☑ bo'lsa → o'zi (sotuvchi o'zgartira oladi)
 *   2. Aks holda → filial sozlamasidagi «standart ishlab chiqarish filiali»
 *   3. U ham bo'sh bo'lsa → sotuvchi qo'lda tanlaydi (majburiy)
 *
 * Buyurtma darajasida, pozitsiya darajasida emas (20.4.1) — bitta
 * buyurtmaning hamma pozitsiyasi bir joyda tikiladi.
 */
export function ishlabChiqaruvchiniTanla(sotgan: Filial): Tanlov {
  if (sotgan.ishlabChiqaradi) {
    return { holat: 'TANLANDI', filialId: sotgan.id, manba: 'OZI' };
  }

  const standart = sotgan.standartIshlabChiqaruvchiId;
  if (standart !== null) {
    return { holat: 'TANLANDI', filialId: standart, manba: 'STANDART' };
  }

  return { holat: 'QOLDA_TANLASH_KERAK' };
}

/**
 * Sotuvchi qo'lda tanlagan filialni tasdiqlaydi (20.4.1 ning 1 va 3-qadami).
 * Tikmaydigan filialga buyurtma yuborib bo'lmaydi.
 */
export function qoldaTanlanganTasdiqla(tanlangan: Filial): Tanlov {
  if (!tanlangan.ishlabChiqaradi) {
    throw new BiznesXato(
      'FILIAL_TIKMAYDI',
      `${tanlangan.nom} — bu filialda ishlab chiqarish yo'q`,
    );
  }
  if (!tanlangan.faol) {
    throw new BiznesXato('FILIAL_NOFAOL', tanlangan.nom);
  }
  return { holat: 'TANLANDI', filialId: tanlangan.id, manba: 'QOLDA' };
}

/**
 * Buyurtma filiallararomi — 20.5 dagi uchta yangi status shundan kelib chiqadi.
 * Bir filial ichida tikilsa eski oqim ishlaydi.
 */
export const filiallararomi = (sotganId: number, tikuvchiId: number): boolean =>
  sotganId !== tikuvchiId;

/**
 * Material qaysi filial omborida tekshiriladi — TZ 20.4.2.
 *
 * «Ko'p filialda bu tekshiruv ishlab chiqaruvchi filial ombori bo'yicha
 * o'tkaziladi — sotgan filial bo'yicha emas.» Band qilish ham o'sha
 * filialda qo'yiladi (7.3).
 */
export const materialTekshiriladiganFilial = (tikuvchiId: number): number => tikuvchiId;

/** Yangi buyurtma qabul qila oladigan filiallar (20.2 «faol» + Q-24 «sotadi»). */
export const sotaOladiganlar = (hammasi: readonly Filial[]): Filial[] =>
  hammasi.filter((f) => f.faol && f.sotadi);

export const tikaOladiganlar = (hammasi: readonly Filial[]): Filial[] =>
  hammasi.filter((f) => f.faol && f.ishlabChiqaradi);
