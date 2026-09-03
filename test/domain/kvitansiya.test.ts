/**
 * TZ 8.9 — QISMAN TOPSHIRISH KVITANSIYASI.
 *
 * Chekdan farqi: yopilmagan buyurtmada beriladi, QRsiz, va
 * «kutilmoqda» ro'yxati bor.
 */
import { describe, expect, it } from 'vitest';
import { kvitansiyaYasa, type KvitansiyaKirimi } from '@/lib/domain/kvitansiya';
import type { ChekPozitsiyasi } from '@/lib/domain/chek';

const poz = (o: Partial<ChekPozitsiyasi> = {}): ChekPozitsiyasi => ({
  tartib: 1,
  nom: 'Rollo parda',
  eniSm: 140,
  boyiSm: 160,
  soni: 1,
  narx: '400000',
  chegirma: '0',
  holat: 'TOPSHIRILDI',
  tarkib: [],
  ...o,
});

const kirim = (o: Partial<KvitansiyaKirimi> = {}): KvitansiyaKirimi => ({
  buyurtmaRaqam: 'B-2026-000184',
  sana: new Date(2026, 7, 30, 14, 35),
  chiqarilgan: new Date(2026, 8, 2, 10, 0),
  sotuvchi: 'Malika',
  mijoz: 'Nilufar Sattorova',
  valyuta: 'SOM',
  pozitsiyalar: [poz()],
  tolangan: '0',
  korxonaNom: 'Jalyuzi',
  korxonaManzil: null,
  korxonaTelefon: null,
  ...o,
});

describe('kvitansiyaYasa', () => {
  it('EC-KVT-01: topshirilgan va qolgan pozitsiyalar AJRATILADI', () => {
    const k = kvitansiyaYasa(
      kirim({
        pozitsiyalar: [
          poz({ tartib: 1, holat: 'TOPSHIRILDI' }),
          poz({ tartib: 2, holat: 'ISHLAB_CHIQARILMOQDA' }),
          poz({ tartib: 3, holat: 'TAYYOR' }),
        ],
      }),
    );

    expect(k.topshirilgan.map((q) => q.tartib)).toEqual([1]);
    expect(k.qolgan.map((q) => q.tartib)).toEqual([2, 3]);
    expect(k.toliqTopshirildi).toBe(false);
  });

  it('EC-KVT-02: BEKOR va RAD_ETILGAN hech qaysi ro‘yxatga tushmaydi', () => {
    const k = kvitansiyaYasa(
      kirim({
        pozitsiyalar: [
          poz({ tartib: 1, holat: 'TOPSHIRILDI' }),
          poz({ tartib: 2, holat: 'BEKOR' }),
          poz({ tartib: 3, holat: 'RAD_ETILGAN' }),
        ],
      }),
    );

    expect(k.topshirilgan).toHaveLength(1);
    expect(k.qolgan).toHaveLength(0);
    /** ⚠️ Ular jamiga ham qo'shilmaydi — chek bilan bir xil qoida */
    expect(k.jami).toBe("400 000 so'm");
    /** Bekor qilinganlar qolmagani uchun buyurtma to'liq topshirilgan */
    expect(k.toliqTopshirildi).toBe(true);
  });

  it('EC-KVT-03: QAYTARILGAN «kutilmoqda» ro‘yxatiga tushmaydi', () => {
    const k = kvitansiyaYasa(
      kirim({
        pozitsiyalar: [
          poz({ tartib: 1, holat: 'TOPSHIRILDI' }),
          poz({ tartib: 2, holat: 'QAYTARILGAN' }),
        ],
      }),
    );

    expect(k.qolgan).toHaveLength(0);
    expect(k.toliqTopshirildi).toBe(true);
  });

  it('EC-KVT-04: jami BUTUN buyurtma bo‘yicha, topshirilgan qism emas', () => {
    const k = kvitansiyaYasa(
      kirim({
        pozitsiyalar: [
          poz({ tartib: 1, holat: 'TOPSHIRILDI', narx: '400000' }),
          poz({ tartib: 2, holat: 'TAYYOR', narx: '600000' }),
        ],
        tolangan: '500000',
      }),
    );

    expect(k.jami).toBe("1 000 000 so'm");
    expect(k.tolangan).toBe("500 000 so'm");
    expect(k.qarz).toBe("500 000 so'm");
  });

  it('EC-KVT-05: chegirma jamidan ayiriladi', () => {
    const k = kvitansiyaYasa(
      kirim({ pozitsiyalar: [poz({ narx: '400000', chegirma: '50000' })] }),
    );

    expect(k.jami).toBe("350 000 so'm");
  });

  it('EC-KVT-06: to‘liq to‘langanda qarz qatori UMUMAN yo‘q', () => {
    const k = kvitansiyaYasa(kirim({ tolangan: '400000' }));

    expect(k.qarz).toBeNull();
  });

  it('EC-KVT-07: dollarli buyurtmada hamma summa dollarda (1.3)', () => {
    const k = kvitansiyaYasa(
      kirim({
        valyuta: 'USD',
        pozitsiyalar: [poz({ narx: '16.40' })],
        tolangan: '6.40',
      }),
    );

    expect(k.jami).toBe('$16.40');
    expect(k.qarz).toBe('$10.00');
  });

  it('EC-KVT-08: chiqarilgan sana PARAMETRDAN olinadi, buyurtma sanasidan emas', () => {
    const k = kvitansiyaYasa(kirim());

    expect(k.sanaMatn).not.toBe(k.chiqarilganMatn);
    expect(k.chiqarilganMatn).toContain('02.09.2026');
  });

  it('EC-KVT-09: hech narsa topshirilmagan bo‘lsa ham kvitansiya yasaladi', () => {
    const k = kvitansiyaYasa(
      kirim({ pozitsiyalar: [poz({ holat: 'ISHLAB_CHIQARILMOQDA' })] }),
    );

    expect(k.topshirilgan).toHaveLength(0);
    expect(k.qolgan).toHaveLength(1);
    expect(k.toliqTopshirildi).toBe(false);
  });
});
