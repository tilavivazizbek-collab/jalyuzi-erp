'use client';

import { useMemo, useState } from 'react';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { sm, type SarflashBirligi } from '@/lib/domain/birlik';
import { pulKorsat, som, kopaytir, qosh, nolSom } from '@/lib/domain/pul';
import { biznesXatosimi } from '@/lib/xato';

/**
 * TZ 4.8 — TEST KALKULYATORI.
 *
 * «Saqlashdan OLDIN o'lcham kiritib tekshiriladi: qaysi materialdan qancha
 *  ketishi va narx qancha chiqishi darhol ko'rinadi. Formuladagi xato shu
 *  yerda ko'rinadi — mijozga sotgandan keyin emas.»
 *
 * ⚠️ Bu yerda `lib/domain/formula.ts` ning O'ZI ishlaydi — brauzerda.
 * Sotuv ekrani, bot va ombordan yechish ham aynan shu funksiyani chaqiradi
 * (QISM 1 §2.2). Ya'ni bu yerda ko'rgan raqamingiz keyin ham shu chiqadi.
 */

export interface SlotHolati {
  readonly nom: string;
  readonly formula: string;
  readonly guruhId: number | null;
}

export interface GuruhMalumoti {
  readonly id: number;
  readonly nom: string;
  readonly sarflashBirligi: SarflashBirligi;
  /** Guruhdagi materiallardan biri — narx namunasi uchun */
  readonly namunaNarx: string | null;
  readonly namunaNom: string | null;
}

export interface ParametrHolati {
  readonly kod: string;
  readonly qiymat: string;
}

const BIRLIK_MATNI: Record<SarflashBirligi, string> = {
  KV_M: 'kv.m',
  SM: 'sm',
  DONA: 'dona',
};

interface Qator {
  readonly nom: string;
  readonly natija: string;
  readonly summa: string | null;
  readonly xato: string | null;
}

export function TestKalkulyatori({
  slotlar,
  parametrlar,
  guruhlar,
  xizmatHaqi,
}: {
  slotlar: readonly SlotHolati[];
  parametrlar: readonly ParametrHolati[];
  guruhlar: readonly GuruhMalumoti[];
  xizmatHaqi: string;
}) {
  const [eni, setEni] = useState('180');
  const [boyi, setBoyi] = useState('220');
  const [soni, setSoni] = useState('1');

  const natija = useMemo(() => {
    const e = Number(eni);
    const b = Number(boyi);
    const s = Number(soni);
    if (!Number.isFinite(e) || !Number.isFinite(b) || e <= 0 || b <= 0) {
      return { qatorlar: [] as Qator[], jami: null as string | null, umumiy: null as string | null };
    }

    const qoshimcha: Record<string, number> = {};
    for (const p of parametrlar) {
      const q = Number(p.qiymat);
      if (p.kod !== '' && Number.isFinite(q)) qoshimcha[p.kod] = q;
    }

    let qiymatlar;
    try {
      qiymatlar = standartQiymatlar(sm(e), sm(b), Number.isFinite(s) ? s : 1, qoshimcha);
    } catch {
      return { qatorlar: [], jami: null, umumiy: null };
    }

    let jami = nolSom();
    let narxBor = false;

    const qatorlar: Qator[] = slotlar.map((slot) => {
      const guruh = guruhlar.find((g) => g.id === slot.guruhId);
      const birlik: SarflashBirligi = guruh?.sarflashBirligi ?? 'KV_M';

      try {
        const miqdor = sarflashHisobla(slot.formula, qiymatlar, birlik);

        // TZ 5.4 — chiziqli materialning narxi 1 METR uchun (Q-01)
        let summa: string | null = null;
        if (guruh?.namunaNarx !== undefined && guruh.namunaNarx !== null && guruh.namunaNarx !== '') {
          const koeff = birlik === 'SM' ? miqdor / 100 : miqdor;
          const qiymat = kopaytir(som(guruh.namunaNarx), koeff);
          jami = qosh(jami, qiymat);
          narxBor = true;
          summa = pulKorsat(qiymat);
        }

        return {
          nom: slot.nom === '' ? '(nomsiz slot)' : slot.nom,
          natija: `${String(miqdor)} ${BIRLIK_MATNI[birlik]}`,
          summa,
          xato: null,
        };
      } catch (x) {
        return {
          nom: slot.nom === '' ? '(nomsiz slot)' : slot.nom,
          natija: '—',
          summa: null,
          xato: biznesXatosimi(x) ? x.message : 'formulani hisoblab bo\'lmadi',
        };
      }
    });

    const haq = Number(xizmatHaqi);
    const umumiy =
      narxBor && Number.isFinite(haq) && haq > 0
        ? pulKorsat(qosh(jami, som(xizmatHaqi)))
        : narxBor
          ? pulKorsat(jami)
          : null;

    return { qatorlar, jami: narxBor ? pulKorsat(jami) : null, umumiy };
  }, [eni, boyi, soni, slotlar, parametrlar, guruhlar, xizmatHaqi]);

  const kirish =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Test kalkulyatori</h2>
      <p className="mt-1 text-xs text-slate-500">
        TZ 4.8 — formuladagi xato <b>shu yerda</b> ko&apos;rinadi, mijozga sotgandan
        keyin emas. Barcha o&apos;lcham santimetrda (5.3).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Eni (sm)</span>
          <input value={eni} onChange={(e) => { setEni(e.target.value); }} inputMode="numeric" className={kirish} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Bo&apos;yi (sm)</span>
          <input value={boyi} onChange={(e) => { setBoyi(e.target.value); }} inputMode="numeric" className={kirish} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Soni</span>
          <input value={soni} onChange={(e) => { setSoni(e.target.value); }} inputMode="numeric" className={kirish} />
        </label>
      </div>

      {natija.qatorlar.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">O&apos;lchamni kiriting.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Slot</th>
              <th className="pb-2 font-medium">Sarflanadi</th>
              <th className="pb-2 text-right font-medium">Summa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {natija.qatorlar.map((q, i) => (
              <tr key={`${q.nom}-${String(i)}`}>
                <td className="py-2">{q.nom}</td>
                <td className="py-2">
                  {q.xato === null ? (
                    <span className="font-medium">{q.natija}</span>
                  ) : (
                    <span className="text-red-700">{q.xato}</span>
                  )}
                </td>
                <td className="raqam py-2">
                  {q.summa ?? <span className="text-slate-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {natija.umumiy !== null && (
            <tfoot className="border-t border-slate-200">
              <tr>
                <td className="pt-2 text-xs text-slate-500" colSpan={2}>
                  Namuna narxlar bo&apos;yicha taxminiy summa
                  {Number(xizmatHaqi) > 0 ? ' (xizmat haqi bilan)' : ''}
                </td>
                <td className="raqam pt-2 font-semibold">{natija.umumiy}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Summa guruhdagi namuna materialning narxi bo&apos;yicha. Haqiqiy narx sotuvda
        tanlangan matoga qarab chiqadi (3.8).
      </p>
    </div>
  );
}
