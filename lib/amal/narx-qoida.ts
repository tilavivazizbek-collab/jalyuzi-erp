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
  const xabarlar: string[] = [];

  /**
   * Qatorni odam tanigudek atash — 0057 dan keyin daraja yo'q.
   *
   * ⚠️ Ilgari bu yerda darajaning NOMI turardi («Premium»).
   *    Endi qatorni faqat mijoz turi va filial ajratadi, shuning
   *    uchun xabarda o'shalar yoziladi — aks holda egasi qaysi
   *    qatorda xato borligini topolmasdi.
   */
  const qatorNomi = (q: {
    readonly mijozTuriId: number | null;
    readonly filialId: number | null;
  }): string => {
    const bolaklar: string[] = [];
    if (q.mijozTuriId !== null) bolaklar.push(`mijoz turi #${String(q.mijozTuriId)}`);
    if (q.filialId !== null) bolaklar.push(`filial #${String(q.filialId)}`);
    return bolaklar.length === 0 ? 'Umumiy qator' : bolaklar.join(' · ');
  };

  for (const q of kirim.qoidalar) {
    const guruhNomi = qatorNomi(q);
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
   *    Bazada `(tur, hamma_turga, mijoz, filial)` noyob va saqlash
   *    `ON CONFLICT ... DO UPDATE` bilan ketadi. Ya'ni bir xil
   *    qamrov ikki marta kelsa ikkinchisi birinchisi ustiga
   *    JIMGINA yozilardi: egasi ikki xil narx kiritib, bittasi
   *    saqlanmaganini bilmay qolardi.
   *
   *    Ekranda ham shu tekshiruv bor, lekin brauzerga ishonilmaydi
   *    (§16) — bu yerda takrorlanadi.
   */
  const qamrovlar = new Map<string, number>();
  for (const q of kirim.qoidalar) {
    const kalit = `${String(q.mijozTuriId ?? 0)}|${String(q.filialId ?? 0)}`;
    qamrovlar.set(kalit, (qamrovlar.get(kalit) ?? 0) + 1);
    if (qamrovlar.get(kalit) === 2) {
      xabarlar.push(
        `«${qatorNomi(q)}» ikki marta yozilgan — bir xil qamrov`,
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
  /*
   * ⚠️ `hamma_turga` NOFAOLLASHTIRISHGA HAM KIRADI — 0055.
   *
   *    0055 dan keyin `mahsulot_tur_id IS NULL` IKKI xil qatorni
   *    bildiradi: «materialni o'zi sotish» va «hamma tur uchun
   *    standart narx». Shartsiz qoldirilsa, material narxini
   *    saqlash standart narxlarni JIMGINA o'chirib yuborardi —
   *    va aksincha.
   */
  const hammaTurga = kirim.hammaTurga === true;
  /*
   * ⚠️ MATERIAL HAM QAMROVGA KIRADI — 0059.
   *
   *    Nofaollashtirish «shu ekranda ko'rinib turgan jadval»ni
   *    almashtirishi kerak, undan kattasini emas. Material shartsiz
   *    qoldirilsa karniz narxini saqlash PULTNIKINI va umumiy
   *    jadvalni ham jimgina o'chirib yuborardi — ya'ni egasi bitta
   *    jadvalni tahrirlab, uchtasini yo'qotardi.
   */
  const material = kirim.materialId ?? null;

  await tx`
    UPDATE mahsulot_narx_bosqich SET faol = false, ozgartirdi_id = ${xodimId},
           ozgartirildi = now()
     WHERE faol = true
       AND mahsulot_narx_id IN (
         SELECT id FROM mahsulot_narx
          WHERE coalesce(mahsulot_tur_id, 0) = ${tur ?? 0}
            AND hamma_turga = ${hammaTurga}
            AND coalesce(material_id, 0) = ${material ?? 0})`;

  await tx`
    UPDATE mahsulot_narx SET faol = false, ozgartirdi_id = ${xodimId}, ozgartirildi = now()
     WHERE coalesce(mahsulot_tur_id, 0) = ${tur ?? 0}
       AND hamma_turga = ${hammaTurga}
       AND coalesce(material_id, 0) = ${material ?? 0} AND faol = true`;

  if (tur !== null) {
    await tx`
      UPDATE mahsulot_qoshimcha SET faol = false, ozgartirdi_id = ${xodimId},
             ozgartirildi = now()
       WHERE mahsulot_tur_id = ${tur} AND faol = true`;
  }

  // ── Yangilarini yozish ──
  for (const q of kirim.qoidalar) {
    /**
     * ⚠️ `ON CONFLICT` PREDIKATI SHART — 0059.
     *
     *    `mahsulot_narx_bitta` endi QISMAN indeks: u faqat faol
     *    qatorlarni qamraydi (nofaol qatorlar narx tarixi bo'lib
     *    qoladi va bir-biriga to'qnashishi mumkin). Postgres
     *    qisman indeksni faqat AYNI predikat yozilganda taniydi —
     *    `WHERE faol` tushirib qoldirilsa har saqlash «no unique
     *    or exclusion constraint matching» bilan yiqilardi.
     *
     * ⚠️ Odatda bu yerga kelganda eskisi allaqachon nofaol
     *    qilingan va to'qnashuv BO'LMAYDI. `DO UPDATE` shu sababli
     *    zaxira: bitta saqlashda ikki bir xil qamrov kelib qolsa
     *    ikkinchisi birinchisini yangilaydi, xato bermaydi.
     */
    const qator = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_narx (mahsulot_tur_id, hamma_turga, material_id,
                                 mijoz_turi_id,
                                 filial_id, hisoblash_usuli, min_olchov,
                                 yaratdi_id)
      VALUES (${tur}, ${hammaTurga}, ${material}, ${q.mijozTuriId},
              ${q.filialId}, ${q.hisoblashUsuli}, ${q.minOlchov ?? null},
              ${xodimId})
      ON CONFLICT (coalesce(mahsulot_tur_id, 0), hamma_turga,
                   coalesce(material_id, 0),
                   coalesce(mijoz_turi_id, 0), coalesce(filial_id, 0))
        WHERE faol
      DO UPDATE SET hisoblash_usuli = EXCLUDED.hisoblash_usuli,
                    /** ⚠️ 0056 — tiriltirishda ham yangilanadi, aks
                     *     holda eski eng kam hisob qolib ketardi */
                    min_olchov = EXCLUDED.min_olchov,
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
