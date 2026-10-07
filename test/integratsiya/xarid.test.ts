/**
 * Xarid buyurtmasi — 0063. Ombor auditi 2026-10-07, 7-band.
 *
 * ⚠️ Asosiy qoida: «kelgan» SAQLANMAYDI, FAOL kirimlardan hisoblanadi.
 *    Kirim storno bo'lsa buyurtma o'zi «kutilmoqda»ga qaytadi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimniStorno, kirimYarat, type KirimKirimi } from '@/lib/amal/kirim';
import { xaridniYop, xaridYarat } from '@/lib/amal/xarid';
import {
  xaridTafsiloti,
  xaridlarRoyxati,
  yoldaXaritasi,
  yoldagiBuyurtmalar,
} from '@/app/(panel)/ombor/xarid/malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let yetkazibId = 0;
let boshqaYetkazibId = 0;
let matoId = 0;
let profilId = 0;
let hisob = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`Xarid yetkazuvchi ${BELGI}`}, ${XODIM}), (${`Xarid boshqa ${BELGI}`}, ${XODIM})
    RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;
  boshqaYetkazibId = y[1]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
                          sotuv_narx, yaratdi_id)
    VALUES (${`Xarid matosi ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', '120000', ${XODIM}),
           (${`Xarid profili ${BELGI}`}, 'DONA', 'dona', 'DONA', '1', '5000', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;
  profilId = m[1]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

function kirim(xaridId: number | undefined, rulon: number, dona: number, yetkazib = yetkazibId): KirimKirimi {
  hisob += 1;
  const qatorlar: KirimKirimi['qatorlar'][number][] = [];
  if (rulon > 0) {
    qatorlar.push({
      materialId: matoId,
      miqdorKirim: rulon,
      narxBirlik: '1000000',
      defektMiqdor: 0,
      defektTuri: null,
      bolaklar: Array.from({ length: rulon }, () => ({ eniM: 3, boyiM: 50 })),
    });
  }
  if (dona > 0) {
    qatorlar.push({
      materialId: profilId,
      miqdorKirim: dona,
      narxBirlik: '3000',
      defektMiqdor: 0,
      defektTuri: null,
      bolaklar: [],
    });
  }
  return {
    raqam: `K-XB-${BELGI}-${String(hisob)}`,
    sana: '2026-10-07',
    filialId: FILIAL,
    yetkazibBeruvchiId: yetkazib,
    valyuta: 'SOM',
    kursSnapshot: null,
    transportSumma: '0',
    bojxonaSumma: '0',
    tolovMuddati: null,
    qatorlar,
    xaridBuyurtmaId: xaridId,
  };
}

async function yangiXarid(): Promise<number> {
  const { id } = await xaridYarat(
    sql,
    {
      filialId: FILIAL,
      yetkazibBeruvchiId: yetkazibId,
      sana: '2026-10-01',
      kutilganSana: '2026-10-05',
      valyuta: 'SOM',
      izoh: null,
      qatorlar: [
        { materialId: matoId, miqdor: '5', narxBirlik: '20000', narxAsosi: 'METR' },
        { materialId: profilId, miqdor: '100', narxBirlik: '3000', narxAsosi: 'BIRLIK' },
      ],
    },
    XODIM,
  );
  return id;
}

describe('xarid buyurtmasi — 0063', () => {
  let xaridId = 0;
  let kirimId = 0;

  it('EC-XB-01: yaratiladi — raqam XB-, holat «kutilmoqda», kechikkan', async () => {
    xaridId = await yangiXarid();
    const x = await xaridTafsiloti(xaridId, FILIAL);
    expect(x?.raqam).toMatch(/^XB-\d+$/);
    expect(x?.holat).toBe('KUTILMOQDA');
    // Kutilgan sana 2026-10-05 — o'tib ketgan
    expect(x?.kechikkan).toBe(true);
    // Profil: 100 × 3000; mato metrga, odatdagi bo'yi yo'q — summa aytilmaydi
    expect(x?.summa).toBe('300000.00');
    expect(x?.summaToliq).toBe(false);
  });

  it('EC-XB-02: bo‘sh va takroriy material rad etiladi', async () => {
    const asos = {
      filialId: FILIAL,
      yetkazibBeruvchiId: yetkazibId,
      sana: '2026-10-01',
      kutilganSana: null,
      valyuta: 'SOM' as const,
      izoh: null,
    };
    await expect(xaridYarat(sql, { ...asos, qatorlar: [] }, XODIM)).rejects.toThrow();
    await expect(
      xaridYarat(
        sql,
        {
          ...asos,
          qatorlar: [
            { materialId: matoId, miqdor: '1', narxBirlik: null, narxAsosi: 'BIRLIK' },
            { materialId: matoId, miqdor: '2', narxBirlik: null, narxAsosi: 'BIRLIK' },
          ],
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('EC-XB-03: qisman kirim — qolgan to‘g‘ri, «yo‘lda» xaritasi', async () => {
    kirimId = (await kirimYarat(sql, kirim(xaridId, 3, 100), XODIM)).kirimId;
    const x = await xaridTafsiloti(xaridId, FILIAL);
    expect(x?.holat).toBe('QISMAN');
    expect(x?.qatorlar.find((q) => q.materialId === matoId)?.qolgan).toBe('2.00');
    expect(x?.qatorlar.find((q) => q.materialId === profilId)?.qolgan).toBe('0.00');
    expect(x?.kirimlar.map((k) => k.id)).toEqual([kirimId]);
    const yol = await yoldaXaritasi(FILIAL);
    expect(yol.get(matoId)).toBe('2.00');
    expect(yol.has(profilId)).toBe(false);
    const b = await yoldagiBuyurtmalar(FILIAL, matoId);
    expect(b.find((y) => y.xaridId === xaridId)?.qolgan).toBe('2.00');
  });

  it('EC-XB-04: boshqa yetkazib beruvchi kirimi rad etiladi va hech narsa yozilmaydi', async () => {
    const k = kirim(xaridId, 1, 0, boshqaYetkazibId);
    await expect(kirimYarat(sql, k, XODIM)).rejects.toThrow();
    const n = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM kirim WHERE raqam = ${k.raqam}`;
    expect(n[0]?.n).toBe(0);
  });

  it('EC-XB-05: kirim storno — buyurtma o‘zi «kutilmoqda»ga qaytadi', async () => {
    await kirimniStorno(sql, kirimId, 'sinov', XODIM);
    const x = await xaridTafsiloti(xaridId, FILIAL);
    expect(x?.holat).toBe('KUTILMOQDA');
    expect(x?.qatorlar.find((q) => q.materialId === matoId)?.kelgan).toBe('0.00');
  });

  it('EC-XB-06: to‘liq kelsa «to‘liq keldi», ortig‘i ko‘rinadi; ro‘yxat filtri', async () => {
    await kirimYarat(sql, kirim(xaridId, 6, 100), XODIM);
    const x = await xaridTafsiloti(xaridId, FILIAL);
    expect(x?.holat).toBe('TOLIQ');
    expect(x?.kechikkan).toBe(false);
    expect(x?.qatorlar.find((q) => q.materialId === matoId)?.ortiqcha).toBe('1.00');
    const kut = await xaridlarRoyxati(FILIAL, 'kutilmoqda');
    expect(kut.some((r) => r.id === xaridId)).toBe(false);
    const hammasi = await xaridlarRoyxati(FILIAL, 'hammasi');
    expect(hammasi.some((r) => r.id === xaridId)).toBe(true);
  });

  it('EC-XB-07: kirim bor — bekor emas, yopiladi; yopilganga kirim bog‘lanmaydi', async () => {
    const id = await yangiXarid();
    await kirimYarat(sql, kirim(id, 1, 0), XODIM);
    await expect(
      xaridniYop(sql, { id, filialId: FILIAL, qaror: 'BEKOR', sabab: 'x' }, XODIM),
    ).rejects.toThrow();
    await expect(
      xaridniYop(sql, { id, filialId: FILIAL, qaror: 'YOPILDI', sabab: '   ' }, XODIM),
    ).rejects.toThrow();
    await xaridniYop(sql, { id, filialId: FILIAL, qaror: 'YOPILDI', sabab: 'zavodda tugadi' }, XODIM);
    const x = await xaridTafsiloti(id, FILIAL);
    expect(x?.holat).toBe('YOPILDI');
    expect(x?.yopishSabab).toBe('zavodda tugadi');
    // Yopilgan buyurtmaning qolgani «yo'lda» emas
    expect((await yoldagiBuyurtmalar(FILIAL, matoId)).some((b) => b.xaridId === id)).toBe(false);
    await expect(kirimYarat(sql, kirim(id, 1, 0), XODIM)).rejects.toThrow();
  });

  it('EC-XB-08: kirimsiz buyurtma bekor qilinadi; boshqa filial ko‘rmaydi va yopolmaydi', async () => {
    const id = await yangiXarid();
    expect(await xaridTafsiloti(id, 999_999)).toBeNull();
    await expect(
      xaridniYop(sql, { id, filialId: 999_999, qaror: 'BEKOR', sabab: 'x' }, XODIM),
    ).rejects.toThrow();
    await xaridniYop(sql, { id, filialId: FILIAL, qaror: 'BEKOR', sabab: 'kerak bo‘lmay qoldi' }, XODIM);
    expect((await xaridTafsiloti(id, FILIAL))?.holat).toBe('BEKOR');
    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'xarid_buyurtma' AND obyekt_id = ${id}`;
    expect(a[0]?.n).toBe(2);
  });
});
