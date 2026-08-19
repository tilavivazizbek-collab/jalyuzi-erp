/**
 * TZ 7.3 · 7.6 · QISM 1 §7.2 · QISM 3 §3.2.1 · Q-06
 *
 * Band qilish tranzaksiyasi — `FOR UPDATE SKIP LOCKED`.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  BAND_MUDDATI_KUN,
  bandniBoshat,
  mosOstatkaBormi,
  muddatiOtganBandlarniBoshat,
  pozitsiyaniBandQil,
  type SlotSorovi,
} from '@/lib/amal/band';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId: number;
let ikkinchiMatoId: number;

const FILIAL = 1;
const XODIM = 1;

/** Sinov pozitsiyalari haqiqiy yozuvlar bilan to'qnashmasligi uchun. */
let pozitsiya = 700_000;
const yangiPozitsiya = (): number => {
  pozitsiya += 1;
  return pozitsiya;
};

beforeAll(async () => {
  sql = sinovUlanishi();

  const yarat = async (nom: string): Promise<number> => {
    const q = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${nom}, 'RULON', 'rulon', 'KV_M', ${XODIM}) RETURNING id`;
    return q[0]?.id ?? 0;
  };

  matoId = await yarat(`Band sinov matosi ${String(Date.now())}`);
  ikkinchiMatoId = await yarat(`Band sinov matosi 2 ${String(Date.now())}`);
}, 60_000);

afterAll(async () => {
  await sql.end();
});

let kodHisoblagich = 0;
async function bolakYarat(
  materialId: number,
  turi: 'RULON' | 'OSTATKA',
  eni: number,
  boyi: number,
): Promise<number> {
  kodHisoblagich += 1;
  const kod = `${turi === 'RULON' ? 'R' : 'O'}-BAND-${String(Date.now())}-${String(kodHisoblagich)}`;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${kod}, ${turi}, ${eni}, ${boyi}, 78000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/** Har test o'z materialidan foydalanadi — oldingi bo'laklar xalaqit bermasin */
async function tozala(materialId: number): Promise<void> {
  await sql`
    UPDATE band SET holat = 'BOSHATILDI', boshatish_sabab = 'BEKOR', boshatildi = now()
    WHERE holat = 'FAOL' AND bolak_id IN (SELECT id FROM bolak WHERE material_id = ${materialId})`;
  await sql`UPDATE bolak SET faol = false WHERE material_id = ${materialId}`;
}

const slot = (materialId: number, eniM: number, boyiM: number, majburiy = true): SlotSorovi => ({
  pozitsiyaMaterialId: yangiPozitsiya(),
  materialId,
  kerak: { eniM, boyiM },
  majburiy,
});

// ─── TZ 7.3 · Asosiy oqim ─────────────────────────────────────────────────

describe('TZ 7.3 — mos bo\'lak topiladi va band qilinadi', () => {
  beforeEach(async () => {
    await tozala(matoId);
  });

  it("bo'lak topiladi, holati BAND ga o'tadi", async () => {
    const bolakId = await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();

    const n = await pozitsiyaniBandQil(sql, p, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM);

    expect(n.holat).toBe('BAND_QILINDI');
    if (n.holat === 'BAND_QILINDI') {
      expect(n.bandlar).toHaveLength(1);
      expect(n.bandlar[0]?.bolakId).toBe(bolakId);
      expect(n.bandlar[0]?.manba).toBe('RULON');
    }

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BAND');
  });

  it('TZ 7.6, 5-qadam — OSTATKA rulondan oldin tanlanadi', async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const ostatka = await bolakYarat(matoId, 'OSTATKA', 1.5, 2.5);

    const n = await pozitsiyaniBandQil(
      sql,
      yangiPozitsiya(),
      FILIAL,
      [slot(matoId, 1.2, 2.0)],
      XODIM,
    );

    expect(n.holat).toBe('BAND_QILINDI');
    if (n.holat === 'BAND_QILINDI') {
      expect(n.bandlar[0]?.bolakId).toBe(ostatka);
      expect(n.bandlar[0]?.manba).toBe('OSTATKA');
    }
  });

  it('TZ 7.6, 6-qadam — eng kam chiqindi qoldiradigani', async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const tor = await bolakYarat(matoId, 'RULON', 2.0, 30.0);

    const n = await pozitsiyaniBandQil(
      sql,
      yangiPozitsiya(),
      FILIAL,
      [slot(matoId, 1.4, 2.0)],
      XODIM,
    );

    if (n.holat === 'BAND_QILINDI') expect(n.bandlar[0]?.bolakId).toBe(tor);
  });

  it("band muddati 30 kun (7.3)", async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();
    const hozir = new Date('2026-08-20T10:00:00+05:00');

    await pozitsiyaniBandQil(sql, p, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM, hozir);

    const q = await sql<{ amal_qiladi: Date }[]>`
      SELECT amal_qiladi FROM band WHERE buyurtma_pozitsiya_id = ${p}`;
    const kutilgan = new Date(hozir.getTime() + BAND_MUDDATI_KUN * 86_400_000);
    expect(q[0]?.amal_qiladi.getTime()).toBe(kutilgan.getTime());
  });

  it("TZ 7.6, 7-qadam — sig'maydigan o'lchamda MATERIAL_YOQ", async () => {
    await bolakYarat(matoId, 'OSTATKA', 0.5, 1.0);

    const n = await pozitsiyaniBandQil(
      sql,
      yangiPozitsiya(),
      FILIAL,
      [slot(matoId, 2.0, 3.0)],
      XODIM,
    );
    expect(n.holat).toBe('MATERIAL_YOQ');
  });

  it('bo\'sh omborda ham MATERIAL_YOQ', async () => {
    const n = await pozitsiyaniBandQil(
      sql,
      yangiPozitsiya(),
      FILIAL,
      [slot(matoId, 1.0, 1.0)],
      XODIM,
    );
    expect(n.holat).toBe('MATERIAL_YOQ');
  });
});

// ─── QISM 3 §3.2.1 · Yarim band qolmasin ──────────────────────────────────

describe('QISM 3 §3.2.1 — YARIM BAND QOLMAYDI', () => {
  beforeEach(async () => {
    await tozala(matoId);
    await tozala(ikkinchiMatoId);
  });

  it("bitta slot topilmasa TOPILGANI HAM bo'shatiladi", async () => {
    // Birinchi materialdan bor, ikkinchisidan yo'q
    const bor = await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();

    const n = await pozitsiyaniBandQil(
      sql,
      p,
      FILIAL,
      [slot(matoId, 1.2, 2.0), slot(ikkinchiMatoId, 1.2, 2.0)],
      XODIM,
    );

    expect(n.holat).toBe('MATERIAL_YOQ');

    // Birinchi bo'lak band bo'lib QOLMASLIGI kerak
    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bor}`;
    expect(b[0]?.holat).toBe('BOSH');

    const bandlar = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band WHERE buyurtma_pozitsiya_id = ${p}`;
    expect(bandlar[0]?.n).toBe(0);
  });

  it("ikkala slot ham topilsa ikkalasi band qilinadi", async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    await bolakYarat(ikkinchiMatoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();

    const n = await pozitsiyaniBandQil(
      sql,
      p,
      FILIAL,
      [slot(matoId, 1.2, 2.0), slot(ikkinchiMatoId, 1.2, 2.0)],
      XODIM,
    );

    expect(n.holat).toBe('BAND_QILINDI');
    if (n.holat === 'BAND_QILINDI') expect(n.bandlar).toHaveLength(2);
  });

  it('aksessuar uchun band qo\'yilmaydi (§3.2.1)', async () => {
    const n = await pozitsiyaniBandQil(
      sql,
      yangiPozitsiya(),
      FILIAL,
      [slot(matoId, 1.0, 1.0, false)],
      XODIM,
    );
    expect(n.holat).toBe('BAND_QILINDI');
    if (n.holat === 'BAND_QILINDI') expect(n.bandlar).toEqual([]);
  });
});

// ─── QISM 1 §7.2 · SKIP LOCKED ────────────────────────────────────────────

describe('QISM 1 §7.2 — ikki usta bir vaqtda', () => {
  beforeEach(async () => {
    await tozala(matoId);
  });

  it("bitta bo'lak bo'lsa — biri oladi, ikkinchisiga MATERIAL_YOQ", async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);

    const [a, b] = await Promise.all([
      pozitsiyaniBandQil(sql, yangiPozitsiya(), FILIAL, [slot(matoId, 1.2, 2.0)], XODIM),
      pozitsiyaniBandQil(sql, yangiPozitsiya(), FILIAL, [slot(matoId, 1.2, 2.0)], XODIM),
    ]);

    const holatlar = [a.holat, b.holat].sort();
    expect(holatlar).toEqual(['BAND_QILINDI', 'MATERIAL_YOQ']);
  });

  it("ikki bo'lak bo'lsa — IKKALASI ham oladi, hech kim kutmaydi", async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);

    const [a, b] = await Promise.all([
      pozitsiyaniBandQil(sql, yangiPozitsiya(), FILIAL, [slot(matoId, 1.2, 2.0)], XODIM),
      pozitsiyaniBandQil(sql, yangiPozitsiya(), FILIAL, [slot(matoId, 1.2, 2.0)], XODIM),
    ]);

    expect(a.holat).toBe('BAND_QILINDI');
    expect(b.holat).toBe('BAND_QILINDI');

    // Har biri BOSHQA bo'lakni olgan
    if (a.holat === 'BAND_QILINDI' && b.holat === 'BAND_QILINDI') {
      expect(a.bandlar[0]?.bolakId).not.toBe(b.bandlar[0]?.bolakId);
    }
  });
});

// ─── Q-06 · Bo'shatish ────────────────────────────────────────────────────

describe("Q-06 — bandni bo'shatish", () => {
  beforeEach(async () => {
    await tozala(matoId);
  });

  it("bo'shatilgach bo'lak yana BOSH bo'ladi", async () => {
    const bolakId = await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();
    await pozitsiyaniBandQil(sql, p, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM);

    const soni = await bandniBoshat(sql, p, 'IFLOS', XODIM, 'Rulon uchi iflos');
    expect(soni).toBe(1);

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
  });

  it('sabab va izoh jurnalda qoladi', async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();
    await pozitsiyaniBandQil(sql, p, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM);
    await bandniBoshat(sql, p, 'RANG', XODIM, 'Rangi mos kelmadi');

    const q = await sql<{ holat: string; boshatish_sabab: string; boshatish_izoh: string }[]>`
      SELECT holat, boshatish_sabab, boshatish_izoh FROM band
      WHERE buyurtma_pozitsiya_id = ${p}`;
    expect(q[0]?.holat).toBe('BOSHATILDI');
    expect(q[0]?.boshatish_sabab).toBe('RANG');
    expect(q[0]?.boshatish_izoh).toBe('Rangi mos kelmadi');
  });

  it("bo'shatilgan bo'lakni boshqa pozitsiya olishi mumkin", async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const birinchi = yangiPozitsiya();
    await pozitsiyaniBandQil(sql, birinchi, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM);
    await bandniBoshat(sql, birinchi, 'TOPILMADI', XODIM);

    const n = await pozitsiyaniBandQil(
      sql,
      yangiPozitsiya(),
      FILIAL,
      [slot(matoId, 1.2, 2.0)],
      XODIM,
    );
    expect(n.holat).toBe('BAND_QILINDI');
  });

  it("bandi yo'q pozitsiyada 0 qaytadi", async () => {
    expect(await bandniBoshat(sql, yangiPozitsiya(), 'BEKOR', XODIM)).toBe(0);
  });
});

// ─── TZ 7.3 · Muddat o'tganda ─────────────────────────────────────────────

describe("TZ 7.3 — 30 kundan oshgan band avtomatik bo'shaydi", () => {
  beforeEach(async () => {
    await tozala(matoId);
  });

  it("muddati o'tgan band bo'shatiladi, bo'lak qaytadi", async () => {
    const bolakId = await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();
    const eski = new Date('2026-01-01T10:00:00+05:00');

    await pozitsiyaniBandQil(sql, p, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM, eski);

    // 31 kundan keyin
    const keyin = new Date(eski.getTime() + 31 * 86_400_000);
    const boshatilgan = await muddatiOtganBandlarniBoshat(sql, XODIM, keyin);

    expect(boshatilgan.some((b) => b.buyurtmaPozitsiyaId === p)).toBe(true);

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
  });

  it("muddati o'tmagan bandga tegilmaydi", async () => {
    const bolakId = await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    const p = yangiPozitsiya();
    const hozir = new Date('2026-08-20T10:00:00+05:00');

    await pozitsiyaniBandQil(sql, p, FILIAL, [slot(matoId, 1.2, 2.0)], XODIM, hozir);

    const keyin = new Date(hozir.getTime() + 10 * 86_400_000);
    const boshatilgan = await muddatiOtganBandlarniBoshat(sql, XODIM, keyin);

    expect(boshatilgan.some((b) => b.buyurtmaPozitsiyaId === p)).toBe(false);

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BAND');
  });
});

// ─── TZ 7.6 · Ostatka bor turib rulon ─────────────────────────────────────

describe('TZ 7.6 — «ostatka bor turib rulon ochildi» tekshiruvi', () => {
  beforeEach(async () => {
    await tozala(matoId);
  });

  it('mos ostatka borligini aytadi', async () => {
    await bolakYarat(matoId, 'OSTATKA', 1.8, 2.0);
    expect(await mosOstatkaBormi(sql, matoId, FILIAL, { eniM: 1.2, boyiM: 2.0 })).toBe(true);
  });

  it("mos ostatka yo'q bo'lsa false", async () => {
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);
    expect(await mosOstatkaBormi(sql, matoId, FILIAL, { eniM: 1.2, boyiM: 2.0 })).toBe(false);
  });

  it("kichik ostatka hisobga olinmaydi", async () => {
    await bolakYarat(matoId, 'OSTATKA', 0.8, 2.0);
    expect(await mosOstatkaBormi(sql, matoId, FILIAL, { eniM: 1.2, boyiM: 2.0 })).toBe(false);
  });
});
