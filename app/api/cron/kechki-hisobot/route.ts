/**
 * Kechki hisobot — LOYIHA §13 (cron yo'llari). 2026-10-12.
 *
 * Chaqiruvchi (cron-job.org, keyin crontab) kechqurun HAR 15 DAQIQADA
 * chaqiradi; kassa yopilish soati o'tgan filiallarga kuniga BIR marta
 * yoziladi (takroriy chaqiruv xavfsiz).
 */
import { cronYoli } from '@/lib/kirish/cron';
import { kechkiHisobotlarniNavbatgaQoy } from '@/app/(panel)/hisobot/kechki-malumot';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => kechkiHisobotlarniNavbatgaQoy());
export { ishla as GET, ishla as POST };
