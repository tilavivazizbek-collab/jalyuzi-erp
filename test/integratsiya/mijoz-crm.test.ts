/**
 * Egasi auditi 2026-10-06 — mijozlar bo'limi: qarz taqsimoti, ro'yxat
 * filtrlari, qidiruv. TZ 6.1 · 6.4 · 6.7 · 6.8 · 11.6 · 2.2-invariant
 *
 * ⚠️ Sahifa ichidagi SQL ni hech qanday test ko'rmaydi — shuning uchun
 *    ekran so'rovlari shu yerda HAQIQIY bazada yurgiziladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ulanishOl } from '@/lib/db';
import type { Ulanish } from '@/lib/db/ulanish';
import { qarzniTaqsimla } from '@/lib/domain/qarz-taqsimot';
import { mijozJurnali } from '@/app/(panel)/mijoz/qarz-malumot';
import { tolovIntizomi } from '@/app/(panel)/mijoz/[id]/malumot';
import {
  mijozlarRoyxati,
  type RoyxatFiltri,
  type HolatFiltri,
  type Saralash,
} from '@/app/(panel)/mijoz/malumot';
import { mijozQidir } from '@/app/(panel)/buyurtma/yangi/malumot';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let mijozId = 0;
/** Har yurishda yangi — oldingi yurish qoldirgan mijoz bilan urilmasin */
const raqam = String(Date.now()).slice(-7);
const telefon = `99893${raqam}`;
const B1 = Number(`7${raqam}1`);
const B2 = Number(`7${raqam}2`);

const filtr = (o: Partial<RoyxatFiltri> = {}): RoyxatFiltri => ({
  qidiruv: '',
  holat: null,
  segment: null,
  guruhId: null,
  turiId: null,
  masulId: null,
  saralash: 'ism',
  ochirilganlar: false,
  sahifa: 1,
  ...o,
});

beforeAll(async () => {
  sql = sinovUlanishi();
  const m = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, tolov_muddati_kun, masul_xodim_id, manba, yaratdi_id)
    VALUES (${`CRM sinov ${raqam}`}, ${telefon}, 15, 1, 'Instagram', 1)
    RETURNING id`;
  mijozId = m[0]?.id ?? 0;

  /*
   * 70 kun oldin 500 000 lik sotuv, 20 kun oldin 300 000 lik sotuv,
   * 5 kun oldin KARTOCHKADAN 600 000 to'lov (hech qaysi buyurtmaga
   * bog'lanmagan). Taqsimot: birinchisi yopiladi, ikkinchisida
   * 200 000 qoladi.
   */
  await sql`
    INSERT INTO mijoz_harakat (sana, mijoz_id, filial_id, turi, summa, valyuta,
                               manba_turi, manba_id, xodim_id)
    VALUES (now() - interval '70 days', ${mijozId}, 1, 'SOTUV', 500000, 'SOM', 'buyurtma', ${B1}, 1),
           (now() - interval '20 days', ${mijozId}, 1, 'SOTUV', 300000, 'SOM', 'buyurtma', ${B2}, 1),
           (now() - interval '5 days',  ${mijozId}, 1, 'TOLOV', -600000, 'SOM', 'kassa_yozuv', 1, 1)`;
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('qarz taqsimoti — 1-xato', () => {
  it('EC-CRM-01: jurnal buyurtmaga to‘g‘ri bog‘lanadi', async () => {
    const j = await mijozJurnali(mijozId);
    expect(j.map((q) => q.buyurtmaId)).toEqual([B1, B2, null]);
  });

  it('EC-CRM-02: kartochkadan to‘langan pul eng eski buyurtmani yopadi', async () => {
    const t = qarzniTaqsimla(await mijozJurnali(mijozId));
    const b1 = t.bandlar.find((b) => b.buyurtmaId === B1);
    const b2 = t.bandlar.find((b) => b.buyurtmaId === B2);
    expect(b1?.qolgan).toBe('0.00');
    expect(b2?.qolgan).toBe('200000.00');
    expect(t.qarz.SOM).toBe('200000.00');
  });

  it('EC-CRM-03: to‘lov intizomi kartochkadan to‘langanni ham sanaydi', async () => {
    const i = await tolovIntizomi(mijozId);
    expect(i.tolanganSoni).toBe(1);
    expect(i.ortachaKun).toBe(65);
  });
});

describe('ro‘yxat — 5- va 6-xatolar', () => {
  it('EC-CRM-04: qarz, sotuv va mas‘ul ro‘yxatda ko‘rinadi', async () => {
    const n = await mijozlarRoyxati(filtr({ qidiruv: raqam }), '12000');
    const q = n.qatorlar.find((r) => r.id === mijozId);
    expect(q?.qarz_som).toBe('200000.00');
    expect(q?.sotuv_som).toBe('800000.00');
    expect(q?.masul_ismi).not.toBeNull();
    expect(q?.tolov_muddati_kun).toBe(15);
  });

  it('EC-CRM-05: qidiruv telefonni bo‘sh joy bilan ham topadi', async () => {
    const bosh = `${raqam.slice(0, 3)} ${raqam.slice(3)}`;
    const n = await mijozlarRoyxati(filtr({ qidiruv: bosh }), null);
    expect(n.qatorlar.map((r) => r.id)).toContain(mijozId);

    const s = await mijozQidir(`+998 93 ${raqam.slice(0, 3)}`);
    expect(s.map((r) => r.id)).toContain(mijozId);
  });

  it('EC-CRM-06: «qarzdor» va «muddati o‘tgan» filtrlari', async () => {
    const q = await mijozlarRoyxati(filtr({ qidiruv: raqam, holat: 'qarzdor' }), null);
    expect(q.qatorlar.map((r) => r.id)).toContain(mijozId);
    const m = await mijozlarRoyxati(filtr({ qidiruv: raqam, holat: 'muddat' }), null);
    expect(m.qatorlar.map((r) => r.id)).toContain(mijozId);
    const a = await mijozlarRoyxati(filtr({ qidiruv: raqam, holat: 'avans' }), null);
    expect(a.qatorlar.map((r) => r.id)).not.toContain(mijozId);
  });

  it('EC-CRM-07: har filtr va saralash yiqilmasdan yuradi', async () => {
    const holatlar: (HolatFiltri | null)[] = [
      null, 'qarzdor', 'limit', 'muddat', 'avans', 'uxlagan', 'xaridsiz',
    ];
    const saralashlar: Saralash[] = ['ism', 'qarz', 'oxirgi', 'sotuv'];
    for (const holat of holatlar) {
      for (const saralash of saralashlar) {
        await expect(mijozlarRoyxati(filtr({ holat, saralash }), '12000')).resolves.toBeDefined();
      }
    }
    // «%» va «_» — qidiruvda oddiy belgi, hamma narsani tutib olmaydi
    const p = await mijozlarRoyxati(filtr({ qidiruv: '%' }), null);
    expect(p.qatorlar.map((r) => r.id)).not.toContain(mijozId);
  });
});
