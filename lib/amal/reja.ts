/**
 * lib/amal/reja.ts — TZ 21 · Rejalar: saqlash va nusxa. 2026-10-13
 *
 * ⚠️ 21.4 — reja oy boshlangandan keyin ham o'zgaradi, lekin: har
 *    o'zgarish AUDIT jurnaliga eski qiymat va SABAB bilan tushadi,
 *    qatorga `oy_ichida_ozgardi` belgisi qo'yiladi. «Oy oxirida rejani
 *    tushirib "bajardik" deyish» hisobotda ko'rinib turadi.
 * ⚠️ Ekran hamma qatorni BIR tranzaksiyada saqlaydi — yarim saqlangan
 *    reja (korxona yangi, filiallar eski) bo'lmaydi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';
import { foizQosh, oyQosh, type RejaTuri } from '@/lib/domain/reja';
import { toshkentKuni } from '@/lib/domain/sana';

export interface RejaQatori {
  readonly turi: RejaTuri;
  readonly filialId: number | null;
  readonly xodimId: number | null;
  /** So'mda; bo'sh — reja yo'q */
  readonly tushum: string | null;
  readonly foyda: string | null;
}

const bosh = (s: string | null): string | null => (s === null || s.trim() === '' ? null : s.trim());

const teng = (a: string | null, b: string | null): boolean =>
  a === null || b === null ? a === b : new Decimal(a).eq(b);

/**
 * Bir oyning rejalarini saqlaydi (yangi qo'shadi, o'zgarganini yangilaydi).
 *
 * @param sabab oy boshlangan bo'lsa va mavjud reja o'zgarsa — MAJBURIY
 * @returns nechta qator qo'shildi / o'zgardi
 */
export async function rejalarniSaqla(
  ulanish: postgres.Sql,
  k: { readonly oy: string; readonly qatorlar: readonly RejaQatori[]; readonly sabab: string | null },
  xodimId: number,
  bugun: string = toshkentKuni(),
): Promise<{ qoshildi: number; ozgardi: number }> {
  if (!/^\d{4}-\d{2}-01$/.test(k.oy)) throw new BiznesXato('REJA_OY_NOTOGRI', k.oy);
  const oyBoshlangan = bugun >= k.oy;
  const sabab = bosh(k.sabab);

  return ulanish.begin(async (tx) => {
    let qoshildi = 0;
    let ozgardi = 0;

    for (const q of k.qatorlar) {
      const tushum = bosh(q.tushum);
      const foyda = bosh(q.foyda);
      if ([tushum, foyda].some((x) => x !== null && new Decimal(x).isNegative())) {
        throw new BiznesXato('REJA_MANFIY');
      }
      if (q.turi === 'SOTUVCHI') {
        if (foyda !== null) throw new BiznesXato('REJA_SOTUVCHI_FOYDA');
        // EC-REJ-03 — reja sotuvchi HOZIR ishlayotgan filialga qo'yiladi
        const x = await tx<{ filial_id: number }[]>`SELECT filial_id FROM xodim WHERE id = ${q.xodimId}`;
        if (x[0]?.filial_id !== q.filialId) throw new BiznesXato('REJA_SOTUVCHI_FILIALI', String(q.xodimId));
      }

      const bor = await tx<{ id: number; tushum: string | null; foyda: string | null }[]>`
        SELECT id, tushum::text, foyda::text FROM reja
        WHERE oy = ${k.oy} AND turi = ${q.turi}
          AND COALESCE(filial_id, 0) = ${q.filialId ?? 0}
          AND COALESCE(xodim_id, 0) = ${q.xodimId ?? 0}
        FOR UPDATE`;
      const eski = bor[0];

      if (eski === undefined) {
        if (tushum === null && foyda === null) continue;
        const yangi = await tx<{ id: number }[]>`
          INSERT INTO reja (oy, turi, filial_id, xodim_id, tushum, foyda, yaratdi_id)
          VALUES (${k.oy}, ${q.turi}, ${q.filialId}, ${q.xodimId}, ${tushum}, ${foyda}, ${xodimId})
          RETURNING id`;
        await tx`
          INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id, yangi_qiymat, izoh)
          VALUES (${xodimId}, ${q.filialId}, 'REJA_QOYILDI', 'reja', ${yangi[0]?.id ?? 0},
                  ${tx.json({ oy: k.oy, turi: q.turi, xodim_id: q.xodimId, tushum, foyda })}, ${sabab})`;
        qoshildi += 1;
        continue;
      }

      if (teng(eski.tushum, tushum) && teng(eski.foyda, foyda)) continue;
      if (oyBoshlangan && sabab === null) throw new BiznesXato('REJA_SABAB_KERAK', k.oy);

      await tx`
        UPDATE reja SET tushum = ${tushum}, foyda = ${foyda},
                        oy_ichida_ozgardi = oy_ichida_ozgardi OR ${oyBoshlangan},
                        ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE id = ${eski.id}`;
      await tx`
        INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                  eski_qiymat, yangi_qiymat, izoh)
        VALUES (${xodimId}, ${q.filialId}, 'REJA_OZGARDI', 'reja', ${eski.id},
                ${tx.json({ tushum: eski.tushum, foyda: eski.foyda })},
                ${tx.json({ oy: k.oy, turi: q.turi, xodim_id: q.xodimId, tushum, foyda, oy_ichida: oyBoshlangan })},
                ${sabab})`;
      ozgardi += 1;
    }
    return { qoshildi, ozgardi };
  });
}

/**
 * TZ 21.3.2 — «O'tgan oydan nusxa [+N %]». Faqat shu oyda HALI YO'Q
 * qatorlar ko'chiriladi — qo'yilgan reja ustidan yozilmaydi.
 * Ishdan ketgan sotuvchi yoki boshqa filialga ko'chgani (EC-REJ-03) —
 * ko'chirilmaydi.
 */
export async function otganOydanNusxa(
  ulanish: postgres.Sql,
  k: { readonly oy: string; readonly foiz: string },
  xodimId: number,
): Promise<{ qoshildi: number }> {
  const oldin = oyQosh(k.oy, -1);
  const eski = await ulanish<
    { turi: RejaTuri; filial_id: number | null; xodim_id: number | null; tushum: string | null; foyda: string | null }[]
  >`
    SELECT r.turi, r.filial_id, r.xodim_id, r.tushum::text, r.foyda::text
    FROM reja r
    LEFT JOIN xodim x ON x.id = r.xodim_id
    WHERE r.oy = ${oldin}
      AND (r.turi <> 'SOTUVCHI' OR (x.faol AND x.filial_id = r.filial_id))
      -- Shu oyda qo'yilgani USTIDAN yozilmaydi
      AND NOT EXISTS (
        SELECT 1 FROM reja y
        WHERE y.oy = ${k.oy} AND y.turi = r.turi
          AND COALESCE(y.filial_id, 0) = COALESCE(r.filial_id, 0)
          AND COALESCE(y.xodim_id, 0) = COALESCE(r.xodim_id, 0))`;

  const r = await rejalarniSaqla(
    ulanish,
    {
      oy: k.oy,
      sabab: `O'tgan oydan nusxa (${k.foiz}%)`,
      qatorlar: eski.map((q) => ({
        turi: q.turi,
        filialId: q.filial_id,
        xodimId: q.xodim_id,
        tushum: foizQosh(q.tushum, k.foiz),
        foyda: foizQosh(q.foyda, k.foiz),
      })),
    },
    xodimId,
  );
  return { qoshildi: r.qoshildi };
}
