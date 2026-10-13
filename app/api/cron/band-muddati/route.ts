/**
 * Band muddati — LOYIHA §13 (04:00). TZ 7.3 · EC-OMB-18. 2026-10-13.
 * Muddati o'tgan band bo'shaydi va filial adminiga xabar ketadi.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { ulanishOl } from '@/lib/db';
import { bandMuddatiniTekshir } from '@/lib/amal/band-muddati';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => bandMuddatiniTekshir(ulanishOl()));
export { ishla as GET, ishla as POST };
