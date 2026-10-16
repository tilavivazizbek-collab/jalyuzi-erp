/**
 * lib/domain/xlsx.ts — ko'p varaqli Excel (.xlsx) yozuvchi. TZ 11.2. 2026-10-16
 *
 * «Har eksportda IKKITA varaq: Yig'ma va Xom ma'lumot.» CSV bitta varaq —
 * shuning uchun hisobot eksportlari shu bilan yoziladi.
 *
 * ⚠️ YANGI KUTUBXONA YO'Q (csv.ts dagi qaror): .xlsx — oddiy zip ichidagi
 *    bir nechta XML. Zip SIQISHSIZ (STORED) — hisobot fayllari kichik va
 *    siqish algoritmi kerak bo'lmaydi; CRC32 shu yerda.
 * ⚠️ Satrlar «inlineStr» — sharedStrings fayli kerak emas. Sonlar SON bo'lib
 *    yoziladi: Excel'da qo'shib, saralab bo'lsin (matn bo'lsa bo'lmasdi).
 * ⚠️ BAZAGA TEGMAYDI — sof funksiya, test bilan.
 */

export type XlsxKatak = string | number | null;

export interface XlsxVaraq {
  /** Excel cheklovi: 31 belgi, `[]:*?/\` taqiqlangan — tozalanadi */
  readonly nom: string;
  readonly qatorlar: readonly (readonly XlsxKatak[])[];
}

// ─── CRC32 (zip uchun) ────────────────────────────────────────────────────

const CRC_JADVAL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (const x of b) c = (CRC_JADVAL[(c ^ x) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ─── Zip (STORED) ─────────────────────────────────────────────────────────

function zip(fayllar: readonly { nom: string; mazmun: Uint8Array }[]): Uint8Array {
  const kod = new TextEncoder();
  const qismlar: Uint8Array[] = [];
  const markaziy: Uint8Array[] = [];
  let siljish = 0;

  for (const f of fayllar) {
    const nom = kod.encode(f.nom);
    const crc = crc32(f.mazmun);
    const hajm = f.mazmun.length;

    const mahalliy = new DataView(new ArrayBuffer(30));
    mahalliy.setUint32(0, 0x04034b50, true);
    mahalliy.setUint16(4, 20, true); // kerakli versiya
    mahalliy.setUint16(6, 0x0800, true); // UTF-8 nomlar
    mahalliy.setUint16(8, 0, true); // STORED
    mahalliy.setUint16(10, 0, true);
    mahalliy.setUint16(12, 0x21, true); // 1980-01-01
    mahalliy.setUint32(14, crc, true);
    mahalliy.setUint32(18, hajm, true);
    mahalliy.setUint32(22, hajm, true);
    mahalliy.setUint16(26, nom.length, true);
    mahalliy.setUint16(28, 0, true);
    qismlar.push(new Uint8Array(mahalliy.buffer), nom, f.mazmun);

    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true);
    m.setUint16(4, 20, true);
    m.setUint16(6, 20, true);
    m.setUint16(8, 0x0800, true);
    m.setUint16(10, 0, true);
    m.setUint16(12, 0, true);
    m.setUint16(14, 0x21, true);
    m.setUint32(16, crc, true);
    m.setUint32(20, hajm, true);
    m.setUint32(24, hajm, true);
    m.setUint16(28, nom.length, true);
    m.setUint32(42, siljish, true);
    markaziy.push(new Uint8Array(m.buffer), nom);

    siljish += 30 + nom.length + hajm;
  }

  const markaziyHajm = markaziy.reduce((y, x) => y + x.length, 0);
  const oxir = new DataView(new ArrayBuffer(22));
  oxir.setUint32(0, 0x06054b50, true);
  oxir.setUint16(8, fayllar.length, true);
  oxir.setUint16(10, fayllar.length, true);
  oxir.setUint32(12, markaziyHajm, true);
  oxir.setUint32(16, siljish, true);

  const hammasi = [...qismlar, ...markaziy, new Uint8Array(oxir.buffer)];
  const natija = new Uint8Array(hammasi.reduce((y, x) => y + x.length, 0));
  let i = 0;
  for (const x of hammasi) {
    natija.set(x, i);
    i += x.length;
  }
  return natija;
}

// ─── XML ──────────────────────────────────────────────────────────────────

/** XML maxsus belgilari va Excel qabul qilmaydigan boshqaruv belgilari */
function xml(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0 → A, 25 → Z, 26 → AA */
export function ustunHarfi(i: number): string {
  let n = i + 1;
  let s = '';
  while (n > 0) {
    const q = (n - 1) % 26;
    s = String.fromCharCode(65 + q) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function varaqNomi(nom: string, band: Set<string>): string {
  let n = nom.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Varaq';
  let i = 2;
  while (band.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${String(i++)}`;
  band.add(n.toLowerCase());
  return n;
}

function varaqXml(qatorlar: readonly (readonly XlsxKatak[])[]): string {
  const q = qatorlar
    .map((qator, r) => {
      const kataklar = qator
        .map((k, c) => {
          if (k === null || k === '') return '';
          const ref = `${ustunHarfi(c)}${String(r + 1)}`;
          if (typeof k === 'number') {
            return Number.isFinite(k) ? `<c r="${ref}"><v>${String(k)}</v></c>` : '';
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(k)}</t></is></c>`;
        })
        .join('');
      return `<row r="${String(r + 1)}">${kataklar}</row>`;
    })
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${q}</sheetData></worksheet>`
  );
}

export function xlsxYasa(varaqlar: readonly XlsxVaraq[]): Uint8Array {
  if (varaqlar.length === 0) throw new Error('xlsx: kamida bitta varaq kerak');
  const kod = new TextEncoder();
  const band = new Set<string>();
  const nomlar = varaqlar.map((v) => varaqNomi(v.nom, band));

  const fayl = (nom: string, matn: string) => ({ nom, mazmun: kod.encode(matn) });
  return zip([
    fayl(
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        varaqlar
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${String(i + 1)}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join('') +
        '</Types>',
    ),
    fayl(
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    fayl(
      'xl/workbook.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets>' +
        nomlar.map((n, i) => `<sheet name="${xml(n)}" sheetId="${String(i + 1)}" r:id="rId${String(i + 1)}"/>`).join('') +
        '</sheets></workbook>',
    ),
    fayl(
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        varaqlar
          .map(
            (_, i) =>
              `<Relationship Id="rId${String(i + 1)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${String(i + 1)}.xml"/>`,
          )
          .join('') +
        '</Relationships>',
    ),
    ...varaqlar.map((v, i) => fayl(`xl/worksheets/sheet${String(i + 1)}.xml`, varaqXml(v.qatorlar))),
  ]);
}

/**
 * TZ 11.2 — «Eksportda hisobot nomi, davri, filtrlari va yaratilgan
 * sana-vaqt sarlavhada ko'rsatiladi.» Yig'ma varaq boshiga qo'yiladi,
 * keyin bitta bo'sh qator.
 */
export function hisobotSarlavhasi(s: {
  readonly nom: string;
  readonly davr: string;
  readonly filial: string;
  readonly filtr?: string;
  readonly yaratildi: string;
}): XlsxKatak[][] {
  return [
    [s.nom],
    ['Davr', s.davr],
    ['Filial', s.filial],
    ...(s.filtr === undefined || s.filtr === '' ? [] : [['Filtr', s.filtr]]),
    ['Yaratildi', s.yaratildi],
    [],
  ];
}

/**
 * Bazadan kelgan pul/son matni → Excel SONI (qo'shib, saralab bo'lsin).
 * ⚠️ Faqat KO'RSATISH uchun: hisob-kitob Decimal'da qilingan, bu yerda
 *    natija yoziladi. 14 tadan ortiq raqamli pul bo'lmaydi.
 */
export function xlsxSon(x: string | number | null | undefined): number | null {
  if (x === null || x === undefined || x === '') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
