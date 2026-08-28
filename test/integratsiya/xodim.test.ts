/**
 * TZ 10.2 · 10.3 · §8 — xodim qo'shish.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * 2026-08-28 auditida chiqdi: xodim qo'shish tizimda UMUMAN yo'q
 * edi. Bazadagi 5 ta xodim urug'dan kelgan. Yangi sotuvchi ishga
 * olinsa uni tizimga kiritib bo'lmasdi.
 *
 * Eng muhim tekshiruv oxirida: yangi xodim HAQIQATAN tizimga kira
 * oladimi. Xodim yaratilib, paroli ishlamasa — bu ish qilinmagan
 * bilan barobar.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { xodimTahrirla, xodimYarat } from '@/lib/amal/xodim';
import { parolTogrimi } from '@/lib/kirish/parol';
import { telefonKanonik } from '@/lib/domain/telefon';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

const XODIM = 1;
let FILIAL = 1;
let sotuvchiRolId = 0;
let ustaRolId = 0;

const belgi = String(Date.now()).slice(-8);

let hisoblagich = 0;

/**
 * ⚠️ Telefon NOYOB bo'lishi SHART — u kirish nomi. Har testga
 *    o'ziniki kerak, aks holda ikkinchi test birinchisi tufayli
 *    yiqilardi.
 *
 *    9 xona: `9` + vaqtdan 6 xona + hisoblagichdan 2 xona.
 */
const telefon = (): string => {
  hisoblagich += 1;
  return `9${belgi.slice(-6)}${String(hisoblagich).padStart(2, '0')}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();

  const f = await sql<{ id: number }[]>`
    SELECT id FROM filial WHERE faol = true ORDER BY bosh DESC LIMIT 1`;
  FILIAL = f[0]?.id ?? 1;

  const r = await sql<{ id: number; kod: string }[]>`
    SELECT id, kod FROM rol WHERE kod IN ('SOTUVCHI', 'USTA')`;
  sotuvchiRolId = r.find((x) => x.kod === 'SOTUVCHI')?.id ?? 0;
  ustaRolId = r.find((x) => x.kod === 'USTA')?.id ?? 0;
}, 120_000);

afterAll(async () => {
  /** ⚠️ O'chirilmaydi — nofaol qilinadi (§3) */
  await sql`UPDATE xodim SET faol = false WHERE ism LIKE ${`XOD-${belgi}%`}`;
  await sql.end();
});

const asos = (o: Partial<Parameters<typeof xodimYarat>[1]> = {}) => ({
  ism: `XOD-${belgi} sinov`,
  telefon: telefon(),
  filialId: FILIAL,
  rolIdlar: [sotuvchiRolId],
  parol: undefined,
  ishgaKirdi: undefined,
  ...o,
});

describe('TZ 10.2 — xodim yaratiladi', () => {
  it('xodim va uning roli birga yoziladi', async () => {
    const n = await xodimYarat(sql, asos(), XODIM);

    expect(n.id).toBeGreaterThan(0);

    const r = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xodim_rol WHERE xodim_id = ${n.id}`;
    expect(r[0]?.n).toBe(1);
  });

  it('TZ 10.3 — bir nechta rol berilishi mumkin', async () => {
    const n = await xodimYarat(
      sql,
      asos({ rolIdlar: [sotuvchiRolId, ustaRolId] }),
      XODIM,
    );

    const r = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xodim_rol WHERE xodim_id = ${n.id}`;
    expect(r[0]?.n).toBe(2);
  });

  it('telefon kanonik ko‘rinishda saqlanadi', async () => {
    const xom = telefon();
    const n = await xodimYarat(sql, asos({ telefon: xom }), XODIM);

    const q = await sql<{ telefon: string }[]>`
      SELECT telefon FROM xodim WHERE id = ${n.id}`;
    expect(q[0]?.telefon).toBe(telefonKanonik(xom));
  });

  it('parolsiz xodim yaratiladi — usta botdan ishlaydi (Q-04)', async () => {
    const n = await xodimYarat(sql, asos({ rolIdlar: [ustaRolId] }), XODIM);

    const q = await sql<{ parol_hash: string | null }[]>`
      SELECT parol_hash FROM xodim WHERE id = ${n.id}`;
    expect(q[0]?.parol_hash).toBeNull();
  });
});

describe('§8 — parol', () => {
  it('YANGI XODIM HAQIQATAN TIZIMGA KIRA OLADI', async () => {
    /**
     * ⚠️ Eng muhim test. Xodim yaratilib paroli ishlamasa, bu ish
     *    qilinmagan bilan barobar: odam ishga olinadi, lekin
     *    tizimga kira olmaydi.
     */
    const parol = 'Sinov-Parol-2026';
    const n = await xodimYarat(sql, asos({ parol }), XODIM);

    const q = await sql<{ parol_hash: string }[]>`
      SELECT parol_hash FROM xodim WHERE id = ${n.id}`;

    const hash = q[0]?.parol_hash ?? '';
    expect(hash).not.toBe('');
    /** ⚠️ Parol OCHIQ saqlanmaydi */
    expect(hash).not.toContain(parol);
    expect(hash.startsWith('$argon2id$')).toBe(true);

    await expect(parolTogrimi(hash, parol)).resolves.toBe(true);
    await expect(parolTogrimi(hash, 'boshqa-parol')).resolves.toBe(false);
  });

  it("tahrirlashda parol bo'sh qolsa ESKISI saqlanadi", async () => {
    const parol = 'Birinchi-Parol-2026';
    const n = await xodimYarat(sql, asos({ parol }), XODIM);

    const oldin = await sql<{ parol_hash: string }[]>`
      SELECT parol_hash FROM xodim WHERE id = ${n.id}`;

    await xodimTahrirla(
      sql,
      n.id,
      {
        ism: `XOD-${belgi} yangilangan`,
        telefon: telefon(),
        filialId: FILIAL,
        rolIdlar: [sotuvchiRolId],
        parol: undefined,
        ishgaKirdi: undefined,
      },
      XODIM,
    );

    const keyin = await sql<{ parol_hash: string }[]>`
      SELECT parol_hash FROM xodim WHERE id = ${n.id}`;

    expect(keyin[0]?.parol_hash).toBe(oldin[0]?.parol_hash);
    await expect(parolTogrimi(keyin[0]?.parol_hash ?? '', parol)).resolves.toBe(true);
  });

  it('yangi parol berilsa eskisi ishlamaydi', async () => {
    const n = await xodimYarat(sql, asos({ parol: 'Eski-Parol-2026' }), XODIM);

    await xodimTahrirla(
      sql,
      n.id,
      {
        ism: `XOD-${belgi} parol`,
        telefon: telefon(),
        filialId: FILIAL,
        rolIdlar: [sotuvchiRolId],
        parol: 'Yangi-Parol-2026',
        ishgaKirdi: undefined,
      },
      XODIM,
    );

    const q = await sql<{ parol_hash: string }[]>`
      SELECT parol_hash FROM xodim WHERE id = ${n.id}`;

    await expect(parolTogrimi(q[0]?.parol_hash ?? '', 'Yangi-Parol-2026')).resolves.toBe(
      true,
    );
    await expect(parolTogrimi(q[0]?.parol_hash ?? '', 'Eski-Parol-2026')).resolves.toBe(
      false,
    );
  });
});

describe('Takrorlanish to‘siladi', () => {
  it('bir telefon ikki xodimda bo‘lmaydi', async () => {
    const raqam = telefon();
    await xodimYarat(sql, asos({ telefon: raqam }), XODIM);

    /**
     * ⚠️ Telefon — kirish nomi. Ikkita xodimda bir raqam bo'lsa
     *    kim kirganini aniqlab bo'lmasdi.
     */
    await expect(
      xodimYarat(sql, asos({ telefon: raqam }), XODIM),
    ).rejects.toBeInstanceOf(BiznesXato);
  });

  it('mavjud bo‘lmagan rol rad etiladi', async () => {
    await expect(
      xodimYarat(sql, asos({ rolIdlar: [2_000_000_000] }), XODIM),
    ).rejects.toBeInstanceOf(BiznesXato);
  });

  it('rol yaratilmasa xodim ham yaratilmaydi (2.1-invariant)', async () => {
    const ism = `XOD-${belgi} yarim`;

    await expect(
      xodimYarat(sql, asos({ ism, rolIdlar: [2_000_000_000] }), XODIM),
    ).rejects.toThrow();

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xodim WHERE ism = ${ism}`;
    expect(q[0]?.n).toBe(0);
  });
});
