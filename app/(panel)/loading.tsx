import { JadvalSkeleti, SahifaSkeleti, SarlavhaSkeleti } from './skelet';

/**
 * Butun panel uchun UMUMIY kutish ko'rinishi.
 *
 * ⚠️ Next.js da `loading.tsx` o'z bo'limi va uning ICHIDAGI barcha
 *    yo'llarni qoplaydi. Shuning uchun 39 ta sahifaga 39 ta fayl
 *    yozilmadi — bittasi hammasiga yetadi. Tuzilishi boshqacha
 *    bo'lgan sahifalar o'z faylini qo'yadi.
 */
export default function Yuklanmoqda() {
  return (
    <SahifaSkeleti>
      <SarlavhaSkeleti />
      <JadvalSkeleti />
    </SahifaSkeleti>
  );
}
