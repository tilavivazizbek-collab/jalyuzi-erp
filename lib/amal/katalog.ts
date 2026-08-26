/**
 * lib/amal/katalog.ts — TZ 3.2 · 3.3 · 4 · 13.4 · 20.9
 *
 * Konstruktordan quriladigan katalog: mahsulot turlari, slotlar,
 * parametrlar va aksessuarlar.
 *
 * ⚠️ Bu yerda turgani bejiz emas. Katalogni IKKI interfeys o'qiydi —
 *    sotuv ekrani (3.2) va Telegram bot (13.4). §2.2 «bir mantiq —
 *    bir joyda»: nusxa ko'chirilsa yangi mahsulot turi birida
 *    ko'rinib, ikkinchisida ko'rinmay qolardi.
 *
 * ⚠️ TZ 3.3 — «Har slot qatorida FAQAT O'SHA SLOTGA bog'langan matolar
 *    chiqadi.» Bog'lanish `almashtirish_guruh` orqali. Slotda guruh
 *    ko'rsatilmagan bo'lsa — barcha faol material chiqadi.
 *
 * ⚠️ 20.9 — narx `COALESCE(filial narxi, standart)` bilan olinadi.
 *    Mijoz offseti keyin, `lib/domain/narx.ts` da qo'llanadi.
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

export interface TurQatori {
  readonly id: number;
  readonly nom: string;
}

/**
 * TZ 3.2 — mahsulot turlari ro'yxati. **Faqat nom va raqam.**
 *
 * ⚠️ Bu funksiya slot va materialni YUKLAMAYDI. Sabab: sotuvchi
 *    bir vaqtda BITTA tur bilan ishlaydi (3.1), lekin ilgari
 *    ekran hamma turni hamma matosi bilan yuklardi. Guruhsiz
 *    mato har slotga biriktirilgani uchun bu ikki millionga yaqin
 *    obyekt va ~230 MB JSON berardi — sahifa bir daqiqadan ortiq
 *    ochilardi.
 *
 *    Tafsilot `turTafsili` bilan, tur tanlangandan keyin keladi.
 */
export async function turRoyxati(): Promise<readonly TurQatori[]> {
  const q = await ulanishOl()<{ id: number; nom: string }[]>`
    SELECT id, nom FROM mahsulot_tur WHERE faol = true ORDER BY nom`;
  return q;
}

/**
 * TZ 3.2 — «Admin sozlamalardan yangi tur qo'shsa AVTOMATIK shu qatorga
 * qo'shiladi, dasturchiga murojaat qilish shart emas.»
 *
 * Shuning uchun ro'yxat qattiq yozilmaydi — har safar bazadan o'qiladi.
 *
 * ⚠️ `turIdlari` berilsa FAQAT o'sha turlar yuklanadi. Bo'sh
 *    qoldirilsa hammasi — bu og'ir va faqat botda, ro'yxat kichik
 *    bo'lgan holatda ishlatiladi.
 */
export async function sotuvTurlari(
  filialId: number,
  turIdlari?: readonly number[],
): Promise<SotuvTuri[]> {
  const sql = ulanishOl();

  const turlar =
    turIdlari === undefined
      ? await sql<{ id: number; nom: string; xizmat_haqi: string | null }[]>`
          SELECT id, nom, xizmat_haqi FROM mahsulot_tur
          WHERE faol = true ORDER BY nom`
      : await sql<{ id: number; nom: string; xizmat_haqi: string | null }[]>`
          SELECT id, nom, xizmat_haqi FROM mahsulot_tur
          WHERE faol = true AND id = ANY(${turIdlari}) ORDER BY nom`;

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
           COALESCE(fn.sotuv_narx::text, m.sotuv_narx::text) AS narx
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
           COALESCE(fn.sotuv_narx::text, m.sotuv_narx::text) AS narx
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

/**
 * Bitta turning to'liq tafsiloti — slot, parametr, aksessuar va
 * har slotning matolari.
 *
 * ⚠️ Sotuv ekrani va bot SHU funksiyani chaqiradi: sotuvchi turni
 *    tanlagandan keyin. Hamma turni oldindan yuklash o'rniga
 *    bittasini kerak bo'lganda yuklash — bir xil natija, lekin
 *    yuzlab barobar yengil.
 */
export async function turTafsili(
  turId: number,
  filialId: number,
): Promise<SotuvTuri | null> {
  const turlar = await sotuvTurlari(filialId, [turId]);
  return turlar[0] ?? null;
}
