/**
 * app/(panel)/hisobot/malumot.ts — TZ 11.7 · Q-25
 *
 * Ombor hisobotlarining baza so'rovlari.
 *
 * ⚠️ HISOB BU YERDA QILINMAYDI. Har so'rov xom qatorlarni yig'adi va
 * `lib/domain/hisobot/` dagi funksiyaga beradi. Sabab §2.2 da: ustama
 * formulasi SQL ga ko'chirilsa, u ikki joyda yashaydi va biri tuzatilib
 * ikkinchisi qolib ketadi.
 *
 * ⚠️ Hisobotlar SAQLANMAYDI (11.1) — har ochilganda joriy ma'lumotdan
 * yig'iladi.
 *
 * Q-25 — har filialda o'z ombori, shuning uchun har so'rov `filialId`
 * bilan cheklanadi.
 */

import Decimal from 'decimal.js';
import { pozitsiyaNatijasiUstunlari } from '@/lib/amal/filial-harakat';
import { ulanishOl } from '@/lib/db';
import { bolakQiymatiIfodasi, filialQoldigi } from '../ombor/malumot';
import { joriyKurs } from '@/lib/amal/kurs';
import { type Davr, kunlarSoni } from '@/lib/domain/hisobot/davr';
import {
  type AbcNatija,
  type AbcKirish,
  abcTahlil,
} from '@/lib/domain/hisobot/abc';
import {
  type Bashorat,
  ortachaTezlik,
  qanchaKerak,
  qanchaKunQoldi,
} from '@/lib/domain/hisobot/bashorat';
import {
  type MuzlaganPul,
  QIMIRLAMAGAN_OY,
  muzlaganPul,
  ostatkasizQoldiq,
  qimirlamaganKun,
} from '@/lib/domain/hisobot/muzlagan-pul';
import {
  type EroziyaHisoboti,
  ustamaEroziyasi,
  ustamaUchunNarx,
} from '@/lib/domain/hisobot/ustama-eroziya';
import { materialNarxQoidalari } from '../buyurtma/yangi/malumot';
import { kurs, pulMatn, som } from '@/lib/domain/pul';
import type { FoydaZararKirimi } from '@/lib/domain/hisobot/foyda-zarar';
import { VAQT_ZONASI, toshkentKuni as toshkentKuniOl } from '@/lib/domain/sana';
import { qarzniTaqsimla, type QarzBandi } from '@/lib/domain/qarz-taqsimot';
import { kunQosh } from '@/lib/domain/hisobot/pul-prognozi';
import { qarzdorlarJurnali } from '../mijoz/qarz-malumot';
import { yetkazibHolatlari } from '../yetkazib/taqsimot';

/**
 * Bo'lakning ombordagi qiymati — SQL ifodasi.
 *
 * `bolakQiymati` domainda bor, lekin u BITTA bo'lak uchun. Yig'indi
 * so'rovlarida har bo'lakni koddan o'tkazish minglab qatorda qimmat
 * tushadi, shuning uchun formula SQL da takrorlanadi. Mantiq bir xil:
 * DONA → `miqdor`, qolgani → `eni × bo'yi`.
 *
 * ⚠️ Omborda turgan bo'lak — `BOSH` va `BAND`. `YOLDA` 20.7.4 bo'yicha
 * beruvchi filial qoldig'idan allaqachon chiqarilgan.
 */

// ─── 11.7.5 · Ustama eroziyasi ────────────────────────────────────────────

interface UstamaQatori {
  readonly material_id: number;
  readonly nom: string;
  readonly sotuv_narx: string | null;
  readonly sotuv_valyuta: string;
  readonly min_ustama_foiz: string | null;
  readonly tannarx: string | null;
}

/**
 * TZ 11.7.5 — barcha materialning joriy ustamasi.
 *
 * Joriy tannarx — omborda turgan bo'laklarning **o'rtacha og'irlangan**
 * tannarxi: `Σ(qiymat) / Σ(miqdor)`. Oxirgi kirim narxi olinmaydi —
 * omborda eski va yangi partiya aralash turadi va sotuv o'rtachadan
 * ketadi.
 *
 * Dollardagi katalog narxi joriy kurs bilan so'mga keltiriladi
 * (`katalogNarxi`). Kurs yo'q bo'lsa dollarli materiallar
 * «hisoblanmadi» bo'lib chiqadi — jimgina dollarni so'm deb qabul
 * qilish narxni ming barobar kamaytirardi.
 */
export async function ustamaHisoboti(
  filialId: number,
  /**
   * Faqat bitta material — material kartochkasi uchun (ombor auditi
   * 2026-10-06). Kartochka endi O'Z hisobini yuritmaydi: oddiy AVG va
   * valyutani hisobga olmaslik shu bilan yo'qoldi.
   */
  materialId: number | null = null,
): Promise<EroziyaHisoboti> {
  const sql = ulanishOl();
  const kursMatn = await joriyKurs(sql);

  const qatorlar = await sql<UstamaQatori[]>`
    SELECT m.id AS material_id, m.nom, m.sotuv_narx::text, m.sotuv_valyuta,
           m.min_ustama_foiz::text,
           (SUM(${bolakQiymatiIfodasi(sql)})
            / NULLIF(SUM(CASE WHEN b.turi = 'DONA'
                              THEN COALESCE(b.miqdor, 0)
                              ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END), 0)
           )::text AS tannarx
    FROM material m
    JOIN bolak b ON b.material_id = m.id
    /*
     * ⚠️ m.faol SHARTI ATAYLAB YO'Q (2026-09-06).
     *
     *    Material ro'yxatdan chiqarilgan bo'lishi mumkin, lekin
     *    uning matosi omborda TURIBDI — u hamon PUL. Shart
     *    qo'yilsa ombor qiymati jimgina kamayib ketardi va
     *    farqni topib bo'lmasdi.
     *
     *    Bo'lakning O'Z holati esa tekshiriladi: ishlatilgani va
     *    chiqindi sanalmaydi.
     */
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
      AND b.tannarx_valyuta_snapshot = 'SOM'
      ${materialId === null ? sql`` : sql`AND m.id = ${materialId}`}
    GROUP BY m.id
    ORDER BY m.nom`;

  const k = kursMatn === null ? null : kurs(kursMatn, new Date(), 'JORIY');

  /**
   * ⚠️ EGASI QARORI 2026-10-07 — «belgilab qo'yilgan narxga tayansin».
   *    Sotuv narxi «Materialni o'zi sotish» jadvalidan, SOTUV EKRANI
   *    yuklaydigan funksiya bilan (`materialNarxQoidalari`) va bir xil
   *    tanlov bilan (`ustamaUchunNarx` → `qoidaniTop`). Jadvalda yo'q
   *    bo'lsa — materialning o'z narxi, sotuv ham shunday qiladi.
   */
  const narxQoidalari = await materialNarxQoidalari(filialId);

  return ustamaEroziyasi(
    qatorlar.map((q) => {
      const n = ustamaUchunNarx({
        qoidalar: narxQoidalari,
        materialId: q.material_id,
        filialId,
        eskiNarx: q.sotuv_narx,
        eskiValyuta: q.sotuv_valyuta,
        kurs: k,
      });
      return {
        materialId: q.material_id,
        nom: q.nom,
        tannarx: som(q.tannarx ?? 0),
        sotuvNarx: n.narx ?? som(0),
        chegara: q.min_ustama_foiz === null ? null : Number(q.min_ustama_foiz),
        narxManbai: n.manba,
      };
    }),
  );
}

// ─── 11.7.6 · Muzlab qolgan pul ───────────────────────────────────────────

export interface MuzlaganTafsilot extends MuzlaganPul {
  readonly ostatkaQatorlari: readonly {
    readonly bolakId: number;
    readonly kod: string;
    readonly materialNom: string;
    readonly olcham: string;
    readonly qiymat: string;
    /** T-03 — kesimdan qolganidan beri necha kun */
    readonly yoshKun: number;
    /** T-03 — `QIMIRLAMAGAN_OY` dan oshgan: chiqindiga chiqarish taklif qilinadi */
    readonly eski: boolean;
  }[];
  readonly tayyorQatorlari: readonly {
    readonly buyurtmaId: number;
    readonly raqam: string;
    readonly mijozNom: string;
    readonly qiymat: string;
    readonly kutganKun: number;
  }[];
  readonly qimirlamaganQatorlari: readonly {
    readonly materialId: number;
    readonly nom: string;
    readonly qiymat: string;
    readonly kunlar: number | null;
  }[];
}

/**
 * TZ 11.7.6 — uch joyda o'lik yotgan pul.
 *
 * ⚠️ QO'SH SANASH: 6 oy qimirlamagan materialning ostatkalari birinchi
 * bo'lakda allaqachon sanalgan. Shuning uchun uchinchi bo'lakdan ostatka
 * qiymati AYIRILADI (`ostatkasizQoldiq`) — aks holda jami summa
 * haqiqatdan katta chiqadi (12.1 naqshi).
 *
 * ⚠️ Ostatkalardan faqat `BOSH` olinadi: `BAND` ostatka pozitsiyaga
 * biriktirilgan va tez orada ishlatiladi — u o'lik pul emas.
 */
export async function muzlaganPulHisoboti(filialId: number): Promise<MuzlaganTafsilot> {
  const sql = ulanishOl();

  const ostatkalar = await sql<
    {
      bolak_id: number;
      kod: string;
      material_id: number;
      material_nom: string;
      eni_m: string | null;
      boyi_m: string | null;
      qiymat: string;
      yosh_kun: number;
      eski: boolean;
    }[]
  >`
    SELECT b.id AS bolak_id, b.kod, b.material_id, m.nom AS material_nom,
           b.eni_m::text, b.boyi_m::text,
           EXTRACT(DAY FROM now() - b.yaratildi)::int AS yosh_kun,
           (b.yaratildi < now() - (${QIMIRLAMAGAN_OY} || ' months')::interval) AS eski,
           (COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0)
            * b.tannarx_birlik_snapshot)::numeric(14,2)::text AS qiymat
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.turi = 'OSTATKA' AND b.holat = 'BOSH'
    ORDER BY qiymat DESC, b.id`;

  const tayyor = await sql<
    {
      pozitsiya_id: number;
      buyurtma_id: number;
      raqam: string;
      mijoz_nom: string;
      qiymat: string | null;
      kutgan_kun: number | null;
    }[]
  >`
    SELECT p.id AS pozitsiya_id, bu.id AS buyurtma_id, bu.raqam,
           COALESCE(mi.ism, '—') AS mijoz_nom,
           p.tannarx_snapshot::text AS qiymat,
           EXTRACT(DAY FROM now() - p.tugatildi)::int AS kutgan_kun
    FROM buyurtma_pozitsiya p
    JOIN buyurtma bu ON bu.id = p.buyurtma_id
    LEFT JOIN mijoz mi ON mi.id = bu.mijoz_id
    WHERE p.tayyor_mahsulot = true
      AND p.holat NOT IN ('TOPSHIRILDI','BEKOR')
      AND bu.sotgan_filial_id = ${filialId}
    ORDER BY kutgan_kun DESC NULLS LAST, p.id`;

  /**
   * Oxirgi harakatdan beri 6 oy o'tgan materiallar. `ombor_harakat`
   * bo'lakka bog'langan, shuning uchun material bo'yicha eng oxirgi
   * sana olinadi.
   */
  const qimirlamagan = await sql<
    {
      material_id: number;
      nom: string;
      qoldiq_qiymati: string;
      ostatka_qiymati: string;
      oxirgi_harakat: Date | null;
    }[]
  >`
    WITH oxirgi AS (
      -- Material bo'yicha oxirgi harakat BIR MARTA hisoblanadi (2026-10-14 gacha
      -- har material uchun uch marta qism-so'rov edi — katta omborda 26 soniya)
      SELECT b2.material_id, MAX(oh.sana) AS sana
      FROM ombor_harakat oh
      JOIN bolak b2 ON b2.id = oh.bolak_id
      WHERE oh.filial_id = ${filialId} AND oh.turi <> 'BOSHLANGICH'
      GROUP BY b2.material_id
    )
    SELECT m.id AS material_id, m.nom,
           SUM(${bolakQiymatiIfodasi(sql)})::numeric(14,2)::text AS qoldiq_qiymati,
           COALESCE(SUM(CASE WHEN b.turi = 'OSTATKA' AND b.holat = 'BOSH'
                             THEN COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0)
                                  * b.tannarx_birlik_snapshot
                             ELSE 0 END), 0)::numeric(14,2)::text AS ostatka_qiymati,
           o.sana AS oxirgi_harakat
    FROM material m
    JOIN bolak b ON b.material_id = m.id
    LEFT JOIN oxirgi o ON o.material_id = m.id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
    GROUP BY m.id, o.sana
    HAVING o.sana IS NULL
        OR o.sana < now() - (${QIMIRLAMAGAN_OY} || ' months')::interval
    ORDER BY m.nom`;

  const bugun = new Date();

  const qimirlamaganKirishi = qimirlamagan.map((q) => ({
    materialId: q.material_id,
    nom: q.nom,
    // Ostatka birinchi bo'lakda sanalgan — bu yerdan ayiriladi
    qiymat: ostatkasizQoldiq(som(q.qoldiq_qiymati), som(q.ostatka_qiymati)),
    oxirgiHarakat: q.oxirgi_harakat,
  }));

  const natija = muzlaganPul({
    ostatkalar: ostatkalar.map((q) => ({
      bolakId: q.bolak_id,
      materialId: q.material_id,
      materialNom: q.material_nom,
      qiymat: som(q.qiymat),
    })),
    tayyorMahsulot: tayyor.map((q) => ({
      buyurtmaId: q.buyurtma_id,
      raqam: q.raqam,
      mijozNom: q.mijoz_nom,
      qiymat: som(q.qiymat ?? 0),
      kutganKun: q.kutgan_kun ?? 0,
    })),
    qimirlamagan: qimirlamaganKirishi,
  });

  return {
    ...natija,
    ostatkaQatorlari: ostatkalar.map((q) => ({
      bolakId: q.bolak_id,
      kod: q.kod,
      materialNom: q.material_nom,
      olcham: `${q.eni_m ?? '—'} × ${q.boyi_m ?? '—'}`,
      qiymat: q.qiymat,
      yoshKun: q.yosh_kun,
      eski: q.eski,
    })),
    tayyorQatorlari: tayyor.map((q) => ({
      buyurtmaId: q.buyurtma_id,
      raqam: q.raqam,
      mijozNom: q.mijoz_nom,
      qiymat: q.qiymat ?? '0',
      kutganKun: q.kutgan_kun ?? 0,
    })),
    qimirlamaganQatorlari: qimirlamaganKirishi.map((q) => ({
      materialId: q.materialId,
      nom: q.nom,
      qiymat: pulMatn(q.qiymat),
      kunlar: qimirlamaganKun(q.oxirgiHarakat, bugun),
    })),
  };
}

// ─── §3.1 №13–14 · Sarflanish tezligi va tugash bashorati ─────────────────

export interface TezlikQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly sarflashBirligi: string;
  /** Omborda qolgan miqdor — kv.m, sm yoki dona */
  readonly qoldiq: number;
  /** Davr ichida sarflangan miqdor */
  readonly sarf: number;
  readonly kunlikTezlik: number;
  readonly bashorat: Bashorat;
  /** 30 kunga yetishi uchun yetishmayotgan miqdor (15.3) */
  readonly kerak30Kun: number;
}

/**
 * Sarflanish tezligi — davr ichidagi `KESIM`, `CHIQINDI` va `BRAK`
 * harakatlari yig'indisi kunlarga bo'linadi.
 *
 * ⚠️ `KOCHIRISH_CHIQDI` KIRMAYDI: mol boshqa filialga ketdi, sarflanmadi
 * (20.7). Uni sarf deb sanash filial tezligini soxta oshiradi.
 * ⚠️ `INVENTARIZATSIYA` ham kirmaydi — u sanash farqi, sarf emas (15.1).
 */
export async function sarflanishTezligi(
  filialId: number,
  davr: Davr,
): Promise<readonly TezlikQatori[]> {
  const kunlar = kunlarSoni(davr);

  const qatorlar = await ulanishOl()<
    {
      material_id: number;
      nom: string;
      sarflash_birligi: string;
      qoldiq: string | null;
      sarf: string | null;
    }[]
  >`
    WITH qoldiqlar AS (
      SELECT b.material_id,
             SUM(CASE WHEN b.turi = 'DONA'
                      THEN COALESCE(b.miqdor, 0)
                      ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END) AS qoldiq
      FROM bolak b
      WHERE b.filial_id = ${filialId} AND b.faol = true AND b.holat IN ('BOSH','BAND')
      GROUP BY b.material_id
    ),
    sarflar AS (
      SELECT b2.material_id,
             -SUM(COALESCE(oh.miqdor_kv_m, 0)
                  + COALESCE(oh.miqdor_m, 0)
                  + COALESCE(oh.miqdor_dona, 0)) AS sarf
      FROM ombor_harakat oh
      JOIN bolak b2 ON b2.id = oh.bolak_id
      WHERE oh.filial_id = ${filialId}
        AND oh.turi IN ('KESIM','OSTATKA','BRAK')
        AND oh.sana >= ${davr.boshi} AND oh.sana < ${davr.oxiri}
      GROUP BY b2.material_id
    )
    -- ⚠️ 2026-10-14 gacha ikkala qiymat har material uchun qism-so'rov
    --    edi — katta omborda 20 soniya. Endi bir martalik guruhlash.
    SELECT m.id AS material_id, m.nom, m.sarflash_birligi,
           q.qoldiq::text AS qoldiq,
           /*
            * SARFLANGAN MIQDOR — ombordan HAQIQATAN kamaygani.
            *
            * ⚠️ 2026-09-03 gacha bu yerda uch ustun shunchaki
            *    QO'SHILARDI va natija MANFIY chiqardi: jurnalda kesim
            *    manfiy, chiqindi musbat yotadi (2.2). "ortachaTezlik"
            *    manfiy sarfni rad etadi — butun hisobot ochilmasdi.
            *
            * ⚠️ Endi yig'indi TESKARISIGA olinadi (chiqim manfiy →
            *    sarf musbat) va "OSTATKA" ham hisobga qo'shiladi:
            *    kesimda butun bo'lak chiqib, qoldig'i qaytib keladi.
            *    Faqat kesim olinsa sarf qoldiq kesma qadar oshib
            *    ketardi.
            *
            * ⚠️ "CHIQINDI" ALOHIDA QO'SHILMAYDI — u kesim bilan
            *    qoldiq orasidagi farqda allaqachon bor. Qo'shilsa
            *    ikki marta sanalardi.
            *
            * ⚠️ Uch o'lchov ustuni qo'shiladi, lekin aralashmaydi:
            *    materialning sarflash birligi bitta (5.3), shuning
            *    uchun bir materialda faqat bittasi to'ladi.
            */
           GREATEST(s.sarf, 0)::text AS sarf
    FROM material m
    LEFT JOIN qoldiqlar q ON q.material_id = m.id
    LEFT JOIN sarflar s ON s.material_id = m.id
    WHERE m.faol = true
    ORDER BY m.nom`;

  const bugun = new Date();

  return qatorlar
    .filter((q) => Number(q.qoldiq ?? 0) > 0 || Number(q.sarf ?? 0) > 0)
    .map((q) => {
      const qoldiq = Number(q.qoldiq ?? 0);
      const sarf = Number(q.sarf ?? 0);
      const tezlik = ortachaTezlik(sarf, kunlar);
      return {
        materialId: q.material_id,
        nom: q.nom,
        sarflashBirligi: q.sarflash_birligi,
        qoldiq,
        sarf,
        kunlikTezlik: tezlik.kunlik.toDecimalPlaces(2).toNumber(),
        bashorat: qanchaKunQoldi(qoldiq, tezlik, bugun),
        kerak30Kun: qanchaKerak(qoldiq, tezlik, 30).toDecimalPlaces(2).toNumber(),
      };
    });
}

// ─── §3.1 №17 · ABC tahlil — ombor ────────────────────────────────────────

/**
 * Qoldiq qiymatining 80% i qaysi materialda turibdi.
 *
 * Dollarda qotgan tannarxli bo'laklar chiqarib tashlanadi (1.3): ular
 * alohida hisobot bo'ladi, bitta ro'yxatda qo'shilmaydi.
 */
export async function omborAbc(filialId: number): Promise<AbcNatija<number>> {
  const sql = ulanishOl();
  const qatorlar = await sql<
    { material_id: number; nom: string; qiymat: string }[]
  >`
    SELECT m.id AS material_id, m.nom,
           SUM(${bolakQiymatiIfodasi(sql)})::numeric(14,2)::text AS qiymat
    FROM material m
    JOIN bolak b ON b.material_id = m.id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
      AND b.tannarx_valyuta_snapshot = 'SOM'
    GROUP BY m.id
    ORDER BY m.nom`;

  const kirish: AbcKirish<number>[] = qatorlar.map((q) => ({
    kalit: q.material_id,
    nom: q.nom,
    qiymat: som(q.qiymat),
  }));

  return abcTahlil(kirish);
}

// ─── 11.7.1 · Qoldiq qiymati ──────────────────────────────────────────────

/** Sarlavhadagi jami raqam — omborda turgan pulning tannarx qiymati. */
export async function omborQiymati(filialId: number): Promise<string> {
  const sql = ulanishOl();
  /**
   * ⚠️ Formula bitta joyda — `bolakQiymatiIfodasi` (ombor sahifasi bilan bir xil).
   *
   * ⚠️ JAMI = MATERIAL QATORLARI YIG'INDISI. Har material o'z qiymatini
   *    tiyingacha yaxlitlab ko'rsatadi; jami umumiy summadan yaxlitlansa
   *    ekrandagi qatorlarni qo'shgan odam 1 tiyin farq topardi
   *    (EC-OMB-Q5, 2026-10-07 — kasr tannarxli bo'laklar ko'paygach chiqdi).
   */
  const q = await sql<{ jami: string | null }[]>`
    SELECT SUM(t.qiymat)::numeric(14,2)::text AS jami
    FROM (
      SELECT SUM(${bolakQiymatiIfodasi(sql)})::numeric(14,2) AS qiymat
      FROM bolak b
      WHERE b.filial_id = ${filialId} AND b.faol = true
        AND b.holat IN ('BOSH','BAND')
        AND b.tannarx_valyuta_snapshot = 'SOM'
      GROUP BY b.material_id
    ) t`;
  return q[0]?.jami ?? '0';
}

// ─── 11.7.1 · Qoldiq MATERIAL KESIMIDA ────────────────────────────────────

export interface QoldiqQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly sarflashBirligi: string;
  /** Sarflash birligidagi miqdor — kv.m, sm yoki dona */
  readonly miqdor: number;
  readonly bolakSoni: number;
  /** Tannarx qiymati (so'm) */
  readonly qiymat: string;
}

/**
 * TZ 11.7.1 — «Qoldiq: material kesimida, miqdor va qiymat».
 *
 * ⚠️ Faqat `BOSH` va `BAND` sanaladi: `ISHLATILDI`, `BRAK` va
 *    `CHIQINDI` omborda yo'q. `YOLDA` ham kirmaydi — u boshqa
 *    filialga ketgan (20.7.4).
 *
 * ⚠️ Dollarli tannarx CHETLAB O'TILADI, so'mga jimgina qo'shilmaydi:
 *    kurs parametr bo'lib kelishi shart (§3.2). Bunday bo'lak
 *    bo'lsa ekran ogohlantiradi.
 */
export async function qoldiqMaterialKesimida(
  filialId: number,
): Promise<readonly QoldiqQatori[]> {
  const sql = ulanishOl();
  const q = await sql<
    {
      material_id: number;
      nom: string;
      sarflash_birligi: string;
      miqdor: string | null;
      bolak_soni: number;
      qiymat: string | null;
    }[]
  >`
    SELECT m.id AS material_id, m.nom, m.sarflash_birligi,
           SUM(CASE WHEN b.turi = 'DONA'
                    THEN COALESCE(b.miqdor, 0)
                    ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END)::text
             AS miqdor,
           COUNT(*)::int AS bolak_soni,
           SUM(${bolakQiymatiIfodasi(sql)})
             FILTER (WHERE b.tannarx_valyuta_snapshot = 'SOM')
             ::numeric(14,2)::text AS qiymat
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
    GROUP BY m.id, m.nom, m.sarflash_birligi
    ORDER BY 6 DESC NULLS LAST, m.nom`;

  return q.map((x) => ({
    materialId: x.material_id,
    nom: x.nom,
    sarflashBirligi: x.sarflash_birligi,
    miqdor: Number(x.miqdor ?? 0),
    bolakSoni: x.bolak_soni,
    qiymat: x.qiymat ?? '0',
  }));
}

// ─── 11.7.2 · Material harakati (davr bo'yicha) ───────────────────────────

export interface HarakatQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly sarflashBirligi: string;
  readonly kirim: number;
  readonly sarf: number;
  readonly chiqindi: number;
  readonly brak: number;
}

/**
 * TZ 11.7.2 — «Material harakati: kirim, sarf, chiqindi, brak».
 *
 * ⚠️ Miqdorlar bazada MANFIY yoziladi (chiqim), shu yerda esa
 *    MUSBAT ko'rsatiladi: jadvalda «−3.60» emas, «3.60» turgani
 *    o'qishga qulay va ustun sarlavhasi nima ekanini aytadi.
 *
 * ⚠️ `KOCHIRISH_*`, `INVENTARIZATSIYA` va `STORNO` bu jadvalda
 *    YO'Q: ular sarf ham, kirim ham emas (20.7 · 15.1).
 */
export async function materialHarakati(
  filialId: number,
  davr: Davr,
): Promise<readonly HarakatQatori[]> {
  const q = await ulanishOl()<
    {
      material_id: number;
      nom: string;
      sarflash_birligi: string;
      kirim: string | null;
      sarf: string | null;
      chiqindi: string | null;
      brak: string | null;
    }[]
  >`
    SELECT m.id AS material_id, m.nom, m.sarflash_birligi,
           SUM((COALESCE(oh.miqdor_kv_m, 0)
                + COALESCE(oh.miqdor_m, 0)
                + COALESCE(oh.miqdor_dona, 0))) FILTER (WHERE oh.turi IN ('KIRIM','BOSHLANGICH'))::text
             AS kirim,
           ABS(SUM((COALESCE(oh.miqdor_kv_m, 0)
                + COALESCE(oh.miqdor_m, 0)
                + COALESCE(oh.miqdor_dona, 0))) FILTER (WHERE oh.turi = 'KESIM'))::text AS sarf,
           ABS(SUM((COALESCE(oh.miqdor_kv_m, 0)
                + COALESCE(oh.miqdor_m, 0)
                + COALESCE(oh.miqdor_dona, 0))) FILTER (WHERE oh.turi = 'CHIQINDI'))::text AS chiqindi,
           ABS(SUM((COALESCE(oh.miqdor_kv_m, 0)
                + COALESCE(oh.miqdor_m, 0)
                + COALESCE(oh.miqdor_dona, 0))) FILTER (WHERE oh.turi = 'BRAK'))::text AS brak
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    JOIN material m ON m.id = b.material_id
    WHERE oh.filial_id = ${filialId}
      AND oh.sana >= ${davr.boshi} AND oh.sana < ${davr.oxiri}
      AND oh.turi IN ('KIRIM','BOSHLANGICH','KESIM','CHIQINDI','BRAK')
    GROUP BY m.id, m.nom, m.sarflash_birligi
    ORDER BY m.nom`;

  return q.map((x) => ({
    materialId: x.material_id,
    nom: x.nom,
    sarflashBirligi: x.sarflash_birligi,
    kirim: Number(x.kirim ?? 0),
    sarf: Number(x.sarf ?? 0),
    chiqindi: Number(x.chiqindi ?? 0),
    brak: Number(x.brak ?? 0),
  }));
}

// ─── 11.7.4 · Chiqindi va brak — sabab kesimida ───────────────────────────

export interface ChiqindiQatori {
  readonly nom: string;
  readonly turi: string;
  readonly miqdor: number;
  readonly qiymat: string;
  readonly hodisaSoni: number;
}

/**
 * TZ 11.7.4 — «Chiqindi va brak: material va sabab kesimida».
 *
 * ⚠️ Qiymat ham ko'rsatiladi: «12 kv.m chiqindi» degan raqam
 *    egasiga hech narsa aytmaydi, «840 000 so'm» esa aytadi.
 */
export async function chiqindiVaBrak(
  filialId: number,
  davr: Davr,
): Promise<readonly ChiqindiQatori[]> {
  const q = await ulanishOl()<
    {
      nom: string;
      turi: string;
      miqdor: string | null;
      qiymat: string | null;
      hodisa_soni: number;
    }[]
  >`
    SELECT m.nom, oh.turi,
           ABS(SUM((COALESCE(oh.miqdor_kv_m, 0)
                + COALESCE(oh.miqdor_m, 0)
                + COALESCE(oh.miqdor_dona, 0))))::text AS miqdor,
           ABS(SUM(oh.tannarx_summa))::numeric(14,2)::text AS qiymat,
           COUNT(*)::int AS hodisa_soni
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    JOIN material m ON m.id = b.material_id
    WHERE oh.filial_id = ${filialId}
      AND oh.sana >= ${davr.boshi} AND oh.sana < ${davr.oxiri}
      AND oh.turi IN ('CHIQINDI','BRAK')
    GROUP BY m.nom, oh.turi
    ORDER BY 4 DESC NULLS LAST`;

  return q.map((x) => ({
    nom: x.nom,
    turi: x.turi,
    miqdor: Number(x.miqdor ?? 0),
    qiymat: x.qiymat ?? '0',
    hodisaSoni: x.hodisa_soni,
  }));
}

// ─── 11.7.7 · Rulon ochilgan holatlar ─────────────────────────────────────

export interface RulonOchildiQatori {
  readonly sana: Date;
  readonly materialNom: string;
  /** Band qilingan, lekin ishlatilmagan kesma */
  readonly kesmaKod: string;
  readonly kesmaOlcham: string;
  readonly buyurtmaRaqam: string | null;
  readonly pozitsiyaTartib: number | null;
  readonly xodimIsmi: string | null;
}

/**
 * TZ 11.7.7 — «Ostatka bor turib rulon ochilgan holatlar».
 *
 * ⚠️ HOLAT USTADAN KELADI, tizimdan emas.
 *
 *    Tanlashda tizim qoidaga qat'iy amal qiladi: sig'adigan kesma
 *    har doim rulondan ustun turadi (7.6, 5-qadam). Demak
 *    «tizim noto'g'ri tanladi» degan holat yo'q.
 *
 *    Yozuv «Tugatdim» da tug'iladi: tizim kesmani band qilgan,
 *    usta esa «rulondan kesdim» degan. Sabab kesma iflos, yirtiq
 *    yoki joyida topilmagani bo'lishi mumkin — TZ 7.6 buni
 *    BLOKLAMAYDI, faqat yozib boradi.
 *
 * ⚠️ Qaysi rulon ochilgani NOMA'LUM: usta buni aytmaydi (7.6 —
 *    «bo'lak raqamini har safar qayd etish ortiqcha ish»). Shuning
 *    uchun hisobot o'tkazib yuborilgan KESMANI ko'rsatadi.
 *
 * ⚠️ Yangi jadval YO'Q: hodisa audit jurnaliga `RULON_OCHILDI`
 *    amali bo'lib tushadi. Bu «kim, qachon, nega» savoliga javob
 *    beradigan yagona joy (2.4) va migratsiya talab qilmaydi.
 */
export async function rulonOchilganHolatlar(
  filialId: number,
  davr: Davr,
): Promise<readonly RulonOchildiQatori[]> {
  const q = await ulanishOl()<
    {
      sana: Date;
      material_nom: string;
      kesma_kod: string;
      kesma_eni: string | null;
      kesma_boyi: string | null;
      buyurtma_raqam: string | null;
      pozitsiya_tartib: number | null;
      xodim_ismi: string | null;
    }[]
  >`
    SELECT a.sana,
           m.nom AS material_nom,
           k.kod AS kesma_kod,
           k.eni_m::text AS kesma_eni,
           k.boyi_m::text AS kesma_boyi,
           b.raqam AS buyurtma_raqam,
           p.tartib AS pozitsiya_tartib,
           x.ism AS xodim_ismi
    FROM audit_jurnal a
    JOIN bolak k    ON k.id = a.obyekt_id
    JOIN material m ON m.id = k.material_id
    LEFT JOIN buyurtma_pozitsiya p ON p.id = (a.yangi_qiymat ->> 'pozitsiya_id')::bigint
    LEFT JOIN buyurtma b ON b.id = p.buyurtma_id
    LEFT JOIN xodim x   ON x.id = a.xodim_id
    WHERE a.amal = 'RULON_OCHILDI'
      AND a.obyekt_turi = 'bolak'
      AND a.filial_id = ${filialId}
      AND a.sana >= ${davr.boshi} AND a.sana < ${davr.oxiri}
    ORDER BY a.sana DESC
    LIMIT 200`;

  return q.map((x) => ({
    sana: x.sana,
    materialNom: x.material_nom,
    kesmaKod: x.kesma_kod,
    kesmaOlcham:
      x.kesma_eni === null || x.kesma_boyi === null
        ? '—'
        : `${Number(x.kesma_eni).toFixed(2)} × ${Number(x.kesma_boyi).toFixed(2)} m`,
    buyurtmaRaqam: x.buyurtma_raqam,
    pozitsiyaTartib: x.pozitsiya_tartib,
    xodimIsmi: x.xodim_ismi,
  }));
}

// ─── 11.7.3 · Kam qolgan va tugagan ─────────────────────────────────

export interface KamQoldiqQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly sarflashBirligi: string;
  readonly qoldiq: number;
  /** Kartochkadagi chegara — `null` bo'lsa faqat nol qoldiq ko'rinadi */
  readonly chegara: number | null;
  readonly tugadimi: boolean;
  /** Bo'sh yo'q, lekin band qilingani bor — «hammasi band» */
  readonly hammasiBand: boolean;
}

/**
 * TZ 11.7.3 — «Kam qolgan va tugagan materiallar».
 *
 * ⚠️ QAROR: chegara solishtiruvi SQL da EMAS, domainda
 *    (`kamQoldiqmi`). 2026-09-20 dan ikkalasi ham METRDA, lekin
 *    solishtiruv baribir DOMAINDA qoladi: dona mahsulotda chegara
 *    donada, metrlida metrda va bu farqni SQL bilmaydi. Bir
 *    mantiq — bir joyda (CLAUDE.md §3).
 *
 * ⚠️ Chegarasi yo'q material ham qaytadi: qoldiq nol bo'lsa u
 *    baribir «tugagan» ro'yxatiga tushishi kerak.
 */
export async function kamQolganlar(
  filialId: number,
): Promise<readonly KamQoldiqQatori[]> {
  /**
   * ⚠️ 2026-10-06 — OMBOR QOLDIG'I BILAN BITTA HISOB (`filialQoldigi`).
   *    Ilgari bu yerda alohida SQL bor edi va rulon qoldig'ini KV.M da
   *    olib, METRDA yozilgan chegara bilan solishtirardi: keng matoda
   *    ogohlantirish chiqmas, tor lamelda yolg'on chiqardi.
   */
  return (await filialQoldigi(filialId))
    .filter((q) => q.tugagan || q.kamQoldiq)
    .map((q) => ({
      materialId: q.materialId,
      nom: q.nom,
      sarflashBirligi: q.sarflashBirligi,
      qoldiq: q.chegaraQoldiq,
      chegara: q.kamQoldiqChegaraM,
      tugadimi: q.tugagan,
      hammasiBand: q.tugagan && (q.bandKvM > 0 || q.bolakSoni > 0),
    }))
    /** Tugaganlar tepada — ular shoshilinch */
    .sort((a, b) => Number(b.tugadimi) - Number(a.tugadimi) || a.nom.localeCompare(b.nom));
}


// ─── 11.6.1 · Mijozlar bazasi ─────────────────────────────────────────────

export interface MijozBazasi {
  readonly jami: number;
  /** Davr ichida BIRINCHI buyurtmasini bergan */
  readonly yangi: number;
  /** Davrda xarid qilgan va undan oldin ham xaridi bo'lgan */
  readonly takroriy: number;
  /**
   * TZ 11.6.1 — «uxlab qolgan»: oxirgi xaridi 90 kundan oldin.
   *
   * ⚠️ Hech qachon xarid qilmagan mijoz BU YERGA KIRMAYDI —
   *    u «uxlab qolgan» emas, hali uyg'onmagan. Ularni aralashtirsak
   *    «mijozlarning yarmi ketib qoldi» degan soxta xavotir chiqardi.
   */
  readonly uxlagan: number;
  readonly hechQachonXaridQilmagan: number;
  /** Davr ichidagi o'rtacha chek (so'm) */
  readonly ortachaChek: string;
  /** Davrdagi buyurtmalar soni */
  readonly buyurtmaSoni: number;
}

const UXLAGAN_KUN = 90;

/**
 * TZ 11.6.1 — mijozlar bazasi: yangi, takroriy, uxlab qolgan,
 * o'rtacha chek.
 *
 * ⚠️ Buyurtma summasi `buyurtma_pozitsiya` dan yig'iladi:
 *    `(narx_snapshot - chegirma_summa) × kurs`. Snapshot ATAYLAB —
 *    kechagi buyurtma bugungi narxda qayta hisoblanmaydi
 *    (2.3-invariant). Ifoda 11.5 bo'limidagi bilan bir xil.
 *
 * ⚠️ BEKOR va RAD ETILGAN pozitsiyalar chiqmaydi: ular tushum
 *    emas. Aks holda «o'rtacha chek» soxta oshib ketardi.
 */
export async function mijozBazasi(filialId: number, davr: Davr): Promise<MijozBazasi> {
  const q = await ulanishOl()<
    {
      jami: number;
      yangi: number;
      takroriy: number;
      uxlagan: number;
      hech_qachon: number;
      ortacha_chek: string | null;
      buyurtma_soni: number;
    }[]
  >`
    WITH pozitsiya AS (
      SELECT p.buyurtma_id,
             SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
                 * CASE WHEN bv.valyuta = 'USD'
                        THEN COALESCE(bv.kurs_snapshot, 0) ELSE 1 END) AS summa
      FROM buyurtma_pozitsiya p
      JOIN buyurtma bv ON bv.id = p.buyurtma_id
      WHERE p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY p.buyurtma_id
    ),
    xarid AS (
      SELECT b.mijoz_id, b.id, b.sana, COALESCE(pz.summa, 0) AS summa
      FROM buyurtma b
      LEFT JOIN pozitsiya pz ON pz.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
    ),
    mijoz_holati AS (
      SELECT m.id,
             MIN(x.sana) AS birinchi,
             MAX(x.sana) AS oxirgi,
             COUNT(x.id) FILTER (
               WHERE x.sana >= ${davr.boshi} AND x.sana < ${davr.oxiri}
             )::int AS davrda
      FROM mijoz m
      LEFT JOIN xarid x ON x.mijoz_id = m.id
      WHERE m.faol = true
      GROUP BY m.id
    )
    SELECT
      COUNT(*)::int AS jami,
      COUNT(*) FILTER (
        WHERE birinchi >= ${davr.boshi} AND birinchi < ${davr.oxiri}
      )::int AS yangi,
      COUNT(*) FILTER (WHERE davrda > 0 AND birinchi < ${davr.boshi})::int AS takroriy,
      COUNT(*) FILTER (
        WHERE oxirgi IS NOT NULL AND oxirgi < now() - make_interval(days => ${UXLAGAN_KUN})
      )::int AS uxlagan,
      COUNT(*) FILTER (WHERE oxirgi IS NULL)::int AS hech_qachon,
      (SELECT AVG(summa)::numeric(14,2)::text FROM xarid
        WHERE sana >= ${davr.boshi} AND sana < ${davr.oxiri}) AS ortacha_chek,
      (SELECT COUNT(*)::int FROM xarid
        WHERE sana >= ${davr.boshi} AND sana < ${davr.oxiri}) AS buyurtma_soni
    FROM mijoz_holati`;

  const r = q[0];
  return {
    jami: r?.jami ?? 0,
    yangi: r?.yangi ?? 0,
    takroriy: r?.takroriy ?? 0,
    uxlagan: r?.uxlagan ?? 0,
    hechQachonXaridQilmagan: r?.hech_qachon ?? 0,
    ortachaChek: r?.ortacha_chek ?? '0',
    buyurtmaSoni: r?.buyurtma_soni ?? 0,
  };
}

// ─── 11.6.2 · ABC — mijozlar ──────────────────────────────────────────────

export interface MijozAbcQatori {
  readonly mijozId: number;
  readonly ism: string;
  readonly tushum: string;
  readonly buyurtmaSoni: number;
}

/**
 * TZ 11.6.2 — «Tushumning 80% qaysi mijozlardan».
 *
 * ⚠️ Mexanizm ombor ABC si bilan BITTA (`lib/domain/hisobot/abc.ts`) —
 *    chegara qoidasi va manfiy qiymat qoidasi ikki joyda
 *    takrorlanmaydi (§2.2).
 */
export async function mijozAbc(
  filialId: number,
  davr: Davr,
): Promise<{
  readonly natija: AbcNatija<number>;
  readonly buyurtmaSoni: ReadonlyMap<number, number>;
}> {
  const q = await ulanishOl()<
    { mijoz_id: number; ism: string; tushum: string | null; soni: number }[]
  >`
    WITH pozitsiya AS (
      SELECT p.buyurtma_id,
             SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
                 * CASE WHEN bv.valyuta = 'USD'
                        THEN COALESCE(bv.kurs_snapshot, 0) ELSE 1 END) AS summa
      FROM buyurtma_pozitsiya p
      JOIN buyurtma bv ON bv.id = p.buyurtma_id
      WHERE p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY p.buyurtma_id
    )
    SELECT m.id AS mijoz_id, m.ism,
           SUM(COALESCE(pz.summa, 0))::numeric(14,2)::text AS tushum,
           COUNT(b.id)::int AS soni
    FROM buyurtma b
    JOIN mijoz m ON m.id = b.mijoz_id
    LEFT JOIN pozitsiya pz ON pz.buyurtma_id = b.id
    WHERE b.sotgan_filial_id = ${filialId}
      AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
    GROUP BY m.id, m.ism
    ORDER BY 3 DESC NULLS LAST`;

  const soni = new Map<number, number>();
  for (const x of q) soni.set(x.mijoz_id, x.soni);

  return {
    natija: abcTahlil(
      q.map((x) => ({ kalit: x.mijoz_id, nom: x.ism, qiymat: som(x.tushum ?? '0') })),
    ),
    buyurtmaSoni: soni,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// TZ 11.5 · SOTUV HISOBOTLARI
// ══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ POZITSIYA TUSHUMI — bitta ifoda, hamma joyda bir xil:
 *
 *      (narx_snapshot − chegirma_summa) × kurs
 *
 *    Snapshot ATAYLAB: kechagi buyurtma bugungi narxda qayta
 *    hisoblanmaydi (2.3-invariant).
 *
 * ⚠️ XIZMAT HAQI QO'SHILMAYDI (2026-09-03 tuzatishi).
 *
 *    Ilgari bu yerda `+ xizmat_haqi` turardi va tushum har
 *    buyurtmada xizmat haqicha OSHIB ketardi: `narx_snapshot`
 *    uning ichida allaqachon bor. Sotuv ekrani ham, bot ham
 *    pozitsiya narxini `Σ(qatorlar) + xizmat haqi` deb
 *    hisoblaydi (`pozitsiyaNarxi`, TZ 3.8) va o'sha yig'indini
 *    snapshotga yozadi. `xizmat_haqi` ustuni esa narxning qaysi
 *    qismi xizmat ekanini KO'RSATISH uchun saqlanadi.
 *
 *    Natijada hisobot mijoz qarzi bilan mos kelmasdi: qarz
 *    `narx − chegirma` bo'yicha yoziladi (`lib/amal/buyurtma.ts`).
 *
 * ⚠️ DOLLARLI BUYURTMA KURSGA URILADI (2026-09-03 tuzatishi).
 *
 *    Ilgari valyuta umuman qaralmasdi va 100 $ lik buyurtma
 *    tushumga 100 SO'M bo'lib tushardi — 1.3-invariant («so'm va
 *    dollar qo'shilmaydi») ochiqdan-ochiq buzilardi.
 *
 *    Kurs BUYURTMANING O'ZIDAN olinadi (`kurs_snapshot`, TZ 8.13):
 *    u sotuv kunida qotgan va keyin o'zgarmaydi, shuning uchun
 *    natija joriy kursga bog'liq emas. Dollarli buyurtmada kurs
 *    bazada MAJBURIY (`buyurtma_usd_kurs` cheklovi); `COALESCE`
 *    faqat himoya uchun — buzuq qator butun hisobotni NULL
 *    qilib qo'ymasin.
 *
 * ⚠️ BEKOR va RAD_ETILGAN qatorlar HAMMA JOYDA chiqariladi — ular
 *    tushum emas. QAYTARILGAN esa QOLADI: savdo bo'lgan, keyin
 *    qaytarilgan. Uni tushumdan yashirsak 11.5.5 (qaytarishlar)
 *    bilan 11.5.1 (dinamika) bir-biriga to'g'ri kelmasdi.
 */

// ─── 11.5.1 · Sotuv dinamikasi ────────────────────────────────────────────

export interface SotuvJami {
  readonly tushum: string;
  readonly buyurtmaSoni: number;
  readonly pozitsiyaSoni: number;
  readonly ortachaChek: string;
}

export interface SotuvDinamikasi {
  readonly joriy: SotuvJami;
  readonly oldingi: SotuvJami;
  /** Kun bo'yicha qatorlar — eng eskisi birinchi */
  readonly kunlar: readonly { readonly sana: string; readonly tushum: string }[];
}

async function sotuvJami(filialId: number, davr: Davr): Promise<SotuvJami> {
  const q = await ulanishOl()<
    {
      tushum: string | null;
      buyurtma_soni: number;
      pozitsiya_soni: number;
      ortacha: string | null;
    }[]
  >`
    WITH poz AS (
      SELECT b.id AS buyurtma_id,
             SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
                 * CASE WHEN b.valyuta = 'USD'
                        THEN COALESCE(b.kurs_snapshot, 0) ELSE 1 END) AS summa,
             COUNT(p.id) AS qatorlar
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY b.id
    )
    SELECT SUM(summa)::numeric(14,2)::text AS tushum,
           COUNT(*)::int AS buyurtma_soni,
           COALESCE(SUM(qatorlar), 0)::int AS pozitsiya_soni,
           AVG(summa)::numeric(14,2)::text AS ortacha
    FROM poz`;

  const r = q[0];
  return {
    tushum: r?.tushum ?? '0',
    buyurtmaSoni: r?.buyurtma_soni ?? 0,
    pozitsiyaSoni: r?.pozitsiya_soni ?? 0,
    ortachaChek: r?.ortacha ?? '0',
  };
}

/**
 * TZ 11.5.1 — sotuv dinamikasi, oldingi davr bilan taqqoslab.
 *
 * ⚠️ Oldingi davr `oldingiDavr()` dan olinadi — kun soni bo'yicha
 *    orqaga surilmaydi: 31 kunlik iyulni 30 kunlik iyun bilan
 *    solishtirish «3% pasayish» degan soxta natija berardi.
 */
export async function sotuvDinamikasi(
  filialId: number,
  davr: Davr,
  oldingi: Davr,
): Promise<SotuvDinamikasi> {
  const [j, o, kunlar] = await Promise.all([
    sotuvJami(filialId, davr),
    sotuvJami(filialId, oldingi),
    ulanishOl()<{ sana: string; tushum: string | null }[]>`
      SELECT to_char(b.sana, 'YYYY-MM-DD') AS sana,
             SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
                 * CASE WHEN b.valyuta = 'USD'
                        THEN COALESCE(b.kurs_snapshot, 0) ELSE 1 END)
               ::numeric(14,2)::text AS tushum
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY 1
      ORDER BY 1`,
  ]);

  return {
    joriy: j,
    oldingi: o,
    kunlar: kunlar.map((k) => ({ sana: k.sana, tushum: k.tushum ?? '0' })),
  };
}

// ─── 11.5.2 · Mahsulot turi bo'yicha foyda ────────────────────────────────

export interface TurFoydasi {
  readonly turId: number;
  readonly nom: string;
  readonly soni: number;
  readonly tushum: string;
  readonly tannarx: string;
  readonly foyda: string;
  readonly birlikFoyda: string;
  /** Rentabellik: foyda / tushum × 100. Tushum nol bo'lsa `null` */
  readonly rentabellik: number | null;
  /**
   * ⚠️ Tannarxi umuman yozilmagan pozitsiyalar soni.
   *
   *    Pozitsiya hali kesilmagan bo'lsa `ombor_harakat` da sarf
   *    yo'q va tannarx 0 chiqadi — natijada rentabellik 100%
   *    bo'lib ko'rinadi. TZ (QISM 2 §7195) aynan shundan
   *    ogohlantiradi: «tannarx hisoblanmasa tushum 100% foyda
   *    bo'lib chiqadi va 11.5.2 buziladi».
   *
   *    Shuning uchun raqam YASHIRILMAYDI, lekin qator BELGILANADI:
   *    ekranda rentabellik o'rniga izoh chiqadi.
   */
  readonly tannarxsizSoni: number;
}

/**
 * TZ 11.5.2 — mahsulot turi bo'yicha foyda va rentabellik.
 *
 * ⚠️ TANNARX IKKI QISMDAN: material (`ombor_harakat.tannarx_summa`)
 *    va usta ish haqi (`xarajat` dagi `ISH_HAQI`). Faqat material
 *    olinsa «Rollo eng foydali» degan xato xulosa chiqadi — aslida
 *    unga usta ikki barobar ko'p vaqt sarflaydi (11.5.2 izohi).
 *
 * ⚠️ Ifoda `lib/amal/filial-harakat.ts` dagi bilan bir xil manbadan
 *    o'qiydi: u yerda filiallararo hisob uchun, bu yerda hisobot
 *    uchun. Shuning uchun raqamlar bir-biriga mos keladi.
 *
 * ⚠️ Ombor harakati sarfda MANFIY yotadi — `-SUM()` bilan musbatga
 *    aylantiriladi.
 *
 * ⚠️ Qo'shimcha buyumlar (`mahsulot_tur_id IS NULL`) bu jadvalga
 *    KIRMAYDI: ular tayyorlanmaydi, «mahsulot turi» ularga tegishli
 *    emas. Shuning uchun bu yerdagi tushum 11.5.1 dagidan kichik
 *    bo'lishi normal.
 */
export async function turBoyichaFoyda(
  filialId: number,
  davr: Davr,
): Promise<readonly TurFoydasi[]> {
  const sql = ulanishOl();
  const q = await sql<
    {
      tur_id: number;
      nom: string;
      soni: number;
      tushum: string | null;
      tannarx: string | null;
      tannarxsiz: number;
    }[]
  >`
    /*
     * ⚠️ Tushum, tannarx va ish haqi BITTA JOYDAN — pozitsiyaNatijasiUstunlari
     *    (filiallararo qarz 22.3 va reja fakti 21.5 ham shundan). 2026-10-14
     *    gacha bu so'rov ularni o'zicha yozardi: qayta kesish ish haqi
     *    tannarxga KIRMASDI (foyda oshib ko'rinardi) va har pozitsiyaning
     *    tannarxi ikki marta hisoblanardi (katta bazada 13 soniya).
     */
    WITH n AS (
      SELECT p.mahsulot_tur_id, p.soni, p.holat,
             ${pozitsiyaNatijasiUstunlari(sql)}
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
        AND p.mahsulot_tur_id IS NOT NULL
    )
    SELECT t.id AS tur_id, t.nom,
           /*
            * ⚠️ QAYTARILGAN pozitsiya tushumga va soniga KIRMAYDI — pul
            *    mijozga qaytarilgan (2026-10-11). Tannarxi esa qoladi:
            *    material sarflangan, bu yo'qotish.
            */
           COALESCE(SUM(n.soni) FILTER (WHERE n.holat <> 'QAYTARILGAN'), 0)::int AS soni,
           SUM(n.tushum::numeric) FILTER (WHERE n.holat <> 'QAYTARILGAN')::numeric(14,2)::text AS tushum,
           SUM(n.tannarx::numeric + n.ish_haqi::numeric)::numeric(14,2)::text AS tannarx,
           COUNT(*) FILTER (WHERE n.tannarx::numeric + n.ish_haqi::numeric = 0)::int AS tannarxsiz
    FROM n
    JOIN mahsulot_tur t ON t.id = n.mahsulot_tur_id
    GROUP BY t.id, t.nom
    ORDER BY 4 DESC NULLS LAST`;

  return q.map((x) => {
    const tushum = new Decimal(x.tushum ?? '0');
    const tannarx = new Decimal(x.tannarx ?? '0');
    const foyda = tushum.minus(tannarx);

    return {
      turId: x.tur_id,
      nom: x.nom,
      soni: x.soni,
      tushum: tushum.toFixed(2),
      tannarx: tannarx.toFixed(2),
      foyda: foyda.toFixed(2),
      birlikFoyda: x.soni > 0 ? foyda.dividedBy(x.soni).toFixed(2) : '0.00',
      /** ⚠️ Nolga bo'lish: tushum 0 bo'lsa rentabellik YO'Q, 0 emas */
      rentabellik: tushum.isZero() ? null : foyda.dividedBy(tushum).times(100).toNumber(),
      tannarxsizSoni: x.tannarxsiz,
    };
  });
}

// ─── 11.5.3 · Sotuvchi bo'yicha ───────────────────────────────────────────

export interface SotuvchiQatori {
  readonly xodimId: number;
  readonly ism: string;
  readonly buyurtmaSoni: number;
  readonly tushum: string;
  readonly ortachaChek: string;
  /** Davrda shu xodim kiritgan to'lovlar — «undirilgan qarz» */
  readonly undirilgan: string;
}

/**
 * TZ 11.5.3 — sotuvchi bo'yicha: soni, tushum, o'rtacha chek,
 * undirilgan qarz.
 *
 * ⚠️ «Undirilgan» — shu xodim KIRITGAN to'lovlar, o'z buyurtmasi
 *    bo'yicha emas. Sotuvchi boshqa sotuvchining mijozidan pul
 *    olishi mumkin va bu ham uning ishi.
 *
 * ⚠️ To'lov `mijoz_harakat` da MANFIY yotadi (qarzni kamaytiradi) —
 *    hisobotda musbat ko'rsatiladi.
 */
export async function sotuvchiKesimi(
  filialId: number,
  davr: Davr,
): Promise<readonly SotuvchiQatori[]> {
  const q = await ulanishOl()<
    {
      xodim_id: number;
      ism: string;
      buyurtma_soni: number;
      tushum: string | null;
      ortacha: string | null;
      undirilgan: string | null;
    }[]
  >`
    WITH poz AS (
      SELECT b.id AS buyurtma_id, b.sotuvchi_id,
             SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
                 * CASE WHEN b.valyuta = 'USD'
                        THEN COALESCE(b.kurs_snapshot, 0) ELSE 1 END) AS summa
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY b.id, b.sotuvchi_id
    ),
    tolov AS (
      SELECT mh.xodim_id, SUM(mh.summa) AS summa
      FROM mijoz_harakat mh
      WHERE mh.filial_id = ${filialId}
        AND mh.turi = 'TOLOV'
        AND mh.sana >= ${davr.boshi} AND mh.sana < ${davr.oxiri}
      GROUP BY mh.xodim_id
    )
    SELECT x.id AS xodim_id, x.ism,
           COUNT(poz.buyurtma_id)::int AS buyurtma_soni,
           SUM(poz.summa)::numeric(14,2)::text AS tushum,
           AVG(poz.summa)::numeric(14,2)::text AS ortacha,
           (-COALESCE(MAX(tolov.summa), 0))::numeric(14,2)::text AS undirilgan
    FROM xodim x
    LEFT JOIN poz ON poz.sotuvchi_id = x.id
    LEFT JOIN tolov ON tolov.xodim_id = x.id
    WHERE x.filial_id = ${filialId}
    GROUP BY x.id, x.ism
    HAVING COUNT(poz.buyurtma_id) > 0 OR MAX(tolov.summa) IS NOT NULL
    ORDER BY 4 DESC NULLS LAST`;

  return q.map((x) => ({
    xodimId: x.xodim_id,
    ism: x.ism,
    buyurtmaSoni: x.buyurtma_soni,
    tushum: x.tushum ?? '0',
    ortachaChek: x.ortacha ?? '0',
    undirilgan: x.undirilgan ?? '0',
  }));
}

// ─── 11.5.4 · Chegirmalar ─────────────────────────────────────────────────

export interface ChegirmaQatori {
  readonly pozitsiyaId: number;
  readonly buyurtmaId: number;
  readonly buyurtmaRaqam: string;
  readonly sana: Date;
  readonly sotuvchi: string;
  readonly mijoz: string | null;
  readonly narx: string;
  readonly chegirma: string;
  readonly foiz: number;
  /** Audit jurnalida «limitdan oshdi» yozuvi bormi (3.11) */
  readonly limitdanOshgan: boolean;
}

/**
 * TZ 11.5.4 — chegirmalar: kim, qancha, qaysi buyurtmada.
 * Limitdan oshganlar AJRATILGAN.
 *
 * ⚠️ «Limitdan oshgan» belgisi qayta HISOBLANMAYDI, audit
 *    jurnalidan olinadi (`CHEGIRMA_LIMITIDAN_OSHDI`). Sabab: limit
 *    sozlamada turadi va o'zgarishi mumkin. Bugungi limit bilan
 *    kechagi chegirmani solishtirsak, o'tmish o'zgarib ketardi —
 *    2.3-invariantga zid.
 */
export async function chegirmalar(
  filialId: number,
  davr: Davr,
): Promise<readonly ChegirmaQatori[]> {
  const q = await ulanishOl()<
    {
      pozitsiya_id: number;
      buyurtma_id: number;
      raqam: string;
      sana: Date;
      sotuvchi: string;
      mijoz: string | null;
      narx: string;
      chegirma: string;
      limitdan_oshgan: boolean;
    }[]
  >`
    SELECT p.id AS pozitsiya_id, b.id AS buyurtma_id, b.raqam, b.sana,
           x.ism AS sotuvchi, m.ism AS mijoz,
           p.narx_snapshot::text AS narx,
           p.chegirma_summa::text AS chegirma,
           EXISTS (
             SELECT 1 FROM audit_jurnal a
             WHERE a.amal = 'CHEGIRMA_LIMITIDAN_OSHDI'
               AND a.obyekt_turi = 'buyurtma_pozitsiya'
               AND a.obyekt_id = p.id
           ) AS limitdan_oshgan
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    JOIN xodim x ON x.id = b.sotuvchi_id
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    WHERE b.sotgan_filial_id = ${filialId}
      AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
      AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      AND COALESCE(p.chegirma_summa, 0) > 0
    ORDER BY p.chegirma_summa DESC`;

  return q.map((x) => {
    const narx = new Decimal(x.narx);
    const chegirma = new Decimal(x.chegirma);
    return {
      pozitsiyaId: x.pozitsiya_id,
      buyurtmaId: x.buyurtma_id,
      buyurtmaRaqam: x.raqam,
      sana: x.sana,
      sotuvchi: x.sotuvchi,
      mijoz: x.mijoz,
      narx: narx.toFixed(2),
      chegirma: chegirma.toFixed(2),
      /** ⚠️ Narx 0 bo'lsa foiz hisoblanmaydi — nolga bo'lish */
      foiz: narx.isZero() ? 0 : chegirma.dividedBy(narx).times(100).toNumber(),
      limitdanOshgan: x.limitdan_oshgan,
    };
  });
}

// ─── 11.5.5 · Qaytarish va rad etish ──────────────────────────────────────

export interface QaytarishQatori {
  readonly pozitsiyaId: number;
  readonly buyurtmaRaqam: string;
  readonly sana: Date;
  readonly amal: 'QAYTARISH' | 'RAD_ETISH';
  readonly xodim: string;
  readonly mahsulot: string;
  readonly narx: string;
  /** Faqat qaytarishda — rad etishda pul harakati yo'q */
  readonly ushlabQolindi: string;
  readonly sabab: string;
}

/**
 * TZ 11.5.5 — qaytarish va rad etish, ushlab qolingan pul bilan.
 *
 * ⚠️ IKKALASI BITTA JADVALDA, lekin AMAL ustuni bilan ajratilgan:
 *
 *      QAYTARISH — mijoz olib ketgan, keyin qaytargan (8.10)
 *      RAD_ETISH — mijoz umuman olmagan (8.8)
 *
 *    Ular pul jihatdan boshqacha: qaytarishda pul qaytariladi va
 *    bir qismi ushlab qolinishi mumkin, rad etishda esa pul
 *    harakati bo'lmaydi — mahsulot omborda «sotilmagan tayyor»
 *    bo'lib qoladi (7.13).
 *
 * ⚠️ SABAB — ERKIN MATN. Bazada kodlangan sabablar ro'yxati yo'q
 *    (faqat qayta kesishda bor). Shuning uchun «sabab kesimida»
 *    guruhlash ekranda matnni aynan solishtirish bilan qilinadi:
 *    xodim har safar boshqacha yozsa, guruh ham bo'linib ketadi.
 *    Bu — hisobotning emas, ma'lumot modelining cheklovi.
 */
export async function qaytarishVaRad(
  filialId: number,
  davr: Davr,
): Promise<readonly QaytarishQatori[]> {
  const q = await ulanishOl()<
    {
      pozitsiya_id: number;
      raqam: string;
      sana: Date;
      amal: string;
      xodim: string;
      mahsulot: string;
      narx: string;
      ushlab: string | null;
      sabab: string | null;
    }[]
  >`
    SELECT a.obyekt_id AS pozitsiya_id, b.raqam, a.sana, a.amal,
           x.ism AS xodim,
           COALESCE(t.nom, qm.nom) AS mahsulot,
           p.narx_snapshot::text AS narx,
           (a.yangi_qiymat ->> 'ushlab_qolindi') AS ushlab,
           a.izoh AS sabab
    FROM audit_jurnal a
    JOIN buyurtma_pozitsiya p ON p.id = a.obyekt_id
    JOIN buyurtma b ON b.id = p.buyurtma_id
    JOIN xodim x ON x.id = a.xodim_id
    LEFT JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
    LEFT JOIN material qm ON qm.id = p.qoshimcha_material_id
    WHERE a.obyekt_turi = 'buyurtma_pozitsiya'
      AND a.amal IN ('QAYTARISH','RAD_ETISH')
      AND b.sotgan_filial_id = ${filialId}
      AND a.sana >= ${davr.boshi} AND a.sana < ${davr.oxiri}
    ORDER BY a.sana DESC`;

  return q.map((x) => ({
    pozitsiyaId: x.pozitsiya_id,
    buyurtmaRaqam: x.raqam,
    sana: x.sana,
    amal: x.amal === 'RAD_ETISH' ? ('RAD_ETISH' as const) : ('QAYTARISH' as const),
    xodim: x.xodim,
    mahsulot: x.mahsulot,
    narx: new Decimal(x.narx).toFixed(2),
    ushlabQolindi: new Decimal(x.ushlab ?? '0').toFixed(2),
    sabab: x.sabab ?? '',
  }));
}

// ─── 11.5.6 · Sotuvchi erkinliklari ───────────────────────────────────────

export interface ErkinlikQatori {
  readonly xodimId: number;
  readonly ism: string;
  /** Bergan chegirmalari jami */
  readonly chegirma: string;
  /** Limitdan oshgan marta (3.11) */
  readonly limitdanOshdi: number;
  /** Narxni qo'lda o'zgartirgan pozitsiyalar soni (3.8) */
  readonly narxOzgartirdi: number;
  /** Qaytarishda ushlab qolgan summa (8.10) */
  readonly ushlabQoldi: string;
}

/**
 * TZ 11.5.6 — sotuvchi erkinliklari.
 *
 * Sotuvchida uchta chegarasiz erkinlik bor: narxni o'zgartirish
 * (3.8), chegirma limitidan oshish (3.11), qaytarishda 0 gacha
 * ushlab qolish (8.10). Hammasi audit jurnaliga tushadi, lekin
 * jurnal — ming qatorli oqim, uni hech kim o'qimaydi.
 *
 * ⚠️ AYBLOV EMAS — farq ko'rinib tursin. Shuning uchun bu yerda
 *    «norma», «chegara» yoki reyting ustuni YO'Q va jadval
 *    ataylab chartga aylantirilmaydi (HISOBOTLAR-ISH §5.2).
 *
 * ⚠️ Chegirma `buyurtma_pozitsiya` dan (haqiqiy summa), qolgan
 *    uchtasi audit jurnalidan (hodisa soni) olinadi. Ikkalasi
 *    boshqa manba — chegirma bergan, lekin jurnalga tushmagan
 *    (limitdan oshmagan) sotuvchi ham qatorda ko'rinadi.
 */
export async function sotuvchiErkinliklari(
  filialId: number,
  davr: Davr,
): Promise<readonly ErkinlikQatori[]> {
  const q = await ulanishOl()<
    {
      xodim_id: number;
      ism: string;
      chegirma: string | null;
      limitdan: number;
      narx: number;
      ushlab: string | null;
    }[]
  >`
    WITH chegirma AS (
      SELECT b.sotuvchi_id AS xodim_id,
             SUM(COALESCE(p.chegirma_summa, 0)) AS summa
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      GROUP BY b.sotuvchi_id
    ),
    jurnal AS (
      SELECT a.xodim_id,
             COUNT(*) FILTER (WHERE a.amal = 'CHEGIRMA_LIMITIDAN_OSHDI')::int AS limitdan,
             COUNT(*) FILTER (WHERE a.amal = 'NARX_QOLDA')::int AS narx,
             COALESCE(SUM(
               CASE WHEN a.amal = 'QAYTARISH'
                 THEN (a.yangi_qiymat ->> 'ushlab_qolindi')::numeric
                 ELSE 0 END
             ), 0) AS ushlab
      FROM audit_jurnal a
      WHERE a.filial_id = ${filialId}
        AND a.sana >= ${davr.boshi} AND a.sana < ${davr.oxiri}
        AND a.amal IN ('CHEGIRMA_LIMITIDAN_OSHDI','NARX_QOLDA','QAYTARISH')
      GROUP BY a.xodim_id
    )
    SELECT x.id AS xodim_id, x.ism,
           c.summa::numeric(14,2)::text AS chegirma,
           COALESCE(j.limitdan, 0) AS limitdan,
           COALESCE(j.narx, 0) AS narx,
           COALESCE(j.ushlab, 0)::numeric(14,2)::text AS ushlab
    FROM xodim x
    LEFT JOIN chegirma c ON c.xodim_id = x.id
    LEFT JOIN jurnal j ON j.xodim_id = x.id
    WHERE x.filial_id = ${filialId}
      AND (c.summa IS NOT NULL OR j.xodim_id IS NOT NULL)
    ORDER BY 3 DESC NULLS LAST`;

  return q.map((x) => ({
    xodimId: x.xodim_id,
    ism: x.ism,
    chegirma: x.chegirma ?? '0',
    limitdanOshdi: x.limitdan,
    narxOzgartirdi: x.narx,
    ushlabQoldi: x.ushlab ?? '0',
  }));
}

// ─── 11.4.1 · 11.4.4 · 11.4.7 · Foyda-zarar ──────────────────────────────

export interface FoydaZararXom extends FoydaZararKirimi {
  /** Dollarda yozilgan xarajatlar soni — hisobotga kirmagan (1.3), ogoh */
  readonly dollarXarajatSoni: number;
  /**
   * 0066 — «Operatsion» xarajat egasi qo'shgan turlar bo'yicha (so'mda).
   * `nom: null` — turi ko'rsatilmagan. Yig'indisi OPERATSION qatoriga teng.
   */
  readonly operatsionTurlari: readonly { readonly nom: string | null; readonly summa: string }[];
}

/**
 * TZ 11.4.1 — foyda-zarar ma'lumoti (hisob — `lib/domain/hisobot/foyda-zarar.ts`).
 *
 * ⚠️ TUSHUM VA TANNARX SOTUV DAVRIDA (11.4.1 — ish haqi «mahsulot sotilgan
 *    oyda»): 11.5.2 bilan BIR XIL manba — material `ombor_harakat` dan,
 *    usta haqi pozitsiyaga bog'langan `ISH_HAQI` xarajatidan.
 * ⚠️ Shuning uchun xarajatlar ro'yxatidan pozitsiya ish haqi CHIQARILADI —
 *    aks holda ikki marta sanalardi. Kurs farqi ham alohida (11.4.7).
 * ⚠️ Xarajat — o'z sanasi bo'yicha (operatsion, brak, kassa farqi…).
 */
export async function foydaZararMalumoti(filialId: number, davr: Davr): Promise<FoydaZararXom> {
  const sql = ulanishOl();
  const [savdo, xarajat, turlar] = await Promise.all([
    sql<{ tushum: string | null; material: string | null; ish_haqi: string | null }[]>`
      SELECT
        SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
            * CASE WHEN b.valyuta = 'USD' THEN COALESCE(b.kurs_snapshot, 0) ELSE 1 END)
          FILTER (WHERE p.holat <> 'QAYTARILGAN')::numeric(14,2)::text AS tushum,
        SUM(COALESCE((SELECT -SUM(oh.tannarx_summa) FROM ombor_harakat oh
                       WHERE oh.manba_turi = 'buyurtma_pozitsiya' AND oh.manba_id = p.id), 0))
          ::numeric(14,2)::text AS material,
        SUM(COALESCE((SELECT SUM(x.summa) FROM xarajat x
                       WHERE x.modda = 'ISH_HAQI'
                         AND x.manba_turi = 'buyurtma_pozitsiya' AND x.manba_id = p.id), 0))
          ::numeric(14,2)::text AS ish_haqi
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
        AND p.holat NOT IN ('BEKOR', 'RAD_ETILGAN')`,
    sql<{ modda: string; valyuta: string; jami: string; musbat: string | null; manfiy: string | null; soni: number }[]>`
      SELECT x.modda, x.valyuta,
             SUM(x.summa)::numeric(14,2)::text AS jami,
             SUM(x.summa) FILTER (WHERE x.summa > 0)::numeric(14,2)::text AS musbat,
             (-SUM(x.summa) FILTER (WHERE x.summa < 0))::numeric(14,2)::text AS manfiy,
             COUNT(*)::int AS soni
      FROM xarajat x
      WHERE x.filial_id = ${filialId}
        AND x.sana >= (${davr.boshi}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
        AND x.sana < (${davr.oxiri}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
        -- pozitsiya ish haqi tannarxda (va uning stornosi ham)
        AND NOT (x.modda = 'ISH_HAQI' AND x.manba_turi = 'buyurtma_pozitsiya')
        AND NOT (x.modda = 'ISH_HAQI' AND x.manba_turi = 'storno' AND EXISTS (
              SELECT 1 FROM xarajat a WHERE a.id = x.manba_id AND a.manba_turi = 'buyurtma_pozitsiya'))
      GROUP BY x.modda, x.valyuta`,
    // 0066 — operatsion xarajat turlar bo'yicha; storno juftlari nolga chiqadi
    sql<{ nom: string | null; summa: string }[]>`
      SELECT t.nom, SUM(x.summa)::numeric(14,2)::text AS summa
      FROM xarajat x
      LEFT JOIN xarajat_turi t ON t.id = x.xarajat_turi_id
      WHERE x.filial_id = ${filialId} AND x.modda = 'OPERATSION' AND x.valyuta = 'SOM'
        AND x.sana >= (${davr.boshi}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
        AND x.sana < (${davr.oxiri}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
      GROUP BY t.nom
      HAVING SUM(x.summa) <> 0
      ORDER BY SUM(x.summa) DESC`,
  ]);

  const s0 = savdo[0];
  const somda = xarajat.filter((x) => x.valyuta === 'SOM');
  const kursQator = somda.find((x) => x.modda === 'KURS_FARQI');
  return {
    tushum: s0?.tushum ?? '0',
    material: s0?.material ?? '0',
    ishHaqi: s0?.ish_haqi ?? '0',
    xarajatlar: somda
      .filter((x) => x.modda !== 'KURS_FARQI')
      .map((x) => ({ modda: x.modda, summa: x.jami })),
    kursZarar: kursQator?.musbat ?? '0',
    kursDaromad: kursQator?.manfiy ?? '0',
    dollarXarajatSoni: xarajat.filter((x) => x.valyuta !== 'SOM').reduce((y, x) => y + x.soni, 0),
    operatsionTurlari: turlar,
  };
}


// ─── 11.4.2 · Kassa oqimi ─────────────────────────────────────────────────

export interface KassaOqimiQatori {
  readonly kalit: string;
  /** Sof summa: + kirim, − chiqim */
  readonly summa: string;
}

export interface KassaOqimi {
  readonly valyuta: string;
  readonly boshlangich: string;
  readonly kirim: string;
  readonly chiqim: string;
  readonly yakuniy: string;
  /** Hodisa (kassa kodi) bo'yicha */
  readonly kodlar: readonly KassaOqimiQatori[];
  /** Kassa turi (NAQD / KARTA / BANK) bo'yicha */
  readonly turlar: readonly KassaOqimiQatori[];
}

/**
 * TZ 11.4.2 — «Kirim va chiqim, turi va usuli (naqd/karta/bank) kesimida.
 * Boshlang'ich va yakuniy qoldiq.»
 *
 * ⚠️ INVARIANT: boshlang'ich + kirim − chiqim = yakuniy — HAR DOIM aniq.
 *    Shuning uchun storno yozuvlari ham kiradi (har kod bo'yicha SOF summa):
 *    juftlik o'zini o'zi yo'qqa chiqaradi, davr chegarasidan o'tsa ham
 *    qoldiq buzilmaydi. Kirim — musbat sof kodlar yig'indisi, chiqim — manfiy.
 * ⚠️ Valyuta bo'yicha ALOHIDA (1.3).
 */
export async function kassaOqimi(filialId: number, davr: Davr): Promise<KassaOqimi[]> {
  const sql = ulanishOl();
  const [bosh, harakat] = await Promise.all([
    sql<{ valyuta: string; summa: string }[]>`
      SELECT y.valyuta, SUM(y.summa)::numeric(14,2)::text AS summa
      FROM kassa_yozuv y JOIN kassa k ON k.id = y.kassa_id
      WHERE k.filial_id = ${filialId} AND y.sana < ${davr.boshi}
      GROUP BY y.valyuta`,
    sql<{ valyuta: string; kod: string; turi: string; summa: string }[]>`
      SELECT y.valyuta, y.kod, k.turi, SUM(y.summa)::numeric(14,2)::text AS summa
      FROM kassa_yozuv y JOIN kassa k ON k.id = y.kassa_id
      WHERE k.filial_id = ${filialId} AND y.sana >= ${davr.boshi} AND y.sana < ${davr.oxiri}
      GROUP BY y.valyuta, y.kod, k.turi`,
  ]);

  const valyutalar = [...new Set([...bosh.map((x) => x.valyuta), ...harakat.map((x) => x.valyuta)])].sort().reverse();
  return valyutalar.map((v) => {
    const h = harakat.filter((x) => x.valyuta === v);
    const yigindi = (kalit: (x: (typeof h)[number]) => string): KassaOqimiQatori[] => {
      const m = new Map<string, Decimal>();
      for (const x of h) m.set(kalit(x), (m.get(kalit(x)) ?? new Decimal(0)).plus(x.summa));
      return [...m]
        .filter(([, s]) => !s.isZero())
        .map(([k, s]) => ({ kalit: k, summa: s.toFixed(2) }))
        .sort((a, b) => new Decimal(b.summa).comparedTo(a.summa));
    };
    const kodlar = yigindi((x) => x.kod);
    const kirim = kodlar.filter((k) => new Decimal(k.summa).gt(0)).reduce((y, k) => y.plus(k.summa), new Decimal(0));
    const chiqim = kodlar.filter((k) => new Decimal(k.summa).lt(0)).reduce((y, k) => y.minus(k.summa), new Decimal(0));
    const boshlangich = new Decimal(bosh.find((x) => x.valyuta === v)?.summa ?? '0');
    return {
      valyuta: v,
      boshlangich: boshlangich.toFixed(2),
      kirim: kirim.toFixed(2),
      chiqim: chiqim.toFixed(2),
      yakuniy: boshlangich.plus(kirim).minus(chiqim).toFixed(2),
      kodlar,
      turlar: yigindi((x) => x.turi),
    };
  });
}

// ─── Pul prognozi (30 kun) — 2026-10-12 ──────────────────────────────────

export interface PrognozHodisasi {
  readonly sana: string;
  readonly turi: 'KIRIM' | 'CHIQIM';
  readonly nom: string;
  readonly hujjat: string;
  readonly havola: string;
  readonly summa: string;
}

export interface PulPrognoziXom {
  readonly bugun: string;
  readonly boshlangich: string;
  readonly kirimlar: readonly PrognozHodisasi[];
  readonly chiqimlar: readonly PrognozHodisasi[];
  /** Oxirgi 90 kun: sotuvda olingan to'lov (K1) o'rtachasi */
  readonly kunlikKirim: string;
  /** Oxirgi 90 kun: ish haqi, avans, operatsion chiqim (C4, C5, C7) o'rtachasi */
  readonly kunlikChiqim: string;
  /** Muddati o'tgan, undirilmagan mijoz qarzi — prognozga kirmaydi */
  readonly muddatiOtganKirim: string;
  /** To'lov muddati belgilanmagan — prognozga kirmaydi */
  readonly muddatsizKirim: string;
  readonly muddatsizChiqim: string;
}

const ORTACHA_KUN = 90;

/**
 * Pul prognozi ma'lumoti (hisob — `lib/domain/hisobot/pul-prognozi.ts`).
 *
 * ⚠️ Mijoz va yetkazib beruvchi qarzlari — BITTA FIFO taqsimotdan (kartochka
 *    va ro'yxatlar bilan bir xil). Faqat SO'M (1.3) va shu FILIAL hujjatlari.
 * ⚠️ Muddat: mijozda — sotuv sanasi + mijozning to'lov muddati (kun),
 *    yetkazib beruvchida — kirimdagi to'lov muddati. Muddat yo'q — prognozga
 *    kirmaydi, alohida summa bo'lib ko'rsatiladi (uydirilmaydi).
 */
export async function pulPrognoziMalumoti(filialId: number): Promise<PulPrognoziXom> {
  const sql = ulanishOl();
  const bugun = toshkentKuniOl();
  const [kassa, ortacha, qarzdorlar, yetkazuvchilar] = await Promise.all([
    sql<{ q: string | null }[]>`
      SELECT SUM(y.summa)::numeric(14,2)::text AS q
      FROM kassa_yozuv y JOIN kassa k ON k.id = y.kassa_id
      WHERE k.filial_id = ${filialId} AND y.valyuta = 'SOM'`,
    sql<{ kirim: string | null; chiqim: string | null }[]>`
      SELECT SUM(y.summa) FILTER (WHERE y.kod = 'K1')::text AS kirim,
             (-SUM(y.summa) FILTER (WHERE y.kod IN ('C4', 'C5', 'C7')))::text AS chiqim
      FROM kassa_yozuv y JOIN kassa k ON k.id = y.kassa_id
      WHERE k.filial_id = ${filialId} AND y.valyuta = 'SOM'
        AND y.sana >= now() - make_interval(days => ${ORTACHA_KUN})`,
    qarzdorlarJurnali(),
    yetkazibHolatlari(null),
  ]);

  // ── Kirimlar: mijozlar qarzi ──
  const kirimBandlar: { band: QarzBandi; mijoz: string; muddatKun: number | null }[] = [];
  for (const m of qarzdorlar) {
    for (const b of qarzniTaqsimla(m.jurnal).bandlar) {
      if (b.valyuta !== 'SOM' || !new Decimal(b.qolgan).gt(0)) continue;
      kirimBandlar.push({ band: b, mijoz: m.ism, muddatKun: m.tolovMuddatiKun });
    }
  }
  const buyurtmaIdlar = kirimBandlar.flatMap((x) => (x.band.buyurtmaId === null ? [] : [x.band.buyurtmaId]));
  const buyurtmalar = new Map(
    (buyurtmaIdlar.length === 0
      ? []
      : await sql<{ id: number; raqam: string; filial: number }[]>`
          SELECT id, raqam, sotgan_filial_id AS filial FROM buyurtma WHERE id = ANY(${buyurtmaIdlar})`
    ).map((b) => [b.id, b]),
  );
  const kirimlar: PrognozHodisasi[] = [];
  let otgan = new Decimal(0);
  let muddatsizKirim = new Decimal(0);
  for (const { band, mijoz, muddatKun } of kirimBandlar) {
    const b = band.buyurtmaId === null ? undefined : buyurtmalar.get(band.buyurtmaId);
    if (b !== undefined && b.filial !== filialId) continue;
    if (muddatKun === null || b === undefined) {
      muddatsizKirim = muddatsizKirim.plus(band.qolgan);
      continue;
    }
    const sana = kunQosh(toshkentKuniOl(band.sana), muddatKun);
    if (sana < bugun) {
      otgan = otgan.plus(band.qolgan);
      continue;
    }
    kirimlar.push({ sana, turi: 'KIRIM', nom: mijoz, hujjat: b.raqam, havola: `/buyurtma/${String(b.id)}`, summa: band.qolgan });
  }

  // ── Chiqimlar: yetkazib beruvchilarga qarz ──
  const kirimIdlar: number[] = [];
  for (const h of yetkazuvchilar.values()) {
    for (const b of h.taqsimot.bandlar) if (b.buyurtmaId !== null) kirimIdlar.push(b.buyurtmaId);
  }
  const kirimFilial = new Map(
    (kirimIdlar.length === 0
      ? []
      : await sql<{ id: number; filial: number; nom: string }[]>`
          SELECT k.id, k.filial_id AS filial, y.nom FROM kirim k
          JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
          WHERE k.id = ANY(${kirimIdlar})`
    ).map((k) => [k.id, k]),
  );
  const chiqimlar: PrognozHodisasi[] = [];
  let muddatsizChiqim = new Decimal(0);
  for (const h of yetkazuvchilar.values()) {
    for (const b of h.taqsimot.bandlar) {
      if (b.valyuta !== 'SOM' || !new Decimal(b.qolgan).gt(0) || b.buyurtmaId === null) continue;
      const kf = kirimFilial.get(b.buyurtmaId);
      if (kf === undefined || kf.filial !== filialId) continue;
      const km = h.kirimlar.get(b.buyurtmaId);
      if (km === undefined || km.muddat === null) {
        muddatsizChiqim = muddatsizChiqim.plus(b.qolgan);
        continue;
      }
      chiqimlar.push({
        sana: km.muddat,
        turi: 'CHIQIM',
        nom: kf.nom,
        hujjat: km.raqam,
        havola: `/ombor/kirim/${String(b.buyurtmaId)}`,
        summa: b.qolgan,
      });
    }
  }

  const o = ortacha[0];
  return {
    bugun,
    boshlangich: kassa[0]?.q ?? '0',
    kirimlar: kirimlar.sort((a, b) => a.sana.localeCompare(b.sana)),
    chiqimlar: chiqimlar.sort((a, b) => a.sana.localeCompare(b.sana)),
    // Taxmin — butun so'mgacha (tiyin aniqligi bu yerda soxta aniqlik)
    kunlikKirim: new Decimal(o?.kirim ?? 0).div(ORTACHA_KUN).toDecimalPlaces(0).toFixed(2),
    kunlikChiqim: new Decimal(o?.chiqim ?? 0).div(ORTACHA_KUN).toDecimalPlaces(0).toFixed(2),
    muddatiOtganKirim: otgan.toFixed(2),
    muddatsizKirim: muddatsizKirim.toFixed(2),
    muddatsizChiqim: muddatsizChiqim.toFixed(2),
  };
}
