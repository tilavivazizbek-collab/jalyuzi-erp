/**
 * Kontaktlar va muloqot tarixi — mijoz kartochkasi uchun (0061).
 * Egasi auditi 2026-10-06.
 */
import { ulanishOl } from '@/lib/db';

export interface KontaktQatori {
  readonly id: number;
  readonly ism: string;
  readonly lavozim: string | null;
  readonly telefon: string | null;
  readonly izoh: string | null;
}

export async function mijozKontaktlari(mijozId: number): Promise<KontaktQatori[]> {
  return ulanishOl()<KontaktQatori[]>`
    SELECT id, ism, lavozim, telefon, izoh FROM mijoz_kontakt
    WHERE mijoz_id = ${mijozId} AND faol = true
    ORDER BY id`;
}

export interface MuloqotQatori {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  readonly matn: string;
  /** `to_char` bilan — vaqt mintaqasi siljitmasin */
  readonly vada_sana: string | null;
  readonly vada_summa: string | null;
  readonly vada_valyuta: string | null;
  readonly bajarildi: boolean;
  readonly xodim_ismi: string;
  /** Va'da sanasi o'tib ketdi va hali bajarilmagan */
  readonly kechikdi: boolean;
}

export async function mijozMuloqotlari(mijozId: number, chegara = 30): Promise<MuloqotQatori[]> {
  return ulanishOl()<MuloqotQatori[]>`
    SELECT m.id, m.sana, m.turi, m.matn,
           to_char(m.vada_sana, 'YYYY-MM-DD') AS vada_sana,
           m.vada_summa::text AS vada_summa, m.vada_valyuta, m.bajarildi,
           x.ism AS xodim_ismi,
           (m.turi = 'VADA' AND NOT m.bajarildi
             AND m.vada_sana < (now() AT TIME ZONE 'Asia/Tashkent')::date) AS kechikdi
    FROM mijoz_muloqot m
    JOIN xodim x ON x.id = m.xodim_id
    WHERE m.mijoz_id = ${mijozId}
    ORDER BY (m.turi = 'VADA' AND NOT m.bajarildi) DESC, m.sana DESC, m.id DESC
    LIMIT ${chegara}`;
}
