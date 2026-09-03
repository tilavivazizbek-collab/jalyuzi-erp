import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import { mijozAbc, mijozBazasi } from '../malumot';

export const dynamic = 'force-dynamic';

/**
 * TZ 11.6 — mijozlar hisobotlari.
 *
 * Ikki hisobot: baza holati (11.6.1) va ABC tahlili (11.6.2).
 *
 * ⚠️ Ruxsat 11.10 — `hisobot.mijoz.kor`. Bu sahifada TANNARX yo'q,
 *    faqat tushum: shuning uchun uni sotuvchiga ham berish mumkin.
 */

const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'HAFTA', nom: 'Hafta' },
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
  { kod: 'YIL', nom: 'Yil' },
];

export default async function MijozHisoboti({
  searchParams,
}: {
  searchParams: Promise<{ davr?: string }>;
}) {
  const f = await sahifaRuxsati('hisobot.mijoz.kor');

  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri = davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'OY';
  const davr = davrYasa(davrTuri, new Date());

  const [baza, abc] = await Promise.all([
    mijozBazasi(f.filialId, davr),
    mijozAbc(f.filialId, davr),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Mijozlar
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">{davrMatn(davr)}</p>
      </div>

      {/* Davr tanlash — manzilda saqlanadi, havolani yuborish mumkin */}
      <div className="flex flex-wrap gap-2">
        {DAVRLAR.map((d) => (
          <Link
            key={d.kod}
            href={`/hisobot/mijoz?davr=${d.kod}`}
            className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
              d.kod === davrTuri
                ? 'border-brend bg-brend text-white'
                : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
            }`}
          >
            {d.nom}
          </Link>
        ))}
      </div>

      {/* ── 11.6.1 · Baza holati ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-matn-ikki">Baza holati</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Karta sarlavha="Jami mijoz" qiymat={String(baza.jami)} izoh="faol kartochkalar" />
          <Karta
            sarlavha="Yangi"
            qiymat={String(baza.yangi)}
            izoh="shu davrda birinchi xaridi"
          />
          <Karta
            sarlavha="Takroriy"
            qiymat={String(baza.takroriy)}
            izoh="ilgari ham olgan, davrda ham"
          />
          {/*
            ⚠️ «Uxlab qolgan» va «hech qachon olmagan» AJRATILGAN:
               birinchisi yo'qotilgan mijoz, ikkinchisi hali
               ishlanmagan. Ularni qo'shib qo'ysak «yarmi ketdi»
               degan soxta xavotir chiqardi.
          */}
          <Karta
            sarlavha="Uxlab qolgan"
            qiymat={String(baza.uxlagan)}
            izoh="90 kundan beri xaridi yo'q"
            diqqat={baza.uxlagan > 0}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Karta
            sarlavha="Hali xarid qilmagan"
            qiymat={String(baza.hechQachonXaridQilmagan)}
            izoh="kartochkasi bor, buyurtmasi yo'q"
          />
          <Karta
            sarlavha="Buyurtma (davrda)"
            qiymat={String(baza.buyurtmaSoni)}
            izoh="bekor qilinganlarsiz"
          />
          <Karta
            sarlavha="O'rtacha chek"
            qiymat={pulKorsat(som(baza.ortachaChek))}
            izoh="davrdagi barcha buyurtma bo'yicha"
          />
        </div>

        <p className="mt-2 text-xs text-matn-kuchsiz">
          ⚠️ Buyurtma va o&apos;rtacha chek — davrdagi <b>barcha</b> buyurtma
          bo&apos;yicha. Mijoz keyinchalik o&apos;chirilgan bo&apos;lsa ham savdo
          bo&apos;lgan, shuning uchun u summadan chiqarilmaydi.
        </p>
      </section>

      {/* ── 11.6.2 · ABC ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          ABC — tushumning 80% qaysi mijozlardan
        </h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          A — birinchi 80%, B — 95% gacha, C — qolgani. Chegarani kesib
          o&apos;tgan mijoz yuqori toifada qoladi.
        </p>

        {abc.natija.qatorlar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Bu davrda buyurtma bo&apos;lmagan.
          </p>
        ) : (
          <>
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              {(['A', 'B', 'C'] as const).map((t) => (
                <div
                  key={t}
                  className="rounded-karta border border-chegara bg-sirt px-4 py-3"
                >
                  <p className="text-xs text-matn-kuchsiz">{t} toifa</p>
                  <p className="mt-1 text-base font-semibold text-matn">
                    {abc.natija.soni[t]} mijoz
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-sm">
                <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Mijoz</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tushum</th>
                    <th className="px-4 py-2.5 text-right font-medium">Buyurtma</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ulush</th>
                    <th className="px-4 py-2.5 text-right font-medium">Yig&apos;indi</th>
                    <th className="px-4 py-2.5 text-center font-medium">Toifa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {abc.natija.qatorlar.map((q) => (
                    <tr key={q.kalit}>
                      <td className="raqam px-4 py-2.5 text-matn-kuchsiz">{q.orin}</td>
                      <td className="px-4 py-2.5 font-medium">
                        <Link
                          href={`/mijoz/${String(q.kalit)}`}
                          className="text-brend hover:underline"
                        >
                          {q.nom}
                        </Link>
                      </td>
                      <td className="raqam px-4 py-2.5 text-right font-medium">
                        {pulKorsat(q.qiymat)}
                      </td>
                      <td className="raqam px-4 py-2.5 text-right text-matn-kuchsiz">
                        {abc.buyurtmaSoni.get(q.kalit) ?? 0}
                      </td>
                      <td className="raqam px-4 py-2.5 text-right">
                        {q.ulushFoiz.toFixed(1)}%
                      </td>
                      <td className="raqam px-4 py-2.5 text-right text-matn-kuchsiz">
                        {q.kumulyativFoiz.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-center font-medium">{q.toifa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
        diqqat ? 'border-belgi-sariq' : 'border-chegara'
      }`}
    >
      <p className="text-xs text-matn-kuchsiz">{sarlavha}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-matn">{qiymat}</p>
      <p className="mt-1 text-xs text-matn-kuchsiz">{izoh}</p>
    </div>
  );
}
