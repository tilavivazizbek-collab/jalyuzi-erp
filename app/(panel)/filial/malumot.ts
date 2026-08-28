import 'server-only';

/**
 * TZ 22.6 · 22.7 — filiallararo hisob-kitob ekrani.
 *
 * ⚠️ 2.2-invariant — balans SAQLANMAYDI. Bu yerda faqat harakatlar
 *    o'qiladi, hisob `lib/domain/filial-hisob.ts` da bo'ladi.
 */

import { ulanishOl } from '@/lib/db';
import { filialHarakatlari } from '@/lib/amal/filial-harakat';
import { balansJadvali, type FilialHarakati } from '@/lib/domain/filial-hisob';
import { pulMatn } from '@/lib/domain/pul';

export interface JuftlikQatori {
  readonly filialId: number;
  readonly nom: string;
  /** Manfiy — biz qarzdormiz, musbat — bizga qarzdor */
  readonly balans: string;
}

export interface FilialHisobi {
  readonly juftlar: readonly JuftlikQatori[];
  readonly sof: string;
  readonly harakatSoni: number;
}

export async function filialHisobi(filialId: number): Promise<FilialHisobi> {
  const sql = ulanishOl();
  const harakatlar: readonly FilialHarakati[] = await filialHarakatlari(
    sql,
    filialId,
    null,
    null,
  );

  const nomlar = await sql<{ id: number; nom: string }[]>`
    SELECT id, nom FROM filial ORDER BY id`;
  const nom = new Map(nomlar.map((f) => [f.id, f.nom]));

  const j = balansJadvali(filialId, harakatlar);

  return {
    juftlar: j.juftlar.map((q) => ({
      filialId: q.filialId,
      nom: nom.get(q.filialId) ?? `#${String(q.filialId)}`,
      balans: pulMatn(q.balans),
    })),
    sof: pulMatn(j.sof),
    harakatSoni: harakatlar.length,
  };
}

export interface HarakatQatori {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  readonly kimdanNom: string;
  readonly kimgaNom: string;
  readonly summa: string;
  readonly qoldaOzgartirildi: boolean;
  readonly izoh: string | null;
}

/** 22.7.2 — davr bo'yicha harakat: qaysi sababdan qancha qarz tug'ildi. */
export async function filialHarakatRoyxati(
  filialId: number,
): Promise<readonly HarakatQatori[]> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      sana: Date;
      turi: string;
      kimdan_nom: string;
      kimga_nom: string;
      summa: string;
      qolda_ozgartirildi: boolean;
      izoh: string | null;
    }[]
  >`
    SELECT h.id, h.sana, h.turi, fd.nom AS kimdan_nom, fg.nom AS kimga_nom,
           h.summa, h.qolda_ozgartirildi, h.izoh
    FROM filial_harakat h
    JOIN filial fd ON fd.id = h.kimdan_filial_id
    JOIN filial fg ON fg.id = h.kimga_filial_id
    WHERE h.kimdan_filial_id = ${filialId} OR h.kimga_filial_id = ${filialId}
    ORDER BY h.sana DESC, h.id DESC
    LIMIT 100`;

  return q.map((r) => ({
    id: r.id,
    sana: r.sana,
    turi: r.turi,
    kimdanNom: r.kimdan_nom,
    kimgaNom: r.kimga_nom,
    summa: r.summa,
    qoldaOzgartirildi: r.qolda_ozgartirildi,
    izoh: r.izoh,
  }));
}

export interface AdminKassasi {
  readonly id: number;
  readonly nom: string;
  readonly filialId: number;
  readonly filialNomi: string;
  readonly valyuta: string;
}

/** 22.6.3 — to'lovda ikkala tomon ham ADMIN kassasi bo'lishi shart. */
export async function adminKassalari(): Promise<readonly AdminKassasi[]> {
  const sql = ulanishOl();
  const q = await sql<
    {
      id: number;
      nom: string;
      filial_id: number;
      filial_nomi: string;
      valyuta: string;
    }[]
  >`
    SELECT k.id, k.nom, k.filial_id, f.nom AS filial_nomi, k.valyuta
    FROM kassa k
    JOIN filial f ON f.id = k.filial_id
    WHERE k.xodim_id IS NULL AND k.faol = true
    ORDER BY f.nom, k.nom`;

  return q.map((r) => ({
    id: r.id,
    nom: r.nom,
    filialId: r.filial_id,
    filialNomi: r.filial_nomi,
    valyuta: r.valyuta,
  }));
}

export interface FilialQatori {
  readonly id: number;
  readonly nom: string;
}

export async function faolFiliallar(): Promise<readonly FilialQatori[]> {
  const sql = ulanishOl();
  const q = await sql<{ id: number; nom: string }[]>`
    SELECT id, nom FROM filial WHERE faol = true ORDER BY nom`;
  return q.map((r): FilialQatori => ({ id: r.id, nom: r.nom }));
}

// ─── 20.2 · Filial ro'yxati va kartochkasi ────────────────────────────────

export interface FilialKorinishi {
  readonly id: number;
  readonly nom: string;
  readonly manzil: string | null;
  readonly telefon: string | null;
  readonly sotadi: boolean;
  readonly ishlabChiqaradi: boolean;
  readonly standartIshlabChiqaruvchiId: number | null;
  readonly standartNomi: string | null;
  readonly kassaYopilishSoati: string;
  readonly bosh: boolean;
  readonly faol: boolean;
}

interface FilialSatri {
  id: number;
  nom: string;
  manzil: string | null;
  telefon: string | null;
  sotadi: boolean;
  ishlab_chiqaradi: boolean;
  standart_ishlab_chiqaruvchi_id: number | null;
  standart_nomi: string | null;
  kassa_yopilish_soati: string;
  bosh: boolean;
  faol: boolean;
}

const korinishga = (f: FilialSatri): FilialKorinishi => ({
  id: f.id,
  nom: f.nom,
  manzil: f.manzil,
  telefon: f.telefon,
  sotadi: f.sotadi,
  ishlabChiqaradi: f.ishlab_chiqaradi,
  standartIshlabChiqaruvchiId: f.standart_ishlab_chiqaruvchi_id,
  standartNomi: f.standart_nomi,
  kassaYopilishSoati: f.kassa_yopilish_soati,
  bosh: f.bosh,
  faol: f.faol,
});

const FILIAL_USTUNLARI = `
  f.id, f.nom, f.manzil, f.telefon, f.sotadi, f.ishlab_chiqaradi,
  f.standart_ishlab_chiqaruvchi_id, s.nom AS standart_nomi,
  f.kassa_yopilish_soati::text AS kassa_yopilish_soati, f.bosh, f.faol`;

export async function filialRoyxati(
  /** ⚠️ `true` — faqat O'CHIRILGANLARI (qaytarish uchun) */
  ochirilganlar = false,
): Promise<readonly FilialKorinishi[]> {
  const sql = ulanishOl();
  const q = await sql<FilialSatri[]>`
    SELECT ${sql.unsafe(FILIAL_USTUNLARI)}
    FROM filial f
    LEFT JOIN filial s ON s.id = f.standart_ishlab_chiqaruvchi_id
    WHERE f.faol = ${!ochirilganlar}
    ORDER BY f.bosh DESC, f.nom`;
  return q.map(korinishga);
}

export async function filialOl(id: number): Promise<FilialKorinishi | null> {
  const sql = ulanishOl();
  const q = await sql<FilialSatri[]>`
    SELECT ${sql.unsafe(FILIAL_USTUNLARI)}
    FROM filial f
    LEFT JOIN filial s ON s.id = f.standart_ishlab_chiqaruvchi_id
    WHERE f.id = ${id}`;
  const f = q[0];
  return f === undefined ? null : korinishga(f);
}

/** 20.2 — standart ishlab chiqaruvchi bo'la oladiganlar: tikadigan va faol. */
export async function tikaOladiganFiliallar(
  oziId: number | null,
): Promise<readonly FilialQatori[]> {
  const sql = ulanishOl();
  const q = await sql<{ id: number; nom: string }[]>`
    SELECT id, nom FROM filial
    WHERE faol = true AND ishlab_chiqaradi = true
      AND (${oziId}::bigint IS NULL OR id <> ${oziId})
    ORDER BY nom`;
  return q.map((r): FilialQatori => ({ id: r.id, nom: r.nom }));
}



/** O'chirilgan filiallar soni — ro'yxatdagi havolada ko'rsatiladi */
export async function filialOchirilganSoni(): Promise<number> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM filial WHERE faol = false`;
  return q[0]?.n ?? 0;
}
