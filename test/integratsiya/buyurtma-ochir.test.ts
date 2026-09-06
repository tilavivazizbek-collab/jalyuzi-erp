/**
 * TZ 8.8 · 8.15 — BUTUN BUYURTMANI O'CHIRISH.
 *
 * ⚠️ Bu test tranzaksiyani sinaydi, ekranni emas. Uchta to'siq
 *    (to'lov · topshirilgan · ishda) va bitta muvaffaqiyatli yo'l.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { buyurtmaniOchir } from '@/lib/amal/buyurtma-ochir';
import { ishniOl } from '@/lib/amal/ish';
import { biznesXatosimi } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId: number;
let turId: number;
let slotId: number;

const FILIAL = 1;
const XODIM = 1;
const USTA = 1;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Ochir sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Ochir sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

let hisoblagich = 0;

async function rulonYarat(): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`OCH-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 1.8, 3.0, 50000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

async function buyurtmaQosh(): Promise<{ buyurtmaId: number; pozitsiyaId: number }> {
  await rulonYarat();
  hisoblagich += 1;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-OCH-${String(Date.now())}-${String(hisoblagich)}`,
    mijozId: null,
    sotganFilialId: FILIAL,
    ishlabChiqaruvchiFilialId: FILIAL,
    manba: 'SAYT',
    valyuta: 'SOM',
    kursSnapshot: null,
    tayyorlikSana: null,
    qarzgaKetadimi: false,
    pozitsiyalar: [
      {
        mahsulotTurId: turId,
        eniSm: 120,
        boyiSm: 200,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: true },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '2.4000',
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            kerak: { eniM: 1.2, boyiM: 2.0 },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return { buyurtmaId: n.buyurtmaId, pozitsiyaId: n.pozitsiyalar[0]?.pozitsiyaId ?? 0 };
}

describe('buyurtmaniOchir', () => {
  it('EC-BOCH-01: sabab bo‘sh bo‘lsa o‘chirilmaydi', async () => {
    const { buyurtmaId } = await buyurtmaQosh();

    await expect(buyurtmaniOchir(sql, buyurtmaId, '   ', FILIAL, XODIM)).rejects.toThrow();
  });

  it('EC-BOCH-02: boshqa filialning buyurtmasi topilmaydi (20.4)', async () => {
    const { buyurtmaId } = await buyurtmaQosh();

    /** ⚠️ «Ruxsat yo‘q» emas, «topilmadi» — mavjudligi ham sir */
    await expect(
      buyurtmaniOchir(sql, buyurtmaId, 'sinov', FILIAL + 999, XODIM),
    ).rejects.toThrow();
  });

  it('EC-BOCH-03: hamma pozitsiya BEKOR bo‘ladi va band bo‘shaydi', async () => {
    const { buyurtmaId, pozitsiyaId } = await buyurtmaQosh();

    const bandOldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;

    const n = await buyurtmaniOchir(sql, buyurtmaId, 'xato kiritilgan', FILIAL, XODIM);

    expect(n.bekorQilindi).toBe(1);
    expect(n.boshatilganBand).toBe(bandOldin[0]?.n ?? 0);

    const holat = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE buyurtma_id = ${buyurtmaId}`;
    expect(holat.every((x) => x.holat === 'BEKOR')).toBe(true);

    const bandKeyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    expect(bandKeyin[0]?.n).toBe(0);
  });

  it('EC-BOCH-04: audit jurnaliga BUYURTMA darajasida bitta qator tushadi', async () => {
    const { buyurtmaId } = await buyurtmaQosh();
    await buyurtmaniOchir(sql, buyurtmaId, 'mijoz voz kechdi', FILIAL, XODIM);

    const a = await sql<{ izoh: string | null }[]>`
      SELECT izoh FROM audit_jurnal
      WHERE amal = 'BEKOR' AND obyekt_turi = 'buyurtma' AND obyekt_id = ${buyurtmaId}`;

    expect(a).toHaveLength(1);
    expect(a[0]?.izoh).toBe('mijoz voz kechdi');
  });

  it('EC-BOCH-05: to‘lov qilingan buyurtma o‘chirilmaydi', async () => {
    const { buyurtmaId } = await buyurtmaQosh();

    const k = await sql<{ id: number }[]>`
      SELECT id FROM kassa WHERE faol = true LIMIT 1`;
    const kassaId = k[0]?.id;
    if (kassaId === undefined) return; // kassasiz bazada bu tekshiruv o'tkazilmaydi

    await sql`
      INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id,
                               qator, izoh, xodim_id)
      VALUES (${kassaId}, 'D1', 100000, 'SOM', 'buyurtma', ${buyurtmaId}, 1,
              'sinov to''lovi', ${XODIM})`;

    await expect(
      buyurtmaniOchir(sql, buyurtmaId, 'sinov', FILIAL, XODIM),
    ).rejects.toSatisfy(
      (x: unknown) => biznesXatosimi(x) && x.kod === 'BUYURTMA_TOLANGAN',
    );
  });

  it('EC-BOCH-06: ishlab chiqarishga kirgan pozitsiya to‘sadi (8.8)', async () => {
    const { buyurtmaId, pozitsiyaId } = await buyurtmaQosh();

    /** Usta ishni oladi — holat ISHLAB_CHIQARILMOQDA bo'ladi */
    await sql`
      UPDATE buyurtma_pozitsiya SET holat = 'TASDIQLANGAN' WHERE id = ${pozitsiyaId}`;
    await ishniOl(sql, pozitsiyaId, USTA, '50000');

    await expect(
      buyurtmaniOchir(sql, buyurtmaId, 'sinov', FILIAL, XODIM),
    ).rejects.toSatisfy((x: unknown) => biznesXatosimi(x) && x.kod === 'BUYURTMA_ISHDA');
  });

  it('EC-BOCH-07: topshirilgan pozitsiya to‘sadi (8.10)', async () => {
    const { buyurtmaId, pozitsiyaId } = await buyurtmaQosh();

    await sql`
      UPDATE buyurtma_pozitsiya SET holat = 'TOPSHIRILDI' WHERE id = ${pozitsiyaId}`;

    await expect(
      buyurtmaniOchir(sql, buyurtmaId, 'sinov', FILIAL, XODIM),
    ).rejects.toSatisfy(
      (x: unknown) => biznesXatosimi(x) && x.kod === 'BUYURTMA_TOPSHIRILGAN',
    );
  });

  it('EC-BOCH-08: allaqachon bekor qilinganini qayta o‘chirish xato bermaydi', async () => {
    const { buyurtmaId } = await buyurtmaQosh();
    await buyurtmaniOchir(sql, buyurtmaId, 'birinchi', FILIAL, XODIM);

    /** ⚠️ Ikkinchi bosish — hech narsa qilmaydi, yiqilmaydi */
    const n = await buyurtmaniOchir(sql, buyurtmaId, 'ikkinchi', FILIAL, XODIM);
    expect(n.bekorQilindi).toBe(0);
  });
});
