/**
 * lib/muhit.ts — QISM 1 §18
 *
 * «Barchasi ishga tushishda Zod bilan tekshiriladi — biri yetishmasa dastur
 * ishga tushmaydi.» Sozlama xatosi ishlab chiqarishda emas, ishga tushishda
 * bilinishi kerak.
 */

import { z } from 'zod';
import { BiznesXato } from '@/lib/xato';

const sxema = z.object({
  DATABASE_URL: z.string().min(1).startsWith('postgres'),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET kamida 32 belgi bo'lishi kerak"),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_ADMIN_CHAT_ID: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  BACKUP_CHANNEL_ID: z.string().min(1),
  TZ: z.literal('Asia/Tashkent'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Muhit = z.infer<typeof sxema>;

let keshlangan: Muhit | undefined;

/**
 * Muhit o'zgaruvchilarini o'qiydi va tekshiradi.
 * Faqat serverda chaqiriladi — brauzerga bu qiymatlar hech qachon chiqmaydi.
 */
export function muhitOqi(): Muhit {
  if (keshlangan !== undefined) {
    return keshlangan;
  }

  const natija = sxema.safeParse(process.env);

  if (!natija.success) {
    const kamchiliklar = natija.error.issues
      .map((x) => `  · ${x.path.join('.')}: ${x.message}`)
      .join('\n');
    throw new BiznesXato('MUHIT_NOTOGRI', `\n${kamchiliklar}\n.env.example dan nusxa oling.`);
  }

  keshlangan = natija.data;
  return keshlangan;
}
