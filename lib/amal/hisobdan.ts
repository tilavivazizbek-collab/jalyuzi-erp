/**
 * lib/amal/hisobdan.ts — TZ 7.10 · 2.1 · 2.5-invariant · TZ 2.4
 *
 * Ombordan hisobdan chiqarish (brak).
 *
 * «Omborda turgan material buzilganda: suv ketdi, rangi o'chdi, yirtildi,
 *  muddati o'tdi, yo'qoldi.»
 *
 * Bu UCHINCHI brak turi. Yetkazib beruvchi defekti (7.9) va ishlab
 * chiqarish braki (8.17) alohida yuritiladi.
 *
 * ⚠️ Kim qiladi: OMBORCHI o'zi. Admin tasdig'i KUTILMAYDI (7.10).
 *    Nazorat keyin: adminga xabar ketadi va audit jurnalida qoladi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { manfiy, pulMatn, som, type Som } from '@/lib/domain/pul';
import { bolakQiymati } from '@/lib/domain/tannarx';
import { BiznesXato } from '@/lib/xato';
import { SABAB_NOMI, type ChiqarishSababi } from '@/lib/sxema/chiqim';

/**
 * TZ 7.10 — sabablar ro'yxati `lib/sxema/chiqim.ts` da (§2.2: bir joyda).
 * Forma ham, tranzaksiya ham shu bitta manbadan oladi.
 */
export {
  CHIQARISH_SABABLARI,
  SABAB_NOMI,
  type ChiqarishSababi,
} from '@/lib/sxema/chiqim';

export interface ChiqarishKirimi {
  readonly bolakId: number;
  readonly sabab: ChiqarishSababi;
  readonly izoh: string | null;
  /**
   * TZ 7.10 — «Yetkazib beruvchi defekti — keyin topildi» tanlanganda
   * qaysi kirimdan ekani va da'vo qilinishi so'raladi.
   *
   * «Rulon ichidagi dog' faqat ochilganda ma'lum bo'ladi — bir oy o'tib.»
   */
  readonly kirimId: number | null;
  readonly davoQilinadimi: boolean;
}

export interface ChiqarishNatijasi {
  readonly harakatId: number;
  readonly bolakKod: string;
  readonly materialNomi: string;
  /** Adminga xabarda ko'rsatiladigan zarar (7.10) */
  readonly zarar: Som;
}

interface BolakQatori {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly holat: string;
  readonly filial_id: number;
  readonly eni_m: string | null;
  readonly boyi_m: string | null;
  readonly miqdor: string | null;
  readonly tannarx_birlik_snapshot: string;
  readonly material_nomi: string;
  readonly sarflash_birligi: string;
}

/**
 * TZ 7.10 — bo'lakni hisobdan chiqaradi.
 *
 * Bitta tranzaksiyada: bo'lak holati, ombor jurnali va audit yozuvi.
 * Kassaga TEGMAYDI — pul harakati yo'q (7.10).
 */
export async function hisobdanChiqar(
  ulanish: postgres.Sql,
  kirim: ChiqarishKirimi,
  xodimId: number,
): Promise<ChiqarishNatijasi> {
  if (kirim.sabab === 'BOSHQA' && (kirim.izoh === null || kirim.izoh.trim() === '')) {
    // 7.10 — sabab MAJBURIY. «Boshqa» tanlansa izohsiz ma'nosiz qoladi
    throw new BiznesXato('CHIQARISH_SABAB_KERAK');
  }

  return ulanish.begin(async (tx) => {
    const qatorlar = await tx<BolakQatori[]>`
      SELECT b.id, b.kod, b.turi, b.holat, b.filial_id, b.eni_m, b.boyi_m, b.miqdor,
             b.tannarx_birlik_snapshot, m.nom AS material_nomi, m.sarflash_birligi
      FROM bolak b
      JOIN material m ON m.id = b.material_id
      WHERE b.id = ${kirim.bolakId} AND b.faol = true
      FOR UPDATE OF b`;

    const bolak = qatorlar[0];
    if (bolak === undefined) {
      throw new BiznesXato('BOLAK_TOPILMADI', String(kirim.bolakId));
    }

    if (bolak.holat === 'BRAK' || bolak.holat === 'CHIQINDI') {
      throw new BiznesXato('BOLAK_ALLAQACHON_CHIQARILGAN', bolak.kod);
    }

    /**
     * TZ 7.3 — «Lock omborchi bilan usta orasida ham ishlaydi: omborchi
     * bo'lakni brakka chiqarayotganda usta o'shanga "Tugatdim" bosa olmaydi.»
     *
     * Yuqoridagi `FOR UPDATE` shuni ta'minlaydi. Band bo'lsa ham chiqarish
     * mumkin — mato jismonan buzilgan, band esa uni qaytarmaydi. Band
     * bo'shatiladi va pozitsiya «Materialga kutmoqda»ga tushadi.
     */
    await tx`
      UPDATE band SET holat = 'BOSHATILDI', boshatish_sabab = 'BOSHQA',
                      boshatish_izoh = 'Bo''lak hisobdan chiqarildi',
                      boshatildi = now(), ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE bolak_id = ${bolak.id} AND holat = 'FAOL'`;

    await tx`
      UPDATE bolak SET holat = 'BRAK', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${bolak.id}`;

    const zarar = bolakQiymati({
      turi: bolak.turi,
      eniM: bolak.eni_m,
      boyiM: bolak.boyi_m,
      miqdor: bolak.miqdor,
      tannarxBirlik: som(bolak.tannarx_birlik_snapshot),
    });
    const kvM = bolak.turi === 'DONA' ? null : new Decimal(bolak.eni_m ?? 0).times(bolak.boyi_m ?? 0);
    const sm = bolak.turi === 'DONA' && bolak.sarflash_birligi === 'SM' ? bolak.miqdor : null;
    const dona =
      bolak.turi === 'DONA' && bolak.sarflash_birligi === 'DONA'
        ? Math.round(Number(bolak.miqdor ?? 0))
        : null;

    const izohMatni =
      kirim.izoh === null || kirim.izoh.trim() === ''
        ? SABAB_NOMI[kirim.sabab]
        : `${SABAB_NOMI[kirim.sabab]} — ${kirim.izoh.trim()}`;

    const harakat = await tx<{ id: number }[]>`
      INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                                 miqdor_dona, tannarx_summa, manba_turi, manba_id,
                                 izoh, xodim_id)
      VALUES (${bolak.filial_id}, ${bolak.id}, 'BRAK',
              ${kvM === null ? null : kvM.negated().toFixed(4)},
              ${sm === null ? null : new Decimal(sm).negated().toFixed(2)},
              ${dona === null ? null : -dona},
              ${pulMatn(manfiy(zarar))},
              ${kirim.kirimId === null ? null : 'kirim'}, ${kirim.kirimId},
              ${izohMatni}, ${xodimId})
      RETURNING id`;

    const harakatId = harakat[0]?.id;
    if (harakatId === undefined) throw new BiznesXato('CHIQARISH_SAQLANMADI');

    // TZ 2.4 — «ombordan hisobdan chiqarish» jurnalga tushadigan amallardan
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${bolak.filial_id}, 'OMBORDAN_CHIQARILDI', 'bolak',
              ${bolak.id},
              ${tx.json({ holat: bolak.holat })},
              ${tx.json({
                holat: 'BRAK',
                sabab: kirim.sabab,
                zarar: pulMatn(zarar),
                davo_qilinadimi: kirim.davoQilinadimi,
              })},
              ${izohMatni})`;

    return {
      harakatId,
      bolakKod: bolak.kod,
      materialNomi: bolak.material_nomi,
      zarar,
    };
  });
}

/**
 * TZ 7.10 — «Omborchi yozuvni BEKOR QILA OLADI.»
 *
 * «Bekor qilish BLOKLANMAYDI — oradan kesim o'tgan bo'lsa ham. Qoldiq
 *  manfiyga tushishi mumkin, qizil bilan belgilanadi, adminga xabar
 *  ketadi va admin tuzatgunicha shunday turadi (2.5-invariant).»
 *
 * Ombor jurnali o'zgarmas (§6.5), shuning uchun bekor qilish — TESKARI
 * YOZUV, eski yozuv joyida qoladi.
 */
export async function chiqarishniBekorQil(
  ulanish: postgres.Sql,
  harakatId: number,
  izoh: string,
  xodimId: number,
): Promise<{ bolakKod: string; qaytarilganSumma: Som }> {
  if (izoh.trim() === '') {
    throw new BiznesXato('CHIQARISH_SABAB_KERAK', 'bekor qilish sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const qatorlar = await tx<
      {
        id: number;
        bolak_id: number;
        filial_id: number;
        turi: string;
        miqdor_kv_m: string | null;
        miqdor_sm: string | null;
        miqdor_dona: number | null;
        tannarx_summa: string;
        bolak_kod: string;
        bolak_holat: string;
      }[]
    >`
      SELECT oh.id, oh.bolak_id, oh.filial_id, oh.turi, oh.miqdor_kv_m, oh.miqdor_sm,
             oh.miqdor_dona, oh.tannarx_summa, b.kod AS bolak_kod, b.holat AS bolak_holat
      FROM ombor_harakat oh
      JOIN bolak b ON b.id = oh.bolak_id
      WHERE oh.id = ${harakatId}
      FOR UPDATE OF b`;

    const harakat = qatorlar[0];
    if (harakat === undefined) {
      throw new BiznesXato('HARAKAT_TOPILMADI', String(harakatId));
    }
    if (harakat.turi !== 'BRAK') {
      throw new BiznesXato('HARAKAT_BRAK_EMAS', harakat.turi);
    }

    // ⚠️ Bir yozuv IKKI MARTA bekor qilinmasin. Ombor jurnali o'zgarmas
    //    bo'lgani uchun (§6.5) «bekor qilindi» degan bayroq qo'yib
    //    bo'lmaydi — tekshiruv teskari yozuvning O'ZI bor-yo'qligi bilan
    //    bo'ladi. Aks holda qoldiq 2.2-invariant bo'yicha ikki barobar
    //    qaytardi.
    const bekorlar = await tx<{ id: number }[]>`
      SELECT id FROM ombor_harakat
      WHERE turi = 'STORNO' AND manba_turi = 'ombor_harakat'
        AND manba_id = ${harakatId}
      LIMIT 1`;
    if (bekorlar.length > 0) {
      throw new BiznesXato('CHIQARISH_ALLAQACHON_BEKOR', harakat.bolak_kod);
    }

    // Teskari yozuv — eski yozuvga TEGILMAYDI (§6.5)
    const teskari = (x: string | null): string | null =>
      x === null ? null : new Decimal(x).negated().toFixed(4);

    await tx`
      INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                                 miqdor_dona, tannarx_summa, manba_turi, manba_id,
                                 izoh, xodim_id)
      VALUES (${harakat.filial_id}, ${harakat.bolak_id}, 'STORNO',
              ${teskari(harakat.miqdor_kv_m)}, ${teskari(harakat.miqdor_sm)},
              ${harakat.miqdor_dona === null ? null : -harakat.miqdor_dona},
              ${new Decimal(harakat.tannarx_summa).negated().toFixed(2)},
              'ombor_harakat', ${harakatId},
              ${`Hisobdan chiqarish bekor qilindi — ${izoh.trim()}`}, ${xodimId})`;

    // Bo'lak omborga qaytadi
    await tx`
      UPDATE bolak SET holat = 'BOSH', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${harakat.bolak_id} AND holat = 'BRAK'`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${harakat.filial_id}, 'STORNO', 'ombor_harakat',
              ${harakatId},
              ${tx.json({ turi: 'BRAK', summa: harakat.tannarx_summa })},
              ${tx.json({ turi: 'STORNO', bolak_holat: 'BOSH' })},
              ${izoh.trim()})`;

    return {
      bolakKod: harakat.bolak_kod,
      qaytarilganSumma: som(new Decimal(harakat.tannarx_summa).abs().toFixed(2)),
    };
  });
}
