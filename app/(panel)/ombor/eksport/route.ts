/**
 * Ombor qoldig'i — Excel (CSV). Ombor auditi 2026-10-06, 5-band.
 *
 * ⚠️ EKRANDAGI FILTR BILAN — `qoldiqFiltriniOqi` + `qoldiqniFiltrla`
 *    sahifa bilan bitta. «Kam qolgan» ko'rib turib yuklasa — faqat ular.
 * ⚠️ TANNARX faqat ruxsati borga (TZ 11.10) — ustunning o'zi chiqmaydi.
 * ⚠️ Ruxsat SHU YERDA ham tekshiriladi (§9.4).
 */
import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi, tannarxniKoradimi } from '@/lib/ruxsat/tekshir';
import { chegaraBirligi } from '@/lib/domain/birlik-tanlovi';
import { csvSon, csvYoz, type CsvKatak } from '@/lib/domain/csv';
import { csvJavob } from '../../csv-javob';
import { filialQoldigi } from '../malumot';
import { qoldiqFiltriniOqi, qoldiqniFiltrla } from '../qoldiq-filtr';

export const dynamic = 'force-dynamic';

const holatMatni = (q: {
  tugagan: boolean;
  kamQoldiq: boolean;
  bandKvM: number;
  bolakSoni: number;
}): string => {
  if (q.tugagan) return q.bandKvM > 0 || q.bolakSoni > 0 ? 'hammasi band' : 'tugagan';
  return q.kamQoldiq ? 'kam qolgan' : '';
};

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'ombor.qoldiq.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }
  const pul = tannarxniKoradimi(f);

  const sp = Object.fromEntries(new URL(sorov.url).searchParams.entries());
  const qatorlar = qoldiqniFiltrla(await filialQoldigi(f.filialId), qoldiqFiltriniOqi(sp));

  const sarlavha = [
    'Mahsulot',
    'Guruh',
    'Jami, kv.m',
    "Bo'sh, kv.m",
    'Band, kv.m',
    "Yo'lda, kv.m",
    "Bo'laklar",
    'Miqdor (dona / m)',
    "Bo'sh qoldiq (chegara birligida)",
    'Kam qoldiq chegarasi',
    'Birlik',
    'Holat',
    ...(pul ? ["Qiymati, so'm (tannarx)"] : []),
  ];
  const jadval = qatorlar.map((q): CsvKatak[] => [
    q.nom,
    q.guruhNomi,
    csvSon(q.jamiKvM.toFixed(2)),
    csvSon(q.boshKvM.toFixed(2)),
    csvSon(q.bandKvM.toFixed(2)),
    csvSon(q.yoldaKvM.toFixed(2)),
    q.bolakSoni,
    csvSon(q.miqdor),
    csvSon(q.chegaraQoldiq),
    q.kamQoldiqChegaraM === null ? null : csvSon(q.kamQoldiqChegaraM),
    chegaraBirligi(q.sarflashBirligi),
    holatMatni(q),
    ...(pul ? [csvSon(q.qiymat)] : []),
  ]);

  return csvJavob(csvYoz(sarlavha, jadval), 'ombor-qoldigi');
}
