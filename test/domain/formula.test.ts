/**
 * TZ 4.5, 4.8 · QISM 1 §4.3 · AUDIT B-01
 */
import { describe, expect, it } from 'vitest';
import {
  formulaHisobla,
  formulaNatijasi,
  formulaOzgaruvchilari,
  formulaTekshir,
  sarflashHisobla,
  standartQiymatlar,
} from '@/lib/domain/formula';
import { sm } from '@/lib/domain/birlik';
import { BiznesXato } from '@/lib/xato';

const q = (o: Record<string, number>): Record<string, number> => o;

describe('o\'qish va hisoblash', () => {
  it('oddiy amallar va qavslar', () => {
    expect(formulaHisobla('2 + 3 × 4', {}).toString()).toBe('14');
    expect(formulaHisobla('(2 + 3) × 4', {}).toString()).toBe('20');
    expect(formulaHisobla('10 / 4', {}).toString()).toBe('2.5');
    expect(formulaHisobla('-5 + 8', {}).toString()).toBe('3');
  });

  it('× va * , − va - , ÷ va / — ikkalasi ham ishlaydi', () => {
    expect(formulaHisobla('6 × 2', {}).toString()).toBe('12');
    expect(formulaHisobla('6 * 2', {}).toString()).toBe('12');
    expect(formulaHisobla('6 − 2', {}).toString()).toBe('4');
    expect(formulaHisobla('6 ÷ 2', {}).toString()).toBe('3');
  });

  it('apostrofning uch xil ko\'rinishi bitta o\'zgaruvchi', () => {
    const qiymatlar = q({ "BO'YI": 220 });
    expect(formulaHisobla("BO'YI", qiymatlar).toString()).toBe('220');
    expect(formulaHisobla('BO’YI', qiymatlar).toString()).toBe('220');
    expect(formulaHisobla('BO`YI', qiymatlar).toString()).toBe('220');
  });

  it('kasrli koeffitsient — Plisse matosi', () => {
    expect(formulaHisobla('MAYDON × 1.5', q({ MAYDON: 29_400 })).toString()).toBe('44100');
  });

  it('ikkilik kasr xatosi yo\'q (Decimal bilan hisoblanadi)', () => {
    expect(formulaHisobla('0.1 + 0.2', {}).toString()).toBe('0.3');
  });
});

describe('xatolar — TZ 4.5 «xato bo\'lsa saqlanmaydi»', () => {
  it('bo\'sh formula', () => {
    expect(() => formulaHisobla('   ', {})).toThrow(BiznesXato);
  });

  it('yopilmagan qavs', () => {
    expect(() => formulaHisobla('(ENI + 2', q({ ENI: 1 }))).toThrow(BiznesXato);
  });

  it('ortiqcha belgi', () => {
    expect(() => formulaHisobla('ENI + + ', q({ ENI: 1 }))).toThrow(BiznesXato);
    expect(() => formulaHisobla('ENI 5', q({ ENI: 1 }))).toThrow(BiznesXato);
  });

  it('tushunarsiz belgi', () => {
    expect(() => formulaHisobla('ENI @ 2', q({ ENI: 1 }))).toThrow(BiznesXato);
  });

  it('qiymati berilmagan o\'zgaruvchi', () => {
    expect(() => formulaHisobla('CHET × 2', {})).toThrow(BiznesXato);
  });

  it('nolga bo\'lish', () => {
    expect(() => formulaHisobla('ENI / 0', q({ ENI: 100 }))).toThrow(BiznesXato);
  });

  it('kod bajarilmaydi — eval ishlatilmagan', () => {
    expect(() => formulaHisobla('process.exit(1)', {})).toThrow(BiznesXato);
  });
});

describe('o\'zgaruvchilar ro\'yxati — TZ 4.3', () => {
  it('formulada ishlatilgan nomlarni qaytaradi', () => {
    expect(formulaOzgaruvchilari("(ENI − 2×CHET) × BO'YI")).toEqual(["BO'YI", 'CHET', 'ENI']);
  });

  it('formulaTekshir noma\'lum nomni topadi', () => {
    const yaxshi = formulaTekshir("(ENI − 2×CHET) × BO'YI", ['CHET']);
    expect(yaxshi.yaroqli).toBe(true);
    expect(yaxshi.nomalum).toEqual([]);

    const yomon = formulaTekshir('ENI × QALINLIK', ['CHET']);
    expect(yomon.yaroqli).toBe(false);
    expect(yomon.nomalum).toEqual(['QALINLIK']);
  });

  it('sintaksis xatosida otmaydi — forma validatsiyasi uchun', () => {
    const natija = formulaTekshir('(ENI + ', []);
    expect(natija.yaroqli).toBe(false);
    expect(natija.xato).toBeDefined();
  });
});

describe('natija birligi — AUDIT B-01, §4.3', () => {
  it('KV_M: kvadrat santimetr kvadrat metrga o\'giriladi', () => {
    expect(formulaNatijasi(formulaHisobla('6600', {}), 'KV_M')).toBe(0.66);
  });

  it('SM: shundayligicha qoladi — Q-01', () => {
    expect(formulaNatijasi(formulaHisobla('420', {}), 'SM')).toBe(420);
  });

  it('DONA: yuqoriga yaxlitlanadi', () => {
    expect(formulaNatijasi(formulaHisobla('2.1', {}), 'DONA')).toBe(3);
    expect(formulaNatijasi(formulaHisobla('2', {}), 'DONA')).toBe(2);
  });

  it('bir xil formula uch birlikda uch xil natija beradi (B-01 ning mohiyati)', () => {
    const qiymatlar = standartQiymatlar(sm(210), sm(140), 1);
    expect(sarflashHisobla('ENI × 2', qiymatlar, 'SM')).toBe(420);
    expect(sarflashHisobla('ENI × 2', qiymatlar, 'KV_M')).toBe(0.042);
    expect(sarflashHisobla('ENI × 2', qiymatlar, 'DONA')).toBe(420);
  });
});

describe('standart o\'zgaruvchilar', () => {
  it('MAYDON eni × bo\'yi dan kv.smda hisoblanadi (§4.3)', () => {
    const qiymatlar = standartQiymatlar(sm(210), sm(140), 2, { CHET: 30 });
    expect(qiymatlar['ENI']).toBe(210);
    expect(qiymatlar["BO'YI"]).toBe(140);
    expect(qiymatlar['MAYDON']).toBe(29_400);
    expect(qiymatlar['SONI']).toBe(2);
    expect(qiymatlar['CHET']).toBe(30);
  });

  it('parametr nomi katta harfga keltiriladi', () => {
    const qiymatlar = standartQiymatlar(sm(100), sm(100), 1, { chet: 25 });
    expect(qiymatlar['CHET']).toBe(25);
  });
});
describe('funksiyalar — AUDIT 2-topilma tuzatish (2026-09-17)', () => {
  it('CEIL / FLOOR / ROUND / MIN / MAX hisoblanadi', () => {
    expect(formulaHisobla('CEIL(2.1)', {}).toString()).toBe('3');
    expect(formulaHisobla('FLOOR(2.9)', {}).toString()).toBe('2');
    expect(formulaHisobla('ROUND(2.5)', {}).toString()).toBe('3');
    expect(formulaHisobla('ROUND(2.444, 2)', {}).toString()).toBe('2.44');
    expect(formulaHisobla('MIN(3, 7)', {}).toString()).toBe('3');
    expect(formulaHisobla('MAX(3, 7)', {}).toString()).toBe('7');
  });

  it('funksiya ichma-ichcha ishlaydi — rapport yaxlitlash', () => {
    // 220 / 32 = 6.875 → CEIL → 7 → 224 sm (to\'liq 7 rapport)
    expect(formulaHisobla("CEIL(220 / 32) * 32", {}).toString()).toBe('224');
  });

  it("funksiya nomi o'zgaruvchi EMAS — formulaOzgaruvchilari faqat argumentlarni qaytaradi", () => {
    expect(formulaOzgaruvchilari("CEIL(BO'YI / RAPPORT) * RAPPORT")).toEqual(["BO'YI", 'RAPPORT']);
    const natija = formulaTekshir("CEIL(BO'YI / RAPPORT)", ['RAPPORT']);
    expect(natija.yaroqli).toBe(true);
  });

  it("noma'lum funksiya va noto'g'ri argumentlar rad etiladi", () => {
    expect(() => formulaHisobla('SIN(1)', {})).toThrow(BiznesXato);
    expect(() => formulaHisobla('CEIL()', {})).toThrow(BiznesXato);
    expect(() => formulaHisobla('MIN(1)', {})).toThrow(BiznesXato);
    expect(() => formulaHisobla('ROUND(1, -1)', {})).toThrow(BiznesXato);
  });
});
