'use client';

/**
 * Mijoz kartochkasi — kontaktlar, muloqot tarixi va va'dalar,
 * Telegram eslatmasi. Egasi auditi 2026-10-06 (0061).
 */

import { useActionState, useState } from 'react';
import { telefonKorsat } from '@/lib/domain/telefon';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import {
  kontaktOchirAmali,
  kontaktQoshAmali,
  muloqotYozAmali,
  telegramEslatmaAmali,
  vadaYopAmali,
  type CrmHolati,
} from './crm-amal';
import type { KontaktQatori, MuloqotQatori } from './crm-malumot';

const BOSH: CrmHolati = { xato: null, saqlandi: 0 };

/** ⚠️ Kenglik bu yerda YO'Q — har joy o'zi beradi (`w-full` `w-auto` ni bosib ketardi) */
const katak =
  'rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brend/25';
const kirish = `${katak} w-full`;
const tugma =
  'rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-tugma-matn hover:bg-brend-quyuq disabled:opacity-60';

export const MULOQOT_NOMI: Record<string, string> = {
  QONGIROQ: "Qo'ng'iroq",
  UCHRASHUV: 'Uchrashuv',
  XABAR: 'Xabar',
  IZOH: 'Izoh',
  VADA: "To'lov va'dasi",
};

function Xato({ matn }: { matn: string | null }) {
  if (matn === null) return null;
  return (
    <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2 text-[13px] text-belgi-qizil">
      {matn}
    </p>
  );
}

// ─── Kontaktlar ───────────────────────────────────────────────────────────

export function Kontaktlar({
  mijozId,
  kontaktlar,
  qoshaOladi,
  ochiraOladi,
}: {
  mijozId: number;
  kontaktlar: readonly KontaktQatori[];
  qoshaOladi: boolean;
  ochiraOladi: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(kontaktQoshAmali, BOSH);
  const [ochiq, setOchiq] = useState(false);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-matn-ikki">Kontakt shaxslar</h2>
        {qoshaOladi && !ochiq && (
          <button
            type="button"
            onClick={() => {
              setOchiq(true);
            }}
            className="text-[13px] text-brend hover:underline"
          >
            + Kontakt qo&apos;shish
          </button>
        )}
      </div>

      {kontaktlar.length === 0 && !ochiq && (
        <p className="text-[13px] text-matn-kuchsiz">
          Hali yo&apos;q. Firmada bir necha odam bo&apos;lsa — rahbar, buxgalter, usta — shu yerga
          yoziladi.
        </p>
      )}

      {kontaktlar.length > 0 && (
        <ul className="flex flex-col divide-y divide-chegara rounded-karta border border-chegara bg-fon text-sm">
          {kontaktlar.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
              <span>
                <b className="font-medium">{k.ism}</b>
                {k.lavozim !== null && <span className="text-matn-kuchsiz"> · {k.lavozim}</span>}
                {k.izoh !== null && (
                  <span className="block text-xs text-matn-kuchsiz">{k.izoh}</span>
                )}
              </span>
              <span className="flex items-center gap-3">
                {k.telefon !== null && (
                  <a href={`tel:+${k.telefon}`} className="raqam text-brend hover:underline">
                    {telefonKorsat(k.telefon)}
                  </a>
                )}
                {ochiraOladi && (
                  <form action={kontaktOchirAmali}>
                    <input type="hidden" name="kontaktId" value={k.id} />
                    <input type="hidden" name="mijozId" value={mijozId} />
                    <button type="submit" className="text-xs text-matn-kuchsiz hover:text-belgi-qizil">
                      O&apos;chirish
                    </button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {ochiq && (
        <form
          key={holat.saqlandi}
          action={yubor}
          className="mt-3 flex flex-col gap-2 rounded-karta border border-chegara bg-sirt p-3"
        >
          <input type="hidden" name="mijozId" value={mijozId} />
          <Xato matn={holat.xato} />
          <div className="grid gap-2 sm:grid-cols-4">
            <input name="ism" required placeholder="Ismi *" aria-label="Ismi" className={kirish} />
            <input
              name="lavozim"
              placeholder="Lavozimi (rahbar, buxgalter…)"
              aria-label="Lavozimi"
              className={kirish}
            />
            <input
              name="telefon"
              type="tel"
              placeholder="+998 90 123 45 67"
              aria-label="Telefon"
              className={kirish}
            />
            <input name="izoh" placeholder="Izoh" aria-label="Izoh" className={kirish} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={kutilmoqda} className={tugma}>
              {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOchiq(false);
              }}
              className="text-[13px] text-matn-ikki hover:text-matn"
            >
              Yopish
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// ─── Muloqot va va'dalar ──────────────────────────────────────────────────

export function Muloqotlar({
  mijozId,
  qatorlar,
  yozaOladi,
}: {
  mijozId: number;
  qatorlar: readonly MuloqotQatori[];
  yozaOladi: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(muloqotYozAmali, BOSH);
  const [turi, setTuri] = useState('QONGIROQ');

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-matn-ikki">Muloqot va va&apos;dalar</h2>
      <p className="mb-3 text-xs text-matn-kuchsiz">
        Qo&apos;ng&apos;iroq, uchrashuv, to&apos;lov va&apos;dasi. Va&apos;da sanasi kelganda
        kartochkada va qarzdorlik hisobotida ko&apos;rinadi. Va&apos;da qarzga tegmaydi — pul
        «Qarzni to&apos;lash» bilan kiritiladi.
      </p>

      {yozaOladi && (
        <form
          key={holat.saqlandi}
          action={yubor}
          className="mb-3 flex flex-col gap-2 rounded-karta border border-chegara bg-sirt p-3"
        >
          <input type="hidden" name="mijozId" value={mijozId} />
          <Xato matn={holat.xato} />
          <div className="flex flex-wrap gap-2">
            <select
              name="turi"
              value={turi}
              onChange={(e) => {
                setTuri(e.target.value);
              }}
              aria-label="Turi"
              className={katak}
            >
              {Object.entries(MULOQOT_NOMI).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              name="matn"
              required
              placeholder={
                turi === 'VADA' ? 'Masalan: juma kuni to‘layman dedi' : 'Nima gaplashildi'
              }
              aria-label="Matn"
              className={`${katak} min-w-[220px] flex-1`}
            />
          </div>
          {turi === 'VADA' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[13px] text-matn-ikki">
                Qachon *
                <input name="vadaSana" type="date" required aria-label="Va'da sanasi" className={katak} />
              </label>
              <input
                name="vadaSumma"
                inputMode="decimal"
                placeholder="Summa (ixtiyoriy)"
                aria-label="Va'da summasi"
                className={`${katak} w-40`}
              />
              <select name="vadaValyuta" aria-label="Valyuta" className={katak}>
                <option value="SOM">so&apos;m</option>
                <option value="USD">$</option>
              </select>
            </div>
          )}
          <div>
            <button type="submit" disabled={kutilmoqda} className={tugma}>
              {kutilmoqda ? 'Saqlanmoqda…' : 'Yozib qo‘yish'}
            </button>
          </div>
        </form>
      )}

      {qatorlar.length > 0 && (
        <ul className="flex flex-col divide-y divide-chegara rounded-karta border border-chegara bg-fon text-sm">
          {qatorlar.map((m) => {
            const ochiqVada = m.turi === 'VADA' && !m.bajarildi;
            return (
              <li
                key={m.id}
                className={`flex flex-wrap items-start justify-between gap-3 px-4 py-2 ${
                  m.kechikdi ? 'bg-belgi-qizil-fon' : ochiqVada ? 'bg-belgi-sariq-fon' : ''
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="text-xs text-matn-kuchsiz">
                    {m.sana.toLocaleDateString('uz-UZ')} · {MULOQOT_NOMI[m.turi] ?? m.turi} ·{' '}
                    {m.xodim_ismi}
                  </span>
                  <span className="block">{m.matn}</span>
                  {m.turi === 'VADA' && (
                    <span
                      className={`block text-[13px] ${
                        m.kechikdi ? 'font-medium text-belgi-qizil' : 'text-matn-ikki'
                      }`}
                    >
                      Va&apos;da: {m.vada_sana}
                      {m.vada_summa !== null &&
                        ` · ${
                          m.vada_valyuta === 'USD'
                            ? `${pulKorsat(dollar(m.vada_summa))} $`
                            : `${pulKorsat(som(m.vada_summa))} so'm`
                        }`}
                      {m.bajarildi ? ' · bajarildi ✓' : m.kechikdi ? ' · KECHIKDI' : ''}
                    </span>
                  )}
                </span>
                {ochiqVada && yozaOladi && (
                  <form action={vadaYopAmali}>
                    <input type="hidden" name="muloqotId" value={m.id} />
                    <input type="hidden" name="mijozId" value={mijozId} />
                    <button
                      type="submit"
                      className="rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1 text-xs text-matn-ikki hover:text-matn"
                    >
                      Bajarildi
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Telegram eslatmasi ───────────────────────────────────────────────────

export function TelegramEslatma({ mijozId }: { mijozId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(telegramEslatmaAmali, BOSH);
  return (
    <form action={yubor} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="mijozId" value={mijozId} />
      <button
        type="submit"
        disabled={kutilmoqda}
        className="rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] text-matn-ikki transition-colors hover:bg-fon disabled:opacity-60"
      >
        {kutilmoqda ? 'Yuborilmoqda…' : 'Telegramda qarz eslatmasi'}
      </button>
      {holat.xato !== null && <span className="text-[13px] text-belgi-qizil">{holat.xato}</span>}
      {holat.xato === null && holat.xabar !== undefined && holat.xabar !== null && (
        <span className="text-[13px] text-belgi-yashil">{holat.xabar}</span>
      )}
    </form>
  );
}
