/**
 * LOYIHA T-04 — sotuv paytidagi kesim ko'rinishi bazadagi bo'laklar bilan.
 * Nomzodlar band qilishdagi so'rovdan (`nomzodlarniOqi`) keladi — ko'rinish
 * va haqiqiy band bir xil bo'lakni tanlashi shart.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { nomzodlarniOqi } from '@/lib/amal/band';
import { kesimKorinishi } from '@/lib/domain/kesish';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `KK-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;
let materialId = 0;
const CHEGARA = { yaroqsizM: 0.5, kamIshlatiladiganM: 1 };

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
    VALUES (${`${BELGI} mato`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
  materialId = m[0]?.id ?? 0;
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m, tannarx_birlik_snapshot, ochilgan, holat, yaratdi_id)
    VALUES (${materialId}, ${filialId}, ${`${BELGI}-R`}, 'RULON', 3, 35, 1000, false, 'BOSH', ${XODIM}),
           (${materialId}, ${filialId}, ${`${BELGI}-O`}, 'OSTATKA', 1.6, 2.2, 1000, false, 'BOSH', ${XODIM}),
           (${materialId}, ${filialId}, ${`${BELGI}-B`}, 'OSTATKA', 1.25, 2.1, 1000, false, 'BAND', ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('T-04 — kesim ko‘rinishi bazada', () => {
  it('EC-KK-05: ostatka tanlanadi, band bo‘lak hisobga olinmaydi, qoldiq darajasi bilan', async () => {
    const kerak = { eniM: 1.2, boyiM: 2 };
    const k = kesimKorinishi(await nomzodlarniOqi(ulanishOl(), materialId, filialId, kerak), kerak, CHEGARA);
    expect(k).toMatchObject({
      bolakKod: `${BELGI}-O`,
      manba: 'OSTATKA',
      qoladi: [
        { eniM: 1.6, boyiM: 0.2, daraja: 'YAROQLI' },
        { eniM: 0.4, boyiM: 2, daraja: 'YAROQSIZ' },
      ],
    });
  });

  it('EC-KK-06: ostatkaga sig‘masa yangi rulon; boshqa filialda bo‘lak yo‘q — null', async () => {
    const kerak = { eniM: 2, boyiM: 2.5 };
    const k = kesimKorinishi(await nomzodlarniOqi(ulanishOl(), materialId, filialId, kerak), kerak, CHEGARA);
    expect(k).toMatchObject({ bolakKod: `${BELGI}-R`, manba: 'YANGI_RULON' });
    expect(kesimKorinishi(await nomzodlarniOqi(ulanishOl(), materialId, 0, kerak), kerak, CHEGARA)).toBeNull();
  });
});
