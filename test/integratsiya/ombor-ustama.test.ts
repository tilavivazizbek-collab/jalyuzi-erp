/**
 * Ombor auditi — material kartochkasidagi ustama. TZ 11.7.5 · 11.10 · 1.3
 *
 * ⚠️ 2026-10-06: kartochka o'z hisobini yuritardi — dollar narxni so'mli
 *    tannarx bilan to'g'ridan-to'g'ri solishtirar va oddiy AVG olardi.
 * ⚠️ 2026-10-07 (egasi qarori): sotuv narxi «Narxlar» jadvalidan —
 *    materialning eski `sotuv_narx` maydoni faqat jadvalda narx yo'q
 *    bo'lsa ishlaydi (sotuv ekrani ham shunday).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import type { Ulanish } from '@/lib/db/ulanish';
import { joriyKurs } from '@/lib/amal/kurs';
import { toshkentKuni } from '@/lib/domain/sana';
import { materialUstamasi } from '@/app/(panel)/ombor/[id]/malumot';
import { ustamaHisoboti } from '@/app/(panel)/hisobot/malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let materialId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  await sql`
    INSERT INTO kurs_tarix (sana, qiymat, yaratdi_id)
    VALUES (${toshkentKuni()}, 12800, ${XODIM})
    ON CONFLICT (sana) DO NOTHING`;
  /** Eski maydonda 99 999 so'm — ustama uni OLMASLIGI kerak */
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          sotuv_narx, sotuv_valyuta, yaratdi_id)
    VALUES (${`Ustama mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', 99999, 'SOM', ${XODIM})
    RETURNING id`;
  materialId = m[0]?.id ?? 0;
  /*
   * Og'irlangan o'rtacha: 30 kv.m × 100 000 va 2 kv.m × 200 000
   *   = (3 000 000 + 400 000) / 32 = 106 250
   * Oddiy AVG esa (100 000 + 200 000) / 2 = 150 000 derdi.
   */
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${`US-${BELGI}-1`}, 'RULON', 3, 10, 100000, ${XODIM}),
           (${materialId}, ${FILIAL}, ${`US-${BELGI}-2`}, 'RULON', 1, 2, 200000, ${XODIM})`;
  /** «Narxlar → Materialni o'zi sotish» — shu materialning o'z jadvali, DOLLARDA */
  const n = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_narx (mahsulot_tur_id, hamma_turga, material_id,
                               hisoblash_usuli, yaratdi_id)
    VALUES (NULL, false, ${materialId}, 'MAYDON', ${XODIM})
    RETURNING id`;
  await sql`
    INSERT INTO mahsulot_narx_bosqich (mahsulot_narx_id, dan, gacha, narx,
                                       valyuta, tartib, yaratdi_id)
    VALUES (${n[0]?.id ?? 0}, 0, NULL, 15, 'USD', 0, ${XODIM})`;
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('material ustamasi', () => {
  it('EC-OMB-U1: tannarx og‘irlangan o‘rtacha (106 250), oddiy AVG emas (150 000)', async () => {
    const u = await materialUstamasi(materialId, FILIAL);
    expect(u.ortachaTannarx).toBe('106250.00');
  });

  it('EC-OMB-U2: narx «Narxlar» jadvalidan (15 $ joriy kursda), eski 99 999 emas', async () => {
    const kurs = await joriyKurs(sql);
    expect(kurs).not.toBeNull();
    const narxSomda = new Decimal(15).times(kurs ?? 0);
    const u = await materialUstamasi(materialId, FILIAL);
    expect(u.sotuvNarx).toBe(narxSomda.toFixed(2));
    const kutilgan = narxSomda.minus(106250).div(106250).times(100).toNumber();
    expect(u.ustamaFoiz).toBeCloseTo(kutilgan, 0);
  });

  it('EC-OMB-U3: kartochka va hisobot BIR XIL; manba — jadval', async () => {
    const u = await materialUstamasi(materialId, FILIAL);
    const h = (await ustamaHisoboti(FILIAL)).qatorlar.find((q) => q.materialId === materialId);
    expect(u.ustamaFoiz).toBe(h?.ustamaFoiz);
    expect(h?.narxManbai).toBe('JADVAL');
  });
});
