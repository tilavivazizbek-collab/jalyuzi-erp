import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import {
  muzlaganPulHisoboti,
  omborAbc,
  omborQiymati,
  sarflanishTezligi,
  ustamaHisoboti,
} from '../malumot';

export const dynamic = 'force-dynamic';

/**
 * TZ 11.7 — ombor hisobotlari.
 *
 * Bitta sahifada to'rt hisobot: qoldiq qiymati (11.7.1), ustama eroziyasi
 * (11.7.5), muzlab qolgan pul (11.7.6) va sarflanish tezligi
 * (HISOBOTLAR-ISH §3.1 №13–14).
 *
 * ⚠️ Ruxsat 11.10 bo'yicha: bu sahifada TANNARX bor, shuning uchun
 *    `hisobot.ombor.kor` kerak — sotuvchida u yo'q.
 */

const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'HAFTA', nom: 'Hafta' },
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
  { kod: 'YIL', nom: 'Yil' },
];

const son = (n: number): string =>
  n.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }).replace(/,/g, ' ');

export default async function OmborHisoboti({
  searchParams,
}: {
  searchParams: Promise<{ davr?: string }>;
}) {
  const f = await sahifaRuxsati('hisobot.ombor.kor');

  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri =
    davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'OY';
  const davr = davrYasa(davrTuri, new Date());

  const [qiymat, ustama, muzlagan, tezlik, abc] = await Promise.all([
    omborQiymati(f.filialId),
    ustamaHisoboti(f.filialId),
    muzlaganPulHisoboti(f.filialId),
    sarflanishTezligi(f.filialId, davr),
    omborAbc(f.filialId),
  ]);

  const xavfli = tezlik
    .filter((t) => t.bashorat.holati === 'XAVF' || t.bashorat.holati === 'TUGAGAN')
    .slice(0, 15);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Ombor hisobotlari
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            TZ 11.7 · {davrMatn(davr)} · hisobot saqlanmaydi, har ochilganda yig&apos;iladi
          </p>
        </div>
        <nav className="flex gap-1.5">
          {DAVRLAR.map((d) => (
            <Link
              key={d.kod}
              href={`/hisobot/ombor?davr=${d.kod}`}
              className={
                d.kod === davrTuri
                  ? 'rounded-maydon bg-brend px-3 py-1.5 text-sm font-medium text-white'
                  : 'rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]'
              }
            >
              {d.nom}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Holat qatori — HISOBOTLAR-ISH §1 ── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Karta
          sarlavha="Qoldiq qiymati"
          qiymat={`${pulKorsat(som(qiymat))} so'm`}
          izoh="Omborda turgan pul (11.7.1)"
        />
        <Karta
          sarlavha="Muzlab qolgan pul"
          qiymat={`${pulKorsat(muzlagan.jami)} so'm`}
          izoh={`Ostatka ${String(muzlagan.ostatkalar.ulushFoiz)}% · tayyor ${String(
            muzlagan.tayyorMahsulot.ulushFoiz,
          )}% · qimirlamagan ${String(muzlagan.qimirlamagan.ulushFoiz)}%`}
          diqqat={muzlagan.kesishgan.length > 0}
        />
        <Karta
          sarlavha="Ustamasi chegaradan past"
          qiymat={`${String(ustama.pastSoni)} ta material`}
          izoh={`Jami ${String(ustama.jamiSoni)} materialdan (11.7.5)`}
          diqqat={ustama.pastSoni > 0}
        />
      </section>

      {muzlagan.kesishgan.length > 0 && (
        <p className="rounded-karta border border-sariq bg-sariq-fon px-4 py-3 text-sm text-matn">
          ⚠️ {muzlagan.kesishgan.length} ta material ikkala bo&apos;lakda ham sanaldi —
          jami summa oshib ketgan bo&apos;lishi mumkin (12.1).
        </p>
      )}

      {/* ── 11.7.5 · Ustama eroziyasi ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          Ustama eroziyasi — TZ 11.7.5
        </h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Kirimda ogohlantirish bir marta chiqadi (7.8). Bu yerda butun ro&apos;yxat
          turadi: qaysi materialning narxini ko&apos;tarish kerakligi bir ekranda
          ko&apos;rinadi. Tannarx — omborda turgan bo&apos;laklarning o&apos;rtachasi.
        </p>
        {ustama.jamiSoni === 0 ? (
          <Bosh matn="Omborda material yo'q." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Material</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sotuv narxi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ustama</th>
                  <th className="px-4 py-2.5 text-right font-medium">Chegara</th>
                </tr>
              </thead>
              <tbody>
                {ustama.qatorlar.map((q) => (
                  <tr key={q.materialId} className="border-b border-chegara last:border-0">
                    <td className="px-4 py-2.5">
                      <Link href={`/material/${String(q.materialId)}`} className="hover:underline">
                        {q.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {pulKorsat(q.tannarx)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {pulKorsat(q.sotuvNarx)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {q.hisoblanmadi ? (
                        <span className="text-matn-kuchsiz">narx yo&apos;q</span>
                      ) : (
                        <span className={q.pastmi ? 'font-medium text-qizil' : ''}>
                          {q.ustamaFoiz.toFixed(1)}% {q.pastmi ? '⚠' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-matn-kuchsiz">
                      {q.chegara}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── §3.1 №13–14 · Sarflanish tezligi va tugash bashorati ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          Qachon tugaydi — sarflanish tezligi
        </h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Davr sarfi kunlarga bo&apos;linadi va joriy qoldiqqa qo&apos;llanadi. Bu
          bashorat emas, taxmin: mavsumiylikni hisobga olmaydi. Ko&apos;chirish va
          inventarizatsiya sarf deb sanalmaydi.
        </p>
        {xavfli.length === 0 ? (
          <Bosh matn="Yaqin ikki haftada tugaydigan material yo'q." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Material</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qoldiq</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kunlik sarf</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qoldi</th>
                  <th className="px-4 py-2.5 text-right font-medium">30 kunga kerak</th>
                </tr>
              </thead>
              <tbody>
                {xavfli.map((t) => (
                  <tr key={t.materialId} className="border-b border-chegara last:border-0">
                    <td className="px-4 py-2.5">{t.nom}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{son(t.qoldiq)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {son(t.kunlikTezlik)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-qizil">
                      {t.bashorat.kunlar === null
                        ? '—'
                        : `${String(t.bashorat.kunlar)} kun`}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {t.kerak30Kun > 0 ? son(t.kerak30Kun) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 11.7.6 · Muzlab qolgan pul ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          Muzlab qolgan pul — TZ 11.7.6
        </h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Uch joyda pul o&apos;lik yotadi va alohida hech kim sanamaydi. Ostatka
          uchinchi qatordan ayirilgan — bir xil pul ikki marta sanalmasin.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <Bolakcha
            nom="Ostatkalar (7.4)"
            summa={pulKorsat(muzlagan.ostatkalar.qiymat)}
            soni={`${String(muzlagan.ostatkalar.soni)} ta bo'lak`}
            ulush={muzlagan.ostatkalar.ulushFoiz}
          />
          <Bolakcha
            nom="Sotilmagan tayyor mahsulot"
            summa={pulKorsat(muzlagan.tayyorMahsulot.qiymat)}
            soni={`${String(muzlagan.tayyorMahsulot.soni)} ta pozitsiya`}
            ulush={muzlagan.tayyorMahsulot.ulushFoiz}
          />
          <Bolakcha
            nom="6 oy qimirlamagan"
            summa={pulKorsat(muzlagan.qimirlamagan.qiymat)}
            soni={`${String(muzlagan.qimirlamagan.soni)} ta material`}
            ulush={muzlagan.qimirlamagan.ulushFoiz}
          />
        </div>

        {muzlagan.tayyorQatorlari.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Buyurtma</th>
                  <th className="px-4 py-2.5 font-medium">Mijoz</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kutmoqda</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                </tr>
              </thead>
              <tbody>
                {muzlagan.tayyorQatorlari.slice(0, 20).map((q) => (
                  <tr
                    key={`${String(q.buyurtmaId)}-${q.raqam}-${String(q.kutganKun)}`}
                    className="border-b border-chegara last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/buyurtma/${String(q.buyurtmaId)}`}
                        className="hover:underline"
                      >
                        {q.raqam}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{q.mijozNom}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {q.kutganKun} kun
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {pulKorsat(som(q.qiymat))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── ABC tahlil ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          ABC tahlil — qoldiq qiymati bo&apos;yicha
        </h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Qoldiq qiymatining 80% i A toifadagi {abc.soni.A} ta materialda turibdi.
          Inventarizatsiya va nazorat avval shulardan boshlanadi.
        </p>
        {abc.qatorlar.length === 0 ? (
          <Bosh matn="Hisoblash uchun ma'lumot yo'q." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Material</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qiymati</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ulushi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Jamlanma</th>
                  <th className="px-4 py-2.5 text-center font-medium">Toifa</th>
                </tr>
              </thead>
              <tbody>
                {abc.qatorlar.map((q) => (
                  <tr key={q.kalit} className="border-b border-chegara last:border-0">
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{q.orin}</td>
                    <td className="px-4 py-2.5">{q.nom}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {pulKorsat(q.qiymat)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {q.ulushFoiz.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-matn-kuchsiz">
                      {q.kumulyativFoiz.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium">{q.toifa}</td>
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

function Karta({
  sarlavha,
  qiymat,
  izoh,
  diqqat = false,
}: {
  sarlavha: string;
  qiymat: string;
  izoh: string;
  diqqat?: boolean;
}) {
  return (
    <div
      className={`rounded-karta border bg-sirt px-4 py-3.5 ${
        diqqat ? 'border-sariq' : 'border-chegara'
      }`}
    >
      <p className="text-xs text-matn-kuchsiz">{sarlavha}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-matn">{qiymat}</p>
      <p className="mt-1 text-xs text-matn-kuchsiz">{izoh}</p>
    </div>
  );
}

function Bolakcha({
  nom,
  summa,
  soni,
  ulush,
}: {
  nom: string;
  summa: string;
  soni: string;
  ulush: number;
}) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt px-4 py-3.5">
      <p className="text-xs text-matn-kuchsiz">{nom}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-matn">{summa}</p>
      <p className="mt-1 text-xs text-matn-kuchsiz">
        {soni} · {ulush}%
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fon">
        <div className="h-full bg-brend" style={{ width: `${String(ulush)}%` }} />
      </div>
    </div>
  );
}

function Bosh({ matn }: { matn: string }) {
  return (
    <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
      {matn}
    </p>
  );
}
