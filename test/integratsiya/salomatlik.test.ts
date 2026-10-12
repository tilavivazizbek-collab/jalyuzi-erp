/**
 * Ma'lumot salomatligi — 2026-10-12. Alohida filialda: har muammo aniq sanaladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimYarat } from '@/lib/amal/kirim';
import { toshkentKuni } from '@/lib/domain/sana';
import { malumotSalomatligi } from '@/app/(panel)/hisobot/salomatlik-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let filialId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Salomatlik ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('ma‘lumot salomatligi', () => {
  it('EC-SAL-01: toza filialda muammo yo‘q', async () => {
    expect(await malumotSalomatligi(filialId)).toEqual([]);
  });

  it('EC-SAL-02: manfiy kassa, dollar xarajat, muddatsiz kirim va P-46 kirimi topiladi', async () => {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${filialId}, 'NAQD', 'SOM', ${`Sal kassa ${BELGI}`}, ${XODIM}) RETURNING id`;
    await sql`
      INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
      VALUES (${k[0]?.id ?? 0}, 'C10', -50000, 'SOM', 'sinov', ${Number(BELGI)}, ${XODIM})`;
    await sql`
      INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta, manba_turi, manba_id, izoh, xodim_id)
      VALUES (${toshkentKuni()}, ${filialId}, 'OPERATSION', 10, 'USD', 'sinov', 1, 'sinov', ${XODIM})`;

    const y = await sql<{ id: number }[]>`
      INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`Sal yetkazuvchi ${BELGI}`}, ${XODIM}) RETURNING id`;
    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
      VALUES (${`Sal mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
    const { kirimId } = await kirimYarat(
      sql,
      {
        raqam: `K-SAL-${BELGI}`,
        sana: toshkentKuni(),
        filialId,
        yetkazibBeruvchiId: y[0]?.id ?? 0,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
        qatorlar: [
          {
            materialId: m[0]?.id ?? 0,
            miqdorKirim: 2,
            narxBirlik: '1000',
            narxAsosi: 'METR',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [
              { eniM: 3, boyiM: 50 },
              { eniM: 3, boyiM: 50 },
            ],
          },
        ],
      },
      XODIM,
    );
    /**
     * Qarz jurnali o'zgartirilmaydi (baza triggeri — §6.5). Noto'g'ri
     * yozilgan qarzni QO'SHIMCHA yozuv bilan taqlid qilamiz.
     */
    await sql`
      INSERT INTO yetkazib_beruvchi_harakat (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta,
                                             manba_turi, manba_id, xodim_id)
      VALUES (${y[0]?.id ?? 0}, ${filialId}, 'XARID', -98000, 'SOM', 'kirim', ${kirimId}, ${XODIM})`;
    // Qisman to'lov — muddatsiz qarz QOLDIQ bo'yicha sanalishi kerak (2 000 − 500)
    await sql`
      INSERT INTO yetkazib_beruvchi_harakat (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta,
                                             manba_turi, manba_id, xodim_id)
      VALUES (${y[0]?.id ?? 0}, ${filialId}, 'TOLOV', -500, 'SOM', 'yetkazib_beruvchi', ${y[0]?.id ?? 0}, ${XODIM})`;

    const r = await malumotSalomatligi(filialId);
    const top = (kod: string) => r.find((x) => x.kod === kod);
    expect(top('MANFIY_KASSA')).toMatchObject({ soni: 1, summa: '-50000.00', daraja: 'XAVF' });
    expect(top('DOLLAR_XARAJAT')?.soni).toBe(1);
    expect(top('MUDDATSIZ_KIRIM')).toMatchObject({ soni: 1, summa: '1500.00' });
    // To'g'risi 1000 × 100 m = 100 000; yozilgani 2 000 → farq 98 000
    expect(top('P46')).toMatchObject({ soni: 1, summa: '98000.00' });
  });
});
