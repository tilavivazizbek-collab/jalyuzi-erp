/**
 * LOYIHA T-08 — material kartochkasida sotuv narxi tarixi. 2026-10-14.
 * Narx ikki marta saqlansa ikkala versiya ham chiqadi: yangisi «amalda»,
 * eskisi tugagan sanasi bilan; boshqa materialning narxi aralashmaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { turNarxiniSaqla } from '@/lib/amal/narx-qoida';
import { materialNarxTarixi } from '@/app/(panel)/material/[id]/narx-tarixi';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `NT-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let materialId = 0;
let boshqaId = 0;

async function saqla(id: number, bosqichlar: { dan: number; gacha: number | null; narx: string }[]): Promise<void> {
  const n = await sql.begin(async (tx) =>
    turNarxiniSaqla(
      tx,
      {
        mahsulotTurId: null,
        hammaTurga: false,
        materialId: id,
        qoidalar: [
          {
            mijozTuriId: null,
            filialId: null,
            hisoblashUsuli: 'MIQDOR',
            bosqichlar: bosqichlar.map((b) => ({ ...b, valyuta: 'SOM' as const })),
          },
        ],
        qoshimchalar: [],
      },
      XODIM,
    ),
  );
  expect(n.holat).toBe('SAQLANDI');
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
                          togridan_sotiladi, yaratdi_id)
    VALUES (${`${BELGI} karniz`}, 'DONA', 'dona', 'M', '1', true, ${XODIM}),
           (${`${BELGI} pult`}, 'DONA', 'dona', 'DONA', '1', true, ${XODIM})
    RETURNING id`;
  materialId = m[0]?.id ?? 0;
  boshqaId = m[1]?.id ?? 0;

  await saqla(materialId, [{ dan: 0, gacha: null, narx: '30000' }]);
  await saqla(boshqaId, [{ dan: 0, gacha: null, narx: '99000' }]);
  await saqla(materialId, [
    { dan: 0, gacha: 10, narx: '35000' },
    { dan: 10, gacha: null, narx: '32000' },
  ]);
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('T-08 — sotuv narxi tarixi', () => {
  it('EC-NT-01: ikki versiya, yangisi birinchi va amalda; bosqichlar o‘z versiyasida', async () => {
    const t = await materialNarxTarixi(materialId);
    expect(t).toHaveLength(2);
    expect(t[0]?.tugadi).toBeNull();
    expect(t[0]?.bosqichlar.map((b) => b.narx)).toEqual(['35000.00', '32000.00']);
    expect(t[1]?.tugadi).not.toBeNull();
    expect(t[1]?.bosqichlar.map((b) => b.narx)).toEqual(['30000.00']);
    expect(t.every((v) => v.mijozTuri === null && v.filial === null)).toBe(true);
  });

  it('EC-NT-02: boshqa material narxi aralashmaydi; narxsiz material — bo‘sh', async () => {
    const b = await materialNarxTarixi(boshqaId);
    expect(b.map((v) => v.bosqichlar.map((q) => q.narx))).toEqual([['99000.00']]);
    expect(await materialNarxTarixi(0)).toEqual([]);
  });
});
