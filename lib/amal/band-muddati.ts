/**
 * lib/amal/band-muddati.ts — TZ 7.3 · EC-OMB-18 · LOYIHA §13. 2026-10-13
 *
 * «Band qilingan bo'lak 30 kun qimirlamadi — band avtomatik bo'shaydi,
 *  adminga xabar.» Bo'shatish `muddatiOtganlarniBoshatBatafsil` da
 * (bitta joy); bu yerda — takrorlash va xabar.
 *
 * ⚠️ Har chaqiruvda ko'pi bilan `MAKS_YURISH` × 200 band (P-28 — uzoq
 *    qulf bo'lmasin). Qolgani keyingi chaqiruvda.
 * ⚠️ Xabar har filial adminlariga BITTA (bo'lak shu filialniki).
 */

import type postgres from 'postgres';
import { bandMuddatiMatni } from '@/lib/domain/bildirishnoma';
import { muddatiOtganlarniBoshatBatafsil, type BoshatilganBand } from './band';
import { adminlarniOgohlantir } from './bildirishnoma';

const MAKS_YURISH = 10;
/** Tizim nomidan (bot/mijoz.ts dagi kabi) */
const TIZIM_XODIM = 1;

export async function bandMuddatiniTekshir(
  sql: postgres.Sql,
  hozir: Date = new Date(),
): Promise<{ boshatildi: number; xabarlar: number; yanaBormi: boolean }> {
  const boshatilgan: BoshatilganBand[] = [];
  let yanaBormi = true;
  for (let i = 0; i < MAKS_YURISH && yanaBormi; i += 1) {
    const n = await muddatiOtganlarniBoshatBatafsil(sql, TIZIM_XODIM, hozir);
    boshatilgan.push(...n.boshatilgan);
    yanaBormi = n.yanaBormi;
  }

  const filiallar = new Map<number, BoshatilganBand[]>();
  for (const b of boshatilgan) filiallar.set(b.filialId, [...(filiallar.get(b.filialId) ?? []), b]);

  let xabarlar = 0;
  for (const [filialId, qatorlar] of filiallar) {
    const { yozildi } = await adminlarniOgohlantir(
      sql,
      { filialId, hodisa: 'BAND_MUDDATI', matn: bandMuddatiMatni(qatorlar), manbaTuri: 'band_muddati', manbaId: filialId },
      TIZIM_XODIM,
    );
    xabarlar += yozildi;
  }
  return { boshatildi: boshatilgan.length, xabarlar, yanaBormi };
}
