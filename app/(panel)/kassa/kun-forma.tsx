'use client';

/**
 * TZ 12.17 — kun yopish.
 *
 * ⚠️ «Farq bo'lsa izoh MAJBURIY, lekin yopish BLOKLANMAYDI. Sotuvchini
 *    uyiga qo'ymay turib bo'lmaydi.»
 *
 *    Shuning uchun izoh maydoni faqat farq chiqqanda majburiy bo'ladi
 *    va tugma hech qachon o'chmaydi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kunniQaytaOchAmali, kunniYopAmali } from './amal';
import { BOSH_HOLAT, BOSH_KUN } from './holat';

export interface KunKorinishi {
  readonly kassaId: number;
  readonly kassaNomi: string;
  readonly sana: string;
  readonly boshlangich: string;
  readonly kirim: string;
  readonly chiqim: string;
  readonly hisoblangan: string;
  readonly yopilganmi: boolean;
  /** Yopilgan kun yozuvining id si — qayta ochish uchun */
  readonly kunId: number | null;
}

export function KunYopishFormasi({
  kun,
  qaytaOchaOladi = false,
}: {
  kun: KunKorinishi;
  /** TZ 12.17 — faqat admin qayta ocha oladi (`kassa.storno`) */
  qaytaOchaOladi?: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(kunniYopAmali, BOSH_KUN);
  const [sanaldi, sanaldiniOzgartir] = useState('');

  const son = (x: string): number | null => {
    const t = x.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const s = son(sanaldi);
  const farq = s === null ? null : s - Number(kun.hisoblangan);
  const izohKerak = farq !== null && farq !== 0;

  if (kun.yopilganmi) {
    return (
      <div className="flex max-w-md flex-col gap-3">
        <p className="rounded-karta bg-belgi-yashil-fon px-4 py-3 text-sm text-belgi-yashil ">
          <b>{kun.kassaNomi}</b> — {kun.sana} kuni yopilgan. Bu sanaga yangi yozuv
          kiritib bo&apos;lmaydi (12.17).
        </p>

        {/*
          ⚠️ 2026-09-22 — BU YERDA FAQAT VA'DA TURARDI.
             «Kerak bo'lsa admin qayta ochadi» deb yozilgan edi, lekin
             tugma hech qayerda yo'q edi. Amalning o'zi
             (`kunniQaytaOchAmali`) to'liq yozilgan — ruxsat, filial
             tekshiruvi, majburiy sabab, audit yozuvi — faqat ekranga
             ulanmagan edi.

             Oqibati og'ir: kun xato yopilsa, o'sha sanaga BIRORTA
             to'lov kiritib bo'lmasdi va uni ochadigan yo'l yo'q edi.
        */}
        {qaytaOchaOladi && kun.kunId !== null && (
          <QaytaOchish kunId={kun.kunId} />
        )}
      </div>
    );
  }

  return (
    <form action={yubor} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="kassaId" value={kun.kassaId} />
      <input type="hidden" name="sana" value={kun.sana} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {holat.yopildi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil ">
          Kun yopildi.
          {holat.farq !== null && Number(holat.farq) !== 0 && (
            <span className="ml-1">
              Farq: <b className="raqam">{pulKorsat(som(holat.farq))}</b>
            </span>
          )}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <dt className="text-matn-kuchsiz">Ertalabki qoldiq</dt>
        <dd className="raqam">{pulKorsat(som(kun.boshlangich))}</dd>
        <dt className="text-matn-kuchsiz">Kirim</dt>
        <dd className="raqam text-belgi-yashil">{pulKorsat(som(kun.kirim))}</dd>
        <dt className="text-matn-kuchsiz">Chiqim</dt>
        <dd className="raqam text-belgi-qizil">{pulKorsat(som(kun.chiqim))}</dd>
        <dt className="border-t border-chegara pt-1.5 font-medium">Tizim bo&apos;yicha</dt>
        <dd className="raqam border-t border-chegara pt-1.5 font-semibold">
          {pulKorsat(som(kun.hisoblangan))}
        </dd>
      </dl>

      <Maydon nom="sanaldi" yorliq="Haqiqatda sanadim">
        <input
          id="sanaldi"
          name="sanaldi"
          value={sanaldi}
          onChange={(e) => {
            sanaldiniOzgartir(e.target.value);
          }}
          inputMode="decimal"
          className={kirishUslubi(false)}
          placeholder={kun.hisoblangan}
        />
      </Maydon>

      {farq !== null && (
        <p
          className={`raqam text-sm ${
            farq === 0 ? 'text-matn-kuchsiz' : farq < 0 ? 'text-belgi-qizil' : 'text-belgi-sariq'
          }`}
        >
          Farq: {pulKorsat(som(farq.toFixed(2)))}
          {farq < 0 && ' — yetishmaydi'}
          {farq > 0 && ' — ortiqcha'}
        </p>
      )}

      <Maydon
        nom="izoh"
        yorliq={izohKerak ? 'Izoh (majburiy)' : 'Izoh'}
        izoh={izohKerak ? 'Farq bor — izohsiz yopilmaydi, lekin yopish bloklanmaydi' : undefined}
      >
        <textarea id="izoh" name="izoh" rows={2} className={kirishUslubi(false)} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda || s === null}
        className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
      >
        {kutilmoqda ? 'Yopilmoqda…' : 'Kunni yopish'}
      </button>
    </form>
  );
}

/**
 * TZ 12.17 — «Kerak bo'lsa ADMIN kunni qayta ochadi — sabab MAJBURIY,
 * audit jurnaliga tushadi.»
 *
 * ⚠️ IKKI QADAM: avval «qayta ochish» bosiladi, keyin sabab yoziladi.
 *    Bitta tugma bo'lsa, tasodifan bosilishi mumkin edi — yopilgan
 *    kunni ochish kassa hisobiga aralashish demak.
 *
 * ⚠️ Sabab BO'SH bo'lsa tugma ishlamaydi. Serverda ham tekshiriladi
 *    (`kunniQaytaOch`) — bu yerdagi tekshiruv faqat odamga tez javob
 *    berish uchun, himoya emas.
 */
function QaytaOchish({ kunId }: { kunId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(kunniQaytaOchAmali, BOSH_HOLAT);
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [sabab, sababniOzgartir] = useState('');

  if (holat.bajarildi) {
    return (
      <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
        Kun qayta ochildi — endi bu sanaga yozuv kiritish mumkin.
      </p>
    );
  }

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="self-start rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
      >
        Kunni qayta ochish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-3">
      <input type="hidden" name="kunId" value={kunId} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      <Maydon nom="sabab" yorliq="Nima uchun qayta ochilmoqda" izoh="audit jurnaliga tushadi">
        <input
          id="sabab"
          name="sabab"
          value={sabab}
          onChange={(e) => {
            sababniOzgartir(e.target.value);
          }}
          placeholder="Masalan: kun xato yopilgan, kechki to'lov kiritilmagan"
          className={kirishUslubi(false)}
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda || sabab.trim() === ''}
          className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-50"
        >
          {kutilmoqda ? 'Ochilmoqda…' : 'Qayta ochish'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          Bekor
        </button>
      </div>
    </form>
  );
}
