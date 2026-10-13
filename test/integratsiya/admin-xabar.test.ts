/**
 * TZ 13.9 — amal paytidagi admin xabarlari. 2026-10-13.
 *
 * 2026-10-13 gacha «Kun yopishda farq» va «Hisobdan chiqarildi» matnlari
 * yozilgan, lekin hech qayerdan chaqirilmasdi — admin kamomad va brak
 * haqida bilmasdi. Bu test ikkalasi navbatga tushishini qotiradi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kunniYop } from '@/lib/amal/kun-yopish';
import { kirimYarat } from '@/lib/amal/kirim';
import { hisobdanChiqar } from '@/lib/amal/hisobdan';
import { adminlarniOgohlantir } from '@/lib/amal/bildirishnoma';
import { toshkentKuni } from '@/lib/domain/sana';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
const KUN = 24 * 60 * 60 * 1000;
let sql: Ulanish;
let filialId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Admin xabar ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
  const x = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, telegram_id, yaratdi_id)
    VALUES (${filialId}, ${`Xabar admin ${BELGI}`}, ${`9982${BELGI}1`}, ${Number(`6${BELGI}01`)}, ${XODIM})
    RETURNING id`;
  await sql`INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id) VALUES (${x[0]?.id ?? 0}, ${rol[0]?.id ?? 0}, ${XODIM})`;
}, 60_000);

/** Bosh filial admini — EC-AX-04 da yaratiladi, oxirida o'chiriladi */
let boshAdminId: number | null = null;

afterAll(async () => {
  // ⚠️ Qoldirilsa keyingi test fayllaridagi «xabar 0 ta» kutilmalari buziladi
  if (boshAdminId !== null) {
    await sql`UPDATE xodim SET telegram_id = NULL, faol = false WHERE id = ${boshAdminId}`;
  }
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 13.9 — amal paytidagi admin xabarlari', () => {
  it('EC-AX-01: kun yopishda farq — adminga xabar (kamomad summasi bilan)', async () => {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${filialId}, 'NAQD', 'SOM', ${`AX kassa ${BELGI}`}, ${XODIM}) RETURNING id`;
    const kassaId = k[0]?.id ?? 0;
    const kecha = toshkentKuni(new Date(Date.now() - KUN));
    await sql`
      INSERT INTO kassa_yozuv (sana, kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
      VALUES (${`${kecha} 12:00+05`}, ${kassaId}, 'K9', 200000, 'SOM', 'sinov', ${Number(BELGI)}, ${XODIM})`;
    const { kunId } = await kunniYop(sql, { kassaId, sana: kecha, sanaldi: '150000', izoh: 'kam' }, XODIM);

    const x = await sql<{ matn: string }[]>`
      SELECT matn FROM bot_xabar WHERE manba_turi = 'kassa_kun' AND manba_id = ${kunId}`;
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain('KUN YOPISHDA FARQ');
    expect(x[0]?.matn).toMatch(/Farq: .50.000 so'm/);
  });

  it('EC-AX-02: farqsiz kun yopish — xabar yo‘q', async () => {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${filialId}, 'NAQD', 'USD', ${`AX dollar ${BELGI}`}, ${XODIM}) RETURNING id`;
    const { kunId } = await kunniYop(
      sql,
      { kassaId: k[0]?.id ?? 0, sana: toshkentKuni(new Date(Date.now() - KUN)), sanaldi: '0', izoh: null },
      XODIM,
    );
    const x = await sql`SELECT 1 FROM bot_xabar WHERE manba_turi = 'kassa_kun' AND manba_id = ${kunId}`;
    expect(x).toHaveLength(0);
  });

  it('EC-AX-03: hisobdan chiqarish — adminga xabar (zarar bilan)', async () => {
    const y = await sql<{ id: number }[]>`
      INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`AX yetkazuvchi ${BELGI}`}, ${XODIM}) RETURNING id`;
    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
      VALUES (${`AX_mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
    const { kirimId } = await kirimYarat(
      sql,
      {
        raqam: `K-AX-${BELGI}`,
        sana: toshkentKuni(),
        filialId,
        yetkazibBeruvchiId: y[0]?.id ?? 0,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
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
    const b = await sql<{ id: number }[]>`
      SELECT b.id FROM bolak b JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
      WHERE kq.kirim_id = ${kirimId} LIMIT 1`;
    const { harakatId } = await hisobdanChiqar(
      sql,
      { bolakId: b[0]?.id ?? 0, sabab: 'SUV_KETDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    const x = await sql<{ matn: string }[]>`
      SELECT matn FROM bot_xabar WHERE manba_turi = 'ombor_harakat' AND manba_id = ${harakatId}`;
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain('HISOBDAN CHIQARILDI');
    // Material nomidagi «_» ekranlangan — Telegram xabarni rad etmaydi
    expect(x[0]?.matn).toContain(String.raw`AX\_mato`);
    expect(x[0]?.matn).toMatch(/Zarar: .+ so'm/);
  });

  it('EC-AX-04: TZ 20.14.3 — bosh admin boshqa filial xabarini ham oladi, filial nomi bilan', async () => {
    const bosh = await sql<{ id: number }[]>`SELECT id FROM filial WHERE bosh LIMIT 1`;
    const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
    const b = await sql<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, telegram_id, yaratdi_id)
      VALUES (${bosh[0]?.id ?? 0}, ${`Bosh admin ${BELGI}`}, ${`9982${BELGI}9`}, ${Number(`6${BELGI}09`)}, ${XODIM})
      RETURNING id`;
    boshAdminId = b[0]?.id ?? null;
    await sql`INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id) VALUES (${boshAdminId}, ${rol[0]?.id ?? 0}, ${XODIM})`;

    // Alohida filial — bitta filialda bitta NAQD SOM kassa (kassa_filial_bitta)
    const f2 = await sql<{ id: number }[]>`
      INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
      VALUES (${`AX ikkinchi ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${f2[0]?.id ?? 0}, 'NAQD', 'SOM', ${`AX bosh ${BELGI}`}, ${XODIM}) RETURNING id`;
    const kecha = toshkentKuni(new Date(Date.now() - KUN));
    await sql`
      INSERT INTO kassa_yozuv (sana, kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
      VALUES (${`${kecha} 12:00+05`}, ${k[0]?.id ?? 0}, 'K9', 1000, 'SOM', 'sinov', ${Number(BELGI) + 1}, ${XODIM})`;
    const { kunId } = await kunniYop(sql, { kassaId: k[0]?.id ?? 0, sana: kecha, sanaldi: '900', izoh: 'kam' }, XODIM);

    const x = await sql<{ xodim_id: number; matn: string }[]>`
      SELECT xodim_id, matn FROM bot_xabar WHERE manba_turi = 'kassa_kun' AND manba_id = ${kunId}`;
    // Ikkinchi filialning o'z Telegramli admini yo'q — xabarni faqat bosh admin oladi
    expect(x).toHaveLength(1);
    expect(x[0]?.xodim_id).toBe(boshAdminId);
    expect(x[0]?.matn.startsWith(`🏢 AX ikkinchi ${BELGI}\n`)).toBe(true);
  });

  it('EC-AX-05: tugmali xabar — bosh adminga TUGMASIZ nusxa, o‘z adminiga tugmali', async () => {
    const manbaId = Number(BELGI);
    const { yozildi } = await adminlarniOgohlantir(
      sql,
      { filialId, hodisa: 'PUL_TOPSHIRILDI', matn: 'Sinov topshiriq', manbaTuri: 'topshiriq', manbaId },
      XODIM,
    );
    expect(yozildi).toBe(2);
    const x = await sql<{ xodim_id: number; manba_turi: string; matn: string }[]>`
      SELECT xodim_id, manba_turi, matn FROM bot_xabar
      WHERE manba_id = ${manbaId} AND manba_turi IN ('topshiriq', 'topshiriq_nusxa')`;
    const bosh = x.find((q) => q.xodim_id === boshAdminId);
    const oz = x.find((q) => q.xodim_id !== boshAdminId);
    expect(oz?.manba_turi).toBe('topshiriq');
    expect(oz?.matn).not.toContain('filial adminida');
    expect(bosh?.manba_turi).toBe('topshiriq_nusxa');
    expect(bosh?.matn).toContain('Tasdiqlash — filial adminida');
  });

  it('EC-AX-06: kirimda ustama chegaradan past — adminga BITTA xabar', async () => {
    const y = await sql<{ id: number }[]>`
      INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`AX ustama ${BELGI}`}, ${XODIM}) RETURNING id`;
    // Tannarx 1000/m ÷ 3 m = 333 so'm/kv.m; sotuv 300 — ustama manfiy
    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, sotuv_narx, yaratdi_id)
      VALUES (${`AX arzon ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', '300', ${XODIM}) RETURNING id`;
    const { kirimId, ogohlantirishlar } = await kirimYarat(
      sql,
      {
        raqam: `K-AXU-${BELGI}`,
        sana: toshkentKuni(),
        filialId,
        yetkazibBeruvchiId: y[0]?.id ?? 0,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
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
    expect(ogohlantirishlar.length).toBeGreaterThan(0);
    const x = await sql<{ matn: string }[]>`
      SELECT matn FROM bot_xabar WHERE manba_turi = 'kirim' AND manba_id = ${kirimId} AND xodim_id <> ${boshAdminId ?? 0}`;
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain('USTAMA CHEGARADAN PAST');
    expect(x[0]?.matn).toContain(`AX arzon ${BELGI}`);
  });
});
