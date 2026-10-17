/**
 * TZ 11.11 — Mijozlar sahifasi paneli. 2026-10-17.
 * Panel sonlari ro'yxat filtrlari bilan BIR XIL (bosilganda o'sha son chiqadi).
 */
import { afterAll, describe, expect, it } from 'vitest';
import { ulanishOl } from '@/lib/db';
import { joriyKurs } from '@/lib/amal/kurs';
import { mijozPaneli } from '@/app/(panel)/mijoz/panel';
import { filtrniOqi, mijozlarRoyxati, muddatiOtganlar } from '@/app/(panel)/mijoz/malumot';

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
