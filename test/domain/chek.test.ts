/**
 * TZ 8.9 · 8.13 · 8.14 · 13.7 · 14.3 · 2.3-invariant
 *
 * Sotuv cheki — qaysi qator chiqadi, qaysi biri UMUMAN chiqmaydi.
 */
import { describe, expect, it } from 'vitest';
import {
  chekPuli,
  chekRaqami,
  chekYasa,
  korinadiganValyutalar,
  olchamMatni,
  qarzOldingi,
  qatorYasa,
  qrMatni,
  type ChekKirimi,
  type ChekPozitsiyasi,
} from '@/lib/domain/chek';
import { dollar, som } from '@/lib/domain/pul';

// ─── Yordamchilar ─────────────────────────────────────────────────────────

const poz = (o: Partial<ChekPozitsiyasi> = {}): ChekPozitsiyasi => ({
  tartib: 1,
  nom: 'Rollo parda',
  eniSm: 140,
  boyiSm: 160,
  soni: 1,
  narx: '16.40',
  chegirma: '0',
  holat: 'TOPSHIRILDI',
  tarkib: ['Mato M13-45', 'Karniz', 'Mexanizm'],
  ...o,
});

const kirim = (o: Partial<ChekKirimi> = {}): ChekKirimi => ({
  buyurtmaRaqam: 'B-2026-000184',
  sana: new Date(2026, 7, 30, 14, 35),
  sotuvchi: 'Malika',
  mijoz: 'Nilufar Sattorova',
  valyuta: 'USD',
  pozitsiyalar: [poz()],
  tolangan: '16.40',
  qarzKeyin: { som: '0', dollar: '0' },
  korxonaNom: 'Jalyuzi Servis',
  korxonaManzil: 'Toshkent sh.',
  korxonaTelefon: '+998 90 123 45 67',
  botUsername: 'jalyuzi_bot',
  filialKod: '14',
  ...o,
});

// ─── Chek raqami va QR ────────────────────────────────────────────────────

describe('Chek raqami — filial + sana + chek raqami', () => {
  it('14 + 20260830 + 0184 = 14202608300184', () => {
    expect(chekRaqami('14', new Date(2026, 7, 30), 'B-2026-000184')).toBe('14202608300184');
  });

  it('raqam doim 14 xonali', () => {
    expect(chekRaqami('14', new Date(2026, 0, 5), 'B-2026-000007')).toHaveLength(14);
    expect(chekRaqami('14', new Date(2026, 0, 5), 'B-2026-000007')).toBe('14202601050007');
  });

  it("filial kodi sozlanmagan bo'lsa 00 — chek baribir chiqadi", () => {
    expect(chekRaqami(null, new Date(2026, 7, 30), 'B-2026-000184')).toBe('00202608300184');
  });

  it('QR bot havolasini olib yuradi (13.7)', () => {
    expect(qrMatni('jalyuzi_bot', 'B-2026-000184', '14202608300184')).toBe(
      'https://t.me/jalyuzi_bot?start=B-2026-000184',
    );
  });

  it("bot sozlanmagan bo'lsa QR ichida chek raqami qoladi", () => {
    expect(qrMatni(null, 'B-2026-000184', '14202608300184')).toBe('14202608300184');
  });
});

// ─── Pozitsiya qatori ─────────────────────────────────────────────────────

describe('8.14 — pozitsiya qatori', () => {
  it('composite: narx faqat tur darajasida, tarkib narxsiz', () => {
    const q = qatorYasa(poz(), 'USD');
    expect(q.sarlavha).toBe('Rollo parda 1.40×1.60 m');
    expect(q.narx).toBe('$16.40');
    expect(q.tarkib).toEqual(['Mato M13-45', 'Karniz', 'Mexanizm']);
    /** ⚠️ Tarkibda hech qanday PUL yo'q — material nomida raqam bo'lishi mumkin */
    expect(q.tarkib.join(' ')).not.toMatch(/\$|so'm/);
    expect(q.miqdor).toBeNull();
  });

  it("oddiy pozitsiya (qo'shimcha buyum) — o'lchovsiz bitta qator", () => {
    const q = qatorYasa(
      poz({ nom: 'Karniz', eniSm: 0, boyiSm: 0, narx: '4.00', tarkib: [] }),
      'USD',
    );
    expect(q.sarlavha).toBe('Karniz');
    expect(q.narx).toBe('$4.00');
    expect(q.tarkib).toEqual([]);
  });

  it("soni 1 dan katta bo'lsa dona narxi ko'rsatiladi", () => {
    const q = qatorYasa(
      poz({ nom: 'Jalyuzi', eniSm: 90, boyiSm: 120, soni: 2, narx: '17.00' }),
      'USD',
    );
    expect(q.miqdor).toBe('2 × $8.50');
    expect(q.narx).toBe('$17.00');
  });

  it('qaytarilgan pozitsiya belgilanadi, yashirilmaydi (8.10)', () => {
    expect(qatorYasa(poz({ holat: 'QAYTARILGAN' }), 'USD').izoh).toBe('qaytarildi');
    expect(qatorYasa(poz(), 'USD').izoh).toBeNull();
  });

  it("qo'shimcha buyumda o'lcham matni yo'q", () => {
    expect(olchamMatni(0, 0)).toBeNull();
    expect(olchamMatni(140, 160)).toBe('1.40×1.60 m');
  });
});

// ─── Valyuta — 2.3-invariant ──────────────────────────────────────────────

describe('1.3 · 2.3 — bitta chekda bitta valyuta', () => {
  it('dollarli buyurtmada hamma summa dollarda, kurs yo‘q', () => {
    const c = chekYasa(kirim({ tolangan: '10.00' }));
    for (const q of [c.hisoblangan, c.jami, c.tolangan, c.qarz ?? '']) {
      expect(q).toMatch(/^\$/);
      expect(q).not.toMatch(/so'm/);
    }
  });

  it("so'mli buyurtmada hamma summa so'mda", () => {
    const c = chekYasa(
      kirim({
        valyuta: 'SOM',
        pozitsiyalar: [poz({ narx: '678400', chegirma: '0' })],
        tolangan: '600000',
        qarzKeyin: { som: '78400', dollar: '0' },
      }),
    );
    expect(c.jami).toBe("678 400 so'm");
    expect(c.qarz).toBe("78 400 so'm");
    expect(c.jami).not.toContain('$');
  });

  it('chekPuli valyuta belgisini har summaga qo‘yadi', () => {
    expect(chekPuli(dollar('16.4'))).toBe('$16.40');
    expect(chekPuli(som('678400'))).toBe("678 400 so'm");
  });
});

// ─── 8.13 · Pul bloki ─────────────────────────────────────────────────────

describe('8.13 — hisoblangan · chegirma · jami · to‘langan · qarz', () => {
  it('chegirma jamidan ayiriladi', () => {
    const c = chekYasa(
      kirim({
        pozitsiyalar: [poz({ narx: '20.00', chegirma: '3.60' })],
        tolangan: '16.40',
      }),
    );
    expect(c.hisoblangan).toBe('$20.00');
    expect(c.chegirma).toBe('$3.60');
    expect(c.jami).toBe('$16.40');
    expect(c.qarz).toBeNull();
  });

  it("chegirma yo'q bo'lsa chegirma qatori ham yo'q", () => {
    expect(chekYasa(kirim()).chegirma).toBeNull();
  });

  it("to'liq to'langan bo'lsa «Qarz» qatori UMUMAN chiqmaydi", () => {
    const c = chekYasa(kirim({ tolangan: '16.40' }));
    expect(c.qarz).toBeNull();
  });

  it('qarz qolsa qator chiqadi', () => {
    const c = chekYasa(kirim({ tolangan: '7.47', qarzKeyin: { som: '0', dollar: '8.93' } }));
    expect(c.qarz).toBe('$8.93');
  });

  it('bekor va rad etilgan pozitsiya chekka tushmaydi', () => {
    const c = chekYasa(
      kirim({
        pozitsiyalar: [
          poz({ tartib: 1, narx: '16.40' }),
          poz({ tartib: 2, narx: '100.00', holat: 'BEKOR' }),
          poz({ tartib: 3, narx: '50.00', holat: 'RAD_ETILGAN' }),
        ],
        tolangan: '16.40',
      }),
    );
    expect(c.qatorlar).toHaveLength(1);
    expect(c.hisoblangan).toBe('$16.40');
  });
});

// ─── 6.8 · Oldingi va keyingi qarz ────────────────────────────────────────

describe('6.8 — savdodan oldingi va keyingi qarz', () => {
  /**
   * Vazifadagi misol: oldin $600 va 4 000 000 so'm qarz bor, savdo
   * dollarda va undan $8.93 qarz qoldi → keyin $608.93 va 4 000 000 so'm.
   */
  it("dollarli savdo faqat DOLLAR qarziga qo'shiladi, so'm o'zgarmaydi", () => {
    const keyin = { som: '4000000', dollar: '608.93' };
    const oldin = qarzOldingi(keyin, '8.93', 'USD');
    expect(oldin.dollar).toBe('600.00');
    expect(oldin.som).toBe('4000000');
  });

  it("so'mli savdo faqat SO'M qarziga qo'shiladi, dollar o'zgarmaydi", () => {
    const keyin = { som: '4078400', dollar: '600.00' };
    const oldin = qarzOldingi(keyin, '78400', 'SOM');
    expect(oldin.som).toBe('4000000.00');
    expect(oldin.dollar).toBe('600.00');
  });

  it('faqat bitta valyutada qarz bo‘lsa, ikkinchi qator umuman yo‘q', () => {
    const k = korinadiganValyutalar({ som: '0', dollar: '600' }, { som: '0', dollar: '608.93' });
    expect([...k]).toEqual(['USD']);
  });

  it('ikkala valyutada ham qarz bo‘lsa ikkalasi chiqadi', () => {
    const k = korinadiganValyutalar(
      { som: '4000000', dollar: '600' },
      { som: '4000000', dollar: '608.93' },
    );
    expect([...k].sort()).toEqual(['SOM', 'USD']);
  });

  it('chek ikkala blokni bir xil valyutalarda ko‘rsatadi', () => {
    const c = chekYasa(
      kirim({
        tolangan: '7.47',
        qarzKeyin: { som: '4000000', dollar: '608.93' },
      }),
    );
    expect(c.qarzOldin.map((q) => q.matn)).toEqual(["4 000 000 so'm", '$600.00']);
    expect(c.qarzKeyin.map((q) => q.matn)).toEqual(["4 000 000 so'm", '$608.93']);
  });

  it("qarzsiz mijozda ikkala blok ham bo'sh", () => {
    const c = chekYasa(kirim());
    expect(c.qarzOldin).toEqual([]);
    expect(c.qarzKeyin).toEqual([]);
  });

  it("mijozsiz buyurtmada (3.10) qarz bloklari umuman yo'q", () => {
    const c = chekYasa(kirim({ mijoz: null, qarzKeyin: null }));
    expect(c.qarzOldin).toEqual([]);
    expect(c.qarzKeyin).toEqual([]);
  });
});

// ─── 14.3 · Korxona ma'lumotlari ──────────────────────────────────────────

describe('14.3 — korxona ma‘lumotlari sozlamadan keladi', () => {
  it('sozlanmagan bo‘lsa null qaytadi, o‘ylab topilgan qiymat qo‘yilmaydi', () => {
    const c = chekYasa(kirim({ korxonaNom: null, korxonaManzil: null, korxonaTelefon: null }));
    expect(c.korxonaNom).toBeNull();
    expect(c.korxonaManzil).toBeNull();
    expect(c.korxonaTelefon).toBeNull();
  });

  it('sozlangan qiymat o‘zgartirilmasdan chiqadi', () => {
    const c = chekYasa(kirim());
    expect(c.korxonaNom).toBe('Jalyuzi Servis');
    expect(c.sanaMatn).toBe('30.08.2026 14:35');
  });

  it('«Chek №» ro‘yxatdagi buyurtma raqami bilan bir xil', () => {
    const c = chekYasa(kirim());
    expect(c.chekRaqam).toBe('B-2026-000184');
    /** 14 xonali raqam esa QR ostida turadi */
    expect(c.qrRaqam).toBe('14202608300184');
  });
});
