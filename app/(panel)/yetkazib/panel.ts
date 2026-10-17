/**
 * TZ 11.11 — Yetkazib beruvchilar sahifasi paneli. 2026-10-17
 *
 *   Holat : jami qarzimiz (so'm va dollar alohida) · avansdagilar
 *   Davr  : kirim (xarid) summasi · o'rtacha brak %
 *   Diqqat: muddati o'tgan to'lov · muddati yaqin (7 kun) · ochiq da'vo
 *
 * ⚠️ Qarz, avans va muddat — yetkazibHolatlari (ro'yxat va kartochka bilan
 *    bitta taqsimot). Xarid — qarz jurnalining XARID yozuvlari (hujjat
 *    valyutasida, 1.3 — qo'shilmaydi). Da'vo — ochiqDavoSharti.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa, oldingiShuKungacha, type Davr } from '@/lib/domain/hisobot/davr';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { VAQT_ZONASI, toshkentKuni } from '@/lib/domain/sana';
import type { PanelBandi } from '../modul-panel';
import { yetkazibHolatlari, type YetkazibHolati } from './taqsimot';
import { ochiqDavoSharti } from './malumot';

/** «Muddati yaqin» — shu kun ichida to'lanishi kerak, hali o'tmagan */
const YAQIN_KUN = 7;

const juft = (s: Decimal, u: Decimal): { qiymat: string; izoh: string | null } => ({
  qiymat: pulKorsat(som(s.toFixed(2))),
  izoh: u.isZero() ? null : `$ ${pulKorsat(dollar(u.toFixed(2)))}`,
});

async function xaridVaBrak(d: Davr): Promise<{ som: string; usd: string; brak: number | null }> {
  const sql = ulanishOl();
  const [x, b] = await Promise.all([
    sql<{ valyuta: string; summa: string }[]>`
      SELECT valyuta, SUM(summa)::numeric(14,2)::text AS summa FROM yetkazib_beruvchi_harakat
      WHERE turi = 'XARID' AND sana >= ${d.boshi} AND sana < ${d.oxiri}
      GROUP BY valyuta`,
    sql<{ defekt: string | null; jami: string | null }[]>`
      SELECT SUM(kq.defekt_miqdor)::text AS defekt, SUM(kq.miqdor_kirim)::text AS jami
      FROM kirim_qator kq JOIN kirim k ON k.id = kq.kirim_id
      WHERE k.holat = 'FAOL'
        AND k.sana >= (${d.boshi}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
        AND k.sana < (${d.oxiri}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date`,
  ]);
  const jami = new Decimal(b[0]?.jami ?? 0);
  return {
    som: x.find((r) => r.valyuta === 'SOM')?.summa ?? '0',
    usd: x.find((r) => r.valyuta === 'USD')?.summa ?? '0',
    brak: jami.isZero() ? null : new Decimal(b[0]?.defekt ?? 0).div(jami).times(100).toDecimalPlaces(1).toNumber(),
  };
}

export async function yetkazibPaneli(
  /** Sahifa allaqachon hisoblagan bo'lsa — ikkinchi marta hisoblanmaydi */
  tayyor?: Map<number, YetkazibHolati>,
): Promise<{ holat: PanelBandi[]; davr: PanelBandi[]; diqqat: PanelBandi[] }> {
  const sql = ulanishOl();
  const davr = davrYasa('OY', new Date());
  const oldin = oldingiShuKungacha(davr);
  const bugun = toshkentKuni();
  const chegara = toshkentKuni(new Date(Date.now() + YAQIN_KUN * 86_400_000));

  const [holatlar, joriy, otgan, davo] = await Promise.all([
    tayyor ?? yetkazibHolatlari(null),
    xaridVaBrak(davr),
    xaridVaBrak(oldin),
    sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kirim_qator kq JOIN kirim k ON k.id = kq.kirim_id
      WHERE ${ochiqDavoSharti(sql)}`,
  ]);

  const qarz = { s: new Decimal(0), u: new Decimal(0) };
  const avans = { s: new Decimal(0), u: new Decimal(0), soni: 0 };
  const otganJami = { s: new Decimal(0), u: new Decimal(0) };
  let otganSoni = 0;
  let yaqinSoni = 0;
  for (const h of holatlar.values()) {
    const qs = new Decimal(h.taqsimot.qarz.SOM);
    const qu = new Decimal(h.taqsimot.qarz.USD);
    if (qs.gt(0)) qarz.s = qarz.s.plus(qs);
    if (qu.gt(0)) qarz.u = qarz.u.plus(qu);
    if (qs.lt(0) || qu.lt(0)) {
      avans.soni += 1;
      if (qs.lt(0)) avans.s = avans.s.minus(qs);
      if (qu.lt(0)) avans.u = avans.u.minus(qu);
    }
    if (h.muddat.muddatOtganSoni > 0) {
      otganSoni += 1;
      otganJami.s = otganJami.s.plus(h.muddat.muddatOtgan.SOM);
      otganJami.u = otganJami.u.plus(h.muddat.muddatOtgan.USD);
    } else if (h.muddat.yaqinMuddat !== null && h.muddat.yaqinMuddat >= bugun && h.muddat.yaqinMuddat <= chegara) {
      yaqinSoni += 1;
    }
  }
  const oldinMatn = "o'tgan oyning shu kunigacha";
  const q = juft(qarz.s, qarz.u);
  const a = juft(avans.s, avans.u);
  const xj = juft(new Decimal(joriy.som), new Decimal(joriy.usd));
  const ot = juft(otganJami.s, otganJami.u);

  return {
    holat: [
      { nom: 'Jami qarzimiz', qiymat: q.qiymat, izoh: q.izoh, havola: '/yetkazib?filtr=qarz' },
      { nom: 'Avansdagilar', qiymat: `${String(avans.soni)} ta`, izoh: avans.soni > 0 ? [a.qiymat, a.izoh].filter(Boolean).join(' · ') : null },
    ],
    davr: [
      {
        nom: 'Xarid',
        qiymat: xj.qiymat,
        izoh: [xj.izoh, `${oldinMatn}: ${pulKorsat(som(otgan.som))}`].filter(Boolean).join(' · '),
        havola: '/ombor/kirim',
      },
      {
        nom: "O'rtacha brak",
        qiymat: joriy.brak === null ? '—' : `${joriy.brak.toFixed(1)}%`,
        izoh: `${oldinMatn}: ${otgan.brak === null ? '—' : `${otgan.brak.toFixed(1)}%`}`,
      },
    ],
    diqqat: [
      {
        nom: "Muddati o'tgan to'lov",
        qiymat: String(otganSoni),
        izoh: otganSoni > 0 ? [ot.qiymat, ot.izoh].filter(Boolean).join(' · ') : null,
        havola: '/yetkazib?filtr=muddat',
        ton: otganSoni > 0 ? 'xavf' : null,
      },
      {
        nom: `Muddati yaqin (${String(YAQIN_KUN)} kun)`,
        qiymat: String(yaqinSoni),
        havola: '/yetkazib?filtr=qarz',
        ton: yaqinSoni > 0 ? 'ogoh' : null,
      },
      { nom: "Ochiq da'vo", qiymat: String(davo[0]?.n ?? 0), havola: '/yetkazib', ton: (davo[0]?.n ?? 0) > 0 ? 'ogoh' : null },
    ],
  };
}
