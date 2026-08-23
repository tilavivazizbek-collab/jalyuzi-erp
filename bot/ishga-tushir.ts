/**
 * bot/ishga-tushir.ts — botning kirish nuqtasi.
 *
 * `npm run bot` shu faylni ishga tushiradi.
 *
 * ⚠️ Sayt bilan ALOHIDA jarayon (13.11): bot yiqilsa sayt ishlaydi,
 *    sayt qayta ishga tushsa bot uzilmaydi.
 */

import { botniIshgaTushir } from './ishga';

botniIshgaTushir().catch((x: unknown) => {
  const xabar = x instanceof Error ? x.message : String(x);

  /**
   * ⚠️ Eng ko'p uchraydigan sabab — `TELEGRAM_BOT_TOKEN` noto'g'ri
   *    yoki hali olinmagan. Telegram bunga quruq «404» beradi va
   *    egasi nima qilishini bilmaydi. Shuning uchun tushunarli gap.
   */
  if (xabar.includes('404')) {
    console.error(
      [
        'Bot ishga tushmadi: Telegram tokeni notogri.',
        '  .env faylidagi TELEGRAM_BOT_TOKEN ni tekshiring.',
        '  Token @BotFather dan olinadi.',
      ].join('\n'),
    );
  } else if (xabar.includes('409')) {
    console.error(
      [
        'Bot ishga tushmadi: bu bot boshqa joyda ham ishlab turibdi.',
        '  Avvalgi nusxasini toxtating (Ctrl+C).',
      ].join('\n'),
    );
  } else {
    console.error('Bot ishga tushmadi:', xabar);
  }

  process.exitCode = 1;
});
