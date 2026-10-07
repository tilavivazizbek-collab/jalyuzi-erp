/**
 * Yetkazib beruvchi kartochkasi — qarz FIFO taqsimoti. Audit 2026-10-07.
 *
 * ⚠️ Avval: kartochkadan to'langan qarz hech qaysi hujjatni yopmasdi,
 *    «eng yaqin muddat» to'langan hujjatdan olinardi, hujjat summasi
 *    `narx × miqdor + transport` edi (metrga narxda xato — P-46).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimYarat } from '@/lib/amal/kirim';
import { yetkazibHolati, yetkazibHolatlari } from '@/app/(panel)/yetkazib/taqsimot';
import { yetkazuvchiIshonchi } from '@/app/(panel)/ombor/xarid/malumot';
import { xaridYarat } from '@/lib/amal/xarid';
import { kirimlar, qarzHarakati, sarlavhaBloklari } from '@/app/(panel)/yetkazib/malumot';
import { kutilayotganTolovlar, tolovIntizomimiz } from '@/app/(panel)/yetkazib/[id]/malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let yId = 0;
let matoId = 0;
let k1 = 0;
let k2 = 0;

async function kirim(n: number, sana: string, muddat: string, narx: string): Promise<number> {
  const r = await kirimYarat(
    sql,
    {
      raqam: `K-YT-${BELGI}-${String(n)}`,
      sana,
      filialId: FILIAL,
      yetkazibBeruvchiId: yId,
      valyuta: 'SOM',
      kursSnapshot: null,
      // ⚠️ Transport qarzga KIRMAYDI — hujjat summasida ham ko'rinmasligi kerak
      transportSumma: '50000',
      bojxonaSumma: '0',
      tolovMuddati: muddat,
      qatorlar: [
        {
          materialId: matoId,
          miqdorKirim: 2,
          narxBirlik: narx,
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
  return r.kirimId;
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`Taqsimot sinovi ${BELGI}`}, ${XODIM}) RETURNING id`;
  yId = y[0]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
                          sotuv_narx, yaratdi_id)
    VALUES (${`Taqsimot matosi ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', '100000', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;
  // 100 m × 10 000 = 1 000 000 va 100 m × 5 000 = 500 000
  k1 = await kirim(1, '2026-09-01', '2026-09-10', '10000');
  k2 = await kirim(2, '2026-09-20', '2099-12-31', '5000');
  // Kartochkadan — hech qaysi kirimga bog'lanmagan to'lov
  await sql`
    INSERT INTO yetkazib_beruvchi_harakat (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta,
                                           manba_turi, manba_id, xodim_id, sana)
    VALUES (${yId}, ${FILIAL}, 'TOLOV', -1200000, 'SOM', 'yetkazib_beruvchi', ${yId}, ${XODIM},
            '2026-09-25 12:00+05')`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('yetkazib beruvchi kartochkasi — FIFO taqsimot', () => {
  it('EC-YT-01: kartochkadan to‘lov eng eski kirimni yopadi; summa — qarzning o‘zi', async () => {
    const h = await yetkazibHolati(yId);
    const r = await kirimlar(yId, h);
    const birinchi = r.find((x) => x.id === k1);
    const ikkinchi = r.find((x) => x.id === k2);
    // metr × narx, transportsiz
    expect(birinchi?.summa).toBe('1000000.00');
    expect(birinchi?.qoldi).toBe('0.00');
    expect(ikkinchi?.summa).toBe('500000.00');
    expect(ikkinchi?.qoldi).toBe('300000.00');
  });

  it('EC-YT-02: to‘langan kirimning o‘tgan muddati qizil qilmaydi', async () => {
    const h = await yetkazibHolati(yId);
    const b = await sarlavhaBloklari(yId, h);
    expect(b.qarz.yaqinMuddat).toBe('2099-12-31');
    expect(b.qarz.muddatOtdimi).toBe(false);
    expect(b.hamkorlik.jamiKirim).toEqual([{ valyuta: 'SOM', summa: '1500000.00' }]);
  });

  it('EC-YT-03: to‘lanmagan hujjatlar va to‘lov intizomi', async () => {
    const h = await yetkazibHolati(yId);
    const k = kutilayotganTolovlar(h);
    expect(k.map((x) => [x.kirimId, x.qoldiq])).toEqual([[k2, '300000.00']]);
    const i = tolovIntizomimiz(h);
    expect(i.tolanganSoni).toBe(1);
    // 09-10 muddat, 09-25 to'landi
    expect(i.kechikibTolangan).toBe(1);
    expect(i.kechikkanSoni).toBe(0);
  });

  it('EC-YT-04: qarz tarixi — OXIRGI yozuvlar, balans to‘liq tarixdan', async () => {
    const q = await qarzHarakati(yId, 1);
    expect(q).toHaveLength(1);
    // Eng oxirgisi — 2-kirim (bugungi sana bilan yozilgan); balans = 1 000 000 + 500 000 − 1 200 000
    expect(q[0]?.keyingi).toBe('300000.00');
  });

  it('EC-YT-05: ro‘yxat — hamma yetkazuvchi bitta so‘rovda, qarz kartochka bilan teng', async () => {
    const hammasi = await yetkazibHolatlari(null);
    expect(hammasi.get(yId)?.taqsimot.qarz.SOM).toBe('300000.00');
  });

  it('EC-YT-06: ishonchlilik — buyurtmadan kech kelgan kirim «vaqtida» emas', async () => {
    const { id } = await xaridYarat(
      sql,
      {
        filialId: FILIAL,
        yetkazibBeruvchiId: yId,
        sana: '2026-09-01',
        kutilganSana: '2026-09-05',
        valyuta: 'SOM',
        izoh: null,
        qatorlar: [{ materialId: matoId, miqdor: '1', narxBirlik: null, narxAsosi: 'BIRLIK' }],
      },
      XODIM,
    );
    await kirimYarat(
      sql,
      {
        raqam: `K-YT-${BELGI}-XB`,
        sana: '2026-09-09',
        filialId: FILIAL,
        yetkazibBeruvchiId: yId,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
        xaridBuyurtmaId: id,
        qatorlar: [
          {
            materialId: matoId,
            miqdorKirim: 1,
            narxBirlik: '100',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [{ eniM: 3, boyiM: 10 }],
          },
        ],
      },
      XODIM,
    );
    const i = await yetkazuvchiIshonchi(yId);
    expect(i.buyurtmaSoni).toBe(1);
    expect(i.ortachaKun).toBe(8);
    expect(i.vaqtidaFoiz).toBe(0);
    expect(i.toliqFoiz).toBe(100);
  });
});
