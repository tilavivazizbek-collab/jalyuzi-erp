/**
 * TZ 13.4 — botdagi buyurtma oqimi.
 *
 * Oqim konstruktordan quriladi, shuning uchun testlar ham qat'iy
 * mahsulotga bog'lanmaydi: slot soni har turda boshqacha.
 */
import { describe, expect, it } from 'vitest';
import {
  BOSH_QORALAMA,
  aksessuarAlmash,
  bekorQil,
  izohQoy,
  joriySlot,
  keyingiQadam,
  matoTanla,
  olchamQoy,
  orqaga,
  qoralamaOqi,
  savatgaQosh,
  turTanla,
  type Qoralama,
} from '@/lib/domain/bot-oqim';
import { BiznesXato } from '@/lib/xato';

/** Rollo — ikki slot: old mato, orqa mato (13.4 misoli). */
const ROLLO = { id: 1, nom: 'Rollo' };
const ROLLO_SLOTLARI = [
  { id: 10, nom: 'Old mato' },
  { id: 11, nom: 'Orqa mato' },
];

/** Dikke — uch slot (13.4 misoli). */
const DIKKE = { id: 2, nom: 'Dikke' };
const DIKKE_SLOTLARI = [
  { id: 20, nom: 'Oq chet' },
  { id: 21, nom: "Ko'k chet" },
  { id: 22, nom: "Ko'k o'rta" },
];

/** To'liq pozitsiya yig'adi — ko'p testda kerak. */
function toliqRollo(): Qoralama {
  let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
  q = matoTanla(q, 10, 100);
  q = matoTanla(q, 11, 101);
  q = olchamQoy(q, '210', 'ENI');
  q = olchamQoy(q, '140', 'BOYI');
  return izohQoy(q, 'Yotoqxona');
}

// ─── Qadam ketma-ketligi ──────────────────────────────────────────────────

describe('TZ 13.4 — qadam qoralamadan chiqadi', () => {
  it("bo'sh qoralamada tur tanlanadi", () => {
    expect(keyingiQadam(BOSH_QORALAMA)).toBe('TUR_TANLASH');
  });

  it('tur tanlangach har slot uchun mato so‘raladi', () => {
    const q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    expect(keyingiQadam(q)).toBe('SLOT_MATO');
    expect(joriySlot(q)?.nom).toBe('Old mato');
  });

  it('slotlar TARTIB bilan to‘ldiriladi', () => {
    let q = turTanla(BOSH_QORALAMA, DIKKE, DIKKE_SLOTLARI);
    expect(joriySlot(q)?.nom).toBe('Oq chet');

    q = matoTanla(q, 20, 200);
    expect(joriySlot(q)?.nom).toBe("Ko'k chet");

    q = matoTanla(q, 21, 201);
    expect(joriySlot(q)?.nom).toBe("Ko'k o'rta");

    q = matoTanla(q, 22, 202);
    expect(joriySlot(q)).toBeNull();
    expect(keyingiQadam(q)).toBe('ENI');
  });

  it('o‘lchamdan keyin aksessuar, keyin savat', () => {
    let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    q = matoTanla(q, 10, 100);
    q = matoTanla(q, 11, 101);

    expect(keyingiQadam(q)).toBe('ENI');
    q = olchamQoy(q, '210', 'ENI');

    expect(keyingiQadam(q)).toBe('BOYI');
    q = olchamQoy(q, '140', 'BOYI');

    expect(keyingiQadam(q)).toBe('AKSESSUAR');
    q = izohQoy(q, '');

    expect(keyingiQadam(q)).toBe('SAVAT');
  });

  it('turlar orasida slot soni har xil — oqim moslashadi', () => {
    const rollo = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    const dikke = turTanla(BOSH_QORALAMA, DIKKE, DIKKE_SLOTLARI);

    expect(rollo.joriy?.slotlar).toHaveLength(2);
    expect(dikke.joriy?.slotlar).toHaveLength(3);
  });
});

// ─── 3.9 · Savat ──────────────────────────────────────────────────────────

describe('TZ 13.4 · 3.9 — savat', () => {
  it('to‘ldirilgan pozitsiya savatga tushadi', () => {
    const q = savatgaQosh(toliqRollo());

    expect(q.savat).toHaveLength(1);
    expect(q.joriy).toBeNull();
    expect(q.savat[0]?.eniSm).toBe(210);
    expect(q.savat[0]?.boyiSm).toBe(140);
  });

  it('«Yana qo‘shish» — ikkinchi pozitsiya', () => {
    let q = savatgaQosh(toliqRollo());
    expect(keyingiQadam(q)).toBe('SAVAT');

    q = turTanla(q, DIKKE, DIKKE_SLOTLARI);
    q = matoTanla(q, 20, 200);
    q = matoTanla(q, 21, 201);
    q = matoTanla(q, 22, 202);
    q = olchamQoy(q, '180', 'ENI');
    q = olchamQoy(q, '220', 'BOYI');
    q = izohQoy(q, '');
    q = savatgaQosh(q);

    expect(q.savat).toHaveLength(2);
    expect(q.savat[1]?.turNomi).toBe('Dikke');
  });

  it('MATOSIZ pozitsiya savatga tushmaydi', () => {
    let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    q = matoTanla(q, 10, 100);
    // 11-slot bo'sh qoldi
    expect(() => savatgaQosh(q)).toThrow(BiznesXato);
  });

  it("O'LCHAMSIZ pozitsiya savatga tushmaydi", () => {
    let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    q = matoTanla(q, 10, 100);
    q = matoTanla(q, 11, 101);
    expect(() => savatgaQosh(q)).toThrow(BiznesXato);
  });

  it('«Bekor qilish» butun savatni tozalaydi', () => {
    const q = savatgaQosh(toliqRollo());
    expect(q.savat).toHaveLength(1);

    expect(bekorQil()).toEqual(BOSH_QORALAMA);
  });
});

// ─── O'lcham ──────────────────────────────────────────────────────────────

describe("TZ 13.4 — o'lcham tekshiruvi oqimda", () => {
  it("noto'g'ri o'lcham qoralamani BUZMAYDI", () => {
    let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    q = matoTanla(q, 10, 100);
    q = matoTanla(q, 11, 101);

    expect(() => olchamQoy(q, '0', 'ENI')).toThrow(BiznesXato);
    expect(() => olchamQoy(q, 'salom', 'ENI')).toThrow(BiznesXato);

    // Qoralama o'sha holida qoldi — qayta kiritish mumkin
    expect(keyingiQadam(q)).toBe('ENI');
  });
});

// ─── Aksessuar ────────────────────────────────────────────────────────────

describe('TZ 13.4 — ixtiyoriy aksessuarlar', () => {
  it('qo‘shiladi va olib tashlanadi', () => {
    let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    q = aksessuarAlmash(q, 500);
    expect(q.joriy?.aksessuarlar).toEqual([500]);

    q = aksessuarAlmash(q, 501);
    expect(q.joriy?.aksessuarlar).toEqual([500, 501]);

    q = aksessuarAlmash(q, 500);
    expect(q.joriy?.aksessuarlar).toEqual([501]);
  });
});

// ─── «Orqaga» ─────────────────────────────────────────────────────────────

describe('TZ 13.4 — «Orqaga» bir bosqich qaytaradi', () => {
  it('izohdan o‘lchamga', () => {
    const q = orqaga(toliqRollo());
    expect(keyingiQadam(q)).toBe('AKSESSUAR');
  });

  it("bo'yidan eniga, enidan slotga", () => {
    let q = turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI);
    q = matoTanla(q, 10, 100);
    q = matoTanla(q, 11, 101);
    q = olchamQoy(q, '210', 'ENI');
    q = olchamQoy(q, '140', 'BOYI');

    q = orqaga(q);
    expect(keyingiQadam(q)).toBe('BOYI');

    q = orqaga(q);
    expect(keyingiQadam(q)).toBe('ENI');

    q = orqaga(q);
    // Oxirgi to'ldirilgan slot bo'shadi
    expect(keyingiQadam(q)).toBe('SLOT_MATO');
    expect(joriySlot(q)?.nom).toBe('Orqa mato');
  });

  it('boshida turib orqaga bosilsa tur qaytadan tanlanadi', () => {
    const q = orqaga(turTanla(BOSH_QORALAMA, ROLLO, ROLLO_SLOTLARI));
    expect(keyingiQadam(q)).toBe('TUR_TANLASH');
  });

  it('savat SAQLANADI — orqaga faqat joriy pozitsiyaga tegadi', () => {
    let q = savatgaQosh(toliqRollo());
    q = turTanla(q, ROLLO, ROLLO_SLOTLARI);
    q = orqaga(q);

    expect(q.savat).toHaveLength(1);
  });
});

// ─── Sessiyadan tiklash ───────────────────────────────────────────────────

describe('sessiyadan tiklash — buzuq qiymat botni yiqitmaydi', () => {
  it('to‘liq qoralama aynan tiklanadi', () => {
    const asl = savatgaQosh(toliqRollo());
    const tiklangan = qoralamaOqi(JSON.parse(JSON.stringify(asl)));
    expect(tiklangan).toEqual(asl);
  });

  it("noto'g'ri tuzilma bo'sh qoralama beradi", () => {
    expect(qoralamaOqi(null)).toEqual(BOSH_QORALAMA);
    expect(qoralamaOqi('salom')).toEqual(BOSH_QORALAMA);
    expect(qoralamaOqi({})).toEqual(BOSH_QORALAMA);
    expect(qoralamaOqi({ joriy: 'buzuq', savat: 'buzuq' })).toEqual(BOSH_QORALAMA);
  });

  it('eski tuzilmadagi yaroqsiz pozitsiya tashlab yuboriladi', () => {
    const x = qoralamaOqi({
      joriy: null,
      savat: [{ turNomi: 'Eski' }, null, 42],
    });
    expect(x.savat).toHaveLength(0);
  });
});
