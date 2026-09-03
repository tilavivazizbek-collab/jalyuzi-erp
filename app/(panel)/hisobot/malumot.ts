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

import { ulanishOl } from '@/lib/db';
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
} from '@/lib/domain/hisobot/ustama-eroziya';
import { katalogNarxi } from '@/lib/domain/narx';
import { kurs, pulMatn, som, type Som } from '@/lib/domain/pul';

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
export async function ustamaHisoboti(filialId: number): Promise<EroziyaHisoboti> {
  const sql = ulanishOl();
  const kursMatn = await joriyKurs(sql);

  const qatorlar = await sql<UstamaQatori[]>`
    SELECT m.id AS material_id, m.nom, m.sotuv_narx::text, m.sotuv_valyuta,
           m.min_ustama_foiz::text,
           (SUM(CASE WHEN b.turi = 'DONA'
                     THEN COALESCE(b.miqdor, 0)
                     ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END
                * b.tannarx_birlik_snapshot)
            / NULLIF(SUM(CASE WHEN b.turi = 'DONA'
                              THEN COALESCE(b.miqdor, 0)
                              ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END), 0)
           )::text AS tannarx
    FROM material m
    JOIN bolak b ON b.material_id = m.id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
      AND m.faol = true
      AND b.tannarx_valyuta_snapshot = 'SOM'
    GROUP BY m.id
    ORDER BY m.nom`;

  const k = kursMatn === null ? null : kurs(kursMatn, new Date(), 'JORIY');

  return ustamaEroziyasi(
    qatorlar.map((q) => ({
      materialId: q.material_id,
      nom: q.nom,
      tannarx: som(q.tannarx ?? 0),
      sotuvNarx: sotuvNarxiSomda(q.sotuv_narx, q.sotuv_valyuta, k),
      chegara: q.min_ustama_foiz === null ? null : Number(q.min_ustama_foiz),
    })),
  );
}

/**
 * Kurs yo'q bo'lsa dollarli narx uchun `katalogNarxi` xato otadi (5.4).
 * Hisobot esa BUTUN ro'yxatni ko'rsatishi kerak — bitta materialdan
 * butun sahifa yiqilmasin. Shu sabab bu yerda nol qaytadi va qator
 * «hisoblanmadi» bo'lib ajraladi.
 */
function sotuvNarxiSomda(
  narx: string | null,
  valyuta: string,
  k: ReturnType<typeof kurs> | null,
): Som {
  if (narx === null) return som(0);
  if (valyuta === 'USD' && k === null) return som(0);
  return katalogNarxi(narx, valyuta, k) ?? som(0);
}

// ─── 11.7.6 · Muzlab qolgan pul ───────────────────────────────────────────

export interface MuzlaganTafsilot extends MuzlaganPul {
  readonly ostatkaQatorlari: readonly {
    readonly bolakId: number;
    readonly kod: string;
    readonly materialNom: string;
    readonly olcham: string;
    readonly qiymat: string;
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
    }[]
  >`
    SELECT b.id AS bolak_id, b.kod, b.material_id, m.nom AS material_nom,
           b.eni_m::text, b.boyi_m::text,
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
    SELECT m.id AS material_id, m.nom,
           SUM(CASE WHEN b.turi = 'DONA'
                    THEN COALESCE(b.miqdor, 0)
                    ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END
               * b.tannarx_birlik_snapshot)::numeric(14,2)::text AS qoldiq_qiymati,
           COALESCE(SUM(CASE WHEN b.turi = 'OSTATKA' AND b.holat = 'BOSH'
                             THEN COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0)
                                  * b.tannarx_birlik_snapshot
                             ELSE 0 END), 0)::numeric(14,2)::text AS ostatka_qiymati,
           (SELECT MAX(oh.sana) FROM ombor_harakat oh
             JOIN bolak b2 ON b2.id = oh.bolak_id
            WHERE b2.material_id = m.id AND oh.filial_id = ${filialId}
              AND oh.turi <> 'BOSHLANGICH') AS oxirgi_harakat
    FROM material m
    JOIN bolak b ON b.material_id = m.id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
    GROUP BY m.id
    HAVING (SELECT MAX(oh.sana) FROM ombor_harakat oh
              JOIN bolak b2 ON b2.id = oh.bolak_id
             WHERE b2.material_id = m.id AND oh.filial_id = ${filialId}
               AND oh.turi <> 'BOSHLANGICH')
           < now() - (${QIMIRLAMAGAN_OY} || ' months')::interval
        OR (SELECT MAX(oh.sana) FROM ombor_harakat oh
              JOIN bolak b2 ON b2.id = oh.bolak_id
             WHERE b2.material_id = m.id AND oh.filial_id = ${filialId}
               AND oh.turi <> 'BOSHLANGICH') IS NULL
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
    SELECT m.id AS material_id, m.nom, m.sarflash_birligi,
           (SELECT SUM(CASE WHEN b.turi = 'DONA'
                            THEN COALESCE(b.miqdor, 0)
                            ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END)
              FROM bolak b
             WHERE b.material_id = m.id AND b.filial_id = ${filialId}
               AND b.faol = true AND b.holat IN ('BOSH','BAND'))::text AS qoldiq,
           -- Uch o'lchov ustuni QO'SHILADI, lekin aralashmaydi: materialning
           -- sarflash birligi bitta (5.3), shuning uchun bir materialda
           -- faqat bittasi to'ladi, qolgani NULL.
           (SELECT SUM(COALESCE(oh.miqdor_kv_m, 0)
                       + COALESCE(oh.miqdor_sm, 0)
                       + COALESCE(oh.miqdor_dona, 0))
              FROM ombor_harakat oh
              JOIN bolak b2 ON b2.id = oh.bolak_id
             WHERE b2.material_id = m.id AND oh.filial_id = ${filialId}
               AND oh.turi IN ('KESIM','CHIQINDI','BRAK')
               AND oh.sana >= ${davr.boshi} AND oh.sana < ${davr.oxiri})::text AS sarf
    FROM material m
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
  const qatorlar = await ulanishOl()<
    { material_id: number; nom: string; qiymat: string }[]
  >`
    SELECT m.id AS material_id, m.nom,
           SUM(CASE WHEN b.turi = 'DONA'
                    THEN COALESCE(b.miqdor, 0)
                    ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END
               * b.tannarx_birlik_snapshot)::numeric(14,2)::text AS qiymat
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
  const q = await ulanishOl()<{ jami: string | null }[]>`
    SELECT SUM(CASE WHEN b.turi = 'DONA'
                    THEN COALESCE(b.miqdor, 0)
                    ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END
               * b.tannarx_birlik_snapshot)::numeric(14,2)::text AS jami
    FROM bolak b
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH','BAND')
      AND b.tannarx_valyuta_snapshot = 'SOM'`;
  return q[0]?.jami ?? '0';
}
