/**
 * TZ 20.2 · 20.2.1 · 20.2.2 · 20.4.1 — filial ochish va tahrirlash.
 *
 * Qoidalar `lib/domain/filial.ts` da sinalgan. Bu yerda ular BAZADA
 * ishlashi tekshiriladi: tranzaksiya, audit va tayanch bog'lanishlari.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { filialOzgartir, filialYarat } from '@/lib/amal/filial';
import { rejim } from '@/lib/domain/filial';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let tikuvchiId = 0;

const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

/** Standart sozlama — testlar faqat kerakli maydonini almashtiradi. */
const asos = (nom: string) => ({
  nom,
  manzil: null,
  telefon: null,
  sotadi: true,
  ishlabChiqaradi: true,
  standartIshlabChiqaruvchiId: null,
  kassaYopilishSoati: '20:00',
  faol: true,
});

beforeAll(async () => {
  sql = sinovUlanishi();

  // Tikadigan filial — boshqalarga standart bo'lib xizmat qiladi
  const n = await filialYarat(sql, asos(`Sinov sex ${belgi()}`), XODIM);
  tikuvchiId = n.filialId;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

// ─── 20.2.1 · To'rt rejim ─────────────────────────────────────────────────

describe("TZ 20.2.1 — rejim bayroqlardan kelib chiqadi", () => {
  it("to'liq filial: sotadi ☑ tikadi ☑", async () => {
    const n = await filialYarat(sql, asos(`To'liq ${belgi()}`), XODIM);

    const f = await sql<{ sotadi: boolean; ishlab_chiqaradi: boolean }[]>`
      SELECT sotadi, ishlab_chiqaradi FROM filial WHERE id = ${n.filialId}`;

    expect(
      rejim({
        sotadi: f[0]?.sotadi ?? false,
        ishlabChiqaradi: f[0]?.ishlab_chiqaradi ?? false,
      }),
    ).toBe('TOLIQ');
  });

  it("do'kon: sotadi ☑ tikadi ☐ — standart tikuvchi bilan", async () => {
    const n = await filialYarat(
      sql,
      {
        ...asos(`Do'kon ${belgi()}`),
        ishlabChiqaradi: false,
        standartIshlabChiqaruvchiId: tikuvchiId,
      },
      XODIM,
    );

    const f = await sql<
      { sotadi: boolean; ishlab_chiqaradi: boolean; standart: number | null }[]
    >`
      SELECT sotadi, ishlab_chiqaradi,
             standart_ishlab_chiqaruvchi_id AS standart
      FROM filial WHERE id = ${n.filialId}`;

    expect(
      rejim({
        sotadi: f[0]?.sotadi ?? false,
        ishlabChiqaradi: f[0]?.ishlab_chiqaradi ?? true,
      }),
    ).toBe('DOKON');
    expect(f[0]?.standart).toBe(tikuvchiId);
  });

  it('sex: sotadi ☐ tikadi ☑', async () => {
    const n = await filialYarat(
      sql,
      { ...asos(`Sex ${belgi()}`), sotadi: false },
      XODIM,
    );

    const f = await sql<{ sotadi: boolean; ishlab_chiqaradi: boolean }[]>`
      SELECT sotadi, ishlab_chiqaradi FROM filial WHERE id = ${n.filialId}`;

    expect(
      rejim({
        sotadi: f[0]?.sotadi ?? true,
        ishlabChiqaradi: f[0]?.ishlab_chiqaradi ?? false,
      }),
    ).toBe('SEX');
  });

  it('markaziy ombor: ikkalasi ham ☐ — standart tikuvchi bilan', async () => {
    const n = await filialYarat(
      sql,
      {
        ...asos(`Ombor ${belgi()}`),
        sotadi: false,
        ishlabChiqaradi: false,
        standartIshlabChiqaruvchiId: tikuvchiId,
      },
      XODIM,
    );

    const f = await sql<{ sotadi: boolean; ishlab_chiqaradi: boolean }[]>`
      SELECT sotadi, ishlab_chiqaradi FROM filial WHERE id = ${n.filialId}`;

    expect(
      rejim({
        sotadi: f[0]?.sotadi ?? true,
        ishlabChiqaradi: f[0]?.ishlab_chiqaradi ?? true,
      }),
    ).toBe('OMBOR');
  });
});

// ─── 20.2 · Sozlama tekshiruvi ────────────────────────────────────────────

describe('TZ 20.2 — sozlama izchilligi', () => {
  it("o'zi tikmasa standart ishlab chiqaruvchi MAJBURIY", async () => {
    await expect(
      filialYarat(
        sql,
        { ...asos(`Yetim ${belgi()}`), ishlabChiqaradi: false },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('tikmaydigan filialni standart deb ko\'rsatib bo\'lmaydi (20.4.1)', async () => {
    const dokon = await filialYarat(
      sql,
      {
        ...asos(`Boshqa do'kon ${belgi()}`),
        ishlabChiqaradi: false,
        standartIshlabChiqaruvchiId: tikuvchiId,
      },
      XODIM,
    );

    await expect(
      filialYarat(
        sql,
        {
          ...asos(`Xato do'kon ${belgi()}`),
          ishlabChiqaradi: false,
          standartIshlabChiqaruvchiId: dokon.filialId,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("filial o'ziga o'zi buyurtma yubora olmaydi", async () => {
    const n = await filialYarat(sql, asos(`Halqa ${belgi()}`), XODIM);

    await expect(
      filialOzgartir(
        sql,
        n.filialId,
        {
          ...asos(`Halqa ${belgi()}`),
          ishlabChiqaradi: false,
          standartIshlabChiqaruvchiId: n.filialId,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('2.1-invariant — rad etilgan sozlama YOZILMAYDI', async () => {
    const nom = `Rad ${belgi()}`;

    await expect(
      filialYarat(sql, { ...asos(nom), ishlabChiqaradi: false }, XODIM),
    ).rejects.toThrow();

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial WHERE nom = ${nom}`;
    expect(q[0]?.n).toBe(0);
  });
});

// ─── 20.2.2 · Bosh filial ─────────────────────────────────────────────────

describe('TZ 20.2.2 — bosh filial', () => {
  it("bosh filialni NOFAOL qilib bo'lmaydi", async () => {
    const bosh = await sql<{ id: number; nom: string }[]>`
      SELECT id, nom FROM filial WHERE bosh = true LIMIT 1`;

    const id = bosh[0]?.id;
    expect(id).toBeDefined();
    if (id === undefined) return;

    await expect(
      filialOzgartir(sql, id, { ...asos(bosh[0]?.nom ?? ''), faol: false }, XODIM),
    ).rejects.toThrow();

    const keyin = await sql<{ faol: boolean }[]>`
      SELECT faol FROM filial WHERE id = ${id}`;
    expect(keyin[0]?.faol).toBe(true);
  });

  it("yangi filial BOSH bo'lib tug'ilmaydi", async () => {
    const n = await filialYarat(sql, asos(`Oddiy ${belgi()}`), XODIM);

    const f = await sql<{ bosh: boolean }[]>`
      SELECT bosh FROM filial WHERE id = ${n.filialId}`;
    expect(f[0]?.bosh).toBe(false);
  });
});

// ─── 20.2 · Nofaol qilish va tayanch ──────────────────────────────────────

describe('TZ 20.2 — nofaol qilish', () => {
  it("filial O'CHIRILMAYDI — faol = false bo'ladi, tarixi qoladi", async () => {
    const nom = `Yopiladigan ${belgi()}`;
    const n = await filialYarat(sql, asos(nom), XODIM);

    await filialOzgartir(sql, n.filialId, { ...asos(nom), faol: false }, XODIM);

    const f = await sql<{ faol: boolean; ochirildi: Date | null }[]>`
      SELECT faol, ochirildi FROM filial WHERE id = ${n.filialId}`;
    expect(f[0]?.faol).toBe(false);
    expect(f[0]?.ochirildi).not.toBeNull();
  });

  it('unga tayanadigan filial bor bo\'lsa tikuvchilikdan chiqara olmaydi', async () => {
    const sex = await filialYarat(sql, asos(`Tayanch sex ${belgi()}`), XODIM);

    await filialYarat(
      sql,
      {
        ...asos(`Tayanuvchi ${belgi()}`),
        ishlabChiqaradi: false,
        standartIshlabChiqaruvchiId: sex.filialId,
      },
      XODIM,
    );

    await expect(
      filialOzgartir(
        sql,
        sex.filialId,
        {
          ...asos(`Tayanch sex ${belgi()}`),
          ishlabChiqaradi: false,
          standartIshlabChiqaruvchiId: tikuvchiId,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

describe('EC-FQ-04 — qarzi bor filial yopilsa (22.8)', () => {
  it("qarz bosh filialga o'tadi, juftlik nolga tushadi", async () => {
    const yopiladigan = await filialYarat(sql, asos(`Yopiladi ${belgi()}`), XODIM);
    const sherik = await filialYarat(sql, asos(`Sherik ${belgi()}`), XODIM);

    const bosh = await sql<{ id: number }[]>`
      SELECT id FROM filial WHERE bosh = true LIMIT 1`;
    const boshId = bosh[0]?.id ?? 0;

    // Yopiladigan filial sherikka 500 000 qarzdor
    await sql`
      INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                  valyuta, izoh, xodim_id)
      VALUES (${yopiladigan.filialId}, ${sherik.filialId}, 'TAYYOR_MAHSULOT',
              500000, 'SOM', 'Sinov', ${XODIM})`;

    await filialOzgartir(
      sql,
      yopiladigan.filialId,
      { ...asos(`Yopiladi ${belgi()}`), faol: false },
      XODIM,
    );

    const balans = async (a: number, b: number): Promise<number> => {
      const q = await sql<{ s: string | null }[]>`
        SELECT SUM(CASE WHEN kimdan_filial_id = ${a} THEN -summa ELSE summa END)::text AS s
        FROM filial_harakat
        WHERE (kimdan_filial_id = ${a} AND kimga_filial_id = ${b})
           OR (kimdan_filial_id = ${b} AND kimga_filial_id = ${a})`;
      return Number(q[0]?.s ?? 0);
    };

    // Yopilgan filial ↔ sherik: nol
    expect(await balans(yopiladigan.filialId, sherik.filialId)).toBe(0);
    // Sherik ↔ bosh filial: 500 000 (bosh filial endi qarzdor)
    expect(await balans(boshId, sherik.filialId)).toBe(-500_000);
  });

  it("11-invariant — yopilgan filial balansi nolga tushadi", async () => {
    const yopiladigan = await filialYarat(sql, asos(`Nol ${belgi()}`), XODIM);
    const sherik = await filialYarat(sql, asos(`Nol sherik ${belgi()}`), XODIM);

    await sql`
      INSERT INTO filial_harakat (kimdan_filial_id, kimga_filial_id, turi, summa,
                                  valyuta, izoh, xodim_id)
      VALUES (${sherik.filialId}, ${yopiladigan.filialId}, 'MATERIAL_KOCHIRISH',
              320000, 'SOM', 'Sinov', ${XODIM})`;

    await filialOzgartir(
      sql,
      yopiladigan.filialId,
      { ...asos(`Nol ${belgi()}`), faol: false },
      XODIM,
    );

    // Yopilgan filialning HAR QANDAY juftlikdagi balansi nol
    const q = await sql<{ s: string | null }[]>`
      SELECT SUM(CASE WHEN kimdan_filial_id = ${yopiladigan.filialId}
                      THEN -summa ELSE summa END)::text AS s
      FROM filial_harakat
      WHERE kimdan_filial_id = ${yopiladigan.filialId}
         OR kimga_filial_id = ${yopiladigan.filialId}`;
    expect(Number(q[0]?.s ?? 0)).toBe(0);
  });

  it("qarzsiz filial yopilsa yozuv qo'shilmaydi", async () => {
    const n = await filialYarat(sql, asos(`Qarzsiz ${belgi()}`), XODIM);

    await filialOzgartir(
      sql,
      n.filialId,
      { ...asos(`Qarzsiz ${belgi()}`), faol: false },
      XODIM,
    );

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE kimdan_filial_id = ${n.filialId} OR kimga_filial_id = ${n.filialId}`;
    expect(q[0]?.n).toBe(0);
  });
});

// ─── 2.4 · Audit ──────────────────────────────────────────────────────────

describe('TZ 2.4 — audit jurnali', () => {
  it('yaratish va tahrirlash jurnalga tushadi', async () => {
    const nom = `Audit ${belgi()}`;
    const n = await filialYarat(sql, asos(nom), XODIM);

    await filialOzgartir(
      sql,
      n.filialId,
      { ...asos(`${nom} — yangi nom`) },
      XODIM,
    );

    const a = await sql<{ amal: string }[]>`
      SELECT amal FROM audit_jurnal
      WHERE obyekt_turi = 'filial' AND obyekt_id = ${n.filialId}
      ORDER BY id`;

    expect(a.map((x) => x.amal)).toEqual(['YARATISH', 'TAHRIRLASH']);
  });
});
