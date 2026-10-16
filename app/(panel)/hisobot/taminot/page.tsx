import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import { narxDinamikasi } from '../taminot-malumot';

export const dynamic = 'force-dynamic';

/**
 * TZ 11.9.1 — ta'minot: narx dinamikasi. 2026-10-15
 *
 * ⚠️ Ruxsat `hisobot.ombor.kor` — kelish narxi tannarx (11.10), sotuvchida yo'q.
 * ⚠️ Standart davr YIL: narx oyda bir-ikki marta o'zgaradi, oylik ko'rinish bo'sh chiqardi.
 */
const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
  { kod: 'YIL', nom: 'Yil' },
];

const TD = 'px-4 py-2.5';
const birlik = (b: string): string => SARFLASH_BIRLIGI_NOMI[b as SarflashBirligi] ?? b;
const foizMatn = (f: number | null): string => (f === null ? '—' : `${f > 0 ? '+' : f < 0 ? '−' : ''}${Math.abs(f).toFixed(1)}%`);
const foizRang = (f: number | null): string =>
  f === null ? '' : f >= 5 ? 'text-belgi-qizil' : f <= -5 ? 'text-belgi-yashil' : 'text-matn-ikki';

export default async function TaminotHisoboti({
  searchParams,
}: {
  searchParams: Promise<{ davr?: string }>;
}) {
  const f = await sahifaRuxsati('hisobot.ombor.kor');
  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri = davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'YIL';
  const davr = davrYasa(davrTuri, new Date());
  const d = await narxDinamikasi(f.filialId, davr);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Ta&apos;minot — narx dinamikasi</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">{davrMatn(davr)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAVRLAR.map((x) => (
          <Link
            key={x.kod}
            href={`/hisobot/taminot?davr=${x.kod}`}
            className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
              x.kod === davrTuri ? 'border-brend bg-brend text-tugma-matn' : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
            }`}
          >
            {x.nom}
          </Link>
        ))}
        {/* TZ 11.2 — ikki varaq: yig'ma va har kelish */}
        <a
          href={`/hisobot/taminot/eksport?davr=${davrTuri}`}
          className="ml-auto rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
        >
          Excel&apos;ga yuklash
        </a>
      </div>

      <p className="text-xs text-matn-kuchsiz">
        Narx — 1 kv.m / 1 metr / 1 dona necha so&apos;mga tushgani (transport bilan). Kirimdagi narx bir safar
        rulonga, bir safar metrga yoki dollarda kiritilishi mumkin — shuning uchun ular to&apos;g&apos;ridan
        solishtirilmaydi.
      </p>

      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Yetkazib beruvchilar — kim narx ko&apos;targan</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Davrdagi har kelish o&apos;sha yetkazib beruvchining shu materialdagi OLDINGI kelishi bilan solishtirildi.
        </p>
        {d.yetkazibBeruvchilar.length === 0 ? (
          <Bosh matn="Davrda solishtirsa bo‘ladigan takroriy kelish yo‘q." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                <tr>
                  <th className={`${TD} font-medium`}>Yetkazib beruvchi</th>
                  <th className={`${TD} text-right font-medium`}>Solishtirildi</th>
                  <th className={`${TD} text-right font-medium`}>Ko&apos;tardi</th>
                  <th className={`${TD} text-right font-medium`}>Tushirdi</th>
                  <th className={`${TD} text-right font-medium`}>O&apos;rtacha</th>
                  <th className={`${TD} font-medium`}>Eng ko&apos;p ko&apos;targani</th>
                </tr>
              </thead>
              <tbody>
                {d.yetkazibBeruvchilar.slice(0, 50).map((y) => (
                  <tr key={y.yetkazibId} className="border-b border-chegara last:border-0">
                    <td className={TD}>
                      <Link href={`/yetkazib/${String(y.yetkazibId)}`} className="text-brend hover:underline">
                        {y.nom}
                      </Link>
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{y.solishtirildi}</td>
                    <td className={`${TD} text-right tabular-nums`}>{y.kotardi}</td>
                    <td className={`${TD} text-right tabular-nums`}>{y.tushirdi}</td>
                    <td className={`${TD} text-right tabular-nums ${foizRang(y.ortachaFoiz)}`}>{foizMatn(y.ortachaFoiz)}</td>
                    <td className={TD}>
                      {y.engKatta === null ? '—' : `${y.engKatta.material} ${foizMatn(y.engKatta.foiz)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Materiallar — qaysi biri qimmatlashayapti</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Oxirgi uchta kelish (oxirgisi shu davrda), eng ko&apos;p qimmatlagan tepada. Ustama eroziyasi —
          Ombor hisobotida.
        </p>
        {d.materiallar.length === 0 ? (
          <Bosh matn="Davrda kamida ikki marta kelgan material yo‘q." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                <tr>
                  <th className={`${TD} font-medium`}>Material</th>
                  <th className={`${TD} font-medium`}>Kelish narxlari</th>
                  <th className={`${TD} text-right font-medium`}>O&apos;zgarish</th>
                </tr>
              </thead>
              <tbody>
                {d.materiallar.slice(0, 100).map((m) => (
                  <tr key={m.materialId} className="border-b border-chegara last:border-0">
                    <td className={TD}>
                      {m.material}
                      <span className="text-xs text-matn-kuchsiz"> · 1 {birlik(m.birlik)}</span>
                    </td>
                    <td className={`${TD} tabular-nums`}>
                      {m.narxlar.map((n, i) => (
                        <span key={`${n.sana}-${String(i)}`} title={`${n.sana}${n.yetkazib === null ? '' : ` · ${n.yetkazib}`}`}>
                          {i > 0 && <span className="text-matn-kuchsiz"> → </span>}
                          {pulKorsat(som(n.narx))}
                        </span>
                      ))}
                    </td>
                    <td className={`${TD} text-right tabular-nums ${foizRang(m.foiz)}`}>
                      {foizMatn(m.foiz)}
                      {m.oylar !== null && <span className="text-xs text-matn-kuchsiz"> · {m.oylar} oyda</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Bosh({ matn }: { matn: string }) {
  return (
    <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
      {matn}
    </p>
  );
}
