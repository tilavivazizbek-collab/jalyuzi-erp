/**
 * lib/db/dikkey-formula-tuzat.ts — BIR MARTALIK TUZATISH
 *
 * Egasi tasdig'i 2026-09-21. «Dikkey» turining ikki formulasi
 * mantiqan noto'g'ri edi va metrga o'tish ularni to'g'rilamadi —
 * migratsiya formula MATNIGA ataylab tegmaydi.
 *
 *   material dikkey  `MAYDON * 1`    →  CEIL(ENI / 0.10) * BO'YI * 0.40
 *   dikkey bigunok   `ENI * 0.001`   →  CEIL(ENI / 0.10)
 *
 * ⚠️ NEGA ESKISI NOTO'G'RI:
 *
 *    Vertikal jalyuzi lameli rulonda 0.40 m enli keladi, lekin
 *    pardada oldinga-orqaga tushib chiqqani uchun mahsulot enidan
 *    atigi 0.10 m joy egallaydi. Ya'ni 1 metr enli mahsulotga
 *    O'NTA lamel ketadi, har biri BO'YI uzunlikda.
 *
 *    Eski `MAYDON * 1` bu 1 × 2 m mahsulotga 2 kv.m deb yozardi.
 *    Haqiqiy sarf esa 10 × 2 = 20 metr rulon = 8 kv.m — TO'RT
 *    BAROBAR ko'p. Ombor har buyurtmada jimgina kamomad qilardi.
 *
 *    Eski `ENI * 0.001` esa har qanday enda 1 dona begunok berardi
 *    (2.1 × 0.001 = 0.0021 → CEIL → 1). Begunok soni lamel soniga
 *    TENG bo'lishi kerak.
 *
 * ⚠️ NEGA SONLAR FORMULADA, PARAMETR EMAS:
 *    Parametr sotuv ekranida HAR BUYURTMADA katak bo'lib chiqadi
 *    (`forma.tsx` parametrlarni shunday ko'rsatadi). Lamel eni esa
 *    o'zgarmas — sotuvchidan uni har safar so'rash faqat chalg'itadi.
 *    Ta'minotchi lamelni almashtirsa, formula konstruktorda bir
 *    marta tahrirlanadi.
 *
 * ⚠️ NEGA QO'LDA `UPDATE` EMAS:
 *    `mahsulotTuriTahrirla` eski slotlarni nofaol qilib yangisini
 *    yozadi (4.10, 2.1-invariant) va butun ishni bitta tranzaksiyada
 *    bajaradi. Qo'lda yozilgan SQL bu tarixni buzardi.
 *
 * Ishga tushirish:  npm run db:dikkey-tuzat
 * Ko'rib chiqish:   npm run db:dikkey-tuzat -- --korish
 */

import postgres from 'postgres';
import { mahsulotTuriTahrirla } from '@/lib/amal/konstruktor';
import type { MahsulotTurKirimi } from '@/lib/sxema/konstruktor';

/** Bitta lamel mahsulot enidan egallaydigan joy, metr */
const QADAM = '0.10';
/** Lamel rulonining eni, metr — kesim shu enda bo'ladi */
const LAMEL_ENI = '0.40';

const YANGI_FORMULA: Readonly<Record<string, string>> = {
  'material dikkey': `CEIL(ENI / ${QADAM}) * BO'YI * ${LAMEL_ENI}`,
  'dikkey bigunok': `CEIL(ENI / ${QADAM})`,
};

/** Kesim eni faqat MATO slotida qat'iy — rulon eni o'zgarmaydi */
const YANGI_KESIM_ENI: Readonly<Record<string, string | null>> = {
  'material dikkey': LAMEL_ENI,
};

interface SlotQatori {
  readonly id: number;
  readonly nom: string;
  readonly formula: string;
  readonly majburiy: boolean;
  readonly almashtirish_guruh_id: number | null;
  readonly koeffitsient: string;
  readonly kesish_turi: string;
  readonly kesim_eni_m: string | null;
}

async function asosiy(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (url === undefined || url === '') {
    console.error("DATABASE_URL yo'q");
    process.exit(1);
  }

  const faqatKorish = process.argv.includes('--korish');
  const sql = postgres(url, { max: 1, ssl: 'require' });

  try {
    const turlar = await sql<{ id: number; nom: string; xizmat_haqi: string | null;
      tartib: number; oynada_korinadi: boolean; botda_korinadi: boolean }[]>`
      SELECT id, nom, xizmat_haqi::text, tartib, oynada_korinadi, botda_korinadi
        FROM mahsulot_tur
       WHERE faol = true AND lower(nom) LIKE '%dikkey%'`;

    const tur = turlar[0];
    if (tur === undefined) {
      console.error("«dikkey» turi topilmadi — hech narsa o'zgartirilmadi.");
      process.exit(1);
    }
    if (turlar.length > 1) {
      console.error(`${String(turlar.length)} ta «dikkey» turi bor — qaysinisi ekani noaniq.`);
      console.error('Xavfsizlik uchun to\'xtatildi. Nomlarni aniqlashtiring.');
      process.exit(1);
    }

    const slotlar = await sql<SlotQatori[]>`
      SELECT id, nom, formula, majburiy, almashtirish_guruh_id,
             koeffitsient::text, kesish_turi, kesim_eni_m::text
        FROM mahsulot_slot
       WHERE mahsulot_tur_id = ${tur.id} AND faol = true
       ORDER BY tartib`;

    const parametrlar = await sql<{ kod: string; nom: string; standart_qiymat: string | null }[]>`
      SELECT kod, nom, standart_qiymat::text
        FROM mahsulot_parametr
       WHERE mahsulot_tur_id = ${tur.id} AND faol = true
       ORDER BY kod`;

    const aksessuarlar = await sql<{ material_id: number; formula: string; majburiy: boolean }[]>`
      SELECT material_id, formula, majburiy
        FROM mahsulot_aksessuar
       WHERE mahsulot_tur_id = ${tur.id} AND faol = true
       ORDER BY id`;

    console.log(`\nTur: ${tur.nom} (#${String(tur.id)})\n`);

    let ozgaradi = 0;
    for (const s of slotlar) {
      const yangi = YANGI_FORMULA[s.nom];
      const yangiEni = YANGI_KESIM_ENI[s.nom] ?? null;

      if (yangi === undefined) {
        console.log(`   ${s.nom}`);
        console.log(`     ${s.formula}   ← tegilmaydi\n`);
        continue;
      }

      ozgaradi += 1;
      console.log(`⚠️  ${s.nom}`);
      console.log(`     eski:  ${s.formula}`);
      console.log(`     yangi: ${yangi}`);
      if (yangiEni !== null) {
        console.log(`     kesim eni: ${s.kesim_eni_m ?? '—'} → ${yangiEni} m`);
      }
      console.log('');
    }

    if (ozgaradi === 0) {
      console.log("O'zgaradigan slot yo'q — tuzatish allaqachon qo'llangan.\n");
      return;
    }

    if (faqatKorish) {
      console.log('--korish rejimi: HECH NARSA YOZILMADI.\n');
      return;
    }

    /**
     * ⚠️ `mahsulotTuriTahrirla` BUTUN turni qayta yozadi, shuning
     *    uchun o'zgarmaydigan slot, parametr va aksessuar ham
     *    aynan o'z holicha qaytariladi. Bittasi tushib qolsa u
     *    nofaol bo'lib qolardi.
     */
    const kirim: MahsulotTurKirimi = {
      nom: tur.nom,
      xizmatHaqi: tur.xizmat_haqi ?? undefined,
      tartib: String(tur.tartib),
      oynadaKorinadi: tur.oynada_korinadi,
      botdaKorinadi: tur.botda_korinadi,
      slotlar: slotlar.map((s) => ({
        nom: s.nom,
        formula: YANGI_FORMULA[s.nom] ?? s.formula,
        majburiy: s.majburiy,
        almashtirishGuruhId: s.almashtirish_guruh_id,
        koeffitsient: Number(s.koeffitsient),
        kesishTuri: s.kesish_turi === "BO'YIGA" ? ("BO'YIGA" as const) : ('ENIGA' as const),
        kesimEniM:
          YANGI_KESIM_ENI[s.nom] !== undefined
            ? Number(YANGI_KESIM_ENI[s.nom])
            : s.kesim_eni_m === null
              ? null
              : Number(s.kesim_eni_m),
      })),
      parametrlar: parametrlar.map((p) => ({
        kod: p.kod,
        nom: p.nom,
        standartQiymat: p.standart_qiymat ?? '',
      })),
      aksessuarlar: aksessuarlar.map((a) => ({
        materialId: a.material_id,
        formula: a.formula,
        majburiy: a.majburiy,
      })),
    };

    /** Egasining o'zi — audit jurnalida kim ekani ko'rinib tursin */
    const xodim = await sql<{ id: number; filial_id: number }[]>`
      SELECT id, filial_id FROM xodim WHERE faol = true ORDER BY id LIMIT 1`;
    const x = xodim[0];
    if (x === undefined) throw new Error('Xodim topilmadi');

    const natija = await mahsulotTuriTahrirla(sql, tur.id, kirim, x.id, x.filial_id);

    if (natija.holat === 'NUQSON') {
      console.error('❌ Saqlanmadi:');
      for (const xb of natija.xabarlar) console.error(`   ${xb}`);
      process.exitCode = 1;
      return;
    }

    console.log(`✅ ${String(ozgaradi)} ta slot tuzatildi.`);
    console.log('   Eski slotlar O\'CHIRILMADI — nofaol qilindi (4.10).\n');
  } finally {
    await sql.end();
  }
}

void asosiy();
