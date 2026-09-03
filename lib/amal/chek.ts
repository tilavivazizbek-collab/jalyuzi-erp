/**
 * lib/amal/chek.ts — TZ 8.9 · 8.13 · 8.14 · 6.8 · 14.3
 *
 * Chek uchun ma'lumot yig'ish. Hisob-kitob `lib/domain/chek.ts` da,
 * bu yerda faqat so'rovlar.
 *
 * ⚠️ TZ 8.9 — «Chek FAQAT buyurtma to'liq yopilganda, bir marta.»
 *    Qisman topshirishda kvitansiya chiqadi — u boshqa hujjat.
 *    Shuning uchun bu yerda `yopildi IS NULL` bo'lsa xato qaytadi:
 *    yarim topshirilgan buyurtmaga chek chiqarib bo'lmaydi.
 *
 * ⚠️ 2.2-invariant — to'langan summa ham, mijoz qarzi ham
 *    SAQLANMAYDI: kassa yozuvlari va `mijoz_harakat` dan yig'iladi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';
import { korxonaMalumotlari } from './sozlama';
import { chekYasa, type Chek, type ChekPozitsiyasi, type IkkiValyutaQarz } from '@/lib/domain/chek';

interface BoshQator {
  readonly id: number;
  readonly raqam: string;
  readonly sana: Date;
  readonly yopildi: Date | null;
  readonly valyuta: string;
  readonly sotuvchi_ismi: string;
  readonly mijoz_id: number | null;
  readonly mijoz_ismi: string | null;
}

/**
 * Buyurtma cheki.
 *
 * ⚠️ Filial tekshiruvi: chekni SOTGAN filial chiqaradi. Tikuvchi
 *    filial mijoz bilan hisob-kitob qilmaydi (20.4).
 */
export async function buyurtmaCheki(
  ulanish: postgres.Sql,
  buyurtmaId: number,
  filialId: number,
): Promise<Chek | null> {
  const bosh = await ulanish<BoshQator[]>`
    SELECT b.id, b.raqam, b.sana, b.yopildi, b.valyuta,
           x.ism AS sotuvchi_ismi, b.mijoz_id, m.ism AS mijoz_ismi
    FROM buyurtma b
    JOIN xodim x ON x.id = b.sotuvchi_id
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    WHERE b.id = ${buyurtmaId} AND b.sotgan_filial_id = ${filialId}`;

  const h = bosh[0];
  if (h === undefined) return null;

  /** ⚠️ 8.9 — yopilmagan buyurtmaga chek YO'Q */
  if (h.yopildi === null) {
    throw new BiznesXato('CHEK_BUYURTMA_OCHIQ', h.raqam);
  }

  const [pozitsiyalar, tolangan, qarz, korxona] = await Promise.all([
    chekPozitsiyalari(ulanish, buyurtmaId),
    tolanganSumma(ulanish, buyurtmaId),
    h.mijoz_id === null ? Promise.resolve(null) : mijozQarziJami(ulanish, h.mijoz_id),
    korxonaMalumotlari(ulanish),
  ]);

  return chekYasa({
    buyurtmaRaqam: h.raqam,
    /** ⚠️ Chekda SOTUV sanasi turadi, chop etish sanasi emas (2.3) */
    sana: h.sana,
    sotuvchi: h.sotuvchi_ismi,
    mijoz: h.mijoz_ismi,
    valyuta: h.valyuta === 'USD' ? 'USD' : 'SOM',
    pozitsiyalar,
    tolangan,
    qarzKeyin: qarz,
    korxonaNom: korxona.korxona_nom,
    korxonaManzil: korxona.korxona_manzil,
    korxonaTelefon: korxona.korxona_telefon,
    botUsername: korxona.bot_username,
    filialKod: korxona.filial_kod,
  });
}

/**
 * Pozitsiyalar va ularning tarkibi.
 *
 * ⚠️ `LEFT JOIN mahsulot_tur` — pozitsiya YO tayyor mahsulot, YO
 *    qo'shimcha buyum bo'lishi mumkin (sxemadagi CHECK). Kartochka
 *    so'rovi `JOIN` ishlatgani uchun qo'shimcha buyumlarni tashlab
 *    ketadi; chekda ular albatta ko'rinishi kerak — mijoz ularning
 *    ham pulini to'laydi.
 */
async function chekPozitsiyalari(
  ulanish: postgres.Sql,
  buyurtmaId: number,
): Promise<readonly ChekPozitsiyasi[]> {
  const q = await ulanish<
    {
      id: number;
      tartib: number;
      nom: string;
      eni_sm: number;
      boyi_sm: number;
      soni: number;
      narx_snapshot: string;
      chegirma_summa: string | null;
      holat: string;
      composite: boolean;
    }[]
  >`
    SELECT p.id, p.tartib,
           COALESCE(t.nom, qm.nom) AS nom,
           p.eni_sm, p.boyi_sm, p.soni,
           p.narx_snapshot, p.chegirma_summa, p.holat,
           (p.mahsulot_tur_id IS NOT NULL) AS composite
    FROM buyurtma_pozitsiya p
    LEFT JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
    LEFT JOIN material qm ON qm.id = p.qoshimcha_material_id
    WHERE p.buyurtma_id = ${buyurtmaId}
    ORDER BY p.tartib`;

  if (q.length === 0) return [];

  const idlar = q.map((p) => p.id);

  /**
   * Tarkib — slot materiallari va aksessuarlar, NARXSIZ.
   *
   * ⚠️ Miqdor ham chiqmaydi: chekda «Mato 3.96 kv.m» degan qator
   *    mijozga savol tug'diradi («nega 3.96?»), javob esa kesish
   *    formulasi — chekning ishi emas.
   */
  const [materiallar, aksessuarlar] = await Promise.all([
    ulanish<{ buyurtma_pozitsiya_id: number; nom: string }[]>`
      SELECT pm.buyurtma_pozitsiya_id, m.nom
      FROM pozitsiya_material pm
      JOIN material m ON m.id = pm.material_id
      JOIN mahsulot_slot s ON s.id = pm.slot_id
      WHERE pm.buyurtma_pozitsiya_id = ANY(${idlar})
      ORDER BY s.tartib, s.nom`,
    ulanish<{ buyurtma_pozitsiya_id: number; nom: string }[]>`
      SELECT pa.buyurtma_pozitsiya_id, m.nom
      FROM pozitsiya_aksessuar pa
      JOIN material m ON m.id = pa.material_id
      WHERE pa.buyurtma_pozitsiya_id = ANY(${idlar})
      ORDER BY m.nom`,
  ]);

  return q.map((p) => ({
    tartib: p.tartib,
    nom: p.nom,
    eniSm: p.eni_sm,
    boyiSm: p.boyi_sm,
    soni: p.soni,
    narx: p.narx_snapshot,
    chegirma: p.chegirma_summa ?? '0',
    holat: p.holat,
    /** Qo'shimcha buyumning tarkibi yo'q — u bitta qatorda chiqadi */
    tarkib: p.composite
      ? [
          ...materiallar.filter((m) => m.buyurtma_pozitsiya_id === p.id).map((m) => m.nom),
          ...aksessuarlar.filter((a) => a.buyurtma_pozitsiya_id === p.id).map((a) => a.nom),
        ]
      : [],
  }));
}

/**
 * To'langan summa — kassa yozuvlaridan (2.2-invariant).
 *
 * ⚠️ Storno qilingan yozuv HISOBGA OLINMAYDI, qaytarish esa manfiy
 *    yozuv bo'lib turadi va yig'indini kamaytiradi. Bu buyurtma
 *    kartochkasidagi hisob bilan bir xil (8.14) — ikkita joyda
 *    ikki xil qarz chiqsa mijoz bilan bahs bo'lardi.
 */
async function tolanganSumma(ulanish: postgres.Sql, buyurtmaId: number): Promise<string> {
  const q = await ulanish<{ jami: string | null }[]>`
    SELECT SUM(y.summa)::text AS jami
    FROM kassa_yozuv y
    WHERE y.manba_turi = 'buyurtma' AND y.manba_id = ${buyurtmaId}
      AND NOT EXISTS (SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = y.id)`;

  return q[0]?.jami ?? '0';
}

/** TZ 6.8 — mijozning umumiy qarzi, har valyuta ALOHIDA */
async function mijozQarziJami(ulanish: postgres.Sql, mijozId: number): Promise<IkkiValyutaQarz> {
  const q = await ulanish<{ som: string | null; dollar: string | null }[]>`
    SELECT SUM(summa) FILTER (WHERE valyuta = 'SOM')::text AS som,
           SUM(summa) FILTER (WHERE valyuta = 'USD')::text AS dollar
    FROM mijoz_harakat WHERE mijoz_id = ${mijozId}`;

  return { som: q[0]?.som ?? '0', dollar: q[0]?.dollar ?? '0' };
}

// ─── Qayta chop etish jurnali ─────────────────────────────────────────────

/**
 * Chek qayta chop etilganda jurnalga yoziladi.
 *
 * ⚠️ TZ 8.9 chekni «bir marta» deydi. Egasi (2026-09-03) qayta chop
 *    etish tugmasini so'radi: mijoz chekni yo'qotishi mumkin. Shu
 *    sababli qayta chiqarish MUMKIN, lekin IZSIZ EMAS — kim va
 *    qachon chiqargani audit jurnalida qoladi.
 */
export async function chekChopEtildi(
  ulanish: postgres.Sql,
  buyurtmaId: number,
  xodimId: number,
  filialId: number,
  qaytadanmi: boolean,
): Promise<void> {
  await ulanish`
    INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                              yangi_qiymat, izoh)
    VALUES (${xodimId}, ${filialId}, 'CHEK_CHOP', 'buyurtma', ${buyurtmaId},
            ${ulanish.json({ qaytadan: qaytadanmi })},
            ${qaytadanmi ? 'Chek qayta chop etildi (8.9)' : 'Chek chop etildi (8.9)'})`;
}

/** Shu buyurtma cheki ilgari chop etilganmi */
export async function chekChopEtilganmi(
  ulanish: postgres.Sql,
  buyurtmaId: number,
): Promise<boolean> {
  const q = await ulanish<{ bor: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM audit_jurnal
      WHERE amal = 'CHEK_CHOP' AND obyekt_turi = 'buyurtma'
        AND obyekt_id = ${buyurtmaId}
    ) AS bor`;

  return q[0]?.bor ?? false;
}
