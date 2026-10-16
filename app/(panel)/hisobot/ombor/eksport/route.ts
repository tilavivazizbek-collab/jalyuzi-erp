/**
 * Ombor hisoboti — Excel, ikki varaq (TZ 11.2 · 11.7). 2026-10-17
 *
 *   Yig'ma — qoldiq qiymati, material kesimida qoldiq, harakat, kam qolgan,
 *            chiqindi va brak, ustama eroziyasi, muzlagan pul, eski ostatkalar,
 *            sarflanish tezligi, ABC
 *   Xom    — omborda turgan har bo'lak (bo'sh, band, yo'lda)
 *
 * ⚠️ Ruxsat `hisobot.ombor.kor` — sahifa bilan bir xil (tannarx bor).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { pulMatn } from '@/lib/domain/pul';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import { BOLAK_HOLAT_NOMI } from '@/lib/domain/ombor-harakat';
import { hisobotSarlavhasi, xlsxSon, type XlsxKatak } from '@/lib/domain/xlsx';
import { xlsxJavob } from '../../../xlsx-javob';
import { filialNomi } from '../../../ombor/malumot';
import {
  chiqindiVaBrak,
  kamQolganlar,
  materialHarakati,
  muzlaganPulHisoboti,
  omborAbc,
  omborQiymati,
  qoldiqMaterialKesimida,
  sarflanishTezligi,
  ustamaHisoboti,
} from '../../malumot';
import { omborXom } from '../../xom-malumot';

export const dynamic = 'force-dynamic';

const birlik = (b: string): string => SARFLASH_BIRLIGI_NOMI[b as SarflashBirligi] ?? b;

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'hisobot.ombor.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const xom = new URL(sorov.url).searchParams.get('davr') ?? '';
  const davrTuri: DavrTuri = davrTurimi(xom) ? xom : 'OY';
  const davr = davrYasa(davrTuri, new Date());

  const [nomi, qiymat, qoldiqlar, harakat, kamlar, chiqindi, ustama, muzlagan, tezlik, abc, bolaklar] =
    await Promise.all([
      filialNomi(f.filialId),
      omborQiymati(f.filialId),
      qoldiqMaterialKesimida(f.filialId),
      materialHarakati(f.filialId, davr),
      kamQolganlar(f.filialId),
      chiqindiVaBrak(f.filialId, davr),
      ustamaHisoboti(f.filialId),
      muzlaganPulHisoboti(f.filialId),
      sarflanishTezligi(f.filialId, davr),
      omborAbc(f.filialId),
      omborXom(f.filialId),
    ]);

  const bolim = (nom: string, sarlavha: readonly string[], qatorlar: readonly XlsxKatak[][]): XlsxKatak[][] => [
    [],
    [nom],
    [...sarlavha],
    ...qatorlar,
  ];

  const yigma: XlsxKatak[][] = [
    ...hisobotSarlavhasi({
      nom: 'Ombor hisoboti',
      davr: `${davrMatn(davr)} (harakat, chiqindi, tezlik shu davr bo'yicha; qoldiq — hozirgi)`,
      filial: nomi,
      yaratildi: new Date().toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI }),
    }),
    ["Ombor qiymati (tannarx), so'm", xlsxSon(qiymat)],
    ...bolim(
      'Qoldiq — material kesimida',
      ['Material', 'Birlik', 'Miqdor', "Bo'laklar", "Qiymat, so'm"],
      qoldiqlar.map((q) => [q.nom, birlik(q.sarflashBirligi), q.miqdor, q.bolakSoni, xlsxSon(q.qiymat)]),
    ),
    ...bolim(
      'Material harakati — davr',
      ['Material', 'Birlik', 'Kirim', 'Sarf', 'Chiqindi', 'Brak'],
      harakat.map((h) => [h.nom, birlik(h.sarflashBirligi), h.kirim, h.sarf, h.chiqindi, h.brak]),
    ),
    ...bolim(
      'Kam qolgan va tugagan',
      ['Material', 'Birlik', 'Qoldiq', 'Chegara', 'Holat'],
      kamlar.map((k) => [
        k.nom,
        birlik(k.sarflashBirligi),
        k.qoldiq,
        k.chegara,
        k.tugadimi ? 'tugagan' : k.hammasiBand ? 'hammasi band' : 'kam',
      ]),
    ),
    ...bolim(
      'Chiqindi va brak — davr',
      ['Material', 'Turi', 'Miqdor', "Qiymat, so'm", 'Hodisalar'],
      chiqindi.map((c) => [c.nom, c.turi, c.miqdor, xlsxSon(c.qiymat), c.hodisaSoni]),
    ),
    ...bolim(
      'Ustama eroziyasi',
      ['Material', "Tannarx, so'm", "Sotuv narxi, so'm", 'Ustama, %', 'Chegara, %', 'Holat'],
      ustama.qatorlar.map((u) => [
        u.nom,
        xlsxSon(pulMatn(u.tannarx)),
        xlsxSon(pulMatn(u.sotuvNarx)),
        u.hisoblanmadi ? null : u.ustamaFoiz,
        u.chegara,
        u.hisoblanmadi ? 'hisoblanmadi' : u.pastmi ? 'chegaradan past' : 'yaxshi',
      ]),
    ),
    ...bolim('Muzlab qolgan pul', ['Bo‘lak', "Qiymat, so'm", 'Soni', 'Ulush, %'], [
      ['Ostatkalar', xlsxSon(pulMatn(muzlagan.ostatkalar.qiymat)), muzlagan.ostatkalar.soni, muzlagan.ostatkalar.ulushFoiz],
      [
        'Sotilmagan tayyor mahsulot',
        xlsxSon(pulMatn(muzlagan.tayyorMahsulot.qiymat)),
        muzlagan.tayyorMahsulot.soni,
        muzlagan.tayyorMahsulot.ulushFoiz,
      ],
      [
        '6 oy qimirlamagan material',
        xlsxSon(pulMatn(muzlagan.qimirlamagan.qiymat)),
        muzlagan.qimirlamagan.soni,
        muzlagan.qimirlamagan.ulushFoiz,
      ],
      ['Jami', xlsxSon(pulMatn(muzlagan.jami))],
    ]),
    ...bolim(
      'Eski ostatkalar (6 oydan oshgan)',
      ["Bo'lak", 'Material', "O'lcham, m", 'Yoshi, kun', "Tannarx, so'm"],
      muzlagan.ostatkaQatorlari
        .filter((q) => q.eski)
        .map((q) => [q.kod, q.materialNom, q.olcham, q.yoshKun, xlsxSon(q.qiymat)]),
    ),
    ...bolim(
      'Sarflanish tezligi — davr',
      ['Material', 'Birlik', 'Qoldiq', 'Sarf', 'Kunlik', 'Necha kunga yetadi', '30 kunga yetishmaydi'],
      tezlik.map((t) => [
        t.nom,
        birlik(t.sarflashBirligi),
        t.qoldiq,
        t.sarf,
        t.kunlikTezlik,
        t.bashorat.kunlar,
        t.kerak30Kun,
      ]),
    ),
    ...bolim(
      'ABC tahlil — qoldiq qiymati bo‘yicha',
      ['O‘rin', 'Material', "Qiymat, so'm", 'Ulush, %', 'Yig‘ilgan, %', 'Toifa'],
      abc.qatorlar.map((a) => [a.orin, a.nom, xlsxSon(pulMatn(a.qiymat)), a.ulushFoiz, a.kumulyativFoiz, a.toifa]),
    ),
  ];

  const xomVaraq: XlsxKatak[][] = [
    ["Bo'lak", 'Material', 'Birlik', 'Turi', 'Ochilgan', 'Eni, m', "Bo'yi, m", 'Miqdor', 'Holat', "Qiymat, so'm", 'Tannarx valyutasi', 'Yoshi, kun', 'Joy', 'Kirim'],
    ...bolaklar.map((b): XlsxKatak[] => [
      b.kod,
      b.material,
      birlik(b.birlik),
      b.turi,
      b.ochilgan ? 'ha' : null,
      xlsxSon(b.eniM),
      xlsxSon(b.boyiM),
      xlsxSon(b.miqdor),
      BOLAK_HOLAT_NOMI[b.holat] ?? b.holat,
      xlsxSon(b.qiymat),
      b.valyuta,
      b.yoshKun,
      b.joy,
      b.kirim,
    ]),
  ];

  return xlsxJavob(
    [
      { nom: "Yig'ma", qatorlar: yigma },
      { nom: "Xom ma'lumot", qatorlar: xomVaraq },
    ],
    'ombor-hisoboti',
  );
}
