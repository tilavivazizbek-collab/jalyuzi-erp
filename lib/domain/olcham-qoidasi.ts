/**
 * lib/domain/olcham-qoidasi.ts — OYNA o'lchamidan TAYYOR JALYUZI
 * o'lchamiga o'tish (0053).
 *
 * ⚠️ NEGA ALOHIDA MODUL
 *
 *    Zamerchi oynani o'lchaydi, tizim esa tayyor buyum o'lchamini
 *    kutadi. Ular hech qachon teng emas:
 *
 *      oyna USTIGA (devorga) → eni + 0.10, bo'yi + 0.15
 *      oyna ICHIGA (proyom)  → eni − 0.01, bo'yi − 0.01
 *      dikkey, poldan        → bo'yi − 0.02
 *
 *    ⚠️ ANIQLIK — BIR SANTIMETR. Tizimda o'lcham hamma joyda
 *       `numeric(_,2)`, shuning uchun qo'shimcha ham 2 xonagacha
 *       yaxlitlanadi. «Pol − 1.5 sm» 2 sm bo'lib yoziladi va
 *       EKRANDA HAM shunday ko'rinadi — raqam yashirincha
 *       o'zgarmasin.
 *
 *    Bu farq shu paytgacha SOTUVCHINING BOSHIDA hisoblanardi. U
 *    yerda tekshiruv ham, iz ham yo'q: ikki santimetr xato mato ham,
 *    mexanizm ham kesilgandan KEYIN bilinadi.
 *
 * ⚠️ BU MODUL BAZAGA TEGMAYDI va hisobning YAGONA joyi. Sotuv
 *    ekrani, ustaning ekrani, bot va server — hammasi shu
 *    funksiyani chaqiradi (CLAUDE.md §3 «bir mantiq — bir joyda»).
 *
 * ⚠️ NATIJA HAR DOIM YAXLITLANADI (2 xona). Aks holda 1.4 + 0.1
 *    ikkilik kasrda 1.5000000000000002 bo'lib chiqar va u
 *    `numeric(8,2)` ga yozilganda jimgina 1.50 ga aylanardi —
 *    ekranda bir raqam, bazada boshqa.
 */

import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

/** O'rnatish turi — «Oyna ustiga», «Proyomga», «Shiftga» */
export interface Ornatish {
  readonly id: number;
  readonly nom: string;
  /** Tayyor eni = oyna eni + shu son. Proyomda MANFIY */
  readonly eniQoshimchaM: number;
  readonly boyiQoshimchaM: number;
  readonly standartmi: boolean;
}

export interface Olcham {
  readonly eniM: number;
  readonly boyiM: number;
}

/** Pozitsiyaga yoziladigan snapshot (2.3-invariant) */
export interface OrnatishYuki {
  readonly ornatishId: number;
  readonly ornatishNom: string;
  readonly ornatishEniM: number;
  readonly ornatishBoyiM: number;
}

// ─── Tanlash ──────────────────────────────────────────────────────────────

/**
 * Sotuv ekrani qaysi o'rnatish turi bilan ochiladi.
 *
 * ⚠️ Standart belgilanmagan bo'lsa BIRINCHISI olinadi, `null` EMAS:
 *    bo'sh dropdown bilan ochilsa sotuvchi uni tanlashni unutar va
 *    oyna o'lchami tayyor o'lcham bo'lib ketardi — ya'ni xato
 *    aynan biz tuzatmoqchi bo'lgan joyda qaytadan paydo bo'lardi.
 *
 * ⚠️ Ro'yxat bo'sh bo'lsa `null` — bu TUR QOIDASIZ degani, xato
 *    emas. Bunday turda sotuvchi tayyor o'lchamni o'zi yozadi
 *    (eski xulq to'liq saqlanadi).
 */
export function standartOrnatish(royxat: readonly Ornatish[]): Ornatish | null {
  return royxat.find((o) => o.standartmi) ?? royxat[0] ?? null;
}

export function ornatishniTop(
  royxat: readonly Ornatish[],
  id: number | null,
): Ornatish | null {
  if (id === null) return null;
  return royxat.find((o) => o.id === id) ?? null;
}

// ─── Hisob ────────────────────────────────────────────────────────────────

/**
 * OYNA o'lchamidan TAYYOR o'lcham.
 *
 * ⚠️ `ornatish` `null` bo'lsa o'lcham O'ZGARMAY qaytadi. Ya'ni
 *    qoidasi yo'q tur avvalgidek ishlaydi va bu funksiyani
 *    shartsiz chaqirsa bo'ladi — chaqiruvchi joylarda `if` yozish
 *    kerak emas (har `if` — kimningdir unutadigan joyi).
 */
export function tayyorOlcham(oyna: Olcham, ornatish: Ornatish | null): Olcham {
  if (!Number.isFinite(oyna.eniM) || !Number.isFinite(oyna.boyiM)) {
    throw new BiznesXato('OLCHAM_NOTOGRI', "o'lcham son bo'lsin");
  }
  if (ornatish === null) {
    return {
      eniM: yaxlit(oyna.eniM),
      boyiM: yaxlit(oyna.boyiM),
    };
  }

  /**
   * ⚠️ QO'SHIMCHA HAM YAXLITLANADI (1 sm).
   *
   *    Tizimda o'lcham hamma joyda `numeric(_,2)` — ya'ni aniqlik
   *    BIR SANTIMETR. Kimdir «pol − 1.5 sm» deb 0.015 yozsa,
   *    ekranda −0.01 ko'rinib, bazaga −0.02 tushardi: bir xil
   *    qoida ikki xil raqam. Shuning uchun qo'shimcha kirishda
   *    darhol bazaning aniqligiga keltiriladi — nima ko'rsangiz,
   *    o'sha saqlanadi.
   */
  const eni = new Decimal(oyna.eniM).plus(yaxlit(ornatish.eniQoshimchaM));
  const boyi = new Decimal(oyna.boyiM).plus(yaxlit(ornatish.boyiQoshimchaM));

  /**
   * ⚠️ NOLGA TUSHIB KETISHI MUMKIN: 0.20 m li kichkina oynaga
   *    «proyomga −0.30» qoidasi qo'llansa manfiy chiqadi. Bunday
   *    o'lcham bilan buyurtma davom etsa, keyingi hisoblarning
   *    hammasi ma'nosiz bo'lardi — shu yerda to'xtatiladi.
   */
  if (eni.lessThanOrEqualTo(0) || boyi.lessThanOrEqualTo(0)) {
    throw new BiznesXato(
      'OLCHAM_NOTOGRI',
      `«${ornatish.nom}» qoidasi bilan tayyor o'lcham noldan kichik chiqdi — ` +
        'oyna o\'lchamini yoki o\'rnatish turini tekshiring',
    );
  }

  return { eniM: yaxlit(eni.toNumber()), boyiM: yaxlit(boyi.toNumber()) };
}

/**
 * Teskari hisob: TAYYOR o'lchamdan OYNA o'lchami.
 *
 * ⚠️ Eski buyurtmalarni ko'rsatish uchun EMAS — ularda oyna
 *    o'lchami yo'q va bo'lmagan ma'lumotni «tiklash» yolg'on
 *    bo'lardi. Bu faqat sotuvchi tayyor o'lchamni QO'LDA yozgan
 *    holatda kerak: shunda oyna katagi ham to'ldirilib turadi va
 *    ikki katak bir-biriga zid ko'rinmaydi.
 */
export function oynaOlchami(tayyor: Olcham, ornatish: Ornatish | null): Olcham {
  if (ornatish === null) return { eniM: yaxlit(tayyor.eniM), boyiM: yaxlit(tayyor.boyiM) };
  return {
    eniM: yaxlit(new Decimal(tayyor.eniM).minus(yaxlit(ornatish.eniQoshimchaM)).toNumber()),
    boyiM: yaxlit(new Decimal(tayyor.boyiM).minus(yaxlit(ornatish.boyiQoshimchaM)).toNumber()),
  };
}

// ─── Ko'rsatish ───────────────────────────────────────────────────────────

/** «+0.10 × +0.15» — dropdownda nom yonida turadi */
export function qoshimchaMatni(o: Ornatish): string {
  return `${belgili(o.eniQoshimchaM)} × ${belgili(o.boyiQoshimchaM)}`;
}

/**
 * «Oyna 1.50 × 2.00 → tayyor 1.60 × 2.15 (Oyna ustiga)»
 *
 * ⚠️ IKKALA o'lcham ham ko'rinadi. Usta ish varag'ida faqat tayyor
 *    o'lchamni ko'rsa, «oyna qancha edi?» degan savolni tekshirib
 *    bo'lmasdi — xato esa aynan shu ikkisining orasida tug'iladi.
 */
export function olchamMatni(
  oyna: Olcham | null,
  tayyor: Olcham,
  ornatishNom: string | null,
): string {
  const t = `${raqam(tayyor.eniM)} × ${raqam(tayyor.boyiM)} m`;
  if (oyna === null) return t;
  const nom = ornatishNom === null || ornatishNom === '' ? '' : ` (${ornatishNom})`;
  return `oyna ${raqam(oyna.eniM)} × ${raqam(oyna.boyiM)} → tayyor ${t}${nom}`;
}

/**
 * Pozitsiyaga yoziladigan snapshot.
 *
 * ⚠️ Nom ham, IKKALA QO'SHIMCHA ham qotadi. Faqat `ornatish_id`
 *    saqlansa, ertaga qoida tahrirlangach eski buyurtmaning
 *    o'lchami tushuntirib bo'lmaydigan bo'lib qolardi.
 */
export function ornatishYuki(o: Ornatish | null): OrnatishYuki | null {
  if (o === null) return null;
  return {
    ornatishId: o.id,
    ornatishNom: o.nom,
    /** ⚠️ Hisobdagi bilan BIR XIL yaxlitlash — aks holda snapshot
     *    haqiqatda qo'llangan qoidani emas, boshqa raqamni saqlardi */
    ornatishEniM: yaxlit(o.eniQoshimchaM),
    ornatishBoyiM: yaxlit(o.boyiQoshimchaM),
  };
}

// ─── Nuqsonlar ────────────────────────────────────────────────────────────

/**
 * Turni saqlashdan oldingi tekshiruv — 4.5 dagi formula tekshiruvi
 * bilan bir xil naqsh: xato bo'lsa saqlanmaydi.
 */
export function ornatishNuqsonlari(royxat: readonly Ornatish[]): readonly string[] {
  const n: string[] = [];

  const nomlar = new Set<string>();
  for (const o of royxat) {
    const nom = o.nom.trim().toLowerCase();
    if (nom === '') {
      n.push("O'rnatish turining nomi bo'sh");
      continue;
    }
    if (nomlar.has(nom)) n.push(`«${o.nom.trim()}» ikki marta yozilgan`);
    nomlar.add(nom);

    if (!Number.isFinite(o.eniQoshimchaM) || !Number.isFinite(o.boyiQoshimchaM)) {
      n.push(`«${o.nom.trim()}» qo'shimchasi son emas`);
    }
  }

  /**
   * ⚠️ Bazada ham UNIQUE indeks bor (§9.4 — server qayta tekshiradi).
   *    Bu yerdagisi esa egasiga TUSHUNARLI xabar berish uchun:
   *    baza xatosi «duplicate key value violates unique constraint»
   *    deb chiqadi va undan hech narsa tushunib bo'lmaydi.
   */
  if (royxat.filter((o) => o.standartmi).length > 1) {
    n.push("Faqat BITTA o'rnatish turi standart bo'lishi mumkin");
  }

  return n;
}

// ─── Yordamchilar ─────────────────────────────────────────────────────────

function yaxlit(x: number): number {
  return new Decimal(x).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

function raqam(x: number): string {
  return x.toFixed(2);
}

/**
 * «+0.10», «−0.02», «0» — belgisi ko'rinib tursin.
 *
 * ⚠️ `yaxlit` dan o'tadi: ekranda ko'rinadigan raqam bazaga
 *    tushadigan raqam bilan BIR XIL bo'lishi shart. JS ning
 *    `toFixed` i 0.015 ni pastga, Postgres esa yuqoriga yaxlitlaydi.
 */
function belgili(xom: number): string {
  const x = yaxlit(xom);
  if (x === 0) return '0';
  return x > 0 ? `+${x.toFixed(2)}` : `−${Math.abs(x).toFixed(2)}`;
}
