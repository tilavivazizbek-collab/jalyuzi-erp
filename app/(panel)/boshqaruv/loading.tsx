import { KartalarSkeleti, SahifaSkeleti, SarlavhaSkeleti } from '../skelet';

/** Ko'rsatkich kartalari + ruxsat kartalari — haqiqiy tuzilishga mos. */
export default function Yuklanmoqda() {
  return (
    <SahifaSkeleti>
      <SarlavhaSkeleti />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-karta border border-chegara bg-sirt p-5"
          >
            <div className="flex items-start justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-chegara" />
              <div className="h-8 w-8 animate-pulse rounded-[10px] bg-chegara" />
            </div>
            <div className="h-6 w-28 animate-pulse rounded bg-chegara" />
          </div>
        ))}
      </div>
      <KartalarSkeleti soni={6} />
    </SahifaSkeleti>
  );
}
