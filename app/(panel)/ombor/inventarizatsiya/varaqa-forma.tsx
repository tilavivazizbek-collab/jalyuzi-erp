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
          e === null || b === null ? null : e * b - (s.tizimdaEniM ?? 0) * (s.tizimdaBoyiM ?? 0);
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
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {holat.manfiyQoldiq.length > 0 && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq ">
          Qoldiq manfiyga tushdi: <b>{holat.manfiyQoldiq.join(', ')}</b>. Bu ruxsat etilgan
          (2.5-invariant), lekin admin tuzatgunicha qizil turadi.
        </p>
      )}

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-3 py-2.5 font-medium">Mahsulot</th>
              <th className="px-3 py-2.5 font-medium">Bo&apos;lak</th>
              <th className="px-3 py-2.5 font-medium">Band</th>
              <th className="px-3 py-2.5 text-right font-medium">Tizimda</th>
              <th className="px-3 py-2.5 font-medium">Haqiqatda</th>
              <th className="px-3 py-2.5 text-right font-medium">Farq</th>
              <th className="px-3 py-2.5 font-medium">Sabab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {satrlar.map((s) => {
              const k = ol(s.qatorId);
              const dona = s.turi === 'DONA';
              const farq = farqlar[s.qatorId] ?? null;
              const birlik = dona ? (s.sarflashBirligi === 'SM' ? 'sm' : 'dona') : 'kv.m';

              return (
                <tr key={s.qatorId} className={s.yolda ? 'bg-fon text-matn-kuchsiz' : ''}>
                  <td className="px-3 py-2">{s.materialNomi}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.kod}</td>
                  <td className="px-3 py-2 text-xs">
                    {s.yolda ? (
                      <span className="text-matn-kuchsiz">yo&apos;lda</span>
                    ) : s.band ? (
                      <span className="text-belgi-sariq">band</span>
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
                        <span className="text-matn-kuchsiz">×</span>
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
                        <span className="text-xs text-matn-kuchsiz">m</span>
                      </span>
                    )}
                  </td>
                  <td
                    className={`raqam px-3 py-2 whitespace-nowrap ${
                      farq === null || farq === 0
                        ? 'text-matn-kuchsiz'
                        : farq < 0
                          ? 'text-belgi-qizil'
                          : 'text-belgi-yashil'
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

      <div className="flex flex-wrap items-center gap-4 text-sm text-matn-ikki">
        <span>
          Sanalgan: <b>{sanalgan}</b> / {satrlar.length}
        </span>
        <span>
          Farq chiqqan: <b>{farqli}</b>
        </span>
      </div>

      <p className="rounded-maydon bg-fon px-3 py-2.5 text-xs text-matn-ikki ">
        Bo&apos;sh qoldirilgan qator qoldiqqa <b>tegmaydi</b> — qisman sanash shunday ishlaydi
        (15.1). Farq chiqqan qatorda sabab majburiy. Yakunlangach qoldiq darhol o&apos;zgaradi va
        adminga xabar ketadi.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda || sanalgan === 0}
          className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
        >
          {kutilmoqda ? 'Yakunlanmoqda…' : 'Yakunlash'}
        </button>
        <Link href="/ombor/inventarizatsiya" className="text-sm text-matn-kuchsiz hover:text-matn">
          Keyinroq
        </Link>
      </div>
    </form>
  );
}
