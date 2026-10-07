/**
 * «Buyurtma kerak» — ombor auditi 2026-10-07, 8-band.
 *
 * ⚠️ Asosiy holat: qoldiq chegaradan YUQORI, lekin yetkazib berilguncha
 *    tugaydi — oddiy «kam qoldiq» buni ko'rmasdi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimYarat } from '@/lib/amal/kirim';
import { xaridYarat } from '@/lib/amal/xarid';
import { STANDART_YETKAZISH_KUNI } from '@/lib/domain/xarid-kerak';
import { buyurtmaKerak } from '@/app/(panel)/ombor/xarid/kerak-malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let yetkazibId = 0;
/** Chegaradan kam */
let kamId = 0;
/** Chegara yo'q, lekin tez sarflanadi */
let tezId = 0;
/** Sekin sarflanadi — ro'yxatga tushmasligi kerak */
let sekinId = 0;
/** Hech qachon olinmagan, qoldig'i nol — ro'yxatga tushmasligi kerak */
let olikId = 0;

async function material(nom: string, chegara: string | null): Promise<number> {
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
                          sotuv_narx, standart_rulon_eni_m, kam_qoldiq_chegara_m, yaratdi_id)
    VALUES (${`${nom} ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', '100000', '3', ${chegara}, ${XODIM})
    RETURNING id`;
  return m[0]?.id ?? 0;
}

/** Bitta 3 × boyi rulon kirim qilinadi, keyin `sarfKvM` sarflangan deb yoziladi */
async function zaxira(materialId: number, boyiM: number, sarfKvM: number): Promise<void> {
  await kirimYarat(
    sql,
    {
      raqam: `K-KERAK-${BELGI}-${String(materialId)}`,
      sana: '2026-10-01',
      filialId: FILIAL,
      yetkazibBeruvchiId: yetkazibId,
      valyuta: 'SOM',
      kursSnapshot: null,
      transportSumma: '0',
      bojxonaSumma: '0',
      tolovMuddati: null,
      qatorlar: [
        {
          materialId,
          miqdorKirim: 1,
          narxBirlik: '1000000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3, boyiM }],
        },
      ],
    },
    XODIM,
  );
  if (sarfKvM > 0) {
    // Sarf jurnalga yoziladi — qoldiq bo'lakka tegilmaydi (tezlik faqat jurnaldan)
    await sql`
      INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, tannarx_summa, xodim_id, sana)
      SELECT ${FILIAL}, b.id, 'KESIM', ${-sarfKvM}, 0, ${XODIM}, now() - interval '10 days'
      FROM bolak b WHERE b.material_id = ${materialId} LIMIT 1`;
  }
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`Kerak sinovi ${BELGI}`}, ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;

  kamId = await material('Kam mato', '100');
  await zaxira(kamId, 10, 0); // 10 m < 100 m chegara

  tezId = await material('Tez mato', null);
  // 30 kv.m qoldiq, 90 kunda 180 kv.m → 2/kun → 15 kun < 14 + 7
  await zaxira(tezId, 10, 180);

  sekinId = await material('Sekin mato', null);
  // 300 kv.m qoldiq, 90 kunda 90 kv.m → 1/kun → 300 kun
  await zaxira(sekinId, 100, 90);

  olikId = await material('Olinmagan mato', null);
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('buyurtma kerak — 8-band', () => {
  it('EC-BK-01: chegaradan kam — «KAM», oxirgi yetkazib beruvchi bilan', async () => {
    const r = await buyurtmaKerak(FILIAL);
    const q = r.find((x) => x.materialId === kamId);
    expect(q?.sababi).toBe('KAM');
    expect(q?.oxirgiYetkazib?.id).toBe(yetkazibId);
  });

  it('EC-BK-02: chegaradan yuqori, lekin kelguncha tugaydi — «TEZ_TUGAYDI»', async () => {
    const q = (await buyurtmaKerak(FILIAL)).find((x) => x.materialId === tezId);
    expect(q?.sababi).toBe('TEZ_TUGAYDI');
    expect(q?.bashorat?.kunlar).toBe(15);
    expect(q?.yetkazish).toEqual({ kun: STANDART_YETKAZISH_KUNI, manba: 'STANDART' });
    // (14 + 30) kun × 2 kv.m − 30 kv.m = 58 kv.m
    expect(q?.tavsiya).toBe('58');
  });

  it('EC-BK-03: sekin sarflanadigan va hech qachon olinmagan — ro‘yxatda yo‘q', async () => {
    const r = await buyurtmaKerak(FILIAL);
    expect(r.some((x) => x.materialId === sekinId)).toBe(false);
    expect(r.some((x) => x.materialId === olikId)).toBe(false);
  });

  it('EC-BK-04: buyurtma berilgach — yo‘lda ko‘rinadi; muddat tarixdan o‘lchanadi', async () => {
    const { id } = await xaridYarat(
      sql,
      {
        filialId: FILIAL,
        yetkazibBeruvchiId: yetkazibId,
        sana: '2026-09-20',
        kutilganSana: null,
        valyuta: 'SOM',
        izoh: null,
        qatorlar: [{ materialId: kamId, miqdor: '2', narxBirlik: null, narxAsosi: 'BIRLIK' }],
      },
      XODIM,
    );
    let q = (await buyurtmaKerak(FILIAL)).find((x) => x.materialId === kamId);
    expect(q?.yoldaBuyurtma.map((y) => y.xaridId)).toEqual([id]);

    // 2026-09-20 → 2026-09-25: 5 kun, 1 rulon keldi (qolgani hali yo'lda)
    await kirimYarat(
      sql,
      {
        raqam: `K-KERAK-XB-${BELGI}`,
        sana: '2026-09-25',
        filialId: FILIAL,
        yetkazibBeruvchiId: yetkazibId,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
        xaridBuyurtmaId: id,
        qatorlar: [
          {
            materialId: kamId,
            miqdorKirim: 1,
            narxBirlik: '1000000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [{ eniM: 3, boyiM: 10 }],
          },
        ],
      },
      XODIM,
    );
    q = (await buyurtmaKerak(FILIAL)).find((x) => x.materialId === kamId);
    expect(q?.yetkazish).toEqual({ kun: 5, manba: 'TARIX' });
    expect(q?.yoldaBuyurtma[0]?.qolgan).toBe('1.00');
  });
});
