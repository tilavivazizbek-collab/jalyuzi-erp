/**
 * Q-04 · TZ 14.6 · 11.10 · 12.14 · 20.12 — boshlang'ich preset
 */
import { describe, expect, it } from 'vitest';
import { ROL_URUGI, urugRoliniOl, urugdanRol } from '@/lib/ruxsat/urug';
import { RUXSAT_KODLARI, ruxsatKodmi } from '@/lib/ruxsat/kodlar';
import { ruxsatBormi, saytgaKiraOladimi, type Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import type { TizimliRol } from '@/lib/ruxsat/tekshir';

const xodimBilan = (kod: TizimliRol, boshFilialda = false): Foydalanuvchi => ({
  xodimId: 1,
  filialId: 10,
  boshFilialda,
  rollar: [urugdanRol(urugRoliniOl(kod))],
});

describe("urug' butunligi", () => {
  it("to'rt tizimli rol bor", () => {
    expect(ROL_URUGI.map((r) => r.kod)).toEqual(['ADMIN', 'SOTUVCHI', 'OMBORCHI', 'USTA']);
  });

  it("urug'dagi har kod ruxsatlar ro'yxatida mavjud", () => {
    for (const rol of ROL_URUGI) {
      for (const [kod] of rol.ruxsatlar) {
        expect(ruxsatKodmi(kod)).toBe(true);
      }
    }
  });

  it("bitta rolda bir kod ikki marta yozilmagan", () => {
    for (const rol of ROL_URUGI) {
      const kodlar = rol.ruxsatlar.map(([k]) => k);
      expect(new Set(kodlar).size).toBe(kodlar.length);
    }
  });

  it("noma'lum rol so'ralsa xato otadi", () => {
    expect(() => urugRoliniOl('YOQ' as TizimliRol)).toThrow();
  });
});

describe('ADMIN — TZ 14.6 «barcha huquq adminda»', () => {
  const admin = xodimBilan('ADMIN', true);

  it('barcha ruxsatga ega', () => {
    for (const kod of RUXSAT_KODLARI) {
      expect(ruxsatBormi(admin, kod)).toBe(true);
    }
  });

  it("qamrovi «barcha filiallar»", () => {
    expect(ruxsatBormi(admin, 'ombor.qoldiq.kor', { filialId: 99 })).toBe(true);
  });
});

describe('SOTUVCHI — TZ 12.14 «faqat o\'z kassasi»', () => {
  const sotuvchi = xodimBilan('SOTUVCHI');

  it("o'z kassasini ko'radi va kirim-chiqim qiladi", () => {
    expect(ruxsatBormi(sotuvchi, 'kassa.oz.kor', { egaXodimId: 1 })).toBe(true);
    expect(ruxsatBormi(sotuvchi, 'kassa.kirim')).toBe(true);
    expect(ruxsatBormi(sotuvchi, 'kassa.chiqim')).toBe(true);
  });

  it('boshqa kassani KO\'RMAYDI', () => {
    expect(ruxsatBormi(sotuvchi, 'kassa.barcha.kor')).toBe(false);
    expect(ruxsatBormi(sotuvchi, 'kassa.oz.kor', { egaXodimId: 2 })).toBe(false);
  });

  it('ayirboshlash va storno yo\'q — 14.6 misolida ☐', () => {
    expect(ruxsatBormi(sotuvchi, 'kassa.ayirboshlash')).toBe(false);
    expect(ruxsatBormi(sotuvchi, 'kassa.storno')).toBe(false);
  });

  it("sotuv ekrani uchun ombor qoldig'ini ko'radi (TZ 3.3)", () => {
    expect(ruxsatBormi(sotuvchi, 'ombor.qoldiq.kor')).toBe(true);
  });

  it('omborga yozmaydi', () => {
    expect(ruxsatBormi(sotuvchi, 'ombor.kirim.yarat')).toBe(false);
    expect(ruxsatBormi(sotuvchi, 'ombor.chiqim')).toBe(false);
    expect(ruxsatBormi(sotuvchi, 'ombor.narx.ozgartir')).toBe(false);
  });

  it('sozlamalarga tegmaydi', () => {
    expect(ruxsatBormi(sotuvchi, 'sozlama.ozgartir')).toBe(false);
    expect(ruxsatBormi(sotuvchi, 'ruxsat.ozgartir')).toBe(false);
  });
});

describe('OMBORCHI — TZ 14.6 va 20.12 misollari', () => {
  const omborchi = xodimBilan('OMBORCHI');

  it("qoldiqni ko'radi va kirim qiladi — 20.12 ☑", () => {
    expect(ruxsatBormi(omborchi, 'ombor.qoldiq.kor')).toBe(true);
    expect(ruxsatBormi(omborchi, 'ombor.kirim.yarat')).toBe(true);
  });

  it("hisobdan chiqara OLMAYDI — 14.6 ning asosiy misoli", () => {
    // «omborchiga kirim qilishga ruxsat berib, hisobdan chiqarishni
    //  taqiqlash kerak bo'lishi mumkin»
    expect(ruxsatBormi(omborchi, 'ombor.chiqim')).toBe(false);
    expect(ruxsatBormi(omborchi, 'ombor.storno')).toBe(false);
    expect(ruxsatBormi(omborchi, 'ombor.narx.ozgartir')).toBe(false);
  });

  it("ko'chirish so'rovi yo'q — 20.12 ☐", () => {
    expect(ruxsatBormi(omborchi, 'ombor.kochirish.yarat')).toBe(false);
  });

  it("faqat o'z filiali", () => {
    expect(ruxsatBormi(omborchi, 'ombor.qoldiq.kor', { filialId: 10 })).toBe(true);
    expect(ruxsatBormi(omborchi, 'ombor.qoldiq.kor', { filialId: 20 })).toBe(false);
  });

  it("kassadan yetkazib beruvchiga to'lov qiladi — 12.14", () => {
    expect(ruxsatBormi(omborchi, 'kassa.oz.kor', { egaXodimId: 1 })).toBe(true);
    expect(ruxsatBormi(omborchi, 'kassa.chiqim')).toBe(true);
  });
});

describe('USTA — TZ 11.10 «hech narsa», 12.14 «ko\'rmaydi»', () => {
  const usta = xodimBilan('USTA');

  it("urug'da bironta ham ruxsat yo'q", () => {
    expect(urugRoliniOl('USTA').ruxsatlar).toEqual([]);
  });

  it('saytga kira olmaydi (Q-04)', () => {
    expect(saytgaKiraOladimi(usta)).toBe(false);
  });

  it('hech qanday amalga ruxsat yo\'q', () => {
    for (const kod of RUXSAT_KODLARI) {
      expect(ruxsatBormi(usta, kod)).toBe(false);
    }
  });
});
