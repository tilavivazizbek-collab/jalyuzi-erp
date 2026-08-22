/**
 * lib/amal/kochirish.ts — TZ 20.7 · 22.4 · Q-02, Q-35
 *
 * Filiallar orasida material ko'chirish.
 *
 * ```
 * SOROV → YOLDA → QABUL
 *       ↘ BEKOR
 * ```
 *
 * ⚠️ 20.7.4 — «yo'lda» bo'lgan bo'lak beruvchi filial qoldig'idan
 *    CHIQARILGAN, qabul qiluvchiga HALI KIRMAGAN. Band qilib bo'lmaydi.
 *    Umumiy ombor qiymati o'zgarmaydi — 2.1-invariant saqlanadi.
 *
 * ⚠️ 20.7.3 — bo'lak tannarxi ko'chishda O'ZGARMAYDI (2.3-invariant).
 *    Transport xarajati bo'lsa — u operatsion xarajat (12.10), tannarxga
 *    qo'shilmaydi.
 *
 * ⚠️ 22.4.4 — filiallararo qarz **QABUL QILINGANDA** yoziladi, yo'lga
 *    chiqqanda emas (EC-FQ-02).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { bolakQiymati } from '@/lib/domain/tannarx';
import { pulMatn, som } from '@/lib/domain/pul';
import { qoldaQarzniTekshir } from '@/lib/domain/filial-hisob';
import { BiznesXato } from '@/lib/xato';

/** Ko'chirilayotgan bo'lakning bazadagi ko'rinishi. */
interface BolakQatori {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly eni_m: string | null;
  readonly boyi_m: string | null;
  readonly miqdor: string | null;
  readonly holat: string;
  readonly filial_id: number;
  readonly tannarx_birlik_snapshot: string;
  readonly sarflash_birligi: string;
}

/** Bo'lakning uchta o'lchov ustuni — `ombor_harakat` uchun. */
function olchovlar(b: {
  turi: string;
  eni_m: string | null;
  boyi_m: string | null;
  miqdor: string | null;
  sarflash_birligi: string;
}): { kvM: string | null; sm: string | null; dona: number | null } {
  if (b.turi !== 'DONA') {
    return {
      kvM: new Decimal(b.eni_m ?? 0).times(b.boyi_m ?? 0).toFixed(4),
      sm: null,
      dona: null,
    };
  }
  if (b.sarflash_birligi === 'SM') {
    return { kvM: null, sm: new Decimal(b.miqdor ?? 0).toFixed(2), dona: null };
  }
  return { kvM: null, sm: null, dona: Math.round(Number(b.miqdor ?? 0)) };
}

function qiymat(b: BolakQatori): string {
  return pulMatn(
    bolakQiymati({
      turi: b.turi,
      eniM: b.eni_m,
      boyiM: b.boyi_m,
      miqdor: b.miqdor,
      tannarxBirlik: som(b.tannarx_birlik_snapshot),
    }),
  );
}

// ─── 20.7.1 · 1-qadam: so'rov ─────────────────────────────────────────────

export interface SorovKirimi {
  readonly kimdanFilialId: number;
  readonly kimgaFilialId: number;
  readonly izoh: string | null;
}

/**
 * TZ 20.7.1 — «Qabul qiluvchi filial so'raydi (yoki admin o'zi yaratadi).»
 *
 * Hujjat bo'sh tug'iladi: bo'laklarni **beruvchi filial omborchisi**
 * jo'natishda tanlaydi — u o'z omborida nima borligini biladi.
 */
export async function kochirishSora(
  ulanish: postgres.Sql,
  kirim: SorovKirimi,
  xodimId: number,
): Promise<{ id: number; raqam: string }> {
  if (kirim.kimdanFilialId === kirim.kimgaFilialId) {
    throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', "o'ziga o'zi ko'chirilmaydi");
  }

  const q = await ulanish<{ id: number; raqam: string }[]>`
    INSERT INTO kochirish (raqam, kimdan_filial_id, kimga_filial_id,
                           holat, izoh, yaratdi_id)
    VALUES ('K-' || nextval('kochirish_raqam_seq'),
            ${kirim.kimdanFilialId}, ${kirim.kimgaFilialId},
            'SOROV', ${kirim.izoh}, ${xodimId})
    RETURNING id, raqam`;

  const yozuv = q[0];
  if (yozuv === undefined) throw new BiznesXato('KOCHIRISH_TOPILMADI');
  return yozuv;
}

// ─── 20.7.1 · 2-qadam: jo'natish ──────────────────────────────────────────

export interface JonatishKirimi {
  readonly kochirishId: number;
  readonly bolakIdlar: readonly number[];
  /** 22.4.1 — bo'sh bo'lsa tannarx bo'yicha avtomatik */
  readonly qarzSumma: string | null;
  readonly qarzSabab: string | null;
}

export interface JonatishNatijasi {
  readonly bolakSoni: number;
  /** 22.4.1 — hujjatga yozilgan qarz summasi */
  readonly qarzSumma: string;
  readonly tannarxBoyicha: string;
}

/**
 * TZ 20.7.1 — «Beruvchi filial OMBORCHISI bo'laklarni tanlaydi va
 * jo'natadi.» Admin tasdig'i kerak emas, summa chegarasi yo'q.
 *
 * Bitta tranzaksiyada: bo'laklar qulflanadi → `YOLDA` ga o'tadi →
 * `KOCHIRISH_CHIQDI` yoziladi → hujjat `YOLDA` bo'ladi.
 */
export async function kochirishJonat(
  ulanish: postgres.Sql,
  kirim: JonatishKirimi,
  filialId: number,
  xodimId: number,
): Promise<JonatishNatijasi> {
  if (kirim.bolakIdlar.length === 0) {
    throw new BiznesXato('KOCHIRISH_BOSH');
  }
  if (kirim.qarzSumma !== null) {
    qoldaQarzniTekshir(som(kirim.qarzSumma), kirim.qarzSabab ?? '');
  }

  return ulanish.begin(async (tx) => {
    const hujjatlar = await tx<
      { id: number; holat: string; kimdan_filial_id: number }[]
    >`
      SELECT id, holat, kimdan_filial_id FROM kochirish
      WHERE id = ${kirim.kochirishId} FOR UPDATE`;

    const hujjat = hujjatlar[0];
    if (hujjat === undefined) throw new BiznesXato('KOCHIRISH_TOPILMADI');
    if (hujjat.holat !== 'SOROV') {
      throw new BiznesXato('KOCHIRISH_HOLAT', hujjat.holat);
    }
    // Q-25 — o'z filialining omboridan boshqasi jo'nata olmaydi
    if (hujjat.kimdan_filial_id !== filialId) {
      throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', 'jo’natuvchi filial emas');
    }

    /**
     * TZ 7.3 — bo'lak qulflanadi: shu payt usta «Tugatdim» bosa yoki
     * omborchi brakka chiqarsa, ikkalasi bir bo'lakni olmaydi.
     */
    const bolaklar = await tx<BolakQatori[]>`
      SELECT b.id, b.kod, b.turi, b.eni_m, b.boyi_m, b.miqdor, b.holat,
             b.filial_id, b.tannarx_birlik_snapshot, m.sarflash_birligi
      FROM bolak b
      JOIN material m ON m.id = b.material_id
      WHERE b.id = ANY(${kirim.bolakIdlar as number[]}) AND b.faol = true
      ORDER BY b.id
      FOR UPDATE OF b`;

    if (bolaklar.length !== kirim.bolakIdlar.length) {
      throw new BiznesXato('BOLAK_TOPILMADI');
    }

    for (const b of bolaklar) {
      if (b.filial_id !== hujjat.kimdan_filial_id) {
        throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', b.kod);
      }
      // 20.7.4 — band bo'lak ko'chirilmaydi: u buyurtmaga biriktirilgan
      if (b.holat !== 'BOSH') {
        throw new BiznesXato('BOLAK_BAND', b.kod);
      }
    }

    let tannarxBoyicha = new Decimal(0);

    for (const b of bolaklar) {
      const summa = qiymat(b);
      tannarxBoyicha = tannarxBoyicha.plus(summa);
      const o = olchovlar(b);

      await tx`
        INSERT INTO kochirish_qator (kochirish_id, bolak_id, tannarx_summa_snapshot,
                                     eni_m_snapshot, boyi_m_snapshot, miqdor_snapshot)
        VALUES (${kirim.kochirishId}, ${b.id}, ${summa},
                ${b.eni_m}, ${b.boyi_m}, ${b.miqdor})`;

      await tx`
        UPDATE bolak SET holat = 'YOLDA', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE id = ${b.id}`;

      // 20.7.4 — beruvchi filial qoldig'idan CHIQDI
      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                                   miqdor_dona, tannarx_summa, manba_turi, manba_id,
                                   izoh, xodim_id)
        VALUES (${b.filial_id}, ${b.id}, 'KOCHIRISH_CHIQDI',
                ${o.kvM === null ? null : new Decimal(o.kvM).negated().toFixed(4)},
                ${o.sm === null ? null : new Decimal(o.sm).negated().toFixed(2)},
                ${o.dona === null ? null : -o.dona},
                ${new Decimal(summa).negated().toFixed(2)},
                'kochirish', ${kirim.kochirishId},
                ${"Filialga jo'natildi"}, ${xodimId})`;
    }

    const qarz = kirim.qarzSumma ?? tannarxBoyicha.toFixed(2);

    await tx`
      UPDATE kochirish
      SET holat = 'YOLDA', jonatdi_id = ${xodimId}, jonatildi = now(),
          qarz_summa = ${qarz},
          qarz_qolda = ${kirim.qarzSumma !== null},
          qarz_sabab = ${kirim.qarzSabab},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.kochirishId}`;

    // 2.4 · EC-FQ-06 — qo'lda o'zgartirilgan summa jurnalga tushadi
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'KOCHIRISH_JONATILDI', 'kochirish',
              ${kirim.kochirishId},
              ${tx.json({
                bolakSoni: bolaklar.length,
                tannarxBoyicha: tannarxBoyicha.toFixed(2),
                qarzSumma: qarz,
                qolda: kirim.qarzSumma !== null,
              })},
              ${kirim.qarzSabab})`;

    return {
      bolakSoni: bolaklar.length,
      qarzSumma: qarz,
      tannarxBoyicha: tannarxBoyicha.toFixed(2),
    };
  });
}

// ─── 20.7.1 · 3-qadam: qabul ──────────────────────────────────────────────

/** EC-FQ-03 — qabulda o'lchansa haqiqiy qiymat. */
export interface OlchovTuzatish {
  readonly bolakId: number;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly miqdor: string | null;
  readonly izoh: string;
}

export interface QabulNatijasi {
  readonly bolakSoni: number;
  /** 22.4.1 — filiallararo qarzga yozilgan summa */
  readonly qarzSumma: string;
  /** EC-FQ-06 — summa 0 bo'lsa qarz yozuvi UMUMAN yaratilmaydi (P-33) */
  readonly filialHarakatId: number | null;
}

/**
 * TZ 20.7.1 — qabul qiluvchi filial tasdiqlaydi.
 *
 * ⚠️ 22.4.4 — qarz **shu yerda** tug'iladi: qabul qiluvchi filial
 *    beruvchiga qarzdor bo'ladi.
 *
 * ⚠️ EC-FQ-03 — haqiqiy o'lcham kichik chiqsa qarz **haqiqiy o'lcham
 *    bo'yicha** hisoblanadi. Bo'lakning o'lchami tuzatiladi, tannarx
 *    birligi esa o'zgarmaydi (20.7.3).
 */
export async function kochirishQabulQil(
  ulanish: postgres.Sql,
  kirim: {
    readonly kochirishId: number;
    readonly tuzatishlar: readonly OlchovTuzatish[];
  },
  filialId: number,
  xodimId: number,
): Promise<QabulNatijasi> {
  return ulanish.begin(async (tx) => {
    const hujjatlar = await tx<
      {
        id: number;
        holat: string;
        kimdan_filial_id: number;
        kimga_filial_id: number;
        qarz_summa: string | null;
        qarz_qolda: boolean;
      }[]
    >`
      SELECT id, holat, kimdan_filial_id, kimga_filial_id, qarz_summa, qarz_qolda
      FROM kochirish WHERE id = ${kirim.kochirishId} FOR UPDATE`;

    const hujjat = hujjatlar[0];
    if (hujjat === undefined) throw new BiznesXato('KOCHIRISH_TOPILMADI');
    if (hujjat.holat !== 'YOLDA') {
      throw new BiznesXato('KOCHIRISH_HOLAT', hujjat.holat);
    }
    if (hujjat.kimga_filial_id !== filialId) {
      throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', 'qabul qiluvchi filial emas');
    }

    const qatorlar = await tx<
      {
        id: number;
        bolak_id: number;
        tannarx_summa_snapshot: string;
      }[]
    >`
      SELECT id, bolak_id, tannarx_summa_snapshot FROM kochirish_qator
      WHERE kochirish_id = ${kirim.kochirishId} ORDER BY id`;

    if (qatorlar.length === 0) throw new BiznesXato('KOCHIRISH_BOSH');

    const tuzatish = new Map(kirim.tuzatishlar.map((t) => [t.bolakId, t]));
    let haqiqiyJami = new Decimal(0);

    for (const q of qatorlar) {
      const bolaklar = await tx<BolakQatori[]>`
        SELECT b.id, b.kod, b.turi, b.eni_m, b.boyi_m, b.miqdor, b.holat,
               b.filial_id, b.tannarx_birlik_snapshot, m.sarflash_birligi
        FROM bolak b
        JOIN material m ON m.id = b.material_id
        WHERE b.id = ${q.bolak_id} FOR UPDATE OF b`;

      const b = bolaklar[0];
      if (b === undefined) throw new BiznesXato('BOLAK_TOPILMADI');
      if (b.holat !== 'YOLDA') throw new BiznesXato('BOLAK_YOLDA', b.kod);

      const t = tuzatish.get(b.id);
      const yangi: BolakQatori =
        t === undefined
          ? b
          : {
              ...b,
              eni_m: t.eniM ?? b.eni_m,
              boyi_m: t.boyiM ?? b.boyi_m,
              miqdor: t.miqdor ?? b.miqdor,
            };

      const summa = qiymat(yangi);
      haqiqiyJami = haqiqiyJami.plus(summa);
      const o = olchovlar(yangi);

      if (t !== undefined) {
        // EC-FQ-03 — o'lcham tuzatiladi, tannarx BIRLIGI o'zgarmaydi
        await tx`
          UPDATE kochirish_qator
          SET haqiqiy_eni_m = ${t.eniM}, haqiqiy_boyi_m = ${t.boyiM},
              haqiqiy_miqdor = ${t.miqdor}, olchov_izoh = ${t.izoh}
          WHERE id = ${q.id}`;
      }

      await tx`
        UPDATE bolak
        SET filial_id = ${hujjat.kimga_filial_id}, holat = 'BOSH',
            eni_m = ${yangi.eni_m}, boyi_m = ${yangi.boyi_m}, miqdor = ${yangi.miqdor},
            ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE id = ${b.id}`;

      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                                   miqdor_dona, tannarx_summa, manba_turi, manba_id,
                                   izoh, xodim_id)
        VALUES (${hujjat.kimga_filial_id}, ${b.id}, 'KOCHIRISH_KIRDI',
                ${o.kvM}, ${o.sm}, ${o.dona}, ${summa},
                'kochirish', ${kirim.kochirishId},
                ${t === undefined ? 'Filialdan qabul qilindi' : `Qabulda o'lchandi — ${t.izoh}`},
                ${xodimId})`;
    }

    /**
     * 22.4.1 — qarz summasi.
     *
     * Omborchi qo'lda summa qo'ygan bo'lsa (EC-FQ-06) o'sha qoladi.
     * Aks holda **haqiqiy** o'lcham bo'yicha (EC-FQ-03).
     */
    const qarz = hujjat.qarz_qolda
      ? (hujjat.qarz_summa ?? '0')
      : haqiqiyJami.toFixed(2);

    await tx`
      UPDATE kochirish
      SET holat = 'QABUL', qabul_qildi_id = ${xodimId}, qabul_qilindi = now(),
          qarz_summa = ${qarz}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.kochirishId}`;

    /**
     * 22.2 — «A dan B ga material ko'chirildi → B → A qarzdor».
     * Qabul qiluvchi filial beruvchiga qarzdor bo'ladi.
     *
     * ⚠️ P-33 · EC-FQ-06 — summa 0 bo'lsa yozuv UMUMAN yaratilmaydi.
     *    Nol qator balansga hech narsa qo'shmaydi (2.2-invariant), lekin
     *    `filial_harakat_summa <> 0` cheklovini buzardi. Mato bepul
     *    berilgan — qarz tug'ilmagan.
     */
    let harakatId: number | null = null;
    if (!new Decimal(qarz).isZero()) {
      const harakat = await tx<{ id: number }[]>`
        INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                    valyuta, manba_turi, manba_id,
                                    qolda_ozgartirildi, ozgartirish_sabab, izoh, xodim_id)
        VALUES (${hujjat.kimga_filial_id}, ${hujjat.kimdan_filial_id},
                'MATERIAL_KOCHIRISH', ${qarz}, 'SOM',
                'kochirish', ${kirim.kochirishId},
                ${hujjat.qarz_qolda}, ${hujjat.qarz_qolda ? 'Jo’natishda qo’lda belgilandi' : null},
                ${'Material ko’chirish'}, ${xodimId})
        RETURNING id`;

      harakatId = harakat[0]?.id ?? null;
      if (harakatId === null) throw new BiznesXato('KOCHIRISH_TOPILMADI');
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'KOCHIRISH_QABUL', 'kochirish',
              ${kirim.kochirishId},
              ${tx.json({ qarzSumma: qarz, bolakSoni: qatorlar.length })}, null)`;

    return {
      bolakSoni: qatorlar.length,
      qarzSumma: qarz,
      filialHarakatId: harakatId,
    };
  });
}

// ─── EC-FQ-02 · Bekor qilish ──────────────────────────────────────────────

/**
 * TZ 20.7.2 — «bekor qilindi» holati.
 *
 * ⚠️ EC-FQ-02 — «Ko'chirish qabul qilinmadi, bekor bo'ldi → qarz
 *    YOZILMAYDI» (22.4.4). Yo'ldagi bo'laklar beruvchi filialga qaytadi.
 */
export async function kochirishBekorQil(
  ulanish: postgres.Sql,
  kirim: { readonly kochirishId: number; readonly sabab: string },
  filialId: number,
  xodimId: number,
): Promise<{ qaytganBolak: number }> {
  if (kirim.sabab.trim() === '') {
    throw new BiznesXato('KOCHIRISH_SABAB_KERAK', 'bekor qilish');
  }

  return ulanish.begin(async (tx) => {
    const hujjatlar = await tx<
      { id: number; holat: string; kimdan_filial_id: number; kimga_filial_id: number }[]
    >`
      SELECT id, holat, kimdan_filial_id, kimga_filial_id FROM kochirish
      WHERE id = ${kirim.kochirishId} FOR UPDATE`;

    const hujjat = hujjatlar[0];
    if (hujjat === undefined) throw new BiznesXato('KOCHIRISH_TOPILMADI');
    if (hujjat.holat !== 'SOROV' && hujjat.holat !== 'YOLDA') {
      throw new BiznesXato('KOCHIRISH_HOLAT', hujjat.holat);
    }
    // Ikkala filial ham bekor qila oladi — mol hali hech kimga tegmagan
    if (
      hujjat.kimdan_filial_id !== filialId &&
      hujjat.kimga_filial_id !== filialId
    ) {
      throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', 'begona filial');
    }

    let qaytgan = 0;

    if (hujjat.holat === 'YOLDA') {
      const qatorlar = await tx<{ bolak_id: number }[]>`
        SELECT bolak_id FROM kochirish_qator
        WHERE kochirish_id = ${kirim.kochirishId} ORDER BY id`;

      for (const q of qatorlar) {
        const bolaklar = await tx<BolakQatori[]>`
          SELECT b.id, b.kod, b.turi, b.eni_m, b.boyi_m, b.miqdor, b.holat,
                 b.filial_id, b.tannarx_birlik_snapshot, m.sarflash_birligi
          FROM bolak b
          JOIN material m ON m.id = b.material_id
          WHERE b.id = ${q.bolak_id} FOR UPDATE OF b`;

        const b = bolaklar[0];
        if (b === undefined) throw new BiznesXato('BOLAK_TOPILMADI');
        if (b.holat !== 'YOLDA') throw new BiznesXato('BOLAK_YOLDA', b.kod);

        const summa = qiymat(b);
        const o = olchovlar(b);

        await tx`
          UPDATE bolak SET holat = 'BOSH', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
          WHERE id = ${b.id}`;

        // Beruvchi filial qoldig'iga QAYTDI — 2.1-invariant
        await tx`
          INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                                     miqdor_dona, tannarx_summa, manba_turi, manba_id,
                                     izoh, xodim_id)
          VALUES (${hujjat.kimdan_filial_id}, ${b.id}, 'KOCHIRISH_KIRDI',
                  ${o.kvM}, ${o.sm}, ${o.dona}, ${summa},
                  'kochirish', ${kirim.kochirishId},
                  ${`Bekor qilindi — ${kirim.sabab.trim()}`}, ${xodimId})`;

        qaytgan += 1;
      }
    }

    await tx`
      UPDATE kochirish
      SET holat = 'BEKOR', bekor_sabab = ${kirim.sabab.trim()},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.kochirishId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'KOCHIRISH_BEKOR', 'kochirish',
              ${kirim.kochirishId},
              ${tx.json({ qaytganBolak: qaytgan })}, ${kirim.sabab.trim()})`;

    return { qaytganBolak: qaytgan };
  });
}
