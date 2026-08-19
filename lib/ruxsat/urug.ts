/**
 * lib/ruxsat/urug.ts — Q-04 · TZ 14.6 · 11.10 · 12.14 · 20.12
 *
 * Tizimli rollar va ularning BOSHLANG'ICH ruxsatlari.
 *
 * Q-04: «14.6 ruxsatlar matritsasi — yagona manba. 11.10 va 12.14 jadvallari
 * boshlang'ich **preset**.» Ya'ni bu yerdagi qiymatlar qoida emas — birinchi
 * o'rnatishda yoziladi va admin keyin matritsadan xohlaganicha o'zgartiradi.
 *
 * Har ruxsat yonida u QAYERDAN olingani yozilgan. Taxmin qilinmagan:
 * TZ da yozilmagan ruxsat bu yerda yo'q.
 */

import type { RuxsatKod } from './kodlar';
import { RUXSAT_KODLARI } from './kodlar';
import type { Qamrov, Rol, TizimliRol } from './tekshir';

export interface RolUrugi {
  readonly kod: TizimliRol;
  readonly nom: string;
  readonly izoh: string;
  readonly ruxsatlar: readonly (readonly [RuxsatKod, Qamrov])[];
}

/** Admin barcha ruxsatga «barcha filiallar» qamrovi bilan ega bo'ladi. */
const ADMIN_RUXSATLARI: readonly (readonly [RuxsatKod, Qamrov])[] = RUXSAT_KODLARI.map(
  (k) => [k, 'BARCHA'] as const,
);

export const ROL_URUGI: readonly RolUrugi[] = [
  {
    kod: 'ADMIN',
    nom: 'Admin',
    // TZ 11.10 «Hammasi» · 12.14 «Barcha kassa / Hammasi»
    // TZ 14.6 «Standart holat: barcha huquq adminda»
    izoh: 'Barcha huquq. TZ 14.6 bo\'yicha standart holat.',
    ruxsatlar: ADMIN_RUXSATLARI,
  },

  {
    kod: 'SOTUVCHI',
    nom: 'Sotuvchi',
    // TZ 11.10 — «Sotuv, mijozlar, kassa oqimi. Tannarx, foyda va ish haqi yo'q»
    // TZ 12.14 — «Faqat o'z kassasi. Kirim, chiqim, xarajat, topshiriq»
    izoh: "Faqat o'z kassasi. Tannarx, foyda va ish haqi ko'rinmaydi.",
    ruxsatlar: [
      // 12.14 — faqat o'z kassasi
      ['kassa.oz.kor', 'OZ_FILIALI'],
      ['kassa.kirim', 'OZ_FILIALI'],
      ['kassa.chiqim', 'OZ_FILIALI'],
      // TZ 3.3 — sotuv ekranida «har mato yonida qoldiq ko'rinadi»
      ['ombor.qoldiq.kor', 'OZ_FILIALI'],
      // Sotuv ekrani ishlashi uchun zarur minimum
      ['material.kor', 'BARCHA'], // 3.3 — mato tanlash (material umumiy, Q-26)
      ['mahsulot.kor', 'BARCHA'], // 3.2 — mahsulot turini tanlash
      ['mijoz.kor', 'BARCHA'], // 3.10 — mijoz qidirish
      // 3.10 — «Topilmasa, o'sha yerning o'zidan yangi mijoz qo'shiladi»
      ['mijoz.yarat', 'BARCHA'],
    ],
    // BERILMAYDI: kassa.barcha.kor (12.14 «faqat o'z kassasi»),
    //             kassa.ayirboshlash va kassa.storno (14.6 misolida ☐),
    //             ombor.kirim.yarat / chiqim / storno / narx.ozgartir
  },

  {
    kod: 'OMBORCHI',
    nom: 'Omborchi',
    // TZ 14.6 misoli AYNAN omborchi uchun yozilgan — izohi shuni aytadi:
    //   «omborchiga kirim qilishga ruxsat berib, hisobdan chiqarishni
    //    taqiqlash kerak bo'lishi mumkin»
    // TZ 20.12 misoli: «Omborchi (Samarqand)» — qoldiq va kirim ☑,
    //    ko'chirish ☐, ikkalasi ham «o'z filiali» qamrovida
    // TZ 12.14 — «O'z kassasi (bo'lsa). Yetkazib beruvchiga to'lov, ish haqi to'lovi»
    izoh: "Kirim qiladi, hisobdan chiqara olmaydi. O'z filiali.",
    ruxsatlar: [
      ['ombor.qoldiq.kor', 'OZ_FILIALI'], // 20.12 ☑
      ['ombor.kirim.yarat', 'OZ_FILIALI'], // 20.12 ☑ · 14.6 ☑
      ['kassa.oz.kor', 'OZ_FILIALI'], // 12.14
      ['kassa.chiqim', 'OZ_FILIALI'], // 12.14 — yetkazib beruvchiga to'lov
      // Kirim hujjati material va yetkazib beruvchini tanlashni talab qiladi (9.2)
      ['material.kor', 'BARCHA'],
      ['yetkazib.kor', 'BARCHA'],
    ],
    // BERILMAYDI: ombor.chiqim · ombor.storno · ombor.narx.ozgartir (14.6 misolida ☐)
    //             ombor.kochirish.yarat (20.12 misolida ☐)
    //             kassa.barcha.kor · kassa.ayirboshlash · kassa.storno
  },

  {
    kod: 'USTA',
    nom: 'Usta',
    // TZ 11.10 — «Hech narsa — botda o'z ishini va balansini ko'radi»
    // TZ 12.14 — «Ko'rmaydi»
    // QISM 1 §8, Q-04 — usta saytga UMUMAN kirmaydi (qattiq qoida)
    izoh: 'Saytga kirmaydi. Botda o\'z ishi va balansini ko\'radi (13-bo\'lim).',
    ruxsatlar: [],
  },
];

/** Urug'dagi rolni tekshiruv funksiyalari kutadigan ko'rinishga o'giradi. */
export function urugdanRol(u: RolUrugi): Rol {
  return { kod: u.kod, nom: u.nom, ruxsatlar: new Map(u.ruxsatlar) };
}

export function urugRoliniOl(kod: TizimliRol): RolUrugi {
  const topilgan = ROL_URUGI.find((r) => r.kod === kod);
  if (topilgan === undefined) {
    throw new Error(`Tizimli rol urug'da yo'q: ${kod}`);
  }
  return topilgan;
}
