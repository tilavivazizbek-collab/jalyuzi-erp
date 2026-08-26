import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { BekorTugmasi } from '../chiqim/bekor';
import { pulKorsat, som } from '@/lib/domain/pul';
import { daraja } from '@/lib/domain/kesish';
import {
  materialBolaklari,
  materialHarakatlari,
  materialSarlavhasi,
  oxirgiSanoq,
  type BolakQatori,
  type HarakatQatori,
} from '../malumot';

export const dynamic = 'force-dynamic';

const HOLAT_NOMI: Record<string, string> = {
  BOSH: "bo'sh",
  BAND: 'band',
  YOLDA: "yo'lda",
  ISHLATILDI: 'ishlatilgan',
  BRAK: 'brak',
  CHIQINDI: 'chiqindi',
};

const HARAKAT_NOMI: Record<string, string> = {
  KIRIM: 'Kirim',
  KESIM: 'Kesim',
  OSTATKA: 'Qoldiq kesma',
  CHIQINDI: 'Chiqindi',
  BRAK: 'Hisobdan chiqarildi',
  KOCHIRISH_CHIQDI: "Ko'chirish — chiqdi",
  KOCHIRISH_KIRDI: "Ko'chirish — kirdi",
  INVENTARIZATSIYA: 'Inventarizatsiya',
  STORNO: 'Storno',
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

const CHEGARALAR = { yaroqsizM: null, kamIshlatiladiganM: null };

/** TZ 7.5 — daraja ENI bo'yicha, maydon bo'yicha emas. */
function darajaBelgisi(b: BolakQatori): string | null {
  if (b.turi !== 'OSTATKA' || b.eniM === null) return null;
  const d = daraja(b.eniM, CHEGARALAR);
  if (d === 'YAROQSIZ') return 'yaroqsiz';
  if (d === 'KAM_ISHLATILADIGAN') return 'kam ishlatiladigan';
  return null;
}

function miqdorKorinishi(h: HarakatQatori): string {
  if (h.miqdorKvM !== null) return `${h.miqdorKvM.toFixed(4)} kv.m`;
  // Q-01 — smda saqlanadi, metrda ko'rsatiladi
  if (h.miqdorSm !== null) return `${(h.miqdorSm / 100).toFixed(2)} m`;
  if (h.miqdorDona !== null) return `${String(h.miqdorDona)} dona`;
  return '—';
}

export default async function MaterialKartochkasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  // TZ 14.6 — omborchida kirim bor, chiqim yo'q bo'lishi mumkin
  const chiqaraOladi = ruxsatBormi(f, 'ombor.chiqim');
  const boshlangichQilaOladi = ruxsatBormi(f, 'ombor.boshlangich');

  const { id } = await params;
  const materialId = Number(id);
  if (!Number.isSafeInteger(materialId) || materialId <= 0) notFound();

  const sarlavha = await materialSarlavhasi(materialId);
  if (sarlavha === null) notFound();

  const [bolaklar, harakatlar, sanoq] = await Promise.all([
    materialBolaklari(materialId, f.filialId),
    materialHarakatlari(materialId, f.filialId),
    oxirgiSanoq(materialId, f.filialId),
  ]);

  const olchamli = sarlavha.hisobTuri === 'RULON';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ombor qoldig&apos;i
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          {sarlavha.nom}
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {bolaklar.length} ta bo&apos;lak · filial #{f.filialId}
          {/* TZ 15.1 — oxirgi sanoq kartochkada ko'rinadi */}
          {sanoq !== null && ` · oxirgi sanoq ${sanoq.sana} (${sanoq.kim})`}
        </p>
        {boshlangichQilaOladi && bolaklar.length === 0 && (
          <Link
            href={`/ombor/boshlangich/${String(materialId)}`}
            className="mt-3 inline-block rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-colors hover:bg-fon"
          >
            Boshlang&apos;ich qoldiq kiritish
          </Link>
        )}
      </div>

      {/* ── Qoldiq tarkibi (7.11) ── */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qoldiq tarkibi</h2>
        {bolaklar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Bo&apos;lak yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kod</th>
                  <th className="px-4 py-2.5 font-medium">Turi</th>
                  <th className="px-4 py-2.5 font-medium">{olchamli ? "O'lcham" : 'Miqdor'}</th>
                  <th className="px-4 py-2.5 font-medium">Holat</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                  <th className="px-4 py-2.5 font-medium">Kirim</th>
                  {chiqaraOladi && <th className="px-4 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {bolaklar.map((b) => {
                  const belgi = darajaBelgisi(b);
                  return (
                    <tr key={b.id} className={b.holat === 'BOSH' ? '' : 'text-matn-kuchsiz'}>
                      <td className="px-4 py-2.5 font-mono text-xs">{b.kod}</td>
                      <td className="px-4 py-2.5">
                        {b.turi === 'RULON'
                          ? 'Rulon'
                          : b.turi === 'OSTATKA'
                            ? 'Qoldiq kesma'
                            : 'Dona'}
                      </td>
                      <td className="raqam px-4 py-2.5">
                        {b.eniM !== null && b.boyiM !== null
                          ? `${b.eniM.toFixed(2)} × ${b.boyiM.toFixed(2)} m`
                          : b.miqdor !== null
                            ? String(b.miqdor)
                            : '—'}
                        {belgi !== null && (
                          <span className="ml-2 text-xs text-belgi-sariq">{belgi}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            b.holat === 'BOSH'
                              ? 'text-belgi-yashil'
                              : b.holat === 'BAND'
                                ? 'text-belgi-sariq'
                                : 'text-matn-kuchsiz'
                          }
                        >
                          {HOLAT_NOMI[b.holat] ?? b.holat}
                        </span>
                      </td>
                      <td className="raqam px-4 py-2.5">{pulKorsat(som(b.tannarx))}</td>
                      <td className="px-4 py-2.5 text-xs text-matn-kuchsiz">
                        {b.kirimRaqam ?? '—'}
                      </td>
                      {chiqaraOladi && (
                        <td className="px-4 py-2.5 text-right">
                          {b.holat === 'BOSH' || b.holat === 'BAND' ? (
                            <Link
                              href={`/ombor/chiqim/${String(b.id)}`}
                              className="text-xs text-belgi-qizil underline underline-offset-2 hover:text-belgi-qizil"
                            >
                              Hisobdan chiqarish
                            </Link>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-matn-kuchsiz">
          Har bo&apos;lak o&apos;z kirimini va tannarxini eslab qoladi (7.8).
        </p>
      </section>

      {/* ── Harakatlar tarixi (7.11) ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Harakatlar tarixi</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Qoldiq alohida saqlanmaydi — u shu jadvalning yig&apos;indisi (2.2-invariant). Yozuvlar
          o&apos;zgartirilmaydi va o&apos;chirilmaydi (§6.5).
        </p>

        {harakatlar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Harakat yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Turi</th>
                  <th className="px-4 py-2.5 font-medium">Bo&apos;lak</th>
                  <th className="px-4 py-2.5 text-right font-medium">Miqdor</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                  {chiqaraOladi && <th className="px-4 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {h.sana.toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">{HARAKAT_NOMI[h.turi] ?? h.turi}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{h.bolakKod}</td>
                    <td className="raqam px-4 py-2.5">{miqdorKorinishi(h)}</td>
                    <td className="raqam px-4 py-2.5">{pulKorsat(som(h.tannarxSumma))}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{h.xodimIsmi}</td>
                    {chiqaraOladi && (
                      <td className="px-4 py-2.5 text-right align-top">
                        {h.turi === 'BRAK' && !h.bekorQilingan ? (
                          <BekorTugmasi harakatId={h.id} bolakKod={h.bolakKod} />
                        ) : h.turi === 'BRAK' ? (
                          <span className="text-xs text-matn-kuchsiz">bekor qilingan</span>
                        ) : null}
                      </td>
                    )}
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
