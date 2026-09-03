/**
 * lib/amal/mijoz-turi.ts — TZ 6.2 · 14.9 · 2.1-invariant
 *
 * Mijoz turlari spravochnigi: qo'shish · tahrirlash · nofaol
 * qilish. O'chirish YO'Q — o'tgan buyurtmalar shu turga tayanadi.
 */

import type postgres from 'postgres';
import type { MijozTuriKirimi } from '@/lib/sxema/mijoz-turi';
import { BiznesXato } from '@/lib/xato';

async function nomBandmi(
  tx: postgres.TransactionSql,
  nom: string,
  ozId: number | null,
): Promise<'BOSH' | 'FAOL' | 'OCHIRILGAN'> {
  const q = await tx<{ faol: boolean }[]>`
    SELECT faol FROM mijoz_turi
    WHERE lower(btrim(nom)) = lower(btrim(${nom}))
      AND (${ozId}::bigint IS NULL OR id <> ${ozId})
    LIMIT 1`;

  const b = q[0];
  if (b === undefined) return 'BOSH';
  return b.faol ? 'FAOL' : 'OCHIRILGAN';
}

function nomniTekshir(band: 'BOSH' | 'FAOL' | 'OCHIRILGAN', nom: string): void {
  if (band === 'FAOL') {
    throw new BiznesXato('MIJOZ_GURUH_BOR', `«${nom}» nomli tur allaqachon bor`);
  }
  if (band === 'OCHIRILGAN') {
    throw new BiznesXato(
      'OCHIRILGANDA_BAND',
      `«${nom}» nomli tur o'chirilgan. Uni «O'chirilganlar» dan qaytaring ` +
        `yoki boshqa nom tanlang.`,
    );
  }
}

export async function mijozTuriYarat(
  ulanish: postgres.Sql,
  kirim: MijozTuriKirimi,
  xodimId: number,
): Promise<{ readonly id: number; readonly nom: string }> {
  return ulanish.begin(async (tx) => {
    nomniTekshir(await nomBandmi(tx, kirim.nom, null), kirim.nom);

    const q = await tx<{ id: number }[]>`
      INSERT INTO mijoz_turi (nom, soliq_kerak, tartib, yaratdi_id)
      VALUES (${kirim.nom}, ${kirim.soliqKerak}, ${kirim.tartib}, ${xodimId})
      RETURNING id`;

    const id = q[0]?.id;
    if (id === undefined) throw new BiznesXato('SAQLANMADI', 'Mijoz turi saqlanmadi');
    return { id, nom: kirim.nom };
  });
}

export async function mijozTuriTahrirla(
  ulanish: postgres.Sql,
  turId: number,
  kirim: MijozTuriKirimi,
  xodimId: number,
): Promise<void> {
  return ulanish.begin(async (tx) => {
    const bor = await tx<{ id: number }[]>`
      SELECT id FROM mijoz_turi WHERE id = ${turId}`;
    if (bor[0] === undefined) {
      throw new BiznesXato('MIJOZ_GURUH_TOPILMADI', String(turId));
    }

    nomniTekshir(await nomBandmi(tx, kirim.nom, turId), kirim.nom);

    await tx`
      UPDATE mijoz_turi
      SET nom = ${kirim.nom},
          soliq_kerak = ${kirim.soliqKerak},
          tartib = ${kirim.tartib},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${turId}`;

    /**
     * ⚠️ `mijoz.shaxs_turi` TURDAN yangilanadi.
     *
     *    Bazadagi `mijoz_yuridik_toliq` cheklovi shu ustunga
     *    tayanadi: u INN siz yuridik mijoz yozilishini to'sadi.
     *    Tur «soliq kerak» ga o'zgarsa, ustun ham ergashishi
     *    shart — aks holda ikkalasi chalkashib ketardi.
     *
     * ⚠️ Faqat soliq maydonlari TO'LIQ mijozlar ko'chiriladi.
     *    Aks holda `UPDATE` cheklovga urilib, butun tahrirlash
     *    yiqilardi va egasi sababini tushunmasdi.
     */
    if (kirim.soliqKerak) {
      await tx`
        UPDATE mijoz SET shaxs_turi = 'YURIDIK'
        WHERE mijoz_turi_id = ${turId} AND shaxs_turi <> 'YURIDIK'
          AND tashkilot_nomi IS NOT NULL AND inn IS NOT NULL
          AND yuridik_manzil IS NOT NULL`;
    } else {
      await tx`
        UPDATE mijoz SET shaxs_turi = 'JISMONIY'
        WHERE mijoz_turi_id = ${turId} AND shaxs_turi <> 'JISMONIY'`;
    }
  });
}

export interface MijozTuriQatori {
  readonly id: number;
  readonly nom: string;
  readonly soliqKerak: boolean;
  readonly tartib: number;
  readonly faol: boolean;
  /** Nechta mijoz shu turda — nofaol qilishdan oldin ko'rinadi */
  readonly mijozSoni: number;
  /** Nechta materialda shu tur uchun narx qo'yilgan */
  readonly narxSoni: number;
}

export async function mijozTuriRoyxati(
  soruvchi: postgres.Sql,
  ochirilganlar = false,
): Promise<readonly MijozTuriQatori[]> {
  const q = await soruvchi<
    {
      id: number;
      nom: string;
      soliq_kerak: boolean;
      tartib: number;
      faol: boolean;
      mijoz_soni: number;
      narx_soni: number;
    }[]
  >`
    SELECT t.id, t.nom, t.soliq_kerak, t.tartib, t.faol,
           (SELECT COUNT(*)::int FROM mijoz m
            WHERE m.mijoz_turi_id = t.id AND m.faol) AS mijoz_soni,
           (SELECT COUNT(*)::int FROM material_tur_narx n
            WHERE n.mijoz_turi_id = t.id) AS narx_soni
    FROM mijoz_turi t
    WHERE t.faol = ${!ochirilganlar}
    ORDER BY t.tartib, t.nom`;

  return q.map((x) => ({
    id: x.id,
    nom: x.nom,
    soliqKerak: x.soliq_kerak,
    tartib: x.tartib,
    faol: x.faol,
    mijozSoni: x.mijoz_soni,
    narxSoni: x.narx_soni,
  }));
}

export interface TurTanlovi {
  readonly id: number;
  readonly nom: string;
  readonly soliqKerak: boolean;
}

/** Faol turlar — mijoz kartochkasi va material formasi uchun */
export async function faolTurlar(soruvchi: postgres.Sql): Promise<readonly TurTanlovi[]> {
  const q = await soruvchi<{ id: number; nom: string; soliq_kerak: boolean }[]>`
    SELECT id, nom, soliq_kerak FROM mijoz_turi
    WHERE faol = true ORDER BY tartib, nom`;

  return q.map((x) => ({ id: x.id, nom: x.nom, soliqKerak: x.soliq_kerak }));
}

export async function mijozTuriOchirilganSoni(soruvchi: postgres.Sql): Promise<number> {
  const q = await soruvchi<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM mijoz_turi WHERE faol = false`;
  return q[0]?.n ?? 0;
}
