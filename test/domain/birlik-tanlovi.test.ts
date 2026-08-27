/**
 * TZ 5.2 · 5.3 · Q-01 — o'lchov birligi tanlovi.
 *
 * ⚠️ Bu testlar bitta narsani qo'riqlaydi: ekrandagi BITTA tanlov
 *    bazadagi UCHTA ustunni to'g'ri to'ldirishi. Xato uchlik
 *    (rulon + dona + SM) hech qachon yaratilmasligi kerak —
 *    bunday material buyurtmada hech qachon to'g'ri yechilmasdi.
 */
import { describe, expect, it } from 'vitest';
import {
  BIRLIK_TAVSIFI,
  OLCHOV_BIRLIKLARI,
  birlikTavsifi,
  birlikniTop,
  koeffitsientniMetrga,
  metrniKoeffitsientga,
  ozgarishSavoli,
} from '@/lib/domain/birlik-tanlovi';
import { HISOB_TURLARI, SARFLASH_BIRLIKLARI } from '@/lib/sxema/material';
import { BiznesXato } from '@/lib/xato';

describe('BIRLIK_TAVSIFI — bazadagi CHECK bilan mos', () => {
  it('har tavsifning hisob turi bazada ruxsat etilgan', () => {
    for (const b of OLCHOV_BIRLIKLARI) {
      expect(HISOB_TURLARI).toContain(BIRLIK_TAVSIFI[b].hisobTuri);
    }
  });

  it('har tavsifning sarflash birligi bazada ruxsat etilgan', () => {
    for (const b of OLCHOV_BIRLIKLARI) {
      expect(SARFLASH_BIRLIKLARI).toContain(BIRLIK_TAVSIFI[b].sarflashBirligi);
    }
  });

  it("ikki xil tanlov bir xil uchlikni bermaydi — aks holda birlikniTop chalkashardi", () => {
    const uchliklar = OLCHOV_BIRLIKLARI.map((b) => {
      const t = BIRLIK_TAVSIFI[b];
      return `${t.hisobTuri}|${t.kirimBirligi}|${t.sarflashBirligi}`;
    });
    expect(new Set(uchliklar).size).toBe(uchliklar.length);
  });
});

describe('birlikniTop — bazadagi uchlikdan ekran tanlovi', () => {
  it('rulon → RULON', () => {
    expect(birlikniTop('RULON', 'rulon', 'KV_M')).toBe('RULON');
  });

  it('shtanga → SHTANGA (Q-01: chiziqli material smda sarflanadi)', () => {
    expect(birlikniTop('CHIZIQLI', 'shtanga', 'SM')).toBe('SHTANGA');
  });

  it('dona → DONA', () => {
    expect(birlikniTop('DONA', 'dona', 'DONA')).toBe('DONA');
  });

  it('katta-kichik harf va bo\'shliq to\'sqinlik qilmaydi', () => {
    expect(birlikniTop('RULON', '  Rulon ', 'KV_M')).toBe('RULON');
  });

  it("eski, ro'yxatda yo'q birlik — null (ma'lumot o'zgartirilmaydi)", () => {
    expect(birlikniTop('CHIZIQLI', 'palka', 'SM')).toBeNull();
  });

  it('uchlik yarim mos kelsa ham null — jimgina taxmin qilinmaydi', () => {
    // kirim birligi rulon, lekin sarflash DONA — bunday tanlov yo'q
    expect(birlikniTop('RULON', 'rulon', 'DONA')).toBeNull();
  });

  it('har tavsif o\'z tanloviga qaytadi', () => {
    for (const b of OLCHOV_BIRLIKLARI) {
      const t = BIRLIK_TAVSIFI[b];
      expect(birlikniTop(t.hisobTuri, t.kirimBirligi, t.sarflashBirligi)).toBe(b);
    }
  });
});

describe('birlikTavsifi', () => {
  it("noma'lum birlik rad etiladi", () => {
    expect(() => birlikTavsifi('BOBINA')).toThrow(BiznesXato);
  });
});

describe("Q-01 — ekranda metr, bazada santimetr", () => {
  it('1 shtanga = 3 metr → koeffitsient 300', () => {
    expect(metrniKoeffitsientga('3')).toBe('300');
  });

  it('kasrli uzunlik ham to\'g\'ri o\'giriladi', () => {
    expect(metrniKoeffitsientga('2.5')).toBe('250');
  });

  it('koeffitsient 300 → ekranda 3 metr', () => {
    expect(koeffitsientniMetrga('300')).toBe('3');
  });

  it("borib-kelish qiymatni buzmaydi", () => {
    for (const metr of ['1', '3', '2.5', '0.5']) {
      expect(koeffitsientniMetrga(metrniKoeffitsientga(metr))).toBe(metr);
    }
  });

  it('nol yoki manfiy rad etiladi — u bo\'luvchi, hisobni buzardi', () => {
    expect(() => metrniKoeffitsientga('0')).toThrow(BiznesXato);
    expect(() => metrniKoeffitsientga('-2')).toThrow(BiznesXato);
    expect(() => metrniKoeffitsientga('abc')).toThrow(BiznesXato);
  });

  it("bo'sh koeffitsient ekranda bo'sh ko'rinadi, yiqilmaydi", () => {
    expect(koeffitsientniMetrga('')).toBe('');
    expect(koeffitsientniMetrga('0')).toBe('');
  });
});

describe('ozgarishSavoli — ekrandagi savol', () => {
  it("«koeffitsient» so'zi ishlatilmaydi", () => {
    for (const b of OLCHOV_BIRLIKLARI) {
      expect(ozgarishSavoli(b).toLowerCase()).not.toContain('koeffitsient');
    }
  });

  it('savol kirim birligi nomi bilan tuziladi', () => {
    expect(ozgarishSavoli('SHTANGA')).toBe('1 shtanga necha metr');
  });
});

describe("O'girish qachon so'raladi", () => {
  it('rulon, kv.m va dona — o\'girish so\'ralmaydi', () => {
    expect(BIRLIK_TAVSIFI.RULON.ozgarishKerak).toBe(false);
    expect(BIRLIK_TAVSIFI.KV_M.ozgarishKerak).toBe(false);
    expect(BIRLIK_TAVSIFI.DONA.ozgarishKerak).toBe(false);
  });

  it('chiziqli materiallarda — so\'raladi (kirim va sarflash har xil)', () => {
    for (const b of ['METR', 'SHTANGA', 'QUTI'] as const) {
      expect(BIRLIK_TAVSIFI[b].ozgarishKerak).toBe(true);
      expect(BIRLIK_TAVSIFI[b].sarflashBirligi).toBe('SM');
    }
  });

  it("faqat rulon o'lchamli — eni va bo'yi bilan keladi (Q-05)", () => {
    const olchamli = OLCHOV_BIRLIKLARI.filter((b) => BIRLIK_TAVSIFI[b].olchamliMi);
    expect(olchamli).toEqual(['RULON']);
  });

  it('chiziqli materialning narxi 1 METR uchun yoziladi (Q-01)', () => {
    expect(BIRLIK_TAVSIFI.SHTANGA.narxBirligi).toBe('metr');
  });
});
