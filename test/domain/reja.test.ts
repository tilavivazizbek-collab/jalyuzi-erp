import { describe, expect, it } from 'vitest';
import {
  bajarilish,
  bajarilishRangi,
  foizQosh,
  oyBoshi,
  oyKunlari,
  oyQosh,
  surat,
  yigindiTekshir,
} from '@/lib/domain/reja';

describe('TZ 21 — reja hisobi', () => {
  it('21.6.1 — bajarilish va rang (TZ misollari)', () => {
    expect(bajarilish('100000000', '87400000')).toBe('87.4');
    expect(bajarilishRangi('87.4')).toBe('SARIQ');
    expect(bajarilish('50000000', '54200000')).toBe('108.4');
    expect(bajarilishRangi('108.4')).toBe('YASHIL');
    expect(bajarilish('30000000', '18900000')).toBe('63.0');
    expect(bajarilishRangi('63.0')).toBe('QIZIL');
    // Chegaralarning o'zi: 80 — sariq, 95 — yashil
    expect(bajarilishRangi('80.0')).toBe('SARIQ');
    expect(bajarilishRangi('95.0')).toBe('YASHIL');
  });

  it('EC-REJ-01 / 06 — reja yo‘q yoki 0: bajarilish hisoblanmaydi', () => {
    expect(bajarilish(null, '5000')).toBeNull();
    expect(bajarilish('0', '5000')).toBeNull();
    expect(bajarilishRangi(null)).toBeNull();
    expect(surat({ reja: '0', fakt: '1', oy: '2026-08-01', bugun: '2026-08-15' })).toBeNull();
  });

  it('EC-REJ-05 — 200% ham yashil, ogohlantirish yo‘q', () => {
    expect(bajarilishRangi(bajarilish('100', '200'))).toBe('YASHIL');
  });

  it('21.6.2 — sur‘at: 15-avgust, reja 100 mln, fakt 41.2 mln', () => {
    const s = surat({ reja: '100000000', fakt: '41200000', oy: '2026-08-01', bugun: '2026-08-15' });
    expect(s).toMatchObject({ otganKun: 15, oyKuni: 31, otganFoiz: '48.4' });
    // 100 000 000 × 15/31
    expect(s?.kutilgan).toBe('48387097.00');
    expect(s?.farq).toBe('-7187097.00');
    // 41 200 000 × 31/15
    expect(s?.prognoz).toBe('85146667.00');
    expect(s?.prognozFoiz).toBe('85.1');
  });

  it('sur‘at — oy tugagan bo‘lsa butun oy; boshlanmagan bo‘lsa yo‘q', () => {
    expect(surat({ reja: '100', fakt: '90', oy: '2026-08-01', bugun: '2026-09-03' })?.otganKun).toBe(31);
    expect(surat({ reja: '100', fakt: '0', oy: '2026-08-01', bugun: '2026-07-30' })).toBeNull();
  });

  it('oy yordamchilari', () => {
    expect(oyBoshi('2026-08-17')).toBe('2026-08-01');
    expect(oyKunlari('2026-02-01')).toBe(28);
    expect(oyKunlari('2028-02-01')).toBe(29);
    expect(oyQosh('2026-12-01', 1)).toBe('2027-01-01');
    expect(oyQosh('2026-01-01', -1)).toBe('2025-12-01');
  });

  it('21.3.1 — yig‘indi tekshiruvi (majburiyat emas)', () => {
    expect(yigindiTekshir('180000000', ['100000000', '50000000', '30000000'])).toEqual({
      yigindi: '180000000.00',
      teng: true,
    });
    expect(yigindiTekshir('180000000', ['100000000', null])).toMatchObject({ teng: false });
    expect(yigindiTekshir(null, ['1'])).toMatchObject({ teng: null });
  });

  it('21.3.2 — nusxa +10% butun so‘mgacha', () => {
    expect(foizQosh('55000000', '10')).toBe('60500000.00');
    expect(foizQosh('333', '10')).toBe('366.00');
    expect(foizQosh(null, '10')).toBeNull();
  });
});

describe('reja formasi', () => {
  it('summa o‘qish — probel, vergul; bo‘sh — null; noto‘g‘ri — undefined', async () => {
    const { rejaSummasiniOqi, rejaKaliti } = await import('@/lib/domain/reja');
    expect(rejaSummasiniOqi('180 000 000')).toBe('180000000.00');
    expect(rejaSummasiniOqi('180,000,000')).toBe('180000000.00');
    expect(rejaSummasiniOqi('  ')).toBeNull();
    expect(rejaSummasiniOqi('-5')).toBeUndefined();
    expect(rejaSummasiniOqi('12abc')).toBeUndefined();
    expect(rejaKaliti('SOTUVCHI', 5, 17)).toBe('SOTUVCHI|5|17');
    expect(rejaKaliti('KORXONA', null, null)).toBe('KORXONA|0|0');
  });
});

describe('TZ 21.5 — fakt yig‘ish', () => {
  it('filial tushumi — sotgan filialda; foyda 20.17: bir filial 100%, ikki filial 50/50; qaytarish ayiriladi', async () => {
    const { rejaFaktiniYigish } = await import('@/lib/domain/reja');
    const f = rejaFaktiniYigish([
      // Chilonzor (1) sotdi, Samarqand (2) tikdi — 20.17.3 misoli
      { turi: 'TOPSHIRILDI', sotuvchiId: 10, sotganFilialId: 1, ishlabFilialId: 2, tushum: '678400', tannarx: '312000', ishHaqi: '57600' },
      // Chilonzor o'zi sotdi va tikdi
      { turi: 'TOPSHIRILDI', sotuvchiId: 11, sotganFilialId: 1, ishlabFilialId: 1, tushum: '100000', tannarx: '40000', ishHaqi: '10000' },
      // Shu oyda qaytarildi: 30 000 qaytdi (tushum ham, foyda ham kamayadi)
      { turi: 'QAYTARILDI', sotuvchiId: 11, sotganFilialId: 1, ishlabFilialId: 1, tushum: '-30000', tannarx: '0', ishHaqi: '0' },
    ]);
    expect(f.korxona).toEqual({ tushum: '748400.00', foyda: '328800.00' });
    // 154 400 + 50 000 − 30 000
    expect(f.filiallar.get(1)).toEqual({ tushum: '748400.00', foyda: '174400.00' });
    expect(f.filiallar.get(2)).toEqual({ tushum: '0.00', foyda: '154400.00' });
    expect(f.sotuvchilar.get('1|10')).toBe('678400.00');
    expect(f.sotuvchilar.get('1|11')).toBe('70000.00');
  });
});
