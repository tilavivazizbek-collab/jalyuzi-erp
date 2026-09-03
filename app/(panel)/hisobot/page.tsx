import Link from 'next/link';
import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import type { RuxsatKod } from '@/lib/ruxsat/kodlar';

export const dynamic = 'force-dynamic';

/**
 * TZ 11 — hisobotlar bo'limining boshi.
 *
 * ⚠️ Ruxsatga qarab bloklar YASHIRILADI, har rolga alohida ekran
 *    yasalmaydi (11.3). Bu yerda ham shunday: kod yo'q bo'lsa qator
 *    umuman ko'rinmaydi. Sahifaning o'zi ham serverda tekshiradi —
 *    manzilni qo'lda yozib kirib bo'lmaydi.
 */

interface Band {
  readonly yol: string;
  readonly nom: string;
  readonly izoh: string;
  readonly kod: RuxsatKod;
  readonly tayyor: boolean;
}

const BANDLAR: readonly Band[] = [
  {
    yol: '/hisobot/ombor',
    nom: 'Ombor',
    izoh: "Qoldiq qiymati · ustama eroziyasi · muzlab qolgan pul · qachon tugaydi",
    kod: 'hisobot.ombor.kor',
    tayyor: true,
  },
  {
    yol: '/hisobot/sotuv',
    nom: 'Sotuv',
    izoh: 'Sotuv dinamikasi · mahsulot turi bo\'yicha foyda · sotuvchi kesimida',
    kod: 'hisobot.sotuv.kor',
    tayyor: false,
  },
  {
    yol: '/hisobot/mijoz',
    nom: 'Mijozlar',
    izoh: "Mijozlar bazasi · ABC tahlil · debitorlik yoshi bo'yicha",
    kod: 'hisobot.mijoz.kor',
    tayyor: false,
  },
  {
    yol: '/hisobot/moliya',
    nom: 'Moliya',
    izoh: 'Foyda-zarar · kassa oqimi · xarajatlar · kurs farqi',
    kod: 'hisobot.moliya.kor',
    tayyor: false,
  },
];

export default async function Hisobotlar() {
  const f = await kirganBolishiShart();
  const korinadigan = BANDLAR.filter((b) => ruxsatBormi(f, b.kod));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Hisobotlar</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          TZ 11 · hisobotlar saqlanmaydi, har ochilganda joriy ma&apos;lumotdan
          yig&apos;iladi
        </p>
      </div>

      {korinadigan.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Sizda hisobot ko&apos;rish huquqi yo&apos;q (11.10).
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {korinadigan.map((b) =>
            b.tayyor ? (
              <Link
                key={b.yol}
                href={b.yol}
                className="rounded-karta border border-chegara bg-sirt px-4 py-4 transition-all hover:border-chegara-quyuq active:scale-[0.99]"
              >
                <p className="font-medium text-matn">{b.nom}</p>
                <p className="mt-1 text-sm text-matn-kuchsiz">{b.izoh}</p>
              </Link>
            ) : (
              <div
                key={b.yol}
                className="rounded-karta border border-dashed border-chegara px-4 py-4"
              >
                <p className="font-medium text-matn-kuchsiz">
                  {b.nom} <span className="text-xs">· hali qurilmagan</span>
                </p>
                <p className="mt-1 text-sm text-matn-kuchsiz">{b.izoh}</p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
