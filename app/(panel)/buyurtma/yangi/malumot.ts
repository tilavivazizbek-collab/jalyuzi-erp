/**
 * app/(panel)/buyurtma/yangi/malumot.ts — TZ 3.2 · 3.3 · 3.7 · 3.10 · Q-25 · Q-26
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
  /**
   * TZ 6.3 — GURUH chegirmasi.
   *
   * ⚠️ Ikkalasi ALOHIDA qaytariladi, bazada birlashtirilmaydi:
   *    qaysi biri ustun turishini `amaldagiOffset()` hal qiladi
   *    va u qoida domainda turishi shart (§2.2). SQL da
   *    `COALESCE` qilinsa, bot boshqacha hisoblab qo'yardi.
   */
  readonly guruhNomi: string | null;
  readonly guruhOffsetTuri: string | null;
  readonly guruhOffsetQiymat: string | null;

  /**
   * TZ 6.2 — MIJOZ TURI (narx darajasi).
   *
   * ⚠️ Guruhdan boshqa narsa: guruh chegirma beradi, tur esa
   *    materialning O'Z NARXINI belgilaydi. Ikkalasi ketma-ket
   *    qo'llanadi: tur narxi → guruh/shaxsiy offset.
   */
  readonly mijozTuriId: number | null;
  readonly turNomi: string | null;
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
      guruh_nomi: string | null;
      guruh_offset_turi: string | null;
      guruh_offset_qiymat: string | null;
      mijoz_turi_id: number | null;
      tur_nomi: string | null;
    }[]
  >`
    SELECT m.id, m.ism, m.telefon, m.qarz_limiti,
           m.offset_turi, m.offset_qiymat,
           g.nom AS guruh_nomi,
           g.offset_turi AS guruh_offset_turi,
           g.offset_qiymat AS guruh_offset_qiymat,
           m.mijoz_turi_id, t.nom AS tur_nomi
    FROM mijoz m
    LEFT JOIN mijoz_guruh g ON g.id = m.mijoz_guruh_id AND g.faol = true
    LEFT JOIN mijoz_turi t ON t.id = m.mijoz_turi_id AND t.faol = true
    WHERE m.faol = true AND (m.ism ILIKE ${`%${q}%`} OR m.telefon LIKE ${`%${q}%`})
    ORDER BY m.ism LIMIT ${chegara}`;

  return qatorlar.map((r) => ({
    id: r.id,
    ism: r.ism,
    telefon: r.telefon,
    qarzLimiti: r.qarz_limiti,
    offsetTuri: r.offset_turi,
    offsetQiymat: r.offset_qiymat,
    guruhNomi: r.guruh_nomi,
    guruhOffsetTuri: r.guruh_offset_turi,
    guruhOffsetQiymat: r.guruh_offset_qiymat,
    mijozTuriId: r.mijoz_turi_id,
    turNomi: r.tur_nomi,
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

// ─── Qo'shimcha mahsulot — TZ 3.x (kengaytma) ────────────────────────────

export interface QoshimchaMaterial {
  readonly id: number;
  readonly nom: string;
  readonly narx: string | null;
  readonly narxValyuta: string;
  readonly boshDona: number;
}

/**
 * Alohida sotiladigan buyumlar — mexanizm, kronshteyn, zanjir.
 *
 * ⚠️ Faqat DONA hisobidagi material: mato metrlab kesiladi va
 *    alohida sotilmaydi.
 *
 * ⚠️ Qoldiq shu FILIALDA hisoblanadi (Q-25) va narx filial
 *    narxidan keladi (20.9).
 */
export async function qoshimchaMateriallar(
  filialId: number,
): Promise<QoshimchaMaterial[]> {
  return ulanishOl()<QoshimchaMaterial[]>`
    SELECT m.id, m.nom,
           COALESCE(fn.sotuv_narx::text, m.sotuv_narx::text) AS narx,
           COALESCE(fn.valyuta, m.sotuv_valyuta) AS "narxValyuta",
           COALESCE((SELECT SUM(b.miqdor) FROM bolak b
                     WHERE b.material_id = m.id
                       AND b.filial_id = ${filialId}
                       AND b.turi = 'DONA'
                       AND b.holat = 'BOSH'
                       AND b.faol = true), 0)::int AS "boshDona"
    FROM material m
    LEFT JOIN material_filial_narx fn
           ON fn.material_id = m.id AND fn.filial_id = ${filialId}
    WHERE m.faol = true AND m.hisob_turi = 'DONA'
    ORDER BY m.nom`;
}
