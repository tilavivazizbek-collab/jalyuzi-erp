import { describe, expect, it } from 'vitest';
import { kechkiHisobotMatni, type KechkiKirimi } from '@/lib/domain/hisobot/kechki';
import { cronKalitiTogrimi } from '@/lib/kirish/cron';

const asos: KechkiKirimi = {
  sana: '2026-10-12',
  buyurtmaSoni: 0,
  buyurtmaSumma: '0',
  mijozdanTushdi: '0',
  yetkazibgaTolandi: '0',
  xarajat: '0',
  kassadaPul: '1500000.00',
  kutilayotganKirim: '0',
  kutilayotganChiqim: '0',
  muddatiOtganQarz: '0',
  pulYetmaydi: null,
  nazorat: [],
  malumotMuammosi: 0,
};

describe('kechki hisobot matni', () => {
  it('tinch kun — nol qatorlar va ogohlantirish yo‘q', () => {
    const m = kechkiHisobotMatni(asos);
    // Filial nomi bu yerda emas — umumiy sarlavhada (filialliMatn)
    expect(m.startsWith('📊 Kun yakuni — 12.10.2026\n')).toBe(true);
    expect(m).toContain('Bugun yangi buyurtma yo‘q');
    expect(m).not.toContain('Mijozlardan');
    expect(m).not.toContain('Keyingi 7 kun');
    expect(m).not.toContain('E’tibor');
    expect(m).not.toContain('Odatdan tashqari');
  });

  it('to‘liq kun — savdo, oqim, kutilayotgan, ogoh va nazorat', () => {
    const m = kechkiHisobotMatni({
      ...asos,
      buyurtmaSoni: 3,
      buyurtmaSumma: '4200000',
      mijozdanTushdi: '2000000',
      kutilayotganChiqim: '900000',
      pulYetmaydi: { sana: '2026-10-25', qoldiq: '-400000.00' },
      muddatiOtganQarz: '300000',
      malumotMuammosi: 2,
      nazorat: [{ nom: 'Kassa yozuvi storno qilindi', soni: 2 }],
    });
    expect(m).toMatch(/Yangi buyurtmalar: 3 ta — 4.200.000 so'm/);
    expect(m).toMatch(/Mijozlardan tushdi: 2.000.000 so'm/);
    expect(m).toMatch(/To‘lashimiz kerak: 900.000 so'm/);
    expect(m).not.toContain('Mijozlardan kutilmoqda');
    expect(m).toMatch(/25\.10 da pul yetmaydi \(.400.000 so'm\)/);
    expect(m).toContain('ma’lumot muammosi: 2 ta');
    expect(m).toContain('• Kassa yozuvi storno qilindi: 2');
  });
});

describe('cron kaliti', () => {
  it('to‘g‘ri kalit o‘tadi, noto‘g‘ri / bo‘sh / yo‘q — yo‘q', () => {
    const k = 'uzun-maxfiy-kalit-12345';
    expect(cronKalitiTogrimi(k, k)).toBe(true);
    expect(cronKalitiTogrimi('uzun-maxfiy-kalit-12346', k)).toBe(false);
    expect(cronKalitiTogrimi('', k)).toBe(false);
    expect(cronKalitiTogrimi(null, k)).toBe(false);
  });
});
