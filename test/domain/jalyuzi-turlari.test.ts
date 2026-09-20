/**
 * test/domain/jalyuzi-turlari.test.ts — docs/JALYUZI-TURLARI.md ning qo'riqchisi
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Sarf formulalari kodda emas — ular `mahsulot_slot.formula` ustunida,
 * admin qo'lda yozadi. Ya'ni `tsc` ham, boshqa testlar ham ularni
 * KO'RMAYDI: xato formula faqat sotuv ekranida, mijoz oldida chiqadi.
 *
 * Bu test `docs/JALYUZI-TURLARI.md` da tavsiya qilingan har bir formulani
 * dvigatelda haqiqatan yurgizadi. Hujjat va dvigatel bir-biridan
 * uzoqlashsa — shu yerda qizil bo'ladi, do'konda emas.
 *
 * ⚠️ Hujjatdagi RAQAMLAR ([Taxmin]) bu yerda tekshirilmaydi — ular
 *    ta'minotchi ma'lumoti bilan o'zgaradi. Tekshiriladigan narsa —
 *    formulaning TUZILISHI va chekka o'lchamlarda yiqilmasligi.
 */

import { describe, expect, it } from 'vitest';
import { formulaTekshir, slotSarfi, standartQiymatlar } from '@/lib/domain/formula';
import { kesimOlchami } from '@/lib/domain/kesish';
import { m, type SarflashBirligi } from '@/lib/domain/birlik';

interface SlotQatori {
  readonly tur: string;
  readonly slot: string;
  readonly birlik: SarflashBirligi;
  readonly formula: string;
  readonly koeff: number;
  readonly yonalish: 'ENIGA' | "BO'YIGA";
}

/** Hujjatdagi mahsulot parametrlari — `mahsulot_parametr` jadvalining o'rnida */
const PARAMETRLAR = { QADAM: 2.2, LAMEL_ENI: 8.9, BURMA: 25 } as const;

/** docs/JALYUZI-TURLARI.md §3–§9 */
const QATORLAR: readonly SlotQatori[] = [
  { tur: 'RULON', slot: 'Mato', birlik: 'KV_M', formula: 'MAYDON', koeff: 1.12, yonalish: "BO'YIGA" },
  { tur: 'RULON', slot: 'Val', birlik: 'M', formula: 'MAX(40, ENI - 2)', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'RULON', slot: 'Pastki planka', birlik: 'M', formula: 'MAX(20, ENI - 2)', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'RULON', slot: 'Zanjir', birlik: 'M', formula: "BO'YI * 2 + 30", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'RULON', slot: 'Kronshteyn', birlik: 'DONA', formula: '2', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'RULON', slot: 'Kronshteyn (keng)', birlik: 'DONA', formula: 'MAX(2, CEIL(ENI / 125))', koeff: 1, yonalish: 'ENIGA' },

  { tur: 'KUN-TUN', slot: 'Mato', birlik: 'KV_M', formula: 'MAYDON', koeff: 2.1, yonalish: "BO'YIGA" },

  { tur: 'VERTIKAL', slot: 'Lamel', birlik: 'KV_M', formula: 'MAYDON', koeff: 1.05, yonalish: "BO'YIGA" },
  { tur: 'VERTIKAL', slot: 'Karniz', birlik: 'M', formula: 'ENI + 2', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'VERTIKAL', slot: 'Begunok', birlik: 'DONA', formula: 'CEIL(ENI / LAMEL_ENI)', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'VERTIKAL', slot: 'Ryzeg', birlik: 'DONA', formula: 'CEIL(ENI / LAMEL_ENI)', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'VERTIKAL', slot: 'Pastki zanjircha', birlik: 'M', formula: 'ENI + 10', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'VERTIKAL', slot: 'Zanjir', birlik: 'M', formula: "BO'YI * 2 + 25", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'VERTIKAL', slot: 'Kronshteyn', birlik: 'DONA', formula: 'MAX(2, CEIL(ENI / 150))', koeff: 1, yonalish: 'ENIGA' },

  { tur: 'GORIZONTAL', slot: 'Lamel', birlik: 'M', formula: "CEIL(BO'YI / QADAM) * ENI", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'GORIZONTAL', slot: 'Lamel (dona)', birlik: 'DONA', formula: "CEIL(BO'YI / QADAM)", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'GORIZONTAL', slot: 'Karniz', birlik: 'M', formula: 'ENI', koeff: 1, yonalish: 'ENIGA' },
  { tur: 'GORIZONTAL', slot: 'Ip-lesa', birlik: 'M', formula: "CEIL(ENI / 60) * (BO'YI + 20)", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'GORIZONTAL', slot: "Ko'taruvchi ip", birlik: 'M', formula: "CEIL(ENI / 60) * (BO'YI * 2 + ENI)", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'GORIZONTAL', slot: 'Kronshteyn', birlik: 'DONA', formula: 'MAX(2, CEIL(ENI / 100))', koeff: 1, yonalish: 'ENIGA' },

  { tur: 'PLISSE', slot: 'Mato', birlik: 'KV_M', formula: 'MAYDON', koeff: 1.06, yonalish: "BO'YIGA" },
  { tur: 'PLISSE', slot: 'Yon profil', birlik: 'M', formula: "(BO'YI + 2) * 2", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'PLISSE', slot: 'Ip', birlik: 'M', formula: "CEIL(ENI / 50) * (BO'YI * 2 + 20)", koeff: 1, yonalish: 'ENIGA' },

  { tur: 'UYALI', slot: 'Mato', birlik: 'KV_M', formula: 'MAYDON', koeff: 1.1, yonalish: "BO'YIGA" },

  { tur: 'RIM', slot: 'Mato', birlik: 'KV_M', formula: 'MAYDON', koeff: 1.18, yonalish: "BO'YIGA" },
  { tur: 'RIM', slot: 'Reyka', birlik: 'M', formula: "CEIL(BO'YI / BURMA) * ENI", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'RIM', slot: 'Halqa', birlik: 'DONA', formula: "CEIL(BO'YI / BURMA) * 3", koeff: 1, yonalish: 'ENIGA' },
  { tur: 'RIM', slot: "Ko'taruvchi ip", birlik: 'M', formula: "(BO'YI * 2 + ENI) * 3", koeff: 1, yonalish: 'ENIGA' },
];

/** Chekka holatlar — har biri formulani sindirishga urinadi */
const OLCHAMLAR: ReadonlyArray<readonly [number, number, string]> = [
  [180, 220, 'odatiy'],
  [40, 50, 'juda kichik'],
  [1, 1, 'chegara — 1 sm'],
  [500, 350, 'juda katta'],
  [180.5, 220.5, 'kasr o\'lcham'],
];

const parametrNomlari = Object.keys(PARAMETRLAR);

describe('hujjatdagi formulalar dvigatelda yaroqli', () => {
  it.each(QATORLAR.map((q) => [`${q.tur} · ${q.slot}`, q] as const))(
    '%s',
    (_nom, q) => {
      const natija = formulaTekshir(q.formula, parametrNomlari);
      expect(natija.xato, `«${q.formula}»`).toBeUndefined();
      expect(natija.yaroqli).toBe(true);
    },
  );
});

describe('chekka o\'lchamlarda yiqilmaydi', () => {
  it.each(OLCHAMLAR.map(([e, b, izoh]) => [`${String(e)}×${String(b)} — ${izoh}`, e, b] as const))(
    '%s',
    (_nom, eni, boyi) => {
      const asos = standartQiymatlar(m(eni), m(boyi), 1, PARAMETRLAR);

      for (const q of QATORLAR) {
        const miqdor = slotSarfi(q.formula, asos, q.birlik, q.koeff);

        // Sarf musbat bo'lishi shart — `pozitsiya_material_miqdor` cheklovi
        // bazada ham `> 0` talab qiladi (lib/db/schema/buyurtma.ts).
        expect(miqdor, `${q.tur}/${q.slot} «${q.formula}»`).toBeGreaterThan(0);
        expect(Number.isFinite(miqdor)).toBe(true);

        // Mato uchun kesim to'rtburchagi ham chiqishi kerak
        if (q.birlik === 'KV_M') {
          const olcham = kesimOlchami(miqdor, boyi, {
            koeffitsient: q.koeff,
            yonalish: q.yonalish,
          });
          expect(olcham.eniM).toBeGreaterThan(0);
          expect(olcham.boyiM).toBeGreaterThan(0);
        }
      }
    },
  );

  it('DONA sarfi butun songa yaxlitlanadi — yarim kronshteyn bo\'lmaydi', () => {
    const asos = standartQiymatlar(m(2.6), m(2.2), 1, PARAMETRLAR);
    for (const q of QATORLAR.filter((x) => x.birlik === 'DONA')) {
      const miqdor = slotSarfi(q.formula, asos, q.birlik, q.koeff);
      expect(Number.isInteger(miqdor), `${q.tur}/${q.slot}`).toBe(true);
    }
  });
});

/**
 * ⚠️ BU YERDA TAKRORLANMAYDI (§2.2 — bir formula ikki joyda bo'lmasin):
 *
 *   `ENIGA` / `BO'YIGA` yo'nalishi  → test/domain/audit-sarf.test.ts:128
 *   `soniUchun` jami sarfi           → test/domain/audit-sarf.test.ts:309
 *   `CEIL`/`MIN`/`MAX` funksiyalari  → test/domain/formula.test.ts:139
 *
 * Quyidagi tekshiruv esa hech qayerda yo'q edi: koeffitsient FAQAT
 * `KV_M` ga qo'llanadi (`slotSarfi`), `SM` va `DONA` da jimgina
 * tashlanadi. Bu ataylab qilingan, lekin sinalmagani uchun bir kun
 * «tuzatib» qo'yilishi mumkin edi.
 */
describe('slotSarfi — koeffitsient qaysi birlikka tegadi', () => {
  const asos = standartQiymatlar(m(2), m(1), 1, PARAMETRLAR);

  it('KV_M — koeffitsientga ko\'paytiriladi', () => {
    // 2.00 × 1.00 = 2 kv.m; × 1.5 = 3
    expect(slotSarfi('MAYDON', asos, 'KV_M', 1.5)).toBeCloseTo(3, 4);
  });

  it('M — koeffitsient E\'TIBORSIZ qoladi', () => {
    expect(slotSarfi('ENI', asos, 'M', 1.5)).toBe(2);
  });

  it('DONA — koeffitsient E\'TIBORSIZ qoladi', () => {
    expect(slotSarfi('2', asos, 'DONA', 1.5)).toBe(2);
  });

  it('koeffitsient bo\'sh yoki noto\'g\'ri bo\'lsa asos qaytadi', () => {
    expect(slotSarfi('MAYDON', asos, 'KV_M', null)).toBeCloseTo(2, 4);
    expect(slotSarfi('MAYDON', asos, 'KV_M', 0)).toBeCloseTo(2, 4);
    expect(slotSarfi('MAYDON', asos, 'KV_M', -3)).toBeCloseTo(2, 4);
  });
});
