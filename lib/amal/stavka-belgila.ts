/**
 * lib/amal/stavka-belgila.ts — TZ 10.8 · 10.9 · 10.12 · 2.3-invariant
 *
 * Usta stavkasini BELGILASH.
 *
 * ⚠️ NEGA BU FAYL KERAK BO'LDI
 *
 *    2026-09-10 gacha `stavka` jadvalini to'ldiradigan joy umuman
 *    yo'q edi — na ekran, na funksiya. Jadval bor, o'quvchi
 *    (`lib/amal/stavka.ts`) bor, YOZUVCHI yo'q. Natijada bazada
 *    nol qator turardi va har «Tugatdim» da ustaning haqi NOL
 *    hisoblanardi. TZ 10.12 bo'yicha bunda ish to'xtamaydi —
 *    shuning uchun tizim xato ham bermasdi, jimgina nol yozardi.
 *
 *    Bu `kurs_tarix` bilan bo'lgan xatoning aynan o'zi
 *    (`kurs-belgila.ts` ga qara).
 *
 * ⚠️ TANLASH MANTIQI BU YERDA EMAS — u `lib/domain/stavka.ts` da
 *    (§2.2). Bu fayl faqat yozadi va o'qiydi.
 */

import type postgres from 'postgres';
import {
  bosqichlarniTekshir,
  type Bosqich,
  type StavkaBirligi,
} from '@/lib/domain/stavka';
import { BiznesXato } from '@/lib/xato';

/** Bitta stavka guruhi — qat'iy/kv.metrda bir qator, bosqichlida bir nechta */
export interface StavkaKirimi {
  readonly mahsulotTurId: number;
  /** NULL = barcha filialga (10.9) */
  readonly filialId: number | null;
  /** NULL = barcha ustaga (10.9) */
  readonly xodimId: number | null;
  readonly birlik: StavkaBirligi;
  /** DONA va KV_M uchun — bitta summa */
  readonly qiymat: string;
  /** BOSQICH uchun — jadval qatorlari */
  readonly bosqichlar: readonly Bosqich[];
  readonly amalQiladiDan: string;
}

/**
 * Stavkani belgilaydi yoki AYNAN O'SHA sanadagisini almashtiradi.
 *
 * ⚠️ 2.3-invariant — O'TMISHGA TEGILMAYDI.
 *
 *    Eski sanadagi qatorlar joyida qoladi: ularga tayangan ish
 *    haqi allaqachon hisoblangan va qayta yozilmaydi. Almashtirish
 *    faqat KIRITILAYOTGAN sanadagi guruhga tegadi — ertalab xato
 *    raqam yozilgan bo'lsa tuzatish uchun.
 *
 * ⚠️ Eski guruh O'CHIRILMAYDI, `faol = false` bo'ladi (§6.5).
 *    Kim, qachon, nimani o'zgartirgani audit jurnalida qoladi.
 */
export async function stavkaniBelgila(
  ulanish: postgres.Sql,
  kirim: StavkaKirimi,
  xodimId: number,
): Promise<void> {
  /**
   * Bazaga yoziladigan qatorlar. Qat'iy va kv.metrli stavkada
   * chegara YO'Q — buni baza ham CHECK bilan ushlab turadi.
   */
  const qatorlar: readonly Bosqich[] =
    kirim.birlik === 'BOSQICH'
      ? kirim.bosqichlar
      : [{ chegaraKvM: null, qiymat: kirim.qiymat }];

  if (kirim.birlik === 'BOSQICH') {
    bosqichlarniTekshir(kirim.bosqichlar);
  } else {
    const son = Number(kirim.qiymat);
    if (!Number.isFinite(son) || son < 0) {
      throw new BiznesXato('BOSQICH_NOTOGRI', `qiymat: ${kirim.qiymat}`);
    }
  }

  await ulanish.begin(async (tx) => {
    /**
     * ⚠️ Bosqichli guruh BUTUNLIGICHA almashtiriladi.
     *
     *    Eski jadvalda to'rt bosqich, yangisida uchta bo'lsa,
     *    qolib ketgan to'rtinchi qator jimgina ishlab turardi va
     *    haq noto'g'ri chiqardi.
     */
    await tx`
      UPDATE stavka
         SET faol = false, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
       WHERE faol = true
         AND mahsulot_tur_id = ${kirim.mahsulotTurId}
         AND amal_qiladi_dan = ${kirim.amalQiladiDan}::date
         AND filial_id IS NOT DISTINCT FROM ${kirim.filialId}
         AND xodim_id  IS NOT DISTINCT FROM ${kirim.xodimId}`;

    for (const q of qatorlar) {
      await tx`
        INSERT INTO stavka (mahsulot_tur_id, filial_id, xodim_id, qiymat,
                            birlik, chegara_kv_m, amal_qiladi_dan, yaratdi_id)
        VALUES (${kirim.mahsulotTurId}, ${kirim.filialId}, ${kirim.xodimId},
                ${q.qiymat}, ${kirim.birlik}, ${q.chegaraKvM},
                ${kirim.amalQiladiDan}::date, ${xodimId})`;
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      SELECT ${xodimId}, x.filial_id, 'STAVKA', 'stavka', ${kirim.mahsulotTurId},
             ${tx.json({
               mahsulot_tur_id: kirim.mahsulotTurId,
               filial_id: kirim.filialId,
               xodim_id: kirim.xodimId,
               birlik: kirim.birlik,
               amal_qiladi_dan: kirim.amalQiladiDan,
               qatorlar: qatorlar.map((q) => ({
                 chegara_kv_m: q.chegaraKvM,
                 qiymat: q.qiymat,
               })),
             })}, 'Usta stavkasi belgilandi'
      FROM xodim x WHERE x.id = ${xodimId}`;
  });
}

/**
 * Stavka guruhini kuchdan qoldiradi.
 *
 * ⚠️ O'chirish EMAS: shu stavkada hisoblangan haq o'z joyida
 *    qoladi (2.3). Faqat bundan keyingi ishlarga qo'llanmaydi.
 */
export async function stavkaniOchir(
  ulanish: postgres.Sql,
  kirim: {
    readonly mahsulotTurId: number;
    readonly filialId: number | null;
    readonly xodimId: number | null;
    readonly amalQiladiDan: string;
  },
  xodimId: number,
): Promise<void> {
  await ulanish.begin(async (tx) => {
    const q = await tx<{ n: number }[]>`
      UPDATE stavka
         SET faol = false, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
       WHERE faol = true
         AND mahsulot_tur_id = ${kirim.mahsulotTurId}
         AND amal_qiladi_dan = ${kirim.amalQiladiDan}::date
         AND filial_id IS NOT DISTINCT FROM ${kirim.filialId}
         AND xodim_id  IS NOT DISTINCT FROM ${kirim.xodimId}
      RETURNING 1 AS n`;

    if (q.length === 0) return;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, izoh)
      SELECT ${xodimId}, x.filial_id, 'STAVKA_OCHIRISH', 'stavka',
             ${kirim.mahsulotTurId},
             ${tx.json({
               mahsulot_tur_id: kirim.mahsulotTurId,
               filial_id: kirim.filialId,
               xodim_id: kirim.xodimId,
               amal_qiladi_dan: kirim.amalQiladiDan,
             })}, 'Usta stavkasi kuchdan qoldirildi'
      FROM xodim x WHERE x.id = ${xodimId}`;
  });
}

// ─── O'qish ───────────────────────────────────────────────────────────────

export interface StavkaGuruhQatori {
  readonly chegaraKvM: string | null;
  readonly qiymat: string;
}

export interface StavkaKorinishi {
  readonly mahsulotTurId: number;
  readonly mahsulotTur: string;
  readonly filialId: number | null;
  readonly filial: string | null;
  readonly xodimId: number | null;
  readonly xodim: string | null;
  readonly birlik: StavkaBirligi;
  readonly amalQiladiDan: string;
  /** Bosqichli bo'lsa bir nechta, aks holda bitta */
  readonly qatorlar: readonly StavkaGuruhQatori[];
}

function birlikniOqi(x: string): StavkaBirligi {
  if (x === 'KV_M') return 'KV_M';
  if (x === 'BOSQICH') return 'BOSQICH';
  return 'DONA';
}

/**
 * Amaldagi barcha stavkalar — ekran uchun GURUHLANGAN holda.
 *
 * ⚠️ Bosqichli stavka bazada bir necha qator, ekranda esa BITTA
 *    jadval bo'lishi kerak. Guruhlash shu yerda, sahifada emas:
 *    aks holda har ekran o'z guruhlashini yozardi.
 */
export async function stavkalarRoyxati(
  ulanish: postgres.Sql,
): Promise<readonly StavkaKorinishi[]> {
  const q = await ulanish<
    {
      mahsulot_tur_id: number;
      mahsulot_tur: string;
      filial_id: number | null;
      filial: string | null;
      xodim_id: number | null;
      xodim: string | null;
      birlik: string;
      chegara_kv_m: string | null;
      qiymat: string;
      amal_qiladi_dan: string;
    }[]
  >`
    SELECT s.mahsulot_tur_id, mt.nom AS mahsulot_tur,
           s.filial_id, f.nom AS filial,
           s.xodim_id, x.ism AS xodim,
           s.birlik, s.chegara_kv_m::text, s.qiymat::text,
           s.amal_qiladi_dan::text
    FROM stavka s
    JOIN mahsulot_tur mt ON mt.id = s.mahsulot_tur_id
    LEFT JOIN filial f   ON f.id = s.filial_id
    LEFT JOIN xodim x    ON x.id = s.xodim_id
    WHERE s.faol = true
    ORDER BY mt.nom, s.amal_qiladi_dan DESC,
             s.xodim_id NULLS FIRST, s.filial_id NULLS FIRST,
             s.chegara_kv_m NULLS LAST`;

  const guruhlar = new Map<string, StavkaKorinishi>();

  for (const r of q) {
    const kalit = [
      r.mahsulot_tur_id,
      r.filial_id ?? '-',
      r.xodim_id ?? '-',
      r.amal_qiladi_dan,
    ].join('|');

    const qator: StavkaGuruhQatori = {
      chegaraKvM: r.chegara_kv_m,
      qiymat: r.qiymat,
    };

    const bor = guruhlar.get(kalit);

    if (bor === undefined) {
      guruhlar.set(kalit, {
        mahsulotTurId: r.mahsulot_tur_id,
        mahsulotTur: r.mahsulot_tur,
        filialId: r.filial_id,
        filial: r.filial,
        xodimId: r.xodim_id,
        xodim: r.xodim,
        birlik: birlikniOqi(r.birlik),
        amalQiladiDan: r.amal_qiladi_dan,
        qatorlar: [qator],
      });
    } else {
      guruhlar.set(kalit, { ...bor, qatorlar: [...bor.qatorlar, qator] });
    }
  }

  return [...guruhlar.values()];
}

/**
 * TZ 10.12 · 4.9 — stavkasi belgilanmagan mahsulot turlari.
 *
 * ⚠️ Bu ro'yxat bo'sh bo'lmasa, o'sha turdagi har ish uchun
 *    ustaga NOL haq yoziladi. Ogohlantirish ekranning tepasida
 *    turadi — aks holda buni faqat usta shikoyat qilganda bilib
 *    qolinardi.
 */
export async function stavkasizTurlar(
  ulanish: postgres.Sql,
): Promise<readonly { id: number; nom: string }[]> {
  const q = await ulanish<{ id: number; nom: string }[]>`
    SELECT mt.id, mt.nom
    FROM mahsulot_tur mt
    WHERE mt.faol = true
      AND NOT EXISTS (
        SELECT 1 FROM stavka s
        WHERE s.mahsulot_tur_id = mt.id AND s.faol = true
      )
    ORDER BY mt.nom`;

  return q;
}
