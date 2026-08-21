/**
 * TZ 8.2 · 8.3 · 8.4 · 8.6 · 8.7 · 8.8 · 8.12 · 3.13 · 20.5 · Q-12
 *
 * Pozitsiya holatlari — bazasiz.
 */
import { describe, expect, it } from 'vitest';
import {
  bekorQilinadimi,
  boshHolat,
  HOLAT_NOMI,
  kechikdimi,
  navbatdami,
  otishMumkinmi,
  otishniTekshir,
  POZITSIYA_HOLATLARI,
  qaytaribOlinadimi,
  tahrirlanadimi,
  tasdiqKechikdimi,
  tasdiqlanadimi,
  tasdiqdanKeyin,
  tugatilgandan,
  yopiqmi,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { BiznesXato } from '@/lib/xato';

// ─── Q-12 · TZ 8.4 ────────────────────────────────────────────────────────

describe('Q-12 · TZ 8.4 — buyurtma qaysi holatda tug\'iladi', () => {
  it('sayt buyurtmasi DARHOL tasdiqlangan — admin tasdig\'i yo\'q', () => {
    expect(boshHolat('SAYT')).toBe('TASDIQLANGAN');
  });

  it('bot buyurtmasi sotuvchi tasdig\'ini kutadi', () => {
    expect(boshHolat('BOT')).toBe('TASDIQ_KUTMOQDA');
  });

  it('tasdiqlash faqat TASDIQ_KUTMOQDA da mumkin', () => {
    expect(tasdiqlanadimi('TASDIQ_KUTMOQDA')).toBe(true);
    expect(tasdiqlanadimi('TASDIQLANGAN')).toBe(false);
  });
});

// ─── TZ 20.5 · Filiallararo statuslar ─────────────────────────────────────

describe('TZ 20.5 — uch qo\'shimcha status faqat filiallar har xil bo\'lganda', () => {
  it('bir filial ichida — oddiy oqim', () => {
    expect(tasdiqdanKeyin(1, 1)).toBe('TASDIQLANGAN');
    expect(tugatilgandan(1, 1)).toBe('TAYYOR');
  });

  it('filiallar har xil — mahsulot yo\'lga chiqadi', () => {
    expect(tasdiqdanKeyin(1, 2)).toBe('FILIALGA_YUBORILDI');
    expect(tugatilgandan(1, 2)).toBe('TAYYOR_YOLDA');
  });
});

// ─── TZ 8.7 · Tahrirlash ──────────────────────────────────────────────────

describe('TZ 8.7 — «Ishlab chiqarilmoqda» ga o\'tguncha tahrirlanadi', () => {
  it('ish boshlanmagan holatlar tahrirlanadi', () => {
    expect(tahrirlanadimi('TASDIQ_KUTMOQDA')).toBe(true);
    expect(tahrirlanadimi('TASDIQLANGAN')).toBe(true);
    expect(tahrirlanadimi('MATERIALGA_KUTMOQDA')).toBe(true);
    expect(tahrirlanadimi('FILIALGA_YUBORILDI')).toBe(true);
  });

  it('usta materialni ochgan bo\'lishi mumkin — tahrir YO\'Q', () => {
    expect(tahrirlanadimi('ISHLAB_CHIQARILMOQDA')).toBe(false);
    expect(tahrirlanadimi('TAYYOR')).toBe(false);
    expect(tahrirlanadimi('TOPSHIRILDI')).toBe(false);
  });
});

// ─── TZ 8.8 · Bekor qilish ────────────────────────────────────────────────

describe('TZ 8.8 — bekor qilish FAQAT kesishdan oldin', () => {
  it('material tegilmagan — bekor qilinadi', () => {
    expect(bekorQilinadimi('TASDIQLANGAN')).toBe(true);
  });

  it('ish boshlangach tugma o\'chadi', () => {
    expect(bekorQilinadimi('ISHLAB_CHIQARILMOQDA')).toBe(false);
    expect(bekorQilinadimi('TAYYOR')).toBe(false);
  });
});

// ─── TZ 8.5 · 8.6 · Usta ──────────────────────────────────────────────────

describe('TZ 8.5 — usta navbatdan o\'zi oladi', () => {
  it('tasdiqlangan va filialga yuborilgan pozitsiya navbatda', () => {
    expect(navbatdami('TASDIQLANGAN')).toBe(true);
    expect(navbatdami('FILIALGA_YUBORILDI')).toBe(true);
  });

  it('materialga kutayotgan pozitsiya navbatda EMAS (8.12)', () => {
    expect(navbatdami('MATERIALGA_KUTMOQDA')).toBe(false);
  });

  it('allaqachon olingan ish navbatda emas', () => {
    expect(navbatdami('ISHLAB_CHIQARILMOQDA')).toBe(false);
  });
});

describe('TZ 8.6 — admin ishni qaytarib olishi', () => {
  it('faqat «Ishlab chiqarilmoqda» da', () => {
    expect(qaytaribOlinadimi('ISHLAB_CHIQARILMOQDA')).toBe(true);
  });

  it('«Tugatdim» bosilgach mumkin emas — mahsulot tayyor', () => {
    expect(qaytaribOlinadimi('TAYYOR')).toBe(false);
    expect(qaytaribOlinadimi('TAYYOR_YOLDA')).toBe(false);
  });
});

// ─── TZ 8.3 · O'tishlar ───────────────────────────────────────────────────

describe('TZ 8.3 — holat o\'tishlari OQ ro\'yxat', () => {
  it('8.12 — materialga kutish va qaytish', () => {
    expect(otishMumkinmi('TASDIQLANGAN', 'MATERIALGA_KUTMOQDA')).toBe(true);
    expect(otishMumkinmi('MATERIALGA_KUTMOQDA', 'TASDIQLANGAN')).toBe(true);
  });

  it('20.5 — filiallararo to\'liq oqim', () => {
    const oqim: PozitsiyaHolati[] = [
      'TASDIQ_KUTMOQDA',
      'FILIALGA_YUBORILDI',
      'ISHLAB_CHIQARILMOQDA',
      'TAYYOR_YOLDA',
      'YETIB_KELDI',
      'TOPSHIRILDI',
    ];
    for (let i = 0; i + 1 < oqim.length; i += 1) {
      const dan = oqim[i];
      const ga = oqim[i + 1];
      if (dan === undefined || ga === undefined) continue;
      expect(otishMumkinmi(dan, ga)).toBe(true);
    }
  });

  it('8.17 — qayta kesish ishni o\'ZIGA qaytaradi', () => {
    expect(otishMumkinmi('ISHLAB_CHIQARILMOQDA', 'ISHLAB_CHIQARILMOQDA')).toBe(true);
  });

  it('orqaga sakrash TAQIQ — tayyor mahsulot ishlab chiqarishga qaytmaydi', () => {
    expect(otishMumkinmi('TAYYOR', 'ISHLAB_CHIQARILMOQDA')).toBe(false);
    expect(otishMumkinmi('TOPSHIRILDI', 'TAYYOR')).toBe(false);
  });

  it('ish boshlangach bekor qilib bo\'lmaydi (8.8)', () => {
    expect(otishMumkinmi('ISHLAB_CHIQARILMOQDA', 'BEKOR')).toBe(false);
  });

  it('yopiq holatdan hech qayerga yo\'l yo\'q', () => {
    expect(otishMumkinmi('BEKOR', 'TASDIQLANGAN')).toBe(false);
    expect(otishMumkinmi('RAD_ETILGAN', 'TAYYOR')).toBe(false);
    expect(otishMumkinmi('QAYTARILGAN', 'TOPSHIRILDI')).toBe(false);
  });

  it('noto\'g\'ri o\'tish BiznesXato tashlaydi', () => {
    expect(() => {
      otishniTekshir('TAYYOR', 'TASDIQLANGAN');
    }).toThrow(BiznesXato);
  });

  it('to\'g\'ri o\'tish xato tashlamaydi', () => {
    expect(() => {
      otishniTekshir('TAYYOR', 'TOPSHIRILDI');
    }).not.toThrow();
  });
});

// ─── Yopiq holatlar ───────────────────────────────────────────────────────

describe('yopiq holatlar', () => {
  it('to\'rttasi yopiq', () => {
    expect(yopiqmi('TOPSHIRILDI')).toBe(true);
    expect(yopiqmi('QAYTARILGAN')).toBe(true);
    expect(yopiqmi('RAD_ETILGAN')).toBe(true);
    expect(yopiqmi('BEKOR')).toBe(true);
  });

  it('ishlayotgan holatlar yopiq emas', () => {
    expect(yopiqmi('TASDIQLANGAN')).toBe(false);
    expect(yopiqmi('ISHLAB_CHIQARILMOQDA')).toBe(false);
  });
});

// ─── TZ 8.4 · 3.13 · Kechikish ────────────────────────────────────────────

describe('TZ 8.4 — tasdiqlanmagan buyurtma 24 soatdan keyin qizil', () => {
  const t = (soat: number): Date => new Date(2026, 7, 20, soat, 0, 0);

  it('24 soat o\'tsa ogohlantiriladi', () => {
    expect(tasdiqKechikdimi('TASDIQ_KUTMOQDA', t(0), new Date(2026, 7, 21, 0, 0, 0))).toBe(true);
  });

  it('23 soat — hali emas', () => {
    expect(tasdiqKechikdimi('TASDIQ_KUTMOQDA', t(0), t(23))).toBe(false);
  });

  it('tasdiqlangan pozitsiya umuman kechikmaydi', () => {
    expect(tasdiqKechikdimi('TASDIQLANGAN', t(0), new Date(2026, 8, 1))).toBe(false);
  });
});

describe('TZ 3.13 — sanasi yo\'q pozitsiya KECHIKMAYDI', () => {
  it('sana kiritilmagan — kechikish yo\'q', () => {
    expect(kechikdimi('TASDIQLANGAN', null, new Date(2030, 0, 1))).toBe(false);
  });

  it('sana o\'tgan — kechikdi', () => {
    expect(
      kechikdimi('TASDIQLANGAN', new Date(2026, 7, 20), new Date(2026, 7, 25)),
    ).toBe(true);
  });

  it('yopilgan pozitsiya kechikkan hisoblanmaydi', () => {
    expect(
      kechikdimi('TOPSHIRILDI', new Date(2026, 7, 20), new Date(2026, 7, 25)),
    ).toBe(false);
  });

  it('sana hali kelmagan', () => {
    expect(
      kechikdimi('TASDIQLANGAN', new Date(2026, 7, 30), new Date(2026, 7, 25)),
    ).toBe(false);
  });
});

// ─── To'liqlik ────────────────────────────────────────────────────────────

describe('to\'liqlik', () => {
  it('har holatning o\'zbekcha nomi bor', () => {
    for (const h of POZITSIYA_HOLATLARI) {
      expect(HOLAT_NOMI[h].length).toBeGreaterThan(0);
    }
  });

  it('12 ta holat — TZ 8.3 va 20.5 yig\'indisi', () => {
    expect(POZITSIYA_HOLATLARI).toHaveLength(12);
  });
});
