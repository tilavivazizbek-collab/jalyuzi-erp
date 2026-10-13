/**
 * Kunlik admin xabarlari (cron) — LOYIHA §13, TZ 13.9 · 8.16. 2026-10-13.
 *
 * ⚠️ YANGI HISOB YO'Q — har xabar saytdagi sahifa bilan BIR manbadan:
 *    kam qoldiq — «Buyurtma kerak» (`buyurtmaKerak`), to'lov muddati —
 *    yetkazib beruvchilar FIFO taqsimoti (`yetkazibHolatlari`), kechikkan
 *    buyurtmalar — ro'yxatdagi «Muddati o'tgan» sharti.
 * ⚠️ Kuniga bir marta, Telegramli admin bo'lmasa hisoblanmaydi —
 *    `kunigaBirMartaOgohlantir`.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { kunigaBirMartaOgohlantir } from '@/lib/amal/bildirishnoma';
import {
  kamQoldiqMatni,
  kechikkanBuyurtmalarMatni,
  yetkazibMuddatlariMatni,
  type MuddatQatori,
} from '@/lib/domain/bildirishnoma';
import { kunQosh } from '@/lib/domain/hisobot/pul-prognozi';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { toshkentKuni } from '@/lib/domain/sana';
import { buyurtmaKerak } from '../ombor/xarid/kerak-malumot';
import { yetkazibHolatlari, type YetkazibHolati } from '../yetkazib/taqsimot';
import { muddatiOtganSharti } from '../buyurtma/malumot';

type Natija = ReturnType<typeof kunigaBirMartaOgohlantir>;

/** Necha kun oldin ogohlantiriladi (muddati o'tganlari ham kiradi) */
const MUDDAT_OLDIN_KUN = 3;

/** Miqdor (pul emas) — ortiqcha nolsiz: 12.50 → «12.5» */
const miqdor = (n: number): string => new Decimal(n).toDecimalPlaces(2).toString();

const kunFarqi = (a: string, b: string): number =>
  Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

/** TZ 13.9 — kam qolgan material: yo'lda bo'lmagan, buyurtma kutayotganlar */
export async function kamQoldiqXabarlari(hozir: Date = new Date(), filialIdlar?: readonly number[]): Natija {
  const sql = ulanishOl();
  return kunigaBirMartaOgohlantir(sql, {
    hodisa: 'KAM_QOLDIQ',
    manbaTuri: 'kam_qoldiq',
    bugun: toshkentKuni(hozir),
    filialIdlar,
    /**
     * ⚠️ Faqat ombordan FOYDALANADIGAN filial (bitta bo'lsa ham bo'lagi
     *    bor). Aks holda faqat sotadigan filialda chegarasi yozilgan har
     *    material «tugagan» bo'lib, har kuni uzun ro'yxat kelardi
     *    (2026-10-13 testda: yangi filialda 80 ta).
     */
    qoshimchaShart: sql`AND EXISTS (SELECT 1 FROM bolak b WHERE b.filial_id = f.id)`,
    matnYasa: async (filialId) => {
      // ⚠️ Ombor sahifasidagi belgi bilan bir xil shart (`yoldaEmaslar`)
      const r = (await buyurtmaKerak(filialId)).filter(
        (x) => x.yoldaBuyurtma.length === 0 && !x.kochirishdaYolda,
      );
      if (r.length === 0) return null;
      return kamQoldiqMatni(
        r.map((x) => ({
          materialNomi: x.nom,
          qoldiq: `${miqdor(x.qoldiq)} ${x.qoldiqBirligi}`,
          tavsiya: x.tavsiyaKirim === null ? null : `${String(x.tavsiyaKirim)} ${x.kirimBirligi}`,
        })),
      );
    },
  });
}

/** TZ 13.9 — yetkazib beruvchiga to'lov muddati: 3 kun ichida va o'tganlari */
export async function yetkazibMuddatXabarlari(hozir: Date = new Date(), filialIdlar?: readonly number[]): Natija {
  const sql = ulanishOl();
  const bugun = toshkentKuni(hozir);
  const chegara = kunQosh(bugun, MUDDAT_OLDIN_KUN);
  // Taqsimot hamma yetkazib beruvchi uchun BIR marta (filial boshiga emas)
  let holatlar: Map<number, YetkazibHolati> | null = null;

  return kunigaBirMartaOgohlantir(sql, {
    hodisa: 'YETKAZIB_MUDDAT',
    manbaTuri: 'yetkazib_muddat',
    filialIdlar,
    bugun,
    matnYasa: async (filialId) => {
      const kirimlar = new Map(
        (
          await sql<{ id: number; raqam: string; muddat: string; nom: string }[]>`
            SELECT k.id, k.raqam, k.tolov_muddati::text AS muddat, y.nom
            FROM kirim k JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
            WHERE k.filial_id = ${filialId} AND k.holat = 'FAOL'
              AND k.tolov_muddati IS NOT NULL AND k.tolov_muddati <= ${chegara}::date`
        ).map((k) => [k.id, k]),
      );
      if (kirimlar.size === 0) return null;
      holatlar ??= await yetkazibHolatlari(null);

      // Kirim × valyuta bo'yicha qoldiq (bir kirimda bir necha band bo'lishi mumkin)
      const qoldiq = new Map<string, { kirimId: number; valyuta: 'SOM' | 'USD'; summa: Decimal }>();
      for (const h of holatlar.values()) {
        for (const b of h.taqsimot.bandlar) {
          if (b.buyurtmaId === null || !kirimlar.has(b.buyurtmaId) || !new Decimal(b.qolgan).gt(0)) continue;
          const kalit = `${String(b.buyurtmaId)}:${b.valyuta}`;
          const q = qoldiq.get(kalit) ?? { kirimId: b.buyurtmaId, valyuta: b.valyuta, summa: new Decimal(0) };
          qoldiq.set(kalit, { ...q, summa: q.summa.plus(b.qolgan) });
        }
      }
      const qatorlar: MuddatQatori[] = [];
      for (const q of qoldiq.values()) {
        const k = kirimlar.get(q.kirimId);
        if (k === undefined) continue;
        const s = q.summa.toFixed(2);
        qatorlar.push({
          nomi: k.nom,
          hujjat: k.raqam,
          summa: q.valyuta === 'USD' ? `${pulKorsat(dollar(s))} $` : `${pulKorsat(som(s))} so'm`,
          kunQoldi: kunFarqi(k.muddat, bugun),
        });
      }
      return qatorlar.length === 0 ? null : yetkazibMuddatlariMatni(qatorlar);
    },
  });
}

/** TZ 8.16 — tayyorlik sanasi o'tgan buyurtmalar (sotgan filial adminlariga) */
export async function kechikkanBuyurtmaXabarlari(hozir: Date = new Date(), filialIdlar?: readonly number[]): Natija {
  const sql = ulanishOl();
  const bugun = toshkentKuni(hozir);
  return kunigaBirMartaOgohlantir(sql, {
    hodisa: 'KECHIKKAN_BUYURTMA',
    manbaTuri: 'kechikkan_buyurtma',
    filialIdlar,
    bugun,
    matnYasa: async (filialId) => {
      const r = await sql<{ raqam: string; mijoz: string | null; sana: string }[]>`
        SELECT b.raqam, m.ism AS mijoz, b.tayyorlik_sana::text AS sana
        FROM buyurtma b LEFT JOIN mijoz m ON m.id = b.mijoz_id
        WHERE b.sotgan_filial_id = ${filialId}
          ${muddatiOtganSharti(bugun)}`;
      if (r.length === 0) return null;
      return kechikkanBuyurtmalarMatni(
        r.map((x) => ({ raqam: x.raqam, mijoz: x.mijoz ?? '—', kun: kunFarqi(bugun, x.sana) })),
      );
    },
  });
}
