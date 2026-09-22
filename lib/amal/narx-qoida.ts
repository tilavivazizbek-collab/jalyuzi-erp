/**
 * lib/amal/narx-qoida.ts — Egasi qarori 2026-09-20 · TZ 3.8 · 6.2 · 20.9
 *
 * «Narxlar va turlar» ekrani uch jadvalga yozadi: `mahsulot_narx`,
 * `mahsulot_narx_bosqich`, `mahsulot_qoshimcha`.
 *
 * Hammasi BITTA TRANZAKSIYADA. Yarim saqlangan narx jadvali eng
 * yomon holat bo'lardi: ba'zi o'lchamga narx bor, ba'zisiga yo'q —
 * va buni faqat mijoz oldida bilinardi.
 *
 * ⚠️ ESKI QATORLAR O'CHIRILMAYDI, `faol = false` qilinadi
 *    (2.1-invariant). `pozitsiya_qoshimcha` eski qo'shimchaga havola
 *    qilib turadi: o'chirilsa tashqi kalit uzilardi va chekda nom
 *    yo'qolardi.
 */

import type postgres from 'postgres';
import { bosqichlarniTekshir, type Bosqich } from '@/lib/domain/narx-qoidasi';
import { formulaTekshir, STANDART_OZGARUVCHILAR } from '@/lib/domain/formula';
import type { TurNarxiKirimi } from '@/lib/sxema/narx-qoida';
import { BiznesXato } from '@/lib/xato';

export type NarxSaqlashNatijasi =
  | { readonly holat: 'SAQLANDI' }
  | { readonly holat: 'NUQSON'; readonly xabarlar: readonly string[] };

// ─── Tekshiruv — saqlashdan OLDIN ─────────────────────────────────────────

/**
 * Domen tekshiruvini odam o'qiydigan xabarga aylantiradi.
 *
 * ⚠️ Nuqsonlar ekranda ko'rsatiladi va saqlash TO'XTAYDI (TZ 4.5
 *    ruhida). Bo'shliq qolgan jadval eng xavflisi: qolgan hamma
 *    o'lcham ishlab turadi va muammo faqat o'sha oraliqdagi
 *    buyurtma kelganda — sotuvchi qo'lida — chiqadi.
 */
function nuqsonMatni(
  guruhNomi: string,
  bosqichlar: readonly Bosqich[],
  usuli: string,
): string[] {
  /** ⚠️ `MIQDOR` da birlik materialga bog'liq — «metr / dona» deyiladi */
  const birlik =
    usuli === 'MAYDON'
      ? 'kv.m'
      : usuli === 'DONA'
        ? 'dona'
        : usuli === 'MIQDOR'
          ? 'metr / dona'
          : 'm';

  return bosqichlarniTekshir(bosqichlar).map((n) => {
    switch (n.tur) {
      case 'BOSQICH_YOQ':
        return `«${guruhNomi}» uchun birorta bosqich kiritilmagan`;
      case 'BOSHLANISH':
        return `«${guruhNomi}»: birinchi bosqich ${String(n.dan)} ${birlik} dan boshlanadi — undan kichigiga narx yo'q`;
      case 'BOSHLIQ':
        return `«${guruhNomi}»: ${String(n.dan)}–${String(n.gacha)} ${birlik} oralig'iga narx qo'yilmagan`;
      case 'USTMA_UST':
        return `«${guruhNomi}»: ${String(n.dan)}–${String(n.gacha)} ${birlik} ikki bosqichda takrorlangan`;
      case 'CHEKSIZ_YOQ':
        return `«${guruhNomi}»: oxirgi bosqich ${String(n.gacha)} ${birlik} da tugaydi — undan kattasiga narx yo'q`;
    }
  });
}

/** Qo'shimcha formulasi haqiqiy formula ekanini tekshiradi (TZ 4.5). */
function formulaNuqsoni(nom: string, formula: string | null): string | null {
  if (formula === null || formula.trim() === '') return null;
  const n = formulaTekshir(formula, [...STANDART_OZGARUVCHILAR]);
  if (n.yaroqli) return null;
  return `«${nom}» sarf formulasida xato: ${n.xato ?? 'formula xato'}`;
}

// ─── Saqlash ──────────────────────────────────────────────────────────────

/**
 * Bitta mahsulot turining butun narx sozlamasini almashtiradi.
 *
 * ⚠️ Tranzaksiya CHAQIRUVCHIDA ochiladi (§5.2) — shu tufayli bu
 *    funksiya boshqa amal ichiga ham qo'shilishi mumkin.
 */
export async function turNarxiniSaqla(
  tx: postgres.TransactionSql,
  kirim: TurNarxiKirimi,
  xodimId: number,
): Promise<NarxSaqlashNatijasi> {
  // ── Guruh nomlari — xabarlar odam o'qiydigan bo'lsin ──
  const guruhlar = await tx<{ id: number; nom: string }[]>`
    SELECT id, nom FROM narx_guruh WHERE faol = true`;
  const nomi = new Map(guruhlar.map((g) => [g.id, g.nom]));

  const xabarlar: string[] = [];

  for (const q of kirim.qoidalar) {
    const guruhNomi = nomi.get(q.narxGuruhId) ?? `#${String(q.narxGuruhId)}`;
    const bosqichlar: Bosqich[] = q.bosqichlar.map((b) => ({
      dan: b.dan,
      gacha: b.gacha,
      narx: b.narx,
      valyuta: b.valyuta,
    }));
    xabarlar.push(...nuqsonMatni(guruhNomi, bosqichlar, q.hisoblashUsuli));
  }

  /**
   * ⚠️ TAKROR QAMROV — 2026-09-21.
   *
   *    Bazada `(tur, guruh, mijoz, filial)` noyob va saqlash
   *    `ON CONFLICT ... DO UPDATE` bilan ketadi. Ya'ni bir xil
   *    to'rtlik ikki marta kelsa ikkinchisi birinchisi ustiga
   *    JIMGINA yozilardi: egasi ikki xil narx kiritib, bittasi
   *    saqlanmaganini bilmay qolardi.
   *
   *    Ekranda ham shu tekshiruv bor, lekin brauzerga ishonilmaydi
   *    (§16) — bu yerda takrorlanadi.
   */
  const qamrovlar = new Map<string, number>();
  for (const q of kirim.qoidalar) {
    const kalit = `${String(q.narxGuruhId)}|${String(q.mijozTuriId ?? 0)}|${String(q.filialId ?? 0)}`;
    qamrovlar.set(kalit, (qamrovlar.get(kalit) ?? 0) + 1);
    if (qamrovlar.get(kalit) === 2) {
      const guruhNomi = nomi.get(q.narxGuruhId) ?? `#${String(q.narxGuruhId)}`;
      xabarlar.push(
        `«${guruhNomi}» uchun bir xil qamrov (mijoz turi va filial) ikki marta yozilgan`,
      );
    }
  }

  for (const q of kirim.qoshimchalar) {
    const x = formulaNuqsoni(q.nom, q.formula);
    if (x !== null) xabarlar.push(x);
  }

  if (xabarlar.length > 0) return { holat: 'NUQSON', xabarlar };

  // ── Eskilarini nofaol qilish (2.1-invariant) ──
  /**
   * ⚠️ `mahsulot_tur_id IS NULL` — «materialni o'zi sotish». SQL da
   *    `= NULL` hech qachon rost bo'lmaydi, shuning uchun `coalesce`
   *    bilan solishtiriladi — noyob indeks ham aynan shunday.
   */
  const tur = kirim.mahsulotTurId;

  await tx`
    UPDATE mahsulot_narx_bosqich SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now()
     WHERE faol = true
       AND mahsulot_narx_id IN (
         SELECT id FROM mahsulot_narx
          WHERE coalesce(mahsulot_tur_id, 0) = ${tur ?? 0})`;

  await tx`
    UPDATE mahsulot_narx SET faol = false, ozgartirdi_id = ${xodimId}, ozgartirildi = now()
     WHERE coalesce(mahsulot_tur_id, 0) = ${tur ?? 0} AND faol = true`;

  if (tur !== null) {
    await tx`
      UPDATE mahsulot_qoshimcha SET faol = false, ozgartirdi_id = ${xodimId},
             ozgartirildi = now()
       WHERE mahsulot_tur_id = ${tur} AND faol = true`;
  }

  // ── Yangilarini yozish ──
  for (const q of kirim.qoidalar) {
    /**
     * ⚠️ `mahsulot_narx_bitta` noyob indeksi nofaol qatorni ham
     *    hisobga oladi, shuning uchun `ON CONFLICT` bilan TIRILTIRAMIZ:
     *    aks holda ikkinchi saqlashda «duplicate key» chiqardi.
     */
    const qator = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_narx (mahsulot_tur_id, narx_guruh_id, mijoz_turi_id,
                                 filial_id, hisoblash_usuli, yaratdi_id)
      VALUES (${tur}, ${q.narxGuruhId}, ${q.mijozTuriId},
              ${q.filialId}, ${q.hisoblashUsuli}, ${xodimId})
      ON CONFLICT (coalesce(mahsulot_tur_id, 0), narx_guruh_id,
                   coalesce(mijoz_turi_id, 0), coalesce(filial_id, 0))
      DO UPDATE SET hisoblash_usuli = EXCLUDED.hisoblash_usuli,
                    faol = true, ochirildi = NULL,
                    ozgartirdi_id = ${xodimId}, ozgartirildi = now()
      RETURNING id`;

    const narxId = qator[0]?.id;
    if (narxId === undefined) {
      throw new BiznesXato('SAQLANMADI', 'narx qoidasi yozilmadi');
    }

    for (const [i, b] of q.bosqichlar.entries()) {
      await tx`
        INSERT INTO mahsulot_narx_bosqich (mahsulot_narx_id, dan, gacha, narx,
                                           valyuta, tartib, yaratdi_id)
        VALUES (${narxId}, ${b.dan}, ${b.gacha}, ${b.narx},
                ${b.valyuta}, ${i}, ${xodimId})`;
    }
  }

  /** ⚠️ Materialni o'zi sotishda qo'shimcha bo'lmaydi — tur yo'q */
  for (const [i, q] of (tur === null ? [] : kirim.qoshimchalar).entries()) {
    await tx`
      INSERT INTO mahsulot_qoshimcha (mahsulot_tur_id, nom, hisoblash_usuli, narx,
                                      valyuta, material_id, formula,
                                      almashtirish_guruh_id, tartib, yaratdi_id)
      VALUES (${tur}, ${q.nom}, ${q.hisoblashUsuli}, ${q.narx},
              ${q.valyuta}, ${q.materialId}, ${q.formula},
              ${q.almashtirishGuruhId}, ${i}, ${xodimId})`;
  }

  return { holat: 'SAQLANDI' };
}

// ─── Narx guruhi — spravochnik ────────────────────────────────────────────

/**
 * Yangi mato darajasi. Modal oyna ham, ro'yxat sahifasi ham AYNAN
 * shuni chaqiradi (§2.2).
 *
 * ⚠️ Nofaol qilingan guruh TIRILADI, yangi dublikat yasalmaydi:
 *    bazadagi noyob indeks `lower(btrim(nom))` bo'yicha va u nofaol
 *    qatorni ham qamrab oladi.
 */
export async function narxGuruhTezYarat(
  sql: postgres.Sql | postgres.TransactionSql,
  nom: string,
  xodimId: number,
): Promise<{ id: number; nom: string }> {
  const t = nom.trim();
  if (t === '') throw new BiznesXato('NARX_NOTOGRI', 'Daraja nomini kiriting');
  if (t.length > 120) throw new BiznesXato('NARX_NOTOGRI', 'Nom juda uzun');

  const q = await sql<{ id: number; nom: string }[]>`
    INSERT INTO narx_guruh (nom, yaratdi_id) VALUES (${t}, ${xodimId})
    ON CONFLICT (lower(btrim(nom)))
    DO UPDATE SET faol = true, ochirildi = NULL,
                  ozgartirdi_id = ${xodimId}, ozgartirildi = now()
    RETURNING id, nom`;

  const y = q[0];
  if (y === undefined) throw new BiznesXato('SAQLANMADI', 'daraja yozilmadi');
  return y;
}
