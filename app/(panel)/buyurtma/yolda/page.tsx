import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { YetibKeldiTugmasi } from '../hayot';
import { yoldagilar, type YoldagiPozitsiya } from './malumot';

export const dynamic = 'force-dynamic';

/**
 * TZ 20.5.1 · 20.8 — «Yo'lda» ekrani.
 *
 * Tikkan filial «Tugatdim» bosgach mahsulot yo'lga chiqadi. Sotgan
 * filial uni shu yerda ko'radi va qabul qiladi.
 *
 * ⚠️ 20.8 «jo'natma» degan guruhni tasvirlaydi. Bu yerda guruh
 *    KO'RSATISHDA yasaladi — tikkan filial bo'yicha. Alohida jadval
 *    kerak emas: qabul qilish baribir har pozitsiya bo'yicha yoziladi
 *    (T-10).
 */

const sana = (d: Date | null): string =>
  d === null ? '—' : new Intl.DateTimeFormat('uz-UZ').format(d);

export default async function YoldagilarSahifasi() {
  const f = await sahifaRuxsati('buyurtma.kor');
  const qabulQilaOladi = ruxsatBormi(f, 'buyurtma.tahrirla');

  const royxat = await yoldagilar(f.filialId);

  // Tikkan filial bo'yicha guruh — 20.8 dagi «jo'natma» ko'rinishi
  const guruhlar = new Map<string, YoldagiPozitsiya[]>();
  for (const p of royxat) {
    const kalit = p.tikuvchiFilialNomi;
    const bor = guruhlar.get(kalit);
    if (bor === undefined) guruhlar.set(kalit, [p]);
    else bor.push(p);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/buyurtma" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Buyurtmalar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yo&apos;ldagi mahsulotlar
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Boshqa filial tikdi, sizga kelmoqda. Qabul qilinganda holat «Yetib keldi» bo&apos;ladi
          (20.5.1) — mijozga shundan keyin topshiriladi.
        </p>
      </div>

      {royxat.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Yo&apos;lda mahsulot yo&apos;q.
        </p>
      ) : (
        [...guruhlar.entries()].map(([filialNomi, qatorlar]) => (
          <section key={filialNomi} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-matn-ikki">
              {filialNomi} dan{' '}
              <span className="text-matn-kuchsiz">· {qatorlar.length} pozitsiya</span>
            </h2>

            <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-sm">
                <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Buyurtma</th>
                    <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                    <th className="px-4 py-2.5 font-medium">O&apos;lcham</th>
                    <th className="px-4 py-2.5 font-medium">Mijoz</th>
                    <th className="px-4 py-2.5 font-medium">Tayyor</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {qatorlar.map((p) => (
                    <tr key={p.pozitsiyaId}>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/buyurtma/${String(p.buyurtmaId)}`}
                          className="font-medium text-matn hover:underline"
                        >
                          {p.buyurtmaRaqami}
                        </Link>
                        <span className="ml-1 text-xs text-matn-kuchsiz">poz. {p.tartib}</span>
                      </td>
                      <td className="px-4 py-2.5">{p.mahsulot}</td>
                      <td className="raqam px-4 py-2.5 text-matn-ikki">
                        {p.eniSm}×{p.boyiSm}
                      </td>
                      <td className="px-4 py-2.5 text-matn-ikki">
                        {p.mijozIsmi ?? <span className="text-matn-kuchsiz">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-matn-kuchsiz">{sana(p.tayyorSana)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {qabulQilaOladi && <YetibKeldiTugmasi pozitsiyaId={p.pozitsiyaId} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
