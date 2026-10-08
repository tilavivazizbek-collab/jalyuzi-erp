/**
 * Kassa kitobi — Excel (CSV). Kassa auditi 2026-10-08.
 *
 * ⚠️ EKRANDAGI FILTR BILAN — `kitobFiltriniOqi` sahifa bilan bitta.
 * ⚠️ Ko'rish qamrovi sahifa bilan bir xil: `kassa.barcha.kor` bo'lmasa —
 *    faqat o'z kassasi (12.14).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { csvSon, csvYoz, type CsvKatak } from '@/lib/domain/csv';
import { kassaKodNomi, manbaKorinishi } from '@/lib/domain/kassa-kod';
import { toshkentKuni, VAQT_ZONASI } from '@/lib/domain/sana';
import { csvJavob } from '../../csv-javob';
import { kassaKitobi } from '../malumot';
import { kitobFiltriniOqi } from '../kitob-filtr';

export const dynamic = 'force-dynamic';

const ENG_KOP = 50_000;

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'kassa.oz.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const sp = Object.fromEntries(new URL(sorov.url).searchParams.entries());
  const filtr = kitobFiltriniOqi(sp, toshkentKuni());
  const kitob = await kassaKitobi(f.filialId, f.xodimId, ruxsatBormi(f, 'kassa.barcha.kor'), filtr, ENG_KOP);

  const sarlavha = ['Sana', 'Kassa', 'Hodisa', 'Kod', 'Manba', 'Izoh', 'Kirim', 'Chiqim', 'Valyuta', 'Kim', 'Storno'];
  const jadval = kitob.map((y): CsvKatak[] => {
    const chiqim = y.summa.startsWith('-');
    return [
      y.sana.toLocaleString('uz-UZ', { timeZone: VAQT_ZONASI }),
      y.kassaNomi,
      kassaKodNomi(y.kod),
      y.kod,
      manbaKorinishi(y.manbaTuri, y.manbaId, y.manbaNomi, y.manbaBogliqId).matn,
      y.izoh,
      chiqim ? null : csvSon(y.summa),
      chiqim ? csvSon(y.summa.slice(1)) : null,
      y.valyuta,
      y.xodimIsmi,
      y.stornoMi ? 'storno yozuvi' : y.stornoQilinganmi ? 'storno qilingan' : null,
    ];
  });
  return csvJavob(csvYoz(sarlavha, jadval), 'kassa-kitobi');
}
