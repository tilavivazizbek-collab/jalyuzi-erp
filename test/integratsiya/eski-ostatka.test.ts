/**
 * LOYIHA T-03 — ostatka yoshi va chiqindiga chiqarish taklifi. 2026-10-14.
 * 11.7.6 dagi ostatka qatorlari yoshi bilan keladi; 6 oydan oshgani `eski`.
 * «Eski ostatka» sababi bilan chiqarilgach ro'yxatdan tushadi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { hisobdanChiqar } from '@/lib/amal/hisobdan';
import { muzlaganPulHisoboti } from '@/app/(panel)/hisobot/malumot';
import { pulMatn } from '@/lib/domain/pul';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let filialId = 0;
let eskiId = 0;
let yangiId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`EO ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
    VALUES (${`EO mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
  const materialId = m[0]?.id ?? 0;
  const b = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratildi, yaratdi_id)
    VALUES (${materialId}, ${filialId}, ${`EO-A-${BELGI}`}, 'OSTATKA', 0.6, 2, 10000,
            now() - interval '7 months', ${XODIM}),
           (${materialId}, ${filialId}, ${`EO-B-${BELGI}`}, 'OSTATKA', 0.5, 1, 10000,
            now() - interval '10 days', ${XODIM})
    RETURNING id`;
  eskiId = b[0]?.id ?? 0;
  yangiId = b[1]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('T-03 — eski ostatka', () => {
  it('EC-EO-01: yoshi keladi, 6 oydan oshgani eski', async () => {
    const r = await muzlaganPulHisoboti(filialId);
    const eski = r.ostatkaQatorlari.find((q) => q.bolakId === eskiId);
    const yangi = r.ostatkaQatorlari.find((q) => q.bolakId === yangiId);
    expect(eski).toMatchObject({ eski: true, qiymat: '12000.00' });
    expect(eski?.yoshKun).toBeGreaterThan(180);
    expect(yangi).toMatchObject({ eski: false, yoshKun: 10 });
  });

  it('EC-EO-02: «Eski ostatka» bilan chiqarilgach ro‘yxatdan tushadi, sabab auditda', async () => {
    const n = await hisobdanChiqar(
      ulanishOl(),
      { bolakId: eskiId, sabab: 'ESKI_OSTATKA', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );
    expect(pulMatn(n.zarar)).toBe('12000.00');

    const r = await muzlaganPulHisoboti(filialId);
    expect(r.ostatkaQatorlari.map((q) => q.bolakId)).toEqual([yangiId]);

    const a = await sql<{ sabab: string; izoh: string }[]>`
      SELECT yangi_qiymat->>'sabab' AS sabab, izoh FROM audit_jurnal
      WHERE amal = 'OMBORDAN_CHIQARILDI' AND obyekt_id = ${eskiId}`;
    expect(a[0]).toEqual({ sabab: 'ESKI_OSTATKA', izoh: 'Eski ostatka — ishlatilmay qoldi' });
  });
});
