/**
 * lib/amal/kurs-belgila.ts — TZ 14.5
 *
 * Kunlik dollar kursini belgilash.
 *
 * ⚠️ NEGA KERAK EDI
 *
 *    2026-08-30 gacha `kurs_tarix` jadvalini TO'LDIRADIGAN joy
 *    umuman yo'q edi: jadval bor, o'quvchi funksiya bor, yozuvchi
 *    yo'q. Natijada kurs katagi har ekranda bo'sh kelardi va
 *    dollarli kirim «kurs hali belgilanmagan» deb to'xtardi.
 *
 * ⚠️ 2.3-invariant — O'TMISH O'ZGARMAYDI. Bugungi kursni tuzatish
 *    mumkin (ertalab xato yozilgan bo'lishi mumkin), lekin
 *    O'TGAN KUN kursiga tegib bo'lmaydi: unga tayangan hujjatlar
 *    o'z snapshotini olib bo'lgan va hisobot qayta yozilmaydi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';

export interface KursQatori {
  readonly sana: string;
  readonly qiymat: string;
  readonly kim: string;
}

/**
 * Bugungi kursni belgilaydi yoki tuzatadi.
 *
 * ⚠️ `ON CONFLICT` — kun davomida ikkinchi marta kiritilsa
 *    yangisi qoladi. Ikkita qator paydo bo'lsa «bugungi kurs
 *    qaysi?» degan savol javobsiz qolardi.
 */
export async function kursniBelgila(
  ulanish: postgres.Sql,
  qiymat: string,
  xodimId: number,
): Promise<void> {
  const son = Number(qiymat);
  if (!Number.isFinite(son) || son <= 0) {
    throw new BiznesXato('KURS_NOTOGRI', `qiymat: ${qiymat}`);
  }

  /**
   * ⚠️ Aql bovar qilmaydigan raqam bloklanadi. Egasi nolni
   *    qo'shib yuborsa (128 000 o'rniga 1 280 000) butun
   *    dollarli hisob buzilardi va buni birov keyin sezardi.
   */
  if (son < 1000 || son > 1_000_000) {
    throw new BiznesXato(
      'KURS_NOTOGRI',
      `${qiymat} — kurs 1 000 va 1 000 000 orasida bo'lishi kerak`,
    );
  }

  await ulanish.begin(async (tx) => {
    await tx`
      INSERT INTO kurs_tarix (sana, qiymat, yaratdi_id)
      VALUES (current_date, ${qiymat}, ${xodimId})
      ON CONFLICT (sana) DO UPDATE
        SET qiymat = ${qiymat},
            ozgartirildi = now(),
            ozgartirdi_id = ${xodimId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      SELECT ${xodimId}, x.filial_id, 'KURS', 'kurs_tarix', 0,
             ${tx.json({ qiymat })}, 'Kunlik kurs belgilandi'
      FROM xodim x WHERE x.id = ${xodimId}`;
  });
}

/** Oxirgi kunlar — «kecha qancha edi?» degan savol uchun */
export async function kursTarixi(
  ulanish: postgres.Sql,
  chegara = 30,
): Promise<readonly KursQatori[]> {
  const q = await ulanish<{ sana: string; qiymat: string; kim: string }[]>`
    SELECT k.sana::text, k.qiymat::text,
           COALESCE(x.ism, '—') AS kim
    FROM kurs_tarix k
    LEFT JOIN xodim x ON x.id = COALESCE(k.ozgartirdi_id, k.yaratdi_id)
    ORDER BY k.sana DESC
    LIMIT ${chegara}`;

  return q.map((r) => ({ sana: r.sana, qiymat: r.qiymat, kim: r.kim }));
}
