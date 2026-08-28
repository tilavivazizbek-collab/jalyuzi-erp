/**
 * `npm run db:sinov-tozala` — testlardan qolgan filial va xodim.
 *
 * ⚠️ NEGA ALOHIDA BUYRUQ
 *
 * `db:tozala` ish ma'lumotlarini tozalaydi, lekin filial va
 * xodimga TEGMAYDI — ularsiz tizimga kirib bo'lmaydi.
 *
 * Testlar esa o'z filiali va xodimlarini yaratgan va ular qolib
 * ketgan. Bu buyruq aynan o'shalarni olib tashlaydi.
 *
 * ⚠️ SAQLANADI: bosh filial va urug'dagi 5 ta xodim
 *    (`id <= 5`). Ular tizimning o'zagi.
 *
 * ⚠️ Testlar endi ISHLAYDIGAN BAZAGA YOZMAYDI (CLAUDE.md §16),
 *    shuning uchun bu buyruq bir martalik tozalash uchun.
 */

import { ulanishOl } from '@/lib/db';

const sql = ulanishOl();

try {
  /**
   * ⚠️ Xodim `id <= 5` — urug'dagilar: Bosh admin, Admin,
   *    Sotuvchi, Omborchi, Usta. Qolgani testdan.
   */
  const x = await sql`
    DELETE FROM xodim_rol WHERE xodim_id > 5 RETURNING xodim_id`;

  const x2 = await sql`DELETE FROM sessiya WHERE xodim_id > 5 RETURNING id`;
  const x3 = await sql`DELETE FROM xodim WHERE id > 5 RETURNING id, ism`;

  /** ⚠️ Faqat BOSH filial qoladi */
  const f = await sql`DELETE FROM filial WHERE bosh = false RETURNING id, nom`;

  console.log(`Xodim rollari: ${String(x.length)}`);
  console.log(`Sessiyalar:    ${String(x2.length)}`);
  console.log(`Xodimlar:      ${String(x3.length)}`);
  console.log(`Filiallar:     ${String(f.length)}`);

  const qolgan = await sql<{ x: number; f: number }[]>`
    SELECT (SELECT count(*)::int FROM xodim) AS x,
           (SELECT count(*)::int FROM filial) AS f`;

  console.log(
    `\nQoldi: ${String(qolgan[0]?.x ?? 0)} xodim, ${String(qolgan[0]?.f ?? 0)} filial`,
  );
} finally {
  await sql.end();
}
