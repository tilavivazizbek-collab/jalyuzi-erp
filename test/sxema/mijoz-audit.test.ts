/**
 * TZ 6.2 · 6.3 · 6.4 · Q-23 — egasi auditi 2026-10-06 (2- va 8-xatolar).
 */
import { describe, expect, it } from 'vitest';
import { mijozSxema } from '@/lib/sxema/mijoz';
import { offsetQolla } from '@/lib/domain/narx';
import { pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const asos = { ism: 'Sinov', shaxsTuri: '' };
const tekshir = (q: Record<string, string>) => mijozSxema.safeParse({ ...asos, ...q });
const xatoYoli = (q: Record<string, string>): string[] => {
  const n = tekshir(q);
  return n.success ? [] : n.error.issues.map((i) => i.path.join('.'));
};

describe('chegirma / ustama — 2-xato', () => {
  it('EC-MIJ-A1: 150% va −150% rad etiladi, −20% va +10% qabul qilinadi', () => {
    expect(xatoYoli({ offsetTuri: 'FOIZ', offsetQiymat: '150' })).toContain('offsetQiymat');
    expect(xatoYoli({ offsetTuri: 'FOIZ', offsetQiymat: '-150' })).toContain('offsetQiymat');
    expect(tekshir({ offsetTuri: 'FOIZ', offsetQiymat: '-20' }).success).toBe(true);
    expect(tekshir({ offsetTuri: 'FOIZ', offsetQiymat: '10' }).success).toBe(true);
  });

  it('EC-MIJ-A2: «1e5» va «Infinity» son emas', () => {
    expect(xatoYoli({ offsetTuri: 'SOM', offsetQiymat: '1e5' })).toContain('offsetQiymat');
    expect(xatoYoli({ qarzLimiti: 'Infinity' })).toContain('qarzLimiti');
    expect(tekshir({ qarzLimiti: '5 000 000' }).success).toBe(true);
  });

  it('EC-MIJ-A3: chegirma narxdan katta bo‘lsa manfiy narx EMAS, xato', () => {
    expect(() => offsetQolla(som('100000'), { turi: 'FOIZ', foiz: -150 }, null)).toThrow(
      BiznesXato,
    );
    expect(() => offsetQolla(som('100000'), { turi: 'SOM', summa: som('-120000') }, null)).toThrow(
      BiznesXato,
    );
    expect(pulMatn(offsetQolla(som('100000'), { turi: 'FOIZ', foiz: -3 }, null))).toBe('97000.00');
  });
});

describe('rekvizitlar va savdo — 8-band', () => {
  it('EC-MIJ-A4: INN 9 yoki 14 raqam, bo‘sh joy bilan ham', () => {
    expect(tekshir({ inn: '123 456 789' }).success).toBe(true);
    expect(tekshir({ inn: '12345678901234' }).success).toBe(true);
    expect(xatoYoli({ inn: '12345' })).toContain('inn');
  });

  it('EC-MIJ-A5: MFO 5 raqam, hisob raqam 20 raqam', () => {
    expect(tekshir({ mfo: '00873', hisobRaqam: '2020 8000 1234 5678 9012' }).success).toBe(true);
    expect(xatoYoli({ mfo: '873' })).toContain('mfo');
    expect(xatoYoli({ hisobRaqam: '2020800012' })).toContain('hisobRaqam');
  });

  it('EC-MIJ-A6: to‘lov muddati 1–365 kun, bo‘sh — nazorat yo‘q', () => {
    expect(tekshir({ tolovMuddatiKun: '' }).success).toBe(true);
    expect(tekshir({ tolovMuddatiKun: '15' }).success).toBe(true);
    expect(xatoYoli({ tolovMuddatiKun: '0' })).toContain('tolovMuddatiKun');
    expect(xatoYoli({ tolovMuddatiKun: '400' })).toContain('tolovMuddatiKun');
    expect(xatoYoli({ tolovMuddatiKun: '7.5' })).toContain('tolovMuddatiKun');
  });

  it('EC-MIJ-A7: shartnoma sanasi haqiqiy sana bo‘lishi kerak', () => {
    expect(tekshir({ shartnomaSana: '2026-10-06' }).success).toBe(true);
    expect(xatoYoli({ shartnomaSana: '06.10.2026' })).toContain('shartnomaSana');
  });
});
