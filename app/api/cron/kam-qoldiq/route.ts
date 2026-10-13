/**
 * Kam qoldiq — LOYIHA §13 (08:00). TZ 13.9 · 5.5. 2026-10-13.
 * Kuniga bir marta; qayta chaqiruv xavfsiz.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { kamQoldiqXabarlari } from '@/app/(panel)/hisobot/kunlik-xabar';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => kamQoldiqXabarlari());
export { ishla as GET, ishla as POST };
