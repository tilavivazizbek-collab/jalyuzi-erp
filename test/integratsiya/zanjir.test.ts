/**
 * ZANJIR TESTI — ekranda yaratilgan narsa omborgacha yetib boradimi.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * Har qatlam alohida sinalgan: material amali, kirim, band qilish,
 * buyurtma. Lekin ular ORASIDAGI ulanish sinalmagan edi.
 *
 * Savol shu: yangi ekranlar (material kartochkasi, konstruktor,
 * ro'yxat ichidan qo'shish) haqiqatan butun tizimga ulanganmi, yoki
 * faqat sahifaning o'zi ishlaydimi?
 *
 * Bu test EKRANDAGI amallardan boshlaydi va OMBOR QOLDIG'IGACHA
 * boradi. Oradagi biror halqa uzilgan bo'lsa — test yiqiladi.
 *
 *   1. Guruh qo'shiladi        (ro'yxat ichidan — tez-qosh)
 *   2. Material qo'shiladi     (ro'yxat ichidan, o'lchov birligi bilan)
 *   3. Material kartochkasi    (guruh, narx, rulon o'lchamlari)
 *   4. Kirim hujjati           (rulon omborga tushadi)
 *   5. Mahsulot turi           (konstruktor «sarfi» tanlovi)
 *   6. Sotuv hisobi            (formula → miqdor → narx)
 *   7. Buyurtma + band         (ombordan yechiladi)
 *   8. Ombor qoldig'i          (bo'lak BAND ga o'tdimi)
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guruhTezYarat, materialTezYarat } from '@/lib/amal/tez-qosh';
import { materialTahrirla } from '@/lib/amal/material';
import { kirimYarat } from '@/lib/amal/kirim';
import { mahsulotTuriYarat } from '@/lib/amal/konstruktor';
import { turTafsili } from '@/lib/amal/katalog';
import { buyurtmaYarat } from '@/lib/amal/buyurtma';
import { sarfFormulasi } from '@/lib/domain/sarf-turi';
import { BIRLIK_TAVSIFI } from '@/lib/domain/birlik-tanlovi';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { sm } from '@/lib/domain/birlik';
import { katalogNarxi } from '@/lib/domain/narx';
import { kurs, pulMatn, type Som } from '@/lib/domain/pul';
import { filialNarxiBelgila } from '@/lib/amal/filial-narx';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

const FILIAL = 1;
const XODIM = 1;

/** Har ishga tushirishda nomlar takrorlanmasin */
const belgi = `ZNJ-${String(Date.now()).slice(-8)}`;

/**
 * ⚠️ Hujjat raqami butun tizimda noyob. Vitest yiqilgan testni
 *    QAYTA urinadi — o'sha raqam ikkinchi marta yozilsa baza rad
 *    etadi va asl xato ko'rinmay qoladi.
 */
let urinish = 0;
const hujjatRaqami = (qism: string): string => {
  urinish += 1;
  return `${belgi}-${qism}${String(urinish)}`;
};

let guruhId = 0;
let matoId = 0;
let turId = 0;
let slotId = 0;

beforeAll(() => {
  sql = sinovUlanishi();
}, 120_000);

afterAll(async () => {
  await sql.end();
});

// ─── 1-2. Ro'yxat ichidan qo'shish ────────────────────────────────────────

describe("1. Ro'yxat ichidan qo'shilgan narsa bazaga tushadi", () => {
  it('guruh yaratiladi', async () => {
    const g = await guruhTezYarat(`${belgi} matolar`, XODIM);
    guruhId = g.id;
    expect(guruhId).toBeGreaterThan(0);
  });

  it("material o'lchov birligi bilan yaratiladi", async () => {
    const m = await materialTezYarat(`${belgi} mato`, 'RULON', XODIM);
    matoId = m.id;

    const q = await sql<
      { hisob_turi: string; kirim_birligi: string; sarflash_birligi: string }[]
    >`SELECT hisob_turi, kirim_birligi, sarflash_birligi
      FROM material WHERE id = ${matoId}`;

    /**
     * ⚠️ Ekranda BITTA tanlov qilingan edi («Rulon»), bazada esa
     *    uchta ustun to'lishi kerak. Shu joyda uzilish bo'lsa
     *    material ombordan noto'g'ri yechilardi.
     */
    const t = BIRLIK_TAVSIFI.RULON;
    expect(q[0]?.hisob_turi).toBe(t.hisobTuri);
    expect(q[0]?.kirim_birligi).toBe(t.kirimBirligi);
    expect(q[0]?.sarflash_birligi).toBe(t.sarflashBirligi);
  });
});

// ─── 3. Material kartochkasi ─────────────────────────────────────────────

describe('2. Kartochkada to‘ldirilgani saqlanadi', () => {
  it('guruh, narx va rulon o‘lchamlari yoziladi', async () => {
    const n = await materialTahrirla(
      sql,
      matoId,
      {
        nom: `${belgi} mato`,
        hisobTuri: 'RULON',
        kirimBirligi: 'rulon',
        sarflashBirligi: 'KV_M',
        koeffitsient: '1',
        sotuvNarx: '120000',
        sotuvValyuta: 'SOM',
        kutilayotganKelishNarx: '78000',
        kutilayotganKelishValyuta: 'SOM',
        minUstamaFoiz: undefined,
        yaroqsizChegaraM: undefined,
        kamIshlatiladiganM: undefined,
        kamQoldiqChegaraM: undefined,
        standartRulonEniM: '3',
        odatdagiRulonBoyiM: '30',
        almashtirishGuruhId: guruhId,
        yaxlitlashQadami: undefined,
        eslatma: undefined,
      },
      XODIM,
      FILIAL,
    );

    expect(n.holat).toBe('SAQLANDI');

    const q = await sql<
      {
        almashtirish_guruh_id: number | null;
        sotuv_narx: string | null;
        kutilayotgan_kelish_narx: string | null;
        standart_rulon_eni_m: string | null;
        odatdagi_rulon_boyi_m: string | null;
      }[]
    >`SELECT almashtirish_guruh_id, sotuv_narx, kutilayotgan_kelish_narx,
             standart_rulon_eni_m, odatdagi_rulon_boyi_m
      FROM material WHERE id = ${matoId}`;

    expect(q[0]?.almashtirish_guruh_id).toBe(guruhId);
    expect(Number(q[0]?.sotuv_narx)).toBe(120000);
    /** ⚠️ Kutilayotgan narx — kirimni to'ldirish uchun, tannarx emas */
    expect(Number(q[0]?.kutilayotgan_kelish_narx)).toBe(78000);
    expect(Number(q[0]?.standart_rulon_eni_m)).toBe(3);
    expect(Number(q[0]?.odatdagi_rulon_boyi_m)).toBe(30);
  });
});

// ─── 4. Kirim ────────────────────────────────────────────────────────────

describe('3. Kirim hujjati rulonni omborga tushiradi', () => {
  it('bo‘lak yaratiladi va tannarx KIRIMDAN keladi', async () => {
    const y = await sql<{ id: number }[]>`
      INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
      VALUES (${`${belgi} yetkazuvchi`}, ${XODIM}) RETURNING id`;

    const n = await kirimYarat(
      sql,
      {
        raqam: hujjatRaqami('K'),
        sana: new Date().toISOString().slice(0, 10),
        filialId: FILIAL,
        yetkazibBeruvchiId: y[0]?.id ?? 0,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
        qatorlar: [
          {
            materialId: matoId,
            miqdorKirim: 1,
            narxBirlik: '7020000',
            defektMiqdor: 0,
            defektTuri: null,
            // 3 × 30 m rulon — kartochkadagi o'lchamlar bilan bir xil
            bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
          },
        ],
      },
      XODIM,
    );

    expect(n.kirimId).toBeGreaterThan(0);

    const b = await sql<
      { id: number; holat: string; eni_m: string; boyi_m: string; tannarx: string }[]
    >`SELECT id, holat, eni_m, boyi_m, tannarx_birlik_snapshot AS tannarx
      FROM bolak WHERE material_id = ${matoId} AND faol = true
      ORDER BY id DESC LIMIT 1`;

    expect(b.length).toBe(1);
    /** ⚠️ `BOSH` — «bo'sh», ya'ni omborda erkin turibdi (7.3) */
    expect(b[0]?.holat).toBe('BOSH');
    /**
     * ⚠️ TZ 5.4 — tannarx KIRIMDAN keladi, kartochkadagi
     *    «kutilayotgan» narxdan emas. 7 020 000 / 90 kv.m = 78 000.
     */
    expect(Number(b[0]?.tannarx)).toBeCloseTo(78000, 0);
  });
});

// ─── 5. Konstruktor ──────────────────────────────────────────────────────

describe('4. Konstruktordagi «sarfi» tanlovi formulaga aylanadi', () => {
  it('mahsulot turi slot bilan saqlanadi', async () => {
    /** Ekranda: «Maydondan × 2» — ikki qavat mato */
    const formula = sarfFormulasi('MAYDON', '2');
    expect(formula).toBe('MAYDON * 2');

    const n = await mahsulotTuriYarat(
      sql,
      {
        nom: `${belgi} Rollo`,
        xizmatHaqi: '50000',
        tartib: '0',
        oynadaKorinadi: true,
        botdaKorinadi: true,
        slotlar: [
          {
            // Slot nomi guruh nomidan olinadi (ekranda so'ralmaydi)
            nom: `${belgi} matolar`,
            formula,
            majburiy: true,
            almashtirishGuruhId: guruhId,
          },
        ],
        parametrlar: [],
        aksessuarlar: [],
      },
      XODIM,
    );

    expect(n.holat).toBe('SAQLANDI');
    turId = n.holat === 'SAQLANDI' ? n.id : 0;
    expect(turId).toBeGreaterThan(0);
  });
});

// ─── 6. Sotuv ekrani ─────────────────────────────────────────────────────

describe('5. Sotuv ekrani turni va uning matolarini ko‘radi', () => {
  it('slot va guruhdagi material sotuvga chiqadi', async () => {
    const tur = await turTafsili(turId, FILIAL);

    expect(tur).not.toBeNull();
    expect(tur?.slotlar.length).toBe(1);

    const slot = tur?.slotlar[0];
    slotId = slot?.id ?? 0;

    /**
     * ⚠️ ENG MUHIM ULANISH: konstruktorda yozilgan formula sotuv
     *    ekraniga o'zgarishsiz yetib borishi kerak. Bu yerda
     *    uzilsa, sotuvchi noto'g'ri miqdor ko'rardi.
     */
    expect(slot?.formula).toBe('MAYDON * 2');

    /**
     * ⚠️ Ro'yxat ichidan qo'shilgan material, kartochkada guruhga
     *    bog'langani uchun, SOTUVDA shu slot ostida chiqishi kerak.
     */
    const matolar = slot?.materiallar ?? [];
    expect(matolar.some((m) => m.id === matoId)).toBe(true);

    const mato = matolar.find((m) => m.id === matoId);
    expect(Number(mato?.narx)).toBe(120000);
  });

  it('formula 210 × 140 uchun to‘g‘ri miqdor beradi', () => {
    const asos = standartQiymatlar(sm(210), sm(140), 1, {});
    /** 2.10 × 1.40 = 2.94 kv.m, ikki qavat → 5.88 kv.m */
    const miqdor = sarflashHisobla('MAYDON * 2', asos, 'KV_M');
    expect(Number(miqdor)).toBeCloseTo(5.88, 4);
  });
});

// ─── 7-8. Buyurtma va ombor ──────────────────────────────────────────────

describe('6. Buyurtma ombordan haqiqatan band qiladi', () => {
  it('bo‘lak BAND ga o‘tadi va band yozuvi yaratiladi', async () => {
    /**
     * ⚠️ Aynan BO'SH turgan bo'lak olinadi. Test qayta urinilsa
     *    oldingi urinish bo'lakni band qilib qo'ygan bo'lishi
     *    mumkin — u holda yangisi kerak.
     */
    const oldin = await sql<{ id: number; holat: string }[]>`
      SELECT id, holat FROM bolak
      WHERE material_id = ${matoId} AND faol = true AND holat = 'BOSH'
      ORDER BY id LIMIT 1`;
    const bolakId = oldin[0]?.id ?? 0;
    expect(oldin[0]?.holat).toBe('BOSH');

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: hujjatRaqami('B'),
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
            eniSm: 210,
            boyiSm: 140,
            soni: 1,
            narxSnapshot: '755600',
            chegirmaSumma: '0',
            xizmatHaqi: '50000',
            formulaSnapshot: { slot: 'MAYDON * 2' },
            slotlar: [
              {
                slotId,
                materialId: matoId,
                hisoblanganMiqdor: '5.8800',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
            ],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    expect(n.materialYetishmadi).toBe(false);
    expect(n.pozitsiyalar[0]?.holat).toBe('TASDIQLANGAN');

    /** ⚠️ ZANJIRNING OXIRI: ombordagi bo'lak haqiqatan band bo'ldimi */
    const keyin = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(keyin[0]?.holat).toBe('BAND');

    const band = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}
        AND holat = 'FAOL'`;
    expect(band[0]?.n).toBe(1);
  });
});

// ─── 7. Dollardagi narx ──────────────────────────────────────────────────

/**
 * ⚠️ 2026-08-27 auditida topilgan uzilish: material narxi dollarda
 *    yozilsa ham, sotuv ekrani `sotuv_valyuta` ustunini umuman
 *    o'qimasdi. 12 $ narx sotuvda 12 SO'M bo'lib chiqardi —
 *    ya'ni ~12 800 barobar arzon.
 */
describe('7. Dollardagi material narxi sotuvga to‘g‘ri yetadi', () => {
  it('katalog narx bilan birga VALYUTANI ham beradi', async () => {
    await sql`
      UPDATE material SET sotuv_narx = 12, sotuv_valyuta = 'USD'
      WHERE id = ${matoId}`;

    const tur = await turTafsili(turId, FILIAL);
    const mato = tur?.slotlar[0]?.materiallar.find((m) => m.id === matoId);

    expect(Number(mato?.narx)).toBe(12);
    expect(mato?.narxValyuta).toBe('USD');
  });

  it('narx kursga urilib so‘mga aylanadi', async () => {
    const tur = await turTafsili(turId, FILIAL);
    const mato = tur?.slotlar[0]?.materiallar.find((m) => m.id === matoId);

    const k = kurs('12800', new Date(), 'JORIY');
    const somda = katalogNarxi(mato?.narx ?? null, mato?.narxValyuta ?? 'SOM', k);

    expect(pulMatn(somda as Som)).toBe('153600.00');
  });

  it('kurs yo‘q bo‘lsa narx JIMGINA so‘m deb olinmaydi', async () => {
    const tur = await turTafsili(turId, FILIAL);
    const mato = tur?.slotlar[0]?.materiallar.find((m) => m.id === matoId);

    expect(() =>
      katalogNarxi(mato?.narx ?? null, mato?.narxValyuta ?? 'SOM', null),
    ).toThrow();

    // Sinovdan keyin so'mga qaytaramiz — keyingi testlar buzilmasin
    await sql`
      UPDATE material SET sotuv_narx = 120000, sotuv_valyuta = 'SOM'
      WHERE id = ${matoId}`;
  });

  it('filial narxi materialning valyutasini meros oladi (Q-28)', async () => {
    await sql`
      UPDATE material SET sotuv_valyuta = 'USD' WHERE id = ${matoId}`;

    await filialNarxiBelgila(
      sql,
      { materialId: matoId, filialId: FILIAL, narx: '11' },
      XODIM,
    );

    const q = await sql<{ valyuta: string; sotuv_narx: string }[]>`
      SELECT valyuta, sotuv_narx::text FROM material_filial_narx
      WHERE material_id = ${matoId} AND filial_id = ${FILIAL}`;

    /**
     * ⚠️ Filial RAQAMNI o'zgartiradi, valyutani emas. Aks holda
     *    chet mato filialda birdan so'mga aylanib qolardi.
     */
    expect(q[0]?.valyuta).toBe('USD');

    // Katalog ham filial narxining valyutasini bermoqda
    const tur = await turTafsili(turId, FILIAL);
    const mato = tur?.slotlar[0]?.materiallar.find((m) => m.id === matoId);
    expect(Number(mato?.narx)).toBe(11);
    expect(mato?.narxValyuta).toBe('USD');
  });
});
