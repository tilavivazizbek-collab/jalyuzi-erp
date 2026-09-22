/**
 * TO'G'RIDAN-TO'G'RI SOTISHDA MIJOZ TURI NARXI — TZ 5.4 · 6.2 (2026-09-22)
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    Mijoz turi narxi (`material_tur_narx`) uch joyda qo'llanardi:
 *    slotdagi matoga, aksessuarga va bot katalogiga. Panelda
 *    ALOHIDA sotilgan buyumga esa qo'llanmasdi — so'rov bu
 *    jadvalga umuman qaramasdi.
 *
 *    Natija: optomchi mexanizmni tayyor jalyuzi tarkibida olsa
 *    optom narxda, o'shani alohida olsa chakana narxda olardi.
 *    Bir xil buyum, ikki xil narx — qaysi oynadan sotilganiga
 *    qarab. Bu chegirma emas, xato.
 *
 * ⚠️ Test SO'ROVNI tekshiradi: ekran narxni shu xaritadan oladi,
 *    xarita bo'sh bo'lsa hech narsa qo'llanmaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { qoshimchaMateriallar } from '@/app/(panel)/buyurtma/yangi/malumot';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let materialId = 0;
let sotilmaydiganId = 0;
let optomTuriId = 0;

const FILIAL = 1;
const XODIM = 1;
const belgi = String(Date.now());

const CHAKANA = '30000.00';
const OPTOM = '22000.00';

beforeAll(async () => {
  sql = sinovUlanishi();

  const t = await sql<{ id: number }[]>`
    INSERT INTO mijoz_turi (nom, yaratdi_id)
    VALUES (${`QTN optom ${belgi}`}, ${XODIM}) RETURNING id`;
  optomTuriId = t[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          sotuv_narx, sotuv_valyuta, togridan_sotiladi,
                          yaratdi_id)
    VALUES (${`QTN mexanizm ${belgi}`}, 'DONA', 'dona', 'DONA',
            ${CHAKANA}, 'SOM', true, ${XODIM})
    RETURNING id`;
  materialId = m[0]?.id ?? 0;

  /** ⚠️ Belgisi YO'Q material — ro'yxatga umuman tushmasligi kerak */
  const s = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          sotuv_narx, sotuv_valyuta, togridan_sotiladi,
                          yaratdi_id)
    VALUES (${`QTN ichki ${belgi}`}, 'DONA', 'dona', 'DONA',
            ${CHAKANA}, 'SOM', false, ${XODIM})
    RETURNING id`;
  sotilmaydiganId = s[0]?.id ?? 0;

  await sql`
    INSERT INTO material_tur_narx (material_id, mijoz_turi_id, sotuv_narx,
                                   valyuta, yaratdi_id)
    VALUES (${materialId}, ${optomTuriId}, ${OPTOM}, 'SOM', ${XODIM})`;
}, 120_000);

afterAll(async () => {
  /** ⚠️ O'chirilmaydi — nofaol qilinadi (2.1-invariant) */
  await sql`UPDATE material SET faol = false WHERE nom LIKE ${`QTN %${belgi}`}`;
  await sql`UPDATE mijoz_turi SET faol = false WHERE nom LIKE ${`QTN %${belgi}`}`;
  await sql.end({ timeout: 5 });
});

describe('TZ 6.2 — alohida sotilgan buyumga tur narxi qo‘llanadi', () => {
  it('ro‘yxatda tur narxi xaritasi bor', async () => {
    const r = await qoshimchaMateriallar(FILIAL);
    const q = r.find((x) => x.id === materialId);

    expect(q).toBeDefined();
    expect(q?.turNarxlari[optomTuriId]).toEqual({ narx: OPTOM, valyuta: 'SOM' });
  }, 120_000);

  it('standart narx ham o‘z joyida qoladi — mijozsiz sotuv chakana', async () => {
    const r = await qoshimchaMateriallar(FILIAL);
    const q = r.find((x) => x.id === materialId);

    expect(q?.narx).toBe(CHAKANA);
  }, 120_000);

  it('narxi qo‘yilmagan tur xaritaga TUSHMAYDI — ekran chakanani oladi', async () => {
    const boshqa = await sql<{ id: number }[]>`
      INSERT INTO mijoz_turi (nom, yaratdi_id)
      VALUES (${`QTN chakana ${belgi}`}, ${XODIM}) RETURNING id`;

    const r = await qoshimchaMateriallar(FILIAL);
    const q = r.find((x) => x.id === materialId);

    expect(q?.turNarxlari[boshqa[0]?.id ?? 0]).toBeUndefined();
  }, 120_000);

  it('«to‘g‘ridan sotilmaydi» material ro‘yxatga umuman tushmaydi', async () => {
    const r = await qoshimchaMateriallar(FILIAL);

    expect(r.find((x) => x.id === sotilmaydiganId)).toBeUndefined();
  }, 120_000);
});
