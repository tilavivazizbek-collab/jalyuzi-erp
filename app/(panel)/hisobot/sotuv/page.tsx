import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import {
  davrMatn,
  davrTurimi,
  davrYasa,
  oldingiDavr,
  type DavrTuri,
} from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import {
  chegirmalar,
  qaytarishVaRad,
  sotuvDinamikasi,
  sotuvchiErkinliklari,
  sotuvchiKesimi,
  turBoyichaFoyda,
} from '../malumot';

export const dynamic = 'force-dynamic';

/**
 * TZ 11.5 — sotuv hisobotlari.
 *
 * Oltita bo'lim: dinamika (11.5.1), mahsulot turi bo'yicha foyda
 * (11.5.2), sotuvchi kesimi (11.5.3), chegirmalar (11.5.4),
 * qaytarish va rad etish (11.5.5), sotuvchi erkinliklari (11.5.6).
 *
 * ⚠️ TANNARX FAQAT RUXSAT BILAN. 11.5.2 da tannarx va rentabellik
 *    bor — sotuvchi buni ko'rmasligi kerak (11.10). Shuning uchun
 *    o'sha bo'lim `hisobot.moliya.kor` bilan yopilgan, sahifaning
 *    o'zi esa `hisobot.sotuv.kor` bilan.
 */

const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'HAFTA', nom: 'Hafta' },
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
  { kod: 'YIL', nom: 'Yil' },
];

const pul = (s: string): string => pulKorsat(som(s));

/** «+18.4%» yoki «−7.2%». Oldingi davr nol bo'lsa taqqoslash YO'Q. */
function ozgarish(joriy: string, oldingi: string): string | null {
  const o = Number(oldingi);
  if (o === 0) return null;
  const foiz = ((Number(joriy) - o) / o) * 100;
  return `${foiz >= 0 ? '+' : '−'}${Math.abs(foiz).toFixed(1)}%`;
}

export default async function SotuvHisoboti({
  searchParams,
}: {
  searchParams: Promise<{ davr?: string }>;
}) {
  const f = await sahifaRuxsati('hisobot.sotuv.kor');

  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri = davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'OY';
  const davr = davrYasa(davrTuri, new Date());
  const oldin = oldingiDavr(davr);

  /**
   * §9.4 · 11.10 — TANNARX alohida huquq bilan yopiladi.
   *
   * ⚠️ Yangi ruxsat kodi QO'SHILMADI: `hisobot.moliya.kor` aynan
   *    foyda-zarar huquqi va u sotuvchida yo'q. Yangi kod qo'shilsa
   *    egasi uni har rolga qo'lda berishi kerak bo'lardi — teshik
   *    ochilib qolishi mumkin edi.
   */
  const tannarxniKoradi = ruxsatBormi(f, 'hisobot.moliya.kor');

  const [dinamika, sotuvchilar, chegirma, qaytarish, erkinlik, turlar] = await Promise.all([
    sotuvDinamikasi(f.filialId, davr, oldin),
    sotuvchiKesimi(f.filialId, davr),
    chegirmalar(f.filialId, davr),
    qaytarishVaRad(f.filialId, davr),
    sotuvchiErkinliklari(f.filialId, davr),
    tannarxniKoradi ? turBoyichaFoyda(f.filialId, davr) : Promise.resolve([]),
  ]);

  const tushumOzgarishi = ozgarish(dinamika.joriy.tushum, dinamika.oldingi.tushum);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Sotuv</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">{davrMatn(davr)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAVRLAR.map((d) => (
          <Link
            key={d.kod}
            href={`/hisobot/sotuv?davr=${d.kod}`}
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

      {/* ── 11.5.1 · Dinamika ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-matn-ikki">
          Dinamika — oldingi davr bilan
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Karta
            sarlavha="Tushum"
            qiymat={pul(dinamika.joriy.tushum)}
            izoh={
              tushumOzgarishi === null
                ? 'oldingi davrda sotuv yo‘q'
                : `oldingi davr: ${pul(dinamika.oldingi.tushum)} · ${tushumOzgarishi}`
            }
          />
          <Karta
            sarlavha="Buyurtma"
            qiymat={String(dinamika.joriy.buyurtmaSoni)}
            izoh={`oldingi davr: ${String(dinamika.oldingi.buyurtmaSoni)}`}
          />
          <Karta
            sarlavha="Pozitsiya"
            qiymat={String(dinamika.joriy.pozitsiyaSoni)}
            izoh={`oldingi davr: ${String(dinamika.oldingi.pozitsiyaSoni)}`}
          />
          <Karta
            sarlavha="O'rtacha chek"
            qiymat={pul(dinamika.joriy.ortachaChek)}
            izoh={`oldingi davr: ${pul(dinamika.oldingi.ortachaChek)}`}
          />
        </div>

        {/*
          ⚠️ Chart YO'Q — grafik kutubxonasi hali tanlanmagan
             (HISOBOTLAR-ISH §5.2 da line chart belgilangan).
             Shu paytgacha kunlik qatorlar jadval bo'lib turadi:
             ma'lumot bor, faqat ko'rinishi oddiy.
        */}
        {dinamika.kunlar.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tushum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {dinamika.kunlar.map((k) => (
                  <tr key={k.sana}>
                    <td className="px-4 py-2.5">{k.sana}</td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(k.tushum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 11.5.2 · Mahsulot turi bo'yicha foyda ── */}
      {tannarxniKoradi && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">
            Mahsulot turi bo&apos;yicha foyda
          </h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Tannarxda material ham, usta ish haqi ham bor. Eng ko&apos;p sotilgan
            tur eng foydalisi bo&apos;lmasligi mumkin — shuni ko&apos;rsatish uchun
            yozilgan.
          </p>

          {turlar.length === 0 ? (
            <Bosh />
          ) : (
            <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-sm">
                <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Mahsulot turi</th>
                    <th className="px-4 py-2.5 text-right font-medium">Soni</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tushum</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                    <th className="px-4 py-2.5 text-right font-medium">Foyda</th>
                    <th className="px-4 py-2.5 text-right font-medium">Birlik foyda</th>
                    <th className="px-4 py-2.5 text-right font-medium">Rentabellik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {turlar.map((t) => (
                    <tr key={t.turId}>
                      <td className="px-4 py-2.5 font-medium">{t.nom}</td>
                      <td className="raqam px-4 py-2.5 text-right">{t.soni}</td>
                      <td className="raqam px-4 py-2.5 text-right">{pul(t.tushum)}</td>
                      <td className="raqam px-4 py-2.5 text-right text-matn-kuchsiz">
                        {pul(t.tannarx)}
                      </td>
                      <td
                        className={`raqam px-4 py-2.5 text-right font-medium ${
                          Number(t.foyda) < 0 ? 'text-belgi-qizil' : ''
                        }`}
                      >
                        {pul(t.foyda)}
                      </td>
                      <td className="raqam px-4 py-2.5 text-right">{pul(t.birlikFoyda)}</td>
                      <td className="raqam px-4 py-2.5 text-right">
                        {/*
                          ⚠️ Tannarxsiz pozitsiya bo'lsa foiz
                             KO'RSATILMAYDI: 100% «foyda» soxta
                             raqam, u ishonchni buzadi.
                        */}
                        {t.tannarxsizSoni > 0 ? (
                          <span className="text-belgi-sariq">tannarxsiz</span>
                        ) : t.rentabellik === null ? (
                          '—'
                        ) : (
                          `${t.rentabellik.toFixed(1)}%`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {turlar.some((t) => t.tannarxsizSoni > 0) && (
            <p className="mt-2 rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
              «Tannarxsiz» — o&apos;sha turdagi ayrim pozitsiyalar hali
              kesilmagan yoki ustaga berilmagan, shuning uchun ularning
              tannarxi yo&apos;q. Foyda ustuni bunday qatorlarda haqiqiydan
              KATTA chiqadi; buyurtma tayyor bo&apos;lgach raqam o&apos;zi
              to&apos;g&apos;rilanadi.
            </p>
          )}

          <p className="mt-2 text-xs text-matn-kuchsiz">
            ⚠️ Qo&apos;shimcha buyumlar (alohida sotilgan mexanizm, karniz) bu
            jadvalga kirmaydi — ular tayyorlanmaydi. Shuning uchun bu yerdagi
            tushum yuqoridagi umumiy tushumdan kichik.
          </p>
        </section>
      )}

      {/* ── 11.5.3 · Sotuvchi kesimi ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-matn-ikki">Sotuvchi bo&apos;yicha</h2>

        {sotuvchilar.length === 0 ? (
          <Bosh />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sotuvchi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Buyurtma</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tushum</th>
                  <th className="px-4 py-2.5 text-right font-medium">O&apos;rtacha chek</th>
                  <th className="px-4 py-2.5 text-right font-medium">Undirilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {sotuvchilar.map((s) => (
                  <tr key={s.xodimId}>
                    <td className="px-4 py-2.5 font-medium">{s.ism}</td>
                    <td className="raqam px-4 py-2.5 text-right">{s.buyurtmaSoni}</td>
                    <td className="raqam px-4 py-2.5 text-right font-medium">
                      {pul(s.tushum)}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(s.ortachaChek)}</td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(s.undirilgan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-xs text-matn-kuchsiz">
          «Undirilgan» — shu xodim qabul qilgan to&apos;lovlar. U boshqa
          sotuvchining mijozidan olgan pul ham shu ustunga tushadi.
        </p>
      </section>

      {/* ── 11.5.4 · Chegirmalar ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-matn-ikki">Chegirmalar</h2>

        {chegirma.length === 0 ? (
          <Bosh matn="Bu davrda chegirma berilmagan." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Buyurtma</th>
                  <th className="px-4 py-2.5 font-medium">Sotuvchi</th>
                  <th className="px-4 py-2.5 font-medium">Mijoz</th>
                  <th className="px-4 py-2.5 text-right font-medium">Narx</th>
                  <th className="px-4 py-2.5 text-right font-medium">Chegirma</th>
                  <th className="px-4 py-2.5 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {chegirma.map((c) => (
                  <tr
                    key={c.pozitsiyaId}
                    /* ⚠️ Limitdan oshganlar AJRATILGAN (11.5.4) */
                    className={c.limitdanOshgan ? 'bg-belgi-sariq-fon' : ''}
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/buyurtma/${String(c.buyurtmaId)}`}
                        className="text-brend hover:underline"
                      >
                        {c.buyurtmaRaqam}
                      </Link>
                      {c.limitdanOshgan && (
                        <span className="ml-2 text-xs text-belgi-sariq">limitdan oshgan</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{c.sotuvchi}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{c.mijoz ?? '—'}</td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(c.narx)}</td>
                    <td className="raqam px-4 py-2.5 text-right font-medium">
                      {pul(c.chegirma)}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right">{c.foiz.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 11.5.5 · Qaytarish va rad etish ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Qaytarish va rad etish</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          <b>Qaytarish</b> — mijoz olib ketgan, keyin qaytargan (8.10).{' '}
          <b>Rad etish</b> — mahsulot tayyor bo&apos;lgan, mijoz umuman olmagan
          (8.8); pul harakati yo&apos;q, mahsulot omborda qoladi.
        </p>

        {qaytarish.length === 0 ? (
          <Bosh matn="Bu davrda qaytarish ham, rad etish ham bo'lmagan." />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Amal</th>
                  <th className="px-4 py-2.5 font-medium">Buyurtma</th>
                  <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                  <th className="px-4 py-2.5 text-right font-medium">Narx</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ushlab qolindi</th>
                  <th className="px-4 py-2.5 font-medium">Sabab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {qaytarish.map((q) => (
                  <tr key={`${q.amal}-${String(q.pozitsiyaId)}`}>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {q.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">
                      {q.amal === 'RAD_ETISH' ? 'Rad etish' : 'Qaytarish'}
                    </td>
                    <td className="px-4 py-2.5">{q.buyurtmaRaqam}</td>
                    <td className="px-4 py-2.5">{q.mahsulot}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{q.xodim}</td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(q.narx)}</td>
                    <td className="raqam px-4 py-2.5 text-right">
                      {q.amal === 'RAD_ETISH' ? '—' : pul(q.ushlabQolindi)}
                    </td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{q.sabab || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-xs text-matn-kuchsiz">
          ⚠️ Sabab — erkin matn: bazada kodlangan sabablar ro&apos;yxati yo&apos;q.
          Shuning uchun «sabab bo&apos;yicha guruh» qilib bo&apos;lmaydi. Kerak
          bo&apos;lsa, sabablar ro&apos;yxatini qo&apos;shish mumkin.
        </p>
      </section>

      {/* ── 11.5.6 · Sotuvchi erkinliklari ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          Sotuvchi erkinliklari
        </h2>
        {/*
          ⚠️ Bu jadval ATAYLAB jadval bo'lib qoladi va reyting
             ko'rinishiga aylantirilmaydi (11.5.6): «ayblov emas,
             farq ko'rinib tursin».
        */}
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Uchta chegarasiz erkinlik: narxni o&apos;zgartirish, chegirma limitidan
          oshish, qaytarishda ushlab qolish. Bu ro&apos;yxat ayblov emas — farq
          ko&apos;rinib tursin degani.
        </p>

        {erkinlik.length === 0 ? (
          <Bosh />
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sotuvchi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Chegirma</th>
                  <th className="px-4 py-2.5 text-right font-medium">Limitdan oshgan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Narx o&apos;zgartirdi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ushlab qoldi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {erkinlik.map((e) => (
                  <tr key={e.xodimId}>
                    <td className="px-4 py-2.5 font-medium">{e.ism}</td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(e.chegirma)}</td>
                    <td className="raqam px-4 py-2.5 text-right">
                      {e.limitdanOshdi === 0 ? '0' : `${String(e.limitdanOshdi)} marta`}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right">
                      {e.narxOzgartirdi === 0
                        ? '0'
                        : `${String(e.narxOzgartirdi)} pozitsiya`}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right">{pul(e.ushlabQoldi)}</td>
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

function Bosh({ matn = 'Bu davrda ma‘lumot yo‘q.' }: { matn?: string }) {
  return (
    <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
      {matn}
    </p>
  );
}

function Karta({
  sarlavha,
  qiymat,
  izoh,
}: {
  sarlavha: string;
  qiymat: string;
  izoh: string;
}) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt px-4 py-3.5">
      <p className="text-xs text-matn-kuchsiz">{sarlavha}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-matn">{qiymat}</p>
      <p className="mt-1 text-xs text-matn-kuchsiz">{izoh}</p>
    </div>
  );
}
