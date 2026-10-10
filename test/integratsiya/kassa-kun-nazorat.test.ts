/**
 * Kun yopish nazorati — tarix va yopilmagan kunlar. Kassa auditi 2026-10-10.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kunniYop } from '@/lib/amal/kun-yopish';
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
});
