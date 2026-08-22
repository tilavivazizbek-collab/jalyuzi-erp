/**
 * TZ 13.1 · 13.2 · 13.4 · 13.10 · 13.11 — bot tranzaksiyalari.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  birMartaBajar,
  botKimligi,
  mijozniBogla,
  sessiyaOl,
  sessiyaTozala,
  sessiyaYoz,
  xabarNavbatgaQoy,
  xabarYetmadi,
  xabarYuborildi,
} from '@/lib/amal/bot';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

/** Har yurishda boshqa Telegram raqami — sessiya va bog'lanish toza boshlansin. */
const yangiTelegram = (): number =>
  Number(`9${String(Date.now()).slice(-8)}${String(Math.floor(Math.random() * 90) + 10)}`);

const yangiTelefon = (): string =>
  `9989${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 90) + 10)}`;

beforeAll(() => {
  sql = sinovUlanishi();
}, 120_000);

afterAll(async () => {
  await sql.end();
});

// ─── 13.1 · Kim bu ────────────────────────────────────────────────────────

describe('TZ 13.1 — panel Telegram ID orqali aniqlanadi', () => {
  it("noma'lum odam mijoz paneliga tushadi", async () => {
    const k = await botKimligi(sql, yangiTelegram());
    expect(k.panel).toBe('MIJOZ');
    expect(k.xodimId).toBeNull();
    expect(k.mijozId).toBeNull();
  });

  it('xodim topilsa roli bo\'yicha panel ochiladi', async () => {
    const tg = yangiTelegram();

    // Mavjud xodimga vaqtincha Telegram bog'laymiz
    const x = await sql<{ id: number }[]>`
      SELECT id FROM xodim WHERE faol = true ORDER BY id LIMIT 1`;
    const xodimId = x[0]?.id ?? XODIM;

    const eski = await sql<{ telegram_id: number | null }[]>`
      SELECT telegram_id FROM xodim WHERE id = ${xodimId}`;

    await sql`UPDATE xodim SET telegram_id = ${tg} WHERE id = ${xodimId}`;

    try {
      const k = await botKimligi(sql, tg);
      expect(k.xodimId).toBe(xodimId);
      expect(k.filialId).not.toBeNull();
      // Urug'dagi birinchi xodim — admin
      expect(['ADMIN', 'USTA', 'MIJOZ']).toContain(k.panel);
    } finally {
      await sql`
        UPDATE xodim SET telegram_id = ${eski[0]?.telegram_id ?? null}
        WHERE id = ${xodimId}`;
    }
  });

  it("bog'langan mijoz topiladi", async () => {
    const tg = yangiTelegram();
    const n = await mijozniBogla(
      sql,
      { telegramId: tg, ism: `Bot mijoz ${belgi()}`, telefon: yangiTelefon() },
      XODIM,
    );

    const k = await botKimligi(sql, tg);
    expect(k.panel).toBe('MIJOZ');
    expect(k.mijozId).toBe(n.mijozId);
  });
});

// ─── 13.2 · Ro'yxatdan o'tish ─────────────────────────────────────────────

describe("TZ 13.2 — ro'yxatdan o'tish", () => {
  it('yangi mijoz yaratiladi va audit jurnaliga tushadi', async () => {
    const tg = yangiTelegram();
    const n = await mijozniBogla(
      sql,
      { telegramId: tg, ism: `Yangi ${belgi()}`, telefon: yangiTelefon() },
      XODIM,
    );

    expect(n.yangimi).toBe(true);

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'mijoz' AND obyekt_id = ${n.mijozId}`;
    expect(a[0]?.n).toBe(1);
  });

  it("telefon topilsa MAVJUD mijozga bog'lanadi, yangisi yaratilmaydi", async () => {
    const telefon = yangiTelefon();

    // Sotuvchi allaqachon kiritgan mijoz — Telegramsiz
    const mavjud = await sql<{ id: number }[]>`
      INSERT INTO mijoz (ism, telefon, yaratdi_id)
      VALUES (${`Sotuvchi kiritgan ${belgi()}`}, ${telefon}, ${XODIM})
      RETURNING id`;

    const n = await mijozniBogla(
      sql,
      { telegramId: yangiTelegram(), ism: 'Aziz', telefon },
      XODIM,
    );

    expect(n.yangimi).toBe(false);
    expect(n.mijozId).toBe(mavjud[0]?.id);
  });

  it("13.12 — ISM bo'yicha dublikat botda TEKSHIRILMAYDI", async () => {
    // «Aziz» ikki marta — Telegram ismlari doim takrorlanadi
    const a = await mijozniBogla(
      sql,
      { telegramId: yangiTelegram(), ism: 'Aziz', telefon: yangiTelefon() },
      XODIM,
    );
    const b = await mijozniBogla(
      sql,
      { telegramId: yangiTelegram(), ism: 'Aziz', telefon: yangiTelefon() },
      XODIM,
    );

    expect(a.mijozId).not.toBe(b.mijozId);
    expect(b.yangimi).toBe(true);
  });

  it('bir xil Telegram ikkinchi marta kelsa yangi mijoz yaratilmaydi', async () => {
    const tg = yangiTelegram();
    const a = await mijozniBogla(
      sql,
      { telegramId: tg, ism: 'Takror', telefon: yangiTelefon() },
      XODIM,
    );
    const b = await mijozniBogla(
      sql,
      { telegramId: tg, ism: 'Takror', telefon: yangiTelefon() },
      XODIM,
    );

    expect(b.mijozId).toBe(a.mijozId);
    expect(b.yangimi).toBe(false);
  });

  it("telefon BOSHQA Telegramga bog'langan bo'lsa rad etiladi", async () => {
    const telefon = yangiTelefon();
    await mijozniBogla(
      sql,
      { telegramId: yangiTelegram(), ism: 'Birinchi', telefon },
      XODIM,
    );

    await expect(
      mijozniBogla(
        sql,
        { telegramId: yangiTelegram(), ism: 'Ikkinchi', telefon },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('ism va telefon MAJBURIY', async () => {
    await expect(
      mijozniBogla(
        sql,
        { telegramId: yangiTelegram(), ism: '  ', telefon: yangiTelefon() },
        XODIM,
      ),
    ).rejects.toThrow();

    await expect(
      mijozniBogla(
        sql,
        { telegramId: yangiTelegram(), ism: 'Aziz', telefon: '  ' },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── 13.4 · Suhbat holati ─────────────────────────────────────────────────

describe('TZ 13.4 — bot sessiyasi', () => {
  it("sessiya yo'q bo'lsa BOSH qadam qaytadi", async () => {
    const s = await sessiyaOl(sql, yangiTelegram());
    expect(s.qadam).toBe('BOSH');
    expect(s.holat).toEqual({});
  });

  it('savat saqlanadi va qayta o\'qiladi', async () => {
    const tg = yangiTelegram();

    await sessiyaYoz(
      sql,
      tg,
      {
        qadam: 'SAVAT',
        holat: { savat: [{ turId: 1, eniSm: 210, boyiSm: 140 }] },
      },
      XODIM,
    );

    const s = await sessiyaOl(sql, tg);
    expect(s.qadam).toBe('SAVAT');
    expect(s.holat).toEqual({ savat: [{ turId: 1, eniSm: 210, boyiSm: 140 }] });
  });

  it('bir Telegramga BITTA sessiya — ustidan yoziladi', async () => {
    const tg = yangiTelegram();

    await sessiyaYoz(sql, tg, { qadam: 'ENI', holat: { turId: 1 } }, XODIM);
    await sessiyaYoz(sql, tg, { qadam: 'BOYI', holat: { turId: 1 } }, XODIM);

    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bot_sessiya WHERE telegram_id = ${tg}`;
    expect(n[0]?.n).toBe(1);

    const s = await sessiyaOl(sql, tg);
    expect(s.qadam).toBe('BOYI');
  });

  it("«Bekor qilish» savatni tozalaydi", async () => {
    const tg = yangiTelegram();
    await sessiyaYoz(sql, tg, { qadam: 'SAVAT', holat: { savat: [1, 2] } }, XODIM);

    await sessiyaTozala(sql, tg, XODIM);

    const s = await sessiyaOl(sql, tg);
    expect(s.qadam).toBe('BOSH');
    expect(s.holat).toEqual({});
  });

  it("noma'lum qadam bazada rad etiladi", async () => {
    await expect(
      sql`
        INSERT INTO bot_sessiya (telegram_id, qadam, yaratdi_id)
        VALUES (${yangiTelegram()}, 'QANDAYDIR', ${XODIM})`,
    ).rejects.toThrow();
  });
});

// ─── 13.11 · Xabar navbati ────────────────────────────────────────────────

describe('TZ 13.11 — xabar navbati', () => {
  it('xabar AVVAL yoziladi, keyin yuboriladi', async () => {
    const n = await xabarNavbatgaQoy(
      sql,
      { telegramId: yangiTelegram(), matn: 'Buyurtmangiz tayyor' },
      XODIM,
    );

    const x = await sql<{ holat: string; yuborildi: Date | null }[]>`
      SELECT holat, yuborildi FROM bot_xabar WHERE id = ${n.xabarId}`;
    expect(x[0]?.holat).toBe('NAVBATDA');
    expect(x[0]?.yuborildi).toBeNull();

    await xabarYuborildi(sql, n.xabarId);

    const keyin = await sql<
      { holat: string; yuborildi: Date | null; urinishlar: string }[]
    >`
      SELECT holat, yuborildi, urinishlar::text FROM bot_xabar
      WHERE id = ${n.xabarId}`;
    expect(keyin[0]?.holat).toBe('YUBORILDI');
    expect(keyin[0]?.yuborildi).not.toBeNull();
    expect(Number(keyin[0]?.urinishlar)).toBe(1);
  });

  it('yetib bormagan xabar SABAB bilan qayd etiladi', async () => {
    const n = await xabarNavbatgaQoy(
      sql,
      { telegramId: yangiTelegram(), matn: 'Sinov' },
      XODIM,
    );

    await xabarYetmadi(sql, n.xabarId, 'Foydalanuvchi botni bloklagan');

    const x = await sql<{ holat: string; xato_sabab: string | null }[]>`
      SELECT holat, xato_sabab FROM bot_xabar WHERE id = ${n.xabarId}`;
    expect(x[0]?.holat).toBe('YETMADI');
    expect(x[0]?.xato_sabab).toBe('Foydalanuvchi botni bloklagan');
  });

  it('YETMADI holati sababsiz bazaga tushmaydi', async () => {
    await expect(
      sql`
        INSERT INTO bot_xabar (telegram_id, matn, holat, yaratdi_id)
        VALUES (${yangiTelegram()}, 'Sinov', 'YETMADI', ${XODIM})`,
    ).rejects.toThrow();
  });

  it('6.7 — xabar manbasi bo\'yicha topiladi', async () => {
    const tg = yangiTelegram();
    const manbaId = Math.floor(Math.random() * 1e9);

    await xabarNavbatgaQoy(
      sql,
      {
        telegramId: tg,
        matn: 'Buyurtma tasdiqlandi',
        manbaTuri: 'buyurtma',
        manbaId,
      },
      XODIM,
    );

    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bot_xabar
      WHERE manba_turi = 'buyurtma' AND manba_id = ${manbaId}`;
    expect(x[0]?.n).toBe(1);
  });
});

// ─── 13.10 · Takrorlanishdan himoya ───────────────────────────────────────

describe('TZ 13.10 — bir marta bajariladi', () => {
  it('ikkinchi bosishda amal QAYTA bajarilmaydi', async () => {
    const kalit = `bot:sinov:${belgi()}`;
    let chaqirildi = 0;

    const bir = await birMartaBajar(sql, kalit, () => {
      chaqirildi += 1;
      return Promise.resolve({ buyurtmaId: 1247 });
    });

    const ikki = await birMartaBajar(sql, kalit, () => {
      chaqirildi += 1;
      return Promise.resolve({ buyurtmaId: 9999 });
    });

    expect(chaqirildi).toBe(1);
    expect(bir.takrormi).toBe(false);
    expect(ikki.takrormi).toBe(true);
    // Saqlangan natija qaytadi — yangisi emas
    expect(ikki.natija).toEqual({ buyurtmaId: 1247 });
  });

  it('boshqa kalit — alohida amal', async () => {
    const a = await birMartaBajar(sql, `bot:sinov:${belgi()}`, () =>
      Promise.resolve(1),
    );
    const b = await birMartaBajar(sql, `bot:sinov:${belgi()}`, () =>
      Promise.resolve(2),
    );

    expect(a.takrormi).toBe(false);
    expect(b.takrormi).toBe(false);
    expect(b.natija).toBe(2);
  });

  it('amal yiqilsa kalit YOZILMAYDI — qayta urinish mumkin', async () => {
    const kalit = `bot:xato:${belgi()}`;

    await expect(
      birMartaBajar(sql, kalit, () => Promise.reject(new Error('sinov xatosi'))),
    ).rejects.toThrow();

    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM amal_kaliti WHERE kalit = ${kalit}`;
    expect(n[0]?.n).toBe(0);
  });
});
