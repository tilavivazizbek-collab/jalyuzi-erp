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
       WHERE amal = 'CHIZIQLI_YETMADI' AND obyekt_id = ${poz}`;
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
