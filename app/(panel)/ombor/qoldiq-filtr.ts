/**
 * Ombor qoldig'i — qidiruv, filtr, saralash (ombor auditi 2026-10-06, 2-band).
 *
 * ⚠️ TOZA FUNKSIYA — bazaga tegmaydi, ro'yxatni oladi va qaytaradi.
 *    Bir filial qoldig'i yuzlab qator: filtrni JS da qilish SQL ni
 *    murakkablashtirmaydi va kam qoldiq qoidasi bitta joyda
 *    (`chegaraBirligidaQoldiq` + `kamQoldiqmi`) qoladi.
 */
import type { MaterialQoldigi } from './malumot';

/** Ombor qoldig'ida qatnashadimi — qoldig'i yoki yo'ldagisi bor */
export const omborda = (q: MaterialQoldigi): boolean => q.bolakSoni > 0 || q.yoldaKvM > 0;

export const QOLDIQ_HOLATLARI = {
  bor: 'Omborda bor',
  kam: 'Kam qolgan',
  tugagan: 'Bo‘sh qolmagan',
  yolda: "Yo'lda",
  hammasi: 'Hammasi',
} as const;
export type QoldiqHolati = keyof typeof QOLDIQ_HOLATLARI;

export const QOLDIQ_SARALASH = {
  nom: 'Nom bo‘yicha',
  kop: 'Qoldig‘i ko‘p',
  oz: 'Qoldig‘i kam',
} as const;
export type QoldiqSaralash = keyof typeof QOLDIQ_SARALASH;

export interface QoldiqFiltri {
  readonly qidiruv: string;
  readonly holat: QoldiqHolati;
  readonly guruhId: number | null;
  readonly saralash: QoldiqSaralash;
}

type Parametrlar = Record<string, string | string[] | undefined>;

const kalitmi = <T extends string>(x: string, r: Record<T, string>): x is T =>
  Object.prototype.hasOwnProperty.call(r, x);

export function qoldiqFiltriniOqi(sp: Parametrlar): QoldiqFiltri {
  const bir = (k: string): string => {
    const v = sp[k];
    return typeof v === 'string' ? v : '';
  };
  const holat = bir('holat');
  const saralash = bir('saralash');
  const guruh = Number(bir('guruh'));
  return {
    qidiruv: bir('q').slice(0, 100),
    holat: kalitmi<QoldiqHolati>(holat, QOLDIQ_HOLATLARI) ? holat : 'bor',
    guruhId: bir('guruh') !== '' && Number.isSafeInteger(guruh) && guruh > 0 ? guruh : null,
    saralash: kalitmi<QoldiqSaralash>(saralash, QOLDIQ_SARALASH) ? saralash : 'nom',
  };
}

/**
 * Qidiruv uchun: kichik harf, o'zbek apostrofining har xil yozilishi
 * (' ‘ ’ ʻ ʼ `) bitta — «Qo'ng'ir» ham, «Qoʻngʻir» ham topilsin.
 */
export function normalla(x: string): string {
  return x.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, ' ').trim();
}

/** Saralash uchun bitta son: rulonda bo'sh kv.m, donada miqdor */
const qoldiqSoni = (q: MaterialQoldigi): number =>
  q.hisobTuri === 'RULON' || q.hisobTuri === 'KV_M' ? q.boshKvM : q.miqdor;

export function qoldiqniFiltrla(
  qatorlar: readonly MaterialQoldigi[],
  f: QoldiqFiltri,
): MaterialQoldigi[] {
  const izla = normalla(f.qidiruv);
  const natija = qatorlar.filter((q) => {
    if (izla !== '' && !normalla(`${q.nom} ${q.guruhNomi ?? ''}`).includes(izla)) return false;
    if (f.guruhId !== null && q.guruhId !== f.guruhId) return false;
    switch (f.holat) {
      case 'bor':
        return omborda(q);
      case 'kam':
        // Tugagan ham «kam» — u eng shoshilinchi
        return q.kamQoldiq || (q.tugagan && q.kamQoldiqChegaraM !== null);
      case 'tugagan':
        return q.tugagan;
      case 'yolda':
        return q.yoldaKvM > 0;
      case 'hammasi':
        return true;
    }
  });

  if (f.saralash === 'kop') natija.sort((a, b) => qoldiqSoni(b) - qoldiqSoni(a));
  else if (f.saralash === 'oz') natija.sort((a, b) => qoldiqSoni(a) - qoldiqSoni(b));
  else natija.sort((a, b) => a.nom.localeCompare(b.nom));
  return natija;
}

/** Tepadagi tezkor tugmalar uchun sanoq — filtrdan OLDINGI ro'yxatdan */
export function holatSanoqlari(qatorlar: readonly MaterialQoldigi[]): {
  kam: number;
  tugagan: number;
  yolda: number;
} {
  return {
    kam: qatorlar.filter((q) => q.kamQoldiq || (q.tugagan && q.kamQoldiqChegaraM !== null))
      .length,
    tugagan: qatorlar.filter((q) => q.tugagan).length,
    yolda: qatorlar.filter((q) => q.yoldaKvM > 0).length,
  };
}
