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
import { BiznesXato } from '@/lib/xato';

export type KonstruktorNatijasi =
  | { readonly holat: 'SAQLANDI'; readonly id: number }
  | { readonly holat: 'NUQSON'; readonly xabarlar: readonly string[] };

/** Sxema tekshiruvidan o'tgan kirimni domen tekshiruviga beradi (TZ 4.5). */
function domenTekshiruvi(kirim: MahsulotTurKirimi): readonly string[] {
  const tur: MahsulotTuri = {
    id: 0,
    nom: kirim.nom,
    parametrlar: kirim.parametrlar.map((p) => ({
      nom: p.kod,
      qiymat: Number(p.standartQiymat),
    })),
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

  return konstruktorTekshir(tur).nuqsonlar.map((n) => {
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
  });
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

  for (const [i, s] of kirim.slotlar.entries()) {
    await tx`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, majburiy,
                                 almashtirish_guruh_id, formula, yaratdi_id)
      VALUES (${turId}, ${s.nom}, ${i}, ${s.majburiy},
              ${s.almashtirishGuruhId}, ${s.formula}, ${xodimId})`;
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

export async function mahsulotTuriYarat(
  ulanish: postgres.Sql,
  kirim: MahsulotTurKirimi,
  xodimId: number,
): Promise<KonstruktorNatijasi> {
  const xabarlar = domenTekshiruvi(kirim);
  if (xabarlar.length > 0) return { holat: 'NUQSON', xabarlar };

  return ulanish.begin(async (tx) => {
    const qator = await tx<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, xizmat_haqi, tartib, oynada_korinadi,
                                botda_korinadi, yaratdi_id)
      VALUES (${kirim.nom}, ${kirim.xizmatHaqi ?? '0'}, ${Number(kirim.tartib)},
              ${kirim.oynadaKorinadi}, ${kirim.botdaKorinadi}, ${xodimId})
      RETURNING id`;

    const id = qator[0]?.id;
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
): Promise<KonstruktorNatijasi> {
  const xabarlar = domenTekshiruvi(kirim);
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
        ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${turId}`;

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
