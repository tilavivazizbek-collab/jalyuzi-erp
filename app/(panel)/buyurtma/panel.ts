/**
 * TZ 11.11 — Buyurtmalar sahifasi paneli. 2026-10-17
 *
 *   Holat : ochiq buyurtma · ishlab chiqarilmoqda · tayyor, topshirilmagan
 *   Davr  : buyurtma soni · tushum · o'rtacha chek · qaytarish %
 *   Diqqat: tasdiq kutmoqda · muddati o'tgan · materialga kutmoqda · navbatda uzoq turgan
 *
 * ⚠️ Har raqam o'z manbasidan: ochiq buyurtma — dashboard bilan bir xil shart;
 *    davr — sotuvDinamikasi (Sotuv hisoboti), o'tgan oyning SHU KUNIgacha bilan; diqqat — buyurtmaDiqqati
 *    (dashboard), navbat — navbatHolati (Ishlab chiqarish hisoboti).
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa, oldingiShuKungacha } from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import type { PanelBandi } from '../modul-panel';
import { navbatHolati } from '../hisobot/ishlab-malumot';
import { qaytarishVaRad, sotuvDinamikasi } from '../hisobot/malumot';
import { buyurtmaDiqqati } from '../boshqaruv/diqqat';

/** «Navbatda uzoq turgan» — shundan ko'p kun kutgan ish qizil */
const NAVBAT_UZOQ_KUN = 3;

// §3 — pul Decimal bilan
const ozgarish = (j: string, o: string): string => {
  const oo = new Decimal(o);
  if (oo.isZero()) return `o'tgan oyning shu kunigacha: ${pulKorsat(som(o))}`;
  const f = new Decimal(j).minus(oo).div(oo.abs()).times(100);
  return `o'tgan oyning shu kunigacha: ${pulKorsat(som(o))} · ${f.gte(0) ? '+' : '−'}${f.abs().toFixed(1)}%`;
};

export async function buyurtmaPaneli(filialId: number): Promise<{
  holat: PanelBandi[];
  davr: PanelBandi[];
  diqqat: PanelBandi[];
}> {
  const sql = ulanishOl();
  const davr = davrYasa('OY', new Date());
  // O'tgan oyning SHU KUNIgacha — to'liq oy bilan solishtirish soxta pasayish berardi
  const oldin = oldingiShuKungacha(davr);

  const [holat, dinamika, qaytarish, diqqat, navbat] = await Promise.all([
    sql<{ ochiq: number; ishlab: number; tayyor: number }[]>`
      SELECT COUNT(DISTINCT b.id) FILTER (
               WHERE p.holat NOT IN ('TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR'))::int AS ochiq,
             COUNT(DISTINCT b.id) FILTER (WHERE p.holat = 'ISHLAB_CHIQARILMOQDA')::int AS ishlab,
             COUNT(DISTINCT b.id) FILTER (WHERE p.holat IN ('TAYYOR','TAYYOR_YOLDA','YETIB_KELDI'))::int AS tayyor
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}`,
    sotuvDinamikasi(filialId, davr, oldin),
    qaytarishVaRad(filialId, davr),
    Promise.all(buyurtmaDiqqati(filialId)),
    navbatHolati(filialId, davr),
  ]);
  const h = holat[0];
  const j = dinamika.joriy;
  const o = dinamika.oldingi;
  const qaytarildi = qaytarish.filter((q) => q.amal === 'QAYTARISH').length;
  const navbatKun = navbat.engEskiKun;

  return {
    holat: [
      { nom: 'Ochiq buyurtma', qiymat: String(h?.ochiq ?? 0) },
      { nom: 'Ishlab chiqarilmoqda', qiymat: String(h?.ishlab ?? 0), havola: '/buyurtma?filtr=ISHLAB_CHIQARILMOQDA' },
      { nom: 'Tayyor, topshirilmagan', qiymat: String(h?.tayyor ?? 0), havola: '/buyurtma?filtr=TAYYOR' },
    ],
    davr: [
      { nom: 'Buyurtma', qiymat: String(j.buyurtmaSoni), izoh: `o'tgan oyning shu kunigacha: ${String(o.buyurtmaSoni)}` },
      { nom: 'Tushum', qiymat: pulKorsat(som(j.tushum)), izoh: ozgarish(j.tushum, o.tushum), havola: '/hisobot/sotuv' },
      { nom: "O'rtacha chek", qiymat: pulKorsat(som(j.ortachaChek)), izoh: ozgarish(j.ortachaChek, o.ortachaChek) },
      {
        nom: 'Qaytarish',
        qiymat: j.pozitsiyaSoni === 0 ? '—' : `${((qaytarildi / j.pozitsiyaSoni) * 100).toFixed(1)}%`,
        izoh: `${String(qaytarildi)} ta pozitsiya`,
      },
    ],
    diqqat: [
      ...diqqat.map((d) => ({
        nom: d.nom.replace(' buyurtma', '').replace(' pozitsiya', ''),
        qiymat: String(d.soni),
        izoh: d.izoh,
        havola: d.havola,
        ton: d.soni === 0 ? null : d.xavf ? ('xavf' as const) : ('ogoh' as const),
      })),
      {
        nom: 'Navbatda uzoq turgan',
        qiymat: navbatKun === null ? '0' : `${navbatKun.toFixed(1)} kun`,
        izoh: navbat.hozir > 0 ? `navbatda ${String(navbat.hozir)} ta, eng eskisi` : 'navbat bo‘sh',
        havola: '/hisobot/ishlab',
        ton: navbatKun === null ? null : navbatKun >= NAVBAT_UZOQ_KUN ? 'xavf' : navbat.hozir > 0 ? 'ogoh' : null,
      },
    ],
  };
}
