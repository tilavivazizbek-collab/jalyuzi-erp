/**
 * lib/db/ruxsat-sinxron.ts — ruxsat kodlarini baza bilan moslash.
 *
 * ⚠️ NEGA KERAK
 *
 * Ruxsat kodlari KODDA (`lib/ruxsat/kodlar.ts`), ularning rolga
 * berilishi esa BAZADA. Yangi kod qo'shilganda baza undan
 * bexabar qoladi: admin ham o'sha huquqni ololmaydi.
 *
 * 2026-08-28 da aynan shunday bo'ldi: `kassa.yarat` kodi qo'shildi,
 * admin uni ololmadi va test yiqildi.
 *
 * ⚠️ IDEMPOTENT — necha marta ishga tushirilsa ham xavfsiz.
 *    Mavjud ruxsatlar o'chirilmaydi, faqat YETISHMAYOTGANI
 *    qo'shiladi. Admin qo'lda olib tashlagan huquq qaytmaydi:
 *    faqat KODDA bor, bazada YO'Q bo'lganlari qo'shiladi.
 */

import type postgres from 'postgres';
import { RUXSATLAR, RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';

export interface SinxronNatijasi {
  readonly yangiKod: number;
  readonly adminga: number;
}

export async function ruxsatlarniSinxronla(
  ulanish: postgres.Sql,
  xodimId = 1,
): Promise<SinxronNatijasi> {
  return ulanish.begin(async (tx) => {
    let yangiKod = 0;

    for (const kod of RUXSAT_KODLARI) {
      const t = RUXSATLAR[kod];
      const q = await tx<{ kod: string }[]>`
        INSERT INTO ruxsat (kod, nom, guruh) VALUES (${kod}, ${t.nom}, ${t.guruh})
        ON CONFLICT (kod) DO UPDATE SET nom = EXCLUDED.nom, guruh = EXCLUDED.guruh
        RETURNING kod`;
      if (q.length > 0) yangiKod += 1;
    }

    /**
     * ⚠️ TZ 14.6 — «Standart holat: barcha huquq adminda.»
     *    Yangi kod qo'shilsa admin uni AVTOMATIK oladi, aks holda
     *    yangi imkoniyat hech kimga ko'rinmasdi.
     */
    const admin = await tx<{ id: number }[]>`
      SELECT id FROM rol WHERE kod = 'ADMIN' LIMIT 1`;

    const adminId = admin[0]?.id;
    if (adminId === undefined) return { yangiKod, adminga: 0 };

    const qoshildi = await tx<{ ruxsat_kod: string }[]>`
      INSERT INTO rol_ruxsat (rol_id, ruxsat_kod, qamrov, yaratdi_id)
      SELECT ${adminId}, r.kod, 'BARCHA', ${xodimId}
      FROM ruxsat r
      WHERE NOT EXISTS (
        SELECT 1 FROM rol_ruxsat rr
        WHERE rr.rol_id = ${adminId} AND rr.ruxsat_kod = r.kod
      )
      RETURNING ruxsat_kod`;

    return { yangiKod, adminga: qoshildi.length };
  });
}
