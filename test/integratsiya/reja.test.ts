/**
 * TZ 21 — rejalarni saqlash va nusxa. 2026-10-13.
 *
 * ⚠️ Korxona rejasi oyiga BITTA — har yugurish o'z (uzoq kelajakdagi)
 *    oyini oladi, sinov bazasida avvalgi yugurishlar bilan to'qnashmasin.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { otganOydanNusxa, rejalarniSaqla } from '@/lib/amal/reja';
import { oyQosh } from '@/lib/domain/reja';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
const YIL = 2100 + (Number(BELGI) % 800);
const OY = `${String(YIL)}-03-01`;
let sql: Ulanish;
let filialId = 0;
let boshqaFilial = 0;
let sotuvchi = 0;

const reja = (turi: string, xodim: number | null = null) =>
  sql<{ tushum: string | null; foyda: string | null; oy_ichida_ozgardi: boolean; id: number }[]>`
    SELECT id, tushum::text, foyda::text, oy_ichida_ozgardi FROM reja
    WHERE oy = ${OY} AND turi = ${turi}
      AND COALESCE(filial_id, 0) = ${turi === 'KORXONA' ? 0 : filialId}
      AND COALESCE(xodim_id, 0) = ${xodim ?? 0}`;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Reja ${BELGI}`}, true, true, false, ${XODIM}), (${`Reja boshqa ${BELGI}`}, true, true, false, ${XODIM})
    RETURNING id`;
  filialId = f[0]?.id ?? 0;
  boshqaFilial = f[1]?.id ?? 0;
  const x = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
    VALUES (${filialId}, ${`Reja sotuvchi ${BELGI}`}, ${`9980${BELGI}1`}, ${XODIM}) RETURNING id`;
  sotuvchi = x[0]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 21 — reja saqlash', () => {
  it('EC-REJ-A1: korxona, filial, sotuvchi rejasi qo‘yiladi; bo‘sh qator — yozilmaydi', async () => {
    const r = await rejalarniSaqla(
      sql,
      {
        oy: OY,
        sabab: null,
        qatorlar: [
          { turi: 'KORXONA', filialId: null, xodimId: null, tushum: '180000000', foyda: '45000000' },
          { turi: 'FILIAL', filialId, xodimId: null, tushum: '100000000', foyda: '26000000' },
          { turi: 'SOTUVCHI', filialId, xodimId: sotuvchi, tushum: '55000000', foyda: null },
          { turi: 'FILIAL', filialId: boshqaFilial, xodimId: null, tushum: '', foyda: null },
        ],
      },
      XODIM,
      oyQosh(OY, -1),
    );
    expect(r).toEqual({ qoshildi: 3, ozgardi: 0 });
    expect((await reja('SOTUVCHI', sotuvchi))[0]?.tushum).toBe('55000000.00');
  });

  it('EC-REJ-A2: oy boshlanmaguncha — sababsiz o‘zgaradi, belgi qo‘yilmaydi', async () => {
    const r = await rejalarniSaqla(
      sql,
      { oy: OY, sabab: null, qatorlar: [{ turi: 'FILIAL', filialId, xodimId: null, tushum: '110000000', foyda: '26000000' }] },
      XODIM,
      oyQosh(OY, -1),
    );
    expect(r.ozgardi).toBe(1);
    expect((await reja('FILIAL'))[0]).toMatchObject({ tushum: '110000000.00', oy_ichida_ozgardi: false });
  });

  it('EC-REJ-07 · 21.4: oy ichida — sababsiz rad, sabab bilan o‘zgaradi va belgi + audit', async () => {
    const qator = { turi: 'FILIAL' as const, filialId, xodimId: null, tushum: '90000000', foyda: '26000000' };
    const ichida = `${String(YIL)}-03-31`;
    await expect(rejalarniSaqla(sql, { oy: OY, sabab: '  ', qatorlar: [qator] }, XODIM, ichida)).rejects.toMatchObject({
      kod: 'REJA_SABAB_KERAK',
    });
    // Tegilmagan qiymat bilan — sababsiz ham o'tadi (o'zgarish yo'q)
    await rejalarniSaqla(
      sql,
      { oy: OY, sabab: null, qatorlar: [{ ...qator, tushum: '110000000' }] },
      XODIM,
      ichida,
    );

    await rejalarniSaqla(sql, { oy: OY, sabab: 'Katta mijoz ketdi', qatorlar: [qator] }, XODIM, ichida);
    const r = (await reja('FILIAL'))[0];
    expect(r).toMatchObject({ tushum: '90000000.00', oy_ichida_ozgardi: true });
    const a = await sql<{ eski: { tushum: string }; izoh: string }[]>`
      SELECT eski_qiymat AS eski, izoh FROM audit_jurnal
      WHERE amal = 'REJA_OZGARDI' AND obyekt_id = ${r?.id ?? 0} ORDER BY id DESC LIMIT 1`;
    expect(a[0]).toMatchObject({ eski: { tushum: '110000000.00' }, izoh: 'Katta mijoz ketdi' });
  });

  it('EC-REJ-A4: sotuvchiga foyda rejasi yo‘q; boshqa filialda ishlamaydi (EC-REJ-03)', async () => {
    const yil = oyQosh(OY, -1);
    await expect(
      rejalarniSaqla(
        sql,
        { oy: OY, sabab: 'x', qatorlar: [{ turi: 'SOTUVCHI', filialId, xodimId: sotuvchi, tushum: '1', foyda: '1' }] },
        XODIM,
        yil,
      ),
    ).rejects.toMatchObject({ kod: 'REJA_SOTUVCHI_FOYDA' });
    await expect(
      rejalarniSaqla(
        sql,
        { oy: OY, sabab: 'x', qatorlar: [{ turi: 'SOTUVCHI', filialId: boshqaFilial, xodimId: sotuvchi, tushum: '1', foyda: null }] },
        XODIM,
        yil,
      ),
    ).rejects.toMatchObject({ kod: 'REJA_SOTUVCHI_FILIALI' });
    await expect(
      rejalarniSaqla(
        sql,
        { oy: OY, sabab: 'x', qatorlar: [{ turi: 'FILIAL', filialId, xodimId: null, tushum: '-5', foyda: null }] },
        XODIM,
        yil,
      ),
    ).rejects.toMatchObject({ kod: 'REJA_MANFIY' });
  });

  it('21.3.2: o‘tgan oydan nusxa +10% — qo‘yilgan reja ustidan yozilmaydi', async () => {
    const keyingi = oyQosh(OY, 1);
    // Keyingi oyda filial rejasi allaqachon qo'lda qo'yilgan
    await rejalarniSaqla(
      sql,
      { oy: keyingi, sabab: null, qatorlar: [{ turi: 'FILIAL', filialId, xodimId: null, tushum: '1000', foyda: null }] },
      XODIM,
      OY,
    );
    const { qoshildi } = await otganOydanNusxa(sql, { oy: keyingi, foiz: '10' }, XODIM);
    expect(qoshildi).toBe(2);
    const q = await sql<{ turi: string; tushum: string; foyda: string | null }[]>`
      SELECT turi, tushum::text, foyda::text FROM reja
      WHERE oy = ${keyingi} AND (filial_id IS NULL OR filial_id = ${filialId}) ORDER BY turi`;
    expect(q).toEqual([
      { turi: 'FILIAL', tushum: '1000.00', foyda: null },
      { turi: 'KORXONA', tushum: '198000000.00', foyda: '49500000.00' },
      { turi: 'SOTUVCHI', tushum: '60500000.00', foyda: null },
    ]);
  });
});
