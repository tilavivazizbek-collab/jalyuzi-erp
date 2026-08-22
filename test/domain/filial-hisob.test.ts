/**
 * TZ 22 · 20.17 — filiallararo hisob.
 *
 * K-11 kanonik test (CLAUDE.md §6):
 *   312 000 + 57 600 + 154 400 = 524 000
 */
import { describe, expect, it } from 'vitest';
import {
  balansJadvali,
  balanslarNolmi,
  filialBalansi,
  foyda,
  foydaUlushi,
  kochirishQarzi,
  qaytarishQarzi,
  qoldaQarzniTekshir,
  tayyorMahsulotQarzi,
  type FilialHarakati,
} from '@/lib/domain/filial-hisob';
import { pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const CHILONZOR = 1;
const SAMARQAND = 2;
const FARGONA = 3;

// ─── 22.3.1 · Kanonik hisob ───────────────────────────────────────────────

describe('K-11 — tayyor mahsulot qarzi (22.3.1)', () => {
  const buyurtma = {
    tushum: som('678400'),
    tannarx: som('312000'),
    ishHaqi: som('57600'),
  };

  it('foyda 308 800, har filialga 154 400', () => {
    expect(pulMatn(foyda(buyurtma))).toBe('308800.00');
    expect(pulMatn(foydaUlushi(buyurtma, false))).toBe('154400.00');
  });

  it('312 000 + 57 600 + 154 400 = 524 000', () => {
    const n = tayyorMahsulotQarzi(buyurtma);
    expect(pulMatn(n.qarz)).toBe('524000.00');
    expect(n.tushumChegarasi).toBe(false);
  });

  it('sotgan filialda aynan o\'z foyda ulushi qoladi', () => {
    const n = tayyorMahsulotQarzi(buyurtma);
    // 678 400 − 524 000 = 154 400
    expect(pulMatn(n.sotgandaQoladi)).toBe('154400.00');
    expect(pulMatn(n.sotgandaQoladi)).toBe(pulMatn(foydaUlushi(buyurtma, false)));
  });

  it('tikkan filial 524 000 oladi, 369 600 sarfladi → foydasi 154 400', () => {
    const n = tayyorMahsulotQarzi(buyurtma);
    const sarf = 312_000 + 57_600;
    expect(Number(pulMatn(n.qarz)) - sarf).toBe(154_400);
  });

  it('20.17.1 — bir filial sotdi va tikdi: foyda 100% unda', () => {
    expect(pulMatn(foydaUlushi(buyurtma, true))).toBe('308800.00');
  });
});

// ─── 22.3.3 · Zarar ───────────────────────────────────────────────────────

describe('22.3.3 — zararda qarz tushumdan oshmaydi', () => {
  const zararli = {
    tushum: som('300000'),
    tannarx: som('312000'),
    ishHaqi: som('57600'),
  };

  it('formula 334 800 beradi, lekin qarz 300 000 bo\'ladi', () => {
    const n = tayyorMahsulotQarzi(zararli);
    expect(pulMatn(n.formulaBoyicha)).toBe('334800.00');
    expect(pulMatn(n.qarz)).toBe('300000.00');
    expect(n.tushumChegarasi).toBe(true);
  });

  it('EC-FQ-09 — sotgan filialda 0 qoladi, manfiy emas', () => {
    const n = tayyorMahsulotQarzi(zararli);
    expect(pulMatn(n.sotgandaQoladi)).toBe('0.00');
  });

  it('zararni tikkan filial ko\'taradi — xarajat unda sodir bo\'lgan', () => {
    const n = tayyorMahsulotQarzi(zararli);
    // Oldi 300 000, sarfladi 369 600 → zarari 69 600
    expect(Number(pulMatn(n.qarz)) - (312_000 + 57_600)).toBe(-69_600);
  });
});

// ─── 22.3.4 · Qaytarish ───────────────────────────────────────────────────

describe('EC-FQ-01 — buyurtma qaytarilsa', () => {
  const sarf = { tannarx: som('312000'), ishHaqi: som('57600') };

  it("ushlanma tushum bo'lib qayta hisoblanadi (22.3.4)", () => {
    // 678 400 dan 600 000 qaytarildi → 78 400 ushlab qolindi
    const n = qaytarishQarzi(som('524000'), som('78400'), sarf);

    // 22.3.3 chegarasi: MIN(224 000, 78 400)
    expect(pulMatn(n.yangiQarz)).toBe('78400.00');
    expect(pulMatn(n.teskari)).toBe('-445600.00');
  });

  it("hammasi qaytarilsa qarz TO'LIQ teskari yoziladi", () => {
    const n = qaytarishQarzi(som('524000'), som('0'), sarf);
    expect(pulMatn(n.yangiQarz)).toBe('0.00');
    expect(pulMatn(n.teskari)).toBe('-524000.00');
  });

  it("ushlanma xarajatni qoplasa 50/50 ishlaydi, chegara tegmaydi", () => {
    // Ushlanma 569 600 → foyda 200 000, har filialga 100 000
    // qarz = 312 000 + 57 600 + 100 000 = 469 600
    const n = qaytarishQarzi(som('524000'), som('569600'), sarf);
    expect(pulMatn(n.yangiQarz)).toBe('469600.00');
    expect(pulMatn(n.teskari)).toBe('-54400.00');
  });

  it("sotgan filial o'z cho'ntagidan to'lamaydi (22.3.3)", () => {
    const n = qaytarishQarzi(som('524000'), som('78400'), sarf);
    // Ushlab qolgani 78 400, beradigani ham 78 400 — ortiq emas
    expect(Number(pulMatn(n.yangiQarz))).toBeLessThanOrEqual(78_400);
  });
});

// ─── 22.4 · Material ko'chirish ───────────────────────────────────────────

describe('22.4 — material ko\'chirish qarzi', () => {
  it('Q-35 — tannarx bo\'yicha, ichki ustama yo\'q', () => {
    const jami = kochirishQarzi([
      { bolakId: 1, tannarxSumma: som('2620000') },
      { bolakId: 2, tannarxSumma: som('380000') },
    ]);
    expect(pulMatn(jami)).toBe('3000000.00');
  });

  it('EC-FQ-06 — qo\'lda 0 qo\'yish mumkin, lekin sabab majburiy', () => {
    expect(() => {
      qoldaQarzniTekshir(som('0'), 'Sinov uchun yuborildi');
    }).not.toThrow();

    expect(() => {
      qoldaQarzniTekshir(som('0'), '   ');
    }).toThrow(BiznesXato);
  });

  it('manfiy summa rad etiladi', () => {
    expect(() => {
      qoldaQarzniTekshir(som('-1'), 'sabab');
    }).toThrow(BiznesXato);
  });
});

// ─── 22.6 · Balans ────────────────────────────────────────────────────────

describe('22.6 — filial balansi', () => {
  const harakatlar: readonly FilialHarakati[] = [
    // Chilonzor sotdi, Samarqand tikdi → Chilonzor qarzdor
    {
      kimdanFilialId: CHILONZOR,
      kimgaFilialId: SAMARQAND,
      turi: 'TAYYOR_MAHSULOT',
      summa: '12400000',
    },
    // Chilonzor sotuvchisi pulni Samarqandga topshirdi → Samarqand qarzdor
    {
      kimdanFilialId: SAMARQAND,
      kimgaFilialId: CHILONZOR,
      turi: 'PUL_TOPSHIRISH',
      summa: '4000000',
    },
    {
      kimdanFilialId: FARGONA,
      kimgaFilialId: CHILONZOR,
      turi: 'MATERIAL_KOCHIRISH',
      summa: '2100000',
    },
  ];

  it('22.6.2 — o\'zaro hisobda faqat farq qoladi: 8 400 000', () => {
    const juft = harakatlar.filter((h) => h.turi !== 'MATERIAL_KOCHIRISH');
    // Chilonzor tomonidan: −12 400 000 + 4 000 000
    expect(pulMatn(filialBalansi(CHILONZOR, juft))).toBe('-8400000.00');
    expect(pulMatn(filialBalansi(SAMARQAND, juft))).toBe('8400000.00');
  });

  it('manfiy — biz qarzdormiz, musbat — bizga qarzdor', () => {
    const j = balansJadvali(CHILONZOR, harakatlar);
    expect(j.juftlar).toHaveLength(2);
    expect(pulMatn(j.juftlar[0]?.balans ?? som(0))).toBe('-8400000.00');
    expect(pulMatn(j.juftlar[1]?.balans ?? som(0))).toBe('2100000.00');
    expect(pulMatn(j.sof)).toBe('-6300000.00');
  });

  it('22.9.4 · 11-invariant — barcha balanslar yig\'indisi 0', () => {
    expect(balanslarNolmi([CHILONZOR, SAMARQAND, FARGONA], harakatlar)).toBe(true);
  });

  it('EC-FQ-05 — teng qarzdorlikda balans 0', () => {
    const teng: readonly FilialHarakati[] = [
      {
        kimdanFilialId: CHILONZOR,
        kimgaFilialId: SAMARQAND,
        turi: 'TAYYOR_MAHSULOT',
        summa: '500000',
      },
      {
        kimdanFilialId: SAMARQAND,
        kimgaFilialId: CHILONZOR,
        turi: 'MATERIAL_KOCHIRISH',
        summa: '500000',
      },
    ];
    expect(pulMatn(filialBalansi(CHILONZOR, teng))).toBe('0.00');
    expect(pulMatn(filialBalansi(SAMARQAND, teng))).toBe('0.00');
  });

  it('boshqa filiallarning harakati balansga tegmaydi', () => {
    expect(pulMatn(filialBalansi(CHILONZOR, [
      {
        kimdanFilialId: SAMARQAND,
        kimgaFilialId: FARGONA,
        turi: 'TOLOV',
        summa: '900000',
      },
    ]))).toBe('0.00');
  });
});
