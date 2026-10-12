import { describe, expect, it } from 'vitest';
import { nazoratniGuruhla, type NazoratHodisasi } from '@/lib/domain/hisobot/nazorat';

const h = (q: Partial<NazoratHodisasi> & Pick<NazoratHodisasi, 'turi' | 'xodimId' | 'xodim'>): NazoratHodisasi => ({
  sana: new Date('2026-10-10T10:00:00Z'),
  tavsif: '',
  summa: null,
  havola: null,
  ...q,
});

describe('nazorat guruhlash', () => {
  const x = nazoratniGuruhla([
    h({ turi: 'KUN_FARQI', xodimId: 2, xodim: 'Zarina', summa: '-10000.00' }),
    h({ turi: 'KUN_FARQI', xodimId: 1, xodim: 'Anvar', summa: '4000.00', sana: new Date('2026-10-11T10:00:00Z') }),
    h({ turi: 'KASSA_STORNO', xodimId: 2, xodim: 'Zarina', summa: '50000.00' }),
    h({ turi: 'KIRISH_BLOKLANDI', xodimId: 2, xodim: 'Zarina' }),
  ]);

  it('turlar belgilangan tartibda; summa — mutlaq qiymatlar yig‘indisi; yangisi birinchi', () => {
    expect(x.turlar.map((t) => t.turi)).toEqual(['KASSA_STORNO', 'KUN_FARQI', 'KIRISH_BLOKLANDI']);
    expect(x.turlar[1]).toMatchObject({ soni: 2, summa: '14000.00' });
    expect(x.turlar[1]?.hodisalar[0]?.xodim).toBe('Anvar');
    expect(x.turlar[2]?.summa).toBeNull();
  });

  it('xodimlar ism bo‘yicha — son bo‘yicha emas (reyting yo‘q)', () => {
    expect(x.xodimlar.map((q) => q.xodim)).toEqual(['Anvar', 'Zarina']);
    expect(x.xodimlar[1]).toMatchObject({ jami: 3, soni: { KUN_FARQI: 1, KASSA_STORNO: 1, KIRISH_BLOKLANDI: 1 } });
    expect(x.jami).toBe(4);
  });
});
