import Link from 'next/link';
import { ModulPanel } from '../modul-panel';
import { buyurtmaPaneli } from './panel';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { toshkentKuni } from '@/lib/domain/sana';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { buyurtmalar, FILTR_NOMI, type BuyurtmaFiltri } from './malumot';

export const dynamic = 'force-dynamic';

const FILTRLAR = Object.keys(FILTR_NOMI) as BuyurtmaFiltri[];

/** Pul — buyurtma valyutasida (1.3); ilgari dollar formatsiz chiqardi */
const pul = (x: string, valyuta: string): string =>
  valyuta === 'USD' ? `${pulKorsat(dollar(x))} $` : pulKorsat(som(x));

/** Tugagan holatlar — muddat o'tgani endi «kechikkan» emas */
const YAKUNLANGAN = new Set(['TOPSHIRILDI', 'QAYTARILGAN', 'RAD_ETILGAN', 'BEKOR']);

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
  searchParams: Promise<{ filtr?: string; q?: string }>;
}) {
  const f = await sahifaRuxsati('buyurtma.kor');
  const sotaOladi = ruxsatBormi(f, 'buyurtma.yarat');

  const { filtr, q } = await searchParams;
  const qidiruv = (q ?? '').trim().slice(0, 60);
  const bugun = toshkentKuni();
  const joriy: BuyurtmaFiltri = FILTRLAR.includes(filtr as BuyurtmaFiltri)
    ? (filtr as BuyurtmaFiltri)
    : 'HAMMASI';

  const [royxat, panel] = await Promise.all([
    buyurtmalar(f.filialId, joriy, 100, qidiruv),
    // TZ 11.11 — sahifa tepasidagi panel
    buyurtmaPaneli(f.filialId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Buyurtmalar</h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">Holat har pozitsiyada alohida (8.2)</p>
        </div>

        {sotaOladi && (
          <Link
            href="/buyurtma/yangi"
            className="fokus rounded-maydon bg-brend px-4 py-2.5 text-[13px] font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq"
          >
            Yangi buyurtma
          </Link>
        )}
      </div>

      <ModulPanel holat={panel.holat} davr={panel.davr} diqqat={panel.diqqat} />

      {/*
        Qidiruv — raqam, mijoz ismi yoki telefon (kamida 3 raqam).
        Oddiy GET forma: tanlangan filtr saqlanadi.
      */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        {joriy !== 'HAMMASI' && <input type="hidden" name="filtr" value={joriy} />}
        <input
          type="search"
          name="q"
          defaultValue={qidiruv}
          placeholder="Raqam, mijoz ismi yoki telefon"
          aria-label="Buyurtma qidirish"
          className="w-72 rounded-maydon border border-chegara-quyuq bg-sirt px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-brend/25"
        />
        <button
          type="submit"
          className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-[13px] text-matn-ikki hover:bg-fon"
        >
          Qidirish
        </button>
        {qidiruv !== '' && (
          <Link
            href={joriy === 'HAMMASI' ? '/buyurtma' : `/buyurtma?filtr=${joriy}`}
            className="text-[13px] text-matn-kuchsiz hover:text-matn"
          >
            Tozalash
          </Link>
        )}
      </form>

      {/* ── TZ 8.15 · Filtrlar ─────────────────────────────────── */}
      <nav className="flex flex-wrap gap-2">
        {FILTRLAR.map((x) => (
          <Link
            key={x}
            href={`/buyurtma?${new URLSearchParams({
              ...(x === 'HAMMASI' ? {} : { filtr: x }),
              ...(qidiruv === '' ? {} : { q: qidiruv }),
            }).toString()}`}
            aria-current={x === joriy ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              x === joriy
                ? 'bg-brend text-tugma-matn'
                : 'border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn'
            }`}
          >
            {FILTR_NOMI[x]}
          </Link>
        ))}
      </nav>

      {royxat.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-12 text-center text-[13px] text-matn-kuchsiz">
          {qidiruv === '' ? 'Bu filtrda buyurtma yo‘q.' : `«${qidiruv}» bo‘yicha buyurtma topilmadi.`}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-[13px]">
            <thead className="border-b border-chegara bg-fon/70 text-left text-[11px] font-medium tracking-[0.04em] text-matn-kuchsiz uppercase">
              <tr>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Mijoz</th>
                <th className="px-4 py-3">Poz.</th>
                <th className="px-4 py-3 text-right">Summa</th>
                <th className="px-4 py-3">To&apos;lov</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Muddat</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {royxat.map((b) => {
                // 2026-10-10 — FIFO taqsimotdan; Number() bilan solishtirish yo'q
                const toliq = b.tolovDaraja === 'TOLANDI';
                const qisman = b.tolovDaraja === 'QISMAN';
                const kechikdi =
                  b.tayyorlikSana !== null &&
                  b.tayyorlikSana < bugun &&
                  Object.keys(b.holatlar).some((h) => !YAKUNLANGAN.has(h));

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
                        {b.mijozId === null ? (
                          <span className="text-matn-kuchsiz">mijozsiz</span>
                        ) : (
                          <Link href={`/mijoz/${String(b.mijozId)}`} className="hover:underline">
                            {b.mijozIsmi}
                          </Link>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-fon px-1.5 text-[12px] font-medium text-matn-ikki">
                        {b.pozitsiyaSoni}
                      </span>
                    </td>

                    <td className="raqam px-4 py-3 font-semibold whitespace-nowrap">
                      {pul(b.jami, b.valyuta)}
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
                            ? `qoldi ${pul(b.qolgan, b.valyuta)}`
                            : "To'lanmagan"}
                      </span>

                      {/*
                        ⚠️ «To'lanmagan» IKKI XIL bo'ladi va ular bir xil
                           ko'rinardi: qarzga ketgan buyurtma (odatiy) va
                           oldindan to'lovi YOZILMAY QOLGANI (xato).
                           Ikkinchisida pul kassada, tizimda esa yo'q —
                           kun yopilganda sababsiz farq chiqadi.

                           Belgi to'lov kiritilishi bilan o'zi yo'qoladi.
                      */}
                      {b.tolovYozilmadi && (
                        <Link
                          href={`/buyurtma/${String(b.id)}`}
                          title="Sotuvda oldindan to'lov kiritilgan, lekin yozilmay qolgan. Kartochkadan qayta kiriting."
                          className="mt-1 block rounded-full bg-belgi-qizil-fon px-2 py-0.5 text-[11px] font-semibold text-belgi-qizil hover:underline"
                        >
                          ⚠ To'lov yozilmagan
                        </Link>
                      )}
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

                    <td
                      className={`px-4 py-3 whitespace-nowrap ${
                        kechikdi ? 'font-medium text-belgi-qizil' : 'text-matn-ikki'
                      }`}
                    >
                      {b.tayyorlikSana ?? <span className="text-matn-kuchsiz">—</span>}
                      {kechikdi && <span className="block text-[11px]">kechikdi</span>}
                    </td>

                    {/*
                      TZ 8.9 — chek yopilgan buyurtmada. Mijoz chekni
                      yo'qotsa, sotuvchi ro'yxatdan qayta chiqaradi:
                      kartochkani ochib o'tirish shart emas.
                    */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.yopilganmi && (
                        <Link
                          href={`/buyurtma/${String(b.id)}/chek`}
                          className="text-[12px] text-brend hover:underline"
                        >
                          Chek
                        </Link>
                      )}
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
