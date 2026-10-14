/**
 * QARZDORLIK HISOBOTI — debitorlik qarishi · TZ 6.7 · 11.6
 *
 * Egasi auditi 2026-10-06: «har qanday ERP da birinchi hisobot — kimda
 * qancha qarz, qanchasi eskirgan, kim to'lashni va'da qilgan».
 *
 * ⚠️ HISOB BITTA JOYDA — `qarzniTaqsimla()`. Kartochka, ro'yxat va shu
 *    hisobot bir xil raqam ko'rsatadi: kartochkadan to'langan pul eng
 *    eski buyurtmani yopadi, buyurtmaga to'langani o'sha buyurtmani.
 */
import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { joriyKurs } from '@/lib/amal/kurs';
import { telefonKorsat } from '@/lib/domain/telefon';
import {
  YOSH_ORALIQLARI,
  muddatOtganQarz,
  qarzYoshi,
  qarzniTaqsimla,
  type QarzYoshi,
  type YoshOraligi,
} from '@/lib/domain/qarz-taqsimot';
import Decimal from 'decimal.js';
import { dollar, musbatmi, pulKorsat, pulMatn, qosh, som, nolSom, nolDollar } from '@/lib/domain/pul';
import { OddiyChopTugmasi } from '../../chop-tugma';
import { qarzdorlarJurnali } from '../qarz-malumot';
import { qarzEslatmaQoidasi } from '../qarz-eslatma';
import { EslatmaQoidaFormasi } from './eslatma-forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { filtrTanlovlari } from '../malumot';

export const dynamic = 'force-dynamic';

interface Vada {
  readonly mijoz_id: number;
  readonly mijoz_ismi: string;
  readonly vada_sana: string;
  readonly vada_summa: string | null;
  readonly vada_valyuta: string | null;
  readonly matn: string;
  readonly kechikdi: boolean;
  readonly bugun: boolean;
}

/** Ochiq va'dalar: kechikkan, bugungi va keyingi 7 kun */
async function yaqinVadalar(): Promise<Vada[]> {
  return ulanishOl()<Vada[]>`
    WITH b AS (SELECT (now() AT TIME ZONE 'Asia/Tashkent')::date AS kun)
    SELECT v.mijoz_id, m.ism AS mijoz_ismi,
           to_char(v.vada_sana, 'YYYY-MM-DD') AS vada_sana,
           v.vada_summa::text AS vada_summa, v.vada_valyuta, v.matn,
           v.vada_sana < b.kun AS kechikdi,
           v.vada_sana = b.kun AS bugun
    FROM mijoz_muloqot v
    JOIN mijoz m ON m.id = v.mijoz_id, b
    WHERE v.turi = 'VADA' AND NOT v.bajarildi
      AND v.vada_sana <= b.kun + 7
    ORDER BY v.vada_sana, m.ism`;
}

/** Har mijoz uchun eng yaqin ochiq va'da */
function vadaXaritasi(vadalar: readonly Vada[]): Map<number, Vada> {
  const x = new Map<number, Vada>();
  for (const v of vadalar) if (!x.has(v.mijoz_id)) x.set(v.mijoz_id, v);
  return x;
}

const bosh = (): QarzYoshi => ({ '0-30': '0', '31-60': '0', '61-90': '0', '90+': '0' });

export default async function QarzdorlikHisoboti({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('mijoz.kor');
  const sp = await searchParams;
  const masulXom = typeof sp['masul'] === 'string' ? sp['masul'] : '';

  const [qarzdorlar, vadalar, tanlov, kurs, eslatmaQoidasi] = await Promise.all([
    qarzdorlarJurnali(),
    yaqinVadalar(),
    filtrTanlovlari(),
    joriyKurs(ulanishOl()),
    // T-06 — avtomatik qarz eslatmasi qoidasi
    qarzEslatmaQoidasi(),
  ]);
  const masulIsmi = tanlov.xodimlar.find((x) => String(x.id) === masulXom)?.nom ?? null;
  const vadaBoyicha = vadaXaritasi(vadalar);
  const bugun = new Date();

  const qatorlar = qarzdorlar
    .filter((m) => masulIsmi === null || m.masulIsmi === masulIsmi)
    .map((m) => {
      const t = qarzniTaqsimla(m.jurnal);
      const oxirgiTolov = m.jurnal
        .filter((j) => j.turi === 'TOLOV')
        .reduce<Date | null>((y, j) => (y === null || j.sana > y ? j.sana : y), null);
      return {
        m,
        qarzSom: t.qarz.SOM,
        qarzUsd: t.qarz.USD,
        yoshSom: qarzYoshi(t.bandlar, 'SOM', bugun),
        yoshUsd: qarzYoshi(t.bandlar, 'USD', bugun),
        otganSom: muddatOtganQarz(t.bandlar, 'SOM', m.tolovMuddatiKun, bugun),
        otganUsd: muddatOtganQarz(t.bandlar, 'USD', m.tolovMuddatiKun, bugun),
        oxirgiTolov,
        vada: vadaBoyicha.get(m.mijozId) ?? null,
      };
    })
    // ⚠️ Faqat QARZDORLAR — avansi borlar bu hisobotga kirmaydi
    .filter((r) => musbatmi(som(r.qarzSom)) || musbatmi(dollar(r.qarzUsd)))
    /** Saralash — jami qarz so'mda, dollar JORIY kursda (faqat tartib uchun) */
    .sort((a, b) => {
      const k = new Decimal(kurs ?? 0);
      const jami = (r: { qarzSom: string; qarzUsd: string }): Decimal =>
        new Decimal(r.qarzSom).plus(new Decimal(r.qarzUsd).times(k));
      return jami(b).comparedTo(jami(a));
    });

  // Jami — valyutalar ALOHIDA (1.3)
  const jamiSom = { ...bosh() } as Record<YoshOraligi, string>;
  const jamiUsd = { ...bosh() } as Record<YoshOraligi, string>;
  let otganSom = nolSom();
  let otganUsd = nolDollar();
  for (const r of qatorlar) {
    for (const o of YOSH_ORALIQLARI) {
      jamiSom[o] = pulMatn(qosh(som(jamiSom[o]), som(r.yoshSom[o])));
      jamiUsd[o] = pulMatn(qosh(dollar(jamiUsd[o]), dollar(r.yoshUsd[o])));
    }
    otganSom = qosh(otganSom, som(r.otganSom.summa));
    otganUsd = qosh(otganUsd, dollar(r.otganUsd.summa));
  }
  const somJami = YOSH_ORALIQLARI.reduce((s, o) => qosh(s, som(jamiSom[o])), nolSom());
  const dollarJami = YOSH_ORALIQLARI.reduce((s, o) => qosh(s, dollar(jamiUsd[o])), nolDollar());

  const tanla = 'rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px]';
  const pulYoki = (x: string, v: 'SOM' | 'USD') => {
    const p = v === 'SOM' ? som(x) : dollar(x);
    return musbatmi(p) ? pulKorsat(p) : '—';
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/mijoz" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Mijozlar
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Qarzdorlik hisoboti
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta qarzdor{masulIsmi !== null ? ` · mas'ul: ${masulIsmi}` : ''} ·
            qarz yoshi buyurtma sanasidan sanaladi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex items-center gap-2">
            <select name="masul" defaultValue={masulXom} aria-label="Mas'ul" className={tanla}>
              <option value="">Barcha sotuvchilar</option>
              {tanlov.xodimlar.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nom}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-tugma-matn">
              Ko&apos;rsatish
            </button>
          </form>
          <OddiyChopTugmasi matn="Chop etish" />
        </div>
      </div>

      <EslatmaQoidaFormasi
        birinchiKun={eslatmaQoidasi.birinchiKun}
        takrorKun={eslatmaQoidasi.takrorKun}
        ozgartiraOladi={ruxsatBormi(f, 'sozlama.ozgartir')}
      />

      {vadalar.length > 0 && (
        <section className="rounded-karta border border-chegara bg-sirt p-4">
          <h2 className="mb-2 text-sm font-semibold text-matn">To&apos;lov va&apos;dalari — yaqin 7 kun</h2>
          <ul className="flex flex-col gap-1 text-[13px]">
            {vadalar.map((v, i) => (
              <li key={`${String(v.mijoz_id)}-${String(i)}`} className="flex flex-wrap gap-2">
                <span
                  className={`raqam w-24 shrink-0 ${
                    v.kechikdi ? 'font-medium text-belgi-qizil' : v.bugun ? 'font-medium text-belgi-sariq' : 'text-matn-ikki'
                  }`}
                >
                  {v.vada_sana}
                  {v.kechikdi ? ' !' : v.bugun ? ' · bugun' : ''}
                </span>
                <Link href={`/mijoz/${String(v.mijoz_id)}`} className="font-medium text-brend hover:underline">
                  {v.mijoz_ismi}
                </Link>
                {v.vada_summa !== null && (
                  <span className="raqam">
                    {v.vada_valyuta === 'USD'
                      ? `${pulKorsat(dollar(v.vada_summa))} $`
                      : `${pulKorsat(som(v.vada_summa))} so'm`}
                  </span>
                )}
                <span className="text-matn-kuchsiz">— {v.matn}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="varaqa overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-3 py-2.5 font-medium">Mijoz</th>
              <th className="px-3 py-2.5 text-right font-medium">Jami qarz</th>
              {YOSH_ORALIQLARI.map((o) => (
                <th key={o} className="px-3 py-2.5 text-right font-medium">
                  {o} kun
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-medium">Muddati o&apos;tgan</th>
              <th className="px-3 py-2.5 font-medium">Oxirgi to&apos;lov</th>
              <th className="px-3 py-2.5 font-medium">Va&apos;da</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara">
            {qatorlar.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-matn-kuchsiz">
                  Qarzdor yo&apos;q.
                </td>
              </tr>
            )}
            {qatorlar.map((r) =>
              (['SOM', 'USD'] as const)
                .filter((v) => musbatmi(v === 'SOM' ? som(r.qarzSom) : dollar(r.qarzUsd)))
                .map((v, i) => {
                  const yosh = v === 'SOM' ? r.yoshSom : r.yoshUsd;
                  const otgan = v === 'SOM' ? r.otganSom : r.otganUsd;
                  return (
                    <tr key={`${String(r.m.mijozId)}-${v}`}>
                      <td className="px-3 py-2">
                        {i === 0 && (
                          <>
                            <Link
                              href={`/mijoz/${String(r.m.mijozId)}`}
                              className="font-medium text-brend hover:underline"
                            >
                              {r.m.ism}
                            </Link>
                            <span className="block text-xs text-matn-kuchsiz">
                              {r.m.telefon === null ? '' : telefonKorsat(r.m.telefon)}
                              {r.m.masulIsmi !== null && ` · ${r.m.masulIsmi}`}
                              {r.m.tolovMuddatiKun !== null && ` · muddat ${String(r.m.tolovMuddatiKun)} kun`}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="raqam px-3 py-2 text-right font-medium whitespace-nowrap">
                        {pulYoki(v === 'SOM' ? r.qarzSom : r.qarzUsd, v)} {v === 'SOM' ? "so'm" : '$'}
                      </td>
                      {YOSH_ORALIQLARI.map((o) => (
                        <td
                          key={o}
                          className={`raqam px-3 py-2 text-right whitespace-nowrap ${
                            (o === '61-90' || o === '90+') && pulYoki(yosh[o], v) !== '—'
                              ? 'font-medium text-belgi-qizil'
                              : 'text-matn-ikki'
                          }`}
                        >
                          {pulYoki(yosh[o], v)}
                        </td>
                      ))}
                      <td className="raqam px-3 py-2 text-right whitespace-nowrap text-belgi-qizil">
                        {pulYoki(otgan.summa, v)}
                        {otgan.engEskiKun !== null && (
                          <span className="block text-[11px]">{otgan.engEskiKun} kun kechikdi</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-matn-ikki">
                        {i === 0 && (r.oxirgiTolov === null ? '—' : r.oxirgiTolov.toLocaleDateString('uz-UZ'))}
                      </td>
                      <td className="px-3 py-2 text-[13px] whitespace-nowrap">
                        {i === 0 && r.vada !== null && (
                          <span className={r.vada.kechikdi ? 'text-belgi-qizil' : 'text-matn-ikki'}>
                            {r.vada.vada_sana}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }),
            )}
          </tbody>
          {qatorlar.length > 0 && (
            <tfoot className="border-t-2 border-chegara-quyuq font-medium">
              <tr>
                <td className="px-3 py-2">Jami, so&apos;m</td>
                <td className="raqam px-3 py-2 text-right">{pulKorsat(somJami)}</td>
                {YOSH_ORALIQLARI.map((o) => (
                  <td key={o} className="raqam px-3 py-2 text-right">
                    {pulYoki(jamiSom[o], 'SOM')}
                  </td>
                ))}
                <td className="raqam px-3 py-2 text-right text-belgi-qizil">
                  {musbatmi(otganSom) ? pulKorsat(otganSom) : '—'}
                </td>
                <td colSpan={2} />
              </tr>
              {musbatmi(dollarJami) && (
                <tr>
                  <td className="px-3 py-2">Jami, $</td>
                  <td className="raqam px-3 py-2 text-right">{pulKorsat(dollarJami)}</td>
                  {YOSH_ORALIQLARI.map((o) => (
                    <td key={o} className="raqam px-3 py-2 text-right">
                      {pulYoki(jamiUsd[o], 'USD')}
                    </td>
                  ))}
                  <td className="raqam px-3 py-2 text-right text-belgi-qizil">
                    {musbatmi(otganUsd) ? pulKorsat(otganUsd) : '—'}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
