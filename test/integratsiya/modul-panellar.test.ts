/**
 * TZ 11.11 — Ombor, Yetkazib beruvchilar va Xodimlar panellari. 2026-10-17.
 * Panel sonlari ro'yxat/taqsimot bilan BIR XIL; xodim balansi va diqqat bandlari.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { omborPaneli } from '@/app/(panel)/ombor/panel';
import { filialQoldigi } from '@/app/(panel)/ombor/malumot';
import { holatSanoqlari } from '@/app/(panel)/ombor/qoldiq-filtr';
import { yetkazibPaneli } from '@/app/(panel)/yetkazib/panel';
import { yetkazibHolatlari } from '@/app/(panel)/yetkazib/taqsimot';
import { xodimPaneli } from '@/app/(panel)/xodim/panel';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `MP-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const u = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
    VALUES (${filialId}, ${`${BELGI} usta`}, ${`99874${String(Date.now()).slice(-7)}`}, ${XODIM}) RETURNING id`;
  const usta = u[0]?.id ?? 0;
  // Haq 50 000 (bugun), to'lov 20 000 (40 kun oldin) → balans +30 000, uzoq to'lanmagan
  await sql`
    INSERT INTO xodim_harakat (sana, xodim_id, filial_id, turi, summa, valyuta, manba_turi, manba_id, izoh, xodim_yozdi_id)
    VALUES (now(), ${usta}, ${filialId}, 'HAQ', 50000, 'SOM', 'sinov', 1, 'sinov', ${XODIM}),
           (now() - interval '40 days', ${usta}, ${filialId}, 'TOLOV', -20000, 'SOM', 'sinov', 2, 'sinov', ${XODIM})`;
  // Stavkasiz bajarilgan ish
  const t = await sql<{ id: number }[]>`INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
    VALUES (${`B-${BELGI}`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM}) RETURNING id`;
  await sql`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, soni, narx_snapshot,
                                    formula_snapshot, holat, usta_id, tugatildi, yaratdi_id)
    VALUES (${b[0]?.id ?? 0}, 1, ${t[0]?.id ?? 0}, 1, 1, 1, 1000, ${sql.json({ sinov: true })}, 'TAYYOR',
            ${usta}, now(), ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.11 — modul panellari', () => {
  it('EC-MP-02: ombor — kam qolgan va tugagan ro‘yxat sanog‘i bilan bir; tannarxsiz odamga summa yo‘q', async () => {
    const [p, sanoq, sotuvchi] = await Promise.all([
      omborPaneli(1, true),
      filialQoldigi(1).then(holatSanoqlari),
      omborPaneli(1, false),
    ]);
    const q = (nom: string) => p.diqqat.find((b) => b.nom === nom)?.qiymat;
    expect(q('Kam qolgan')).toBe(String(sanoq.kam));
    expect(q('Tugagan')).toBe(String(sanoq.tugagan));
    expect(sotuvchi.holat.some((b) => b.nom === 'Qoldiq qiymati')).toBe(false);
    expect(sotuvchi.diqqat.some((b) => b.nom === 'Ustamasi chegaradan past')).toBe(false);
  });

  it('EC-MP-03: yetkazib beruvchi — muddati o‘tganlar taqsimot bilan bir', async () => {
    const [p, holatlar] = await Promise.all([yetkazibPaneli(), yetkazibHolatlari(null)]);
    const n = [...holatlar.values()].filter((h) => h.muddat.muddatOtganSoni > 0).length;
    expect(p.diqqat.find((b) => b.nom === "Muddati o'tgan to'lov")?.qiymat).toBe(String(n));
  });

  it('EC-MP-04: xodim — balans +30 000, uzoq to‘lanmagan 1, stavkasiz ish 1, botsiz 1', async () => {
    const p = await xodimPaneli(filialId);
    expect(p.holat.find((b) => b.nom === 'Jami balans')?.qiymat).toBe('30 000');
    const q = (nom: string) => p.diqqat.find((b) => b.nom.startsWith(nom));
    expect(q("Uzoq to'lanmagan")).toMatchObject({ qiymat: '1', ton: 'xavf' });
    expect(q('Stavkasiz bajarilgan ish')).toMatchObject({ qiymat: '1', ton: 'xavf' });
    expect(q('Botga ulanmagan')?.qiymat).toBe('1');
    expect(q('Manfiy balans')?.qiymat).toBe('0');
    expect(p.davr.find((b) => b.nom === 'Hisoblangan haq')?.qiymat).toBe('50 000');
  });
});
