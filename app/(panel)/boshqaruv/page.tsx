import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatTekshir } from '@/lib/ruxsat/tekshir';
import { GURUHLAR, RUXSATLAR, RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';
import { kimIshlamoqda } from './malumot';

export const dynamic = 'force-dynamic';

/**
 * Boshqaruv sahifasi: kim kirgani va unga NIMA ochiqligi.
 *
 * ⚠️ 8-bosqichda bu o'rinni haqiqiy dashboard egallaydi (TZ 11).
 *    Hozircha bu — **ruxsat kartochkasi**: xodim nimaga haqli
 *    ekanini bir qarashda ko'radi.
 *
 * ⚠️ Ruxsat ro'yxati 57 qatordan iborat. Ilgari hammasi bir xil
 *    ko'rinishda edi va ko'z hech narsaga ilashmasdi. Endi HAR
 *    GURUHDA sanoq bor va yopiq ruxsat kuchsizlashtirilgan: odam
 *    avval «nimam bor» ni ko'radi, keyin tafsilotga tushadi.
 */
export default async function BoshqaruvSahifasi() {
  const f = await kirganBolishiShart();
  const kim = await kimIshlamoqda(f.xodimId, f.filialId);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Kim, qayerda, qaysi rolda ────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-matn">
            {kim.ism}
          </h1>
          <p className="mt-1 text-[13px] text-matn-ikki">
            {kim.filialNomi}
            {f.boshFilialda && (
              <span className="ml-2 rounded-full bg-brend-fon px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] text-brend">
                bosh filial
              </span>
            )}
          </p>
        </div>

        {/*
          ⚠️ Rol NOMI ko'rsatiladi, soni emas. «3 rol» degan gap
             xodimga nima qila olishini aytmaydi.
        */}
        <div className="flex flex-wrap gap-2">
          {f.rollar.map((r) => (
            <span
              key={r.nom}
              className="rounded-full border border-chegara bg-sirt px-2.5 py-1 text-[12px] font-medium text-matn-ikki"
            >
              {r.nom}
            </span>
          ))}
        </div>
      </section>

      {/* ── Ruxsatlar ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-matn">
            Sizga ochiq amallar
          </h2>
          <p className="mt-1 text-[13px] text-matn-ikki">
            Ruxsatlar barcha rollaringiz yig&apos;indisi (10.3). «Barcha
            filial» — boshqa filial ma&apos;lumotini ham ko&apos;rasiz
            (20.12).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {GURUHLAR.map((guruh) => {
            const kodlar = RUXSAT_KODLARI.filter(
              (k) => RUXSATLAR[k].guruh === guruh,
            );
            const natijalar = kodlar.map((k) => ({
              kod: k,
              natija: ruxsatTekshir(f, k),
            }));
            const ochiq = natijalar.filter((x) => x.natija.ruxsat).length;

            return (
              <div
                key={guruh}
                className="flex flex-col rounded-[10px] border border-chegara bg-sirt shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-chegara px-4 py-3">
                  <h3 className="text-[13px] font-semibold text-matn">{guruh}</h3>
                  {/*
                    ⚠️ Sanoq — «bu bo'limda menga nima ochiq» degan
                       savolga bir qarashda javob. Hech biri ochiq
                       bo'lmasa kuchsiz rangda: bu XATO emas, shunchaki
                       bu odamning ishi emas.
                  */}
                  <span
                    className={`raqam shrink-0 text-[12px] font-medium ${
                      ochiq === 0 ? 'text-matn-kuchsiz' : 'text-matn-ikki'
                    }`}
                  >
                    {ochiq} / {kodlar.length}
                  </span>
                </div>

                <ul className="flex flex-col gap-2 px-4 py-3">
                  {natijalar.map(({ kod, natija }) => (
                    <li
                      key={kod}
                      className="flex items-baseline justify-between gap-2 text-[13px]"
                    >
                      <span
                        className={
                          natija.ruxsat
                            ? 'text-matn'
                            : 'text-matn-kuchsiz line-through decoration-chegara-quyuq'
                        }
                      >
                        {RUXSATLAR[kod].nom}
                      </span>

                      {natija.ruxsat && natija.qamrov === 'BARCHA' && (
                        <span className="shrink-0 rounded-full bg-brend-fon px-1.5 py-0.5 text-[10px] font-medium tracking-[0.02em] text-brend">
                          barcha filial
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
