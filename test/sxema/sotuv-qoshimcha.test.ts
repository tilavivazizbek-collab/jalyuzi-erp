/**
 * TZ 3.10 · QISM 3 §4.2 — sotuv formasi ikki xil qatorni qabul qiladi.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    2026-09-03 auditi: sotuv ekranida «Qo'shimcha qo'shish» tugmasi
 *    bor edi, lekin savatga qo'shimcha buyum solingan BUTUN buyurtma
 *    saqlanmasdi. Sxema faqat tayyor mahsulotni bilardi:
 *    `mahsulotTurId` majburiy, o'lcham musbat, slotlar kamida bitta.
 *
 *    Sotuvchi «Mahsulot turini tanlang» degan tushunarsiz xatoni
 *    ko'rar va nima qilishni bilmasdi.
 *
 * ⚠️ Shartlar bazadagi cheklovlar bilan bir xil bo'lishi shart —
 *    aks holda forma o'tkazgan narsa bazada yiqiladi.
 */
import { describe, expect, it } from 'vitest';
import { sotuvPozitsiyaSxema } from '@/lib/sxema/sotuv';

/** Tayyor mahsulot qatori — Rollo 120 × 150. */
const tayyor = {
  mahsulotTurId: 7,
  eniSm: 120,
  boyiSm: 150,
  soni: 1,
  narxSnapshot: '678400',
  chegirmaSumma: '0',
  xizmatHaqi: '0',
  formulaSnapshot: { tur: 'Rollo' },
  slotlar: [
    {
      slotId: 10,
      materialId: 100,
      hisoblanganMiqdor: '1.8000',
      tuzatilganMiqdor: null,
      birlik: 'KV_M' as const,
      narxSnapshot: '120000',
    },
  ],
  aksessuarlar: [],
};

/** Qo'shimcha buyum — mexanizm, 2 dona. O'lcham ham, slot ham yo'q. */
const qoshimcha = {
  mahsulotTurId: null,
  qoshimchaMaterialId: 55,
  eniSm: 0,
  boyiSm: 0,
  soni: 2,
  narxSnapshot: '90000',
  chegirmaSumma: '0',
  xizmatHaqi: '0',
  formulaSnapshot: { qoshimcha: true },
  slotlar: [],
  aksessuarlar: [],
};

describe('TZ 3.10 — sotuv pozitsiyasi ikki xil bo\'ladi', () => {
  it('tayyor mahsulot qatori o\'tadi', () => {
    const n = sotuvPozitsiyaSxema.safeParse(tayyor);
    expect(n.success).toBe(true);
    expect(n.data?.qoshimchaMaterialId).toBeNull();
  });

  /** ⚠️ ASOSIY TEKSHIRUV — ilgari aynan shu yiqilardi. */
  it('qo\'shimcha buyum qatori o\'tadi', () => {
    const n = sotuvPozitsiyaSxema.safeParse(qoshimcha);
    expect(n.success).toBe(true);
    expect(n.data?.qoshimchaMaterialId).toBe(55);
    expect(n.data?.mahsulotTurId).toBeNull();
    expect(n.data?.soni).toBe(2);
  });

  it('ikkalasi ham bo\'lsa RAD ETILADI', () => {
    const n = sotuvPozitsiyaSxema.safeParse({
      ...tayyor,
      qoshimchaMaterialId: 55,
    });
    expect(n.success).toBe(false);
  });

  it('ikkalasi ham bo\'sh bo\'lsa RAD ETILADI', () => {
    const n = sotuvPozitsiyaSxema.safeParse({ ...tayyor, mahsulotTurId: null });
    expect(n.success).toBe(false);
  });

  it('tayyor mahsulotda o\'lcham majburiy', () => {
    expect(sotuvPozitsiyaSxema.safeParse({ ...tayyor, eniSm: 0 }).success).toBe(false);
    expect(sotuvPozitsiyaSxema.safeParse({ ...tayyor, boyiSm: 0 }).success).toBe(false);
  });

  it('tayyor mahsulotda kamida bitta slot', () => {
    const n = sotuvPozitsiyaSxema.safeParse({ ...tayyor, slotlar: [] });
    expect(n.success).toBe(false);
  });

  it('qo\'shimcha buyumda o\'lcham bo\'lmaydi (3.10)', () => {
    const n = sotuvPozitsiyaSxema.safeParse({ ...qoshimcha, eniSm: 120, boyiSm: 150 });
    expect(n.success).toBe(false);
  });

  it('qo\'shimcha buyumda mato tanlanmaydi', () => {
    const n = sotuvPozitsiyaSxema.safeParse({
      ...qoshimcha,
      slotlar: tayyor.slotlar,
    });
    expect(n.success).toBe(false);
  });

  it('manfiy o\'lcham hech qachon o\'tmaydi', () => {
    expect(sotuvPozitsiyaSxema.safeParse({ ...tayyor, eniSm: -1 }).success).toBe(false);
    expect(sotuvPozitsiyaSxema.safeParse({ ...qoshimcha, boyiSm: -1 }).success).toBe(false);
  });
});
