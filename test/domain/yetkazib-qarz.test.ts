import { describe, expect, it } from 'vitest';
import { qarzniTaqsimla, type JurnalQatori } from '@/lib/domain/qarz-taqsimot';
import { muddatXulosasi, tolovIntizomimiz } from '@/lib/domain/yetkazib-qarz';

const q = (
  id: number,
  sana: string,
  turi: string,
  summa: string,
  kirimId: number | null,
): JurnalQatori => ({ id, sana: new Date(`${sana}T12:00:00+05:00`), turi, summa, valyuta: 'SOM', buyurtmaId: kirimId });

describe('yetkazib beruvchi qarzi — FIFO va muddat', () => {
  // K1 1000 (muddat 10-05), K2 500 (muddat 10-20); kartochkadan 1200 to'landi
  const jurnal = [
    q(1, '2026-09-25', 'XARID', '1000', 1),
    q(2, '2026-10-01', 'XARID', '500', 2),
    q(3, '2026-10-03', 'TOLOV', '-1200', null),
  ];
  const t = qarzniTaqsimla(jurnal, 'XARID');
  const muddat = new Map([
    [1, '2026-10-05'],
    [2, '2026-10-20'],
  ]);

  it('kartochkadan to‘lov eng eski kirimni yopadi', () => {
    expect(t.bandlar.map((b) => b.qolgan)).toEqual(['0.00', '300.00']);
    expect(t.qarz.SOM).toBe('300.00');
  });

  it('to‘langan kirim muddati endi qizil qilmaydi', () => {
    const m = muddatXulosasi(t.bandlar, muddat, '2026-10-07');
    expect(m.yaqinMuddat).toBe('2026-10-20');
    expect(m.muddatOtganSoni).toBe(0);
    expect(muddatXulosasi(t.bandlar, muddat, '2026-10-21').muddatOtgan.SOM).toBe('300.00');
  });

  it('storno qilingan kirim qarz bandi emas', () => {
    const s = qarzniTaqsimla([...jurnal, q(4, '2026-10-02', 'XARID', '-500', 2)], 'XARID');
    expect(s.bandlar).toHaveLength(1);
    expect(s.avans.SOM).toBe('200.00');
  });

  it('to‘lov intizomi — o‘rtacha kun va kechikib to‘langan', () => {
    const i = tolovIntizomimiz(t.bandlar, new Map([[1, '2026-09-30']]));
    expect(i.tolanganSoni).toBe(1);
    expect(i.ortachaKun).toBe(8);
    expect(i.kechikibTolangan).toBe(1);
  });
});
