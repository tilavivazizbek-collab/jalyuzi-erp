/**
 * Salomatlik tekshiruvi — konteyner va zaxira skripti shu yo'lni chaqiradi.
 */
import { NextResponse } from 'next/server';
import { bazaTirikmi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const baza = await bazaTirikmi();
  return NextResponse.json({ dastur: true, baza }, { status: baza ? 200 : 503 });
}
