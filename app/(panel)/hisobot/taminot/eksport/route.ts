/**
 * Ta'minot — narx dinamikasi, Excel, ikki varaq (TZ 11.2 · 11.9.1). 2026-10-17
 *
 *   Yig'ma — yetkazib beruvchilar (kim ko'targan), materiallar (oxirgi 3 kelish)
 *   Xom    — davrdagi har kelish: solishtirma narx, shu materialning oldingi
 *            kelishi va o'zgarish foizi
 *
 * ⚠️ Ruxsat `hisobot.ombor.kor` — sahifa bilan bir xil (kelish narxi tannarx).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { narxOzgarishi } from '@/lib/domain/hisobot/narx-dinamika';
import { VAQT_ZONASI, toshkentKuni } from '@/lib/domain/sana';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import { hisobotSarlavhasi, xlsxSon, type XlsxKatak } from '@/lib/domain/xlsx';
import { xlsxJavob } from '../../../xlsx-javob';
import { filialNomi } from '../../../ombor/malumot';
import { kelishNuqtalari, narxDinamikasi, type Nuqta } from '../../taminot-malumot';

export const dynamic = 'force-dynamic';

const birlik = (b: string): string => SARFLASH_BIRLIGI_NOMI[b as SarflashBirligi] ?? b;

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'hisobot.ombor.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const xom = new URL(sorov.url).searchParams.get('davr') ?? '';
  const davrTuri: DavrTuri = davrTurimi(xom) ? xom : 'YIL';
  const davr = davrYasa(davrTuri, new Date());

  const [nomi, d, nuqtalar] = await Promise.all([
    filialNomi(f.filialId),
    narxDinamikasi(f.filialId, davr),
    kelishNuqtalari(f.filialId, davr),
  ]);

  const yigma: XlsxKatak[][] = [
    ...hisobotSarlavhasi({
      nom: "Ta'minot — narx dinamikasi",
      davr: davrMatn(davr),
      filial: nomi,
      filtr: "Narx — sarflash birligiga keltirilgan so'mdagi kelish narxi (transport bilan)",
      yaratildi: new Date().toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI }),
    }),
    ["Yetkazib beruvchilar — kim narx ko'targan"],
    ['Yetkazib beruvchi', 'Solishtirildi', "Ko'tardi", 'Tushirdi', "O'rtacha, %", "Eng ko'p ko'targani", '%'],
    ...d.yetkazibBeruvchilar.map((y): XlsxKatak[] => [
      y.nom,
      y.solishtirildi,
      y.kotardi,
      y.tushirdi,
      y.ortachaFoiz,
      y.engKatta?.material ?? null,
      y.engKatta?.foiz ?? null,
    ]),
    [],
    ['Materiallar — qaysi biri qimmatlashayapti'],
    ['Material', 'Birlik', '1-kelish', '2-kelish', '3-kelish', "O'zgarish, %", 'Necha oyda'],
    ...d.materiallar.map((m): XlsxKatak[] => {
      const n = m.narxlar.map((x) => xlsxSon(x.narx));
      while (n.length < 3) n.unshift(null);
      return [m.material, birlik(m.birlik), ...n, m.foiz, m.oylar];
    }),
  ];

  // Xom: davrdagi har kelish + shu materialning oldingi kelishi
  const boshi = toshkentKuni(davr.boshi);
  const oldingisi = new Map<number, Nuqta>();
  const xomQatorlar: XlsxKatak[][] = [];
  for (const n of nuqtalar) {
    const old = oldingisi.get(n.materialId);
    if (n.sana >= boshi) {
      const o =
        old === undefined
          ? null
          : narxOzgarishi([
              { sana: old.sana, narx: old.narx, kalit: 'SOM' },
              { sana: n.sana, narx: n.narx, kalit: 'SOM' },
            ]).foiz;
      xomQatorlar.push([
        n.sana,
        n.kirimRaqam,
        n.yetkazib,
        n.material,
        birlik(n.birlik),
        xlsxSon(n.narx),
        old === undefined ? null : xlsxSon(old.narx),
        old?.yetkazib ?? null,
        o,
      ]);
    }
    oldingisi.set(n.materialId, n);
  }
  xomQatorlar.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const xomVaraq: XlsxKatak[][] = [
    ['Sana', 'Kirim', 'Yetkazib beruvchi', 'Material', 'Birlik', "Narx, so'm/birlik", 'Oldingi narx', 'Oldingi yetkazib beruvchi', "O'zgarish, %"],
    ...xomQatorlar,
  ];

  return xlsxJavob(
    [
      { nom: "Yig'ma", qatorlar: yigma },
      { nom: "Xom ma'lumot", qatorlar: xomVaraq },
    ],
    'taminot-narx-dinamikasi',
  );
}
