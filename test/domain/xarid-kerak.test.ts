import { describe, expect, it } from 'vitest';
import {
  STANDART_YETKAZISH_KUNI,
  kirimBirligida,
  ZAXIRA_KUNI,
  xaridSababi,
  yetkazishMuddati,
} from '@/lib/domain/xarid-kerak';
import type { Bashorat } from '@/lib/domain/hisobot/bashorat';

const b = (kunlar: number | null, holati: Bashorat['holati'] = 'YETARLI'): Bashorat => ({
  kunlar,
  sana: null,
  holati,
  ishonch: 'YAXSHI',
});

describe('yetkazish muddati — 8-band', () => {
  it('tarix yo‘q — standart', () => {
    expect(yetkazishMuddati([])).toEqual({ kun: STANDART_YETKAZISH_KUNI, manba: 'STANDART' });
  });
  it('mediana — bitta uzoq kutish buzmaydi', () => {
    expect(yetkazishMuddati([5, 6, 60])).toEqual({ kun: 6, manba: 'TARIX' });
    // juft — kattarog'i
    expect(yetkazishMuddati([4, 10]).kun).toBe(10);
  });
});

describe('buyurtma kerakmi — 8-band', () => {
  const asos = { tugagan: false, kamQoldiq: false, yetkazishKuni: 10 };
  it('tugagan va kam — bashoratsiz ham', () => {
    expect(xaridSababi({ ...asos, tugagan: true, bashorat: null })).toBe('TUGAGAN');
    expect(xaridSababi({ ...asos, kamQoldiq: true, bashorat: null })).toBe('KAM');
  });
  it('kelguncha tugaydi — muddat + zaxira chegarasi', () => {
    expect(xaridSababi({ ...asos, bashorat: b(10 + ZAXIRA_KUNI) })).toBe('TEZ_TUGAYDI');
    expect(xaridSababi({ ...asos, bashorat: b(10 + ZAXIRA_KUNI + 1) })).toBeNull();
  });
  it('harakatsiz material — chegarasiz belgilanmaydi', () => {
    expect(xaridSababi({ ...asos, bashorat: b(null, 'NOMALUM') })).toBeNull();
  });
});

describe('tavsiya buyurtma birligida', () => {
  it('rulon — eni × bo‘yi, yuqoriga', () => {
    expect(kirimBirligida('58', { hisobTuri: 'RULON', koeffitsient: '1', standartEniM: '3', odatdagiBoyiM: '50' })).toBe(1);
    expect(kirimBirligida('151', { hisobTuri: 'RULON', koeffitsient: '1', standartEniM: '3', odatdagiBoyiM: '50' })).toBe(2);
    expect(kirimBirligida('58', { hisobTuri: 'RULON', koeffitsient: '1', standartEniM: null, odatdagiBoyiM: '50' })).toBeNull();
  });
  it('shtanga va quti — koeffitsient bo‘yicha', () => {
    expect(kirimBirligida('10', { hisobTuri: 'CHIZIQLI', koeffitsient: '3', standartEniM: null, odatdagiBoyiM: null })).toBe(4);
    expect(kirimBirligida('120', { hisobTuri: 'DONA', koeffitsient: '50', standartEniM: null, odatdagiBoyiM: null })).toBe(3);
    expect(kirimBirligida('0', { hisobTuri: 'DONA', koeffitsient: '50', standartEniM: null, odatdagiBoyiM: null })).toBe(0);
  });
});
