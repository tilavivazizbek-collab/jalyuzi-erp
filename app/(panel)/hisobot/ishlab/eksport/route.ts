/**
 * Ishlab chiqarish hisoboti — Excel, ikki varaq (TZ 11.2 · 11.8). 2026-10-17
 *
 *   Yig'ma — navbat, kechikkan buyurtmalar, usta unumdorligi, brak
 *   Xom    — davrda tugatilgan har pozitsiya: usta, kv.m, navbatda va ishda necha kun
 *
 * ⚠️ Ruxsat `hisobot.ishlab.kor` — sahifa bilan bir xil.
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { QK_SABAB_NOMI, type QaytaKesishSababi } from '@/lib/amal/qayta-kesish';
import { hisobotSarlavhasi, xlsxSon, type XlsxKatak } from '@/lib/domain/xlsx';
import { xlsxJavob } from '../../../xlsx-javob';
import { filialNomi } from '../../../ombor/malumot';
import {
  ishlabChiqarishBraki,
  ishlabXom,
  kechikkanBuyurtmalar,
  navbatHolati,
  ustaUnumdorligi,
} from '../../ishlab-malumot';

export const dynamic = 'force-dynamic';

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'hisobot.ishlab.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const xom = new URL(sorov.url).searchParams.get('davr') ?? '';
  const davrTuri: DavrTuri = davrTurimi(xom) ? xom : 'OY';
  const davr = davrYasa(davrTuri, new Date());

  const [nomi, ustalar, brak, kechikkan, navbat, qatorlar] = await Promise.all([
    filialNomi(f.filialId),
    ustaUnumdorligi(f.filialId, davr),
    ishlabChiqarishBraki(f.filialId, davr),
    kechikkanBuyurtmalar(f.filialId),
    navbatHolati(f.filialId, davr),
    ishlabXom(f.filialId, davr),
  ]);
  const vaqt = (d: Date | null): string | null =>
    d === null ? null : d.toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI });

  const yigma: XlsxKatak[][] = [
    ...hisobotSarlavhasi({
      nom: 'Ishlab chiqarish',
      davr: davrMatn(davr),
      filial: nomi,
      yaratildi: vaqt(new Date()) ?? '',
    }),
    ['Navbat holati'],
    ['Hozir navbatda', navbat.hozir],
    ['Eng eskisi, kun', navbat.engEskiKun],
    ['Materialga kutmoqda', navbat.materialKutmoqda],
    ["O'rtacha kutish, kun", navbat.ortachaKutishKun],
    ['Eng uzun kutish, kun', navbat.engUzunKutishKun],
    [],
    ['Mahsulot turi', 'Hozir navbatda', 'Eng eskisi, kun', 'Davrda olingan', "O'rtacha kutdi, kun", 'Eng uzun, kun'],
    ...navbat.turlar.map((t): XlsxKatak[] => [t.tur, t.hozir, t.engEskiKun, t.olingan, t.ortachaKutishKun, t.engUzunKutishKun]),
    [],
    ['Kechikkan buyurtmalar'],
    ['Buyurtma', 'Mijoz', 'Tayyorlik sanasi', 'Kechikdi, kun', 'Ochiq pozitsiya'],
    ...kechikkan.map((k): XlsxKatak[] => [k.raqam, k.mijoz, k.tayyorlikSana, k.kechikishKun, k.ochiqPozitsiya]),
    [],
    ['Usta unumdorligi'],
    ['Usta', 'Mahsulot turi', 'Dona', 'Kv.m', "Hisoblangan haq, so'm"],
    ...ustalar.flatMap((u): XlsxKatak[][] => [
      [u.ism, 'JAMI', u.soni, xlsxSon(u.kvM), xlsxSon(u.haq)],
      ...u.turlar.map((t): XlsxKatak[] => [u.ism, t.tur, t.soni, xlsxSon(t.kvM), null]),
    ]),
    [],
    ['Ishlab chiqarish braki'],
    ['Usta', 'Holat', 'Sabablar', "Zarar, so'm", "Ushlangan, so'm"],
    ...brak.map((b): XlsxKatak[] => [
      b.ism,
      b.soni,
      b.sabablar.map((s) => `${QK_SABAB_NOMI[s.sabab as QaytaKesishSababi] ?? s.sabab} ${String(s.soni)}`).join(', '),
      xlsxSon(b.zarar),
      xlsxSon(b.ushlangan),
    ]),
  ];

  const xomVaraq: XlsxKatak[][] = [
    [
      'Buyurtma',
      'Mahsulot turi',
      'Eni, m',
      "Bo'yi, m",
      'Soni',
      'Kv.m',
      'Usta',
      'Holat',
      'Navbatga tushdi',
      'Usta oldi',
      'Tugatildi',
      'Navbatda kutdi, kun',
      'Ishda, kun',
    ],
    ...qatorlar.map((q): XlsxKatak[] => [
      q.raqam,
      q.tur,
      xlsxSon(q.eniM),
      xlsxSon(q.boyiM),
      q.soni,
      xlsxSon(q.kvM),
      q.usta,
      HOLAT_NOMI[q.holat as PozitsiyaHolati] ?? q.holat,
      vaqt(q.navbatga),
      vaqt(q.olindi),
      vaqt(q.tugatildi),
      q.kutishKun,
      q.ishKun,
    ]),
  ];

  return xlsxJavob(
    [
      { nom: "Yig'ma", qatorlar: yigma },
      { nom: "Xom ma'lumot", qatorlar: xomVaraq },
    ],
    'ishlab-chiqarish',
  );
}
