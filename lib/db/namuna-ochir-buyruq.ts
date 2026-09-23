/**
 * `npm run db:namuna-ochir` — namuna yozuvlarini butunlay o'chiradi.
 *
 * ⚠️ FAQAT «NAMUNA» bilan nomlangan yozuvlar. Egasining o'z
 *    ma'lumoti hech qanday holatda tegilmaydi — shart har so'rovda
 *    ochiq yozilgan.
 *
 * ⚠️ TARTIB MUHIM: bola jadvallar avval o'chiriladi, aks holda
 *    tashqi kalit yiqiladi.
 *
 * ⚠️ BU YERDA `DELETE` ISHLATILADI (2.1-invariantdan istisno).
 *    Sabab: namuna ma'lumot TARIX EMAS, u sinov uchun qo'yilgan va
 *    keyin izsiz ketishi kerak. Nofaol qilinsa hisobotlarda
 *    ko'rinib qolardi.
 */

import { ulanishOl } from '@/lib/db';

const BELGI = 'NAMUNA';

async function ochir(): Promise<void> {
  const sql = ulanishOl();

  await sql.begin(async (tx) => {
    /** Buyurtma zanjiri — bo'lak bandi ham bo'shatiladi */
    const buyurtmalar = await tx<{ id: number }[]>`
      SELECT id FROM buyurtma WHERE raqam LIKE ${`${BELGI}-%`}`;
    const bIdlar = buyurtmalar.map((b) => b.id);

    if (bIdlar.length > 0) {
      const pozitsiyalar = await tx<{ id: number }[]>`
        SELECT id FROM buyurtma_pozitsiya WHERE buyurtma_id = ANY(${bIdlar})`;
      const pIdlar = pozitsiyalar.map((p) => p.id);

      if (pIdlar.length > 0) {
        /** ⚠️ Band qilingan bo'laklar BO'SH holatiga qaytariladi */
        await tx`
          UPDATE bolak SET holat = 'BOSH'
           WHERE id IN (SELECT bolak_id FROM band
                         WHERE buyurtma_pozitsiya_id = ANY(${pIdlar}))`;
        await tx`DELETE FROM band WHERE buyurtma_pozitsiya_id = ANY(${pIdlar})`;
        await tx`DELETE FROM pozitsiya_material WHERE buyurtma_pozitsiya_id = ANY(${pIdlar})`;
        await tx`DELETE FROM pozitsiya_aksessuar WHERE buyurtma_pozitsiya_id = ANY(${pIdlar})`;
        await tx`DELETE FROM pozitsiya_qoshimcha WHERE buyurtma_pozitsiya_id = ANY(${pIdlar})`;
        await tx`DELETE FROM pozitsiya_tanlov WHERE buyurtma_pozitsiya_id = ANY(${pIdlar})`;
        await tx`DELETE FROM buyurtma_pozitsiya WHERE id = ANY(${pIdlar})`;
      }
      /**
       * ⚠️ `mijoz_harakat` da `buyurtma_id` YO'Q — u manba
       *    juftligi bilan bog'lanadi (`manba_turi` + `manba_id`).
       */
      await tx`
        DELETE FROM mijoz_harakat
         WHERE manba_turi = 'buyurtma' AND manba_id = ANY(${bIdlar})`;
      await tx`DELETE FROM buyurtma WHERE id = ANY(${bIdlar})`;
      console.log(`Buyurtma o'chirildi: ${String(bIdlar.length)} ta`);
    }

    /** Mahsulot turi va uning bo'laklari */
    const turlar = await tx<{ id: number }[]>`
      SELECT id FROM mahsulot_tur WHERE nom LIKE ${`${BELGI}%`}`;
    const tIdlar = turlar.map((t) => t.id);

    if (tIdlar.length > 0) {
      await tx`
        DELETE FROM mahsulot_narx_bosqich
         WHERE mahsulot_narx_id IN (SELECT id FROM mahsulot_narx
                                     WHERE mahsulot_tur_id = ANY(${tIdlar}))`;
      await tx`DELETE FROM mahsulot_narx WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`DELETE FROM mahsulot_qoshimcha WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`
        DELETE FROM mahsulot_tanlov_variant
         WHERE tanlov_id IN (SELECT id FROM mahsulot_tanlov
                              WHERE mahsulot_tur_id = ANY(${tIdlar}))`;
      await tx`DELETE FROM mahsulot_tanlov WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`DELETE FROM mahsulot_ornatish WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`DELETE FROM mahsulot_aksessuar WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`DELETE FROM mahsulot_parametr WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`DELETE FROM mahsulot_slot WHERE mahsulot_tur_id = ANY(${tIdlar})`;
      await tx`DELETE FROM mahsulot_tur WHERE id = ANY(${tIdlar})`;
      console.log(`Mahsulot turi o'chirildi: ${String(tIdlar.length)} ta`);
    }

    /*
     * NAMUNA MATOSI — faqat bo'sh bazada yaratilgani.
     *
     * ⚠️ FAQAT «NAMUNA» bilan boshlanadigan nom. Egasining
     *    haqiqiy matosi va uning bo'laklari HECH QACHON
     *    o'chirilmaydi — skript ularga rulon ham qo'shmagan.
     */
    const matolar = await tx<{ id: number }[]>`
      SELECT id FROM material WHERE nom LIKE ${`${BELGI}%`}`;
    const mIdlar = matolar.map((x) => x.id);
    if (mIdlar.length > 0) {
      await tx`DELETE FROM bolak WHERE material_id = ANY(${mIdlar})`;
      await tx`DELETE FROM material WHERE id = ANY(${mIdlar})`;
      console.log(`Namuna mato o'chirildi: ${String(mIdlar.length)} ta`);
    }

    await tx`
      DELETE FROM mahsulot_narx_bosqich
       WHERE mahsulot_narx_id IN (
         SELECT mn.id FROM mahsulot_narx mn JOIN narx_guruh g ON g.id = mn.narx_guruh_id
          WHERE g.nom LIKE ${`${BELGI}%`})`;
    await tx`
      DELETE FROM mahsulot_narx
       WHERE narx_guruh_id IN (SELECT id FROM narx_guruh WHERE nom LIKE ${`${BELGI}%`})`;
    await tx`DELETE FROM narx_guruh WHERE nom LIKE ${`${BELGI}%`}`;
    await tx`DELETE FROM almashtirish_guruh WHERE nom LIKE ${`${BELGI}%`}`;
  });

  /*
   * ⚠️ EGASINING DARAJASIGA QO'YILGAN NARX O'CHIRILMAYDI.
   *
   *    U egasining o'z narx jadvali bo'lib qoladi va uni namuna
   *    bilan birga o'chirib yuborish — uning ishini bekor qilish
   *    degani. Kerak bo'lsa `/narx?tur=daraja` dan o'zi tozalaydi.
   */
  console.log("Darajaga qo'yilgan narx TEGILMADI — u sizniki (/narx?tur=daraja)");
  process.exit(0);
}

ochir().catch((x: unknown) => {
  console.error('XATO:', x instanceof Error ? x.message : String(x));
  process.exit(1);
});
