/**
 * LOYIHA T-05 — sotuvchidan sotuvchiga naqd (smena almashganda) va
 * TZ 12.7 — topshiriqni rad etish. 2026-10-14.
 *
 * Mexanizm 12.7 niki: yuborilganda pul qimirlamaydi, pulni olgan sotuvchi
 * qabul qilganda ko'chadi; rad etilsa joyida qoladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { topshiriqniQabulQil, topshiriqniRadEt, topshiriqYubor } from '@/lib/amal/kassa';
import { BiznesXato } from '@/lib/xato';
import {
  mengaKelganTopshiriqlar,
  ochiqTopshiriqlar,
  topshirishNishonlari,
} from '@/app/(panel)/kassa/malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-8);
let sql: Ulanish;
let filial = 0;
let boshqaFilial = 0;
let ali = 0;
let vali = 0;
let aliKassa = 0;
let valiKassa = 0;
let begonaKassa = 0;
let adminKassa = 0;

async function sotuvchi(filialId: number, ism: string, tel: string): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
    VALUES (${filialId}, ${`${ism} ${BELGI}`}, ${`99871${BELGI}${tel}`}, ${XODIM}) RETURNING id`;
  return q[0]?.id ?? 0;
}

async function kassa(filialId: number, xodimId: number | null): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${filialId}, ${xodimId}, 'NAQD', 'SOM', ${`ST kassa ${BELGI}-${String(xodimId ?? 0)}`}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

const qoldiq = async (kassaId: number): Promise<string> => {
  const q = await sql<{ s: string }[]>`
    SELECT COALESCE(SUM(summa), 0)::numeric(14,2)::text AS s FROM kassa_yozuv WHERE kassa_id = ${kassaId}`;
  return q[0]?.s ?? '';
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id) VALUES (${`ST ${BELGI}`}, ${XODIM}), (${`ST2 ${BELGI}`}, ${XODIM})
    RETURNING id`;
  filial = f[0]?.id ?? 0;
  boshqaFilial = f[1]?.id ?? 0;

  ali = await sotuvchi(filial, 'Ali', '1');
  vali = await sotuvchi(filial, 'Vali', '2');
  const begona = await sotuvchi(boshqaFilial, 'Begona', '3');
  aliKassa = await kassa(filial, ali);
  valiKassa = await kassa(filial, vali);
  begonaKassa = await kassa(boshqaFilial, begona);
  adminKassa = await kassa(filial, null);

  const manba = await sql<{ n: number }[]>`SELECT nextval('qolda_manba_seq')::int AS n`;
  await sql`
    INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id, qator, izoh, xodim_id)
    VALUES (${aliKassa}, 'K1', 500000, 'SOM', 'sinov', ${manba[0]?.n ?? 0}, 1, 'Sinov kirimi', ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('T-05 — sotuvchidan sotuvchiga', () => {
  it('EC-ST-01: nishonlarda o‘z filialidagi boshqa sotuvchi bor, o‘zi va begona filial sotuvchisi yo‘q', async () => {
    const n = await topshirishNishonlari(filial, ali);
    const idlar = n.map((x) => x.id);
    expect(idlar).toContain(valiKassa);
    expect(idlar).toContain(adminKassa);
    expect(idlar).not.toContain(aliKassa);
    expect(idlar).not.toContain(begonaKassa);
    expect(n.find((x) => x.id === valiKassa)?.sotuvchi).toBe(`Vali ${BELGI}`);
    expect(n.find((x) => x.id === adminKassa)?.sotuvchi).toBeNull();
  });

  it('EC-ST-02: yuborilganda pul qimirlamaydi; Vali ko‘radi, admin ro‘yxatida yo‘q; qabulda ko‘chadi', async () => {
    const { topshiriqId } = await topshiriqYubor(
      ulanishOl(),
      { kimdanKassaId: aliKassa, kimgaKassaId: valiKassa, summa: '200000', valyuta: 'SOM', izoh: 'smena' },
      ali,
    );
    expect(await qoldiq(aliKassa)).toBe('500000.00');
    expect((await mengaKelganTopshiriqlar(vali)).map((t) => t.id)).toEqual([topshiriqId]);
    expect((await mengaKelganTopshiriqlar(vali))[0]?.kimdan).toBe(`Ali ${BELGI}`);
    expect((await ochiqTopshiriqlar(filial)).map((t) => t.id)).not.toContain(topshiriqId);

    // Adminga tugmali xabar ketmagan — pulni u ko'rmagan
    const xabar = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bot_xabar WHERE manba_turi = 'topshiriq' AND manba_id = ${topshiriqId}`;
    expect(xabar[0]?.n).toBe(0);

    await topshiriqniQabulQil(ulanishOl(), topshiriqId, vali);
    expect(await qoldiq(aliKassa)).toBe('300000.00');
    expect(await qoldiq(valiKassa)).toBe('200000.00');
    expect(await mengaKelganTopshiriqlar(vali)).toEqual([]);

    const izoh = await sql<{ izoh: string }[]>`
      SELECT izoh FROM kassa_yozuv WHERE manba_turi = 'topshiriq' AND manba_id = ${topshiriqId} ORDER BY qator`;
    expect(izoh.map((x) => x.izoh)).toEqual(['Sotuvchiga topshiriq (T-05)', 'Sotuvchidan topshiriq (T-05)']);
  });

  it('EC-ST-03: boshqa filial sotuvchisiga yuborib bo‘lmaydi', async () => {
    await expect(
      topshiriqYubor(
        ulanishOl(),
        { kimdanKassaId: aliKassa, kimgaKassaId: begonaKassa, summa: '1000', valyuta: 'SOM', izoh: null },
        ali,
      ),
    ).rejects.toMatchObject({ kod: 'TOPSHIRIQ_SOTUVCHI_FILIAL' });
  });
});

describe('TZ 12.7 — rad etish', () => {
  it('EC-ST-04: rad etilsa pul joyida, holat BEKOR, sabab auditda; qayta hal qilib bo‘lmaydi', async () => {
    const { topshiriqId } = await topshiriqYubor(
      ulanishOl(),
      { kimdanKassaId: aliKassa, kimgaKassaId: valiKassa, summa: '50000', valyuta: 'SOM', izoh: null },
      ali,
    );
    await expect(topshiriqniRadEt(ulanishOl(), topshiriqId, '  ', vali)).rejects.toBeInstanceOf(BiznesXato);

    await topshiriqniRadEt(ulanishOl(), topshiriqId, 'Summa mos emas — 45 000 berdi', vali);
    expect(await qoldiq(aliKassa)).toBe('300000.00');
    expect(await mengaKelganTopshiriqlar(vali)).toEqual([]);

    const a = await sql<{ holat: string; izoh: string }[]>`
      SELECT t.holat, aj.izoh FROM topshiriq t
      JOIN audit_jurnal aj ON aj.obyekt_turi = 'topshiriq' AND aj.obyekt_id = t.id
                           AND aj.amal = 'TOPSHIRIQ_RAD_ETILDI'
      WHERE t.id = ${topshiriqId}`;
    expect(a[0]).toEqual({ holat: 'BEKOR', izoh: 'Summa mos emas — 45 000 berdi' });

    await expect(topshiriqniQabulQil(ulanishOl(), topshiriqId, vali)).rejects.toMatchObject({
      kod: 'TOPSHIRIQ_ALLAQACHON_HAL',
    });
  });
});
