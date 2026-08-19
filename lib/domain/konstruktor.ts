/**
 * lib/domain/konstruktor.ts — TZ 4 · 3.3 · 5.6 · 5.7
 *
 * Mahsulot turi konstruktori: slotlar, parametrlar, aksessuar komplekti.
 * Bazaga tegmaydi (QISM 1 §5.1).
 *
 * «Admin dasturchisiz yangi mahsulot turi yarata oladi» (4.1) — shuning
 * uchun bu yerdagi tekshiruvlar admin xatosini o'sha ekranda ushlashi kerak,
 * mijoz oldida emas.
 */

import { formulaOzgaruvchilari, formulaTekshir, STANDART_OZGARUVCHILAR } from '@/lib/domain/formula';
import { BiznesXato } from '@/lib/xato';

// ─── 4.3 · Mahsulot parametrlari ──────────────────────────────────────────

export interface Parametr {
  readonly nom: string;
  /** Qiymat santimetrda (5.3 — barcha uzunlik smda) */
  readonly qiymat: number;
}

// ─── 4.4 · Mato slotlari ──────────────────────────────────────────────────

export interface Slot {
  readonly id: number;
  readonly nom: string;
  readonly formula: string;
  /** 4.4 — majburiy yoki ixtiyoriy */
  readonly majburiy: boolean;
  readonly tartib: number;
  /**
   * QISM 3 §2.5 — slot MATERIALGA emas, ALMASHTIRISH GURUHIGA bog'lanadi.
   * TZ 5.6: «mexanizm bosilganda kronshteyn chiqmaydi».
   */
  readonly almashtirishGuruhId: number | null;
}

// ─── 4.6 · Aksessuar komplekti ────────────────────────────────────────────

export interface KomplektQatori {
  readonly materialId: number;
  readonly nom: string;
  /**
   * TZ 4.6 ekranida ikki rejim ko'rinadi («soni yoki formula»), lekin
   * ikkalasi ham SHU BITTA maydonga yoziladi — `'4'` ham yaroqli formula.
   * QISM 3 §2.7 shunday saqlaydi, ikki nusxa bo'lmaydi.
   */
  readonly formula: string;
  readonly majburiy: boolean;
}

export interface MahsulotTuri {
  readonly id: number;
  readonly nom: string;
  readonly parametrlar: readonly Parametr[];
  readonly slotlar: readonly Slot[];
  readonly komplekt: readonly KomplektQatori[];
  readonly xizmatHaqiSoni: number | null;
  readonly faol: boolean;
}

// ─── 4.5 · Formula tekshiruvi ─────────────────────────────────────────────

export type KonstruktorNuqsoni =
  | { readonly tur: 'FORMULA_XATO'; readonly slot: string; readonly xato: string }
  | { readonly tur: 'NOMALUM_PARAMETR'; readonly slot: string; readonly nomlar: readonly string[] }
  | { readonly tur: 'SLOT_YOQ' }
  | { readonly tur: 'NOM_TAKRORLANGAN'; readonly nom: string }
  | { readonly tur: 'PARAMETR_TAKRORLANGAN'; readonly nom: string }
  | { readonly tur: 'KOMPLEKT_QATORI_BOSH'; readonly nom: string }
  /** Slotga almashtirish guruhi biriktirilmagan — sotuvda bo'sh dropdown chiqadi */
  | { readonly tur: 'SLOT_GURUHSIZ'; readonly nom: string };

export interface KonstruktorTekshiruvi {
  readonly saqlansinmi: boolean;
  readonly nuqsonlar: readonly KonstruktorNuqsoni[];
}

/** Formulada ishlatish mumkin bo'lgan nomlar: standart + shu turning parametrlari. */
export function ruxsatEtilganNomlar(parametrlar: readonly Parametr[]): string[] {
  return [...STANDART_OZGARUVCHILAR, ...parametrlar.map((p) => p.nom.toUpperCase())];
}

/**
 * TZ 4.5 — «Formula kiritilganda darhol tekshiriladi, xato bo'lsa saqlanmaydi.»
 * TZ 4.8 — test kalkulyatori saqlashdan OLDIN ishlaydi.
 */
export function konstruktorTekshir(t: MahsulotTuri): KonstruktorTekshiruvi {
  const nuqsonlar: KonstruktorNuqsoni[] = [];
  const nomlar = ruxsatEtilganNomlar(t.parametrlar);

  // 4.4 — matosiz mahsulot turi sotuvda ishlamaydi
  if (t.slotlar.length === 0) {
    nuqsonlar.push({ tur: 'SLOT_YOQ' });
  }

  const korilganSlot = new Set<string>();
  for (const slot of t.slotlar) {
    const kalit = slot.nom.trim().toLowerCase();
    if (korilganSlot.has(kalit)) {
      nuqsonlar.push({ tur: 'NOM_TAKRORLANGAN', nom: slot.nom });
    }
    korilganSlot.add(kalit);

    // TZ 5.6, 5.9 — guruhsiz slot sotuvda BO'SH dropdown beradi va muammo
    // mijoz oldida ma'lum bo'ladi. Uni admin ekranida ushlaymiz.
    if (slot.almashtirishGuruhId === null) {
      nuqsonlar.push({ tur: 'SLOT_GURUHSIZ', nom: slot.nom });
    }

    const natija = formulaTekshir(slot.formula, nomlar);
    if (natija.nomalum.length > 0) {
      nuqsonlar.push({ tur: 'NOMALUM_PARAMETR', slot: slot.nom, nomlar: natija.nomalum });
    } else if (!natija.yaroqli) {
      nuqsonlar.push({
        tur: 'FORMULA_XATO',
        slot: slot.nom,
        xato: natija.xato ?? 'formula xato',
      });
    }
  }

  const korilganParametr = new Set<string>();
  for (const p of t.parametrlar) {
    const kalit = p.nom.trim().toUpperCase();
    if (korilganParametr.has(kalit)) {
      nuqsonlar.push({ tur: 'PARAMETR_TAKRORLANGAN', nom: p.nom });
    }
    korilganParametr.add(kalit);
  }

  // 4.6 — komplekt qatori. Statik son ham formula: `'4'` yaroqli (QISM 3 §2.7)
  for (const q of t.komplekt) {
    if (q.formula.trim() === '') {
      nuqsonlar.push({ tur: 'KOMPLEKT_QATORI_BOSH', nom: q.nom });
      continue;
    }
    const natija = formulaTekshir(q.formula, nomlar);
    if (!natija.yaroqli) {
      nuqsonlar.push({
        tur: 'FORMULA_XATO',
        slot: q.nom,
        xato: natija.xato ?? 'formula xato',
      });
    }
  }

  return { saqlansinmi: nuqsonlar.length === 0, nuqsonlar };
}

// ─── 4.3 · Parametrni o'chirish ───────────────────────────────────────────

export interface ParametrIshlatilishi {
  readonly nom: string;
  /** Qaysi slot va komplekt qatorlarida ishlatilyapti */
  readonly joylar: readonly string[];
}

/**
 * TZ 4.3 — «Formulada ishlatilayotgan parametrni o'chirish bloklanadi,
 * sababi ko'rsatiladi: `CHET` 2 ta formulada ishlatilmoqda.»
 */
export function parametrIshlatilishi(t: MahsulotTuri, nom: string): ParametrIshlatilishi {
  const izlanayotgan = nom.trim().toUpperCase();
  const joylar: string[] = [];

  const qara = (formula: string | null, joy: string): void => {
    if (formula === null || formula.trim() === '') return;
    try {
      if (formulaOzgaruvchilari(formula).includes(izlanayotgan)) {
        joylar.push(joy);
      }
    } catch {
      // Formulasi buzuq qator alohida nuqson sifatida ko'rsatiladi
    }
  };

  for (const s of t.slotlar) qara(s.formula, s.nom);
  for (const q of t.komplekt) qara(q.formula, q.nom);

  return { nom: izlanayotgan, joylar };
}

export function parametrOchirilsinmi(t: MahsulotTuri, nom: string): boolean {
  return parametrIshlatilishi(t, nom).joylar.length === 0;
}

/**
 * TZ 4.4 — «Bog'langan materiali bor slotni o'chirish bloklanadi,
 * avval materiallarni boshqa slotga ko'chirish kerak.»
 */
export function slotOchirilsinmi(boglanganMaterialSoni: number): boolean {
  return boglanganMaterialSoni === 0;
}

// ─── 3.3 · Sotuv ekranidagi slot qatorlari ────────────────────────────────

/**
 * TZ 3.3 — «Har slot qatorida faqat o'sha slotga bog'langan matolar chiqadi.»
 * Ya'ni "Orqa mato" qatorida to'r matolar ko'rinmaydi va sotuvchi adashib
 * qo'ya olmaydi (5.7).
 */
export function slotMateriallari<
  T extends { readonly almashtirishGuruhId: number | null; readonly faol: boolean },
>(slot: Slot, barchaMateriallar: readonly T[]): T[] {
  // Slotga guruh biriktirilmagan bo'lsa hech narsa chiqmaydi — bo'sh
  // dropdown mijoz oldida emas, admin ekranida ko'rinishi kerak (5.9).
  if (slot.almashtirishGuruhId === null) return [];

  return barchaMateriallar.filter(
    (m) => m.faol && m.almashtirishGuruhId === slot.almashtirishGuruhId,
  );
}

/** Sotuv ekranida slotlar tartib bo'yicha chiqadi (4.4). */
export function slotlarTartibda(t: MahsulotTuri): Slot[] {
  return [...t.slotlar].sort((a, b) => a.tartib - b.tartib || a.id - b.id);
}

// ─── 4.9 · Stavka ogohlantirishi ──────────────────────────────────────────

/**
 * TZ 4.9 — «Yangi tur yaratilgach ishlab chiqaruvchilarning bu turga stavkasi
 * 0 bo'lib qoladi. Tizim ogohlantiradi — aks holda usta bu mahsulotni yasab
 * haq olmaydi.»
 */
export function stavkasizUstalar<T extends { readonly xodimId: number; readonly stavkaBormi: boolean }>(
  ustalar: readonly T[],
): T[] {
  return ustalar.filter((u) => !u.stavkaBormi);
}

// ─── 4.10 · Keyin tahrirlash ──────────────────────────────────────────────

/**
 * TZ 4.10 va 2.3-invariant — «Tur tahrirlansa eski buyurtmalar o'zgarmaydi.
 * Tasdiqlangan, lekin hali kesilmagan buyurtmalar HAM eski formula bo'yicha
 * yechiladi.»
 *
 * Sabab: narx eski formula bo'yicha hisoblangan; sarf yangisi bo'yicha bo'lsa
 * ikkisi bir-biriga mos kelmaydi.
 */
export function qaysiFormulaIshlaydi(
  snapshotFormula: string | null,
  joriyFormula: string,
): string {
  return snapshotFormula ?? joriyFormula;
}

/** Saqlashdan oldin tekshiruvni majburlaydi (4.5). */
export function saqlashniTalabQil(t: MahsulotTuri): void {
  const natija = konstruktorTekshir(t);
  if (!natija.saqlansinmi) {
    const birinchi = natija.nuqsonlar[0];
    throw new BiznesXato('KONSTRUKTOR_XATO', birinchi === undefined ? '' : birinchi.tur);
  }
}
