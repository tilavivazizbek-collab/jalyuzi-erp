/**
 * lib/amal/yetkazib.ts — TZ 9 · Q-26
 *
 * Yetkazib beruvchi UMUMIY — filialga bog'lanmagan, qarzi ham (20.3).
 */

import type postgres from 'postgres';
import { telefonKanonik } from '@/lib/domain/telefon';
import type { YetkazibKirimi } from '@/lib/sxema/yetkazib';
import { BiznesXato } from '@/lib/xato';

const yoNull = (x: string | undefined): string | null => x ?? null;
const tel = (x: string | undefined): string | null =>
  x === undefined ? null : telefonKanonik(x);

export async function yetkazibYarat(
  ulanish: postgres.Sql,
  kirim: YetkazibKirimi,
  xodimId: number,
): Promise<number> {
  const qator = await ulanish<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (
      nom, nima_yetkazadi, kontakt_shaxs, telefon, qoshimcha_telefon, manzil,
      bank_nomi, hisob_raqam, inn, mfo, tolov_muddati_kun, valyuta, eslatma,
      yaratdi_id
    ) VALUES (
      ${kirim.nom}, ${yoNull(kirim.nimaYetkazadi)}, ${yoNull(kirim.kontaktShaxs)},
      ${tel(kirim.telefon)}, ${tel(kirim.qoshimchaTelefon)}, ${yoNull(kirim.manzil)},
      ${yoNull(kirim.bankNomi)}, ${yoNull(kirim.hisobRaqam)}, ${yoNull(kirim.inn)},
      ${yoNull(kirim.mfo)}, ${kirim.tolovMuddatiKun === undefined ? null : Number(kirim.tolovMuddatiKun)},
      ${kirim.valyuta}, ${yoNull(kirim.eslatma)}, ${xodimId}
    ) RETURNING id`;

  const id = qator[0]?.id;
  if (id === undefined) throw new BiznesXato('YETKAZIB_SAQLANMADI');
  return id;
}

export async function yetkazibTahrirla(
  ulanish: postgres.Sql,
  yetkazibId: number,
  kirim: YetkazibKirimi,
  xodimId: number,
): Promise<void> {
  const natija = await ulanish`
    UPDATE yetkazib_beruvchi SET
      nom = ${kirim.nom},
      nima_yetkazadi = ${yoNull(kirim.nimaYetkazadi)},
      kontakt_shaxs = ${yoNull(kirim.kontaktShaxs)},
      telefon = ${tel(kirim.telefon)},
      qoshimcha_telefon = ${tel(kirim.qoshimchaTelefon)},
      manzil = ${yoNull(kirim.manzil)},
      bank_nomi = ${yoNull(kirim.bankNomi)},
      hisob_raqam = ${yoNull(kirim.hisobRaqam)},
      inn = ${yoNull(kirim.inn)},
      mfo = ${yoNull(kirim.mfo)},
      tolov_muddati_kun = ${kirim.tolovMuddatiKun === undefined ? null : Number(kirim.tolovMuddatiKun)},
      valyuta = ${kirim.valyuta},
      eslatma = ${yoNull(kirim.eslatma)},
      ozgartirildi = now(), ozgartirdi_id = ${xodimId}
    WHERE id = ${yetkazibId}
    RETURNING id`;

  if (natija.length === 0) {
    throw new BiznesXato('YETKAZIB_TOPILMADI', String(yetkazibId));
  }
}
