/**
 * lib/db/namuna-narx.ts — NAMUNA ZANJIR (egasi so'rovi 2026-09-23)
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 *    Egasi: «men birorta bunday hisoblangan narsani ko'rmadim —
 *    mahsulot qo'shdim, tur yig'dim… sen bazaga test ma'lumotlar
 *    qo'sha olasanmi, o'zing mahsulot qo'shib, tur yaratib,
 *    buyurtmani qo'shib».
 *
 *    Sababi topilgan edi: uning turidagi uchala slot ham MATOSI
 *    YO'Q guruhga ulangan va shu sababdan sotuv ekrani hech qachon
 *    narx ko'rsatmagan.
 *
 *    Bu skript BUTUN ZANJIRNI ishlab ko'rsatadi: tur → o'rnatish
 *    qoidasi → daraja narxi → buyurtma → kesim → narx.
 *
 * ⚠️ HAMMA YOZUV «NAMUNA» BILAN NOMLANADI va `npm run db:namuna-ochir`
 *    bilan butunlay o'chiriladi. Egasining o'z ma'lumotiga TEGILMAYDI:
 *    faqat YANGI qatorlar qo'shiladi, mavjudlari o'zgartirilmaydi.
 *
 * ⚠️ MAVJUD MATERIAL ISHLATILADI. Yangi mato o'ylab topilmaydi —
 *    egasining omboridagi haqiqiy mato olinadi, aks holda namuna
 *    haqiqatdan uzoq bo'lardi.
 */

import { ulanishOl } from '@/lib/db';
import { mahsulotTuriYarat } from '@/lib/amal/konstruktor';
import { turNarxiniSaqla } from '@/lib/amal/narx-qoida';
import { buyurtmaYarat } from '@/lib/amal/buyurtma';
import { turTafsili } from '@/lib/amal/katalog';
import { tayyorOlcham, standartOrnatish } from '@/lib/domain/olcham-qoidasi';
import { kesimOlchami } from '@/lib/domain/kesish';
import { slotSarfi, standartQiymatlar } from '@/lib/domain/formula';
import { m } from '@/lib/domain/birlik';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';

const BELGI = 'NAMUNA';
const XODIM = 1;
const FILIAL = 1;

interface NamunaMato {
  readonly id: number;
  readonly nom: string;
  readonly material_id: number;
  readonly material_nom: string;
  readonly daraja_id: number;
  readonly daraja: string | null;
}

/**
 * Bo'sh bazada namuna uchun guruh + daraja + mato + rulon yaratadi.
 *
 * ⚠️ FAQAT mos mato TOPILMAGANDA chaqiriladi. Egasining
 *    bazasida bu kod ishlamaydi — u yerda haqiqiy mato bor.
 */
async function namunaMatoYarat(sql: ReturnType<typeof ulanishOl>): Promise<NamunaMato> {
  /*
   * ⚠️ QAYTA ISHLATISHGA CHIDAMLI. Skript bir necha marta
   *    yuritilishi mumkin (birinchisi yarim yo'lda yiqilsa ham),
   *    shuning uchun mavjud NAMUNA yozuvi bo'lsa qayta
   *    yaratilmaydi — nom bo'yicha noyoblik indeksi bor.
   */
  const guruh =
    (
      await sql<{ id: number; nom: string }[]>`
        SELECT id, nom FROM almashtirish_guruh
         WHERE nom = ${`${BELGI} mato guruhi`} LIMIT 1`
    )[0] ??
    (
      await sql<{ id: number; nom: string }[]>`
        INSERT INTO almashtirish_guruh (nom, yaratdi_id)
        VALUES (${`${BELGI} mato guruhi`}, ${XODIM}) RETURNING id, nom`
    )[0];

  const daraja =
    (
      await sql<{ id: number; nom: string }[]>`
        SELECT id, nom FROM narx_guruh WHERE nom = ${`${BELGI} daraja`} LIMIT 1`
    )[0] ??
    (
      await sql<{ id: number; nom: string }[]>`
        INSERT INTO narx_guruh (nom, yaratdi_id)
        VALUES (${`${BELGI} daraja`}, ${XODIM}) RETURNING id, nom`
    )[0];

  if (guruh === undefined || daraja === undefined) {
    throw new Error('Namuna guruh yaratilmadi');
  }

  const mato =
    (
      await sql<{ id: number; nom: string }[]>`
        SELECT id, nom FROM material WHERE nom = ${`${BELGI} dikkey mato`} LIMIT 1`
    )[0] ??
    (
      await sql<{ id: number; nom: string }[]>`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                              almashtirish_guruh_id, narx_guruh_id,
                              odatdagi_rulon_boyi_m, yaratdi_id)
        VALUES (${`${BELGI} dikkey mato`}, 'RULON', 'rulon', 'KV_M',
                ${guruh.id}, ${daraja.id}, 100.00, ${XODIM})
        RETURNING id, nom`
    )[0];
  if (mato === undefined) throw new Error('Namuna mato yaratilmadi');

  /** ⚠️ Rulon YUQORIDA qo'yiladi — ikki joyda bo'lmasin */

  console.log(`⚠ Mos mato topilmadi — namuna mato yaratildi: «${mato.nom}»`);

  return {
    id: guruh.id,
    nom: guruh.nom,
    material_id: mato.id,
    material_nom: mato.nom,
    daraja_id: daraja.id,
    daraja: daraja.nom,
  };
}

export async function namunaYarat(): Promise<void> {
  const sql = ulanishOl();

  // ─── 1. Matosi BOR guruhni topamiz ────────────────────────────────────
  /**
   * ⚠️ Guruhda mato BO'LISHI SHART — egasining turi aynan shu
   *    sababdan ishlamagan edi. Shuning uchun guruh nomi bo'yicha
   *    emas, MATERIAL soniga qarab tanlanadi.
   */
  const guruhlar = await sql<
    NamunaMato[]
  >`
    SELECT g.id, g.nom, m.id AS material_id, m.nom AS material_nom,
           m.narx_guruh_id AS daraja_id, ng.nom AS daraja
      FROM almashtirish_guruh g
      JOIN material m ON m.almashtirish_guruh_id = g.id AND m.faol
      LEFT JOIN narx_guruh ng ON ng.id = m.narx_guruh_id
     WHERE g.faol AND m.sarflash_birligi = 'KV_M'
       /*
        * ⚠️ DARAJASI BOR mato SHART — darajasiz matodan narx
        *    topilmaydi va namuna aynan narxni ko'rsatish uchun.
        */
       AND m.narx_guruh_id IS NOT NULL
     /*
      * ⚠️ OMBORDA BO'LAGI BORI birinchi turadi — shunda
      *    buyurtma ombordan haqiqatan band qiladi va zanjir
      *    oxirigacha ko'rinadi.
      */
     ORDER BY (SELECT count(*) FROM bolak b
                WHERE b.material_id = m.id AND b.holat = 'BOSH') DESC,
              g.id
     LIMIT 1`;

  /*
   * ⚠️ MOS MATO BO'LMASA O'ZIMIZ YARATAMIZ.
   *
   *    Bo'sh bazada (yangi filial, sinov bazasi) skript ishlamay
   *    qolsa undan foyda yo'q — namuna aynan «hech narsa
   *    ko'rmadim» degan holat uchun yozilgan.
   *
   *    Egasining bazasida esa bu shart ishlamaydi: u yerda darajasi
   *    bor haqiqiy mato bor va o'sha olinadi.
   */
  const g = guruhlar[0] ?? (await namunaMatoYarat(sql));

  console.log(`Mato:   «${g.material_nom}» · guruh «${g.nom}» · daraja «${g.daraja ?? '?'}»`);

  /*
   * ── OMBOR ─────────────────────────────────────────────
   *
   * ⚠️ EGASINING HAQIQIY MATOSIGA RULON QO'SHILMAYDI. Omborga
   *    yo'q mato qo'yish — qoldiqni, tannarxni va butun ombor
   *    hisobotini buzish degani. Faqat NAMUNA matosiga qo'yiladi.
   *
   * ⚠️ Egasining matosida bo'lak bo'lmasa buyurtma
   *    «MATERIALGA_KUTMOQDA» bo'lib qoladi — bu XATO emas, tizim
   *    to'g'ri ishlayapti. Ekranda shunday deb aytiladi.
   */
  const namunaMatosimi = g.material_nom.startsWith(BELGI);
  const qoldiq = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM bolak
     WHERE material_id = ${g.material_id} AND holat = 'BOSH' AND faol = true`;
  const bolakBor = (qoldiq[0]?.n ?? 0) > 0;

  if (!bolakBor && namunaMatosimi) {
    await sql`
      INSERT INTO bolak (material_id, kod, turi, holat, eni_m, boyi_m,
                         tannarx_birlik_snapshot, filial_id, yaratdi_id)
      VALUES (${g.material_id}, ${`${BELGI}-R-${String(Date.now()).slice(-6)}`},
              'RULON', 'BOSH', 0.40, 100.00, 60000, ${FILIAL}, ${XODIM})`;
    console.log('Ombor:  namuna rulon qo’shildi — 0.40 × 100.00 m');
  } else if (!bolakBor) {
    console.log(`Ombor:  ⚠ «${g.material_nom}» da bo'sh bo'lak yo'q — buyurtma`);
    console.log('        material kutadigan holatda qoladi (bu to’g’ri xulq).');
    console.log("        Egasining omboriga NAMUNA rulon QO'SHILMAYDI.");
  }

  // ─── 2. Tur ───────────────────────────────────────────────────────────
  const tur = await mahsulotTuriYarat(
    sql,
    {
      nom: `${BELGI} — sinov pardasi`,
      xizmatHaqi: '30000',
      tartib: '99',
      oynadaKorinadi: true,
      botdaKorinadi: true,
      slotlar: [
        {
          nom: 'Mato',
          formula: 'MAYDON',
          majburiy: true,
          almashtirishGuruhId: g.id,
          koeffitsient: 1,
          kesishTuri: 'ENIGA',
          /**
           * ⚠️ QAT'IY KESIM ENI — dikkey lameli rulonda 0.40 m
           *    enli keladi va usta uni eniga kesa olmaydi. Kesim
           *    «0.40 × N metr» bo'lib chiqadi.
           */
          kesimEniM: 0.4,
          narxBelgilaydi: true,
        },
      ],
      parametrlar: [],
      aksessuarlar: [],
      /** 0053 — oyna o'lchamidan tayyor o'lchamga */
      ornatishlar: [
        { nom: 'Oyna ustiga', eniQoshimchaM: 0.1, boyiQoshimchaM: 0.15, standartmi: true },
        { nom: 'Proyomga', eniQoshimchaM: -0.01, boyiQoshimchaM: -0.01, standartmi: false },
      ],
      minEniM: 0.3,
      maksEniM: 3.0,
      minBoyiM: 0.3,
      maksBoyiM: 3.5,
    },
    XODIM,
    null,
  );

  if (tur.holat !== 'SAQLANDI') {
    throw new Error(`Tur saqlanmadi: ${tur.xabarlar.join('; ')}`);
  }
  console.log(`Tur:    #${String(tur.id)} «${BELGI} — sinov pardasi»`);

  // ─── 3. NARX — FAQAT NAMUNA TURIGA ────────────────────────────────────
  /*
   * ⚠️ NARX TURGA QO'YILADI, DARAJAGA EMAS — ataylab.
   *
   *    Darajaga qo'yilsa u egasining BUTUN narx jadvaliga tegardi:
   *    pastdagi 150/130/110 ming raqamlari MENING o'ylab topganim,
   *    egasining narxi emas. Ularni uning jonli narx jadvaliga
   *    yozish — mijozga yolg'on narx aytish xavfi.
   *
   *    Turga qo'yilgani esa namuna bilan birga o'chib ketadi va
   *    egasining hech narsasiga tegmaydi.
   *
   * ⚠️ Darajaga umumiy narxni (0055) egasi O'ZI qo'yadi:
   *    `/narx?tur=daraja` — uch qator, hamma turga yetadi.
   */
  const narx = await sql.begin(async (tx) =>
    turNarxiniSaqla(
      tx,
      {
        mahsulotTurId: tur.id,
        hammaTurga: false,
        qoidalar: [
          {
            narxGuruhId: g.daraja_id,
            mijozTuriId: null,
            filialId: null,
            hisoblashUsuli: 'MAYDON',
            bosqichlar: [
              { dan: 0, gacha: 1, narx: '150000', valyuta: 'SOM' },
              { dan: 1, gacha: 3, narx: '130000', valyuta: 'SOM' },
              { dan: 3, gacha: null, narx: '110000', valyuta: 'SOM' },
            ],
          },
        ],
        qoshimchalar: [],
      },
      XODIM,
    ),
  );
  if (narx.holat !== 'SAQLANDI') {
    throw new Error(`Narx saqlanmadi: ${JSON.stringify(narx)}`);
  }
  console.log(`Narx:   NAMUNA turiga, «${g.daraja ?? '?'}» darajasi uchun — 3 bosqich`);
  console.log('        ✓ sizning narx jadvalingizga TEGILMADI');

  // ─── 4. HISOBNI KO'RSATAMIZ ───────────────────────────────────────────
  const t = await turTafsili(tur.id, FILIAL, sql);
  if (t === null) throw new Error('Tur katalogdan topilmadi');

  const oyna = { eniM: 1.5, boyiM: 2.0 };
  const ornatish = standartOrnatish(t.ornatishlar);
  const tayyor = tayyorOlcham(oyna, ornatish);

  const slot = t.slotlar[0];
  if (slot === undefined) throw new Error("Slot yo'q");

  const qiymatlar = standartQiymatlar(m(tayyor.eniM), m(tayyor.boyiM), 1, {});
  const sarf = slotSarfi(slot.formula, qiymatlar, 'KV_M', slot.koeffitsient);
  const kesim = kesimOlchami(sarf, tayyor.boyiM, {
    koeffitsient: slot.koeffitsient,
    yonalish: slot.kesishTuri === "BO'YIGA" ? "BO'YIGA" : 'ENIGA',
    soni: 1,
    kesimEniM: slot.kesimEniM,
  });

  const qoida = t.narxQoidalari[0];
  const hisob = pozitsiyaNarxiniHisobla({
    eniM: tayyor.eniM,
    boyiM: tayyor.boyiM,
    soni: 1,
    parametrlar: {},
    slotlar: [],
    aksessuarlar: [],
    qoida:
      qoida === undefined
        ? null
        : {
            hisoblashUsuli: qoida.hisoblashUsuli as 'MAYDON',
            bosqichlar: qoida.bosqichlar,
          },
    qoshimchalar: [],
    xizmatHaqi: t.xizmatHaqi ?? '0',
    offset: null,
    kurs: null,
  });

  console.log('');
  console.log('─── ZANJIR ───');
  console.log(`  Oyna o'lchami   : ${oyna.eniM.toFixed(2)} × ${oyna.boyiM.toFixed(2)} m`);
  console.log(`  O'rnatish       : ${ornatish?.nom ?? '—'}`);
  console.log(`  Tayyor o'lcham  : ${tayyor.eniM.toFixed(2)} × ${tayyor.boyiM.toFixed(2)} m`);
  console.log(`  Mato sarfi      : ${String(sarf)} kv.m`);
  console.log(`  KESIM           : ${kesim.eniM.toFixed(2)} × ${kesim.boyiM.toFixed(2)} m`);
  console.log(`  Narx bosqichi   : ${hisob.bosqich?.narx ?? '—'} so'm / kv.m`);
  console.log(`  JAMI            : ${hisob.jami ?? hisob.xato ?? '—'} so'm`);
  console.log('');

  if (hisob.jami === null) {
    throw new Error(`Narx chiqmadi: ${hisob.xato ?? '?'}`);
  }

  // ─── 5. BUYURTMA ──────────────────────────────────────────────────────
  const raqam = `${BELGI}-${String(Date.now()).slice(-6)}`;
  /**
   * ⚠️ `buyurtmaYarat` O'ZI tranzaksiya ochadi — tashqaridan
   *    `begin` bilan o'ralmaydi (tur `postgres.Sql` kutadi).
   */
  const b = await buyurtmaYarat(
      sql,
      {
        raqam,
        mijozId: null,
        sotganFilialId: FILIAL,
        ishlabChiqaruvchiFilialId: FILIAL,
        manba: 'SAYT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: false,
        pozitsiyalar: [
          {
            mahsulotTurId: tur.id,
            eniM: tayyor.eniM,
            boyiM: tayyor.boyiM,
            soni: 1,
            narxSnapshot: hisob.jami,
            chegirmaSumma: '0',
            xizmatHaqi: t.xizmatHaqi ?? '0',
            yorliq: 'Zal — katta oyna',
            izoh: 'Namuna buyurtma',
            oynaEniM: oyna.eniM,
            oynaBoyiM: oyna.boyiM,
            ornatishId: ornatish?.id ?? null,
            ornatishNom: ornatish?.nom ?? null,
            ornatishEniM: ornatish?.eniQoshimchaM ?? null,
            ornatishBoyiM: ornatish?.boyiQoshimchaM ?? null,
            olchamQolda: false,
            formulaSnapshot: { tur: `${BELGI} — sinov pardasi`, slot: slot.formula },
            slotlar: [
              {
                slotId: slot.id,
                materialId: g.material_id,
                hisoblanganMiqdor: String(sarf),
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '0',
                kerak: kesim,
              },
            ],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
  );

  console.log(`Buyurtma: ${raqam} · #${String(b.buyurtmaId)}`);
  console.log(`  holat: ${b.pozitsiyalar[0]?.holat ?? '?'}`);
  console.log(
    b.materialYetishmadi
      ? '  ⚠ material yetishmadi — ombordagi bo’lak mos kelmadi'
      : '  ✓ ombordan bo’lak band qilindi',
  );
  console.log('');
  console.log(`Saytda ko'rish: /buyurtma/${String(b.buyurtmaId)}`);
}
