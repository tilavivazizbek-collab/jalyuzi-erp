/**
 * Mijozlar ro'yxati — Excel uchun CSV (egasi auditi 2026-10-06).
 *
 * ⚠️ EKRANDAGI FILTR BILAN — `filtrniOqi` ro'yxat sahifasi bilan bitta.
 *    «Qarzdorlar» ko'rib turib yuklasa, faqat qarzdorlar tushadi.
 *
 * ⚠️ YANGI KUTUBXONA YO'Q — CSV ni Excel o'zi ochadi:
 *    - boshida BOM — o'zbek/kirill harflari buzilmaydi
 *    - ajratuvchi «;», kasr «,» — O'zbekiston/Rossiya sozlamali Excel
 *      shuni kutadi; «,» bilan hamma narsa bitta ustunga tushardi
 *
 * ⚠️ Ruxsat SHU YERDA ham tekshiriladi (§9.4).
 */
import { NextResponse } from 'next/server';
import { ulanishOl } from '@/lib/db';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { joriyKurs } from '@/lib/amal/kurs';
import { telefonKorsat } from '@/lib/domain/telefon';
import { SEGMENT_NOMI, filtrniOqi, mijozlarRoyxati } from '../malumot';

export const dynamic = 'force-dynamic';

/** Eksport chegarasi — undan ko'p mijoz bo'lsa filtr bilan bo'lib olinadi */
const ENG_KOP = 20_000;

const katak = (x: string | number | null): string => {
  const s = x === null ? '' : String(x);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** NUMERIC matn → Excel soni: kasr vergul bilan */
const son = (x: string | null): string => (x === null ? '' : x.replace('.', ','));

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'mijoz.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }

  const sp = Object.fromEntries(new URL(sorov.url).searchParams.entries());
  const filtr = { ...filtrniOqi(sp), sahifa: 1 };
  const natija = await mijozlarRoyxati(filtr, await joriyKurs(ulanishOl()), ENG_KOP);

  const sarlavha = [
    'Ism',
    'Tashkilot',
    'Telefon',
    'Turi',
    'Guruh',
    "Mas'ul",
    'Segment',
    "Qarz, so'm",
    'Qarz, $',
    "Sotuv, so'm",
    'Sotuv, $',
    'Oxirgi xarid',
    "Qarz limiti, so'm",
    "To'lov muddati, kun",
  ];
  const qatorlar = natija.qatorlar.map((m) =>
    [
      m.ism,
      m.tashkilot_nomi,
      m.telefon === null ? null : telefonKorsat(m.telefon),
      m.turi_nomi ?? (m.shaxs_turi === 'YURIDIK' ? 'Yuridik' : 'Jismoniy'),
      m.guruh_nomi,
      m.masul_ismi,
      SEGMENT_NOMI[m.segment],
      son(m.qarz_som),
      son(m.qarz_usd),
      son(m.sotuv_som),
      son(m.sotuv_usd),
      m.oxirgi === null ? null : m.oxirgi.toLocaleDateString('uz-UZ'),
      son(m.qarz_limiti),
      m.tolov_muddati_kun,
    ]
      .map(katak)
      .join(';'),
  );

  const matn = `﻿${[sarlavha.map(katak).join(';'), ...qatorlar].join('\r\n')}\r\n`;
  const sana = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(new Date());

  return new NextResponse(matn, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mijozlar-${sana}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
