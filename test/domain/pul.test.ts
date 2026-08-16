/**
 * QISM 1 §3 · 1.3-invariant
 */
import { describe, expect, it } from 'vitest';
import {
  ayir,
  bol,
  dollar,
  kattami,
  kichikmi,
  kopaytir,
  kurs,
  manfiy,
  manfiymi,
  MANFIY_BELGI,
  MINGLIK_AJRATGICH,
  musbatmi,
  nisbat,
  nolDollar,
  nolSom,
  nolmi,
  ogir,
  pulKorsat,
  pulMatn,
  qosh,
  som,
  taqqosla,
  teng,
  valyutasi,
  yaxlitla,
  yaxlitlaDollar,
  yaxlitlaKassa,
  yaxlitlaNarx,
  yigindi,
} from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

describe('yaratish va saqlash ko\'rinishi', () => {
  it('bazadan kelgan matnni ham, koddagi sonni ham qabul qiladi', () => {
    expect(pulMatn(som('120000.50'))).toBe('120000.50');
    expect(pulMatn(som(120_000))).toBe('120000.00');
  });

  it('NUMERIC(14,2) ga mos — har doim ikki kasr xonasi', () => {
    expect(pulMatn(som('0.005'))).toBe('0.01');
    expect(pulMatn(dollar('49.999'))).toBe('50.00');
  });

  it('valyutasini yodda saqlaydi', () => {
    expect(valyutasi(som(1))).toBe('SOM');
    expect(valyutasi(dollar(1))).toBe('USD');
  });

  it('son bo\'lmagan qiymatni rad etadi', () => {
    expect(() => som('salom')).toThrow(BiznesXato);
    expect(() => som(Number.NaN)).toThrow(BiznesXato);
    expect(() => som(Number.POSITIVE_INFINITY)).toThrow(BiznesXato);
  });

  it('o\'zgarmas — bir marta yasalgan summa keyin o\'zgartirilmaydi', () => {
    const a = som(100);
    qosh(a, som(50));
    expect(pulMatn(a)).toBe('100.00');
  });
});

describe('ikkilik kasr xatosi bo\'lmasligi (nega Decimal)', () => {
  it('0.1 + 0.2 = 0.3', () => {
    expect(pulMatn(qosh(som('0.1'), som('0.2')))).toBe('0.30');
  });

  it('katta summalar aniq qo\'shiladi', () => {
    const jami = yigindi(nolSom(), [som('352800'), som('264600'), som('45000'), som('16000')]);
    expect(pulMatn(jami)).toBe('678400.00');
  });
});

describe('amallar', () => {
  it('qosh, ayir, kopaytir, bol', () => {
    expect(pulMatn(qosh(som(100), som(250)))).toBe('350.00');
    expect(pulMatn(ayir(som(100), som(250)))).toBe('-150.00');
    expect(pulMatn(kopaytir(som(35_000), '4.2'))).toBe('147000.00');
    expect(pulMatn(bol(som(660_000), 10))).toBe('66000.00');
  });

  it('nolga bo\'lish rad etiladi', () => {
    expect(() => bol(som(100), 0)).toThrow(BiznesXato);
    expect(() => nisbat(som(100), nolSom())).toThrow(BiznesXato);
  });

  it('manfiy va belgilar', () => {
    expect(pulMatn(manfiy(som(500)))).toBe('-500.00');
    expect(nolmi(nolSom())).toBe(true);
    expect(musbatmi(som(1))).toBe(true);
    expect(manfiymi(som(-1))).toBe(true);
    expect(manfiymi(nolSom())).toBe(false);
  });

  it('bo\'sh ro\'yxatning yig\'indisi — nol', () => {
    expect(pulMatn(yigindi(nolDollar(), []))).toBe('0.00');
  });

  it('nisbat — ustama eroziyasi hisobi (11.7.5)', () => {
    const ustama = nisbat(ayir(som(120_000), som(87_333)), som(87_333));
    expect(ustama.times(100).toDecimalPlaces(1).toString()).toBe('37.4');
  });
});

describe('taqqoslash', () => {
  it('taqqosla, teng, kattami, kichikmi', () => {
    expect(taqqosla(som(100), som(200))).toBe(-1);
    expect(taqqosla(som(200), som(100))).toBe(1);
    expect(taqqosla(som(100), som(100))).toBe(0);
    expect(teng(som('100.00'), som(100))).toBe(true);
    expect(kattami(som(200), som(100))).toBe(true);
    expect(kichikmi(som(100), som(200))).toBe(true);
  });
});

describe('yaxlitlash — §3.3', () => {
  it('narx 100 so\'mgacha (6.3, 13.5 — Z-08)', () => {
    expect(pulMatn(yaxlitlaNarx(som(147_449)))).toBe('147400.00');
    expect(pulMatn(yaxlitlaNarx(som(147_450)))).toBe('147500.00');
    expect(pulMatn(yaxlitlaNarx(som(147_451)))).toBe('147500.00');
  });

  it('kassa to\'lovi 1 000 so\'mgacha (12.19)', () => {
    expect(pulMatn(yaxlitlaKassa(som(147_499)))).toBe('147000.00');
    expect(pulMatn(yaxlitlaKassa(som(147_500)))).toBe('148000.00');
  });

  it('ROUND_HALF_UP — 0.5 yuqoriga', () => {
    expect(pulMatn(yaxlitla(som(50), 100))).toBe('100.00');
    expect(pulMatn(yaxlitla(som(49), 100))).toBe('0.00');
  });

  it('dollar 0.01 gacha', () => {
    expect(pulMatn(yaxlitlaDollar(dollar('49.994')))).toBe('49.99');
    expect(pulMatn(yaxlitlaDollar(dollar('49.995')))).toBe('50.00');
  });

  it('noto\'g\'ri qadam rad etiladi', () => {
    expect(() => yaxlitla(som(100), 0)).toThrow(BiznesXato);
    expect(() => yaxlitla(som(100), -100)).toThrow(BiznesXato);
    expect(() => yaxlitla(som(100), 10.5)).toThrow(BiznesXato);
  });
});

describe('valyuta konversiyasi — §3.2', () => {
  it('kurs parametr sifatida keladi, sozlamadan o\'qilmaydi', () => {
    const k = kurs(12_650, new Date('2026-08-16'), 'SNAPSHOT');
    expect(pulMatn(ogir(dollar(3000), k))).toBe('37950000.00');
  });

  it('kurs farqi — TZ 9.6 kanonik misoli', () => {
    const eski = kurs(12_650, new Date('2026-08-01'), 'SNAPSHOT');
    const yangi = kurs(13_200, new Date('2026-09-01'), 'JORIY');
    const qarz = dollar(3000);
    const farq = ayir(ogir(qarz, yangi), ogir(qarz, eski));
    expect(pulMatn(ogir(qarz, yangi))).toBe('39600000.00');
    expect(pulMatn(ogir(qarz, eski))).toBe('37950000.00');
    expect(pulMatn(farq)).toBe('1650000.00');
  });

  it('noto\'g\'ri kurs rad etiladi', () => {
    expect(() => kurs(0, new Date(), 'JORIY')).toThrow(BiznesXato);
    expect(() => kurs(-5, new Date(), 'JORIY')).toThrow(BiznesXato);
    expect(() => kurs('salom', new Date(), 'JORIY')).toThrow(BiznesXato);
  });
});

describe('ko\'rsatish — §19 formati', () => {
  it('ajratgich AYNAN oddiy probel (U+0020), uzilmas probel emas', () => {
    // Ikkalasi ekranda bir xil ko'rinadi. Kod nuqtasi bilan qadab qo'yiladi,
    // aks holda bir kun almashib qolsa hech kim sezmaydi.
    expect(MINGLIK_AJRATGICH.codePointAt(0)).toBe(0x0020);
    expect(MANFIY_BELGI.codePointAt(0)).toBe(0x2212);
    expect(pulKorsat(som(678_400)).codePointAt(3)).toBe(0x0020);
  });

  it('probel bilan ajratiladi, so\'mda .00 chiqmaydi', () => {
    expect(pulKorsat(som(678_400))).toBe('678 400');
    expect(pulKorsat(som(1_234_567))).toBe('1 234 567');
    expect(pulKorsat(som('1234567.89'))).toBe('1 234 567.89');
    expect(pulKorsat(som(0))).toBe('0');
  });

  it('dollarda kasr har doim ko\'rinadi', () => {
    expect(pulKorsat(dollar(50))).toBe('50.00');
  });

  it('manfiy summa belgisi bilan', () => {
    expect(pulKorsat(som(-1_140_000))).toBe('−1 140 000');
  });
});
