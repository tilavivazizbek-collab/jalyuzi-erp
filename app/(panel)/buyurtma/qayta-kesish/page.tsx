import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { QK_SABAB_NOMI, type QaytaKesishSababi } from '@/lib/amal/qayta-kesish';
import { ochiqQaytaKesishlar } from '../malumot';
import { HalQilishFormasi } from './forma';

export const dynamic = 'force-dynamic';

export default async function QaytaKesishSahifasi() {
  const f = await sahifaRuxsati('buyurtma.brak');
  const sorovlar = await ochiqQaytaKesishlar(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/buyurtma" className="text-sm text-slate-500 hover:text-slate-900">
          ← Buyurtmalar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Qayta kesish</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ishlab chiqarish braki — material ikkinchi marta yechiladi (8.17).
          Ombor braki (7.10) dan boshqa narsa.
        </p>
      </div>

      {sorovlar.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Hal qilinmagan so&apos;rov yo&apos;q.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sorovlar.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <Link
                    href={`/buyurtma/${String(s.buyurtmaId)}`}
                    className="font-mono text-xs underline underline-offset-2"
                  >
                    {s.buyurtmaRaqam}
                  </Link>
                  <span className="ml-2 text-sm">
                    {s.tartib}. {s.turNomi}
                  </span>
                  <span className="raqam ml-2 text-sm text-slate-600">
                    {s.eniSm} × {s.boyiSm} sm
                  </span>
                  <div className="mt-1 text-xs text-slate-500">
                    {s.ustaIsmi} · {QK_SABAB_NOMI[s.sabab as QaytaKesishSababi] ?? s.sabab}
                    {s.izoh !== null && ` · ${s.izoh}`}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  {s.sana.toLocaleDateString('uz-UZ')}
                </div>
              </div>

              {/* TZ 8.17.8 — takroriy brak adminga KO'RSATILADI (EC-BRK-03) */}
              {s.oldingiSoni > 0 && (
                <p className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
                  ⚠️ Bu pozitsiya <b>{s.oldingiSoni} marta</b> qayta kesilgan.
                  Material yo&apos;qotishi:{' '}
                  <b className="raqam">{s.yoqotilganKvM.toFixed(2)} kv.m</b> ·{' '}
                  <b className="raqam">{pulKorsat(som(s.yoqotilganSumma))}</b>
                </p>
              )}

              <HalQilishFormasi sorovId={s.id} sabab={s.sabab} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
