'use client';

/**
 * app/(panel)/sotuv/qoshimcha.tsx — savatga qo'shimcha mahsulot.
 *
 * ⚠️ NEGA KERAK
 *
 * Egasi: «mijoz yana qo'shimcha xohladi — uyidagi eski mexanizm
 * buzilgani uchun bittasini alohida olay».
 *
 * Bunday buyum TAYYORLANMAYDI: o'lchov olinmaydi, kesilmaydi,
 * usta ishlamaydi. Shunchaki ombordan olinib beriladi. Shuning
 * uchun uning mahsulot turi ham, o'lchami ham yo'q.
 */

import { useState } from 'react';
import { Modal } from '../modal';
import { kirishUslubi } from '../maydon';
import { pulKorsat, kopaytir } from '@/lib/domain/pul';
import { katalogNarxi } from '@/lib/domain/narx';
import type { Kurs } from '@/lib/domain/pul';

export interface QoshimchaMaterial {
  readonly id: number;
  readonly nom: string;
  readonly narx: string | null;
  readonly narxValyuta: string;
  /** Q-25 — shu filialdagi bo'sh qoldiq */
  readonly boshDona: number;
}

export interface QoshimchaTanlovi {
  readonly materialId: number;
  readonly nom: string;
  readonly soni: number;
  readonly narx: string;
}

export function QoshimchaQoshish({
  materiallar,
  kurs,
  qoshildi,
}: {
  materiallar: readonly QoshimchaMaterial[];
  kurs: Kurs | null;
  qoshildi: (t: QoshimchaTanlovi) => void;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [materialId, materialniOzgartir] = useState('');
  const [soni, soniniOzgartir] = useState('1');
  const [xato, xatoniOzgartir] = useState<string | null>(null);

  const tanlangan = materiallar.find((m) => String(m.id) === materialId);

  /**
   * ⚠️ Narx katalogdan keladi va dollarda bo'lsa kursga uriladi
   *    (5.4). Mijoz offseti bu yerda QO'LLANMAYDI — u faqat
   *    matoga tegishli (6.3).
   */
  const birlikNarx =
    tanlangan === undefined || tanlangan.narx === null
      ? null
      : katalogNarxi(tanlangan.narx, tanlangan.narxValyuta, kurs);

  const son = Number(soni);
  const jami =
    birlikNarx === null || !Number.isFinite(son) || son <= 0
      ? null
      : kopaytir(birlikNarx, son);

  function yop(): void {
    ochiqniOzgartir(false);
    xatoniOzgartir(null);
  }

  function qosh(): void {
    if (tanlangan === undefined) {
      xatoniOzgartir('Materialni tanlang');
      return;
    }
    if (!Number.isInteger(son) || son <= 0) {
      xatoniOzgartir("Soni butun va noldan katta bo'lishi kerak");
      return;
    }
    if (jami === null) {
      xatoniOzgartir('Bu materialning sotuv narxi belgilanmagan');
      return;
    }

    /**
     * ⚠️ Qoldiq yetmasa TO'XTATILMAYDI, faqat ogohlantiriladi:
     *    aniq javobni server beradi va pozitsiya «materialga
     *    kutmoqda» ga tushadi (8.12, Q-03).
     */
    qoshildi({
      materialId: tanlangan.id,
      nom: tanlangan.nom,
      soni: son,
      narx: pulKorsat(jami).replace(/\s/g, ''),
    });

    materialniOzgartir('');
    soniniOzgartir('1');
    yop();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] font-medium text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
      >
        + Qo&apos;shimcha mahsulot
      </button>

      <Modal
        ochiq={ochiq}
        yop={yop}
        sarlavha="Qo'shimcha mahsulot"
        izoh="Tayyorlanmaydi — ombordan olinib beriladi"
        bolalar={
          <div className="flex flex-col gap-4">
            {xato !== null && (
              <p
                role="alert"
                className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
              >
                {xato}
              </p>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Material</span>
              <select
                value={materialId}
                onChange={(e) => {
                  materialniOzgartir(e.target.value);
                  xatoniOzgartir(null);
                }}
                className={kirishUslubi(false)}
              >
                <option value="">— tanlang —</option>
                {materiallar.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} · omborda {m.boshDona}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex max-w-32 flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Soni</span>
              <input
                value={soni}
                onChange={(e) => {
                  soniniOzgartir(e.target.value);
                  xatoniOzgartir(null);
                }}
                inputMode="numeric"
                className={kirishUslubi(false)}
              />
            </label>

            {tanlangan !== undefined && (
              <div className="rounded-maydon bg-fon px-3 py-2.5 text-sm">
                {birlikNarx === null ? (
                  <span className="text-belgi-sariq">
                    Bu materialning sotuv narxi belgilanmagan
                  </span>
                ) : (
                  <>
                    <span className="text-matn-kuchsiz">
                      {pulKorsat(birlikNarx)} × {soni} ={' '}
                    </span>
                    <b>{jami === null ? '—' : pulKorsat(jami)}</b>
                  </>
                )}

                {/*
                  ⚠️ Qoldiq YETMASA ham qo'shishga ruxsat beriladi:
                     aniq javobni server beradi va pozitsiya
                     «materialga kutmoqda» ga tushadi (Q-03, 8.12).
                */}
                {Number.isFinite(son) && son > tanlangan.boshDona && (
                  <p className="mt-1.5 text-[12px] text-belgi-sariq">
                    Omborda {tanlangan.boshDona} ta bor — yetmasa buyurtma
                    «materialga kutmoqda» bo&apos;lib turadi
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={qosh}
                className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
              >
                Savatga qo&apos;shish
              </button>
              <button
                type="button"
                onClick={yop}
                className="fokus rounded-maydon px-2 py-1 text-sm text-matn-ikki transition-colors hover:text-matn"
              >
                Bekor
              </button>
            </div>
          </div>
        }
      />
    </>
  );
}
