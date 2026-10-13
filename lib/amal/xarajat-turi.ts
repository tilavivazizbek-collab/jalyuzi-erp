/**
 * lib/amal/xarajat-turi.ts — egasi o'zi qo'shadigan xarajat turlari (0066).
 * 2026-10-13
 *
 * ⚠️ BITTA JOY: kassa formasidagi «+ Yangi tur» modal ham, ro'yxat sahifasi
 *    ham shu funksiyalarni chaqiradi — dublikat tekshiruvi ikki joyda
 *    yozilib, biri unutilmasin.
 * ⚠️ Bir xil nomli faol tur YARATILMAYDI — mavjudi qaytariladi (katta-kichik
 *    harf farqsiz): «Ijara» va «ijara» ikki qator bo'lsa, foyda-zararda
 *    xarajat ikkiga bo'linib ko'rinardi.
 * ⚠️ Ruxsat bu yerda tekshirilmaydi — chaqiruvchi server amalining ishi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';
import { tezNomTozala, type TezBand } from './tez-qosh';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

export async function xarajatTuriYarat(soruvchi: Soruvchi, nom: string, xodimId: number): Promise<TezBand> {
  const t = tezNomTozala(nom);
  if (t === null) throw new BiznesXato('NOM_NOTOGRI', "Nom noto'g'ri");

  const bor = await soruvchi<TezBand[]>`
    SELECT id, nom FROM xarajat_turi WHERE lower(nom) = lower(${t}) AND faol`;
  if (bor[0] !== undefined) return bor[0];

  const y = await soruvchi<TezBand[]>`
    INSERT INTO xarajat_turi (nom, yaratdi_id) VALUES (${t}, ${xodimId}) RETURNING id, nom`;
  const yangi = y[0];
  if (yangi === undefined) throw new BiznesXato('SAQLANMADI', 'Xarajat turi saqlanmadi');
  return yangi;
}

export async function xarajatTuriNominiOzgartir(
  soruvchi: Soruvchi,
  id: number,
  nom: string,
  xodimId: number,
): Promise<void> {
  const t = tezNomTozala(nom);
  if (t === null) throw new BiznesXato('NOM_NOTOGRI', "Nom noto'g'ri");
  const bor = await soruvchi<{ id: number }[]>`
    SELECT id FROM xarajat_turi WHERE lower(nom) = lower(${t}) AND faol AND id <> ${id}`;
  if (bor[0] !== undefined) throw new BiznesXato('NOM_NOTOGRI', 'Bunday nomli xarajat turi allaqachon bor');
  await soruvchi`
    UPDATE xarajat_turi SET nom = ${t}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
    WHERE id = ${id}`;
}

export async function xarajatTurlari(soruvchi: Soruvchi): Promise<readonly TezBand[]> {
  return soruvchi<TezBand[]>`SELECT id, nom FROM xarajat_turi WHERE faol ORDER BY nom`;
}

/**
 * Xarajat yozishdan oldin: tur bor, faol va modda Operatsion bo'lishi kerak.
 * (Baza CHECK ham ushlaydi — lekin tushunarsiz xato bilan.)
 */
export async function xarajatTuriniTekshir(
  soruvchi: Soruvchi,
  turId: number | null,
  modda: string,
): Promise<void> {
  if (turId === null) return;
  if (modda !== 'OPERATSION') throw new BiznesXato('XARAJAT_TURI_NOTOGRI', 'tur faqat Operatsion xarajatda');
  const q = await soruvchi<{ faol: boolean }[]>`SELECT faol FROM xarajat_turi WHERE id = ${turId}`;
  if (q[0]?.faol !== true) throw new BiznesXato('XARAJAT_TURI_NOTOGRI', 'tur topilmadi yoki o‘chirilgan');
}
