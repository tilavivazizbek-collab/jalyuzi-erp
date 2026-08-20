/**
 * QISM 1 §14.2 — «lib/amal/ — tranzaksiya chegaralari, har biri kamida 1 test»
 *
 * TZ 5.3 · 6.5 · 9 · 2.4
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { materialTahrirla, materialYarat } from '@/lib/amal/material';
import { mijozTahrirla, mijozYarat } from '@/lib/amal/mijoz';
import { yetkazibTahrirla, yetkazibYarat } from '@/lib/amal/yetkazib';
import type { MaterialKirimi } from '@/lib/sxema/material';
import type { MijozKirimi } from '@/lib/sxema/mijoz';
import type { YetkazibKirimi } from '@/lib/sxema/yetkazib';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
const XODIM = 1;
const FILIAL = 1;

beforeAll(() => {
  sql = sinovUlanishi();
});

afterAll(async () => {
  await sql.end();
});

// ─── lib/amal/material.ts ─────────────────────────────────────────────────

const MATERIAL: MaterialKirimi = {
  nom: 'Amal sinov matosi',
  hisobTuri: 'RULON',
  kirimBirligi: 'rulon',
  sarflashBirligi: 'KV_M',
  koeffitsient: '1',
  sotuvNarx: '120000',
  sotuvValyuta: 'SOM',
  minUstamaFoiz: undefined,
  yaroqsizChegaraM: undefined,
  kamIshlatiladiganM: undefined,
  kamQoldiqChegaraM: undefined,
  standartRulonEniM: undefined,
  almashtirishGuruhId: undefined,
  yaxlitlashQadami: undefined,
  eslatma: undefined,
};

describe('lib/amal/material.ts', () => {
  let materialId: number;

  it('material yaratiladi', async () => {
    materialId = await materialYarat(sql, MATERIAL, XODIM);
    expect(materialId).toBeGreaterThan(0);

    const q = await sql<{ nom: string; sotuv_narx: string }[]>`
      SELECT nom, sotuv_narx FROM material WHERE id = ${materialId}`;
    expect(q[0]?.nom).toBe('Amal sinov matosi');
    expect(Number(q[0]?.sotuv_narx)).toBe(120000);
  });

  it("o'zgarish bo'lmasa jurnalga yozilmaydi", async () => {
    const n = await materialTahrirla(sql, materialId, MATERIAL, XODIM, FILIAL);
    expect(n.holat).toBe('OZGARISH_YOQ');
  });

  it("narx o'zgarsa saqlanadi va jurnalga tushadi (2.4)", async () => {
    const oldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}`;

    const n = await materialTahrirla(
      sql,
      materialId,
      { ...MATERIAL, sotuvNarx: '130000' },
      XODIM,
      FILIAL,
    );
    expect(n.holat).toBe('SAQLANDI');

    const keyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}`;
    expect((keyin[0]?.n ?? 0) - (oldin[0]?.n ?? 0)).toBe(1);
  });

  it('jurnalda FAQAT o\'zgargan maydon turadi (2.4)', async () => {
    const q = await sql<
      { eski_qiymat: Record<string, unknown>; yangi_qiymat: Record<string, unknown> }[]
    >`SELECT eski_qiymat, yangi_qiymat FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}
      ORDER BY id DESC LIMIT 1`;

    expect(Object.keys(q[0]?.yangi_qiymat ?? {})).toEqual(['sotuv_narx']);
    expect(q[0]?.eski_qiymat['sotuv_narx']).toBe('120000.00');
    expect(q[0]?.yangi_qiymat['sotuv_narx']).toBe('130000.00');
  });

  it("TZ 5.3 — qoldiq yo'q ekan birlik o'zgartiriladi", async () => {
    // `bolak` jadvali hali yo'q (3-bosqichda keladi) → qoldiq 0
    const n = await materialTahrirla(
      sql,
      materialId,
      { ...MATERIAL, sotuvNarx: '130000', sarflashBirligi: 'SM', koeffitsient: '100' },
      XODIM,
      FILIAL,
    );
    expect(n.holat).toBe('SAQLANDI');
  });

  it('birlik o\'zgarishi alohida amal bilan jurnalga tushadi', async () => {
    const q = await sql<{ amal: string }[]>`
      SELECT amal FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}
      ORDER BY id DESC LIMIT 1`;
    expect(q[0]?.amal).toBe('MATERIAL_BIRLIGI_OZGARDI');
  });

  it("mavjud bo'lmagan material tahrirlanmaydi", async () => {
    await expect(
      materialTahrirla(sql, 999_999, MATERIAL, XODIM, FILIAL),
    ).rejects.toThrow();
  });
});

// ─── lib/amal/mijoz.ts ────────────────────────────────────────────────────

/**
 * ⚠️ Ism va telefon HAR YURISHDA yangi bo'ladi.
 *
 *    Avval ular qat'iy edi ('Amal sinov mijozi', '905554433'). Birinchi
 *    yurishda testlar o'tardi, IKKINCHISIDA esa mijoz allaqachon bazada
 *    bo'lgani uchun birinchi test DUBLIKAT olardi, `mijozId` yozilmasdan
 *    qolardi va undan keyingi to'rt test ham yiqilardi. Kod to'g'ri
 *    ishlardi — testning o'zi bir martalik edi.
 *
 *    Dublikat testlari SHU YURISH ichida to'qnashishi kerak, boshqa
 *    yurishlar bilan emas.
 */
const BELGI = String(Date.now()).slice(-7);
const MIJOZ_ISMI = `Amal sinov mijozi ${BELGI}`;
const MIJOZ_TELEFON = `90${BELGI}`;

const MIJOZ: MijozKirimi = {
  ism: MIJOZ_ISMI,
  telefon: `+998 ${MIJOZ_TELEFON.slice(0, 2)} ${MIJOZ_TELEFON.slice(2, 5)} ${MIJOZ_TELEFON.slice(5, 7)} ${MIJOZ_TELEFON.slice(7)}`,
  manzil: undefined,
  eslatma: undefined,
  offsetTuri: undefined,
  offsetQiymat: undefined,
  qarzLimiti: '5000000',
  shaxsTuri: 'JISMONIY',
  tashkilotNomi: undefined,
  inn: undefined,
  yuridikManzil: undefined,
  bankNomi: undefined,
  hisobRaqam: undefined,
  mfo: undefined,
  shartnomaRaqam: undefined,
  ndsStavka: undefined,
};

describe('lib/amal/mijoz.ts — TZ 6.5 dublikat nazorati', () => {
  let mijozId: number;

  it('mijoz yaratiladi, telefon kanonik ko\'rinishda saqlanadi', async () => {
    const n = await mijozYarat(sql, MIJOZ, XODIM);
    expect(n.holat).toBe('SAQLANDI');
    if (n.holat !== 'SAQLANDI') return;
    mijozId = n.id;

    const q = await sql<{ telefon: string }[]>`
      SELECT telefon FROM mijoz WHERE id = ${mijozId}`;
    // '+998 90 XXX XX XX' → '99890XXXXXXX' (bo'shliqlar va + tushadi)
    expect(q[0]?.telefon).toBe(`998${MIJOZ_TELEFON}`);
  });

  it("bir xil telefon BOSHQACHA yozilsa ham dublikat deb topiladi", async () => {
    const n = await mijozYarat(
      sql,
      { ...MIJOZ, ism: `Boshqa ism ${BELGI}`, telefon: MIJOZ_TELEFON },
      XODIM,
    );
    expect(n.holat).toBe('DUBLIKAT');
    if (n.holat === 'DUBLIKAT') {
      expect(n.dublikat.sabab).toBe('TELEFON');
      expect(n.dublikat.mavjud?.id).toBe(mijozId);
    }
  });

  it('bir xil ism ham dublikat', async () => {
    const n = await mijozYarat(sql, { ...MIJOZ, telefon: `91${BELGI}` }, XODIM);
    expect(n.holat).toBe('DUBLIKAT');
    if (n.holat === 'DUBLIKAT') expect(n.dublikat.sabab).toBe('ISM');
  });

  it('dublikat bazaga YOZILMAYDI', async () => {
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mijoz WHERE ism = ${MIJOZ_ISMI}`;
    expect(q[0]?.n).toBe(1);
  });

  it("o'zini tahrirlashda o'zi dublikat hisoblanmaydi", async () => {
    const n = await mijozTahrirla(sql, mijozId, { ...MIJOZ, manzil: 'Toshkent' }, XODIM);
    expect(n.holat).toBe('SAQLANDI');
  });

  it('Q-23 — yuridik shaxs soliq maydonlari bilan saqlanadi', async () => {
    const n = await mijozYarat(
      sql,
      {
        ...MIJOZ,
        ism: `Amal sinov MChJ ${BELGI}`,
        telefon: `93${BELGI}`,
        shaxsTuri: 'YURIDIK',
        tashkilotNomi: 'MChJ Sinov',
        inn: `98${BELGI}`,
        yuridikManzil: 'Toshkent',
        ndsStavka: '12',
      },
      XODIM,
    );
    expect(n.holat).toBe('SAQLANDI');

    const q = await sql<{ nds_tolovchi: boolean; inn: string }[]>`
      SELECT nds_tolovchi, inn FROM mijoz WHERE inn = ${`98${BELGI}`}`;
    expect(q[0]?.nds_tolovchi).toBe(true);
  });
});

// ─── lib/amal/yetkazib.ts ─────────────────────────────────────────────────

const YETKAZIB: YetkazibKirimi = {
  nom: 'Amal sinov yetkazuvchisi',
  nimaYetkazadi: 'mato',
  kontaktShaxs: 'Aziz',
  telefon: '+998 90 777 66 55',
  qoshimchaTelefon: undefined,
  manzil: undefined,
  bankNomi: 'Ipoteka bank',
  hisobRaqam: '20208000000000000001',
  inn: '123456789',
  mfo: '00440',
  tolovMuddatiKun: '30',
  valyuta: 'USD',
  eslatma: undefined,
};

describe('lib/amal/yetkazib.ts — TZ 9.3', () => {
  let yetkazibId: number;

  it('rekvizitlari bilan saqlanadi — to\'lov oynasi ularga tayanadi', async () => {
    yetkazibId = await yetkazibYarat(sql, YETKAZIB, XODIM);

    const q = await sql<
      { bank_nomi: string; hisob_raqam: string; mfo: string; telefon: string }[]
    >`SELECT bank_nomi, hisob_raqam, mfo, telefon
      FROM yetkazib_beruvchi WHERE id = ${yetkazibId}`;

    expect(q[0]?.bank_nomi).toBe('Ipoteka bank');
    expect(q[0]?.mfo).toBe('00440');
    expect(q[0]?.telefon).toBe('998907776655');
  });

  it("to'lov muddati saqlanadi (9.3 — kirim hujjatiga qo'yiladi)", async () => {
    const q = await sql<{ tolov_muddati_kun: number }[]>`
      SELECT tolov_muddati_kun FROM yetkazib_beruvchi WHERE id = ${yetkazibId}`;
    expect(q[0]?.tolov_muddati_kun).toBe(30);
    expect(typeof q[0]?.tolov_muddati_kun).toBe('number');
  });

  it('tahrirlanadi', async () => {
    await yetkazibTahrirla(sql, yetkazibId, { ...YETKAZIB, nimaYetkazadi: 'mato, karniz' }, XODIM);
    const q = await sql<{ nima_yetkazadi: string }[]>`
      SELECT nima_yetkazadi FROM yetkazib_beruvchi WHERE id = ${yetkazibId}`;
    expect(q[0]?.nima_yetkazadi).toBe('mato, karniz');
  });

  it("mavjud bo'lmagani tahrirlanmaydi", async () => {
    await expect(yetkazibTahrirla(sql, 999_999, YETKAZIB, XODIM)).rejects.toThrow();
  });
});
