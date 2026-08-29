import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import {
  HARAKAT_TURLARI,
  harakatNomi,
  miqdorMatni,
  yonalish,
  type Yonalish,
} from '@/lib/domain/ombor-harakat';
import { BOSH_FILTR, omborTarixi, tarixMateriallari, type TarixFiltri } from './malumot';

export const dynamic = 'force-dynamic';

/**
 * `/ombor/tarix` — TZ 7.11
 *
 * ⚠️ NEGA ALOHIDA EKRAN
 *
 *    Harakatlar tarixi ilgari faqat MATERIAL KARTOCHKASI ichida
 *    ko'rinardi: avval materialni topish, keyin ochish kerak edi.
 *    Egasi «ombor tarixi — har harakat: kirim, kesim, chiqindi,
 *    ko'chirish» degan alohida bo'lim so'radi.
 *
 *    Bu ekran «kecha omborda nima bo'ldi?» degan savolga javob
 *    beradi — material tanlamasdan.
 *
 * ⚠️ Filtr MANZILDA turadi (`?dan=&gacha=&material=&turi=`):
 *    sahifa yangilansa saqlanadi va havolani boshqasiga yuborish
 *    mumkin.
 */

/** Rang: ombor to'ldimi yoki kamaydimi — bir qarashda */
function miqdorUslubi(y: Yonalish): string {
  if (y === 'KIRDI') return 'text-belgi-yashil';
  if (y === 'CHIQDI') return 'text-belgi-qizil';
  return 'text-matn-kuchsiz';
}

function sonYoki(x: string | undefined, standart: number): number {
  const n = Number(x);
  return x === undefined || x === '' || !Number.isFinite(n) ? standart : n;
}

export default async function OmborTarixi({
  searchParams,
}: {
  searchParams: Promise<{
    dan?: string;
    gacha?: string;
    material?: string;
    turi?: string;
    sahifa?: string;
  }>;
}) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const s = await searchParams;

  const materialId = sonYoki(s.material, 0);
  const filtr: TarixFiltri = {
    ...BOSH_FILTR,
    dan: s.dan ?? '',
    gacha: s.gacha ?? '',
    materialId: materialId > 0 ? materialId : null,
    /** ⚠️ Noma'lum tur so'ralsa — filtrsiz, xato emas */
    turi: HARAKAT_TURLARI.includes(s.turi as never) ? (s.turi ?? '') : '',
  };

  const sahifa = Math.max(0, sonYoki(s.sahifa, 0));

  const [natija, materiallar] = await Promise.all([
    omborTarixi(f.filialId, filtr, sahifa),
    tarixMateriallari(f.filialId),
  ]);

  /** Sahifa havolasi — boshqa filtrlarni saqlab qoladi */
  function sahifaYoli(yangi: number): string {
    const u = new URLSearchParams();
    if (filtr.dan !== '') u.set('dan', filtr.dan);
    if (filtr.gacha !== '') u.set('gacha', filtr.gacha);
    if (filtr.materialId !== null) u.set('material', String(filtr.materialId));
    if (filtr.turi !== '') u.set('turi', filtr.turi);
    if (yangi > 0) u.set('sahifa', String(yangi));
    const q = u.toString();
    return q === '' ? '/ombor/tarix' : `/ombor/tarix?${q}`;
  }

  const filtrBor =
    filtr.dan !== '' || filtr.gacha !== '' || filtr.materialId !== null || filtr.turi !== '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ombor qoldig&apos;i
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Ombor tarixi
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Har harakat: kirim, kesim, qoldiq kesma, chiqindi, ko&apos;chirish, sanoq
        </p>
      </div>

      {/*
        ⚠️ Oddiy GET forma — JavaScript kerak emas. Manzil o'qiladigan
           bo'lib qoladi va filtr xatcho'pga tushadi.
      */}
      <form
        method="get"
        className="grid gap-3 rounded-karta border border-chegara bg-sirt p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-matn-kuchsiz">Sanadan</span>
          <input
            type="date"
            name="dan"
            defaultValue={filtr.dan}
            className="fokus rounded-maydon border border-chegara bg-fon px-2.5 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-matn-kuchsiz">Sanagacha</span>
          <input
            type="date"
            name="gacha"
            defaultValue={filtr.gacha}
            className="fokus rounded-maydon border border-chegara bg-fon px-2.5 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-matn-kuchsiz">Mahsulot</span>
          <select
            name="material"
            defaultValue={filtr.materialId === null ? '' : String(filtr.materialId)}
            className="fokus rounded-maydon border border-chegara bg-fon px-2.5 py-1.5 text-sm"
          >
            <option value="">— hammasi —</option>
            {materiallar.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-matn-kuchsiz">Harakat turi</span>
          <select
            name="turi"
            defaultValue={filtr.turi}
            className="fokus rounded-maydon border border-chegara bg-fon px-2.5 py-1.5 text-sm"
          >
            <option value="">— hammasi —</option>
            {HARAKAT_TURLARI.map((t) => (
              <option key={t} value={t}>
                {harakatNomi(t)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="fokus rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
          >
            Ko&apos;rish
          </button>
          {filtrBor && (
            <Link
              href="/ombor/tarix"
              className="fokus rounded-maydon px-2.5 py-2 text-sm text-matn-kuchsiz hover:text-matn"
            >
              Tozalash
            </Link>
          )}
        </div>
      </form>

      {natija.qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          {filtrBor ? "Bu shart bo'yicha harakat topilmadi." : "Hali ombor harakati yo'q."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Harakat</th>
                  <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                  <th className="px-4 py-2.5 font-medium">Bo&apos;lak</th>
                  <th className="px-4 py-2.5 text-right font-medium">Miqdor</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                  <th className="px-4 py-2.5 font-medium">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {natija.qatorlar.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-matn-ikki">
                      {h.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">{harakatNomi(h.turi)}</td>
                    <td className="px-4 py-2.5">
                      {/* Kartochkada shu materialning to'liq tarixi turadi */}
                      <Link
                        href={`/ombor/${String(h.materialId)}`}
                        className="text-brend hover:underline"
                      >
                        {h.materialNomi}
                      </Link>
                    </td>
                    <td className="raqam px-4 py-2.5 text-[13px] text-matn-kuchsiz">
                      {h.bolakKod}
                    </td>
                    <td
                      className={`raqam whitespace-nowrap px-4 py-2.5 text-right font-medium ${miqdorUslubi(
                        yonalish(h),
                      )}`}
                    >
                      {miqdorMatni(h)}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right text-matn-ikki">
                      {pulKorsat(som(h.tannarxSumma))}
                    </td>
                    <td className="px-4 py-2.5 text-matn-ikki">{h.xodimIsmi}</td>
                    <td className="px-4 py-2.5 text-[13px] text-matn-kuchsiz">{h.izoh ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(sahifa > 0 || natija.davomiBor) && (
            <div className="flex items-center justify-between text-sm">
              {sahifa > 0 ? (
                <Link href={sahifaYoli(sahifa - 1)} className="text-brend hover:underline">
                  ← Oldingi
                </Link>
              ) : (
                <span />
              )}
              <span className="text-matn-kuchsiz">{sahifa + 1}-sahifa</span>
              {natija.davomiBor ? (
                <Link href={sahifaYoli(sahifa + 1)} className="text-brend hover:underline">
                  Keyingi →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
