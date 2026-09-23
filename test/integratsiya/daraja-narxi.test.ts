/**
 * DARAJAGA UMUMIY NARX ZANJIRI — 0055.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    0055 `mahsulot_tur_id IS NULL` ning MA'NOSINI ikkiga bo'ldi:
 *
 *      hamma_turga = false → «materialni o'zi sotish»
 *      hamma_turga = true  → «darajaga umumiy narx»
 *
 *    Bu ikkisi bir-birini o'chirib yuborishi MUMKIN edi: saqlash
 *    tranzaksiyasi eski qatorlarni `coalesce(mahsulot_tur_id, 0)`
 *    bo'yicha nofaol qiladi. Shart qo'shilmasa, egasi material
 *    narxini saqlaganda daraja narxi jimgina o'chib ketardi.
 *
 *    Domen testlari (EC-QT) tanlash TARTIBINI tekshiradi. Bu yerda
 *    esa BAZA bilan chegara sinaladi: yozilyaptimi, bir-birini
 *    buzmayaptimi, noyoblik indeksi ikkalasini ham o'tkazyaptimi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { turNarxiniSaqla } from '@/lib/amal/narx-qoida';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let darajaId = 0;
let turId = 0;

const XODIM = 1;
const belgi = `DRJ-${String(Date.now()).slice(-8)}`;

const bosqich = (narx: string) => ({
  dan: 0,
  gacha: null,
  narx,
  valyuta: 'SOM' as const,
});

beforeAll(async () => {
  sql = sinovUlanishi();

  const g = await sql<{ id: number }[]>`
    INSERT INTO narx_guruh (nom, yaratdi_id)
    VALUES (${`${belgi} daraja`}, ${XODIM}) RETURNING id`;
  darajaId = g[0]?.id ?? 0;
  expect(darajaId).toBeGreaterThan(0);

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`${belgi} tur`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;
  expect(turId).toBeGreaterThan(0);
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

/** Shu daraja uchun bazadagi qatorlar */
async function qatorlar(): Promise<
  { tur: number | null; hamma: boolean; narx: string | null }[]
> {
  return sql<{ tur: number | null; hamma: boolean; narx: string | null }[]>`
    SELECT mn.mahsulot_tur_id AS tur, mn.hamma_turga AS hamma,
           (SELECT b.narx::text FROM mahsulot_narx_bosqich b
             WHERE b.mahsulot_narx_id = mn.id AND b.faol = true LIMIT 1) AS narx
      FROM mahsulot_narx mn
     WHERE mn.narx_guruh_id = ${darajaId} AND mn.faol = true
     ORDER BY mn.hamma_turga, mn.mahsulot_tur_id NULLS FIRST`;
}

describe('EC-DRJ · darajaga umumiy narx yoziladi', () => {
  it('EC-DRJ-01 · `hamma_turga` qatori saqlanadi', async () => {
    const n = await sql.begin(async (tx) =>
      turNarxiniSaqla(
        tx,
        {
          mahsulotTurId: null,
          hammaTurga: true,
          qoidalar: [
            {
              narxGuruhId: darajaId,
              mijozTuriId: null,
              filialId: null,
              hisoblashUsuli: 'MAYDON',
              bosqichlar: [bosqich('120000')],
            },
          ],
          qoshimchalar: [],
        },
        XODIM,
      ),
    );
    expect(n.holat).toBe('SAQLANDI');

    const q = await qatorlar();
    expect(q).toHaveLength(1);
    expect(q[0]?.hamma).toBe(true);
    expect(q[0]?.tur).toBeNull();
    expect(Number(q[0]?.narx)).toBe(120000);
  });

  /**
   * ⚠️ ENG MUHIM TEST. «Materialni o'zi sotish» ham `tur IS NULL`
   *    qatori. Saqlash shartsiz qoldirilsa u daraja narxini
   *    O'CHIRIB yuborardi va aksincha — ikkalasi ham jimgina.
   */
  it('EC-DRJ-02 · material sotish narxi daraja narxini O’CHIRMAYDI', async () => {
    const n = await sql.begin(async (tx) =>
      turNarxiniSaqla(
        tx,
        {
          mahsulotTurId: null,
          hammaTurga: false,
          qoidalar: [
            {
              narxGuruhId: darajaId,
              mijozTuriId: null,
              filialId: null,
              hisoblashUsuli: 'MIQDOR',
              bosqichlar: [bosqich('45000')],
            },
          ],
          qoshimchalar: [],
        },
        XODIM,
      ),
    );
    expect(n.holat).toBe('SAQLANDI');

    const q = await qatorlar();
    /** IKKALASI ham turishi shart */
    expect(q).toHaveLength(2);
    const material = q.find((x) => !x.hamma);
    const daraja = q.find((x) => x.hamma);
    expect(Number(material?.narx)).toBe(45000);
    expect(Number(daraja?.narx)).toBe(120000);
  });

  it('EC-DRJ-03 · teskarisi ham — daraja narxi materialnikini o’chirmaydi', async () => {
    await sql.begin(async (tx) =>
      turNarxiniSaqla(
        tx,
        {
          mahsulotTurId: null,
          hammaTurga: true,
          qoidalar: [
            {
              narxGuruhId: darajaId,
              mijozTuriId: null,
              filialId: null,
              hisoblashUsuli: 'MAYDON',
              bosqichlar: [bosqich('150000')],
            },
          ],
          qoshimchalar: [],
        },
        XODIM,
      ),
    );

    const q = await qatorlar();
    expect(q).toHaveLength(2);
    expect(Number(q.find((x) => !x.hamma)?.narx)).toBe(45000);
    expect(Number(q.find((x) => x.hamma)?.narx)).toBe(150000);
  });

  /**
   * ⚠️ `ON CONFLICT` bandi NOYOBLIK INDEKSI bilan mos kelishi shart.
   *    0055 da indeksga `hamma_turga` qo'shildi; `ON CONFLICT`
   *    yangilanmasa HAR SAQLASH xato bilan yiqilardi.
   */
  it('EC-DRJ-04 · qayta saqlash ikkinchi marta ham ishlaydi', async () => {
    const n = await sql.begin(async (tx) =>
      turNarxiniSaqla(
        tx,
        {
          mahsulotTurId: turId,
          hammaTurga: false,
          qoidalar: [
            {
              narxGuruhId: darajaId,
              mijozTuriId: null,
              filialId: null,
              hisoblashUsuli: 'MAYDON',
              bosqichlar: [bosqich('200000')],
            },
          ],
          qoshimchalar: [],
        },
        XODIM,
      ),
    );
    expect(n.holat).toBe('SAQLANDI');

    const q = await qatorlar();
    expect(q).toHaveLength(3);
    expect(Number(q.find((x) => x.tur === turId)?.narx)).toBe(200000);
  });

  /**
   * ⚠️ Bazadagi CHECK: «falon tur uchun, lekin hamma turga» —
   *    ma'nosiz qator. Sxema ham to'sadi, baza ham (§9.4).
   */
  it('EC-DRJ-05 · tur + hammaTurga birga BAZADA to’siladi', async () => {
    await expect(
      sql`INSERT INTO mahsulot_narx (mahsulot_tur_id, hamma_turga, narx_guruh_id,
                                     hisoblash_usuli, yaratdi_id)
          VALUES (${turId}, true, ${darajaId}, 'MAYDON', ${XODIM})`,
    ).rejects.toThrow();
  });
});
