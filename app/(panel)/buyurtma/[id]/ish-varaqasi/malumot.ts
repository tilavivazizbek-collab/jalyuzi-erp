/**
 * Ish varaqasi ma'lumoti — TZ 8.14 («Tugmalar: chek, ish varaqasi…»), 7.4. 2026-10-15
 *
 * Usta qo'liga beriladigan qog'oz: NIMANI, QANCHA va QAYSI BO'LAKDAN kesadi.
 *
 * ⚠️ NARX YO'Q — na sotuv narxi, na tannarx. Ustaga kerak emas va ichki
 *    raqam ustaxonada aylanmasin.
 * ⚠️ Kesim o'lchami band qilishdagi o'sha `kesimOlchami` dan (yangi qoida
 *    yo'q). Slot sozlamasi joriy — buyurtmadan keyin o'zgartirilgan bo'lsa,
 *    usta bo'lakni o'lchab ko'radi (7.6 — egrilik uchun 5–10 sm oddiy).
 * ⚠️ Bekor qilingan va rad etilgan pozitsiyalar chiqmaydi.
 */

import { ulanishOl } from '@/lib/db';
import { kesimOlchami, type Olcham } from '@/lib/domain/kesish';

export interface VaraqMato {
  readonly slot: string;
  readonly material: string;
  readonly birlik: string;
  readonly miqdor: string;
  /** Faqat kv.m li matoda — bitta buyum uchun kesim to'rtburchagi */
  readonly kesim: Olcham | null;
  /** Band qilingan yoki kesilgan bo'lak; band bo'lmasa `null` — «Materialga kutmoqda» */
  readonly bolak: { readonly kod: string; readonly turi: string; readonly olcham: Olcham | null } | null;
}

export interface VaraqPozitsiya {
  readonly id: number;
  readonly tartib: number;
  readonly tur: string;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly soni: number;
  readonly holat: string;
  readonly usta: string | null;
  readonly yorliq: string | null;
  readonly izoh: string | null;
  readonly ornatish: string | null;
  readonly oyna: string | null;
  readonly tanlovlar: readonly string[];
  readonly matolar: readonly VaraqMato[];
  readonly aksessuarlar: readonly { readonly nom: string; readonly soni: string; readonly birlik: string }[];
  readonly qoshimchalar: readonly string[];
}

export interface IshVaraqasi {
  readonly raqam: string;
  readonly sana: Date;
  readonly tayyorlikSana: string | null;
  readonly sotuvchi: string;
  readonly ishlabChiqaruvchi: string;
  readonly mijoz: { readonly ism: string; readonly telefon: string | null; readonly manzil: string | null } | null;
  readonly pozitsiyalar: readonly VaraqPozitsiya[];
}

export async function ishVaraqasi(buyurtmaId: number, filialId: number): Promise<IshVaraqasi | null> {
  const sql = ulanishOl();
  const b = await sql<
    {
      raqam: string;
      sana: Date;
      tayyorlik: string | null;
      sotuvchi: string | null;
      filial: string;
      mijoz: string | null;
      telefon: string | null;
      manzil: string | null;
    }[]
  >`
    SELECT b.raqam, b.sana, b.tayyorlik_sana::text AS tayyorlik, x.ism AS sotuvchi,
           f.nom AS filial, m.ism AS mijoz, m.telefon, m.manzil
    FROM buyurtma b
    JOIN filial f ON f.id = b.ishlab_chiqaruvchi_filial_id
    LEFT JOIN xodim x ON x.id = b.sotuvchi_id
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    WHERE b.id = ${buyurtmaId}
      -- Q-25 — sotgan YOKI tikayotgan filial ko'radi
      AND (b.sotgan_filial_id = ${filialId} OR b.ishlab_chiqaruvchi_filial_id = ${filialId})`;
  const h = b[0];
  if (h === undefined) return null;

  const [pozitsiyalar, tanlovlar, matolar, aksessuarlar, qoshimchalar] = await Promise.all([
    sql<
      {
        id: number;
        tartib: number;
        tur: string | null;
        eni_m: string | null;
        boyi_m: string | null;
        soni: number;
        holat: string;
        usta: string | null;
        yorliq: string | null;
        izoh: string | null;
        ornatish_nom: string | null;
        oyna_eni_m: string | null;
        oyna_boyi_m: string | null;
      }[]
    >`
      SELECT p.id, p.tartib, t.nom AS tur, p.eni_m::text, p.boyi_m::text, p.soni, p.holat,
             u.ism AS usta, p.yorliq, p.izoh, p.ornatish_nom,
             p.oyna_eni_m::text, p.oyna_boyi_m::text
      FROM buyurtma_pozitsiya p
      LEFT JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
      LEFT JOIN xodim u ON u.id = p.usta_id
      WHERE p.buyurtma_id = ${buyurtmaId} AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
      ORDER BY p.tartib, p.id`,
    sql<{ pid: number; matn: string }[]>`
      SELECT pt.buyurtma_pozitsiya_id AS pid,
             pt.tanlov_nomi_snapshot || ': ' || pt.variant_nomi_snapshot AS matn
      FROM pozitsiya_tanlov pt
      JOIN buyurtma_pozitsiya p ON p.id = pt.buyurtma_pozitsiya_id
      WHERE p.buyurtma_id = ${buyurtmaId}
      ORDER BY pt.id`,
    sql<
      {
        pid: number;
        pm_id: number;
        slot: string | null;
        material: string;
        birlik: string;
        miqdor: string;
        koeffitsient: string | null;
        kesish_turi: string | null;
        kesim_eni_m: string | null;
        kod: string | null;
        bolak_turi: string | null;
        bolak_eni: string | null;
        bolak_boyi: string | null;
      }[]
    >`
      SELECT pm.buyurtma_pozitsiya_id AS pid, pm.id AS pm_id, s.nom AS slot, m.nom AS material,
             pm.birlik, COALESCE(pm.hisoblangan_miqdor, 0)::text AS miqdor,
             s.koeffitsient::text, s.kesish_turi, s.kesim_eni_m::text,
             bo.kod, bo.turi AS bolak_turi, bo.eni_m::text AS bolak_eni, bo.boyi_m::text AS bolak_boyi
      FROM pozitsiya_material pm
      JOIN buyurtma_pozitsiya p ON p.id = pm.buyurtma_pozitsiya_id
      JOIN material m ON m.id = pm.material_id
      LEFT JOIN mahsulot_slot s ON s.id = pm.slot_id
      -- Oxirgi amaldagi band (kesilgan bo'lsa ham — usta qaysi bo'lakdan ekanini ko'radi)
      LEFT JOIN LATERAL (
        SELECT bd.bolak_id FROM band bd
        WHERE bd.pozitsiya_material_id = pm.id AND bd.holat IN ('FAOL','ISHLATILDI')
        ORDER BY bd.id DESC LIMIT 1
      ) bd ON true
      LEFT JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE p.buyurtma_id = ${buyurtmaId}
      ORDER BY pm.id`,
    sql<{ pid: number; nom: string; soni: string; birlik: string }[]>`
      SELECT pa.buyurtma_pozitsiya_id AS pid, m.nom, pa.soni::text, pa.birlik
      FROM pozitsiya_aksessuar pa
      JOIN buyurtma_pozitsiya p ON p.id = pa.buyurtma_pozitsiya_id
      JOIN material m ON m.id = pa.material_id
      WHERE p.buyurtma_id = ${buyurtmaId}
      ORDER BY pa.id`,
    sql<{ pid: number; matn: string }[]>`
      SELECT pq.buyurtma_pozitsiya_id AS pid,
             pq.nom_snapshot || COALESCE(' — ' || m.nom, '') AS matn
      FROM pozitsiya_qoshimcha pq
      JOIN buyurtma_pozitsiya p ON p.id = pq.buyurtma_pozitsiya_id
      LEFT JOIN material m ON m.id = pq.material_id
      WHERE p.buyurtma_id = ${buyurtmaId}
      ORDER BY pq.id`,
  ]);

  const olcham = (e: string | null, b2: string | null): Olcham | null =>
    e === null || b2 === null ? null : { eniM: Number(e), boyiM: Number(b2) };

  return {
    raqam: h.raqam,
    sana: h.sana,
    tayyorlikSana: h.tayyorlik,
    sotuvchi: h.sotuvchi ?? '—',
    ishlabChiqaruvchi: h.filial,
    mijoz: h.mijoz === null ? null : { ism: h.mijoz, telefon: h.telefon, manzil: h.manzil },
    pozitsiyalar: pozitsiyalar.map((p) => ({
      id: p.id,
      tartib: p.tartib,
      tur: p.tur ?? 'Qo‘shimcha buyum',
      eniM: p.eni_m,
      boyiM: p.boyi_m,
      soni: p.soni,
      holat: p.holat,
      usta: p.usta,
      yorliq: p.yorliq,
      izoh: p.izoh,
      ornatish: p.ornatish_nom,
      oyna:
        p.oyna_eni_m === null || p.oyna_boyi_m === null
          ? null
          : `${Number(p.oyna_eni_m).toFixed(2)} × ${Number(p.oyna_boyi_m).toFixed(2)}`,
      tanlovlar: tanlovlar.filter((t) => t.pid === p.id).map((t) => t.matn),
      matolar: matolar
        .filter((m) => m.pid === p.id)
        .map((m) => ({
          slot: m.slot ?? '—',
          material: m.material,
          birlik: m.birlik,
          miqdor: m.miqdor,
          kesim: kesimi(m, p.boyi_m, p.soni),
          bolak:
            m.kod === null
              ? null
              : { kod: m.kod, turi: m.bolak_turi ?? '', olcham: olcham(m.bolak_eni, m.bolak_boyi) },
        })),
      aksessuarlar: aksessuarlar
        .filter((a) => a.pid === p.id)
        .map((a) => ({ nom: a.nom, soni: a.soni, birlik: a.birlik })),
      qoshimchalar: qoshimchalar.filter((q) => q.pid === p.id).map((q) => q.matn),
    })),
  };
}

/** Kv.m li mato uchun bitta buyum kesimi — saqlash va band qilishdagi o'sha chaqiruv. */
function kesimi(
  m: { birlik: string; miqdor: string; koeffitsient: string | null; kesish_turi: string | null; kesim_eni_m: string | null },
  boyiM: string | null,
  soni: number,
): Olcham | null {
  if (m.birlik !== 'KV_M' || boyiM === null || Number(m.miqdor) <= 0) return null;
  try {
    return kesimOlchami(m.miqdor, Number(boyiM), {
      koeffitsient: m.koeffitsient === null ? 1 : Number(m.koeffitsient),
      yonalish: m.kesish_turi === "BO'YIGA" ? "BO'YIGA" : 'ENIGA',
      soni: soni > 0 ? soni : 1,
      kesimEniM: m.kesim_eni_m === null ? null : Number(m.kesim_eni_m),
    });
  } catch {
    return null;
  }
}
