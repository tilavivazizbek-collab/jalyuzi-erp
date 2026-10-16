/**
 * TZ 11.3 — dashboard «Diqqat talab qiladi». 2026-10-17.
 * Sanoq ro'yxat bilan BIR XIL bo'lishi shart: bosilganda boshqa son chiqmasin.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import type { Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import { diqqatBandlari } from '@/app/(panel)/boshqaruv/diqqat';
import { buyurtmalar } from '@/app/(panel)/buyurtma/malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `DQ-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;

/** Faqat buyurtmalarni ko'radigan admin — boshqa bandlar (ombor, mijoz…) bu testga aralashmasin */
const kim = (kod: 'ADMIN' | 'SOTUVCHI'): Foydalanuvchi => ({
  xodimId: XODIM,
  filialId,
  boshFilialda: false,
  rollar: [
    {
      kod,
      nom: kod,
      ruxsatlar: kod === 'ADMIN' ? new Map([['buyurtma.kor', 'OZ_FILIALI']]) : new Map(),
    },
  ],
});

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const t = await sql<{ id: number }[]>`INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  const j = sql.json({ sinov: true });
  // 1) tasdiq kutmoqda, 2 kunlik — qizil; 2) materialga kutmoqda + kechikkan
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, manba, tayyorlik_sana, yaratdi_id)
    VALUES (${`B-${BELGI}-1`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT', NULL, ${XODIM}),
           (${`B-${BELGI}-2`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT', CURRENT_DATE - 2, ${XODIM})
    RETURNING id`;
  await sql`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, soni, narx_snapshot,
                                    formula_snapshot, holat, yaratildi, yaratdi_id)
    VALUES (${b[0]?.id ?? 0}, 1, ${t[0]?.id ?? 0}, 1, 1, 1, 1000, ${j}, 'TASDIQ_KUTMOQDA', now() - interval '2 days', ${XODIM}),
           (${b[1]?.id ?? 0}, 1, ${t[0]?.id ?? 0}, 1, 1, 1, 1000, ${j}, 'MATERIALGA_KUTMOQDA', now(), ${XODIM}),
           (${b[1]?.id ?? 0}, 2, ${t[0]?.id ?? 0}, 1, 1, 1, 1000, ${j}, 'MATERIALGA_KUTMOQDA', now(), ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.3 — diqqat talab qiladi', () => {
  it('EC-DQ-01: buyurtma bandlari ro‘yxat filtrlari bilan bir xil; 24 soatdan oshgan tasdiq qizil', async () => {
    const d = await diqqatBandlari(kim('ADMIN'));
    const band = (nom: string) => d.find((x) => x.nom === nom);

    expect(band('Tasdiq kutayotgan buyurtma')).toMatchObject({
      soni: (await buyurtmalar(filialId, 'TASDIQ_KUTMOQDA')).length,
      xavf: true,
      izoh: '1 tasi 24 soatdan oshgan',
      havola: '/buyurtma?filtr=TASDIQ_KUTMOQDA',
    });
    expect(band("Muddati o'tgan buyurtma")?.soni).toBe((await buyurtmalar(filialId, 'MUDDATI_OTGAN')).length);
    expect(band("Muddati o'tgan buyurtma")?.soni).toBe(1);
    expect(band('Materialga kutayotgan pozitsiya')).toMatchObject({ soni: 2, izoh: '1 ta buyurtmada' });
  });

  it('EC-DQ-02: ruxsati yo‘q odamga band chiqmaydi', async () => {
    expect(await diqqatBandlari(kim('SOTUVCHI'))).toEqual([]);
  });
});
