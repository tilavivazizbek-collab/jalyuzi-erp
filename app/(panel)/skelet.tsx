/**
 * app/(panel)/skelet.tsx — kutish paytidagi ko'rinish.
 *
 * ⚠️ Nega kerak: sahifa ma'lumot kelguncha BUTUNLAY bo'sh turardi.
 *    Baza sekin javob bersa odam oq ekranga qarab «bosilmadi» deb
 *    o'ylab qayta bosardi.
 *
 * ⚠️ Skelet **haqiqiy tuzilishni** takrorlaydi: sarlavha shu joyda,
 *    jadval shu joyda. Ma'lumot kelganda ekran sakramaydi. Umumiy
 *    aylanma belgi (spinner) bunday qilmaydi — u faqat «kutinг»
 *    deydi, lekin nima kelishini aytmaydi.
 *
 * ⚠️ `aria-hidden` — ekran o'quvchisi bo'sh to'rtburchaklarni
 *    o'qib bermasin. Uning o'rniga `role="status"` matni beriladi.
 */

/** Bitta kulrang chiziq. */
export function Chiziq({ kenglik = 'w-full' }: { kenglik?: string }) {
  return (
    <div
      className={`h-3.5 animate-pulse rounded bg-chegara ${kenglik}`}
      aria-hidden="true"
    />
  );
}

/** Sahifa sarlavhasi o'rni. */
export function SarlavhaSkeleti() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-7 w-48 animate-pulse rounded bg-chegara" aria-hidden="true" />
      <div className="h-4 w-64 animate-pulse rounded bg-chegara/60" aria-hidden="true" />
    </div>
  );
}

/** Jadval o'rni — ustun sarlavhalari va qatorlar. */
export function JadvalSkeleti({ qator = 6 }: { qator?: number }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-chegara bg-sirt">
      <div className="border-b border-chegara bg-fon px-4 py-3">
        <Chiziq kenglik="w-32" />
      </div>
      <div className="divide-y divide-chegara">
        {Array.from({ length: qator }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Chiziq kenglik="w-1/3" />
            <Chiziq kenglik="w-1/6" />
            <Chiziq kenglik="w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kartalar to'ri o'rni. */
export function KartalarSkeleti({ soni = 3 }: { soni?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: soni }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-[10px] border border-chegara bg-sirt p-4"
        >
          <Chiziq kenglik="w-24" />
          <Chiziq kenglik="w-full" />
          <Chiziq kenglik="w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Butun sahifa o'rni.
 *
 * `role="status"` — ekran o'quvchi «yuklanmoqda» deb aytadi va
 * ma'lumot kelganda o'zi xabar beradi.
 */
export function SahifaSkeleti({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8" role="status" aria-live="polite">
      <span className="sr-only">Yuklanmoqda…</span>
      {children}
    </div>
  );
}
