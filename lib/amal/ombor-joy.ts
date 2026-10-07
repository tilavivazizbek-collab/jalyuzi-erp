/**
 * lib/amal/ombor-joy.ts — saqlash joyi (0062). Ombor auditi 2026-10-07.
 *
 * ⚠️ PUL YO'Q. Joy bo'lakning qiymatiga ham, qoldiqqa ham tegmaydi —
 *    faqat «qayerda turibdi» degan belgi. Shuning uchun `bolak.joy_id`
 *    ni yangilash ruxsat etilgan (harakat jadvali emas). Har o'zgarish
 *    audit jurnaliga tushadi — kim, qachon, qayerdan qayerga.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';

const toza = (x: string): string => x.trim().replace(/\s+/g, ' ');

export async function joyQosh(
  ulanish: postgres.Sql,
  k: { readonly filialId: number; readonly nom: string; readonly izoh: string | null },
  xodimId: number,
): Promise<number> {
  const nom = toza(k.nom);
  if (nom === '') throw new BiznesXato('JOY_NOMI_BOSH', 'Joy nomini kiriting');
  if (nom.length > 50) throw new BiznesXato('JOY_NOMI_BOSH', 'Joy nomi 50 belgidan oshmasin');

  return ulanish.begin(async (tx) => {
    const bor = await tx<{ id: number }[]>`
      SELECT id FROM ombor_joy
      WHERE filial_id = ${k.filialId} AND faol AND lower(trim(nom)) = lower(${nom})`;
    if (bor[0] !== undefined) throw new BiznesXato('JOY_TAKROR', nom);

    const q = await tx<{ id: number }[]>`
      INSERT INTO ombor_joy (filial_id, nom, izoh, yaratdi_id)
      VALUES (${k.filialId}, ${nom},
              ${k.izoh === null || k.izoh.trim() === '' ? null : k.izoh.trim()}, ${xodimId})
      RETURNING id`;
    const id = q[0]?.id;
    if (id === undefined) throw new BiznesXato('JOY_TOPILMADI');
    return id;
  });
}

/**
 * Joyni nofaol qilish (`DELETE` yo'q — §3).
 *
 * ⚠️ Ichida bo'lak turgan joy o'chirilmaydi: rulon «hech qayerda» bo'lib
 *    qolardi, ekranda esa o'chirilgan joy nomi chiqardi.
 */
export async function joyNofaol(
  ulanish: postgres.Sql,
  joyId: number,
  filialId: number,
  xodimId: number,
): Promise<void> {
  await ulanish.begin(async (tx) => {
    const ichida = await tx<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bolak
      WHERE joy_id = ${joyId} AND faol AND holat IN ('BOSH', 'BAND', 'YOLDA')`;
    const n = ichida[0]?.n ?? 0;
    if (n > 0) throw new BiznesXato('JOY_BAND', `${String(n)} ta bo'lak turibdi`);

    const q = await tx<{ id: number }[]>`
      UPDATE ombor_joy
         SET faol = false, ochirildi = now(), ozgartirildi = now(), ozgartirdi_id = ${xodimId}
       WHERE id = ${joyId} AND filial_id = ${filialId} AND faol
      RETURNING id`;
    if (q[0] === undefined) throw new BiznesXato('JOY_TOPILMADI', String(joyId));
  });
}

/**
 * Bo'laklarni joyga qo'yish (bitta yoki bir nechta). `joyId = null` —
 * joyini olib tashlash.
 *
 * ⚠️ Faqat O'Z FILIALI: boshqa filialning bo'lagi yoki joyi — xato.
 * ⚠️ Ishlatilgan, brak va chiqindi bo'lak joyga qo'yilmaydi — u omborda yo'q.
 *
 * @returns yangilangan bo'laklar soni
 */
export async function bolakJoyiniOzgartir(
  ulanish: postgres.Sql,
  k: {
    readonly bolakIdlar: readonly number[];
    readonly joyId: number | null;
    readonly filialId: number;
  },
  xodimId: number,
): Promise<number> {
  if (k.bolakIdlar.length === 0) return 0;

  return ulanish.begin(async (tx) => {
    let joyNomi: string | null = null;
    if (k.joyId !== null) {
      const j = await tx<{ nom: string }[]>`
        SELECT nom FROM ombor_joy
        WHERE id = ${k.joyId} AND filial_id = ${k.filialId} AND faol`;
      if (j[0] === undefined) throw new BiznesXato('JOY_TOPILMADI', String(k.joyId));
      joyNomi = j[0].nom;
    }

    const eski = await tx<{ id: number; kod: string; joy: string | null }[]>`
      SELECT b.id, b.kod, j.nom AS joy
      FROM bolak b
      LEFT JOIN ombor_joy j ON j.id = b.joy_id
      WHERE b.id = ANY(${k.bolakIdlar as number[]})
        AND b.filial_id = ${k.filialId} AND b.faol
        AND b.holat IN ('BOSH', 'BAND', 'YOLDA')
      FOR UPDATE OF b`;
    if (eski.length !== new Set(k.bolakIdlar).size) {
      throw new BiznesXato('BOLAK_TOPILMADI', "bo'lak bu filialda yo'q yoki omborda emas");
    }

    await tx`
      UPDATE bolak SET joy_id = ${k.joyId}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ANY(${k.bolakIdlar as number[]})`;

    for (const b of eski) {
      if (b.joy === joyNomi) continue;
      await tx`
        INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                  eski_qiymat, yangi_qiymat, izoh)
        VALUES (${xodimId}, ${k.filialId}, 'TAHRIRLASH', 'bolak', ${b.id},
                ${tx.json({ joy: b.joy })}, ${tx.json({ joy: joyNomi })},
                ${`${b.kod} joyi o'zgardi`})`;
    }
    return eski.length;
  });
}
