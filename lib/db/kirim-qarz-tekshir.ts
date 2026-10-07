/**
 * lib/db/kirim-qarz-tekshir.ts — `npm run db:kirim-qarz-tekshir`
 *
 * 2026-10-07 (ombor auditi, 8-band) topilgan xato: narx metrga (`METR`)
 * yoki kv.m ga (`KV_M`) berilgan kirimda yetkazib beruvchi qarzi
 * `narx × rulon soni` deb yozilgan. Kod tuzatildi; bu skript ESKI
 * kirimlardan qaysilarida qarz noto'g'ri yozilganini va farqni aytadi.
 *
 * ⚠️ FAQAT O'QIYDI. Tuzatuvchi yozuv qo'yish — egasining qarori
 *    (CLAUDE.md «Ruxsat majburiy»): yetkazib beruvchi bilan solishtirma
 *    dalolatnomasi qilingan bo'lishi mumkin.
 *
 * ⚠️ To'g'ri summa tannarx bilan BITTA formuladan — `qatorQiymati`.
 *    Rulon o'lchami — kirimdan tug'ilgan bo'laklardan (`kirim_qator_id`).
 *    Inventarizatsiyada o'lchami tuzatilgan bo'lak bo'lsa summa taxminiy
 *    — shunday qatorlar alohida belgilanadi.
 */
import postgres from 'postgres';
import Decimal from 'decimal.js';
import { qatorQiymati } from '@/lib/domain/tannarx';
import { pulMatn, som } from '@/lib/domain/pul';

const KUTISH_MS = 60_000;

interface Qator {
  kirim_id: number;
  raqam: string;
  sana: string;
  yetkazib: string;
  valyuta: string;
  qator_id: number;
  miqdor: string;
  narx: string;
  asos: 'BIRLIK' | 'METR' | 'KV_M';
  defekt: string;
  boyi: string | null;
  kv_m: string | null;
  inv_tuzatilgan: boolean;
}

async function ishga(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') throw new Error('DATABASE_URL yo‘q');
  const sql = postgres(url, {
    max: 1,
    ssl: url.includes('localhost') ? false : 'require',
    connect_timeout: 15,
  });

  try {
    const qatorlar = await sql<Qator[]>`
      SELECT k.id AS kirim_id, k.raqam, k.sana::text, y.nom AS yetkazib, k.valyuta,
             kq.id AS qator_id, kq.miqdor_kirim::text AS miqdor, kq.narx_birlik::text AS narx,
             kq.narx_asosi AS asos, kq.defekt_miqdor::text AS defekt,
             SUM(b.boyi_m)::text AS boyi, SUM(b.eni_m * b.boyi_m)::text AS kv_m,
             EXISTS (SELECT 1 FROM ombor_harakat oh
                      WHERE oh.turi = 'INVENTARIZATSIYA'
                        AND oh.bolak_id = ANY(array_agg(b.id))) AS inv_tuzatilgan
      FROM kirim k
      JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
      JOIN kirim_qator kq ON kq.kirim_id = k.id
      LEFT JOIN bolak b ON b.kirim_qator_id = kq.id
      WHERE k.holat = 'FAOL' AND kq.narx_asosi IN ('METR', 'KV_M')
      GROUP BY k.id, y.nom, kq.id
      ORDER BY k.sana, k.id`;

    const yozilgan = await sql<{ manba_id: number; summa: string }[]>`
      SELECT manba_id, SUM(summa)::text AS summa
      FROM yetkazib_beruvchi_harakat
      WHERE manba_turi = 'kirim' AND turi = 'XARID'
      GROUP BY manba_id`;
    const yozilganXarita = new Map(yozilgan.map((x) => [x.manba_id, new Decimal(x.summa)]));

    // Hujjat bo'yicha: METR/KV_M qatorlarning to'g'ri qiymati − eski formula qiymati
    const farqlar = new Map<number, { q: Qator; farq: Decimal; taxminiy: boolean }>();
    for (const q of qatorlar) {
      const togri = new Decimal(
        pulMatn(
          qatorQiymati({
            id: q.qator_id,
            miqdor: Number(q.miqdor),
            narxBirlik: som(q.narx),
            defektMiqdor: Number(q.defekt),
            narxAsosi: q.asos,
            jamiBoyiM: Number(q.boyi ?? 0),
            jamiKvM: Number(q.kv_m ?? 0),
          }),
        ),
      );
      const eski = new Decimal(q.narx).times(q.miqdor);
      const bor = farqlar.get(q.kirim_id);
      farqlar.set(q.kirim_id, {
        q,
        farq: (bor?.farq ?? new Decimal(0)).plus(togri.minus(eski)),
        taxminiy: (bor?.taxminiy ?? false) || q.inv_tuzatilgan,
      });
    }

    const tasirlangan = [...farqlar.values()].filter((x) => !x.farq.isZero());
    if (tasirlangan.length === 0) {
      console.log('✓ Metr / kv.m narxli kirimlarda qarz to‘g‘ri — tuzatish kerak emas.');
      return;
    }

    console.log(`⚠ ${String(tasirlangan.length)} ta kirimda yetkazib beruvchi qarzi kam yozilgan:\n`);
    const jami = new Map<string, Decimal>();
    for (const { q, farq, taxminiy } of tasirlangan) {
      const yoz = yozilganXarita.get(q.kirim_id) ?? new Decimal(0);
      console.log(
        `  ${q.sana}  ${q.raqam.padEnd(16)} ${q.yetkazib.padEnd(24)} ` +
          `yozilgan ${yoz.toFixed(2)} ${q.valyuta} · yetishmaydi ${farq.toFixed(2)} ${q.valyuta}` +
          (taxminiy ? '  (inventarizatsiyada o‘lcham tuzatilgan — taxminiy)' : ''),
      );
      const kalit = `${q.yetkazib} (${q.valyuta})`;
      jami.set(kalit, (jami.get(kalit) ?? new Decimal(0)).plus(farq));
    }
    console.log('\nYetkazib beruvchi bo‘yicha jami yetishmagan qarz:');
    for (const [k, v] of jami) console.log(`  ${k}: ${v.toFixed(2)}`);
    console.log('\nHech narsa yozilmadi. Tuzatuvchi yozuv — egasi qaroridan keyin.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const soat = new Promise<never>((_, rad) => {
  setTimeout(() => {
    rad(new Error('qotib qoldi — avval /api/salomatlik ni tekshiring'));
  }, KUTISH_MS);
});

Promise.race([ishga(), soat])
  .then(() => process.exit(0))
  .catch((x: unknown) => {
    console.error(x instanceof Error ? x.message : String(x));
    process.exit(1);
  });
