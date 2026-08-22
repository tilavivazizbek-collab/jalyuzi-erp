/**
 * lib/amal/filial-hisob.ts — TZ 22.6.3 · Q-34 · P-32
 *
 * Filiallararo qarzning **to'lovi** — yagona amal, unda kassa ishtirok
 * etadi. Qolgan hammasi `./filial-harakat` da.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { kassaYozuviQoshTx } from './kassa';
import { kunYopiqmi } from './kun-yopish';
import { yozuvKursi } from './kurs';
import { BiznesXato } from '@/lib/xato';

// ─── 22.6.3 · Qarz to'lovi ────────────────────────────────────────────────

export interface QarzTolovKirimi {
  readonly kimdanKassaId: number;
  readonly kimgaKassaId: number;
  readonly summa: string;
  readonly izoh: string;
}

export interface QarzTolovNatijasi {
  readonly chiqimId: number;
  readonly kirimId: number;
  readonly filialHarakatId: number;
}

/** Qo'lda kiritilgan yozuv uchun noyob manba raqami (P-26). */
async function qoldaManbaId(ulanish: postgres.Sql): Promise<number> {
  const q = await ulanish<{ n: number }[]>`SELECT nextval('qolda_manba_seq')::int AS n`;
  const n = q[0]?.n;
  if (n === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'qolda');
  return n;
}

/**
 * TZ 22.6.3 — filiallararo qarz to'lovi.
 *
 * ```
 * Beruvchi filial kassasidan chiqim   C12
 * Qabul qiluvchi filial kassasiga kirim K11
 * Filial balansi yopiladi              TOLOV
 * ```
 *
 * P-32 — TZ 22.9.3 dagi `K8`/`C10` kodlari 12.4 da band, shuning uchun
 * `C12`/`K11` ishlatiladi.
 *
 * ⚠️ 2.1-invariant — uchala yozuv BITTA tranzaksiyada va bir manbaga
 *    bog'langan: bittasi qolib ketmaydi.
 */
export async function filialQarzTolovi(
  ulanish: postgres.Sql,
  kirim: QarzTolovKirimi,
  xodimId: number,
): Promise<QarzTolovNatijasi> {
  if (new Decimal(kirim.summa).lessThanOrEqualTo(0)) {
    throw new BiznesXato('TOLOV_MANFIY', 'filial qarzi');
  }
  if (kirim.kimdanKassaId === kirim.kimgaKassaId) {
    throw new BiznesXato('KASSA_VALYUTA_MOS_EMAS', "bir kassa o'ziga to'lay olmaydi");
  }

  const manbaId = await qoldaManbaId(ulanish);

  return ulanish.begin(async (tx) => {
    const kassalar = await tx<
      { id: number; filial_id: number; valyuta: string; xodim_id: number | null }[]
    >`
      SELECT id, filial_id, valyuta, xodim_id FROM kassa
      WHERE id IN (${kirim.kimdanKassaId}, ${kirim.kimgaKassaId}) AND faol = true`;

    if (kassalar.length !== 2) throw new BiznesXato('KASSA_TOPILMADI');

    const dan = kassalar.find((k) => k.id === kirim.kimdanKassaId);
    const ga = kassalar.find((k) => k.id === kirim.kimgaKassaId);
    if (dan === undefined || ga === undefined) throw new BiznesXato('KASSA_TOPILMADI');

    // 22.6.3 — bu filial hisobi, shuning uchun ikkala tomon ham admin kassasi
    if (dan.xodim_id !== null || ga.xodim_id !== null) {
      throw new BiznesXato('KASSA_ADMIN_EMAS', 'filial qarzi');
    }
    if (dan.filial_id === ga.filial_id) {
      throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', 'bir filial ichida qarz yo‘q');
    }
    // 1.3-invariant — valyutalar aralashmaydi
    if (dan.valyuta !== ga.valyuta) {
      throw new BiznesXato('KASSA_VALYUTA_MOS_EMAS', `${dan.valyuta} → ${ga.valyuta}`);
    }

    const bugun = new Date().toISOString().slice(0, 10);
    for (const k of [kirim.kimdanKassaId, kirim.kimgaKassaId]) {
      if (await kunYopiqmi(tx, k, bugun)) throw new BiznesXato('KUN_YOPILGAN', bugun);
    }

    const valyuta = dan.valyuta === 'USD' ? 'USD' : 'SOM';

    const chiqimId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kimdanKassaId,
        kod: 'C12',
        summa: new Decimal(kirim.summa).negated().toFixed(2),
        valyuta,
        manbaTuri: 'filial_tolov',
        manbaId,
        qator: 1,
        izoh: `Filial qarzi — ${kirim.izoh.trim()}`,
      },
      xodimId,
    );

    const kirimId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: kirim.kimgaKassaId,
        kod: 'K11',
        summa: new Decimal(kirim.summa).toFixed(2),
        valyuta,
        manbaTuri: 'filial_tolov',
        manbaId,
        qator: 2,
        izoh: `Filial qarzi — ${kirim.izoh.trim()}`,
      },
      xodimId,
    );

    /**
     * To'lov qarzni **kamaytiradi**: pul bergan filial endi kamroq
     * qarzdor. Shuning uchun yo'nalish teskari — `kimga → kimdan`.
     */
    /**
     * 9.6 — dollarli yozuvda kurs MAJBURIY. `filial_harakat` da baza
     * cheklovi bor: `valyuta <> 'USD' OR kurs_snapshot IS NOT NULL`.
     * So'mli to'lovda `null` qoladi.
     */
    const kurs = await yozuvKursi(tx, valyuta);

    const harakat = await tx<{ id: number }[]>`
      INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                  valyuta, kurs_snapshot, manba_turi, manba_id,
                                  izoh, xodim_id)
      VALUES (${ga.filial_id}, ${dan.filial_id}, 'TOLOV',
              ${new Decimal(kirim.summa).toFixed(2)}, ${valyuta}, ${kurs},
              'filial_tolov', ${manbaId}, ${kirim.izoh.trim()}, ${xodimId})
      RETURNING id`;

    const harakatId = harakat[0]?.id;
    if (harakatId === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'filial qarzi');

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${dan.filial_id}, 'FILIAL_TOLOV', 'filial_harakat',
              ${harakatId},
              ${tx.json({ summa: kirim.summa, valyuta, kimga: ga.filial_id })},
              ${kirim.izoh.trim()})`;

    return { chiqimId, kirimId, filialHarakatId: harakatId };
  });
}
