import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import type { Olcham } from '@/lib/domain/kesish';
import { OddiyChopTugmasi } from '../../../chop-tugma';
import { ishVaraqasi, type VaraqPozitsiya } from './malumot';

export const dynamic = 'force-dynamic';

/**
 * `/buyurtma/[id]/ish-varaqasi` — TZ 8.14 · 7.4. 2026-10-15
 *
 * USTA UCHUN A4 VARAQ: har pozitsiya — o'lcham, mato va kesim, qaysi
 * bo'lakdan, aksessuar, tanlov, izoh. Ostida «Bajardi» katagi.
 *
 * ⚠️ Narx yo'q (malumot.ts). Jurnalsiz — necha marta chop etilsa ham bo'ladi.
 */
const SANA = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: VAQT_ZONASI,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const o = (x: Olcham): string => `${x.eniM.toFixed(2)} × ${x.boyiM.toFixed(2)} m`;
const son = (x: string): string => String(Number(x));
const birlik = (b: string): string => SARFLASH_BIRLIGI_NOMI[b as SarflashBirligi] ?? b;

export default async function IshVaraqasiSahifasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('buyurtma.kor');
  const { id } = await params;
  const buyurtmaId = Number(id);
  if (!Number.isSafeInteger(buyurtmaId) || buyurtmaId <= 0) notFound();

  const v = await ishVaraqasi(buyurtmaId, f.filialId);
  if (v === null) notFound();

  return (
    <div className="flex flex-col gap-4">
      {/* ⚠️ Bu blok chop etilmaydi — `.varaqa` dan tashqarida */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/buyurtma/${String(buyurtmaId)}`} className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Buyurtma kartochkasi
        </Link>
        <OddiyChopTugmasi matn="Ish varaqasini chop etish" />
      </div>

      <style>{'@media print { @page { size: A4; margin: 12mm } }'}</style>
      <div className="varaqa rounded-karta border border-chegara bg-white p-6 text-black">
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-neutral-300 pb-3">
          <div>
            <p className="text-xl font-bold">Ish varaqasi · {v.raqam}</p>
            <p className="text-sm text-neutral-500">
              {SANA.format(v.sana)} · sotuvchi {v.sotuvchi} · tikadi: {v.ishlabChiqaruvchi}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-neutral-500">Tayyor bo&apos;lishi</p>
            <p className="text-lg font-bold">{v.tayyorlikSana ?? '—'}</p>
          </div>
        </div>

        {v.mijoz !== null && (
          <p className="mb-4 text-sm">
            <b>Mijoz:</b> {v.mijoz.ism}
            {v.mijoz.telefon !== null && <> · {v.mijoz.telefon}</>}
            {v.mijoz.manzil !== null && v.mijoz.manzil !== '' && <> · {v.mijoz.manzil}</>}
          </p>
        )}

        {v.pozitsiyalar.length === 0 ? (
          <p className="text-sm">Tikiladigan pozitsiya yo&apos;q.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {v.pozitsiyalar.map((p) => (
              <Pozitsiya key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pozitsiya({ p }: { p: VaraqPozitsiya }) {
  return (
    <section className="break-inside-avoid rounded border border-neutral-400 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-bold">
          {p.tartib}. {p.tur}
          {p.eniM !== null && p.boyiM !== null && (
            <span className="ml-2 font-mono">
              {Number(p.eniM).toFixed(2)} × {Number(p.boyiM).toFixed(2)} m
            </span>
          )}
          {p.soni > 1 && <span className="ml-2">× {p.soni} dona</span>}
        </p>
        <p className="text-xs text-neutral-500">
          {HOLAT_NOMI[p.holat as PozitsiyaHolati] ?? p.holat}
          {p.usta !== null && <> · usta {p.usta}</>}
        </p>
      </div>

      {(p.yorliq !== null || p.ornatish !== null || p.oyna !== null) && (
        <p className="mt-1 text-sm">
          {p.yorliq !== null && <><b>Joyi:</b> {p.yorliq} </>}
          {p.ornatish !== null && <><b>O&apos;rnatish:</b> {p.ornatish} </>}
          {p.oyna !== null && <><b>Oyna:</b> {p.oyna} m</>}
        </p>
      )}
      {p.tanlovlar.length > 0 && <p className="mt-1 text-sm">{p.tanlovlar.join(' · ')}</p>}

      {p.matolar.length > 0 && (
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs text-neutral-500">
              <th className="py-1 pr-2 font-medium">Mato</th>
              <th className="py-1 pr-2 font-medium">Sarf</th>
              <th className="py-1 pr-2 font-medium">Kesim (1 dona)</th>
              <th className="py-1 font-medium">Bo&apos;lak</th>
            </tr>
          </thead>
          <tbody>
            {p.matolar.map((m, i) => (
              <tr key={i} className="border-b border-neutral-200 last:border-0">
                <td className="py-1 pr-2">
                  {m.material}
                  <span className="text-xs text-neutral-500"> · {m.slot}</span>
                </td>
                <td className="py-1 pr-2 font-mono">
                  {son(m.miqdor)} {birlik(m.birlik)}
                </td>
                <td className="py-1 pr-2 font-mono font-bold">{m.kesim === null ? '—' : o(m.kesim)}</td>
                <td className="py-1">
                  {m.bolak === null ? (
                    <span className="font-semibold">band qilinmagan — omborchidan so&apos;rang</span>
                  ) : (
                    <>
                      <span className="font-mono font-bold">{m.bolak.kod}</span>
                      <span className="text-xs text-neutral-500">
                        {' '}
                        {m.bolak.turi === 'OSTATKA' ? 'ostatka' : 'rulon'}
                        {m.bolak.olcham !== null && <> · {o(m.bolak.olcham)}</>}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(p.aksessuarlar.length > 0 || p.qoshimchalar.length > 0) && (
        <p className="mt-2 text-sm">
          <b>Aksessuar:</b>{' '}
          {[
            ...p.aksessuarlar.map((a) => `${a.nom} — ${son(a.soni)} ${birlik(a.birlik)}`),
            ...p.qoshimchalar,
          ].join(' · ')}
        </p>
      )}

      {p.izoh !== null && p.izoh !== '' && (
        <p className="mt-2 rounded bg-neutral-100 px-2 py-1 text-sm">
          <b>Izoh:</b> {p.izoh}
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-500">Bajardi: ______________________ Sana: ____________</p>
    </section>
  );
}
