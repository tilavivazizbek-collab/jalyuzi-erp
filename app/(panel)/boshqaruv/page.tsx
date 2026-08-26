import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatTekshir } from '@/lib/ruxsat/tekshir';
import { GURUHLAR, RUXSATLAR, RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';
import { pulKorsat, som } from '@/lib/domain/pul';
import {
  KorsatkichKartasi,
  PulBelgisi,
  QarzBelgisi,
  QutiBelgisi,
  SavatBelgisi,
} from '../korsatkich';
import { kimIshlamoqda, kunKorsatkichlari } from './malumot';

export const dynamic = 'force-dynamic';

/**
 * Boshqaruv — egasi ertalab birinchi ochadigan ekran.
 *
 * ⚠️ To'liq dashboard 8-bosqichda quriladi (TZ 11). Hozircha
 *    to'rt raqam va ruxsat kartochkasi.
 *
 * ⚠️ Raqamlar YUQORIDA. Egasi ekranga qaraydi va uch soniyada
 *    «bugun qanday ketyapti» degan savolga javob oladi. Ruxsat
 *    ro'yxati pastda — u kunda bir marta ham kerak bo'lmaydi.
 */
export default async function BoshqaruvSahifasi() {
  const f = await kirganBolishiShart();

  const [kim, k] = await Promise.all([
    kimIshlamoqda(f.xodimId, f.filialId),
    kunKorsatkichlari(f.filialId),
  ]);

  /**
   * ⚠️ Qarz MANFIY bo'lsa — bu avans (6.8), qarz emas. Egasiga
   *    «−200 000 qarz» deb ko'rsatish chalkashtiradi.
   */
  const qarz = Number(k.mijozQarzi);

  return (
    <div className="flex flex-col gap-7">
      {/* ── Kim, qayerda ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">{kim.ism}</h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            {kim.filialNomi}
            {f.boshFilialda && ' · bosh filial'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {f.rollar.map((r) => (
            <span
              key={r.nom}
              className="rounded-full bg-brend-fon px-2.5 py-1 text-[12px] font-medium text-brend"
            >
              {r.nom}
            </span>
          ))}
        </div>
      </div>

      {/* ── To'rt raqam ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KorsatkichKartasi
          sarlavha="Bugungi tushum"
          qiymat={pulKorsat(som(k.bugungiTushum))}
          izoh="Kassaga kirgan pul"
          rang="kok"
          belgi={<SavatBelgisi />}
        />

        <KorsatkichKartasi
          sarlavha="Kassa qoldig'i"
          qiymat={pulKorsat(som(k.kassaQoldigi))}
          izoh="Hozir kassalarda"
          rang="yashil"
          belgi={<PulBelgisi />}
        />

        <KorsatkichKartasi
          sarlavha={qarz >= 0 ? 'Mijozlar qarzi' : 'Mijozlar avansi'}
          qiymat={pulKorsat(som(Math.abs(qarz).toFixed(2)))}
          izoh={qarz >= 0 ? 'Yig‘ilishi kerak' : 'Oldindan olingan'}
          rang={qarz > 0 ? 'qizil' : 'yashil'}
          belgi={<QarzBelgisi />}
        />

        <KorsatkichKartasi
          sarlavha="Ochiq buyurtma"
          qiymat={String(k.ochiqBuyurtma)}
          izoh="Yopilmagan"
          rang="sariq"
          belgi={<QutiBelgisi />}
        />
      </div>

      {/* ── Ruxsatlar ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-matn">Sizga ochiq amallar</h2>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Barcha rollaringiz yig&apos;indisi (10.3)
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {GURUHLAR.map((guruh) => {
            const kodlar = RUXSAT_KODLARI.filter((x) => RUXSATLAR[x].guruh === guruh);
            const natijalar = kodlar.map((x) => ({
              kod: x,
              natija: ruxsatTekshir(f, x),
            }));
            const ochiq = natijalar.filter((x) => x.natija.ruxsat).length;

            return (
              <div
                key={guruh}
                className="flex flex-col rounded-karta border border-chegara bg-sirt"
              >
                <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
                  <h3 className="text-[13px] font-semibold text-matn">{guruh}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      ochiq === 0
                        ? 'bg-fon text-matn-kuchsiz'
                        : 'bg-belgi-yashil-fon text-belgi-yashil'
                    }`}
                  >
                    {ochiq} / {kodlar.length}
                  </span>
                </div>

                <ul className="flex flex-col gap-1.5 px-5 pb-4">
                  {natijalar.map(({ kod, natija }) => (
                    <li key={kod} className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className={natija.ruxsat ? 'text-matn-ikki' : 'text-matn-kuchsiz'}>
                        {natija.ruxsat ? '' : '· '}
                        {RUXSATLAR[kod].nom}
                      </span>

                      {natija.ruxsat && natija.qamrov === 'BARCHA' && (
                        <span className="shrink-0 rounded-full bg-brend-fon px-1.5 py-0.5 text-[10px] font-medium text-brend">
                          barcha
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
