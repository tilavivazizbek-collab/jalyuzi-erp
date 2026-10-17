/**
 * TZ 11.11 — Xodimlar sahifasi paneli. 2026-10-17
 *
 *   Holat : xodim soni · jami balans · manfiy balansdagilar
 *   Davr  : hisoblangan haq · to'langan · brak ushlanmalari
 *   Diqqat: manfiy balans · uzoq to'lanmagan · bot ulanmagan · stavkasiz bajarilgan ish
 *
 * ⚠️ Balans — xodimBalanslari (kassa sahifasi bilan bitta, 10.4): saqlanmaydi,
 *    xodim_harakat yig'indisi. So'mda; dollar balans izohda.
 * ⚠️ «Uzoq to'lanmagan» — balansi musbat (korxona qarzdor) va oxirgi
 *    UZOQ_KUN kunda TOLOV yo'q.
 * ⚠️ «Stavkasiz ish» — «Tugatdim» bosilgan, stavka topilmagani uchun haq
 *    yozilmagan pozitsiya (stavka_snapshot bo'sh; 10.12 — adminga xabar ketgan).
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa, oldingiShuKungacha, type Davr } from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import type { PanelBandi } from '../modul-panel';
import { xodimBalanslari } from '../kassa/malumot';

const UZOQ_KUN = 30;

async function davrHarakati(filialId: number, d: Davr): Promise<{ haq: string; tolov: string; ushlanma: string }> {
  const q = await ulanishOl()<{ haq: string | null; tolov: string | null; ushlanma: string | null }[]>`
    SELECT SUM(summa) FILTER (WHERE turi IN ('HAQ','HAQ_BEKOR'))::numeric(14,2)::text AS haq,
           (-SUM(summa) FILTER (WHERE turi = 'TOLOV'))::numeric(14,2)::text AS tolov,
           (-SUM(summa) FILTER (WHERE turi IN ('USHLANMA','JARIMA')))::numeric(14,2)::text AS ushlanma
    FROM xodim_harakat
    WHERE filial_id = ${filialId} AND valyuta = 'SOM' AND sana >= ${d.boshi} AND sana < ${d.oxiri}`;
  return { haq: q[0]?.haq ?? '0', tolov: q[0]?.tolov ?? '0', ushlanma: q[0]?.ushlanma ?? '0' };
}

export async function xodimPaneli(filialId: number): Promise<{ holat: PanelBandi[]; davr: PanelBandi[]; diqqat: PanelBandi[] }> {
  const sql = ulanishOl();
  const davr = davrYasa('OY', new Date());
  const oldin = oldingiShuKungacha(davr);
  const [balanslar, soni, joriy, otgan, uzoq, stavkasiz] = await Promise.all([
    xodimBalanslari(filialId),
    sql<{ jami: number; botsiz: number }[]>`
      SELECT COUNT(*)::int AS jami, COUNT(*) FILTER (WHERE telegram_id IS NULL)::int AS botsiz
      FROM xodim WHERE filial_id = ${filialId} AND faol = true`,
    davrHarakati(filialId, davr),
    davrHarakati(filialId, oldin),
    sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM (
        SELECT h.xodim_id FROM xodim_harakat h JOIN xodim x ON x.id = h.xodim_id
        WHERE x.filial_id = ${filialId} AND x.faol = true AND h.valyuta = 'SOM'
        GROUP BY h.xodim_id
        HAVING SUM(h.summa) > 0
           AND COALESCE(MAX(h.sana) FILTER (WHERE h.turi = 'TOLOV'), '-infinity')
               < now() - make_interval(days => ${UZOQ_KUN})
      ) t`,
    sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma_pozitsiya p JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
        AND p.tugatildi IS NOT NULL AND p.stavka_snapshot IS NULL AND p.usta_id IS NOT NULL
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')`,
  ]);

  const jami = balanslar.reduce((y, b) => y.plus(b.somBalans), new Decimal(0));
  const jamiUsd = balanslar.reduce((y, b) => y.plus(b.dollarBalans), new Decimal(0));
  const manfiy = balanslar.filter((b) => new Decimal(b.somBalans).lt(0) || new Decimal(b.dollarBalans).lt(0));
  const manfiyJami = manfiy.reduce((y, b) => y.plus(Decimal.min(b.somBalans, 0)), new Decimal(0));
  const s = soni[0];
  const so = (x: string): string => pulKorsat(som(x));
  const oldinMatn = "o'tgan oyning shu kunigacha";
  const uzoqSoni = uzoq[0]?.n ?? 0;
  const stavkasizSoni = stavkasiz[0]?.n ?? 0;
  const botsiz = s?.botsiz ?? 0;

  return {
    holat: [
      { nom: 'Xodimlar', qiymat: String(s?.jami ?? 0), izoh: 'faol' },
      {
        nom: 'Jami balans',
        qiymat: so(jami.toFixed(2)),
        izoh: jamiUsd.isZero() ? 'korxona xodimlarga qarzdor (+)' : `$ ${jamiUsd.toFixed(2)}`,
        havola: '/kassa',
      },
      { nom: 'Manfiy balansdagilar', qiymat: `${String(manfiy.length)} ta`, izoh: manfiy.length > 0 ? so(manfiyJami.toFixed(2)) : null },
    ],
    davr: [
      { nom: 'Hisoblangan haq', qiymat: so(joriy.haq), izoh: `${oldinMatn}: ${so(otgan.haq)}`, havola: '/hisobot/ishlab' },
      { nom: "To'langan", qiymat: so(joriy.tolov), izoh: `${oldinMatn}: ${so(otgan.tolov)}` },
      { nom: 'Brak ushlanmalari', qiymat: so(joriy.ushlanma), izoh: `${oldinMatn}: ${so(otgan.ushlanma)}` },
    ],
    diqqat: [
      {
        nom: 'Manfiy balans',
        qiymat: String(manfiy.length),
        izoh: manfiy.length > 0 ? manfiy.slice(0, 3).map((m) => m.ism).join(', ') : null,
        havola: '/kassa',
        ton: manfiy.length > 0 ? 'ogoh' : null,
      },
      {
        nom: `Uzoq to'lanmagan (${String(UZOQ_KUN)}+ kun)`,
        qiymat: String(uzoqSoni),
        havola: '/kassa',
        ton: uzoqSoni > 0 ? 'xavf' : null,
      },
      { nom: 'Botga ulanmagan', qiymat: String(botsiz), izoh: 'ish xabarlari bormaydi', ton: botsiz > 0 ? 'ogoh' : null },
      {
        nom: 'Stavkasiz bajarilgan ish',
        qiymat: String(stavkasizSoni),
        izoh: stavkasizSoni > 0 ? 'haq yozilmagan' : null,
        havola: '/stavka',
        ton: stavkasizSoni > 0 ? 'xavf' : null,
      },
    ],
  };
}
