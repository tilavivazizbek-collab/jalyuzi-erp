/**
 * app/(panel)/narx/matritsa.tsx — soha auditi 2026-09-22
 *
 * Tur × daraja jadvali: qaysi juftlikka narx qo'yilmagani BIR
 * QARASHDA ko'rinadi.
 *
 * ⚠️ NEGA BU EKRAN BOR
 *
 *    Narx qo'yilmagani ilgari faqat SOTUV paytida bilinardi —
 *    mijoz oldida. Chap ustundagi «3 daraja» belgisi turda
 *    nechta qoida borligini aytadi, lekin QAYSI daraja ochiq
 *    qolganini aytmaydi: uchta darajadan ikkitasi to'ldirilgan
 *    tur ham yashil turaveradi.
 *
 * ⚠️ SERVER KOMPONENTI — hech qanday holat yo'q, faqat ko'rsatadi.
 *    Kataklar havola: bosilsa o'sha turning jadvaliga o'tadi.
 */

import Link from 'next/link';
import type { MatritsaKatagi, NarxGuruhQatori, TurQatori } from './malumot';

/** Katak holati — to'rtta (0055 da «DARAJA» qo'shildi) */
type Holat = 'TOLIQ' | 'QISMAN' | 'DARAJA' | 'YOQ';

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
    izoh: "faqat ayrim mijoz turi yoki filialga — boshqasiga sotilmaydi",
  },
  /**
   * ⚠️ DARAJADAN OLINGAN — 0055. Turga alohida qator yo'q,
   *    lekin darajaga umumiy narx qo'yilgan, ya'ni SOTILADI.
   *
   *    Yashildan AJRATILADI ataylab: egasi narxni tuzatmoqchi
   *    bo'lsa qayerga borishini bilishi kerak — turga alohida
   *    qator qo'yiladigan joy boshqa, darajaning umumiy narxi
   *    boshqa.
   */
  DARAJA: {
    belgi: '≈',
    uslub: 'bg-belgi-kok-fon text-belgi-kok',
    izoh: 'darajaning umumiy narxi ishlatiladi',
  },
  YOQ: {
    belgi: '—',
    uslub: 'bg-belgi-qizil-fon text-belgi-qizil',
    izoh: "narx yo'q — bu mato bilan sotilmaydi",
  },
};

export function NarxMatritsasi({
  turlar,
  guruhlar,
  kataklar,
  darajaQoplagan = [],
}: {
  turlar: readonly TurQatori[];
  guruhlar: readonly NarxGuruhQatori[];
  kataklar: readonly MatritsaKatagi[];
  /**
   * Darajaga umumiy narx qo'yilgan darajalar — 0055.
   *
   * ⚠️ Bunday darajaning BUTUN USTUNI qoplangan hisoblanadi:
   *    turga alohida qator bo'lmasa o'sha ishlatiladi.
   */
  darajaQoplagan?: readonly number[];
}) {
  if (guruhlar.length === 0 || turlar.length === 0) return null;

  const holati = (turId: number | null, guruhId: number): Holat => {
    const turniki = kataklar.find(
      (k) => k.turId === turId && k.narxGuruhId === guruhId,
    )?.holat;
    if (turniki !== undefined) return turniki;
    /*
     * ⚠️ DARAJA NARXI «MATERIALNI O'ZI SOTISH» QATORIGA
     *    TEGMAYDI. U tayyor jalyuzi narxi va metrlab kesib
     *    sotishga aloqasi yo'q — aks holda xarita yolg'on
     *    tinchlik berardi.
     */
    if (turId !== null && darajaQoplagan.includes(guruhId)) return 'DARAJA';
    return 'YOQ';
  };

  /** ⚠️ «Materialni o'zi sotish» ham qatnashadi — u ham narx talab qiladi */
  const qatorlar: { id: number | null; nom: string; havola: string }[] = [
    { id: null, nom: "Materialni o'zi sotish", havola: '/narx?tur=material' },
    ...turlar.map((t) => ({ id: t.id, nom: t.nom, havola: `/narx?tur=${String(t.id)}` })),
  ];

  /**
   * ⚠️ «DARAJA» holati BO'SH HISOBLANMAYDI — u sotiladi.
   *    Aks holda darajaga umumiy narx qo'yilgandan keyin ham
   *    sarlavhada qizil raqam turib, egasi nima qilishni
   *    bilmasdi.
   */
  const bosh = qatorlar.reduce(
    (n, q) => n + guruhlar.filter((g) => holati(q.id, g.id) === 'YOQ').length,
    0,
  );

  return (
    <section className="rounded-karta border border-chegara bg-sirt p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-matn">Narx xaritasi</h2>
        {/*
          ⚠️ Raqam sarlavhada: egasi jadvalni ochmasdan ham «nechta
             teshik bor» degan savolga javob olsin.
        */}
        <p className="text-[13px] text-matn-ikki">
          {bosh === 0 ? (
            <span className="text-belgi-yashil">Hamma juftlikka narx qo&apos;yilgan</span>
          ) : (
            <>
              <b className="text-belgi-qizil">{bosh}</b> ta juftlikka narx
              qo&apos;yilmagan — ular sotuvda ishlamaydi
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-chegara text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <th className="py-2 pr-3 font-medium">Tur</th>
              {guruhlar.map((g) => (
                <th key={g.id} className="px-2 py-2 text-center font-medium">
                  {g.nom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara">
            {qatorlar.map((q) => (
              <tr key={q.id ?? 'material'}>
                <td className="py-1.5 pr-3">
                  <Link href={q.havola} className="text-matn hover:text-brend hover:underline">
                    {q.nom}
                  </Link>
                </td>
                {guruhlar.map((g) => {
                  const h = holati(q.id, g.id);
                  const k = KO_RINISH[h];
                  return (
                    <td key={g.id} className="px-2 py-1.5 text-center">
                      <Link
                        href={q.havola}
                        title={`${q.nom} · ${g.nom} — ${k.izoh}`}
                        aria-label={`${q.nom} · ${g.nom} — ${k.izoh}`}
                        className={`fokus inline-flex h-6 w-6 items-center justify-center rounded text-[12px] font-semibold ${k.uslub}`}
                      >
                        {k.belgi}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12px] text-matn-kuchsiz">
        <span className="text-belgi-yashil">✓</span> narx bor ·{' '}
        <span className="text-belgi-sariq">!</span> faqat ayrim mijoz turi yoki
        filialga · <span className="text-belgi-qizil">—</span> narx yo&apos;q.
        Katakni bosing — o&apos;sha turning jadvali ochiladi.
      </p>
    </section>
  );
}
