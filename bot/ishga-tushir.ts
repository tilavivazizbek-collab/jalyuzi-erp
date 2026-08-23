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
  console.error('Bot ishga tushmadi:', x);
  process.exitCode = 1;
});
