/**
 * Excel (.xlsx) yuklab olish javobi — TZ 11.2 ikki varaqli hisobot
 * eksportlari uchun bitta. Faylni `lib/domain/xlsx.ts` yasaydi.
 */
import { NextResponse } from 'next/server';
import { csvFaylNomi } from '@/lib/domain/csv';
import { toshkentKuni } from '@/lib/domain/sana';
import { xlsxYasa, type XlsxVaraq } from '@/lib/domain/xlsx';

export function xlsxJavob(varaqlar: readonly XlsxVaraq[], nom: string): NextResponse {
  const fayl = csvFaylNomi(nom, toshkentKuni()).replace(/\.csv$/, '.xlsx');
  return new NextResponse(Buffer.from(xlsxYasa(varaqlar)), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fayl}"`,
      'Cache-Control': 'no-store',
    },
  });
}
