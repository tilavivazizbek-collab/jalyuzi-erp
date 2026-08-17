/**
 * lib/amal/kirish.ts — QISM 1 §8 · Q-04 · TZ 2.4
 *
 * Kirish, sessiya tekshiruvi va chiqish. Bularning har biri bazaga bir necha
 * yozuv qiladi, shuning uchun tranzaksiyada bajariladi (§7.1 ruhi).
 *
 * Qoidalar:
 *   · telefon + parol, `argon2id`
 *   · 5 xato urinish → 15 daqiqa blok
 *   · usta saytga UMUMAN kirmaydi (Q-04 qattiq qoidasi)
 *   · sessiya bazada, 30 kun, surilma muddat
 *   · bir foydalanuvchi bir necha qurilmada
 */

import type postgres from 'postgres';
import {
  BOSHLANGICH,
  blokQoldiqDaqiqa,
  bloklanganmi,
  muvaffaqiyatdanKeyin,
  xatodanKeyin,
  type BlokHolati,
} from '@/lib/kirish/blok';
import { parolHash, parolTogrimi } from '@/lib/kirish/parol';
import {
  sessiyaYarat,
  sessiyaYaroqlimi,
  tokenHash,
  uzaytirilsinmi,
  yangiMuddat,
} from '@/lib/kirish/sessiya';
import { saytgaKiraOladimi, type Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import { foydalanuvchiniOl } from '@/lib/amal/foydalanuvchi';

export type KirishNatijasi =
  | { readonly holat: 'OK'; readonly token: string; readonly amalQiladi: Date; readonly xodimId: number }
  | { readonly holat: 'NOTOGRI' }
  | { readonly holat: 'BLOKLANGAN'; readonly qolganDaqiqa: number }
  | { readonly holat: 'USTA_SAYTGA_KIRMAYDI' };

export interface KirishKirishi {
  readonly telefon: string;
  readonly parol: string;
  readonly ip?: string | null;
  readonly qurilma?: string | null;
}

interface XodimQatori {
  readonly id: number;
  readonly parol_hash: string | null;
  readonly xato_urinish: number;
  readonly bloklangan: Date | null;
}

/**
 * Telefon topilmaganda ham parol tekshirish vaqti sarflanadi.
 *
 * Aks holda javob vaqti telefon bazada bor-yo'qligini oshkor qiladi:
 * mavjud raqamda argon2 ~50 ms, mavjud emasda ~0 ms.
 */
let soxtaHash: string | null = null;
async function vaqtniTenglashtir(parol: string): Promise<void> {
  soxtaHash ??= await parolHash('soxta-parol-vaqt-uchun');
  await parolTogrimi(soxtaHash, parol);
}

export async function kir(
  ulanish: postgres.Sql,
  kirish: KirishKirishi,
  hozir: Date = new Date(),
): Promise<KirishNatijasi> {
  const telefon = kirish.telefon.trim();

  return ulanish.begin(async (tx) => {
    // Hisoblagich poygaga tushmasligi uchun qator qulflanadi
    const topilgan = await tx<XodimQatori[]>`
      SELECT id, parol_hash, xato_urinish, bloklangan
      FROM xodim
      WHERE telefon = ${telefon} AND faol = true
      FOR UPDATE`;

    const xodim = topilgan[0];

    if (xodim === undefined || xodim.parol_hash === null) {
      // parol_hash NULL — usta (Q-04): saytga kirish yo'li yo'q
      await vaqtniTenglashtir(kirish.parol);
      return { holat: 'NOTOGRI' } as const;
    }

    const holat: BlokHolati = {
      xatoUrinish: xodim.xato_urinish,
      bloklangan: xodim.bloklangan,
    };

    if (bloklanganmi(holat, hozir)) {
      return { holat: 'BLOKLANGAN', qolganDaqiqa: blokQoldiqDaqiqa(holat, hozir) } as const;
    }

    const togrimi = await parolTogrimi(xodim.parol_hash, kirish.parol);

    if (!togrimi) {
      const yangi = xatodanKeyin(holat, hozir);
      await tx`
        UPDATE xodim
        SET xato_urinish = ${yangi.xatoUrinish}, bloklangan = ${yangi.bloklangan}
        WHERE id = ${xodim.id}`;

      if (yangi.bloklangan !== null && holat.bloklangan === null) {
        await tx`
          INSERT INTO audit_jurnal (xodim_id, amal, obyekt_turi, obyekt_id, izoh, ip)
          VALUES (${xodim.id}, 'KIRISH_BLOKLANDI', 'xodim', ${xodim.id},
                  '5 marta xato parol', ${kirish.ip ?? null})`;
      }

      return { holat: 'NOTOGRI' } as const;
    }

    // Parol to'g'ri — endi rol tekshiriladi (Q-04 qattiq qoidasi)
    const foydalanuvchi = await foydalanuvchiOlTx(tx, xodim.id);
    if (foydalanuvchi !== null && !saytgaKiraOladimi(foydalanuvchi)) {
      return { holat: 'USTA_SAYTGA_KIRMAYDI' } as const;
    }

    const toza = muvaffaqiyatdanKeyin();
    await tx`
      UPDATE xodim
      SET xato_urinish = ${toza.xatoUrinish}, bloklangan = ${toza.bloklangan}
      WHERE id = ${xodim.id}`;

    const sessiya = sessiyaYarat(hozir);
    await tx`
      INSERT INTO sessiya (xodim_id, token_hash, amal_qiladi, ip, qurilma, yaratdi_id)
      VALUES (${xodim.id}, ${sessiya.tokenHash}, ${sessiya.amalQiladi},
              ${kirish.ip ?? null}, ${kirish.qurilma ?? null}, ${xodim.id})`;

    return {
      holat: 'OK',
      token: sessiya.token,
      amalQiladi: sessiya.amalQiladi,
      xodimId: xodim.id,
    } as const;
  });
}

/** Tranzaksiya ichidagi nusxa — `foydalanuvchiniOl` bilan bir xil so'rov. */
async function foydalanuvchiOlTx(
  tx: postgres.TransactionSql,
  xodimId: number,
): Promise<Foydalanuvchi | null> {
  return foydalanuvchiniOl(tx as unknown as postgres.Sql, xodimId);
}

// ─── Sessiya tekshiruvi ───────────────────────────────────────────────────

export interface SessiyaNatijasi {
  readonly foydalanuvchi: Foydalanuvchi;
  /** Muddat surilgan bo'lsa cookie yangilanadi */
  readonly yangiMuddat: Date | null;
}

/**
 * Har so'rovda chaqiriladi. Sessiya yaroqli bo'lsa foydalanuvchini
 * rollari bilan qaytaradi.
 *
 * Muddat P-11 bo'yicha soatiga bir marta suriladi — har so'rovda emas.
 */
export async function sessiyaniTekshir(
  ulanish: postgres.Sql,
  token: string,
  hozir: Date = new Date(),
): Promise<SessiyaNatijasi | null> {
  const hash = tokenHash(token);

  const qatorlar = await ulanish<
    { id: number; xodim_id: number; amal_qiladi: Date; bekor_qilindi: Date | null }[]
  >`
    SELECT id, xodim_id, amal_qiladi, bekor_qilindi
    FROM sessiya WHERE token_hash = ${hash}`;

  const s = qatorlar[0];
  if (s === undefined) return null;

  const holat = { amalQiladi: s.amal_qiladi, bekorQilindi: s.bekor_qilindi };
  if (!sessiyaYaroqlimi(holat, hozir)) return null;

  const foydalanuvchi = await foydalanuvchiniOl(ulanish, s.xodim_id);
  if (foydalanuvchi === null) return null;

  // Rol keyin o'zgargan bo'lishi mumkin — qattiq qoida har so'rovda tekshiriladi
  if (!saytgaKiraOladimi(foydalanuvchi)) return null;

  let yangi: Date | null = null;
  if (uzaytirilsinmi(holat, hozir)) {
    yangi = yangiMuddat(hozir);
    await ulanish`UPDATE sessiya SET amal_qiladi = ${yangi} WHERE id = ${s.id}`;
  }

  return { foydalanuvchi, yangiMuddat: yangi };
}

/** Chiqish — sessiya DARHOL bekor qilinadi (§8). */
export async function chiq(ulanish: postgres.Sql, token: string, hozir: Date = new Date()): Promise<void> {
  await ulanish`
    UPDATE sessiya SET bekor_qilindi = ${hozir}
    WHERE token_hash = ${tokenHash(token)} AND bekor_qilindi IS NULL`;
}

/** Xodimning BARCHA sessiyalarini bekor qiladi — parol o'zgarganda. */
export async function hammaSessiyaniBekorQil(
  ulanish: postgres.Sql,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<void> {
  await ulanish`
    UPDATE sessiya SET bekor_qilindi = ${hozir}
    WHERE xodim_id = ${xodimId} AND bekor_qilindi IS NULL`;
}

export { BOSHLANGICH };
