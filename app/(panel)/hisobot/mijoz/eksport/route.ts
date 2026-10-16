/**
 * Mijozlar hisoboti — Excel, ikki varaq (TZ 11.2 · 11.6). 2026-10-17
 *
 *   Yig'ma — baza holati (yangi, takroriy, uxlagan…), ABC tahlil
 *   Xom    — har faol mijoz: davrdagi xaridlari, birinchi/oxirgi xaridi, toifasi
 *
 * ⚠️ Ruxsat `hisobot.mijoz.kor` — sahifa bilan bir xil.
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { pulMatn } from '@/lib/domain/pul';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { hisobotSarlavhasi, xlsxSon, type XlsxKatak } from '@/lib/domain/xlsx';
import { xlsxJavob } from '../../../xlsx-javob';
import { filialNomi } from '../../../ombor/malumot';
import { UXLAGAN_KUN, mijozAbc, mijozBazasi } from '../../malumot';
import { mijozXom, type MijozToifasi } from '../../xom-malumot';

export const dynamic = 'force-dynamic';

const TOIFA_NOMI: Record<MijozToifasi, string> = {
  YANGI: 'yangi',
  TAKRORIY: 'takroriy',
  UXLAGAN: `uxlagan (${String(UXLAGAN_KUN)}+ kun)`,
  HECH_QACHON: 'hech xarid qilmagan',
  BOSHQA: '',
};

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'hisobot.mijoz.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const xom = new URL(sorov.url).searchParams.get('davr') ?? '';
  const davrTuri: DavrTuri = davrTurimi(xom) ? xom : 'OY';
  const davr = davrYasa(davrTuri, new Date());
  const vaqt = (d: Date | null): string | null =>
    d === null ? null : d.toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI });

  const [nomi, baza, abc, mijozlar] = await Promise.all([
    filialNomi(f.filialId),
    mijozBazasi(f.filialId, davr),
    mijozAbc(f.filialId, davr),
    mijozXom(f.filialId, davr, UXLAGAN_KUN),
  ]);

  const yigma: XlsxKatak[][] = [
    ...hisobotSarlavhasi({ nom: 'Mijozlar', davr: davrMatn(davr), filial: nomi, yaratildi: vaqt(new Date()) ?? '' }),
    ['Baza holati'],
    ['Jami mijoz', baza.jami],
    ['Yangi (birinchi xaridi davrda)', baza.yangi],
    ['Takroriy', baza.takroriy],
    [`Uxlagan (${String(UXLAGAN_KUN)} kundan beri xarid yo'q)`, baza.uxlagan],
    ['Hech xarid qilmagan', baza.hechQachonXaridQilmagan],
    ['Davrdagi buyurtmalar', baza.buyurtmaSoni],
    ["O'rtacha chek, so'm", xlsxSon(baza.ortachaChek)],
    [],
    ['ABC tahlil — davrdagi tushum bo‘yicha'],
    ['O‘rin', 'Mijoz', 'Buyurtma', "Tushum, so'm", 'Ulush, %', 'Yig‘ilgan, %', 'Toifa'],
    ...abc.natija.qatorlar.map((a): XlsxKatak[] => [
      a.orin,
      a.nom,
      abc.buyurtmaSoni.get(a.kalit) ?? 0,
      xlsxSon(pulMatn(a.qiymat)),
      a.ulushFoiz,
      a.kumulyativFoiz,
      a.toifa,
    ]),
  ];

  const xomVaraq: XlsxKatak[][] = [
    ['Mijoz', 'Telefon', 'Turi', 'Guruh', 'Birinchi xarid', 'Oxirgi xarid', 'Davrda buyurtma', "Davrda tushum, so'm", 'Jami buyurtma', 'Toifa'],
    ...mijozlar.map((m): XlsxKatak[] => [
      m.ism,
      m.telefon,
      m.turi,
      m.guruh,
      vaqt(m.birinchi),
      vaqt(m.oxirgi),
      m.davrdaBuyurtma,
      xlsxSon(m.davrdaTushum),
      m.jamiBuyurtma,
      TOIFA_NOMI[m.toifa] || null,
    ]),
  ];

  return xlsxJavob(
    [
      { nom: "Yig'ma", qatorlar: yigma },
      { nom: "Xom ma'lumot", qatorlar: xomVaraq },
    ],
    'mijozlar-hisoboti',
  );
}
