/**
 * Kunlik admin xabarlari (cron) — kam qoldiq, to'lov muddati, kechikkan
 * buyurtma. 2026-10-13. Alohida filialda, Telegramli admin bilan.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimYarat } from '@/lib/amal/kirim';
import { toshkentKuni } from '@/lib/domain/sana';
import {
  kamQoldiqXabarlari,
  kechikkanBuyurtmaXabarlari,
  kunEslatmaXabarlari,
  yetkazibMuddatXabarlari,
} from '@/app/(panel)/hisobot/kunlik-xabar';
import { buyurtmaKerak } from '@/app/(panel)/ombor/xarid/kerak-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
const KUN = 24 * 60 * 60 * 1000;
let sql: Ulanish;
let filialId = 0;
let bosh = 0;

const xabarlar = (manba: string, f: number) =>
  sql<{ matn: string }[]>`SELECT matn FROM bot_xabar WHERE manba_turi = ${manba} AND manba_id = ${f}`;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Kunlik ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  // Ikkinchi filial — muammosi yo'q, Telegramli admini bor: xabar OLMASLIGI kerak
  const f2 = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Kunlik toza ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  bosh = f2[0]?.id ?? 0;
  const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
  for (const [i, fid] of [filialId, bosh].entries()) {
    const x = await sql<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, telegram_id, yaratdi_id)
      VALUES (${fid}, ${`Kunlik admin ${BELGI}-${String(i)}`}, ${`9981${BELGI}${String(i)}`},
              ${Number(`5${BELGI}0${String(i)}`)}, ${XODIM})
      RETURNING id`;
    await sql`INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id) VALUES (${x[0]?.id ?? 0}, ${rol[0]?.id ?? 0}, ${XODIM})`;
  }

  // Kam qoldiq: chegara 999 m, omborda 50 m. Kirim muddati 2 kun oldin o'tgan.
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`Kunlik yetkazuvchi ${BELGI}`}, ${XODIM}) RETURNING id`;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
                          kam_qoldiq_chegara_m, yaratdi_id)
    VALUES (${`Kunlik mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', 999, ${XODIM}) RETURNING id`;
  await kirimYarat(
    sql,
    {
      raqam: `K-KUN-${BELGI}`,
      sana: toshkentKuni(new Date(Date.now() - 10 * KUN)),
      filialId,
      yetkazibBeruvchiId: y[0]?.id ?? 0,
      valyuta: 'SOM',
      kursSnapshot: null,
      transportSumma: '0',
      bojxonaSumma: '0',
      tolovMuddati: toshkentKuni(new Date(Date.now() - 2 * KUN)),
      qatorlar: [
        {
          materialId: m[0]?.id ?? 0,
          miqdorKirim: 1,
          narxBirlik: '1000',
          narxAsosi: 'METR',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3, boyiM: 50 }],
        },
      ],
    },
    XODIM,
  );

  // Kechikkan buyurtma: tayyorlik sanasi 5 kun oldin, pozitsiya hali ishlab chiqarilmoqda
  const tur = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`Kunlik tur ${BELGI}`}, ${XODIM}) RETURNING id`;
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id,
                          manba, tayyorlik_sana, yaratdi_id)
    VALUES (${`B-KUN-${BELGI}`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT',
            ${toshkentKuni(new Date(Date.now() - 5 * KUN))}, ${XODIM})
    RETURNING id`;
  await sql`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m,
                                    narx_snapshot, formula_snapshot, holat, yaratdi_id)
    VALUES (${b[0]?.id ?? 0}, 1, ${tur[0]?.id ?? 0}, 2, 1.5, 100000,
            ${sql.json({ sinov: true })}, 'ISHLAB_CHIQARILMOQDA', ${XODIM})`;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('kunlik admin xabarlari', () => {
  it('EC-KX-01: kam qoldiq — material ro‘yxatda; toza filialga xabar yo‘q', async () => {
    await kamQoldiqXabarlari(undefined, [filialId, bosh]);
    const x = await xabarlar('kam_qoldiq', filialId);
    expect(x).toHaveLength(1);
    // Son — «Buyurtma kerak» sahifasi bilan BIR XIL (yo'lda bo'lmaganlari)
    const sahifa = (await buyurtmaKerak(filialId)).filter(
      (q) => q.yoldaBuyurtma.length === 0 && !q.kochirishdaYolda,
    );
    expect(sahifa.some((q) => q.nom === `Kunlik mato ${BELGI}`)).toBe(true);
    expect(x[0]?.matn).toContain(`BUYURTMA KERAK* — ${String(sahifa.length)} ta material`);
    // Ombori (bo'lagi) yo'q filial — xabar yo'q, garchi admini bo'lsa ham
    expect(await xabarlar('kam_qoldiq', bosh)).toHaveLength(0);
  }, 120_000);

  it('EC-KX-02: to‘lov muddati — 2 kun kechikkan, qoldiq qarz summasi bilan', async () => {
    await yetkazibMuddatXabarlari(undefined, [filialId, bosh]);
    const x = await xabarlar('yetkazib_muddat', filialId);
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain(`K-KUN-${BELGI}: 50.000 so'm`.replace('.', ' '));
    expect(x[0]?.matn).toContain('2 kun KECHIKDI');
    expect(await xabarlar('yetkazib_muddat', bosh)).toHaveLength(0);
  }, 120_000);

  it('EC-KX-03: kechikkan buyurtma — 5 kun', async () => {
    await kechikkanBuyurtmaXabarlari(undefined, [filialId, bosh]);
    const x = await xabarlar('kechikkan_buyurtma', filialId);
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain(`B-KUN-${BELGI} · — — 5 kun`);
    expect(await xabarlar('kechikkan_buyurtma', bosh)).toHaveLength(0);
  }, 120_000);

  it('EC-KX-04: qayta chaqiruv — kuniga bir marta', async () => {
    const f = [filialId, bosh];
    await kamQoldiqXabarlari(undefined, f);
    await yetkazibMuddatXabarlari(undefined, f);
    await kechikkanBuyurtmaXabarlari(undefined, f);
    expect(await xabarlar('kam_qoldiq', filialId)).toHaveLength(1);
    expect(await xabarlar('yetkazib_muddat', filialId)).toHaveLength(1);
    expect(await xabarlar('kechikkan_buyurtma', filialId)).toHaveLength(1);
  }, 120_000);

  /**
   * 2026-10-13 shu holat ushlandi: chaqiruvchi javobni kutmay qayta yuborsa,
   * ikki yurish bir paytda «bugun yozilmagan» deb ko'rib IKKI xabar yozardi.
   */
  it('EC-KX-05: bir vaqtdagi ikki chaqiruv — baribir bitta xabar', async () => {
    const f = await sql<{ id: number }[]>`
      INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
      VALUES (${`Kunlik parallel ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
    const fid = f[0]?.id ?? 0;
    const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
    const x = await sql<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, telegram_id, yaratdi_id)
      VALUES (${fid}, ${`Parallel admin ${BELGI}`}, ${`9981${BELGI}9`}, ${Number(`5${BELGI}09`)}, ${XODIM})
      RETURNING id`;
    await sql`INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id) VALUES (${x[0]?.id ?? 0}, ${rol[0]?.id ?? 0}, ${XODIM})`;
    const tur = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`Parallel tur ${BELGI}`}, ${XODIM}) RETURNING id`;
    const b = await sql<{ id: number }[]>`
      INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id,
                            manba, tayyorlik_sana, yaratdi_id)
      VALUES (${`B-PAR-${BELGI}`}, ${XODIM}, ${fid}, ${fid}, 'SAYT',
              ${toshkentKuni(new Date(Date.now() - KUN))}, ${XODIM})
      RETURNING id`;
    await sql`
      INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m,
                                      narx_snapshot, formula_snapshot, holat, yaratdi_id)
      VALUES (${b[0]?.id ?? 0}, 1, ${tur[0]?.id ?? 0}, 2, 1.5, 100000,
              ${sql.json({ sinov: true })}, 'TAYYOR', ${XODIM})`;

    await Promise.all([
      kechikkanBuyurtmaXabarlari(undefined, [fid]),
      kechikkanBuyurtmaXabarlari(undefined, [fid]),
      kechikkanBuyurtmaXabarlari(undefined, [fid]),
    ]);
    expect(await xabarlar('kechikkan_buyurtma', fid)).toHaveLength(1);
  }, 120_000);

  it('EC-KX-06 · 12.17: kun eslatmasi — yopilish soatidan oldin yo‘q, keyin bugungi kassa bilan', async () => {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${filialId}, 'NAQD', 'SOM', ${`Kunlik naqd ${BELGI}`}, ${XODIM}) RETURNING id`;
    await sql`
      INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
      VALUES (${k[0]?.id ?? 0}, 'K9', 1000, 'SOM', 'sinov', ${Number(BELGI) + 7}, ${XODIM})`;
    const bugun = toshkentKuni();

    // 12:00 — standart yopilish soati (20:00) hali kelmagan
    await kunEslatmaXabarlari(new Date(`${bugun}T12:00:00+05:00`), [filialId]);
    expect(await xabarlar('kun_eslatma', filialId)).toHaveLength(0);

    await kunEslatmaXabarlari(new Date(`${bugun}T21:00:00+05:00`), [filialId]);
    const x = await xabarlar('kun_eslatma', filialId);
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain(`Kunlik naqd ${BELGI} — 1 ta yozuv`);
  }, 120_000);
});
