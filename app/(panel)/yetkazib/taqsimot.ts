/**
 * Yetkazib beruvchi qarzi — kirimlarga FIFO taqsimot. Audit 2026-10-07.
 *
 * ⚠️ BITTA JOY. Ro'yxat (qarz, muddati o'tgan), kartochka bloklari,
 *    «to'lanmagan hujjatlar», «to'lov intizomimiz» va kirimlar tabi —
 *    hammasi shu funksiyadan. Ilgari to'rt joy hujjat summasini o'zicha
 *    `narx × miqdor (+ transport)` deb hisoblardi (P-46): metrga
 *    narxlangan rulonda noto'g'ri, transport esa qarzga kirmaydi.
 *
 * ⚠️ Hujjat summasi — JURNALDAGI `XARID` (yozilgan qarzning o'zi).
 *    Balans bilan har doim teng chiqadi.
 */

import { ulanishOl } from '@/lib/db';
import { qarzniTaqsimla, type JurnalQatori, type QarzTaqsimoti } from '@/lib/domain/qarz-taqsimot';
import {
  muddatXulosasi,
  tolovIntizomimiz,
  type MuddatXulosasi,
  type TolovIntizomimiz,
} from '@/lib/domain/yetkazib-qarz';
import { toshkentKuni } from '@/lib/domain/sana';

export interface KirimMalumoti {
  readonly raqam: string;
  readonly sana: string;
  readonly muddat: string | null;
}

export interface YetkazibHolati {
  readonly taqsimot: QarzTaqsimoti;
  readonly kirimlar: ReadonlyMap<number, KirimMalumoti>;
  readonly muddat: MuddatXulosasi;
  readonly intizom: TolovIntizomimiz;
}

/**
 * @param idlar `null` — hamma yetkazib beruvchi (ro'yxat sahifasi)
 */
export async function yetkazibHolatlari(
  idlar: readonly number[] | null,
): Promise<Map<number, YetkazibHolati>> {
  const sql = ulanishOl();
  const [qatorlar, kirimlar] = await Promise.all([
    sql<
      {
        id: number;
        yetkazib_beruvchi_id: number;
        sana: Date;
        turi: string;
        summa: string;
        valyuta: 'SOM' | 'USD';
        kirim_id: number | null;
      }[]
    >`
      SELECT h.id, h.yetkazib_beruvchi_id, h.sana, h.turi, h.summa::text, h.valyuta,
             CASE WHEN h.manba_turi IN ('kirim', 'kirim_storno') THEN h.manba_id
                  WHEN h.manba_turi = 'kirim_qator' THEN kq.kirim_id
             END AS kirim_id
      FROM yetkazib_beruvchi_harakat h
      LEFT JOIN kirim_qator kq ON h.manba_turi = 'kirim_qator' AND kq.id = h.manba_id
      ${idlar === null ? sql`` : sql`WHERE h.yetkazib_beruvchi_id = ANY(${idlar as number[]})`}
      ORDER BY h.sana, h.id`,
    sql<
      { id: number; yetkazib_beruvchi_id: number; raqam: string; sana: string; muddat: string | null }[]
    >`
      SELECT id, yetkazib_beruvchi_id, raqam, sana::text, tolov_muddati::text AS muddat
      FROM kirim
      ${idlar === null ? sql`` : sql`WHERE yetkazib_beruvchi_id = ANY(${idlar as number[]})`}`,
  ]);

  const kirimXarita = new Map<number, Map<number, KirimMalumoti>>();
  for (const k of kirimlar) {
    const m = kirimXarita.get(k.yetkazib_beruvchi_id) ?? new Map<number, KirimMalumoti>();
    m.set(k.id, { raqam: k.raqam, sana: k.sana, muddat: k.muddat });
    kirimXarita.set(k.yetkazib_beruvchi_id, m);
  }

  const jurnal = new Map<number, JurnalQatori[]>();
  for (const q of qatorlar) {
    const r = jurnal.get(q.yetkazib_beruvchi_id) ?? [];
    r.push({ id: q.id, sana: q.sana, turi: q.turi, summa: q.summa, valyuta: q.valyuta, buyurtmaId: q.kirim_id });
    jurnal.set(q.yetkazib_beruvchi_id, r);
  }

  const bugun = toshkentKuni();
  const natija = new Map<number, YetkazibHolati>();
  const hammasi = new Set([...jurnal.keys(), ...kirimXarita.keys(), ...(idlar ?? [])]);
  for (const id of hammasi) {
    const taqsimot = qarzniTaqsimla(jurnal.get(id) ?? [], 'XARID');
    const k = kirimXarita.get(id) ?? new Map<number, KirimMalumoti>();
    const muddatlar = new Map([...k].map(([kid, v]) => [kid, v.muddat]));
    natija.set(id, {
      taqsimot,
      kirimlar: k,
      muddat: muddatXulosasi(taqsimot.bandlar, muddatlar, bugun),
      intizom: tolovIntizomimiz(taqsimot.bandlar, muddatlar),
    });
  }
  return natija;
}

/** Bitta yetkazib beruvchi — kartochka uchun */
export async function yetkazibHolati(id: number): Promise<YetkazibHolati> {
  const h = (await yetkazibHolatlari([id])).get(id);
  if (h === undefined) throw new Error('yetkazibHolatlari bo‘sh qaytdi');
  return h;
}
