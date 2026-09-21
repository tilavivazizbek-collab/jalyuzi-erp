/**
 * T-14 — CHIZIQLI SLOT MATERIALI OMBORDAN YECHILADI
 *
 * ⚠️ 2026-09-21 da topilgan PUL TESHIGI. Birligi `M` bo'lgan slot
 *    materiali — karniz, val, pastki planka, zanjir, ip — hech
 *    qayerda ombordan yechilmasdi:
 *
 *      band qilish   `birlik === 'KV_M'` bilan filtrlanadi
 *      «Tugatdim»    faqat `band` (mato) va `pozitsiya_aksessuar`
 *                    (dona) qatorlarini yechardi
 *
 *    Mijozdan karniz puli olinardi, karniz esa omborda turaverardi.
 *    Bu 2026-08-28 da AKSESSUARDA topilgan xatoning aynan o'zi.
 *
 * ⚠️ Bu fayl tuzatishni EMAS, NATIJANI tekshiradi: «Tugatdim» dan
 *    keyin qoldiq kamaydimi va ombor jurnalida iz qoldimi. Ichki
 *    tuzilish o'zgarsa ham test ma'nosini yo'qotmaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ishniOl, tugatdim, type KesimKirimi } from '@/lib/amal/ish';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let matoSlotId = 0;
let karnizSlotId = 0;
let hisoblagich = 0;

const FILIAL = 1;
const XODIM = 1;
const USTA = 1;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`T14 mato ${belgi}`}, 'RULON', 'rulon', 'KV_M', 0.3, 0.5, ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`T14 tur ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s1 = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  matoSlotId = s1[0]?.id ?? 0;

  /** ⚠️ Karniz eni bo'ylab ketadi — chiziqli slot */
  const s2 = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Karniz', 2, ${'ENI'}, ${XODIM}) RETURNING id`;
  karnizSlotId = s2[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

/**
 * Chiziqli material yaratadi.
 *
 * ⚠️ Chiziqli material bazada `turi = 'DONA'` bo'lak bo'lib yotadi
 *    va `miqdor` ustunida METR turadi (to'rtburchak emas). Aynan
 *    shu sabab mavjud `donaYech` unga ham to'g'ri keladi.
 */
async function karnizYarat(metr: number): Promise<number> {
  hisoblagich += 1;
  const belgi = `${String(Date.now())}-${String(hisoblagich)}`;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, yaratdi_id)
    VALUES (${`T14 karniz ${belgi}`}, 'CHIZIQLI', 'shtanga', 'M', 3, ${XODIM})
    RETURNING id`;
  const materialId = m[0]?.id ?? 0;

  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${`T14-K-${belgi}`},
            'DONA', ${metr}, 35000, ${XODIM})`;

  return materialId;
}

async function qoldiq(materialId: number): Promise<number> {
  const q = await sql<{ jami: string }[]>`
    SELECT COALESCE(SUM(miqdor), 0)::text AS jami FROM bolak
    WHERE material_id = ${materialId} AND holat = 'BOSH' AND faol = true`;
  return Number(q[0]?.jami ?? '0');
}

async function rulonYarat(): Promise<void> {
  hisoblagich += 1;
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`T14-R-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 1.8, 10.0, 78000, ${XODIM})`;
}

/**
 * Mato + karniz slotli pozitsiya yaratadi va ishga oladi.
 *
 * ⚠️ Karniz miqdori FORMULADAN chiqadi (`ENI`), qo'lda
 *    berilmaydi. Server «Tugatdim» da formulani qayta hisoblab
 *    solishtiradi (`sarflashTekshir`) — mos kelmasa amalni rad
 *    etadi. Bu testning o'zi shu qo'riqchiga urilib ko'rdi.
 */
async function pozitsiyaTayyorla(
  karnizId: number,
  eniM = 1.2,
  boyiM = 2.0,
): Promise<number> {
  const karnizMetr = eniM.toFixed(4);
  hisoblagich += 1;
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-T14-${String(Date.now())}-${String(hisoblagich)}`,
    mijozId: null,
    sotganFilialId: FILIAL,
    ishlabChiqaruvchiFilialId: FILIAL,
    manba: 'SAYT',
    valyuta: 'SOM',
    kursSnapshot: null,
    tayyorlikSana: null,
    qarzgaKetadimi: false,
    pozitsiyalar: [
      {
        mahsulotTurId: turId,
        eniM,
        boyiM,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: 'T14' },
        slotlar: [
          {
            slotId: matoSlotId,
            materialId: matoId,
            hisoblanganMiqdor: (eniM * boyiM).toFixed(4),
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            kerak: { eniM, boyiM },
          },
          {
            slotId: karnizSlotId,
            materialId: karnizId,
            hisoblanganMiqdor: karnizMetr,
            tuzatilganMiqdor: null,
            birlik: 'M',
            narxSnapshot: '35000',
            /** ⚠️ Chiziqli slot band QILINMAYDI — to'rtburchak yo'q */
            kerak: null,
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
  await ishniOl(sql, pozitsiyaId, USTA, '0');
  return pozitsiyaId;
}

async function kesimlar(pozitsiyaId: number): Promise<KesimKirimi[]> {
  const b = await sql<{ id: number }[]>`
    SELECT id FROM band
    WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'
    ORDER BY id`;
  return b.map((x) => ({
    bandId: x.id,
    manba: 'RULON' as const,
    qoldiqlar: { manbaQoldiq: null, kesma: null, kesmaSaqlansinmi: false },
  }));
}

describe('T-14 — chiziqli slot materiali «Tugatdim» da yechiladi', () => {
  it('qoldiq AYNAN hisoblangan miqdorga kamayadi', async () => {
    const karnizId = await karnizYarat(30);
    expect(await qoldiq(karnizId)).toBe(30);

    /** Eni 1.20 m → formula `ENI` → 1.20 m karniz */
    const poz = await pozitsiyaTayyorla(karnizId);
    await tugatdim(sql, { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null }, USTA);

    expect(await qoldiq(karnizId)).toBe(28.8);
  }, 120_000);

  it('ombor jurnaliga `miqdor_m` bilan tushadi, `miqdor_dona` ga EMAS', async () => {
    const karnizId = await karnizYarat(30);
    const poz = await pozitsiyaTayyorla(karnizId);
    await tugatdim(sql, { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null }, USTA);

    const h = await sql<
      { miqdor_m: string | null; miqdor_dona: number | null; turi: string; izoh: string | null }[]
    >`
      SELECT oh.miqdor_m::text, oh.miqdor_dona, oh.turi, oh.izoh
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${karnizId} AND oh.turi = 'KESIM'`;

    expect(h.length).toBe(1);
    expect(h[0]?.miqdor_m).toBe('-1.20');
    /**
     * ⚠️ Birlik AJRATILISHI shart: aks holda jurnalda «2.5 dona
     *    karniz» deb ko'rinardi, aslida 2.5 METR bo'lsa.
     */
    expect(h[0]?.miqdor_dona).toBeNull();
  }, 120_000);

  it('tannarx summasi manfiy va FIFO narxidan chiqadi', async () => {
    const karnizId = await karnizYarat(30);
    const poz = await pozitsiyaTayyorla(karnizId);
    await tugatdim(sql, { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null }, USTA);

    const h = await sql<{ tannarx_summa: string }[]>`
      SELECT oh.tannarx_summa::text
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${karnizId} AND oh.turi = 'KESIM'`;

    /** 1.2 m × 35 000 = 42 000, chiqim bo'lgani uchun manfiy */
    expect(Number(h[0]?.tannarx_summa)).toBe(-42000);
  }, 120_000);

  it("YETMASA ish TO'XTAMAYDI — auditga yoziladi, qoldiq manfiyga tushmaydi", async () => {
    /** Qoldiq 0.5 m, kerak esa 1.2 m */
    const karnizId = await karnizYarat(0.5);
    const poz = await pozitsiyaTayyorla(karnizId);

    /** Usta mahsulotni allaqachon yasagan — ish yakunlanadi */
    await tugatdim(sql, { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null }, USTA);

    expect(await qoldiq(karnizId)).toBe(0.5);

    const a = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM audit_jurnal
       WHERE amal = 'SLOT_MATERIALI_YETMADI' AND obyekt_id = ${poz}`;
    expect(a[0]?.n).toBe(1);

    const h = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${karnizId} AND oh.turi = 'KESIM'`;
    expect(h[0]?.n).toBe(0);
  }, 120_000);

  it('mato bilan chiziqli BIRGA yechiladi — ikkalasiga ham jurnal yoziladi', async () => {
    const karnizId = await karnizYarat(30);
    const poz = await pozitsiyaTayyorla(karnizId);

    await tugatdim(
      sql,
      { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null },
      USTA,
    );

    /**
     * ⚠️ Qoldiq YIG'INDISI bilan solishtirib bo'lmaydi: band
     *    qilingan rulon allaqachon `BAND` holatida va `BOSH`
     *    yig'indisiga kirmaydi. Shuning uchun ombor JURNALI
     *    tekshiriladi — u har harakatni yozadi.
     */
    const h = await sql<{ material_id: number; miqdor_kv_m: string | null;
                          miqdor_m: string | null }[]>`
      SELECT b.material_id, oh.miqdor_kv_m::text, oh.miqdor_m::text
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE oh.manba_turi = 'buyurtma_pozitsiya' AND oh.manba_id = ${poz}
         AND oh.turi = 'KESIM'`;

    const mato = h.filter((x) => x.material_id === matoId);
    const karniz = h.filter((x) => x.material_id === karnizId);

    expect(mato.length).toBeGreaterThan(0);
    expect(karniz.length).toBe(1);

    /** Mato kv.m da, karniz metrda — birliklar aralashmaydi */
    expect(mato[0]?.miqdor_kv_m).not.toBeNull();
    expect(karniz[0]?.miqdor_m).toBe('-1.20');
    expect(await qoldiq(karnizId)).toBe(28.8);
  }, 120_000);
});

/**
 * T-14 (2-qism) — DONA SLOT MATERIALI
 *
 * ⚠️ Birinchi tuzatish faqat `birlik = 'M'` ni qamragan edi va DONA
 *    SLOT uchidan chetda qolgan: u na `band` ga (u faqat `KV_M`),
 *    na aksessuar blokiga (u `pozitsiya_aksessuar` ni o'qiydi)
 *    tushardi.
 *
 * ⚠️ Egasining «dikkey» turida aynan shunday slot bor —
 *    `dikkey bigunok`, formulasi `CEIL(ENI / 0.10)`. Ya'ni 1 metrli
 *    mahsulotga O'NTA begunok, va ularning hammasi jimgina
 *    yo'qolardi.
 *
 * ⚠️ AKSESSUAR EMAS. Bitta material ikkalasi ham bo'lishi mumkin:
 *    qo'lda qo'shilsa aksessuar, mahsulot turida turgan bo'lsa slot.
 *    2026-08-28 da faqat birinchisi tuzatilgan edi.
 */
describe('T-14 (2-qism) — DONA slot materiali ham yechiladi', () => {
  let begunokSlotId = 0;

  beforeAll(async () => {
    const s = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
      VALUES (${turId}, 'Begunok', 3, ${'CEIL(ENI / 0.10)'}, ${XODIM})
      RETURNING id`;
    begunokSlotId = s[0]?.id ?? 0;
  }, 60_000);

  async function begunokYarat(dona: number): Promise<number> {
    hisoblagich += 1;
    const belgi = `${String(Date.now())}-${String(hisoblagich)}`;

    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`T14 begunok ${belgi}`}, 'DONA', 'dona', 'DONA', ${XODIM})
      RETURNING id`;
    const materialId = m[0]?.id ?? 0;

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${materialId}, ${FILIAL}, ${`T14-BG-${belgi}`},
              'DONA', ${dona}, 5000, ${XODIM})`;

    return materialId;
  }

  /** Mato + karniz + begunok slotli pozitsiya */
  async function uchSlotli(karnizId: number, begunokId: number): Promise<number> {
    hisoblagich += 1;
    await rulonYarat();
    const eniM = 1.2;
    const boyiM = 2.0;

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-T14D-${String(Date.now())}-${String(hisoblagich)}`,
        mijozId: null,
        sotganFilialId: FILIAL,
        ishlabChiqaruvchiFilialId: FILIAL,
        manba: 'SAYT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: false,
        pozitsiyalar: [
          {
            mahsulotTurId: turId,
            eniM,
            boyiM,
            soni: 1,
            narxSnapshot: '500000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { sinov: 'T14-DONA' },
            slotlar: [
              {
                slotId: matoSlotId,
                materialId: matoId,
                hisoblanganMiqdor: (eniM * boyiM).toFixed(4),
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM, boyiM },
              },
              {
                slotId: karnizSlotId,
                materialId: karnizId,
                hisoblanganMiqdor: eniM.toFixed(4),
                tuzatilganMiqdor: null,
                birlik: 'M',
                narxSnapshot: '35000',
                kerak: null,
              },
              {
                /** `CEIL(1.2 / 0.10)` = 12 ta */
                slotId: begunokSlotId,
                materialId: begunokId,
                hisoblanganMiqdor: '12',
                tuzatilganMiqdor: null,
                birlik: 'DONA',
                narxSnapshot: '5000',
                kerak: null,
              },
            ],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    await ishniOl(sql, pozitsiyaId, USTA, '0');
    return pozitsiyaId;
  }

  it('DONA slot qoldig\'i kamayadi — 50 → 38', async () => {
    const karnizId = await karnizYarat(30);
    const begunokId = await begunokYarat(50);
    const poz = await uchSlotli(karnizId, begunokId);

    await tugatdim(
      sql,
      { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null },
      USTA,
    );

    expect(await qoldiq(begunokId)).toBe(38);
  }, 120_000);

  it('jurnalga `miqdor_dona` bilan tushadi, `miqdor_m` ga EMAS', async () => {
    const karnizId = await karnizYarat(30);
    const begunokId = await begunokYarat(50);
    const poz = await uchSlotli(karnizId, begunokId);

    await tugatdim(
      sql,
      { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null },
      USTA,
    );

    const h = await sql<{ miqdor_dona: number | null; miqdor_m: string | null }[]>`
      SELECT oh.miqdor_dona, oh.miqdor_m::text
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${begunokId} AND oh.turi = 'KESIM'`;

    expect(h.length).toBe(1);
    expect(h[0]?.miqdor_dona).toBe(-12);
    /** ⚠️ Birlik aralashmaydi: dona ustuni to'ladi, metr ustuni bo'sh */
    expect(h[0]?.miqdor_m).toBeNull();
  }, 120_000);

  it('uchala slot HAM yechiladi — mato, chiziqli, dona', async () => {
    const karnizId = await karnizYarat(30);
    const begunokId = await begunokYarat(50);
    const poz = await uchSlotli(karnizId, begunokId);

    await tugatdim(
      sql,
      { pozitsiyaId: poz, kesimlar: await kesimlar(poz), ogohTasdiqlandi: true, izoh: null },
      USTA,
    );

    const h = await sql<{ material_id: number }[]>`
      SELECT b.material_id
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE oh.manba_turi = 'buyurtma_pozitsiya' AND oh.manba_id = ${poz}
         AND oh.turi = 'KESIM'`;

    const materiallar = new Set(h.map((x) => x.material_id));
    expect(materiallar.has(matoId)).toBe(true);
    expect(materiallar.has(karnizId)).toBe(true);
    expect(materiallar.has(begunokId)).toBe(true);
  }, 120_000);
});

/**
 * T-14 (3-qism) — TO'G'RIDAN-TO'G'RI SOTISHDA BIRLIK
 *
 * ⚠️ 2026-09-21 auditida topildi. Chiziqli material alohida
 *    sotilganda (`qoshimchaMaterialId`, slotsiz) ombor jurnaliga
 *    DOIM `miqdor_dona` yozilardi — birlik `'DONA'` deb qotirilgan
 *    edi.
 *
 *    Qoldiq to'g'ri kamayardi, faqat TARIX yolg'on edi: jurnalda
 *    «5 dona karniz» deb ko'rinar, aslida 5 METR bo'lardi. Omborchi
 *    «5 dona karniz qayoqqa ketdi?» degan savolga javob topa
 *    olmasdi.
 */
describe("T-14 (3-qism) — chiziqli materialni alohida sotish", () => {
  it('jurnalga metr yoziladi, dona EMAS', async () => {
    const karnizId = await karnizYarat(30);
    hisoblagich += 1;

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-T14S-${String(Date.now())}-${String(hisoblagich)}`,
        mijozId: null,
        sotganFilialId: FILIAL,
        ishlabChiqaruvchiFilialId: FILIAL,
        manba: 'SAYT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: false,
        pozitsiyalar: [
          {
            /** ⚠️ Slotsiz — «materialni o'zi sotish» yo'li */
            mahsulotTurId: null,
            qoshimchaMaterialId: karnizId,
            eniM: 0,
            boyiM: 0,
            soni: 5,
            narxSnapshot: '175000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { qoshimcha: true },
            slotlar: [],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    const poz = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    expect(n.pozitsiyalar[0]?.holat).not.toBe('MATERIALGA_KUTMOQDA');

    /** 30 − 5 = 25 metr */
    expect(await qoldiq(karnizId)).toBe(25);

    const h = await sql<{ miqdor_m: string | null; miqdor_dona: number | null }[]>`
      SELECT oh.miqdor_m::text, oh.miqdor_dona
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${karnizId} AND oh.manba_id = ${poz}`;

    expect(h.length).toBe(1);
    expect(h[0]?.miqdor_m).toBe('-5.00');
    expect(h[0]?.miqdor_dona).toBeNull();

    /** Aksessuar qatorida ham birlik to'g'ri bo'lsin */
    const a = await sql<{ birlik: string }[]>`
      SELECT birlik FROM pozitsiya_aksessuar WHERE buyurtma_pozitsiya_id = ${poz}`;
    expect(a[0]?.birlik).toBe('M');
  }, 120_000);

  it('DONA material sotilganda jurnal dona ustuniga yozadi', async () => {
    hisoblagich += 1;
    const belgi = `${String(Date.now())}-${String(hisoblagich)}`;

    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`T14 mexanizm ${belgi}`}, 'DONA', 'dona', 'DONA', ${XODIM})
      RETURNING id`;
    const mexanizmId = m[0]?.id ?? 0;

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${mexanizmId}, ${FILIAL}, ${`T14-MX-${belgi}`},
              'DONA', 20, 15000, ${XODIM})`;

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-T14D2-${belgi}`,
        mijozId: null,
        sotganFilialId: FILIAL,
        ishlabChiqaruvchiFilialId: FILIAL,
        manba: 'SAYT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: false,
        pozitsiyalar: [
          {
            mahsulotTurId: null,
            qoshimchaMaterialId: mexanizmId,
            eniM: 0,
            boyiM: 0,
            soni: 3,
            narxSnapshot: '90000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { qoshimcha: true },
            slotlar: [],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    const poz = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

    const h = await sql<{ miqdor_m: string | null; miqdor_dona: number | null }[]>`
      SELECT oh.miqdor_m::text, oh.miqdor_dona
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${mexanizmId} AND oh.manba_id = ${poz}`;

    expect(h[0]?.miqdor_dona).toBe(-3);
    expect(h[0]?.miqdor_m).toBeNull();
  }, 120_000);
});

/**
 * T-16 — KASR METRLAB SOTISH (egasi qarori 2026-09-21: «metrlab sotib bulsin»)
 *
 * ⚠️ Ilgari karnizni 2.5 metrlab sotib bo'lmasdi: miqdor
 *    `buyurtma_pozitsiya.soni` ustunida saqlanardi va u `integer`.
 *    Endi o'lchovli miqdor ALOHIDA `miqdor` ustuniga tushadi;
 *    `soni` esa dona sanog'i bo'lib qoladi (band `soni` marta
 *    takrorlanadi, kesim jami maydonni `soni` ga bo'ladi — kasr
 *    u yerga yaramaydi).
 */
describe('T-16 — chiziqli materialni kasr metrlab sotish', () => {
  async function sot(
    karnizId: number,
    miqdor: string | null,
    soni = 1,
  ): Promise<number> {
    hisoblagich += 1;
    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-T16-${String(Date.now())}-${String(hisoblagich)}`,
        mijozId: null,
        sotganFilialId: FILIAL,
        ishlabChiqaruvchiFilialId: FILIAL,
        manba: 'SAYT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: false,
        pozitsiyalar: [
          {
            mahsulotTurId: null,
            qoshimchaMaterialId: karnizId,
            eniM: 0,
            boyiM: 0,
            soni,
            miqdor,
            narxSnapshot: '87500',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { qoshimcha: true },
            slotlar: [],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );
    return n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
  }

  it('2.5 metr sotiladi — qoldiq 30 → 27.5', async () => {
    const karnizId = await karnizYarat(30);
    await sot(karnizId, '2.50');
    expect(await qoldiq(karnizId)).toBe(27.5);
  }, 120_000);

  it('ombor jurnaliga AYNAN 2.50 metr tushadi', async () => {
    const karnizId = await karnizYarat(30);
    const poz = await sot(karnizId, '2.50');

    const h = await sql<{ miqdor_m: string | null; miqdor_dona: number | null }[]>`
      SELECT oh.miqdor_m::text, oh.miqdor_dona
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE b.material_id = ${karnizId} AND oh.manba_id = ${poz}`;

    expect(h[0]?.miqdor_m).toBe('-2.50');
    expect(h[0]?.miqdor_dona).toBeNull();
  }, 120_000);

  it("`soni` BIR bo'lib qoladi, miqdor alohida ustunda", async () => {
    const karnizId = await karnizYarat(30);
    const poz = await sot(karnizId, '2.50');

    const p = await sql<{ soni: number; miqdor: string | null }[]>`
      SELECT soni, miqdor::text FROM buyurtma_pozitsiya WHERE id = ${poz}`;

    expect(p[0]?.soni).toBe(1);
    expect(p[0]?.miqdor).toBe('2.50');
  }, 120_000);

  it('miqdor berilmasa AVVALGIDEK `soni` yechiladi', async () => {
    const karnizId = await karnizYarat(30);
    await sot(karnizId, null, 4);
    expect(await qoldiq(karnizId)).toBe(26);
  }, 120_000);

  it('qoldiq yetmasa MATERIALGA_KUTMOQDA — kasr miqdorda ham', async () => {
    const karnizId = await karnizYarat(2);
    hisoblagich += 1;
    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-T16Y-${String(Date.now())}-${String(hisoblagich)}`,
        mijozId: null,
        sotganFilialId: FILIAL,
        ishlabChiqaruvchiFilialId: FILIAL,
        manba: 'SAYT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: false,
        pozitsiyalar: [
          {
            mahsulotTurId: null,
            qoshimchaMaterialId: karnizId,
            eniM: 0,
            boyiM: 0,
            soni: 1,
            miqdor: '2.50',
            narxSnapshot: '87500',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { qoshimcha: true },
            slotlar: [],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    expect(n.pozitsiyalar[0]?.holat).toBe('MATERIALGA_KUTMOQDA');
    /** ⚠️ Yarim yechish yo'q — qoldiq tegilmaydi (2.1-invariant) */
    expect(await qoldiq(karnizId)).toBe(2);
  }, 120_000);
});
