/**
 * lib/domain/narx-qoidasi.ts — Egasi qarori 2026-09-20 · TZ 3.8 · 6.2 · 20.9
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Ilgari mijoz narxi MATERIALLARDAN yig'ilardi:
 *
 *     Σ(slot miqdori × o'sha matoning narxi) + Σ(aksessuar × narxi)
 *
 * Egasi buni rad etdi: «endi men belgilab qo'yaman mijozga narx
 * qanday hisoblanishini». Endi narx MAHSULOT TURI va MATO DARAJASI
 * juftligiga qo'yiladi, o'lcham bo'yicha bosqichli.
 *
 * ⚠️ Bu fayl OMBORGA TEGMAYDI. Materiallar avvalgidek hisoblanadi va
 *    yechiladi (`lib/domain/formula.ts`) — faqat ularning NARXI endi
 *    mijozga chiqmaydi. Sarf qanchaligini sotuvchi ham, chek ham
 *    ko'radi, narxini esa yo'q.
 *
 * ⚠️ Bazaga tegmaydi (§5.1) — hamma narsa parametr bo'lib keladi.
 */

import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';
import {
  kopaytir,
  nolSom,
  pulMatn,
  som,
  yigindi,
  type Kurs,
  type Som,
} from './pul';
import { katalogNarxi, offsetQolla, type Offset } from './narx';

const D = Decimal.clone({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

/** Narx nimadan hisoblanadi */
/**
 * ⚠️ `MIQDOR` — egasi qarori 2026-09-22: «ko'p olganga arzonroq
 *    beriladi, muni matoni qilgandek belgilab qo'yish orqali».
 *
 *    Karniz va donalab sotiladigan buyumda eni-bo'yi umuman
 *    kiritilmaydi, `DONA` da esa o'lchov DOIM 1 — ya'ni «10 donadan
 *    ko'p olsa arzon» degan qoidani mavjud usullar bilan yozib
 *    bo'lmasdi. `MIQDOR` da bosqich SOTILAYOTGAN MIQDORGA qarab
 *    tanlanadi: M materialda metr, DONA materialda dona.
 */
export type HisoblashUsuli = 'MAYDON' | 'ENI' | "BO'YI" | 'DONA' | 'MIQDOR';

/** Qo'shimcha narxi nimadan — `QATIY` o'lchamdan bog'liq emas */
export type QoshimchaUsuli = 'QATIY' | 'MAYDON' | 'ENI' | "BO'YI";

// ─── O'lchov ──────────────────────────────────────────────────────────────

/**
 * Bosqich qaysi songa qarab tanlanadi va narx nimaga ko'paytiriladi.
 *
 *   MAYDON  → kv.m    (eni × bo'yi)
 *   ENI     → metr    (eni o'zi)
 *   BO'YI   → metr    (bo'yi o'zi)
 *   DONA    → 1       — o'lchamdan mutlaqo bog'liq emas
 *
 * ⚠️ 2026-09-20 — kirish ham METRDA. Ilgari sm kelardi va bu yerda
 *    ÷100, ÷10 000 turardi. Narx jadvali doim odam tushunadigan
 *    birlikda edi — endi kirish ham o'sha birlikda, demak
 *    o'girishning o'zi kerak emas.
 */
export function olchovi(
  usuli: HisoblashUsuli,
  eniM: number,
  boyiM: number,
  /**
   * Sotilayotgan miqdor — FAQAT `MIQDOR` usulida ishlatiladi.
   *
   * ⚠️ Qolgan usullarda e'tiborga olinmaydi: ular o'lchamdan
   *    hisoblanadi va miqdor keyin, jamiga ko'paytirishda qatnashadi.
   *    Ikki joyda ikki marta qo'llanmasligi uchun shunday.
   */
  miqdor = 1,
): number {
  if (usuli === 'DONA') return 1;

  /**
   * ⚠️ MIQDOR o'lcham TEKSHIRUVIDAN OLDIN turadi: karniz va
   *    mexanizmda eni-bo'yi umuman kiritilmaydi va ular nol
   *    bo'ladi. Pastdagi tekshiruvga tushsa, «o'lcham noldan katta
   *    bo'lsin» degan ma'nosiz xato chiqardi.
   */
  if (usuli === 'MIQDOR') {
    if (!Number.isFinite(miqdor) || miqdor <= 0) {
      throw new BiznesXato('NARX_NOTOGRI', 'miqdor noldan katta bo‘lsin');
    }
    return new D(miqdor).toNumber();
  }

  if (!Number.isFinite(eniM) || !Number.isFinite(boyiM) || eniM <= 0 || boyiM <= 0) {
    throw new BiznesXato('NARX_NOTOGRI', "o'lcham noldan katta bo'lsin");
  }

  switch (usuli) {
    case 'MAYDON':
      return new D(eniM).times(boyiM).toNumber();
    case 'ENI':
      return new D(eniM).toNumber();
    case "BO'YI":
      return new D(boyiM).toNumber();
  }
}

// ─── Bosqichlar ───────────────────────────────────────────────────────────

export interface Bosqich {
  readonly dan: number;
  /** `null` — cheksiz */
  readonly gacha: number | null;
  readonly narx: string;
  readonly valyuta: string;
}

/**
 * O'lchovga mos bosqich.
 *
 * ⚠️ CHEGARA QOIDASI: `[dan, gacha)` — `dan` KIRADI, `gacha` KIRMAYDI.
 *
 *    «0.5 dan 1 gacha» degani `0.5 ≤ x < 1`. Aynan 1.00 kv.m keyingi
 *    bosqichga tushadi. Ikkala chegara ham kiradigan qilinsa, 1.00 da
 *    ikkita bosqich mos kelib, qaysi biri olinishi tasodifga qolardi.
 */
export function bosqichniTop(
  bosqichlar: readonly Bosqich[],
  olchov: number,
): Bosqich | null {
  return (
    bosqichlar.find(
      (b) => olchov >= b.dan && (b.gacha === null || olchov < b.gacha),
    ) ?? null
  );
}

// ─── Narx qoidasi ─────────────────────────────────────────────────────────

export interface Qoida {
  readonly hisoblashUsuli: HisoblashUsuli;
  readonly bosqichlar: readonly Bosqich[];
}

/**
 * Asosiy narx: bosqich stavkasi × o'lchov.
 *
 * ⚠️ Bosqich topilmasa XATO OTILADI. Jimgina nol qaytarish eng xavfli
 *    yo'l bo'lardi: mijoz jalyuzini BEPULGA olib ketardi va buni hech
 *    kim sezmasdi. Sotuvchi «bu o'lcham uchun narx qo'yilmagan» degan
 *    xabarni ko'rgani ancha yaxshi.
 */
export function qoidaNarxi(
  qoida: Qoida,
  eniM: number,
  boyiM: number,
  kurs: Kurs | null,
  /** `MIQDOR` usulida bosqich shunga qarab tanlanadi (2026-09-22) */
  miqdor = 1,
): Som {
  const olchov = olchovi(qoida.hisoblashUsuli, eniM, boyiM, miqdor);
  const bosqich = bosqichniTop(qoida.bosqichlar, olchov);

  if (bosqich === null) {
    throw new BiznesXato(
      'NARX_QOIDASI_YOQ',
      `${olchov.toFixed(4)} uchun bosqich qo'yilmagan`,
    );
  }

  const birlikNarxi = katalogNarxi(bosqich.narx, bosqich.valyuta, kurs);
  if (birlikNarxi === null) {
    throw new BiznesXato('NARX_QOIDASI_YOQ', 'bosqich narxi kiritilmagan');
  }

  return kopaytir(birlikNarxi, olchov);
}

// ─── Daraja — narxni qaysi slot belgilaydi ────────────────────────────────

/**
 * Narx darajasini izlash uchun slot haqida kerak bo'ladigan minimum.
 *
 * ⚠️ Faqat shu uchta maydon. Sotuv ekrani, server tekshiruvi va bot —
 *    uchalasining slot obyekti boshqa-boshqa, lekin bu uchtasi
 *    hammasida bor.
 */
export interface DarajaliSlot {
  /** Admin belgilagan: «mijoz narxini SHU slot belgilaydi» */
  readonly narxBelgilaydi: boolean;
  /** `KV_M` — mato. Belgi qo'yilmagan turlarda mato ustun turadi */
  readonly matomi: boolean;
  /** Tanlangan materialning darajasi. `null` — daraja qo'yilmagan */
  readonly narxGuruhId: number | null;
}

/**
 * Mijoz narxini belgilaydigan slotni topadi — egasi qarori 2026-09-22.
 *
 * ⚠️ NEGA BU FUNKSIYA BOR
 *
 *    Bu qoida UCH JOYDA alohida yozilgan edi: sotuv ekranida
 *    (`buyurtma/yangi/forma.tsx`), server tekshiruvida
 *    (`lib/amal/narx-tekshir.ts`) va botda (`bot/buyurtma-oqimi.ts`).
 *    Uchalasi bir xil ishlashi SHART — aks holda mijoz ko'rgan narx,
 *    bazaga tushgan narx va botdagi narx uch xil bo'ladi va buni
 *    hech kim sezmaydi. «Bir mantiq — bir joyda» (CLAUDE.md §3).
 *
 * ⚠️ TARTIB:
 *
 *      1. Admin belgilagan slot bor  → SHU. Boshqasiga o'tilmaydi
 *      2. Belgi yo'q  → birinchi darajali MATO (eski xulq)
 *      3. Mato yo'q   → birinchi darajali material (eski xulq)
 *      4. Hech biri   → `null`, narx topilmaydi
 *
 * ⚠️ 1-BANDDA ORQAGA QAYTISH YO'Q — ataylab.
 *
 *    Belgilangan slotga daraja qo'yilmagan material tanlansa,
 *    funksiya o'sha slotni qaytaradi va uning darajasi `null`
 *    bo'ladi — ya'ni narx topilmaydi va sotuvchi sababni ko'radi.
 *    Boshqa slotdan olib qo'yilsa, jalyuzi BOSHQA matoning narxida
 *    sotilardi va ekranda hech qanday belgi qolmasdi. Egasi aynan
 *    shu holatdan qutulish uchun belgini so'radi (2026-09-22).
 *
 * ⚠️ Ikkita slot belgilangan bo'lishi MUMKIN EMAS — bazada qisman
 *    unique indeks bor (`mahsulot_slot_narx_bitta`, 0048). Bu yerda
 *    baribir birinchisi olinadi: domen bazaga tayanmaydi.
 */
export function darajaliSlotniTop<T extends DarajaliSlot>(
  slotlar: readonly T[],
): T | null {
  const belgilangan = slotlar.find((s) => s.narxBelgilaydi);
  if (belgilangan !== undefined) return belgilangan;

  return (
    slotlar.find((s) => s.matomi && s.narxGuruhId !== null) ??
    slotlar.find((s) => s.narxGuruhId !== null) ??
    null
  );
}

// ─── Qo'shimchalar ────────────────────────────────────────────────────────

export interface Qoshimcha {
  readonly nom: string;
  readonly hisoblashUsuli: QoshimchaUsuli;
  readonly narx: string;
  readonly valyuta: string;
}

/**
 * Qo'shimcha narxi — «usti shabalik», «o'rnatish».
 *
 * `QATIY` da o'lchamga qaramaydi, qolganida asosiy narx kabi
 * o'lchovga ko'paytiriladi.
 */
export function qoshimchaNarxi(
  q: Qoshimcha,
  eniM: number,
  boyiM: number,
  kurs: Kurs | null,
): Som {
  const asos = katalogNarxi(q.narx, q.valyuta, kurs);
  if (asos === null) return nolSom();
  if (q.hisoblashUsuli === 'QATIY') return asos;
  return kopaytir(asos, olchovi(q.hisoblashUsuli, eniM, boyiM));
}

// ─── Pozitsiya narxi ──────────────────────────────────────────────────────

export interface PozitsiyaKirishi {
  readonly qoida: Qoida;
  readonly eniM: number;
  readonly boyiM: number;
  /**
   * Sotilayotgan miqdor — `MIQDOR` usulida bosqich shunga qarab
   * tanlanadi va narx shunga ko'paytiriladi. Boshqa usullarda
   * e'tiborga olinmaydi.
   */
  readonly miqdor?: number;
  readonly qoshimchalar: readonly Qoshimcha[];
  /** TZ 6.3 — mijoz guruhi chegirmasi/ustamasi */
  readonly offset: Offset | null;
  readonly kurs: Kurs | null;
}

export interface NarxQatori {
  readonly nom: string;
  readonly summa: string;
}

export interface PozitsiyaNatijasi {
  readonly olchov: number;
  /** Tanlangan bosqich — ekranda «1 kv.m dan katta → 3 $» deb ko'rsatiladi */
  readonly bosqich: Bosqich | null;
  readonly asosiy: string;
  readonly qoshimchalar: readonly NarxQatori[];
  readonly jami: string;
}

/**
 * Bitta pozitsiyaning to'liq narxi.
 *
 * ⚠️ OFFSET faqat ASOSIY narxga qo'llanadi, qo'shimchaga tegmaydi —
 *    TZ 6.3 ning aynan o'sha qoidasi («offset matoga, aksessuarga
 *    tegmaydi»). O'rnatish haqiga chegirma berish alohida qaror,
 *    uni mijoz guruhi avtomatik hal qilmasligi kerak.
 */
export function pozitsiyaQoidaNarxi(k: PozitsiyaKirishi): PozitsiyaNatijasi {
  const miqdor = k.miqdor ?? 1;
  const olchov = olchovi(k.qoida.hisoblashUsuli, k.eniM, k.boyiM, miqdor);
  const bosqich = bosqichniTop(k.qoida.bosqichlar, olchov);

  const xom = qoidaNarxi(k.qoida, k.eniM, k.boyiM, k.kurs, miqdor);
  const asosiy = offsetQolla(xom, k.offset, k.kurs);

  const qatorlar: NarxQatori[] = k.qoshimchalar.map((q) => ({
    nom: q.nom,
    summa: pulMatn(qoshimchaNarxi(q, k.eniM, k.boyiM, k.kurs)),
  }));

  const jami = yigindi(
    asosiy,
    qatorlar.map((q) => som(q.summa)),
  );

  return {
    olchov,
    bosqich,
    asosiy: pulMatn(asosiy),
    qoshimchalar: qatorlar,
    jami: pulMatn(jami),
  };
}

// ─── Tekshiruv — admin ekranida ───────────────────────────────────────────

export type BosqichNuqsoni =
  | { readonly tur: 'BOSQICH_YOQ' }
  /** Birinchi bosqich noldan boshlanmaydi — kichik o'lchamga narx yo'q */
  | { readonly tur: 'BOSHLANISH'; readonly dan: number }
  /** Ikki bosqich orasida bo'shliq — o'sha oraliqqa narx yo'q */
  | { readonly tur: 'BOSHLIQ'; readonly dan: number; readonly gacha: number }
  /** Ikki bosqich ustma-ust — qaysi biri olinishi noaniq */
  | { readonly tur: 'USTMA_UST'; readonly dan: number; readonly gacha: number }
  /** Oxirgi bosqich cheksiz emas — katta buyurtmaga narx yo'q */
  | { readonly tur: 'CHEKSIZ_YOQ'; readonly gacha: number };

/**
 * TZ 4.5 ruhida: xato admin ekranida ushlanadi, mijoz oldida emas.
 *
 * ⚠️ Bo'shliq eng xavfli nuqson: qolgan hamma o'lcham ishlab turadi va
 *    muammo faqat o'sha oraliqdagi buyurtma kelganda chiqadi — ya'ni
 *    mijoz oldida, sotuvchi qo'lida.
 */
export function bosqichlarniTekshir(bosqichlar: readonly Bosqich[]): BosqichNuqsoni[] {
  if (bosqichlar.length === 0) return [{ tur: 'BOSQICH_YOQ' }];

  const nuqsonlar: BosqichNuqsoni[] = [];
  const tartibda = [...bosqichlar].sort((a, b) => a.dan - b.dan);

  const birinchi = tartibda[0] as Bosqich;
  if (birinchi.dan > 0) {
    nuqsonlar.push({ tur: 'BOSHLANISH', dan: birinchi.dan });
  }

  for (let i = 0; i < tartibda.length - 1; i += 1) {
    const joriy = tartibda[i] as Bosqich;
    const keyingi = tartibda[i + 1] as Bosqich;

    // Cheksiz bosqichdan keyin hech narsa kelmaydi
    if (joriy.gacha === null) {
      nuqsonlar.push({ tur: 'USTMA_UST', dan: keyingi.dan, gacha: keyingi.gacha ?? keyingi.dan });
      continue;
    }
    if (keyingi.dan > joriy.gacha) {
      nuqsonlar.push({ tur: 'BOSHLIQ', dan: joriy.gacha, gacha: keyingi.dan });
    } else if (keyingi.dan < joriy.gacha) {
      nuqsonlar.push({ tur: 'USTMA_UST', dan: keyingi.dan, gacha: joriy.gacha });
    }
  }

  const oxirgi = tartibda[tartibda.length - 1] as Bosqich;
  if (oxirgi.gacha !== null) {
    nuqsonlar.push({ tur: 'CHEKSIZ_YOQ', gacha: oxirgi.gacha });
  }

  return nuqsonlar;
}

export interface ChegaraOgohlantirishi {
  readonly chegara: number;
  readonly oldin: string;
  readonly keyin: string;
}

/**
 * Chegarada narx TUSHIB ketadigan joylar.
 *
 * ⚠️ Egasi (2026-09-20) bosqichlarni QO'LDA kiritadi va stavka
 *    pasayishi uning o'z qarori bo'lishi mumkin. Shuning uchun bu
 *    BLOKLAMAYDI — faqat ko'rsatadi:
 *
 *        0.49 kv.m → 3.92 $      0.51 kv.m → 2.55 $
 *
 *    ya'ni kattaroq parda arzonroq. Buni ekranda ko'rib turgani
 *    yaxshi, mijoz aytib bergandan ko'ra.
 */
export function chegaradaNarxTushadimi(
  qoida: Qoida,
  kurs: Kurs | null,
): ChegaraOgohlantirishi[] {
  const tartibda = [...qoida.bosqichlar].sort((a, b) => a.dan - b.dan);
  const natija: ChegaraOgohlantirishi[] = [];

  for (let i = 0; i < tartibda.length - 1; i += 1) {
    const joriy = tartibda[i] as Bosqich;
    const keyingi = tartibda[i + 1] as Bosqich;
    const chegara = joriy.gacha;
    if (chegara === null || chegara <= 0) continue;

    const a = katalogNarxi(joriy.narx, joriy.valyuta, kurs);
    const b = katalogNarxi(keyingi.narx, keyingi.valyuta, kurs);
    if (a === null || b === null) continue;

    /**
     * Chegarada ikkala bosqich ham AYNAN shu o'lchovga tegishli
     * bo'lganda qancha chiqishini solishtiramiz — stavka emas,
     * MIJOZ TO'LAYDIGAN summa muhim.
     */
    const oldin = kopaytir(a, chegara);
    const keyin = kopaytir(b, chegara);

    if (new D(pulMatn(keyin)).lessThan(pulMatn(oldin))) {
      natija.push({ chegara, oldin: pulMatn(oldin), keyin: pulMatn(keyin) });
    }
  }

  return natija;
}
