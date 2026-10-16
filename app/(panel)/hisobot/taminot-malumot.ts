/**
 * TZ 11.9.1 — narx dinamikasi: qaysi material qimmatlashayapti, qaysi
 * yetkazib beruvchi narxni ko'targan. 9.8 narx tarixining umumiy ko'rinishi.
 * 2026-10-15
 *
 * ⚠️ SOLISHTIRMA NARX — sarflash birligiga (kv.m, metr, dona) keltirilgan,
 *    SO'MDAGI kelish narxi (transport bilan): kirim qatoridan tug'ilgan
 *    bo'laklarning `tannarx_birlik_snapshot` i. Kirimdagi `narx_birlik` emas —
 *    u bir safar rulonga, bir safar metrga, ba'zan dollarda kiritiladi va
 *    to'g'ridan solishtirib bo'lmaydi.
 * ⚠️ Dollarda qotgan tannarxli bo'laklar kirmaydi (1.3).
 * ⚠️ Faqat FAOL kirim; storno qilingani tarixni buzmasin.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import type { Davr } from '@/lib/domain/hisobot/davr';
import { narxOzgarishi } from '@/lib/domain/hisobot/narx-dinamika';
import { VAQT_ZONASI, toshkentKuni } from '@/lib/domain/sana';

/** Bitta kelish — kirim qatori, solishtirma narx bilan */
export interface Nuqta {
  readonly kirimRaqam: string;
  readonly materialId: number;
  readonly material: string;
  readonly birlik: string;
  readonly yetkazibId: number | null;
  readonly yetkazib: string | null;
  readonly sana: string;
  readonly narx: string;
}

export interface MaterialDinamikasi {
  readonly materialId: number;
  readonly material: string;
  readonly birlik: string;
  /** Oxirgi uchta kelish, eskidan yangiga */
  readonly narxlar: readonly { readonly sana: string; readonly narx: string; readonly yetkazib: string | null }[];
  readonly foiz: number | null;
  readonly oylar: number | null;
}

export interface YetkazibDinamikasi {
  readonly yetkazibId: number;
  readonly nom: string;
  /** Davrdagi kelishlar, o'sha yetkazib beruvchining shu materialdagi oldingi kelishi bilan solishtirilgan */
  readonly solishtirildi: number;
  readonly kotardi: number;
  readonly tushirdi: number;
  readonly ortachaFoiz: number | null;
  readonly engKatta: { readonly material: string; readonly foiz: number } | null;
}

export interface NarxDinamikasi {
  readonly materiallar: readonly MaterialDinamikasi[];
  readonly yetkazibBeruvchilar: readonly YetkazibDinamikasi[];
}

/**
 * Davr oxirigacha, 2 yil oldindan boshlab har kelish (kirim qatori) va uning
 * solishtirma narxi. Hisobot va eksportning xom varag'i — bitta manba.
 */
export async function kelishNuqtalari(filialId: number, davr: Davr): Promise<Nuqta[]> {
  const q = await ulanishOl()<
    {
      kirim_raqam: string;
      material_id: number;
      material: string;
      birlik: string;
      yetkazib_id: number | null;
      yetkazib: string | null;
      sana: string;
      narx: string;
    }[]
  >`
    SELECT k.raqam AS kirim_raqam, kq.material_id, m.nom AS material, m.sarflash_birligi AS birlik,
           k.yetkazib_beruvchi_id AS yetkazib_id, y.nom AS yetkazib,
           k.sana::text AS sana,
           MIN(b.tannarx_birlik_snapshot)::numeric(14,2)::text AS narx
    FROM kirim_qator kq
    JOIN kirim k ON k.id = kq.kirim_id
    JOIN material m ON m.id = kq.material_id
    LEFT JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
    JOIN bolak b ON b.kirim_qator_id = kq.id AND b.tannarx_valyuta_snapshot = 'SOM'
    WHERE k.filial_id = ${filialId} AND k.holat = 'FAOL'
      -- Davrdan oldingi kelish ham kerak — solishtirish asosi
      AND k.sana >= ((${davr.boshi}::timestamptz AT TIME ZONE ${VAQT_ZONASI}) - interval '2 years')::date
      AND k.sana < (${davr.oxiri}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
    GROUP BY kq.id, k.raqam, kq.material_id, m.nom, m.sarflash_birligi, k.yetkazib_beruvchi_id, y.nom, k.sana, k.id
    ORDER BY kq.material_id, k.sana, k.id, kq.id`;

  return q.map((r) => ({
    kirimRaqam: r.kirim_raqam,
    materialId: r.material_id,
    material: r.material,
    birlik: r.birlik,
    yetkazibId: r.yetkazib_id,
    yetkazib: r.yetkazib,
    sana: r.sana,
    narx: r.narx,
  }));
}

export async function narxDinamikasi(filialId: number, davr: Davr): Promise<NarxDinamikasi> {
  const nuqtalar = await kelishNuqtalari(filialId, davr);
  // ⚠️ Toshkent sanasi — toISOString UTC beradi va davr bir kun oldin boshlanardi
  const boshi = toshkentKuni(davr.boshi);
  const davrda = (sana: string): boolean => sana >= boshi;

  // ── Material: oxirgi uchta kelish; oxirgisi davrda bo'lganlar ──
  const materialBoyicha = new Map<number, Nuqta[]>();
  for (const n of nuqtalar) {
    const r = materialBoyicha.get(n.materialId) ?? [];
    r.push(n);
    materialBoyicha.set(n.materialId, r);
  }
  const materiallar: MaterialDinamikasi[] = [];
  for (const r of materialBoyicha.values()) {
    const oxirgi3 = r.slice(-3);
    const oxirgi = oxirgi3[oxirgi3.length - 1];
    if (oxirgi === undefined || !davrda(oxirgi.sana) || oxirgi3.length < 2) continue;
    const o = narxOzgarishi(oxirgi3.map((n) => ({ sana: n.sana, narx: n.narx, kalit: 'SOM' })));
    materiallar.push({
      materialId: oxirgi.materialId,
      material: oxirgi.material,
      birlik: oxirgi.birlik,
      narxlar: oxirgi3.map((n) => ({ sana: n.sana, narx: n.narx, yetkazib: n.yetkazib })),
      foiz: o.foiz,
      oylar: o.oylar,
    });
  }
  materiallar.sort((a, b) => (b.foiz ?? -Infinity) - (a.foiz ?? -Infinity));

  // ── Yetkazib beruvchi: o'z oldingi kelishiga nisbatan ──
  const juft = new Map<string, Nuqta[]>();
  for (const n of nuqtalar) {
    if (n.yetkazibId === null) continue;
    const k = `${String(n.yetkazibId)}:${String(n.materialId)}`;
    const r = juft.get(k) ?? [];
    r.push(n);
    juft.set(k, r);
  }
  const yb = new Map<number, { nom: string; foizlar: { material: string; foiz: number }[] }>();
  for (const r of juft.values()) {
    for (let i = 1; i < r.length; i++) {
      const old = r[i - 1];
      const yangi = r[i];
      if (old === undefined || yangi === undefined || yangi.yetkazibId === null || !davrda(yangi.sana)) continue;
      const o = narxOzgarishi([
        { sana: old.sana, narx: old.narx, kalit: 'SOM' },
        { sana: yangi.sana, narx: yangi.narx, kalit: 'SOM' },
      ]);
      if (o.foiz === null) continue;
      const u = yb.get(yangi.yetkazibId) ?? { nom: yangi.yetkazib ?? '—', foizlar: [] };
      u.foizlar.push({ material: yangi.material, foiz: o.foiz });
      yb.set(yangi.yetkazibId, u);
    }
  }
  const yetkazibBeruvchilar: YetkazibDinamikasi[] = [...yb.entries()]
    .map(([yetkazibId, u]) => {
      const eng = u.foizlar.reduce<{ material: string; foiz: number } | null>(
        (a, b) => (a === null || b.foiz > a.foiz ? b : a),
        null,
      );
      const ortacha = u.foizlar
        .reduce((y, f) => y.plus(f.foiz), new Decimal(0))
        .div(u.foizlar.length)
        .toDecimalPlaces(1)
        .toNumber();
      return {
        yetkazibId,
        nom: u.nom,
        solishtirildi: u.foizlar.length,
        kotardi: u.foizlar.filter((f) => f.foiz > 0).length,
        tushirdi: u.foizlar.filter((f) => f.foiz < 0).length,
        ortachaFoiz: ortacha,
        engKatta: eng !== null && eng.foiz > 0 ? eng : null,
      };
    })
    .sort((a, b) => (b.ortachaFoiz ?? 0) - (a.ortachaFoiz ?? 0));

  return { materiallar, yetkazibBeruvchilar };
}
