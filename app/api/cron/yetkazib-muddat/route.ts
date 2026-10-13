/**
 * Yetkazib beruvchiga to'lov muddati — LOYIHA §13 (09:00). TZ 13.9. 2026-10-13.
 * Kuniga bir marta; qayta chaqiruv xavfsiz.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { yetkazibMuddatXabarlari } from '@/app/(panel)/hisobot/kunlik-xabar';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => yetkazibMuddatXabarlari());
export { ishla as GET, ishla as POST };
