/**
 * Moliya hisoboti — Excel, ikki varaq (TZ 11.2 · 11.4). 2026-10-16
 *
 *   Yig'ma — foyda-zarar (joriy va oldingi davr), kassa oqimi
 *   Xom    — davrning HAR xarajat yozuvi: asl valyuta, kurs, so'mda, qayerda hisoblangani
 *
 * ⚠️ Raqamlar ekran bilan bir manbadan: foydaZararMalumoti + foydaZarar,
 *    kassaOqimi; xom varaqdagi kurs va «tannarxda» sharti ham o'sha yordamchilardan.
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { davrMatn, davrTurimi, davrYasa, oldingiDavr, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { foydaZarar, xarajatModdaNomi } from '@/lib/domain/hisobot/foyda-zarar';
import { kassaKodNomi } from '@/lib/domain/kassa-kod';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { hisobotSarlavhasi, xlsxSon, type XlsxKatak } from '@/lib/domain/xlsx';
import { xlsxJavob } from '../../../xlsx-javob';
import { filialNomi } from '../../../ombor/malumot';
import { foydaZararMalumoti, kassaOqimi } from '../../malumot';
import { xarajatXom } from '../../xom-malumot';

export const dynamic = 'force-dynamic';

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'hisobot.moliya.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const xom = new URL(sorov.url).searchParams.get('davr') ?? '';
  const davrTuri: DavrTuri = davrTurimi(xom) ? xom : 'OY';
  const davr = davrYasa(davrTuri, new Date());
  const oldin = oldingiDavr(davr);

  const [nomi, jx, ox, oqim, xarajatlar] = await Promise.all([
    filialNomi(f.filialId),
    foydaZararMalumoti(f.filialId, davr),
    foydaZararMalumoti(f.filialId, oldin),
    kassaOqimi(f.filialId, davr),
    xarajatXom(f.filialId, davr),
  ]);
  const j = foydaZarar(jx);
  const o = foydaZarar(ox);
  const moddalar = [...new Set([...j.xarajatlar, ...o.xarajatlar].map((x) => x.modda))];
  const modda = (fz: typeof j, m: string): number | null =>
    xlsxSon(fz.xarajatlar.find((x) => x.modda === m)?.summa ?? '0');
  const qator = (nom: string, jv: string, ov: string): XlsxKatak[] => [nom, xlsxSon(jv), xlsxSon(ov)];

  const yigma: XlsxKatak[][] = [
    ...hisobotSarlavhasi({
      nom: 'Moliya — foyda-zarar',
      davr: `${davrMatn(davr)} (oldingi: ${davrMatn(oldin)})`,
      filial: nomi,
      yaratildi: new Date().toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI }),
    }),
    ["Ko'rsatkich", "Joriy davr, so'm", "Oldingi davr, so'm"],
    qator('Tushum', j.tushum, o.tushum),
    qator('Tannarx', j.tannarx, o.tannarx),
    qator('  material', j.material, o.material),
    qator('  usta haqi', j.ishHaqi, o.ishHaqi),
    qator('Yalpi foyda', j.yalpiFoyda, o.yalpiFoyda),
    qator('Xarajatlar', j.xarajatJami, o.xarajatJami),
    ...moddalar.map((m): XlsxKatak[] => [`  ${xarajatModdaNomi(m)}`, modda(j, m), modda(o, m)]),
    qator('Kurs farqi — zarar', j.kursZarar, o.kursZarar),
    qator('Kurs farqi — daromad', j.kursDaromad, o.kursDaromad),
    qator('Sof foyda', j.sofFoyda, o.sofFoyda),
    ['Rentabellik, %', j.rentabellik, o.rentabellik],
    ...(Number(jx.dollarXarajat.usd) !== 0
      ? [[], ['Dollarda yozilgan xarajat, $', xlsxSon(jx.dollarXarajat.usd)], ["  so'mga o'tkazilgani", xlsxSon(jx.dollarXarajat.somda)]]
      : []),
    ...(jx.dollarXarajat.kurssizSoni > 0
      ? [['Kursi yo‘q dollar xarajat (qo‘shilmagan), dona', jx.dollarXarajat.kurssizSoni]]
      : []),
    [],
    ['Kassa oqimi'],
    ['Valyuta', "Boshlang'ich", 'Kirim', 'Chiqim', 'Yakuniy'],
    ...oqim.map((k): XlsxKatak[] => [k.valyuta, xlsxSon(k.boshlangich), xlsxSon(k.kirim), xlsxSon(k.chiqim), xlsxSon(k.yakuniy)]),
    ...oqim.flatMap((k): XlsxKatak[][] => [
      [],
      [`Hodisa bo'yicha — ${k.valyuta}`, 'Sof summa'],
      ...k.kodlar.map((x): XlsxKatak[] => [kassaKodNomi(x.kalit), xlsxSon(x.summa)]),
    ]),
  ];

  const xomVaraq: XlsxKatak[][] = [
    ['Sana', 'Modda', 'Turi', 'Summa', 'Valyuta', 'Kurs', "So'mda", 'Kassadan', 'Foyda-zararda', 'Kim', 'Izoh'],
    ...xarajatlar.map((x): XlsxKatak[] => [
      x.sana,
      xarajatModdaNomi(x.modda),
      x.turi,
      xlsxSon(x.summa),
      x.valyuta,
      xlsxSon(x.kurs),
      xlsxSon(x.somda),
      x.kassadan ? 'ha' : "yo'q",
      x.tannarxda ? 'tannarxda (usta haqi)' : x.somda === null ? "kirmagan — kurs yo'q" : 'xarajatlarda',
      x.xodim,
      x.izoh,
    ]),
  ];

  return xlsxJavob(
    [
      { nom: "Yig'ma", qatorlar: yigma },
      { nom: "Xom ma'lumot", qatorlar: xomVaraq },
    ],
    'moliya-hisoboti',
  );
}
