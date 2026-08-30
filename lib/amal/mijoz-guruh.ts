/**
 * lib/amal/mijoz-guruh.ts — TZ 6.3
 *
 * Mijoz guruhi: ulgurji, doimiy, VIP.
 *
 * ⚠️ Guruh — CHEGIRMA SAQLAYDIGAN joy. Uning foizini o'zgartirish
 *    o'sha guruhdagi hamma mijozning narxini o'zgartiradi.
 *    Shuning uchun nom bo'yicha dublikat qat'iy to'siladi:
 *    «Ulgurji» va «ulgurji» ikkita bo'lib qolsa, bir qismi
 *    birinchisida, bir qismi ikkinchisida qolib ketardi.
 *
 * ⚠️ ESKI BUYURTMAGA TEGMAYDI. Chegirma buyurtma tuzilayotganda
 *    narxga qo'llanadi va o'sha yerda qotadi (2.3-invariant).
 *    Guruh foizini bugun o'zgartirsangiz, o'tgan haftagi
 *    buyurtma o'zgarmaydi.
 */

import type postgres from 'postgres';
import type { MijozGuruhKirimi } from '@/lib/sxema/mijoz-guruh';
import { BiznesXato } from '@/lib/xato';

const yoNull = (x: string | undefined): string | null => x ?? null;

/** Bir xil nomli faol guruh bormi (o'zidan boshqa) */
/**
 * Nom bandmi va u O'CHIRILGAN yozuvdami.
 *
 * ⚠️ O'chirilgan guruh nomi ham band turadi (yagonalik cheklovi
 *    faol/nofaolni ajratmaydi). Buni aytmasak, egasi «bunday
 *    guruh yo'q-ku» deb hayron bo'lardi (2026-08-30).
 */
async function nomBandmi(
  tx: postgres.TransactionSql,
  nom: string,
  ozId: number | null,
): Promise<'BOSH' | 'FAOL' | 'OCHIRILGAN'> {
  const q = await tx<{ faol: boolean }[]>`
    SELECT faol FROM mijoz_guruh
    WHERE lower(btrim(nom)) = lower(btrim(${nom}))
      AND (${ozId}::bigint IS NULL OR id <> ${ozId})
    LIMIT 1`;

  const b = q[0];
  if (b === undefined) return 'BOSH';
  return b.faol ? 'FAOL' : 'OCHIRILGAN';
}

export async function mijozGuruhYarat(
  ulanish: postgres.Sql,
  kirim: MijozGuruhKirimi,
  xodimId: number,
): Promise<{ readonly id: number; readonly nom: string }> {
  return ulanish.begin(async (tx) => {
    const band = await nomBandmi(tx, kirim.nom, null);
    if (band === 'FAOL') {
      throw new BiznesXato('MIJOZ_GURUH_BOR', `«${kirim.nom}» nomli guruh allaqachon bor`);
    }
    if (band === 'OCHIRILGAN') {
      throw new BiznesXato(
        'OCHIRILGANDA_BAND',
        `«${kirim.nom}» nomli guruh o'chirilgan. Uni «O'chirilganlar» dan qaytaring ` +
          `yoki boshqa nom tanlang.`,
      );
    }

    const q = await tx<{ id: number }[]>`
      INSERT INTO mijoz_guruh (nom, offset_turi, offset_qiymat, izoh, yaratdi_id)
      VALUES (${kirim.nom}, ${yoNull(kirim.offsetTuri)},
              ${yoNull(kirim.offsetQiymat)}, ${yoNull(kirim.izoh)}, ${xodimId})
      RETURNING id`;

    const id = q[0]?.id;
    if (id === undefined) throw new BiznesXato('MIJOZ_GURUH_SAQLANMADI');
    return { id, nom: kirim.nom };
  });
}

export async function mijozGuruhTahrirla(
  ulanish: postgres.Sql,
  guruhId: number,
  kirim: MijozGuruhKirimi,
  xodimId: number,
): Promise<{ readonly id: number; readonly nom: string }> {
  return ulanish.begin(async (tx) => {
    /** ⚠️ Qulflanadi: ikki odam bir vaqtda tahrirlasa ham nom tekshiruvi to'g'ri ishlaydi */
    const bor = await tx<{ id: number }[]>`
      SELECT id FROM mijoz_guruh WHERE id = ${guruhId} FOR UPDATE`;
    if (bor[0] === undefined) throw new BiznesXato('MIJOZ_GURUH_TOPILMADI', String(guruhId));

    const band = await nomBandmi(tx, kirim.nom, guruhId);
    if (band === 'FAOL') {
      throw new BiznesXato('MIJOZ_GURUH_BOR', `«${kirim.nom}» nomli guruh allaqachon bor`);
    }
    if (band === 'OCHIRILGAN') {
      throw new BiznesXato(
        'OCHIRILGANDA_BAND',
        `«${kirim.nom}» nomli guruh o'chirilgan — bu nomni olib bo'lmaydi.`,
      );
    }

    await tx`
      UPDATE mijoz_guruh SET
        nom = ${kirim.nom},
        offset_turi = ${yoNull(kirim.offsetTuri)},
        offset_qiymat = ${yoNull(kirim.offsetQiymat)},
        izoh = ${yoNull(kirim.izoh)},
        ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${guruhId}`;

    return { id: guruhId, nom: kirim.nom };
  });
}
