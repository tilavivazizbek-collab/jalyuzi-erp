/**
 * TZ 13.1 · 13.4 · 13.6 · 13.10 — bot mantiqi.
 */
import { describe, expect, it } from 'vitest';
import {
  MIJOZ_STATUSLARI,
  MIJOZ_STATUS_MATNI,
  almashaOladimi,
  amalKaliti,
  mijozStatusi,
  olchamTekshir,
  olchamYaroqlimi,
  panelTanla,
  pozitsiyaXulosasi,
} from '@/lib/domain/bot';
import { POZITSIYA_HOLATLARI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { BiznesXato } from '@/lib/xato';

// ─── 13.1 · Panel tanlash ─────────────────────────────────────────────────

describe('TZ 13.1 — qaysi panel ochiladi', () => {
  it('usta → usta paneli', () => {
    expect(panelTanla(['USTA'])).toBe('USTA');
  });

  it('admin → admin paneli', () => {
    expect(panelTanla(['ADMIN'])).toBe('ADMIN');
  });

  it("sotuvchi uchun bot yo'q — mijoz paneliga tushadi", () => {
    expect(panelTanla(['SOTUVCHI'])).toBe('MIJOZ');
  });

  it('omborchi ham mijoz panelini ko\'radi — botda ishi yo\'q', () => {
    expect(panelTanla(['OMBORCHI'])).toBe('MIJOZ');
  });

  it("xodim emas — mijoz paneli", () => {
    expect(panelTanla([])).toBe('MIJOZ');
  });

  it('10.3 — ikki rolda ADMIN ustun turadi', () => {
    expect(panelTanla(['USTA', 'ADMIN'])).toBe('ADMIN');
    expect(panelTanla(['ADMIN', 'USTA'])).toBe('ADMIN');
  });

  it('13.1 — ikki panelli xodimda almashish tugmasi chiqadi', () => {
    expect(almashaOladimi(['ADMIN', 'USTA'])).toBe(true);
    expect(almashaOladimi(['ADMIN'])).toBe(false);
    expect(almashaOladimi(['USTA'])).toBe(false);
    // Sotuvchilik panel bermaydi — almashishga narsa yo'q
    expect(almashaOladimi(['ADMIN', 'SOTUVCHI'])).toBe(false);
  });
});

// ─── 13.6 · Mijoz ko'radigan status ───────────────────────────────────────

describe('TZ 13.6 — 12 ta ichki status → 4 ta mijoz statusi', () => {
  it('tasdiq kutmoqda → qabul qilindi', () => {
    expect(mijozStatusi('TASDIQ_KUTMOQDA')).toBe('QABUL');
  });

  it("«materialga kutmoqda» mijozga KO'RSATILMAYDI — tayyorlanmoqda", () => {
    // ⚠️ Bu ichki muammo, mijozga sabab bo'lmaydi (13.12)
    expect(mijozStatusi('MATERIALGA_KUTMOQDA')).toBe('TAYYORLANMOQDA');
    expect(MIJOZ_STATUS_MATNI[mijozStatusi('MATERIALGA_KUTMOQDA')]).not.toContain(
      'material',
    );
  });

  it('tasdiqlangan va ishlab chiqarilmoqda — bir guruhda', () => {
    expect(mijozStatusi('TASDIQLANGAN')).toBe('TAYYORLANMOQDA');
    expect(mijozStatusi('ISHLAB_CHIQARILMOQDA')).toBe('TAYYORLANMOQDA');
  });

  it("20.5 — yo'ldagi mahsulot hali TAYYOR emas", () => {
    // Mijoz kelib ketmasin: mahsulot boshqa filialda
    expect(mijozStatusi('TAYYOR_YOLDA')).toBe('TAYYORLANMOQDA');
    expect(mijozStatusi('FILIALGA_YUBORILDI')).toBe('TAYYORLANMOQDA');
  });

  it('yetib kelgan mahsulot TAYYOR — olib ketish mumkin', () => {
    expect(mijozStatusi('TAYYOR')).toBe('TAYYOR');
    expect(mijozStatusi('YETIB_KELDI')).toBe('TAYYOR');
  });

  it('topshirilgan, qaytarilgan, rad etilgan, bekor — yopilgan', () => {
    expect(mijozStatusi('TOPSHIRILDI')).toBe('YOPILGAN');
    expect(mijozStatusi('QAYTARILGAN')).toBe('YOPILGAN');
    expect(mijozStatusi('RAD_ETILGAN')).toBe('YOPILGAN');
    expect(mijozStatusi('BEKOR')).toBe('YOPILGAN');
  });

  it('HAR BIR ichki status guruhga tushadi — biri ham qolmaydi', () => {
    for (const h of POZITSIYA_HOLATLARI) {
      const s = mijozStatusi(h);
      expect(MIJOZ_STATUSLARI).toContain(s);
    }
  });
});

// ─── 13.6 · Bir buyurtmada bir nechta pozitsiya ───────────────────────────

describe('TZ 13.6 — pozitsiyalar xulosasi (8.2)', () => {
  it('«3 tadan: 1 tayyor, 2 tayyorlanmoqda»', () => {
    const holatlar: PozitsiyaHolati[] = [
      'TAYYOR',
      'ISHLAB_CHIQARILMOQDA',
      'MATERIALGA_KUTMOQDA',
    ];
    expect(pozitsiyaXulosasi(holatlar)).toBe('3 tadan: 2 tayyorlanmoqda, 1 tayyor');
  });

  it('hammasi bir guruhda bo\'lsa sanoq ko\'rsatilmaydi', () => {
    expect(pozitsiyaXulosasi(['TAYYOR', 'YETIB_KELDI'])).toBe(
      MIJOZ_STATUS_MATNI.TAYYOR,
    );
  });

  it('bitta pozitsiya — oddiy status', () => {
    expect(pozitsiyaXulosasi(['TASDIQ_KUTMOQDA'])).toBe(MIJOZ_STATUS_MATNI.QABUL);
  });

  it("bo'sh ro'yxat yiqilmaydi", () => {
    expect(pozitsiyaXulosasi([])).toBe('Pozitsiya yo‘q');
  });

  it('tartib qat\'iy: qabul → tayyorlanmoqda → tayyor → yopilgan', () => {
    const x = pozitsiyaXulosasi([
      'BEKOR',
      'TAYYOR',
      'TASDIQ_KUTMOQDA',
      'ISHLAB_CHIQARILMOQDA',
    ]);
    expect(x).toBe(
      '4 tadan: 1 qabul qilindi, 1 tayyorlanmoqda, 1 tayyor, 1 yopilgan',
    );
  });
});

// ─── 13.4 · O'lcham tekshiruvi ────────────────────────────────────────────

describe("TZ 13.4 — o'lcham validatsiyasi", () => {
  it("to'g'ri o'lcham qabul qilinadi", () => {
    expect(olchamTekshir('210')).toBe(210);
    expect(olchamTekshir(' 140 ')).toBe(140);
  });

  it('nol rad etiladi', () => {
    expect(() => olchamTekshir('0')).toThrow(BiznesXato);
  });

  it('manfiy rad etiladi', () => {
    expect(() => olchamTekshir('-50')).toThrow(BiznesXato);
  });

  it('harf rad etiladi', () => {
    expect(() => olchamTekshir('ikki yuz')).toThrow(BiznesXato);
    expect(() => olchamTekshir('210sm')).toThrow(BiznesXato);
  });

  it("kasr rad etiladi — usta yarim santimetrni kesa olmaydi", () => {
    expect(() => olchamTekshir('210.5')).toThrow(BiznesXato);
    expect(() => olchamTekshir('210,5')).toThrow(BiznesXato);
  });

  it("bo'sh matn rad etiladi", () => {
    expect(() => olchamTekshir('')).toThrow(BiznesXato);
    expect(() => olchamTekshir('   ')).toThrow(BiznesXato);
  });

  it("haddan tashqari katta son rad etiladi", () => {
    expect(() => olchamTekshir('99999')).toThrow(BiznesXato);
  });

  it('yaroqlimi — xatosiz shakl', () => {
    expect(olchamYaroqlimi('210')).toBe(true);
    expect(olchamYaroqlimi('0')).toBe(false);
    expect(olchamYaroqlimi('salom')).toBe(false);
  });
});

// ─── 13.10 · Takrorlanishdan himoya ───────────────────────────────────────

describe('TZ 13.10 — amal kaliti', () => {
  it('bir xil amal bir xil kalit beradi', () => {
    expect(amalKaliti('ishni_ol', 555, 1247)).toBe(amalKaliti('ishni_ol', 555, 1247));
  });

  it('boshqa amal, boshqa odam yoki boshqa obyekt — boshqa kalit', () => {
    const asos = amalKaliti('ishni_ol', 555, 1247);
    expect(amalKaliti('tugatdim', 555, 1247)).not.toBe(asos);
    expect(amalKaliti('ishni_ol', 666, 1247)).not.toBe(asos);
    expect(amalKaliti('ishni_ol', 555, 1248)).not.toBe(asos);
  });
});
