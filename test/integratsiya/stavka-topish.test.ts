/**
 * TZ 10.9 · 10.12 · 2.3-invariant — stavkani BAZADAN topish.
 *
 * Tanlash mantiqi `test/domain/stavka.test.ts` da sinalgan. Bu yerda
 * SQL shartlari tekshiriladi: `NULL = barchaga` qoidasi, sana bo'yicha
 * kesish va stavkasiz turda ish to'xtamasligi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ustaStavkasi } from '@/lib/amal/stavka';
import {
  stavkalarRoyxati,
  stavkaniBelgila,
  stavkaniOchir,
} from '@/lib/amal/stavka-belgila';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let turId = 0;
let filialA = 0;
let filialB = 0;
let ustaId = 0;

const XODIM = 1;
const SANA = '2026-06-15';

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();

  const f = await sql<{ id: number }[]>`
    SELECT id FROM filial WHERE faol = true ORDER BY bosh DESC LIMIT 1`;
  filialA = f[0]?.id ?? 1;

  const b = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id)
    VALUES (${`Stavka filiali ${belgi()}`}, ${XODIM}) RETURNING id`;
  filialB = b[0]?.id ?? 0;

  const x = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
    VALUES (${filialA}, ${`Stavka ustasi ${belgi()}`},
            ${`9987${String(Date.now()).slice(-6)}`}, ${XODIM})
    RETURNING id`;
  ustaId = x[0]?.id ?? 0;

  // Har yurishda YANGI tur — eski stavkalar aralashmasin (QOIDALAR §6)
  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Stavka turi ${belgi()}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

async function stavkaQosh(
  filialId: number | null,
  xodimId: number | null,
  qiymat: string,
  dan = '2026-01-01',
  birlik = 'DONA',
  chegaraKvM: number | null = null,
): Promise<void> {
  await sql`
    INSERT INTO stavka (mahsulot_tur_id, filial_id, xodim_id, qiymat, birlik,
                        chegara_kv_m, amal_qiladi_dan, yaratdi_id)
    VALUES (${turId}, ${filialId}, ${xodimId}, ${qiymat}, ${birlik},
            ${chegaraKvM}, ${dan}, ${XODIM})`;
}

/**
 * Qat'iy va kv.metrli stavkada maydon TANLOVGA ta'sir qilmaydi —
 * quyidagi testlarda u shunchaki bir qiymat. Bosqichli testlar
 * o'z maydonini beradi.
 */
const MAYDON = 1;

describe('TZ 10.12 — stavkasiz tur ishni TO\'XTATMAYDI', () => {
  it("stavka yo'q bo'lsa nol qaytadi, xato bermaydi", async () => {
    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });

    expect(s.topildimi).toBe(false);
    expect(Number(s.qiymat)).toBe(0);
  });
});

describe('TZ 10.9 — xodim > filial > standart', () => {
  it('standart stavka barcha filial va xodimga tegishli', async () => {
    await stavkaQosh(null, null, '30000');

    const a = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(Number(a.qiymat)).toBe(30_000);

    // Boshqa filialda ham o'sha standart
    const b = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialB,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(Number(b.qiymat)).toBe(30_000);
  });

  it('filial stavkasi standartdan ustun', async () => {
    await stavkaQosh(filialA, null, '35000');

    const a = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(Number(a.qiymat)).toBe(35_000);

    // Filial B ga tegmadi — u standartda qoldi
    const b = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialB,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(Number(b.qiymat)).toBe(30_000);
  });

  it('xodim stavkasi HAMMASIDAN ustun', async () => {
    await stavkaQosh(filialA, ustaId, '45000');

    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(Number(s.qiymat)).toBe(45_000);
    expect(s.topildimi).toBe(true);
  });

  it("boshqa xodimga shaxsiy stavka TEGMAYDI", async () => {
    const boshqa = await sql<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
      VALUES (${filialA}, ${`Boshqa usta ${belgi()}`},
              ${`9986${String(Date.now()).slice(-6)}`}, ${XODIM})
      RETURNING id`;

    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: boshqa[0]?.id ?? 0,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    // Filial stavkasiga tushadi, shaxsiyga emas
    expect(Number(s.qiymat)).toBe(35_000);
  });
});

describe('2.3-invariant — eski ish eski stavkada qoladi', () => {
  it('kelajakdagi stavka bugungi ishga QO\'LLANMAYDI', async () => {
    await stavkaQosh(filialA, ustaId, '60000', '2026-09-01');

    // Iyun ishida hali eski stavka
    const iyun = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: '2026-06-15',
      maydonKvM: MAYDON,
    });
    expect(Number(iyun.qiymat)).toBe(45_000);

    // Sentabrda yangisi
    const sentabr = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: '2026-09-20',
      maydonKvM: MAYDON,
    });
    expect(Number(sentabr.qiymat)).toBe(60_000);
  });

  it('stavka boshlanishidan OLDINGI ish uni ko\'rmaydi', async () => {
    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: '2025-12-31',
      maydonKvM: MAYDON,
    });
    expect(s.topildimi).toBe(false);
  });
});

describe('10.8 — birlik ham stavka bilan keladi', () => {
  it('KV_M birligi saqlanadi', async () => {
    const t = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`Kv.m turi ${belgi()}`}, ${XODIM}) RETURNING id`;
    const kvTurId = t[0]?.id ?? 0;

    await sql`
      INSERT INTO stavka (mahsulot_tur_id, qiymat, birlik, amal_qiladi_dan,
                          yaratdi_id)
      VALUES (${kvTurId}, 12000, 'KV_M', '2026-01-01', ${XODIM})`;

    const s = await ustaStavkasi(sql, {
      mahsulotTurId: kvTurId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(s.birlik).toBe('KV_M');
    expect(Number(s.qiymat)).toBe(12_000);
  });
});

// ─── TZ 10.8 · BOSQICHLI stavka ────────────────────────────────

/**
 * ⚠️ NEGA BU TESTLAR BOR
 *
 *    10.8 ning uchinchi usuli — bosqichli jadval — QOG'OZDA bor,
 *    tizimda yo'q edi: `bosqichniTop()` yozilgan, sinalgan, lekin
 *    hech kim chaqirmasdi, chunki bazada chegara saqlanmasdi.
 *
 *    Bu yerda butun zanjir sinaladi: yozish → o'qish → bosqich
 *    tanlash. Domen testi buni ko'rmaydi — u bazaga tegmaydi.
 */
describe('TZ 10.8 — bosqichli jadval bazadan ishlaydi', () => {
  let bosqichTur = 0;

  const jadvalYoz = async (turId2: number): Promise<void> => {
    await stavkaniBelgila(
      sql,
      {
        mahsulotTurId: turId2,
        filialId: null,
        xodimId: null,
        birlik: 'BOSQICH',
        qiymat: '',
        bosqichlar: [
          { chegaraKvM: 1, qiymat: '10000' },
          { chegaraKvM: 1.5, qiymat: '20000' },
          { chegaraKvM: null, qiymat: '30000' },
        ],
        amalQiladiDan: '2026-01-01',
      },
      XODIM,
    );
  };

  beforeAll(async () => {
    const t = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`Bosqich turi ${belgi()}`}, ${XODIM}) RETURNING id`;
    bosqichTur = t[0]?.id ?? 0;
    await jadvalYoz(bosqichTur);
  }, 120_000);

  const haq = async (maydonKvM: number): Promise<number> => {
    const s2 = await ustaStavkasi(sql, {
      mahsulotTurId: bosqichTur,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM,
    });
    return Number(s2.qiymat);
  };

  it("chegaraga AYNAN TENG o'lcham QUYI bosqichda", async () => {
    expect(await haq(1.0)).toBe(10_000);
    expect(await haq(1.01)).toBe(20_000);
    expect(await haq(1.5)).toBe(20_000);
    expect(await haq(1.51)).toBe(30_000);
  });

  /** 10.8 — «eng quyi bosqich MINIMAL HAQ vazifasini bajaradi» */
  it("kichkina parda ham nol haq OLMAYDI", async () => {
    expect(await haq(0.2)).toBe(10_000);
  });

  it("birlik BOSQICH bo'lib qaytadi", async () => {
    const s2 = await ustaStavkasi(sql, {
      mahsulotTurId: bosqichTur,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: 2,
    });
    expect(s2.birlik).toBe('BOSQICH');
    expect(s2.topildimi).toBe(true);
  });

  /**
   * ⚠️ ENG XAVFLI HOLAT — jadval QISQARTIRILSA.
   *
   *    Uch bosqichli jadval ikkiga tushirilsa, eski uchinchi qator
   *    qolib ketsa u jimgina ishlab turardi va usta noto'g'ri haq
   *    olardi. Guruh butunligicha almashtiriladi.
   */
  it("jadval qayta yozilsa eski qatorlar QOLMAYDI", async () => {
    await stavkaniBelgila(
      sql,
      {
        mahsulotTurId: bosqichTur,
        filialId: null,
        xodimId: null,
        birlik: 'BOSQICH',
        qiymat: '',
        bosqichlar: [
          { chegaraKvM: 2, qiymat: '11000' },
          { chegaraKvM: null, qiymat: '22000' },
        ],
        amalQiladiDan: '2026-01-01',
      },
      XODIM,
    );

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM stavka
      WHERE mahsulot_tur_id = ${bosqichTur} AND faol = true`;
    expect(q[0]?.n).toBe(2);

    expect(await haq(1.5)).toBe(11_000);
    expect(await haq(2.5)).toBe(22_000);

    // Keyingi testlar uchun asl jadval qaytariladi
    await jadvalYoz(bosqichTur);
  });

  it("ro'yxatda bitta guruh bo'lib ko'rinadi", async () => {
    const r = await stavkalarRoyxati(sql);
    const meniki = r.filter((x) => x.mahsulotTurId === bosqichTur);
    expect(meniki).toHaveLength(1);
    expect(meniki[0]?.qatorlar).toHaveLength(3);
  });

  /**
   * ⚠️ Cheksiz bosqichsiz jadval SAQLANMAYDI: eng katta parda
   *    jadvaldan tashqarida qolib, usta eng og'ir ish uchun ARZON
   *    haq olardi.
   */
  it("cheksiz bosqichsiz jadval RAD ETILADI", async () => {
    await expect(
      stavkaniBelgila(
        sql,
        {
          mahsulotTurId: bosqichTur,
          filialId: null,
          xodimId: null,
          birlik: 'BOSQICH',
          qiymat: '',
          bosqichlar: [
            { chegaraKvM: 1, qiymat: '10000' },
            { chegaraKvM: 2, qiymat: '20000' },
          ],
          amalQiladiDan: '2026-02-01',
        },
        XODIM,
      ),
    ).rejects.toBeInstanceOf(BiznesXato);
  });

  it("o'chirilgan stavka endi topilmaydi", async () => {
    const t = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`O'chadigan tur ${belgi()}`}, ${XODIM}) RETURNING id`;
    const turId2 = t[0]?.id ?? 0;

    await stavkaniBelgila(
      sql,
      {
        mahsulotTurId: turId2,
        filialId: null,
        xodimId: null,
        birlik: 'DONA',
        qiymat: '15000',
        bosqichlar: [],
        amalQiladiDan: '2026-01-01',
      },
      XODIM,
    );

    const oldin = await ustaStavkasi(sql, {
      mahsulotTurId: turId2,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(oldin.topildimi).toBe(true);

    await stavkaniOchir(
      sql,
      {
        mahsulotTurId: turId2,
        filialId: null,
        xodimId: null,
        amalQiladiDan: '2026-01-01',
      },
      XODIM,
    );

    const keyin = await ustaStavkasi(sql, {
      mahsulotTurId: turId2,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
      maydonKvM: MAYDON,
    });
    expect(keyin.topildimi).toBe(false);
  });
});
