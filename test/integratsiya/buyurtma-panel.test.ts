/**
 * TZ 11.11 — Buyurtmalar sahifasi paneli. 2026-10-17.
 * Holat sanoqlari, diqqat qatori dashboard bilan bir xil, navbat bandi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { buyurtmaPaneli } from '@/app/(panel)/buyurtma/panel';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `BP-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const t = await sql<{ id: number }[]>`INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  const j = sql.json({ sinov: true });
  const holatlar = ['ISHLAB_CHIQARILMOQDA', 'TAYYOR', 'TASDIQLANGAN', 'TOPSHIRILDI'];
  for (const [i, h] of holatlar.entries()) {
    const b = await sql<{ id: number }[]>`
      INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
      VALUES (${`B-${BELGI}-${String(i)}`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM}) RETURNING id`;
    await sql`
      INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, soni, narx_snapshot,
                                      formula_snapshot, holat, yaratildi, yaratdi_id)
      VALUES (${b[0]?.id ?? 0}, 1, ${t[0]?.id ?? 0}, 1, 1, 1, 100000, ${j}, ${h}, now() - interval '4 days', ${XODIM})`;
  }
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.11 — buyurtmalar paneli', () => {
  it('EC-BP-01: holat — ochiq 3, ishlab 1, tayyor 1; navbatdagi 4 kunlik ish qizil', async () => {
    const p = await buyurtmaPaneli(filialId);
    expect(p.holat.map((b) => [b.nom, b.qiymat])).toEqual([
      ['Ochiq buyurtma', '3'],
      ['Ishlab chiqarilmoqda', '1'],
      ['Tayyor, topshirilmagan', '1'],
    ]);
    const navbat = p.diqqat.find((b) => b.nom === 'Navbatda uzoq turgan');
    expect(navbat).toMatchObject({ ton: 'xavf', havola: '/hisobot/ishlab' });
    expect(navbat?.qiymat).toMatch(/^4\.\d kun$/);
    // Diqqat — dashboard bandlari (tasdiq, muddat, material) + navbat
    expect(p.diqqat.map((b) => b.nom)).toEqual([
      'Tasdiq kutayotgan',
      "Muddati o'tgan",
      'Materialga kutayotgan',
      'Navbatda uzoq turgan',
    ]);
    expect(p.diqqat.slice(0, 3).every((b) => b.qiymat === '0' && b.ton === null)).toBe(true);
  });
});
