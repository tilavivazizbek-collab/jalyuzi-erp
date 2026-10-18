/**
 * TZ 11.11 — Mijozlar sahifasi paneli. 2026-10-17.
 * Panel sonlari ro'yxat filtrlari bilan BIR XIL (bosilganda o'sha son chiqadi).
 */
import { afterAll, describe, expect, it } from 'vitest';
import { ulanishOl } from '@/lib/db';
import { joriyKurs } from '@/lib/amal/kurs';
import { mijozPaneli } from '@/app/(panel)/mijoz/panel';
import { filtrniOqi, mijozlarRoyxati, muddatiOtganlar, ortachaTolovMuddati } from '@/app/(panel)/mijoz/malumot';
import { sinovUlanishi } from './yordamchi';

afterAll(async () => {
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.11 — mijozlar paneli', () => {
  it('EC-MP-01: diqqat sonlari = ro‘yxat filtrlari; Telegramsiz = bazadagi faol, telegrami yo‘q', async () => {
    const sql = ulanishOl();
    const kurs = await joriyKurs(sql);
    const [p, limit, uxlagan, muddat, tg] = await Promise.all([
      mijozPaneli(1),
      mijozlarRoyxati(filtrniOqi({ holat: 'limit' }), kurs, 1),
      mijozlarRoyxati(filtrniOqi({ holat: 'uxlagan' }), kurs, 1),
      muddatiOtganlar(),
      sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM mijoz WHERE faol AND telegram_id IS NULL`,
    ]);
    const qiymat = (nom: string) => p.diqqat.find((b) => b.nom === nom)?.qiymat;
    expect(qiymat('Limitdan oshgan')).toBe(String(limit.jamiSoni));
    expect(qiymat('Uxlab qolgan')).toBe(String(uxlagan.jamiSoni));
    expect(qiymat("To'lov muddati o'tgan")).toBe(String(muddat.size));
    expect(qiymat('Telegramsiz')).toBe(String(tg[0]?.n ?? 0));
    expect(p.diqqat.find((b) => b.nom === 'Telegramsiz')?.havola).toBe('/mijoz?holat=telegramsiz');
  });
});

describe('TZ 11.11 — o‘rtacha to‘lov muddati', () => {
  it('EC-MP-05: davrda yopilgan nasiya kunlari o‘rtachasi; naqd va ochiq qarz sanalmaydi', async () => {
    // ⚠️ mijoz_harakat o'zgarmas — yozuv o'chmaydi. Shuning uchun har ishga
    //    tushish O'Z davrini oladi (1950–1981 oralig'ida), boshqa ma'lumot tushmaydi.
    const sql = sinovUlanishi();
    const boshi = Date.UTC(1950, 0, 1) + (Date.now() % 1_000_000_000) * 1000;
    const kun = (k: number): Date => new Date(boshi + k * 86_400_000);
    const m = await sql<{ id: number }[]>`
      INSERT INTO mijoz (ism, telefon, yaratdi_id)
      VALUES ('TM sinov', ${`99877${String(Date.now()).slice(-7)}`}, 1) RETURNING id`;
    const id = m[0]?.id ?? 0;
    const b = 900_000 + (Date.now() % 90_000);
    const h = (k: number, turi: string, summa: number, manba: number | null) => sql`
      INSERT INTO mijoz_harakat (sana, mijoz_id, filial_id, turi, summa, manba_turi, manba_id, xodim_id)
      VALUES (${kun(k)}, ${id}, 1, ${turi}, ${summa},
              ${manba === null ? null : turi === 'SOTUV' ? 'buyurtma' : 'buyurtma_tolov'}, ${manba}, 1)`;
    await h(1, 'SOTUV', 100000, b); // 10 kunda — kartochkadan to'lov
    await h(11, 'TOLOV', -100000, null);
    await h(5, 'SOTUV', 60000, b + 1); // 20 kunda
    await h(25, 'TOLOV', -60000, b + 1);
    await h(7, 'SOTUV', 30000, b + 2); // naqd — o'sha kuni, sanalmaydi
    await h(7.01, 'TOLOV', -30000, b + 2);
    await h(20, 'SOTUV', 50000, b + 3); // ochiq
    const r = await ortachaTolovMuddati({ turi: 'OY', boshi: kun(0), oxiri: kun(30) });
    expect(r).toEqual({ kun: 15, soni: 2 });
    await sql.end({ timeout: 5 });
  });
});
