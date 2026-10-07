/**
 * Xarid buyurtmasi — o'qish (0063). Ombor auditi 2026-10-07, 7-band.
 *
 * ⚠️ «Kelgan» BITTA JOYDA hisoblanadi — `qatorlarniOl`. Ro'yxat ham,
 *    kartochka ham, kirimni oldindan to'ldirish ham, material
 *    kartochkasidagi «yo'lda» ham shu funksiyadan oladi.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import {
  ishonchlilik,
  kechikkanmi,
  qatorHolati,
  xaridHolati,
  xaridQatorSummasi,
  type Ishonchlilik,
  type XaridHolati,
  type XaridNarxAsosi,
  type XaridQarori,
} from '@/lib/domain/xarid';
import { toshkentKuni } from '@/lib/domain/sana';

export interface XaridQatori {
  readonly xaridId: number;
  readonly materialId: number;
  readonly materialNomi: string;
  readonly hisobTuri: string;
  readonly kirimBirligi: string;
  readonly miqdor: string;
  readonly narxBirlik: string | null;
  readonly narxAsosi: XaridNarxAsosi;
  /** Taxminiy summa; `null` — narx yoki odatdagi o'lcham yo'q */
  readonly summa: string | null;
  readonly kelgan: string;
  readonly qolgan: string;
  readonly ortiqcha: string;
}

async function qatorlarniOl(xaridIdlar: readonly number[]): Promise<XaridQatori[]> {
  if (xaridIdlar.length === 0) return [];
  const q = await ulanishOl()<
    {
      xarid_buyurtma_id: number;
      material_id: number;
      nom: string;
      hisob_turi: string;
      kirim_birligi: string;
      miqdor: string;
      narx_birlik: string | null;
      narx_asosi: XaridNarxAsosi;
      boyi: string | null;
      eni: string | null;
      kelgan: string;
    }[]
  >`
    SELECT q.xarid_buyurtma_id, q.material_id, m.nom, m.hisob_turi, m.kirim_birligi,
           q.miqdor::text, q.narx_birlik::text, q.narx_asosi,
           m.odatdagi_rulon_boyi_m::text AS boyi, m.standart_rulon_eni_m::text AS eni,
           -- ⚠️ Faqat FAOL kirim: storno bo'lgani «kelmagan»
           COALESCE((
             SELECT SUM(kq.miqdor_kirim)
             FROM kirim k
             JOIN kirim_qator kq ON kq.kirim_id = k.id
             WHERE k.xarid_buyurtma_id = q.xarid_buyurtma_id
               AND k.holat = 'FAOL'
               AND kq.material_id = q.material_id
           ), 0)::text AS kelgan
    FROM xarid_buyurtma_qator q
    JOIN material m ON m.id = q.material_id
    WHERE q.xarid_buyurtma_id = ANY(${xaridIdlar as number[]})
    ORDER BY q.id`;
  return q.map((x) => {
    // `COALESCE(..., 0)` → '0'; ko'rinish bir xil bo'lsin
    const kelgan = new Decimal(x.kelgan).toFixed(2);
    const h = qatorHolati({ miqdor: x.miqdor, kelgan });
    return {
      xaridId: x.xarid_buyurtma_id,
      materialId: x.material_id,
      materialNomi: x.nom,
      hisobTuri: x.hisob_turi,
      kirimBirligi: x.kirim_birligi,
      miqdor: x.miqdor,
      narxBirlik: x.narx_birlik,
      narxAsosi: x.narx_asosi,
      summa: xaridQatorSummasi({
        narx: x.narx_birlik,
        miqdor: x.miqdor,
        asosi: x.narx_asosi,
        odatdagiBoyiM: x.boyi,
        odatdagiEniM: x.eni,
      }),
      kelgan,
      qolgan: h.qolgan,
      ortiqcha: h.ortiqcha,
    };
  });
}

/**
 * Buyurtma summasi — summasi aytib bo'ladigan qatorlardan.
 *
 * ⚠️ `toliq = false` — ba'zi qatorda narx yoki o'lcham yo'q: summa
 *    «kamida» shuncha.
 */
function summa(qatorlar: readonly XaridQatori[]): { summa: string; toliq: boolean } {
  let s = new Decimal(0);
  let toliq = true;
  for (const q of qatorlar) {
    if (q.summa === null) toliq = false;
    else s = s.plus(q.summa);
  }
  return { summa: s.toFixed(2), toliq };
}

export interface XaridSarlavhasi {
  readonly id: number;
  readonly raqam: string;
  readonly sana: string;
  readonly kutilganSana: string | null;
  readonly yetkazibBeruvchiId: number;
  readonly yetkazibNomi: string;
  readonly valyuta: 'SOM' | 'USD';
  readonly izoh: string | null;
  readonly qaror: XaridQarori;
  readonly yopishSabab: string | null;
  readonly holat: XaridHolati;
  readonly kechikkan: boolean;
  readonly summa: string;
  readonly summaToliq: boolean;
  readonly qatorSoni: number;
  readonly kelganQatorSoni: number;
  readonly yaratdi: string;
}

interface SarlavhaQatori {
  id: number;
  raqam: string;
  sana: string;
  kutilgan_sana: string | null;
  yetkazib_beruvchi_id: number;
  yetkazib_nomi: string;
  valyuta: 'SOM' | 'USD';
  izoh: string | null;
  holat: XaridQarori;
  yopish_sabab: string | null;
  yaratdi: string;
}

function yigish(s: SarlavhaQatori, qatorlar: readonly XaridQatori[], bugun: string): XaridSarlavhasi {
  const holat = xaridHolati(s.holat, qatorlar);
  const sm = summa(qatorlar);
  return {
    id: s.id,
    raqam: s.raqam,
    sana: s.sana,
    kutilganSana: s.kutilgan_sana,
    yetkazibBeruvchiId: s.yetkazib_beruvchi_id,
    yetkazibNomi: s.yetkazib_nomi,
    valyuta: s.valyuta,
    izoh: s.izoh,
    qaror: s.holat,
    yopishSabab: s.yopish_sabab,
    holat,
    kechikkan: kechikkanmi(holat, s.kutilgan_sana, bugun),
    summa: sm.summa,
    summaToliq: sm.toliq,
    qatorSoni: qatorlar.length,
    kelganQatorSoni: qatorlar.filter((q) => new Decimal(q.qolgan).lte(0)).length,
    yaratdi: s.yaratdi,
  };
}

const SARLAVHA_USTUNLARI = `x.id, x.raqam, x.sana::text, x.kutilgan_sana::text, x.yetkazib_beruvchi_id,
  y.nom AS yetkazib_nomi, x.valyuta, x.izoh, x.holat, x.yopish_sabab,
  COALESCE(xo.ism, '') AS yaratdi`;

export type XaridFiltri = 'kutilmoqda' | 'kechikkan' | 'hammasi';

export function xaridFiltriniOqi(x: string | undefined): XaridFiltri {
  return x === 'hammasi' || x === 'kechikkan' ? x : 'kutilmoqda';
}

/**
 * Filial buyurtmalari, yangisi birinchi.
 *
 * ⚠️ «Kutilmoqda» — OCHIQ va to'liq kelmagan. To'liq kelgan, lekin
 *    hali yopilmagan buyurtma ro'yxatni to'ldirib yubormasin.
 */
export async function xaridlarRoyxati(
  filialId: number,
  filtr: XaridFiltri,
): Promise<XaridSarlavhasi[]> {
  const sql = ulanishOl();
  const s = await sql<SarlavhaQatori[]>`
    SELECT ${sql.unsafe(SARLAVHA_USTUNLARI)}
    FROM xarid_buyurtma x
    JOIN yetkazib_beruvchi y ON y.id = x.yetkazib_beruvchi_id
    LEFT JOIN xodim xo ON xo.id = x.yaratdi_id
    WHERE x.filial_id = ${filialId}
      ${filtr === 'hammasi' ? sql`` : sql`AND x.holat = 'OCHIQ'`}
    ORDER BY x.id DESC
    LIMIT 500`;
  const qatorlar = await qatorlarniOl(s.map((x) => x.id));
  const bugun = toshkentKuni();
  const r = s.map((x) =>
    yigish(
      x,
      qatorlar.filter((q) => q.xaridId === x.id),
      bugun,
    ),
  );
  if (filtr === 'kutilmoqda') return r.filter((x) => x.holat === 'KUTILMOQDA' || x.holat === 'QISMAN');
  if (filtr === 'kechikkan') return r.filter((x) => x.kechikkan);
  return r;
}

export interface XaridKirimi {
  readonly id: number;
  readonly raqam: string;
  readonly sana: string;
  readonly holat: string;
}

export interface XaridTafsiloti extends XaridSarlavhasi {
  readonly qatorlar: readonly XaridQatori[];
  readonly kirimlar: readonly XaridKirimi[];
}

/** Bitta buyurtma — FAQAT o'z filiali (boshqasiniki `null`). */
export async function xaridTafsiloti(id: number, filialId: number): Promise<XaridTafsiloti | null> {
  const sql = ulanishOl();
  const s = await sql<SarlavhaQatori[]>`
    SELECT ${sql.unsafe(SARLAVHA_USTUNLARI)}
    FROM xarid_buyurtma x
    JOIN yetkazib_beruvchi y ON y.id = x.yetkazib_beruvchi_id
    LEFT JOIN xodim xo ON xo.id = x.yaratdi_id
    WHERE x.id = ${id} AND x.filial_id = ${filialId}`;
  const sarlavha = s[0];
  if (sarlavha === undefined) return null;
  const [qatorlar, kirimlar] = await Promise.all([
    qatorlarniOl([id]),
    sql<XaridKirimi[]>`
      SELECT id, raqam, sana::text, holat FROM kirim
      WHERE xarid_buyurtma_id = ${id} ORDER BY id`,
  ]);
  return { ...yigish(sarlavha, qatorlar, toshkentKuni()), qatorlar, kirimlar };
}

/**
 * Filialda har material bo'yicha hali kelmagan miqdor (kirim birligida).
 *
 * ⚠️ Yangi buyurtma formasida ogohlantirish uchun: «bu matodan 5 rulon
 *    allaqachon yo'lda» — bir matoni ikki kishi ikki marta buyurtma
 *    qilmasin.
 */
export async function yoldaXaritasi(filialId: number): Promise<Map<number, string>> {
  const s = await ulanishOl()<{ id: number }[]>`
    SELECT id FROM xarid_buyurtma WHERE filial_id = ${filialId} AND holat = 'OCHIQ'`;
  const xarita = new Map<number, Decimal>();
  for (const q of await qatorlarniOl(s.map((x) => x.id))) {
    const qolgan = new Decimal(q.qolgan);
    if (qolgan.lte(0)) continue;
    xarita.set(q.materialId, (xarita.get(q.materialId) ?? new Decimal(0)).plus(qolgan));
  }
  return new Map([...xarita].map(([k, v]) => [k, v.toFixed(2)]));
}

export interface YoldagiBuyurtma {
  readonly xaridId: number;
  readonly materialId: number;
  readonly raqam: string;
  readonly kutilganSana: string | null;
  readonly qolgan: string;
  readonly kirimBirligi: string;
}

/**
 * Material kartochkasi uchun — shu filialda bu materialdan qancha
 * buyurtma qilingan va hali kelmagan.
 *
 * ⚠️ Ikkinchi marta buyurtma qilmaslik uchun: «qoldiq kam» deb
 *    ko'rgan omborchi avval shu yerga qaraydi.
 */
export async function yoldagiBuyurtmalar(
  filialId: number,
  /** `null` — filialning hamma materiali («buyurtma kerak» ro'yxati) */
  materialId: number | null,
): Promise<YoldagiBuyurtma[]> {
  const sql = ulanishOl();
  const s = await sql<{ id: number; raqam: string; kutilgan_sana: string | null }[]>`
    SELECT DISTINCT x.id, x.raqam, x.kutilgan_sana::text
    FROM xarid_buyurtma x
    JOIN xarid_buyurtma_qator q ON q.xarid_buyurtma_id = x.id
    WHERE x.filial_id = ${filialId} AND x.holat = 'OCHIQ'
      ${materialId === null ? sql`` : sql`AND q.material_id = ${materialId}`}
    ORDER BY x.id`;
  const qatorlar = (await qatorlarniOl(s.map((x) => x.id))).filter(
    (q) => (materialId === null || q.materialId === materialId) && new Decimal(q.qolgan).gt(0),
  );
  return qatorlar.map((q) => {
    const x = s.find((y) => y.id === q.xaridId);
    return {
      xaridId: q.xaridId,
      materialId: q.materialId,
      raqam: x?.raqam ?? '',
      kutilganSana: x?.kutilgan_sana ?? null,
      qolgan: q.qolgan,
      kirimBirligi: q.kirimBirligi,
    };
  });
}

/**
 * Yetkazib beruvchi kartochkasi uchun — u qanchalik ishonchli
 * (audit 2026-10-07). Qarz umumiy bo'lgani kabi (Q-26) — HAMMA filiallar.
 */
export async function yetkazuvchiIshonchi(yetkazibId: number): Promise<Ishonchlilik> {
  const s = await ulanishOl()<SarlavhaQatori[]>`
    SELECT ${ulanishOl().unsafe(SARLAVHA_USTUNLARI)}
    FROM xarid_buyurtma x
    JOIN yetkazib_beruvchi y ON y.id = x.yetkazib_beruvchi_id
    LEFT JOIN xodim xo ON xo.id = x.yaratdi_id
    WHERE x.yetkazib_beruvchi_id = ${yetkazibId}`;
  const [qatorlar, birinchi] = await Promise.all([
    qatorlarniOl(s.map((x) => x.id)),
    ulanishOl()<{ id: number; sana: string }[]>`
      SELECT xarid_buyurtma_id AS id, MIN(sana)::text AS sana
      FROM kirim
      WHERE xarid_buyurtma_id = ANY(${s.map((x) => x.id)}) AND holat = 'FAOL'
      GROUP BY xarid_buyurtma_id`,
  ]);
  const kirimSanasi = new Map(birinchi.map((b) => [b.id, b.sana]));
  return ishonchlilik(
    s.map((x) => ({
      sana: x.sana,
      kutilganSana: x.kutilgan_sana,
      birinchiKirim: kirimSanasi.get(x.id) ?? null,
      holat: xaridHolati(
        x.holat,
        qatorlar.filter((q) => q.xaridId === x.id),
      ),
    })),
    toshkentKuni(),
  );
}
