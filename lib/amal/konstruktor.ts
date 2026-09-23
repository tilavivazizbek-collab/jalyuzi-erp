/**
 * lib/amal/konstruktor.ts — TZ 4 · 2.1-invariant · TZ 2.4
 *
 * Mahsulot turi TO'RT jadvalga yoziladi: `mahsulot_tur`, `mahsulot_slot`,
 * `mahsulot_parametr`, `mahsulot_aksessuar`.
 *
 * Hammasi BITTA TRANZAKSIYADA — yarim saqlangan mahsulot turi sotuvda
 * ishlamaydi va uni tuzatish qiyin (2.1-invariant).
 */

import type postgres from 'postgres';
import { konstruktorTekshir, type MahsulotTuri } from '@/lib/domain/konstruktor';
import type { MahsulotTurKirimi } from '@/lib/sxema/konstruktor';
import type { RasmNatijasi } from '@/lib/domain/rasm';
import { ornatishNuqsonlari } from '@/lib/domain/olcham-qoidasi';
import { BiznesXato } from '@/lib/xato';

export type KonstruktorNatijasi =
  | { readonly holat: 'SAQLANDI'; readonly id: number }
  | { readonly holat: 'NUQSON'; readonly xabarlar: readonly string[] };

/** Sxema tekshiruvidan o'tgan kirimni domen tekshiruviga beradi (TZ 4.5). */
function domenTekshiruvi(kirim: MahsulotTurKirimi): readonly string[] {
  const tur: MahsulotTuri = {
    id: 0,
    nom: kirim.nom,
    /**
     * ⚠️ TANLOV KODLARI HAM PARAMETR — 0052.
     *
     *    Formula tekshiruvi «noma'lum nom» xatosini beradi, agar
     *    formulada ishlatilgan nom parametrlar ro'yxatida bo'lmasa.
     *    Tanlov kodi ham formulada ishlatiladi
     *    (`CEIL(ENI / LAMEL_ENI)`), shuning uchun u ham SHU
     *    ro'yxatga tushishi kerak.
     *
     *    Ulanmasa 3-daraja (tanlov formulaga son beradi) butunlay
     *    ishlamasdi: tur SAQLANMASDI. Uchidan-uchiga tekshiruvda
     *    aynan shu chiqdi (2026-09-23).
     *
     * ⚠️ Qiymat sifatida BIRINCHI variantning soni olinadi: tekshiruv
     *    faqat «nom ma'lummi» degan savolga javob beradi, hisobning
     *    o'zi sotuvda tanlangan variant bilan bo'ladi.
     */
    parametrlar: [
      ...kirim.parametrlar.map((p) => ({
        nom: p.kod,
        qiymat: Number(p.standartQiymat),
      })),
      ...(kirim.tanlovlar ?? [])
        .filter((t) => t.kod !== null)
        .map((t) => ({
          nom: t.kod ?? '',
          qiymat: t.variantlar.find((v) => v.qiymat !== null && v.qiymat !== undefined)?.qiymat ?? 0,
        })),
    ],
    slotlar: kirim.slotlar.map((s, i) => ({
      id: i + 1,
      nom: s.nom,
      formula: s.formula,
      majburiy: s.majburiy,
      tartib: i,
      almashtirishGuruhId: s.almashtirishGuruhId,
    })),
    komplekt: kirim.aksessuarlar.map((a) => ({
      materialId: a.materialId,
      nom: `Aksessuar #${String(a.materialId)}`,
      formula: a.formula,
      majburiy: a.majburiy,
    })),
    xizmatHaqiSoni: kirim.xizmatHaqi === undefined ? null : Number(kirim.xizmatHaqi),
    faol: true,
  };

  /**
   * ⚠️ O'RNATISH TURLARI HAM SHU YERDA TEKSHIRILADI — 0053.
   *
   *    Bazada ham UNIQUE indeks bor (§9.4 — server qayta
   *    tekshiradi), lekin u «duplicate key value violates unique
   *    constraint» deb chiqadi va egasi undan hech narsa
   *    tushunmaydi. Bu yerdagisi tushunarli jumla beradi.
   */
  const ornatishXatolari = ornatishNuqsonlari(
    (kirim.ornatishlar ?? []).map((o, i) => ({
      id: i,
      nom: o.nom,
      eniQoshimchaM: o.eniQoshimchaM,
      boyiQoshimchaM: o.boyiQoshimchaM,
      standartmi: o.standartmi ?? false,
    })),
  );

  return [
    ...ornatishXatolari,
    ...konstruktorTekshir(tur).nuqsonlar.map((n) => {
    switch (n.tur) {
      case 'SLOT_YOQ':
        return "Kamida bitta mato sloti bo'lishi kerak — matosiz tur sotuvda ishlamaydi";
      case 'SLOT_GURUHSIZ':
        return `«${n.nom}» slotiga almashtirish guruhi tanlanmagan — sotuvda bo'sh ro'yxat chiqadi`;
      case 'NOM_TAKRORLANGAN':
        return `«${n.nom}» nomli slot ikki marta yozilgan`;
      case 'PARAMETR_TAKRORLANGAN':
        return `«${n.nom}» parametri ikki marta yozilgan`;
      case 'NOMALUM_PARAMETR':
        return `«${n.slot}» formulasida noma'lum nom: ${n.nomlar.join(', ')}`;
      case 'FORMULA_XATO':
        return `«${n.slot}» formulasida xato: ${n.xato}`;
      case 'KOMPLEKT_QATORI_BOSH':
        return `«${n.nom}» qatorida soni yoki formula yozilmagan`;
    }
    }),
  ];
}

async function bolaklarniYoz(
  tx: postgres.TransactionSql,
  turId: number,
  kirim: MahsulotTurKirimi,
  xodimId: number,
): Promise<void> {
  // 2.1-invariant — eski qatorlar O'CHIRILMAYDI, nofaol qilinadi.
  // Ular eski buyurtmalarning snapshotida havola bo'lib qolishi mumkin (4.10).
  await tx`UPDATE mahsulot_slot SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now() WHERE mahsulot_tur_id = ${turId} AND faol = true`;
  await tx`UPDATE mahsulot_parametr SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now() WHERE mahsulot_tur_id = ${turId} AND faol = true`;
  await tx`UPDATE mahsulot_aksessuar SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now() WHERE mahsulot_tur_id = ${turId} AND faol = true`;

  /**
   * ⚠️ TANLOVLAR HAM NOFAOL QILINADI, o'chirilmaydi (0052).
   *
   *    `pozitsiya_tanlov` ularga havola qiladi: eski buyurtmada
   *    qaysi variant tanlangani ko'rinib turishi kerak. O'chirilsa
   *    tashqi kalit yiqilardi.
   *
   * ⚠️ Variantlar TANLOV ORQALI nofaol qilinadi — alohida so'rov
   *    bilan emas: tanlov nofaol bo'lsa uning variantlari ham
   *    ishlatilmaydi va ikkita so'rov bir-biridan ayrilib qolishi
   *    mumkin edi.
   */
  await tx`
    UPDATE mahsulot_tanlov_variant SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now()
     WHERE faol = true
       AND tanlov_id IN (SELECT id FROM mahsulot_tanlov
                          WHERE mahsulot_tur_id = ${turId} AND faol = true)`;
  await tx`UPDATE mahsulot_tanlov SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now() WHERE mahsulot_tur_id = ${turId} AND faol = true`;

  /**
   * ⚠️ O'RNATISH TURLARI HAM NOFAOL QILINADI, o'chirilmaydi (0053).
   *
   *    `buyurtma_pozitsiya.ornatish_id` ularga havola qiladi: eski
   *    buyurtmada tayyor o'lcham QAYSI QOIDA bilan chiqqani
   *    ko'rinib turishi kerak. O'chirilsa tashqi kalit yiqilardi.
   *
   * ⚠️ `ochirildi` ham qo'yiladi: `standartmi` ustidagi UNIQUE
   *    indeks `faol` ga qaraydi, ya'ni nofaol qator yangi
   *    standartga xalaqit qilmaydi.
   */
  await tx`UPDATE mahsulot_ornatish SET faol = false, ochirildi = now(),
           ozgartirdi_id = ${xodimId}, ozgartirildi = now()
           WHERE mahsulot_tur_id = ${turId} AND faol = true`;

  /**
   * ⚠️ TANLOVLAR AKSESSUARLARDAN OLDIN yoziladi: aksessuar
   *    `variant_id` orqali variantga havola qilishi mumkin va
   *    variant hali yozilmagan bo'lsa tashqi kalit yiqilardi.
   *
   * ⚠️ Ekrandagi TARTIB raqami variant `id` siga aylantiriladi:
   *    yangi tur saqlanayotganda hali `id` yo'q, shuning uchun
   *    forma tartib bo'yicha havola qiladi.
   */
  const variantIdlari = new Map<string, number>();

  for (const [ti, t] of (kirim.tanlovlar ?? []).entries()) {
    const tq = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_tanlov (mahsulot_tur_id, kod, nom, majburiy, tartib,
                                   yaratdi_id)
      VALUES (${turId}, ${t.kod}, ${t.nom}, ${t.majburiy}, ${ti}, ${xodimId})
      RETURNING id`;

    const tanlovId = tq[0]?.id;
    if (tanlovId === undefined) throw new BiznesXato('MAHSULOT_SAQLANMADI', 'tanlov');

    for (const [vi, v] of t.variantlar.entries()) {
      const vq = await tx<{ id: number }[]>`
        INSERT INTO mahsulot_tanlov_variant (tanlov_id, nom, qiymat, narx, valyuta,
                                             tartib, yaratdi_id)
        VALUES (${tanlovId}, ${v.nom}, ${v.qiymat ?? null}, ${v.narx ?? null},
                ${v.valyuta}, ${vi}, ${xodimId})
        RETURNING id`;

      const variantId = vq[0]?.id;
      if (variantId === undefined) throw new BiznesXato('MAHSULOT_SAQLANMADI', 'variant');
      variantIdlari.set(`${String(ti)}:${String(vi)}`, variantId);
    }
  }

  /**
   * ⚠️ STANDART BITTA bo'lishi BAZADA ham to'siladi (unique
   *    indeks). Bu yerda esa forma ikkita standart yuborgan
   *    bo'lsa — birinchisi olinadi va qolganlari tushiriladi:
   *    domen tekshiruvi buni allaqachon nuqson deb qaytargan,
   *    demak bu yerga kelishning o'zi bo'lmasligi kerak. Shunga
   *    qaramay himoya turadi — baza xatosi bilan yiqilgandan
   *    ko'ra tushunarli xabar yaxshi.
   */
  let standartBerildi = false;
  for (const [i, o] of (kirim.ornatishlar ?? []).entries()) {
    const standart = (o.standartmi ?? false) && !standartBerildi;
    if (standart) standartBerildi = true;
    await tx`
      INSERT INTO mahsulot_ornatish (mahsulot_tur_id, nom, eni_qoshimcha_m,
                                     boyi_qoshimcha_m, standartmi, tartib,
                                     yaratdi_id)
      VALUES (${turId}, ${o.nom}, ${o.eniQoshimchaM}, ${o.boyiQoshimchaM},
              ${standart}, ${i}, ${xodimId})`;
  }

  for (const [i, s] of kirim.slotlar.entries()) {
    await tx`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, majburiy,
                                 almashtirish_guruh_id, formula,
                                 koeffitsient, kesish_turi, kesim_eni_m,
                                 narx_belgilaydi, yaratdi_id)
      VALUES (${turId}, ${s.nom}, ${i}, ${s.majburiy},
              ${s.almashtirishGuruhId}, ${s.formula},
              ${s.koeffitsient}, ${s.kesishTuri}, ${s.kesimEniM},
              ${s.narxBelgilaydi ?? false}, ${xodimId})`;
  }

  for (const p of kirim.parametrlar) {
    // Kod bo'yicha UNIQUE — nofaol qilingan eski qator tirilib qayta to'ladi
    await tx`
      INSERT INTO mahsulot_parametr (mahsulot_tur_id, kod, nom, standart_qiymat, yaratdi_id)
      VALUES (${turId}, ${p.kod}, ${p.nom}, ${p.standartQiymat}, ${xodimId})
      ON CONFLICT (mahsulot_tur_id, kod) DO UPDATE
        SET nom = EXCLUDED.nom, standart_qiymat = EXCLUDED.standart_qiymat,
            faol = true, ozgartirildi = now(), ozgartirdi_id = ${xodimId}`;
  }

  for (const a of kirim.aksessuarlar) {
    await tx`
      INSERT INTO mahsulot_aksessuar (mahsulot_tur_id, material_id, formula,
                                      majburiy, yaratdi_id)
      VALUES (${turId}, ${a.materialId}, ${a.formula}, ${a.majburiy}, ${xodimId})
      ON CONFLICT (mahsulot_tur_id, material_id) DO UPDATE
        SET formula = EXCLUDED.formula, majburiy = EXCLUDED.majburiy,
            faol = true, ozgartirildi = now(), ozgartirdi_id = ${xodimId}`;
  }
}

/**
 * BO'SH GURUHLI SLOT — egasi qarori 2026-09-23 («butunlay to'xtatsin»).
 *
 * ⚠️ NEGA BU TEKSHIRUV BOR
 *
 *    Egasining turi uchta slotdan iborat edi va UCHALASI HAM matosi
 *    yo'q guruhga ulangan edi. Natijada sotuv ekranida mato ro'yxati
 *    bo'sh chiqar, daraja topilmas va ekran «matoga daraja
 *    qo'yilmagan» deb NOTO'G'RI aybdorni ko'rsatardi. Egasi
 *    materialga daraja qo'yishga ketar, u yerda esa hammasi joyida
 *    bo'lardi.
 *
 *    Tekshiruv faqat «guruh tanlanmagan» ni ushlardi, «guruhda mato
 *    yo'q» ni ushlamasdi — ya'ni sotilmaydigan turni saqlashga
 *    ruxsat berardi.
 *
 * ⚠️ DOMENDA EMAS, SHU YERDA: material sonini bilish uchun
 *    bazaga qarash kerak, domen esa bazaga tegmaydi.
 */
async function boshGuruhlar(
  ulanish: postgres.Sql,
  kirim: MahsulotTurKirimi,
): Promise<readonly string[]> {
  const idlar = [
    ...new Set(
      kirim.slotlar
        .map((x) => x.almashtirishGuruhId)
        .filter((x): x is number => x !== null),
    ),
  ];
  if (idlar.length === 0) return [];

  const qatorlar = await ulanish<{ id: number; nom: string; soni: number }[]>`
    SELECT g.id, g.nom,
           (SELECT count(*)::int FROM material m
             WHERE m.almashtirish_guruh_id = g.id AND m.faol) AS soni
      FROM almashtirish_guruh g
     WHERE g.id = ANY(${idlar})`;

  return qatorlar
    .filter((g) => g.soni === 0)
    .map(
      (g) =>
        `«${g.nom}» guruhida mato yo'q — sotuv ekranida ro'yxat bo'sh chiqadi ` +
        'va bu tur sotilmaydi. Avval guruhga material biriktiring.',
    );
}

/**
 * NARX BELGILOVCHI SLOT TANLANMAGAN — ogohlantirish emas, NUQSON.
 *
 * ⚠️ Bir nechta mato sloti bo'lsa va birortasi belgilanmagan
 *    bo'lsa, daraja «birinchi mato sloti» qoidasiga tushadi. Uch
 *    slotli turda bu TASODIFGA qolgan tanlov: slot tartibi
 *    o'zgarsa mijoz narxi jimgina o'zgaradi.
 *
 * ⚠️ Bitta slotli turda savol yo'q — tekshiruv ishlamaydi.
 */
function narxBelgilovchiNuqsoni(kirim: MahsulotTurKirimi): readonly string[] {
  const matoSlotlari = kirim.slotlar.filter((x) => x.almashtirishGuruhId !== null);
  if (matoSlotlari.length < 2) return [];
  if (matoSlotlari.some((x) => x.narxBelgilaydi === true)) return [];
  return [
    "Mijoz narxini qaysi slot belgilashi tanlanmagan — slotlardan birida " +
      "«narxni shu slot belgilaydi» ni yoqing. Aks holda daraja birinchi " +
      'mato slotidan olinadi va slot tartibi o’zgarsa narx ham o’zgaradi.',
  ];
}

export async function mahsulotTuriYarat(
  ulanish: postgres.Sql,
  kirim: MahsulotTurKirimi,
  xodimId: number,
  /** Katalog rasmi — TZ 4.2. `null` — yo'q, `'OCHIR'` — olib tashlash */
  rasm: RasmNatijasi | 'OCHIR' | null = null,
): Promise<KonstruktorNatijasi> {
  const xabarlar = [
    ...domenTekshiruvi(kirim),
    ...narxBelgilovchiNuqsoni(kirim),
    ...(await boshGuruhlar(ulanish, kirim)),
  ];
  if (xabarlar.length > 0) return { holat: 'NUQSON', xabarlar };

  return ulanish.begin(async (tx) => {
    const qator = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, xizmat_haqi, tartib, oynada_korinadi,
                                botda_korinadi,
                                min_eni_m, maks_eni_m, min_boyi_m, maks_boyi_m,
                                yaratdi_id)
      VALUES (${kirim.nom}, ${kirim.xizmatHaqi ?? '0'}, ${Number(kirim.tartib)},
              ${kirim.oynadaKorinadi}, ${kirim.botdaKorinadi},
              ${kirim.minEniM ?? null}, ${kirim.maksEniM ?? null},
              ${kirim.minBoyiM ?? null}, ${kirim.maksBoyiM ?? null},
              ${xodimId})
      RETURNING id`;

    const id = qator[0]?.id;

    /** ⚠️ Rasm AYNI tranzaksiyada — yarim saqlanmasin (2.1-invariant) */
    if (id !== undefined && rasm !== null && rasm !== 'OCHIR') {
      await tx`
        UPDATE mahsulot_tur SET rasm = ${rasm.baytlar}, rasm_turi = ${rasm.turi}
        WHERE id = ${id}`;
    }
    if (id === undefined) throw new BiznesXato('MAHSULOT_SAQLANMADI');

    await bolaklarniYoz(tx, id, kirim, xodimId);
    return { holat: 'SAQLANDI', id } as const;
  });
}

export async function mahsulotTuriTahrirla(
  ulanish: postgres.Sql,
  turId: number,
  kirim: MahsulotTurKirimi,
  xodimId: number,
  filialId: number,
  rasm: RasmNatijasi | 'OCHIR' | null = null,
): Promise<KonstruktorNatijasi> {
  /** ⚠️ TAHRIRDA HAM bir xil tekshiruv — aks holda sotilmaydigan
   *     turni saqlab bo'lmasdi, lekin ishlayotganini buzib bo'lardi */
  const xabarlar = [
    ...domenTekshiruvi(kirim),
    ...narxBelgilovchiNuqsoni(kirim),
    ...(await boshGuruhlar(ulanish, kirim)),
  ];
  if (xabarlar.length > 0) return { holat: 'NUQSON', xabarlar };

  return ulanish.begin(async (tx) => {
    const bor = await tx<{ nom: string }[]>`
      SELECT nom FROM mahsulot_tur WHERE id = ${turId} FOR UPDATE`;
    const eski = bor[0];
    if (eski === undefined) throw new BiznesXato('MAHSULOT_TOPILMADI', String(turId));

    await tx`
      UPDATE mahsulot_tur SET
        nom = ${kirim.nom},
        xizmat_haqi = ${kirim.xizmatHaqi ?? '0'},
        tartib = ${Number(kirim.tartib)},
        oynada_korinadi = ${kirim.oynadaKorinadi},
        botda_korinadi = ${kirim.botdaKorinadi},
        -- 0051 — o'lcham chegarasi; NULL degani «chegara yo'q»
        min_eni_m = ${kirim.minEniM ?? null}, maks_eni_m = ${kirim.maksEniM ?? null},
        min_boyi_m = ${kirim.minBoyiM ?? null}, maks_boyi_m = ${kirim.maksBoyiM ?? null},
        ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${turId}`;

    /** ⚠️ `OCHIR` — rasmni olib tashlash; `null` — tegilmaydi */
    if (rasm === 'OCHIR') {
      await tx`
        UPDATE mahsulot_tur SET rasm = NULL, rasm_turi = NULL WHERE id = ${turId}`;
    } else if (rasm !== null) {
      await tx`
        UPDATE mahsulot_tur SET rasm = ${rasm.baytlar}, rasm_turi = ${rasm.turi}
        WHERE id = ${turId}`;
    }

    await bolaklarniYoz(tx, turId, kirim, xodimId);

    // TZ 2.4 — «mahsulot turi tahriri» jurnalga tushadigan amallardan.
    // 4.10: eski buyurtmalar o'zgarmaydi, lekin O'ZGARISH FAKTI qolishi kerak.
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat)
      VALUES (${xodimId}, ${filialId}, 'MAHSULOT_TURI_TAHRIRLANDI', 'mahsulot_tur',
              ${turId}, ${tx.json({ nom: eski.nom })},
              ${tx.json({
                nom: kirim.nom,
                slotlar: kirim.slotlar.length,
                parametrlar: kirim.parametrlar.length,
                aksessuarlar: kirim.aksessuarlar.length,
              })})`;

    return { holat: 'SAQLANDI', id: turId } as const;
  });
}
