/**
 * app/(panel)/buyurtma/yangi/malumot.ts — TZ 3.2 · 3.3 · 3.7 · 3.10 · Q-25 · Q-26
 *
 * Sotuv ekrani so'rovlari.
 *
 * ⚠️ TZ 3.3 — «Har slot qatorida FAQAT O'SHA SLOTGA bog'langan matolar
 *    chiqadi. Ya'ni "Orqa mato" qatorida to'r matolar ko'rinmaydi va
 *    sotuvchi adashib qo'ya olmaydi.»
 *
 *    Bog'lanish `almashtirish_guruh` orqali. Slotda guruh ko'rsatilmagan
 *    bo'lsa — barcha faol material chiqadi.
 */

import { ulanishOl } from '@/lib/db';

export type {
  SotuvMaterial,
  SotuvSlot,
  SotuvParametr,
  SotuvAksessuar,
  SotuvTuri,
} from '@/lib/amal/katalog';

/**
 * ⚠️ Katalog `lib/amal/katalog.ts` ga ko'chdi: uni bot ham o'qiydi
 *    (13.4). Bu yerdan qayta eksport qilinadi — ekran kodi
 *    o'zgarmasin.
 */
export { sotuvTurlari } from '@/lib/amal/katalog';


/** TZ 3.10 — mijoz qidiruvi ism yoki telefon bo'yicha. */
export interface SotuvMijozi {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly qarzLimiti: string | null;
  /** TZ 3.10 — «Mijoz tanlangach offseti darhol ko'rinadi va narx qayta hisoblanadi» */
  readonly offsetTuri: string | null;
  readonly offsetQiymat: string | null;
  /**
   * TZ 6.3 — GURUH chegirmasi.
   *
   * ⚠️ Ikkalasi ALOHIDA qaytariladi, bazada birlashtirilmaydi:
   *    qaysi biri ustun turishini `amaldagiOffset()` hal qiladi
   *    va u qoida domainda turishi shart (§2.2). SQL da
   *    `COALESCE` qilinsa, bot boshqacha hisoblab qo'yardi.
   */
  readonly guruhNomi: string | null;
  readonly guruhOffsetTuri: string | null;
  readonly guruhOffsetQiymat: string | null;

  /**
   * TZ 6.2 — MIJOZ TURI (narx darajasi).
   *
   * ⚠️ Guruhdan boshqa narsa: guruh chegirma beradi, tur esa
   *    materialning O'Z NARXINI belgilaydi. Ikkalasi ketma-ket
   *    qo'llanadi: tur narxi → guruh/shaxsiy offset.
   */
  readonly mijozTuriId: number | null;
  readonly turNomi: string | null;

  /**
   * TZ 6.4 — MIJOZNING JORIY QARZI, har valyuta alohida.
   *
   * ⚠️ Limit tekshiruvi uchun SHART. Ilgari `qarzLimiti` ekranga
   *    kelar, lekin joriy qarz umuman so'ralmasdi — ya'ni TZ 6.4
   *    talab qilgan ogohlantirish HECH QACHON chiqmasdi.
   *
   * ⚠️ Valyutalar ARALASHTIRILMAYDI (1.3): so'm va dollar
   *    alohida keladi, so'mga o'girish `limitHolati` da JORIY kurs
   *    bilan bajariladi.
   */
  readonly qarzSom: string;
  readonly qarzDollar: string;
}

export async function mijozQidir(matn: string, chegara = 10): Promise<SotuvMijozi[]> {
  const q = matn.trim();
  if (q === '') return [];

  const qatorlar = await ulanishOl()<
    {
      id: number;
      ism: string;
      telefon: string | null;
      qarz_limiti: string | null;
      offset_turi: string | null;
      offset_qiymat: string | null;
      guruh_nomi: string | null;
      guruh_offset_turi: string | null;
      guruh_offset_qiymat: string | null;
      mijoz_turi_id: number | null;
      tur_nomi: string | null;
      qarz_som: string;
      qarz_dollar: string;
    }[]
  >`
    SELECT m.id, m.ism, m.telefon, m.qarz_limiti,
           m.offset_turi, m.offset_qiymat,
           g.nom AS guruh_nomi,
           g.offset_turi AS guruh_offset_turi,
           g.offset_qiymat AS guruh_offset_qiymat,
           m.mijoz_turi_id, t.nom AS tur_nomi,
           /*
            * 2.2-invariant — balans SAQLANMAYDI, har safar SUM() bilan.
            * Valyutalar alohida yig'iladi (1.3).
            */
           COALESCE((SELECT SUM(h.summa) FROM mijoz_harakat h
                      WHERE h.mijoz_id = m.id AND h.valyuta = 'SOM'), 0)::text
             AS qarz_som,
           COALESCE((SELECT SUM(h.summa) FROM mijoz_harakat h
                      WHERE h.mijoz_id = m.id AND h.valyuta = 'USD'), 0)::text
             AS qarz_dollar
    FROM mijoz m
    LEFT JOIN mijoz_guruh g ON g.id = m.mijoz_guruh_id AND g.faol = true
    LEFT JOIN mijoz_turi t ON t.id = m.mijoz_turi_id AND t.faol = true
    WHERE m.faol = true AND (m.ism ILIKE ${`%${q}%`} OR m.telefon LIKE ${`%${q}%`})
    ORDER BY m.ism LIMIT ${chegara}`;

  return qatorlar.map((r) => ({
    id: r.id,
    ism: r.ism,
    telefon: r.telefon,
    qarzLimiti: r.qarz_limiti,
    offsetTuri: r.offset_turi,
    offsetQiymat: r.offset_qiymat,
    guruhNomi: r.guruh_nomi,
    guruhOffsetTuri: r.guruh_offset_turi,
    guruhOffsetQiymat: r.guruh_offset_qiymat,
    mijozTuriId: r.mijoz_turi_id,
    turNomi: r.tur_nomi,
    qarzSom: r.qarz_som,
    qarzDollar: r.qarz_dollar,
  }));
}

/** TZ 20.4.1 — sotuvchi tikuvchi filialni o'zgartira oladi. */
export async function tikaOladiganFiliallar(): Promise<
  { id: number; nom: string; bosh: boolean }[]
> {
  const q = await ulanishOl()<{ id: number; nom: string; bosh: boolean }[]>`
    SELECT id, nom, bosh FROM filial
    WHERE faol = true AND ishlab_chiqaradi = true
    ORDER BY bosh DESC, nom`;
  return q;
}

// ─── Qo'shimcha mahsulot — TZ 3.x (kengaytma) ────────────────────────────

export interface QoshimchaMaterial {
  readonly id: number;
  readonly nom: string;
  readonly narx: string | null;
  readonly narxValyuta: string;
  /**
   * TZ 5.4 · 6.2 — MIJOZ TURI narxi.
   *
   * ⚠️ 2026-09-22 gacha bu yerda YO'Q edi va bu tafovut yaratardi:
   *    slotdagi matoga ham, aksessuarga ham optom narx qo'llanardi
   *    (`forma.tsx` — «optomchi mexanizmni ham optom narxda oladi»),
   *    bot katalogi ham qo'llardi, lekin O'SHA MEXANIZMNI alohida
   *    sotganda panel chakana narxni olardi.
   *
   *    Ya'ni bir xil buyum qaysi oynadan sotilganiga qarab ikki xil
   *    narxda ketardi. Bu chegirma emas, XATO.
   */
  readonly turNarxlari: Record<number, { narx: string; valyuta: string }>;
  readonly boshDona: number;
  /**
   * `DONA` — donalab sotiladi, `RULON` — metrlab kesib sotiladi
   * (egasi qarori 2026-09-20).
   */
  readonly hisobTuri: string;
  readonly sarflashBirligi: string;
  /** Mato darajasi — metrlab sotishda narx shundan keladi */
  readonly narxGuruhId: number | null;
  /** Kesib sotish uchun omborda bor maydon, kv.m */
  readonly boshKvM: number;
  /** Eng keng rulon eni, metr — sotuvchiga «bundan keng kesib bo'lmaydi» */
  readonly engKengM: number;
}

/**
 * Alohida sotiladigan buyumlar — mexanizm, kronshteyn, zanjir.
 *
 * ⚠️ MATO HAM SHU RO'YXATDA — egasi qarori 2026-09-20. Donalab
 *    sotiladigani (kronshteyn) `hisobTuri = DONA`, metrlab kesib
 *    sotiladigani (mato) `RULON`. Ekran ikkalasini boshqacha
 *    so'raydi: birinchisida soni, ikkinchisida eni × bo'yi.
 *
 * ⚠️ «TO'G'RIDAN-TO'G'RI SOTILADI» BELGISI BOR materiallar (egasi
 *    qarori 2026-09-20). Ilgari hamma dona material ro'yxatda
 *    chiqardi va ularning ko'pchiligida sotuv narxi yo'q edi —
 *    sotuvchi narxsiz qatorni tanlab, keyin qo'lda summa yozardi.
 *
 *    Endi ro'yxat qisqa va har qatorda narx bor.
 *
 * ⚠️ Qoldiq shu FILIALDA hisoblanadi (Q-25) va narx filial
 *    narxidan keladi (20.9).
 */
export async function qoshimchaMateriallar(
  filialId: number,
): Promise<QoshimchaMaterial[]> {
  const sql = ulanishOl();

  /**
   * TZ 6.2 — mijoz turi narxlari BITTA so'rov bilan olinadi va
   * xaritaga yig'iladi: mijoz tanlanganda ekran serverga qayta
   * bormaydi. Turlar soni kichik (2–5), xarita ham kichik.
   *
   * ⚠️ Bot katalogi (`lib/amal/katalog.ts`) aynan shu naqshni
   *    ishlatadi — bu yerda takrorlanishining sababi so'rov
   *    boshqa materiallar to'plami ustida ishlashi
   *    (`togridan_sotiladi = true`).
   */
  const turNarxQatorlari = await sql<
    { material_id: number; mijoz_turi_id: number; narx: string; valyuta: string }[]
  >`
    SELECT n.material_id, n.mijoz_turi_id, n.sotuv_narx::text AS narx, n.valyuta
      FROM material_tur_narx n
      JOIN mijoz_turi t ON t.id = n.mijoz_turi_id AND t.faol = true
      JOIN material m ON m.id = n.material_id
     WHERE m.faol = true AND m.togridan_sotiladi = true`;

  const turNarxBoyicha = new Map<number, Record<string, { narx: string; valyuta: string }>>();
  for (const q of turNarxQatorlari) {
    const bor = turNarxBoyicha.get(q.material_id) ?? {};
    bor[String(q.mijoz_turi_id)] = { narx: q.narx, valyuta: q.valyuta };
    turNarxBoyicha.set(q.material_id, bor);
  }

  const qatorlar = await sql<Omit<QoshimchaMaterial, 'turNarxlari'>[]>`
    SELECT m.id, m.nom,
           COALESCE(fn.sotuv_narx::text, m.sotuv_narx::text) AS narx,
           COALESCE(fn.valyuta, m.sotuv_valyuta) AS "narxValyuta",
           COALESCE((SELECT SUM(b.miqdor) FROM bolak b
                     WHERE b.material_id = m.id
                       AND b.filial_id = ${filialId}
                       AND b.turi = 'DONA'
                       AND b.holat = 'BOSH'
                       AND b.faol = true), 0)::int AS "boshDona",
           m.hisob_turi AS "hisobTuri",
           m.sarflash_birligi AS "sarflashBirligi",
           m.narx_guruh_id AS "narxGuruhId",
           /*
            * Q-05 — kv.m saqlanmaydi, eni x boyi dan hisoblanadi.
            * Q-25 — qoldiq SHU FILIALDA sanaladi.
            */
           COALESCE((SELECT SUM(b.eni_m * b.boyi_m) FROM bolak b
                     WHERE b.material_id = m.id
                       AND b.filial_id = ${filialId}
                       AND b.holat = 'BOSH'
                       AND b.faol = true), 0)::float8 AS "boshKvM",
           /*
            * ⚠️ Eng keng bo'lak — sotuvchi «bundan keng kesib
            *    bo'lmaydi» degan chegarani ko'rib tursin. Aks holda
            *    3 m so'rab, keyin «materialga kutmoqda» ga tushardi.
            */
           COALESCE((SELECT MAX(b.eni_m) FROM bolak b
                     WHERE b.material_id = m.id
                       AND b.filial_id = ${filialId}
                       AND b.holat = 'BOSH'
                       AND b.faol = true), 0)::float8 AS "engKengM"
    FROM material m
    LEFT JOIN material_filial_narx fn
           ON fn.material_id = m.id AND fn.filial_id = ${filialId}
    WHERE m.faol = true AND m.togridan_sotiladi = true
    ORDER BY m.nom`;

  return qatorlar.map((q) => ({
    ...q,
    turNarxlari: turNarxBoyicha.get(q.id) ?? {},
  }));
}

/**
 * Materialni o'zi sotish narx qoidalari — egasi qarori 2026-09-20.
 *
 * ⚠️ `mahsulot_tur_id IS NULL` qatorlari: mato metrlab sotilganda
 *    mahsulot turi yo'q, narx esa baribir kerak.
 *
 * ⚠️ FILIAL bo'yicha tanlanadi (TZ 20.9), mijoz turi esa ekranda
 *    hal bo'ladi — mijoz sotuv paytida tanlanadi va serverga
 *    qayta borish shart emas.
 */
export interface MaterialNarxQoidasi {
  readonly narxGuruhId: number;
  readonly mijozTuriId: number | null;
  /** TZ 20.9 — `null` bo'lsa hamma filialga */
  readonly filialId: number | null;
  readonly hisoblashUsuli: string;
  readonly bosqichlar: readonly {
    readonly dan: number;
    readonly gacha: number | null;
    readonly narx: string;
    readonly valyuta: string;
  }[];
}

export async function materialNarxQoidalari(
  filialId: number,
): Promise<MaterialNarxQoidasi[]> {
  const sql = ulanishOl();

  /*
   * ⚠️ `hamma_turga = false` SHART — 0055.
   *
   *    Bu yerda «MATERIALNI O'ZI SOTISH» qoidalari olinadi va
   *    ular `mahsulot_tur_id IS NULL` bilan belgilanadi. 0055 da
   *    DARAJAGA umumiy narx qo'shildi va u ham turi NULL qator.
   *    Shartsiz qoldirilsa darajaga qo'yilgan tayyor jalyuzi narxi
   *    metrlab sotishga SIZIB o'tardi: mijoz matoni metrlab olsa,
   *    tayyor parda narxida hisoblanardi.
   */
  const qoidalar = await sql<
    {
      id: number;
      narxGuruhId: number;
      mijozTuriId: number | null;
      filialId: number | null;
      hisoblashUsuli: string;
    }[]
  >`
    SELECT id, narx_guruh_id AS "narxGuruhId", mijoz_turi_id AS "mijozTuriId",
           filial_id AS "filialId", hisoblash_usuli AS "hisoblashUsuli"
    FROM mahsulot_narx
    WHERE mahsulot_tur_id IS NULL AND hamma_turga = false AND faol = true
      AND (filial_id IS NULL OR filial_id = ${filialId})
    ORDER BY narx_guruh_id, (filial_id IS NULL)`;

  if (qoidalar.length === 0) return [];

  const bosqichlar = await sql<
    {
      mahsulotNarxId: number;
      dan: string;
      gacha: string | null;
      narx: string;
      valyuta: string;
    }[]
  >`
    SELECT mahsulot_narx_id AS "mahsulotNarxId", dan::text, gacha::text,
           narx::text, valyuta
    FROM mahsulot_narx_bosqich
    WHERE mahsulot_narx_id = ANY(${qoidalar.map((q) => q.id)}) AND faol = true
    ORDER BY dan`;

  return qoidalar.map((q) => ({
    filialId: q.filialId,
    narxGuruhId: q.narxGuruhId,
    mijozTuriId: q.mijozTuriId,
    hisoblashUsuli: q.hisoblashUsuli,
    bosqichlar: bosqichlar
      .filter((b) => b.mahsulotNarxId === q.id)
      .map((b) => ({
        dan: Number(b.dan),
        gacha: b.gacha === null ? null : Number(b.gacha),
        narx: b.narx,
        valyuta: b.valyuta,
      })),
  }));
}
