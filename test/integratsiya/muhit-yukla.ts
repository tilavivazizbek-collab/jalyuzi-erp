/**
 * `.env` ni test jarayoniga yuklaydi.
 *
 * Node ning `--env-file` bayrog'i vitest orqali o'tmaydi, `dotenv` esa
 * shu bitta ish uchun qo'shiladigan kutubxona bo'lardi. Fayl oddiy
 * `KALIT=qiymat` ko'rinishida — o'zimiz o'qiymiz.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const yol = fileURLToPath(new URL('../../.env', import.meta.url));

try {
  const matn = readFileSync(yol, 'utf8');

  for (const xomQator of matn.split(/\r?\n/)) {
    const qator = xomQator.trim();
    if (qator === '' || qator.startsWith('#')) continue;

    const tenglik = qator.indexOf('=');
    if (tenglik <= 0) continue;

    const kalit = qator.slice(0, tenglik).trim();
    let qiymat = qator.slice(tenglik + 1).trim();

    // Qo'shtirnoq ichida yozilgan bo'lsa olib tashlanadi
    if (
      (qiymat.startsWith('"') && qiymat.endsWith('"')) ||
      (qiymat.startsWith("'") && qiymat.endsWith("'"))
    ) {
      qiymat = qiymat.slice(1, -1);
    }

    // Tashqaridan berilgan qiymat ustun turadi (CI da shunday bo'ladi)
    process.env[kalit] ??= qiymat;
  }
} catch {
  // `.env` yo'q bo'lsa jim o'tiladi — testning o'zi tushunarli xato beradi
}
