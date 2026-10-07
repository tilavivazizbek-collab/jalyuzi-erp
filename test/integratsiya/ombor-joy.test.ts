/**
 * Saqlash joyi — 0062. Ombor auditi 2026-10-07, 6-band.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { bolakJoyiniOzgartir, joyNofaol, joyQosh } from '@/lib/amal/ombor-joy';
import { ulanishOl } from '@/lib/db';
import { bolakTafsiloti, yorliqBolaklari } from '@/app/(panel)/ombor/joy-malumot';
import { materialBolaklari } from '@/app/(panel)/ombor/malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let materialId = 0;
let bolakId = 0;
let boshqaFilialBolagi = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Joy sinov ${BELGI}`}, 'RULON', 'rulon', 'KV_M', ${XODIM}) RETURNING id`;
  materialId = m[0]?.id ?? 0;
  const b = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${`J-${BELGI}`}, 'RULON', 3, 20, 50000, ${XODIM})
    RETURNING id`;
  bolakId = b[0]?.id ?? 0;

  // Boshqa filial — bo'lagiga bu filialdan tegib bo'lmasin
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Joy sinov filial ${BELGI}`}, false, true, false, ${XODIM}) RETURNING id`;
  const bb = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${f[0]?.id ?? 0}, ${`JB-${BELGI}`}, 'RULON', 3, 5, 50000, ${XODIM})
    RETURNING id`;
  boshqaFilialBolagi = bb[0]?.id ?? 0;
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('saqlash joyi — 0062', () => {
  let joyId = 0;

  it('EC-JOY-01: joy qo‘shiladi; bir xil nom (katta-kichik, bo‘sh joy) rad etiladi', async () => {
    joyId = await joyQosh(sql, { filialId: FILIAL, nom: `  A-${BELGI}  `, izoh: null }, XODIM);
    expect(joyId).toBeGreaterThan(0);
    await expect(
      joyQosh(sql, { filialId: FILIAL, nom: `a-${BELGI}`, izoh: null }, XODIM),
    ).rejects.toThrow();
  });

  it('EC-JOY-02: bo‘lak joyga qo‘yiladi va audit jurnaliga tushadi', async () => {
    const n = await bolakJoyiniOzgartir(sql, { bolakIdlar: [bolakId], joyId, filialId: FILIAL }, XODIM);
    expect(n).toBe(1);
    const b = await sql<{ joy_id: number | null }[]>`SELECT joy_id FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.joy_id).toBe(joyId);
    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'bolak' AND obyekt_id = ${bolakId} AND amal = 'TAHRIRLASH'`;
    expect(a[0]?.n).toBe(1);
  });

  it('EC-JOY-03: boshqa filialning bo‘lagiga tegib bo‘lmaydi', async () => {
    await expect(
      bolakJoyiniOzgartir(sql, { bolakIdlar: [boshqaFilialBolagi], joyId, filialId: FILIAL }, XODIM),
    ).rejects.toThrow();
  });

  it('EC-JOY-04: ichida bo‘lak turgan joy o‘chirilmaydi; bo‘shatilgach o‘chiriladi', async () => {
    await expect(joyNofaol(sql, joyId, FILIAL, XODIM)).rejects.toThrow();
    await bolakJoyiniOzgartir(sql, { bolakIdlar: [bolakId], joyId: null, filialId: FILIAL }, XODIM);
    await joyNofaol(sql, joyId, FILIAL, XODIM);
    // Nofaol joyga bo'lak qo'yib bo'lmaydi
    await expect(
      bolakJoyiniOzgartir(sql, { bolakIdlar: [bolakId], joyId, filialId: FILIAL }, XODIM),
    ).rejects.toThrow();
    // Nom endi bo'sh — qayta ishlatsa bo'ladi
    await expect(
      joyQosh(sql, { filialId: FILIAL, nom: `A-${BELGI}`, izoh: null }, XODIM),
    ).resolves.toBeGreaterThan(0);
  });
});

describe('bo‘lak sahifasi va yorliq — 0062', () => {
  it('EC-JOY-05: bo‘lak sahifasi joyni ko‘rsatadi; boshqa filial bo‘lagi — topilmadi', async () => {
    const joyId = await joyQosh(sql, { filialId: FILIAL, nom: `C-${BELGI}`, izoh: null }, XODIM);
    await bolakJoyiniOzgartir(sql, { bolakIdlar: [bolakId], joyId, filialId: FILIAL }, XODIM);
    const b = await bolakTafsiloti(bolakId, FILIAL);
    expect(b?.joyNomi).toBe(`C-${BELGI}`);
    expect(b?.eniM).toBe('3.00');
    expect(await bolakTafsiloti(boshqaFilialBolagi, FILIAL)).toBeNull();
  });

  it('EC-JOY-06: yorliq — tanlangan, material bo‘yicha; boshqa filialniki kirmaydi', async () => {
    const t = await yorliqBolaklari(FILIAL, { idlar: [bolakId, boshqaFilialBolagi] });
    expect(t.map((x) => x.id)).toEqual([bolakId]);
    const m = await yorliqBolaklari(FILIAL, { materialId });
    expect(m.map((x) => x.id)).toContain(bolakId);
    expect(await yorliqBolaklari(FILIAL, {})).toEqual([]);
  });

  it('EC-JOY-07: material kartochkasida joy ustuni', async () => {
    const r = await materialBolaklari(materialId, FILIAL);
    expect(r.find((x) => x.id === bolakId)?.joyNomi).toBe(`C-${BELGI}`);
  });
});
