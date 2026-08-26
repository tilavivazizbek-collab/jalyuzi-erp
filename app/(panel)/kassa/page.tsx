import { Fragment } from 'react';
import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import {
  kassaKitobi,
  kassaQoldiqlari,
  ochiqTopshiriqlar,
  topshirishManbalari,
  topshirishNishonlari,
  xodimBalanslari,
} from './malumot';
import { StornoTugmasi, TopshiriqQabulTugmasi } from './amallar';
import { TopshirishFormasi } from './topshirish-forma';
// Sarlavhada `#1` emas, filial NOMI ko'rinsin
import { filialNomi as filialNominiOl } from '../ombor/malumot';

export const dynamic = 'force-dynamic';

/** TZ 12.5 · 12.6 — kod → o'zbekcha nom. */
const KOD_NOMI: Record<string, string> = {
  K1: "Buyurtma to'lovi",
  K2: "Buyurtma to'lovi (keyin)",
  K3: "Mijoz qarzini to'lash",
  K4: 'Mijoz avansi',
  K5: 'Hisobdan chiqarilgan qarz qaytdi',
  K6: "Egasi pul qo'shdi",
  K7: 'Sotuvchidan topshiriq',
  K8: "Boshlang'ich qoldiq",
  K9: 'Boshqa kirim',
  C1: "Yetkazib beruvchiga to'lov",
  C2: 'Yetkazib beruvchiga avans',
  C3: "Transport / bojxona to'lovi",
  C4: "Ish haqi to'lovi",
  C5: 'Xodimga avans',
  C6: 'Mijozga qaytarish',
  C7: 'Operatsion xarajat',
  C8: 'Egasi pul oldi',
  C9: 'Adminga topshiriq',
  C10: 'Boshqa chiqim',
};

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'SOM' ? pulKorsat(som(summa)) : pulKorsat(dollar(summa));

export default async function KassaSahifasi() {
  const f = await sahifaRuxsati('kassa.oz.kor');
  // TZ 12.14 — sotuvchi FAQAT o'z kassasini ko'radi
  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');
  const stornoQilaOladi = ruxsatBormi(f, 'kassa.storno');

  const [qoldiqlar, kitob, topshiriqlar, balanslar, manbalar, nishonlar] = await Promise.all([
    kassaQoldiqlari(f.filialId, f.xodimId, barchaniKoradi),
    kassaKitobi(f.filialId, f.xodimId, barchaniKoradi),
    barchaniKoradi ? ochiqTopshiriqlar(f.filialId) : Promise.resolve([]),
    barchaniKoradi ? xodimBalanslari(f.filialId) : Promise.resolve([]),
    // 12.7 — sotuvchi O'Z kassasidan topshiradi
    topshirishManbalari(f.xodimId),
    topshirishNishonlari(f.filialId),
  ]);

  // 22.5.2 — ogohlantirishda ham, sarlavhada ham filial NOMI turadi
  const filialNomi = await filialNominiOl(f.filialId);

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
          <Link
            href="/kassa/amallar-sahifa"
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-colors hover:bg-fon"
          >
            Amallar
          </Link>
          <Link
            href="/kassa/kun"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brend-quyuq"
          >
            Kun yopish
          </Link>
        </div>
      </div>

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
                    <td className="px-4 py-2.5 text-right">
                      <TopshiriqQabulTugmasi topshiriqId={t.id} />
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
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Kassa kitobi</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Yozuvlar o&apos;chirilmaydi va o&apos;zgartirilmaydi (§6.5) — tuzatish storno bilan.
        </p>

        {kitob.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
            Hali kassa yozuvi yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Kassa</th>
                  <th className="px-4 py-2.5 font-medium">Hodisa</th>
                  <th className="px-4 py-2.5 font-medium">Manba</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                  {stornoQilaOladi && <th className="px-4 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {kitob.map((y) => (
                  <tr key={y.id} className={y.stornoQilinganmi ? 'text-matn-kuchsiz' : ''}>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {y.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5 text-xs">{y.kassaNomi}</td>
                    <td className="px-4 py-2.5">
                      {KOD_NOMI[y.kod] ?? y.kod}
                      {y.stornoMi && <span className="ml-2 text-xs text-belgi-qizil">storno</span>}
                      {y.stornoQilinganmi && <span className="ml-2 text-xs">storno qilingan</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-matn-kuchsiz">
                      {y.manbaTuri}#{y.manbaId}
                    </td>
                    <td
                      className={`raqam px-4 py-2.5 font-medium ${
                        Number(y.summa) < 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                      }`}
                    >
                      {pul(y.summa, y.valyuta)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-matn-kuchsiz">{y.xodimIsmi}</td>
                    {stornoQilaOladi && (
                      <td className="px-4 py-2.5 text-right">
                        {!y.stornoQilinganmi && !y.stornoMi && <StornoTugmasi yozuvId={y.id} />}
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
