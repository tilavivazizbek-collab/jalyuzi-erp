/**
 * AUDIT — sarf hisobi va kesim to'rtburchagi (vaqtinchalik audit fayli).
 *
 * Bu fayl XATO QIDIRMAYDI va hech narsani tuzatmaydi — u HOZIRGI
 * xatti-harakatni raqam bilan qayd etadi. Har test nomida topilma
 * raqami bor; hisobotdagi sonlar aynan shu testlardan olingan.
 *
 * 🛠️ 2026-09-17: 1·2·4·5·6·7-topilmalar TUZATILDI (ishlab chiqarish kodi
 *    o'zgartirildi: kesish.ts eni/bo'yi YUQORIGA yaxlitlanadi + kesish
 *    yo'nalishi (ENIGA/BO'YIGA); formula tiliga CEIL/ROUND/MIN/MAX
 *    qo'shildi; sarflash.ts soniUchun ishlatadi; konstruktorda slot
 *    koeffitsienti). Shu topilmalarning testlari endi TUZATILGAN xulqni
 *    qayd etadi.
 *
 * Ishga tushirish: npm test -- audit-sarf
 */
import { describe, expect, it } from 'vitest';
import { sarflashHisobla, slotSarfi, soniUchun, standartQiymatlar } from '@/lib/domain/formula';
import { sm } from '@/lib/domain/birlik';
import {
  kesimOlchami,
  kesimQatorlari,
  kesimRejasi,
  sigadimi,
  type Bolak,
  type Chegaralar,
} from '@/lib/domain/kesish';

const STANDART: Chegaralar = { yaroqsizM: null, kamIshlatiladiganM: null };

const bolak = (eniM: number, boyiM: number, turi: 'RULON' | 'OSTATKA' = 'RULON'): Bolak => ({
  id: 1,
  kod: 'T-1',
  turi,
  eniM,
  boyiM,
  qismanOchilgan: false,
});

/** Sotuv zanjirining aynan o'zi: formula → kv.m → kesim to'rtburchagi */
function zanjir(formula: string, eniSm: number, boyiSm: number, chet?: number) {
  const qiymatlar = standartQiymatlar(
    sm(eniSm),
    sm(boyiSm),
    1,
    chet === undefined ? {} : { CHET: chet },
  );
  const hisoblanganKvM = Number(sarflashHisobla(formula, qiymatlar, 'KV_M'));
  const kerak = kesimOlchami(hisoblanganKvM, boyiSm);
  return { hisoblanganKvM, kerak };
}

// ─── Asos: K = 1 holati to'g'ri ishlaydi ──────────────────────────────────

describe('ASOS — `<eni> × BO\'YI` ko\'rinishidagi formulalar aniq ishlaydi', () => {
  it('Rollo `MAYDON`, 180 × 220 → 3.96 kv.m, kesim 1.80 × 2.20', () => {
    const { hisoblanganKvM, kerak } = zanjir('MAYDON', 180, 220);
    expect(hisoblanganKvM).toBe(3.96);
    expect(kerak).toEqual({ eniM: 1.8, boyiM: 2.2 });
    // Sarf = eni × bo'yi, hisoblangan miqdorga AYNAN teng
    expect(kerak.eniM * kerak.boyiM).toBeCloseTo(hisoblanganKvM, 10);
  });

  it('K-02 kanonik Dikke: uch slot, CHET = 30 → 0.66 + 0.66 + 2.64 = 3.96', () => {
    const chet = zanjir("CHET × BO'YI", 180, 220, 30);
    const orta = zanjir("(ENI − 2×CHET) × BO'YI", 180, 220, 30);

    expect(chet.hisoblanganKvM).toBe(0.66);
    expect(orta.hisoblanganKvM).toBe(2.64);
    expect(chet.hisoblanganKvM * 2 + orta.hisoblanganKvM).toBeCloseTo(3.96, 10);

    // Har slot O'Z to'rtburchagini oladi — P-24 to'g'ri hal qilingan
    expect(chet.kerak).toEqual({ eniM: 0.3, boyiM: 2.2 });
    expect(orta.kerak).toEqual({ eniM: 1.2, boyiM: 2.2 });
  });
});

// ─── 1-TOPILMA ────────────────────────────────────────────────────────────

describe('1-TOPILMA — `MAYDON * K` da ko\'paytiruvchi butunlay ENIGA tushadi', () => {
  it('eniM = (eni metrda) × K, boyiM esa O\'ZGARMAYDI', () => {
    for (const K of [1, 1.5, 2, 3]) {
      const { kerak } = zanjir(`MAYDON * ${String(K)}`, 180, 220);
      expect(kerak.eniM).toBeCloseTo(1.8 * K, 10);
      expect(kerak.boyiM).toBe(2.2); // K ning bo'yiga ta'siri YO'Q
    }
  });

  it('Zebra `MAYDON * 2`, 180 × 220 → 3.60 m KENG bo\'lak izlanadi', () => {
    const { hisoblanganKvM, kerak } = zanjir('MAYDON * 2', 180, 220);
    expect(hisoblanganKvM).toBe(7.92);
    expect(kerak).toEqual({ eniM: 3.6, boyiM: 2.2 });
  });

  it('hech qanday real rulon (2.0–3.0 m) zebraga sig\'maydi', () => {
    const { kerak } = zanjir('MAYDON * 2', 180, 220);
    for (const rulonEni of [2.0, 2.4, 2.8, 3.0]) {
      expect(sigadimi(bolak(rulonEni, 50), kerak)).toBe(false);
    }
    // Fizik jihatdan to'g'ri yechim — 1.80 keng rulondan 4.40 m tortish
    expect(sigadimi(bolak(1.8, 50), { eniM: 1.8, boyiM: 4.4 })).toBe(true);
  });

  it('Plisse `MAYDON * 1.5`: 2.70 m keng talab qilinadi, 1.80 × 3.30 emas', () => {
    const { hisoblanganKvM, kerak } = zanjir('MAYDON * 1.5', 180, 220);
    expect(hisoblanganKvM).toBe(5.94);
    expect(kerak).toEqual({ eniM: 2.7, boyiM: 2.2 });
    // Ikki variant bir xil MAYDON beradi, lekin faqat biri fizik jihatdan bor
    expect(2.7 * 2.2).toBeCloseTo(1.8 * 3.3, 10);
    expect(sigadimi(bolak(1.8, 50), kerak)).toBe(false);
  });

  it('boyiM formula natijasiga BOG\'LIQ EMAS — faqat buyurtma bo\'yidan keladi', () => {
    // Maydon 10 barobar oshsa ham boyiM qimirlamaydi (kesish.ts:474)
    const a = kesimOlchami(3.96, 220);
    const b = kesimOlchami(39.6, 220);
    expect(a.boyiM).toBe(2.2);
    expect(b.boyiM).toBe(2.2);
    expect(b.eniM).toBeCloseTo(a.eniM * 10, 10);
  });
});
// ─── 1-TOPILMA · TUZATISH (2026-09-17) ───────────────────────────────────
// 🛠️ Yangi imkoniyat: kesimOlchami kesish sozlamasini oladi — koefitsient
//    va yo'nalish (`ENIGA`/`BO'YIGA`). `BO'YIGA` da koefitsient BO'YIGA
//    tushadi: Zebra `MAYDON × 2` → 1.8 × 4.4 — haqiqiy rulon sig'adi.

describe("1-TOPILMA · TUZATISH — kesish yo'nalishi: BO'YIGA da koefitsient bo'yiga tushadi", () => {
  it("Zebra `MAYDON`, k=2, BO'YIGA → 7.92 kv.m → 1.8 × 4.4", () => {
    const qiymatlar = standartQiymatlar(sm(180), sm(220), 1, {});
    const jami = slotSarfi('MAYDON', qiymatlar, 'KV_M', 2);
    expect(jami).toBe(7.92); // hisoblangan_miqdor endi JAMI

    const kerak = kesimOlchami(jami, 220, { koeffitsient: 2, yonalish: "BO'YIGA" });
    expect(kerak).toEqual({ eniM: 1.8, boyiM: 4.4 }); // BO'Y 2 barobar

    // Haqiqiy rulon (2.0 m) ENDI SIG'ADI
    expect(sigadimi(bolak(2.0, 10), kerak)).toBe(true);
  });

  it("ENIGA — avvalgi xulq: koefitsient enga tushadi (3.6 × 2.2)", () => {
    const qiymatlar = standartQiymatlar(sm(180), sm(220), 1, {});
    const jami = slotSarfi('MAYDON', qiymatlar, 'KV_M', 2);
    const kerak = kesimOlchami(jami, 220, { koeffitsient: 2, yonalish: 'ENIGA' });
    expect(kerak).toEqual({ eniM: 3.6, boyiM: 2.2 });
  });

  it("k=1 yoki sozlama bo'lmasa — avvalgi xulq (1.8 × 2.2)", () => {
    const q = standartQiymatlar(sm(180), sm(220), 1, {});
    expect(kesimOlchami(slotSarfi('MAYDON', q, 'KV_M', 1), 220)).toEqual({
      eniM: 1.8,
      boyiM: 2.2,
    });
    expect(kesimOlchami(3.96, 220, { koeffitsient: 1, yonalish: "BO'YIGA" })).toEqual({
      eniM: 1.8,
      boyiM: 2.2,
    });
  });

  it("Dikke chet (CHET × BO'YI): BO'YIGA da chet en O'ZGARMAYDI (0.3 × 4.4)", () => {
    const q = standartQiymatlar(sm(180), sm(220), 1, { CHET: 30 });
    const jami = slotSarfi("CHET × BO'YI", q, 'KV_M', 2); // 0.66 × 2 = 1.32
    expect(jami).toBeCloseTo(1.32, 4);
    const kerak = kesimOlchami(jami, 220, { koeffitsient: 2, yonalish: "BO'YIGA" });
    expect(kerak.eniM).toBe(0.3); // chet en o'zgarmaydi
    expect(kerak.boyiM).toBeCloseTo(4.4, 2); // bo'y ×2
  });
});

// ─── 4-TOPILMA ────────────────────────────────────────────────────────────
// 🛠️ 2026-09-17 TUZATILDI — eni YUQORIGA yaxlitlanadi (kesish.ts:490):
//    ombordan yechiladigan miqdor hech qachon hisoblangan_miqdordan
//    KICHIK emas. Kamomad o'rniga ≤ 1 sm en zaxirasi qoladi.

describe("4-TOPILMA — ombordan yechiladigan miqdor endi hisoblangan_miqdordan KAM EMAS (tuzatildi)", () => {
  it("`MAYDON * 1.15`, 183 × 227 → eni 2.11 (yuqoriga), kamomad yo'q", () => {
    const { hisoblanganKvM, kerak } = zanjir('MAYDON * 1.15', 183, 227);

    expect(hisoblanganKvM).toBe(4.7772); // mijozdan shu uchun pul olinadi
    expect(kerak).toEqual({ eniM: 2.11, boyiM: 2.27 }); // 2.104493… → 2.11 (ROUND_CEIL)

    const sarf = kerak.eniM * kerak.boyiM; // ombordan yechiladigani
    expect(sarf).toBeCloseTo(4.7897, 4);

    // Kamomad YO'Q — ombor sarfi hisobdan kam bo'lmaydi
    expect(sarf).toBeGreaterThanOrEqual(hisoblanganKvM);
    // Zaxira ≤ 1 sm en (0.01 m) — yaxlitlash qadamidan katta emas
    expect(kerak.eniM - 4.7772 / 2.27).toBeLessThanOrEqual(0.01 + 1e-9);
  });

  it('yuqoriga yaxlitlash — ortiqcha (zaxira) yechiladigan holat normal', () => {
    // eniM endi DOIM yuqoriga yaxlitlanadi: ombordan hisobdan ko'p yechiladi
    const { hisoblanganKvM, kerak } = zanjir('MAYDON * 1.07', 183, 227);
    const sarf = kerak.eniM * kerak.boyiM;
    expect(sarf).toBeGreaterThan(hisoblanganKvM);
  });

  it('sof sarf = kerak.eniM × kerak.boyiM (uch qator identiteti)', () => {
    const manba = bolak(2.8, 30);
    const kerak = { eniM: 1.83, boyiM: 2.27 };
    const reja = kesimRejasi(manba, kerak);
    const kesim = kesimQatorlari(
      manba,
      { manbaQoldiq: reja.manbaQoldiq, kesma: reja.kesma, kesmaSaqlansinmi: true },
      STANDART,
    );
    // mahsulotga = e·b — matematik jihatdan aniq
    expect(kesim.mahsulotgaKvM).toBeCloseTo(1.83 * 2.27, 4);
  });
});

// ─── 5-TOPILMA ────────────────────────────────────────────────────────────
// 🛠️ 2026-09-17 TUZATILDI — eni YUQORIGA yaxlitlanadi (kesish.ts:490):
//    jismonan sig'maydigan bo'lak endi qabul qilinmaydi.

describe("5-TOPILMA — bag'rikenglikdan ortiq sig'dirish yo'qoladi (tuzatildi)", () => {
  it("eniM = 2.0149 → 2.02 (yuqoriga); 2.00 m bo'lak endi SIG'MAYDI", () => {
    // hisoblangan eni 2.0149 m ga to'g'ri keladigan maydon
    const boyiSm = 100;
    const haqiqiyEni = 2.0149;
    const kvM = haqiqiyEni * (boyiSm / 100);

    const kerak = kesimOlchami(kvM, boyiSm);
    expect(kerak.eniM).toBe(2.02); // 2.0149 → 2.02 (yuqoriga, kesish.ts:490)

    // 2.00 m keng bo'lak endi tanlanMAYDI — kesimga sig'maydi
    expect(sigadimi(bolak(2.0, 5), kerak)).toBe(false);
    // 2.10 m bo'lak yetarli (2.02 ≤ 2.10 + 0.01)
    expect(sigadimi(bolak(2.1, 5), kerak)).toBe(true);

    // Kesim eni haqiqiy kerakdan kam bo'lmaydi — bag'rikenglik buzilmaydi
    expect(kerak.eniM).toBeGreaterThanOrEqual(haqiqiyEni);
    // Kesim eni ≤ haqiqiy + 1 sm (yaxlitlash zaxirasi)
    expect(kerak.eniM).toBeLessThanOrEqual(haqiqiyEni + 0.01 + 1e-9);
  });
});

// ─── 2-TOPILMA · Funksiyalar (TUZATILDI) ────────────────────────────────

describe("2-TOPILMA — yaxlitlash funksiyalari qo'shildi (tuzatildi): CEIL / FLOOR / ROUND / MIN / MAX", () => {
  it('CEIL / FLOOR / ROUND ishlaydi', () => {
    const q = standartQiymatlar(sm(180), sm(220), 1, {});
    expect(sarflashHisobla('CEIL(2.1)', q, 'SM')).toBe(3);
    expect(sarflashHisobla('CEIL(2)', q, 'SM')).toBe(2);
    expect(sarflashHisobla('FLOOR(2.9)', q, 'SM')).toBe(2);
    expect(sarflashHisobla('ROUND(2.5)', q, 'SM')).toBe(3); // HALF_UP
    expect(sarflashHisobla('ROUND(2.4)', q, 'SM')).toBe(2);
    expect(sarflashHisobla('ROUND(2.444, 2)', q, 'SM')).toBe(2.44);
  });

  it('MIN / MAX argumentlari bilan ishlaydi', () => {
    const q = standartQiymatlar(sm(180), sm(220), 1, {});
    expect(sarflashHisobla("MIN(ENI, BO'YI)", q, 'SM')).toBe(180);
    expect(sarflashHisobla("MAX(ENI, BO'YI)", q, 'SM')).toBe(220);
    expect(sarflashHisobla('MAX(MIN(ENI, 200), 100)', q, 'SM')).toBe(180);
  });

  it("rapportni yaxlitlash ifodalanadi: CEIL(BO'YI / RAPPORT) * RAPPORT", () => {
    const q = standartQiymatlar(sm(180), sm(220), 1, { RAPPORT: 32 });
    // 220 / 32 = 6.875 → CEIL → 7 → 7 × 32 = 224 sm (to'liq 7 rapport)
    expect(sarflashHisobla("CEIL(BO'YI / RAPPORT) * RAPPORT", q, 'SM')).toBe(224);
  });

  it("noma'lum funksiya va noto'g'ri argument soni RAD etiladi", () => {
    const q = standartQiymatlar(sm(180), sm(220), 1, {});
    expect(() => sarflashHisobla('NOMALUM(1)', q, 'SM')).toThrow();
    expect(() => sarflashHisobla('CEIL()', q, 'SM')).toThrow();
    expect(() => sarflashHisobla('MIN(1)', q, 'SM')).toThrow();
    expect(() => sarflashHisobla('CEIL(1', q, 'SM')).toThrow();
    expect(() => sarflashHisobla('CEIL(1, 2)', q, 'SM')).toThrow();
  });
});
// ─── 3-TOPILMA ────────────────────────────────────────────────────────────
// (Avvalgi sessiyada 3-raqam bo'sh qolgan — endi to'ldiriladi.)
//
// Manba: sarflash.ts:38-42 — KV_M tekshiruv bag'rikengligi 0.0002 kv.m;
//        kesish.ts:480-481 — kesim eni 2 xonaga yaxlitlanadi (qadam 0.005 m);
//        kesish.ts:20      — bo'lak tanlash bag'rikengligi 1 sm (0.01 m).
// Bitta kesim eni qadami 220 sm bo'y uchun 0.011 kv.m — tekshiruv
// bag'rikengligidan 55 marta, bo'lak zaxirasi esa 110 marta kattaroq.
// Ya'ni «tekshiruv 0.0002 kv.m aniq» — kesim geometriyasi esa shu aniqlikni
// yanga olmaydi (ikki xil o'lchovda yaxlitlash).

describe("3-TOPILMA — tekshiruv bag'rikengligi kesim yaxlitlash qadamidan ancha kichik", () => {
  it('KV_M 0.0002 kv.m ruxsat — eni qadami 55×, 1 sm zaxira 110× kattaroq', () => {
    const KV_M_BAGRI = 0.0002; // sarflash.ts:39
    const eniQadami = 0.005; // kesish.ts:480 — 2 xonagacha yaxlitlash yarim qadami
    const boyiM = 2.2; // 220 sm
    // Bitta eni qadamining maydoni: 0.005 × 2.2 = 0.011 kv.m
    expect(eniQadami * boyiM).toBeCloseTo(0.011, 6);
    expect((eniQadami * boyiM) / KV_M_BAGRI).toBeCloseTo(55, 0);
    // Bo'lak tanlash 1 sm zaxirasi: 0.01 × 2.2 = 0.022 kv.m
    expect((0.01 * boyiM) / KV_M_BAGRI).toBeCloseTo(110, 0);
  });
});

// ─── 6-TOPILMA ────────────────────────────────────────────────────────────
//
// Manba: forma.tsx:450 — oddiy pozitsiyaga `soni: 1` QATTIQ qo'yiladi;
//        formula.ts:379-382 — SONI faqat o'zgaruvchi sifatida mavjud;
//        sarflash.ts:116-121 — server ham p.soni bilan qayta hisoblaydi,
//        lekin formulada SONI ishlatilmasa natija o'zgarmaydi.
// `buyurtma_pozitsiya.soni` feldi mavjud va ish haqida ishlatiladi
// (ish.ts:768 — haq = stavka × maydon × soni), lekin ombordan yechiladigan
// mato miqdori (hisoblangan_miqdor → kesim) bitta buyumga mo'ljallangan.
// Hozirgi yaratish ekranlari soni=1 qo'ygani uchun bu OSIB YOTGAN MINA:
// kelajakda soni>1 qo'yilsa mato kamomadi darhol yuz beradi.

describe("6-TOPILMA — «SONI» ombor sarfiga faqat formula uni ishlatsagina ta'sir qiladi", () => {
  it('MAYDON formulasi soni=3 da ham 2.94 kv.m — bitta buyum sarfi', () => {
    const bitta = Number(sarflashHisobla('MAYDON', standartQiymatlar(sm(210), sm(140), 1, {}), 'KV_M'));
    const uchta = Number(sarflashHisobla('MAYDON', standartQiymatlar(sm(210), sm(140), 3, {}), 'KV_M'));
    expect(bitta).toBe(2.94);
    expect(uchta).toBe(2.94); // SONI o'qilmadi — bir xil!
  });

  it("faqat «MAYDON * SONI» deb yozilsa sarf soni bilan o'sadi (8.82)", () => {
    const uchta = Number(
      sarflashHisobla('MAYDON * SONI', standartQiymatlar(sm(210), sm(140), 3, {}), 'KV_M'),
    );
    expect(uchta).toBe(8.82);
  });

  it("soniUchun() — server zanjiri jami sonni MAJBURLASHTIRADI (sarflash.ts)", () => {
    // formula SONI ni o'qimasa — natija bitta buyum uchun (yuqoridagi test).
    // sarflash.ts esa `soniUchun` bilan JAMINI kutadi:
    expect(soniUchun('MAYDON', 2.94, 3)).toBeCloseTo(8.82, 4);
    // formula SONI ni o'zi ishlatsa — qayta ko'paytirilmaydi
    expect(soniUchun('MAYDON * SONI', 8.82, 3)).toBeCloseTo(8.82, 4);
    // soni=1 — o'zgarmaydi
    expect(soniUchun('MAYDON', 2.94, 1)).toBe(2.94);
  });
});

// ─── 7-TOPILMA ────────────────────────────────────────────────────────────
//
// Manba: buyurtma.ts:548 (band) va ish.ts:453 (tugatdim) — ikkalasi ham
//        saqlangan `hisoblangan_miqdor` dan `kesimOlchami` chaqiradi.
//        Deterministik: bir xil kiritish bir xil kesim beradi, shuning
//        uchun band va kesim bir-biridan ajralmaydi. Lekin saqlangan
//        qiymat formula natijasiga AYNAN teng bo'lishi kafolatlanmagan:
//        sarflash.ts:150-157 tekshiruvi ±0.0002 kv.m farqni qabul qiladi
//        (3-topilma), va shu farq yaxlitlash chegarasiga tushganda kesim
//        enini 1 sm o'zgartira oladi — band ham, kesim ham shu siljigan
//        geometriya bo'yicha ishlaydi.
describe("7-TOPILMA — band/tugatdim kesimi deterministik; yuqoriga yaxlitlash chegaraga chidamsizlikni olib tashladi (tuzatildi)", () => {
  it("kesimOlchami deterministik — bir xil kiritish bir xil kesim (band = tugatdim)", () => {
    const band = kesimOlchami('4.7772', 227); // buyurtma.ts:548 ishlatadigan qiymat
    const tugatdimQayta = kesimOlchami('4.7772', 227); // ish.ts:453 ishlatadigan qiymat
    expect(band).toEqual(tugatdimQayta);
    expect(band).toEqual({ eniM: 2.11, boyiM: 2.27 }); // 2.10449… → 2.11 (ROUND_CEIL)
  });

  it("tekshiruv chegarasidagi farq (4.6309 ↔ 4.6311) endi BIR XIL kesim beradi — 2.11", () => {
    const past = kesimOlchami(4.6309, 220); // 2.10495… → 2.11
    const yuqori = kesimOlchami(4.6311, 220); // 2.10505… → 2.11
    expect(past).toEqual({ eniM: 2.11, boyiM: 2.2 });
    expect(yuqori).toEqual({ eniM: 2.11, boyiM: 2.2 });
    // Ikkalasi tekshiruv bag'rikengligi ICHIDA (sarflash.ts:39 — farq ≤ 0.0002)
    expect(Math.abs(4.6311 - 4.6309)).toBeLessThanOrEqual(0.0002 + 1e-9);
    // Eski holatda 2.10 ↔ 2.11 siljish bor edi — endi ikkalasi bir xil (2.11)
    expect(past).toEqual(yuqori);
  });
});
  
