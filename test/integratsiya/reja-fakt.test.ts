/**
 * TZ 21.5 — reja fakti bazadan. 2026-10-13.
 *
 * ⚠️ Har yugurish o'z (uzoq kelajakdagi) yilini oladi — oy ichida faqat
 *    shu testning pozitsiyalari bo'ladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { rejaFakti, rejaFaktQatorlari } from '@/app/(panel)/hisobot/reja-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
const YIL = String(2100 + ((Number(BELGI) + 401) % 800));
const OY = `${YIL}-05-01`;
let sql: Ulanish;
let A = 0;
let B = 0;
let tur = 0;
let n = 0;

async function pozitsiya(k: {
  sf: number;
  isf: number;
  narx: string;
  holat: string;
  usd?: boolean;
}): Promise<number> {
  n += 1;
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id,
                          manba, valyuta, kurs_snapshot, yaratdi_id)
    VALUES (${`B-RF-${BELGI}-${String(n)}`}, ${XODIM}, ${k.sf}, ${k.isf}, 'SAYT',
            ${k.usd === true ? 'USD' : 'SOM'}, ${k.usd === true ? 12800 : null}, ${XODIM})
    RETURNING id`;
  const p = await sql<{ id: number }[]>`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m,
                                    narx_snapshot, formula_snapshot, holat, yaratdi_id)
    VALUES (${b[0]?.id ?? 0}, 1, ${tur}, 2, 1.5, ${k.narx}, ${sql.json({ sinov: true })}, ${k.holat}, ${XODIM})
    RETURNING id`;
  return p[0]?.id ?? 0;
}

const audit = (amal: string, pid: number, sana: string, yangi: Record<string, string>) =>
  sql`
    INSERT INTO audit_jurnal (sana, xodim_id, filial_id, amal, obyekt_turi, obyekt_id, yangi_qiymat)
    VALUES (${`${sana} 12:00+05`}, ${XODIM}, ${A}, ${amal}, 'buyurtma_pozitsiya', ${pid}, ${sql.json(yangi)})`;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`RF A ${BELGI}`}, true, true, false, ${XODIM}), (${`RF B ${BELGI}`}, true, true, false, ${XODIM})
    RETURNING id`;
  A = f[0]?.id ?? 0;
  B = f[1]?.id ?? 0;
  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`RF tur ${BELGI}`}, ${XODIM}) RETURNING id`;
  tur = t[0]?.id ?? 0;

  // 1 — A sotdi, B tikdi, may oyida topshirildi; ish haqi 57 600
  const p1 = await pozitsiya({ sf: A, isf: B, narx: '678400', holat: 'TOPSHIRILDI' });
  await audit('TOPSHIRISH', p1, `${YIL}-05-10`, { holat: 'TOPSHIRILDI' });
  await sql`
    INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta, manba_turi, manba_id, izoh, xodim_id)
    VALUES (${`${YIL}-05-10`}, ${B}, 'ISH_HAQI', 57600, 'SOM', 'buyurtma_pozitsiya', ${p1}, 'sinov', ${XODIM})`;

  // 2 — dollarli, qo'lda «Topshirildi» ga tuzatildi: $50 × 12 800
  const p2 = await pozitsiya({ sf: A, isf: A, narx: '50', holat: 'TOPSHIRILDI', usd: true });
  await audit('HOLAT_QOLDA_TUZATILDI', p2, `${YIL}-05-20`, { holat: 'TOPSHIRILDI' });

  // 3 — aprelda topshirilgan, mayda 100 000 qaytarildi (mayga faqat qaytarish)
  const p3 = await pozitsiya({ sf: A, isf: A, narx: '150000', holat: 'QAYTARILGAN' });
  await audit('TOPSHIRISH', p3, `${YIL}-04-28`, { holat: 'TOPSHIRILDI' });
  await audit('QAYTARISH', p3, `${YIL}-05-03`, { holat: 'QAYTARILGAN', qaytarildi: '100000.00' });

  // 4 — iyunda topshirilgan: mayga kirmaydi
  const p4 = await pozitsiya({ sf: A, isf: A, narx: '999999', holat: 'TOPSHIRILDI' });
  await audit('TOPSHIRISH', p4, `${YIL}-06-01`, { holat: 'TOPSHIRILDI' });
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 21.5 — fakt', () => {
  it('EC-REJ-F1: topshirilgan oyga tushum, qaytarish o‘z oyida, foyda 20.17 bo‘yicha', async () => {
    const f = await rejaFakti(OY);
    // 678 400 + 640 000 − 100 000
    expect(f.korxona).toEqual({ tushum: '1218400.00', foyda: '1160800.00' });
    // A: 620 800 / 2 + 640 000 − 100 000
    expect(f.filiallar.get(A)).toEqual({ tushum: '1218400.00', foyda: '850400.00' });
    expect(f.filiallar.get(B)).toEqual({ tushum: '0.00', foyda: '310400.00' });
    expect(f.sotuvchilar.get(`${String(A)}|${String(XODIM)}`)).toBe('1218400.00');
  });

  it('EC-REJ-01: reja qo‘yilmagan filial — fakt bilan chiqadi, reja «yo‘q»', async () => {
    const q = await rejaFaktQatorlari(OY, [A, B]);
    expect(q.find((x) => x.turi === 'KORXONA')).toBeUndefined();
    const a = q.find((x) => x.turi === 'FILIAL' && x.filialId === A);
    expect(a).toMatchObject({ rejaTushum: null, faktTushum: '1218400.00' });
    expect(q.some((x) => x.turi === 'SOTUVCHI' && x.faktFoyda === null)).toBe(true);
  });
});
