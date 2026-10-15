/**
 * TZ 11.8 — ishlab chiqarish hisobotlari. 2026-10-15
 *
 *   11.8.1 usta unumdorligi   — tugatilgan pozitsiya, kv.m, hisoblangan haq
 *   11.8.2 ishlab chiqarish braki — usta kesimida, zarar va ushlanma
 *   11.8.3 kechikkan buyurtmalar — tayyorlik sanasidan o'tganlar
 *   11.8.4 navbat holati      — kim qancha kutdi, qaysi tur uzoq kutmoqda
 *
 * ⚠️ Filial — ISHLAB CHIQARUVCHI filial: hisobot ustaxonaniki.
 * ⚠️ Haq — xodim_harakat (HAQ + HAQ_BEKOR) o'z sanasi bo'yicha: «hisoblangan
 *    haq» (10.10). Ushlanma alohida (10.13) — u brak qismida.
 * ⚠️ Brak zarari — qayta kesishga ketgan material tannarxi (ombor jurnali,
 *    T-07 bilan bir manba).
 * ⚠️ Kechikish sharti `muddatiOtganSharti` dan — ro'yxat, cron va bu
 *    hisobot bir xil buyurtmalarni sanasin.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import type { Davr } from '@/lib/domain/hisobot/davr';
import { toshkentKuni } from '@/lib/domain/sana';
import { muddatiOtganSharti } from '../buyurtma/malumot';

// ─── 11.8.1 ───────────────────────────────────────────────────────────────

export interface UstaTurQatori {
  readonly tur: string;
  readonly soni: number;
  readonly kvM: string;
}

export interface UstaUnumdorligi {
  readonly ustaId: number;
  readonly ism: string;
  readonly soni: number;
  readonly kvM: string;
  readonly haq: string;
  readonly turlar: readonly UstaTurQatori[];
}

export async function ustaUnumdorligi(filialId: number, davr: Davr): Promise<UstaUnumdorligi[]> {
  const sql = ulanishOl();
  const [qatorlar, haqlar] = await Promise.all([
    sql<{ usta_id: number; ism: string; tur: string | null; soni: number; kv_m: string }[]>`
      SELECT p.usta_id, x.ism, t.nom AS tur,
             SUM(p.soni)::int AS soni,
             SUM(COALESCE(p.eni_m, 0) * COALESCE(p.boyi_m, 0) * p.soni)::numeric(14,2)::text AS kv_m
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      JOIN xodim x ON x.id = p.usta_id
      LEFT JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
      WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
        AND p.tugatildi >= ${davr.boshi} AND p.tugatildi < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY p.usta_id, x.ism, t.nom
      ORDER BY x.ism, SUM(p.soni) DESC`,
    sql<{ xodim_id: number; ism: string; haq: string }[]>`
      SELECT h.xodim_id, x.ism, SUM(h.summa)::numeric(14,2)::text AS haq
      FROM xodim_harakat h
      JOIN xodim x ON x.id = h.xodim_id
      WHERE h.filial_id = ${filialId} AND h.turi IN ('HAQ','HAQ_BEKOR') AND h.valyuta = 'SOM'
        AND h.sana >= ${davr.boshi} AND h.sana < ${davr.oxiri}
      GROUP BY h.xodim_id, x.ism`,
  ]);

  const ustalar = new Map<number, { ism: string; turlar: UstaTurQatori[] }>();
  for (const q of qatorlar) {
    const u = ustalar.get(q.usta_id) ?? { ism: q.ism, turlar: [] };
    u.turlar.push({ tur: q.tur ?? 'Qo‘shimcha buyum', soni: q.soni, kvM: q.kv_m });
    ustalar.set(q.usta_id, u);
  }
  // Haq bor, lekin davrda pozitsiya tugatmagan usta ham ko'rinsin (masalan, qaytarib olingan ish)
  for (const h of haqlar) if (!ustalar.has(h.xodim_id)) ustalar.set(h.xodim_id, { ism: h.ism, turlar: [] });

  return [...ustalar.entries()]
    .map(([ustaId, u]) => ({
      ustaId,
      ism: u.ism,
      soni: u.turlar.reduce((y, t) => y + t.soni, 0),
      kvM: u.turlar.reduce((y, t) => y + Number(t.kvM), 0).toFixed(2),
      haq: haqlar.find((h) => h.xodim_id === ustaId)?.haq ?? '0.00',
      turlar: u.turlar,
    }))
    .sort((a, b) => Number(b.kvM) - Number(a.kvM));
}

// ─── 11.8.2 ───────────────────────────────────────────────────────────────

export interface BrakQatori {
  readonly ustaId: number | null;
  readonly ism: string;
  readonly soni: number;
  /** Qayta kesishga ketgan material tannarxi */
  readonly zarar: string;
  readonly ushlangan: string;
  readonly sabablar: readonly { readonly sabab: string; readonly soni: number }[];
}

export async function ishlabChiqarishBraki(filialId: number, davr: Davr): Promise<BrakQatori[]> {
  const q = await ulanishOl()<
    { usta_id: number | null; ism: string | null; sabab: string; soni: number; zarar: string; ushlangan: string }[]
  >`
    SELECT p.usta_id, x.ism, qk.sabab, COUNT(*)::int AS soni,
           COALESCE(SUM((SELECT -SUM(oh.tannarx_summa) FROM ombor_harakat oh
                         WHERE oh.manba_turi = 'qayta_kesish' AND oh.manba_id = qk.id)), 0)
             ::numeric(14,2)::text AS zarar,
           COALESCE(SUM(qk.ushlanma_summa), 0)::numeric(14,2)::text AS ushlangan
    FROM qayta_kesish qk
    JOIN buyurtma_pozitsiya p ON p.id = qk.buyurtma_pozitsiya_id
    JOIN buyurtma b ON b.id = p.buyurtma_id
    LEFT JOIN xodim x ON x.id = p.usta_id
    WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
      AND qk.holat = 'TASDIQLANDI'
      AND qk.hal_qilindi >= ${davr.boshi} AND qk.hal_qilindi < ${davr.oxiri}
    GROUP BY p.usta_id, x.ism, qk.sabab`;

  // §3 — pul Decimal bilan qo'shiladi
  const m = new Map<
    string,
    { ustaId: number | null; ism: string; soni: number; zarar: Decimal; ushlangan: Decimal; sabablar: { sabab: string; soni: number }[] }
  >();
  for (const r of q) {
    const k = String(r.usta_id);
    const u = m.get(k) ?? {
      ustaId: r.usta_id,
      ism: r.ism ?? 'Usta belgilanmagan',
      soni: 0,
      zarar: new Decimal(0),
      ushlangan: new Decimal(0),
      sabablar: [],
    };
    u.soni += r.soni;
    u.zarar = u.zarar.plus(r.zarar);
    u.ushlangan = u.ushlangan.plus(r.ushlangan);
    u.sabablar.push({ sabab: r.sabab, soni: r.soni });
    m.set(k, u);
  }
  return [...m.values()]
    .map((u) => ({
      ustaId: u.ustaId,
      ism: u.ism,
      soni: u.soni,
      zarar: u.zarar.toFixed(2),
      ushlangan: u.ushlangan.toFixed(2),
      sabablar: u.sabablar.sort((a, b) => b.soni - a.soni),
    }))
    .sort((a, b) => new Decimal(b.zarar).comparedTo(a.zarar));
}

// ─── 11.8.3 ───────────────────────────────────────────────────────────────

export interface KechikkanQatori {
  readonly buyurtmaId: number;
  readonly raqam: string;
  readonly mijoz: string | null;
  readonly tayyorlikSana: string;
  readonly kechikishKun: number;
  readonly ochiqPozitsiya: number;
}

export async function kechikkanBuyurtmalar(filialId: number): Promise<KechikkanQatori[]> {
  const bugun = toshkentKuni();
  const q = await ulanishOl()<
    { id: number; raqam: string; mijoz: string | null; tayyorlik: string; kun: number; ochiq: number }[]
  >`
    SELECT b.id, b.raqam, m.ism AS mijoz, b.tayyorlik_sana::text AS tayyorlik,
           (${bugun}::date - b.tayyorlik_sana)::int AS kun,
           (SELECT COUNT(*)::int FROM buyurtma_pozitsiya x
             WHERE x.buyurtma_id = b.id
               AND x.holat NOT IN ('TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')) AS ochiq
    FROM buyurtma b
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
      AND b.storno_sana IS NULL
      ${muddatiOtganSharti(bugun)}
    ORDER BY kun DESC, b.id
    LIMIT 200`;
  return q.map((r) => ({
    buyurtmaId: r.id,
    raqam: r.raqam,
    mijoz: r.mijoz,
    tayyorlikSana: r.tayyorlik,
    kechikishKun: r.kun,
    ochiqPozitsiya: r.ochiq,
  }));
}

// ─── 11.8.4 ───────────────────────────────────────────────────────────────

export interface NavbatTurQatori {
  readonly tur: string;
  /** Hozir navbatda (usta olmagan) */
  readonly hozir: number;
  readonly engEskiKun: number | null;
  /** Davrda olingan ishlar — navbatda o'rtacha va eng uzun necha kun kutgan */
  readonly olingan: number;
  readonly ortachaKutishKun: number | null;
  readonly engUzunKutishKun: number | null;
}

export interface NavbatHolati {
  readonly hozir: number;
  readonly engEskiKun: number | null;
  /** «Materialga kutmoqda» — navbatda emas, lekin ustaga ham yetmaydi */
  readonly materialKutmoqda: number;
  readonly ortachaKutishKun: number | null;
  readonly engUzunKutishKun: number | null;
  readonly turlar: readonly NavbatTurQatori[];
}

/**
 * ⚠️ NAVBATGA KIRGAN VAQT — oxirgi «TASDIQLASH» audit yozuvi, u bo'lmasa
 *    pozitsiya yaratilgan payt (tasdiq kerak bo'lmagan pozitsiya darhol
 *    navbatga tushadi). Olingan vaqt — birinchi «ISH_OLINDI».
 */
export async function navbatHolati(filialId: number, davr: Davr): Promise<NavbatHolati> {
  const sql = ulanishOl();
  const kirish = sql`COALESCE((SELECT MAX(a.sana) FROM audit_jurnal a
                      WHERE a.obyekt_turi = 'buyurtma_pozitsiya' AND a.obyekt_id = p.id
                        AND a.amal = 'TASDIQLASH'), p.yaratildi)`;
  const [hozir, olingan, material] = await Promise.all([
    sql<{ tur: string | null; soni: number; eng_eski: string | null }[]>`
      SELECT t.nom AS tur, COUNT(*)::int AS soni,
             MAX(EXTRACT(EPOCH FROM now() - ${kirish}) / 86400)::numeric(10,1)::text AS eng_eski
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      LEFT JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
      WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
        AND p.holat IN ('TASDIQLANGAN','FILIALGA_YUBORILDI')
      GROUP BY t.nom`,
    sql<{ tur: string | null; soni: number; ortacha: string | null; eng_uzun: string | null }[]>`
      WITH o AS (
        SELECT p.id, p.mahsulot_tur_id,
               EXTRACT(EPOCH FROM ol.sana - ${kirish}) / 86400 AS kun
        FROM buyurtma_pozitsiya p
        JOIN buyurtma b ON b.id = p.buyurtma_id
        JOIN LATERAL (
          SELECT MIN(a.sana) AS sana FROM audit_jurnal a
          WHERE a.obyekt_turi = 'buyurtma_pozitsiya' AND a.obyekt_id = p.id AND a.amal = 'ISH_OLINDI'
        ) ol ON ol.sana IS NOT NULL
        WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
          AND ol.sana >= ${davr.boshi} AND ol.sana < ${davr.oxiri}
      )
      SELECT t.nom AS tur, COUNT(*)::int AS soni,
             AVG(GREATEST(o.kun, 0))::numeric(10,1)::text AS ortacha,
             MAX(GREATEST(o.kun, 0))::numeric(10,1)::text AS eng_uzun
      FROM o LEFT JOIN mahsulot_tur t ON t.id = o.mahsulot_tur_id
      GROUP BY t.nom`,
    sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId} AND p.holat = 'MATERIALGA_KUTMOQDA'`,
  ]);

  const nom = (x: string | null): string => x ?? 'Qo‘shimcha buyum';
  const son = (x: string | null | undefined): number | null => (x === null || x === undefined ? null : Number(x));
  const turNomlari = [...new Set([...hozir.map((h) => nom(h.tur)), ...olingan.map((o) => nom(o.tur))])];
  const turlar = turNomlari
    .map((tur) => {
      const h = hozir.find((x) => nom(x.tur) === tur);
      const o = olingan.find((x) => nom(x.tur) === tur);
      return {
        tur,
        hozir: h?.soni ?? 0,
        engEskiKun: son(h?.eng_eski),
        olingan: o?.soni ?? 0,
        ortachaKutishKun: son(o?.ortacha),
        engUzunKutishKun: son(o?.eng_uzun),
      };
    })
    // «Qaysi mahsulot turi uzoq kutmoqda» — eng eskisi tepada
    .sort((a, b) => (b.engEskiKun ?? -1) - (a.engEskiKun ?? -1) || (b.ortachaKutishKun ?? -1) - (a.ortachaKutishKun ?? -1));

  const jamiOlingan = olingan.reduce((y, o) => y + o.soni, 0);
  const ortacha =
    jamiOlingan === 0
      ? null
      : Number((olingan.reduce((y, o) => y + Number(o.ortacha ?? 0) * o.soni, 0) / jamiOlingan).toFixed(1));
  const engUzunlar = olingan.map((o) => Number(o.eng_uzun ?? 0));
  const engEskilar = hozir.map((h) => Number(h.eng_eski ?? 0));

  return {
    hozir: hozir.reduce((y, h) => y + h.soni, 0),
    engEskiKun: engEskilar.length === 0 ? null : Math.max(...engEskilar),
    materialKutmoqda: material[0]?.n ?? 0,
    ortachaKutishKun: ortacha,
    engUzunKutishKun: engUzunlar.length === 0 ? null : Math.max(...engUzunlar),
    turlar,
  };
}
