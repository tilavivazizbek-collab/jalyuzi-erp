'use client';

/**
 * TZ 15.1 — sanash varaqasi.
 *
 * ⚠️ AUDIT Z-05 (KRITIK) — omborchi METRDA yozadi: eni va bo'yi alohida.
 *    Kv.m ustuni FAQAT ko'rsatish uchun va tahrirlanmaydi. Bir paytlar
 *    varaqada «kv.m» sarlavhasi ostida rulonning bo'yi turgan edi va
 *    omborchi 28 yozganda tizim 84 kutardi.
 *
 * ⚠️ AUDIT U-06 — «Band» ustuni bor: band bo'lak jismonan omborda va
 *    SANALADI, lekin omborchi nimaga solishtirayotganini bilishi kerak.
 */

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { kirishUslubi } from '../../maydon';
import { INV_SABAB_NOMI, INVENTARIZATSIYA_SABABLARI } from '@/lib/domain/inventarizatsiya';
import { varaqaYakunlaAmali } from './amal';
import { BOSH_HOLAT } from './holat';

export interface SatrKorinishi {
  readonly qatorId: number;
  readonly kod: string;
  readonly turi: string;
  readonly materialNomi: string;
  readonly sarflashBirligi: string;
  readonly tizimdaEniM: number | null;
  readonly tizimdaBoyiM: number | null;
  readonly tizimdaMiqdor: number | null;
  readonly band: boolean;
  readonly yolda: boolean;
}

interface Kiritma {
  eniM: string;
  boyiM: string;
  miqdor: string;
  sabab: string;
  izoh: string;
}

const BOSH_KIRITMA: Kiritma = { eniM: '', boyiM: '', miqdor: '', sabab: '', izoh: '' };

const son = (x: string): number | null => {
  const t = x.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function VaraqaFormasi({
  varaqaId,
  satrlar,
}: {
  varaqaId: number;
  satrlar: readonly SatrKorinishi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(varaqaYakunlaAmali, BOSH_HOLAT);
  const [kiritmalar, kiritmalarniOzgartir] = useState<Record<number, Kiritma>>({});

  const ol = (id: number): Kiritma => kiritmalar[id] ?? BOSH_KIRITMA;

  const yoz = (id: number, maydon: keyof Kiritma, qiymat: string): void => {
    kiritmalarniOzgartir((oldingi) => ({
      ...oldingi,
      [id]: { ...(oldingi[id] ?? BOSH_KIRITMA), [maydon]: qiymat },
    }));
  };

  /** Har satrning farqi — DARHOL ko'rinadi, saqlashni kutmaydi. */
  const farqlar = useMemo(() => {
    const natija: Record<number, number | null> = {};
    for (const s of satrlar) {
      if (s.yolda) {
        natija[s.qatorId] = null;
        continue;
      }
      const k = kiritmalar[s.qatorId] ?? BOSH_KIRITMA;
      const dona = s.turi === 'DONA';
      if (dona) {
        const m = son(k.miqdor);
        natija[s.qatorId] = m === null ? null : m - (s.tizimdaMiqdor ?? 0);
      } else {
        const e = son(k.eniM);
        const b = son(k.boyiM);
        natija[s.qatorId] =
          e === null || b === null
            ? null
            : e * b - (s.tizimdaEniM ?? 0) * (s.tizimdaBoyiM ?? 0);
      }
    }
    return natija;
  }, [kiritmalar, satrlar]);

  const yuborilajak = satrlar
    .filter((s) => {
      const k = ol(s.qatorId);
      return s.turi === 'DONA'
        ? son(k.miqdor) !== null
        : son(k.eniM) !== null && son(k.boyiM) !== null;
    })
    .map((s) => {
      const k = ol(s.qatorId);
      return {
        qatorId: s.qatorId,
        eniM: k.eniM.trim() === '' ? '' : k.eniM.trim(),
        boyiM: k.boyiM.trim() === '' ? '' : k.boyiM.trim(),
        miqdor: k.miqdor.trim() === '' ? '' : k.miqdor.trim(),
        sabab: k.sabab === '' ? null : k.sabab,
        izoh: k.izoh,
      };
    });

  const sanalgan = yuborilajak.length;
  const farqli = Object.values(farqlar).filter((f) => f !== null && f !== 0).length;

  return (
    <form action={yubor} className="flex flex-col gap-4">
      <input type="hidden" name="varaqaId" value={varaqaId} />
      <input type="hidden" name="qatorlar" value={JSON.stringify(yuborilajak)} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {holat.manfiyQoldiq.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
          Qoldiq manfiyga tushdi: <b>{holat.manfiyQoldiq.join(', ')}</b>. Bu
          ruxsat etilgan (2.5-invariant), lekin admin tuzatgunicha qizil turadi.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Material</th>
              <th className="px-3 py-2.5 font-medium">Bo&apos;lak</th>
              <th className="px-3 py-2.5 font-medium">Band</th>
              <th className="px-3 py-2.5 text-right font-medium">Tizimda</th>
              <th className="px-3 py-2.5 font-medium">Haqiqatda</th>
              <th className="px-3 py-2.5 text-right font-medium">Farq</th>
              <th className="px-3 py-2.5 font-medium">Sabab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {satrlar.map((s) => {
              const k = ol(s.qatorId);
              const dona = s.turi === 'DONA';
              const farq = farqlar[s.qatorId] ?? null;
              const birlik = dona ? (s.sarflashBirligi === 'SM' ? 'sm' : 'dona') : 'kv.m';

              return (
                <tr key={s.qatorId} className={s.yolda ? 'bg-slate-50 text-slate-400' : ''}>
                  <td className="px-3 py-2">{s.materialNomi}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.kod}</td>
                  <td className="px-3 py-2 text-xs">
                    {s.yolda ? (
                      <span className="text-slate-500">yo&apos;lda</span>
                    ) : s.band ? (
                      <span className="text-amber-700">band</span>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="raqam px-3 py-2 whitespace-nowrap">
                    {dona
                      ? `${String(s.tizimdaMiqdor ?? 0)} ${birlik}`
                      : `${(s.tizimdaEniM ?? 0).toFixed(2)} × ${(s.tizimdaBoyiM ?? 0).toFixed(2)} m`}
                  </td>
                  <td className="px-3 py-2">
                    {s.yolda ? (
                      <span className="text-xs">sanalmaydi (A-09)</span>
                    ) : dona ? (
                      <input
                        name={`miqdor-${String(s.qatorId)}`}
                        value={k.miqdor}
                        onChange={(e) => {
                          yoz(s.qatorId, 'miqdor', e.target.value);
                        }}
                        inputMode="decimal"
                        className={`${kirishUslubi(false)} w-24`}
                        placeholder={birlik}
                      />
                    ) : (
                      <span className="flex items-center gap-1">
                        <input
                          name={`eni-${String(s.qatorId)}`}
                          value={k.eniM}
                          onChange={(e) => {
                            yoz(s.qatorId, 'eniM', e.target.value);
                          }}
                          inputMode="decimal"
                          className={`${kirishUslubi(false)} w-20`}
                          placeholder="eni"
                        />
                        <span className="text-slate-400">×</span>
                        <input
                          name={`boyi-${String(s.qatorId)}`}
                          value={k.boyiM}
                          onChange={(e) => {
                            yoz(s.qatorId, 'boyiM', e.target.value);
                          }}
                          inputMode="decimal"
                          className={`${kirishUslubi(false)} w-20`}
                          placeholder="bo'yi"
                        />
                        <span className="text-xs text-slate-400">m</span>
                      </span>
                    )}
                  </td>
                  <td
                    className={`raqam px-3 py-2 whitespace-nowrap ${
                      farq === null || farq === 0
                        ? 'text-slate-400'
                        : farq < 0
                          ? 'text-red-700'
                          : 'text-emerald-700'
                    }`}
                  >
                    {farq === null ? '—' : `${farq > 0 ? '+' : ''}${farq.toFixed(2)} ${birlik}`}
                  </td>
                  <td className="px-3 py-2">
                    {farq !== null && farq !== 0 ? (
                      <select
                        value={k.sabab}
                        onChange={(e) => {
                          yoz(s.qatorId, 'sabab', e.target.value);
                        }}
                        className={`${kirishUslubi(false)} w-44`}
                      >
                        <option value="">— tanlang —</option>
                        {INVENTARIZATSIYA_SABABLARI.map((x) => (
                          <option key={x} value={x}>
                            {INV_SABAB_NOMI[x]}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span>
          Sanalgan: <b>{sanalgan}</b> / {satrlar.length}
        </span>
        <span>
          Farq chiqqan: <b>{farqli}</b>
        </span>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
        Bo&apos;sh qoldirilgan qator qoldiqqa <b>tegmaydi</b> — qisman sanash
        shunday ishlaydi (15.1). Farq chiqqan qatorda sabab majburiy.
        Yakunlangach qoldiq darhol o&apos;zgaradi va adminga xabar ketadi.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda || sanalgan === 0}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {kutilmoqda ? 'Yakunlanmoqda…' : 'Yakunlash'}
        </button>
        <Link
          href="/ombor/inventarizatsiya"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Keyinroq
        </Link>
      </div>
    </form>
  );
}
