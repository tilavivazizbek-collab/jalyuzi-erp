/**
 * app/(panel)/material/malumot.ts — TZ 5.4
 *
 * Material kartochkasi so'rovlari.
 */

import { ulanishOl } from '@/lib/db';

/**
 * TZ 5.4 — «Tannarx qo'lda kiritilmaydi — har kirim hujjatidan
 * avtomatik keladi.»
 *
 * ⚠️ Shu sababli kartochkada HAQIQIY kelish narxi faqat
 *    KO'RSATILADI, tahrirlanmaydi. Kartochkadagi «kutilayotgan»
 *    narx bilan adashtirmaslik uchun sanasi bilan chiqadi:
 *    egasi ikkitasi boshqa-boshqa narsa ekanini darhol ko'radi.
 */
export interface OxirgiKelish {
  readonly narx: string;
  readonly valyuta: string;
  readonly sana: string;
}

export async function oxirgiKelishNarxi(materialId: number): Promise<OxirgiKelish | null> {
  const q = await ulanishOl()<OxirgiKelish[]>`
    SELECT kq.narx_birlik::text AS narx,
           k.valyuta,
           k.sana::text AS sana
    FROM kirim_qator kq
    JOIN kirim k ON k.id = kq.kirim_id
    WHERE kq.material_id = ${materialId}
    ORDER BY k.sana DESC, kq.id DESC
    LIMIT 1`;

  return q[0] ?? null;
}
