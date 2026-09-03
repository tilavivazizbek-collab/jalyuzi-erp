/**
 * lib/domain/hisobot/muzlagan-pul.ts — TZ 11.7.6
 *
 * «Uch joyda pul o'lik yotadi va alohida hech kim sanamaydi»:
 *
 *   Ostatkalar                  7.4  — bo'laklar soni va tannarx qiymati
 *   Sotilmagan tayyor mahsulot  7.12
 *   Uzoq qimirlamagan material  6 oydan beri harakat bo'lmaganlar
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ UCH BO'LAK KESISHMASLIGI SHART.                                       │
 * │                                                                       │
 * │ Ostatka ham materialning qoldig'i ichida turadi. Agar material 6 oy   │
 * │ qimirlamagan bo'lsa, uning ostatkalari IKKALA bo'lakka ham tushadi    │
 * │ va jami summa haqiqatdan katta chiqadi. Bu 12.1 dagi «bir xil pul     │
 * │ ikki marta hisoblanadi» xatosining ombordagi ko'rinishi.              │
 * │                                                                       │
 * │ Shuning uchun `qimirlamagan` qiymati OSTATKASIZ kelishi kerak         │
 * │ (`ostatkasizQoldiq` shu ish uchun). Funksiya buni tekshiradi: bir     │
 * │ material ikkala ro'yxatda uchrasa `kesishgan` da qaytadi.             │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import Decimal from 'decimal.js';
import {
  type Som,
  ayir,
  kichikmi,
  nisbat,
  nolSom,
  nolmi,
  qosh,
  som,
  yigindi,
} from '@/lib/domain/pul';

/** «Uzoq qimirlamagan» chegarasi — TZ 11.7.6. */
export const QIMIRLAMAGAN_OY = 6;

export interface OstatkaQatori {
  readonly bolakId: number;
  readonly materialId: number;
  readonly materialNom: string;
  readonly qiymat: Som;
}

export interface TayyorMahsulotQatori {
  readonly buyurtmaId: number;
  readonly raqam: string;
  readonly mijozNom: string;
  readonly qiymat: Som;
  /** Tayyor bo'lganidan beri necha kun kutdi — HISOBOTLAR-ISH §5.1 №18 bilan bir manba */
  readonly kutganKun: number;
}

export interface QimirlamaganQatori {
  readonly materialId: number;
  readonly nom: string;
  /** ⚠️ Ostatkalar AYIRILGAN qoldiq qiymati */
  readonly qiymat: Som;
  /** Oxirgi harakat sanasi. `null` — umuman harakat bo'lmagan */
  readonly oxirgiHarakat: Date | null;
}

export interface MuzlaganBolak {
  readonly qiymat: Som;
  readonly soni: number;
  /** Jamidagi ulushi, foizda — donut chart uchun (HISOBOTLAR-ISH §3.2) */
  readonly ulushFoiz: number;
}

export interface MuzlaganPul {
  readonly ostatkalar: MuzlaganBolak;
  readonly tayyorMahsulot: MuzlaganBolak;
  readonly qimirlamagan: MuzlaganBolak;
  readonly jami: Som;
  /**
   * Ikkala ro'yxatda uchragan material id lari. Bo'sh bo'lishi KERAK;
   * bo'sh bo'lmasa — qimirlamagan qiymatidan ostatka ayirilmagan va
   * jami summa oshib ketgan.
   */
  readonly kesishgan: readonly number[];
}

const foizga = (qism: Som, jami: Som): number =>
  nolmi(jami) ? 0 : nisbat(qism, jami).times(100).toDecimalPlaces(1).toNumber();

/**
 * Uch manbadagi o'lik pulni bitta jadvalga yig'adi.
 *
 * Sana bo'yicha filtr (6 oy) chaqiruvchida bajariladi — u SQL da indeks
 * bilan tez ishlaydi. Bu yerda `oxirgiHarakat` faqat ko'rsatish uchun.
 */
export function muzlaganPul(kirish: {
  readonly ostatkalar: readonly OstatkaQatori[];
  readonly tayyorMahsulot: readonly TayyorMahsulotQatori[];
  readonly qimirlamagan: readonly QimirlamaganQatori[];
}): MuzlaganPul {
  const ostatkaSummasi = yigindi(
    nolSom(),
    kirish.ostatkalar.map((q) => q.qiymat),
  );
  const tayyorSummasi = yigindi(
    nolSom(),
    kirish.tayyorMahsulot.map((q) => q.qiymat),
  );
  const qimirlamaganSummasi = yigindi(
    nolSom(),
    kirish.qimirlamagan.map((q) => q.qiymat),
  );

  const jami = qosh(qosh(ostatkaSummasi, tayyorSummasi), qimirlamaganSummasi);

  const ostatkaMateriallari = new Set(kirish.ostatkalar.map((q) => q.materialId));
  const kesishgan = [
    ...new Set(
      kirish.qimirlamagan
        .filter((q) => ostatkaMateriallari.has(q.materialId))
        .map((q) => q.materialId),
    ),
  ];

  const bolak = (qiymat: Som, soni: number): MuzlaganBolak => ({
    qiymat,
    soni,
    ulushFoiz: foizga(qiymat, jami),
  });

  return {
    ostatkalar: bolak(ostatkaSummasi, kirish.ostatkalar.length),
    tayyorMahsulot: bolak(tayyorSummasi, kirish.tayyorMahsulot.length),
    qimirlamagan: bolak(qimirlamaganSummasi, kirish.qimirlamagan.length),
    jami,
    kesishgan,
  };
}

/**
 * Materialning qoldiq qiymatidan ostatka qiymatini ayiradi.
 *
 * Chaqiruvchi buni `qimirlamagan` ro'yxatini yasashda ishlatadi — shunda
 * `kesishgan` bo'sh qoladi va jami summa to'g'ri chiqadi.
 *
 * Ostatka qoldiqdan katta bo'lib qolsa (sanash xatosi) nol qaytadi:
 * manfiy «muzlagan pul» ma'nosiz va jami summani kamaytirib yuborardi.
 */
export function ostatkasizQoldiq(qoldiqQiymati: Som, ostatkaQiymati: Som): Som {
  return kichikmi(qoldiqQiymati, ostatkaQiymati)
    ? som(0)
    : ayir(qoldiqQiymati, ostatkaQiymati);
}

/**
 * Material oxirgi harakatdan beri necha kun turgani.
 * `null` — harakat umuman bo'lmagan (boshlang'ich qoldiqdan keyin qimirlamagan).
 */
export function qimirlamaganKun(oxirgiHarakat: Date | null, bugun: Date): number | null {
  if (oxirgiHarakat === null) return null;
  const kun = new Decimal(bugun.getTime() - oxirgiHarakat.getTime())
    .div(24 * 60 * 60 * 1000)
    .floor()
    .toNumber();
  return Math.max(kun, 0);
}
