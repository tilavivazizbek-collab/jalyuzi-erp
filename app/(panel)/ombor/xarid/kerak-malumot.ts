/**
 * «Buyurtma kerak» ro'yxati — ombor auditi 2026-10-07, 8-band.
 *
 * ⚠️ HISOB BU YERDA YO'Q — hammasi tayyor joylardan:
 *    · qoldiq va chegara        → `filialQoldigi` (ombor sahifasi bilan bir)
 *    · sarf tezligi, bashorat   → `sarflanishTezligi` (ombor hisoboti bilan bir)
 *    · yo'ldagi buyurtmalar     → `yoldagiBuyurtmalar`
 *    · qaror                    → `lib/domain/xarid-kerak.ts`
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { ortachaTezlik, qanchaKerak, type Bashorat } from '@/lib/domain/hisobot/bashorat';
import { chegaraBirligi } from '@/lib/domain/birlik-tanlovi';
import {
  sababTartibi,
  xaridSababi,
  yetkazishMuddati,
  type XaridSababi,
  type YetkazishMuddati,
} from '@/lib/domain/xarid-kerak';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import { sarflanishTezligi } from '../../hisobot/malumot';
import { filialQoldigi } from '../malumot';
import { yoldagiBuyurtmalar, type YoldagiBuyurtma } from './malumot';

/** Sarf tezligi shu kunlardan — material kartochkasi bilan bir xil (chorak) */
const TEZLIK_KUNI = 90;
/** Tavsiya: yetkazib berish muddati + shuncha kunga yetadigan miqdor */
const TAVSIYA_KUNI = 30;

export interface KerakQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly sababi: XaridSababi;
  /** Chegara birligida (rulon — metr, dona — dona) */
  readonly qoldiq: number;
  readonly qoldiqBirligi: string;
  readonly chegara: number | null;
  readonly bashorat: Bashorat | null;
  /** Kuniga, sarflash birligida; `null` — harakat yo'q */
  readonly kunlikSarf: string | null;
  readonly sarfBirligi: string;
  /** Yetkazish + 30 kunga yetishi uchun, sarflash birligida; `null` — tezlik yo'q */
  readonly tavsiya: string | null;
  readonly yetkazish: YetkazishMuddati;
  readonly yoldaBuyurtma: readonly YoldagiBuyurtma[];
  /** Boshqa filialdan jo'natilgan, hali qabul qilinmagan (20.7) */
  readonly kochirishdaYolda: boolean;
  readonly oxirgiYetkazib: { readonly id: number; readonly nom: string } | null;
}

/**
 * Har material uchun o'tgan buyurtmalardagi kutish kunlari: buyurtma
 * sanasi → shu material birinchi kelgan FAOL kirim.
 */
async function kutishKunlari(filialId: number): Promise<Map<number, number[]>> {
  const q = await ulanishOl()<{ material_id: number; kun: number }[]>`
    SELECT q.material_id, (MIN(k.sana) - x.sana)::int AS kun
    FROM xarid_buyurtma x
    JOIN xarid_buyurtma_qator q ON q.xarid_buyurtma_id = x.id
    JOIN kirim k ON k.xarid_buyurtma_id = x.id AND k.holat = 'FAOL'
    JOIN kirim_qator kq ON kq.kirim_id = k.id AND kq.material_id = q.material_id
    WHERE x.filial_id = ${filialId}
    GROUP BY x.id, x.sana, q.material_id`;
  const r = new Map<number, number[]>();
  for (const x of q) r.set(x.material_id, [...(r.get(x.material_id) ?? []), x.kun]);
  return r;
}

/** Material oxirgi marta kimdan kelgan — buyurtma shu odamga ketadi */
async function oxirgiYetkazuvchilar(
  filialId: number,
): Promise<Map<number, { id: number; nom: string }>> {
  const q = await ulanishOl()<{ material_id: number; id: number; nom: string }[]>`
    SELECT DISTINCT ON (kq.material_id) kq.material_id, y.id, y.nom
    FROM kirim k
    JOIN kirim_qator kq ON kq.kirim_id = k.id
    JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id AND y.faol
    WHERE k.filial_id = ${filialId} AND k.holat = 'FAOL'
    ORDER BY kq.material_id, k.sana DESC, k.id DESC`;
  return new Map(q.map((x) => [x.material_id, { id: x.id, nom: x.nom }]));
}

export async function buyurtmaKerak(filialId: number): Promise<KerakQatori[]> {
  const bugun = new Date();
  const boshi = new Date(bugun.getTime() - TEZLIK_KUNI * 24 * 60 * 60 * 1000);
  const davr = davrYasa('ORALIQ', bugun, { boshi, oxiri: bugun });

  const [qoldiqlar, tezliklar, yolda, kutish, yetkazuvchilar, faollar] = await Promise.all([
    filialQoldigi(filialId),
    sarflanishTezligi(filialId, davr),
    yoldagiBuyurtmalar(filialId, null),
    kutishKunlari(filialId),
    oxirgiYetkazuvchilar(filialId),
    ulanishOl()<{ id: number }[]>`SELECT id FROM material WHERE faol`,
  ]);
  const faol = new Set(faollar.map((x) => x.id));
  const tezlikXaritasi = new Map(tezliklar.map((t) => [t.materialId, t]));

  const natija: KerakQatori[] = [];
  for (const q of qoldiqlar) {
    // Nofaol material qayta olinmaydi (5.1)
    if (!faol.has(q.materialId)) continue;
    const t = tezlikXaritasi.get(q.materialId);
    const sarfBor = t !== undefined && t.sarf > 0;
    const yetkazish = yetkazishMuddati(kutish.get(q.materialId) ?? []);

    const sababi = xaridSababi({
      /**
       * ⚠️ Bo'sh — faqat ISHLATILADIGAN material uchun «tugagan»:
       *    chegarasi yozilgan yoki chorak ichida sarflangan. Aks holda
       *    katalogdagi har bir hech qachon olinmagan mato chiqib ketardi.
       */
      tugagan: q.tugagan && (q.kamQoldiqChegaraM !== null || sarfBor),
      kamQoldiq: q.kamQoldiq,
      bashorat: sarfBor ? t.bashorat : null,
      yetkazishKuni: yetkazish.kun,
    });
    if (sababi === null) continue;

    const tezlik = sarfBor ? ortachaTezlik(t.sarf, TEZLIK_KUNI) : null;
    natija.push({
      materialId: q.materialId,
      nom: q.nom,
      sababi,
      qoldiq: q.chegaraQoldiq,
      qoldiqBirligi: chegaraBirligi(q.sarflashBirligi),
      chegara: q.kamQoldiqChegaraM,
      bashorat: sarfBor ? t.bashorat : null,
      kunlikSarf: tezlik === null ? null : tezlik.kunlik.toDecimalPlaces(2).toFixed(2),
      sarfBirligi: SARFLASH_BIRLIGI_NOMI[q.sarflashBirligi as SarflashBirligi] ?? q.sarflashBirligi,
      tavsiya:
        tezlik === null || t === undefined
          ? null
          : new Decimal(qanchaKerak(t.qoldiq, tezlik, yetkazish.kun + TAVSIYA_KUNI))
              .toDecimalPlaces(0, Decimal.ROUND_UP)
              .toFixed(0),
      yetkazish,
      yoldaBuyurtma: yolda.filter((y) => y.materialId === q.materialId),
      kochirishdaYolda: q.yoldaKvM > 0,
      oxirgiYetkazib: yetkazuvchilar.get(q.materialId) ?? null,
    });
  }

  return natija.sort(
    (a, b) =>
      sababTartibi(a.sababi) - sababTartibi(b.sababi) ||
      (a.bashorat?.kunlar ?? 0) - (b.bashorat?.kunlar ?? 0) ||
      a.nom.localeCompare(b.nom),
  );
}

/** Ombor sahifasidagi belgi uchun — yo'lda bo'lmagan, buyurtma kutayotganlar soni */
export function yoldaEmaslar(r: readonly KerakQatori[]): number {
  return r.filter((x) => x.yoldaBuyurtma.length === 0 && !x.kochirishdaYolda).length;
}
