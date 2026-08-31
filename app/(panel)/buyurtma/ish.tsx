'use client';

/**
 * app/(panel)/buyurtma/ish.tsx — TZ 8.5 · 7.6
 *
 * «Ishni boshlash» va «Tugatdim» — VEB-DA.
 *
 * ⚠️ Ilgari bu ikkalasi faqat botda edi va buyurtma tasdiqdan
 *    keyin qotib qolardi (2026-08-30).
 */

import { useActionState, useState } from 'react';
import { Modal } from '../modal';
import { kirishUslubi } from '../maydon';
import { ishniBoshlaAmali, tugatdimAmali } from './ish-amal';
import { BOSH_ISH_HOLATI } from './ish-holat';

export interface UstaTanlovi {
  readonly id: number;
  readonly ism: string;
}

const xatoQatori = (xato: string | null) =>
  xato === null ? null : (
    <p role="alert" className="mt-1 text-[12px] text-belgi-qizil">
      {xato}
    </p>
  );

// ─── 8.5 · Ishni boshlash ────────────────────────────────────────────────

export function IshniBoshlashTugmasi({
  pozitsiyaId,
  ustalar,
}: {
  pozitsiyaId: number;
  ustalar: readonly UstaTanlovi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    ishniBoshlaAmali.bind(null, pozitsiyaId),
    BOSH_ISH_HOLATI,
  );

  return (
    <form action={yubor} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {/*
          ⚠️ Usta TANLANADI: veb-da ishni ko'pincha admin yozadi.
             Bo'sh qolsa amal o'zi bosgan odamni qo'yadi.
        */}
        {ustalar.length > 0 && (
          <select
            name="ustaId"
            defaultValue=""
            aria-label="Ishni kim oladi"
            className={`${kirishUslubi(false)} w-44 py-1.5 text-[13px]`}
          >
            <option value="">— o&apos;zim —</option>
            {ustalar.map((u) => (
              <option key={u.id} value={u.id}>
                {u.ism}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Boshlanmoqda…' : 'Ishni boshlash'}
        </button>
      </div>
      {xatoQatori(holat.xato)}
    </form>
  );
}

// ─── 7.6 · «Tugatdim» ────────────────────────────────────────────────────

export function TugatdimTugmasi({
  pozitsiyaId,
  manbaKod,
  manbaEniM,
  manbaBoyiM,
  mahsulotEniSm,
  mahsulotBoyiSm,
}: {
  pozitsiyaId: number;
  /** Band qilingan bo'lak — usta shundan kesadi (7.3) */
  manbaKod: string | null;
  manbaEniM: number | null;
  manbaBoyiM: number | null;
  mahsulotEniSm: number;
  mahsulotBoyiSm: number;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(
    tugatdimAmali.bind(null, pozitsiyaId),
    BOSH_ISH_HOLATI,
  );

  const [eni, eniniOzgartir] = useState('');
  const [boyi, boyiniOzgartir] = useState('');
  const [saqlan, saqlanniOzgartir] = useState(true);

  const manbaKvM =
    manbaEniM !== null && manbaBoyiM !== null ? manbaEniM * manbaBoyiM : null;
  const qoldiqKvM = Number(eni) > 0 && Number(boyi) > 0 ? Number(eni) * Number(boyi) : 0;

  /** Mahsulotga ketadigan qism — qolganidan hisoblanadi (7.6) */
  const mahsulotgaKvM = manbaKvM === null ? null : manbaKvM - qoldiqKvM;
  const kop = manbaKvM !== null && qoldiqKvM > manbaKvM;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon bg-belgi-yashil px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
      >
        Tugatdim
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha="Ishni yakunlash"
        izoh="Kesimdan keyin qolgan bo'lak o'lchamini kiriting (7.6)"
        bolalar={
          <form action={yubor} className="flex flex-col gap-4">
            <div className="rounded-maydon bg-fon px-3 py-2.5 text-[13px] text-matn-ikki">
              <p>
                Mahsulot: <b className="raqam">{mahsulotEniSm}</b> ×{' '}
                <b className="raqam">{mahsulotBoyiSm}</b> sm
              </p>
              {manbaKod !== null && manbaKvM !== null && (
                <p className="mt-0.5">
                  Kesiladigan bo&apos;lak: <b className="raqam">{manbaKod}</b> ·{' '}
                  <b className="raqam">{manbaEniM}</b> × <b className="raqam">{manbaBoyiM}</b> m
                  = <b className="raqam">{manbaKvM.toFixed(2)}</b> kv.m
                </p>
              )}
            </div>

            {/*
              ⚠️ Manba TASDIQLANADI (7.6): tizim ostatkani band
                 qilgan bo'lishi mumkin, usta esa rulondan kesgan
                 bo'lishi mumkin — haqiqat ustada.
            */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Nimadan kesildi</span>
              <select
                name="manba"
                defaultValue="OSTATKA"
                className={kirishUslubi(false)}
              >
                <option value="OSTATKA">Qoldiq kesmadan (ostatka)</option>
                <option value="RULON">Butun rulondan</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Qolgan eni (m)</span>
                <input
                  name="qoldiqEni"
                  value={eni}
                  onChange={(e) => {
                    eniniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  required
                  className={kirishUslubi(kop)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">
                  Qolgan bo&apos;yi (m)
                </span>
                <input
                  name="qoldiqBoyi"
                  value={boyi}
                  onChange={(e) => {
                    boyiniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  required
                  className={kirishUslubi(kop)}
                />
              </label>
            </div>

            {/*
              ⚠️ Hisob DARHOL ko'rinadi: usta raqamni adashib
                 yozsa, mahsulotga ketgan qism aql bovar
                 qilmaydigan chiqadi va u buni ko'radi.
            */}
            {manbaKvM !== null && qoldiqKvM > 0 && (
              <p
                className={`rounded-maydon px-3 py-2 text-[13px] ${
                  kop ? 'bg-belgi-qizil-fon text-belgi-qizil' : 'bg-fon text-matn-ikki'
                }`}
              >
                {kop ? (
                  <>Qolgan bo&apos;lak manbadan katta — o&apos;lchamni tekshiring.</>
                ) : (
                  <>
                    Qoldiq <b className="raqam">{qoldiqKvM.toFixed(2)}</b> kv.m ·
                    mahsulotga <b className="raqam">{(mahsulotgaKvM ?? 0).toFixed(2)}</b> kv.m
                  </>
                )}
              </p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="saqlansinmi"
                value="ha"
                checked={saqlan}
                onChange={(e) => {
                  saqlanniOzgartir(e.target.checked);
                }}
                className="size-4"
              />
              <span className="text-matn-ikki">
                Qolgan bo&apos;lak omborga qaytsin
                <span className="ml-1 text-xs text-matn-kuchsiz">
                  belgilanmasa chiqindiga yoziladi (7.5)
                </span>
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Izoh</span>
              <input name="izoh" placeholder="ixtiyoriy" className={kirishUslubi(false)} />
            </label>

            {xatoQatori(holat.xato)}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={kutilmoqda || kop}
                className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
              >
                {kutilmoqda ? 'Yakunlanmoqda…' : 'Ishni yakunlash'}
              </button>
              <button
                type="button"
                onClick={() => {
                  ochiqniOzgartir(false);
                }}
                className="fokus rounded-maydon px-2 py-2 text-sm text-matn-kuchsiz hover:text-matn"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        }
      />
    </>
  );
}
