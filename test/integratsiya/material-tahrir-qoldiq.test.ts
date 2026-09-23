/**
 * MATERIALNI TAHRIRLASH — omborda qoldiq bor (2026-09-23).
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    Egasi: «mahsulotni tahrirlamoqchi bo'lsam "Omborda 2 ta bo'lak
 *    bor — hisob turi va birliklarni o'zgartirib bo'lmaydi" degan
 *    xatolik chiqayapti».
 *
 *    Sabab: `koeffitsient` ustuni `numeric(10,4)` va postgres.js uni
 *    MATN qilib qaytaradi — «1.0000». Forma esa «1» yuboradi.
 *    Solishtiruv matn bo'yicha edi va «1.0000» ≠ «1» chiqardi, ya'ni
 *    koeffitsient tegilmagan bo'lsa ham «o'zgardi» deb hisoblanardi.
 *
 *    Natija: omborda qoldig'i bor HAR QANDAY materialni tahrirlab
 *    bo'lmasdi — hatto nomini o'zgartirish ham rad etilardi.
 *
 * ⚠️ BU XATONI BIRLIK TESTI USHLAY OLMASDI: u faqat bazadan kelgan
 *    MATN SHAKLI bilan ko'rinadi. Shuning uchun test bazaga ulanadi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { materialTahrirla } from '@/lib/amal/material';
import { materialSxema, type MaterialKirimi } from '@/lib/sxema/material';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let materialId = 0;

const XODIM = 1;
const FILIAL = 1;
const belgi = `MTQ-${String(Date.now()).slice(-8)}`;

/**
 * Formadan keladigan shakl: koeffitsient «1», «1.0000» EMAS.
 *
 * ⚠️ Sxemadan O'TKAZILADI — qo'lda obyekt yasab `as` bilan turini
 *    aldash mumkin edi, lekin o'shanda test HAQIQIY formadan
 *    kelmaydigan shaklni sinardi va xato yana sezilmay qolardi.
 */
function kirim(nom: string, koeffitsient = '1'): MaterialKirimi {
  const n = materialSxema.safeParse({
    nom,
    hisobTuri: 'RULON',
    kirimBirligi: 'rulon',
    sarflashBirligi: 'KV_M',
    koeffitsient,
    kirimNarxAsosi: 'BIRLIK',
  });
  if (!n.success) throw new Error(n.error.issues.map((x) => x.message).join('; '));
  return n.data;
}

beforeAll(async () => {
  sql = sinovUlanishi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, yaratdi_id)
    VALUES (${`${belgi} mato`}, 'RULON', 'rulon', 'KV_M', 1, ${XODIM})
    RETURNING id`;
  materialId = m[0]?.id ?? 0;
  expect(materialId).toBeGreaterThan(0);

  /** ⚠️ IKKI bo'lak — egasining holatidagi kabi */
  for (const n of [1, 2]) {
    await sql`
      INSERT INTO bolak (material_id, kod, turi, holat, eni_m, boyi_m,
                         tannarx_birlik_snapshot, filial_id, yaratdi_id)
      VALUES (${materialId}, ${`${belgi}-${String(n)}`}, 'RULON', 'BOSH',
              1.00, 10.00, 1000, ${FILIAL}, ${XODIM})`;
  }
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('EC-MTQ · qoldiq bor materialni tahrirlash', () => {
  /** ⚠️ Baza koeffitsientni «1.0000» qilib qaytarishini tasdiqlaymiz */
  it('EC-MTQ-01 · bazadagi koeffitsient MATN va kasrli', async () => {
    const q = await sql<{ k: string }[]>`
      SELECT koeffitsient::text AS k FROM material WHERE id = ${materialId}`;
    expect(typeof q[0]?.k).toBe('string');
    expect(q[0]?.k).toBe('1.0000');
  });

  /**
   * ⚠️ ASOSIY TEST. Forma «1» yuboradi, bazada «1.0000» turadi.
   *    Matn solishtiruvida bu «o'zgardi» bo'lardi va qoldiq borligi
   *    uchun tahrir RAD ETILARDI.
   */
  it('EC-MTQ-02 · koeffitsient TEGILMASA nom o’zgaradi', async () => {
    const n = await materialTahrirla(
      sql,
      materialId,
      kirim(`${belgi} mato — yangi nom`),
      XODIM,
      FILIAL,
    );
    expect(n.holat).toBe('SAQLANDI');

    const q = await sql<{ nom: string }[]>`
      SELECT nom FROM material WHERE id = ${materialId}`;
    expect(q[0]?.nom).toBe(`${belgi} mato — yangi nom`);
  });

  /** ⚠️ Himoya O'Z ISHINI bajarishda davom etadi */
  it('EC-MTQ-03 · koeffitsient HAQIQATAN o’zgarsa RAD ETILADI', async () => {
    const n = await materialTahrirla(
      sql,
      materialId,
      kirim(`${belgi} mato`, '3'),
      XODIM,
      FILIAL,
    );
    expect(n.holat).toBe('BIRLIK_OZGARMAYDI');
    if (n.holat !== 'BIRLIK_OZGARMAYDI') return;
    expect(n.qoldiq).toBe(2);
  });

  it('EC-MTQ-04 · hisob turi o’zgarsa ham RAD ETILADI', async () => {
    const k: MaterialKirimi = { ...kirim(`${belgi} mato`), hisobTuri: 'DONA' };
    const n = await materialTahrirla(sql, materialId, k, XODIM, FILIAL);
    expect(n.holat).toBe('BIRLIK_OZGARMAYDI');
  });

  /**
   * ⚠️ «1.0000» va «1.0» ham bir xil son — har xil yozilishi
   *    tahrirni to'xtatmasligi kerak.
   */
  it('EC-MTQ-05 · bir xil sonning boshqa yozilishi o’zgarish emas', async () => {
    const n = await materialTahrirla(
      sql,
      materialId,
      kirim(`${belgi} mato — uchinchi`, '1.00'),
      XODIM,
      FILIAL,
    );
    expect(n.holat).toBe('SAQLANDI');
  });
});
