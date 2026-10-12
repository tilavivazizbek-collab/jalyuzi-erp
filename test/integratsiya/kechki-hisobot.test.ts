/**
 * Kechki hisobot — navbatga qo'yish. 2026-10-12.
 * Vaqt `hozir` bilan beriladi: soat o'tgan / o'tmagan filial aniq ajraladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { toshkentKuni } from '@/lib/domain/sana';
import { kechkiHisobotlarniNavbatgaQoy } from '@/app/(panel)/hisobot/kechki-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let erta = 0;
let kech = 0;
const hozir = new Date(`${toshkentKuni()}T08:00:00+05:00`);
let tg = 0;
const yangiTelegram = (): number => {
  tg += 1;
  return Number(`7${BELGI}${String(tg).padStart(3, '0')}`);
};

async function filialAdmin(nom: string, soat: string): Promise<number> {
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, kassa_yopilish_soati, yaratdi_id)
    VALUES (${nom}, true, true, false, ${soat}, ${XODIM}) RETURNING id`;
  const id = f[0]?.id ?? 0;
  const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
  const x = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, telegram_id, yaratdi_id)
    VALUES (${id}, ${`Kechki admin ${nom}`}, ${`9983${BELGI}${String(tg)}`}, ${yangiTelegram()}, ${XODIM})
    RETURNING id`;
  await sql`INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id) VALUES (${x[0]?.id ?? 0}, ${rol[0]?.id ?? 0}, ${XODIM})`;
  return id;
}

const xabarlar = (filialId: number) =>
  sql<{ matn: string }[]>`
    SELECT matn FROM bot_xabar WHERE manba_turi = 'kechki_hisobot' AND manba_id = ${filialId}`;

beforeAll(async () => {
  sql = sinovUlanishi();
  erta = await filialAdmin(`Kechki erta ${BELGI}`, '00:00');
  kech = await filialAdmin(`Kechki kech ${BELGI}`, '12:00');
  const k = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${erta}, 'NAQD', 'SOM', ${`Kechki kassa ${BELGI}`}, ${XODIM}) RETURNING id`;
  await sql`
    INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id, xodim_id)
    VALUES (${k[0]?.id ?? 0}, 'K1', 250000, 'SOM', 'sinov', ${Number(BELGI)}, ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('kechki hisobot', () => {
  it('EC-KECH-01: soati o‘tgan filial adminiga yoziladi, o‘tmaganiga — yo‘q', async () => {
    await kechkiHisobotlarniNavbatgaQoy(hozir);
    const e = await xabarlar(erta);
    expect(e).toHaveLength(1);
    expect(e[0]?.matn).toContain(`Kun yakuni`);
    expect(e[0]?.matn).toContain(`Kechki erta ${BELGI}`);
    expect(e[0]?.matn).toMatch(/Mijozlardan tushdi: 250.000 so'm/);
    expect(e[0]?.matn).toMatch(/Kassalarda: 250.000 so'm/);
    expect(await xabarlar(kech)).toHaveLength(0);
  }, 120_000);

  it('EC-KECH-02: qayta chaqiruv ikkinchi xabar yozmaydi', async () => {
    await kechkiHisobotlarniNavbatgaQoy(hozir);
    expect(await xabarlar(erta)).toHaveLength(1);
  }, 120_000);
});
