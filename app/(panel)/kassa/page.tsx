import { Fragment } from 'react';
import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import Decimal from 'decimal.js';
import { kassaKodNomi, manbaKorinishi } from '@/lib/domain/kassa-kod';
import { toshkentKuni, VAQT_ZONASI } from '@/lib/domain/sana';
import { kitobFiltriniOqi, kitobSorovi, kunOldin, YONALISHLAR } from './kitob-filtr';
import { yopilmaganKunlar } from './kun-malumot';
import {
  kassaKitobi,
  kitobJami,
  kassaQoldiqlari,
  mengaKelganTopshiriqlar,
  ochiqTopshiriqlar,
  topshirishManbalari,
  topshirishNishonlari,
  xodimBalanslari,
} from './malumot';
import { StornoTugmasi, TopshiriqQabulTugmasi, TopshiriqRadTugmasi } from './amallar';
import { TopshirishFormasi } from './topshirish-forma';
// Sarlavhada `#1` emas, filial NOMI ko'rinsin
import { filialNomi as filialNominiOl } from '../ombor/malumot';

export const dynamic = 'force-dynamic';

const KATAK =
  'rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brend/25';

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'SOM' ? pulKorsat(som(summa)) : pulKorsat(dollar(summa));

const VAQT = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: VAQT_ZONASI,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function KassaSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('kassa.oz.kor');
  const bugun = toshkentKuni();
  const filtr = kitobFiltriniOqi(await searchParams, bugun);
  const kassaOchaOladi = ruxsatBormi(f, 'kassa.yarat');
  // TZ 12.14 — sotuvchi FAQAT o'z kassasini ko'radi
  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');
  const stornoQilaOladi = ruxsatBormi(f, 'kassa.storno');

  const [qoldiqlar, kitob, jami, topshiriqlar, balanslar, manbalar, nishonlar, kelganlar] = await Promise.all([
    kassaQoldiqlari(f.filialId, f.xodimId, barchaniKoradi),
    kassaKitobi(f.filialId, f.xodimId, barchaniKoradi, filtr),
    kitobJami(f.filialId, f.xodimId, barchaniKoradi, filtr),
    barchaniKoradi ? ochiqTopshiriqlar(f.filialId) : Promise.resolve([]),
    barchaniKoradi ? xodimBalanslari(f.filialId) : Promise.resolve([]),
    // 12.7 — sotuvchi O'Z kassasidan topshiradi
    topshirishManbalari(f.xodimId),
    topshirishNishonlari(f.filialId, f.xodimId),
    // T-05 — boshqa sotuvchi shu sotuvchiga bergan pul
    mengaKelganTopshiriqlar(f.xodimId),
  ]);

  // 22.5.2 — ogohlantirishda ham, sarlavhada ham filial NOMI turadi
  const [filialNomi, yopilmagan] = await Promise.all([
    filialNominiOl(f.filialId),
    // 12.17 — nazorat: harakat bo'lgan, yopilmagan naqd kunlar (oxirgi 30 kun)
    yopilmaganKunlar(
      qoldiqlar.filter((k) => k.turi === 'NAQD').map((k) => k.id),
      kunOldin(bugun, 29),
      bugun,
    ),
  ]);

  const filialKassalari = qoldiqlar.filter((k) => k.xodimId === null);
  const xodimKassalari = qoldiqlar.filter((k) => k.xodimId !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Kassa</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {barchaniKoradi ? `${filialNomi} — barcha kassa` : "Faqat o'z kassangiz (12.14)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/*
            ⚠️ TZ 12.2 — kassa ochish. Ilgari bu tugma yo'q edi va
               kassa jadvali bo'sh turardi: to'lov ham, kun yopish
               ham ishlamasdi.
          */}
          <Link
            href="/kassa/royxat"
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
          >
            Kassalar
          </Link>
          {kassaOchaOladi && (
            <Link
              href="/kassa/yangi"
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98]"
            >
              + Yangi kassa
            </Link>
          )}
          <Link
            href="/kassa/amallar-sahifa"
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
          >
            Amallar
          </Link>
          <Link
            href="/kassa/kun"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq"
          >
            Kun yopish
          </Link>
        </div>
      </div>

      {yopilmagan.length > 0 && (
        <Link
          href="/kassa/kun"
          className="rounded-karta border border-belgi-sariq/30 bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq hover:underline"
        >
          {yopilmagan.length} ta kun yopilmagan (oxirgi 30 kun) — eng eskisi {yopilmagan[yopilmagan.length - 1]?.sana} →
        </Link>
      )}

      {/* ── 12.16 · Qator 1: hozir kassada nima bor ── */}
      <section className="grid gap-4 sm:grid-cols-2">
        {filialKassalari.length > 0 && (
          <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
            <h2 className="mb-2 text-sm font-medium text-matn-ikki">Admin kassasi</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {filialKassalari.map((k) => (
                <Fragment key={k.id}>
                  <dt className="text-matn-kuchsiz">
                    {k.turi === 'KARTA'
                      ? 'Kartada'
                      : `Naqd ${k.valyuta === 'SOM' ? "so'm" : 'dollar'}`}
                  </dt>
                  <dd className="raqam font-medium">{pul(k.qoldiq, k.valyuta)}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        )}

        {xodimKassalari.length > 0 && (
          <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
            <h2 className="mb-2 text-sm font-medium text-matn-ikki">Sotuvchilarda</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {xodimKassalari.map((k) => (
                <Fragment key={k.id}>
                  <dt className="text-matn-kuchsiz">
                    {k.xodimIsmi ?? '—'}
                    <span className="ml-1 text-xs text-matn-kuchsiz">{k.valyuta}</span>
                  </dt>
                  <dd className="raqam font-medium">{pul(k.qoldiq, k.valyuta)}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        )}
      </section>

      {/* ── 12.7 · 22.5 · Sotuvchi pulni topshiradi ── */}
      {manbalar.length > 0 && nishonlar.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-matn-ikki">Pul topshirish</h2>
          <TopshirishFormasi manbalar={manbalar} nishonlar={nishonlar} filialNomi={filialNomi} />
        </section>
      )}

      {/* ── T-05 · Boshqa sotuvchi bergan pul — qo'lga olgan odam tasdiqlaydi ── */}
      {kelganlar.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Sizga berilgan pul</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Pulni sanab oling. «Qabul qilish» bosilganda u kassangizga o&apos;tadi; summa mos
            kelmasa — rad eting, pul berganning kassasida qoladi (12.7).
          </p>
          <div className="overflow-x-auto rounded-karta border border-belgi-sariq/20 bg-belgi-sariq-fon">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-chegara">
                {kelganlar.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2.5">{t.kimdan}</td>
                    <td className="raqam px-4 py-2.5 font-medium">{pul(t.summa, t.valyuta)}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{t.izoh ?? ''}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <TopshiriqRadTugmasi topshiriqId={t.id} />
                        <TopshiriqQabulTugmasi topshiriqId={t.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 12.7 · Kutayotgan topshiriqlar ── */}
      {topshiriqlar.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Kutayotgan topshiriqlar</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Pul <b>qabul qilinganda</b> ko&apos;chadi, jo&apos;natilganda emas (12.4).
          </p>

          <div className="overflow-x-auto rounded-karta border border-belgi-sariq/20 bg-belgi-sariq-fon">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {topshiriqlar.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2.5">{t.kimdan}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">→ {t.kimga}</td>
                    <td className="raqam px-4 py-2.5 font-medium">{pul(t.summa, t.valyuta)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <TopshiriqRadTugmasi topshiriqId={t.id} />
                        <TopshiriqQabulTugmasi topshiriqId={t.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 10.4 · Xodim balanslari ── */}
      {balanslar.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Xodim balanslari</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Balans saqlanmaydi — harakatlar yig&apos;indisi (2.2-invariant). Manfiy balans ruxsat
            etiladi (10.4).
          </p>

          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Xodim</th>
                  <th className="px-4 py-2.5 text-right font-medium">So&apos;m</th>
                  <th className="px-4 py-2.5 text-right font-medium">Dollar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {balanslar.map((b) => (
                  <tr key={b.xodimId}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/kassa/xodim/${String(b.xodimId)}`}
                        className="underline underline-offset-2 hover:text-matn"
                      >
                        {b.ism}
                      </Link>
                    </td>
                    <td
                      className={`raqam px-4 py-2.5 ${Number(b.somBalans) < 0 ? 'text-belgi-qizil' : ''}`}
                    >
                      {pulKorsat(som(b.somBalans))}
                    </td>
                    <td
                      className={`raqam px-4 py-2.5 ${Number(b.dollarBalans) < 0 ? 'text-belgi-qizil' : ''}`}
                    >
                      {Number(b.dollarBalans) === 0 ? '—' : pulKorsat(dollar(b.dollarBalans))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 12.18 · Kassa kitobi ── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-matn-ikki">Kassa kitobi</h2>
            <p className="text-xs text-matn-kuchsiz">
              Yozuvlar o&apos;chirilmaydi va o&apos;zgartirilmaydi (§6.5) — tuzatish storno bilan.
            </p>
          </div>
          <a
            href={`/kassa/eksport?${kitobSorovi(filtr)}`}
            className="rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] text-matn-ikki hover:bg-fon"
          >
            Excel&apos;ga yuklash
          </a>
        </div>

        {/* Filtr — oddiy GET forma: havola nusxalansa ham shu ko'rinish ochiladi */}
        <form method="get" className="flex flex-wrap items-end gap-2 rounded-karta border border-chegara bg-sirt p-3 text-[13px]">
          <label className="flex flex-col gap-1">
            <span className="text-matn-kuchsiz">Dan</span>
            <input type="date" name="dan" defaultValue={filtr.dan} className={KATAK} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-matn-kuchsiz">Gacha</span>
            <input type="date" name="gacha" defaultValue={filtr.gacha} className={KATAK} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-matn-kuchsiz">Kassa</span>
            <select name="kassa" defaultValue={filtr.kassaId === null ? '' : String(filtr.kassaId)} className={KATAK}>
              <option value="">Hammasi</option>
              {qoldiqlar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-matn-kuchsiz">Yo&apos;nalish</span>
            <select name="yonalish" defaultValue={filtr.yonalish} className={KATAK}>
              {Object.entries(YONALISHLAR).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-maydon bg-brend px-3 py-1.5 font-medium text-tugma-matn hover:bg-brend-quyuq"
          >
            Ko&apos;rsatish
          </button>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {[
              { nom: 'Bugun', dan: bugun },
              { nom: '7 kun', dan: kunOldin(bugun, 6) },
              { nom: '30 kun', dan: kunOldin(bugun, 29) },
              { nom: 'Shu oy', dan: `${bugun.slice(0, 8)}01` },
            ].map((t) => {
              const faol = filtr.dan === t.dan && filtr.gacha === bugun;
              return (
                <Link
                  key={t.nom}
                  href={`/kassa?${kitobSorovi(filtr, { dan: t.dan, gacha: bugun })}`}
                  aria-current={faol ? 'page' : undefined}
                  className={`rounded-full border px-2.5 py-1 ${
                    faol ? 'border-brend bg-brend text-tugma-matn' : 'border-chegara-quyuq text-matn-ikki hover:bg-fon'
                  }`}
                >
                  {t.nom}
                </Link>
              );
            })}
          </div>
        </form>

        {/* Davr jami — valyuta ALOHIDA (1.3); ro'yxat kesilsa ham to'liq */}
        {jami.length > 0 && (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {jami.map((j) => (
              <div key={j.valyuta} className="flex flex-wrap gap-x-4">
                <div>
                  <dt className="text-xs text-matn-kuchsiz">Kirim, {j.valyuta === 'USD' ? '$' : "so'm"}</dt>
                  <dd className="raqam font-semibold text-belgi-yashil">{pul(j.kirim, j.valyuta)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-matn-kuchsiz">Chiqim, {j.valyuta === 'USD' ? '$' : "so'm"}</dt>
                  <dd className="raqam font-semibold text-belgi-qizil">{pul(j.chiqim, j.valyuta)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-matn-kuchsiz">Farq · {j.soni} yozuv</dt>
                  <dd className="raqam font-semibold">
                    {pul(new Decimal(j.kirim).minus(j.chiqim).toFixed(2), j.valyuta)}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {kitob.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
            Bu davrda kassa yozuvi yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Vaqt</th>
                  <th className="px-4 py-2.5 font-medium">Kassa</th>
                  <th className="px-4 py-2.5 font-medium">Hodisa</th>
                  <th className="px-4 py-2.5 font-medium">Manba / izoh</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                  {stornoQilaOladi && <th className="px-4 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {kitob.map((y) => {
                  const m = manbaKorinishi(y.manbaTuri, y.manbaId, y.manbaNomi, y.manbaBogliqId);
                  const chiqim = y.summa.startsWith('-');
                  return (
                    <tr key={y.id} className={y.stornoQilinganmi ? 'text-matn-kuchsiz' : ''}>
                      <td className="raqam whitespace-nowrap px-4 py-2.5 text-matn-ikki">{VAQT.format(y.sana)}</td>
                      <td className="px-4 py-2.5 text-xs">{y.kassaNomi}</td>
                      <td className="px-4 py-2.5">
                        {kassaKodNomi(y.kod)}
                        {y.stornoMi && <span className="ml-2 text-xs text-belgi-qizil">storno</span>}
                        {y.stornoQilinganmi && <span className="ml-2 text-xs">storno qilingan</span>}
                      </td>
                      <td className="max-w-[320px] px-4 py-2.5 text-[13px]">
                        {m.havola === null ? (
                          <span className="text-matn-ikki">{m.matn}</span>
                        ) : (
                          <Link href={m.havola} className="text-brend hover:underline">
                            {m.matn}
                          </Link>
                        )}
                        {y.izoh !== null && y.izoh !== '' && (
                          <span className="block truncate text-xs text-matn-kuchsiz" title={y.izoh}>
                            {y.izoh}
                          </span>
                        )}
                      </td>
                      <td
                        className={`raqam whitespace-nowrap px-4 py-2.5 text-right font-medium ${
                          chiqim ? 'text-belgi-qizil' : 'text-belgi-yashil'
                        }`}
                      >
                        {pul(y.summa, y.valyuta)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-matn-kuchsiz">{y.xodimIsmi}</td>
                      {stornoQilaOladi && (
                        <td className="px-4 py-2.5 text-right">
                          {/* Kun yopish farqi — faqat kunni qayta ochish bilan bekor bo'ladi */}
                          {!y.stornoQilinganmi && !y.stornoMi && y.manbaTuri !== 'kassa_kun' && (
                            <StornoTugmasi yozuvId={y.id} />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {kitob.length >= 500 && (
          <p className="text-xs text-matn-kuchsiz">
            Oxirgi 500 yozuv ko&apos;rsatildi — to&apos;liq ro&apos;yxat Excel&apos;da, jami esa davr bo&apos;yicha to&apos;liq.
          </p>
        )}
      </section>
    </div>
  );
}
