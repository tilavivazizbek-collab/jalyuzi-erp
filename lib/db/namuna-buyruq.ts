/**
 * `npm run db:namuna` — namuna zanjirini yaratadi (egasi so'rovi 2026-09-23).
 *
 * ⚠️ Hamma yozuv «NAMUNA» bilan nomlanadi va `db:namuna-ochir` bilan
 *    butunlay o'chiriladi. Egasining o'z ma'lumotiga tegilmaydi.
 */
import { namunaYarat } from './namuna-narx';

namunaYarat()
  .then(() => {
    process.exit(0);
  })
  .catch((x: unknown) => {
    console.error('XATO:', x instanceof Error ? x.message : String(x));
    process.exit(1);
  });
