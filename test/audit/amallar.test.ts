/**
 * TZ 2.4 · QISM 1 §10 · AUDIT U-08
 */
import { describe, expect, it } from 'vitest';
import {
  AUDIT_AMALLARI,
  AUDIT_AMAL_KODLARI,
  farqniAjrat,
  ozgarishBormi,
  sababMajburiymi,
  yozuvYasa,
} from '@/lib/audit/amallar';

describe('TZ 2.4 — sanalgan amallarning hammasi bor', () => {
  it("2.4 ro'yxatidagi 11 amal qamrab olingan", () => {
    for (const kod of [
      'STORNO',
      'NARX_QOLDA',
      'CHEGIRMA_LIMITIDAN_OSHDI',
      'QARZ_HISOBDAN_CHIQARILDI',
      'OMBORDAN_CHIQARILDI',
      'QOLDA_TUZATISH',
      'RUXSAT_OZGARDI',
      'MAHSULOT_TURI_TAHRIRLANDI',
      'KURS_OZGARDI',
      'MATERIAL_BIRLIGI_OZGARDI',
      'MIJOZ_NOFAOL',
    ] as const) {
      expect(AUDIT_AMAL_KODLARI).toContain(kod);
    }
  });

  it('har amalda nom va TZ bandi bor', () => {
    for (const kod of AUDIT_AMAL_KODLARI) {
      expect(AUDIT_AMALLARI[kod].nom.length).toBeGreaterThan(0);
      expect(AUDIT_AMALLARI[kod].band.length).toBeGreaterThan(0);
    }
  });
});

describe('farqni ajratish — «eski qiymat, yangi qiymat»', () => {
  it("faqat o'zgargan maydonlar qoladi", () => {
    const farq = farqniAjrat(
      { nom: 'Ko\'k mato', narx: '120000', faol: true },
      { nom: 'Ko\'k mato', narx: '135000', faol: true },
    );
    expect(farq.eski).toEqual({ narx: '120000' });
    expect(farq.yangi).toEqual({ narx: '135000' });
  });

  it("yangi qo'shilgan maydon ham ko'rinadi", () => {
    const farq = farqniAjrat({ nom: 'A' }, { nom: 'A', izoh: 'yangi' });
    expect(farq.yangi).toEqual({ izoh: 'yangi' });
    expect(farq.eski).toEqual({ izoh: null });
  });

  it('sanalar qiymati bo\'yicha taqqoslanadi', () => {
    const a = new Date('2026-08-16');
    const b = new Date('2026-08-16');
    expect(ozgarishBormi({ sana: a }, { sana: b })).toBe(false);
    expect(ozgarishBormi({ sana: a }, { sana: new Date('2026-08-17') })).toBe(true);
  });

  it('ichma-ich obyektlar taqqoslanadi', () => {
    expect(ozgarishBormi({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
    expect(ozgarishBormi({ a: { b: 1 } }, { a: { b: 2 } })).toBe(true);
  });

  it("hech narsa o'zgarmagan bo'lsa farq bo'sh", () => {
    expect(ozgarishBormi({ nom: 'A' }, { nom: 'A' })).toBe(false);
  });
});

describe('sabab majburiyligi', () => {
  it('storno, hisobdan chiqarish, korrektsiya — sabab shart', () => {
    expect(sababMajburiymi('STORNO')).toBe(true);
    expect(sababMajburiymi('OMBORDAN_CHIQARILDI')).toBe(true);
    expect(sababMajburiymi('QOLDA_TUZATISH')).toBe(true);
    expect(sababMajburiymi('QARZ_HISOBDAN_CHIQARILDI')).toBe(true);
    expect(sababMajburiymi('MATERIAL_BIRLIGI_OZGARDI')).toBe(true);
  });

  it('kurs va sozlama — sabab shart emas', () => {
    expect(sababMajburiymi('KURS_OZGARDI')).toBe(false);
    expect(sababMajburiymi('SOZLAMA_OZGARDI')).toBe(false);
  });
});

describe('yozuv yasash', () => {
  const asos = { xodimId: 1, filialId: 10, obyektTuri: 'material', obyektId: 5 } as const;

  it("to'liq yozuv tayyorlanadi", () => {
    const n = yozuvYasa({
      ...asos,
      amal: 'KURS_OZGARDI',
      eski: { qiymat: '12650' },
      yangi: { qiymat: '13200' },
      ip: '10.0.0.1',
    });
    expect(n.holat).toBe('YOZILADI');
    if (n.holat !== 'YOZILADI') return;
    expect(n.yozuv.eskiQiymat).toEqual({ qiymat: '12650' });
    expect(n.yozuv.yangiQiymat).toEqual({ qiymat: '13200' });
    expect(n.yozuv.xodimId).toBe(1);
    expect(n.yozuv.ip).toBe('10.0.0.1');
  });

  it('sabab majburiy amalda izohsiz yozuv qaytariladi', () => {
    expect(yozuvYasa({ ...asos, amal: 'STORNO' })).toEqual({
      holat: 'SABAB_KERAK',
      amal: 'STORNO',
    });
    expect(yozuvYasa({ ...asos, amal: 'STORNO', izoh: '   ' }).holat).toBe('SABAB_KERAK');
  });

  it('izoh berilsa yoziladi', () => {
    const n = yozuvYasa({ ...asos, amal: 'STORNO', izoh: 'mijoz qaytardi' });
    expect(n.holat).toBe('YOZILADI');
    if (n.holat !== 'YOZILADI') return;
    expect(n.yozuv.izoh).toBe('mijoz qaytardi');
  });

  it("hech narsa o'zgarmagan bo'lsa jurnal shishmaydi", () => {
    const n = yozuvYasa({
      ...asos,
      amal: 'SOZLAMA_OZGARDI',
      eski: { qiymat: '30' },
      yangi: { qiymat: '30' },
    });
    expect(n).toEqual({ holat: 'OZGARISH_YOQ' });
  });

  it("filial ko'rsatilmasa null bo'ladi — tizim darajasidagi amal", () => {
    const n = yozuvYasa({
      xodimId: 1,
      amal: 'SOZLAMA_OZGARDI',
      obyektTuri: 'sozlama',
      obyektId: 1,
      yangi: { kurs: '13200' },
    });
    expect(n.holat).toBe('YOZILADI');
    if (n.holat !== 'YOZILADI') return;
    expect(n.yozuv.filialId).toBe(null);
    expect(n.yozuv.eskiQiymat).toBe(null);
  });
});
