/**
 * lib/amal/zaxira.ts — TZ §17 · Zaxira nusxa (1-qatlam: Telegram). 2026-10-13
 *
 * ⚠️ NEGA: 2026-10-03 da ishchi baza tushdi va ZAXIRA YO'Q edi —
 *    `BACKUP_CHANNEL_ID` muhitda tekshirilardi, lekin uni hech narsa
 *    ishlatmasdi.
 *
 * §17.2 shartlari:
 *   · `pg_dump | gzip` — bu yerda Node `zlib` bilan (shell yo'q);
 *   · fayl 10 KB dan kichik bo'lsa — XATO (bo'sh yoki uzilgan nusxa);
 *   · muvaffaqiyatsiz bo'lsa adminga Telegram xabar.
 *
 * ⚠️ «30 kundan eski nusxalar o'chiriladi» — Telegram qatlamida MUMKIN
 *    EMAS: bot API 48 soatdan eski xabarni o'chira olmaydi. Kanal
 *    bepul saqlaydi; muddatli o'chirish 2-qatlamda (tashqi omborxona).
 * ⚠️ Bot API fayl chegarasi 50 MB — oshsa xato (2-qatlam kerak bo'ladi).
 * ⚠️ PAROL HECH QAYERGA CHIQMAYDI: xato matnidan `parolniYashir` bilan
 *    tozalanadi (stderr ulanish satrini qaytarishi mumkin).
 * ⚠️ Yuborish TASHQARIDAN beriladi — sinovda haqiqiy Telegramga ketmaydi.
 */

import { spawn } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { toshkentKuni } from '@/lib/domain/sana';

export const ZAXIRA_MIN_BAYT = 10 * 1024;
export const ZAXIRA_MAX_BAYT = 50 * 1024 * 1024;

/** `postgres://user:PAROL@host/db` → `postgres://user:***@host/db` (matn ichida ham) */
export function parolniYashir(matn: string): string {
  return matn.replace(/(postgres(?:ql)?:\/\/[^:/@\s]+:)[^@\s]+@/g, '$1***@');
}

export function zaxiraNomi(hozir: Date): string {
  return `erp-${toshkentKuni(hozir)}.sql.gz`;
}

export interface ZaxiraKirimi {
  readonly databaseUrl: string;
  /** `pg_dump` buyrug'i (standart — PATH dan) */
  readonly pgDump?: string;
  readonly yubor: (fayl: Buffer, nom: string) => Promise<void>;
  readonly xatoYubor: (matn: string) => Promise<void>;
  readonly hozir?: Date;
}

/** pg_dump → gzip (xotirada). Xato bo'lsa — stderr bilan, parolsiz. */
function dumpOl(databaseUrl: string, pgDump: string): Promise<Buffer> {
  return new Promise((hal, rad) => {
    const jarayon = spawn(pgDump, ['--no-owner', '--no-privileges', `--dbname=${databaseUrl}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const gz = createGzip();
    const bolaklar: Buffer[] = [];
    let hajm = 0;
    let xato = '';
    jarayon.stdout.pipe(gz);
    gz.on('data', (b: Buffer) => {
      hajm += b.length;
      if (hajm > ZAXIRA_MAX_BAYT) {
        jarayon.kill();
        return;
      }
      bolaklar.push(b);
    });
    jarayon.stderr.on('data', (b: Buffer) => {
      xato = (xato + b.toString('utf8')).slice(-2000);
    });
    jarayon.on('error', (x) => {
      rad(new Error(`pg_dump ishga tushmadi: ${x.message}`));
    });
    /**
     * ⚠️ IKKALASI ham kelgach hal qilinadi: gzip tugashi (`end`) jarayon
     *    yopilishidan (`close`, chiqish kodi) OLDIN kelishi mumkin — unda
     *    pg_dump xatosi «juda kichik fayl» bo'lib yashirinardi.
     */
    let kod: number | null | undefined;
    let tugadi = false;
    const yakunla = (): void => {
      if (kod === undefined || !tugadi) return;
      if (hajm > ZAXIRA_MAX_BAYT) {
        rad(new Error(`zaxira ${String(Math.round(hajm / 1024 / 1024))} MB dan oshdi — Telegram chegarasi 50 MB`));
      } else if (kod !== 0) {
        rad(new Error(`pg_dump xato (kod ${String(kod)}): ${xato.trim()}`));
      } else {
        hal(Buffer.concat(bolaklar));
      }
    };
    jarayon.on('close', (k) => {
      kod = k;
      yakunla();
    });
    gz.on('end', () => {
      tugadi = true;
      yakunla();
    });
    gz.on('error', rad);
  });
}

export async function zaxiraOl(k: ZaxiraKirimi): Promise<{ readonly nom: string; readonly hajm: number }> {
  const nom = zaxiraNomi(k.hozir ?? new Date());
  try {
    const fayl = await dumpOl(k.databaseUrl, k.pgDump ?? 'pg_dump');
    if (fayl.length < ZAXIRA_MIN_BAYT) {
      throw new Error(`zaxira juda kichik (${String(fayl.length)} bayt) — bo'sh yoki uzilgan nusxa`);
    }
    await k.yubor(fayl, nom);
    return { nom, hajm: fayl.length };
  } catch (x) {
    const sabab = parolniYashir(x instanceof Error ? x.message : String(x));
    // Xabar ham yuborilmasa — asl xato baribir qaytadi (cron javobida ko'rinadi)
    await k.xatoYubor(`🔴 ZAXIRA OLINMADI — ${nom}\n\n${sabab}`).catch(() => undefined);
    throw new Error(sabab);
  }
}
