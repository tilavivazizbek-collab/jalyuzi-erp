/**
 * Kassa kitobi filtri — sahifa va Excel BITTA o'qiydi. Kassa auditi 2026-10-08.
 *
 * ⚠️ Ilgari filtr yo'q edi: oxirgi 200 yozuv, xolos. Kechagi kassani
 *    ko'rish yoki oy bo'yicha xarajatni chiqarish mumkin emas edi.
 */

export const YONALISHLAR = { hammasi: 'Hammasi', kirim: 'Kirim', chiqim: 'Chiqim' } as const;
export type Yonalish = keyof typeof YONALISHLAR;

export interface KitobFiltri {
  /** `YYYY-MM-DD`, ichiga kiradi */
  readonly dan: string;
  /** `YYYY-MM-DD`, ichiga kiradi */
  readonly gacha: string;
  readonly kassaId: number | null;
  readonly yonalish: Yonalish;
}

const SANA = /^\d{4}-\d{2}-\d{2}$/;

/** `bugun` dan `kun` kun oldingi sana (Toshkent kuni matni ustida) */
export function kunOldin(bugun: string, kun: number): string {
  const d = new Date(`${bugun}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - kun);
  return d.toISOString().slice(0, 10);
}

/** Standart — oxirgi 7 kun (bugun ham kiradi) */
export function kitobFiltriniOqi(
  sp: Readonly<Record<string, string | string[] | undefined>>,
  bugun: string,
): KitobFiltri {
  const bir = (k: string): string => {
    const v = sp[k];
    return typeof v === 'string' ? v.trim() : '';
  };
  let dan = SANA.test(bir('dan')) ? bir('dan') : kunOldin(bugun, 6);
  let gacha = SANA.test(bir('gacha')) ? bir('gacha') : bugun;
  if (dan > gacha) [dan, gacha] = [gacha, dan];
  const k = Number(bir('kassa'));
  const y = bir('yonalish');
  return {
    dan,
    gacha,
    kassaId: Number.isSafeInteger(k) && k > 0 ? k : null,
    yonalish: y === 'kirim' || y === 'chiqim' ? y : 'hammasi',
  };
}

/** Havola uchun — Excel tugmasi va tez tugmalar joriy filtrni saqlaydi */
export function kitobSorovi(f: KitobFiltri, ozgar: Partial<KitobFiltri> = {}): string {
  const x = { ...f, ...ozgar };
  const p = new URLSearchParams({ dan: x.dan, gacha: x.gacha });
  if (x.kassaId !== null) p.set('kassa', String(x.kassaId));
  if (x.yonalish !== 'hammasi') p.set('yonalish', x.yonalish);
  return p.toString();
}
