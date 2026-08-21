import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { nolSom, pulKorsat, pulMatn, qosh, ayir, som } from '@/lib/domain/pul';
import {
  bekorQilinadimi,
  HOLAT_NOMI,
  qaytaribOlinadimi,
  tasdiqlanadimi,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { buyurtmaTafsili, tolovHolati, tolovKassalari } from '../malumot';
import { TasdiqlashTugmasi } from '../tasdiqla';
import { BekorTugmasi, QaytaribOlishTugmasi } from '../amallar';
import {
  QaytarishTugmasi,
  RadEtishTugmasi,
  TopshirishTugmasi,
} from '../hayot';
import { TolovFormasi } from '../tolov-forma';

export const dynamic = 'force-dynamic';

const BIRLIK: Record<string, string> = { KV_M: 'kv.m', SM: 'sm', DONA: 'dona' };

export default async function BuyurtmaKartochkasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const f = await sahifaRuxsati('buyurtma.kor');
  const tasdiqlayOladi = ruxsatBormi(f, 'buyurtma.tasdiqla');
  const bekorQilaOladi = ruxsatBormi(f, 'buyurtma.bekor');
  const tahrirlayOladi = ruxsatBormi(f, 'buyurtma.tahrirla');

  const { id } = await params;
  const buyurtmaId = Number(id);
  if (!Number.isSafeInteger(buyurtmaId) || buyurtmaId <= 0) notFound();

  const b = await buyurtmaTafsili(buyurtmaId, f.filialId);
  if (b === null) notFound();

  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');
  const [tolov, kassalar] = await Promise.all([
    tolovHolati(buyurtmaId, f.filialId),
    tolovQilaOladi
      ? tolovKassalari(f.filialId, f.xodimId)
      : Promise.resolve([]),
  ]);

  const somda = b.valyuta === 'SOM';
  const pul = (x: string): string => (somda ? pulKorsat(som(x)) : `${x} $`);

  // §3.1 — pul JS `number` bilan qo'shilmaydi, `Som` bilan yig'iladi
  const jami = b.pozitsiyalar.reduce(
    (y, p) => qosh(y, ayir(som(p.narx), som(p.chegirma))),
    nolSom(),
  );

  const filiallararo = b.sotganFilialId !== b.tikuvchiFilialId;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/buyurtma" className="text-sm text-slate-500 hover:text-slate-900">
          ← Buyurtmalar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{b.raqam}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {b.sana.toLocaleDateString('uz-UZ')} · {b.sotuvchiIsmi} · {b.manba}
          {b.mijozIsmi !== null && ` · ${b.mijozIsmi}`}
          {b.mijozTelefon !== null && ` (${b.mijozTelefon})`}
        </p>
      </div>

      {/* ── 8.14 · Pul bloki ── */}
      <dl className="grid max-w-lg grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <dt className="text-slate-500">Pozitsiyalar</dt>
        <dd className="raqam">{b.pozitsiyalar.length}</dd>
        <dt className="text-slate-500">Jami</dt>
        <dd className="raqam font-semibold">{pul(pulMatn(jami))}</dd>
        <dt className="text-slate-500">Tayyorlik sanasi</dt>
        <dd>
          {b.tayyorlikSana ?? (
            <span className="text-slate-400">kiritilmagan — kechikmaydi (3.13)</span>
          )}
        </dd>
        {!somda && (
          <>
            <dt className="text-slate-500">Kurs</dt>
            <dd className="raqam">{b.kursSnapshot ?? '—'}</dd>
          </>
        )}
      </dl>

      {/* ── 3.12 · 8.14 · To'lovlar ── */}
      {tolov !== null && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-slate-700">To&apos;lovlar</h2>

          <dl className="mb-3 grid max-w-md grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <dt className="text-slate-500">Jami</dt>
            <dd className="raqam">{pul(tolov.jami)}</dd>
            <dt className="text-slate-500">To&apos;langan</dt>
            <dd className="raqam text-emerald-700">{pul(tolov.tolangan)}</dd>
            <dt className="border-t border-slate-200 pt-1 font-medium">Qarz</dt>
            <dd
              className={`raqam border-t border-slate-200 pt-1 font-semibold ${
                Number(tolov.qarz) > 0 ? 'text-amber-800' : ''
              }`}
            >
              {pul(tolov.qarz)}
            </dd>
          </dl>

          {tolov.qatorlar.length > 0 && (
            <div className="mb-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {tolov.qatorlar.map((q) => (
                    <tr key={q.id} className={q.stornoQilinganmi ? 'text-slate-400' : ''}>
                      <td className="px-4 py-2 text-slate-600">
                        {q.sana.toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-2">{q.kassaNomi}</td>
                      <td className="raqam px-4 py-2 font-medium">
                        {pul(q.summa)}
                        {q.stornoQilinganmi && (
                          <span className="ml-2 text-xs">storno qilingan</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {q.xodimIsmi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tolovQilaOladi && Number(tolov.qarz) > 0 && (
            <TolovFormasi
              buyurtmaId={b.id}
              qarz={tolov.qarz}
              valyuta={b.valyuta}
              kassalar={kassalar}
            />
          )}
        </section>
      )}

      {filiallararo && (
        <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
          Buyurtma <b>#{b.sotganFilialId}</b> filialda sotilgan,{' '}
          <b>#{b.tikuvchiFilialId}</b> filialda tikiladi. Material tikuvchi filial
          omborida band qilinadi (20.4.2).
        </p>
      )}

      {/* ── 8.14 · Pozitsiyalar tabi ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-slate-700">Pozitsiyalar</h2>
        <p className="mb-3 text-xs text-slate-500">
          Har pozitsiyaning O&apos;Z holati bor — bittasi topshirilgan
          bo&apos;lsa ham, ikkinchisi hali tikilayotgan bo&apos;lishi mumkin (8.2).
        </p>

        <div className="flex flex-col gap-4">
          {b.pozitsiyalar.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <span className="font-medium">
                    {p.tartib}. {p.turNomi}
                  </span>
                  <span className="raqam ml-3 text-sm text-slate-600">
                    {p.eniSm} × {p.boyiSm} sm
                  </span>
                  {p.soni > 1 && (
                    <span className="raqam ml-2 text-sm text-slate-500">
                      × {p.soni}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      p.holat === 'MATERIALGA_KUTMOQDA'
                        ? 'bg-amber-100 text-amber-900'
                        : p.holat === 'TOPSHIRILDI'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {HOLAT_NOMI[p.holat as PozitsiyaHolati] ?? p.holat}
                  </span>
                  <span className="raqam text-sm font-medium">
                    {pul(pulMatn(ayir(som(p.narx), som(p.chegirma))))}
                  </span>
                  {tasdiqlayOladi && tasdiqlanadimi(p.holat as PozitsiyaHolati) && (
                    <TasdiqlashTugmasi pozitsiyaId={p.id} />
                  )}
                </div>
              </div>

              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {p.materiallar.map((m) => (
                    <tr key={m.slotNomi}>
                      <td className="px-4 py-2 text-slate-500">{m.slotNomi}</td>
                      <td className="px-4 py-2">{m.materialNomi}</td>
                      <td className="raqam px-4 py-2">
                        {m.hisoblangan.toFixed(m.birlik === 'DONA' ? 0 : 2)}{' '}
                        {BIRLIK[m.birlik] ?? m.birlik}
                        {m.tuzatilgan !== null && (
                          // TZ 3.6 — narx tuzatilganiga, ombor hisoblanganiga
                          <span className="ml-2 text-xs text-amber-800">
                            narxda {m.tuzatilgan.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-500">
                        {m.bandKodlari.length > 0
                          ? m.bandKodlari.join(', ')
                          : 'band yo’q'}
                      </td>
                    </tr>
                  ))}

                  {p.aksessuarlar.map((a) => (
                    <tr key={a.nom} className="text-slate-600">
                      <td className="px-4 py-2 text-slate-500">aksessuar</td>
                      <td className="px-4 py-2">{a.nom}</td>
                      <td className="raqam px-4 py-2">
                        {a.soni} {BIRLIK[a.birlik] ?? a.birlik}
                        {a.qoldaKiritildi && (
                          <span className="ml-2 text-xs text-slate-400">
                            qo&apos;lda
                          </span>
                        )}
                      </td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>

              {p.ustaIsmi !== null && (
                <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                  Usta: {p.ustaIsmi}
                </div>
              )}

              {/* TZ 8.6 · 8.8 · 8.9 · 8.10 — amallar holatga qarab ochiladi */}
              <PozitsiyaAmallari
                holat={p.holat as PozitsiyaHolati}
                pozitsiyaId={p.id}
                ustaIsmi={p.ustaIsmi}
                narx={pulMatn(ayir(som(p.narx), som(p.chegirma)))}
                bekorQilaOladi={bekorQilaOladi}
                tahrirlayOladi={tahrirlayOladi}
                tolovQilaOladi={tolovQilaOladi}
                kassalar={kassalar}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * TZ 8.3 — pozitsiyaning holati qaysi amallarni ochishini bir joyda
 * hal qiladi.
 *
 * ⚠️ Shartlar TAKRORLANMAYDI (§2.2): tekshiruvlar `lib/domain/buyurtma.ts`
 *    dagi funksiyalarga tayanadi.
 */
function PozitsiyaAmallari({
  holat,
  pozitsiyaId,
  ustaIsmi,
  narx,
  bekorQilaOladi,
  tahrirlayOladi,
  tolovQilaOladi,
  kassalar,
}: {
  holat: PozitsiyaHolati;
  pozitsiyaId: number;
  ustaIsmi: string | null;
  narx: string;
  bekorQilaOladi: boolean;
  tahrirlayOladi: boolean;
  tolovQilaOladi: boolean;
  kassalar: readonly { id: number; nom: string; turi: string; valyuta: string }[];
}) {
  const bekor = bekorQilaOladi && bekorQilinadimi(holat);
  const qaytaribOl = tahrirlayOladi && qaytaribOlinadimi(holat);
  // 8.9 — topshirish faqat TAYYOR yoki YETIB_KELDI dan
  const topshir = tahrirlayOladi && (holat === 'TAYYOR' || holat === 'YETIB_KELDI');
  // 8.8 — rad etish ham o'sha holatlardan
  const radEt = bekorQilaOladi && (holat === 'TAYYOR' || holat === 'YETIB_KELDI');
  // 8.10 — qaytarish faqat TOPSHIRILGANDAN keyin
  const qaytar = tolovQilaOladi && holat === 'TOPSHIRILDI';

  if (!bekor && !qaytaribOl && !topshir && !radEt && !qaytar) return null;

  return (
    <div className="flex flex-wrap items-start gap-6 border-t border-slate-100 px-4 py-3">
      {topshir && <TopshirishTugmasi pozitsiyaId={pozitsiyaId} />}
      {radEt && <RadEtishTugmasi pozitsiyaId={pozitsiyaId} />}
      {qaytar && (
        <QaytarishTugmasi
          pozitsiyaId={pozitsiyaId}
          narx={narx}
          kassalar={kassalar}
        />
      )}
      {bekor && <BekorTugmasi pozitsiyaId={pozitsiyaId} />}
      {qaytaribOl && (
        <QaytaribOlishTugmasi pozitsiyaId={pozitsiyaId} ustaIsmi={ustaIsmi} />
      )}
    </div>
  );
}
