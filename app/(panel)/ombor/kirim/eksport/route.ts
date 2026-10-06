/**
 * Kirim hujjatlari — Excel (CSV). Ombor auditi 2026-10-06, 5-band.
 *
 * ⚠️ XARID SUMMASI faqat ruxsati borga (TZ 11.10).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi, tannarxniKoradimi } from '@/lib/ruxsat/tekshir';
import { csvSon, csvYoz, type CsvKatak } from '@/lib/domain/csv';
import { csvJavob } from '../../../csv-javob';
import { kirimHujjatlari } from '../../malumot';

export const dynamic = 'force-dynamic';

const ENG_KOP = 20_000;

export async function GET(): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'ombor.qoldiq.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const pul = tannarxniKoradimi(f);
  const hujjatlar = await kirimHujjatlari(f.filialId, ENG_KOP);

  const sarlavha = [
    'Raqam',
    'Sana',
    'Yetkazib beruvchi',
    'Qatorlar',
    ...(pul ? ['Summa', 'Valyuta'] : []),
    'Holat',
  ];
  const jadval = hujjatlar.map((h): CsvKatak[] => [
    h.raqam,
    h.sana,
    h.yetkazibNomi,
    h.qatorSoni,
    ...(pul ? [csvSon(h.jamiSumma), h.valyuta === 'USD' ? '$' : "so'm"] : []),
    h.holat === 'STORNO' ? 'storno' : 'faol',
  ]);

  return csvJavob(csvYoz(sarlavha, jadval), 'kirimlar');
}
