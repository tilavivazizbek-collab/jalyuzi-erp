/**
 * MIQDOR BO'YICHA BOSQICH — egasi qarori 2026-09-22
 *
 * ⚠️ EGASI: «ko'p olganga arzonroq beriladi — muni matoni qilgandek
 *    belgilab qo'yish orqali hal qilsa bo'ladi».
 *
 *    Ya'ni karniz va donalab sotiladigan buyum ham «Narxlar va
 *    turlar» → «Materialni o'zi sotish» jadvalidan narx oladi.
 *    Farqi: bosqich SOTILAYOTGAN MIQDORGA qarab tanlanadi.
 *
 * ⚠️ BU TEST EKRAN SO'ROVLARINI ham chaqiradi: qoida bazada turishi
 *    kam — u sotuv ekraniga YETIB BORISHI kerak. Ekran qoidani
 *    `materialNarxQoidalari()` dan oladi va o'zi hisoblaydi.
 *
 * ⚠️ 0057 — DARAJA OLIB TASHLANDI, QAMROV KENGAYDI.
 *
 *    Ilgari bu jadval MATO DARAJASIGA tegishli edi: darajasi yo'q
 *    buyum o'zining `sotuv_narx` idan sotilardi. Daraja olib
 *    tashlangach «Materialni o'zi sotish» jadvali BITTA bo'lib
 *    qoldi — u endi to'g'ridan sotiladigan HAMMA materialga
 *    tegishli.
 *
 *    Shu sababli «darajasi yo'q buyum eski yo'l bilan» sinovi bu
 *    yerdan olib tashlandi: endi bunday holat yo'q. Har materialga
 *    ALOHIDA miqdor jadvali kerak bo'lsa, qator materialga
 *    bog'lanishi shart — bu egasiga berilgan ochiq savol.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  materialNarxQoidalari,
  qoshimchaMateriallar,
} from '@/app/(panel)/buyurtma/yangi/malumot';
import { pozitsiyaQoidaNarxi } from '@/lib/domain/narx-qoidasi';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let karnizId = 0;
let narxId = 0;

const FILIAL = 1;
const XODIM = 1;
const belgi = String(Date.now());

/** Egasi misoli: 10 metrgacha 35 000, undan ko'p bo'lsa 32 000 */
const ARZON_CHEGARA = 10;
const QIMMAT = '35000';
const ARZON = '32000';

beforeAll(async () => {
  sql = sinovUlanishi();

  /** Karniz — metrlab sotiladi */
  const k = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, sotuv_narx, sotuv_valyuta,
                          togridan_sotiladi, yaratdi_id)
    VALUES (${`MB karniz ${belgi}`}, 'CHIZIQLI', 'metr', 'M',
            1, ${QIMMAT}, 'SOM', true, ${XODIM})
    RETURNING id`;
  karnizId = k[0]?.id ?? 0;

  /*
   * ⚠️ «Materialni o'zi sotish» qatori BITTA va UMUMIY — 0057.
   *    Shuning uchun avval eskisi nofaol qilinadi: boshqa test
   *    qoldirgan qator turib qolsa noyoblik indeksiga urilardi.
   */
  await sql`
    UPDATE mahsulot_narx SET faol = false
     WHERE mahsulot_tur_id IS NULL AND hamma_turga = false
       AND mijoz_turi_id IS NULL AND filial_id IS NULL AND faol = true`;

  const n = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_narx (mahsulot_tur_id, hamma_turga, hisoblash_usuli,
                               yaratdi_id)
    VALUES (NULL, false, 'MIQDOR', ${XODIM})
    ON CONFLICT (coalesce(mahsulot_tur_id, 0), hamma_turga,
                 coalesce(material_id, 0),
                 coalesce(mijoz_turi_id, 0), coalesce(filial_id, 0))
      WHERE faol
    DO UPDATE SET hisoblash_usuli = 'MIQDOR', faol = true, ochirildi = NULL
    RETURNING id`;
  narxId = n[0]?.id ?? 0;

  /** Qayta yurishda eski bosqichlar aralashmasin */
  await sql`
    UPDATE mahsulot_narx_bosqich SET faol = false
     WHERE mahsulot_narx_id = ${narxId} AND faol = true`;

  await sql`
    INSERT INTO mahsulot_narx_bosqich (mahsulot_narx_id, dan, gacha, narx,
                                       valyuta, tartib, yaratdi_id)
    VALUES (${narxId}, 0, ${ARZON_CHEGARA}, ${QIMMAT}, 'SOM', 0, ${XODIM}),
           (${narxId}, ${ARZON_CHEGARA}, NULL, ${ARZON}, 'SOM', 1, ${XODIM})`;
}, 120_000);

afterAll(async () => {
  /** ⚠️ O'chirilmaydi — nofaol qilinadi (2.1-invariant) */
  await sql`UPDATE material SET faol = false WHERE nom LIKE ${`MB %${belgi}`}`;
  await sql.end({ timeout: 5 });
});

/** Sotuv ekrani narxni AYNAN shunday hisoblaydi (`qoshimcha.tsx`) */
async function ekranNarxi(materialId: number, miqdor: number): Promise<string | null> {
  const [materiallar, qoidalar] = await Promise.all([
    qoshimchaMateriallar(FILIAL),
    materialNarxQoidalari(FILIAL),
  ]);

  const m = materiallar.find((x) => x.id === materialId);
  if (m === undefined) return null;

  const q = qoidalar.find((x) => x.mijozTuriId === null && x.filialId === null);

  /** Qoida yo'q — materialning o'z narxi × miqdor (eski yo'l) */
  if (q === undefined || q.hisoblashUsuli !== 'MIQDOR') {
    return m.narx === null ? null : (Number(m.narx) * miqdor).toFixed(2);
  }

  return pozitsiyaQoidaNarxi({
    qoida: {
      hisoblashUsuli: 'MIQDOR',
      bosqichlar: q.bosqichlar.map((b) => ({
        dan: b.dan,
        gacha: b.gacha,
        narx: b.narx,
        valyuta: b.valyuta,
      })),
    },
    eniM: 0,
    boyiM: 0,
    miqdor,
    qoshimchalar: [],
    offset: null,
    kurs: null,
  }).jami;
}

describe('egasi qarori 2026-09-22 — ko‘p olganga arzonroq', () => {
  it('qoida ekranga yetib boradi — usuli MIQDOR', async () => {
    const q = await materialNarxQoidalari(FILIAL);
    const meniki = q.find((x) => x.mijozTuriId === null && x.filialId === null);

    expect(meniki?.hisoblashUsuli).toBe('MIQDOR');
    expect(meniki?.bosqichlar).toHaveLength(2);
  }, 120_000);

  it('7 metr — qimmat bosqich: 7 × 35 000 = 245 000', async () => {
    expect(await ekranNarxi(karnizId, 7)).toBe('245000.00');
  }, 120_000);

  it('⚠️ 20 metr — ARZON bosqich: 20 × 32 000 = 640 000', async () => {
    expect(await ekranNarxi(karnizId, 20)).toBe('640000.00');
  }, 120_000);

  it('AYNAN 10 metr keyingi bosqichga tushadi — [dan, gacha)', async () => {
    expect(await ekranNarxi(karnizId, 10)).toBe('320000.00');
  }, 120_000);

  it('ko‘p olgan KAM olgandan arzonga tushmaydi', async () => {
    const on = Number(await ekranNarxi(karnizId, 10));
    const toqqiz = Number(await ekranNarxi(karnizId, 9));

    expect(on).toBeGreaterThan(toqqiz);
  }, 120_000);
});
