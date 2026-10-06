/**
 * Ombor tarixi — Excel (CSV). Ombor auditi 2026-10-06, 5-band.
 *
 * ⚠️ EKRANDAGI FILTR BILAN — `tarixFiltriniOqi` sahifa bilan bitta.
 *    Sahifalash yo'q: filtrdagi hamma harakat (chegaragacha) tushadi.
 * ⚠️ TANNARX faqat ruxsati borga (TZ 11.10).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi, tannarxniKoradimi } from '@/lib/ruxsat/tekshir';
import { harakatNomi } from '@/lib/domain/ombor-harakat';
import { csvSon, csvYoz, type CsvKatak } from '@/lib/domain/csv';
import { csvJavob } from '../../../csv-javob';
import { omborTarixi, tarixFiltriniOqi } from '../malumot';

export const dynamic = 'force-dynamic';

/** Bir martada ko'pi bilan — undan ko'p bo'lsa sana bilan bo'lib olinadi */
const ENG_KOP = 50_000;

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'ombor.qoldiq.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const pul = tannarxniKoradimi(f);

  const sp = Object.fromEntries(new URL(sorov.url).searchParams.entries());
  const natija = await omborTarixi(f.filialId, tarixFiltriniOqi(sp), 0, ENG_KOP);

  const sarlavha = [
    'Sana',
    'Harakat',
    'Mahsulot',
    "Bo'lak",
    'Miqdor, kv.m',
    'Miqdor, m',
    'Miqdor, dona',
    ...(pul ? ["Tannarx, so'm"] : []),
    'Kim',
    'Izoh',
  ];
  const jadval = natija.qatorlar.map((h): CsvKatak[] => [
    h.sana.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
    harakatNomi(h.turi),
    h.materialNomi,
    h.bolakKod,
    h.miqdorKvM === null ? null : csvSon(h.miqdorKvM.toFixed(4)),
    h.miqdorM === null ? null : csvSon(h.miqdorM.toFixed(2)),
    h.miqdorDona,
    ...(pul ? [csvSon(h.tannarxSumma)] : []),
    h.xodimIsmi,
    h.izoh,
  ]);

  return csvJavob(csvYoz(sarlavha, jadval), 'ombor-tarixi');
}
