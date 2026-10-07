'use client';

/**
 * Saqlash joyi — formalar (0062). Ombor auditi 2026-10-07.
 */

import { useActionState, useState } from 'react';
import { bolakJoyiAmali, joyNofaolAmali, joyQoshAmali, type JoyHolati } from './joy-amal';

const BOSH: JoyHolati = { xato: null, xabar: null, saqlandi: 0 };

const katak =
  'rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brend/25';
const tugma =
  'rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-tugma-matn hover:bg-brend-quyuq disabled:opacity-60';

function Holat({ h }: { h: JoyHolati }) {
  if (h.xato !== null) {
    return (
      <span role="alert" className="text-[13px] text-belgi-qizil">
        {h.xato}
      </span>
    );
  }
  if (h.xabar !== null) return <span className="text-[13px] text-belgi-yashil">{h.xabar}</span>;
  return null;
}

export function JoyQoshFormasi() {
  const [holat, yubor, kutilmoqda] = useActionState(joyQoshAmali, BOSH);
  return (
    <form key={holat.saqlandi} action={yubor} className="flex flex-wrap items-center gap-2">
      <input
        name="nom"
        required
        maxLength={50}
        placeholder="Masalan: A-1, B-3 yoki «Ertoq 2-polka»"
        aria-label="Joy nomi"
        className={`${katak} min-w-[220px] flex-1`}
      />
      <input name="izoh" placeholder="Izoh (ixtiyoriy)" aria-label="Izoh" className={`${katak} w-56`} />
      <button type="submit" disabled={kutilmoqda} className={tugma}>
        {kutilmoqda ? 'Saqlanmoqda…' : "Joy qo'shish"}
      </button>
      <Holat h={holat} />
    </form>
  );
}

export function JoyOchirTugmasi({ joyId, bosh }: { joyId: number; bosh: boolean }) {
  const [holat, yubor, kutilmoqda] = useActionState(joyNofaolAmali, BOSH);
  return (
    <form action={yubor} className="flex items-center justify-end gap-2">
      <input type="hidden" name="joyId" value={joyId} />
      <Holat h={holat} />
      <button
        type="submit"
        disabled={kutilmoqda || !bosh}
        title={bosh ? undefined : 'Joyda bo‘lak turibdi — avval ularni ko‘chiring'}
        className="text-xs text-matn-kuchsiz hover:text-belgi-qizil disabled:cursor-not-allowed disabled:opacity-40"
      >
        O&apos;chirish
      </button>
    </form>
  );
}

/**
 * Bo'lakni joyga qo'yish.
 *
 * - `bolakIdlar` berilsa — o'sha bo'laklar (bitta bo'lak sahifasi)
 * - `tanlov` berilsa — ro'yxatdan belgilanadi (kirim hujjati)
 */
export function BolakJoyFormasi({
  joylar,
  joriyJoyId = null,
  bolakIdlar,
  tanlov,
}: {
  joylar: readonly { id: number; nom: string }[];
  joriyJoyId?: number | null;
  bolakIdlar?: readonly number[];
  tanlov?: readonly { id: number; matn: string; joy: string | null }[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(bolakJoyiAmali, BOSH);
  const [belgilangan, setBelgilangan] = useState<readonly number[]>([]);

  if (joylar.length === 0) {
    return (
      <p className="text-[13px] text-matn-kuchsiz">
        Hali saqlash joyi yo&apos;q.{' '}
        <a href="/ombor/joylar" className="text-brend hover:underline">
          Joylar ro&apos;yxatini tuzing
        </a>
        .
      </p>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      {bolakIdlar?.map((id) => <input key={id} type="hidden" name="bolakId" value={id} />)}
      {tanlov !== undefined && (
        <>
          <label className="flex items-center gap-2 text-[13px] text-matn-ikki">
            <input
              type="checkbox"
              checked={belgilangan.length === tanlov.length && tanlov.length > 0}
              onChange={(e) => {
                setBelgilangan(e.target.checked ? tanlov.map((t) => t.id) : []);
              }}
            />
            Hammasini belgilash
          </label>
          <ul className="flex flex-col divide-y divide-chegara rounded-karta border border-chegara bg-sirt text-sm">
            {tanlov.map((t) => (
              <li key={t.id}>
                <label className="flex items-center gap-3 px-3 py-1.5">
                  <input
                    type="checkbox"
                    name="bolakId"
                    value={t.id}
                    checked={belgilangan.includes(t.id)}
                    onChange={(e) => {
                      setBelgilangan((o) =>
                        e.target.checked ? [...o, t.id] : o.filter((x) => x !== t.id),
                      );
                    }}
                  />
                  <span className="raqam flex-1">{t.matn}</span>
                  <span className="text-xs text-matn-kuchsiz">{t.joy ?? 'joyi yo‘q'}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="joyId"
          defaultValue={joriyJoyId === null ? '' : String(joriyJoyId)}
          aria-label="Saqlash joyi"
          className={katak}
        >
          <option value="">— joyi yo&apos;q —</option>
          {joylar.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nom}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={kutilmoqda || (tanlov !== undefined && belgilangan.length === 0)}
          className={tugma}
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tanlov === undefined ? 'Saqlash' : 'Belgilanganlarni joyga qo‘yish'}
        </button>
        <Holat h={holat} />
      </div>
    </form>
  );
}
