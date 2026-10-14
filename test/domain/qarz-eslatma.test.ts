import { describe, expect, it } from 'vitest';
import {
  STANDART_QARZ_ESLATMA,
  qarzEslatmaKerakmi,
  qarzEslatmaQoidasiniTekshir,
} from '@/lib/domain/qarz-eslatma';

describe('T-06 — avtomatik qarz eslatmasi qarori', () => {
  const q = STANDART_QARZ_ESLATMA; // 3 kun, har 7 kunda

  it('muddati o‘tmagan yoki endi o‘tgan qarzga — yo‘q', () => {
    expect(qarzEslatmaKerakmi(q, null, null)).toBe(false);
    expect(qarzEslatmaKerakmi(q, 2, null)).toBe(false);
  });

  it('muddatdan 3 kun o‘tdi, hech eslatilmagan — ha', () => {
    expect(qarzEslatmaKerakmi(q, 3, null)).toBe(true);
  });

  it('bezor qilmaslik — 7 kun o‘tmaguncha takror yo‘q (qo‘lda yuborilgani ham)', () => {
    expect(qarzEslatmaKerakmi(q, 30, 6)).toBe(false);
    expect(qarzEslatmaKerakmi(q, 30, 7)).toBe(true);
  });

  it('birinchiKun = 0 — o‘chiq', () => {
    expect(qarzEslatmaKerakmi({ birinchiKun: 0, takrorKun: 7 }, 100, null)).toBe(false);
  });

  it('sozlama tekshiruvi', () => {
    expect(qarzEslatmaQoidasiniTekshir(' 5 ', '14')).toEqual({ birinchiKun: 5, takrorKun: 14 });
    expect(qarzEslatmaQoidasiniTekshir('0', '7')).toEqual({ birinchiKun: 0, takrorKun: 7 });
    for (const [b, t] of [['-1', '7'], ['5', '0'], ['91', '7'], ['5', 'x'], ['', '7']]) {
      expect(qarzEslatmaQoidasiniTekshir(b ?? '', t ?? '')).toBeNull();
    }
  });
});
