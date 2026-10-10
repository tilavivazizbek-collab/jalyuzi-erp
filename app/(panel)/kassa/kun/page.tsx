import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { ulanishOl } from '@/lib/db';
import { kunHolati } from '@/lib/amal/kun-yopish';
import { kassaQoldiqlari } from '../malumot';
import { KunYopishFormasi } from '../kun-forma';
import Decimal from 'decimal.js';
import { toshkentKuni } from '@/lib/domain/sana';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { kunOldin } from '../kitob-filtr';
import { yopilishTarixi, yopilmaganKunlar } from '../kun-malumot';

/** Nazorat oynasi — oxirgi 30 kun */
const NAZORAT_KUNI = 30;

const pul = (x: string, valyuta: string): string =>
  `${pulKorsat(valyuta === 'USD' ? dollar(x) : som(x))} ${valyuta === 'USD' ? '$' : "so'm"}`;

export const dynamic = 'force-dynamic';

export default async function KunYopishSahifasi({
  searchParams,
}: {
  searchParams: Promise<{ sana?: string }>;
}) {
  const f = await sahifaRuxsati('kassa.oz.kor');
  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');
  /**
   * TZ 12.17 — «Kerak bo'lsa ADMIN kunni qayta ochadi».
   *
   * ⚠️ Ruxsat `kassa.storno` — amalning o'zi ham shuni talab qiladi
   *    (`kunniQaytaOchAmali`). Ikki xil ruxsat bo'lsa, tugma
   *    ko'rinib, bosilganda «ruxsat yo'q» chiqardi.
   */
  const qaytaOchaOladi = ruxsatBormi(f, 'kassa.storno');

  const { sana } = await searchParams;
  const bugun = toshkentKuni();
  const tanlangan = /^\d{4}-\d{2}-\d{2}$/.test(sana ?? '') ? (sana as string) : bugun;

  const kassalar = await kassaQoldiqlari(f.filialId, f.xodimId, barchaniKoradi);

  // TZ 12.17 — «Admin kassasida FAQAT NAQD qismi yopiladi. Kartadagi
  // pulni sanab bo'lmaydi — u bank hisobidan tekshiriladi.»
  const yopiladiganlar = kassalar.filter((k) => k.turi === 'NAQD');

  const idlar = yopiladiganlar.map((k) => k.id);
  const nazoratBoshi = kunOldin(bugun, NAZORAT_KUNI - 1);
  const [kunlar, tarix, yopilmagan] = await Promise.all([
    Promise.all(yopiladiganlar.map((k) => kunHolati(ulanishOl(), k.id, tanlangan))),
    yopilishTarixi(idlar, nazoratBoshi, bugun),
    yopilmaganKunlar(idlar, nazoratBoshi, bugun),
  ]);

  /** Davr bo'yicha farq — kamomad va ortiqcha ALOHIDA, valyuta alohida (1.3) */
  const farqJami = new Map<string, { kam: Decimal; ortiq: Decimal }>();
  for (const t of tarix) {
    if (!t.yopiqmi || t.farq === null) continue;
    const j = farqJami.get(t.valyuta) ?? { kam: new Decimal(0), ortiq: new Decimal(0) };
    const f = new Decimal(t.farq);
    if (f.isNegative()) j.kam = j.kam.plus(f.negated());
    else j.ortiq = j.ortiq.plus(f);
    farqJami.set(t.valyuta, j);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kassa
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Kun yopish
          </h1>
          {/* TZ 15.4 — kassir qog'ozda imzo qo'yadi */}
          <Link
            href="/kassa/kun/varaqa"
            className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
          >
            Kunlik varaqa
          </Link>
        </div>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {tanlangan} · faqat naqd kassa yopiladi — kartadagi pul bank hisobidan tekshiriladi
          (12.17)
        </p>
      </div>

      <form className="flex items-end gap-3">
        <label className="flex flex-col gap-1" htmlFor="sana">
          <span className="text-sm font-medium text-matn-ikki">Sana</span>
          <input
            id="sana"
            name="sana"
            type="date"
            defaultValue={tanlangan}
            className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25"
          />
        </label>
        <button
          type="submit"
          className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
        >
          Ko&apos;rsatish
        </button>
      </form>

      {/* Nazorat: harakat bo'lgan, lekin yopilmagan kunlar (bugundan oldingi) */}
      {yopilmagan.length > 0 && (
        <section className="rounded-karta border border-belgi-sariq/30 bg-belgi-sariq-fon px-4 py-3 text-sm">
          <p className="font-medium text-belgi-sariq">
            Yopilmagan kunlar — oxirgi {NAZORAT_KUNI} kunda {yopilmagan.length} ta
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {yopilmagan.map((y) => (
              <li key={`${String(y.kassaId)}-${y.sana}`}>
                <Link href={`/kassa/kun?sana=${y.sana}`} className="text-belgi-sariq underline">
                  {y.sana}
                </Link>{' '}
                <span className="text-matn-ikki">
                  {y.kassaNomi} · {y.yozuvSoni} yozuv
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kunlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Yopiladigan naqd kassa yo&apos;q.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {kunlar.map((k) => (
            <section key={k.kassaId}>
              <h2 className="mb-3 text-sm font-medium text-matn-ikki">
                {k.kassaNomi}
                <span className="ml-2 text-xs text-matn-kuchsiz">{k.valyuta}</span>
              </h2>
              <KunYopishFormasi
                kun={{
                  kassaId: k.kassaId,
                  kassaNomi: k.kassaNomi,
                  sana: k.sana,
                  boshlangich: k.boshlangich,
                  kirim: k.kirim,
                  chiqim: k.chiqim,
                  hisoblangan: k.hisoblangan,
                  yopilganmi: k.yopilganmi,
                  kunId: k.kunId,
                }}
                qaytaOchaOladi={qaytaOchaOladi}
              />
            </section>
          ))}
        </div>
      )}

      {/* Yopilish tarixi — kim, qachon, qancha farq bilan */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-medium text-matn-ikki">Yopilish tarixi — oxirgi {NAZORAT_KUNI} kun</h2>
          {[...farqJami].map(([v, j]) => (
            <p key={v} className="text-[13px]">
              Kamomad: <b className="raqam text-belgi-qizil">{pul(j.kam.toFixed(2), v)}</b>
              <span className="mx-2 text-matn-kuchsiz">·</span>
              Ortiqcha: <b className="raqam text-belgi-yashil">{pul(j.ortiq.toFixed(2), v)}</b>
            </p>
          ))}
        </div>
        {tarix.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
            Bu davrda kun yopilmagan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Kassa</th>
                  <th className="px-4 py-2.5 text-right font-medium">Hisoblangan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sanaldi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Farq</th>
                  <th className="px-4 py-2.5 font-medium">Kim · izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {tarix.map((t) => {
                  const f = t.farq === null ? null : new Decimal(t.farq);
                  return (
                    <tr key={t.id}>
                      <td className="raqam whitespace-nowrap px-4 py-2.5">
                        <Link href={`/kassa/kun?sana=${t.sana}`} className="hover:underline">
                          {t.sana}
                        </Link>
                        {!t.yopiqmi && <span className="ml-2 text-xs text-belgi-sariq">qayta ochilgan</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{t.kassaNomi}</td>
                      <td className="raqam px-4 py-2.5 text-right">{pul(t.hisoblangan, t.valyuta)}</td>
                      <td className="raqam px-4 py-2.5 text-right">
                        {t.sanaldi === null ? '—' : pul(t.sanaldi, t.valyuta)}
                      </td>
                      <td
                        className={`raqam px-4 py-2.5 text-right font-medium ${
                          f === null || f.isZero()
                            ? 'text-matn-kuchsiz'
                            : f.isNegative()
                              ? 'text-belgi-qizil'
                              : 'text-belgi-yashil'
                        }`}
                      >
                        {f === null ? '—' : f.isZero() ? '0' : pul(f.toFixed(2), t.valyuta)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-matn-ikki">
                        {t.kim ?? '—'}
                        {t.izoh !== null && t.izoh !== '' && (
                          <span className="block text-matn-kuchsiz">{t.izoh}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-matn-kuchsiz">
        Kun yopish majburiy emas — yopilmagan kun bo&apos;lsa ham ertasi kuni ishlash mumkin
        (12.17).
      </p>
    </div>
  );
}
