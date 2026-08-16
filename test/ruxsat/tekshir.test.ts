/**
 * TZ 14.6 · 20.12 · 10.3 · Q-04 · EC-XOD-10
 */
import { describe, expect, it } from 'vitest';
import {
  ruxsatBormi,
  ruxsatOlibQoyilsinmi,
  ruxsatTekshir,
  saytgaKiraOladimi,
  yigindiQamrov,
  type Foydalanuvchi,
  type Qamrov,
  type Rol,
  type TizimliRol,
} from '@/lib/ruxsat/tekshir';
import {
  KASSA_KODLARI,
  OLIB_QOYILMAYDI,
  RUXSATLAR,
  RUXSAT_KODLARI,
  ruxsatKodmi,
} from '@/lib/ruxsat/kodlar';
import type { RuxsatKod } from '@/lib/ruxsat/kodlar';

// ─── Yordamchilar ─────────────────────────────────────────────────────────

const rol = (
  kod: TizimliRol | null,
  nom: string,
  ruxsatlar: readonly (readonly [RuxsatKod, Qamrov])[],
): Rol => ({ kod, nom, ruxsatlar: new Map(ruxsatlar) });

const xodim = (o: Partial<Foydalanuvchi> & { rollar: readonly Rol[] }): Foydalanuvchi => ({
  xodimId: 1,
  filialId: 10,
  boshFilialda: false,
  ...o,
});

const BOSH_ADMIN = rol('ADMIN', 'Admin', [
  ['sozlama.ozgartir', 'BARCHA'],
  ['kassa.barcha.kor', 'BARCHA'],
  ['kassa.oz.kor', 'BARCHA'],
  ['ombor.qoldiq.kor', 'BARCHA'],
]);

const OMBORCHI = rol('OMBORCHI', 'Omborchi', [
  ['ombor.qoldiq.kor', 'OZ_FILIALI'],
  ['ombor.kirim.yarat', 'OZ_FILIALI'],
]);

const SOTUVCHI = rol('SOTUVCHI', 'Sotuvchi', [
  ['kassa.oz.kor', 'OZ_FILIALI'],
  ['kassa.kirim', 'OZ_FILIALI'],
]);

const USTA = rol('USTA', 'Usta', []);

// ─── 14.6 · standart holat ────────────────────────────────────────────────

describe("14.6 — hech narsa oldindan ochiq emas", () => {
  it("rolsiz xodimda hech qanday ruxsat yo'q", () => {
    const f = xodim({ rollar: [rol(null, "Yangi", [])] });
    for (const kod of RUXSAT_KODLARI) {
      expect(ruxsatBormi(f, kod)).toBe(false);
    }
  });

  it("ruxsat topilmasa RUXSAT_YOQ, jimgina ha demaydi", () => {
    const f = xodim({ rollar: [OMBORCHI] });
    const n = ruxsatTekshir(f, 'ombor.storno');
    expect(n).toEqual({ ruxsat: false, sabab: 'RUXSAT_YOQ' });
  });
});

// ─── 10.3 · ruxsatlar yig'indi ────────────────────────────────────────────

describe("10.3 va EC-XOD-10 — bir nechta rol, ruxsatlar yig'indi", () => {
  it('admin ham, omborchi ham bo\'lgan xodim ikkalasining huquqini oladi', () => {
    const f = xodim({ rollar: [BOSH_ADMIN, OMBORCHI], boshFilialda: true });
    expect(ruxsatBormi(f, 'sozlama.ozgartir')).toBe(true);
    expect(ruxsatBormi(f, 'ombor.kirim.yarat')).toBe(true);
  });

  it('kengroq qamrov yutadi — rol qo\'shish huquqni kamaytirmaydi', () => {
    const tor = rol(null, 'Tor', [['ombor.qoldiq.kor', 'OZ_FILIALI']]);
    const keng = rol(null, 'Keng', [['ombor.qoldiq.kor', 'BARCHA']]);

    expect(yigindiQamrov(xodim({ rollar: [tor, keng] }), 'ombor.qoldiq.kor')).toBe('BARCHA');
    expect(yigindiQamrov(xodim({ rollar: [keng, tor] }), 'ombor.qoldiq.kor')).toBe('BARCHA');
  });

  it("hech bir rolda bo'lmasa null", () => {
    expect(yigindiQamrov(xodim({ rollar: [OMBORCHI] }), 'kassa.storno')).toBe(null);
  });
});

// ─── 20.12 · qamrov ───────────────────────────────────────────────────────

describe('20.12 — filial qamrovi', () => {
  it("o'z filiali: o'zinikiga ha, boshqasiga yo'q", () => {
    const f = xodim({ rollar: [OMBORCHI], filialId: 10 });
    expect(ruxsatBormi(f, 'ombor.qoldiq.kor', { filialId: 10 })).toBe(true);
    expect(ruxsatTekshir(f, 'ombor.qoldiq.kor', { filialId: 20 })).toEqual({
      ruxsat: false,
      sabab: 'OZGA_FILIAL',
    });
  });

  it('barcha filiallar: istalganiga ha', () => {
    const f = xodim({ rollar: [BOSH_ADMIN], boshFilialda: true });
    expect(ruxsatBormi(f, 'ombor.qoldiq.kor', { filialId: 99 })).toBe(true);
  });

  it("nishon ko'rsatilmasa qamrov to'sqinlik qilmaydi", () => {
    const f = xodim({ rollar: [OMBORCHI] });
    expect(ruxsatTekshir(f, 'ombor.qoldiq.kor')).toEqual({
      ruxsat: true,
      qamrov: 'OZ_FILIALI',
    });
  });
});

// ─── Q-04 · qattiq qoidalar ───────────────────────────────────────────────

describe('Q-04 qoida 1 — usta saytga kirmaydi', () => {
  it("faqat usta roli bo'lsa hech narsaga ruxsat yo'q", () => {
    const ustaHam = rol('USTA', 'Usta', [['ombor.qoldiq.kor', 'BARCHA']]);
    const f = xodim({ rollar: [ustaHam] });

    expect(saytgaKiraOladimi(f)).toBe(false);
    expect(ruxsatTekshir(f, 'ombor.qoldiq.kor')).toEqual({
      ruxsat: false,
      sabab: 'USTA_SAYTGA_KIRMAYDI',
    });
  });

  it('matritsa bu qoidani bekor qila olmaydi', () => {
    // Admin ustaga hamma ruxsatni bergan bo'lsa ham
    const hammaRuxsat = rol(
      'USTA',
      'Usta',
      RUXSAT_KODLARI.map((k) => [k, 'BARCHA'] as const),
    );
    const f = xodim({ rollar: [hammaRuxsat] });
    expect(ruxsatBormi(f, 'sozlama.ozgartir')).toBe(false);
  });

  it("usta ayni paytda omborchi ham bo'lsa saytga kiradi (10.3)", () => {
    const f = xodim({ rollar: [USTA, OMBORCHI] });
    expect(saytgaKiraOladimi(f)).toBe(true);
    expect(ruxsatBormi(f, 'ombor.kirim.yarat')).toBe(true);
  });
});

describe("Q-04 qoida 2 — sotuvchi o'zganing kassasini ko'rmaydi", () => {
  it("o'z kassasi ochiq", () => {
    const f = xodim({ rollar: [SOTUVCHI], xodimId: 7 });
    expect(ruxsatBormi(f, 'kassa.oz.kor', { egaXodimId: 7, filialId: 10 })).toBe(true);
  });

  it("boshqa sotuvchining kassasi yopiq", () => {
    const f = xodim({ rollar: [SOTUVCHI], xodimId: 7 });
    expect(ruxsatTekshir(f, 'kassa.oz.kor', { egaXodimId: 8, filialId: 10 })).toEqual({
      ruxsat: false,
      sabab: 'OZGA_KASSA',
    });
  });

  it("`kassa.barcha.kor` ruxsati bo'lsa ochiladi (14.6)", () => {
    const f = xodim({ rollar: [BOSH_ADMIN], xodimId: 7, boshFilialda: true });
    expect(ruxsatBormi(f, 'kassa.oz.kor', { egaXodimId: 8, filialId: 10 })).toBe(true);
  });
});

describe('20.12.1 qoida 4 — boshqa filial kassasi', () => {
  const boshqaFilialKassasi = { filialId: 20, egaXodimId: 1 };

  it("qamrov BARCHA bo'lsa ham oddiy filial xodimiga yopiq", () => {
    const kengSotuvchi = rol('SOTUVCHI', 'Sotuvchi', [['kassa.barcha.kor', 'BARCHA']]);
    const f = xodim({ rollar: [kengSotuvchi], filialId: 10, boshFilialda: false });

    expect(ruxsatTekshir(f, 'kassa.barcha.kor', boshqaFilialKassasi)).toEqual({
      ruxsat: false,
      sabab: 'OZGA_FILIAL_KASSASI',
    });
  });

  it('bosh filial admini uchun ochiq', () => {
    const f = xodim({ rollar: [BOSH_ADMIN], filialId: 10, boshFilialda: true });
    expect(ruxsatBormi(f, 'kassa.barcha.kor', boshqaFilialKassasi)).toBe(true);
  });

  it("bosh filialda bo'lsa-yu admin bo'lmasa — yopiq", () => {
    const kengSotuvchi = rol('SOTUVCHI', 'Sotuvchi', [['kassa.barcha.kor', 'BARCHA']]);
    const f = xodim({ rollar: [kengSotuvchi], filialId: 10, boshFilialda: true });
    expect(ruxsatBormi(f, 'kassa.barcha.kor', boshqaFilialKassasi)).toBe(false);
  });

  it("admin bo'lsa-yu bosh filialda bo'lmasa — yopiq", () => {
    const f = xodim({ rollar: [BOSH_ADMIN], filialId: 10, boshFilialda: false });
    expect(ruxsatBormi(f, 'kassa.barcha.kor', boshqaFilialKassasi)).toBe(false);
  });

  it("bu qoida faqat kassaga tegishli — ombor qamrov bilan boshqariladi", () => {
    const f = xodim({ rollar: [BOSH_ADMIN], filialId: 10, boshFilialda: false });
    expect(ruxsatBormi(f, 'ombor.qoldiq.kor', { filialId: 20 })).toBe(true);
  });
});

describe('14.6 qoida 3 — admin o\'z huquqini olib qo\'ya olmaydi', () => {
  const adminRolId = 1;

  it("o'zi turgan roldan `sozlama.ozgartir` ni yechib bo'lmaydi", () => {
    const f = xodim({ rollar: [BOSH_ADMIN] });
    expect(ruxsatOlibQoyilsinmi(f, adminRolId, OLIB_QOYILMAYDI, [adminRolId])).toBe(false);
  });

  it("boshqa rolida ham shu ruxsat bo'lsa — yechsa bo'ladi, yo'l yopilmaydi", () => {
    const ikkinchi = rol(null, 'Zaxira admin', [['sozlama.ozgartir', 'BARCHA']]);
    const f = xodim({ rollar: [BOSH_ADMIN, ikkinchi] });
    expect(ruxsatOlibQoyilsinmi(f, adminRolId, OLIB_QOYILMAYDI, [adminRolId, 2])).toBe(true);
  });

  it("o'zi turmagan roldan yechsa bo'ladi", () => {
    const f = xodim({ rollar: [BOSH_ADMIN] });
    expect(ruxsatOlibQoyilsinmi(f, 99, OLIB_QOYILMAYDI, [adminRolId])).toBe(true);
  });

  it('boshqa ruxsatlarga bu qoida tegishli emas', () => {
    const f = xodim({ rollar: [BOSH_ADMIN] });
    expect(ruxsatOlibQoyilsinmi(f, adminRolId, 'ombor.storno', [adminRolId])).toBe(true);
  });
});

// ─── Kodlar ro'yxati butunligi ────────────────────────────────────────────

describe("ruxsat kodlari", () => {
  it('har kodda nom, guruh va TZ bandi bor', () => {
    for (const kod of RUXSAT_KODLARI) {
      const t = RUXSATLAR[kod];
      expect(t.nom.length).toBeGreaterThan(0);
      expect(t.band.length).toBeGreaterThan(0);
    }
  });

  it('kod `guruh.amal` ko\'rinishida — 14.6 amal darajasi talabi', () => {
    for (const kod of RUXSAT_KODLARI) {
      expect(kod).toMatch(/^[a-z]+(\.[a-z]+){1,2}$/);
    }
  });

  it('kassa kodlari ajratib olingan', () => {
    expect(KASSA_KODLARI).toContain('kassa.oz.kor');
    expect(KASSA_KODLARI).not.toContain('ombor.storno');
  });

  it("noma'lum kod rad etiladi — bazadan eskirgan kod kelsa", () => {
    expect(ruxsatKodmi('kassa.oz.kor')).toBe(true);
    expect(ruxsatKodmi('ombor.hammasi')).toBe(false);
    expect(ruxsatKodmi('toString')).toBe(false);
  });
});
