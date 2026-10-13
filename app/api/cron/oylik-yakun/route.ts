/**
 * Oylik yakun — TZ 21.8, LOYIHA §13 (har oyning 1-kuni 08:00). 2026-10-13.
 * Oyiga bir marta; qayta chaqiruv xavfsiz.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { oylikYakunXabarlari } from '@/app/(panel)/hisobot/reja-malumot';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => oylikYakunXabarlari());
export { ishla as GET, ishla as POST };
