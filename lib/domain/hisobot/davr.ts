/**
 * lib/domain/hisobot/davr.ts — TZ 11.1 · QISM 1 §19
 *
 * Har hisobotda davr filtri bor: bugun, hafta, oy, chorak, yil, ixtiyoriy
 * oraliq (11.1). Va deyarli har hisobot **taqqoslash bilan** ko'rsatiladi
 * (11.5.1, HISOBOTLAR-ISH §1) — shuning uchun "oldingi davr" ham shu yerda
 * hisoblanadi, har hisobotda qaytadan emas.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ Oraliq YARIM OCHIQ: [boshi, oxiri) — oxiri ICHIGA KIRMAYDI.           │
 * │                                                                       │
 * │ Sabab: bazada vaqt TIMESTAMPTZ (§19). «23:59:59 gacha» deb yozilsa    │
 * │ 23:59:59.4 dagi yozuv tushib qoladi va kun yig'indisi kassa bilan     │
 * │ to'g'ri kelmaydi. `>= boshi AND < oxiri` da bunday teshik yo'q.       │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Vaqt zonasi: jarayon `TZ=Asia/Tashkent` bilan ishga tushadi (lib/muhit.ts)
 * va `invariant.ts` buni tekshiradi. Shuning uchun bu yerdagi `Date` amallari
 * mahalliy vaqtda — kun chegarasi 00:00 dan boshlanadi (§19).
 */

import { BiznesXato } from '@/lib/xato';

export const DAVR_TURLARI = ['BUGUN', 'HAFTA', 'OY', 'CHORAK', 'YIL', 'ORALIQ'] as const;
export type DavrTuri = (typeof DAVR_TURLARI)[number];

export interface Davr {
  readonly turi: DavrTuri;
  /** Ichiga kiradi */
  readonly boshi: Date;
  /** Ichiga KIRMAYDI */
  readonly oxiri: Date;
}

const KUN_MS = 24 * 60 * 60 * 1000;

export function davrTurimi(x: string): x is DavrTuri {
  return (DAVR_TURLARI as readonly string[]).includes(x);
}

// ─── Yordamchilar ─────────────────────────────────────────────────────────

/** O'sha kunning 00:00 i (mahalliy vaqtda). */
export function kunBoshi(sana: Date): Date {
  return new Date(sana.getFullYear(), sana.getMonth(), sana.getDate());
}

/** Ertangi kunning 00:00 i — yarim ochiq oraliqning o'ng cheti. */
export function kunOxiri(sana: Date): Date {
  const k = kunBoshi(sana);
  return new Date(k.getFullYear(), k.getMonth(), k.getDate() + 1);
}

/**
 * Hafta DUSHANBADAN boshlanadi.
 *
 * JavaScript `getDay()` yakshanbani 0 deb qaytaradi. To'g'ridan-to'g'ri
 * ishlatilsa hafta yakshanbadan boshlanadi va o'zbek ish haftasiga to'g'ri
 * kelmaydi — dushanbadagi sotuv «o'tgan hafta» ga tushib qoladi.
 */
export function haftaBoshi(sana: Date): Date {
  const k = kunBoshi(sana);
  const yakshanbadan = k.getDay(); // 0 = yakshanba
  const dushanbadan = (yakshanbadan + 6) % 7; // 0 = dushanba
  return new Date(k.getFullYear(), k.getMonth(), k.getDate() - dushanbadan);
}

export function oyBoshi(sana: Date): Date {
  return new Date(sana.getFullYear(), sana.getMonth(), 1);
}

export function chorakBoshi(sana: Date): Date {
  return new Date(sana.getFullYear(), Math.floor(sana.getMonth() / 3) * 3, 1);
}

export function yilBoshi(sana: Date): Date {
  return new Date(sana.getFullYear(), 0, 1);
}

// ─── Davr yasash ──────────────────────────────────────────────────────────

/**
 * Tanlangan tur bo'yicha davr chegaralarini beradi.
 *
 * `ORALIQ` da ikkala sana ham kerak. `oxiri` foydalanuvchi tanlagan
 * **oxirgi kun** — u ichiga kiradi, shuning uchun chegara ertasiga suriladi.
 */
export function davrYasa(
  turi: DavrTuri,
  bugun: Date,
  oraliq?: { boshi: Date; oxiri: Date },
): Davr {
  if (turi === 'ORALIQ') {
    if (!oraliq) {
      throw new BiznesXato('DAVR_NOTOGRI', 'ixtiyoriy oraliqda ikkala sana kerak');
    }
    const boshi = kunBoshi(oraliq.boshi);
    const oxiri = kunOxiri(oraliq.oxiri);
    if (oxiri <= boshi) {
      throw new BiznesXato('DAVR_NOTOGRI', 'oraliq oxiri boshidan oldin');
    }
    return { turi, boshi, oxiri };
  }

  const oxiri = kunOxiri(bugun);
  switch (turi) {
    case 'BUGUN':
      return { turi, boshi: kunBoshi(bugun), oxiri };
    case 'HAFTA':
      return { turi, boshi: haftaBoshi(bugun), oxiri };
    case 'OY':
      return { turi, boshi: oyBoshi(bugun), oxiri };
    case 'CHORAK':
      return { turi, boshi: chorakBoshi(bugun), oxiri };
    case 'YIL':
      return { turi, boshi: yilBoshi(bugun), oxiri };
  }
}

/**
 * Taqqoslash uchun oldingi davr.
 *
 * ⚠️ Oy, chorak va yil KALENDAR bo'yicha orqaga suriladi, kun soni bo'yicha
 * emas. Aks holda 31 kunlik iyul 30 kunlik iyun bilan solishtirilganda
 * «tushum 3% kamaydi» degan soxta natija chiqadi — sabab bitta ortiqcha kun.
 *
 * `BUGUN` → kecha, `HAFTA` → o'tgan hafta, `ORALIQ` → xuddi shu uzunlikdagi
 * oldingi bo'lak.
 */
export function oldingiDavr(d: Davr): Davr {
  switch (d.turi) {
    case 'BUGUN':
    case 'HAFTA':
    case 'ORALIQ': {
      const uzunlik = d.oxiri.getTime() - d.boshi.getTime();
      return {
        turi: d.turi,
        boshi: new Date(d.boshi.getTime() - uzunlik),
        oxiri: new Date(d.boshi.getTime()),
      };
    }
    case 'OY':
      return {
        turi: d.turi,
        boshi: new Date(d.boshi.getFullYear(), d.boshi.getMonth() - 1, 1),
        oxiri: new Date(d.boshi.getFullYear(), d.boshi.getMonth(), 1),
      };
    case 'CHORAK':
      return {
        turi: d.turi,
        boshi: new Date(d.boshi.getFullYear(), d.boshi.getMonth() - 3, 1),
        oxiri: new Date(d.boshi.getFullYear(), d.boshi.getMonth(), 1),
      };
    case 'YIL':
      return {
        turi: d.turi,
        boshi: new Date(d.boshi.getFullYear() - 1, 0, 1),
        oxiri: new Date(d.boshi.getFullYear(), 0, 1),
      };
  }
}

/**
 * Davrdagi kunlar soni — sarflanish tezligi va o'rtacha kunlik hisoblari uchun
 * (HISOBOTLAR-ISH §3.1 №13).
 *
 * Kunlik farqdan hisoblanadi, millisekunddan emas: soat siljishi bo'lsa ham
 * («yozgi vaqt» kabi) kun soni butun qoladi.
 */
export function kunlarSoni(d: Davr): number {
  const kunlar = Math.round((d.oxiri.getTime() - d.boshi.getTime()) / KUN_MS);
  return Math.max(kunlar, 1);
}

export function ichidami(d: Davr, sana: Date): boolean {
  return sana >= d.boshi && sana < d.oxiri;
}

/** Interfeys uchun — `DD.MM.YYYY` (§19). */
export function sanaMatn(sana: Date): string {
  const kun = String(sana.getDate()).padStart(2, '0');
  const oy = String(sana.getMonth() + 1).padStart(2, '0');
  return `${kun}.${oy}.${String(sana.getFullYear())}`;
}

/**
 * Davrning ko'rinishi: `01.08.2026 — 31.08.2026`.
 * Oxirgi kun ko'rsatiladi (chegara emas) — foydalanuvchi 1-sentabrni
 * avgust hisobotida ko'rmasligi kerak.
 */
export function davrMatn(d: Davr): string {
  const oxirgiKun = new Date(d.oxiri.getTime() - KUN_MS);
  return `${sanaMatn(d.boshi)} — ${sanaMatn(oxirgiKun)}`;
}
