import Link from 'next/link';
import { notFound } from 'next/navigation';
import Decimal from 'decimal.js';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi, tannarxniKoradimi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { XARID_HOLAT_NOMI, kutilyaptimi, narxBirligiMatni } from '@/lib/domain/xarid';
import { OddiyChopTugmasi } from '../../../chop-tugma';
import { filialNomi } from '../../malumot';
import { xaridTafsiloti } from '../malumot';
import { HOLAT_RANGI } from '../holat';
import { XaridYopishFormasi } from '../yopish-forma';

export const dynamic = 'force-dynamic';

const son = (x: string): string => x.replace(/\.00$/, '');

/**
 * Xarid buyurtmasi kartochkasi (0063).
 *
 * ⚠️ Ekranda — nima keldi, nima qoldi. Chop etilganda — yetkazib
 *    beruvchiga yuboriladigan buyurtma varag'i (kelgan ustunlarsiz).
 * ⚠️ Narx va summa — tannarx ma'lumoti (TZ 11.10).
 */
export default async function XaridKartochkasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [x, filial] = await Promise.all([xaridTafsiloti(id, f.filialId), filialNomi(f.filialId)]);
  if (x === null) notFound();

  const boshqaraOladi = ruxsatBormi(f, 'ombor.kirim.yarat');
  const pulniKoradi = tannarxniKoradimi(f);
  const raqam = (s: string): string => pulKorsat(x.valyuta === 'USD' ? dollar(s) : som(s));
  const pul = (s: string): string => `${raqam(s)} ${x.valyuta === 'USD' ? '$' : "so'm"}`;
  const kutilmoqda = kutilyaptimi(x.holat);
  const faolKirimBor = x.kirimlar.some((k) => k.holat === 'FAOL');
  /** Metrga narxlangan rulon summasi odatdagi bo'y bilan TAXMIN */
  const taxminiy = x.qatorlar.some((q) => q.narxAsosi !== 'BIRLIK' && q.summa !== null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/ombor/xarid" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Xarid buyurtmalari
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            {x.raqam}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${HOLAT_RANGI[x.holat]}`}>
              {XARID_HOLAT_NOMI[x.holat]}
            </span>
            {x.kechikkan && (
              <span className="rounded-full bg-belgi-qizil-fon px-2.5 py-0.5 text-xs font-medium text-belgi-qizil">
                Kechikdi
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {x.yetkazibNomi} · {x.sana}
            {x.kutilganSana !== null && ` · kutilgan: ${x.kutilganSana}`}
            {x.yaratdi !== '' && ` · ${x.yaratdi}`}
          </p>
          {x.izoh !== null && <p className="mt-1 text-sm text-matn-ikki">{x.izoh}</p>}
          {x.yopishSabab !== null && (
            <p className="mt-1 text-sm text-matn-ikki">
              {x.qaror === 'BEKOR' ? 'Bekor qilish' : 'Yopish'} sababi: {x.yopishSabab}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OddiyChopTugmasi matn="Yetkazib beruvchiga chop etish" />
          {boshqaraOladi && x.qaror === 'OCHIQ' && (
            <Link
              href={`/ombor/kirim/yangi?xarid=${String(x.id)}`}
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn hover:bg-brend-quyuq"
            >
              {kutilmoqda ? 'Mol keldi — kirim qilish' : 'Yana kirim qilish'}
            </Link>
          )}
        </div>
      </div>

      {boshqaraOladi && x.qaror === 'OCHIQ' && (
        <div className="flex">
          <XaridYopishFormasi xaridId={x.id} bekorBolarmi={!faolKirimBor} />
        </div>
      )}

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-4 py-2.5 font-medium">Material</th>
              <th className="px-4 py-2.5 text-right font-medium">Buyurtma</th>
              <th className="px-4 py-2.5 text-right font-medium">Keldi</th>
              <th className="px-4 py-2.5 text-right font-medium">Qoldi</th>
              {pulniKoradi && <th className="px-4 py-2.5 text-right font-medium">Narx</th>}
              {pulniKoradi && <th className="px-4 py-2.5 text-right font-medium">Summa</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara">
            {x.qatorlar.map((q) => {
              const qoldi = new Decimal(q.qolgan).gt(0);
              const ortiq = new Decimal(q.ortiqcha).gt(0);
              return (
                <tr key={q.materialId}>
                  <td className="px-4 py-2.5">
                    <Link href={`/ombor/${String(q.materialId)}`} className="hover:underline">
                      {q.materialNomi}
                    </Link>
                  </td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {son(q.miqdor)} {q.kirimBirligi}
                  </td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {son(q.kelgan)}
                    {ortiq && <span className="ml-1 text-xs text-belgi-sariq">(+{son(q.ortiqcha)} ortiq)</span>}
                  </td>
                  <td
                    className={`raqam px-4 py-2.5 text-right ${
                      qoldi && x.qaror === 'OCHIQ' ? 'font-medium text-belgi-sariq' : 'text-matn-kuchsiz'
                    }`}
                  >
                    {qoldi ? son(q.qolgan) : '✓'}
                  </td>
                  {pulniKoradi && (
                    <td className="raqam px-4 py-2.5 text-right">
                      {q.narxBirlik === null ? '—' : `${raqam(q.narxBirlik)} ${narxBirligiMatni(q.narxAsosi, x.valyuta, q.kirimBirligi)}`}
                    </td>
                  )}
                  {pulniKoradi && (
                    <td className="raqam px-4 py-2.5 text-right">
                      {q.summa === null ? '—' : `${q.narxAsosi === 'BIRLIK' ? '' : '≈ '}${pul(q.summa)}`}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {pulniKoradi && (
            <tfoot className="border-t border-chegara bg-fon">
              <tr>
                <td colSpan={5} className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-matn-kuchsiz">
                  Jami{!x.summaToliq && ' (narxi yozilganlar)'}
                </td>
                <td className="raqam px-4 py-2.5 text-right font-semibold">
                  {taxminiy && '≈ '}
                  {pul(x.summa)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">Shu buyurtma bo&apos;yicha kirimlar</h2>
        {x.kirimlar.length === 0 ? (
          <p className="text-sm text-matn-kuchsiz">Hali mol kelmagan.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {x.kirimlar.map((k) => (
              <li key={k.id}>
                <Link href={`/ombor/kirim/${String(k.id)}`} className="text-brend hover:underline">
                  {k.raqam}
                </Link>{' '}
                · {k.sana}
                {k.holat !== 'FAOL' && <span className="ml-1 text-xs text-belgi-qizil">storno — hisobga olinmaydi</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/*
        ⚠️ QOG'OZ NUSXA — faqat chop etilganda. Yetkazib beruvchiga
           kelgan-qolgan kerak emas: unga nima va qancha so'ralgani kerak.
      */}
      <div className="varaqa hidden p-8 text-[11pt] print:block">
        <style>{'@media print { @page { size: A4; margin: 15mm } }'}</style>
        <div className="flex justify-between">
          <div>
            <p className="text-[16pt] font-bold">Buyurtma № {x.raqam}</p>
            <p>Sana: {x.sana}</p>
            {x.kutilganSana !== null && <p>Yetkazib berish muddati: {x.kutilganSana}</p>}
          </div>
          <div className="text-right">
            <p>Buyurtmachi: {filial}</p>
            <p>Yetkazib beruvchi: {x.yetkazibNomi}</p>
          </div>
        </div>
        <table className="mt-6 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1.5 pr-2">№</th>
              <th className="py-1.5 pr-2">Nomi</th>
              <th className="py-1.5 pr-2 text-right">Miqdori</th>
              {pulniKoradi && <th className="py-1.5 pr-2 text-right">Narxi</th>}
              {pulniKoradi && <th className="py-1.5 text-right">Summasi</th>}
            </tr>
          </thead>
          <tbody>
            {x.qatorlar.map((q, i) => (
              <tr key={q.materialId} className="border-b border-neutral-400">
                <td className="py-1.5 pr-2">{i + 1}</td>
                <td className="py-1.5 pr-2">{q.materialNomi}</td>
                <td className="py-1.5 pr-2 text-right">
                  {son(q.miqdor)} {q.kirimBirligi}
                </td>
                {pulniKoradi && (
                  <td className="py-1.5 pr-2 text-right">
                    {q.narxBirlik === null ? '' : `${raqam(q.narxBirlik)} ${narxBirligiMatni(q.narxAsosi, x.valyuta, q.kirimBirligi)}`}
                  </td>
                )}
                {pulniKoradi && (
                  <td className="py-1.5 text-right">{q.summa === null ? '' : pul(q.summa)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {pulniKoradi && <p className="mt-3 text-right font-bold">Jami: {pul(x.summa)}</p>}
        {x.izoh !== null && <p className="mt-4">Izoh: {x.izoh}</p>}
        <div className="mt-16 flex justify-between">
          <p>Buyurtma berdi: ____________________</p>
          <p>Qabul qildi: ____________________</p>
        </div>
      </div>
    </div>
  );
}
