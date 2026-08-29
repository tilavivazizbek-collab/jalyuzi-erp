/**
 * TZ 3.10 — sotuv ekranidagi mijoz qidiruvi.
 *
 * ⚠️ Ruxsat SHU YERDA ham tekshiriladi (§9.4): API yo'li sahifadan
 *    alohida ochilishi mumkin.
 */

import { NextResponse } from 'next/server';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { mijozQidir } from '@/app/(panel)/buyurtma/yangi/malumot';

export const dynamic = 'force-dynamic';

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'mijoz.kor')) {
    return NextResponse.json([], { status: 403 });
  }

  const q = new URL(sorov.url).searchParams.get('q') ?? '';
  return NextResponse.json(await mijozQidir(q));
}
