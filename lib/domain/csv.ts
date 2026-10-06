/**
 * lib/domain/csv.ts — CSV matnini qatorlarga ajratish (mijoz importi).
 * Egasi auditi 2026-10-06.
 *
 * ⚠️ YANGI KUTUBXONA YO'Q — Excel saqlagan CSV oddiy: ajratuvchi «;»
 *    (O'zbekiston/Rossiya sozlamasi), «,» yoki TAB; qo'shtirnoq ichida
 *    ajratuvchi va yangi qator bo'lishi mumkin; «""» — bitta qo'shtirnoq.
 *
 * ⚠️ BAZAGA TEGMAYDI.
 */

export type Ajratuvchi = ';' | ',' | '\t';

/** Sarlavha qatoridan ajratuvchini aniqlaydi — eng ko'p uchragani */
export function ajratuvchiniTop(birinchiQator: string): Ajratuvchi {
  const sana = (b: string): number => birinchiQator.split(b).length - 1;
  const nomzodlar: Ajratuvchi[] = [';', '\t', ','];
  return nomzodlar.reduce((eng, b) => (sana(b) > sana(eng) ? b : eng), ';');
}

/** CSV → kataklar jadvali. Bo'sh qatorlar tashlanadi. */
export function csvOqi(matn: string): string[][] {
  const t = matn.replace(/^\uFEFF/, '');
  const birinchi = t.split(/\r?\n/, 1)[0] ?? '';
  const b = ajratuvchiniTop(birinchi);

  const qatorlar: string[][] = [];
  let qator: string[] = [];
  let katak = '';
  let tirnoqda = false;

  for (let i = 0; i < t.length; i++) {
    const c = t.charAt(i);
    if (tirnoqda) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          katak += '"';
          i++;
        } else {
          tirnoqda = false;
        }
      } else {
        katak += c;
      }
    } else if (c === '"' && katak === '') {
      tirnoqda = true;
    } else if (c === b) {
      qator.push(katak);
      katak = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      qator.push(katak);
      qatorlar.push(qator);
      qator = [];
      katak = '';
    } else {
      katak += c;
    }
  }
  if (katak !== '' || qator.length > 0) {
    qator.push(katak);
    qatorlar.push(qator);
  }

  return qatorlar
    .map((q) => q.map((k) => k.trim()))
    .filter((q) => q.some((k) => k !== ''));
}

/** Sarlavhani taqqoslash uchun: kichik harf, apostrof va bo'sh joysiz */
export function sarlavhaKaliti(x: string): string {
  return x
    .toLowerCase()
    .replace(/[‘’ʻʼ`'"]/g, '')
    .replace(/[^a-zа-яё0-9]/g, '');
}

// ─── Yozish — Excel uchun ─────────────────────────────────────────────────

export type CsvKatak = string | number | null;

/** Excel uchun bayt tartibi belgisi — ko'rinmas, shuning uchun escape bilan yozilgan */
const BOM = '\uFEFF';

/** Ajratuvchi, qo'shtirnoq yoki yangi qator bo'lsa — qo'shtirnoqqa olinadi */
function katak(x: CsvKatak): string {
  const s = x === null ? '' : String(x);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * NUMERIC matni → Excel soni: kasr VERGUL bilan («1500000.50» → «1500000,50»).
 * O'zbekiston/Rossiya sozlamali Excel nuqtali sonni MATN deb o'qiydi —
 * ustunni qo'shib bo'lmay qoladi.
 */
export function csvSon(x: string | number | null): string {
  if (x === null) return '';
  return String(x).replace('.', ',');
}

/**
 * Jadval → Excel ochadigan CSV (egasi auditi 2026-10-06).
 *
 * ⚠️ YANGI KUTUBXONA YO'Q:
 *    - boshida BOM — o'zbek/kirill harflari buzilmaydi
 *    - ajratuvchi «;» — O'zbekiston/Rossiya sozlamali Excel shuni kutadi,
 *      «,» bilan hamma narsa bitta ustunga tushardi
 *    - qator oxiri CRLF
 *
 * ⚠️ BITTA JOY — mijozlar va ombor eksporti shu funksiyadan.
 */
export function csvYoz(sarlavha: readonly string[], qatorlar: readonly (readonly CsvKatak[])[]): string {
  const satrlar = [sarlavha, ...qatorlar].map((q) => q.map(katak).join(';'));
  return `${BOM}${satrlar.join('\r\n')}\r\n`;
}

/** Fayl nomidagi sana — Toshkent kuni */
export function csvFaylNomi(nom: string, kun: string): string {
  return `${nom}-${kun}.csv`;
}
