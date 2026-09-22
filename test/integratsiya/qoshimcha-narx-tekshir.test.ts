/**
 * ALOHIDA SOTILGAN BUYUM NARXI SERVERDA QAYTA HISOBLANADI — 2026-09-22
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    Tayyor jalyuzida narx serverda qayta hisoblanadi va sotuvchi
 *    o'zgartirgan bo'lsa `qolda_narx` belgisi qo'yiladi
 *    (`narx-tekshir.test.ts`). Lekin o'sha tekshiruv FAQAT mahsulot
 *    turi bor pozitsiyaga tegishli edi.
 *
 *    Metrlab kesilgan mato, karniz va donalab sotilgan buyumda tur
 *    yo'q — ular tekshiruvdan BUTUNLAY chetda qolardi. Ya'ni egasi
 *    narxni o'zgartirsa, sotuvchining brauzerida ochiq turgan eski
 *    sahifa eski narxda sotaverardi va hech qanday iz qolmasdi.
 *
 *    «Miqdor bo'yicha bosqich» qo'shilgach teshik kattalashdi: endi
 *    u yerda butun bosqich jadvali turibdi.
 *
 * ⚠️ BLOKLAMAYDI — narx baribir sotuvchi yozganicha saqlanadi
 *    (TZ 3.8 · 3.11), faqat belgi va audit yozuvi qoladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let karnizId = 0;
let pultId = 0;
let darajaId = 0;
let hisoblagich = 0;

const FILIAL = 1;
const XODIM = 1;
const belgi = String(Date.now());

/** Karniz: 10 metrgacha 35 000, undan ko'p bo'lsa 32 000 */
const QIMMAT = '35000';
const ARZON = '32000';
/** Pult — darajasi yo'q, o'z narxidan sotiladi */
const PULT_NARX = '90000';

beforeAll(async () => {
  sql = sinovUlanishi();

  const g = await sql<{ id: number }[]>`
    INSERT INTO narx_guruh (nom, yaratdi_id)
    VALUES (${`QNT daraja ${belgi}`}, ${XODIM}) RETURNING id`;
  darajaId = g[0]?.id ?? 0;

  const k = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, sotuv_narx, sotuv_valyuta,
                          narx_guruh_id, togridan_sotiladi, yaratdi_id)
    VALUES (${`QNT karniz ${belgi}`}, 'CHIZIQLI', 'metr', 'M',
            1, ${QIMMAT}, 'SOM', ${darajaId}, true, ${XODIM})
    RETURNING id`;
  karnizId = k[0]?.id ?? 0;

  const p = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          sotuv_narx, sotuv_valyuta, togridan_sotiladi,
                          yaratdi_id)
    VALUES (${`QNT pult ${belgi}`}, 'DONA', 'dona', 'DONA',
            ${PULT_NARX}, 'SOM', true, ${XODIM})
    RETURNING id`;
  pultId = p[0]?.id ?? 0;

  const n = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_narx (mahsulot_tur_id, narx_guruh_id, hisoblash_usuli,
                               yaratdi_id)
    VALUES (NULL, ${darajaId}, 'MIQDOR', ${XODIM}) RETURNING id`;
  const narxId = n[0]?.id ?? 0;

  await sql`
    INSERT INTO mahsulot_narx_bosqich (mahsulot_narx_id, dan, gacha, narx,
                                       valyuta, tartib, yaratdi_id)
    VALUES (${narxId}, 0, 10, ${QIMMAT}, 'SOM', 0, ${XODIM}),
           (${narxId}, 10, NULL, ${ARZON}, 'SOM', 1, ${XODIM})`;
}, 120_000);

afterAll(async () => {
  /** ⚠️ O'chirilmaydi — nofaol qilinadi (2.1-invariant) */
  await sql`UPDATE material SET faol = false WHERE nom LIKE ${`QNT %${belgi}`}`;
  await sql.end({ timeout: 5 });
});

/**
 * Alohida buyum sotadi. `narx` — sotuvchining brauzeri yuborgan summa.
 *
 * ⚠️ Metrlab sotishda `soni = 1`, miqdor `miqdor` ustunida (T-16).
 */
async function sot(
  materialId: number,
  narx: string,
  miqdor: string | null,
  soni = 1,
): Promise<number> {
  hisoblagich += 1;
  const b = `${belgi}-${String(hisoblagich)}`;

  /**
   * ⚠️ CHIZIQLI material ham `turi = 'DONA'` bo'lib yotadi va
   *    METR uning `miqdor` ustunida turadi — alohida `miqdor_m`
   *    ustuni YO'Q (0043 dan keyin ham shunday).
   */
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${`QNT-B-${b}`}, 'DONA', 100,
            20000, ${XODIM})`;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-QNT-${b}`,
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
        qoshimchaMaterialId: materialId,
        eniM: 0,
        boyiM: 0,
        soni,
        miqdor,
        narxSnapshot: narx,
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { qoshimcha: true },
        slotlar: [],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
}

async function belgilandimi(poz: number): Promise<boolean> {
  const q = await sql<{ qolda_narx: boolean }[]>`
    SELECT qolda_narx FROM buyurtma_pozitsiya WHERE id = ${poz}`;
  return q[0]?.qolda_narx ?? false;
}

async function auditSoni(poz: number): Promise<number> {
  const q = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM audit_jurnal
     WHERE amal = 'NARX_QOLDA' AND obyekt_turi = 'buyurtma_pozitsiya'
       AND obyekt_id = ${poz}`;
  return q[0]?.n ?? 0;
}

describe('alohida sotuvda ham narx serverda tekshiriladi', () => {
  it('7 metr karniz, jadval narxi (245 000) — belgi YO‘Q', async () => {
    const poz = await sot(karnizId, '245000', '7');

    expect(await belgilandimi(poz)).toBe(false);
    expect(await auditSoni(poz)).toBe(0);
  }, 120_000);

  it('⚠️ 20 metr ARZON bosqichda (640 000) — belgi YO‘Q', async () => {
    const poz = await sot(karnizId, '640000', '20');

    expect(await belgilandimi(poz)).toBe(false);
  }, 120_000);

  it('20 metrni QIMMAT bosqichda yozsa (700 000) — BELGILANADI', async () => {
    /**
     * ⚠️ Aynan shu holat ilgari sezilmasdi: eski sahifa 35 000 ni
     *    ushlab qolgan va 20 × 35 000 = 700 000 deb yozgan bo'lardi.
     *    Jadval esa 640 000 deydi.
     */
    const poz = await sot(karnizId, '700000', '20');

    expect(await belgilandimi(poz)).toBe(true);
    expect(await auditSoni(poz)).toBe(1);
  }, 120_000);

  it('⚠️ BLOKLAMAYDI — narx sotuvchi yozganicha saqlanadi', async () => {
    const poz = await sot(karnizId, '700000', '20');

    const q = await sql<{ narx_snapshot: string }[]>`
      SELECT narx_snapshot::text FROM buyurtma_pozitsiya WHERE id = ${poz}`;
    expect(q[0]?.narx_snapshot).toBe('700000.00');
  }, 120_000);

  it('audit yozuvida jadval narxi ham, yozilgani ham bor', async () => {
    const poz = await sot(karnizId, '700000', '20');

    const a = await sql<{ eski: unknown; yangi: unknown }[]>`
      SELECT eski_qiymat AS eski, yangi_qiymat AS yangi FROM audit_jurnal
       WHERE amal = 'NARX_QOLDA' AND obyekt_id = ${poz}`;

    expect(JSON.stringify(a[0]?.eski)).toContain('640000');
    expect(JSON.stringify(a[0]?.yangi)).toContain('700000');
  }, 120_000);

  it('darajasi YO‘Q buyum — o‘z narxi × soni, 3 × 90 000', async () => {
    const poz = await sot(pultId, '270000', null, 3);

    expect(await belgilandimi(poz)).toBe(false);
  }, 120_000);

  it('darajasi yo‘q buyum boshqa summada sotilsa — BELGILANADI', async () => {
    const poz = await sot(pultId, '200000', null, 3);

    expect(await belgilandimi(poz)).toBe(true);
    expect(await auditSoni(poz)).toBe(1);
  }, 120_000);

  it('100 so‘mgacha farq e’tiborga olinmaydi — yaxlitlash shovqini', async () => {
    const poz = await sot(pultId, '270050', null, 3);

    expect(await belgilandimi(poz)).toBe(false);
  }, 120_000);
});
