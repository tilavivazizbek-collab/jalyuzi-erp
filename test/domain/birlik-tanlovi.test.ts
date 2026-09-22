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
  ozgarishKiritiladimi,
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

  it('shtanga → SHTANGA (Q-01: chiziqli material metrda sarflanadi)', () => {
    expect(birlikniTop('CHIZIQLI', 'shtanga', 'M')).toBe('SHTANGA');
  });

  it('dona → DONA', () => {
    expect(birlikniTop('DONA', 'dona', 'DONA')).toBe('DONA');
  });

  it('katta-kichik harf va bo\'shliq to\'sqinlik qilmaydi', () => {
    expect(birlikniTop('RULON', '  Rulon ', 'KV_M')).toBe('RULON');
  });

  it("eski, ro'yxatda yo'q birlik — null (ma'lumot o'zgartirilmaydi)", () => {
    expect(birlikniTop('CHIZIQLI', 'palka', 'M')).toBeNull();
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

/**
 * ⚠️ 2026-09-20 — baza ham METRDA. Ilgari bu yerda «ekranda 3,
 *    bazada 300» tekshirilardi; endi o'girish YO'Q va funksiyalar
 *    qiymatni o'zgartirmasdan qaytaradi.
 *
 *    Funksiyalar O'CHIRILMADI: ular — birlik farqi paydo bo'lsa
 *    o'girish tushadigan YAGONA joy. Testlar shuni qo'riqlaydi:
 *    bugun ular ayniyat, ertaga kimdir ×100 qo'shsa, shu yerda
 *    yiqiladi va boshqa hech qayerda yashirinmaydi.
 */
describe("Q-01 — ekranda ham, bazada ham metr", () => {
  it("1 shtanga = 3 metr → koeffitsient 3 (o'girish yo'q)", () => {
    expect(metrniKoeffitsientga('3')).toBe('3');
  });

  it('kasrli uzunlik ham to\'g\'ri o\'giriladi', () => {
    expect(metrniKoeffitsientga('2.5')).toBe('2.5');
  });

  it('koeffitsient 3 → ekranda 3 metr', () => {
    expect(koeffitsientniMetrga('3')).toBe('3');
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
    expect(ozgarishSavoli('SHTANGA')).toBe('Bitta shtanga necha metr material?');
  });
});

describe('ozgarishKiritiladimi — maydon qayerda ko\'rsatiladi', () => {
  it('metrdan farq qiladigan kirim birligida — so\'raladi (SHTANGA, QUTI)', () => {
    expect(ozgarishKiritiladimi('SHTANGA')).toBe(true);
    expect(ozgarishKiritiladimi('QUTI')).toBe(true);
  });

  it('METR da so\'ralmaydi — 1 metr = 100 sm o\'zgarmas, bema\'ni savol', () => {
    expect(ozgarishKiritiladimi('METR')).toBe(false);
  });

  it('rulon, kv.m va dona — so\'ralmaydi (birliklar mos)', () => {
    expect(ozgarishKiritiladimi('RULON')).toBe(false);
    expect(ozgarishKiritiladimi('KV_M')).toBe(false);
    expect(ozgarishKiritiladimi('DONA')).toBe(false);
  });
});

describe("O'girish qachon so'raladi", () => {
  it('rulon, kv.m va dona — o\'girish so\'ralmaydi', () => {
    expect(BIRLIK_TAVSIFI.RULON.ozgarishKerak).toBe(false);
    expect(BIRLIK_TAVSIFI.KV_M.ozgarishKerak).toBe(false);
    expect(BIRLIK_TAVSIFI.DONA.ozgarishKerak).toBe(false);
  });

  /**
   * ⚠️ METR BU RO'YXATDAN CHIQARILDI (2026-09-22).
   *
   *    Testning nomi o'zi sababini aytib turibdi: «kirim va sarflash
   *    HAR XIL». METR da ular bir xil — kirim ham metr, sarflash ham
   *    metr. Ya'ni METR bu yerda boshidan noto'g'ri turgan va o'sha
   *    `true` material formasini «METR bo'lsa koeffitsient 100»
   *    degan shoxchaga olib kelgan edi (santimetr davridan).
   *
   *    Test ko'rsatkichni emas, KUTILGAN XATTI-HARAKATNI tekshirishi
   *    kerak — shuning uchun tuzatildi, o'chirilmadi.
   */
  it('chiziqli materiallarda — so\'raladi (kirim va sarflash har xil)', () => {
    for (const b of ['SHTANGA', 'QUTI'] as const) {
      expect(BIRLIK_TAVSIFI[b].ozgarishKerak).toBe(true);
      expect(BIRLIK_TAVSIFI[b].sarflashBirligi).toBe('M');
    }
  });

  it("METR chiziqli, lekin o'girishsiz — kirim ham sarflash ham metr", () => {
    expect(BIRLIK_TAVSIFI.METR.hisobTuri).toBe('CHIZIQLI');
    expect(BIRLIK_TAVSIFI.METR.sarflashBirligi).toBe('M');
    expect(BIRLIK_TAVSIFI.METR.ozgarishKerak).toBe(false);
  });

  it("faqat rulon o'lchamli — eni va bo'yi bilan keladi (Q-05)", () => {
    const olchamli = OLCHOV_BIRLIKLARI.filter((b) => BIRLIK_TAVSIFI[b].olchamliMi);
    expect(olchamli).toEqual(['RULON']);
  });

  it('chiziqli materialning narxi 1 METR uchun yoziladi (Q-01)', () => {
    expect(BIRLIK_TAVSIFI.SHTANGA.narxBirligi).toBe('metr');
  });
});

/**
 * ⚠️ 2026-09-22 — SANTIMETR DAVRIDAN QOLGAN XATO.
 *
 *    `BIRLIK_TAVSIFI.METR.ozgarishKerak` `true` turgani uchun material
 *    formasi maxsus shoxcha yozgan edi: «METR bo'lsa koeffitsient 100»
 *    (1 metr = 100 sm). Tizim 2026-09-20 dan butunlay metrda, demak
 *    kirim metri = sarflash metri va koeffitsient DOIM 1.
 *
 *    Yangi metr materiali koeffitsient 100 bilan saqlanardi. Keyin
 *    50 m kirim omborga 5000 m bo'lib tushardi va metr tannarxi 100
 *    barobar kamayardi. Hech bir test, `typecheck` yoki `lint` buni
 *    ko'rmagan — shuning uchun test aynan shu yerga yoziladi.
 */
describe('METR — o‘girish umuman yo‘q (2026-09-22)', () => {
  it('kirim birligi ham, sarflash birligi ham metr', () => {
    expect(BIRLIK_TAVSIFI.METR.kirimBirligi).toBe('metr');
    expect(BIRLIK_TAVSIFI.METR.sarflashBirligi).toBe('M');
  });

  it("o'girish KERAK EMAS — ⚠️ bu bayroq `100` xatosining manbayi edi", () => {
    expect(BIRLIK_TAVSIFI.METR.ozgarishKerak).toBe(false);
  });

  it('ekranda savol ham so‘ralmaydi — «1 metr necha metr» bema’ni', () => {
    expect(ozgarishKiritiladimi('METR')).toBe(false);
  });

  it('o‘girish kerak bo‘lgan birliklar — faqat SHTANGA va QUTI', () => {
    const kerak = OLCHOV_BIRLIKLARI.filter((b) => BIRLIK_TAVSIFI[b].ozgarishKerak);
    expect([...kerak].sort()).toEqual(['QUTI', 'SHTANGA']);
  });
});
