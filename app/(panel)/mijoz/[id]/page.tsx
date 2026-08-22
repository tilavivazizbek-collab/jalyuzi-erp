import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mijozTahrirlaAmali } from '../amal';
import type { MijozHolati } from '../holat';
import { MijozFormasi, type MijozQiymatlari } from '../forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { HARAKAT_NOMI, mijozQarzi } from '../qarz-malumot';
import { tolovKassalari } from '../../buyurtma/malumot';
import { QarzTolashFormasi } from '../qarz-forma';
import { UmidsizQarzFormasi } from '../umidsiz-forma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly manzil: string | null;
  readonly eslatma: string | null;
  readonly offset_turi: string | null;
  readonly offset_qiymat: string | null;
  readonly qarz_limiti: string | null;
  readonly shaxs_turi: string;
  readonly tashkilot_nomi: string | null;
  readonly inn: string | null;
  readonly yuridik_manzil: string | null;
  readonly bank_nomi: string | null;
  readonly hisob_raqam: string | null;
  readonly mfo: string | null;
  readonly shartnoma_raqam: string | null;
  readonly nds_stavka: string | null;
}

const m = (x: string | null): string => x ?? '';

export default async function MijozTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('mijoz.ozgartir');

  const { id } = await params;
  const mijozId = Number(id);
  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) notFound();

  const qatorlar = await ulanishOl()<Qator[]>`SELECT * FROM mijoz WHERE id = ${mijozId}`;
  const mijoz = qatorlar[0];
  if (mijoz === undefined) notFound();

  const qiymatlar: MijozQiymatlari = {
    ism: mijoz.ism,
    telefon: m(mijoz.telefon),
    manzil: m(mijoz.manzil),
    eslatma: m(mijoz.eslatma),
    offsetTuri: m(mijoz.offset_turi),
    offsetQiymat: m(mijoz.offset_qiymat),
    qarzLimiti: m(mijoz.qarz_limiti),
    shaxsTuri: mijoz.shaxs_turi,
    tashkilotNomi: m(mijoz.tashkilot_nomi),
    inn: m(mijoz.inn),
    yuridikManzil: m(mijoz.yuridik_manzil),
    bankNomi: m(mijoz.bank_nomi),
    hisobRaqam: m(mijoz.hisob_raqam),
    mfo: m(mijoz.mfo),
    shartnomaRaqam: m(mijoz.shartnoma_raqam),
    ndsStavka: m(mijoz.nds_stavka),
  };

  // TZ 6.7 · 6.8 — qarz bloki va harakatlar tarixi
  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');
  // TZ 6.10 — «ADMIN qarzni hisobdan chiqara oladi»
  const hisobdanChiqaraOladi = ruxsatBormi(f, 'kassa.storno');
  const [qarz, kassalar] = await Promise.all([
    mijozQarzi(mijozId),
    tolovQilaOladi ? tolovKassalari(f.filialId, f.xodimId) : Promise.resolve([]),
  ]);

  const amal = async (holat: MijozHolati, forma: FormData): Promise<MijozHolati> => {
    'use server';
    return mijozTahrirlaAmali(mijozId, holat, forma);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/mijoz" className="text-sm text-slate-500 hover:text-slate-900">
          ← Mijozlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{mijoz.ism}</h1>
      </div>

      {/* ── 6.7 · Qarz bloki ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-slate-700">Qarz</h2>
        <p className="mb-3 text-xs text-slate-500">
          Qarz saqlanmaydi — harakatlar yig&apos;indisi (2.2-invariant).
          So&apos;m va dollar alohida yuritiladi (1.3).
        </p>

        <dl className="mb-4 grid max-w-xs grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <dt className="text-slate-500">So&apos;m</dt>
          <dd
            className={`raqam font-medium ${Number(qarz.som) > 0 ? 'text-amber-800' : ''}`}
          >
            {pulKorsat(som(qarz.som))}
          </dd>
          <dt className="text-slate-500">Dollar</dt>
          <dd
            className={`raqam font-medium ${Number(qarz.dollar) > 0 ? 'text-amber-800' : ''}`}
          >
            {pulKorsat(dollar(qarz.dollar))}
          </dd>
        </dl>

        {tolovQilaOladi && (
          <QarzTolashFormasi
            mijozId={mijozId}
            somQarz={qarz.som}
            dollarQarz={qarz.dollar}
            kassalar={kassalar}
          />
        )}

        {hisobdanChiqaraOladi &&
          (Number(qarz.som) > 0 || Number(qarz.dollar) > 0) && (
            <div className="mt-4 flex flex-col">
              <UmidsizQarzFormasi
                mijozId={mijozId}
                somQarz={qarz.som}
                dollarQarz={qarz.dollar}
              />
            </div>
          )}
      </section>

      {/* ── 6.8 · Qarz harakati ── */}
      {qarz.harakatlar.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-700">Qarz harakati</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Sabab</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {qarz.harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-slate-600">
                      {h.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">
                      {HARAKAT_NOMI[h.turi] ?? h.turi}
                      {h.izoh !== null && (
                        <span className="ml-2 text-xs text-slate-400">{h.izoh}</span>
                      )}
                    </td>
                    <td
                      className={`raqam px-4 py-2.5 font-medium ${
                        Number(h.summa) < 0 ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {h.valyuta === 'SOM'
                        ? pulKorsat(som(h.summa))
                        : pulKorsat(dollar(h.summa))}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {h.xodimIsmi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <MijozFormasi amal={amal} qiymatlar={qiymatlar} tugmaMatni="O'zgarishlarni saqlash" />
      </div>
    </div>
  );
}
