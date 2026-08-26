import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { buyurtmalar, FILTR_NOMI, type BuyurtmaFiltri } from './malumot';

export const dynamic = 'force-dynamic';

const FILTRLAR = Object.keys(FILTR_NOMI) as BuyurtmaFiltri[];

/**
 * TZ 8.2 — «Buyurtmaning umumiy statusi YO'Q — holat har
 * pozitsiyada.» Shuning uchun jadvalda bitta status emas, holatlar
 * sanog'i ko'rsatiladi: «2 tayyor · 1 tikilmoqda».
 *
 * ⚠️ Rang biznes ma'nosiga ega va o'zgartirilmaydi:
 *    yashil — tugagan, sariq — kutmoqda, qizil — muammo.
 */
function holatRangi(holat: string): string {
  switch (holat) {
    case 'TOPSHIRILDI':
      return 'bg-belgi-yashil-fon text-belgi-yashil';
    case 'MATERIALGA_KUTMOQDA':
      return 'bg-belgi-sariq-fon text-belgi-sariq';
    case 'BEKOR':
    case 'RAD_ETILGAN':
    case 'QAYTARILGAN':
      return 'bg-belgi-qizil-fon text-belgi-qizil';
    case 'TAYYOR':
    case 'YETIB_KELDI':
      return 'bg-brend-fon text-brend';
    default:
      return 'bg-fon text-matn-ikki';
  }
}

/**
 * Mijoz ismining bosh harfi — dumaloq belgi.
 *
 * ⚠️ Uzun ro'yxatda ko'z ismlarni o'qib chiqmaydi, shakl bo'yicha
 *    topadi. Bu referens uslubidagi naqsh.
 */
function BoshHarf({ ism }: { ism: string | null }) {
  const harf = (ism ?? '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brend-fon text-[12px] font-semibold text-brend"
      aria-hidden="true"
    >
      {harf}
    </span>
  );
}

export default async function BuyurtmalarRoyxati({
  searchParams,
}: {
  searchParams: Promise<{ filtr?: string }>;
}) {
  const f = await sahifaRuxsati('buyurtma.kor');
  const sotaOladi = ruxsatBormi(f, 'buyurtma.yarat');

  const { filtr } = await searchParams;
  const joriy: BuyurtmaFiltri = FILTRLAR.includes(filtr as BuyurtmaFiltri)
    ? (filtr as BuyurtmaFiltri)
    : 'HAMMASI';

  const royxat = await buyurtmalar(f.filialId, joriy);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Sotuv tarixi</h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">Holat har pozitsiyada alohida (8.2)</p>
        </div>

        {sotaOladi && (
          <Link
            href="/sotuv"
            className="fokus rounded-maydon bg-amal px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-amal-hover"
          >
            Yangi buyurtma
          </Link>
        )}
      </div>

      {/* ── TZ 8.15 · Filtrlar ─────────────────────────────────── */}
      <nav className="flex flex-wrap gap-2">
        {FILTRLAR.map((x) => (
          <Link
            key={x}
            href={x === 'HAMMASI' ? '/buyurtma' : `/buyurtma?filtr=${x}`}
            aria-current={x === joriy ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              x === joriy
                ? 'bg-brend text-white'
                : 'border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn'
            }`}
          >
            {FILTR_NOMI[x]}
          </Link>
        ))}
      </nav>

      {royxat.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-12 text-center text-[13px] text-matn-kuchsiz">
          Bu filtrda buyurtma yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-[13px]">
            <thead className="border-b border-chegara text-left text-[11px] font-medium tracking-[0.04em] text-matn-kuchsiz uppercase">
              <tr>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Mijoz</th>
                <th className="px-4 py-3">Poz.</th>
                <th className="px-4 py-3 text-right">Summa</th>
                <th className="px-4 py-3">To&apos;lov</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Muddat</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-chegara">
              {royxat.map((b) => {
                const jami = Number(b.jami);
                const tolangan = Number(b.tolangan);
                const toliq = tolangan >= jami && jami > 0;
                const qisman = tolangan > 0 && tolangan < jami;

                return (
                  <tr key={b.id} className="transition-colors hover:bg-fon">
                    <td className="px-4 py-3 whitespace-nowrap text-matn-ikki">
                      {b.sana.toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <Link
                        href={`/buyurtma/${String(b.id)}`}
                        className="mt-0.5 block text-[11px] text-brend hover:underline"
                      >
                        {b.raqam}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <BoshHarf ism={b.mijozIsmi} />
                        <span className={b.mijozIsmi === null ? 'text-matn-kuchsiz' : ''}>
                          {b.mijozIsmi ?? 'mijozsiz'}
                        </span>
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-fon px-1.5 text-[12px] font-medium text-matn-ikki">
                        {b.pozitsiyaSoni}
                      </span>
                    </td>

                    <td className="raqam px-4 py-3 font-semibold whitespace-nowrap">
                      {b.valyuta === 'SOM' ? pulKorsat(som(b.jami)) : `${b.jami} $`}
                    </td>

                    {/*
                      ⚠️ TZ 3.12 — buyurtma qarzga ketishi mumkin.
                         Sotuvchi qaysi mijozdan pul yig'ish
                         kerakligini shu ustundan ko'radi.
                    */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          toliq
                            ? 'bg-belgi-yashil-fon text-belgi-yashil'
                            : qisman
                              ? 'bg-belgi-sariq-fon text-belgi-sariq'
                              : 'bg-belgi-qizil-fon text-belgi-qizil'
                        }`}
                      >
                        {toliq
                          ? "To'landi"
                          : qisman
                            ? `${pulKorsat(som(b.tolangan))} to'landi`
                            : "To'lanmagan"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        {Object.entries(b.holatlar).map(([h, n]) => (
                          <span
                            key={h}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${holatRangi(h)}`}
                          >
                            {n} {HOLAT_NOMI[h as PozitsiyaHolati] ?? h}
                          </span>
                        ))}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-matn-ikki">
                      {b.tayyorlikSana ?? <span className="text-matn-kuchsiz">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[12px] text-matn-kuchsiz">
        Muddati kiritilmagan buyurtma «kechikkan» hisoblanmaydi (3.13).
      </p>
    </div>
  );
}
