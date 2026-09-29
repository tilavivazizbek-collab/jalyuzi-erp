/**
 * MATERIALGA ALOHIDA NARX JADVALI — 0059, egasi qarori 2026-09-24
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    0057 da narx darajasi olib tashlandi. Daraja «bu jadval qaysi
 *    materiallarga» degan savolga javob berardi — u ketgach
 *    «Materialni o'zi sotish» jadvali BITTA bo'lib qoldi va
 *    to'g'ridan sotiladigan HAMMA materialga tegishli bo'ldi.
 *
 *    Ya'ni «ko'p olganga arzonroq» (0056) buzilgan edi: karnizga
 *    35 000 so'm/metr yozilsa, pult ham shu narxda sotilardi.
 *
 * ⚠️ ENG XAVFLI JOY — SAQLASH QAMROVI. Nofaollashtirish
 *    `material_id` ni hisobga olmasa, karniz narxini saqlash
 *    PULTNIKINI va UMUMIY jadvalni ham jimgina o'chirib yuborardi:
 *    egasi bitta jadvalni tahrirlab uchtasini yo'qotardi. Domen
 *    testlari (EC-QT-14…20) tanlash TARTIBINI ushlaydi, bu yerda
 *    esa BAZA chegarasi sinaladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { turNarxiniSaqla } from '@/lib/amal/narx-qoida';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let karnizId = 0;
let pultId = 0;

const XODIM = 1;
const belgi = `MTN-${String(Date.now()).slice(-8)}`;

const bosqich = (narx: string) => ({
  dan: 0,
  gacha: null,
  narx,
  valyuta: 'SOM' as const,
});

const qamrov = (narx: string) => ({
  mijozTuriId: null,
  filialId: null,
  hisoblashUsuli: 'MIQDOR' as const,
  bosqichlar: [bosqich(narx)],
});

/** «Materialni o'zi sotish» jadvalini saqlaydi */
async function saqla(materialId: number | null, narx: string): Promise<void> {
  const n = await sql.begin(async (tx) =>
    turNarxiniSaqla(
      tx,
      {
        mahsulotTurId: null,
        hammaTurga: false,
        materialId,
        qoidalar: [qamrov(narx)],
        qoshimchalar: [],
      },
      XODIM,
    ),
  );
  expect(n.holat).toBe('SAQLANDI');
}

/** Shu uch jadvalning joriy narxi — yo'q bo'lsa `null` */
async function narxlar(): Promise<{
  umumiy: string | null;
  karniz: string | null;
  pult: string | null;
}> {
  const q = await sql<{ material: number | null; narx: string | null }[]>`
    SELECT mn.material_id AS material,
           (SELECT b.narx::text FROM mahsulot_narx_bosqich b
             WHERE b.mahsulot_narx_id = mn.id AND b.faol = true LIMIT 1) AS narx
      FROM mahsulot_narx mn
     WHERE mn.mahsulot_tur_id IS NULL AND mn.hamma_turga = false
       AND mn.faol = true
       AND (mn.material_id IS NULL OR mn.material_id IN (${karnizId}, ${pultId}))`;

  const top = (m: number | null): string | null =>
    q.find((x) => x.material === m)?.narx ?? null;

  return { umumiy: top(null), karniz: top(karnizId), pult: top(pultId) };
}

beforeAll(async () => {
  sql = sinovUlanishi();

  const k = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, sotuv_narx, sotuv_valyuta,
                          togridan_sotiladi, yaratdi_id)
    VALUES (${`${belgi} karniz`}, 'CHIZIQLI', 'metr', 'M',
            1, '35000', 'SOM', true, ${XODIM}) RETURNING id`;
  karnizId = k[0]?.id ?? 0;
  expect(karnizId).toBeGreaterThan(0);

  const p = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, sotuv_narx, sotuv_valyuta,
                          togridan_sotiladi, yaratdi_id)
    VALUES (${`${belgi} pult`}, 'DONA', 'dona', 'DONA',
            1, '90000', 'SOM', true, ${XODIM}) RETURNING id`;
  pultId = p[0]?.id ?? 0;
  expect(pultId).toBeGreaterThan(0);
}, 120_000);

afterAll(async () => {
  /** ⚠️ O'chirilmaydi — nofaol qilinadi (2.1-invariant) */
  await sql`UPDATE material SET faol = false WHERE nom LIKE ${`${belgi}%`}`;
  await sql.end({ timeout: 5 });
});

describe('EC-MTN · materialga alohida jadval', () => {
  it('EC-MTN-01 · umumiy jadval saqlanadi', async () => {
    await saqla(null, '10000');

    const n = await narxlar();
    expect(Number(n.umumiy)).toBe(10000);
    expect(n.karniz).toBeNull();
  });

  it('EC-MTN-02 · materialga qo’yilgan jadval UMUMIYNI o’chirmaydi', async () => {
    await saqla(karnizId, '35000');

    const n = await narxlar();
    expect(Number(n.umumiy)).toBe(10000);
    expect(Number(n.karniz)).toBe(35000);
  });

  /**
   * ⚠️ ENG MUHIM TEST — 0059 ning butun sababi shu. Ikki material
   *    bir-birining jadvalini bosib o'tmasligi kerak.
   */
  it('EC-MTN-03 · ikkinchi material birinchisini o’chirmaydi', async () => {
    await saqla(pultId, '90000');

    const n = await narxlar();
    expect(Number(n.umumiy)).toBe(10000);
    expect(Number(n.karniz)).toBe(35000);
    expect(Number(n.pult)).toBe(90000);
  });

  it('EC-MTN-04 · umumiyni qayta saqlash materialnikiga tegmaydi', async () => {
    await saqla(null, '12000');

    const n = await narxlar();
    expect(Number(n.umumiy)).toBe(12000);
    expect(Number(n.karniz)).toBe(35000);
    expect(Number(n.pult)).toBe(90000);
  });

  /**
   * ⚠️ `ON CONFLICT` bandi NOYOBLIK INDEKSI bilan mos kelishi shart.
   *    0059 indeksga `material_id` qo'shdi va u QISMAN (`WHERE
   *    faol`); ikkalasi ham yozilmasa har saqlash yiqilardi.
   */
  it('EC-MTN-05 · qayta saqlash ikkinchi marta ham ishlaydi', async () => {
    await saqla(karnizId, '32000');

    const n = await narxlar();
    expect(Number(n.karniz)).toBe(32000);
  });

  /**
   * ⚠️ Bazadagi CHECK: «falon tur uchun, lekin falon materialga» —
   *    ma'nosiz qator. Sxema ham to'sadi, baza ham (§9.4).
   */
  it('EC-MTN-06 · tur + material birga BAZADA to’siladi', async () => {
    const t = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`${belgi} tur`}, ${XODIM}) RETURNING id`;

    await expect(
      sql`INSERT INTO mahsulot_narx (mahsulot_tur_id, material_id,
                                     hisoblash_usuli, yaratdi_id)
          VALUES (${t[0]?.id ?? 0}, ${karnizId}, 'MAYDON', ${XODIM})`,
    ).rejects.toThrow();
  });
});
