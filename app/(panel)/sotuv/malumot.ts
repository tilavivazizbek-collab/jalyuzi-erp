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

export interface SotuvMaterial {
  readonly id: number;
  readonly nom: string;
  readonly sarflashBirligi: string;
  readonly narx: string | null;
  /** Q-25 — shu filialdagi bo'sh qoldiq (3.3: «har mato yonida qoldiq») */
  readonly boshKvM: number;
  readonly boshDona: number;
}

export interface SotuvSlot {
  readonly id: number;
  readonly nom: string;
  readonly tartib: number;
  readonly majburiy: boolean;
  readonly formula: string;
  readonly materiallar: readonly SotuvMaterial[];
}

export interface SotuvParametr {
  readonly kod: string;
  readonly nom: string;
  readonly standartQiymat: string | null;
}

export interface SotuvAksessuar {
  readonly materialId: number;
  readonly nom: string;
  readonly sarflashBirligi: string;
  readonly formula: string;
  readonly majburiy: boolean;
  readonly narx: string | null;
}

export interface SotuvTuri {
  readonly id: number;
  readonly nom: string;
  readonly xizmatHaqi: string | null;
  readonly slotlar: readonly SotuvSlot[];
  readonly parametrlar: readonly SotuvParametr[];
  readonly aksessuarlar: readonly SotuvAksessuar[];
}

/**
 * TZ 3.2 — «Admin sozlamalardan yangi tur qo'shsa AVTOMATIK shu qatorga
 * qo'shiladi, dasturchiga murojaat qilish shart emas.»
 *
 * Shuning uchun ro'yxat qattiq yozilmaydi — har safar bazadan o'qiladi.
 */
export async function sotuvTurlari(filialId: number): Promise<SotuvTuri[]> {
  const sql = ulanishOl();

  const turlar = await sql<
    { id: number; nom: string; xizmat_haqi: string | null }[]
  >`
    SELECT id, nom, xizmat_haqi FROM mahsulot_tur
    WHERE faol = true ORDER BY nom`;

  if (turlar.length === 0) return [];

  const turIdlar = turlar.map((t) => t.id);

  const slotlar = await sql<
    {
      id: number;
      mahsulot_tur_id: number;
      nom: string;
      tartib: number;
      majburiy: boolean;
      formula: string;
      almashtirish_guruh_id: number | null;
    }[]
  >`
    SELECT id, mahsulot_tur_id, nom, tartib, majburiy, formula, almashtirish_guruh_id
    FROM mahsulot_slot
    WHERE mahsulot_tur_id = ANY(${turIdlar}) AND faol = true
    ORDER BY mahsulot_tur_id, tartib`;

  const parametrlar = await sql<
    {
      mahsulot_tur_id: number;
      kod: string;
      nom: string;
      standart_qiymat: string | null;
    }[]
  >`
    SELECT mahsulot_tur_id, kod, nom, standart_qiymat FROM mahsulot_parametr
    WHERE mahsulot_tur_id = ANY(${turIdlar}) AND faol = true
    ORDER BY mahsulot_tur_id, kod`;

  const aksessuarlar = await sql<
    {
      mahsulot_tur_id: number;
      material_id: number;
      nom: string;
      sarflash_birligi: string;
      formula: string;
      majburiy: boolean;
      narx: string | null;
    }[]
  >`
    SELECT ma.mahsulot_tur_id, ma.material_id, m.nom, m.sarflash_birligi,
           ma.formula, ma.majburiy,
           COALESCE(fn.narx::text, m.sotuv_narx::text) AS narx
    FROM mahsulot_aksessuar ma
    JOIN material m ON m.id = ma.material_id
    LEFT JOIN material_filial_narx fn
           ON fn.material_id = m.id AND fn.filial_id = ${filialId}
    WHERE ma.mahsulot_tur_id = ANY(${turIdlar}) AND ma.faol = true AND m.faol = true
    ORDER BY ma.mahsulot_tur_id, m.nom`;

  /**
   * Q-25 — qoldiq SHU FILIALDA sanaladi.
   * Q-05 — kv.m `eni × bo'yi` dan hisoblanadi, saqlanmaydi.
   */
  const qoldiq = await sql<
    { material_id: number; bosh_kv_m: string | null; bosh_dona: string | null }[]
  >`
    SELECT material_id,
           SUM(eni_m * boyi_m) FILTER (WHERE holat = 'BOSH') AS bosh_kv_m,
           SUM(miqdor)         FILTER (WHERE holat = 'BOSH') AS bosh_dona
    FROM bolak
    WHERE filial_id = ${filialId} AND faol = true
    GROUP BY material_id`;

  const qoldiqBoyicha = new Map(
    qoldiq.map((q) => [
      q.material_id,
      { kvM: Number(q.bosh_kv_m ?? 0), dona: Number(q.bosh_dona ?? 0) },
    ]),
  );

  // Slot materiallari — guruh bo'yicha filtrlanadi (3.3)
  const guruhIdlar = [
    ...new Set(
      slotlar
        .map((s) => s.almashtirish_guruh_id)
        .filter((g): g is number => g !== null),
    ),
  ];

  const materiallar = await sql<
    {
      id: number;
      nom: string;
      sarflash_birligi: string;
      almashtirish_guruh_id: number | null;
      narx: string | null;
    }[]
  >`
    SELECT m.id, m.nom, m.sarflash_birligi, m.almashtirish_guruh_id,
           COALESCE(fn.narx::text, m.sotuv_narx::text) AS narx
    FROM material m
    LEFT JOIN material_filial_narx fn
           ON fn.material_id = m.id AND fn.filial_id = ${filialId}
    WHERE m.faol = true
      AND (${guruhIdlar.length === 0}
           OR m.almashtirish_guruh_id = ANY(${guruhIdlar})
           OR m.almashtirish_guruh_id IS NULL)
    ORDER BY m.nom`;

  const material = (m: (typeof materiallar)[number]): SotuvMaterial => {
    const q = qoldiqBoyicha.get(m.id);
    return {
      id: m.id,
      nom: m.nom,
      sarflashBirligi: m.sarflash_birligi,
      narx: m.narx,
      boshKvM: q?.kvM ?? 0,
      boshDona: q?.dona ?? 0,
    };
  };

  return turlar.map((t) => ({
    id: t.id,
    nom: t.nom,
    xizmatHaqi: t.xizmat_haqi,
    slotlar: slotlar
      .filter((s) => s.mahsulot_tur_id === t.id)
      .map((s) => ({
        id: s.id,
        nom: s.nom,
        tartib: s.tartib,
        majburiy: s.majburiy,
        formula: s.formula,
        // 3.3 — guruh belgilangan bo'lsa faqat o'sha guruh matolari
        materiallar: materiallar
          .filter((m) =>
            s.almashtirish_guruh_id === null
              ? true
              : m.almashtirish_guruh_id === s.almashtirish_guruh_id,
          )
          .map(material),
      })),
    parametrlar: parametrlar
      .filter((p) => p.mahsulot_tur_id === t.id)
      .map((p) => ({ kod: p.kod, nom: p.nom, standartQiymat: p.standart_qiymat })),
    aksessuarlar: aksessuarlar
      .filter((a) => a.mahsulot_tur_id === t.id)
      .map((a) => ({
        materialId: a.material_id,
        nom: a.nom,
        sarflashBirligi: a.sarflash_birligi,
        formula: a.formula,
        majburiy: a.majburiy,
        narx: a.narx,
      })),
  }));
}

/** TZ 3.10 — mijoz qidiruvi ism yoki telefon bo'yicha. */
export interface SotuvMijozi {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly qarzLimiti: string | null;
}

export async function mijozQidir(matn: string, chegara = 10): Promise<SotuvMijozi[]> {
  const q = matn.trim();
  if (q === '') return [];

  const qatorlar = await ulanishOl()<
    { id: number; ism: string; telefon: string | null; qarz_limiti: string | null }[]
  >`
    SELECT id, ism, telefon, qarz_limiti FROM mijoz
    WHERE faol = true AND (ism ILIKE ${`%${q}%`} OR telefon LIKE ${`%${q}%`})
    ORDER BY ism LIMIT ${chegara}`;

  return qatorlar.map((r) => ({
    id: r.id,
    ism: r.ism,
    telefon: r.telefon,
    qarzLimiti: r.qarz_limiti,
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
