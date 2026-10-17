/**
 * TZ 11.11 — Mijozlar sahifasi paneli. 2026-10-17
 *
 *   Holat : jami mijoz · jami qarz (so'm va dollar alohida) · muddati o'tgan qarz
 *   Davr  : yangi mijoz · o'rtacha chek · takroriy mijoz %
 *   Diqqat: limitdan oshgan · muddati o'tgan · uxlab qolgan · Telegramsiz
 *
 * ⚠️ Har son ro'yxatning O'Z filtridan (mijozlarRoyxati jamiSoni) — bosilganda
 *    o'sha son chiqadi. Muddati o'tgan — taqsimotdan (muddatiOtganlar, kartochka
 *    bilan bir). Davr — mijozBazasi (Mijozlar hisoboti), o'tgan oyning SHU KUNIgacha.
 * ⚠️ «O'rtacha to'lov muddati» (TZ) hali yo'q: to'lovlarni qarzlarga taqsimlash
 *    tarixidan hisoblash kerak — QAMROV da ochiq.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { joriyKurs } from '@/lib/amal/kurs';
import { davrYasa, oldingiShuKungacha } from '@/lib/domain/hisobot/davr';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import type { PanelBandi } from '../modul-panel';
import { mijozBazasi } from '../hisobot/malumot';
import { filtrniOqi, mijozlarRoyxati, muddatiOtganlar, type HolatFiltri } from './malumot';

const usd = (x: Decimal | string): string | null => {
  const d = new Decimal(x);
  return d.isZero() ? null : `$ ${pulKorsat(dollar(d.toFixed(2)))}`;
};

export async function mijozPaneli(filialId: number): Promise<{
  holat: PanelBandi[];
  davr: PanelBandi[];
  diqqat: PanelBandi[];
}> {
  const kurs = await joriyKurs(ulanishOl());
  const davr = davrYasa('OY', new Date());
  const oldin = oldingiShuKungacha(davr);
  const sanoq = (holat: HolatFiltri) => mijozlarRoyxati(filtrniOqi({ holat }), kurs, 1);

  const [hammasi, qarzdor, limit, uxlagan, telegramsiz, muddat, baza, bazaOldin] = await Promise.all([
    mijozlarRoyxati(filtrniOqi({}), kurs, 1),
    sanoq('qarzdor'),
    sanoq('limit'),
    sanoq('uxlagan'),
    sanoq('telegramsiz'),
    muddatiOtganlar(),
    mijozBazasi(filialId, davr),
    mijozBazasi(filialId, oldin),
  ]);

  const otgan = [...muddat.values()].reduce(
    (y, m) => ({ som: y.som.plus(m.som), usd: y.usd.plus(m.usd) }),
    { som: new Decimal(0), usd: new Decimal(0) },
  );
  const takroriyFoiz = (b: typeof baza): number | null => {
    const xaridor = b.yangi + b.takroriy;
    return xaridor === 0 ? null : (b.takroriy / xaridor) * 100;
  };
  const tj = takroriyFoiz(baza);
  const to = takroriyFoiz(bazaOldin);
  const oldinMatn = "o'tgan oyning shu kunigacha";

  return {
    holat: [
      { nom: 'Jami mijoz', qiymat: String(hammasi.jamiSoni), havola: '/mijoz' },
      {
        nom: 'Jami qarz',
        qiymat: pulKorsat(som(qarzdor.jamiQarzSom)),
        izoh: usd(qarzdor.jamiQarzUsd) ?? `${String(qarzdor.jamiSoni)} ta qarzdor`,
        havola: '/mijoz?holat=qarzdor',
      },
      {
        nom: "Muddati o'tgan qarz",
        qiymat: pulKorsat(som(otgan.som.toFixed(2))),
        izoh: usd(otgan.usd),
        havola: '/mijoz?holat=muddat',
      },
    ],
    davr: [
      { nom: 'Yangi mijoz', qiymat: String(baza.yangi), izoh: `${oldinMatn}: ${String(bazaOldin.yangi)}` },
      {
        nom: "O'rtacha chek",
        qiymat: pulKorsat(som(baza.ortachaChek)),
        izoh: `${oldinMatn}: ${pulKorsat(som(bazaOldin.ortachaChek))}`,
      },
      {
        nom: 'Takroriy mijoz',
        qiymat: tj === null ? '—' : `${tj.toFixed(0)}%`,
        izoh: `${oldinMatn}: ${to === null ? '—' : `${to.toFixed(0)}%`}`,
        havola: '/hisobot/mijoz',
      },
    ],
    diqqat: [
      {
        nom: 'Limitdan oshgan',
        qiymat: String(limit.jamiSoni),
        havola: '/mijoz?holat=limit',
        ton: limit.jamiSoni > 0 ? 'xavf' : null,
      },
      {
        nom: "To'lov muddati o'tgan",
        qiymat: String(muddat.size),
        havola: '/mijoz?holat=muddat',
        ton: muddat.size > 0 ? 'xavf' : null,
      },
      {
        nom: 'Uxlab qolgan',
        qiymat: String(uxlagan.jamiSoni),
        havola: '/mijoz?holat=uxlagan',
        ton: uxlagan.jamiSoni > 0 ? 'ogoh' : null,
      },
      {
        nom: 'Telegramsiz',
        qiymat: String(telegramsiz.jamiSoni),
        izoh: 'eslatma va chek borolmaydi',
        havola: '/mijoz?holat=telegramsiz',
        ton: telegramsiz.jamiSoni > 0 ? 'ogoh' : null,
      },
    ],
  };
}
