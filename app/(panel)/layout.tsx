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

interface Guruh {
  readonly nom: string;
  readonly bandlar: readonly Band[];
}

/**
 * Menyu — ICHMA-ICH BO'LIMLAR.
 *
 * ⚠️ Ilgari bitta tekis ro'yxat edi (15 band). Ro'yxat o'sib
 *    ketdi va egasi bo'limlarga bo'lishni so'radi: har ish o'z
 *    joyida tursin, kerakli ekran uch soniyada topilsin.
 *
 * ⚠️ TARTIB TASODIFIY EMAS — egasi aytgan tartib, ishlatilish
 *    chastotasi bo'yicha:
 *
 *      1. Buyurtmalar      — kuniga o'nlab marta
 *      2. Ombor            — kuniga bir necha marta
 *      3. Mahsulotlar      — haftada bir necha marta
 *      4. Mijozlar         — haftada bir necha marta
 *      5. Yetkazuvchilar   — haftada bir marta
 *      6. Kassa            — kunda bir marta (kun yopish)
 *      7. Sozlash          — oyda yoki yilda bir marta
 *
 * ⚠️ «Boshqaruv» guruhsiz, eng tepada — u KUN BOSHIDA ochiladi.
 *
 * ⚠️ NOMLAR EKRAN UCHUN. Bazada `material` va `mahsulot_tur`
 *    nomlari qoladi — egasi ekranda «Mahsulot» va «Tur» ko'rishni
 *    so'radi. Baza nomini o'zgartirish 40+ faylga tegadi, foydasi
 *    yo'q va xato manbayi bo'ladi.
 */
const MENYU: readonly Guruh[] = [
  {
    nom: '',
    bandlar: [{ yol: '/boshqaruv', nom: 'Boshqaruv', kod: null }],
  },
  {
    nom: 'Buyurtmalar',
    bandlar: [
      { yol: '/buyurtma/yangi', nom: 'Yangi buyurtma', kod: 'buyurtma.yarat' },
      { yol: '/buyurtma', nom: 'Buyurtmalar tarixi', kod: 'buyurtma.kor' },
      { yol: '/buyurtma/yolda', nom: "Yo'ldagilar", kod: 'buyurtma.kor' },
      { yol: '/buyurtma/qayta-kesish', nom: 'Qayta kesish', kod: 'buyurtma.brak' },
    ],
  },
  {
    nom: 'Ombor',
    bandlar: [
      { yol: '/ombor', nom: 'Ombor qoldig‘i', kod: 'ombor.qoldiq.kor' },
      { yol: '/ombor/tarix', nom: 'Ombor tarixi', kod: 'ombor.qoldiq.kor' },
      { yol: '/ombor/kirim', nom: 'Kirimlar', kod: 'ombor.qoldiq.kor' },
      { yol: '/ombor/kochirish', nom: "Ko'chirish", kod: 'ombor.qoldiq.kor' },
      {
        yol: '/ombor/inventarizatsiya',
        nom: 'Inventarizatsiya',
        kod: 'ombor.inventarizatsiya',
      },
    ],
  },
  {
    nom: 'Mahsulotlar',
    bandlar: [
      { yol: '/material', nom: 'Mahsulotlar', kod: 'material.kor' },
      { yol: '/mahsulot', nom: "Tur yig'ish", kod: 'mahsulot.kor' },
      { yol: '/guruh', nom: 'Guruhlarni boshqarish', kod: 'material.kor' },
    ],
  },
  {
    nom: 'Mijozlar',
    bandlar: [{ yol: '/mijoz', nom: 'Mijozlar', kod: 'mijoz.kor' }],
  },
  {
    nom: 'Yetkazib beruvchilar',
    bandlar: [
      { yol: '/yetkazib', nom: 'Yetkazib beruvchilar', kod: 'yetkazib.kor' },
    ],
  },
  {
    nom: '',
    bandlar: [{ yol: '/kassa', nom: 'Kassa', kod: 'kassa.oz.kor' }],
  },
  {
    nom: 'Sozlash',
    bandlar: [
      { yol: '/xodim', nom: 'Xodimlar', kod: 'xodim.kor' },
      { yol: '/filial', nom: 'Filiallar', kod: 'filial.kor' },
      { yol: '/filial/hisob', nom: 'Filiallararo hisob', kod: 'filial.hisob' },
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
   * Ruxsati yo'q band menyuga umuman kelmaydi (§9.4).
   *
   * ⚠️ Bandi qolmagan guruh ham yo'qoladi — bo'sh sarlavha
   *    turishining ma'nosi yo'q.
   */
  const menyu: MenyuGuruhi[] = MENYU.map((g) => ({
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
                  className="fokus rounded-[6px] px-2.5 py-1.5 text-[13px] text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon hover:text-matn"
                >
                  Chiqish
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
