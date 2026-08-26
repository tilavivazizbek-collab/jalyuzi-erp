import { KartalarSkeleti, SahifaSkeleti, SarlavhaSkeleti } from '../skelet';

export default function Yuklanmoqda() {
  return (
    <SahifaSkeleti>
      <SarlavhaSkeleti />
      <KartalarSkeleti soni={6} />
    </SahifaSkeleti>
  );
}
