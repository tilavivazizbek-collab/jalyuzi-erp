/**
 * T-06 — mijozga avtomatik qarz eslatmasi. 2026-10-14.
 * ⚠️ Telegramga hech narsa ketmaydi — xabar faqat NAVBATGA yoziladi.
 * ⚠️ Faqat shu testning mijozlari (`mijozIdlar`) — sinov bazasidagi boshqa
 *    qarzdorlarga tegilmaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { qarzEslatmalariniYubor } from '@/app/(panel)/mijoz/qarz-eslatma';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const FILIAL = 1;
const BELGI = String(Date.now()).slice(-7);
const KUN = 24 * 60 * 60 * 1000;
let sql: Ulanish;
let kechikkan = 0;
let yangi = 0;
let telegramsiz = 0;

async function mijoz(nom: string, telegram: number | null, qarzKuni: number): Promise<number> {
  const m = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, telegram_id, tolov_muddati_kun, yaratdi_id)
    VALUES (${`${nom} ${BELGI}`}, ${`9977${BELGI}${String(telegram ?? 0).slice(-1)}${nom.length}`}, ${telegram}, 10, ${XODIM})
    RETURNING id`;
  const id = m[0]?.id ?? 0;
  await sql`
    INSERT INTO mijoz_harakat (sana, mijoz_id, filial_id, turi, summa, valyuta, manba_turi, manba_id, xodim_id)
    VALUES (${new Date(Date.now() - qarzKuni * KUN)}, ${id}, ${FILIAL}, 'SOTUV', 500000, 'SOM', 'sinov', ${id}, ${XODIM})`;
  return id;
}

const xabarlar = (id: number) =>
  sql<{ matn: string }[]>`SELECT matn FROM bot_xabar WHERE manba_turi = 'qarz_eslatma' AND manba_id = ${id}`;

beforeAll(async () => {
  sql = sinovUlanishi();
  // Muddat 10 kun: 20 kunlik qarz — 10 kun kechikkan; 5 kunlik — hali muddati bor
  kechikkan = await mijoz('Kechikkan', Number(`3${BELGI}01`), 20);
  yangi = await mijoz('Yangi', Number(`3${BELGI}02`), 5);
  telegramsiz = await mijoz('Telegramsiz', null, 20);
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('T-06 — avtomatik qarz eslatmasi', () => {
  it('EC-QE-01: muddati o‘tgan qarzga eslatma (summa bilan), CRM tarixiga yoziladi; boshqalarga yo‘q', async () => {
    const r = await qarzEslatmalariniYubor(new Date(), [kechikkan, yangi, telegramsiz]);
    expect(r).toEqual({ yuborildi: 1, telegramsiz: 1 });
    const x = await xabarlar(kechikkan);
    expect(x).toHaveLength(1);
    expect(x[0]?.matn).toContain('500 000 so‘m');
    expect(await xabarlar(yangi)).toHaveLength(0);
    const crm = await sql<{ matn: string }[]>`SELECT matn FROM mijoz_muloqot WHERE mijoz_id = ${kechikkan}`;
    expect(crm.some((c) => c.matn.includes('Avtomatik qarz eslatmasi'))).toBe(true);
  });

  it('EC-QE-02: ertasiga qayta chaqirilsa — bezor qilinmaydi (7 kun)', async () => {
    await qarzEslatmalariniYubor(new Date(Date.now() + KUN), [kechikkan]);
    expect(await xabarlar(kechikkan)).toHaveLength(1);
  });
});
