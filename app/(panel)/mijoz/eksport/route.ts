/**
 * Mijozlar ro'yxati — Excel uchun CSV (egasi auditi 2026-10-06).
 *
 * ⚠️ EKRANDAGI FILTR BILAN — `filtrniOqi` ro'yxat sahifasi bilan bitta.
 *    «Qarzdorlar» ko'rib turib yuklasa, faqat qarzdorlar tushadi.
 *
 * ⚠️ CSV shakli bitta joyda — `csvYoz` (BOM, «;», kasr vergul).
 *
 * ⚠️ Ruxsat SHU YERDA ham tekshiriladi (§9.4).
 */
import { NextResponse } from 'next/server';
import { ulanishOl } from '@/lib/db';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { joriyKurs } from '@/lib/amal/kurs';
import { telefonKorsat } from '@/lib/domain/telefon';
import { csvSon, csvYoz } from '@/lib/domain/csv';
import { csvJavob } from '../../csv-javob';
import { SEGMENT_NOMI, filtrniOqi, mijozlarRoyxati } from '../malumot';

export const dynamic = 'force-dynamic';

/** Eksport chegarasi — undan ko'p mijoz bo'lsa filtr bilan bo'lib olinadi */
const ENG_KOP = 20_000;

export async function GET(sorov: Request): Promise<NextResponse> {
  const f = await joriyFoydalanuvchi();
  if (f === null || !ruxsatBormi(f, 'mijoz.kor')) {
    return new NextResponse('Ruxsat yo‘q', { status: 403 });
  }

  const sp = Object.fromEntries(new URL(sorov.url).searchParams.entries());
  const filtr = { ...filtrniOqi(sp), sahifa: 1 };
  const natija = await mijozlarRoyxati(filtr, await joriyKurs(ulanishOl()), ENG_KOP);

  const matn = csvYoz(
    [
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
    ],
    natija.qatorlar.map((m) => [
      m.ism,
      m.tashkilot_nomi,
      m.telefon === null ? null : telefonKorsat(m.telefon),
      m.turi_nomi ?? (m.shaxs_turi === 'YURIDIK' ? 'Yuridik' : 'Jismoniy'),
      m.guruh_nomi,
      m.masul_ismi,
      SEGMENT_NOMI[m.segment],
      csvSon(m.qarz_som),
      csvSon(m.qarz_usd),
      csvSon(m.sotuv_som),
      csvSon(m.sotuv_usd),
      m.oxirgi === null ? null : m.oxirgi.toLocaleDateString('uz-UZ'),
      csvSon(m.qarz_limiti),
      m.tolov_muddati_kun,
    ]),
  );

  return csvJavob(matn, 'mijozlar');
}
