/**
 * app/api/rasm/[tur]/[id]/route.ts — katalog rasmi.
 *
 * ⚠️ Rasm BAZADA saqlanadi (fayl tizimi Render da vaqtinchalik).
 *    Bu yo'l uni brauzerga beradi.
 *
 * ⚠️ KESHLANADI. Rasm o'zgarganda `ozgartirildi` ham o'zgaradi va
 *    manzilga qo'shiladi — shuning uchun uzoq kesh xavfsiz:
 *    yangi rasm yangi manzil bo'ladi.
 *
 * ⚠️ Ruxsat tekshiriladi (§9.4): katalog rasmi ichki ma'lumot,
 *    tashqaridan ochiq turmasligi kerak.
 */

import { NextResponse } from 'next/server';
import { ulanishOl } from '@/lib/db';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';

export const dynamic = 'force-dynamic';

/** Faqat shu ikki jadvalda rasm bor — boshqa nom qabul qilinmaydi */
const JADVALLAR: Record<string, string> = {
  material: 'material',
  mahsulot: 'mahsulot_tur',
};

export async function GET(
  _sorov: Request,
  { params }: { params: Promise<{ tur: string; id: string }> },
): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null) return new NextResponse(null, { status: 403 });

  const { tur, id } = await params;

  const jadval = JADVALLAR[tur];
  if (jadval === undefined) return new NextResponse(null, { status: 404 });

  const raqam = Number(id);
  if (!Number.isSafeInteger(raqam) || raqam <= 0) {
    return new NextResponse(null, { status: 404 });
  }

  const sql = ulanishOl();
  const q = await sql<{ rasm: Buffer | null; rasm_turi: string | null }[]>`
    SELECT rasm, rasm_turi FROM ${sql(jadval)} WHERE id = ${raqam}`;

  const rasm = q[0]?.rasm;
  if (rasm === null || rasm === undefined) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(rasm), {
    headers: {
      'Content-Type': q[0]?.rasm_turi ?? 'image/webp',
      /**
       * ⚠️ Bir yil — manzilda o'zgarish vaqti bor, shuning uchun
       *    yangi rasm avtomatik yangi manzil oladi.
       */
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
