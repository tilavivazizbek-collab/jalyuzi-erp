/**
 * Sotuv hisoboti — Excel, ikki varaq (TZ 11.2). 2026-10-16
 *
 *   Yig'ma  — ekrandagi jadvallar: sotuvchi kesimi, tur bo'yicha foyda
 *   Xom     — davrning har pozitsiyasi, guruhlanmagan
 *
 * ⚠️ Davr — sahifadagi `?davr=` bilan bir xil.
 * ⚠️ Tannarx va foyda faqat `hisobot.moliya.kor` bilan (sahifa bilan bir qoida).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { hisobotSarlavhasi, xlsxSon, type XlsxKatak } from '@/lib/domain/xlsx';
import { xlsxJavob } from '../../../xlsx-javob';
import { filialNomi } from '../../../ombor/malumot';
import { sotuvchiKesimi, turBoyichaFoyda } from '../../malumot';
import { sotuvXom } from '../../xom-malumot';

export const dynamic = 'force-dynamic';

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'hisobot.sotuv.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const tannarx = ruxsatBormi(f, 'hisobot.moliya.kor');

  const xom = new URL(sorov.url).searchParams.get('davr') ?? '';
  const davrTuri: DavrTuri = davrTurimi(xom) ? xom : 'OY';
  const davr = davrYasa(davrTuri, new Date());

  const [nomi, sotuvchilar, turlar, qatorlar] = await Promise.all([
    filialNomi(f.filialId),
    sotuvchiKesimi(f.filialId, davr),
    tannarx ? turBoyichaFoyda(f.filialId, davr) : Promise.resolve([]),
    sotuvXom(f.filialId, davr),
  ]);
  const vaqt = (d: Date): string => d.toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI });

  const yigma: XlsxKatak[][] = [
    ...hisobotSarlavhasi({ nom: 'Sotuv hisoboti', davr: davrMatn(davr), filial: nomi, yaratildi: vaqt(new Date()) }),
    ['Sotuvchi kesimida'],
    ['Sotuvchi', 'Buyurtma', "Tushum, so'm", "O'rtacha chek", "Undirilgan, so'm"],
    ...sotuvchilar.map((s) => [s.ism, s.buyurtmaSoni, xlsxSon(s.tushum), xlsxSon(s.ortachaChek), xlsxSon(s.undirilgan)]),
    ...(tannarx
      ? [
          [],
          ['Mahsulot turi bo‘yicha foyda'],
          ['Tur', 'Dona', "Tushum, so'm", "Tannarx, so'm", "Foyda, so'm", "Birlik foyda", 'Rentabellik, %', 'Tannarxsiz'],
          ...turlar.map((t) => [
            t.nom,
            t.soni,
            xlsxSon(t.tushum),
            xlsxSon(t.tannarx),
            xlsxSon(t.foyda),
            xlsxSon(t.birlikFoyda),
            t.rentabellik === null ? null : Number(t.rentabellik.toFixed(1)),
            t.tannarxsizSoni,
          ]),
        ]
      : []),
  ];

  const xomVaraq: XlsxKatak[][] = [
    [
      'Buyurtma',
      'Sana',
      'Sotuvchi',
      'Mijoz',
      'Mahsulot turi',
      'Soni',
      'Holat',
      'Valyuta',
      "Tushum, so'm",
      ...(tannarx ? ["Material tannarxi, so'm", "Ish haqi, so'm"] : []),
    ],
    ...qatorlar.map((q) => [
      q.raqam,
      vaqt(q.sana),
      q.sotuvchi,
      q.mijoz,
      q.tur,
      q.soni,
      HOLAT_NOMI[q.holat as PozitsiyaHolati] ?? q.holat,
      q.valyuta,
      xlsxSon(q.tushum),
      ...(tannarx ? [xlsxSon(q.tannarx), xlsxSon(q.ishHaqi)] : []),
    ]),
  ];

  return xlsxJavob(
    [
      { nom: "Yig'ma", qatorlar: yigma },
      { nom: "Xom ma'lumot", qatorlar: xomVaraq },
    ],
    'sotuv-hisoboti',
  );
}
