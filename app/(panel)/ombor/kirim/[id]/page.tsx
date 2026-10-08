import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi, tannarxniKoradimi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { narxBirligiMatni } from '@/lib/domain/xarid';
import { OddiyChopTugmasi } from '../../../chop-tugma';
import { filialNomi, kirimTafsiloti } from '../../malumot';
import { filialJoylari, yorliqBolaklari } from '../../joy-malumot';
import { BolakJoyFormasi } from '../../joy-forma';
import { StornoFormasi } from '../storno-forma';
import { KirimTahrirFormasi } from '../tahrir-forma';

export const dynamic = 'force-dynamic';

export default async function KirimTafsili({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  /** TZ 11.10 — sotuvchi qoldiqni ko'radi, tannarxni EMAS (ombor auditi 2026-10-06) */
  const pulniKoradi = tannarxniKoradimi(f);
  const stornoQilaOladi = ruxsatBormi(f, 'ombor.storno');

  const { id } = await params;
  const kirimId = Number(id);
  if (!Number.isSafeInteger(kirimId) || kirimId <= 0) notFound();

  const h = await kirimTafsiloti(kirimId, f.filialId);
  if (h === null) notFound();

  const storno = h.holat === 'STORNO';

  /**
   * 0062 — kirimdan tug'ilgan, omborda turgan bo'laklar: joyga qo'yish
   * va QR yorliq. Omborchi rulonlarni tushirgach shu yerda bir bosishda
   * joylashtiradi (ombor auditi 2026-10-07).
   */
  const joyQoyaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');
  const [bolaklar, joylar] = await Promise.all([
    yorliqBolaklari(f.filialId, { kirimId }),
    joyQoyaOladi ? filialJoylari(f.filialId) : Promise.resolve([]),
  ]);
  const filial = await filialNomi(f.filialId);
  /** Hujjat valyutasida — yetkazib beruvchi narxi va qarzi (9.2) */
  const pul = (x: string): string =>
    h.valyuta === 'USD' ? `${pulKorsat(dollar(x))} $` : `${pulKorsat(som(x))} so'm`;
  /**
   * ⚠️ Ombor tomoni HAR DOIM so'mda — tannarx kirim kunidagi kursda
   *    qotadi (9.6). Ilgari dollarli kirimda «50 000 $» deb chiqardi.
   */
  const somda = (x: string): string => `${pulKorsat(som(x))} so'm`;
  const son = (x: number): string => String(x).replace(/\.0+$/, '');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor/kirim" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kirim hujjatlari
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{h.raqam}</h1>
        <div className="mt-2 flex justify-end">
          <OddiyChopTugmasi matn="Nakladnoyni chop etish" />
        </div>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {h.sana} · {h.yetkazibNomi} · {h.valyuta}
          {h.xarid !== null && (
            <>
              {' · buyurtma '}
              <Link href={`/ombor/xarid/${String(h.xarid.id)}`} className="text-brend hover:underline">
                {h.xarid.raqam}
              </Link>
            </>
          )}
        </p>
      </div>

      {/*
        P-46 — metr / kv.m narxli eski kirimda yetkazib beruvchi qarzi kam
        yozilgan. Kartochka buni yashirmaydi: tuzatish — egasi qarori.
      */}
      {pulniKoradi && !storno && h.yozilganQarz !== null && h.yozilganQarz !== h.summa && (
        <p className="rounded-karta bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq">
          <b>Qarz noto&apos;g&apos;ri yozilgan.</b> Mol summasi {pul(h.summa)}, yetkazib beruvchi
          jurnalida esa {pul(h.yozilganQarz)}. Eski xato (metr narxida qarz rulon soniga
          ko&apos;paytirilgan, P-46) — tuzatuvchi yozuv kerak.
        </p>
      )}

      {storno && (
        <p className="rounded-karta bg-belgi-qizil-fon px-4 py-3 text-sm text-belgi-qizil ">
          <b>Storno qilingan.</b> {h.stornoSabab ?? ''} — hujjat tarixda qoladi, o&apos;chirilmaydi
          (§6.5).
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qatorlar</h2>
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                <th className="px-4 py-2.5 text-right font-medium">Miqdor</th>
                {pulniKoradi && (
                  <>
                    <th className="px-4 py-2.5 text-right font-medium">Narx</th>
                    <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                    <th className="px-4 py-2.5 text-right font-medium">Transport ulushi</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                  </>
                )}
                <th className="px-4 py-2.5 text-right font-medium">Brak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {h.qatorlar.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-2.5">{q.materialNomi}</td>
                  <td className="raqam px-4 py-2.5">
                    {son(q.miqdorKirim)} {q.kirimBirligi}
                  </td>
                  {pulniKoradi && (
                    <>
                      <td className="raqam px-4 py-2.5">
                        {pulKorsat(h.valyuta === 'USD' ? dollar(q.narxBirlik) : som(q.narxBirlik))}{' '}
                        {narxBirligiMatni(q.narxAsosi, h.valyuta, q.kirimBirligi)}
                      </td>
                      <td className="raqam px-4 py-2.5">{pul(q.summa)}</td>
                      <td className="raqam px-4 py-2.5">{somda(q.transportUlush)}</td>
                      <td className="raqam px-4 py-2.5 font-medium">{somda(q.tannarxBirlik)}</td>
                    </>
                  )}
                  <td className="raqam px-4 py-2.5">
                    {q.defektMiqdor === 0 ? '—' : q.defektMiqdor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-matn-kuchsiz">
          {pulniKoradi && 'Tannarx = narx + transport ulushi; '} brak SON bo&apos;yicha bo&apos;linmaydi (7.9 · P-17).
        </p>
      </section>

      <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        {pulniKoradi && (
          <>
            <dt className="text-matn-kuchsiz">Mol summasi (qarz)</dt>
            <dd className="raqam font-medium">{pul(h.summa)}</dd>
            <dt className="text-matn-kuchsiz">Transport</dt>
            <dd className="raqam">{pul(h.transportSumma)}</dd>
            <dt className="text-matn-kuchsiz">Bojxona</dt>
            <dd className="raqam">{pul(h.bojxonaSumma)}</dd>
          </>
        )}
        <dt className="text-matn-kuchsiz">Omborda turgan bo&apos;lak</dt>
        <dd className="raqam">{h.omborda}</dd>
        <dt className="text-matn-kuchsiz">Ishlatilgan bo&apos;lak</dt>
        <dd className="raqam">{h.ishlatilgan}</dd>
      </dl>

      {!storno && bolaklar.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-matn-ikki">
              Omborga tushgan bo&apos;laklar — joy va yorliq
            </h2>
            <Link
              href={`/ombor/yorliq?kirim=${String(kirimId)}`}
              className="rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] text-matn-ikki hover:bg-fon"
            >
              QR yorliqlarni chop etish ({bolaklar.length})
            </Link>
          </div>
          {joyQoyaOladi ? (
            <BolakJoyFormasi
              joylar={joylar}
              tanlov={bolaklar.map((b) => ({
                id: b.id,
                matn: `${b.kod} · ${b.materialNomi} · ${
                  b.turi === 'DONA' ? `${b.miqdor ?? '0'} dona` : `${b.eniM ?? '?'} × ${b.boyiM ?? '?'} m`
                }`,
                joy: b.joyNomi,
              }))}
            />
          ) : (
            <ul className="flex flex-col divide-y divide-chegara rounded-karta border border-chegara bg-sirt text-sm">
              {bolaklar.map((b) => (
                <li key={b.id} className="flex justify-between gap-3 px-3 py-1.5">
                  <Link href={`/ombor/bolak/${String(b.id)}`} className="raqam text-brend hover:underline">
                    {b.kod} · {b.materialNomi}
                  </Link>
                  <span className="text-xs text-matn-kuchsiz">{b.joyNomi ?? 'joyi yo‘q'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/*
        TZ 9.11 — «Qo'shimcha xarajat ko'pincha MOLDAN KEYIN keladi.»
        Storno qilingan hujjat tahrirlanmaydi.
      */}
      {!storno && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">
            Qo&apos;shimcha xarajat (9.11)
          </h2>
          <KirimTahrirFormasi
            kirimId={h.id}
            transport={h.transportSumma}
            bojxona={h.bojxonaSumma}
          />
        </section>
      )}

      {stornoQilaOladi && !storno && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Storno (7.12)</h2>
          <StornoFormasi
            kirimId={h.id}
            raqam={h.raqam}
            omborda={h.omborda}
            ishlatilgan={h.ishlatilgan}
          />
        </section>
      )}
      {/*
        8-band — KIRIM NAKLADNOYI. Faqat chop etilganda ko'rinadi: mol
        topshirilganda haydovchi / yetkazib beruvchi bilan imzolanadi.
        ⚠️ Narx va summa — faqat tannarxni ko'radiganga (11.10).
      */}
      <div className="varaqa hidden p-8 text-[11pt] print:block">
        <style>{'@media print { @page { size: A4; margin: 15mm } }'}</style>
        <p className="text-center text-[15pt] font-bold">Kirim nakladnoyi № {h.raqam}</p>
        <p className="text-center">{h.sana}</p>
        {storno && <p className="mt-2 text-center font-bold">STORNO QILINGAN — {h.stornoSabab ?? ''}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <p>Topshiruvchi (yetkazib beruvchi): <b>{h.yetkazibNomi}</b></p>
          <p className="text-right">Qabul qiluvchi: <b>{filial}</b></p>
          {h.xarid !== null && <p>Buyurtma asosida: {h.xarid.raqam}</p>}
        </div>
        <table className="mt-5 w-full border-collapse text-[10pt]">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1.5 pr-2">№</th>
              <th className="py-1.5 pr-2">Nomi</th>
              <th className="py-1.5 pr-2 text-right">Miqdori</th>
              <th className="py-1.5 pr-2">O&apos;lchami, m</th>
              {pulniKoradi && <th className="py-1.5 pr-2 text-right">Narxi</th>}
              {pulniKoradi && <th className="py-1.5 text-right">Summasi</th>}
            </tr>
          </thead>
          <tbody>
            {h.qatorlar.map((q, i) => (
              <tr key={q.id} className="border-b border-neutral-400 align-top">
                <td className="py-1.5 pr-2">{i + 1}</td>
                <td className="py-1.5 pr-2">
                  {q.materialNomi}
                  {q.defektMiqdor > 0 && <span className="block text-[9pt]">brak: {q.defektMiqdor}</span>}
                </td>
                <td className="py-1.5 pr-2 text-right">
                  {son(q.miqdorKirim)} {q.kirimBirligi}
                </td>
                <td className="py-1.5 pr-2 text-[9pt]">{q.olchamlar.join('; ')}</td>
                {pulniKoradi && (
                  <td className="py-1.5 pr-2 text-right">
                    {pulKorsat(h.valyuta === 'USD' ? dollar(q.narxBirlik) : som(q.narxBirlik))}{' '}
                    {narxBirligiMatni(q.narxAsosi, h.valyuta, q.kirimBirligi)}
                  </td>
                )}
                {pulniKoradi && <td className="py-1.5 text-right">{pul(q.summa)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {pulniKoradi && <p className="mt-3 text-right font-bold">Jami: {pul(h.summa)}</p>}
        <div className="mt-16 flex justify-between">
          <p>Topshirdi: ____________________</p>
          <p>Qabul qildi: ____________________</p>
        </div>
      </div>
    </div>
  );
}
