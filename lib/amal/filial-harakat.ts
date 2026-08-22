/**
 * lib/amal/filial-harakat.ts — TZ 22.3 · 22.5 · 22.6 · 20.17 · Q-33
 *
 * Filiallararo qarz: tayyor mahsulot, to'lov va qo'lda tuzatish.
 *
 * ⚠️ 22.7.3 — «Filiallararo qarz foyda-zararga TEGMAYDI.» Shuning uchun
 *    bu yerda `xarajat` jadvaliga hech narsa yozilmaydi.
 *
 * ⚠️ Bu fayl `./kassa` ga BOG'LANMAYDI: `kassa.ts` bu yerdagi
 *    `pulTopshirishQarziTx` ni chaqiradi (22.5), teskari bog'lanish
 *    aylana hosil qilardi. Kassa kerak bo'ladigan yagona amal —
 *    `filialQarzTolovi` — `./filial-hisob` da turadi.
 *
 * ⚠️ 2.2-invariant — balans SAQLANMAYDI, `filial_harakat` dan `SUM()`
 *    bilan chiqadi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { pulMatn, som } from '@/lib/domain/pul';
import {
  qaytarishQarzi,
  tayyorMahsulotQarzi,
  type FilialHarakati,
} from '@/lib/domain/filial-hisob';
import { BiznesXato } from '@/lib/xato';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

// ─── 22.3 · Tayyor mahsulot qarzi ─────────────────────────────────────────

export interface PozitsiyaHisobi {
  readonly sotganFilialId: number;
  readonly ishlabChiqaruvchiFilialId: number;
  readonly tushum: string;
  readonly tannarx: string;
  readonly ishHaqi: string;
}

/**
 * Pozitsiyaning uch soni — hammasi **jurnaldan** (2.2-invariant).
 *
 * `tannarx_snapshot` ishlatilmaydi: u bir slotli pozitsiyada to'g'ri,
 * lekin ombor jurnali ko'p slotda ham to'g'ri qoladi.
 */
export async function pozitsiyaHisobi(
  soruvchi: Soruvchi,
  pozitsiyaId: number,
): Promise<PozitsiyaHisobi> {
  const q = await soruvchi<
    {
      sotgan_filial_id: number;
      ishlab_chiqaruvchi_filial_id: number;
      tushum: string;
      tannarx: string;
      ish_haqi: string;
    }[]
  >`
    SELECT b.sotgan_filial_id,
           b.ishlab_chiqaruvchi_filial_id,
           (p.narx_snapshot - COALESCE(p.chegirma_summa, 0))::text AS tushum,
           COALESCE((
             SELECT -SUM(oh.tannarx_summa) FROM ombor_harakat oh
             WHERE oh.manba_turi = 'buyurtma_pozitsiya' AND oh.manba_id = p.id
           ), 0)::text AS tannarx,
           COALESCE((
             SELECT SUM(x.summa) FROM xarajat x
             WHERE x.modda = 'ISH_HAQI'
               AND (
                 (x.manba_turi = 'buyurtma_pozitsiya' AND x.manba_id = p.id)
                 OR (x.manba_turi = 'qayta_kesish' AND x.manba_id IN (
                       SELECT qk.id FROM qayta_kesish qk
                       WHERE qk.buyurtma_pozitsiya_id = p.id))
               )
           ), 0)::text AS ish_haqi
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId}`;

  const r = q[0];
  if (r === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI');

  return {
    sotganFilialId: r.sotgan_filial_id,
    ishlabChiqaruvchiFilialId: r.ishlab_chiqaruvchi_filial_id,
    tushum: r.tushum,
    tannarx: r.tannarx,
    ishHaqi: r.ish_haqi,
  };
}

/**
 * TZ 22.3.2 — qarz **«Topshirildi»** statusida yoziladi.
 *
 * Ilgari emas: «Tayyor» hali qaytishi mumkin, «Yetib keldi» da mijoz rad
 * etishi mumkin (8.8).
 *
 * ⚠️ 22.3.5 — bir filial sotgan va tikkan bo'lsa qarz **umuman
 *    tug'ilmaydi**, foyda 100% o'sha filialda (20.17.1).
 */
export async function tayyorMahsulotQarziYozTx(
  tx: postgres.TransactionSql,
  pozitsiyaId: number,
  xodimId: number,
): Promise<{ qarzId: number | null; summa: string }> {
  const h = await pozitsiyaHisobi(tx, pozitsiyaId);

  // 22.3.5 — bir filial ichida qarz yo'q
  if (h.sotganFilialId === h.ishlabChiqaruvchiFilialId) {
    return { qarzId: null, summa: '0.00' };
  }

  const natija = tayyorMahsulotQarzi({
    tushum: som(h.tushum),
    tannarx: som(h.tannarx),
    ishHaqi: som(h.ishHaqi),
  });

  const summa = pulMatn(natija.qarz);
  if (new Decimal(summa).lessThanOrEqualTo(0)) {
    return { qarzId: null, summa: '0.00' };
  }

  const y = await tx<{ id: number }[]>`
    INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                valyuta, manba_turi, manba_id, izoh, xodim_id)
    VALUES (${h.sotganFilialId}, ${h.ishlabChiqaruvchiFilialId},
            'TAYYOR_MAHSULOT', ${summa}, 'SOM',
            'buyurtma_pozitsiya', ${pozitsiyaId},
            ${natija.tushumChegarasi
              ? 'Zararli buyurtma — qarz tushum bilan cheklandi (22.3.3)'
              : 'Tayyor mahsulot (22.3.1)'},
            ${xodimId})
    RETURNING id`;

  const qarzId = y[0]?.id;
  if (qarzId === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI');
  return { qarzId, summa };
}

/**
 * TZ 22.3.4 · EC-FQ-01 — buyurtma qaytarilsa qarz **qayta hisoblanadi**.
 *
 * Formula `lib/domain/filial-hisob.ts` da (§2.2): ushlab qolingan summa
 * yangi «tushum» bo'lib olinadi va 22.3.3 chegarasi qayta qo'llanadi.
 * Farq alohida `QAYTARISH` qatori bo'lib tushadi — eski yozuv joyida
 * qoladi (§6.5, 2.3-invariant).
 */
export async function tayyorMahsulotQarziniQaytarTx(
  tx: postgres.TransactionSql,
  pozitsiyaId: number,
  ushlabQolindi: string,
  xodimId: number,
): Promise<{ teskariId: number | null }> {
  const oldingi = await tx<
    { kimdan_filial_id: number; kimga_filial_id: number; summa: string }[]
  >`
    SELECT kimdan_filial_id, kimga_filial_id, summa FROM filial_harakat
    WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
      AND turi = 'TAYYOR_MAHSULOT'`;

  const q = oldingi[0];
  // Bir filial ichida tikilgan bo'lsa qarz umuman yozilmagan (22.3.5)
  if (q === undefined) return { teskariId: null };

  const h = await pozitsiyaHisobi(tx, pozitsiyaId);

  const natija = qaytarishQarzi(som(q.summa), som(ushlabQolindi), {
    tannarx: som(h.tannarx),
    ishHaqi: som(h.ishHaqi),
  });

  const teskari = new Decimal(pulMatn(natija.teskari));
  if (teskari.isZero()) return { teskariId: null };

  const y = await tx<{ id: number }[]>`
    INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                valyuta, manba_turi, manba_id, izoh, xodim_id)
    VALUES (${q.kimdan_filial_id}, ${q.kimga_filial_id}, 'QAYTARISH',
            ${teskari.toFixed(2)}, 'SOM',
            'buyurtma_pozitsiya', ${pozitsiyaId},
            ${`Qaytarish (22.3.4) — yangi qarz ${pulMatn(natija.yangiQarz)}`},
            ${xodimId})
    RETURNING id`;

  return { teskariId: y[0]?.id ?? null };
}

// ─── 22.5 · Pul topshirish qarzi ──────────────────────────────────────────

/**
 * TZ 22.5 (Q-29) — sotuvchi pulni **boshqa filial** adminiga topshirsa,
 * qabul qilgan filial topshirgan filialga qarzdor bo'ladi.
 *
 * ⚠️ EC-FQ-08 — topshiriq storno qilinsa qarz ham teskari yoziladi.
 *    Shuning uchun yozuv `topshiriq` manbasiga bog'lanadi.
 */
export async function pulTopshirishQarziTx(
  tx: postgres.TransactionSql,
  kirim: {
    readonly topshiriqId: number;
    readonly kimdanFilialId: number;
    readonly kimgaFilialId: number;
    readonly summa: string;
    readonly valyuta: 'SOM' | 'USD';
    readonly kursSnapshot: string | null;
  },
  xodimId: number,
): Promise<{ qarzId: number | null }> {
  if (kirim.kimdanFilialId === kirim.kimgaFilialId) {
    return { qarzId: null };
  }

  /**
   * Pul `kimga` filial kassasiga tushdi → **o'sha** filial `kimdan`
   * filialga qarzdor bo'ladi (22.5.1).
   */
  const y = await tx<{ id: number }[]>`
    INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                valyuta, kurs_snapshot, manba_turi, manba_id,
                                izoh, xodim_id)
    VALUES (${kirim.kimgaFilialId}, ${kirim.kimdanFilialId}, 'PUL_TOPSHIRISH',
            ${kirim.summa}, ${kirim.valyuta}, ${kirim.kursSnapshot},
            'topshiriq', ${kirim.topshiriqId},
            ${'Boshqa filial adminiga topshirildi (22.5)'}, ${xodimId})
    RETURNING id`;

  return { qarzId: y[0]?.id ?? null };
}

// ─── 22.3.3 · EC-FQ-10 · Qo'lda tuzatish ──────────────────────────────────

/**
 * TZ 22.3.3 — «Zararni teng bo'lish kerak bo'lsa — admin `filial_harakat`
 * ga qo'lda tuzatish yozadi (`QOLDA_TUZATISH`). Bu audit jurnaliga
 * tushadi.»
 *
 * Avtomatik teng bo'lish qilinmaydi: u sotgan filial kassasidan pul
 * talab qiladi va u pul u yerda bo'lmasligi mumkin.
 */
export async function qoldaTuzatish(
  ulanish: postgres.Sql,
  kirim: {
    readonly kimdanFilialId: number;
    readonly kimgaFilialId: number;
    readonly summa: string;
    readonly sabab: string;
  },
  xodimId: number,
): Promise<{ harakatId: number }> {
  if (kirim.sabab.trim() === '') {
    throw new BiznesXato('KOCHIRISH_SABAB_KERAK', 'qo‘lda tuzatish');
  }
  if (new Decimal(kirim.summa).isZero()) {
    throw new BiznesXato('TOLOV_MANFIY', 'qo‘lda tuzatish');
  }
  if (kirim.kimdanFilialId === kirim.kimgaFilialId) {
    throw new BiznesXato('KOCHIRISH_AYNI_FILIAL', 'qo‘lda tuzatish');
  }

  return ulanish.begin(async (tx) => {
    const y = await tx<{ id: number }[]>`
      INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                  valyuta, qolda_ozgartirildi, ozgartirish_sabab,
                                  izoh, xodim_id)
      VALUES (${kirim.kimdanFilialId}, ${kirim.kimgaFilialId}, 'QOLDA_TUZATISH',
              ${new Decimal(kirim.summa).toFixed(2)}, 'SOM',
              true, ${kirim.sabab.trim()}, ${kirim.sabab.trim()}, ${xodimId})
      RETURNING id`;

    const harakatId = y[0]?.id;
    if (harakatId === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'tuzatish');

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${kirim.kimdanFilialId}, 'QOLDA_TUZATISH',
              'filial_harakat', ${harakatId},
              ${tx.json({ summa: kirim.summa, kimga: kirim.kimgaFilialId })},
              ${kirim.sabab.trim()})`;

    return { harakatId };
  });
}

/**
 * TZ EC-FQ-08 — «Sotuvchi boshqa filialga pul topshirdi, keyin storno →
 * **qarz ham teskari yoziladi**.»
 *
 * ⚠️ Manba `topshiriq_storno` bo'ladi: `filial_harakat_manba` noyob
 *    indeksi bir manbadan bir turdagi bitta yozuvga ruxsat beradi, shu
 *    sababli teskari yozuv o'z manbasiga ega bo'lishi shart (12.3
 *    naqshi bilan bir xil).
 *
 * Ikki marta chaqirilsa (ikkala kassa yozuvi ham storno qilinsa) ikkinchi
 * marta hech narsa yozilmaydi — aks holda qarz ikki barobar qaytardi.
 */
export async function pulTopshirishQarziniQaytarTx(
  tx: postgres.TransactionSql,
  topshiriqId: number,
  xodimId: number,
  sabab: string,
): Promise<{ teskariId: number | null }> {
  const oldingi = await tx<
    {
      kimdan_filial_id: number;
      kimga_filial_id: number;
      summa: string;
      valyuta: string;
      kurs_snapshot: string | null;
    }[]
  >`
    SELECT kimdan_filial_id, kimga_filial_id, summa, valyuta, kurs_snapshot
    FROM filial_harakat
    WHERE manba_turi = 'topshiriq' AND manba_id = ${topshiriqId}
      AND turi = 'PUL_TOPSHIRISH'`;

  const q = oldingi[0];
  // Bir filial ichida topshirilgan bo'lsa qarz umuman yozilmagan
  if (q === undefined) return { teskariId: null };

  const qaytarilgan = await tx<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM filial_harakat
    WHERE manba_turi = 'topshiriq_storno' AND manba_id = ${topshiriqId}`;
  if ((qaytarilgan[0]?.n ?? 0) > 0) return { teskariId: null };

  const y = await tx<{ id: number }[]>`
    INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                valyuta, kurs_snapshot, manba_turi, manba_id,
                                izoh, xodim_id)
    VALUES (${q.kimdan_filial_id}, ${q.kimga_filial_id}, 'PUL_TOPSHIRISH',
            ${new Decimal(q.summa).negated().toFixed(2)}, ${q.valyuta},
            ${q.kurs_snapshot}, 'topshiriq_storno', ${topshiriqId},
            ${`Topshiriq storno qilindi — ${sabab.trim()}`}, ${xodimId})
    RETURNING id`;

  return { teskariId: y[0]?.id ?? null };
}

// ─── 22.6.1 · 22.7 · O'qish ───────────────────────────────────────────────

/** 22.6.1 — filialning barcha harakatlari (balans domainda hisoblanadi). */
export async function filialHarakatlari(
  soruvchi: Soruvchi,
  filialId: number,
  boshSana: string | null,
  oxirSana: string | null,
): Promise<readonly FilialHarakati[]> {
  const q = await soruvchi<
    {
      kimdan_filial_id: number;
      kimga_filial_id: number;
      turi: string;
      summa: string;
    }[]
  >`
    SELECT kimdan_filial_id, kimga_filial_id, turi, summa
    FROM filial_harakat
    WHERE (kimdan_filial_id = ${filialId} OR kimga_filial_id = ${filialId})
      AND (${boshSana}::date IS NULL OR sana >= ${boshSana}::date)
      AND (${oxirSana}::date IS NULL OR sana < ${oxirSana}::date + 1)
    ORDER BY sana, id`;

  return q.map((r) => ({
    kimdanFilialId: r.kimdan_filial_id,
    kimgaFilialId: r.kimga_filial_id,
    turi: r.turi as FilialHarakati['turi'],
    summa: r.summa,
  }));
}
