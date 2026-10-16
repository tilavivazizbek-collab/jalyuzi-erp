/**
 * TZ 11.3 — dashboard oylik trendi. 2026-10-17.
 * Oy boshidan yig'ilgan tushum, o'tgan oyning SHU KUNIgacha taqqoslash,
 * top-5 mahsulot; ruxsatsiz blok `null`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import type { Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import { oylikTrend } from '@/app/(panel)/boshqaruv/trend';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `TR-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;
/** Testning «hozir»i — oyning 10-kuni, Toshkent tushi */
const HOZIR = new Date('2026-06-10T12:00:00+05:00');

const kim = (): Foydalanuvchi => ({
  xodimId: XODIM,
  filialId,
  boshFilialda: false,
  rollar: [{ kod: 'ADMIN', nom: 'ADMIN', ruxsatlar: new Map([['hisobot.sotuv.kor', 'OZ_FILIALI']]) }],
});

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const t = await sql<{ id: number }[]>`INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`${BELGI} parda`}, ${XODIM}) RETURNING id`;
  const j = sql.json({ sinov: true });
  // O'tgan oy: 2-kun 100 000, 25-kun 50 000; bu oy: 1-kun 300 000, 15-kun (kelajak) 999
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sana, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
    VALUES (${`B-${BELGI}-1`}, '2026-05-02T10:00:00+05:00', ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM}),
           (${`B-${BELGI}-2`}, '2026-05-25T10:00:00+05:00', ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM}),
           (${`B-${BELGI}-3`}, '2026-06-01T00:30:00+05:00', ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM}),
           (${`B-${BELGI}-4`}, '2026-06-15T10:00:00+05:00', ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM})
    RETURNING id`;
  const narxlar = [100000, 50000, 300000, 999];
  for (const [i, x] of b.entries()) {
    await sql`
      INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, soni, narx_snapshot,
                                      formula_snapshot, holat, yaratdi_id)
      VALUES (${x.id}, 1, ${t[0]?.id ?? 0}, 1, 1, 1, ${narxlar[i] ?? 0}, ${j}, 'TASDIQLANGAN', ${XODIM})`;
  }
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.3 — oylik trend', () => {
  it('EC-TR-01: yig‘ilib boruvchi tushum, o‘tgan oyning shu kunigacha; Toshkent kuni', async () => {
    const tr = await oylikTrend(kim(), HOZIR);
    const t = tr.tushum;
    expect(t).not.toBeNull();
    // 00:30 Toshkent — 1-kun (UTC bo'yicha bo'lsa 31-may bo'lib ketardi)
    expect(t?.kunlar[0]).toMatchObject({ kun: 1, joriy: '300000.00', otgan: '0.00' });
    expect(t?.kunlar[1]).toMatchObject({ kun: 2, joriy: '300000.00', otgan: '100000.00' });
    // Bugundan keyin bu oy chizilmaydi
    expect(t?.kunlar[10]?.joriy).toBeNull();
    expect(t?.kunlar[30]).toMatchObject({ kun: 31, joriy: null, otgan: '150000.00' });
    expect(t).toMatchObject({ joriy: '300000.00', otganShuKungacha: '100000.00', otganJami: '150000.00' });
  });

  it('EC-TR-02: top-5 mahsulot; ruxsatsiz bloklar yo‘q', async () => {
    const tr = await oylikTrend(kim(), HOZIR);
    // Oy davri BUGUN bilan tugaydi — 15-kungi (kelajak) buyurtma kirmaydi
    expect(tr.topMahsulot).toEqual([{ nom: `${BELGI} parda`, soni: 1, tushum: '300000.00' }]);
    expect(tr.foyda).toBeNull();
    expect(tr.kreditor).toBeNull();
    expect(tr.topMijoz).toBeNull();
  });
});
