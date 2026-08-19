/**
 * Forma holati — `'use server'` faylidan ALOHIDA turadi.
 *
 * Next.js qoidasi: `'use server'` fayli faqat async funksiya eksport qila
 * oladi. Obyekt yoki konstanta eksport qilinsa qurish yiqiladi.
 */

export interface FormaHolati {
  readonly xato: string | null;
  readonly maydonXatolari: Readonly<Record<string, string>>;
}

export const BOSH_HOLAT: FormaHolati = { xato: null, maydonXatolari: {} };

export function matnMaydon(forma: FormData, nom: string): string {
  const q = forma.get(nom);
  return typeof q === 'string' ? q : '';
}

/** Zod xatolarini maydon nomiga bog'lab formaga qaytaradi. */
export function xatolarniYig(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): FormaHolati {
  const maydonXatolari: Record<string, string> = {};
  for (const x of xatolar) {
    const kalit = x.path[0];
    if (typeof kalit === 'string' && maydonXatolari[kalit] === undefined) {
      maydonXatolari[kalit] = x.message;
    }
  }
  return { xato: 'Formada xato bor — qizil maydonlarni tekshiring', maydonXatolari };
}
