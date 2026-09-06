/**
 * TZ 7.6 · 11.7.7 · 2.4-invariant
 *
 * «Ostatka bor turib rulon tanlansa — OGOHLANTIRISH.»
 *
 * ⚠️ Bu qoida TZ da bor edi, domainda funksiyasi ham bor edi
 *    (`ostatkaBorRulonTanlandi`), lekin HECH QAYERDAN chaqirilmasdi.
 *    Ya'ni ogohlantirish hech qachon chiqmagan va 11.7.7 hisoboti
 *    doim bo'sh bo'lardi.
 *
 * ⚠️ HOLAT USTADAN KELADI, tanlashdan emas.
 *
 *    Tanlashda tizim qoidaga qat'iy amal qiladi: sig'adigan kesma
 *    har doim rulondan ustun turadi (7.6, 5-qadam). Demak «tizim
 *    noto'g'ri tanladi» degan holat yo'q — dastlab men uni band
 *    qilishga ulagan edim va test aynan shuni ko'rsatdi.
 *
 *    Yozuv «Tugatdim» da tug'iladi: tizim kesmani band qilgan,
 *    usta esa «rulondan kesdim» deydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { ishniOl, tugatdim } from '@/lib/amal/ish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let hisoblagich = 0;
let turId = 0;
let slotId = 0;

const FILIAL = 1;
const XODIM = 1;

/** Har test o'z matosini oladi — aks holda testlar bir-birini buzadi */
async function matoYarat(): Promise<number> {
  hisoblagich += 1;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`Ogoh sinov matosi ${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 'rulon', 'KV_M', 0.5, 1.0, ${XODIM})
    RETURNING id`;
  return m[0]?.id ?? 0;
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Ogoh sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

async function bolakYarat(
  matoId: number,
  turi: 'RULON' | 'OSTATKA',
  eniM: number,
  boyiM: number,
): Promise<{ id: number; kod: string }> {
  hisoblagich += 1;
  const kod = `${turi === 'RULON' ? 'R' : 'O'}-OGOH-${String(Date.now())}-${String(hisoblagich)}`;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL}, ${kod}, ${turi}, ${eniM}, ${boyiM}, 20000, ${XODIM})
    RETURNING id`;
  return { id: q[0]?.id ?? 0, kod };
}

/**
 * Buyurtma → ishni ol → «Tugatdim».
 *
 * `manba` — usta AYTGAN manba. Tizim nimani band qilganidan qat'i
 * nazar, haqiqat ustada (7.6).
 */
async function ishlaTugat(
  matoId: number,
  manba: 'RULON' | 'OSTATKA',
): Promise<number> {
  hisoblagich += 1;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-OGOH-${String(Date.now())}-${String(hisoblagich)}`,
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
        eniSm: 140,
        boyiSm: 200,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: true },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '2.8000',
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            kerak: { eniM: 1.4, boyiM: 2.0 },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

  await ishniOl(sql, pozitsiyaId, XODIM, '25000');

  const b = await sql<{ id: number }[]>`
    SELECT id FROM band
    WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL' ORDER BY id`;

  await tugatdim(
    sql,
    {
      pozitsiyaId,
      kesimlar: b.map((x) => ({ bandId: x.id, manba })),
      ogohTasdiqlandi: true,
      izoh: null,
    },
    XODIM,
  );

  return pozitsiyaId;
}

async function ogohlantirishlar(pozitsiyaId: number): Promise<
  { obyekt_id: number; izoh: string | null; kesma_kod: string | null }[]
> {
  return sql<{ obyekt_id: number; izoh: string | null; kesma_kod: string | null }[]>`
    SELECT obyekt_id, izoh, yangi_qiymat ->> 'kesma_kod' AS kesma_kod
    FROM audit_jurnal
    WHERE amal = 'RULON_OCHILDI'
      AND obyekt_turi = 'bolak'
      AND (yangi_qiymat ->> 'pozitsiya_id')::bigint = ${pozitsiyaId}`;
}

// ─── Ogohlantirish chiqadigan holat ───────────────────────────────────────

describe('TZ 7.6 · 11.7.7 — kesma band edi, usta rulondan kesdi', () => {
  it('audit jurnaliga RULON_OCHILDI yozuvi tushadi', async () => {
    const matoId = await matoYarat();
    // Kesma buyurtmaga sig'adi — tizim uni band qiladi (7.6, 5-qadam)
    const kesma = await bolakYarat(matoId, 'OSTATKA', 1.5, 3.0);

    // Usta esa «rulondan kesdim» deydi
    const pozitsiyaId = await ishlaTugat(matoId, 'RULON');

    const yozuvlar = await ogohlantirishlar(pozitsiyaId);
    expect(yozuvlar).toHaveLength(1);
    expect(yozuvlar[0]?.obyekt_id).toBe(kesma.id);
    expect(yozuvlar[0]?.kesma_kod).toBe(kesma.kod);
    expect(yozuvlar[0]?.izoh).toContain(kesma.kod);
  });

  /**
   * ⚠️ TZ 7.6 aniq aytadi: OGOHLANTIRISH, bloklash emas. Kesma iflos
   *    yoki yirtiq bo'lishi mumkin va usta haq bo'lishi mumkin.
   */
  it('ish TO\'XTAMAYDI — bu ogohlantirish, to\'siq emas', async () => {
    const matoId = await matoYarat();
    await bolakYarat(matoId, 'OSTATKA', 1.5, 3.0);

    const pozitsiyaId = await ishlaTugat(matoId, 'RULON');

    const p = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(['TAYYOR', 'TAYYOR_YOLDA']).toContain(p[0]?.holat);
  });
});

// ─── Ogohlantirish CHIQMAYDIGAN holatlar ──────────────────────────────────

describe('TZ 7.6 — behuda ogohlantirish chiqmaydi', () => {
  it('usta kesmadan kesdim desa yozuv YO\'Q', async () => {
    const matoId = await matoYarat();
    await bolakYarat(matoId, 'OSTATKA', 1.5, 3.0);

    const pozitsiyaId = await ishlaTugat(matoId, 'OSTATKA');
    expect(await ogohlantirishlar(pozitsiyaId)).toHaveLength(0);
  });

  /**
   * ⚠️ Rulon band qilingan bo'lsa, usta «rulondan kesdim» deyishi
   *    TABIIY — o'tkazib yuborilgan kesma yo'q. Yozuv chiqmasligi
   *    kerak, aks holda hisobot behuda to'lib ketardi.
   */
  it('rulon band qilingan bo\'lsa yozuv YO\'Q', async () => {
    const matoId = await matoYarat();
    // Omborda faqat rulon bor
    await bolakYarat(matoId, 'RULON', 3.0, 30.0);

    const pozitsiyaId = await ishlaTugat(matoId, 'RULON');
    expect(await ogohlantirishlar(pozitsiyaId)).toHaveLength(0);
  });
});
