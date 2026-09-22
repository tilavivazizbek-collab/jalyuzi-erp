/**
 * OLDINDAN TO'LOV YOZILMAY QOLGANI — TZ 2.4 · 12.5 · 12.17 (2026-09-22)
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    Sotuv ekranida buyurtma va oldindan to'lov IKKI TRANZAKSIYADA
 *    yoziladi. Sabab o'sha yerda ochiq yozilgan: to'lov yiqilganda
 *    butun buyurtmani yo'qotgandan ko'ra, to'lovni kartochkadan
 *    qayta kiritish yengilroq.
 *
 *    Lekin xabar ekranda BIR MARTA ko'rinardi. Sotuvchi sahifani
 *    yopsa — pul kassa yashigida, tizimda esa yo'q. Kun yopilganda
 *    farq chiqardi va sababini hech kim topa olmasdi.
 *
 * ⚠️ TEST EKRAN SO'ROVLARINI ham chaqiradi (`app/.../malumot.ts`):
 *    belgi bazada turishi kam, u sotuvchiga KO'RINISHI kerak.
 *    Ro'yxatda ham, kartochkada ham — §13.
 *
 * ⚠️ ENG MUHIM XOSSA: belgi O'ZI O'CHADI. To'lov kiritilishi bilan
 *    yo'qoladi, «hal qilindi» tugmasi kerak emas — bosiladigan
 *    tugma unutiladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { buyurtmaTolovi, tolovYozilmadiBelgila } from '@/lib/amal/tolov';
import { buyurtmalar, tolovHolati } from '@/app/(panel)/buyurtma/malumot';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let kassaId = 0;
let mijozId = 0;
let hisoblagich = 0;

const FILIAL = 1;
const XODIM = 1;
const NARX = '240000';

const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`TY mato ${b}`}, 'RULON', 'rulon', 'KV_M', 0.3, 0.5, ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`TY tur ${b}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const mij = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`TY mijoz ${b}`}, ${`9977${String(Date.now()).slice(-5)}`}, ${XODIM})
    RETURNING id`;
  mijozId = mij[0]?.id ?? 0;

  const bor = await sql<{ id: number }[]>`
    SELECT id FROM kassa
     WHERE filial_id = ${FILIAL} AND turi = 'NAQD' AND valyuta = 'SOM'
       AND xodim_id = ${XODIM}`;

  if (bor[0] !== undefined) {
    kassaId = bor[0].id;
  } else {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${FILIAL}, ${XODIM}, 'NAQD', 'SOM', ${`TY kassa ${b}`}, ${XODIM})
      RETURNING id`;
    kassaId = k[0]?.id ?? 0;
  }
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

/**
 * ⚠️ `mijozBilan` — qarz qoladigan testlar uchun. TZ 3.12: qarzga
 *    sotishda mijoz SHART, aks holda pulni kimdan yig'ish kerakligi
 *    noma'lum qoladi. Qisman to'lov testi aynan shunday.
 */
async function buyurtma(mijozBilan = false): Promise<{ id: number; raqam: string }> {
  const b = belgi();

  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL}, ${`TY-R-${b}`}, 'RULON', 3.0, 30.0,
            50000, ${XODIM})`;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-TY-${b}`,
    mijozId: mijozBilan ? mijozId : null,
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
        eniM: 1.2,
        boyiM: 2.0,
        soni: 1,
        narxSnapshot: NARX,
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { parametrlar: [] },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '2.4000',
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '0',
            kerak: { eniM: 1.2, boyiM: 2.0 },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return { id: n.buyurtmaId, raqam: n.raqam };
}

/** Belgini qo'yadi — sotuv ekranidagi `catch` bloki aynan shuni chaqiradi */
async function belgila(buyurtmaId: number): Promise<void> {
  await tolovYozilmadiBelgila(
    sql,
    {
      buyurtmaId,
      filialId: FILIAL,
      summa: NARX,
      valyuta: 'SOM',
      sabab: 'Sinov: kassa javob bermadi',
    },
    XODIM,
  );
}

/** Ro'yxat ekranidagi belgi — sotuvchi shu yerdan ko'radi */
async function royxatda(buyurtmaId: number): Promise<boolean | undefined> {
  const r = await buyurtmalar(FILIAL, 'HAMMASI', 200);
  return r.find((x) => x.id === buyurtmaId)?.tolovYozilmadi;
}

describe('TZ 12.5 — yozilmay qolgan oldindan to‘lov izi', () => {
  it('belgi QO‘YILMAGAN buyurtmada ogohlantirish yo‘q', async () => {
    const b = await buyurtma();

    expect((await tolovHolati(b.id, FILIAL))?.tolovYozilmadi).toBe(false);
    expect(await royxatda(b.id)).toBe(false);
  }, 120_000);

  it('to‘lov yozilmasa buyurtma kartochkasida ogohlantirish chiqadi', async () => {
    const b = await buyurtma();
    await belgila(b.id);

    expect((await tolovHolati(b.id, FILIAL))?.tolovYozilmadi).toBe(true);
  }, 120_000);

  it('RO‘YXATDA ham ko‘rinadi — sotuvchi kartochkani ochmasdan biladi', async () => {
    const b = await buyurtma();
    await belgila(b.id);

    expect(await royxatda(b.id)).toBe(true);
  }, 120_000);

  it('izohda KUTILGAN SUMMA bor — egasi qancha pul ekanini ko‘radi', async () => {
    const b = await buyurtma();
    await belgila(b.id);

    const a = await sql<{ izoh: string; yangi_qiymat: unknown }[]>`
      SELECT izoh, yangi_qiymat FROM audit_jurnal
       WHERE amal = 'TOLOV_YOZILMADI' AND obyekt_turi = 'buyurtma'
         AND obyekt_id = ${b.id}`;

    expect(a[0]?.izoh).toContain(NARX);
    expect(JSON.stringify(a[0]?.yangi_qiymat)).toContain(NARX);
  }, 120_000);

  it('⚠️ TO‘LOV KIRITILSA belgi O‘ZI YO‘QOLADI — tugma bosilmaydi', async () => {
    const b = await buyurtma();
    await belgila(b.id);

    /** Belgi bor ekanini avval tasdiqlaymiz — aks holda test hech narsa isbotlamaydi */
    expect((await tolovHolati(b.id, FILIAL))?.tolovYozilmadi).toBe(true);

    await buyurtmaTolovi(
      sql,
      {
        buyurtmaId: b.id,
        qatorlar: [{ kassaId, summa: NARX, valyuta: 'SOM' }],
        izoh: 'Qayta kiritildi',
        kalit: `tolov:buyurtma:${String(b.id)}:qayta`,
      },
      XODIM,
      'K1',
    );

    expect((await tolovHolati(b.id, FILIAL))?.tolovYozilmadi).toBe(false);
    expect(await royxatda(b.id)).toBe(false);
  }, 120_000);

  it('QISMAN to‘lov ham belgini o‘chiradi — pul kelgani ma’lum bo‘ldi', async () => {
    /**
     * ⚠️ Nega qisman to'lov ham yetarli: belgi «qarz bormi» degani
     *    emas, «kiritilgan to'lov YO'QOLDIMI» degani. Sotuvchi
     *    yozuvni qaytadan kiritganini bir marta ko'rsatgan bo'lsa,
     *    ogohlantirishning ishi tugadi — qarz esa odatdagi
     *    «To'lanmagan» ustunida ko'rinadi.
     */
    const b = await buyurtma(true);
    await belgila(b.id);

    await buyurtmaTolovi(
      sql,
      {
        buyurtmaId: b.id,
        qatorlar: [{ kassaId, summa: '50000', valyuta: 'SOM' }],
        izoh: 'Qisman',
        kalit: `tolov:buyurtma:${String(b.id)}:qisman`,
      },
      XODIM,
      'K1',
    );

    expect((await tolovHolati(b.id, FILIAL))?.tolovYozilmadi).toBe(false);
    expect(await royxatda(b.id)).toBe(false);
  }, 120_000);
});
