import { KartalarSkeleti, SahifaSkeleti, SarlavhaSkeleti } from '../skelet';

/**
 * Sotuv ekrani — jadval emas, tanlov kartalari.
 *
 * ⚠️ Bu ekran eng ko'p ishlatiladi va eng og'iri. Skelet uning
 *    haqiqiy tuzilishini takrorlaydi: mahsulot turi tugmalari,
 *    keyin slotlar.
 */
export default function Yuklanmoqda() {
  return (
    <SahifaSkeleti>
      <SarlavhaSkeleti />
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-[6px] bg-chegara" />
        ))}
      </div>
      <KartalarSkeleti soni={3} />
    </SahifaSkeleti>
  );
}
