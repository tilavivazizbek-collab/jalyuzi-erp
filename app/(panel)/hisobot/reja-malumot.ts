/**
 * Reja va fakt — TZ 21.5 · 21.6. 2026-10-13.
 *
 * ⚠️ FAKT TOPSHIRILGAN OYGA yoziladi (21.5): pozitsiya qachon mijozga
 *    berilgan bo'lsa, o'sha oy. Sana audit jurnalidan — `TOPSHIRISH` yoki
 *    qo'lda «Topshirildi» ga tuzatilgan (`HOLAT_QOLDA_TUZATILDI`) eng
 *    birinchisi. Qaytarish — qaytarilgan oyda ayiriladi (21.5.1).
 * ⚠️ Tushum, tannarx, ish haqi — `pozitsiyaNatijasiUstunlari` (bitta joy,
 *    filiallararo qarz bilan bir xil). Yig'ish — `rejaFaktiniYigish`.
 * ⚠️ Korxona = hamma filial yig'indisi (topshirish asosida). Moliya
 *    sahifasidagi foyda-zarar (11.4.1) SOTILGAN oy bo'yicha — raqamlar
 *    farq qilishi mumkin, bu kutilgan.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { kunigaBirMartaOgohlantir } from '@/lib/amal/bildirishnoma';
import { rejaSozlamalari } from '@/lib/amal/reja-sozlama';
import { oylikYakunMatni } from '@/lib/domain/bildirishnoma';
import { toshkentKuni } from '@/lib/domain/sana';
import { pozitsiyaNatijasiUstunlari } from '@/lib/amal/filial-harakat';
import { rolBormi, type Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import {
  oyBoshi,
  oyNomi,
  oyQosh,
  rejaFaktiniYigish,
  rejaKaliti,
  type FaktQatori,
  type RejaFakti,
  type RejaTuri,
} from '@/lib/domain/reja';

export async function rejaFakti(oy: string): Promise<RejaFakti> {
  const sql = ulanishOl();
  const keyingi = oyQosh(oy, 1);
  const q = await sql<
    {
      turi: 'TOPSHIRILDI' | 'QAYTARILDI';
      sotuvchi_id: number;
      sf: number;
      isf: number;
      tushum: string;
      tannarx: string;
      ish_haqi: string;
    }[]
  >`
    WITH topshirish AS (
      SELECT a.obyekt_id AS pid, MIN(a.sana) AS sana
      FROM audit_jurnal a
      WHERE a.obyekt_turi = 'buyurtma_pozitsiya'
        AND a.sana < ${keyingi}::date
        AND (a.amal = 'TOPSHIRISH'
             OR (a.amal = 'HOLAT_QOLDA_TUZATILDI' AND a.yangi_qiymat ->> 'holat' = 'TOPSHIRILDI'))
      GROUP BY a.obyekt_id
    )
    SELECT 'TOPSHIRILDI' AS turi, b.sotuvchi_id, b.sotgan_filial_id AS sf,
           b.ishlab_chiqaruvchi_filial_id AS isf,
           ${pozitsiyaNatijasiUstunlari(sql)}
    FROM topshirish t
    JOIN buyurtma_pozitsiya p ON p.id = t.pid
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE t.sana >= ${oy}::date
      -- Hozir ham topshirilgan yoki keyin qaytarilgan (qaytarish o'z oyida ayiriladi)
      AND p.holat IN ('TOPSHIRILDI', 'QAYTARILGAN')

    UNION ALL

    SELECT 'QAYTARILDI', b.sotuvchi_id, b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id,
           (-(a.yangi_qiymat ->> 'qaytarildi')::numeric
             * CASE WHEN b.valyuta = 'USD' THEN b.kurs_snapshot ELSE 1 END)::numeric(14,2)::text,
           -- kurs, tannarx, ish haqi — birinchi qism ustunlari bilan bir xil tartibda
           NULL, '0', '0'
    FROM audit_jurnal a
    JOIN buyurtma_pozitsiya p ON p.id = a.obyekt_id
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE a.amal = 'QAYTARISH' AND a.obyekt_turi = 'buyurtma_pozitsiya'
      AND a.sana >= ${oy}::date AND a.sana < ${keyingi}::date`;

  return rejaFaktiniYigish(
    q.map(
      (x): FaktQatori => ({
        turi: x.turi,
        sotuvchiId: x.sotuvchi_id,
        sotganFilialId: x.sf,
        ishlabFilialId: x.isf,
        tushum: x.tushum,
        tannarx: x.tannarx,
        ishHaqi: x.ish_haqi,
      }),
    ),
  );
}

export interface RejaFaktQatori {
  readonly kalit: string;
  readonly turi: RejaTuri;
  readonly nom: string;
  readonly filialId: number | null;
  readonly rejaTushum: string | null;
  readonly rejaFoyda: string | null;
  readonly faktTushum: string;
  /** Sotuvchida `null` — foyda rejasi yo'q (21.2) */
  readonly faktFoyda: string | null;
  readonly ozgargan: boolean;
}

/**
 * Hisobot qatorlari — reja va fakt birga. Reja qo'yilmagan, lekin fakti
 * bor filial/sotuvchi ham chiqadi («reja yo'q», EC-REJ-01).
 *
 * @param filialIdlar `null` — hamma filial (bosh admin)
 */
export async function rejaFaktQatorlari(
  oy: string,
  filialIdlar: readonly number[] | null,
): Promise<RejaFaktQatori[]> {
  const sql = ulanishOl();
  const [fakt, filiallar, sotuvchilar, rejalar] = await Promise.all([
    rejaFakti(oy),
    sql<{ id: number; nom: string }[]>`
      SELECT id, nom FROM filial WHERE faol AND ochirildi IS NULL ORDER BY bosh DESC, nom`,
    sql<{ id: number; ism: string }[]>`SELECT id, ism FROM xodim`,
    sql<
      {
        turi: RejaTuri;
        filial_id: number | null;
        xodim_id: number | null;
        tushum: string | null;
        foyda: string | null;
        oy_ichida_ozgardi: boolean;
      }[]
    >`SELECT turi, filial_id, xodim_id, tushum::text, foyda::text, oy_ichida_ozgardi FROM reja WHERE oy = ${oy}`,
  ]);
  const ism = new Map(sotuvchilar.map((x) => [x.id, x.ism]));
  const filialNomi = new Map(filiallar.map((x) => [x.id, x.nom]));
  const reja = new Map(rejalar.map((r) => [rejaKaliti(r.turi, r.filial_id, r.xodim_id), r]));
  const korinadi = (id: number): boolean => filialIdlar === null || filialIdlar.includes(id);

  const natija: RejaFaktQatori[] = [];
  if (filialIdlar === null) {
    const k = rejaKaliti('KORXONA', null, null);
    natija.push({
      kalit: k,
      turi: 'KORXONA',
      nom: 'Korxona',
      filialId: null,
      rejaTushum: reja.get(k)?.tushum ?? null,
      rejaFoyda: reja.get(k)?.foyda ?? null,
      faktTushum: fakt.korxona.tushum,
      faktFoyda: fakt.korxona.foyda,
      ozgargan: reja.get(k)?.oy_ichida_ozgardi ?? false,
    });
  }
  for (const f of filiallar) {
    if (!korinadi(f.id)) continue;
    const k = rejaKaliti('FILIAL', f.id, null);
    const fk = fakt.filiallar.get(f.id);
    if (reja.get(k) === undefined && fk === undefined) continue;
    natija.push({
      kalit: k,
      turi: 'FILIAL',
      nom: f.nom,
      filialId: f.id,
      rejaTushum: reja.get(k)?.tushum ?? null,
      rejaFoyda: reja.get(k)?.foyda ?? null,
      faktTushum: fk?.tushum ?? '0.00',
      faktFoyda: fk?.foyda ?? '0.00',
      ozgargan: reja.get(k)?.oy_ichida_ozgardi ?? false,
    });
  }
  // Sotuvchi — reja qo'yilganlar va fakti borlar (birlashma)
  const sotuvchiKalitlari = new Set<string>([
    ...rejalar.filter((r) => r.turi === 'SOTUVCHI').map((r) => `${String(r.filial_id)}|${String(r.xodim_id)}`),
    ...fakt.sotuvchilar.keys(),
  ]);
  for (const fx of [...sotuvchiKalitlari].sort()) {
    const [fid, xid] = fx.split('|').map(Number);
    if (fid === undefined || xid === undefined || !korinadi(fid)) continue;
    const k = rejaKaliti('SOTUVCHI', fid, xid);
    natija.push({
      kalit: k,
      turi: 'SOTUVCHI',
      nom: `${ism.get(xid) ?? '—'} · ${filialNomi.get(fid) ?? ''}`,
      filialId: fid,
      rejaTushum: reja.get(k)?.tushum ?? null,
      rejaFoyda: null,
      faktTushum: fakt.sotuvchilar.get(fx) ?? '0.00',
      faktFoyda: null,
      ozgargan: reja.get(k)?.oy_ichida_ozgardi ?? false,
    });
  }
  return natija;
}

export interface DashboardRejasi {
  readonly sarlavha: string;
  /** `null` — reja qo'yilmagan (EC-REJ-01) */
  readonly reja: string | null;
  readonly fakt: string;
  readonly oy: string;
}

/**
 * TZ 21.7 — dashboardning birinchi qatori. Kim kirsa, O'ZINIKI:
 * bosh filial admini — korxona, filial admini — filial, sotuvchi — o'z
 * rejasi. Usta va omborchiga — `null` (reja yo'q, 21.2).
 *
 * ⚠️ Sotuvchi o'z rejasini `reja.kor` ruxsatisiz ham ko'radi (21.7).
 */
export async function dashboardRejasi(f: Foydalanuvchi, oy: string): Promise<DashboardRejasi | null> {
  const admin = rolBormi(f, 'ADMIN');
  const sotuvchi = rolBormi(f, 'SOTUVCHI');
  if (!admin && !sotuvchi) return null;

  const turi: RejaTuri = admin ? (f.boshFilialda ? 'KORXONA' : 'FILIAL') : 'SOTUVCHI';
  const filialId = turi === 'KORXONA' ? null : f.filialId;
  const xodimId = turi === 'SOTUVCHI' ? f.xodimId : null;

  const [fakt, r] = await Promise.all([
    rejaFakti(oy),
    ulanishOl()<{ tushum: string | null }[]>`
      SELECT tushum::text FROM reja
      WHERE oy = ${oy} AND turi = ${turi}
        AND COALESCE(filial_id, 0) = ${filialId ?? 0} AND COALESCE(xodim_id, 0) = ${xodimId ?? 0}`,
  ]);
  return {
    sarlavha: turi === 'KORXONA' ? 'Korxona rejasi' : turi === 'FILIAL' ? 'Filial rejasi' : 'Mening rejam',
    reja: r[0]?.tushum ?? null,
    fakt:
      turi === 'KORXONA'
        ? fakt.korxona.tushum
        : turi === 'FILIAL'
          ? (fakt.filiallar.get(f.filialId)?.tushum ?? '0.00')
          : (fakt.sotuvchilar.get(`${String(f.filialId)}|${String(f.xodimId)}`) ?? '0.00'),
    oy,
  };
}

/**
 * TZ 21.8 — oylik yakun (har oyning 1-kuni): O'TGAN oy reja va fakti.
 *
 * ⚠️ IKKI XIL XABAR: bosh filial adminlari — korxona va hamma filial
 *    (bitta xabar); boshqa filial adminlari — faqat o'z filiali va uning
 *    sotuvchilari. Bosh admin har filial nusxasini OLMAYDI — aks holda
 *    bir xil raqamlarni N marta olardi.
 * ⚠️ HISOBOT OYI UCHUN BIR MARTA: oy manba turining ichida
 *    («oylik_yakun:2026-09»). Cron 2-kuni yoki keyinroq yana chaqirilsa
 *    ham o'sha oy qayta yuborilmaydi.
 * ⚠️ Reja ham, fakt ham yo'q filialga xabar ketmaydi.
 */
export async function oylikYakunXabarlari(
  hozir: Date = new Date(),
  filialIdlar?: readonly number[],
): Promise<{ filiallar: number; xabarlar: number }> {
  const sql = ulanishOl();
  const bugun = toshkentKuni(hozir);
  const oy = oyQosh(oyBoshi(bugun), -1);
  // TZ 21.10 — «Oylik yakun xabari yuborilsinmi»
  const sozlama = await rejaSozlamalari(sql);
  if (!sozlama.oylikXabar) return { filiallar: 0, xabarlar: 0 };
  const matn = (q: readonly RejaFaktQatori[]): string | null => {
    const bor = q.filter((x) => x.rejaTushum !== null || !new Decimal(x.faktTushum).isZero());
    if (bor.length === 0) return null;
    return oylikYakunMatni({
      oyNomi: oyNomi(oy),
      chegara: sozlama,
      qatorlar: bor.map((x) => ({
        nom: x.nom,
        reja: x.rejaTushum,
        fakt: x.faktTushum,
        ichki: x.turi !== 'KORXONA' && !(x.turi === 'FILIAL' && bor.every((y) => y.turi !== 'KORXONA')),
      })),
    });
  };

  const korxona = await kunigaBirMartaOgohlantir(sql, {
    hodisa: 'OYLIK_YAKUN',
    manbaTuri: `oylik_yakun:${oy.slice(0, 7)}`,
    bugun,
    davrBoshi: null,
    filialIdlar,
    qoshimchaShart: sql`AND f.bosh`,
    // Korxona va filiallar — sotuvchilar filial xabarida
    matnYasa: async () => matn((await rejaFaktQatorlari(oy, null)).filter((x) => x.turi !== 'SOTUVCHI')),
  });
  const filial = await kunigaBirMartaOgohlantir(sql, {
    hodisa: 'OYLIK_YAKUN',
    manbaTuri: `oylik_yakun_filial:${oy.slice(0, 7)}`,
    bugun,
    davrBoshi: null,
    filialIdlar,
    qoshimchaShart: sql`AND NOT f.bosh`,
    boshAdmingaNusxa: false,
    matnYasa: async (filialId) => matn(await rejaFaktQatorlari(oy, [filialId])),
  });
  return { filiallar: korxona.filiallar + filial.filiallar, xabarlar: korxona.xabarlar + filial.xabarlar };
}
