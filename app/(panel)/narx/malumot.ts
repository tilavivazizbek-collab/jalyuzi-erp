import 'server-only';

/**
 * app/(panel)/narx/malumot.ts — «Narxlar va turlar» · TZ 3.8 · 6.2 · 20.9
 *
 * ⚠️ NEGA BU EKRAN BOR
 *
 *    Egasi (2026-09-20): «hozirda qatnashgan har bir narsani narxi
 *    hisoblanib qo'shiladi, endi unday bo'lmaydi — men belgilab
 *    qo'yaman mijozga narx qanday hisoblanishini».
 *
 *    Narx endi MAHSULOT TURI va MATO DARAJASI juftligiga qo'yiladi.
 */

import { ulanishOl } from '@/lib/db';
import { joriyKurs } from '@/lib/amal/kurs';

export interface TurQatori {
  readonly id: number;
  readonly nom: string;
  /** Nechta narx qoidasi bor — nol bo'lsa ekranda ogohlantirish chiqadi */
  readonly qoidaSoni: number;
  readonly qoshimchaSoni: number;
}

export interface NarxGuruhQatori {
  readonly id: number;
  readonly nom: string;
  /** Nechta materialga shu daraja qo'yilgan */
  readonly materialSoni: number;
}

export interface BosqichQatori {
  readonly dan: string;
  readonly gacha: string | null;
  readonly narx: string;
  readonly valyuta: string;
}

export interface QoidaQatori {
  readonly mijozTuriId: number | null;
  readonly filialId: number | null;
  readonly hisoblashUsuli: string;
  /** Eng kam hisob o'lchovi — 0056. `null` — tekshirilmaydi */
  readonly minOlchov: string | null;
  readonly bosqichlar: readonly BosqichQatori[];
}

export interface QoshimchaQatori {
  readonly nom: string;
  readonly hisoblashUsuli: string;
  readonly narx: string;
  readonly valyuta: string;
  readonly materialId: number | null;
  readonly almashtirishGuruhId: number | null;
  readonly formula: string | null;
}

export interface TanlovQatori {
  readonly id: number;
  readonly nom: string;
}

/** Turlar ro'yxati — chap ustun */
export async function turlarniOl(): Promise<TurQatori[]> {
  return ulanishOl()<TurQatori[]>`
    SELECT t.id, t.nom,
           (SELECT COUNT(*)::int FROM mahsulot_narx mn
             WHERE mn.mahsulot_tur_id = t.id AND mn.faol = true) AS "qoidaSoni",
           (SELECT COUNT(*)::int FROM mahsulot_qoshimcha mq
             WHERE mq.mahsulot_tur_id = t.id AND mq.faol = true) AS "qoshimchaSoni"
    FROM mahsulot_tur t
    WHERE t.faol = true
    ORDER BY t.tartib, t.nom`;
}

/**
 * Materialni o'zi sotish uchun nechta qoida bor — chap ustundagi
 * belgi shundan chiqadi (egasi qarori 2026-09-20).
 */
export async function materialQoidalariSoni(): Promise<number> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM mahsulot_narx
    WHERE mahsulot_tur_id IS NULL AND faol = true`;
  return q[0]?.n ?? 0;
}

/**
 * NARX MATRITSASI — tur × daraja, soha auditi 2026-09-22.
 *
 * ⚠️ NEGA KERAK
 *
 *    Narx qo'yilmagani ilgari faqat SOTUV paytida bilinardi —
 *    mijoz oldida, «narx topilmadi» degan xabar bilan. Chap
 *    ustundagi belgi «bu turda N ta qoida bor» deydi, lekin
 *    QAYSI DARAJA ochiq qolganini aytmaydi: uchta darajadan
 *    ikkitasi to'ldirilgan tur ham «2» deb yashil turaveradi.
 *
 * ⚠️ UCH HOLAT AJRATILADI, ikkitasi emas:
 *
 *      to'liq    — umumiy qoida bor (mijoz turi ham, filial ham
 *                  bo'sh) va kamida bitta bosqichi bor
 *      qisman    — qoida bor, lekin FAQAT ma'lum mijoz turiga
 *                  yoki filialga. Boshqa mijozga sotilmaydi —
 *                  bu eng xavfli holat, chunki ekranda «bor»
 *                  bo'lib ko'rinardi
 *      yo'q      — umuman qoida yo'q
 *
 * ⚠️ BOSQICHSIZ QOIDA «yo'q» ga tenglashtiriladi: qoida bor-u
 *    bosqichi yo'q bo'lsa, `qoidaNarxi()` xato otadi va sotuv
 *    baribir to'xtaydi (`narx-qoidasi.ts:155`).
 */
export interface MatritsaKatagi {
  readonly turId: number | null;
  readonly holat: 'TOLIQ' | 'QISMAN';
}

/**
 * ⚠️ FAQAT TURGA qo'yilgan qatorlar. Darajaga umumiy qo'yilgani
 *    (0055) bu yerga TUSHMAYDI — u alohida ro'yxatda keladi va
 *    matritsada boshqa rang bilan ko'rsatiladi.
 *
 *    Aralashtirilsa egasi narx QAYERDAN kelayotganini bilmasdi:
 *    turga qo'yilganmi yoki darajadanmi — bu ikki boshqa joyda
 *    tuzatiladi.
 */
export async function narxMatritsasiniOl(): Promise<MatritsaKatagi[]> {
  return ulanishOl()<MatritsaKatagi[]>`
    SELECT mn.mahsulot_tur_id AS "turId",
           CASE WHEN bool_or(mn.mijoz_turi_id IS NULL AND mn.filial_id IS NULL)
                THEN 'TOLIQ' ELSE 'QISMAN' END AS holat
    FROM mahsulot_narx mn
    WHERE mn.faol = true
      AND mn.hamma_turga = false
      AND EXISTS (SELECT 1 FROM mahsulot_narx_bosqich b
                   WHERE b.mahsulot_narx_id = mn.id AND b.faol = true)
    GROUP BY mn.mahsulot_tur_id`;
}

/**
 * «Hamma tur uchun» standart narx qo'yilganmi — 0055 · 0057.
 *
 * ⚠️ Qo'yilgan bo'lsa turga alohida qatori yo'q turlar ham
 *    SOTILADI. Narx xaritasi usiz yolg'on ogohlantirish berardi.
 */
export async function standartNarxBormi(): Promise<boolean> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT count(*)::int AS n
      FROM mahsulot_narx mn
     WHERE mn.faol = true AND mn.hamma_turga = true
       AND mn.mijoz_turi_id IS NULL AND mn.filial_id IS NULL
       AND EXISTS (SELECT 1 FROM mahsulot_narx_bosqich b
                    WHERE b.mahsulot_narx_id = mn.id AND b.faol = true)`;
  return (q[0]?.n ?? 0) > 0;
}

export async function turQoidalariniOl(
  turId: number | null,
  hammaTurga = false,
): Promise<QoidaQatori[]> {
  const sql = ulanishOl();

  const qoidalar = await sql<
    {
      id: number;
      mijozTuriId: number | null;
      filialId: number | null;
      hisoblashUsuli: string;
      minOlchov: string | null;
    }[]
  >`
    SELECT mn.id,
           mn.mijoz_turi_id AS "mijozTuriId", mn.filial_id AS "filialId",
           mn.hisoblash_usuli AS "hisoblashUsuli",
           mn.min_olchov::text AS "minOlchov"
    FROM mahsulot_narx mn
    WHERE mn.faol = true
      AND (${turId === null} OR mn.mahsulot_tur_id = ${turId ?? 0})
      AND (${turId !== null} OR mn.mahsulot_tur_id IS NULL)
      AND mn.hamma_turga = ${hammaTurga}
    ORDER BY g.tartib, g.nom`;

  if (qoidalar.length === 0) return [];

  const bosqichlar = await sql<
    { mahsulotNarxId: number; dan: string; gacha: string | null; narx: string; valyuta: string }[]
  >`
    SELECT mahsulot_narx_id AS "mahsulotNarxId", dan::text, gacha::text,
           narx::text, valyuta
    FROM mahsulot_narx_bosqich
    WHERE mahsulot_narx_id = ANY(${qoidalar.map((q) => q.id)}) AND faol = true
    ORDER BY dan`;

  return qoidalar.map((q) => ({
    mijozTuriId: q.mijozTuriId,
    filialId: q.filialId,
    hisoblashUsuli: q.hisoblashUsuli,
    /** 0056 — `numeric` matn bo'lib keladi (P-13), ekranda ham matn */
    minOlchov: q.minOlchov,
    bosqichlar: bosqichlar
      .filter((b) => b.mahsulotNarxId === q.id)
      .map((b) => ({ dan: b.dan, gacha: b.gacha, narx: b.narx, valyuta: b.valyuta })),
  }));
}

/**
 * ⚠️ Materialni o'zi sotishda qo'shimcha BO'LMAYDI: «usti shabalik»
 *    tayyor mahsulotga qo'shiladi, matoning o'ziga emas. Shuning
 *    uchun `null` turda bo'sh ro'yxat qaytadi.
 */
export async function turQoshimchalariniOl(
  turId: number | null,
): Promise<QoshimchaQatori[]> {
  if (turId === null) return [];

  return ulanishOl()<QoshimchaQatori[]>`
    SELECT nom, hisoblash_usuli AS "hisoblashUsuli", narx::text, valyuta,
           material_id AS "materialId", almashtirish_guruh_id AS "almashtirishGuruhId",
           formula
    FROM mahsulot_qoshimcha
    WHERE mahsulot_tur_id = ${turId} AND faol = true
    ORDER BY tartib, nom`;
}

/** Qo'shimchaga material biriktirish uchun */
export async function materiallarniOl(): Promise<TanlovQatori[]> {
  return ulanishOl()<TanlovQatori[]>`
    SELECT id, nom FROM material WHERE faol = true ORDER BY nom`;
}

export async function almashtirishGuruhlariniOl(): Promise<TanlovQatori[]> {
  return ulanishOl()<TanlovQatori[]>`
    SELECT id, nom FROM almashtirish_guruh WHERE faol = true ORDER BY nom`;
}

/** TZ 6.2 — narxni mijoz turiga qarab ajratish uchun */
export async function mijozTurlariniOl(): Promise<TanlovQatori[]> {
  return ulanishOl()<TanlovQatori[]>`
    SELECT id, nom FROM mijoz_turi WHERE faol = true ORDER BY nom`;
}

/** TZ 20.9 — narxni filialga qarab ajratish uchun */
export async function filiallarniOl(): Promise<TanlovQatori[]> {
  return ulanishOl()<TanlovQatori[]>`
    SELECT id, nom FROM filial WHERE faol = true ORDER BY nom`;
}

/**
 * Tekshirish kalkulyatori uchun bugungi kurs.
 *
 * ⚠️ `null` bo'lsa dollardagi narx hisoblanmaydi va ekran buni
 *    AYTADI — jimgina so'm deb olish narxni ming barobar
 *    kamaytirardi (`katalogNarxi`).
 */
export async function joriyKursniOl(): Promise<string | null> {
  return joriyKurs(ulanishOl());
}
