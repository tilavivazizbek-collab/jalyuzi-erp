'use client';

import { useMemo, useState } from 'react';
import { slotSarfi, soniUchun, standartQiymatlar } from '@/lib/domain/formula';
import { kesimOlchami } from '@/lib/domain/kesish';
import { m, type SarflashBirligi } from '@/lib/domain/birlik';
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
  /** AUDIT 1-topilma — sarf koeffitsienti */
  readonly koeffitsient: number;
  /**
   * Kesish yo'nalishi va qat'iy kesim eni — 2026-09-23.
   *
   * ⚠️ Bularsiz kalkulyator faqat KV.M ko'rsatardi, egasi esa
   *    rulondan NECHA METR tortilishini bilmasdi. «8 kv.m» degan
   *    raqam dikkeyda «0.40 × 20.00» degani — ya'ni 20 metr. Bu
   *    ikkisi bir xil emas va omborda aynan ikkinchisi yechiladi.
   */
  readonly kesishTuri: 'ENIGA' | "BO'YIGA";
  readonly kesimEniM: string;
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
  M: 'm',
  DONA: 'dona',
};

interface Qator {
  readonly nom: string;
  readonly natija: string;
  /** «0.40 × 20.00 m» — rulondan aynan shu to'rtburchak kesiladi */
  readonly kesim: string | null;
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
      return {
        qatorlar: [] as Qator[],
        jami: null as string | null,
        umumiy: null as string | null,
      };
    }

    const qoshimcha: Record<string, number> = {};
    for (const p of parametrlar) {
      const q = Number(p.qiymat);
      if (p.kod !== '' && Number.isFinite(q)) qoshimcha[p.kod] = q;
    }

    /**
     * Soni — butun va kamida 1. `kesimOlchami` butun son talab
     * qiladi («3.5 ta parda» degan narsa yo'q), shuning uchun bir
     * joyda tozalanadi va ikkala hisobga ham SHU beriladi.
     */
    const sonAdadi = Number.isFinite(s) && s >= 1 ? Math.floor(s) : 1;

    let qiymatlar;
    try {
      qiymatlar = standartQiymatlar(m(e), m(b), sonAdadi, qoshimcha);
    } catch {
      return { qatorlar: [], jami: null, umumiy: null };
    }

    let jami = nolSom();
    let narxBor = false;

    const qatorlar: Qator[] = slotlar.map((slot) => {
      const guruh = guruhlar.find((g) => g.id === slot.guruhId);
      const birlik: SarflashBirligi = guruh?.sarflashBirligi ?? 'KV_M';

      try {
        const bir = slotSarfi(slot.formula, qiymatlar, birlik, slot.koeffitsient);
        /**
         * ⚠️ SONI ga KO'PAYTIRISH — 2026-09-23 da qo'shildi.
         *
         *    Bu yerda `soniUchun` yo'q edi: «Soni 3» yozilsa ham
         *    kalkulyator BITTA pardaning sarfini ko'rsatardi, sotuv
         *    esa uchtasini yechardi (`pozitsiya-narxi.ts:143`).
         *    Ya'ni «bu yerda ko'rgan raqamingiz keyin ham shu
         *    chiqadi» degan va'da uchta buyumda buzilardi.
         */
        const miqdor = soniUchun(slot.formula, bir, sonAdadi);

        /**
         * KESIM TO'RTBURCHAGI — egasi so'rovi 2026-09-23:
         * «mato sarfi ham kv.da ham eni va bo'yida ko'rsatilsin».
         *
         * ⚠️ Hisob DOMAINDAN (`kesimOlchami`) — band qilish, ustaning
         *    «Tugatdim» ekrani va bot ham AYNAN shu funksiyani
         *    chaqiradi (CLAUDE.md §3). Bu yerda alohida hisoblansa
         *    ekrandagi raqam ombordagidan farq qilib qolardi.
         */
        let kesim: string | null = null;
        if (birlik === 'KV_M') {
          const qatiy = slot.kesimEniM.trim();
          const qatiySon = qatiy === '' ? null : Number(qatiy);
          try {
            const k = kesimOlchami(miqdor, b, {
              koeffitsient: slot.koeffitsient,
              yonalish: slot.kesishTuri,
              /** T-12 — to'rtburchak BITTA buyum uchun, jami emas */
              soni: sonAdadi,
              kesimEniM:
                qatiySon !== null && Number.isFinite(qatiySon) && qatiySon > 0
                  ? qatiySon
                  : null,
            });
            kesim = `${k.eniM.toFixed(2)} × ${k.boyiM.toFixed(2)} m`;
          } catch {
            /** O'lcham mumkin bo'lmasa kv.m baribir ko'rsatiladi */
            kesim = null;
          }
        }

        // TZ 5.4 — chiziqli materialning narxi 1 METR uchun (Q-01)
        let summa: string | null = null;
        if (
          guruh?.namunaNarx !== undefined &&
          guruh.namunaNarx !== null &&
          guruh.namunaNarx !== ''
        ) {
          // ⚠️ 2026-09-20 — sarf ham, narx ham 1 METR uchun: ÷100 kerak emas
          const koeff = miqdor;
          const qiymat = kopaytir(som(guruh.namunaNarx), koeff);
          jami = qosh(jami, qiymat);
          narxBor = true;
          summa = pulKorsat(qiymat);
        }

        return {
          nom: slot.nom === '' ? '(nomsiz slot)' : slot.nom,
          natija: `${String(miqdor)} ${BIRLIK_MATNI[birlik]}`,
          kesim,
          summa,
          xato: null,
        };
      } catch (x) {
        return {
          nom: slot.nom === '' ? '(nomsiz slot)' : slot.nom,
          natija: '—',
          kesim: null,
          summa: null,
          xato: biznesXatosimi(x) ? x.message : "formulani hisoblab bo'lmadi",
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
    'w-full rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25';

  return (
    <div className="rounded-karta border border-chegara bg-sirt p-5">
      <h2 className="text-sm font-semibold text-matn">Test kalkulyatori</h2>
      <p className="mt-1 text-xs text-matn-kuchsiz">
        TZ 4.8 — formuladagi xato <b>shu yerda</b> ko&apos;rinadi, mijozga sotgandan keyin emas.
        Barcha o&apos;lcham METRDA (2026-09-20).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-matn-ikki">Eni (m)</span>
          <input
            value={eni}
            onChange={(e) => {
              setEni(e.target.value);
            }}
            inputMode="numeric"
            className={kirish}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-matn-ikki">Bo&apos;yi (m)</span>
          <input
            value={boyi}
            onChange={(e) => {
              setBoyi(e.target.value);
            }}
            inputMode="numeric"
            className={kirish}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-matn-ikki">Soni</span>
          <input
            value={soni}
            onChange={(e) => {
              setSoni(e.target.value);
            }}
            inputMode="numeric"
            className={kirish}
          />
        </label>
      </div>

      {natija.qatorlar.length === 0 ? (
        <p className="mt-4 text-sm text-matn-kuchsiz">O&apos;lchamni kiriting.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="pb-2 font-medium">Slot</th>
              <th className="pb-2 font-medium">Sarflanadi</th>
              <th className="pb-2 font-medium">Kesim (eni × bo&apos;yi)</th>
              <th className="pb-2 text-right font-medium">Summa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {natija.qatorlar.map((q, i) => (
              <tr key={`${q.nom}-${String(i)}`}>
                <td className="py-2">{q.nom}</td>
                <td className="py-2">
                  {q.xato === null ? (
                    <span className="font-medium">{q.natija}</span>
                  ) : (
                    <span className="text-belgi-qizil">{q.xato}</span>
                  )}
                </td>
                {/*
                  KESIM ALOHIDA USTUN — egasi so'rovi 2026-09-23.

                  «8 kv.m» dan rulondan necha metr ketishi
                  KO'RINMAYDI: dikkeyda u «0.40 × 20.00», ya'ni
                  yigirma metr. Ombordan aynan shu to'rtburchak
                  yechiladi, kv.m esa faqat narx uchun.
                */}
                <td className="raqam py-2 text-[12px] text-matn-ikki">
                  {q.kesim ?? <span className="text-matn-kuchsiz">—</span>}
                </td>
                <td className="raqam py-2">
                  {q.summa ?? <span className="text-matn-kuchsiz">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {natija.umumiy !== null && (
            <tfoot className="border-t border-chegara">
              <tr>
                <td className="pt-2 text-xs text-matn-kuchsiz" colSpan={3}>
                  Namuna narxlar bo&apos;yicha taxminiy summa
                  {Number(xizmatHaqi) > 0 ? ' (xizmat haqi bilan)' : ''}
                </td>
                <td className="raqam pt-2 font-semibold">{natija.umumiy}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}

      <p className="mt-3 text-xs text-matn-kuchsiz">
        <b>Kesim</b> — rulondan kesib olinadigan to&apos;rtburchak, BITTA
        buyum uchun. Ombordan aynan shu o&apos;lcham yechiladi: qat&apos;iy kesim
        eni berilgan slotda (dikkey lameli) eni o&apos;zgarmaydi, bo&apos;yi esa
        maydondan chiqadi.
        <br />
        Summa guruhdagi namuna materialning narxi bo&apos;yicha. Haqiqiy narx sotuvda tanlangan
        matoga qarab chiqadi (3.8).
      </p>
    </div>
  );
}
