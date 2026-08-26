/**
 * TZ 13.9 · 13.5 · 13.6 — bildirishnoma matnlari.
 *
 * Matn sof funksiya bo'lgani uchun to'liq sinaladi: egasi telefonda
 * o'qiydigan gap shu yerda qotadi.
 */
import { describe, expect, it } from 'vitest';
import {
  ADMIN_HODISALARI,
  bekorMatni,
  kunFarqiMatni,
  pulTopshirildiMatni,
  qabulQilindiMatni,
  qarzEslatmaMatni,
  qaytaKesishSoroviMatni,
  stavkasizIshMatni,
  tasdiqlandiMatni,
  tayyorMatni,
  tugmaliMi,
  ustamaPastMatni,
  yetkazibMuddatMatni,
} from '@/lib/domain/bildirishnoma';

// ─── 13.9 · Qaysi xabarda tugma bo'ladi ───────────────────────────────────

describe('TZ 13.9 — botdan FAQAT ikki amal bajariladi', () => {
  it('qayta kesish va pul topshirig‘ida tugma bor', () => {
    expect(tugmaliMi('QAYTA_KESISH_SOROVI')).toBe(true);
    expect(tugmaliMi('PUL_TOPSHIRILDI')).toBe(true);
  });

  it('qolgan hammasi FAQAT XABAR — amal saytda', () => {
    const tugmasizlar = ADMIN_HODISALARI.filter((h) => !tugmaliMi(h));
    expect(tugmasizlar).toEqual([
      'HISOBDAN_CHIQARILDI',
      'KAM_QOLDIQ',
      'USTAMA_PAST',
      'YETKAZIB_MUDDAT',
      'STAVKASIZ_ISH',
      'KUN_FARQI',
    ]);
  });
});

// ─── 8.17.6 · Takroriy brak ───────────────────────────────────────────────

describe('qayta kesish so‘rovi', () => {
  const asos = {
    buyurtmaRaqami: 'B-2026-000123',
    tartib: 2,
    ustaIsmi: 'Aziz',
    sabab: 'Olcham xato chiqdi',
    nechanchiMarta: 1,
  };

  it('buyurtma, usta va sabab ko‘rinadi', () => {
    const m = qaytaKesishSoroviMatni(asos);
    expect(m).toContain('B-2026-000123');
    expect(m).toContain('Aziz');
    expect(m).toContain('Olcham xato chiqdi');
  });

  it('BIRINCHI marta bo‘lsa qizil ogoh YO‘Q', () => {
    expect(qaytaKesishSoroviMatni(asos)).not.toContain('🔴');
  });

  it('8.17.6 — takroriy brak ALOHIDA ogohlantiradi', () => {
    const m = qaytaKesishSoroviMatni({ ...asos, nechanchiMarta: 3 });
    expect(m).toContain('🔴');
    expect(m).toContain('3-marta');
  });

  it('material ikkinchi marta yechilishi aytiladi', () => {
    expect(qaytaKesishSoroviMatni(asos)).toContain('IKKINCHI marta');
  });
});

// ─── 22.5.2 · Boshqa filialga topshirish ──────────────────────────────────

describe('pul topshirildi', () => {
  it('o‘z filialida ogohlantirish yo‘q', () => {
    const m = pulTopshirildiMatni({
      sotuvchiIsmi: 'Dilshod',
      summa: '4200000.00',
      valyuta: 'SOM',
      begonaFilial: null,
    });
    expect(m).toContain('Dilshod');
    expect(m).not.toContain('qarz');
  });

  it('22.5.2 — boshqa filial bo‘lsa QARZ haqida ogohlantiradi', () => {
    const m = pulTopshirildiMatni({
      sotuvchiIsmi: 'Dilshod',
      summa: '4200000.00',
      valyuta: 'SOM',
      begonaFilial: 'Chilonzor',
    });
    expect(m).toContain('Chilonzor');
    expect(m).toContain('qarz');
  });

  it('12.7 — pul tasdiqlangunicha kassada turishi aytiladi', () => {
    const m = pulTopshirildiMatni({
      sotuvchiIsmi: 'A',
      summa: '1',
      valyuta: 'SOM',
      begonaFilial: null,
    });
    expect(m).toContain('tasdiqlaguningizcha');
  });
});

// ─── 10.12 · Stavkasiz ish ────────────────────────────────────────────────

describe('stavkasiz ish', () => {
  it('haq 0 ekani va qo‘lda qo‘shish kerakligi aytiladi', () => {
    const m = stavkasizIshMatni({
      buyurtmaRaqami: 'B-2026-000200',
      turNomi: 'Dikke',
      ustaIsmi: 'Sardor',
    });
    expect(m).toContain('B-2026-000200');
    expect(m).toContain('Sardor');
    expect(m).toContain('0 hisoblandi');
    expect(m).toContain('10.12');
  });
});

// ─── 9.3 · To'lov muddati ─────────────────────────────────────────────────

describe('yetkazib beruvchi muddati', () => {
  it('kun qolganda oddiy eslatma', () => {
    const m = yetkazibMuddatMatni({ nomi: 'Turk mato', summa: '5 000 000', kunQoldi: 5 });
    expect(m).toContain('5 kun qoldi');
    expect(m).not.toContain('🔴');
  });

  it('bugun oxirgi kun — qizil', () => {
    const m = yetkazibMuddatMatni({ nomi: 'A', summa: '1', kunQoldi: 0 });
    expect(m).toContain('🔴');
    expect(m).toContain('Bugun');
  });

  it('kechikkan bo‘lsa necha kun kechikkani aytiladi', () => {
    const m = yetkazibMuddatMatni({ nomi: 'A', summa: '1', kunQoldi: -12 });
    expect(m).toContain('12 kun KECHIKDI');
  });
});

// ─── 12.17 · Kun farqi · 7.8 · Ustama ─────────────────────────────────────

describe('boshqa admin xabarlari', () => {
  it('kun yopishda farq — uch raqam ham ko‘rinadi', () => {
    const m = kunFarqiMatni({
      kassaNomi: 'Naqd som',
      kutilgan: '3 200 000',
      sanalgan: '3 150 000',
      farq: '−50 000',
    });
    expect(m).toContain('3 200 000');
    expect(m).toContain('3 150 000');
    expect(m).toContain('−50 000');
  });

  it('ustama past — nima qilish kerakligi aytiladi', () => {
    const m = ustamaPastMatni({ materialNomi: 'Ko‘k to‘r', ustama: '12', chegara: '30' });
    expect(m).toContain('Ko‘k to‘r');
    expect(m).toContain('7.8');
  });
});

// ─── 13.5 · Narx o'zgarsa mijozga xabar ───────────────────────────────────

describe('TZ 13.5 — mijozga narx xabari', () => {
  it('narx o‘zgarmagan bo‘lsa farq ko‘rsatilmaydi', () => {
    const m = tasdiqlandiMatni({
      raqam: 'B-1',
      yangiNarx: '450000.00',
      eskiNarx: '450000.00',
    });
    expect(m).not.toContain('avval');
  });

  it('eski narx yo‘q bo‘lsa ham yiqilmaydi', () => {
    const m = tasdiqlandiMatni({ raqam: 'B-1', yangiNarx: '450000.00', eskiNarx: null });
    expect(m).toContain('450000.00');
  });

  it('narx TUSHSA — chegirma', () => {
    const m = tasdiqlandiMatni({
      raqam: 'B-1247',
      yangiNarx: '430000.00',
      eskiNarx: '450000.00',
    });
    expect(m).toContain('430000.00');
    expect(m).toContain('avval 450000.00');
    expect(m).toContain('Chegirma: 20000.00');
  });

  it('narx OSHSA — qo‘shimcha', () => {
    const m = tasdiqlandiMatni({
      raqam: 'B-1',
      yangiNarx: '470000.00',
      eskiNarx: '450000.00',
    });
    expect(m).toContain('Qo‘shimcha: 20000.00');
  });
});

describe('TZ 13.6 — mijozga holat xabarlari', () => {
  it('qabul, tayyor, bekor va qarz', () => {
    expect(qabulQilindiMatni('B-1')).toContain('B-1');
    expect(tayyorMatni('B-1')).toContain('tayyor');
    expect(bekorMatni('B-1', 'Mijoz voz kechdi')).toContain('Mijoz voz kechdi');
    expect(qarzEslatmaMatni('1 450 000')).toContain('1 450 000');
  });
});
