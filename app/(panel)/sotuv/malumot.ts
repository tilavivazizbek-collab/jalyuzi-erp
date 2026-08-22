/**
 * app/(panel)/sotuv/malumot.ts — TZ 3.2 · 3.3 · 3.7 · 3.10 · Q-25 · Q-26
 *
 * Sotuv ekrani so'rovlari.
 *
 * ⚠️ TZ 3.3 — «Har slot qatorida FAQAT O'SHA SLOTGA bog'langan matolar
 *    chiqadi. Ya'ni "Orqa mato" qatorida to'r matolar ko'rinmaydi va
 *    sotuvchi adashib qo'ya olmaydi.»
 *
 *    Bog'lanish `almashtirish_guruh` orqali. Slotda guruh ko'rsatilmagan
 *    bo'lsa — barcha faol material chiqadi.
 */

import { ulanishOl } from '@/lib/db';

export type {
  SotuvMaterial,
  SotuvSlot,
  SotuvParametr,
  SotuvAksessuar,
  SotuvTuri,
} from '@/lib/amal/katalog';

/**
 * ⚠️ Katalog `lib/amal/katalog.ts` ga ko'chdi: uni bot ham o'qiydi
 *    (13.4). Bu yerdan qayta eksport qilinadi — ekran kodi
 *    o'zgarmasin.
 */
export { sotuvTurlari } from '@/lib/amal/katalog';


/** TZ 3.10 — mijoz qidiruvi ism yoki telefon bo'yicha. */
export interface SotuvMijozi {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly qarzLimiti: string | null;
  /** TZ 3.10 — «Mijoz tanlangach offseti darhol ko'rinadi va narx qayta hisoblanadi» */
  readonly offsetTuri: string | null;
  readonly offsetQiymat: string | null;
}

export async function mijozQidir(matn: string, chegara = 10): Promise<SotuvMijozi[]> {
  const q = matn.trim();
  if (q === '') return [];

  const qatorlar = await ulanishOl()<
    {
      id: number;
      ism: string;
      telefon: string | null;
      qarz_limiti: string | null;
      offset_turi: string | null;
      offset_qiymat: string | null;
    }[]
  >`
    SELECT id, ism, telefon, qarz_limiti, offset_turi, offset_qiymat FROM mijoz
    WHERE faol = true AND (ism ILIKE ${`%${q}%`} OR telefon LIKE ${`%${q}%`})
    ORDER BY ism LIMIT ${chegara}`;

  return qatorlar.map((r) => ({
    id: r.id,
    ism: r.ism,
    telefon: r.telefon,
    qarzLimiti: r.qarz_limiti,
    offsetTuri: r.offset_turi,
    offsetQiymat: r.offset_qiymat,
  }));
}

/** TZ 20.4.1 — sotuvchi tikuvchi filialni o'zgartira oladi. */
export async function tikaOladiganFiliallar(): Promise<
  { id: number; nom: string; bosh: boolean }[]
> {
  const q = await ulanishOl()<{ id: number; nom: string; bosh: boolean }[]>`
    SELECT id, nom, bosh FROM filial
    WHERE faol = true AND ishlab_chiqaradi = true
    ORDER BY bosh DESC, nom`;
  return q;
}
