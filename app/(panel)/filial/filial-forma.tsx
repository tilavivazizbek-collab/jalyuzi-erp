'use client';

/**
 * TZ 20.2 — filial kartochkasi.
 *
 * ⚠️ 20.2.1 — rejim alohida maydon EMAS: u «Sotadi» va «Ishlab
 *    chiqaradi» bayroqlaridan kelib chiqadi. Foydalanuvchi rejimni
 *    tanlamaydi — u tanlagan ikki bayroqning natijasini KO'RADI.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { REJIM_IZOHI, REJIM_NOMI, rejim } from '@/lib/domain/filial';
import { filialOzgartirAmali, filialYaratAmali } from './amal';
import { BOSH_FILIAL } from './holat';
import type { FilialKorinishi, FilialQatori } from './malumot';

export function FilialFormasi({
  filial,
  tikuvchilar,
}: {
  /** `null` — yangi filial */
  filial: FilialKorinishi | null;
  tikuvchilar: readonly FilialQatori[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    filial === null ? filialYaratAmali : filialOzgartirAmali,
    BOSH_FILIAL,
  );

  const [sotadi, sotadiniOzgartir] = useState(filial?.sotadi ?? true);
  const [tikadi, tikadiniOzgartir] = useState(filial?.ishlabChiqaradi ?? true);

  const joriyRejim = rejim({ sotadi, ishlabChiqaradi: tikadi });

  // 20.2 — o'zi tikmasa standart ishlab chiqaruvchi MAJBURIY
  const standartKerak = !tikadi;

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-4">
      {filial !== null && <input type="hidden" name="filialId" value={filial.id} />}

      {holat.xato !== null && (
        <p role="alert" className="text-sm text-red-700">
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Saqlandi.
        </p>
      )}

      <Maydon nom="nom" yorliq="Nomi" xato={holat.maydonlar['nom']}>
        <input
          id="nom"
          name="nom"
          defaultValue={filial?.nom ?? ''}
          className={kirishUslubi(holat.maydonlar['nom'] !== undefined)}
          placeholder="Chilonzor do'koni"
        />
      </Maydon>

      <div className="flex flex-wrap gap-3">
        <Maydon nom="manzil" yorliq="Manzil" izoh="Chek va hujjatlarda ko'rinadi">
          <input
            id="manzil"
            name="manzil"
            defaultValue={filial?.manzil ?? ''}
            className={`${kirishUslubi(false)} w-72`}
          />
        </Maydon>

        <Maydon nom="telefon" yorliq="Telefon">
          <input
            id="telefon"
            name="telefon"
            defaultValue={filial?.telefon ?? ''}
            className={`${kirishUslubi(false)} w-48`}
          />
        </Maydon>
      </div>

      {/* ── 20.2.1 · To'rt rejim ── */}
      <fieldset className="rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Rejim</legend>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sotadi"
              checked={sotadi}
              onChange={(e) => {
                sotadiniOzgartir(e.target.checked);
              }}
            />
            Sotadi
            <span className="text-xs text-slate-500">
              (bu filialda buyurtma qabul qilinadimi)
            </span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="ishlabChiqaradi"
              checked={tikadi}
              onChange={(e) => {
                tikadiniOzgartir(e.target.checked);
              }}
            />
            Ishlab chiqaradi
            <span className="text-xs text-slate-500">(sex va ustalar bormi)</span>
          </label>
        </div>

        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <b>{REJIM_NOMI[joriyRejim]}</b>{' '}
          <span className="text-slate-500">— {REJIM_IZOHI[joriyRejim]}</span>
        </p>
      </fieldset>

      <Maydon
        nom="standartIshlabChiqaruvchiId"
        yorliq={`Standart ishlab chiqarish filiali${standartKerak ? ' (majburiy)' : ''}`}
        izoh="O'zi tikmasa — buyurtma qaysi filialga yuboriladi (20.4.1)"
        xato={holat.maydonlar['standartIshlabChiqaruvchiId']}
      >
        <select
          id="standartIshlabChiqaruvchiId"
          name="standartIshlabChiqaruvchiId"
          defaultValue={filial?.standartIshlabChiqaruvchiId ?? ''}
          className={`${kirishUslubi(false)} w-72`}
        >
          <option value="">— yo&apos;q —</option>
          {tikuvchilar.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nom}
            </option>
          ))}
        </select>
      </Maydon>

      <Maydon
        nom="kassaYopilishSoati"
        yorliq="Kassa yopilish soati"
        izoh="Q-17 — kassa kuni shu soatda tugaydi"
        xato={holat.maydonlar['kassaYopilishSoati']}
      >
        <input
          id="kassaYopilishSoati"
          name="kassaYopilishSoati"
          type="time"
          defaultValue={(filial?.kassaYopilishSoati ?? '20:00:00').slice(0, 5)}
          className={`${kirishUslubi(false)} w-32`}
        />
      </Maydon>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="faol" defaultChecked={filial?.faol ?? true} />
        Faol
        <span className="text-xs text-slate-500">
          (nofaol filial yangi buyurtma qabul qilmaydi, tarixi qoladi)
        </span>
      </label>

      {filial?.bosh === true && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-900 ring-1 ring-amber-200">
          Bu <b>bosh filial</b>: standart narxlar, spravochniklar va
          hisobotlar shu yerdan boshqariladi. Uni nofaol qilib bo&apos;lmaydi
          (20.2.2).
        </p>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="self-start rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </form>
  );
}
