import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { yetkazibTahrirlaAmali } from '../amal';
import type { FormaHolati } from '../holat';
import { YetkazibFormasi, type YetkazibQiymatlari } from '../forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { joriyKurs } from '@/lib/amal/kurs';
import { yetkazibBalansi, yetkazibHarakatlari } from '@/lib/amal/yetkazib-tolov';
import { tolovKassalari } from '@/app/(panel)/buyurtma/malumot';
import { YetkazibTolovFormasi } from '../tolov-forma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly nom: string;
  readonly nima_yetkazadi: string | null;
  readonly kontakt_shaxs: string | null;
  readonly telefon: string | null;
  readonly qoshimcha_telefon: string | null;
  readonly manzil: string | null;
  readonly bank_nomi: string | null;
  readonly hisob_raqam: string | null;
  readonly inn: string | null;
  readonly mfo: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly valyuta: string;
  readonly eslatma: string | null;
}

const m = (x: string | null): string => x ?? '';

export default async function YetkazibTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('yetkazib.ozgartir');

  const { id } = await params;
  const yetkazibId = Number(id);
  if (!Number.isSafeInteger(yetkazibId) || yetkazibId <= 0) notFound();

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT * FROM yetkazib_beruvchi WHERE id = ${yetkazibId}`;
  const y = qatorlar[0];
  if (y === undefined) notFound();

  const qiymatlar: YetkazibQiymatlari = {
    nom: y.nom,
    nimaYetkazadi: m(y.nima_yetkazadi),
    kontaktShaxs: m(y.kontakt_shaxs),
    telefon: m(y.telefon),
    qoshimchaTelefon: m(y.qoshimcha_telefon),
    manzil: m(y.manzil),
    bankNomi: m(y.bank_nomi),
    hisobRaqam: m(y.hisob_raqam),
    inn: m(y.inn),
    mfo: m(y.mfo),
    tolovMuddatiKun: y.tolov_muddati_kun === null ? '' : String(y.tolov_muddati_kun),
    valyuta: y.valyuta,
    eslatma: m(y.eslatma),
  };

  /**
   * ⚠️ 2026-08-30 — qarz va to'lov SHU YERDA. Ilgari kartochkada
   *    faqat tahrirlash formasi turardi: qarz qancha ekanini
   *    ko'rish ham, to'lash ham mumkin emas edi.
   */
  const sql = ulanishOl();
  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');

  const [qarzlar, harakatlar, kassalar, kurs] = await Promise.all([
    yetkazibBalansi(sql, yetkazibId),
    yetkazibHarakatlari(sql, yetkazibId),
    tolovQilaOladi ? tolovKassalari(f.filialId, f.xodimId) : Promise.resolve([]),
    joriyKurs(sql),
  ]);

  const amal = async (holat: FormaHolati, forma: FormData): Promise<FormaHolati> => {
    'use server';
    return yetkazibTahrirlaAmali(yetkazibId, holat, forma);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/yetkazib" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Yetkazib beruvchilar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{y.nom}</h1>
      </div>

      {/* ── TZ 9.1 · Qarz ── */}
      <section className="rounded-karta border border-chegara bg-sirt p-6">
        <h2 className="mb-3 text-sm font-semibold text-matn">Hisob-kitob</h2>

        {qarzlar.length === 0 ? (
          <p className="text-sm text-belgi-yashil">Qarz yo&apos;q — hisob toza.</p>
        ) : (
          <dl className="flex flex-wrap gap-6">
            {qarzlar.map((q) => (
              <div key={q.valyuta}>
                <dt className="text-xs text-matn-kuchsiz">
                  Qarz{qarzlar.length > 1 && ` (${q.valyuta === 'USD' ? '$' : "so'm"})`}
                </dt>
                {/*
                  ⚠️ Musbat — biz qarzdormiz. Manfiy bo'lsa avans
                     berib qo'yganmiz, ya'ni ular qarzdor.
                */}
                <dd
                  className={`raqam text-[18px] font-semibold ${
                    Number(q.qarz) > 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                  }`}
                >
                  {pulKorsat(som(q.qarz))}{' '}
                  <span className="text-xs font-normal text-matn-kuchsiz">
                    {q.valyuta === 'USD' ? '$' : "so'm"}
                  </span>
                </dd>
                {Number(q.qarz) < 0 && (
                  <p className="text-[12px] text-matn-kuchsiz">avans berilgan</p>
                )}
              </div>
            ))}
          </dl>
        )}

        {tolovQilaOladi && (
          <div className="mt-5 border-t border-chegara pt-5">
            <h3 className="mb-3 text-sm font-medium text-matn-ikki">To&apos;lov qilish</h3>
            <YetkazibTolovFormasi
              yetkazibBeruvchiId={yetkazibId}
              kassalar={kassalar}
              qarzlar={qarzlar}
              joriyKurs={kurs ?? ''}
            />
          </div>
        )}
      </section>

      {/* ── TZ 9 · Harakatlar tarixi ── */}
      {harakatlar.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Hisob tarixi</h2>
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Nima</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Izoh</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-matn-ikki">
                      {h.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">{HARAKAT_NOMI[h.turi] ?? h.turi}</td>
                    <td
                      className={`raqam whitespace-nowrap px-4 py-2.5 text-right font-medium ${
                        Number(h.summa) > 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                      }`}
                    >
                      {pulKorsat(som(h.summa))}{' '}
                      <span className="text-xs font-normal text-matn-kuchsiz">
                        {h.valyuta === 'USD' ? '$' : "so'm"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-matn-kuchsiz">
                      {h.izoh ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-matn-ikki">{h.kim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <YetkazibFormasi amal={amal} qiymatlar={qiymatlar} tugmaMatni="O'zgarishlarni saqlash" />
      </div>
    </div>
  );
}

/** TZ 9 — harakat turlarining o'zbekcha nomi */
const HARAKAT_NOMI: Record<string, string> = {
  XARID: 'Xarid (qarz)',
  TOLOV: "To'lov",
  AVANS: 'Avans',
  DAVO: "Da'vo",
  BOSHLANGICH: "Boshlang'ich qoldiq",
};
