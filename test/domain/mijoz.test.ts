/**
 * TZ 6 · Q-26 · 2.1 · 2.2-invariant
 */
import { describe, expect, it } from 'vitest';
import {
  bittaValyutamiTekshir,
  dublikatTekshir,
  limitBloklaydimi,
  limitHolati,
  mijozMajburiymi,
  nofaolQilinsinmi,
  ochirilsinmi,
  qaytganTolovQayerga,
  telefonNormalla,
  xabarYuborilsinmi,
  yopishNavbati,
  type MavjudMijoz,
  type Qarz,
} from '@/lib/domain/mijoz';
import { dollar, kurs, nolDollar, nolSom, pulMatn, som } from '@/lib/domain/pul';

const JORIY = kurs(12_650, new Date('2026-08-16'), 'JORIY');

// ─── 6.4 · Qarz limiti ────────────────────────────────────────────────────

describe('6.4 — limit doim so\'mda, dollar qarzi joriy kursda qo\'shiladi', () => {
  it('TZ dagi misol: 5 000 000 + 150 $ = 6 897 500 > 6 500 000', () => {
    const qarz: Qarz = { som: som(5_000_000), dollar: dollar(150) };
    const h = limitHolati(qarz, som(6_500_000), JORIY);

    expect(pulMatn(h.jamiSomda)).toBe('6897500.00');
    expect(h.oshganmi).toBe(true);
  });

  it('limitdan oshmasa — oshganmi false', () => {
    const qarz: Qarz = { som: som(5_000_000), dollar: dollar(150) };
    expect(limitHolati(qarz, som(7_000_000), JORIY).oshganmi).toBe(false);
  });

  it('limit belgilanmagan — hech qachon oshmaydi', () => {
    const qarz: Qarz = { som: som(99_000_000), dollar: dollar(9999) };
    expect(limitHolati(qarz, null, JORIY).oshganmi).toBe(false);
  });

  it('faqat so\'m qarzi', () => {
    const qarz: Qarz = { som: som(1_000_000), dollar: nolDollar() };
    expect(pulMatn(limitHolati(qarz, null, JORIY).jamiSomda)).toBe('1000000.00');
  });

  it("ma'lum oqibat: kurs o'zgarsa mijoz hech narsa olmasdan limitdan oshadi", () => {
    const qarz: Qarz = { som: som(5_000_000), dollar: dollar(150) };
    const past = kurs(9000, new Date('2026-08-16'), 'JORIY');
    const baland = kurs(15_000, new Date('2026-09-16'), 'JORIY');

    expect(limitHolati(qarz, som(6_500_000), past).oshganmi).toBe(false);
    expect(limitHolati(qarz, som(6_500_000), baland).oshganmi).toBe(true);
  });

  it('tizim BLOKLAMAYDI — sotuvchi mustaqil qaror qabul qiladi', () => {
    expect(limitBloklaydimi()).toBe(false);
  });
});

describe('3.10 — qarzga berilsa mijoz majburiy', () => {
  it("to'liq to'langan — mijozsiz sotish mumkin", () => {
    expect(mijozMajburiymi(true)).toBe(false);
  });

  it("qarzga berilyapti — mijoz shart, tizim kimdan undirishni bilishi kerak", () => {
    expect(mijozMajburiymi(false)).toBe(true);
  });
});

// ─── 6.5 · Dublikat ───────────────────────────────────────────────────────

describe('6.5 — dublikat nazorati', () => {
  const mavjudlar: MavjudMijoz[] = [
    { id: 1, ism: 'Aziz Karimov', telefon: '+998 90 123 45 67' },
    { id: 2, ism: 'Dilnoza Yusupova', telefon: '901234568' },
  ];

  it('bir xil telefon — turli yozilishda ham ushlanadi', () => {
    const n = dublikatTekshir('Boshqa Odam', '901234567', mavjudlar);
    expect(n.dublikatmi).toBe(true);
    expect(n.sabab).toBe('TELEFON');
    expect(n.mavjud?.id).toBe(1);
  });

  it('998 prefiksi bilan ham bir xil', () => {
    expect(dublikatTekshir('X', '+998901234567', mavjudlar).sabab).toBe('TELEFON');
    expect(telefonNormalla('+998 90 123 45 67')).toBe('901234567');
  });

  it('bir xil ism — katta-kichik harf va probel farq qilmaydi', () => {
    const n = dublikatTekshir('  aziz   karimov ', '905550000', mavjudlar);
    expect(n.dublikatmi).toBe(true);
    expect(n.sabab).toBe('ISM');
  });

  it('telefon ISM dan ustun tekshiriladi', () => {
    const n = dublikatTekshir('Aziz Karimov', '901234568', mavjudlar);
    expect(n.sabab).toBe('TELEFON');
    expect(n.mavjud?.id).toBe(2);
  });

  it('yangi mijoz — dublikat yo\'q', () => {
    expect(dublikatTekshir('Yangi Odam', '905550000', mavjudlar).dublikatmi).toBe(false);
  });

  it("o'zini tahrirlashda o'zi dublikat hisoblanmaydi", () => {
    expect(dublikatTekshir('Aziz Karimov', '901234567', mavjudlar, 1).dublikatmi).toBe(false);
  });
});

// ─── 6.6 · Holati ─────────────────────────────────────────────────────────

describe('6.6 — mijoz holati', () => {
  const qarzsiz: Qarz = { som: nolSom(), dollar: nolDollar() };

  it("buyurtmasi va to'lovi yo'q — butunlay o'chiriladi (2.1)", () => {
    expect(ochirilsinmi({ qarz: qarzsiz, buyurtmaBormi: false, tolovBormi: false })).toBe(true);
  });

  it('harakati bor — o\'chirilmaydi', () => {
    expect(ochirilsinmi({ qarz: qarzsiz, buyurtmaBormi: true, tolovBormi: false })).toBe(false);
    expect(ochirilsinmi({ qarz: qarzsiz, buyurtmaBormi: false, tolovBormi: true })).toBe(false);
  });

  it('qarzsiz mijozni nofaol qilsa bo\'ladi', () => {
    expect(nofaolQilinsinmi(qarzsiz)).toBe(true);
  });

  it("qarzi bor mijoz nofaol qilinmaydi — qarz g'oyib bo'lmasin", () => {
    expect(nofaolQilinsinmi({ som: som(1_340_000), dollar: nolDollar() })).toBe(false);
    expect(nofaolQilinsinmi({ som: nolSom(), dollar: dollar(50) })).toBe(false);
  });
});

// ─── 6.10 · Umidsiz qarz ──────────────────────────────────────────────────

describe('6.10 — hisobdan chiqarilgan qarz qaytsa', () => {
  it("balansga QO'SHILMAYDI — boshqa kirim bo'ladi", () => {
    expect(qaytganTolovQayerga(true)).toBe('BOSHQA_KIRIM');
  });

  it('oddiy qarz to\'lovi balansga tushadi', () => {
    expect(qaytganTolovQayerga(false)).toBe('BALANSGA');
  });
});

// ─── 6.9 · Qarzni to'lash ─────────────────────────────────────────────────

describe('6.9 — eng eski buyurtmadan yopiladi', () => {
  const buyurtmalar = [
    { id: 3, sana: new Date('2026-03-01'), qoldiq: som(100_000) },
    { id: 1, sana: new Date('2026-01-01'), qoldiq: som(200_000) },
    { id: 2, sana: new Date('2026-02-01'), qoldiq: som(50_000) },
  ];

  it('sana bo\'yicha tartiblanadi', () => {
    expect(yopishNavbati(buyurtmalar).map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it('yopilgan buyurtma navbatda ko\'rinmaydi', () => {
    const bilan = [...buyurtmalar, { id: 4, sana: new Date('2025-01-01'), qoldiq: nolSom() }];
    expect(yopishNavbati(bilan).map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it('bitta operatsiyada bitta valyuta', () => {
    expect(bittaValyutamiTekshir(['SOM', 'SOM'])).toBe(true);
    expect(bittaValyutamiTekshir(['SOM', 'USD'])).toBe(false);
    expect(bittaValyutamiTekshir([])).toBe(true);
  });
});

// ─── 6.11 · Telegram ─────────────────────────────────────────────────────

describe('6.11 — Telegram ID', () => {
  it("ID yo'q mijozga bildirishnoma yuborilmaydi", () => {
    expect(xabarYuborilsinmi(null)).toBe(false);
    expect(xabarYuborilsinmi(123_456)).toBe(true);
  });
});
