/**
 * Ombor auditi 2026-10-06 — 2-band: qoldiq ro'yxati va kam qoldiq.
 * TZ 7.3 · Q-10 · 11.7.3
 *
 * ⚠️ Ikki xato yopilgani shu yerda isbotlanadi:
 *    1. Qoldig'i tugagan mato ro'yxatdan yo'qolardi
 *    2. Rulon chegarasi METRDA, qoldiq KV.M da solishtirilardi
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ulanishOl } from '@/lib/db';
import type { Ulanish } from '@/lib/db/ulanish';
import { filialQoldigi } from '@/app/(panel)/ombor/malumot';
import { kamQolganlar } from '@/app/(panel)/hisobot/malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let kengId = 0;
let lamelId = 0;
let tugaganId = 0;

const material = async (nom: string, eni: number | null, chegara: number | null): Promise<number> => {
  const q = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          standart_rulon_eni_m, kam_qoldiq_chegara_m, yaratdi_id)
    VALUES (${`${nom} ${BELGI}`}, 'RULON', 'rulon', 'KV_M', ${eni}, ${chegara}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
};
const bolak = async (materialId: number, eni: number, boyi: number): Promise<void> => {
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${`OQ-${String(materialId)}-${String(boyi)}`}, 'RULON',
            ${eni}, ${boyi}, 50000, ${XODIM})`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  // Eni 3 m, 10 m qolgan — 30 kv.m. Chegara 20 m → KAM
  kengId = await material('Keng blackout', 3, 20);
  await bolak(kengId, 3, 10);
  // Lamel 0.40 m, 30 m qolgan — 12 kv.m. Chegara 20 m → YETARLI
  lamelId = await material('Dikkey lamel', 0.4, 20);
  await bolak(lamelId, 0.4, 30);
  // Hech qachon kirim bo'lmagan mato — TUGAGAN
  tugaganId = await material('Tugagan zebra', 3, 15);
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('ombor qoldig‘i — 2-band', () => {
  it('EC-OMB-Q1: rulon chegarasi METRDA — keng mato kam, lamel yetarli', async () => {
    const r = await filialQoldigi(FILIAL);
    const keng = r.find((q) => q.materialId === kengId);
    const lamel = r.find((q) => q.materialId === lamelId);
    expect(keng?.chegaraQoldiq).toBe(10);
    expect(keng?.kamQoldiq).toBe(true);
    expect(lamel?.chegaraQoldiq).toBe(30);
    expect(lamel?.kamQoldiq).toBe(false);
  });

  it('EC-OMB-Q2: qoldig‘i yo‘q mato ro‘yxatdan YO‘QOLMAYDI — tugagan deb keladi', async () => {
    const t = (await filialQoldigi(FILIAL)).find((q) => q.materialId === tugaganId);
    expect(t?.tugagan).toBe(true);
    expect(t?.bolakSoni).toBe(0);
  });

  it('EC-OMB-Q3: hisobot va ombor sahifasi BIR XIL natija beradi', async () => {
    const h = await kamQolganlar(FILIAL);
    const ids = h.map((q) => q.materialId);
    expect(ids).toContain(kengId);
    expect(ids).toContain(tugaganId);
    expect(ids).not.toContain(lamelId);
    expect(h.find((q) => q.materialId === kengId)?.qoldiq).toBe(10);
  });
});
