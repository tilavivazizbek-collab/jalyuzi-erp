/**
 * lib/amal/kirim.ts — TZ 7.9 · QISM 1 §7.1 · 2.1-invariant
 *
 * Kirim hujjati — QISM 1 §7.1 dagi «bitta tranzaksiya bo'lishi shart
 * bo'lgan amallar» ro'yxatida:
 *
 *   «Kirim hujjati | bo'laklar yaratiladi + transport taqsimlanadi +
 *                    qarz yoziladi | 7.9, 9.2»
 *
 * Yarim bajarilish 2.1-invariantni buzadi: bo'laklar omborga tushib,
 * tannarx yozilmay qolsa hisob butunlay buziladi.
 *
 * ⚠️ Yetkazib beruvchi qarzi SHU tranzaksiyada yoziladi (T-05 yopildi,
 *    5-bosqich). Mol kelib qarz yozilmay qolsa 2.1-invariant buziladi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import {
  birlikTannarxi,
  rulonTannarxi,
  ustamaniTekshir,
  xarajatniTaqsimla,
  type DefektTuri,
  type KirimQatori,
} from '@/lib/domain/tannarx';
import { kopaytir, nolSom, pulMatn, qosh, som, type Som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

/** Rulon uchun har bo'lak o'z o'lchami bilan (7.9). */
export interface BolakOlchami {
  readonly eniM: number;
  readonly boyiM: number;
}

export interface QatorKirimi {
  readonly materialId: number;
  /** Kirim birligidagi miqdor — rulon soni, shtanga soni, dona */
  readonly miqdorKirim: number;
  readonly narxBirlik: string;
  /**
   * ⚠️ `METR` — narx uzunlik metriga (mato rulonlari). Bo'sh
   *    bo'lsa `BIRLIK`: eski hujjatlar shunday ishlagan.
   */
  readonly narxAsosi?: 'BIRLIK' | 'METR';
  readonly defektMiqdor: number;
  readonly defektTuri: DefektTuri;
  /**
   * RULON hisob turida MAJBURIY — har rulon alohida bo'lak bo'lib
   * omborga tushadi (7.9). Boshqa turlarda bo'sh.
   */
  readonly bolaklar: readonly BolakOlchami[];
}

export interface KirimKirimi {
  readonly raqam: string;
  readonly sana: string;
  readonly filialId: number;
  readonly yetkazibBeruvchiId: number;
  readonly valyuta: 'SOM' | 'USD';
  readonly kursSnapshot: string | null;
  readonly transportSumma: string;
  readonly bojxonaSumma: string;
  readonly tolovMuddati: string | null;
  readonly qatorlar: readonly QatorKirimi[];
}

/** TZ 7.9 — ustama chegaradan past bo'lsa OGOHLANTIRISH, bloklamaydi. */
export interface UstamaOgohlantirishi {
  readonly materialId: number;
  readonly materialNomi: string;
  readonly ustamaFoiz: number;
  readonly chegara: number;
}

export interface KirimNatijasi {
  readonly kirimId: number;
  readonly bolakSoni: number;
  /** «O'zimizdan brakka» ketgan summa — 7.9 xarajat moddasi */
  readonly defektZarari: Som;
  readonly ogohlantirishlar: readonly UstamaOgohlantirishi[];
}

interface MaterialQatori {
  readonly id: number;
  readonly nom: string;
  readonly hisob_turi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly sotuv_narx: string | null;
  readonly min_ustama_foiz: string | null;
}

/** TZ 5.4 — material chegarasi bo'sh qolsa sozlamadagi standart ishlaydi. */
const STANDART_USTAMA_CHEGARASI = 30;

function bolakTuri(hisobTuri: string): 'RULON' | 'OSTATKA' | 'DONA' {
  return hisobTuri === 'RULON' ? 'RULON' : 'DONA';
}

/**
 * Kirim hujjatini saqlaydi.
 *
 * Tartib muhim:
 *   1. Materiallar o'qiladi (tur va chegaralar kerak)
 *   2. Transport + bojxona qatorlarga taqsimlanadi (7.9)
 *   3. Har qator uchun tannarx hisoblanadi (P-17: bo'luvchi to'liq miqdor)
 *   4. Bo'laklar yaratiladi, har biri O'Z tannarxini eslab qoladi (7.8)
 *   5. Har bo'lak uchun `ombor_harakat` yozuvi
 *   6. Ustama tekshiriladi — faqat ogohlantirish (7.9)
 */
export async function kirimYarat(
  ulanish: postgres.Sql,
  kirim: KirimKirimi,
  xodimId: number,
): Promise<KirimNatijasi> {
  if (kirim.qatorlar.length === 0) {
    throw new BiznesXato('KIRIM_BOSH');
  }

  return ulanish.begin(async (tx) => {
    const materialIdlar = kirim.qatorlar.map((q) => q.materialId);
    const materiallar = await tx<MaterialQatori[]>`
      SELECT id, nom, hisob_turi, sarflash_birligi, koeffitsient,
             sotuv_narx, min_ustama_foiz
      FROM material WHERE id = ANY(${materialIdlar}) AND faol = true`;

    const xarita = new Map(materiallar.map((m) => [m.id, m]));
    for (const q of kirim.qatorlar) {
      if (!xarita.has(q.materialId)) {
        throw new BiznesXato('MATERIAL_TOPILMADI', String(q.materialId));
      }
    }

    // ── 2. Qo'shimcha xarajat taqsimoti (7.9) ──
    const xarajat = qosh(som(kirim.transportSumma), som(kirim.bojxonaSumma));
    /**
     * ⚠️ `METR` narxida qator qiymati rulon BO'YLARI yig'indisiga
     *    ko'paytiriladi, rulonlar soniga emas.
     */
    const jamiBoyi = (q: (typeof kirim.qatorlar)[number]): number =>
      q.bolaklar.reduce((y, b) => y + b.boyiM, 0);

    const domenQatorlar: KirimQatori[] = kirim.qatorlar.map((q, i) => ({
      id: i,
      miqdor: q.miqdorKirim,
      narxBirlik: som(q.narxBirlik),
      defektMiqdor: q.defektMiqdor,
      narxAsosi: q.narxAsosi,
      jamiBoyiM: jamiBoyi(q),
    }));
    const ulushlar = xarajatniTaqsimla(domenQatorlar, xarajat);

    // ── Hujjat sarlavhasi ──
    const hujjat = await tx<{ id: number }[]>`
      INSERT INTO kirim (raqam, sana, filial_id, yetkazib_beruvchi_id, valyuta,
                         kurs_snapshot, transport_summa, bojxona_summa,
                         tolov_muddati, yaratdi_id)
      VALUES (${kirim.raqam}, ${kirim.sana}, ${kirim.filialId},
              ${kirim.yetkazibBeruvchiId}, ${kirim.valyuta}, ${kirim.kursSnapshot},
              ${kirim.transportSumma}, ${kirim.bojxonaSumma},
              ${kirim.tolovMuddati}, ${xodimId})
      RETURNING id`;

    const kirimId = hujjat[0]?.id;
    if (kirimId === undefined) throw new BiznesXato('KIRIM_SAQLANMADI');

    let defektZarari = nolSom();
    let bolakSoni = 0;
    /** T-05 · TZ 9.2 — yetkazib beruvchiga qarz (transport va bojxonasiz) */
    let xaridSummasi = nolSom();
    const ogohlantirishlar: UstamaOgohlantirishi[] = [];

    for (const [i, q] of kirim.qatorlar.entries()) {
      const material = xarita.get(q.materialId);
      const ulush = ulushlar.find((u) => u.id === i);
      if (material === undefined || ulush === undefined) continue;

      // ── 3. Tannarx (P-17: bo'luvchi TO'LIQ miqdor) ──
      const tannarx = birlikTannarxi(
        {
          id: i,
          miqdor: q.miqdorKirim,
          narxBirlik: som(q.narxBirlik),
          defektMiqdor: q.defektMiqdor,
          narxAsosi: q.narxAsosi,
          jamiBoyiM: jamiBoyi(q),
        },
        ulush.ulush,
        q.defektTuri,
      );
      defektZarari = qosh(defektZarari, tannarx.defektZarari);
      xaridSummasi = qosh(
        xaridSummasi,
        kopaytir(som(q.narxBirlik), String(q.miqdorKirim)),
      );

      const qator = await tx<{ id: number }[]>`
        INSERT INTO kirim_qator (kirim_id, material_id, miqdor_kirim, narx_birlik,
                                 defekt_miqdor, defekt_turi, transport_ulush,
                                 tannarx_birlik, yaratdi_id)
        VALUES (${kirimId}, ${q.materialId}, ${q.miqdorKirim}, ${q.narxBirlik},
                ${q.defektMiqdor}, ${q.defektTuri}, ${pulMatn(ulush.ulush)},
                ${pulMatn(tannarx.birlikTannarx)}, ${xodimId})
        RETURNING id`;

      const qatorId = qator[0]?.id;
      if (qatorId === undefined) throw new BiznesXato('KIRIM_SAQLANMADI');

      // ── 4. Bo'laklar ──
      const turi = bolakTuri(material.hisob_turi);

      if (turi === 'RULON') {
        // TZ 7.9 — «Rulon uchun eni va bo'yi MAJBURIY, har rulon alohida yozuv»
        if (q.bolaklar.length !== q.miqdorKirim) {
          throw new BiznesXato(
            'KIRIM_BOLAK_YETISHMAYDI',
            `${material.nom}: ${String(q.miqdorKirim)} ta rulon uchun ` +
              `${String(q.bolaklar.length)} ta o'lcham kiritilgan`,
          );
        }

        for (const olcham of q.bolaklar) {
          /**
           * ⚠️ Bo'lak tannarxi SARFLASH BIRLIGIDA saqlanadi (kv.m uchun),
           * kirim birligida (rulon uchun) emas.
           *
           * AUDIT EC-OMB-06 aynan shunday yozadi: «kirim №44: 78 000/kv.m
           * vs №51: 91 000/kv.m». Kesimda ham kv.m bilan hisoblanadi.
           *
           * Har rulon O'Z maydoniga bo'linadi: bir xil narxdagi kichikroq
           * rulonning kv.m tannarxi yuqoriroq — bu iqtisodiy jihatdan
           * to'g'ri (QARORLAR-KOD P-20).
           */
          const maydon = olcham.eniM * olcham.boyiM;

          /**
           * ⚠️ `METR` narxida har rulon O'Z BO'YIGA mutanosib
           *    to'lanadi: 50 metrlik rulon 30 metrlikdan qimmat.
           *    Qator qiymatini rulonlar SONIGA bo'lsak, qisqasi
           *    haddan qimmat, uzuni haddan arzon chiqardi.
           *
           *    Natijada kv.m tannarxi faqat ENIga bog'liq bo'ladi —
           *    metr narxi bir xil bo'lsa keng rulon arzonroq.
           */
          const rulonNarxi =
            q.narxAsosi === 'METR'
              ? rulonTannarxi(tannarx.jamiQiymat, jamiBoyi(q), olcham.boyiM)
              : tannarx.birlikTannarx;

          const kvMTannarx = new Decimal(pulMatn(rulonNarxi)).div(maydon);

          await bolakYoz(tx, {
            materialId: q.materialId,
            filialId: kirim.filialId,
            turi: 'RULON',
            eniM: olcham.eniM,
            boyiM: olcham.boyiM,
            miqdor: null,
            kirimQatorId: qatorId,
            tannarx: kvMTannarx.toFixed(4),
            valyuta: kirim.valyuta,
            xodimId,
            kvM: maydon,
          });
          bolakSoni += 1;
        }
      } else {
        // DONA va CHIZIQLI — bo'lak yo'q, bitta yozuv bilan hisoblanadi (7.8)
        const koeff = new Decimal(material.koeffitsient);
        const sarflashMiqdori = koeff.times(tannarx.kirimMiqdor).toNumber();

        /**
         * Q-01 — koeffitsient «1 kirim birligida nechta sarflash birligi».
         * Tannarx ham shu birlikka o'giriladi: 66 000 so'm/shtanga va
         * 1 shtanga = 300 sm bo'lsa, 220 so'm/sm.
         */
        const sarflashTannarx = new Decimal(pulMatn(tannarx.birlikTannarx)).div(koeff);

        await bolakYoz(tx, {
          materialId: q.materialId,
          filialId: kirim.filialId,
          turi: 'DONA',
          eniM: null,
          boyiM: null,
          miqdor: sarflashMiqdori,
          kirimQatorId: qatorId,
          tannarx: sarflashTannarx.toFixed(4),
          valyuta: kirim.valyuta,
          xodimId,
          sm: material.sarflash_birligi === 'SM' ? sarflashMiqdori : null,
          dona: material.sarflash_birligi === 'DONA' ? Math.round(sarflashMiqdori) : null,
        });
        bolakSoni += 1;
      }

      // ── 6. Ustama nazorati (7.9) — BLOKLAMAYDI ──
      const chegara =
        material.min_ustama_foiz === null
          ? STANDART_USTAMA_CHEGARASI
          : Number(material.min_ustama_foiz);

      const tekshiruv = ustamaniTekshir(
        material.sotuv_narx === null ? null : som(material.sotuv_narx),
        tannarx.birlikTannarx,
        chegara,
      );

      if (tekshiruv?.pastmi === true) {
        ogohlantirishlar.push({
          materialId: material.id,
          materialNomi: material.nom,
          ustamaFoiz: tekshiruv.ustamaFoiz,
          chegara,
        });
      }
    }

    /**
     * T-05 · TZ 9.2 · QISM 1 §7.1 — «Kirim hujjati: bo'laklar
     * yaratiladi + transport taqsimlanadi + **QARZ YOZILADI**.»
     *
     * ⚠️ O'SHA BITTA tranzaksiyada (2.1-invariant): mol kelib, qarz
     *    yozilmay qolsa yetkazib beruvchi balansi jimgina noto'g'ri
     *    bo'lardi va buni faqat oy oxirida sezilardi.
     *
     * ⚠️ Transport va bojxona qarzga KIRMAYDI — ular alohida
     *    to'lanadi (7.9, C3 kodi) va tannarxga allaqachon qo'shilgan.
     *    Ikkalasini ham qarzga qo'shish pulni ikki marta sanardi.
     */
    await tx`
      INSERT INTO yetkazib_beruvchi_harakat
        (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
         manba_turi, manba_id, izoh, xodim_id)
      VALUES (${kirim.yetkazibBeruvchiId}, ${kirim.filialId}, 'XARID',
              ${pulMatn(xaridSummasi)}, ${kirim.valyuta}, ${kirim.kursSnapshot},
              'kirim', ${kirimId}, ${`Kirim ${kirim.raqam}`}, ${xodimId})`;

    return { kirimId, bolakSoni, defektZarari, ogohlantirishlar };
  });
}

interface BolakYozuvi {
  readonly materialId: number;
  readonly filialId: number;
  readonly turi: 'RULON' | 'DONA';
  readonly eniM: number | null;
  readonly boyiM: number | null;
  readonly miqdor: number | null;
  readonly kirimQatorId: number;
  readonly tannarx: string;
  readonly valyuta: string;
  readonly xodimId: number;
  readonly kvM?: number;
  readonly sm?: number | null;
  readonly dona?: number | null;
}

/**
 * Bo'lak va uning `ombor_harakat` yozuvi — birga.
 *
 * Kod markazlashgan ketma-ketlikdan olinadi (QISM 3 §3.1): bir vaqtda
 * ikki kirim qilinsa ham raqamlar to'qnashmaydi.
 */
async function bolakYoz(tx: postgres.TransactionSql, b: BolakYozuvi): Promise<void> {
  const prefiks = b.turi === 'RULON' ? 'R' : 'D';

  const yaratilgan = await tx<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m, miqdor,
                       kirim_qator_id, tannarx_birlik_snapshot,
                       tannarx_valyuta_snapshot, yaratdi_id)
    VALUES (${b.materialId}, ${b.filialId},
            ${prefiks} || '-' || nextval('bolak_kod_seq'),
            ${b.turi}, ${b.eniM}, ${b.boyiM}, ${b.miqdor},
            ${b.kirimQatorId}, ${b.tannarx}, ${b.valyuta}, ${b.xodimId})
    RETURNING id`;

  const bolakId = yaratilgan[0]?.id;
  if (bolakId === undefined) throw new BiznesXato('KIRIM_SAQLANMADI');

  // Tannarx endi SARFLASH birligida (P-20), shuning uchun summa
  // miqdorga ko'paytiriladi: rulonda kv.m, donada sarflash miqdori
  const summa = new Decimal(b.tannarx).times(
    b.turi === 'RULON' ? (b.kvM ?? 0) : (b.miqdor ?? 0),
  );

  await tx`
    INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                               miqdor_dona, tannarx_summa, manba_turi, manba_id,
                               xodim_id)
    VALUES (${b.filialId}, ${bolakId}, 'KIRIM', ${b.kvM ?? null}, ${b.sm ?? null},
            ${b.dona ?? null}, ${summa.toFixed(2)}, 'kirim_qator',
            ${b.kirimQatorId}, ${b.xodimId})`;
}

// ─── 7.12 · Kirim hujjatini storno qilish ─────────────────────────────────

export interface StornoNatijasi {
  readonly kirimRaqam: string;
  readonly qaytarilganBolak: number;
  readonly jamiSumma: Som;
  /** 2.5-invariant — qoldiq manfiyga tushgan materiallar */
  readonly manfiyQoldiq: readonly string[];
}

/**
 * TZ 7.12 — «Xato kiritilgan kirim hujjati storno qilinadi.»
 *
 * ⚠️ STORNO TO'LIQ BO'LADI — hujjatdagi barcha material qaytariladi,
 *    o'sha rulonlardan ALLAQACHON KESILGAN bo'lsa ham.
 *
 * ⚠️ QOLDIQ MANFIYGA TUSHISHI MUMKIN va bu RUXSAT ETILGAN (2.5-invariant):
 *    «storno qo'lda bajariladigan amal, avtomatik operatsiya emas. Manfiy
 *     qoldiq qizil bilan belgilanadi va admin tuzatgunicha shunday turadi.»
 *
 * ⚠️ KESILGAN BUYURTMALARGA TEGILMAYDI — ular o'z tannarxi bilan qotib
 *    qolgan (2.3-invariant). Storno o'tgan oyning foydasini o'zgartirmaydi.
 *
 * TZ 7.12 storno UCH JOYGA birdan tegishini talab qiladi:
 *   1. Ombor — qoldiq qaytariladi          ✅ shu yerda
 *   2. Yetkazib beruvchi qarzi — kamayadi   ✅ teskari yozuv bilan
 *   3. Kassa — balans avansga o'tadi        ⏳ to'lov moduli (12.5, K4)
 */
export async function kirimniStorno(
  ulanish: postgres.Sql,
  kirimId: number,
  sabab: string,
  xodimId: number,
): Promise<StornoNatijasi> {
  if (sabab.trim() === '') {
    throw new BiznesXato('KIRIM_SAQLANMADI', 'storno sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const hujjatlar = await tx<
      { id: number; raqam: string; holat: string; filial_id: number }[]
    >`SELECT id, raqam, holat, filial_id FROM kirim WHERE id = ${kirimId} FOR UPDATE`;

    const hujjat = hujjatlar[0];
    if (hujjat === undefined) throw new BiznesXato('KIRIM_TOPILMADI', String(kirimId));
    if (hujjat.holat === 'STORNO') {
      throw new BiznesXato('KIRIM_ALLAQACHON_STORNO', hujjat.raqam);
    }

    const bolaklar = await tx<
      {
        id: number;
        kod: string;
        turi: string;
        holat: string;
        eni_m: string | null;
        boyi_m: string | null;
        miqdor: string | null;
        tannarx_birlik_snapshot: string;
        material_nomi: string;
        sarflash_birligi: string;
      }[]
    >`
      SELECT b.id, b.kod, b.turi, b.holat, b.eni_m, b.boyi_m, b.miqdor,
             b.tannarx_birlik_snapshot, m.nom AS material_nomi, m.sarflash_birligi
      FROM bolak b
      JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
      JOIN material m ON m.id = b.material_id
      WHERE kq.kirim_id = ${kirimId}
      FOR UPDATE OF b`;

    let jami = new Decimal(0);
    const manfiyQoldiq = new Set<string>();

    for (const b of bolaklar) {
      const kvM =
        b.turi === 'DONA' ? null : new Decimal(b.eni_m ?? 0).times(b.boyi_m ?? 0);
      const summa =
        b.turi === 'DONA'
          ? new Decimal(b.tannarx_birlik_snapshot).times(b.miqdor ?? 0)
          : new Decimal(b.tannarx_birlik_snapshot).times(kvM ?? 0);

      jami = jami.plus(summa);

      // 7.12 — bo'lak allaqachon kesilgan bo'lsa ham qaytariladi.
      // Uning qoldig'i manfiyga tushadi va qizil bo'lib turadi (2.5).
      if (b.holat !== 'BOSH') manfiyQoldiq.add(b.material_nomi);

      const sm = b.turi === 'DONA' && b.sarflash_birligi === 'SM' ? b.miqdor : null;
      const dona =
        b.turi === 'DONA' && b.sarflash_birligi === 'DONA'
          ? Math.round(Number(b.miqdor ?? 0))
          : null;

      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                                   miqdor_dona, tannarx_summa, manba_turi, manba_id,
                                   izoh, xodim_id)
        VALUES (${hujjat.filial_id}, ${b.id}, 'STORNO',
                ${kvM === null ? null : kvM.negated().toFixed(4)},
                ${sm === null ? null : new Decimal(sm).negated().toFixed(2)},
                ${dona === null ? null : -dona},
                ${summa.negated().toFixed(2)}, 'kirim', ${kirimId},
                ${`Kirim ${hujjat.raqam} storno qilindi`}, ${xodimId})`;
    }

    // Bandlar bo'shatiladi — bo'lak endi omborda yo'q
    const bolakIdlar = bolaklar.map((b) => b.id);
    if (bolakIdlar.length > 0) {
      await tx`
        UPDATE band SET holat = 'BOSHATILDI', boshatish_sabab = 'BEKOR',
                        boshatish_izoh = 'Kirim hujjati storno qilindi',
                        boshatildi = now(), ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE bolak_id = ANY(${bolakIdlar}) AND holat = 'FAOL'`;

      await tx`
        UPDATE bolak SET faol = false, ochirildi = now(),
                         ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE id = ANY(${bolakIdlar})`;
    }

    await tx`
      UPDATE kirim SET holat = 'STORNO', storno_sabab = ${sabab.trim()},
                       ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirimId}`;

    /**
     * TZ 7.12, 2-nuqta — yetkazib beruvchi qarzi kamayadi.
     *
     * ⚠️ Harakat jadvali o'zgarmas (§6.5), shuning uchun TESKARI YOZUV:
     *    asl `XARID` qatori joyida qoladi va tarixda ko'rinadi.
     */
    const xaridlar = await tx<{ summa: string; valyuta: string; kurs: string | null }[]>`
      SELECT summa, valyuta, kurs_snapshot AS kurs
      FROM yetkazib_beruvchi_harakat
      WHERE manba_turi = 'kirim' AND manba_id = ${kirimId} AND turi = 'XARID'`;

    for (const x of xaridlar) {
      await tx`
        INSERT INTO yetkazib_beruvchi_harakat
          (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
           manba_turi, manba_id, izoh, xodim_id)
        SELECT k.yetkazib_beruvchi_id, k.filial_id, 'XARID',
               ${(-Number(x.summa)).toFixed(2)}, ${x.valyuta}, ${x.kurs},
               'kirim_storno', ${kirimId},
               ${`Storno ${hujjat.raqam} — ${sabab.trim()}`}, ${xodimId}
        FROM kirim k WHERE k.id = ${kirimId}`;
    }

    // TZ 7.12 — «Adminga xabar ketadi va audit jurnaliga yoziladi:
    // hujjat raqami, summa, kim storno qildi, sabab.»
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${hujjat.filial_id}, 'STORNO', 'kirim', ${kirimId},
              ${tx.json({ holat: 'FAOL', raqam: hujjat.raqam })},
              ${tx.json({
                holat: 'STORNO',
                bolak_soni: bolaklar.length,
                summa: jami.toFixed(2),
                manfiy_qoldiq: [...manfiyQoldiq],
              })},
              ${sabab.trim()})`;

    return {
      kirimRaqam: hujjat.raqam,
      qaytarilganBolak: bolaklar.length,
      jamiSumma: som(jami.toFixed(2)),
      manfiyQoldiq: [...manfiyQoldiq],
    };
  });
}
