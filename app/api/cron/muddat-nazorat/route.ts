/**
 * Kechikkan buyurtmalar — LOYIHA §13 (09:00). TZ 8.16. 2026-10-13.
 * Kuniga bir marta; qayta chaqiruv xavfsiz.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { kechikkanBuyurtmaXabarlari } from '@/app/(panel)/hisobot/kunlik-xabar';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => kechikkanBuyurtmaXabarlari());
export { ishla as GET, ishla as POST };
