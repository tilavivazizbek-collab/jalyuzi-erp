/**
 * TZ 8.7 — buyurtma pozitsiyasini tahrirlash.
 *
 * ⚠️ NEGA BU TESTLAR BOR
 *
 *    2026-09-03 auditigacha tahrirlash UMUMAN yozilmagan edi: qoida
 *    (`tahrirlanadimi`) va xato kodi (`POZITSIYA_TAHRIRLANMAYDI`)
 *    turardi, lekin ularni ishlatadigan kod yo'q edi. Sotuvchi
 *    o'lchamni xato kiritsa pozitsiyani bekor qilib qaytadan
 *    kiritishga majbur edi.
 *
 *    Eng nozik joyi — BAND: o'lcham o'zgarsa eski bo'lak endi mos
 *    kelmasligi mumkin, shuning uchun band bo'shatilib qayta
 *    qo'yiladi. Bu tekshirilmasa ombor qoldig'i jimgina buzilardi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { pozitsiyaniTahrirla } from '@/lib/amal/buyurtma-tahrir';
import { ishniOl } from '@/lib/amal/ish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let ikkinchiMatoId = 0;
let turId = 0;
let slotId = 0;
let mijozId = 0;

const FILIAL = 1;
const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  for (const nom of ['TAHRIR mato', 'TAHRIR ikkinchi mato']) {
    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                            yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
      VALUES (${`${nom} ${b}`}, 'RULON', 'rulon', 'KV_M', 0.3, 0.5, ${XODIM})
      RETURNING id`;
    if (nom.includes('ikkinchi')) ikkinchiMatoId = m[0]?.id ?? 0;
    else matoId = m[0]?.id ?? 0;
  }

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`TAHRIR tur ${b}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, yaratdi_id)
    VALUES (${`TAHRIR mijoz ${b}`}, ${XODIM}) RETURNING id`;
  mijozId = m[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

/** Kesim uchun yetarli rulon. */
async function rulonYarat(material = matoId, eni = 3.0, boyi = 30.0): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${material}, ${FILIAL}, ${`R-TAH-${belgi()}`}, 'RULON',
            ${eni}, ${boyi}, 78000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/** Band qilingan, tahrirlanadigan pozitsiya. */
async function pozitsiyaYarat(
  narx = '500000',
  mijozli = true,
): Promise<{ buyurtmaId: number; pozitsiyaId: number }> {
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-TAH-${belgi()}`,
    mijozId: mijozli ? mijozId : null,
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
        narxSnapshot: narx,
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { slotlar: [{ nom: 'Asosiy mato', formula: "ENI * BO'YI" }] },
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

const tahrir = (pozitsiyaId: number, o: Record<string, unknown> = {}) => ({
  pozitsiyaId,
  eniSm: 120,
  boyiSm: 200,
  soni: 1,
  narxSnapshot: '500000',
  chegirmaSumma: '0',
  xizmatHaqi: '0',
  formulaSnapshot: { slotlar: [{ nom: 'Asosiy mato', formula: "ENI * BO'YI" }] },
  slotlar: [
    {
      slotId,
      materialId: matoId,
      hisoblanganMiqdor: '2.4000',
      tuzatilganMiqdor: null,
      birlik: 'KV_M' as const,
      narxSnapshot: '120000',
      kerak: { eniM: 1.2, boyiM: 2.0 },
    },
  ],
  aksessuarlar: [],
  ...o,
});

describe('TZ 8.7 — pozitsiyani tahrirlash', () => {
  it("o'lcham o'zgaradi va bazaga tushadi", async () => {
    const { pozitsiyaId } = await pozitsiyaYarat();

    await pozitsiyaniTahrirla(
      sql,
      tahrir(pozitsiyaId, {
        eniSm: 130,
        boyiSm: 210,
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '2.7300',
            tuzatilganMiqdor: null,
            birlik: 'KV_M' as const,
            narxSnapshot: '120000',
            kerak: { eniM: 1.3, boyiM: 2.1 },
          },
        ],
      }),
      XODIM,
    );

    const p = await sql<{ eni_sm: number; boyi_sm: number }[]>`
      SELECT eni_sm, boyi_sm FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.eni_sm).toBe(130);
    expect(p[0]?.boyi_sm).toBe(210);

    const m = await sql<{ hisoblangan_miqdor: string }[]>`
      SELECT hisoblangan_miqdor FROM pozitsiya_material
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId}`;
    expect(Number(m[0]?.hisoblangan_miqdor)).toBeCloseTo(2.73, 4);
  });

  /** ⚠️ ASOSIY TEKSHIRUV — ombor qoldig'i jimgina buzilmasin. */
  it("o'lcham o'zgarsa BAND qayta qo'yiladi", async () => {
    const { pozitsiyaId } = await pozitsiyaYarat();

    const eski = await sql<{ id: number; bolak_id: number }[]>`
      SELECT id, bolak_id FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    expect(eski).toHaveLength(1);

    await rulonYarat(); // yangi o'lchamga joy bo'lsin

    const n = await pozitsiyaniTahrirla(
      sql,
      tahrir(pozitsiyaId, {
        eniSm: 150,
        boyiSm: 250,
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '3.7500',
            tuzatilganMiqdor: null,
            birlik: 'KV_M' as const,
            narxSnapshot: '120000',
            kerak: { eniM: 1.5, boyiM: 2.5 },
          },
        ],
      }),
      XODIM,
    );

    expect(n.bandQaytaQoyildi).toBe(true);

    // Eski band BO'SHATILDI, bittasi FAOL qoldi
    const holatlar = await sql<{ holat: string; n: number }[]>`
      SELECT holat, COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId}
      GROUP BY holat ORDER BY holat`;

    const faol = holatlar.find((x) => x.holat === 'FAOL');
    const boshatilgan = holatlar.find((x) => x.holat === 'BOSHATILDI');
    expect(boshatilgan?.n).toBe(1);
    expect(faol?.n).toBe(1);

    // Eski bo'lak omborga qaytdi
    const b = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE id = ${eski[0]?.bolak_id ?? 0}`;
    expect(['BOSH', 'BAND']).toContain(b[0]?.holat);
  });

  it('faqat narx o‘zgarsa band TEGILMAYDI', async () => {
    const { pozitsiyaId } = await pozitsiyaYarat();

    const oldin = await sql<{ id: number }[]>`
      SELECT id FROM band WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;

    const n = await pozitsiyaniTahrirla(
      sql,
      tahrir(pozitsiyaId, { narxSnapshot: '620000' }),
      XODIM,
    );

    expect(n.bandQaytaQoyildi).toBe(false);

    const keyin = await sql<{ id: number }[]>`
      SELECT id FROM band WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    expect(keyin[0]?.id).toBe(oldin[0]?.id);
  });

  /** TZ 6.8 — narx o'zgarsa mijoz qarzi ham tuzatiladi. */
  it('narx o‘zgarsa mijoz qarziga FARQ yoziladi', async () => {
    const { buyurtmaId, pozitsiyaId } = await pozitsiyaYarat('500000');

    const n = await pozitsiyaniTahrirla(
      sql,
      tahrir(pozitsiyaId, { narxSnapshot: '620000' }),
      XODIM,
    );

    expect(Number(n.qarzFarqi)).toBe(120_000);

    // 2.2-invariant — qarz jurnal yig'indisi: 500 000 + 120 000
    const q = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS jami FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId}`;
    expect(Number(q[0]?.jami)).toBe(620_000);
  });

  it('mijozsiz buyurtmada qarz yozilmaydi (3.10)', async () => {
    const { buyurtmaId, pozitsiyaId } = await pozitsiyaYarat('500000', false);

    await pozitsiyaniTahrirla(sql, tahrir(pozitsiyaId, { narxSnapshot: '700000' }), XODIM);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId}`;
    expect(q[0]?.n).toBe(0);
  });

  /** ⚠️ Ish boshlangach tahrir YO'Q — usta materialni ochgan bo'lishi mumkin. */
  it('«Ishlab chiqarilmoqda» ga o‘tgach RAD ETILADI', async () => {
    const { pozitsiyaId } = await pozitsiyaYarat();
    await ishniOl(sql, pozitsiyaId, XODIM, '45000');

    await expect(
      pozitsiyaniTahrirla(sql, tahrir(pozitsiyaId, { narxSnapshot: '900000' }), XODIM),
    ).rejects.toThrow();

    // Hech narsa o'zgarmadi
    const p = await sql<{ narx: string }[]>`
      SELECT narx_snapshot::text AS narx FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(Number(p[0]?.narx)).toBe(500_000);
  });

  /** TZ 8.7 — «har tahrir ESKI VA YANGI qiymati bilan yoziladi». */
  it('audit jurnaliga eski va yangi qiymat tushadi', async () => {
    const { pozitsiyaId } = await pozitsiyaYarat();

    await pozitsiyaniTahrirla(
      sql,
      tahrir(pozitsiyaId, { narxSnapshot: '640000' }),
      XODIM,
    );

    const a = await sql<{ eski: string; yangi: string }[]>`
      SELECT eski_qiymat::text AS eski, yangi_qiymat::text AS yangi
      FROM audit_jurnal
      WHERE obyekt_turi = 'buyurtma_pozitsiya' AND obyekt_id = ${pozitsiyaId}
        AND amal = 'TAHRIRLASH'`;

    expect(a).toHaveLength(1);
    expect(a[0]?.eski).toContain('500000');
    expect(a[0]?.yangi).toContain('640000');
  });

  it('mato o‘zgarsa band YANGI matodan qo‘yiladi', async () => {
    const { pozitsiyaId } = await pozitsiyaYarat();
    await rulonYarat(ikkinchiMatoId);

    const n = await pozitsiyaniTahrirla(
      sql,
      tahrir(pozitsiyaId, {
        slotlar: [
          {
            slotId,
            materialId: ikkinchiMatoId,
            hisoblanganMiqdor: '2.4000',
            tuzatilganMiqdor: null,
            birlik: 'KV_M' as const,
            narxSnapshot: '130000',
            kerak: { eniM: 1.2, boyiM: 2.0 },
          },
        ],
      }),
      XODIM,
    );

    expect(n.bandQaytaQoyildi).toBe(true);

    const b = await sql<{ material_id: number }[]>`
      SELECT bo.material_id FROM band bd
      JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId} AND bd.holat = 'FAOL'`;
    expect(b[0]?.material_id).toBe(ikkinchiMatoId);
  });
});
