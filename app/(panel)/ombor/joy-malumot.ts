/**
 * Saqlash joyi, bo'lak sahifasi va QR yorliq — so'rovlar (0062).
 * Ombor auditi 2026-10-07, 6-band.
 */
import { ulanishOl } from '@/lib/db';

export interface JoyQatori {
  readonly id: number;
  readonly nom: string;
  readonly izoh: string | null;
  /** Hozir shu joyda turgan bo'laklar soni */
  readonly bolakSoni: number;
}

export async function filialJoylari(filialId: number): Promise<JoyQatori[]> {
  const q = await ulanishOl()<
    { id: number; nom: string; izoh: string | null; bolak_soni: number }[]
  >`
    SELECT j.id, j.nom, j.izoh,
           COUNT(b.id) FILTER (WHERE b.faol AND b.holat IN ('BOSH', 'BAND', 'YOLDA'))::int
             AS bolak_soni
    FROM ombor_joy j
    LEFT JOIN bolak b ON b.joy_id = j.id
    WHERE j.filial_id = ${filialId} AND j.faol
    GROUP BY j.id
    ORDER BY j.tartib, j.nom`;
  return q.map((r) => ({ id: r.id, nom: r.nom, izoh: r.izoh, bolakSoni: r.bolak_soni }));
}

export interface BolakTafsiloti {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly holat: string;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly miqdor: string | null;
  readonly ochilgan: boolean;
  readonly materialId: number;
  readonly materialNomi: string;
  readonly sarflashBirligi: string;
  readonly joyId: number | null;
  readonly joyNomi: string | null;
  readonly kirimId: number | null;
  readonly kirimRaqam: string | null;
  readonly kirimSana: string | null;
  readonly yaratildi: Date;
}

/**
 * Bitta bo'lak — QR skanerlanganda ochiladigan sahifa uchun.
 *
 * ⚠️ FAQAT O'Z FILIALI (Q-25). Boshqa filialning rulonini skanerlasa —
 *    topilmadi; filial chegarasi URL bilan aylanib o'tilmaydi.
 */
export async function bolakTafsiloti(
  bolakId: number,
  filialId: number,
): Promise<BolakTafsiloti | null> {
  const q = await ulanishOl()<
    {
      id: number;
      kod: string;
      turi: string;
      holat: string;
      eni_m: string | null;
      boyi_m: string | null;
      miqdor: string | null;
      ochilgan: boolean;
      material_id: number;
      material_nomi: string;
      sarflash_birligi: string;
      joy_id: number | null;
      joy_nomi: string | null;
      kirim_id: number | null;
      kirim_raqam: string | null;
      kirim_sana: string | null;
      yaratildi: Date;
    }[]
  >`
    SELECT b.id, b.kod, b.turi, b.holat, b.eni_m::text, b.boyi_m::text, b.miqdor::text,
           b.ochilgan, m.id AS material_id, m.nom AS material_nomi, m.sarflash_birligi,
           b.joy_id, j.nom AS joy_nomi,
           k.id AS kirim_id, k.raqam AS kirim_raqam, to_char(k.sana, 'YYYY-MM-DD') AS kirim_sana,
           b.yaratildi
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    LEFT JOIN ombor_joy j ON j.id = b.joy_id
    LEFT JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    LEFT JOIN kirim k ON k.id = kq.kirim_id
    WHERE b.id = ${bolakId} AND b.filial_id = ${filialId} AND b.faol`;
  const r = q[0];
  if (r === undefined) return null;
  return {
    id: r.id,
    kod: r.kod,
    turi: r.turi,
    holat: r.holat,
    eniM: r.eni_m,
    boyiM: r.boyi_m,
    miqdor: r.miqdor,
    ochilgan: r.ochilgan,
    materialId: r.material_id,
    materialNomi: r.material_nomi,
    sarflashBirligi: r.sarflash_birligi,
    joyId: r.joy_id,
    joyNomi: r.joy_nomi,
    kirimId: r.kirim_id,
    kirimRaqam: r.kirim_raqam,
    kirimSana: r.kirim_sana,
    yaratildi: r.yaratildi,
  };
}

export interface YorliqBolagi {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly miqdor: string | null;
  readonly materialNomi: string;
  readonly sarflashBirligi: string;
  readonly joyNomi: string | null;
  readonly kirimSana: string | null;
}

/** Yorliq uchun ko'pi bilan — bir varaqda chop etib bo'ladigani */
export const YORLIQ_ENG_KOP = 200;

/**
 * Yorliq chop etiladigan bo'laklar — uch manbadan biri:
 *   `idlar`    — tanlangan bo'laklar
 *   `materialId` — materialning omborda turgan hamma bo'lagi
 *   `kirimId`  — kirim hujjatidan tug'ilgan bo'laklar
 *
 * ⚠️ Faqat o'z filiali va omborda turgani (ishlatilgan rulonga yorliq yo'q).
 */
export async function yorliqBolaklari(
  filialId: number,
  manba: { readonly idlar?: readonly number[]; readonly materialId?: number; readonly kirimId?: number },
): Promise<YorliqBolagi[]> {
  const sql = ulanishOl();
  const shart =
    manba.idlar !== undefined
      ? sql`AND b.id = ANY(${manba.idlar as number[]})`
      : manba.materialId !== undefined
        ? sql`AND b.material_id = ${manba.materialId}`
        : manba.kirimId !== undefined
          ? sql`AND kq.kirim_id = ${manba.kirimId}`
          : sql`AND false`;
  const q = await sql<
    {
      id: number;
      kod: string;
      turi: string;
      eni_m: string | null;
      boyi_m: string | null;
      miqdor: string | null;
      material_nomi: string;
      sarflash_birligi: string;
      joy_nomi: string | null;
      kirim_sana: string | null;
    }[]
  >`
    SELECT b.id, b.kod, b.turi, b.eni_m::text, b.boyi_m::text, b.miqdor::text,
           m.nom AS material_nomi, m.sarflash_birligi, j.nom AS joy_nomi,
           to_char(k.sana, 'YYYY-MM-DD') AS kirim_sana
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    LEFT JOIN ombor_joy j ON j.id = b.joy_id
    LEFT JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    LEFT JOIN kirim k ON k.id = kq.kirim_id
    WHERE b.filial_id = ${filialId} AND b.faol
      AND b.holat IN ('BOSH', 'BAND', 'YOLDA')
      ${shart}
    ORDER BY m.nom, b.kod
    LIMIT ${YORLIQ_ENG_KOP}`;
  return q.map((r) => ({
    id: r.id,
    kod: r.kod,
    turi: r.turi,
    eniM: r.eni_m,
    boyiM: r.boyi_m,
    miqdor: r.miqdor,
    materialNomi: r.material_nomi,
    sarflashBirligi: r.sarflash_birligi,
    joyNomi: r.joy_nomi,
    kirimSana: r.kirim_sana,
  }));
}
