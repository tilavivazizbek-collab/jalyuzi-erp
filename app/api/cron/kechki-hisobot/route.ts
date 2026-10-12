/**
 * Kechki hisobot — LOYIHA §13 (cron yo'llari). 2026-10-12.
 *
 * Chaqiruvchi (cron-job.org, keyin crontab) kechqurun HAR 15 DAQIQADA
 * chaqiradi; kassa yopilish soati o'tgan filiallarga kuniga BIR marta
 * yoziladi (takroriy chaqiruv xavfsiz).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { muhitOqi } from '@/lib/muhit';
import { CRON_SARLAVHA, cronKalitiTogrimi } from '@/lib/kirish/cron';
import { kechkiHisobotlarniNavbatgaQoy } from '@/app/(panel)/hisobot/kechki-malumot';

export const dynamic = 'force-dynamic';

async function ishla(so: NextRequest): Promise<NextResponse> {
  if (!cronKalitiTogrimi(so.headers.get(CRON_SARLAVHA), muhitOqi().CRON_SECRET)) {
    return NextResponse.json({ xato: 'ruxsat yo‘q' }, { status: 401 });
  }
  const natija = await kechkiHisobotlarniNavbatgaQoy();
  return NextResponse.json(natija);
}

export { ishla as GET, ishla as POST };
