/**
 * lib/domain/hisobot/pul-prognozi.ts — keyingi N kunlik pul prognozi.
 * Moliya hisobotlari, 2026-10-12.
 *
 * ⚠️ NEGA: kichik biznes foyda yetmaganidan emas, PUL o'z vaqtida
 *    yetmaganidan yopiladi. Bu hisob «qaysi kuni kassada pul yetmaydi»
 *    degan savolga oldindan javob beradi.
 *
 * Ikki chiziq:
 *  · MA'LUM — bugungi pul + muddati kelgan mijoz qarzlari − yetkazib
 *    beruvchiga muddati kelgan to'lovlar. Faqat hujjatda bor narsa.
 *  · ODATDAGI — ustiga oxirgi davrning o'rtacha kunlik savdo tushumi va
 *    o'rtacha doimiy chiqimlari (ish haqi, operatsion). «Hamma narsa
 *    odatdagidek davom etsa».
 *
 * ⚠️ Muddati O'TGAN to'lovimiz bugungi kunga tushadi (to'lanishi kerak).
 *    Muddati o'tgan MIJOZ qarzi esa chaqiruvchi tomonidan chiqarib
 *    qo'yiladi — undirilishi kafolatlanmagan, alohida ko'rsatiladi.
 *
 * ⚠️ BAZAGA TEGMAYDI. Sana — `YYYY-MM-DD` (Toshkent kuni). Pul — Decimal.
 */

import Decimal from 'decimal.js';

export interface SanaliSumma {
  readonly sana: string;
  readonly summa: string;
}

export interface PrognozKuni {
  readonly sana: string;
  readonly kirim: string;
  readonly chiqim: string;
  /** Faqat ma'lum to'lovlar bilan kun oxiridagi qoldiq */
  readonly malum: string;
  /** Odatdagi kunlik oqim qo'shilganda */
  readonly odatdagi: string;
}

export interface PulPrognozi {
  readonly kunlar: readonly PrognozKuni[];
  /** Birinchi manfiy kun — `odatdagi` chiziq bo'yicha; yo'q bo'lsa `null` */
  readonly yetmaydi: { readonly sana: string; readonly qoldiq: string } | null;
  /** `malum` bo'yicha birinchi manfiy kun */
  readonly malumYetmaydi: { readonly sana: string; readonly qoldiq: string } | null;
  readonly engPast: { readonly sana: string; readonly qoldiq: string };
}

export function kunQosh(sana: string, n: number): string {
  const d = new Date(`${sana}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function pulPrognozi(k: {
  readonly bugun: string;
  readonly boshlangich: string;
  readonly kirimlar: readonly SanaliSumma[];
  readonly chiqimlar: readonly SanaliSumma[];
  readonly kunlikKirim: string;
  readonly kunlikChiqim: string;
  readonly kunSoni?: number;
}): PulPrognozi {
  const n = k.kunSoni ?? 30;
  const oxiri = kunQosh(k.bugun, n);
  const yig = (r: readonly SanaliSumma[]): Map<string, Decimal> => {
    const m = new Map<string, Decimal>();
    for (const x of r) {
      // O'tgan muddat — bugunga; oynadan keyingisi — kirmaydi
      const s = x.sana < k.bugun ? k.bugun : x.sana;
      if (s > oxiri) continue;
      m.set(s, (m.get(s) ?? new Decimal(0)).plus(x.summa));
    }
    return m;
  };
  const kir = yig(k.kirimlar);
  const chiq = yig(k.chiqimlar);
  const kunlikSof = new Decimal(k.kunlikKirim).minus(k.kunlikChiqim);

  let malum = new Decimal(k.boshlangich);
  let odatdagi = new Decimal(k.boshlangich);
  const kunlar: PrognozKuni[] = [];
  let yetmaydi: PulPrognozi['yetmaydi'] = null;
  let malumYetmaydi: PulPrognozi['malumYetmaydi'] = null;
  let engPast = { sana: k.bugun, qoldiq: odatdagi.toFixed(2) };

  for (let i = 0; i <= n; i += 1) {
    const sana = kunQosh(k.bugun, i);
    const ki = kir.get(sana) ?? new Decimal(0);
    const ch = chiq.get(sana) ?? new Decimal(0);
    malum = malum.plus(ki).minus(ch);
    // Bugun odatdagi oqim qo'shilmaydi — bugungi savdo kassada allaqachon bor
    odatdagi = odatdagi.plus(ki).minus(ch).plus(i === 0 ? 0 : kunlikSof);
    kunlar.push({
      sana,
      kirim: ki.toFixed(2),
      chiqim: ch.toFixed(2),
      malum: malum.toFixed(2),
      odatdagi: odatdagi.toFixed(2),
    });
    if (yetmaydi === null && odatdagi.isNegative()) yetmaydi = { sana, qoldiq: odatdagi.toFixed(2) };
    if (malumYetmaydi === null && malum.isNegative()) malumYetmaydi = { sana, qoldiq: malum.toFixed(2) };
    if (odatdagi.lt(engPast.qoldiq)) engPast = { sana, qoldiq: odatdagi.toFixed(2) };
  }
  return { kunlar, yetmaydi, malumYetmaydi, engPast };
}
