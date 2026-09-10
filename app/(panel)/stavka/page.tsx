import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import {
  stavkalarRoyxati,
  stavkasizTurlar,
  type StavkaKorinishi,
} from '@/lib/amal/stavka-belgila';
import { StavkaFormasi, type Tanlov } from './forma';
import { StavkaOchirTugmasi } from './ochir-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/stavka` — TZ 10.8 · 10.9 · 10.12
 *
 * ⚠️ NEGA ALOHIDA EKRAN
 *
 *    `stavka` jadvalini to'ldiradigan joy TIZIMDA UMUMAN YO'Q edi.
 *    Bazada nol qator turardi, ya'ni har «Tugatdim» da ustaning
 *    haqi NOL hisoblanardi. TZ 10.12 bunda ishni to'xtatmaydi —
 *    shuning uchun xato ham chiqmasdi: tizim jimgina nol yozib
 *    turardi va buni faqat usta oyoq oxirida bilib qolardi.
 *
 * ⚠️ Sozlamalar KALIT-QIYMAT jadvali (`sozlama`), bu yerda esa
 *    filial va xodim bo'yicha istisnolari bor JADVAL kerak.
 *    Shuning uchun alohida ekran, lekin menyuda «Sozlash»
 *    bo'limida turadi — egasi uni o'sha yerdan qidiradi.
 */

const USUL_NOMI: Record<string, string> = {
  DONA: "Qat'iy summa",
  KV_M: 'Kvadrat metrga',
  BOSQICH: "O'lchamga qarab",
};

const pul = (x: string): string =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(Number(x)));

/** Bitta guruhning haqi qanday o'qilishi — jumla bilan */
function haqMatni(s: StavkaKorinishi): string {
  const birinchi = s.qatorlar[0];
  if (birinchi === undefined) return '—';

  if (s.birlik === 'KV_M') return `${pul(birinchi.qiymat)} so'm / kv.m`;
  if (s.birlik === 'DONA') return `${pul(birinchi.qiymat)} so'm`;

  return s.qatorlar
    .map((q) =>
      q.chegaraKvM === null
        ? `undan katta → ${pul(q.qiymat)}`
        : `${Number(q.chegaraKvM).toString()} kv.m gacha → ${pul(q.qiymat)}`,
    )
    .join(' · ');
}

export default async function StavkaSahifasi() {
  const f = await sahifaRuxsati('sozlama.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'sozlama.ozgartir');

  const sql = ulanishOl();

  const [royxat, stavkasiz, turlar, filiallar, ustalar] = await Promise.all([
    stavkalarRoyxati(sql),
    stavkasizTurlar(sql),
    sql<Tanlov[]>`
      SELECT id, nom FROM mahsulot_tur WHERE faol = true ORDER BY nom`,
    sql<Tanlov[]>`
      SELECT id, nom FROM filial WHERE faol = true ORDER BY nom`,
    /*
     * ⚠️ Faqat USTA rolidagilar emas: TZ 10.9 «xodim kartochkasida
     *    alohida stavka» deydi, kim ish oladi degan qaror esa
     *    rollarda. Ro'yxat ish oladigan xodimlar bilan cheklanadi,
     *    aks holda sotuvchilar ham chiqib ketardi.
     */
    sql<Tanlov[]>`
      SELECT DISTINCT x.id, x.ism AS nom
      FROM xodim x
      JOIN xodim_rol xr ON xr.xodim_id = x.id
      JOIN rol r        ON r.id = xr.rol_id
      WHERE x.faol = true AND r.kod = 'USTA'
      ORDER BY x.ism`,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Usta stavkalari
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Usta «Tugatdim» bosganda haq shu jadval bo&apos;yicha hisoblanadi va
          uning balansiga yoziladi.
        </p>
      </div>

      {/*
        ⚠️ TZ 10.12 · 4.9 — stavkasiz tur ISH HAQINI NOLGA aylantiradi.
           Bu ogohlantirish eng tepada turadi, chunki uni ko'rmaslik
           to'g'ridan-to'g'ri pulga tegadi.
      */}
      {stavkasiz.length > 0 && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Stavkasi belgilanmagan tur:{' '}
          <b>{stavkasiz.map((t) => t.nom).join(', ')}</b>. Bu turdagi ish
          bajarilsa ustaga <b>nol</b> haq yoziladi.
        </p>
      )}

      {royxat.length === 0 && stavkasiz.length === 0 && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Hali mahsulot turi kiritilmagan.{' '}
          <Link href="/mahsulot" className="underline">
            Tur yig&apos;ish
          </Link>{' '}
          bo&apos;limidan qo&apos;shing — stavka o&apos;shanga bog&apos;lanadi.
        </p>
      )}

      {ozgartiraOladi && turlar.length > 0 && (
        <div className="rounded-karta border border-chegara bg-sirt p-6">
          <h2 className="mb-4 text-sm font-medium text-matn-ikki">
            Stavka belgilash
          </h2>
          <StavkaFormasi turlar={turlar} filiallar={filiallar} ustalar={ustalar} />
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">
          Amaldagi stavkalar
        </h2>

        {royxat.length === 0 ? (
          <p className="rounded-karta border border-chegara bg-sirt px-4 py-6 text-sm text-matn-kuchsiz">
            Hali bitta ham stavka belgilanmagan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Mahsulot turi</th>
                  <th className="px-4 py-2.5 font-medium">Kimga</th>
                  <th className="px-4 py-2.5 font-medium">Usul</th>
                  <th className="px-4 py-2.5 font-medium">Haq</th>
                  <th className="px-4 py-2.5 font-medium">Qaysi kundan</th>
                  {ozgartiraOladi && <th className="w-10 px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {royxat.map((s) => (
                  <tr
                    key={`${String(s.mahsulotTurId)}|${String(s.filialId ?? '-')}|${String(
                      s.xodimId ?? '-',
                    )}|${s.amalQiladiDan}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-matn">
                      {s.mahsulotTur}
                    </td>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {s.xodim ?? s.filial ?? 'Hammaga'}
                      {s.xodim !== null && s.filial !== null && (
                        <span className="text-matn-kuchsiz"> · {s.filial}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">
                      {USUL_NOMI[s.birlik] ?? s.birlik}
                    </td>
                    <td className="raqam px-4 py-2.5 text-matn">{haqMatni(s)}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">
                      {s.amalQiladiDan}
                    </td>
                    {ozgartiraOladi && (
                      <td className="px-4 py-2.5">
                        <StavkaOchirTugmasi
                          mahsulotTurId={s.mahsulotTurId}
                          filialId={s.filialId}
                          xodimId={s.xodimId}
                          amalQiladiDan={s.amalQiladiDan}
                          nom={s.mahsulotTur}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/*
          ⚠️ 2.3-invariant TUSHUNTIRILADI. «O'chirdim, ustaning
             o'tgan oygi haqi ham o'chdimi?» degan savol muqarrar.
        */}
        <p className="mt-2 text-xs text-matn-kuchsiz">
          Stavkani o&apos;zgartirish yoki o&apos;chirish faqat kelgusi ishlarga
          tegadi. Allaqachon bajarilgan ishning haqi o&apos;sha paytdagi
          stavkada qoladi.
        </p>
      </section>
    </div>
  );
}
