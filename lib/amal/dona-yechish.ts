/**
 * lib/amal/dona-yechish.ts — TZ 7.8 · FIFO · 2.2-invariant
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Dona material (kronshteyn, zanjir, mexanizm) sotilganda ombordan
 * YECHILISHI kerak. `RULON` uchun bu `band.ts` da bor — u
 * to'rtburchak qidiradi. Dona uchun esa to'rtburchak yo'q: shunchaki
 * sanoq, FIFO bo'yicha eng eski partiyadan.
 *
 * ⚠️ 2026-08-28 auditida chiqdi: aksessuar `pozitsiya_aksessuar` ga
 *    YOZILARDI, lekin ombordan HECH QAYERDA yechilmasdi. Ya'ni
 *    kronshteyn sotilib puli olinardi, qoldiq esa kamaymasdi.
 *    Bu fayl o'sha bo'shliqni yopadi.
 *
 * ⚠️ FIFO — eng eski partiya birinchi ketadi (7.8). Aks holda
 *    ombor eski tovar bilan to'lib qolardi va tannarx eskirardi.
 */

import type postgres from 'postgres';
import { Decimal } from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

type Tranzaksiya = postgres.TransactionSql;

export interface YechilganPartiya {
  readonly bolakId: number;
  readonly miqdor: string;
  /** Shu partiyaning bir dona tannarxi — snapshot (2.3-invariant) */
  readonly tannarx: string;
}

export interface YechishNatijasi {
  readonly holat: 'YECHILDI' | 'YETMADI';
  readonly partiyalar: readonly YechilganPartiya[];
  /** `YETMADI` bo'lsa — omborda qancha bor edi */
  readonly mavjud: string;
}

/**
 * Dona materialni ombordan yechadi.
 *
 * ⚠️ `FOR UPDATE SKIP LOCKED` — ikki sotuvchi bir vaqtda bir
 *    materialni sotsa, ikkalasi ham bir partiyani olib qo'ymasin
 *    (QISM 1 §7.2). Band qilishdagi bilan bir xil qoida.
 *
 * ⚠️ Miqdor YETMASA hech narsa yechilmaydi va `YETMADI` qaytadi —
 *    yarim yechish bo'lmaydi (2.1-invariant). Chaqiruvchi qaror
 *    qiladi: sotuvni to'xtatadimi yoki «materialga kutmoqda» ga
 *    qo'yadimi.
 */
export async function donaYech(
  tx: Tranzaksiya,
  materialId: number,
  filialId: number,
  kerak: number,
): Promise<YechishNatijasi> {
  if (!Number.isFinite(kerak) || kerak <= 0) {
    throw new BiznesXato('MIQDOR_NOTOGRI', `miqdor: ${String(kerak)}`);
  }

  const bolaklar = await tx<
    { id: number; miqdor: string; tannarx: string }[]
  >`
    SELECT id, miqdor::text, tannarx_birlik_snapshot::text AS tannarx
    FROM bolak
    WHERE material_id = ${materialId}
      AND filial_id = ${filialId}
      AND turi = 'DONA'
      AND holat = 'BOSH'
      AND faol = true
      AND miqdor > 0
    ORDER BY yaratildi, id
    FOR UPDATE SKIP LOCKED`;

  const jami = bolaklar.reduce((y, b) => y.plus(new Decimal(b.miqdor)), new Decimal(0));

  if (jami.lessThan(kerak)) {
    return { holat: 'YETMADI', partiyalar: [], mavjud: jami.toFixed(2) };
  }

  const partiyalar: YechilganPartiya[] = [];
  let qoldi = new Decimal(kerak);

  for (const b of bolaklar) {
    if (qoldi.lessThanOrEqualTo(0)) break;

    const bor = new Decimal(b.miqdor);
    const olinadi = Decimal.min(bor, qoldi);
    const qolgan = bor.minus(olinadi);

    /**
     * ⚠️ Partiya TUGASA `ISHLATILDI` bo'ladi, o'chirilmaydi:
     *    tannarx tarixi kerak (2.3-invariant).
     */
    await tx`
      UPDATE bolak
      SET miqdor = ${qolgan.toFixed(2)},
          holat = ${qolgan.lessThanOrEqualTo(0) ? 'ISHLATILDI' : 'BOSH'}
      WHERE id = ${b.id}`;

    partiyalar.push({
      bolakId: b.id,
      miqdor: olinadi.toFixed(2),
      tannarx: b.tannarx,
    });

    qoldi = qoldi.minus(olinadi);
  }

  return { holat: 'YECHILDI', partiyalar, mavjud: jami.toFixed(2) };
}

/**
 * Yechilgan partiyalarning umumiy tannarxi.
 *
 * ⚠️ Har partiyaning O'Z tannarxi bor (FIFO). Sotuv foydasi shu
 *    yig'indidan hisoblanadi — o'rtacha narx ishlatilsa foyda
 *    noto'g'ri chiqardi.
 */
export function partiyalarTannarxi(partiyalar: readonly YechilganPartiya[]): string {
  return partiyalar
    .reduce(
      (y, p) => y.plus(new Decimal(p.tannarx).times(new Decimal(p.miqdor))),
      new Decimal(0),
    )
    .toFixed(2);
}
