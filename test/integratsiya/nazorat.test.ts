/**
 * Nazorat — odatdan tashqari amallar. 2026-10-12. Alohida filialda.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kassaStorno } from '@/lib/amal/kassa';
import { kunniYop } from '@/lib/amal/kun-yopish';
import { kirimYarat } from '@/lib/amal/kirim';
import { toshkentKuni } from '@/lib/domain/sana';
import type { Davr } from '@/lib/domain/hisobot/davr';
import { nazoratniGuruhla } from '@/lib/domain/hisobot/nazorat';
import { nazoratHodisalari } from '@/app/(panel)/hisobot/nazorat-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
const KUN = 24 * 60 * 60 * 1000;
let sql: Ulanish;
let filialId = 0;
const davr: Davr = { turi: 'ORALIQ', boshi: new Date(Date.now() - 3 * KUN), oxiri: new Date(Date.now() + KUN) };
const kecha = toshkentKuni(new Date(Date.now() - KUN));

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`Nazorat ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('nazorat — odatdan tashqari amallar', () => {
  it('EC-NAZ-01: toza filialda hodisa yo‘q', async () => {
    expect(await nazoratHodisalari(filialId, davr)).toEqual([]);
  });

  it('EC-NAZ-02: tungi yozuv, storno, kun farqi va orqa sanali kirim topiladi', async () => {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${filialId}, 'NAQD', 'SOM', ${`Naz kassa ${BELGI}`}, ${XODIM}) RETURNING id`;
    const kassaId = k[0]?.id ?? 0;
    // Kecha 23:30 Toshkent vaqti bilan
    const y = await sql<{ id: number }[]>`
      INSERT INTO kassa_yozuv (sana, kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
      VALUES (${`${kecha} 23:30+05`}, ${kassaId}, 'C10', 100000, 'SOM', 'sinov', ${Number(BELGI)}, ${XODIM})
      RETURNING id`;
    await kassaStorno(sql, y[0]?.id ?? 0, 'xato kiritildi', XODIM);
    // Kecha: hisoblangan 100 000, sanaldi 90 000 → farq −10 000
    await kunniYop(sql, { kassaId, sana: kecha, sanaldi: '90000', izoh: 'kam chiqdi' }, XODIM);

    const yet = await sql<{ id: number }[]>`
      INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`Naz yetkazuvchi ${BELGI}`}, ${XODIM}) RETURNING id`;
    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
      VALUES (${`Naz mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
    await kirimYarat(
      sql,
      {
        raqam: `K-NAZ-${BELGI}`,
        sana: toshkentKuni(new Date(Date.now() - 10 * KUN)),
        filialId,
        yetkazibBeruvchiId: yet[0]?.id ?? 0,
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

    const x = nazoratniGuruhla(await nazoratHodisalari(filialId, davr));
    const tur = (t: string) => x.turlar.find((q) => q.turi === t);
    expect(tur('KASSA_STORNO')).toMatchObject({ soni: 1, summa: '100000.00' });
    expect(tur('KASSA_STORNO')?.hodisalar[0]?.tavsif).toBe('xato kiritildi');
    expect(tur('KUN_FARQI')).toMatchObject({ soni: 1, summa: '10000.00' });
    expect(tur('KUN_FARQI')?.hodisalar[0]?.summa).toBe('-10000.00');
    // Tungi yozuv o'zi (storno va farq yozuvi vaqtga qarab qo'shilishi mumkin)
    expect(tur('TUNGI_KASSA')?.hodisalar.some((h) => h.summa === '100000.00')).toBe(true);
    expect(tur('ORQA_SANA_KIRIM')?.soni).toBe(1);
    expect(x.xodimlar).toHaveLength(1);
  });
});
