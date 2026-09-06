/**
 * TZ 3.5 · 3.6 · §9.4 — OMBOR SARFLASHI SERVERDA TEKSHIRILADI
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    `sarflashHisobla` butun tizimda faqat BRAUZERDA chaqilardi.
 *    Server kelgan raqamni `^\d+(\.\d+)?$` bilan tekshirib bazaga
 *    yozardi — ya'ni ombordan yechiladigan miqdorni brauzer
 *    belgilardi.
 *
 *    Eng ehtimolli zarar — yomon niyat emas, ESKI SAHIFA: sotuvchida
 *    ochiq turgan forma eski formulani ushlab qoladi va admin
 *    formulani o'zgartirgach ham eskicha yuboraveradi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let hisoblagich = 0;
let matoId = 0;
let turId = 0;
let slotId = 0;

const FILIAL = 1;
const XODIM = 1;

/** Formula: `ENI * BO'YI` → 140 × 200 sm = 28 000 kv.sm = 2.80 kv.m */
const ENI_SM = 140;
const BOYI_SM = 200;
const TOGRI = '2.8000';

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Sarflash sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Sarflash sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

function kirimYasa(
  miqdor: string,
  ozgarish: { slotId?: number; birlik?: string; materialId?: number } = {},
): BuyurtmaKirimi {
  hisoblagich += 1;
  return {
    raqam: `B-SARF-${String(Date.now())}-${String(hisoblagich)}`,
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
        eniSm: ENI_SM,
        boyiSm: BOYI_SM,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: true },
        slotlar: [
          {
            slotId: ozgarish.slotId ?? slotId,
            materialId: ozgarish.materialId ?? matoId,
            hisoblanganMiqdor: miqdor,
            tuzatilganMiqdor: null,
            birlik: (ozgarish.birlik ?? 'KV_M') as 'KV_M' | 'SM' | 'DONA',
            narxSnapshot: '120000',
            kerak: { eniM: 1.4, boyiM: 2.0 },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };
}

// ─── To'g'ri yo'l ─────────────────────────────────────────────────────────

describe('TZ 3.5 — formula natijasi mos kelsa buyurtma yoziladi', () => {
  it('140 × 200 → 2.8000 kv.m qabul qilinadi', async () => {
    const n = await buyurtmaYarat(sql, kirimYasa(TOGRI), XODIM);
    expect(n.buyurtmaId).toBeGreaterThan(0);

    const pm = await sql<{ hisoblangan_miqdor: string }[]>`
      SELECT hisoblangan_miqdor::text FROM pozitsiya_material
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}`;
    expect(Number(pm[0]?.hisoblangan_miqdor)).toBeCloseTo(2.8, 4);
  });

  /**
   * ⚠️ O'nlik yaxlitlash farqi RAD ETILMAYDI: brauzer 2.8 ni
   *    `2.8000` deb ham, `2.7999` deb ham yuborishi mumkin.
   */
  it('juda kichik farq qabul qilinadi', async () => {
    await expect(buyurtmaYarat(sql, kirimYasa('2.80005'), XODIM)).resolves.toBeDefined();
  });
});

// ─── Rad etiladigan holatlar ──────────────────────────────────────────────

describe('§9.4 — brauzerdan kelgan sarflashga ishonilmaydi', () => {
  it('KAM miqdor rad etiladi — ombordan kam yechilardi', async () => {
    await expect(buyurtmaYarat(sql, kirimYasa('0.0100'), XODIM)).rejects.toThrow(BiznesXato);
  });

  it('KO\'P miqdor rad etiladi — ombordan ortiqcha yechilardi', async () => {
    await expect(buyurtmaYarat(sql, kirimYasa('99.0000'), XODIM)).rejects.toThrow(BiznesXato);
  });

  it('rad etilganda buyurtma UMUMAN yozilmaydi (2.1)', async () => {
    const kirim = kirimYasa('0.0100');
    await expect(buyurtmaYarat(sql, kirim, XODIM)).rejects.toThrow(BiznesXato);

    const b = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma WHERE raqam = ${kirim.raqam}`;
    expect(b[0]?.n).toBe(0);
  });

  /**
   * ⚠️ Boshqa mahsulot turining sloti bilan yozib bo'lmaydi: aks
   *    holda formulani boshqa yo'lga burish mumkin bo'lardi.
   */
  it('begona slot rad etiladi', async () => {
    const boshqa = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
      SELECT id, 'Begona', 9, ${'ENI'}, ${XODIM} FROM mahsulot_tur
      WHERE id <> ${turId} AND faol = true LIMIT 1
      RETURNING id`;
    const begonaId = boshqa[0]?.id;
    if (begonaId === undefined) return; // sinov bazasida boshqa tur yo'q

    await expect(
      buyurtmaYarat(sql, kirimYasa(TOGRI, { slotId: begonaId }), XODIM),
    ).rejects.toThrow(BiznesXato);
  });

  /**
   * ⚠️ Birlik ham BAZADAN olinadi. `KV_M` material `DONA` deb
   *    yuborilsa, formula natijasi butunlay boshqa songa aylanardi.
   */
  it('noto\'g\'ri birlik rad etiladi', async () => {
    await expect(
      buyurtmaYarat(sql, kirimYasa(TOGRI, { birlik: 'DONA' }), XODIM),
    ).rejects.toThrow(BiznesXato);
  });
});
