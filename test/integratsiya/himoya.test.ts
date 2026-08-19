/**
 * QISM 1 §6.3, §6.5 · QISM 3 §0.3 · TZ 20.2, 20.12 · P-05, P-06, P-07, P-08
 *
 * Baza darajasidagi to'siqlar. Har test qoidani ATAYLAB buzishga urinadi —
 * urinish o'tib ketsa test yiqiladi.
 *
 * Bu qoidalar kodda emas, BAZADA turadi: kod almashsa ham, qo'lda SQL
 * yozilsa ham ular kuchda qoladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

beforeAll(() => {
  sql = sinovUlanishi();
});

afterAll(async () => {
  await sql.end();
});

/** Amal RAD ETILISHI shart. O'tib ketsa test yiqiladi. */
async function radEtilsin(ish: () => Promise<unknown>): Promise<void> {
  await expect(ish()).rejects.toThrow();
}

describe('TZ 20.2.2 — bosh filial faqat bitta', () => {
  it('ikkinchi bosh filial rad etiladi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
        VALUES ('Ikkinchi bosh', true, true, true, 1)`,
    );
  });
});

describe('TZ 20.2 — tikmaydigan filialga ishlab chiqaruvchi majburiy', () => {
  it("ishlab chiqaruvchisiz do'kon rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
        VALUES ('Sinov do''kon', true, false, false, 1)`,
    );
  });

  it("o'ziga o'zi yuboradigan filial rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO filial (id, nom, sotadi, ishlab_chiqaradi, bosh,
                            standart_ishlab_chiqaruvchi_id, yaratdi_id)
        VALUES (9500, 'Halqa', true, false, false, 9500, 1)`,
    );
  });
});

describe('P-08 — tizimli rol kodi', () => {
  it('kodsiz tizimli rol rad etiladi', async () => {
    await radEtilsin(
      () => sql`INSERT INTO rol (nom, tizimli, yaratdi_id) VALUES ('Sinov yomon', true, 1)`,
    );
  });

  it('kodli oddiy rol rad etiladi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO rol (nom, kod, tizimli, yaratdi_id)
        VALUES ('Sinov yomon 2', 'SINOV_KOD', false, 1)`,
    );
  });
});

describe('TZ 20.12 — qamrov ikki qiymatdan biri', () => {
  it("noto'g'ri qamrov rad etiladi", async () => {
    const rol = await sql<{ id: number }[]>`SELECT id FROM rol WHERE kod = 'ADMIN'`;
    const rolId = rol[0]?.id;
    expect(rolId).toBeDefined();
    await radEtilsin(
      () => sql`
        INSERT INTO rol_ruxsat (rol_id, ruxsat_kod, qamrov, yaratdi_id)
        VALUES (${rolId ?? 0}, 'sozlama.kor', 'HAMMASI', 1)
        ON CONFLICT (rol_id, ruxsat_kod) DO UPDATE SET qamrov = 'HAMMASI'`,
    );
  });
});

describe('P-06 · QISM 1 §6.5 — audit jurnali o\'zgarmas', () => {
  const BELGI = 'integratsiya-sinovi';

  beforeAll(async () => {
    await sql`
      INSERT INTO audit_jurnal (xodim_id, amal, obyekt_turi, obyekt_id, izoh)
      VALUES (1, 'QOLDA_TUZATISH', ${BELGI}, 1, 'asl yozuv')`;
  });

  it('UPDATE rad etiladi — admin ham tuzata olmaydi', async () => {
    await radEtilsin(
      () => sql`UPDATE audit_jurnal SET izoh = 'soxta' WHERE obyekt_turi = ${BELGI}`,
    );
  });

  it('DELETE rad etiladi', async () => {
    await radEtilsin(() => sql`DELETE FROM audit_jurnal WHERE obyekt_turi = ${BELGI}`);
  });

  it('asl yozuv joyida qoladi', async () => {
    const q = await sql<{ izoh: string }[]>`
      SELECT izoh FROM audit_jurnal WHERE obyekt_turi = ${BELGI} ORDER BY id DESC LIMIT 1`;
    expect(q[0]?.izoh).toBe('asl yozuv');
  });
});

describe('QISM 1 §6.3 — ON DELETE CASCADE taqiqlanadi', () => {
  it('birorta tashqi kalitda kaskad yo\'q — pul va ombor tarixi yo\'qolmaydi', async () => {
    const q = await sql<{ conname: string }[]>`
      SELECT conname FROM pg_constraint
      WHERE contype = 'f' AND confdeltype <> 'a'
        AND connamespace = 'public'::regnamespace`;
    expect(q.map((r) => r.conname)).toEqual([]);
  });
});

describe('P-07 — halqali tashqi kalitlar DEFERRABLE', () => {
  it("filial va xodim bir-birisiz mavjud bo'la olmaydi, bitta tranzaksiyada yoziladi", async () => {
    await sql.begin(async (tx) => {
      await tx`SET CONSTRAINTS ALL DEFERRED`;
      await tx`
        INSERT INTO filial (id, nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
        VALUES (9600, 'Halqa sinovi', true, true, false, 9601)`;
      await tx`
        INSERT INTO xodim (id, filial_id, ism, telefon, yaratdi_id)
        VALUES (9601, 9600, 'Halqa xodimi', '998900009601', 9601)`;
    });

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial WHERE id = 9600`;
    expect(q[0]?.n).toBe(1);
  });

  it('tranzaksiyasiz halqa yozib bo\'lmaydi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO filial (id, nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
        VALUES (9700, 'Yolg''iz', true, true, false, 9799)`,
    );
  });
});

describe('P-05 · TZ 10.3 — xodimda bir nechta rol', () => {
  it('bitta xodimga ikki rol beriladi', async () => {
    const rollar = await sql<{ id: number }[]>`
      SELECT id FROM rol WHERE kod IN ('ADMIN', 'OMBORCHI') ORDER BY kod`;
    expect(rollar).toHaveLength(2);

    for (const r of rollar) {
      await sql`
        INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
        VALUES (9601, ${r.id}, 1) ON CONFLICT DO NOTHING`;
    }

    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xodim_rol WHERE xodim_id = 9601`;
    expect(n[0]?.n).toBe(2);
  });
});

describe('QISM 3 §13 — 1-bosqich jadvallari', () => {
  it('11 ta asos va tizim jadvali bor', async () => {
    const q = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`;
    expect(q.map((r) => r.table_name)).toEqual([
      'amal_kaliti',
      'audit_jurnal',
      'filial',
      'kurs_tarix',
      'rol',
      'rol_ruxsat',
      'ruxsat',
      'sessiya',
      'sozlama',
      'xodim',
      'xodim_rol',
    ]);
  });
});
