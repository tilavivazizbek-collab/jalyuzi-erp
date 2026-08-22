/**
 * lib/amal/filial.ts — TZ 20.2 · 20.2.1 · 20.2.2 · 2.4
 *
 * Filial ochish va tahrirlash.
 *
 * ⚠️ Qoidalar `lib/domain/filial.ts` da — bu yerda takrorlanmaydi
 *    (§2.2). Bu qatlam faqat ma'lumotni yig'adi, domenga beradi va
 *    natijani yozadi.
 *
 * ⚠️ Filial O'CHIRILMAYDI (§6.5) — `faol = false` qilinadi va tarixi
 *    joyida qoladi (20.2).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import {
  filialTekshir,
  nofaolQilinsinmi,
  type Filial,
  type FilialNuqsoni,
} from '@/lib/domain/filial';
import { BiznesXato, type XatoKod } from '@/lib/xato';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

export interface FilialKirimi {
  readonly nom: string;
  readonly manzil: string | null;
  readonly telefon: string | null;
  readonly sotadi: boolean;
  readonly ishlabChiqaradi: boolean;
  readonly standartIshlabChiqaruvchiId: number | null;
  readonly kassaYopilishSoati: string;
  readonly faol: boolean;
}

/** Domen nuqsonini foydalanuvchi xatosiga o'giradi. */
const NUQSON_XATOSI: Record<FilialNuqsoni, XatoKod> = {
  ISHLAB_CHIQARUVCHI_KERAK: 'FILIAL_ISHLAB_CHIQARUVCHI_KERAK',
  OZIGA_OZI: 'FILIAL_OZIGA_OZI',
  ISHLAB_CHIQARUVCHI_TIKMAYDI: 'FILIAL_TIKMAYDI',
  ISHLAB_CHIQARUVCHI_NOFAOL: 'FILIAL_NOFAOL',
};

async function barchaFiliallar(soruvchi: Soruvchi): Promise<Filial[]> {
  const q = await soruvchi<
    {
      id: number;
      nom: string;
      sotadi: boolean;
      ishlab_chiqaradi: boolean;
      standart_ishlab_chiqaruvchi_id: number | null;
      bosh: boolean;
      faol: boolean;
    }[]
  >`
    SELECT id, nom, sotadi, ishlab_chiqaradi, standart_ishlab_chiqaruvchi_id,
           bosh, faol
    FROM filial ORDER BY id`;

  return q.map((f) => ({
    id: f.id,
    nom: f.nom,
    sotadi: f.sotadi,
    ishlabChiqaradi: f.ishlab_chiqaradi,
    standartIshlabChiqaruvchiId: f.standart_ishlab_chiqaruvchi_id,
    bosh: f.bosh,
    faol: f.faol,
  }));
}

function tekshirVaOtkaz(f: Filial, boshqalar: readonly Filial[]): void {
  const n = filialTekshir(f, boshqalar);
  if (!n.yaroqli) {
    const birinchi = n.nuqsonlar[0];
    if (birinchi !== undefined) {
      throw new BiznesXato(NUQSON_XATOSI[birinchi], f.nom);
    }
  }
}

/** TZ 20.2 — yangi filial. Bosh filial bu yerda belgilanmaydi (20.2.2). */
export async function filialYarat(
  ulanish: postgres.Sql,
  kirim: FilialKirimi,
  xodimId: number,
): Promise<{ filialId: number }> {
  return ulanish.begin(async (tx) => {
    const boshqalar = await barchaFiliallar(tx);

    // `id` hali yo'q — 0 qo'yiladi, «o'ziga o'zi» tekshiruvi baribir ishlaydi
    tekshirVaOtkaz(
      {
        id: 0,
        nom: kirim.nom,
        sotadi: kirim.sotadi,
        ishlabChiqaradi: kirim.ishlabChiqaradi,
        standartIshlabChiqaruvchiId: kirim.standartIshlabChiqaruvchiId,
        bosh: false,
        faol: kirim.faol,
      },
      boshqalar,
    );

    const y = await tx<{ id: number }[]>`
      INSERT INTO filial (nom, manzil, telefon, sotadi, ishlab_chiqaradi,
                          standart_ishlab_chiqaruvchi_id, kassa_yopilish_soati,
                          bosh, faol, yaratdi_id)
      VALUES (${kirim.nom}, ${kirim.manzil}, ${kirim.telefon},
              ${kirim.sotadi}, ${kirim.ishlabChiqaradi},
              ${kirim.standartIshlabChiqaruvchiId}, ${kirim.kassaYopilishSoati},
              false, ${kirim.faol}, ${xodimId})
      RETURNING id`;

    const filialId = y[0]?.id;
    if (filialId === undefined) throw new BiznesXato('FILIAL_SAQLANMADI', kirim.nom);

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'YARATISH', 'filial', ${filialId},
              ${tx.json({
                nom: kirim.nom,
                sotadi: kirim.sotadi,
                ishlabChiqaradi: kirim.ishlabChiqaradi,
              })},
              ${null})`;

    return { filialId };
  });
}

/**
 * TZ 20.2 — filialni tahrirlash.
 *
 * ⚠️ 20.2.2 — bosh filialni nofaol qilib bo'lmaydi. Tekshiruv domenda
 *    (`nofaolQilinsinmi`), bu yerda faqat qo'llanadi.
 */
export async function filialOzgartir(
  ulanish: postgres.Sql,
  filialId: number,
  kirim: FilialKirimi,
  xodimId: number,
): Promise<void> {
  return ulanish.begin(async (tx) => {
    const hammasi = await barchaFiliallar(tx);
    const eski = hammasi.find((f) => f.id === filialId);
    if (eski === undefined) throw new BiznesXato('FILIAL_TOPILMADI', String(filialId));

    const yangi: Filial = {
      id: filialId,
      nom: kirim.nom,
      sotadi: kirim.sotadi,
      ishlabChiqaradi: kirim.ishlabChiqaradi,
      standartIshlabChiqaruvchiId: kirim.standartIshlabChiqaruvchiId,
      bosh: eski.bosh,
      faol: kirim.faol,
    };

    tekshirVaOtkaz(
      yangi,
      hammasi.filter((f) => f.id !== filialId),
    );

    // 20.2.2 — «Bosh filialni o'chirib bo'lmaydi»
    if (!kirim.faol && !nofaolQilinsinmi(eski)) {
      throw new BiznesXato('FILIAL_BOSH_NOFAOL', eski.nom);
    }

    /**
     * ⚠️ Bu filialni standart ishlab chiqaruvchi deb ko'rsatgan boshqa
     *    filiallar bor bo'lsa, uni «tikmaydigan» yoki nofaol qilish
     *    ularni buzadi: buyurtma tasdiqlanganda qayerga yuborishni tizim
     *    bilmay qoladi (20.4.1).
     */
    if (eski.ishlabChiqaradi && (!kirim.ishlabChiqaradi || !kirim.faol)) {
      const tayanganlar = await tx<{ nom: string }[]>`
        SELECT nom FROM filial
        WHERE standart_ishlab_chiqaruvchi_id = ${filialId} AND id <> ${filialId}
          AND faol = true`;

      if (tayanganlar.length > 0) {
        throw new BiznesXato(
          'FILIAL_TAYANCH',
          tayanganlar.map((x) => x.nom).join(', '),
        );
      }
    }

    // EC-FQ-04 — yopilayotgan filialning qarzi bosh filialga o'tadi
    if (eski.faol && !kirim.faol) {
      await qarzniBoshFilialgaOtkaz(tx, filialId, hammasi, xodimId);
    }

    await tx`
      UPDATE filial
      SET nom = ${kirim.nom}, manzil = ${kirim.manzil}, telefon = ${kirim.telefon},
          sotadi = ${kirim.sotadi}, ishlab_chiqaradi = ${kirim.ishlabChiqaradi},
          standart_ishlab_chiqaruvchi_id = ${kirim.standartIshlabChiqaruvchiId},
          kassa_yopilish_soati = ${kirim.kassaYopilishSoati},
          faol = ${kirim.faol},
          ochirildi = ${kirim.faol ? null : tx`now()`},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${filialId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'TAHRIRLASH', 'filial', ${filialId},
              ${tx.json({
                nom: eski.nom,
                sotadi: eski.sotadi,
                ishlabChiqaradi: eski.ishlabChiqaradi,
                faol: eski.faol,
              })},
              ${tx.json({
                nom: kirim.nom,
                sotadi: kirim.sotadi,
                ishlabChiqaradi: kirim.ishlabChiqaradi,
                faol: kirim.faol,
              })},
              ${null})`;
  });
}

// ─── 22.8 · EC-FQ-04 · Yopilayotgan filialning qarzi ──────────────────────

/**
 * TZ 22.8 (EC-FQ-04) — «Filial yopildi, qarzi bor → qarz **bosh
 * filialga o'tadi**.»
 *
 * Har juftlik uchun ikkita `QOLDA_TUZATISH` qatori yoziladi:
 *
 * ```
 * Yopilayotgan A · Samarqandga 500 000 qarzdor
 *
 *   1. Samarqand → A     500 000   ← A ning qarzi nolga tushadi
 *   2. A → Bosh filial   500 000   ← qarz bosh filialga o'tdi
 * ```
 *
 * ⚠️ Ikkalasi ham BIR tranzaksiyada: bittasi yozilib ikkinchisi
 *    qolib ketsa 11-invariant (`SUM = 0`) buzilardi.
 *
 * ⚠️ Yo'nalishlar `filial_harakat` da qoladi — eski qatorlar
 *    o'chirilmaydi (§6.5). Balans `SUM()` dan chiqadi, shuning uchun
 *    yangi qatorlar uni nolga tenglashtiradi.
 */
async function qarzniBoshFilialgaOtkaz(
  tx: postgres.TransactionSql,
  filialId: number,
  hammasi: readonly Filial[],
  xodimId: number,
): Promise<void> {
  const bosh = hammasi.find((f) => f.bosh);
  // Bosh filialning o'zi yopilmaydi (20.2.2) — bu yerga yetib kelmaydi
  if (bosh === undefined || bosh.id === filialId) return;

  /**
   * Juftlik balansi: `kimdan` bo'lsa manfiy, `kimga` bo'lsa musbat.
   * Manfiy — bu filial qarzdor, musbat — unga qarzdor.
   */
  const juftlar = await tx<{ boshqa_id: number; balans: string }[]>`
    SELECT boshqa_id, SUM(summa)::text AS balans
    FROM (
      SELECT kimga_filial_id AS boshqa_id, -summa AS summa
      FROM filial_harakat WHERE kimdan_filial_id = ${filialId}
      UNION ALL
      SELECT kimdan_filial_id AS boshqa_id, summa
      FROM filial_harakat WHERE kimga_filial_id = ${filialId}
    ) x
    GROUP BY boshqa_id
    HAVING SUM(summa) <> 0`;

  const izoh = 'Filial yopildi — qarz bosh filialga o‘tkazildi (EC-FQ-04)';

  for (const j of juftlar) {
    if (j.boshqa_id === bosh.id) continue;

    const balans = new Decimal(j.balans);

    /**
     * 1-qadam: juftlik nolga tushadi.
     * Balans manfiy (biz qarzdormiz) bo'lsa — bizga qarama-qarshi
     * yozuv kerak: `boshqa → biz`.
     */
    const musbat = balans.isNegative();
    await tx`
      INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                  valyuta, qolda_ozgartirildi, ozgartirish_sabab,
                                  izoh, xodim_id)
      VALUES (${musbat ? j.boshqa_id : filialId},
              ${musbat ? filialId : j.boshqa_id},
              'QOLDA_TUZATISH', ${balans.abs().toFixed(2)}, 'SOM',
              true, ${izoh}, ${izoh}, ${xodimId})`;

    // 2-qadam: o'sha summa bosh filial bilan juftlikka ko'chadi
    await tx`
      INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                  valyuta, qolda_ozgartirildi, ozgartirish_sabab,
                                  izoh, xodim_id)
      VALUES (${musbat ? bosh.id : j.boshqa_id},
              ${musbat ? j.boshqa_id : bosh.id},
              'QOLDA_TUZATISH', ${balans.abs().toFixed(2)}, 'SOM',
              true, ${izoh}, ${izoh}, ${xodimId})`;
  }

  if (juftlar.length > 0) {
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'QARZ_OTKAZISH', 'filial', ${filialId},
              ${tx.json({ juftlar: juftlar.length, boshFilialId: bosh.id })},
              ${izoh})`;
  }
}
