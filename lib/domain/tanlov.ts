/**
 * lib/domain/tanlov.ts — egasi holatlari 2026-09-22
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Tizim ikki narsani modellashtira olardi:
 *
 *     O'LCHOV   — son (eni, bo'yi, soni)
 *     MATERIAL  — ombordan yeyiladigan narsa
 *
 * TANLOV esa yo'q edi: zanjir chapdanmi yoki o'ngdan, shiftga yoki
 * devorga, kasseta bormi, lamel 89 yoki 127 mm, bir tomonga yoki
 * markazdan ochiladi, qo'lda yoki motorli.
 *
 * Jalyuzida yetishmayotgan funksiyalarning deyarli hammasi shu
 * bo'shliqdan chiqardi. Egasi to'rt marta bir xil savol berdi
 * (zebra, dikkey ochilishi, motorli, burchak oyna) va har safar
 * «ikki alohida tur qiling» degan javob oldi — dasturchi uchun
 * arzon, egasi uchun qimmat.
 *
 * ⚠️ UCH DARAJALI TA'SIR. Egasi avval «faqat yozilsin, ustaga
 *    borsin» degan edi, lekin o'zining dikkey misoli aksini
 *    ko'rsatdi: ochilish tomoni mato soniga ham, mexanizmga ham
 *    ta'sir qiladi. Shuning uchun uchta daraja ham bor va har biri
 *    IXTIYORIY:
 *
 *      1. YOZUV    — variantning nomi buyurtmada qoladi va ustaga
 *                    boradi. Eng sodda holat: `qiymat` ham, `narx`
 *                    ham bo'sh
 *      2. NARX     — variant narxga qo'shadi (kasseta +50 000)
 *      3. SARF     — variant FORMULAGA son beradi. Tanlovning `kod`i
 *                    formulada o'zgaruvchi bo'lib ishlatiladi:
 *                    `CEIL(ENI / LAMEL_ENI)`
 *
 * ⚠️ 3-daraja mavjud mexanizmni QAYTA ISHLATADI. `lib/domain/formula.ts`
 *    nomli parametrlarni allaqachon biladi (`standartQiymatlar` ning
 *    `parametrlar` argumenti). Tanlov — bu qiymati ro'yxatdan
 *    tanlanadigan parametr, xolos. Yangi formula tili YOZILMAYDI.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1) — hamma narsa parametr bo'lib keladi.
 *    Sotuv ekrani, server tekshiruvi va bot uchalasi ham SHU
 *    funksiyalarni chaqiradi (CLAUDE.md §3).
 */

import { BiznesXato } from '@/lib/xato';
import type { Qiymatlar } from './formula';

/**
 * Bitta variant — «chap», «127 mm», «motorli».
 *
 * ⚠️ `qiymat` — formulaga beriladigan son. `null` bo'lsa tanlov
 *    sarfga TEGMAYDI va faqat yozuv bo'lib qoladi.
 *
 * ⚠️ `narx` — SO'MDA, qat'iy summa. O'lchamga bog'liq narx kerak
 *    bo'lsa `mahsulot_qoshimcha` ishlatiladi: u allaqachon
 *    MAYDON/ENI/BO'YI usullarini biladi va ikkinchi marta yozish
 *    «bir mantiq — bir joyda» ni buzardi.
 */
export interface Variant {
  readonly id: number;
  readonly nom: string;
  readonly qiymat: number | null;
  readonly narx: string | null;
}

/**
 * Bitta tanlov — «Boshqaruv tomoni», «Lamel eni».
 *
 * ⚠️ `kod` formulada ishlatiladi, shuning uchun u `mahsulot_parametr`
 *    bilan BIR XIL shaklda: katta harf bilan boshlanadi.
 *    `null` bo'lsa tanlov formulada ishlatilmaydi.
 */
export interface Tanlov {
  readonly id: number;
  readonly kod: string | null;
  readonly nom: string;
  readonly majburiy: boolean;
  readonly variantlar: readonly Variant[];
}

/** Sotuvchi tanlagani: tanlov `id` → variant `id` */
export type Tanlangan = Readonly<Record<number, number>>;

// ─── Yetishmayotgan tanlovlar ─────────────────────────────────────────────

/**
 * Majburiy tanlov tanlanmagan bo'lsa — nomlari.
 *
 * ⚠️ RO'YXAT qaytaradi, birinchisini emas: sotuvchi hammasini
 *    birdan ko'rsin. Bittalab aytilsa u savatga qo'shishga uch
 *    marta urinib, uch marta xato olardi.
 */
export function yetishmaganTanlovlar(
  tanlovlar: readonly Tanlov[],
  tanlangan: Tanlangan,
): string[] {
  return tanlovlar
    .filter((t) => t.majburiy && tanlangan[t.id] === undefined)
    .map((t) => t.nom);
}

/** Tanlangan variantni topadi — topilmasa `null` */
export function variantniTop(t: Tanlov, tanlangan: Tanlangan): Variant | null {
  const id = tanlangan[t.id];
  if (id === undefined) return null;
  return t.variantlar.find((v) => v.id === id) ?? null;
}

// ─── 3-daraja: formulaga beriladigan qiymatlar ────────────────────────────

/**
 * Tanlovlardan formula o'zgaruvchilarini yasaydi.
 *
 * ⚠️ Faqat `kod`i VA `qiymat`i bor tanlovlar tushadi. Qolganlari
 *    formulaga umuman bormaydi — ular yozuv yoki narx uchun.
 *
 * ⚠️ TANLANMAGAN majburiy tanlov bu yerda JIM o'tkazib yuboriladi.
 *    Xatoni `yetishmaganTanlovlar()` beradi va u sotuv ekranida
 *    OLDINROQ chaqiriladi. Bu yerda ham xato otilsa, sotuvchi
 *    tushunarli xabar o'rniga «noma'lum o'zgaruvchi» degan texnik
 *    xatoni ko'rardi.
 */
export function tanlovQiymatlari(
  tanlovlar: readonly Tanlov[],
  tanlangan: Tanlangan,
): Qiymatlar {
  const natija: Record<string, number> = {};

  for (const t of tanlovlar) {
    if (t.kod === null) continue;
    const v = variantniTop(t, tanlangan);
    if (v === null || v.qiymat === null) continue;
    natija[t.kod] = v.qiymat;
  }

  return natija;
}

// ─── 2-daraja: narx ───────────────────────────────────────────────────────

/** Bitta tanlangan variant — narx va yozuv uchun */
export interface TanlovYuki {
  readonly tanlovId: number;
  readonly variantId: number;
  /** Snapshot: tanlov nomi tanlangan paytda qanday bo'lsa */
  readonly tanlovNomi: string;
  readonly variantNomi: string;
  /** So'mda; `null` — narxga tegmaydi */
  readonly narx: string | null;
}

/**
 * Tanlangan variantlarni buyurtmaga yoziladigan shaklga keltiradi.
 *
 * ⚠️ NOM SNAPSHOT bo'lib ketadi (2.3-invariant). Admin keyin
 *    variantni o'chirsa yoki nomini o'zgartirsa, eski buyurtmada
 *    o'sha kungi nom turadi — usta ham, chek ham o'shani ko'radi.
 */
export function tanlovYuki(
  tanlovlar: readonly Tanlov[],
  tanlangan: Tanlangan,
): TanlovYuki[] {
  const natija: TanlovYuki[] = [];

  for (const t of tanlovlar) {
    const v = variantniTop(t, tanlangan);
    if (v === null) continue;
    natija.push({
      tanlovId: t.id,
      variantId: v.id,
      tanlovNomi: t.nom,
      variantNomi: v.nom,
      narx: v.narx,
    });
  }

  return natija;
}

// ─── 1-daraja: ustaga boradigan yozuv ─────────────────────────────────────

/**
 * Ustaga va chekka chiqadigan matn: «Boshqaruv: o'ng · Kasseta: bor».
 *
 * ⚠️ TANLOV NOMI HAM YOZILADI, faqat variant emas. «O'ng» degan
 *    yolg'iz so'z ustaga hech narsa aytmaydi — o'ng tomoni nimaning?
 */
export function tanlovMatni(yuk: readonly TanlovYuki[]): string {
  return yuk.map((y) => `${y.tanlovNomi}: ${y.variantNomi}`).join(' · ');
}

// ─── Aksessuarni variantga bog'lash ───────────────────────────────────────

/**
 * Aksessuar shu tanlovda kerakmi.
 *
 * ⚠️ NEGA KERAK: motorli jalyuzida zanjir QO'SHILMAYDI, lekin kabel
 *    va quvvat manbai qo'shiladi. Qo'lda boshqariladiganda teskari.
 *    Ilgari buni ifodalash uchun ikki alohida tur qilinardi.
 *
 * ⚠️ `variantId` bo'sh aksessuar — HAR DOIM kerak (avvalgi xulq).
 *    Shu sababli mavjud aksessuarlarning birortasi ham o'zgarmaydi.
 */
export function aksessuarKeraklimi(
  aksessuarVariantId: number | null,
  tanlangan: Tanlangan,
): boolean {
  if (aksessuarVariantId === null) return true;
  return Object.values(tanlangan).includes(aksessuarVariantId);
}

// ─── Admin ekrani uchun tekshiruv ─────────────────────────────────────────

/**
 * Tanlov saqlashdan oldin mantiqanmi.
 *
 * ⚠️ Saqlashdan OLDIN aytiladi: noto'g'ri tanlovning sababi aks
 *    holda faqat birinchi mijoz oldida ma'lum bo'lardi.
 */
export function tanlovNuqsonlari(t: Tanlov): string[] {
  const xatolar: string[] = [];

  if (t.variantlar.length < 2) {
    xatolar.push(
      `«${t.nom}» — kamida ikkita variant kerak, aks holda tanlashning ma'nosi yo'q`,
    );
  }

  /**
   * ⚠️ Kod formulada o'zgaruvchi bo'lib ishlatiladi, shuning uchun
   *    `mahsulot_parametr` bilan BIR XIL shakl: `CHET`, `LAMEL_ENI`.
   *    Formula tahlilchisi faqat katta harf va apostrofni taniydi.
   */
  if (t.kod !== null && !/^[A-Z][A-Z0-9_']*$/.test(t.kod)) {
    xatolar.push(
      `«${t.kod}» — kod katta harf bilan boshlanib, faqat katta harf va raqamdan iborat bo'lsin (masalan LAMEL_ENI)`,
    );
  }

  /**
   * ⚠️ Kod berilgan, lekin birorta variantda son yo'q — formula
   *    «noma'lum o'zgaruvchi» xatosini beradi va sotuv TO'XTAYDI.
   *    Buni saqlash paytida ushlash shart.
   */
  if (t.kod !== null && t.variantlar.every((v) => v.qiymat === null)) {
    xatolar.push(
      `«${t.nom}» formulada ishlatiladi (${t.kod}), lekin birorta variantda son yo'q`,
    );
  }

  const nomlar = t.variantlar.map((v) => v.nom.trim().toLowerCase());
  if (new Set(nomlar).size !== nomlar.length) {
    xatolar.push(`«${t.nom}» — variant nomlari takrorlanmasin`);
  }

  return xatolar;
}

/**
 * Formulada ishlatilgan tanlov kodi haqiqatan mavjudmi.
 *
 * ⚠️ Admin `CEIL(ENI / LAMEL_ENI)` deb yozib, keyin «Lamel eni»
 *    tanlovini o'chirsa — formula buziladi va buni FAQAT sotuvchi
 *    mijoz oldida bilardi.
 */
export function yoqolganKodlar(
  ishlatilgan: readonly string[],
  tanlovlar: readonly Tanlov[],
  parametrKodlari: readonly string[],
): string[] {
  const BIRIKKAN = ['ENI', "BO'YI", 'MAYDON', 'SONI'];
  const mavjud = new Set<string>([
    ...BIRIKKAN,
    ...parametrKodlari,
    ...tanlovlar.map((t) => t.kod).filter((k): k is string => k !== null),
  ]);

  return ishlatilgan.filter((k) => !mavjud.has(k));
}

/** Tanlov qiymatlarini formulaga berishdan oldin — kod takrorlanmasin */
export function kodTakrorlanganmi(
  tanlovlar: readonly Tanlov[],
  parametrKodlari: readonly string[],
): string | null {
  const kodlar = [
    ...parametrKodlari,
    ...tanlovlar.map((t) => t.kod).filter((k): k is string => k !== null),
  ];

  const korilgan = new Set<string>();
  for (const k of kodlar) {
    if (korilgan.has(k)) return k;
    korilgan.add(k);
  }
  return null;
}

/**
 * Tanlov qiymatlari o'lchov o'zgaruvchilarini BOSIB KETMASIN.
 *
 * ⚠️ Admin tanlovga `ENI` degan kod qo'ysa, formula endi oynaning
 *    enini emas, tanlovning sonini olardi. Hamma hisob jimgina
 *    buzilardi.
 */
export function birikkanKodmi(kod: string): boolean {
  return ['ENI', "BO'YI", 'MAYDON', 'SONI'].includes(kod);
}

/** Kod noto'g'ri bo'lsa xato otadi — amal qatlamida ishlatiladi */
export function kodniTekshir(kod: string): void {
  if (birikkanKodmi(kod)) {
    throw new BiznesXato(
      'TANLOV_KODI_BAND',
      `«${kod}» — tizimning o'z o'zgaruvchisi, tanlovga boshqa kod bering`,
    );
  }
}
