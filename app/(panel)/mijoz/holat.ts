/** `'use server'` faylidan alohida — u faqat async funksiya eksport qila oladi. */

export interface DublikatMalumoti {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string;
  readonly sabab: 'TELEFON' | 'ISM';
}

export interface MijozHolati {
  readonly xato: string | null;
  readonly maydonXatolari: Readonly<Record<string, string>>;
  /** TZ 6.5 — mavjud mijoz ko'rsatiladi va uch yo'l taklif qilinadi */
  readonly dublikat: DublikatMalumoti | null;
}

export const BOSH_HOLAT: MijozHolati = { xato: null, maydonXatolari: {}, dublikat: null };

export function matnMaydon(forma: FormData, nom: string): string {
  const q = forma.get(nom);
  return typeof q === 'string' ? q : '';
}

export function xatolarniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): MijozHolati {
  const maydonXatolari: Record<string, string> = {};
  for (const x of xatolar) {
    const kalit = x.path[0];
    if (typeof kalit === 'string' && maydonXatolari[kalit] === undefined) {
      maydonXatolari[kalit] = x.message;
    }
  }
  return {
    xato: 'Formada xato bor — qizil maydonlarni tekshiring',
    maydonXatolari,
    dublikat: null,
  };
}
