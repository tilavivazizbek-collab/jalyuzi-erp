/**
 * lib/domain/bot-oqim.ts — TZ 13.4
 *
 * Botdagi buyurtma oqimining **holat mashinasi**. Bazaga tegmaydi
 * (§5.1) va Telegramni bilmaydi — shuning uchun to'liq sinaladi.
 *
 * ⚠️ 13.4 — «Oqim **konstruktordan** quriladi (4-bo'lim), qat'iy
 *    emas. Yangi mahsulot turi qo'shilsa botda avtomatik paydo
 *    bo'ladi.» Shuning uchun qadamlar ro'yxati qattiq yozilmaydi:
 *    slotlar soni turga qarab o'zgaradi.
 *
 * ⚠️ Oqim **savatli**: bitta buyurtmada bir nechta pozitsiya (3.9).
 */

import { olchamTekshir } from './bot';
import { BiznesXato } from '@/lib/xato';

// ─── Qadamlar ─────────────────────────────────────────────────────────────

export const OQIM_QADAMLARI = [
  'TUR_TANLASH',
  'SLOT_MATO',
  'ENI',
  'BOYI',
  'AKSESSUAR',
  'IZOH',
  'SAVAT',
] as const;

export type OqimQadami = (typeof OQIM_QADAMLARI)[number];

// ─── Qoralama ─────────────────────────────────────────────────────────────

export interface SlotQoralama {
  readonly slotId: number;
  readonly nom: string;
  /** Hali tanlanmagan bo'lsa `null` */
  readonly materialId: number | null;
}

export interface PozitsiyaQoralama {
  readonly mahsulotTurId: number;
  readonly turNomi: string;
  readonly slotlar: readonly SlotQoralama[];
  readonly eniSm: number | null;
  readonly boyiSm: number | null;
  readonly aksessuarlar: readonly number[];
  readonly izoh: string | null;
}

export interface Qoralama {
  /** Yig'ilayotgan pozitsiya — savatga qo'shilgach `null` bo'ladi */
  readonly joriy: PozitsiyaQoralama | null;
  readonly savat: readonly PozitsiyaQoralama[];
}

export const BOSH_QORALAMA: Qoralama = { joriy: null, savat: [] };

// ─── Qadam aniqlash ───────────────────────────────────────────────────────

/**
 * TZ 13.4 — keyingi qadam qoralamaning O'ZIDAN chiqadi.
 *
 * ⚠️ Qadam alohida saqlanmaydi. Sabab: qadam va ma'lumot ikki joyda
 *    tursa ular bir-biriga zid bo'lib qolishi mumkin — masalan qadam
 *    «ENI», lekin tur hali tanlanmagan. Bitta manba — qoralamaning
 *    o'zi.
 */
export function keyingiQadam(q: Qoralama): OqimQadami {
  const p = q.joriy;
  if (p === null) return q.savat.length > 0 ? 'SAVAT' : 'TUR_TANLASH';

  // 13.4 — har SLOT uchun mato tanlanadi
  if (p.slotlar.some((s) => s.materialId === null)) return 'SLOT_MATO';

  if (p.eniSm === null) return 'ENI';
  if (p.boyiSm === null) return 'BOYI';
  if (p.izoh === null) return 'AKSESSUAR';

  return 'SAVAT';
}

/** Hozir qaysi slot to'ldirilmoqda. */
export function joriySlot(q: Qoralama): SlotQoralama | null {
  return q.joriy?.slotlar.find((s) => s.materialId === null) ?? null;
}

// ─── Qadamlar ─────────────────────────────────────────────────────────────

/** 13.4, 1-qadam — mahsulot turi tanlandi. */
export function turTanla(
  q: Qoralama,
  tur: { readonly id: number; readonly nom: string },
  slotlar: readonly { readonly id: number; readonly nom: string }[],
): Qoralama {
  return {
    ...q,
    joriy: {
      mahsulotTurId: tur.id,
      turNomi: tur.nom,
      slotlar: slotlar.map((s) => ({
        slotId: s.id,
        nom: s.nom,
        materialId: null,
      })),
      eniSm: null,
      boyiSm: null,
      aksessuarlar: [],
      izoh: null,
    },
  };
}

/** 13.4, 2-qadam — slotga mato tanlandi. */
export function matoTanla(
  q: Qoralama,
  slotId: number,
  materialId: number,
): Qoralama {
  if (q.joriy === null) throw new BiznesXato('BOT_OQIM_BUZUQ', 'tur tanlanmagan');

  return {
    ...q,
    joriy: {
      ...q.joriy,
      slotlar: q.joriy.slotlar.map((s) =>
        s.slotId === slotId ? { ...s, materialId } : s,
      ),
    },
  };
}

/**
 * 13.4, 3–4-qadam — o'lcham.
 *
 * ⚠️ Tekshiruv `olchamTekshir` da — bir mantiq bir joyda (§2.2).
 */
export function olchamQoy(q: Qoralama, matn: string, qaysi: 'ENI' | 'BOYI'): Qoralama {
  if (q.joriy === null) throw new BiznesXato('BOT_OQIM_BUZUQ', 'tur tanlanmagan');

  const qiymat = Number(olchamTekshir(matn));

  return {
    ...q,
    joriy:
      qaysi === 'ENI'
        ? { ...q.joriy, eniSm: qiymat }
        : { ...q.joriy, boyiSm: qiymat },
  };
}

/** 13.4, 5-qadam — ixtiyoriy aksessuar qo'shildi yoki olib tashlandi. */
export function aksessuarAlmash(q: Qoralama, materialId: number): Qoralama {
  if (q.joriy === null) throw new BiznesXato('BOT_OQIM_BUZUQ', 'tur tanlanmagan');

  const bor = q.joriy.aksessuarlar.includes(materialId);

  return {
    ...q,
    joriy: {
      ...q.joriy,
      aksessuarlar: bor
        ? q.joriy.aksessuarlar.filter((x) => x !== materialId)
        : [...q.joriy.aksessuarlar, materialId],
    },
  };
}

/**
 * 13.4, 6-qadam — xona yoki izoh. Ixtiyoriy.
 *
 * ⚠️ «O'tkazish» bosilsa bo'sh MATN yoziladi, `null` emas: `null`
 *    «hali so'ralmagan» degani va oqim shu qadamda qotib qolardi.
 */
export function izohQoy(q: Qoralama, izoh: string): Qoralama {
  if (q.joriy === null) throw new BiznesXato('BOT_OQIM_BUZUQ', 'tur tanlanmagan');
  return { ...q, joriy: { ...q.joriy, izoh: izoh.trim() } };
}

/**
 * 13.4, 7-qadam — savatga qo'shiladi.
 *
 * ⚠️ To'ldirilmagan pozitsiya savatga TUSHMAYDI: aks holda buyurtma
 *    matosiz yoki o'lchamsiz yozilardi.
 */
export function savatgaQosh(q: Qoralama): Qoralama {
  const p = q.joriy;
  if (p === null) throw new BiznesXato('BOT_OQIM_BUZUQ', 'pozitsiya yo‘q');

  if (
    p.slotlar.some((s) => s.materialId === null) ||
    p.eniSm === null ||
    p.boyiSm === null
  ) {
    throw new BiznesXato('BOT_OQIM_TOLIQ_EMAS');
  }

  return { joriy: null, savat: [...q.savat, p] };
}

/**
 * 13.4 — «"Orqaga" — bir bosqich orqaga.»
 *
 * ⚠️ Eng oxirgi to'ldirilgan maydon tozalanadi, chunki qadam
 *    qoralamadan chiqadi. Boshida bo'lsa qoralama bekor bo'ladi.
 */
export function orqaga(q: Qoralama): Qoralama {
  const p = q.joriy;
  if (p === null) return q;

  if (p.izoh !== null) return { ...q, joriy: { ...p, izoh: null } };
  if (p.boyiSm !== null) return { ...q, joriy: { ...p, boyiSm: null } };
  if (p.eniSm !== null) return { ...q, joriy: { ...p, eniSm: null } };

  // Oxirgi to'ldirilgan slot tozalanadi
  const toldirilgan = [...p.slotlar].reverse().find((s) => s.materialId !== null);
  if (toldirilgan !== undefined) {
    return {
      ...q,
      joriy: {
        ...p,
        slotlar: p.slotlar.map((s) =>
          s.slotId === toldirilgan.slotId ? { ...s, materialId: null } : s,
        ),
      },
    };
  }

  // Hech narsa to'ldirilmagan — turni qaytadan tanlaydi
  return { ...q, joriy: null };
}

/** 13.4 — «"Bekor qilish" — butun savat tozalanadi.» */
export function bekorQil(): Qoralama {
  return BOSH_QORALAMA;
}

// ─── Saqlash va o'qish ────────────────────────────────────────────────────

/**
 * Sessiyadagi `jsonb` dan qoralamani tiklaydi.
 *
 * ⚠️ Bazadagi qiymatga ISHONILMAYDI: sessiya eski tuzilmada saqlangan
 *    bo'lishi mumkin (bot yangilangan). Tanib bo'lmasa bo'sh
 *    qoralama qaytadi — foydalanuvchi boshidan boshlaydi, lekin bot
 *    yiqilmaydi.
 */
export function qoralamaOqi(xom: unknown): Qoralama {
  if (typeof xom !== 'object' || xom === null) return BOSH_QORALAMA;

  const x = xom as Record<string, unknown>;
  const savat = Array.isArray(x.savat) ? x.savat : [];

  return {
    joriy: pozitsiyaOqi(x.joriy),
    savat: savat
      .map((p) => pozitsiyaOqi(p))
      .filter((p): p is PozitsiyaQoralama => p !== null),
  };
}

function pozitsiyaOqi(xom: unknown): PozitsiyaQoralama | null {
  if (typeof xom !== 'object' || xom === null) return null;

  const p = xom as Record<string, unknown>;
  if (typeof p.mahsulotTurId !== 'number') return null;

  const slotlar = Array.isArray(p.slotlar) ? p.slotlar : [];

  return {
    mahsulotTurId: p.mahsulotTurId,
    turNomi: typeof p.turNomi === 'string' ? p.turNomi : '',
    slotlar: slotlar
      .map((s: unknown) => {
        if (typeof s !== 'object' || s === null) return null;
        const q = s as Record<string, unknown>;
        if (typeof q.slotId !== 'number') return null;
        return {
          slotId: q.slotId,
          nom: typeof q.nom === 'string' ? q.nom : '',
          materialId: typeof q.materialId === 'number' ? q.materialId : null,
        };
      })
      .filter((s): s is SlotQoralama => s !== null),
    eniSm: typeof p.eniSm === 'number' ? p.eniSm : null,
    boyiSm: typeof p.boyiSm === 'number' ? p.boyiSm : null,
    aksessuarlar: Array.isArray(p.aksessuarlar)
      ? p.aksessuarlar.filter((a: unknown): a is number => typeof a === 'number')
      : [],
    izoh: typeof p.izoh === 'string' ? p.izoh : null,
  };
}
