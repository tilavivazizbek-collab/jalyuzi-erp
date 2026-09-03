/**
 * T-01 · QISM 1 §14.2 — ekran so'rovlari BAZADA yuriladimi.
 *
 * ⚠️ Nega bu test bor:
 *
 * 2026-08-22 da `app/(panel)/sotuv/malumot.ts` da ikki so'rov `fn.narx`
 * ustuniga murojaat qilardi — jadvalda esa u `sotuv_narx` deb ataladi.
 * Filial narxi ishlatilgan HAR BIR sotuv so'rovi bazada yiqilardi.
 *
 * `tsc` buni ko'rmaydi: SQL — shunchaki matn. Mantiq testlari ham
 * ko'rmaydi: ular `lib/` ni sinaydi, ekran so'rovlarini emas. Xatoni
 * faqat ekranni ochgan ODAM ko'radi.
 *
 * Shu sabab bu yerda har bir ekran funksiyasi haqiqiy bazada bir marta
 * chaqiriladi. Natija tekshirilmaydi — **yiqilmasligi** tekshiriladi.
 * Ustun nomi xato bo'lsa Postgres darhol aytadi.
 *
 * ⚠️ Bo'sh natija ham TO'G'RI natija: mavjud bo'lmagan id berilsa
 *    funksiya `null` yoki `[]` qaytarishi kerak, yiqilmasligi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ulanishOl } from '@/lib/db';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

import * as filialEkrani from '@/app/(panel)/filial/malumot';
import * as kochirishEkrani from '@/app/(panel)/ombor/kochirish/malumot';
import * as kassaEkrani from '@/app/(panel)/kassa/malumot';
import * as omborEkrani from '@/app/(panel)/ombor/malumot';
import * as sotuvEkrani from '@/app/(panel)/buyurtma/yangi/malumot';
import * as buyurtmaEkrani from '@/app/(panel)/buyurtma/malumot';
import * as yoldaEkrani from '@/app/(panel)/buyurtma/yolda/malumot';
import * as boshqaruvEkrani from '@/app/(panel)/boshqaruv/malumot';
import * as katalog from '@/lib/amal/katalog';
import * as mahsulotEkrani from '@/app/(panel)/mahsulot/malumot';
import * as mijozGuruhEkrani from '@/app/(panel)/mijoz/guruh/malumot';
import * as tarixEkrani from '@/app/(panel)/ombor/tarix/malumot';
import * as hisobotEkrani from '@/app/(panel)/hisobot/malumot';
import { davrYasa } from '@/lib/domain/hisobot/davr';

let sql: Ulanish;
let filialId = 1;
let xodimId = 1;
let materialId = 0;

/** Mavjud emasligi ANIQ bo'lgan id — funksiya `null`/`[]` qaytarishi shart. */
const YOQ = 2_000_000_000;

beforeAll(async () => {
  sql = sinovUlanishi();

  const f = await sql<{ id: number }[]>`
    SELECT id FROM filial WHERE faol = true ORDER BY bosh DESC LIMIT 1`;
  filialId = f[0]?.id ?? 1;

  const x = await sql<{ id: number }[]>`
    SELECT id FROM xodim WHERE faol = true ORDER BY id LIMIT 1`;
  xodimId = x[0]?.id ?? 1;

  const m = await sql<{ id: number }[]>`
    SELECT id FROM material WHERE faol = true ORDER BY id LIMIT 1`;
  materialId = m[0]?.id ?? YOQ;
}, 120_000);

afterAll(async () => {
  await sql.end();
  // Ekran funksiyalari umumiy ulanishdan foydalanadi — u ham yopiladi
  await ulanishOl().end();
});

// ─── 20.2 · 22 · Filial ekranlari ─────────────────────────────────────────

describe('Filial ekranlari', () => {
  it('filialHisobi · filialHarakatRoyxati · adminKassalari', async () => {
    await expect(filialEkrani.filialHisobi(filialId)).resolves.toBeDefined();
    await expect(
      filialEkrani.filialHarakatRoyxati(filialId),
    ).resolves.toBeDefined();
    await expect(filialEkrani.adminKassalari()).resolves.toBeDefined();
  });

  it('faolFiliallar · filialRoyxati · filialOl · tikaOladiganFiliallar', async () => {
    await expect(filialEkrani.faolFiliallar()).resolves.toBeDefined();
    await expect(filialEkrani.filialRoyxati()).resolves.toBeDefined();
    await expect(filialEkrani.filialOl(YOQ)).resolves.toBeNull();
    await expect(
      filialEkrani.tikaOladiganFiliallar(null),
    ).resolves.toBeDefined();
  });
});

// ─── 20.7 · Ko'chirish ekranlari ──────────────────────────────────────────

describe("Ko'chirish ekranlari", () => {
  it('kochirishlar · kochirishOl · tanlanadiganBolaklar · boshqaFiliallar', async () => {
    await expect(kochirishEkrani.kochirishlar(filialId)).resolves.toBeDefined();
    await expect(kochirishEkrani.kochirishOl(YOQ)).resolves.toBeNull();
    await expect(
      kochirishEkrani.tanlanadiganBolaklar(filialId),
    ).resolves.toBeDefined();
    await expect(
      kochirishEkrani.boshqaFiliallar(filialId),
    ).resolves.toBeDefined();
  });
});

// ─── 12 · Kassa ekranlari ─────────────────────────────────────────────────

describe('Kassa ekranlari', () => {
  it('kassaQoldiqlari · kassaKitobi — admin va sotuvchi ko\'rinishi', async () => {
    // TZ 12.14 — sotuvchi faqat o'zinikini ko'radi, shart ikki xil SQL beradi
    await expect(
      kassaEkrani.kassaQoldiqlari(filialId, xodimId, true),
    ).resolves.toBeDefined();
    await expect(
      kassaEkrani.kassaQoldiqlari(filialId, xodimId, false),
    ).resolves.toBeDefined();
    await expect(
      kassaEkrani.kassaKitobi(filialId, xodimId, true),
    ).resolves.toBeDefined();
    await expect(
      kassaEkrani.kassaKitobi(filialId, xodimId, false),
    ).resolves.toBeDefined();
  });

  it('ochiqTopshiriqlar · xodimBalanslari · xarajatModdalari', async () => {
    await expect(kassaEkrani.ochiqTopshiriqlar(filialId)).resolves.toBeDefined();
    await expect(kassaEkrani.xodimBalanslari(filialId)).resolves.toBeDefined();
    await expect(
      kassaEkrani.xarajatModdalari(filialId, '2026-01-01', '2026-12-31'),
    ).resolves.toBeDefined();
  });

  it('xodimKartochkasi · topshirishManbalari · topshirishNishonlari', async () => {
    await expect(
      kassaEkrani.xodimKartochkasi(xodimId, filialId),
    ).resolves.toBeDefined();
    await expect(
      kassaEkrani.topshirishManbalari(xodimId),
    ).resolves.toBeDefined();
    await expect(
      kassaEkrani.topshirishNishonlari(filialId),
    ).resolves.toBeDefined();
  });
});

// ─── 7 · 15 · Ombor ekranlari ─────────────────────────────────────────────

describe('Ombor ekranlari', () => {
  it('qoldiq · bo\'laklar · harakatlar · sarlavha', async () => {
    await expect(omborEkrani.filialQoldigi(filialId)).resolves.toBeDefined();
    await expect(omborEkrani.barchaFilialQoldigi()).resolves.toBeDefined();
    await expect(omborEkrani.filialNomi(filialId)).resolves.toBeDefined();
    await expect(
      omborEkrani.materialBolaklari(materialId, filialId),
    ).resolves.toBeDefined();
    await expect(
      omborEkrani.materialHarakatlari(materialId, filialId),
    ).resolves.toBeDefined();
    await expect(
      omborEkrani.materialSarlavhasi(materialId),
    ).resolves.toBeDefined();
  });

  it('chiqim · kirim · harakat', async () => {
    await expect(omborEkrani.chiqimBolagi(YOQ, filialId)).resolves.toBeNull();
    await expect(omborEkrani.kirimHujjatlari(filialId)).resolves.toBeDefined();
    await expect(omborEkrani.kirimTafsiloti(YOQ, filialId)).resolves.toBeNull();
    await expect(
      omborEkrani.harakatFilialda(YOQ, filialId),
    ).resolves.toBeDefined();
  });

  it('inventarizatsiya · materiallar · boshlang\'ich', async () => {
    await expect(omborEkrani.varaqalar(filialId)).resolves.toBeDefined();
    await expect(omborEkrani.varaqaTafsiloti(YOQ, filialId)).resolves.toBeNull();
    await expect(
      omborEkrani.omborMateriallari(filialId),
    ).resolves.toBeDefined();
    await expect(
      omborEkrani.boshlangichBormi(materialId, filialId),
    ).resolves.toBeDefined();
    // 7.9 — kirim formasining ro'yxatlari
    await expect(omborEkrani.kirimMateriallari()).resolves.toBeDefined();
    await expect(omborEkrani.kirimYetkazuvchilari()).resolves.toBeDefined();
  });
});

// ─── 3 · 20.9 · Sotuv ekranlari ───────────────────────────────────────────

describe('Sotuv ekranlari', () => {
  /**
   * ⚠️ `fn.narx` xatosi AYNAN shu yerda yashiringan edi. `sotuvTurlari`
   *    filial narxini `material_filial_narx` dan oladi (20.9).
   */
  it('sotuvTurlari — filial narxi ustunlari (20.9)', async () => {
    await expect(sotuvEkrani.sotuvTurlari(filialId)).resolves.toBeDefined();
  });

  it('turRoyxati — yengil ro‘yxat (3.2)', async () => {
    await expect(katalog.turRoyxati()).resolves.toBeDefined();
  });

  it('turTafsili — bitta tur, mavjud bo‘lmasa null', async () => {
    await expect(katalog.turTafsili(YOQ, filialId)).resolves.toBeNull();

    const bor = await katalog.turRoyxati();
    if (bor[0] !== undefined) {
      await expect(
        katalog.turTafsili(bor[0].id, filialId),
      ).resolves.not.toBeNull();
    }
  });

  it('mijozQidir · tikaOladiganFiliallar', async () => {
    await expect(sotuvEkrani.mijozQidir('a')).resolves.toBeDefined();
    await expect(sotuvEkrani.tikaOladiganFiliallar()).resolves.toBeDefined();
  });
});

// ─── 8 · 20.5 · Buyurtma ekranlari ────────────────────────────────────────

describe('Buyurtma ekranlari', () => {
  it('buyurtmalar — har filtr o\'z SQL shartini beradi', async () => {
    await expect(
      buyurtmaEkrani.buyurtmalar(filialId, 'HAMMASI'),
    ).resolves.toBeDefined();
    for (const filtr of [
      'BUGUNGI',
      'TASDIQ_KUTMOQDA',
      'ISHLAB_CHIQARILMOQDA',
      'TAYYOR',
      'MATERIALGA_KUTMOQDA',
      'MUDDATI_OTGAN',
    ] as const) {
      await expect(
        buyurtmaEkrani.buyurtmalar(filialId, filtr),
      ).resolves.toBeDefined();
    }
  });

  it('tafsil · qayta kesish · to\'lov · yo\'lda', async () => {
    await expect(
      buyurtmaEkrani.buyurtmaTafsili(YOQ, filialId),
    ).resolves.toBeNull();
    await expect(
      buyurtmaEkrani.ochiqQaytaKesishlar(filialId),
    ).resolves.toBeDefined();
    await expect(
      buyurtmaEkrani.tolovHolati(YOQ, filialId),
    ).resolves.toBeDefined();
    await expect(
      buyurtmaEkrani.tolovKassalari(filialId, xodimId),
    ).resolves.toBeDefined();
    // 20.5.1 — sotgan filialga kelayotgan tayyor mahsulot
    await expect(yoldaEkrani.yoldagilar(filialId)).resolves.toBeDefined();
    // Boshqaruv sahifasi — kim va qayerda ishlayotgani
    await expect(
      boshqaruvEkrani.kimIshlamoqda(xodimId, filialId),
    ).resolves.toBeDefined();
  });
});

/**
 * ⚠️ 2026-08-29 — `/mahsulot` sahifasi BUTUNLAY ochilmay qoldi:
 *    so'rovda `WHERE` `GROUP BY` dan keyin qolib ketgan edi
 *    («syntax error at or near WHERE»).
 *
 *    Sabab: SQL `page.tsx` ICHIDA yozilgan edi va bu test uni
 *    ko'rmasdi. Endi so'rov `malumot.ts` da va shu yerda
 *    chaqiriladi.
 */
describe('Spravochnik ekranlari', () => {
  it('tur ro‘yxati — faol va o‘chirilgan', async () => {
    await expect(mahsulotEkrani.turlarRoyxati(false)).resolves.toBeDefined();
    await expect(mahsulotEkrani.turlarRoyxati(true)).resolves.toBeDefined();
    await expect(mahsulotEkrani.turOchirilganSoni()).resolves.toBeTypeOf('number');
    await expect(mahsulotEkrani.guruhlarniOl()).resolves.toBeDefined();
    await expect(mahsulotEkrani.materiallarniOl()).resolves.toBeDefined();
  });

  it('mijoz guruhlari — TZ 6.3', async () => {
    await expect(mijozGuruhEkrani.mijozGuruhRoyxati(false)).resolves.toBeDefined();
    await expect(mijozGuruhEkrani.mijozGuruhRoyxati(true)).resolves.toBeDefined();
    await expect(mijozGuruhEkrani.mijozGuruhOchirilganSoni()).resolves.toBeTypeOf('number');
    await expect(mijozGuruhEkrani.guruhTanlovlari()).resolves.toBeDefined();
  });

  it('ombor tarixi — filtrsiz va filtr bilan (7.11)', async () => {
    await expect(
      tarixEkrani.omborTarixi(filialId, tarixEkrani.BOSH_FILTR, 0),
    ).resolves.toBeDefined();
    await expect(
      tarixEkrani.omborTarixi(
        filialId,
        {
          dan: '2020-01-01',
          gacha: '2030-12-31',
          materialId,
          turi: 'KIRIM',
        },
        1,
      ),
    ).resolves.toBeDefined();
    await expect(tarixEkrani.tarixMateriallari(filialId)).resolves.toBeDefined();
  });
});

/**
 * TZ 11.7 — hisobot so'rovlari.
 *
 * ⚠️ Bu so'rovlar boshqalardan MURAKKABROQ: ichma-ich `SELECT`, `HAVING`
 *    va `FILTER` ishlatiladi. Ustun nomidagi xato faqat hisobotni ochgan
 *    odamga bilinardi va u odam odatda EGASI bo'ladi.
 *
 * ⚠️ Bo'sh baza ham to'g'ri natija: hisobot yiqilmasligi kerak. Nolga
 *    bo'linish va `NULL` dan pul yasash — aynan shu yerda chiqadi.
 */
describe('Hisobot ekranlari — TZ 11.7', () => {
  it('ombor qiymati va ustama eroziyasi (11.7.1, 11.7.5)', async () => {
    await expect(hisobotEkrani.omborQiymati(filialId)).resolves.toBeTypeOf('string');

    const ustama = await hisobotEkrani.ustamaHisoboti(filialId);
    expect(ustama.jamiSoni).toBe(ustama.qatorlar.length);
    expect(ustama.pastSoni).toBeLessThanOrEqual(ustama.jamiSoni);
  });

  it('muzlab qolgan pul — uch bo‘lak (11.7.6)', async () => {
    const m = await hisobotEkrani.muzlaganPulHisoboti(filialId);
    // Qo'sh sanash bo'lmasligi kerak: ostatka uchinchi bo'lakdan ayirilgan
    expect(m.kesishgan).toEqual([]);
    expect(m.ostatkalar.soni).toBe(m.ostatkaQatorlari.length);
  });

  it('sarflanish tezligi — har davr uchun (§3.1 №13–14)', async () => {
    for (const turi of ['HAFTA', 'OY', 'YIL'] as const) {
      const davr = davrYasa(turi, new Date());
      await expect(hisobotEkrani.sarflanishTezligi(filialId, davr)).resolves.toBeDefined();
    }
  });

  it('ABC tahlil — ombor (§3.1 №17)', async () => {
    const abc = await hisobotEkrani.omborAbc(filialId);
    expect(abc.soni.A + abc.soni.B + abc.soni.C).toBe(abc.qatorlar.length);
  });

  it('qoldiq mahsulot kesimida (11.7.1)', async () => {
    const q = await hisobotEkrani.qoldiqMaterialKesimida(filialId);
    for (const x of q) {
      expect(x.bolakSoni).toBeGreaterThan(0);
      // Qiymat har doim matn: `NULL` bo'lsa ham '0' bo'lib keladi
      expect(x.qiymat).toBeTypeOf('string');
    }
  });

  it('mahsulot harakati — davr bo‘yicha (11.7.2)', async () => {
    const davr = davrYasa('OY', new Date());
    const h = await hisobotEkrani.materialHarakati(filialId, davr);

    /**
     * ⚠️ Bazada chiqim MANFIY yotadi, hisobotda esa MUSBAT
     *    ko'rsatiladi. Manfiy raqam chiqsa — `ABS()` tushib
     *    qolgan degani.
     */
    for (const x of h) {
      expect(x.sarf).toBeGreaterThanOrEqual(0);
      expect(x.chiqindi).toBeGreaterThanOrEqual(0);
      expect(x.brak).toBeGreaterThanOrEqual(0);
    }
  });

  it('kam qolgan va tugagan (11.7.3)', async () => {
    const k = await hisobotEkrani.kamQolganlar(filialId);
    // Tugaganlar tepada turishi shart — ular shoshilinch
    const birinchiKam = k.findIndex((x) => !x.tugadimi);
    const oxirgiTugagan = k.map((x) => x.tugadimi).lastIndexOf(true);
    if (birinchiKam !== -1 && oxirgiTugagan !== -1) {
      expect(oxirgiTugagan).toBeLessThan(birinchiKam);
    }
  });

  it('chiqindi va brak — sabab kesimida (11.7.4)', async () => {
    const davr = davrYasa('OY', new Date());
    const c = await hisobotEkrani.chiqindiVaBrak(filialId, davr);
    for (const x of c) {
      expect(['CHIQINDI', 'BRAK']).toContain(x.turi);
      expect(x.miqdor).toBeGreaterThanOrEqual(0);
    }
  });

  it('mavjud bo‘lmagan filialda ham yiqilmaydi', async () => {
    const davr = davrYasa('OY', new Date());
    await expect(hisobotEkrani.ustamaHisoboti(YOQ)).resolves.toBeDefined();
    await expect(hisobotEkrani.muzlaganPulHisoboti(YOQ)).resolves.toBeDefined();
    await expect(hisobotEkrani.omborAbc(YOQ)).resolves.toBeDefined();
    await expect(hisobotEkrani.qoldiqMaterialKesimida(YOQ)).resolves.toEqual([]);
    await expect(hisobotEkrani.materialHarakati(YOQ, davr)).resolves.toEqual([]);
    await expect(hisobotEkrani.chiqindiVaBrak(YOQ, davr)).resolves.toEqual([]);
  });
});
