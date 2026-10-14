/**
 * Mijozga avtomatik qarz eslatmasi — TZ 13.6, LOYIHA T-06 va §13
 * (`/api/cron/qarz-eslatma`, 10:00). 2026-10-14. Egasi roziligi bilan.
 *
 * ⚠️ «Muddati o'tgan» — `muddatOtganQarz` (kartochka, qarzdorlar ro'yxati,
 *    pul prognozi bilan BITTA hisob, FIFO `qarzniTaqsimla`).
 * ⚠️ Oxirgi eslatma — `bot_xabar` dagi `qarz_eslatma` yozuvi: kartochkadagi
 *    QO'LDA yuborilgani ham shu manba bilan yoziladi, shuning uchun sotuvchi
 *    kecha eslatgan mijozga bugun tizim yana yozmaydi.
 * ⚠️ Telegrami yo'q mijoz o'tkaziladi (`mijozniOgohlantir` — 13.11: sotuvchi
 *    qo'ng'iroq qiladi). Yuborilgani muloqot tarixiga yoziladi (CRM).
 * ⚠️ Summa — MUDDATI O'TGAN qism (eslatma shu uchun ketyapti), valyutalar alohida.
 */

import { ulanishOl } from '@/lib/db';
import { mijozniOgohlantir } from '@/lib/amal/bildirishnoma';
import { muloqotYoz } from '@/lib/amal/mijoz-crm';
import { qarzEslatmaMatni } from '@/lib/domain/bildirishnoma';
import { kunFarqi, muddatOtganQarz, qarzniTaqsimla } from '@/lib/domain/qarz-taqsimot';
import {
  STANDART_QARZ_ESLATMA,
  qarzEslatmaKerakmi,
  type QarzEslatmaQoidasi,
} from '@/lib/domain/qarz-eslatma';
import { dollar, musbatmi, pulKorsat, som } from '@/lib/domain/pul';
import { qarzdorlarJurnali } from './qarz-malumot';

/** Tizim nomidan (bot/mijoz.ts dagi kabi) */
const TIZIM_XODIM = 1;
const MANBA = 'qarz_eslatma';

const KALIT = { birinchi: 'qarz_eslatma_kun', takror: 'qarz_eslatma_takror' } as const;

export async function qarzEslatmaQoidasi(): Promise<QarzEslatmaQoidasi> {
  const q = await ulanishOl()<{ kalit: string; qiymat: string }[]>`
    SELECT kalit, qiymat FROM sozlama WHERE kalit = ANY(${Object.values(KALIT)})`;
  const x = new Map(q.map((r) => [r.kalit, r.qiymat]));
  const son = (k: string, s: number): number => {
    const v = x.get(k);
    return v !== undefined && /^\d{1,2}$/.test(v) ? Number(v) : s;
  };
  return {
    birinchiKun: son(KALIT.birinchi, STANDART_QARZ_ESLATMA.birinchiKun),
    takrorKun: son(KALIT.takror, STANDART_QARZ_ESLATMA.takrorKun),
  };
}

export async function qarzEslatmaQoidasiniSaqla(q: QarzEslatmaQoidasi, xodimId: number, filialId: number): Promise<void> {
  const sql = ulanishOl();
  await sql.begin(async (tx) => {
    for (const [kalit, qiymat, izoh] of [
      [KALIT.birinchi, String(q.birinchiKun), "Qarz eslatmasi: muddatdan necha kun keyin (0 — o'chiq)"],
      [KALIT.takror, String(q.takrorKun), 'Qarz eslatmasi: necha kunda bir takrorlanadi'],
    ] as const) {
      await tx`
        INSERT INTO sozlama (kalit, qiymat, turi, guruh, tz_band, izoh, yaratdi_id)
        VALUES (${kalit}, ${qiymat}, 'MATN', 'MIJOZ', '13.6', ${izoh}, ${xodimId})
        ON CONFLICT (kalit) DO UPDATE SET qiymat = ${qiymat}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}`;
    }
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'SOZLAMA_OZGARDI', 'sozlama', 0, ${tx.json({ ...q })},
              ${'Qarz eslatmasi qoidasi (T-06)'})`;
  });
}

/**
 * @param mijozIdlar `undefined` — hamma qarzdor (cron); berilsa faqat shular (sinov)
 */
export async function qarzEslatmalariniYubor(
  hozir: Date = new Date(),
  mijozIdlar?: readonly number[],
): Promise<{ yuborildi: number; telegramsiz: number }> {
  const sql = ulanishOl();
  const qoida = await qarzEslatmaQoidasi();
  if (qoida.birinchiKun <= 0) return { yuborildi: 0, telegramsiz: 0 };

  const qarzdorlar = (await qarzdorlarJurnali()).filter(
    (m) => m.tolovMuddatiKun !== null && (mijozIdlar === undefined || mijozIdlar.includes(m.mijozId)),
  );
  if (qarzdorlar.length === 0) return { yuborildi: 0, telegramsiz: 0 };

  const oxirgi = new Map(
    (
      await sql<{ mijoz_id: number; sana: Date }[]>`
        SELECT manba_id AS mijoz_id, MAX(yaratildi) AS sana FROM bot_xabar
        WHERE manba_turi = ${MANBA} AND manba_id = ANY(${qarzdorlar.map((m) => m.mijozId)})
        GROUP BY manba_id`
    ).map((r) => [r.mijoz_id, r.sana]),
  );

  let yuborildi = 0;
  let telegramsiz = 0;
  for (const m of qarzdorlar) {
    const bandlar = qarzniTaqsimla(m.jurnal).bandlar;
    const s = muddatOtganQarz(bandlar, 'SOM', m.tolovMuddatiKun, hozir);
    const d = muddatOtganQarz(bandlar, 'USD', m.tolovMuddatiKun, hozir);
    const kechikish = [s.engEskiKun, d.engEskiKun].reduce<number | null>(
      (a, k) => (k === null ? a : a === null ? k : Math.max(a, k)),
      null,
    );
    const o = oxirgi.get(m.mijozId);
    if (!qarzEslatmaKerakmi(qoida, kechikish, o === undefined ? null : kunFarqi(o, hozir))) continue;

    const qismlar: string[] = [];
    if (musbatmi(som(s.summa))) qismlar.push(`${pulKorsat(som(s.summa))} so‘m`);
    if (musbatmi(dollar(d.summa))) qismlar.push(`${pulKorsat(dollar(d.summa))} $`);
    if (qismlar.length === 0) continue;
    const summa = qismlar.join(' va ');

    const n = await mijozniOgohlantir(
      sql,
      { mijozId: m.mijozId, matn: qarzEslatmaMatni(summa), manbaTuri: MANBA, manbaId: m.mijozId },
      TIZIM_XODIM,
    );
    if (!n.yozildi) {
      telegramsiz += 1;
      continue;
    }
    await muloqotYoz(
      sql,
      m.mijozId,
      { turi: 'XABAR', matn: `Avtomatik qarz eslatmasi (muddati ${String(kechikish)} kun o‘tgan): ${summa}` },
      TIZIM_XODIM,
    );
    yuborildi += 1;
  }
  return { yuborildi, telegramsiz };
}
