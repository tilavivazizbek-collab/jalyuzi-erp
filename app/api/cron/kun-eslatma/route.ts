/**
 * Kun eslatmasi — LOYIHA §13 (20:00, kechqurun har 15 daqiqa). TZ 12.17.
 * Filialning kassa yopilish soati o'tgach, kuniga bir marta. 2026-10-13.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { kunEslatmaXabarlari } from '@/app/(panel)/hisobot/kunlik-xabar';

export const dynamic = 'force-dynamic';

const ishla = cronYoli(() => kunEslatmaXabarlari());
export { ishla as GET, ishla as POST };
