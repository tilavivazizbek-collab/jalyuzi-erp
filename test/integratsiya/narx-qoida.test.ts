/**
 * test/integratsiya/narx-qoida.test.ts — Egasi qarori 2026-09-20 · TZ 3.8
 *
 * ⚠️ NEGA HAQIQIY BAZADA
 *
 *    `turNarxiniSaqla` ikkita `ON CONFLICT` ishlatadi va ikkalasi ham
 *    IFODA ustidagi noyob indeksga tayanadi:
 *
 *        narx_guruh               lower(btrim(nom))
 *        mahsulot_narx            coalesce(mijoz_turi_id, 0) …
 *
 *    Bunday `ON CONFLICT` ni na `tsc`, na sof funksiya testi ko'radi —
 *    indeks nomi mos kelmasa Postgres ishga tushgandagina aytadi.
 *    Ikkinchi marta saqlaganda «duplicate key» chiqishi eng ehtimolli
 *    xato edi, shuning uchun u alohida sinaladi.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  narxGuruhTezYarat,
  turNarxiniSaqla,
  type NarxSaqlashNatijasi,
} from '@/lib/amal/narx-qoida';
import type { TurNarxiKirimi } from '@/lib/sxema/narx-qoida';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let turId: number;
let oddiyId: number;
let premiumId: number;

/** ⚠️ Har yurishda YANGI nom — qat'iy nom ikkinchi yurishda dublikat berardi (T-06) */
const belgi = `sinov-${String(Date.now())}`;

async function saqla(kirim: TurNarxiKirimi): Promise<NarxSaqlashNatijasi> {
  return sql.begin(async (tx) => turNarxiniSaqla(tx, kirim, 1));
}

/** Nuqsonlarni tekshirish uchun — `SAQLANDI` holatida `xabarlar` yo'q */
const xabarlari = (n: NarxSaqlashNatijasi): readonly string[] =>
  n.holat === 'NUQSON' ? n.xabarlar : [];

beforeAll(async () => {
  sql = sinovUlanishi();

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`Narx sinovi ${belgi}`}, 1)
    RETURNING id`;
  const tid = t[0]?.id;
  if (tid === undefined) throw new Error('mahsulot turi yaratilmadi');
  turId = tid;

  oddiyId = (await narxGuruhTezYarat(sql, `Oddiy ${belgi}`, 1)).id;
  premiumId = (await narxGuruhTezYarat(sql, `Premium ${belgi}`, 1)).id;
});

afterAll(async () => {
  await sql.end();
});

/** Egasi bergan jadval: 8 $ · 5 $ · 3 $ */
const EGASI = [
  { dan: 0, gacha: 0.5, narx: '8', valyuta: 'USD' as const },
  { dan: 0.5, gacha: 1, narx: '5', valyuta: 'USD' as const },
  { dan: 1, gacha: null, narx: '3', valyuta: 'USD' as const },
];

describe('narx guruhi — mato darajasi', () => {
  it('bir xil nom qayta yozilsa YANGI qator yasalmaydi', async () => {
    const a = await narxGuruhTezYarat(sql, `Oddiy ${belgi}`, 1);
    expect(a.id).toBe(oddiyId);
  });

  it('bosh va katta harf farqi dublikat yasamaydi', async () => {
    const a = await narxGuruhTezYarat(sql, `  ODDIY ${belgi.toUpperCase()}  `, 1);
    // `lower(btrim(nom))` indeksi tufayli shu qatorga tushadi
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM narx_guruh
      WHERE lower(btrim(nom)) = lower(${`Oddiy ${belgi}`})`;
    expect(q[0]?.n).toBe(1);
    expect(a.id).toBe(oddiyId);
  });

  it("nofaol qilingan daraja TIRILADI, yangisi yasalmaydi", async () => {
    await sql`UPDATE narx_guruh SET faol = false WHERE id = ${premiumId}`;
    const a = await narxGuruhTezYarat(sql, `Premium ${belgi}`, 1);
    expect(a.id).toBe(premiumId);

    const q = await sql<{ faol: boolean }[]>`SELECT faol FROM narx_guruh WHERE id = ${premiumId}`;
    expect(q[0]?.faol).toBe(true);
  });

  it("bo'sh nom rad etiladi", async () => {
    await expect(narxGuruhTezYarat(sql, '   ', 1)).rejects.toThrow();
  });
});

describe('tur narxini saqlash', () => {
  it('qoida, bosqich va qo‘shimcha birga yoziladi', async () => {
    const n = await saqla({
      mahsulotTurId: turId,
      qoidalar: [
        { narxGuruhId: oddiyId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar: EGASI },
      ],
      qoshimchalar: [
        {
          nom: 'Usti shabalik',
          hisoblashUsuli: 'ENI',
          narx: '80000',
          valyuta: 'SOM',
          materialId: null,
          almashtirishGuruhId: null,
          formula: null,
        },
      ],
    });
    expect(n.holat).toBe('SAQLANDI');

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_narx
      WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(q[0]?.n).toBe(1);

    const b = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_narx_bosqich bs
      JOIN mahsulot_narx mn ON mn.id = bs.mahsulot_narx_id
      WHERE mn.mahsulot_tur_id = ${turId} AND bs.faol = true`;
    expect(b[0]?.n).toBe(3);

    const k = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_qoshimcha
      WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(k[0]?.n).toBe(1);
  });

  /**
   * ⚠️ ENG EHTIMOLLI XATO. `mahsulot_narx_bitta` noyob indeksi nofaol
   *    qatorni ham qamrab oladi, shuning uchun ikkinchi saqlash
   *    `ON CONFLICT` siz «duplicate key» bilan yiqilardi.
   */
  it('IKKINCHI marta saqlash dublikat bermaydi — eski qator tiriladi', async () => {
    const n = await saqla({
      mahsulotTurId: turId,
      qoidalar: [
        { narxGuruhId: oddiyId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar: EGASI },
        { narxGuruhId: premiumId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar: [
          { dan: 0, gacha: 1, narx: '12', valyuta: 'USD' },
          { dan: 1, gacha: null, narx: '6', valyuta: 'USD' },
        ] },
      ],
      qoshimchalar: [],
    });
    expect(n.holat).toBe('SAQLANDI');

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_narx
      WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(q[0]?.n).toBe(2);

    // Eski bosqichlar nofaol bo'ldi, yangilari yozildi
    const faol = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_narx_bosqich bs
      JOIN mahsulot_narx mn ON mn.id = bs.mahsulot_narx_id
      WHERE mn.mahsulot_tur_id = ${turId} AND bs.faol = true`;
    expect(faol[0]?.n).toBe(5); // 3 + 2

    // Eski qo'shimcha nofaol bo'ldi, lekin O'CHIRILMADI (2.1-invariant)
    const eski = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_qoshimcha
      WHERE mahsulot_tur_id = ${turId} AND faol = false`;
    expect(eski[0]?.n).toBe(1);
  });

  /**
   * ⚠️ BU TEST 2026-09-21 DA QAYTA YOZILDI.
   *
   *    Ilgari u shuni tasdiqlardi: bir xil qamrovli ikki qoida
   *    kelsa, ikkinchisi birinchisi ustiga yoziladi va amal
   *    `SAQLANDI` qaytaradi. «Dublikat yasalmaydi» deb.
   *
   *    Bu XULQ NOTO'G'RI edi. Egasi bir darajaga ikki xil narx
   *    kiritsa — masalan optomchiga boshqa summa — bittasi
   *    JIMGINA yo'qolardi. Hech qanday xabar yo'q, hech qanday iz
   *    yo'q: u ikki narx qo'yganiga ishonib turaverardi.
   *
   *    Endi amal buni NUQSON deb rad etadi va sababini aytadi.
   *    Ekran ham shu tekshiruvni takrorlaydi (`forma.tsx`) —
   *    lekin brauzerga ishonilmaydi (§16), shuning uchun haqiqiy
   *    to'siq shu yerda.
   *
   *    Bir darajaga bir necha qoida qo'yish endi MUMKIN — lekin
   *    ular mijoz turi yoki filiali bilan FARQ QILISHI shart.
   *    Buni keyingi test tekshiradi.
   */
  it('bir xil qamrovli ikkita qoida RAD ETILADI', async () => {
    /**
     * ⚠️ OLDINGI HOLAT OLINADI, «nol qator» deb tekshirilmaydi:
     *    bu fayldagi testlar bitta `turId` ni baham ko'radi va
     *    oldingi test qoldirgan qator bu yerda ham turadi.
     *    Tekshirilayotgani — rad etilgan saqlash HECH NARSANI
     *    o'zgartirmagani (2.1-invariant), ya'ni yarim saqlash yo'q.
     */
    const oldin = await sql<{ n: number; usullar: string }[]>`
      SELECT COUNT(*)::int AS n,
             COALESCE(string_agg(hisoblash_usuli, ',' ORDER BY id), '') AS usullar
        FROM mahsulot_narx
       WHERE mahsulot_tur_id = ${turId} AND narx_guruh_id = ${oddiyId} AND faol = true`;

    const n = await saqla({
      mahsulotTurId: turId,
      qoidalar: [
        { narxGuruhId: oddiyId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar: EGASI },
        { narxGuruhId: oddiyId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'ENI', bosqichlar: EGASI },
      ],
      qoshimchalar: [],
    });

    expect(n.holat).toBe('NUQSON');
    expect(xabarlari(n).join(' ')).toContain('ikki marta');

    /** ⚠️ Yarim saqlash YO'Q — baza rad etishdan OLDINGIDEK qoldi */
    const keyin = await sql<{ n: number; usullar: string }[]>`
      SELECT COUNT(*)::int AS n,
             COALESCE(string_agg(hisoblash_usuli, ',' ORDER BY id), '') AS usullar
        FROM mahsulot_narx
       WHERE mahsulot_tur_id = ${turId} AND narx_guruh_id = ${oddiyId} AND faol = true`;

    expect(keyin[0]?.n).toBe(oldin[0]?.n);
    expect(keyin[0]?.usullar).toBe(oldin[0]?.usullar);
  });

  /**
   * TZ 6.2 · 20.9 — bir daraja, TURLI QAMROV.
   *
   * ⚠️ Bu 2026-09-21 gacha EKRANDAN qilib bo'lmasdi: «+ daraja
   *    qo'shish» ro'yxati allaqachon ishlatilgan darajani
   *    ko'rsatmasdi. Ya'ni mijoz turi va filial dropdownlari bor
   *    edi, lekin ulardan foydalanib bo'lmasdi — TZ ning ikki
   *    bandi yarim qurilgan holda qolgan edi.
   */
  it('bir darajaga TURLI mijoz turi bilan ikki qoida saqlanadi', async () => {
    const mijozTuri = await sql<{ id: number }[]>`
      INSERT INTO mijoz_turi (nom, yaratdi_id)
      VALUES (${`Optom ${belgi}`}, 1)
      RETURNING id`;
    const optomId = mijozTuri[0]?.id ?? 0;

    const n = await saqla({
      mahsulotTurId: turId,
      qoidalar: [
        { narxGuruhId: oddiyId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar: EGASI },
        { narxGuruhId: oddiyId, mijozTuriId: optomId, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar: EGASI },
      ],
      qoshimchalar: [],
    });

    expect(n.holat).toBe('SAQLANDI');

    const q = await sql<{ mijoz_turi_id: number | null }[]>`
      SELECT mijoz_turi_id FROM mahsulot_narx
      WHERE mahsulot_tur_id = ${turId} AND narx_guruh_id = ${oddiyId} AND faol = true
      ORDER BY mijoz_turi_id NULLS FIRST`;

    expect(q).toHaveLength(2);
    expect(q[0]?.mijoz_turi_id).toBeNull();
    expect(q[1]?.mijoz_turi_id).toBe(optomId);
  });
});

describe('nuqsonlar saqlashni TO‘XTATADI', () => {
  const nuqsonli = async (bosqichlar: typeof EGASI): Promise<readonly string[]> => {
    const n = await saqla({
      mahsulotTurId: turId,
      qoidalar: [{ narxGuruhId: oddiyId, mijozTuriId: null, filialId: null, hisoblashUsuli: 'MAYDON', bosqichlar }],
      qoshimchalar: [],
    });
    expect(n.holat).toBe('NUQSON');
    return xabarlari(n);
  };

  it("bo'shliq — o'sha oraliqqa narx yo'q", async () => {
    const x = await nuqsonli([
      { dan: 0, gacha: 0.5, narx: '8', valyuta: 'USD' },
      { dan: 1, gacha: null, narx: '3', valyuta: 'USD' },
    ]);
    expect(x.join(' ')).toContain("oralig'iga narx qo'yilmagan");
  });

  it('oxirgi bosqich cheksiz emas — katta buyurtmaga narx yo‘q', async () => {
    const x = await nuqsonli([{ dan: 0, gacha: 5, narx: '8', valyuta: 'USD' }]);
    expect(x.join(' ')).toContain("undan kattasiga narx yo'q");
  });

  it('noldan boshlanmaydi — kichik o‘lchamga narx yo‘q', async () => {
    const x = await nuqsonli([{ dan: 0.5, gacha: null, narx: '8', valyuta: 'USD' }]);
    expect(x.join(' ')).toContain("undan kichigiga narx yo'q");
  });

  it('nuqson bo‘lsa bazaga HECH NARSA yozilmaydi', async () => {
    const oldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_narx_bosqich bs
      JOIN mahsulot_narx mn ON mn.id = bs.mahsulot_narx_id
      WHERE mn.mahsulot_tur_id = ${turId} AND bs.faol = true`;

    await nuqsonli([{ dan: 0, gacha: 5, narx: '8', valyuta: 'USD' }]);

    const keyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_narx_bosqich bs
      JOIN mahsulot_narx mn ON mn.id = bs.mahsulot_narx_id
      WHERE mn.mahsulot_tur_id = ${turId} AND bs.faol = true`;
    expect(keyin[0]?.n).toBe(oldin[0]?.n);
  });

  it("qo'shimchaning buzuq formulasi ham to'xtatadi", async () => {
    const n = await saqla({
      mahsulotTurId: turId,
      qoidalar: [],
      qoshimchalar: [
        {
          nom: 'Buzuq',
          hisoblashUsuli: 'QATIY',
          narx: '1000',
          valyuta: 'SOM',
          materialId: null,
          almashtirishGuruhId: null,
          formula: 'ENI * * 2',
        },
      ],
    });
    expect(n.holat).toBe('NUQSON');
    expect(xabarlari(n).join(' ')).toContain('sarf formulasida xato');
  });
});
