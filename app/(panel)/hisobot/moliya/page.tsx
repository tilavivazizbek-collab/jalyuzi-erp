import Link from 'next/link';
import Decimal from 'decimal.js';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import {
  davrMatn,
  davrTurimi,
  davrYasa,
  oldingiDavr,
  type DavrTuri,
} from '@/lib/domain/hisobot/davr';
import { foydaZarar, ozgarishFoizi, xarajatModdaNomi } from '@/lib/domain/hisobot/foyda-zarar';
import { pulKorsat, som } from '@/lib/domain/pul';
import { toshkentKuni } from '@/lib/domain/sana';
import { foydaZararMalumoti, kassaOqimi, pulPrognoziMalumoti } from '../malumot';
import { pulPrognozi } from '@/lib/domain/hisobot/pul-prognozi';
import { PrognozGrafik } from './prognoz-grafik';
import { malumotSalomatligi } from '../salomatlik-malumot';
import { kassaKodNomi } from '@/lib/domain/kassa-kod';
import { KASSA_TURI_NOMI, type KassaTuri } from '@/lib/sxema/kassa-yarat';
import { dollar } from '@/lib/domain/pul';

export const dynamic = 'force-dynamic';

/**
 * TZ 11.4 — moliya hisobotlari. Hisobotlar auditi 2026-10-11.
 *
 * ⚠️ Ilgari bu sahifa YO'Q edi («tayyor emas» deb turardi): xarajatlar
 *    bazaga yozilardi, lekin sof foydani tizimdan ko'rib bo'lmasdi.
 * ⚠️ Faqat so'm (1.3). Dollar xarajat bo'lsa — ogoh, qo'shilmaydi.
 */

const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'HAFTA', nom: 'Hafta' },
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
  { kod: 'YIL', nom: 'Yil' },
];

const pul = (s: string): string => pulKorsat(som(s));

function Ozgarish({ joriy, oldingi, teskari = false }: { joriy: string; oldingi: string; teskari?: boolean }) {
  const f = ozgarishFoizi(joriy, oldingi);
  if (f === null) return <span className="text-matn-kuchsiz">—</span>;
  // Xarajatda o'sish yomon — rang teskari
  const yaxshi = teskari ? f <= 0 : f >= 0;
  return (
    <span className={yaxshi ? 'text-belgi-yashil' : 'text-belgi-qizil'}>
      {f >= 0 ? '+' : '−'}
      {Math.abs(f).toFixed(1)}%
    </span>
  );
}

export default async function MoliyaHisoboti({
  searchParams,
}: {
  searchParams: Promise<{ davr?: string }>;
}) {
  const f = await sahifaRuxsati('hisobot.moliya.kor');
  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri = davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'OY';
  const davr = davrYasa(davrTuri, new Date());
  const oldin = oldingiDavr(davr);

  const [joriyXom, oldinXom, oqim, prognozXom] = await Promise.all([
    foydaZararMalumoti(f.filialId, davr),
    foydaZararMalumoti(f.filialId, oldin),
    kassaOqimi(f.filialId, davr),
    pulPrognoziMalumoti(f.filialId),
  ]);
  const muammolar = await malumotSalomatligi(f.filialId);
  const xavfSoni = muammolar.filter((m) => m.daraja === 'XAVF').length;
  const prognoz = pulPrognozi({
    bugun: prognozXom.bugun,
    boshlangich: prognozXom.boshlangich,
    kirimlar: prognozXom.kirimlar,
    chiqimlar: prognozXom.chiqimlar,
    kunlikKirim: prognozXom.kunlikKirim,
    kunlikChiqim: prognozXom.kunlikChiqim,
  });
  const oxirgiKun = prognoz.kunlar[prognoz.kunlar.length - 1];
  const yaqinHodisalar = [...prognozXom.kirimlar, ...prognozXom.chiqimlar]
    .filter((h) => h.sana <= (oxirgiKun?.sana ?? h.sana))
    .sort((a, b) => a.sana.localeCompare(b.sana) || a.turi.localeCompare(b.turi))
    .slice(0, 15);
  const valPul = (x: string, v: string): string =>
    v === 'USD' ? `${pulKorsat(dollar(x))} $` : pulKorsat(som(x));
  const j = foydaZarar(joriyXom);
  const o = foydaZarar(oldinXom);

  // Ikkala davrdagi moddalar — biri bo'lmasa 0
  const moddalar = [...new Set([...j.xarajatlar, ...o.xarajatlar].map((x) => x.modda))];
  const moddaSumma = (fz: typeof j, m: string): string =>
    fz.xarajatlar.find((x) => x.modda === m)?.summa ?? '0.00';
  moddalar.sort((a, b) => new Decimal(moddaSumma(j, b)).comparedTo(moddaSumma(j, a)));

  // Kassa oqimi — kassa kitobi shu davr bilan
  const dan = toshkentKuni(davr.boshi);
  const gacha = toshkentKuni(new Date(davr.oxiri.getTime() - 1));
  const sofManfiy = j.sofFoyda.startsWith('-');

  const Qator = ({
    nom,
    jv,
    ov,
    qalin = false,
    ichki = false,
    teskari = false,
  }: {
    nom: string;
    jv: string;
    ov: string;
    qalin?: boolean;
    ichki?: boolean;
    teskari?: boolean;
  }) => (
    <tr className={qalin ? 'bg-fon font-semibold' : ''}>
      <td className={`px-4 py-2 ${ichki ? 'pl-8 text-matn-ikki' : ''}`}>{nom}</td>
      <td className="raqam px-4 py-2 text-right">{pul(jv)}</td>
      <td className="raqam px-4 py-2 text-right text-matn-ikki">{pul(ov)}</td>
      <td className="raqam px-4 py-2 text-right text-xs">
        <Ozgarish joriy={jv} oldingi={ov} teskari={teskari} />
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Moliya</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {davrMatn(davr)} · oldingi davr bilan taqqoslab (11.4.1)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAVRLAR.map((d) => (
          <Link
            key={d.kod}
            href={`/hisobot/moliya?davr=${d.kod}`}
            className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
              d.kod === davrTuri
                ? 'border-brend bg-brend text-tugma-matn'
                : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
            }`}
          >
            {d.nom}
          </Link>
        ))}
      </div>

      {/* Ma'lumot salomatligi — hisobotga ishonch darajasi */}
      {muammolar.length > 0 && (
        <Link
          href="/hisobot/salomatlik"
          className={`rounded-karta border px-4 py-2.5 text-sm hover:underline ${
            xavfSoni > 0
              ? 'border-belgi-qizil/30 bg-belgi-qizil-fon text-belgi-qizil'
              : 'border-belgi-sariq/30 bg-belgi-sariq-fon text-belgi-sariq'
          }`}
        >
          Ma&apos;lumotda {muammolar.length} xil muammo
          {xavfSoni > 0 && ` (${String(xavfSoni)} tasi raqamlarni buzadi)`} — bu hisobot shunga qarab
          noaniq bo&apos;lishi mumkin →
        </Link>
      )}

      {/* ── Pul prognozi — keyingi 30 kun ── */}
      <section className="flex flex-col gap-3 rounded-karta border border-chegara bg-sirt p-4">
        <div>
          <h2 className="text-sm font-medium text-matn">Pul prognozi — keyingi 30 kun</h2>
          <p className="text-xs text-matn-kuchsiz">
            Bugungi kassa + muddati keladigan mijoz to&apos;lovlari − yetkazib beruvchiga to&apos;lovlar.
            «Odatdagi oqim» — oxirgi 90 kunning o&apos;rtacha kunlik savdo tushumi (+{pul(prognozXom.kunlikKirim)})
            va doimiy chiqimi (−{pul(prognozXom.kunlikChiqim)}: ish haqi, avans, operatsion). Taxmin — va&apos;da emas.
          </p>
        </div>
        {(prognoz.yetmaydi !== null || prognoz.malumYetmaydi !== null) && (
          <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2 text-sm text-belgi-qizil">
            ⚠{' '}
            {prognoz.yetmaydi !== null
              ? `${prognoz.yetmaydi.sana} kuni kassada pul yetmaydi (${pul(prognoz.yetmaydi.qoldiq)}).`
              : `Faqat ma'lum to'lovlar bo'yicha ${prognoz.malumYetmaydi?.sana ?? ''} kuni pul yetmaydi — yangi savdo bo'lmasa.`}{' '}
            Oldindan: mijozlardan qarz undiring yoki yetkazib beruvchi bilan muddatni kelishing.
          </p>
        )}
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-matn-kuchsiz">Bugun kassada (so&apos;m)</dt>
            <dd className="raqam text-lg font-semibold">{pul(prognozXom.boshlangich)}</dd>
          </div>
          <div>
            <dt className="text-xs text-matn-kuchsiz">30 kundan keyin (odatdagi oqim bilan)</dt>
            <dd className={`raqam text-lg font-semibold ${oxirgiKun?.odatdagi.startsWith('-') === true ? 'text-belgi-qizil' : ''}`}>
              {pul(oxirgiKun?.odatdagi ?? '0')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-matn-kuchsiz">Eng past nuqta</dt>
            <dd className={`raqam text-lg font-semibold ${prognoz.engPast.qoldiq.startsWith('-') ? 'text-belgi-qizil' : ''}`}>
              {pul(prognoz.engPast.qoldiq)}
              <span className="ml-1 text-xs font-normal text-matn-kuchsiz">{prognoz.engPast.sana}</span>
            </dd>
          </div>
        </dl>
        <PrognozGrafik kunlar={prognoz.kunlar} />
        {yaqinHodisalar.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-matn-ikki">Kutilayotgan to&apos;lovlar ({yaqinHodisalar.length})</summary>
            <table className="mt-2 w-full text-[13px]">
              <tbody className="divide-y divide-chegara">
                {yaqinHodisalar.map((h) => (
                  <tr key={`${h.turi}-${h.hujjat}-${h.sana}`}>
                    <td className="raqam py-1 text-matn-ikki">{h.sana}</td>
                    <td className="py-1">
                      <Link href={h.havola} className="hover:underline">
                        {h.nom}
                      </Link>{' '}
                      <span className="text-xs text-matn-kuchsiz">{h.hujjat}</span>
                    </td>
                    <td className={`raqam py-1 text-right ${h.turi === 'KIRIM' ? 'text-belgi-yashil' : 'text-belgi-qizil'}`}>
                      {h.turi === 'KIRIM' ? '+' : '−'}
                      {pul(h.summa)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
        {(!prognozXom.muddatiOtganKirim.startsWith('0.00') ||
          !prognozXom.muddatsizKirim.startsWith('0.00') ||
          !prognozXom.muddatsizChiqim.startsWith('0.00')) && (
          <p className="text-xs text-matn-kuchsiz">
            Prognozga kirmagan: muddati o&apos;tgan mijoz qarzi {pul(prognozXom.muddatiOtganKirim)} (undirilsa — qo&apos;shimcha
            pul), muddatsiz mijoz qarzi {pul(prognozXom.muddatsizKirim)}, muddatsiz yetkazib beruvchi qarzi{' '}
            {pul(prognozXom.muddatsizChiqim)}.
          </p>
        )}
      </section>

      {/* Asosiy raqam — sof foyda */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <p className="text-xs text-matn-kuchsiz">Tushum</p>
          <p className="raqam mt-1 text-xl font-semibold">{pul(j.tushum)}</p>
        </div>
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <p className="text-xs text-matn-kuchsiz">Sof foyda</p>
          <p className={`raqam mt-1 text-xl font-semibold ${sofManfiy ? 'text-belgi-qizil' : 'text-belgi-yashil'}`}>
            {pul(j.sofFoyda)}
          </p>
          <p className="text-xs">
            <Ozgarish joriy={j.sofFoyda} oldingi={o.sofFoyda} /> oldingi davrga nisbatan
          </p>
        </div>
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <p className="text-xs text-matn-kuchsiz">Rentabellik (sof foyda / tushum)</p>
          <p className="raqam mt-1 text-xl font-semibold">
            {j.rentabellik === null ? '—' : `${String(j.rentabellik)}%`}
          </p>
        </div>
      </section>

      {/* ── 11.4.1 · Foyda-zarar ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Foyda-zarar</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Tushum va tannarx — sotuv sanasi bo&apos;yicha (usta haqi mahsulot sotilgan davrda).
          Qaytarilgan buyum tushumga kirmaydi, materiali esa tannarxda qoladi. Xarajatlar — o&apos;z
          sanasi bo&apos;yicha.
        </p>
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ko&apos;rsatkich</th>
                <th className="px-4 py-2.5 text-right font-medium">Joriy davr</th>
                <th className="px-4 py-2.5 text-right font-medium">Oldingi davr</th>
                <th className="px-4 py-2.5 text-right font-medium">O&apos;zgarish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara">
              <Qator nom="Tushum" jv={j.tushum} ov={o.tushum} qalin />
              <Qator nom="Tannarx" jv={j.tannarx} ov={o.tannarx} teskari />
              <Qator nom="material" jv={j.material} ov={o.material} ichki teskari />
              <Qator nom="usta haqi" jv={j.ishHaqi} ov={o.ishHaqi} ichki teskari />
              <Qator nom="Yalpi foyda" jv={j.yalpiFoyda} ov={o.yalpiFoyda} qalin />
              <Qator nom="Xarajatlar" jv={j.xarajatJami} ov={o.xarajatJami} teskari />
              {moddalar.map((m) => (
                <Qator
                  key={m}
                  nom={xarajatModdaNomi(m)}
                  jv={moddaSumma(j, m)}
                  ov={moddaSumma(o, m)}
                  ichki
                  teskari
                />
              ))}
              {/* 11.4.7 — kurs farqi xarajat va daromad ALOHIDA */}
              <Qator nom="Kurs farqi — zarar" jv={j.kursZarar} ov={o.kursZarar} teskari />
              <Qator nom="Kurs farqi — daromad" jv={j.kursDaromad} ov={o.kursDaromad} />
              <Qator nom="Sof foyda" jv={j.sofFoyda} ov={o.sofFoyda} qalin />
            </tbody>
          </table>
        </div>
        {joriyXom.dollarXarajatSoni > 0 && (
          <p className="mt-2 text-xs text-belgi-sariq">
            Dollarda yozilgan {joriyXom.dollarXarajatSoni} ta xarajat bu jadvalga qo&apos;shilmadi —
            so&apos;m va dollar aralashtirilmaydi (1.3).
          </p>
        )}
      </section>

      {/* ── 11.4.2 · Kassa oqimi ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Kassa oqimi</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Pul harakati (foyda emas): boshlang&apos;ich + kirim − chiqim = yakuniy. Storno
          juftliklari o&apos;zini o&apos;zi yopadi. Valyuta alohida.
        </p>
        {oqim.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
            Kassa yozuvi yo&apos;q.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {oqim.map((o2) => (
              <div key={o2.valyuta} className="rounded-karta border border-chegara bg-sirt p-4">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {[
                    { nom: 'Boshlang‘ich', qiymat: o2.boshlangich, rang: '' },
                    { nom: 'Kirim', qiymat: o2.kirim, rang: 'text-belgi-yashil' },
                    { nom: 'Chiqim', qiymat: o2.chiqim, rang: 'text-belgi-qizil' },
                    { nom: 'Yakuniy', qiymat: o2.yakuniy, rang: 'font-semibold' },
                  ].map(({ nom, qiymat, rang }) => (
                    <div key={nom}>
                      <dt className="text-xs text-matn-kuchsiz">
                        {nom}, {o2.valyuta === 'USD' ? '$' : "so'm"}
                      </dt>
                      <dd className={`raqam ${rang}`}>{valPul(qiymat, o2.valyuta)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <table className="w-full text-[13px]">
                    <thead className="text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                      <tr>
                        <th className="py-1 font-medium">Hodisa</th>
                        <th className="py-1 text-right font-medium">Sof summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-chegara">
                      {o2.kodlar.map((k) => (
                        <tr key={k.kalit}>
                          <td className="py-1">{kassaKodNomi(k.kalit)}</td>
                          <td className={`raqam py-1 text-right ${k.summa.startsWith('-') ? 'text-belgi-qizil' : 'text-belgi-yashil'}`}>
                            {valPul(k.summa, o2.valyuta)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <table className="w-full text-[13px]">
                    <thead className="text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                      <tr>
                        <th className="py-1 font-medium">Kassa turi</th>
                        <th className="py-1 text-right font-medium">Sof harakat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-chegara">
                      {o2.turlar.map((t) => (
                        <tr key={t.kalit}>
                          <td className="py-1">{KASSA_TURI_NOMI[t.kalit as KassaTuri] ?? t.kalit}</td>
                          <td className="raqam py-1 text-right">{valPul(t.summa, o2.valyuta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 11.4.2 · 11.4.5 · 11.4.6 — mavjud ekranlarga ── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href={`/kassa?dan=${dan}&gacha=${gacha}`}
          className="rounded-karta border border-chegara bg-sirt px-4 py-3 text-sm hover:bg-fon"
        >
          <b>Kassa kitobi</b>
          <span className="block text-xs text-matn-kuchsiz">shu davr yozuvlari batafsil, Excel →</span>
        </Link>
        <Link href="/mijoz/qarzdorlik" className="rounded-karta border border-chegara bg-sirt px-4 py-3 text-sm hover:bg-fon">
          <b>Debitorlik</b>
          <span className="block text-xs text-matn-kuchsiz">mijozlar qarzi, yoshi bo&apos;yicha →</span>
        </Link>
        <Link href="/yetkazib?filtr=qarz" className="rounded-karta border border-chegara bg-sirt px-4 py-3 text-sm hover:bg-fon">
          <b>Kreditorlik</b>
          <span className="block text-xs text-matn-kuchsiz">yetkazib beruvchilarga qarzimiz →</span>
        </Link>
      </section>
    </div>
  );
}
