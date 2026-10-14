/**
 * Mijozga qarz eslatmasi — LOYIHA §13 (10:00), TZ 13.6, T-06. 2026-10-14.
 * Faqat muddati o'tgan qarzga; bitta mijozga takror oralig'idan tez emas.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { qarzEslatmalariniYubor } from '@/app/(panel)/mijoz/qarz-eslatma';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => qarzEslatmalariniYubor());
export { ishla as GET, ishla as POST };
