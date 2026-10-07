import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { XARID_SABABI_NOMI, ZAXIRA_KUNI, type XaridSababi } from '@/lib/domain/xarid-kerak';
import { buyurtmaKerak, type KerakQatori } from '../kerak-malumot';

export const dynamic = 'force-dynamic';

const SABAB_RANGI: Readonly<Record<XaridSababi, string>> = {
  TUGAGAN: 'bg-belgi-qizil-fon text-belgi-qizil',
  KAM: 'bg-belgi-sariq-fon text-belgi-sariq',
  TEZ_TUGAYDI: 'bg-belgi-sariq-fon text-belgi-sariq',
};

const son = (x: number): string => String(Math.round(x * 100) / 100);

/**
 * «Buyurtma kerak» — ombor auditi 2026-10-07, 8-band.
 *
 * ⚠️ Yetkazib beruvchi bo'yicha GURUHLANADI: bitta xarid buyurtmasi —
 *    bitta yetkazib beruvchi. Belgilanganlar bilan forma oddiy GET:
 *    `/ombor/xarid/yangi?yetkazib=..&material=..&material=..`.
 * ⚠️ Pul yo'q — sotuvchi ham ko'rsa bo'ladi (11.10).
 */
export default async function BuyurtmaKerak() {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const yarataOladi = ruxsatBormi(f, 'ombor.kirim.yarat');
  const royxat = await buyurtmaKerak(f.filialId);

  const guruhlar = new Map<string, { nom: string; yetkazibId: number | null; qatorlar: KerakQatori[] }>();
  for (const q of royxat) {
    const k = q.oxirgiYetkazib === null ? 'yoq' : String(q.oxirgiYetkazib.id);
    const g = guruhlar.get(k) ?? {
      nom: q.oxirgiYetkazib?.nom ?? 'Yetkazib beruvchisi noma’lum',
      yetkazibId: q.oxirgiYetkazib?.id ?? null,
      qatorlar: [],
    };
    g.qatorlar.push(q);
    guruhlar.set(k, g);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/ombor/xarid" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Xarid buyurtmalari
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Buyurtma kerak</h1>
        <p className="mt-1 max-w-3xl text-sm text-matn-kuchsiz">
          Tugagan, chegaradan kam qolgan yoki <b>yetkazib berilguncha tugaydigan</b> materiallar.
          Muddat o&apos;tgan buyurtmalardan o&apos;lchanadi (buyurtma → kirim); tarix bo&apos;lmasa
          14 kun olinadi. Ustiga {ZAXIRA_KUNI} kun zaxira qo&apos;shiladi. Sarf tezligi — oxirgi
          90 kun, taxminiy.
        </p>
      </div>

      {royxat.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hozir buyurtma kerak bo&apos;lgan material yo&apos;q.
        </p>
      ) : (
        [...guruhlar.values()].map((g) => (
          <form
            key={g.nom}
            action="/ombor/xarid/yangi"
            method="get"
            className="overflow-x-auto rounded-karta border border-chegara bg-sirt"
          >
            {g.yetkazibId !== null && <input type="hidden" name="yetkazib" value={g.yetkazibId} />}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-chegara px-4 py-2.5">
              <h2 className="text-sm font-semibold">{g.nom}</h2>
              {yarataOladi && (
                <button
                  type="submit"
                  className="rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-tugma-matn hover:bg-brend-quyuq"
                >
                  Belgilanganlarga buyurtma tuzish
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  {yarataOladi && <th className="w-8 px-4 py-2" />}
                  <th className="px-4 py-2 font-medium">Material</th>
                  <th className="px-4 py-2 font-medium">Sabab</th>
                  <th className="px-4 py-2 text-right font-medium">Qoldiq</th>
                  <th className="px-4 py-2 text-right font-medium">Sarf / kun</th>
                  <th className="px-4 py-2 text-right font-medium">Yetadi</th>
                  <th className="px-4 py-2 text-right font-medium">Kelish muddati</th>
                  <th className="px-4 py-2 text-right font-medium">Tavsiya</th>
                  <th className="px-4 py-2 font-medium">Yo&apos;lda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara">
                {g.qatorlar.map((q) => {
                  const yolda = q.yoldaBuyurtma.length > 0 || q.kochirishdaYolda;
                  return (
                    <tr key={q.materialId} className={yolda ? 'text-matn-ikki' : ''}>
                      {yarataOladi && (
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            name="material"
                            value={q.materialId}
                            defaultChecked={!yolda}
                            aria-label={`${q.nom} — buyurtmaga qo'shish`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-2">
                        <Link href={`/ombor/${String(q.materialId)}`} className="hover:underline">
                          {q.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SABAB_RANGI[q.sababi]}`}>
                          {XARID_SABABI_NOMI[q.sababi]}
                        </span>
                      </td>
                      <td className="raqam px-4 py-2 text-right">
                        {son(q.qoldiq)} {q.qoldiqBirligi}
                        {q.chegara !== null && (
                          <span className="block text-[11px] text-matn-kuchsiz">
                            chegara {son(q.chegara)} {q.qoldiqBirligi}
                          </span>
                        )}
                      </td>
                      <td className="raqam px-4 py-2 text-right">
                        {q.kunlikSarf === null ? '—' : `${q.kunlikSarf} ${q.sarfBirligi}`}
                      </td>
                      <td className="raqam px-4 py-2 text-right">
                        {q.bashorat === null || q.bashorat.kunlar === null ? '—' : `~${String(q.bashorat.kunlar)} kun`}
                      </td>
                      <td className="raqam px-4 py-2 text-right">
                        {q.yetkazish.kun} kun
                        <span className="block text-[11px] text-matn-kuchsiz">
                          {q.yetkazish.manba === 'TARIX' ? 'tarixdan' : 'standart'}
                        </span>
                      </td>
                      <td className="raqam px-4 py-2 text-right">
                        {q.tavsiya === null || q.tavsiya === '0' ? '—' : `~${q.tavsiya} ${q.sarfBirligi}`}
                      </td>
                      <td className="px-4 py-2 text-[13px]">
                        {q.yoldaBuyurtma.map((y) => (
                          <Link
                            key={y.xaridId}
                            href={`/ombor/xarid/${String(y.xaridId)}`}
                            className="mr-2 text-brend hover:underline"
                          >
                            {y.raqam}: {y.qolgan.replace(/\.00$/, '')} {y.kirimBirligi}
                          </Link>
                        ))}
                        {q.kochirishdaYolda && <span className="text-matn-kuchsiz">filialdan ko&apos;chirish</span>}
                        {!yolda && <span className="text-matn-kuchsiz">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </form>
        ))
      )}
    </div>
  );
}
