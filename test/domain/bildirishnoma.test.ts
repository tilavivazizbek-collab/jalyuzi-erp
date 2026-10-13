/**
 * TZ 13.9 · 13.5 · 13.6 — bildirishnoma matnlari.
 *
 * Matn sof funksiya bo'lgani uchun to'liq sinaladi: egasi telefonda
 * o'qiydigan gap shu yerda qotadi.
 */
import { describe, expect, it } from 'vitest';
import {
  ADMIN_HODISALARI,
  bandMuddatiMatni,
  bekorMatni,
  kunEslatmaMatni,
  filialliMatn,
  hisobdanChiqarildiMatni,
  kamQoldiqMatni,
  kechikkanBuyurtmalarMatni,
  md,
  qalin,
  oylikYakunMatni,
  kunFarqiMatni,
  pulTopshirildiMatni,
  qabulQilindiMatni,
  qarzEslatmaMatni,
  qaytaKesishSoroviMatni,
  stavkasizIshMatni,
  tasdiqlandiMatni,
  tayyorMatni,
  tugmaliMi,
  ustamaPastMatni,
  yetkazibMuddatMatni,
  yetkazibMuddatlariMatni,
} from '@/lib/domain/bildirishnoma';

// ─── 13.9 · Qaysi xabarda tugma bo'ladi ───────────────────────────────────

describe('TZ 13.9 — botdan FAQAT ikki amal bajariladi', () => {
  it('qayta kesish va pul topshirig‘ida tugma bor', () => {
    expect(tugmaliMi('QAYTA_KESISH_SOROVI')).toBe(true);
    expect(tugmaliMi('PUL_TOPSHIRILDI')).toBe(true);
  });

  it('qolgan hammasi FAQAT XABAR — amal saytda', () => {
    const tugmasizlar = ADMIN_HODISALARI.filter((h) => !tugmaliMi(h));
    expect(tugmasizlar).toEqual([
      'HISOBDAN_CHIQARILDI',
      'KAM_QOLDIQ',
      'USTAMA_PAST',
      'YETKAZIB_MUDDAT',
      'STAVKASIZ_ISH',
      'KUN_FARQI',
      'KECHKI_HISOBOT',
      'KECHIKKAN_BUYURTMA',
      'OYLIK_YAKUN',
      'BAND_MUDDATI',
      'KUN_ESLATMA',
    ]);
  });
});

// ─── 8.17.6 · Takroriy brak ───────────────────────────────────────────────

describe('qayta kesish so‘rovi', () => {
  const asos = {
    buyurtmaRaqami: 'B-2026-000123',
    tartib: 2,
    ustaIsmi: 'Aziz',
    sabab: 'Olcham xato chiqdi',
    nechanchiMarta: 1,
  };

  it('buyurtma, usta va sabab ko‘rinadi', () => {
    const m = qaytaKesishSoroviMatni(asos);
    expect(m).toContain('B-2026-000123');
    expect(m).toContain('Aziz');
    expect(m).toContain('Olcham xato chiqdi');
  });

  it('BIRINCHI marta bo‘lsa qizil ogoh YO‘Q', () => {
    expect(qaytaKesishSoroviMatni(asos)).not.toContain('🔴');
  });

  it('8.17.6 — takroriy brak ALOHIDA ogohlantiradi', () => {
    const m = qaytaKesishSoroviMatni({ ...asos, nechanchiMarta: 3 });
    expect(m).toContain('🔴');
    expect(m).toContain('3-marta');
  });

  it('material ikkinchi marta yechilishi aytiladi', () => {
    expect(qaytaKesishSoroviMatni(asos)).toContain('IKKINCHI marta');
  });
});

// ─── 22.5.2 · Boshqa filialga topshirish ──────────────────────────────────

describe('pul topshirildi', () => {
  it('o‘z filialida ogohlantirish yo‘q', () => {
    const m = pulTopshirildiMatni({
      sotuvchiIsmi: 'Dilshod',
      summa: '4200000.00',
      valyuta: 'SOM',
      begonaFilial: null,
    });
    expect(m).toContain('Dilshod');
    expect(m).not.toContain('qarz');
  });

  it('22.5.2 — boshqa filial bo‘lsa QARZ haqida ogohlantiradi', () => {
    const m = pulTopshirildiMatni({
      sotuvchiIsmi: 'Dilshod',
      summa: '4200000.00',
      valyuta: 'SOM',
      begonaFilial: 'Chilonzor',
    });
    expect(m).toContain('Chilonzor');
    expect(m).toContain('qarz');
  });

  it('12.7 — pul tasdiqlangunicha kassada turishi aytiladi', () => {
    const m = pulTopshirildiMatni({
      sotuvchiIsmi: 'A',
      summa: '1',
      valyuta: 'SOM',
      begonaFilial: null,
    });
    expect(m).toContain('tasdiqlaguningizcha');
  });
});

// ─── 10.12 · Stavkasiz ish ────────────────────────────────────────────────

describe('stavkasiz ish', () => {
  it('haq 0 ekani va qo‘lda qo‘shish kerakligi aytiladi', () => {
    const m = stavkasizIshMatni({
      buyurtmaRaqami: 'B-2026-000200',
      turNomi: 'Dikke',
      ustaIsmi: 'Sardor',
    });
    expect(m).toContain('B-2026-000200');
    expect(m).toContain('Sardor');
    expect(m).toContain('0 hisoblandi');
    expect(m).toContain('10.12');
  });
});

// ─── 9.3 · To'lov muddati ─────────────────────────────────────────────────

describe('yetkazib beruvchi muddati', () => {
  it('kun qolganda oddiy eslatma', () => {
    const m = yetkazibMuddatMatni({ nomi: 'Turk mato', summa: '5 000 000', kunQoldi: 5 });
    expect(m).toContain('5 kun qoldi');
    expect(m).not.toContain('🔴');
  });

  it('bugun oxirgi kun — qizil', () => {
    const m = yetkazibMuddatMatni({ nomi: 'A', summa: '1', kunQoldi: 0 });
    expect(m).toContain('🔴');
    expect(m).toContain('Bugun');
  });

  it('kechikkan bo‘lsa necha kun kechikkani aytiladi', () => {
    const m = yetkazibMuddatMatni({ nomi: 'A', summa: '1', kunQoldi: -12 });
    expect(m).toContain('12 kun KECHIKDI');
  });

  it('kunlik ro‘yxat — eng shoshilinchi birinchi', () => {
    const m = yetkazibMuddatlariMatni([
      { nomi: 'B', hujjat: 'K-2', summa: "1 so'm", kunQoldi: 2 },
      { nomi: 'A_x', hujjat: 'K-1', summa: "2 so'm", kunQoldi: -3 },
    ]);
    expect(m).toContain('— 2 ta hujjat');
    expect(m.indexOf('K-1')).toBeLessThan(m.indexOf('K-2'));
    expect(m).toContain(String.raw`A\_x · K-1: 2 so'm — 🔴 3 kun KECHIKDI`);
  });
});

// ─── 13.9 · Kam qoldiq · 8.16 · Kechikkan buyurtma (kunlik ro'yxat) ───────

describe('kunlik ro‘yxat xabarlari', () => {
  it('kam qoldiq — tavsiya bo‘lsa ko‘rsatiladi; 15 tadan ortig‘i «yana N ta»', () => {
    const qatorlar = Array.from({ length: 17 }, (_, i) => ({
      materialNomi: `Mato ${String(i + 1)}`,
      qoldiq: '3 m',
      tavsiya: i === 0 ? '2 rulon' : null,
    }));
    const m = kamQoldiqMatni(qatorlar);
    expect(m).toContain('BUYURTMA KERAK* — 17 ta material');
    expect(m).toContain('• Mato 1: 3 m → 2 rulon');
    expect(m).toContain('• Mato 2: 3 m\n');
    expect(m).not.toContain('Mato 16');
    expect(m).toContain('… yana 2 ta');
  });

  it('kechikkan buyurtmalar — eng ko‘p kechikkani birinchi', () => {
    const m = kechikkanBuyurtmalarMatni([
      { raqam: 'B-1', mijoz: 'Ali', kun: 2 },
      { raqam: 'B-2', mijoz: 'Vali', kun: 9 },
    ]);
    expect(m).toContain('KECHIKKAN BUYURTMALAR* — 2 ta');
    expect(m.indexOf('B-2')).toBeLessThan(m.indexOf('B-1'));
    expect(m).toContain('• B-2 · Vali — 9 kun');
  });
});

// ─── 12.17 · Kun farqi · 7.8 · Ustama ─────────────────────────────────────

describe('boshqa admin xabarlari', () => {
  it('kun yopishda farq — uch raqam ham ko‘rinadi', () => {
    const m = kunFarqiMatni({
      kassaNomi: 'Naqd som',
      kutilgan: '3 200 000',
      sanalgan: '3 150 000',
      farq: '−50 000',
    });
    expect(m).toContain('3 200 000');
    expect(m).toContain('3 150 000');
    expect(m).toContain('−50 000');
  });

  it('ustama past — bitta kirim, bitta xabar; tur narxi ko‘rsatiladi', () => {
    const m = ustamaPastMatni({
      kirimRaqam: 'K-12',
      qatorlar: [
        { materialNomi: 'Ko‘k to‘r', turNomi: null, ustama: '12.0', chegara: '30' },
        { materialNomi: 'Ko‘k to‘r', turNomi: 'Optom', ustama: '-4.5', chegara: '30' },
      ],
    });
    expect(m).toContain('Kirim K-12');
    expect(m).toContain('• Ko‘k to‘r: 12.0% · eng kami 30%');
    expect(m).toContain('• Ko‘k to‘r (Optom narxi): -4.5% · eng kami 30%');
    expect(m).toContain('7.8');
  });
});

// ─── 13.5 · Narx o'zgarsa mijozga xabar ───────────────────────────────────

describe('TZ 13.5 — mijozga narx xabari', () => {
  it('narx o‘zgarmagan bo‘lsa farq ko‘rsatilmaydi', () => {
    const m = tasdiqlandiMatni({
      raqam: 'B-1',
      yangiNarx: '450000.00',
      eskiNarx: '450000.00',
    });
    expect(m).not.toContain('avval');
  });

  it('eski narx yo‘q bo‘lsa ham yiqilmaydi', () => {
    const m = tasdiqlandiMatni({ raqam: 'B-1', yangiNarx: '450000.00', eskiNarx: null });
    expect(m).toContain('450000.00');
  });

  it('narx TUSHSA — chegirma', () => {
    const m = tasdiqlandiMatni({
      raqam: 'B-1247',
      yangiNarx: '430000.00',
      eskiNarx: '450000.00',
    });
    expect(m).toContain('430000.00');
    expect(m).toContain('avval 450000.00');
    expect(m).toContain('Chegirma: 20000.00');
  });

  it('narx OSHSA — qo‘shimcha', () => {
    const m = tasdiqlandiMatni({
      raqam: 'B-1',
      yangiNarx: '470000.00',
      eskiNarx: '450000.00',
    });
    expect(m).toContain('Qo‘shimcha: 20000.00');
  });
});

describe('TZ 13.6 — mijozga holat xabarlari', () => {
  it('qabul, tayyor, bekor va qarz', () => {
    expect(qabulQilindiMatni('B-1')).toContain('B-1');
    expect(tayyorMatni('B-1')).toContain('tayyor');
    expect(bekorMatni('B-1', 'Mijoz voz kechdi')).toContain('Mijoz voz kechdi');
    expect(qarzEslatmaMatni('1 450 000')).toContain('1 450 000');
  });
});

// ─── Telegram Markdown — foydalanuvchi matni ekranlanadi (2026-10-12) ─────

describe('Markdown ekranlash — «_», «*», «`», «[» xabarni buzmasin', () => {
  it('foydalanuvchi kiritgan matndagi maxsus belgi ekranlanadi, sarlavha — yo‘q', () => {
    const m = hisobdanChiqarildiMatni({
      materialNomi: 'Mato_premium',
      bolakKod: 'B-1',
      sabab: '*yirtiq* [chet]',
      kim: 'Ali`',
      zarar: "120 000 so'm",
    });
    expect(m).toContain('📉 *HISOBDAN CHIQARILDI*');
    // ⚠️ String.raw — «\_» oddiy satrda «_» ga aylanib, test bo'sh o'tardi
    expect(m).toContain(String.raw`Mato\_premium`);
    expect(m).toContain(String.raw`Sabab: \*yirtiq\* \[chet]`);
    expect(m).toContain('Kim: Ali\\`');
  });

  it('qalin — entity ichidagi maxsus belgi olib tashlanadi; bo‘sh qolsa yulduzsiz', () => {
    expect(qalin('Asosiy_mato *yangi*')).toBe('*Asosiymato yangi*');
    expect(qalin('[Rolik]')).toBe('*Rolik*');
    expect(qalin('**')).toBe('');
  });

  it('TZ 20.14.3 — filial nomi faqat bir nechta filial bo‘lsa (ekranlangan)', () => {
    expect(filialliMatn('Sam_arqand', 3, 'X')).toBe(String.raw`🏢 Sam\_arqand` + '\nX');
    expect(filialliMatn('Bosh', 1, 'X')).toBe('X');
  });

  it('mijozga bekor sababi ham ekranlanadi; oddiy matn o‘zgarmaydi', () => {
    expect(bekorMatni('B-1', 'o‘lcham_xato')).toContain(String.raw`Sabab: o‘lcham\_xato`);
    expect(md('Oddiy matn — 1 200 so‘m')).toBe('Oddiy matn — 1 200 so‘m');
  });
});

// ─── TZ 21.8 · Oylik yakun ────────────────────────────────────────────────

describe('oylik yakun xabari', () => {
  it('TZ misoli — bajarilish va rang; reja yo‘q qator; ichki qator suriladi', () => {
    const m = oylikYakunMatni({
      oyNomi: 'Iyul 2026',
      qatorlar: [
        { nom: 'Korxona', reja: '180000000', fakt: '160500000', ichki: false },
        { nom: 'Chilonzor', reja: '100000000', fakt: '87400000', ichki: true },
        { nom: 'Samarqand', reja: '50000000', fakt: '54200000', ichki: true },
        { nom: "Farg'ona", reja: '30000000', fakt: '18900000', ichki: true },
        { nom: 'Yangi_filial', reja: null, fakt: '1000.40', ichki: true },
      ],
    });
    expect(m).toContain('*Iyul 2026 yakuni*');
    expect(m).toContain('Korxona: 160 500 000 / 180 000 000 · 89.2% 🟡');
    expect(m).toContain('   Samarqand: 54 200 000 / 50 000 000 · 108.4% 🟢');
    expect(m).toContain("Farg'ona: 18 900 000 / 30 000 000 · 63.0% 🔴");
    expect(m).toContain(String.raw`Yangi\_filial: 1 000 (reja yo‘q)`);
  });
});

// ─── 7.3 · Band muddati · 12.17 · Kun eslatmasi ───────────────────────────

describe('band muddati va kun eslatmasi', () => {
  it('band muddati — bo‘lak, buyurtma, pozitsiya; qayta band qilish aytiladi', () => {
    const m = bandMuddatiMatni([{ bolakKod: 'R-118', buyurtmaRaqam: 'B-12', tartib: 2 }]);
    expect(m).toContain('1 ta bo‘lak bo‘shatildi');
    expect(m).toContain('• R-118 — B-12 · poz. 2');
    expect(m).toContain('qayta band qiling');
  });

  it('kun eslatmasi — bugungi va oldingi kunlar; faqat oldingi bo‘lsa ham chiqadi', () => {
    const m = kunEslatmaMatni({ bugungi: [{ kassa: 'Naqd_1', yozuvSoni: 7 }], oldingi: 2 });
    expect(m).toContain(String.raw`• Naqd\_1 — 7 ta yozuv`);
    expect(m).toContain('Oldingi kunlardan yopilmagan: 2 ta');
    const f = kunEslatmaMatni({ bugungi: [], oldingi: 1 });
    expect(f).not.toContain('Bugun:');
    expect(f).toContain('Oldingi kunlardan yopilmagan: 1 ta');
  });
});
