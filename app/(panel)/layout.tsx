import type { ReactNode } from 'react';
import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import type { RuxsatKod } from '@/lib/ruxsat/kodlar';
import { chiqishAmali } from './chiqish/amal';
import { Menyu, type MenyuGuruhi } from './menyu';
import { BrendBelgisi } from '../kirish/belgi';

export const dynamic = 'force-dynamic';

interface Band {
  readonly yol: string;
  readonly nom: string;
  readonly kod: RuxsatKod | null;
}

/**
 * Menyu GURUHLARI — kunlik ish tartibi bo'yicha.
 *
 * ⚠️ Tartib tasodifiy emas: yuqorida har kuni ochiladigan ekranlar,
 *    pastda oyda bir marta tegiladigan ma'lumotnomalar. Sotuvchi
 *    ertalab «Sotuv» ni bosadi — u ro'yxatning boshida turishi
 *    kerak, «Yetkazib beruvchilar» esa oxirida.
 */
const GURUHLAR: readonly { nom: string; bandlar: readonly Band[] }[] = [
  {
    nom: 'Ish',
    bandlar: [
      { yol: '/boshqaruv', nom: 'Boshqaruv', kod: null },
      { yol: '/sotuv', nom: 'Sotuv', kod: 'buyurtma.yarat' },
      { yol: '/buyurtma', nom: 'Sotuv tarixi', kod: 'buyurtma.kor' },
      { yol: '/buyurtma/yolda', nom: "Yo'ldagilar", kod: 'buyurtma.kor' },
      { yol: '/buyurtma/qayta-kesish', nom: 'Qayta kesish', kod: 'buyurtma.brak' },
    ],
  },
  {
    nom: 'Ombor',
    bandlar: [
      { yol: '/ombor', nom: "Qoldiq", kod: 'ombor.qoldiq.kor' },
      { yol: '/ombor/kirim', nom: 'Kirimlar', kod: 'ombor.qoldiq.kor' },
      {
        yol: '/ombor/inventarizatsiya',
        nom: 'Inventarizatsiya',
        kod: 'ombor.inventarizatsiya',
      },
      { yol: '/ombor/kochirish', nom: "Ko'chirish", kod: 'ombor.qoldiq.kor' },
    ],
  },
  {
    nom: 'Pul',
    bandlar: [
      { yol: '/kassa', nom: 'Kassa', kod: 'kassa.oz.kor' },
      { yol: '/filial/hisob', nom: 'Filiallararo hisob', kod: 'filial.hisob' },
    ],
  },
  {
    nom: "Ma'lumotnoma",
    bandlar: [
      { yol: '/material', nom: 'Materiallar', kod: 'material.kor' },
      { yol: '/mahsulot', nom: 'Mahsulot turlari', kod: 'mahsulot.kor' },
      { yol: '/mijoz', nom: 'Mijozlar', kod: 'mijoz.kor' },
      { yol: '/yetkazib', nom: 'Yetkazib beruvchilar', kod: 'yetkazib.kor' },
      { yol: '/filial', nom: 'Filiallar', kod: 'filial.kor' },
    ],
  },
];

/**
 * Himoyalangan qismning qatlami.
 *
 * QISM 1 §9.4 — tekshiruv SERVERDA. Bu qatlam ostidagi har sahifa
 * `kirganBolishiShart()` dan o'tadi; kirmagan odam bu yergacha yetib
 * kelmaydi.
 */
export default async function PanelQatlami({ children }: { children: ReactNode }) {
  const foydalanuvchi = await kirganBolishiShart();
  const rollar = foydalanuvchi.rollar.map((r) => r.nom).join(' · ');

  /**
   * Ruxsati yo'q band menyuga umuman kelmaydi. Bo'sh qolgan guruh
   * ham ko'rsatilmaydi — bo'sh sarlavha chalkashtiradi.
   */
  const menyu: MenyuGuruhi[] = GURUHLAR.map((g) => ({
    nom: g.nom,
    bandlar: g.bandlar
      .filter((b) => b.kod === null || ruxsatBormi(foydalanuvchi, b.kod))
      .map(({ yol, nom }) => ({ yol, nom })),
  })).filter((g) => g.bandlar.length > 0);

  return (
    <div className="min-h-screen bg-fon">
      <Menyu guruhlar={menyu} />

      {/* ⚠️ `lg:pl-60` — chap panel kengligi. Mobilda panel ustidan
          ochiladi, shuning uchun bo'shliq qo'yilmaydi. */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-chegara bg-sirt/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 pl-20 lg:px-6 lg:pl-6">
            <div className="flex items-center gap-2.5">
              <BrendBelgisi olcham={26} />
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-matn">
                Jalyuzi ERP
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/*
                ⚠️ Rol nomi ko'rinib turadi: bir odamda bir nechta rol
                   bo'lishi mumkin (10.3) va u qaysi huquq bilan
                   ishlayotganini bilishi kerak.
              */}
              <span className="hidden text-[13px] text-matn-ikki sm:inline">
                {rollar === '' ? 'rolsiz' : rollar}
              </span>
              <form action={chiqishAmali}>
                <button
                  type="submit"
                  className="fokus rounded-[6px] px-2.5 py-1.5 text-[13px] text-matn-ikki transition-colors hover:bg-fon hover:text-matn"
                >
                  Chiqish
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
