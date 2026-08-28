/**
 * TZ 12.2 — kassa ochish.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * 2026-08-27 auditida chiqdi: kassa jadvali BO'SH edi va uni
 * to'ldirish yo'li umuman yo'q edi — na sahifa, na ruxsat kodi,
 * na urug'da yozuv. Ya'ni to'lov qabul qilib, kun yopib va ish
 * haqi to'lab bo'lmasdi.
 *
 * Bu test kassa ochilgandan keyin PUL HARAKATI haqiqatan
 * ishlashini tekshiradi — kassa yozuvi tushadimi va balans
 * to'g'ri chiqadimi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { kassaYarat } from '@/lib/amal/kassa';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

/**
 * ⚠️ Test O'Z FILIALINI ochadi.
 *
 *    Kassa yozuvini O'CHIRIB BO'LMAYDI — bazada trigger bor
 *    (§6.5: pul yozuvi hech qachon o'chirilmaydi). Ya'ni test
 *    yaratgan kassa va uning boshlang'ich qoldig'i bazada
 *    QOLADI.
 *
 *    Agar test haqiqiy filialda ishlasa, u yerdagi (turi,
 *    valyuta) juftliklari band bo'lib qolardi va keyingi ishga
 *    tushirish yiqilardi. Bundan ham yomoni — egasining haqiqiy
 *    kassalari orasiga sinov kassalari aralashardi.
 *
 *    Shuning uchun har ishga tushirish o'z filialini ochadi va
 *    oxirida uni NOFAOL qiladi: sinov kassalari hech qayerda
 *    ko'rinmaydi.
 */
let FILIAL = 0;
const XODIM = 1;

const belgi = `KAS-${String(Date.now()).slice(-8)}`;

let hisoblagich = 0;
const nom = (qism: string): string => {
  hisoblagich += 1;
  return `${belgi} ${qism}${String(hisoblagich)}`;
};

/**
 * ⚠️ HAR TESTGA O'Z (turi, valyuta) JUFTLIGI.
 *
 *    Bazada ikki noyob indeks bor: admin kassasi filial bo'yicha
 *    har (turi, valyuta) uchun bitta, xodimniki ham shunday.
 *    Agar ikki test bir xil juftlikni olsa, ikkinchisi birinchisi
 *    tufayli yiqilardi — va sabab KODDA emas, testda bo'lardi.
 *
 *    Shuning uchun juftliklar shu yerda taqsimlangan va hech
 *    qayerda takrorlanmaydi.
 */
const J = {
  adminOchiladi: { turi: 'BANK', valyuta: 'SOM' },
  xodimOchiladi: { turi: 'BANK', valyuta: 'USD' },
  qoldiqli: { turi: 'KARTA', valyuta: 'SOM' },
  qoldiqsiz: { turi: 'KARTA', valyuta: 'USD' },
  nolQoldiq: { turi: 'NAQD', valyuta: 'USD' },
  takror: { turi: 'NAQD', valyuta: 'SOM' },
  buzuq: { turi: 'BANK', valyuta: 'SOM' },
} as const;

beforeAll(async () => {
  sql = sinovUlanishi();

  /**
   * ⚠️ `ishlab_chiqaradi = true` — bazada `filial_ishlab_chiqaruvchi_kerak`
   *    cheklovi bor: o'zi tikmaydigan filialda standart ishlab
   *    chiqaruvchi ko'rsatilishi shart (20.4.1). Sinov filialiga
   *    boshqa filialni biriktirgandan ko'ra, uni o'zi tikadigan
   *    qilib qo'ygan sodda.
   */
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`${belgi} sinov filiali`}, false, true, false, ${XODIM})
    RETURNING id`;

  FILIAL = f[0]?.id ?? 0;
}, 120_000);

/**
 * ⚠️ TESTLAR O'ZIDAN KEYIN TOZALAYDI.
 *
 *    Kassada IKKI noyob indeks bor: filialning admin kassasi har
 *    (turi, valyuta) uchun bitta, xodimniki ham shunday. Test
 *    yaratgan kassa qolib ketsa, ikkinchi marta ishga tushganda
 *    o'sha test yiqilardi — va sababi kodda emas, avvalgi
 *    ishga tushirishda bo'lardi.
 *
 * ⚠️ Bu yerda `DELETE` ishlatiladi. Ilova kodida u taqiq (§3),
 *    lekin test o'zi yaratgan qatorni tozalashi boshqa narsa:
 *    aks holda ishlaydigan bazada axlat to'planardi.
 */
afterAll(async () => {
  /**
   * ⚠️ O'chirilmaydi — NOFAOL qilinadi (§3: `DELETE` yo'q).
   *    Sinov filiali va uning kassalari hech qayerda
   *    ko'rinmaydi, lekin pul yozuvlari tarixda qoladi.
   */
  if (FILIAL > 0) {
    await sql`UPDATE kassa SET faol = false WHERE filial_id = ${FILIAL}`;
    await sql`UPDATE filial SET faol = false WHERE id = ${FILIAL}`;
  }
  await sql.end();
});

describe('TZ 12.2 — kassa ochiladi', () => {
  it('admin kassasi ochiladi (xodimsiz)', async () => {
    const k = await kassaYarat(
      sql,
      {
        nom: nom('admin bank'),
        filialId: FILIAL,
        xodimId: undefined,
        ...J.adminOchiladi,
        boshlangichQoldiq: undefined,
      },
      XODIM,
    );

    expect(k.id).toBeGreaterThan(0);

    const q = await sql<{ xodim_id: number | null; turi: string }[]>`
      SELECT xodim_id, turi FROM kassa WHERE id = ${k.id}`;

    /** ⚠️ `NULL` — filial (admin) kassasi degani */
    expect(q[0]?.xodim_id).toBeNull();
    expect(q[0]?.turi).toBe('BANK');
  });

  it('xodim kassasi ochiladi', async () => {
    const k = await kassaYarat(
      sql,
      {
        nom: nom('xodim bank'),
        filialId: FILIAL,
        xodimId: XODIM,
        ...J.xodimOchiladi,
        boshlangichQoldiq: undefined,
      },
      XODIM,
    );

    const q = await sql<{ xodim_id: number | null }[]>`
      SELECT xodim_id FROM kassa WHERE id = ${k.id}`;
    expect(q[0]?.xodim_id).toBe(XODIM);
  });
});

describe("TZ 12.2 — boshlang'ich qoldiq YOZUV bo'lib tushadi", () => {
  it('qoldiq alohida ustunga emas, kassa yozuviga yoziladi', async () => {
    const k = await kassaYarat(
      sql,
      {
        nom: nom('qoldiqli'),
        filialId: FILIAL,
        xodimId: undefined,
        ...J.qoldiqli,
        boshlangichQoldiq: '500000',
      },
      XODIM,
    );

    const y = await sql<{ kod: string; summa: string; manba_turi: string }[]>`
      SELECT kod, summa::text, manba_turi FROM kassa_yozuv WHERE kassa_id = ${k.id}`;

    expect(y.length).toBe(1);
    /** TZ 12.5 — K8 «Boshlang'ich qoldiq» */
    expect(y[0]?.kod).toBe('K8');
    expect(Number(y[0]?.summa)).toBe(500000);

    /**
     * ⚠️ 2.2-invariant — balans SAQLANMAYDI, `SUM()` bilan chiqadi.
     *    Shu sababli kassada `qoldiq` degan ustun yo'q.
     */
    const b = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS jami
      FROM kassa_yozuv WHERE kassa_id = ${k.id}`;
    expect(Number(b[0]?.jami)).toBe(500000);
  });

  it("qoldiq bo'sh bo'lsa yozuv yaratilmaydi", async () => {
    const k = await kassaYarat(
      sql,
      {
        nom: nom('qoldiqsiz'),
        filialId: FILIAL,
        xodimId: undefined,
        ...J.qoldiqsiz,
        boshlangichQoldiq: undefined,
      },
      XODIM,
    );

    const y = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv WHERE kassa_id = ${k.id}`;
    expect(y[0]?.n).toBe(0);
  });

  it("nol qoldiq ham yozuv yaratmaydi — bazada summa <> 0 sharti bor", async () => {
    const k = await kassaYarat(
      sql,
      {
        nom: nom('nolqoldiq'),
        filialId: FILIAL,
        xodimId: undefined,
        ...J.nolQoldiq,
        boshlangichQoldiq: '0',
      },
      XODIM,
    );

    const y = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv WHERE kassa_id = ${k.id}`;
    expect(y[0]?.n).toBe(0);
  });
});

describe('TZ 12.2 — takrorlanish to‘siladi', () => {
  it('bir xodimda bir turdagi bir valyutali IKKINCHI kassa ochilmaydi', async () => {
    const kirim = {
      nom: nom('takror'),
      filialId: FILIAL,
      xodimId: XODIM,
      ...J.takror,
      boshlangichQoldiq: undefined,
    };

    await kassaYarat(sql, kirim, XODIM);

    /**
     * ⚠️ Ikkita bir xil kassa bo'lsa pul qaysi biriga tushgani
     *    chalkashardi va kun yopishda hisob to'g'ri chiqmasdi.
     */
    await expect(
      kassaYarat(sql, { ...kirim, nom: nom('takror-2') }, XODIM),
    ).rejects.toBeInstanceOf(BiznesXato);
  });

  it('bir xodimda har valyutaga alohida kassa bo‘lishi MUMKIN', async () => {
    /**
     * ⚠️ Bu test XODIM kassalarini ishlatadi: admin juftliklari
     *    boshqa testlarga taqsimlangan va ular tugagan.
     *    Ikkinchi xodim olinadi — birinchisi «takror» testida band.
     */
    const x = await sql<{ id: number }[]>`
      SELECT id FROM xodim WHERE faol = true AND id <> ${XODIM} ORDER BY id LIMIT 1`;
    const ikkinchiXodim = x[0]?.id;
    expect(ikkinchiXodim).toBeDefined();

    const asos = {
      filialId: FILIAL,
      xodimId: ikkinchiXodim,
      boshlangichQoldiq: undefined,
    } as const;

    const a = await kassaYarat(
      sql,
      { ...asos, nom: nom('x-naqd-som'), turi: 'NAQD', valyuta: 'SOM' },
      XODIM,
    );
    const b = await kassaYarat(
      sql,
      { ...asos, nom: nom('x-naqd-usd'), turi: 'NAQD', valyuta: 'USD' },
      XODIM,
    );

    expect(a.id).not.toBe(b.id);
  });
});

describe('2.1-invariant — yarim bajarilgan amal qolmaydi', () => {
  it("kassa yaratilib qoldiq yozilmay qolmaydi", async () => {
    /**
     * Manfiy summa bazadagi cheklovga uriladi. Kassa ham
     * yaratilmasligi kerak — ikkalasi bitta tranzaksiyada.
     */
    const oldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa WHERE nom LIKE ${`${belgi}%`}`;

    await expect(
      kassaYarat(
        sql,
        {
          nom: nom('buzuq'),
          filialId: FILIAL,
          xodimId: XODIM,
          ...J.buzuq,
          boshlangichQoldiq: '-100',
        },
        XODIM,
      ),
    ).rejects.toThrow();

    const keyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa WHERE nom LIKE ${`${belgi}%`}`;

    expect(keyin[0]?.n).toBe(oldin[0]?.n);
  });
});
