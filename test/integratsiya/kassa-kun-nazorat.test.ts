/**
 * Kun yopish nazorati — tarix va yopilmagan kunlar. Kassa auditi 2026-10-10.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kunniQaytaOch, kunniYop } from '@/lib/amal/kun-yopish';
import { kassaStorno } from '@/lib/amal/kassa';
import { kitobJami } from '@/app/(panel)/kassa/malumot';
import { toshkentKuni } from '@/lib/domain/sana';
import { yopilishTarixi, yopilmaganKunlar } from '@/app/(panel)/kassa/kun-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let kassaId = 0;

async function yozuv(sana: string, summa: string, n: number): Promise<void> {
  await sql`
    INSERT INTO kassa_yozuv (sana, kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
    VALUES (${`${sana} 12:00+05`}, ${kassaId}, 'K9', ${summa}, 'SOM', 'sinov',
            ${Number(`${BELGI}${String(n)}`)}, ${XODIM})`;
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Kun nazorati ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  const k = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${f[0]?.id ?? 0}, 'NAQD', 'SOM', ${`Nazorat kassasi ${BELGI}`}, ${XODIM}) RETURNING id`;
  kassaId = k[0]?.id ?? 0;
  await yozuv('2026-09-10', '100000', 1);
  await yozuv('2026-09-11', '50000', 2);
  await yozuv('2026-09-11', '25000', 3);
  // 10-sentabr yopiladi, 10 000 kam sanaldi
  await kunniYop(sql, { kassaId, sana: '2026-09-10', sanaldi: '90000', izoh: 'kassir kam topshirdi' }, XODIM);
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('kun yopish nazorati', () => {
  it('EC-KUN-N1: tarixda farq kamomad (manfiy), kim va izoh bilan', async () => {
    const t = await yopilishTarixi([kassaId], '2026-09-01', '2026-09-30');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({
      sana: '2026-09-10',
      hisoblangan: '100000.00',
      sanaldi: '90000.00',
      farq: '-10000.00',
      izoh: 'kassir kam topshirdi',
      yopiqmi: true,
    });
    expect(t[0]?.kim).not.toBeNull();
  });

  it('EC-KUN-N2: harakatli, yopilmagan kun ogohda; yopilgani va bugun yo‘q', async () => {
    const y = await yopilmaganKunlar([kassaId], '2026-09-01', toshkentKuni());
    expect(y.map((x) => [x.sana, x.yozuvSoni])).toEqual([['2026-09-11', 2]]);
    await yozuv(toshkentKuni(), '1000', 4);
    const y2 = await yopilmaganKunlar([kassaId], '2026-09-01', toshkentKuni());
    expect(y2.some((x) => x.sana === toshkentKuni())).toBe(false);
  });

  it('EC-KUN-N3: bo‘sh ro‘yxat — so‘rovsiz bo‘sh javob', async () => {
    expect(await yopilishTarixi([], '2026-09-01', '2026-09-30')).toEqual([]);
    expect(await yopilmaganKunlar([], '2026-09-01', '2026-09-30')).toEqual([]);
  });

  it('EC-KUN-N4: storno qilingan yozuv kitob jamisini SHISHIRMAYDI', async () => {
    await yozuv('2026-09-20', '700000', 5);
    const y = await sql<{ id: number }[]>`
      SELECT id FROM kassa_yozuv WHERE kassa_id = ${kassaId} AND summa = 700000`;
    await kassaStorno(sql, y[0]?.id ?? 0, 'xato kiritilgan', XODIM);
    const filialId = (await sql<{ f: number }[]>`SELECT filial_id AS f FROM kassa WHERE id = ${kassaId}`)[0]?.f ?? 0;
    const j = await kitobJami(filialId, XODIM, true, {
      dan: '2026-09-20', gacha: '2100-01-01', kassaId, yonalish: 'hammasi',
    });
    const som = j.find((x) => x.valyuta === 'SOM');
    // Xato kiritilgan 700 000 va uning stornosi — kirim ham, chiqim ham emas
    expect(som?.chiqim ?? '0.00').toBe('0.00');
    expect(som?.kirim ?? '0.00').not.toContain('700000');
  });

  /**
   * Egasi qarori 2026-10-11: kamomad korxona XARAJATI, kassa qoldig'i
   * sanalgan pulga tenglashadi; qayta ochilsa — bekor, qayta yopilsa — bir marta.
   */
  it('EC-KUN-N5: kamomad xarajat bo‘ladi, qoldiq sanalganga teng; qayta ochish bekor qiladi', async () => {
    const qoldiq = async (sana: string): Promise<string> =>
      (await sql<{ q: string }[]>`
        SELECT COALESCE(SUM(summa), 0)::numeric(14,2)::text AS q FROM kassa_yozuv
        WHERE kassa_id = ${kassaId} AND (sana AT TIME ZONE 'Asia/Tashkent')::date <= ${sana}::date`)[0]?.q ?? '';
    const xarajat = async (): Promise<string> =>
      (await sql<{ s: string }[]>`
        SELECT COALESCE(SUM(x.summa), 0)::numeric(14,2)::text AS s FROM xarajat x
        JOIN kassa_kun kk ON x.manba_turi = 'kassa_kun' AND x.manba_id = kk.id
           OR x.manba_turi = 'storno' AND x.manba_id IN (
                SELECT id FROM xarajat WHERE manba_turi = 'kassa_kun' AND manba_id = kk.id)
        WHERE kk.kassa_id = ${kassaId} AND x.modda = 'KASSA_FARQI'`)[0]?.s ?? '';

    // N1 da 2026-09-10 kuni 100 000 o'rniga 90 000 sanalgan
    expect(await qoldiq('2026-09-10')).toBe('90000.00');
    expect(await xarajat()).toBe('10000.00');

    const kun = (await sql<{ id: number }[]>`
      SELECT id FROM kassa_kun WHERE kassa_id = ${kassaId} AND sana = '2026-09-10'`)[0]?.id ?? 0;
    await kunniQaytaOch(sql, kun, 'qayta sanash', XODIM);
    expect(await qoldiq('2026-09-10')).toBe('100000.00');
    expect(await xarajat()).toBe('0.00');

    // Qayta yopish — bu safar 95 000: farq faqat BIR marta, yangi summada
    await kunniYop(sql, { kassaId, sana: '2026-09-10', sanaldi: '95000', izoh: 'qayta sanaldi' }, XODIM);
    expect(await qoldiq('2026-09-10')).toBe('95000.00');
    expect(await xarajat()).toBe('5000.00');
  });

  it('EC-KUN-N6: ortiqcha — kirim va manfiy xarajat', async () => {
    await kunniYop(sql, { kassaId, sana: '2026-09-11', sanaldi: '175000', izoh: 'ortiqcha chiqdi' }, XODIM);
    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT y.kod, y.summa::text FROM kassa_yozuv y
      JOIN kassa_kun kk ON y.manba_turi = 'kassa_kun' AND y.manba_id = kk.id
      WHERE kk.kassa_id = ${kassaId} AND kk.sana = '2026-09-11'`;
    // 09-11: boshlang'ich 95 000 (kecha SANALGAN) + 75 000 = 170 000; 175 000 sanaldi → +5 000
    expect(y).toEqual([{ kod: 'K12', summa: '5000.00' }]);
  });

  it('EC-KUN-N7: kun yopish farqini qo‘lda storno qilib bo‘lmaydi', async () => {
    const y = await sql<{ id: number }[]>`
      SELECT y.id FROM kassa_yozuv y
      JOIN kassa_kun kk ON y.manba_turi = 'kassa_kun' AND y.manba_id = kk.id
      WHERE kk.kassa_id = ${kassaId} AND y.storno_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = y.id)
      LIMIT 1`;
    await expect(kassaStorno(sql, y[0]?.id ?? 0, 'qo‘lda', XODIM)).rejects.toThrow(/qayta oching/);
  });
});

