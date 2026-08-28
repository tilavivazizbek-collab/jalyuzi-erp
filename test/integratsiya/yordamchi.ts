/**
 * test/integratsiya/yordamchi.ts
 *
 * Haqiqiy bazaga qarshi ishlaydigan testlar uchun umumiy asboblar.
 *
 * NEGA ALOHIDA TO'PLAM (`npm run test:baza`)
 *
 * `npm test` sof mantiqni tekshiradi: tez, tarmoqsiz, har joyda ishlaydi.
 * Bu yerdagi testlar esa bazaga muhtoj — ular baza bilan kod CHEGARASINI
 * sinaydi. Aynan shu chegarada ikki jiddiy xato topilgan edi:
 *
 *   P-13  `BIGINT` matn bo'lib kelib, hisoblagich "1" + 1 = "11" bo'ldi
 *   P-14  sahifa chizilayotganda cookie yozilmadi va 500 chiqdi
 *
 * Ikkalasini ham sof mantiq testlari ko'rmagan. Shuning uchun bu to'plam
 * bir martalik skript emas, doimiy test bo'lishi shart.
 */

import { ulanishYarat, type Ulanish } from '@/lib/db/ulanish';

/**
 * ⚠️ TESTLAR ISHLAYDIGAN BAZAGA HECH QACHON YOZMAYDI.
 *
 *    Ilgari `DATABASE_URL` ishlatilardi — ya'ni egasining
 *    ishlaydigan bazasi. Natijada u yerda 88 material, 138
 *    buyurtma va 432 audit yozuvi sinov axlati to'plangan edi.
 *    Kassa yozuvini esa o'chirib ham bo'lmasdi (§6.5 trigger).
 *
 *    Endi ALOHIDA o'zgaruvchi: `TEST_DATABASE_URL`. Loqal Docker
 *    Postgres uchun mo'ljallangan (`docker compose up`).
 */
export const SINOV_BAZA_URL = process.env['TEST_DATABASE_URL'] ?? '';

export const BAZA_BORMI = SINOV_BAZA_URL !== '';

/** Sinov ma'lumotlari haqiqiy yozuvlar bilan to'qnashmasligi uchun. */
export const SINOV_XODIM_ID = 9001;
export const SINOV_USTA_ID = 9002;
export const SINOV_TELEFON = '998900009001';
export const SINOV_USTA_TELEFON = '998900009002';
export const SINOV_PAROL = 'integratsiya-sinov-paroli';

export function sinovUlanishi(): Ulanish {
  const url = SINOV_BAZA_URL;

  if (url === '') {
    throw new Error(
      "TEST_DATABASE_URL yo'q. Testlar ishlaydigan bazaga YOZMAYDI — " +
        'loqal baza kerak: `docker compose up -d`, keyin .env ga ' +
        'TEST_DATABASE_URL qatorini qo`shing.',
    );
  }

  /**
   * ⚠️ ENG MUHIM HIMOYA: test bazasi ishlaydigan bazaga TENG
   *    BO'LMASLIGI kerak.
   *
   *    Bu tekshiruvsiz kimdir `.env` da ikkalasini bir xil qilib
   *    qo'yardi va hammasi qaytadan boshlanardi: egasining
   *    bazasiga yana sinov axlati to'planardi.
   */
  const ish = process.env['DATABASE_URL'] ?? '';
  if (ish !== '' && ish === url) {
    throw new Error(
      'TEST_DATABASE_URL va DATABASE_URL BIR XIL. Testlar ishlaydigan ' +
        'bazaga yozmasligi kerak — alohida baza korsating.',
    );
  }

  return ulanishYarat(url, { max: 3 });
}

/** Sinov xodimlari bazada borligiga ishonch hosil qiladi. */
export async function sinovXodimlariniTayyorla(
  sql: Ulanish,
  parolHash: string,
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`SET CONSTRAINTS ALL DEFERRED`;

    await tx`
      INSERT INTO xodim (id, filial_id, ism, telefon, parol_hash, yaratdi_id)
      VALUES (${SINOV_XODIM_ID}, 1, 'Sinov admin', ${SINOV_TELEFON}, ${parolHash}, 1)
      ON CONFLICT (id) DO UPDATE
        SET parol_hash = EXCLUDED.parol_hash, xato_urinish = 0,
            bloklangan = NULL, faol = true`;

    await tx`
      INSERT INTO xodim (id, filial_id, ism, telefon, parol_hash, yaratdi_id)
      VALUES (${SINOV_USTA_ID}, 1, 'Sinov usta', ${SINOV_USTA_TELEFON}, ${parolHash}, 1)
      ON CONFLICT (id) DO UPDATE
        SET parol_hash = EXCLUDED.parol_hash, xato_urinish = 0,
            bloklangan = NULL, faol = true`;

    const admin = await tx<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
    const usta = await tx<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'USTA'`;

    const adminId = admin[0]?.id;
    const ustaId = usta[0]?.id;
    if (adminId === undefined || ustaId === undefined) {
      throw new Error("Tizimli rollar yo'q — avval `npm run db:urug` ni bajaring");
    }

    await tx`
      INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
      VALUES (${SINOV_XODIM_ID}, ${adminId}, 1) ON CONFLICT DO NOTHING`;
    await tx`
      INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
      VALUES (${SINOV_USTA_ID}, ${ustaId}, 1) ON CONFLICT DO NOTHING`;
  });
}

/** Har testdan oldin blok hisoblagichi va sessiyalarni tozalaydi. */
export async function sinovHolatiniTozala(sql: Ulanish): Promise<void> {
  await sql`
    UPDATE xodim SET xato_urinish = 0, bloklangan = NULL
    WHERE id IN (${SINOV_XODIM_ID}, ${SINOV_USTA_ID})`;
  await sql`
    UPDATE sessiya SET bekor_qilindi = now()
    WHERE xodim_id IN (${SINOV_XODIM_ID}, ${SINOV_USTA_ID}) AND bekor_qilindi IS NULL`;
}

export const T0 = new Date('2026-08-17T10:00:00+05:00');
export const daqiqa = (n: number): Date => new Date(T0.getTime() + n * 60_000);

// ─── 4-bosqich · haqiqiy buyurtma pozitsiyasi ─────────────────────────────

export interface SinovPozitsiyasi {
  readonly buyurtmaId: number;
  readonly pozitsiyaId: number;
  /** Har slot uchun bitta `pozitsiya_material` (QISM 3 §3.2.1) */
  readonly materialQatorlari: readonly number[];
}

/**
 * ⚠️ T-04 dan keyin `band.buyurtma_pozitsiya_id` HAQIQIY pozitsiyaga
 *    bog'langan. Avval testlar o'ylab topilgan raqamlar (700 001, 1004…)
 *    ishlatardi va ular faqat tashqi kalit YO'Q bo'lgani uchun o'tardi.
 *
 *    Bu yordamchi buyurtma → pozitsiya → pozitsiya_material zanjirini
 *    haqiqatdan yaratadi. Sekinroq, lekin test endi bazaning haqiqiy
 *    qoidalari ostida ishlaydi.
 */
export async function sinovPozitsiyasi(
  sql: Ulanish,
  materialIdlar: readonly number[],
  filialId = 1,
  xodimId = 1,
): Promise<SinovPozitsiyasi> {
  return sql.begin(async (tx) => {
    const belgi = `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}`;

    const tur = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`Sinov tur ${belgi}`}, ${xodimId}) RETURNING id`;
    const turId = tur[0]?.id ?? 0;

    const b = await tx<{ id: number }[]>`
      INSERT INTO buyurtma (raqam, mijoz_id, sotuvchi_id, sotgan_filial_id,
                            ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
      VALUES (${`B-SINOV-${belgi}`}, NULL, ${xodimId}, ${filialId}, ${filialId},
              'SAYT', ${xodimId})
      RETURNING id`;
    const buyurtmaId = b[0]?.id ?? 0;

    const p = await tx<{ id: number }[]>`
      INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id,
                                      eni_sm, boyi_sm, narx_snapshot,
                                      formula_snapshot, holat, yaratdi_id)
      VALUES (${buyurtmaId}, 1, ${turId}, 210, 140, 0,
              ${tx.json({ sinov: true })}, 'TASDIQLANGAN', ${xodimId})
      RETURNING id`;
    const pozitsiyaId = p[0]?.id ?? 0;

    const qatorlar: number[] = [];
    for (const [i, materialId] of materialIdlar.entries()) {
      const slot = await tx<{ id: number }[]>`
        INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
        VALUES (${turId}, ${`Slot ${String(i + 1)}`}, ${i + 1}, ${"ENI * BO'YI"},
                ${xodimId})
        RETURNING id`;

      const pm = await tx<{ id: number }[]>`
        INSERT INTO pozitsiya_material (buyurtma_pozitsiya_id, slot_id, material_id,
                                        hisoblangan_miqdor, birlik, narx_snapshot)
        VALUES (${pozitsiyaId}, ${slot[0]?.id ?? 0}, ${materialId}, 1, 'KV_M', 0)
        RETURNING id`;
      qatorlar.push(pm[0]?.id ?? 0);
    }

    return { buyurtmaId, pozitsiyaId, materialQatorlari: qatorlar };
  });
}

export interface PozitsiyaTolqini {
  readonly buyurtmaId: number;
  /** Tayyor pozitsiya id lari */
  readonly pozitsiyalar: readonly number[];
  /** Tayyor `pozitsiya_material` id lari */
  readonly materialQatorlari: readonly number[];
}

/**
 * Ko'p pozitsiya kerak bo'lgan testlar uchun — bir necha SO'ROVDA.
 *
 * ⚠️ Baza masofada turibdi: 40 ta pozitsiyani bittalab yozish 40 ta
 *    tarmoq borib-kelishi degani. `generate_series` bilan hammasi
 *    to'rtta so'rovda tushadi.
 */
export async function pozitsiyaTolqini(
  sql: Ulanish,
  materialId: number,
  pozitsiyaSoni: number,
  materialQatorSoni: number,
  filialId = 1,
  xodimId = 1,
): Promise<PozitsiyaTolqini> {
  return sql.begin(async (tx) => {
    const belgi = `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}`;

    const tur = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`Sinov tur ${belgi}`}, ${xodimId}) RETURNING id`;
    const turId = tur[0]?.id ?? 0;

    const b = await tx<{ id: number }[]>`
      INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id,
                            ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
      VALUES (${`B-SINOV-${belgi}`}, ${xodimId}, ${filialId}, ${filialId},
              'SAYT', ${xodimId})
      RETURNING id`;
    const buyurtmaId = b[0]?.id ?? 0;

    const p = await tx<{ id: number }[]>`
      INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id,
                                      eni_sm, boyi_sm, narx_snapshot,
                                      formula_snapshot, holat, yaratdi_id)
      SELECT ${buyurtmaId}, g, ${turId}, 210, 140, 0,
             ${tx.json({ sinov: true })}, 'TASDIQLANGAN', ${xodimId}
      FROM generate_series(1, ${pozitsiyaSoni}) AS g
      RETURNING id`;

    const birinchiPozitsiya = p[0]?.id ?? 0;

    const slotlar = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
      SELECT ${turId}, 'Slot ' || g::text, g, ${"ENI * BO'YI"}, ${xodimId}
      FROM generate_series(1, ${materialQatorSoni}) AS g
      RETURNING id`;

    // Har `pozitsiya_material` boshqa slotda — (pozitsiya, slot) juftligi noyob
    const pm = await tx<{ id: number }[]>`
      INSERT INTO pozitsiya_material (buyurtma_pozitsiya_id, slot_id, material_id,
                                      hisoblangan_miqdor, birlik, narx_snapshot)
      SELECT ${birinchiPozitsiya}, s.id, ${materialId}, 1, 'KV_M', 0
      FROM unnest(${slotlar.map((x) => x.id)}::bigint[]) AS s(id)
      RETURNING id`;

    return {
      buyurtmaId,
      pozitsiyalar: p.map((x) => x.id),
      materialQatorlari: pm.map((x) => x.id),
    };
  });
}
