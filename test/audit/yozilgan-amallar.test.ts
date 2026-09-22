/**
 * AUDIT KODLARI TA'RIFLANGAN BO'LISHI SHART — 2026-09-22
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    `lib/audit/amallar.ts` amallar ro'yxatini ta'riflaydi, lekin
 *    uni HECH KIM O'QIMAYDI: har `INSERT INTO audit_jurnal` da
 *    kod oddiy matn bo'lib yoziladi. Natijada ikki tomonlama
 *    ajralish yuzaga kelgan edi:
 *
 *      · ta'riflangan, lekin hech qachon yozilmagan kodlar
 *        (`KURS_OZGARDI`, `MIJOZ_NOFAOL`, `PAROL_OZGARTIRILDI`,
 *         `RUXSAT_OZGARDI`) — nazorat doim NOL ko'rsatardi
 *
 *      · yozilgan, lekin ta'riflanmagan kodlar (`KURS`,
 *        `RULON_OCHILDI`, `KUN_YOPILDI`) — ro'yxat to'liq emas
 *
 *    Eng yomoni: kodda oddiy matn terish xatosi («NARX_QODLA»)
 *    hech qanday xato bermasdi. Yozuv bazaga tushardi, hisobot
 *    esa uni topolmasdi va egasi «bunday holat bo'lmagan» degan
 *    XATO xulosa chiqarardi.
 *
 * ⚠️ NEGA MANBANI SKANERLAYDI, `CHECK` QO'YMAYDI
 *
 *    Bazada `CHECK` bo'lsa, terish xatosi ISHLAB CHIQARISHDA
 *    otardi — sotuv o'rtasida, mijoz oldida. Test esa xatoni
 *    kommitdan oldin ushlaydi va hech kimga zarar yetmaydi.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUDIT_AMAL_KODLARI } from '@/lib/audit/amallar';

const ILDIZ = fileURLToPath(new URL('../..', import.meta.url));

function fayllar(katalog: string): string[] {
  const yigindi: string[] = [];
  const yur = (d: string): void => {
    for (const e of readdirSync(d)) {
      if (['node_modules', '.next', '.git', 'coverage'].includes(e)) continue;
      const p = join(d, e);
      if (statSync(p).isDirectory()) yur(p);
      else if (p.endsWith('.ts') || p.endsWith('.tsx')) yigindi.push(p);
    }
  };
  yur(join(ILDIZ, katalog));
  return yigindi;
}

/**
 * Qavs va `${...}` ichini HISOBGA OLIB vergul bo'yicha bo'ladi.
 *
 * ⚠️ Oddiy `split(',')` yaramaydi: `${tx.json({ a: 1, b: 2 })}`
 *    ichidagi vergul argumentni ikkiga bo'lib yuborardi va
 *    ustun tartibi surilardi.
 */
function argumentlar(matn: string): string[] {
  const natija: string[] = [];
  let joriy = '';
  let chuqurlik = 0;
  let tirnoq: string | null = null;

  for (let i = 0; i < matn.length; i += 1) {
    const ch = matn[i] ?? '';

    if (tirnoq !== null) {
      joriy += ch;
      if (ch === tirnoq && matn[i - 1] !== '\\') tirnoq = null;
      continue;
    }

    if (ch === "'" || ch === '"') {
      tirnoq = ch;
      joriy += ch;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') chuqurlik += 1;
    if (ch === ')' || ch === '}' || ch === ']') {
      if (chuqurlik === 0) break;
      chuqurlik -= 1;
    }

    if (ch === ',' && chuqurlik === 0) {
      natija.push(joriy.trim());
      joriy = '';
      continue;
    }

    joriy += ch;
  }

  if (joriy.trim() !== '') natija.push(joriy.trim());
  return natija;
}

interface Topilma {
  readonly fayl: string;
  readonly kod: string;
}

/** Har `INSERT INTO audit_jurnal` dan `amal` ustunidagi matnni oladi. */
function yozilganKodlar(): Topilma[] {
  const topilgan: Topilma[] = [];

  for (const katalog of ['app', 'lib', 'bot']) {
    for (const f of fayllar(katalog)) {
      const matn = readFileSync(f, 'utf8');

      for (const m of matn.matchAll(/INSERT INTO audit_jurnal\s*\(([^)]*)\)/g)) {
        const ustunlar = (m[1] ?? '').split(',').map((x) => x.trim());
        const oring = ustunlar.indexOf('amal');
        if (oring === -1) continue;

        const qolgan = matn.slice((m.index ?? 0) + m[0].length);

        /**
         * `VALUES (` yoki `SELECT ` — ikkala shakl ham ishlatiladi.
         *
         * ⚠️ Orasida SQL izohi turishi mumkin va u o'tkazib
         *    yuboriladi: `kurs-belgila.ts` da aynan shunday va
         *    izohni hisobga olmagan skaner o'sha yozuvni
         *    KO'RMAGAN edi.
         */
        const oldin = /^(?:\s|\/\*[\s\S]*?\*\/)*/.exec(qolgan)?.[0].length ?? 0;
        const tana = qolgan.slice(oldin);

        const v = /^VALUES\s*\(/.exec(tana);
        const sel = /^SELECT\s+/.exec(tana);
        if (v === null && sel === null) continue;

        const boshi = (v ?? sel)?.[0].length ?? 0;
        const args = argumentlar(tana.slice(boshi));
        const arg = args[oring];
        if (arg === undefined) continue;

        /**
         * ⚠️ ARGUMENT ICHIDAGI HAMMA MATN olinadi, chunki kod
         *    shart bilan ham yozilishi mumkin:
         *
         *      ${birlikOzgardi ? 'MATERIAL_BIRLIGI_OZGARDI' : 'QOLDA_TUZATISH'}
         *
         *    Faqat butun argument matn bo'lganini talab qilgan
         *    skaner bu ikkalasini ham ko'rmagan edi.
         */
        for (const t of arg.matchAll(/'([A-Z][A-Z_]*)'/g)) {
          if (t[1] !== undefined) {
            topilgan.push({ fayl: f.slice(ILDIZ.length), kod: t[1] });
          }
        }
      }
    }
  }

  return topilgan;
}

describe('audit jurnaliga yoziladigan har kod ro‘yxatda bor', () => {
  const topilgan = yozilganKodlar();

  it('skaner ishlayapti — bir nechta yozuv topildi', () => {
    /**
     * ⚠️ Skaner buzilib hech narsa topmasa, test JIMGINA o'tib
     *    ketardi va himoya yo'qolardi. Shuning uchun topilma
     *    soni ham tekshiriladi.
     */
    expect(topilgan.length).toBeGreaterThan(10);
  });

  it('⚠️ ta’riflanmagan kod YO‘Q — terish xatosi shu yerda ushlanadi', () => {
    const notanish = topilgan
      .filter((t) => !AUDIT_AMAL_KODLARI.includes(t.kod as never))
      .map((t) => `${t.kod}  (${t.fayl})`);

    expect(notanish).toEqual([]);
  });

  /**
   * ⚠️ TESKARI YO'NALISH — ta'riflangan kod YOZILISHI ham shart.
   *
   *    Aynan shu tomon buzilgan edi: `KURS_OZGARDI`, `MIJOZ_NOFAOL`,
   *    `RUXSAT_OZGARDI`, `PAROL_OZGARTIRILDI`,
   *    `QARZ_HISOBDAN_CHIQARILDI` va `CHEGARADAN_OSHDI` ro'yxatda
   *    turardi, lekin HECH QAYERDA yozilmasdi. Hisobot ularni
   *    sanardi va har doim NOL chiqarardi — egasi esa «bunday
   *    holat bo'lmagan» degan xato xulosa chiqarardi.
   *
   *    Nol ko'rsatadigan nazorat — nazorat emas, yolg'on tinchlik.
   */
  it('⚠️ ta’riflangan har kod amalda YOZILADI — nol ko‘rsatadigan nazorat bo‘lmasin', () => {
    const yozilgan = new Set(topilgan.map((t) => t.kod));
    const olik = AUDIT_AMAL_KODLARI.filter((k) => !yozilgan.has(k));

    expect(olik).toEqual([]);
  });
});
