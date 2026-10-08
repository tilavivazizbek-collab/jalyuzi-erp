import { describe, expect, it } from 'vitest';
import { kitobFiltriniOqi, kitobSorovi, kunOldin } from '@/app/(panel)/kassa/kitob-filtr';
import { kassaKodNomi, manbaKorinishi } from '@/lib/domain/kassa-kod';

describe('kassa kitobi filtri', () => {
  it('standart — oxirgi 7 kun', () => {
    expect(kitobFiltriniOqi({}, '2026-10-08')).toEqual({
      dan: '2026-10-02',
      gacha: '2026-10-08',
      kassaId: null,
      yonalish: 'hammasi',
    });
  });
  it('teskari oraliq to‘g‘rilanadi, noto‘g‘ri qiymat tashlanadi', () => {
    const f = kitobFiltriniOqi({ dan: '2026-10-08', gacha: '2026-10-01', kassa: 'x', yonalish: 'yo' }, '2026-10-08');
    expect([f.dan, f.gacha, f.kassaId, f.yonalish]).toEqual(['2026-10-01', '2026-10-08', null, 'hammasi']);
  });
  it('oy chegarasi va havola', () => {
    expect(kunOldin('2026-03-01', 1)).toBe('2026-02-28');
    const f = kitobFiltriniOqi({ kassa: '3', yonalish: 'chiqim' }, '2026-10-08');
    expect(kitobSorovi(f)).toBe('dan=2026-10-02&gacha=2026-10-08&kassa=3&yonalish=chiqim');
  });
});

describe('kassa kodi va manba ko‘rinishi', () => {
  it('yangi kodlar ham nomlanadi', () => {
    expect(kassaKodNomi('C11')).toBe('Ayirboshlash — chiqdi');
    expect(kassaKodNomi('K11')).toBe("Filialdan qarz to'lovi");
    expect(kassaKodNomi('Z9')).toBe('Z9');
  });
  it('ichki belgi o‘rniga nom va havola', () => {
    expect(manbaKorinishi('buyurtma', 12, 'B-0012')).toEqual({ matn: 'Buyurtma B-0012', havola: '/buyurtma/12' });
    expect(manbaKorinishi('qaytarish', 5, 'B-0012', 12).havola).toBe('/buyurtma/12');
    expect(manbaKorinishi('ayirboshlash', 3, null)).toEqual({ matn: 'Valyuta ayirboshlash', havola: null });
  });
});
