/**
 * test/integratsiya/yordamchi.ts
 *
 * Haqiqiy bazaga qarshi ishlaydigan testlar uchun umumiy asboblar.
 *
 * NEGA ALOHIDA TO'PLAM (`npm run test:baza`)
 *
 * `npm test` sof mantiqni tekshiradi: tez, tarmoqsiz, har joyda ishlaydi.
 * Bu yerdagi testlar esa bazaga muhtoj — ular baza bilan kod CHEGARASINI
 * sinaydi. Aynan shu chegarada ikki jiddiy xato topilgan edi:
 *
 *   P-13  `BIGINT` matn bo'lib kelib, hisoblagich "1" + 1 = "11" bo'ldi
 *   P-14  sahifa chizilayotganda cookie yozilmadi va 500 chiqdi
 *
 * Ikkalasini ham sof mantiq testlari ko'rmagan. Shuning uchun bu to'plam
 * bir martalik skript emas, doimiy test bo'lishi shart.
 */

import { ulanishYarat, type Ulanish } from '@/lib/db/ulanish';

export const BAZA_BORMI = (process.env['DATABASE_URL'] ?? '') !== '';

/** Sinov ma'lumotlari haqiqiy yozuvlar bilan to'qnashmasligi uchun. */
export const SINOV_XODIM_ID = 9001;
export const SINOV_USTA_ID = 9002;
export const SINOV_TELEFON = '998900009001';
export const SINOV_USTA_TELEFON = '998900009002';
export const SINOV_PAROL = 'integratsiya-sinov-paroli';

export function sinovUlanishi(): Ulanish {
  const url = process.env['DATABASE_URL'];
  if (url === undefined || url === '') {
    throw new Error('DATABASE_URL yo\'q — test:baza uchun .env kerak');
  }
  return ulanishYarat(url, { max: 3 });
}

/** Sinov xodimlari bazada borligiga ishonch hosil qiladi. */
export async function sinovXodimlariniTayyorla(
  sql: Ulanish,
  parolHash: string,
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`SET CONSTRAINTS ALL DEFERRED`;

    await tx`
      INSERT INTO xodim (id, filial_id, ism, telefon, parol_hash, yaratdi_id)
      VALUES (${SINOV_XODIM_ID}, 1, 'Sinov admin', ${SINOV_TELEFON}, ${parolHash}, 1)
      ON CONFLICT (id) DO UPDATE
        SET parol_hash = EXCLUDED.parol_hash, xato_urinish = 0,
            bloklangan = NULL, faol = true`;

    await tx`
      INSERT INTO xodim (id, filial_id, ism, telefon, parol_hash, yaratdi_id)
      VALUES (${SINOV_USTA_ID}, 1, 'Sinov usta', ${SINOV_USTA_TELEFON}, ${parolHash}, 1)
      ON CONFLICT (id) DO UPDATE
        SET parol_hash = EXCLUDED.parol_hash, xato_urinish = 0,
            bloklangan = NULL, faol = true`;

    const admin = await tx<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
    const usta = await tx<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'USTA'`;

    const adminId = admin[0]?.id;
    const ustaId = usta[0]?.id;
    if (adminId === undefined || ustaId === undefined) {
      throw new Error("Tizimli rollar yo'q — avval `npm run db:urug` ni bajaring");
    }

    await tx`
      INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
      VALUES (${SINOV_XODIM_ID}, ${adminId}, 1) ON CONFLICT DO NOTHING`;
    await tx`
      INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
      VALUES (${SINOV_USTA_ID}, ${ustaId}, 1) ON CONFLICT DO NOTHING`;
  });
}

/** Har testdan oldin blok hisoblagichi va sessiyalarni tozalaydi. */
export async function sinovHolatiniTozala(sql: Ulanish): Promise<void> {
  await sql`
    UPDATE xodim SET xato_urinish = 0, bloklangan = NULL
    WHERE id IN (${SINOV_XODIM_ID}, ${SINOV_USTA_ID})`;
  await sql`
    UPDATE sessiya SET bekor_qilindi = now()
    WHERE xodim_id IN (${SINOV_XODIM_ID}, ${SINOV_USTA_ID}) AND bekor_qilindi IS NULL`;
}

export const T0 = new Date('2026-08-17T10:00:00+05:00');
export const daqiqa = (n: number): Date => new Date(T0.getTime() + n * 60_000);
