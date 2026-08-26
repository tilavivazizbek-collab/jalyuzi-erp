/**
 * lib/db/urug.ts — boshlang'ich ma'lumot
 *
 * Bir marta bajariladi: bosh filial, tizimli rollar, ruxsat spravochnigi,
 * boshlang'ich preset (Q-04) va birinchi admin.
 *
 * TAKRORLASH XAVFSIZ — hamma yozuv `ON CONFLICT DO NOTHING` bilan qo'yiladi.
 *
 * Ishga tushirish:  npm run db:urug
 */

import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { RUXSATLAR, RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';
import { ROL_URUGI } from '@/lib/ruxsat/urug';
import { parolHash } from '@/lib/kirish/parol';

const BOSH_FILIAL_ID = 1;
const ADMIN_ID = 1;

export interface UrugNatijasi {
  readonly filial: string;
  readonly adminTelefoni: string;
  /** Faqat BIRINCHI yaratilganda to'ladi — keyin hech qayerda saqlanmaydi */
  readonly parol: string | null;
  readonly rollar: number;
  readonly ruxsatlar: number;
}

/** O'qilishi oson, lekin taxmin qilib bo'lmaydigan parol. */
function parolYasa(): string {
  return randomBytes(12).toString('base64url');
}

export async function urugEk(
  ulanish: postgres.Sql,
  sozlama: { readonly adminIsmi: string; readonly adminTelefoni: string; readonly filialNomi: string },
): Promise<UrugNatijasi> {
  const bor = await ulanish<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM xodim`;
  const birinchiMarta = (bor[0]?.n ?? 0) === 0;

  const ochiqParol = birinchiMarta ? parolYasa() : null;
  const hash = ochiqParol === null ? null : await parolHash(ochiqParol);

  await ulanish.begin(async (tx) => {
    // filial.yaratdi_id → xodim va xodim.filial_id → filial halqasi uchun
    await tx`SET CONSTRAINTS ALL DEFERRED`;

    await tx`
      INSERT INTO filial (id, nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
      VALUES (${BOSH_FILIAL_ID}, ${sozlama.filialNomi}, true, true, true, ${ADMIN_ID})
      ON CONFLICT (id) DO NOTHING`;

    await tx`
      INSERT INTO xodim (id, filial_id, ism, telefon, parol_hash, yaratdi_id)
      VALUES (${ADMIN_ID}, ${BOSH_FILIAL_ID}, ${sozlama.adminIsmi},
              ${sozlama.adminTelefoni}, ${hash}, ${ADMIN_ID})
      ON CONFLICT (id) DO NOTHING`;

    // Ruxsat spravochnigi — kodda belgilanadi, admin qo'lda qo'sha olmaydi
    for (const kod of RUXSAT_KODLARI) {
      const t = RUXSATLAR[kod];
      await tx`
        INSERT INTO ruxsat (kod, nom, guruh) VALUES (${kod}, ${t.nom}, ${t.guruh})
        ON CONFLICT (kod) DO UPDATE SET nom = EXCLUDED.nom, guruh = EXCLUDED.guruh`;
    }

    // Tizimli rollar va Q-04 preseti
    for (const rol of ROL_URUGI) {
      const qator = await tx<{ id: number }[]>`
        INSERT INTO rol (nom, kod, tizimli, yaratdi_id)
        VALUES (${rol.nom}, ${rol.kod}, true, ${ADMIN_ID})
        ON CONFLICT (kod) DO UPDATE SET nom = rol.nom
        RETURNING id`;
      const rolId = qator[0]?.id;
      if (rolId === undefined) continue;

      for (const [kod, qamrov] of rol.ruxsatlar) {
        await tx`
          INSERT INTO rol_ruxsat (rol_id, ruxsat_kod, qamrov, yaratdi_id)
          VALUES (${rolId}, ${kod}, ${qamrov}, ${ADMIN_ID})
          ON CONFLICT (rol_id, ruxsat_kod) DO NOTHING`;
      }

      if (rol.kod === 'ADMIN') {
        await tx`
          INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
          VALUES (${ADMIN_ID}, ${rolId}, ${ADMIN_ID})
          ON CONFLICT (xodim_id, rol_id) DO NOTHING`;
      }
    }

    /**
     * ⚠️ `filial` va `xodim` QAT'IY `id` bilan yozildi (halqa uchun
     *    shart), lekin `BIGSERIAL` ketma-ketligi joyida turibdi.
     *    Surilmasa keyingi filial yoki xodim `id = 1` olishga
     *    urinadi va «duplicate key» beradi.
     *
     *    Bu bir marta sodir bo'lgan: urug'dan keyin birinchi xodim
     *    qo'shishda ekran yiqilgan.
     */
    for (const jadval of ['filial', 'xodim']) {
      await tx.unsafe(
        `SELECT setval(pg_get_serial_sequence('${jadval}', 'id'),
                       GREATEST((SELECT MAX(id) FROM ${jadval}), 1))`,
      );
    }
  });

  const [rollar] = await ulanish<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM rol`;
  const [ruxsatlar] = await ulanish<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM rol_ruxsat`;

  return {
    filial: sozlama.filialNomi,
    adminTelefoni: sozlama.adminTelefoni,
    parol: ochiqParol,
    rollar: rollar?.n ?? 0,
    ruxsatlar: ruxsatlar?.n ?? 0,
  };
}
