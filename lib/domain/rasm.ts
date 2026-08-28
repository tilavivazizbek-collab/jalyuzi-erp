/**
 * lib/domain/rasm.ts — katalog rasmi (TZ 4.2 · 3.3 · 13).
 *
 * ⚠️ Rasm brauzerdan `data:image/webp;base64,...` ko'rinishida
 *    keladi (u yerda kichiklashtirilgan). Bu yerda u tekshiriladi
 *    va baytlarga o'giriladi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1) — faqat o'girish va tekshirish.
 */

import { BiznesXato } from '@/lib/xato';

/**
 * Eng katta hajm — 1 MB.
 *
 * ⚠️ Brauzer 800 px ga kichiklashtirgandan keyin odatda 60–150 KB
 *    bo'ladi. 1 MB — himoya chegarasi: kimdir tekshiruvni
 *    aylanib o'tib katta fayl yuborsa, baza shishib ketmasin.
 */
export const ENG_KATTA_BAYT = 1_048_576;

/** Faqat shu turlar — `svg` QABUL QILINMAYDI: u ichida kod bo'lishi mumkin */
const RUXSAT = new Set(['image/webp', 'image/jpeg', 'image/png']);

export interface RasmNatijasi {
  readonly baytlar: Buffer;
  readonly turi: string;
}

/**
 * `data:` matnni baytlarga o'giradi.
 *
 * ⚠️ `null` — rasm o'zgarmadi. `'OCHIR'` — rasmni olib tashlash.
 *    Ikkalasini ajratish shart: bo'sh qiymat «o'zgarmadi» degani
 *    bo'lsa, rasmni o'chirib bo'lmasdi.
 */
export function rasmniOqi(xom: string): RasmNatijasi | 'OCHIR' | null {
  const t = xom.trim();
  if (t === '') return null;
  if (t === 'OCHIR') return 'OCHIR';

  const moslik = /^data:([\w/+-]+);base64,(.+)$/.exec(t);
  if (moslik === null) throw new BiznesXato('RASM_NOTOGRI', "Rasm formati noto'g'ri");

  const turi = moslik[1];
  const asos = moslik[2];
  if (turi === undefined || asos === undefined) {
    throw new BiznesXato('RASM_NOTOGRI', "Rasm formati noto'g'ri");
  }

  if (!RUXSAT.has(turi)) {
    throw new BiznesXato('RASM_NOTOGRI', `Bunday rasm turi qabul qilinmaydi: ${turi}`);
  }

  const baytlar = Buffer.from(asos, 'base64');

  if (baytlar.length === 0) {
    throw new BiznesXato('RASM_NOTOGRI', "Rasm bo'sh");
  }
  if (baytlar.length > ENG_KATTA_BAYT) {
    throw new BiznesXato(
      'RASM_KATTA',
      `Rasm juda katta: ${String(Math.round(baytlar.length / 1024))} KB`,
    );
  }

  return { baytlar, turi };
}
