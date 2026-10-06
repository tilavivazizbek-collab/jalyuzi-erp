/**
 * Ustama uchun sotuv narxi — egasi qarori 2026-10-07: «belgilab qo'yilgan
 * narxga tayansin». TZ 11.7.5
 */
import { describe, expect, it } from 'vitest';
import { ustamaUchunNarx } from '@/lib/domain/hisobot/ustama-eroziya';
import { kurs, pulMatn } from '@/lib/domain/pul';

const q = (o: {
  materialId?: number | null;
  mijozTuriId?: number | null;
  filialId?: number | null;
  bosqichlar: { dan: number; gacha: number | null; narx: string; valyuta: string }[];
}) => ({ mijozTuriId: null, filialId: null, materialId: null, ...o });

const K = kurs('12800', new Date('2026-10-07'), 'JORIY');
const asos = { materialId: 7, filialId: 1, eskiNarx: '50000', eskiValyuta: 'SOM', kurs: K };

describe('ustamaUchunNarx', () => {
  it('EC-UST-N1: materialning O‘Z jadvali — eski maydon emas', () => {
    const n = ustamaUchunNarx({
      ...asos,
      qoidalar: [q({ materialId: 7, bosqichlar: [{ dan: 0, gacha: null, narx: '95000', valyuta: 'SOM' }] })],
    });
    expect(n.manba).toBe('JADVAL');
    expect(n.narx === null ? null : pulMatn(n.narx)).toBe('95000.00');
  });

  it('EC-UST-N2: o‘z jadvali yo‘q — umumiy jadval (sotuv ekrani kabi)', () => {
    const n = ustamaUchunNarx({
      ...asos,
      qoidalar: [
        q({ materialId: 99, bosqichlar: [{ dan: 0, gacha: null, narx: '1', valyuta: 'SOM' }] }),
        q({ bosqichlar: [{ dan: 0, gacha: null, narx: '80000', valyuta: 'SOM' }] }),
      ],
    });
    expect(n.narx === null ? null : pulMatn(n.narx)).toBe('80000.00');
  });

  it('EC-UST-N3: bosqichli — 1 birlik narxi (eng kichik xarid)', () => {
    const n = ustamaUchunNarx({
      ...asos,
      qoidalar: [
        q({
          materialId: 7,
          bosqichlar: [
            { dan: 0, gacha: 10, narx: '100000', valyuta: 'SOM' },
            { dan: 10, gacha: null, narx: '85000', valyuta: 'SOM' },
          ],
        }),
      ],
    });
    expect(n.narx === null ? null : pulMatn(n.narx)).toBe('100000.00');
  });

  it('EC-UST-N4: dollar narx joriy kursda; kurs yo‘q bo‘lsa — hisoblanmaydi', () => {
    const qoidalar = [q({ materialId: 7, bosqichlar: [{ dan: 0, gacha: null, narx: '10', valyuta: 'USD' }] })];
    const n = ustamaUchunNarx({ ...asos, qoidalar });
    expect(n.narx === null ? null : pulMatn(n.narx)).toBe('128000.00');
    expect(ustamaUchunNarx({ ...asos, qoidalar, kurs: null }).narx).toBeNull();
  });

  it('EC-UST-N5: jadval umuman yo‘q — materialning o‘z narxi (sotuv ham shunday)', () => {
    const n = ustamaUchunNarx({ ...asos, qoidalar: [] });
    expect(n.manba).toBe('MATERIAL');
    expect(n.narx === null ? null : pulMatn(n.narx)).toBe('50000.00');
    expect(ustamaUchunNarx({ ...asos, qoidalar: [], eskiNarx: null }).manba).toBe('YOQ');
  });

  it('EC-UST-N6: boshqa filialning qoidasi bu filialga tegmaydi', () => {
    const n = ustamaUchunNarx({
      ...asos,
      qoidalar: [q({ materialId: 7, filialId: 2, bosqichlar: [{ dan: 0, gacha: null, narx: '1', valyuta: 'SOM' }] })],
    });
    expect(n.manba).toBe('MATERIAL');
  });
});
