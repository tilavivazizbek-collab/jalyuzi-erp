/**
 * app/(panel)/narx/matritsa.tsx — soha auditi 2026-09-22 · 0057
 *
 * Qaysi turga narx qo'yilmagani BIR QARASHDA ko'rinadi.
 *
 * ⚠️ NEGA BU EKRAN BOR
 *
 *    Narx qo'yilmagani ilgari faqat SOTUV paytida bilinardi —
 *    mijoz oldida. Bu yerda esa egasi sahifani ochgan zahoti
 *    ko'radi.
 *
 * ⚠️ 0057 — ILGARI BU TUR × DARAJA JADVALI EDI.
 *
 *    Narx guruhi (daraja) olib tashlangach ikkinchi o'q yo'qoldi:
 *    narx endi faqat TURGA bog'liq. Jadval o'rniga oddiy ro'yxat
 *    qoldi va u aynan shuncha ma'lumot beradi — ustunlari bitta
 *    bo'lgan jadval faqat ko'zni chalg'itardi.
 *
 * ⚠️ SERVER KOMPONENTI — hech qanday holat yo'q, faqat ko'rsatadi.
 *    Qatorlar havola: bosilsa o'sha turning jadvaliga o'tadi.
 */

import Link from 'next/link';
import type { MatritsaKatagi, TurQatori } from './malumot';

/** Katak holati — to'rtta */
type Holat = 'TOLIQ' | 'QISMAN' | 'STANDART' | 'YOQ';

const KO_RINISH: Record<Holat, { belgi: string; uslub: string; izoh: string }> = {
  TOLIQ: {
    belgi: '✓',
    uslub: 'bg-belgi-yashil-fon text-belgi-yashil',
    izoh: "narx qo'yilgan",
  },
  /**
   * ⚠️ ENG XAVFLI HOLAT: qoida bor, lekin faqat ma'lum mijoz turiga
   *    yoki filialga. Boshqa mijozga sotilmaydi, ekranda esa «bor»
   *    bo'lib ko'rinardi.
   */
  QISMAN: {
    belgi: '!',
    uslub: 'bg-belgi-sariq-fon text-belgi-sariq',
    izoh: 'faqat ayrim mijoz turi yoki filialga — boshqasiga sotilmaydi',
  },
  /**
   * ⚠️ STANDARTDAN OLINGAN. Turga alohida qator yo'q, lekin «hamma
   *    tur uchun» narx qo'yilgan — ya'ni SOTILADI.
   *
   *    Yashildan AJRATILADI ataylab: egasi narxni tuzatmoqchi
   *    bo'lsa qayerga borishini bilishi kerak.
   */
  STANDART: {
    belgi: '≈',
    uslub: 'bg-belgi-kok-fon text-belgi-kok',
    izoh: 'hamma tur uchun standart narx ishlatiladi',
  },
  YOQ: {
    belgi: '—',
    uslub: 'bg-belgi-qizil-fon text-belgi-qizil',
    izoh: "narx yo'q — bu tur sotilmaydi",
  },
};

export function NarxMatritsasi({
  turlar,
  kataklar,
  standartBormi = false,
}: {
  turlar: readonly TurQatori[];
  kataklar: readonly MatritsaKatagi[];
  /**
   * «Hamma tur uchun» narx qo'yilganmi — 0055.
   *
   * ⚠️ Qo'yilgan bo'lsa turga alohida qatori yo'q turlar ham
   *    SOTILADI. Usiz ekran «narx yo'q» deb yolg'on ogohlantirish
   *    berardi.
   */
  standartBormi?: boolean;
}) {
  if (turlar.length === 0) return null;

  const holati = (turId: number | null): Holat => {
    const turniki = kataklar.find((k) => k.turId === turId)?.holat;
    if (turniki !== undefined) return turniki;
    /*
     * ⚠️ STANDART NARX «MATERIALNI O'ZI SOTISH» QATORIGA TEGMAYDI.
     *    U tayyor jalyuzi narxi va metrlab kesib sotishga aloqasi
     *    yo'q — aks holda xarita yolg'on tinchlik berardi.
     */
    if (turId !== null && standartBormi) return 'STANDART';
    return 'YOQ';
  };

  /** ⚠️ «Materialni o'zi sotish» ham qatnashadi — u ham narx talab qiladi */
  const qatorlar: { id: number | null; nom: string; havola: string }[] = [
    { id: null, nom: "Materialni o'zi sotish", havola: '/narx?tur=material' },
    ...turlar.map((t) => ({ id: t.id, nom: t.nom, havola: `/narx?tur=${String(t.id)}` })),
  ];

  const bosh = qatorlar.filter((q) => holati(q.id) === 'YOQ').length;

  return (
    <section className="rounded-karta border border-chegara bg-sirt p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-matn">Narx xaritasi</h2>
        <p className="text-[13px] text-matn-ikki">
          {bosh === 0 ? (
            <span className="text-belgi-yashil">Hamma turga narx qo&apos;yilgan</span>
          ) : (
            <>
              <b className="text-belgi-qizil">{bosh}</b> ta turga narx
              qo&apos;yilmagan — ular sotuvda ishlamaydi
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {qatorlar.map((q) => {
          const h = holati(q.id);
          const k = KO_RINISH[h];
          return (
            <Link
              key={q.id ?? 'material'}
              href={q.havola}
              title={k.izoh}
              className="flex items-center justify-between gap-3 rounded-maydon px-3 py-2 transition-colors hover:bg-fon-ikki"
            >
              <span className="truncate text-[13px] text-matn">{q.nom}</span>
              <span
                className={`shrink-0 rounded-maydon px-2 py-0.5 text-[12px] font-medium ${k.uslub}`}
              >
                {k.belgi} {k.izoh}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
