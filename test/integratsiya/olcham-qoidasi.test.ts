/**
 * O'LCHAM QOIDASI ZANJIRI — 0053.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    Domen testlari (EC-OLQ-01…26) hisobning O'ZINI tekshiradi va
 *    ular yashil bo'lishi hech narsani anglatmaydi: 0049 da forma
 *    yuborardi, sxema qabul qilardi, server esa maydonni JIMGINA
 *    TASHLAB YUBORARDI — barcha testlar yashil turib, ma'lumot
 *    bazaga yetib bormasdi.
 *
 *    Shuning uchun bu test QATLAMLAR ORASIDAN o'tadi:
 *
 *      1. Konstruktor      — o'rnatish turlari jadvalga tushdimi
 *      2. Katalog          — sotuv ekraniga qaytib keldimi
 *      3. Buyurtma         — oyna o'lchami va SNAPSHOT yozildimi
 *      4. Tahrir           — o'lcham qoidadan chiqsa bayroq qo'yiladimi
 *      5. Qayta saqlash    — eski qoida nofaol bo'ladimi
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mahsulotTuriTahrirla, mahsulotTuriYarat } from '@/lib/amal/konstruktor';
import { turTafsili } from '@/lib/amal/katalog';
import { buyurtmaYarat } from '@/lib/amal/buyurtma';
import { tayyorOlcham } from '@/lib/domain/olcham-qoidasi';
import type { MahsulotTurKirimi } from '@/lib/sxema/konstruktor';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let guruhId = 0;
let matoId = 0;
let turId = 0;
let slotId = 0;

const FILIAL = 1;
const XODIM = 1;

const belgi = `OLQ-${String(Date.now()).slice(-8)}`;
let urinish = 0;
const hujjatRaqami = (): string => {
  urinish += 1;
  return `${belgi}-B${String(urinish)}`;
};

const ORNATISHLAR = [
  { nom: 'Oyna ustiga', eniQoshimchaM: 0.1, boyiQoshimchaM: 0.15, standartmi: true },
  { nom: 'Proyomga', eniQoshimchaM: -0.01, boyiQoshimchaM: -0.01, standartmi: false },
];

function asosiyKirim(ornatishlar: MahsulotTurKirimi['ornatishlar']): MahsulotTurKirimi {
  return {
    nom: `${belgi} tur`,
    xizmatHaqi: '0',
    tartib: '1',
    oynadaKorinadi: true,
    botdaKorinadi: true,
    slotlar: [
      {
        nom: 'Mato',
        formula: 'MAYDON',
        majburiy: true,
        almashtirishGuruhId: guruhId,
        koeffitsient: 1,
        kesishTuri: 'ENIGA' as const,
        kesimEniM: null,
      },
    ],
    parametrlar: [],
    aksessuarlar: [],
    ornatishlar,
  };
}

beforeAll(async () => {
  sql = sinovUlanishi();

  const g = await sql<{ id: number }[]>`
    INSERT INTO almashtirish_guruh (nom, yaratdi_id)
    VALUES (${`${belgi} guruh`}, ${XODIM}) RETURNING id`;
  guruhId = g[0]?.id ?? 0;
  expect(guruhId).toBeGreaterThan(0);

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          almashtirish_guruh_id, yaratdi_id)
    VALUES (${`${belgi} mato`}, 'RULON', 'rulon', 'KV_M', ${guruhId}, ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;
  expect(matoId).toBeGreaterThan(0);
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

// ─── 1. Konstruktor ───────────────────────────────────────────────────────

describe('EC-OLQZ · o’rnatish turlari jadvalga tushadi', () => {
  it('EC-OLQZ-01 · tur saqlanadi va qoidalar yoziladi', async () => {
    const n = await mahsulotTuriYarat(sql, asosiyKirim(ORNATISHLAR), XODIM, null);
    expect(n.holat).toBe('SAQLANDI');
    if (n.holat !== 'SAQLANDI') return;
    turId = n.id;

    const sl = await sql<{ id: number }[]>`
      SELECT id FROM mahsulot_slot
       WHERE mahsulot_tur_id = ${turId} AND faol = true LIMIT 1`;
    slotId = sl[0]?.id ?? 0;
    expect(slotId).toBeGreaterThan(0);

    const q = await sql<
      {
        nom: string;
        eni_qoshimcha_m: string;
        boyi_qoshimcha_m: string;
        standartmi: boolean;
      }[]
    >`SELECT nom, eni_qoshimcha_m::text, boyi_qoshimcha_m::text, standartmi
        FROM mahsulot_ornatish
       WHERE mahsulot_tur_id = ${turId} AND faol = true
       ORDER BY tartib`;

    expect(q).toHaveLength(2);
    expect(q[0]?.nom).toBe('Oyna ustiga');
    expect(Number(q[0]?.eni_qoshimcha_m)).toBe(0.1);
    expect(Number(q[0]?.boyi_qoshimcha_m)).toBe(0.15);
    expect(q[0]?.standartmi).toBe(true);
    /** ⚠️ MANFIY saqlanishi shart — proyomga o'rnatish */
    expect(Number(q[1]?.eni_qoshimcha_m)).toBe(-0.01);
    expect(q[1]?.standartmi).toBe(false);
  });

  /**
   * ⚠️ Bazadagi UNIQUE indeks ishlashidan OLDIN domen tekshiruvi
   *    tushunarli xabar berishi kerak: baza xatosi «duplicate key
   *    value violates unique constraint» deb chiqadi va egasi
   *    undan hech narsa tushunmaydi.
   */
  it('EC-OLQZ-02 · ikkita standart NUQSON bo’lib qaytadi', async () => {
    const n = await mahsulotTuriYarat(
      sql,
      asosiyKirim([
        { nom: 'Bir', eniQoshimchaM: 0, boyiQoshimchaM: 0, standartmi: true },
        { nom: 'Ikki', eniQoshimchaM: 0, boyiQoshimchaM: 0, standartmi: true },
      ]),
      XODIM,
      null,
    );
    expect(n.holat).toBe('NUQSON');
    if (n.holat !== 'NUQSON') return;
    expect(n.xabarlar.some((x) => x.includes('BITTA'))).toBe(true);
  });

  it('EC-OLQZ-03 · qoidasiz tur avvalgidek saqlanadi', async () => {
    const n = await mahsulotTuriYarat(sql, asosiyKirim([]), XODIM, null);
    expect(n.holat).toBe('SAQLANDI');
  });
});

// ─── 2. Katalog ───────────────────────────────────────────────────────────

describe('EC-OLQZ · sotuv ekraniga qaytib keladi', () => {
  it('EC-OLQZ-04 · katalog qoidalarni son bo’lib beradi', async () => {
    const t = await turTafsili(turId, FILIAL, sql);
    expect(t).not.toBeNull();
    expect(t?.ornatishlar).toHaveLength(2);

    const ustiga = t?.ornatishlar.find((o) => o.nom === 'Oyna ustiga');
    /**
     * ⚠️ `numeric` postgres.js dan MATN bo'lib keladi (P-13).
     *    `Number()` tushib qolsa bu yerda `'0.10'` chiqardi va
     *    `1.5 + '0.10'` qo'shish o'rniga BIRIKTIRISH bo'lardi.
     */
    expect(typeof ustiga?.eniQoshimchaM).toBe('number');
    expect(ustiga?.eniQoshimchaM).toBe(0.1);
    expect(ustiga?.standartmi).toBe(true);
  });
});

// ─── 3. Buyurtma ──────────────────────────────────────────────────────────

let pozitsiyaId = 0;

describe('EC-OLQZ · oyna o’lchami bazaga yetib boradi', () => {
  /**
   * ⚠️ ENG MUHIM TEST. 0049 da AYNAN shu halqa uzilgan edi: forma
   *    yuborardi, sxema qabul qilardi, server tashlab yuborardi.
   *    Barcha boshqa testlar yashil turardi.
   */
  it('EC-OLQZ-05 · oyna o’lchami va SNAPSHOT yoziladi', async () => {
    const t = await turTafsili(turId, FILIAL, sql);
    const ustiga = t?.ornatishlar.find((o) => o.nom === 'Oyna ustiga');
    expect(ustiga).toBeDefined();
    if (ustiga === undefined) return;

    const tayyor = tayyorOlcham({ eniM: 1.5, boyiM: 2.0 }, ustiga);
    expect(tayyor).toEqual({ eniM: 1.6, boyiM: 2.15 });

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: hujjatRaqami(),
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
            eniM: tayyor.eniM,
            boyiM: tayyor.boyiM,
            soni: 1,
            narxSnapshot: '100000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { slot: 'MAYDON' },
            oynaEniM: 1.5,
            oynaBoyiM: 2.0,
            ornatishId: ustiga.id,
            ornatishNom: ustiga.nom,
            ornatishEniM: ustiga.eniQoshimchaM,
            ornatishBoyiM: ustiga.boyiQoshimchaM,
            olchamQolda: false,
            /**
             * ⚠️ Pozitsiya kamida bitta slot talab qiladi
             *    (`BUYURTMA_BOSH`). Ombor bo'sh bo'lgani uchun band
             *    topilmaydi — bu testga xalaqit qilmaydi: biz
             *    o'lcham ustunlarini tekshiryapmiz.
             */
            slotlar: [
              {
                slotId,
                materialId: matoId,
                hisoblanganMiqdor: '3.4400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M' as const,
                narxSnapshot: '0',
                kerak: { eniM: 1.6, boyiM: 2.15 },
              },
            ],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    expect(pozitsiyaId).toBeGreaterThan(0);

    const q = await sql<
      {
        eni_m: string;
        boyi_m: string;
        oyna_eni_m: string | null;
        oyna_boyi_m: string | null;
        ornatish_id: number | null;
        ornatish_nom: string | null;
        ornatish_eni_m: string | null;
        olcham_qolda: boolean;
      }[]
    >`SELECT eni_m::text, boyi_m::text, oyna_eni_m::text, oyna_boyi_m::text,
             ornatish_id, ornatish_nom, ornatish_eni_m::text, olcham_qolda
        FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;

    const r = q[0];
    expect(r).toBeDefined();
    /** `eni_m` — TAYYOR o'lcham, ma'nosi o'zgarmagan */
    expect(Number(r?.eni_m)).toBe(1.6);
    expect(Number(r?.boyi_m)).toBe(2.15);
    /** Oyna o'lchami — QO'SHIMCHA yozuv */
    expect(Number(r?.oyna_eni_m)).toBe(1.5);
    expect(Number(r?.oyna_boyi_m)).toBe(2.0);
    /** SNAPSHOT (2.3-invariant) */
    expect(r?.ornatish_id).toBe(ustiga.id);
    expect(r?.ornatish_nom).toBe('Oyna ustiga');
    expect(Number(r?.ornatish_eni_m)).toBe(0.1);
    expect(r?.olcham_qolda).toBe(false);
  });

  it('EC-OLQZ-06 · qoidasiz buyurtma avvalgidek yoziladi', async () => {
    const n = await buyurtmaYarat(
      sql,
      {
        raqam: hujjatRaqami(),
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
            eniM: 1.0,
            boyiM: 1.0,
            soni: 1,
            narxSnapshot: '50000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: {},
            slotlar: [
              {
                slotId,
                materialId: matoId,
                hisoblanganMiqdor: '1.0000',
                tuzatilganMiqdor: null,
                birlik: 'KV_M' as const,
                narxSnapshot: '0',
                kerak: { eniM: 1.0, boyiM: 1.0 },
              },
            ],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    const id = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    const q = await sql<{ oyna_eni_m: string | null; olcham_qolda: boolean }[]>`
      SELECT oyna_eni_m::text, olcham_qolda FROM buyurtma_pozitsiya WHERE id = ${id}`;
    /** ⚠️ Yolg'on ma'lumot saqlanmaydi — bo'sh qoladi */
    expect(q[0]?.oyna_eni_m).toBeNull();
    expect(q[0]?.olcham_qolda).toBe(false);
  });
});

// ─── 4. Qayta saqlash ─────────────────────────────────────────────────────

describe('EC-OLQZ · tur qayta saqlanadi', () => {
  /**
   * ⚠️ Eski qatorlar O'CHIRILMAYDI, nofaol qilinadi: buyurtma
   *    ularga havola qiladi (`ornatish_id`). O'chirilsa tashqi
   *    kalit yiqilardi.
   *
   * ⚠️ `standartmi` ustidagi UNIQUE indeks `faol` ga qaraydi —
   *    nofaol qator yangi standartga xalaqit qilmasligi kerak.
   *    Qilsa, turni ikkinchi marta saqlab bo'lmasdi.
   */
  it('EC-OLQZ-07 · eski qoida nofaol bo’ladi, yangisi standart bo’ladi', async () => {
    const n = await mahsulotTuriTahrirla(
      sql,
      turId,
      asosiyKirim([
        { nom: 'Shiftga', eniQoshimchaM: 0.2, boyiQoshimchaM: 0.3, standartmi: true },
      ]),
      XODIM,
      FILIAL,
    );
    expect(n.holat).toBe('SAQLANDI');

    const faol = await sql<{ nom: string }[]>`
      SELECT nom FROM mahsulot_ornatish
       WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(faol).toHaveLength(1);
    expect(faol[0]?.nom).toBe('Shiftga');

    const nofaol = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM mahsulot_ornatish
       WHERE mahsulot_tur_id = ${turId} AND faol = false`;
    expect(nofaol[0]?.n).toBe(2);

    /** ⚠️ ESKI BUYURTMA BUZILMAYDI — snapshot o'z joyida turadi */
    const eski = await sql<{ ornatish_nom: string | null }[]>`
      SELECT ornatish_nom FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(eski[0]?.ornatish_nom).toBe('Oyna ustiga');
  });
});
