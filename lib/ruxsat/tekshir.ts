/**
 * lib/ruxsat/tekshir.ts — TZ 14.6 · 20.12 · 10.3 · Q-04
 *
 * Ruxsat tekshiruvining YAGONA joyi. Sayt, bot va API shu funksiyani chaqiradi.
 *
 * Uch qatlam, shu tartibda:
 *   1. Qattiq qoidalar — kodda, matritsa ularni bekor qila olmaydi (Q-04, 20.12.1)
 *   2. Ruxsat bormi — barcha rollarning YIG'INDISI (10.3, 14.6)
 *   3. Qamrov — o'z filiali yoki barchasi (20.12)
 *
 * Bu fayl bazaga tegmaydi (QISM 1 §5.1): foydalanuvchi ma'lumoti parametr
 * bo'lib keladi, shuning uchun testi ham, boti ham bir xil yo'ldan yuradi.
 */

import { KASSA_KODLARI, OLIB_QOYILMAYDI, type RuxsatKod } from './kodlar';

/** TZ 20.12 — har ruxsatning filial qamrovi */
export type Qamrov = 'OZ_FILIALI' | 'BARCHA';

/** Tizimli rol kodlari — QARORLAR-KOD P-08 */
export type TizimliRol = 'ADMIN' | 'SOTUVCHI' | 'OMBORCHI' | 'USTA';

export interface Rol {
  readonly kod: TizimliRol | null;
  readonly nom: string;
  /** Shu rol beradigan ruxsatlar va ularning qamrovi */
  readonly ruxsatlar: ReadonlyMap<RuxsatKod, Qamrov>;
}

export interface Foydalanuvchi {
  readonly xodimId: number;
  readonly filialId: number;
  /** TZ 20.2.2 — bosh filial. 20.12.1 dagi kassa istisnosi shunga bog'liq */
  readonly boshFilialda: boolean;
  /** TZ 10.3 — bir nechta rol bo'lishi mumkin */
  readonly rollar: readonly Rol[];
}

/** Nimaga murojaat qilinayotgani. Bo'sh bo'lsa — filialga bog'liq bo'lmagan amal. */
export interface Nishon {
  /** Qaysi filialning ma'lumoti so'ralyapti */
  readonly filialId?: number;
  /** Yozuv egasi (masalan kassa kimniki) — TZ 14.6 ikkinchi qattiq qoidasi */
  readonly egaXodimId?: number;
}

export type RadSababi =
  | 'USTA_SAYTGA_KIRMAYDI'
  | 'OZGA_KASSA'
  | 'OZGA_FILIAL'
  | 'OZGA_FILIAL_KASSASI'
  | 'RUXSAT_YOQ';

export type Natija =
  | { readonly ruxsat: true; readonly qamrov: Qamrov }
  | { readonly ruxsat: false; readonly sabab: RadSababi };

const RAD = (sabab: RadSababi): Natija => ({ ruxsat: false, sabab });

// ─── Qatlam 2: rollar yig'indisi ──────────────────────────────────────────

/**
 * TZ 10.3, 14.6 — «Xodimda bir nechta rol bo'lsa, ruxsatlar YIG'INDI bo'ladi».
 *
 * Bir xil ruxsat ikki rolda turli qamrov bilan bo'lsa — kengrog'i yutadi.
 * Bu yig'indi ta'rifining o'zidan kelib chiqadi: rol qo'shish huquqni
 * kamaytirmasligi kerak.
 */
export function yigindiQamrov(f: Foydalanuvchi, kod: RuxsatKod): Qamrov | null {
  let topilgan: Qamrov | null = null;
  for (const rol of f.rollar) {
    const q = rol.ruxsatlar.get(kod);
    if (q === undefined) continue;
    if (q === 'BARCHA') return 'BARCHA';
    topilgan = 'OZ_FILIALI';
  }
  return topilgan;
}

export function rolBormi(f: Foydalanuvchi, kod: TizimliRol): boolean {
  return f.rollar.some((r) => r.kod === kod);
}

// ─── Qatlam 1: qattiq qoidalar ────────────────────────────────────────────

/**
 * Q-04 (uchta) + TZ 20.12.1 (to'rtinchi). Bular KODDA — ruxsatlar
 * matritsasi ularni bekor qila olmaydi.
 *
 *   1. Usta roli saytga kira olmaydi
 *   2. Sotuvchi boshqa sotuvchining kassasini ko'ra olmaydi
 *   3. Admin o'zining `sozlama.ozgartir` ruxsatini olib qo'ya olmaydi
 *   4. Filial xodimi boshqa filial kassasini ko'rmaydi — qamrov BARCHA
 *      bo'lsa ham. Faqat bosh filial admini uchun ochiq
 *
 * 3-qoida `ruxsatOlibQoyilsinmi()` da — u matritsani tahrirlash payti tegishli.
 */
function qattiqQoidalar(f: Foydalanuvchi, kod: RuxsatKod, nishon: Nishon): Natija | null {
  // 1 — usta faqat botdan ishlaydi (QISM 1 §8)
  if (rolBormi(f, 'USTA') && f.rollar.length === 1) {
    return RAD('USTA_SAYTGA_KIRMAYDI');
  }

  const kassaAmali = KASSA_KODLARI.includes(kod);
  if (!kassaAmali) return null;

  // 2 — o'zganing kassasi. Admin bundan mustasno emas: 14.6 uni
  //     `kassa.barcha.kor` ruxsati orqali ochadi
  const ega = nishon.egaXodimId;
  if (ega !== undefined && ega !== f.xodimId) {
    if (yigindiQamrov(f, 'kassa.barcha.kor') === null) {
      return RAD('OZGA_KASSA');
    }
  }

  // 4 — boshqa filial kassasi. Qamrov BARCHA bo'lsa ham yopiq,
  //     faqat bosh filial admini ko'radi
  const nishonFilial = nishon.filialId;
  if (nishonFilial !== undefined && nishonFilial !== f.filialId) {
    const boshAdmin = f.boshFilialda && rolBormi(f, 'ADMIN');
    if (!boshAdmin) {
      return RAD('OZGA_FILIAL_KASSASI');
    }
  }

  return null;
}

// ─── Asosiy tekshiruv ─────────────────────────────────────────────────────

/**
 * Foydalanuvchida shu amalga ruxsat bormi.
 *
 * TZ 14.6: «Standart holat — barcha huquq adminda. Qolgan rollarga admin
 * o'zi beradi, hech narsa oldindan ochiq emas.» Shuning uchun bu funksiya
 * hech qachon "topilmadi → ruxsat bor" demaydi.
 */
export function ruxsatTekshir(
  f: Foydalanuvchi,
  kod: RuxsatKod,
  nishon: Nishon = {},
): Natija {
  const qattiq = qattiqQoidalar(f, kod, nishon);
  if (qattiq !== null) return qattiq;

  const qamrov = yigindiQamrov(f, kod);
  if (qamrov === null) return RAD('RUXSAT_YOQ');

  const nishonFilial = nishon.filialId;
  if (qamrov === 'OZ_FILIALI' && nishonFilial !== undefined && nishonFilial !== f.filialId) {
    return RAD('OZGA_FILIAL');
  }

  return { ruxsat: true, qamrov };
}

/** Qisqa shakl — faqat ha/yo'q kerak bo'lganda. */
export function ruxsatBormi(f: Foydalanuvchi, kod: RuxsatKod, nishon: Nishon = {}): boolean {
  return ruxsatTekshir(f, kod, nishon).ruxsat;
}

/**
 * TZ 14.6 uchinchi qattiq qoidasi: admin o'zining «sozlamalarni o'zgartirish»
 * huquqini olib qo'ya olmaydi.
 *
 * Matritsa tahrirlanayotganda chaqiriladi. `false` qaytsa — checkbox
 * bloklanadi va sabab ko'rsatiladi.
 */
export function ruxsatOlibQoyilsinmi(
  ozgartiruvchi: Foydalanuvchi,
  rolId: number,
  kod: RuxsatKod,
  ozgartiruvchiRolIdlari: readonly number[],
): boolean {
  if (kod !== OLIB_QOYILMAYDI) return true;
  // O'zi turgan roldan shu ruxsatni yechish taqiqlanadi
  if (!ozgartiruvchiRolIdlari.includes(rolId)) return true;
  // Boshqa rolida ham shu ruxsat bo'lsa — yechsa bo'ladi, yo'l yopilmaydi
  const boshqaRollarda = ozgartiruvchi.rollar.filter((r) => r.ruxsatlar.has(kod)).length;
  return boshqaRollarda > 1;
}

/** Usta saytga umuman kira oladimi — kirish ekranida tekshiriladi (§8). */
export function saytgaKiraOladimi(f: Foydalanuvchi): boolean {
  return !(rolBormi(f, 'USTA') && f.rollar.length === 1);
}
