import { describe, expect, it } from 'vitest';
import { crc32, ustunHarfi, xlsxYasa } from '@/lib/domain/xlsx';

const matn = (b: Uint8Array): string => new TextDecoder().decode(b);

describe('TZ 11.2 — xlsx yozuvchi', () => {
  it('crc32 — standart test qiymati', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('ustun harflari', () => {
    expect([0, 25, 26, 27, 701, 702].map(ustunHarfi)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA']);
  });

  it('zip tuzilishi: ikki varaq, sonlar son, satr XML-xavfsiz', () => {
    const b = xlsxYasa([
      { nom: "Yig'ma", qatorlar: [['Nomi', 'Summa'], ['A & <B>', 1500.5], [null, 0]] },
      { nom: 'Xom ma’lumot', qatorlar: [['x']] },
    ]);
    // Zip imzosi va oxirgi markaziy katalog yozuvi
    expect([b[0], b[1], b[2], b[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const t = matn(b);
    expect(t).toContain('xl/worksheets/sheet2.xml');
    expect(t).toContain('<c r="B2"><v>1500.5</v></c>');
    expect(t).toContain('A &amp; &lt;B&gt;');
    expect(t).toContain(`name="Yig'ma"`);
  });

  it('varaq nomi: taqiqlangan belgi tozalanadi, 31 belgi, takror nom farqlanadi', () => {
    const t = matn(
      xlsxYasa([
        { nom: 'Hisobot [2026/10]', qatorlar: [] },
        { nom: 'Hisobot [2026/10]', qatorlar: [] },
        { nom: 'x'.repeat(40), qatorlar: [] },
      ]),
    );
    expect(t).toContain('name="Hisobot  2026 10"');
    expect(t).toContain('name="Hisobot  2026 10 2"');
    expect(t).toContain(`name="${'x'.repeat(31)}"`);
  });
});
