/**
 * TZ 13.9 · 13.6 · 13.11 — bildirishnoma navbati bazada.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  adminlarniOgohlantir,
  mijozniOgohlantir,
  xabarniQaytaYubor,
  yetmaganXabarlar,
} from '@/lib/amal/bildirishnoma';
import { xabarYetmadi } from '@/lib/amal/bot';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let filialId = 0;
let adminId = 0;

const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

const yangiTelegram = (): number =>
  Number(`8${String(Date.now()).slice(-8)}${String(Math.floor(Math.random() * 90) + 10)}`);

beforeAll(async () => {
  sql = sinovUlanishi();

  // Har yurishda YANGI filial — boshqa testlarning adminlari aralashmasin
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id)
    VALUES (${`Xabar filiali ${belgi()}`}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;

  const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;

  const x = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, telegram_id, yaratdi_id)
    VALUES (${filialId}, ${`Xabar admin ${belgi()}`},
            ${`9985${String(Date.now()).slice(-6)}`}, ${yangiTelegram()}, ${XODIM})
    RETURNING id`;
  adminId = x[0]?.id ?? 0;

  await sql`
    INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
    VALUES (${adminId}, ${rol[0]?.id ?? 0}, ${XODIM})`;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

// ─── 13.9 · Adminga xabar ─────────────────────────────────────────────────

describe('TZ 13.9 — admin bildirishnomasi', () => {
  it('filial adminiga navbatga qo‘yiladi', async () => {
    const manbaId = Math.floor(Math.random() * 1e9);

    const n = await adminlarniOgohlantir(
      sql,
      {
        filialId,
        hodisa: 'QAYTA_KESISH_SOROVI',
        matn: 'Sinov xabari',
        manbaTuri: 'qayta_kesish',
        manbaId,
      },
      XODIM,
    );

    expect(n.yozildi).toBe(1);

    const x = await sql<{ holat: string; xodim_id: number | null }[]>`
      SELECT holat, xodim_id FROM bot_xabar
      WHERE manba_turi = 'qayta_kesish' AND manba_id = ${manbaId}`;

    expect(x).toHaveLength(1);
    expect(x[0]?.holat).toBe('NAVBATDA');
    expect(x[0]?.xodim_id).toBe(adminId);
  });

  it('Q-25 — BOSHQA filial adminiga xabar ketmaydi', async () => {
    const boshqa = await sql<{ id: number }[]>`
      INSERT INTO filial (nom, yaratdi_id)
      VALUES (${`Begona filial ${belgi()}`}, ${XODIM}) RETURNING id`;

    const n = await adminlarniOgohlantir(
      sql,
      { filialId: boshqa[0]?.id ?? 0, hodisa: 'KAM_QOLDIQ', matn: 'Sinov' },
      XODIM,
    );

    expect(n.yozildi).toBe(0);
  });

  it('Telegrami ULANMAGAN admin ro‘yxatga tushmaydi', async () => {
    const f = await sql<{ id: number }[]>`
      INSERT INTO filial (nom, yaratdi_id)
      VALUES (${`Telegramsiz ${belgi()}`}, ${XODIM}) RETURNING id`;
    const yangiFilial = f[0]?.id ?? 0;

    const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
    const x = await sql<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
      VALUES (${yangiFilial}, ${`Telegramsiz admin ${belgi()}`},
              ${`9984${String(Date.now()).slice(-6)}`}, ${XODIM})
      RETURNING id`;
    await sql`
      INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
      VALUES (${x[0]?.id ?? 0}, ${rol[0]?.id ?? 0}, ${XODIM})`;

    const n = await adminlarniOgohlantir(
      sql,
      { filialId: yangiFilial, hodisa: 'KAM_QOLDIQ', matn: 'Sinov' },
      XODIM,
    );

    // Telegramsiz odamga yuborib bo'lmaydi — sayt baribir ko'rsatadi
    expect(n.yozildi).toBe(0);
  });
});

// ─── 13.6 · Mijozga xabar ─────────────────────────────────────────────────

describe('TZ 13.6 — mijoz bildirishnomasi', () => {
  it('Telegrami bor mijozga yoziladi', async () => {
    const m = await sql<{ id: number }[]>`
      INSERT INTO mijoz (ism, telefon, telegram_id, yaratdi_id)
      VALUES (${`Xabar mijoz ${belgi()}`},
              ${`9983${String(Date.now()).slice(-6)}`},
              ${yangiTelegram()}, ${XODIM})
      RETURNING id`;

    const n = await mijozniOgohlantir(
      sql,
      { mijozId: m[0]?.id ?? 0, matn: 'Buyurtmangiz tayyor' },
      XODIM,
    );

    expect(n.yozildi).toBe(true);
  });

  it('Telegrami YO‘Q mijozga xabar yozilmaydi', async () => {
    const m = await sql<{ id: number }[]>`
      INSERT INTO mijoz (ism, telefon, yaratdi_id)
      VALUES (${`Botsiz mijoz ${belgi()}`},
              ${`9982${String(Date.now()).slice(-6)}`}, ${XODIM})
      RETURNING id`;

    const n = await mijozniOgohlantir(
      sql,
      { mijozId: m[0]?.id ?? 0, matn: 'Sinov' },
      XODIM,
    );

    // Sotuvchi telefon qiladi (13.11)
    expect(n.yozildi).toBe(false);
  });
});

// ─── 13.11 · Yetib bormagan xabar ─────────────────────────────────────────

describe('TZ 13.11 · 6.7 — yetmagan xabar yo‘qolmaydi', () => {
  it('sabab bilan qoladi va manba bo‘yicha topiladi', async () => {
    const manbaId = Math.floor(Math.random() * 1e9);

    await adminlarniOgohlantir(
      sql,
      {
        filialId,
        hodisa: 'HISOBDAN_CHIQARILDI',
        matn: 'Sinov',
        manbaTuri: 'buyurtma',
        manbaId,
      },
      XODIM,
    );

    const yozilgan = await sql<{ id: number }[]>`
      SELECT id FROM bot_xabar
      WHERE manba_turi = 'buyurtma' AND manba_id = ${manbaId}`;

    await xabarYetmadi(sql, yozilgan[0]?.id ?? 0, 'Foydalanuvchi botni bloklagan');

    const yetmagan = await yetmaganXabarlar(sql, {
      manbaTuri: 'buyurtma',
      manbaId,
    });

    expect(yetmagan).toHaveLength(1);
    expect(yetmagan[0]?.sabab).toBe('Foydalanuvchi botni bloklagan');
    expect(yetmagan[0]?.urinishlar).toBe(1);
  });

  it('«qayta yuborish» navbatga qaytaradi, urinishlar SAQLANADI', async () => {
    const manbaId = Math.floor(Math.random() * 1e9);

    await adminlarniOgohlantir(
      sql,
      { filialId, hodisa: 'KAM_QOLDIQ', matn: 'Sinov', manbaTuri: 'material', manbaId },
      XODIM,
    );

    const y = await sql<{ id: number }[]>`
      SELECT id FROM bot_xabar
      WHERE manba_turi = 'material' AND manba_id = ${manbaId}`;
    const xabarId = y[0]?.id ?? 0;

    await xabarYetmadi(sql, xabarId, 'Tarmoq uzildi');
    await xabarniQaytaYubor(sql, xabarId);

    const x = await sql<
      { holat: string; urinishlar: string; xato_sabab: string | null }[]
    >`
      SELECT holat, urinishlar::text, xato_sabab FROM bot_xabar
      WHERE id = ${xabarId}`;

    expect(x[0]?.holat).toBe('NAVBATDA');
    // Urinishlar soni saqlanadi — necha marta urinilgani ko'rinsin
    expect(Number(x[0]?.urinishlar)).toBe(1);
    // Oldingi sabab ham tarixda qoladi
    expect(x[0]?.xato_sabab).toBe('Tarmoq uzildi');
  });

  it('yetmagan xabar yo‘q bo‘lsa ro‘yxat bo‘sh', async () => {
    const y = await yetmaganXabarlar(sql, {
      manbaTuri: 'yoq',
      manbaId: 999_999_999,
    });
    expect(y).toHaveLength(0);
  });
});
