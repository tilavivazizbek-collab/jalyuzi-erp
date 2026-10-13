/**
 * 0066 — egasi qo'shadigan xarajat turlari. 2026-10-13. Alohida filialda.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { operatsionXarajat } from '@/lib/amal/xarajat';
import { kassaStorno } from '@/lib/amal/kassa';
import { xarajatTuriNominiOzgartir, xarajatTuriYarat } from '@/lib/amal/xarajat-turi';
import Decimal from 'decimal.js';
import { foydaZararMalumoti } from '@/app/(panel)/hisobot/malumot';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let filialId = 0;
let kassaId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`XT ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const k = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${filialId}, 'NAQD', 'SOM', ${`XT kassa ${BELGI}`}, ${XODIM}) RETURNING id`;
  kassaId = k[0]?.id ?? 0;
  // Kassada pul bo'lsin
  await sql`
    INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
    VALUES (${kassaId}, 'K9', 10000000, 'SOM', 'sinov', ${Number(BELGI)}, ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('0066 — xarajat turlari', () => {
  it('EC-XT-01: bir xil nom (katta-kichik harf farqsiz) ikki marta yaratilmaydi', async () => {
    const a = await xarajatTuriYarat(sql, `Ijara ${BELGI}`, XODIM);
    const b = await xarajatTuriYarat(sql, `  ijara ${BELGI} `, XODIM);
    expect(b.id).toBe(a.id);
    const boshqa = await xarajatTuriYarat(sql, `Elektr ${BELGI}`, XODIM);
    await expect(xarajatTuriNominiOzgartir(sql, boshqa.id, `IJARA ${BELGI}`, XODIM)).rejects.toMatchObject({
      kod: 'NOM_NOTOGRI',
    });
  });

  it('EC-XT-02: Operatsion xarajatga tur yoziladi; storno turni ko‘chiradi', async () => {
    const t = await xarajatTuriYarat(sql, `Reklama ${BELGI}`, XODIM);
    const { kassaYozuvId, xarajatId } = await operatsionXarajat(
      sql,
      { kassaId, summa: '300000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'Instagram', xarajatTuriId: t.id },
      filialId,
      XODIM,
    );
    const x = await sql<{ turi: number | null }[]>`SELECT xarajat_turi_id AS turi FROM xarajat WHERE id = ${xarajatId ?? 0}`;
    expect(x[0]?.turi).toBe(t.id);

    await kassaStorno(sql, kassaYozuvId, 'xato yozildi', XODIM);
    const yig = await sql<{ s: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::numeric(14,2)::text AS s FROM xarajat WHERE xarajat_turi_id = ${t.id}`;
    // Asl + storno = 0 — tur kesimida ham nolga chiqadi
    expect(yig[0]?.s).toBe('0.00');
  });

  it('EC-XT-03: tur faqat Operatsion moddada; o‘chirilgan tur rad etiladi', async () => {
    const t = await xarajatTuriYarat(sql, `Internet ${BELGI}`, XODIM);
    await expect(
      operatsionXarajat(
        sql,
        { kassaId, summa: '1000', valyuta: 'SOM', modda: 'BOSHQA', izoh: 'x', xarajatTuriId: t.id },
        filialId,
        XODIM,
      ),
    ).rejects.toMatchObject({ kod: 'XARAJAT_TURI_NOTOGRI' });

    await sql`UPDATE xarajat_turi SET faol = false, ochirildi = now() WHERE id = ${t.id}`;
    await expect(
      operatsionXarajat(
        sql,
        { kassaId, summa: '1000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'x', xarajatTuriId: t.id },
        filialId,
        XODIM,
      ),
    ).rejects.toMatchObject({ kod: 'XARAJAT_TURI_NOTOGRI' });

    // Turi ko'rsatilmagan Operatsion — avvalgidek ishlaydi
    const r = await operatsionXarajat(
      sql,
      { kassaId, summa: '1000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'turi yo‘q' },
      filialId,
      XODIM,
    );
    expect(r.xarajatId).not.toBeNull();
  });

  it('EC-XT-04: foyda-zararda Operatsion turlar bo‘yicha bo‘linadi; yig‘indi moddaga teng', async () => {
    const t = await xarajatTuriYarat(sql, `Elektr FZ ${BELGI}`, XODIM);
    await operatsionXarajat(
      sql,
      { kassaId, summa: '200000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'oktabr', xarajatTuriId: t.id },
      filialId,
      XODIM,
    );
    const fz = await foydaZararMalumoti(filialId, davrYasa('OY', new Date()));
    const elektr = fz.operatsionTurlari.find((x) => x.nom === `Elektr FZ ${BELGI}`);
    expect(elektr?.summa).toBe('200000.00');
    // Storno qilingan reklama (EC-XT-02) nolga chiqqan — ro'yxatda yo'q
    expect(fz.operatsionTurlari.some((x) => x.nom === `Reklama ${BELGI}`)).toBe(false);
    const jami = fz.operatsionTurlari.reduce((a, x) => a.plus(x.summa), new Decimal(0)).toFixed(2);
    expect(jami).toBe(fz.xarajatlar.find((x) => x.modda === 'OPERATSION')?.summa);
  });
});
