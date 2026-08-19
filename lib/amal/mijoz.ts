/**
 * lib/amal/mijoz.ts — TZ 6 · Q-26 · 2.1-invariant
 *
 * Mijoz yaratish va tahrirlash.
 *
 * TZ 6.5 — dublikat SAQLASHDAN OLDIN tekshiriladi va foydalanuvchiga
 * mavjud mijoz ko'rsatiladi. Bazadagi `UNIQUE (telefon)` oxirgi to'siq
 * bo'lib qoladi, lekin u foydalanuvchiga tushunarli xabar bera olmaydi —
 * shuning uchun ikkalasi ham kerak.
 */

import type postgres from 'postgres';
import { dublikatTekshir, type DublikatNatijasi, type MavjudMijoz } from '@/lib/domain/mijoz';
import { telefonKanonik } from '@/lib/domain/telefon';
import type { MijozKirimi } from '@/lib/sxema/mijoz';
import { BiznesXato } from '@/lib/xato';

export type MijozNatijasi =
  | { readonly holat: 'SAQLANDI'; readonly id: number }
  | { readonly holat: 'DUBLIKAT'; readonly dublikat: DublikatNatijasi };

const yoNull = (x: string | undefined): string | null => x ?? null;

/**
 * Dublikat qidirish uchun nomzodlar.
 *
 * Butun jadvalni o'qimaydi: telefon raqamining oxirgi 7 raqami yoki ismning
 * o'zi bo'yicha toraytiradi. Mijozlar soni o'sganda ham so'rov yengil qoladi.
 */
async function nomzodlar(
  tx: postgres.TransactionSql,
  ism: string,
  telefon: string | null,
): Promise<MavjudMijoz[]> {
  const oxiri = telefon === null ? null : telefon.slice(-7);
  return tx<MavjudMijoz[]>`
    SELECT id, ism, COALESCE(telefon, '') AS telefon
    FROM mijoz
    WHERE faol = true
      AND (
        (${oxiri}::text IS NOT NULL AND telefon LIKE '%' || ${oxiri}::text)
        OR lower(btrim(ism)) = lower(btrim(${ism}))
      )
    LIMIT 50`;
}

export async function mijozYarat(
  ulanish: postgres.Sql,
  kirim: MijozKirimi,
  xodimId: number,
): Promise<MijozNatijasi> {
  return ulanish.begin(async (tx) => {
    const telefon = kirim.telefon === undefined ? null : telefonKanonik(kirim.telefon);

    const dublikat = dublikatTekshir(kirim.ism, telefon ?? '', await nomzodlar(tx, kirim.ism, telefon));
    if (dublikat.dublikatmi) {
      return { holat: 'DUBLIKAT', dublikat } as const;
    }

    const qator = await tx<{ id: number }[]>`
      INSERT INTO mijoz (
        ism, telefon, manzil, eslatma,
        offset_turi, offset_qiymat, qarz_limiti,
        shaxs_turi, tashkilot_nomi, inn, yuridik_manzil,
        bank_nomi, hisob_raqam, mfo, shartnoma_raqam,
        nds_tolovchi, nds_stavka, yaratdi_id
      ) VALUES (
        ${kirim.ism}, ${telefon}, ${yoNull(kirim.manzil)}, ${yoNull(kirim.eslatma)},
        ${yoNull(kirim.offsetTuri)}, ${yoNull(kirim.offsetQiymat)}, ${yoNull(kirim.qarzLimiti)},
        ${kirim.shaxsTuri}, ${yoNull(kirim.tashkilotNomi)}, ${yoNull(kirim.inn)},
        ${yoNull(kirim.yuridikManzil)}, ${yoNull(kirim.bankNomi)}, ${yoNull(kirim.hisobRaqam)},
        ${yoNull(kirim.mfo)}, ${yoNull(kirim.shartnomaRaqam)},
        ${kirim.ndsStavka !== undefined}, ${yoNull(kirim.ndsStavka)}, ${xodimId}
      ) RETURNING id`;

    const id = qator[0]?.id;
    if (id === undefined) throw new BiznesXato('MIJOZ_SAQLANMADI');
    return { holat: 'SAQLANDI', id } as const;
  });
}

export async function mijozTahrirla(
  ulanish: postgres.Sql,
  mijozId: number,
  kirim: MijozKirimi,
  xodimId: number,
): Promise<MijozNatijasi> {
  return ulanish.begin(async (tx) => {
    const bor = await tx<{ id: number }[]>`
      SELECT id FROM mijoz WHERE id = ${mijozId} FOR UPDATE`;
    if (bor[0] === undefined) throw new BiznesXato('MIJOZ_TOPILMADI', String(mijozId));

    const telefon = kirim.telefon === undefined ? null : telefonKanonik(kirim.telefon);

    const dublikat = dublikatTekshir(
      kirim.ism,
      telefon ?? '',
      await nomzodlar(tx, kirim.ism, telefon),
      mijozId,
    );
    if (dublikat.dublikatmi) {
      return { holat: 'DUBLIKAT', dublikat } as const;
    }

    await tx`
      UPDATE mijoz SET
        ism = ${kirim.ism},
        telefon = ${telefon},
        manzil = ${yoNull(kirim.manzil)},
        eslatma = ${yoNull(kirim.eslatma)},
        offset_turi = ${yoNull(kirim.offsetTuri)},
        offset_qiymat = ${yoNull(kirim.offsetQiymat)},
        qarz_limiti = ${yoNull(kirim.qarzLimiti)},
        shaxs_turi = ${kirim.shaxsTuri},
        tashkilot_nomi = ${yoNull(kirim.tashkilotNomi)},
        inn = ${yoNull(kirim.inn)},
        yuridik_manzil = ${yoNull(kirim.yuridikManzil)},
        bank_nomi = ${yoNull(kirim.bankNomi)},
        hisob_raqam = ${yoNull(kirim.hisobRaqam)},
        mfo = ${yoNull(kirim.mfo)},
        shartnoma_raqam = ${yoNull(kirim.shartnomaRaqam)},
        nds_tolovchi = ${kirim.ndsStavka !== undefined},
        nds_stavka = ${yoNull(kirim.ndsStavka)},
        ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${mijozId}`;

    return { holat: 'SAQLANDI', id: mijozId } as const;
  });
}
