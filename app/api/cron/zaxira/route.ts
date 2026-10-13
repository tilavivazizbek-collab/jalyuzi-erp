/**
 * Zaxira — LOYIHA §13 (03:00), TZ §17. 2026-10-13.
 * pg_dump → gzip → yopiq Telegram kanal (BACKUP_CHANNEL_ID);
 * muvaffaqiyatsiz bo'lsa — TELEGRAM_ADMIN_CHAT_ID ga xabar.
 */
import { cronYoli } from '@/lib/kirish/cron';
import { muhitOqi } from '@/lib/muhit';
import { zaxiraOl } from '@/lib/amal/zaxira';
import { telegramgaFayl, telegramgaMatn } from '@/lib/amal/telegram-yubor';

export const dynamic = 'force-dynamic';
// pg_dump uzoq ketishi mumkin
export const maxDuration = 300;

const ishla = cronYoli(() => {
  const m = muhitOqi();
  return zaxiraOl({
    databaseUrl: m.DATABASE_URL,
    yubor: (fayl, nom) =>
      telegramgaFayl(m.TELEGRAM_BOT_TOKEN, m.BACKUP_CHANNEL_ID, fayl, nom, `Zaxira ${nom} · ${String(Math.round(fayl.length / 1024))} KB`),
    xatoYubor: (matn) => telegramgaMatn(m.TELEGRAM_BOT_TOKEN, m.TELEGRAM_ADMIN_CHAT_ID, matn),
  });
});
export { ishla as GET, ishla as POST };
