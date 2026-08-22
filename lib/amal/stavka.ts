/**
 * lib/amal/stavka.ts — TZ 10.9 · 10.12 · 2.3-invariant
 *
 * Ustaning stavkasini bazadan topadi.
 *
 * ⚠️ Tanlash MANTIQI bu yerda emas — u `lib/domain/stavka.ts` da
 *    (§2.2 «bir mantiq — bir joyda»). Bu fayl faqat qatorlarni
 *    o'qiydi va domenga uzatadi.
 *
 * ⚠️ 2.3-invariant — sana PARAMETR bo'lib keladi: «Stavka keyin
 *    ko'tarilsa yoki tushirilsa, eski ishlar o'zgarmaydi.»
 */

import type postgres from 'postgres';
import {
  stavkaTanla,
  type StavkaBirligi,
  type StavkaQatori,
} from '@/lib/domain/stavka';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

export interface TopilganStavka {
  readonly qiymat: string;
  readonly birlik: StavkaBirligi;
  /** 10.12 — stavka topilmadi: ish to'xtamaydi, haq 0 hisoblanadi */
  readonly topildimi: boolean;
}

/**
 * TZ 10.9 — `xodim` > `filial` > `standart`.
 *
 * ⚠️ TZ 10.12 — «Stavkasi belgilanmagan tur navbatda ko'rinaveradi —
 *    ish to'xtamaydi, haq 0 hisoblanadi, admin keyin qo'lda
 *    qo'shadi.» Shuning uchun bu funksiya XATO BERMAYDI: topilmasa
 *    nol qaytaradi va `topildimi = false` bilan ogohlantiradi.
 *
 *    Ogohlantirish adminga boradi (13.9: «Stavkasiz ish bajarildi»).
 */
export async function ustaStavkasi(
  soruvchi: Soruvchi,
  kirim: {
    readonly mahsulotTurId: number;
    readonly filialId: number;
    readonly xodimId: number;
    /** Odatda buyurtma sanasi — bugungi emas (2.3) */
    readonly sana: string;
  },
): Promise<TopilganStavka> {
  const qatorlar = await soruvchi<
    {
      id: number;
      mahsulot_tur_id: number;
      filial_id: number | null;
      xodim_id: number | null;
      qiymat: string;
      birlik: string;
      amal_qiladi_dan: string;
    }[]
  >`
    SELECT id, mahsulot_tur_id, filial_id, xodim_id,
           qiymat::text, birlik, amal_qiladi_dan::text
    FROM stavka
    WHERE mahsulot_tur_id = ${kirim.mahsulotTurId}
      AND faol = true
      AND amal_qiladi_dan <= ${kirim.sana}::date
      AND (filial_id IS NULL OR filial_id = ${kirim.filialId})
      AND (xodim_id IS NULL OR xodim_id = ${kirim.xodimId})`;

  const domenQatorlari: StavkaQatori[] = qatorlar.map((q) => ({
    id: q.id,
    mahsulotTurId: q.mahsulot_tur_id,
    filialId: q.filial_id,
    xodimId: q.xodim_id,
    qiymat: q.qiymat,
    birlik: q.birlik === 'KV_M' ? 'KV_M' : 'DONA',
    amalQiladiDan: q.amal_qiladi_dan,
  }));

  const tanlangan = stavkaTanla(
    domenQatorlari,
    kirim.mahsulotTurId,
    kirim.filialId,
    kirim.xodimId,
    kirim.sana,
  );

  if (tanlangan === null) {
    // 10.12 — ish to'xtamaydi
    return { qiymat: '0', birlik: 'DONA', topildimi: false };
  }

  return {
    qiymat: tanlangan.qiymat,
    birlik: tanlangan.birlik,
    topildimi: true,
  };
}

/**
 * Pozitsiya bo'yicha stavka — bot va sayt shu bilan chaqiradi.
 *
 * Pozitsiyaning mahsulot turi, tikuvchi filiali va buyurtma sanasi
 * o'zidan olinadi: chaqiruvchi ularni bilishi shart emas va adashib
 * bugungi sanani bermaydi (2.3).
 */
export async function pozitsiyaStavkasi(
  soruvchi: Soruvchi,
  pozitsiyaId: number,
  xodimId: number,
): Promise<TopilganStavka> {
  const q = await soruvchi<
    { mahsulot_tur_id: number; filial_id: number; sana: string }[]
  >`
    SELECT p.mahsulot_tur_id,
           b.ishlab_chiqaruvchi_filial_id AS filial_id,
           b.sana::date::text            AS sana
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId}`;

  const p = q[0];
  if (p === undefined) return { qiymat: '0', birlik: 'DONA', topildimi: false };

  return ustaStavkasi(soruvchi, {
    mahsulotTurId: p.mahsulot_tur_id,
    filialId: p.filial_id,
    xodimId,
    sana: p.sana,
  });
}
