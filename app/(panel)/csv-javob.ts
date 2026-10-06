/**
 * Excel (CSV) yuklab olish javobi — barcha eksport yo'llari uchun bitta.
 * Matnni `lib/domain/csv.ts` dagi `csvYoz` yasaydi.
 */
import { NextResponse } from 'next/server';
import { csvFaylNomi } from '@/lib/domain/csv';
import { toshkentKuni } from '@/lib/domain/sana';

export function csvJavob(matn: string, nom: string): NextResponse {
  return new NextResponse(matn, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFaylNomi(nom, toshkentKuni())}"`,
      'Cache-Control': 'no-store',
    },
  });
}
