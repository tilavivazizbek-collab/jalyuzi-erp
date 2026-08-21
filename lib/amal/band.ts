/**
 * lib/amal/band.ts — TZ 7.3 · 7.6 · QISM 1 §7.2 · QISM 3 §3.2.1 · Q-02, Q-06
 *
 * Bo'lakni band qilish.
 *
 * ⚠️ QISM 3 §3.2.1 — «Pozitsiya band qilingan deb hisoblanadi, qachonki
 *    uning BARCHA MAJBURIY SLOTI uchun faol band bo'lsa. Bittasi ham
 *    topilmasa — pozitsiya "Materialga kutmoqda" ga tushadi va
 *    topilganlari BO'SHATILADI (yarim band qolmasin).»
 *
 * Shuning uchun butun pozitsiya BITTA TRANZAKSIYADA band qilinadi:
 * bitta slot topilmasa hammasi orqaga qaytadi.
 */

import type postgres from 'postgres';
import { bolakTanla, type Bolak, type Manba, type Olcham } from '@/lib/domain/kesish';

/** TZ 7.3 — «Band muddati 30 kun.» */
export const BAND_MUDDATI_KUN = 30;

/**
 * Bir vaqtda qulflanadigan nomzodlar soni.
 *
 * Butun ombor qulflanmaydi: `SKIP LOCKED` boshqa ustaga o'tib ketadi,
 * lekin nomzodlar to'plami cheklanmasa katta omborda so'rov og'irlashadi.
 * 20 ta yetarli — TZ 7.6 tartibida eng mos 20 tasi olinadi.
 */
const NOMZOD_CHEGARASI = 20;

export interface SlotSorovi {
  /** QISM 3 §3.2.1 — har slot uchun ALOHIDA band */
  readonly pozitsiyaMaterialId: number;
  readonly materialId: number;
  readonly kerak: Olcham;
  /** Aksessuar uchun band qo'yilmaydi (§3.2.1) */
  readonly majburiy: boolean;
}

export interface BandYozuvi {
  readonly pozitsiyaMaterialId: number;
  readonly bolakId: number;
  readonly bolakKod: string;
  readonly manba: Manba;
}

export type BandNatijasi =
  | { readonly holat: 'BAND_QILINDI'; readonly bandlar: readonly BandYozuvi[] }
  /** TZ 7.6, 7-qadam — pozitsiya «Materialga kutmoqda»ga tushadi */
  | { readonly holat: 'MATERIAL_YOQ'; readonly topilmagan: readonly number[] };

interface BolakQatori {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly eni_m: string;
  readonly boyi_m: string;
  readonly qisman_ochilgan: boolean;
}

/**
 * Nomzodlarni QULFSIZ o'qiydi.
 *
 * ⚠️ Bu yerda `FOR UPDATE` ATAYLAB YO'Q.
 *
 * Avval nomzodlar qulflangan edi va bu jiddiy xato bo'lib chiqdi:
 * birinchi usta 20 ta bo'lakni birdan qulflab, ikkinchisiga hech narsa
 * qoldirmasdi. QISM 1 §7.2 esa buning teskarisini talab qiladi —
 * «ikkinchi usta BLOKLANMAYDI, keyingi mos bo'lakni oladi».
 *
 * Endi tanlov ikki qadamda: nomzodlar qulfsiz o'qiladi, keyin FAQAT
 * tanlangan bittasi qulflanadi (`bolakniQulfla`).
 *
 * Bag'rikenglik (7.6, 4-qadam) SQL da ham qo'llanadi — aks holda
 * baza `90.2 × 140` ni `0.90 × 1.40` bo'lakka sig'maydi deb hisoblab,
 * domen esa sig'adi deb topardi.
 */
async function nomzodlarniOqi(
  tx: postgres.TransactionSql,
  materialId: number,
  filialId: number,
  kerak: Olcham,
): Promise<Bolak[]> {
  const qatorlar = await tx<BolakQatori[]>`
    SELECT b.id, b.kod, b.turi, b.eni_m, b.boyi_m,
           (b.turi = 'RULON' AND b.ota_bolak_id IS NOT NULL) AS qisman_ochilgan
    FROM bolak b
    WHERE b.material_id = ${materialId}
      AND b.filial_id = ${filialId}
      AND b.faol = true
      AND b.holat = 'BOSH'
      AND b.eni_m  >= ${kerak.eniM} - 0.01
      AND b.boyi_m >= ${kerak.boyiM} - 0.01
    ORDER BY
      CASE b.turi WHEN 'OSTATKA' THEN 0 ELSE 1 END,
      (b.eni_m - ${kerak.eniM}) ASC,
      b.id ASC
    LIMIT ${NOMZOD_CHEGARASI}`;

  return qatorlar.map((q) => ({
    id: q.id,
    kod: q.kod,
    turi: q.turi === 'OSTATKA' ? 'OSTATKA' : 'RULON',
    eniM: Number(q.eni_m),
    boyiM: Number(q.boyi_m),
    qismanOchilgan: q.qisman_ochilgan,
  }));
}

/**
 * FAQAT tanlangan bo'lakni qulflaydi.
 *
 * `SKIP LOCKED` — boshqa usta shu bo'lakni olayotgan bo'lsa kutmaymiz,
 * `null` qaytadi va chaqiruvchi KEYINGI nomzodga o'tadi (§7.2).
 *
 * `holat = 'BOSH'` sharti qayta tekshiriladi: nomzodlar o'qilgandan
 * keyin uni kimdir band qilib ulgurgan bo'lishi mumkin.
 */
async function bolakniQulfla(
  tx: postgres.TransactionSql,
  bolakId: number,
): Promise<boolean> {
  const q = await tx<{ id: number }[]>`
    SELECT id FROM bolak
    WHERE id = ${bolakId} AND holat = 'BOSH' AND faol = true
    FOR UPDATE SKIP LOCKED`;
  return q.length > 0;
}

/**
 * Pozitsiyani band qiladi — hammasi yoki hech narsa.
 *
 * TZ 7.3: «Pozitsiya "Tasdiqlangan" bo'lgan zahoti tizim mos bo'lakni
 * topadi va uni band qiladi.»
 */
export async function pozitsiyaniBandQil(
  ulanish: postgres.Sql,
  buyurtmaPozitsiyaId: number,
  filialId: number,
  slotlar: readonly SlotSorovi[],
  xodimId: number,
  hozir: Date = new Date(),
): Promise<BandNatijasi> {
  return ulanish.begin(async (tx) =>
    bandQilTx(tx, buyurtmaPozitsiyaId, filialId, slotlar, xodimId, hozir),
  );
}

/**
 * Xuddi shu ish, lekin CHAQIRUVCHINING tranzaksiyasi ichida.
 *
 * ⚠️ Buyurtma yaratish band qilishni O'Z tranzaksiyasiga qo'shishi
 *    kerak (2.1-invariant): buyurtma yozilib, band qilinmay qolsa
 *    material ushlanmasdan qoladi. `postgres.js` da `TransactionSql`
 *    da `begin` yo'q, shuning uchun ish tanasi shu funksiyada turadi
 *    va tashqi qobiq faqat tranzaksiya ochadi (§2.2 — bir nusxa).
 */
export async function bandQilTx(
  tx: postgres.TransactionSql,
  buyurtmaPozitsiyaId: number,
  filialId: number,
  slotlar: readonly SlotSorovi[],
  xodimId: number,
  hozir: Date = new Date(),
): Promise<BandNatijasi> {
  const majburiy = slotlar.filter((s) => s.majburiy);
  if (majburiy.length === 0) {
    return { holat: 'BAND_QILINDI', bandlar: [] };
  }

  return tx
    .savepoint(async (sp) => {
      const bandlar: BandYozuvi[] = [];
      const topilmagan: number[] = [];

      for (const slot of majburiy) {
        let qolgan = await nomzodlarniOqi(sp, slot.materialId, filialId, slot.kerak);
        let tanlov = null as ReturnType<typeof bolakTanla>;

        /**
         * Tanla → qulfla → band qo'y.
         *
         * Qulflab bo'lmasa (boshqa usta olayotgan bo'lsa) o'sha bo'lak
         * ro'yxatdan chiqariladi va KEYINGI nomzod tanlanadi — §7.2 aynan
         * shuni talab qiladi.
         */
        while (qolgan.length > 0) {
          // TZ 7.6 algoritmi — tanlov `lib/domain/kesish.ts` da, bir joyda (§2.2)
          const nomzod = bolakTanla(qolgan, slot.kerak);
          if (nomzod === null) break;

          if (await bolakniQulfla(sp, nomzod.bolak.id)) {
            tanlov = nomzod;
            break;
          }
          qolgan = qolgan.filter((b) => b.id !== nomzod.bolak.id);
        }

        if (tanlov === null) {
          topilmagan.push(slot.pozitsiyaMaterialId);
          continue;
        }

        const muddat = new Date(hozir.getTime() + BAND_MUDDATI_KUN * 86_400_000);

        await sp`
          INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                            amal_qiladi, yaratdi_id)
          VALUES (${tanlov.bolak.id}, ${buyurtmaPozitsiyaId}, ${slot.pozitsiyaMaterialId},
                  ${muddat}, ${xodimId})`;

        await sp`
          UPDATE bolak SET holat = 'BAND', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
          WHERE id = ${tanlov.bolak.id}`;

        bandlar.push({
          pozitsiyaMaterialId: slot.pozitsiyaMaterialId,
          bolakId: tanlov.bolak.id,
          bolakKod: tanlov.bolak.kod,
          manba: tanlov.manba,
        });
      }

      if (topilmagan.length > 0) {
        /**
         * QISM 3 §3.2.1 — «yarim band qolmasin».
         *
         * Xatoni otish tranzaksiyani orqaga qaytaradi: yozilgan bandlar
         * ham, `bolak.holat` o'zgarishi ham bekor bo'ladi.
         */
        throw new YarimBandXatosi(topilmagan);
      }

      return { holat: 'BAND_QILINDI', bandlar } as const;
    })
    .catch((x: unknown) => {
      if (x instanceof YarimBandXatosi) {
        return { holat: 'MATERIAL_YOQ', topilmagan: x.topilmagan } as const;
      }
      throw x;
    });
}

/** Tranzaksiyani orqaga qaytarish uchun ichki xato — tashqariga chiqmaydi. */
class YarimBandXatosi extends Error {
  constructor(readonly topilmagan: readonly number[]) {
    super('yarim band');
    this.name = 'YarimBandXatosi';
  }
}

// ─── Q-06 · Bandni bo'shatish ─────────────────────────────────────────────

export type BoshatishSababi = 'IFLOS' | 'TOPILMADI' | 'RANG' | 'MUDDAT' | 'BEKOR' | 'BOSHQA';

/**
 * Q-06 — «Usta boshqa bo'lakni tanlasa, eski band DARHOL bo'shaydi,
 * sabab ro'yxatdan tanlanadi.»
 *
 * TZ 7.3 — band bo'shatiladi: pozitsiya bekor qilinganda, rad etilganda,
 * muddat o'tganda.
 */
export async function bandniBoshat(
  ulanish: postgres.Sql,
  buyurtmaPozitsiyaId: number,
  sabab: BoshatishSababi,
  xodimId: number,
  izoh: string | null = null,
): Promise<number> {
  return ulanish.begin(async (tx) => {
    const bandlar = await tx<{ id: number; bolak_id: number }[]>`
      SELECT id, bolak_id FROM band
      WHERE buyurtma_pozitsiya_id = ${buyurtmaPozitsiyaId} AND holat = 'FAOL'
      FOR UPDATE`;

    if (bandlar.length === 0) return 0;

    await tx`
      UPDATE band SET holat = 'BOSHATILDI', boshatish_sabab = ${sabab},
                      boshatish_izoh = ${izoh}, boshatildi = now(),
                      ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE buyurtma_pozitsiya_id = ${buyurtmaPozitsiyaId} AND holat = 'FAOL'`;

    // Bo'lak faqat BAND holatidan qaytariladi — u oradan ISHLATILDI yoki
    // BRAK bo'lgan bo'lishi mumkin, unga tegilmaydi
    await tx`
      UPDATE bolak SET holat = 'BOSH', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ANY(${bandlar.map((b) => b.bolak_id)}) AND holat = 'BAND'`;

    return bandlar.length;
  });
}

/**
 * TZ 7.3 — «Band muddati 30 kun. Pozitsiya shu vaqt ichida bajarilmasa
 * band avtomatik bo'shaydi va adminga xabar ketadi.»
 *
 * `/api/cron/band-muddati` shu funksiyani chaqiradi (QISM 1 §13).
 */
export async function muddatiOtganBandlarniBoshat(
  ulanish: postgres.Sql,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<readonly { buyurtmaPozitsiyaId: number; bolakKod: string }[]> {
  return ulanish.begin(async (tx) => {
    const eskirgan = await tx<{ id: number; bolak_id: number; buyurtma_pozitsiya_id: number; kod: string }[]>`
      SELECT b.id, b.bolak_id, b.buyurtma_pozitsiya_id, bo.kod
      FROM band b
      JOIN bolak bo ON bo.id = b.bolak_id
      WHERE b.holat = 'FAOL' AND b.amal_qiladi < ${hozir}
      FOR UPDATE OF b SKIP LOCKED`;

    if (eskirgan.length === 0) return [];

    const idlar = eskirgan.map((e) => e.id);
    await tx`
      UPDATE band SET holat = 'BOSHATILDI', boshatish_sabab = 'MUDDAT',
                      boshatildi = now(), ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ANY(${idlar})`;

    await tx`
      UPDATE bolak SET holat = 'BOSH', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ANY(${eskirgan.map((e) => e.bolak_id)}) AND holat = 'BAND'`;

    return eskirgan.map((e) => ({
      buyurtmaPozitsiyaId: e.buyurtma_pozitsiya_id,
      bolakKod: e.kod,
    }));
  });
}

/**
 * TZ 7.6 — «Ostatka bor turib rulon tanlansa — ogohlantirish.»
 *
 * Bandda emas, «Tugatdim» da tekshiriladi: usta o'sha paytda manbani
 * tasdiqlaydi (Q-02). Bloklamaydi, 11.7.7 hisobotiga tushadi.
 */
export async function mosOstatkaBormi(
  ulanish: postgres.Sql,
  materialId: number,
  filialId: number,
  kerak: Olcham,
): Promise<boolean> {
  const q = await ulanish<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM bolak
    WHERE material_id = ${materialId} AND filial_id = ${filialId}
      AND faol = true AND holat IN ('BOSH', 'BAND') AND turi = 'OSTATKA'
      AND eni_m >= ${kerak.eniM} - 0.01 AND boyi_m >= ${kerak.boyiM} - 0.01`;
  return (q[0]?.n ?? 0) > 0;
}
