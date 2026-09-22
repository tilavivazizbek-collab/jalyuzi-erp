/**
 * lib/domain/olcham-chegarasi.ts — egasi qarori 2026-09-22
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Sotuv ekranida o'lcham uchun HECH QANDAY chegara yo'q edi: yagona
 * tekshiruv «noldan katta va 1000 metrdan kichik» (`lib/sxema/sotuv.ts`).
 *
 * Ya'ni sotuvchi 4 metrli rulon parda yozsa, tizim uni qabul qilardi:
 * savat to'lardi, narx hisoblanardi, mijozdan oldindan to'lov olinardi,
 * buyurtma ishlab chiqarishga tushardi. Muammo USTANING oldida
 * chiqardi — rulon vali 4 metrda o'z og'irligidan egiladi va bunday
 * mahsulotni qilib bo'lmaydi.
 *
 * O'shanda: mato kesilgan (qaytmaydi), karniz kesilgan (qaytmaydi),
 * usta bir kun ishlagan (haqi to'lanadi), mijozga pul qaytariladi.
 * Hammasini sotuv paytida bir soniyada to'xtatish mumkin edi.
 *
 * ⚠️ EGASI QARORI: chegaradan chiqqan buyurtma BUTUNLAY TO'XTATILADI.
 *    «Bu o'lchamda mahsulot jismonan qilinmaydi — uni qabul qilish
 *    faqat zarar keltiradi.» Narxdan farqi shu: narx kelishiladi
 *    (TZ 3.8), jismoniy chegara esa kelishilmaydi.
 *
 * ⚠️ BO'SH CHEGARA — TEKSHIRUV YO'Q. Egasi raqamlarni ustasidan
 *    so'rab, bo'sh vaqtida turlarni bittalab to'ldiradi. To'ldirilmagan
 *    turda tizim avvalgidek ishlayveradi va hech narsa buzilmaydi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1) — hamma narsa parametr bo'lib keladi.
 *    Shuning uchun sotuv ekrani, server tekshiruvi va bot — uchalasi
 *    ham AYNI shu funksiyani chaqiradi (CLAUDE.md §3 «bir mantiq —
 *    bir joyda»).
 */

/** Mahsulot turining jismoniy chegarasi. `null` — chegara qo'yilmagan */
export interface OlchamChegarasi {
  readonly minEniM: number | null;
  readonly maksEniM: number | null;
  readonly minBoyiM: number | null;
  readonly maksBoyiM: number | null;
}

export type ChegaraNuqsoni =
  | { readonly tur: 'ENI_KICHIK'; readonly chegara: number; readonly qiymat: number }
  | { readonly tur: 'ENI_KATTA'; readonly chegara: number; readonly qiymat: number }
  | { readonly tur: 'BOYI_KICHIK'; readonly chegara: number; readonly qiymat: number }
  | { readonly tur: 'BOYI_KATTA'; readonly chegara: number; readonly qiymat: number };

/**
 * O'lcham chegaraga sig'adimi.
 *
 * ⚠️ RO'YXAT qaytaradi, birinchi xatoni emas: eni ham, bo'yi ham
 *    noto'g'ri bo'lsa sotuvchi IKKALASINI birdan ko'rsin. Bittalab
 *    aytilsa u o'lchamni ikki marta tuzatib, ikki marta xato oladi.
 *
 * ⚠️ Chegaraning O'ZI bilan tenglik O'TADI: «eng katta eni 2.80»
 *    degani 2.80 mumkin degani. Sohada chegara shunday tushuniladi —
 *    aynan 2.80 m li parda qilinadi.
 */
export function olchamniTekshir(
  chegara: OlchamChegarasi,
  eniM: number,
  boyiM: number,
): ChegaraNuqsoni[] {
  const nuqsonlar: ChegaraNuqsoni[] = [];

  if (chegara.minEniM !== null && eniM < chegara.minEniM) {
    nuqsonlar.push({ tur: 'ENI_KICHIK', chegara: chegara.minEniM, qiymat: eniM });
  }
  if (chegara.maksEniM !== null && eniM > chegara.maksEniM) {
    nuqsonlar.push({ tur: 'ENI_KATTA', chegara: chegara.maksEniM, qiymat: eniM });
  }
  if (chegara.minBoyiM !== null && boyiM < chegara.minBoyiM) {
    nuqsonlar.push({ tur: 'BOYI_KICHIK', chegara: chegara.minBoyiM, qiymat: boyiM });
  }
  if (chegara.maksBoyiM !== null && boyiM > chegara.maksBoyiM) {
    nuqsonlar.push({ tur: 'BOYI_KATTA', chegara: chegara.maksBoyiM, qiymat: boyiM });
  }

  return nuqsonlar;
}

/** Ikki xonagacha — ekranda «2.8» emas, «2.80 m» ko'rinadi */
function metr(x: number): string {
  return `${x.toFixed(2)} m`;
}

/**
 * Sotuvchiga ko'rsatiladigan xabar.
 *
 * ⚠️ Uch narsa aytiladi: NIMA chegara, QANCHA yozilgan va NEGA
 *    bo'lmaydi. Faqat «o'lcham noto'g'ri» deyilsa, sotuvchi raqamni
 *    tasodifiy o'zgartirib ko'raveradi.
 */
export function chegaraXabari(n: ChegaraNuqsoni, turNomi: string): string {
  switch (n.tur) {
    case 'ENI_KATTA':
      return `${turNomi} uchun eng katta eni — ${metr(n.chegara)}. Siz ${metr(n.qiymat)} yozdingiz: bu o'lchamda mexanizm ko'tarmaydi.`;
    case 'ENI_KICHIK':
      return `${turNomi} uchun eng kichik eni — ${metr(n.chegara)}. Siz ${metr(n.qiymat)} yozdingiz: bunchalik torga mexanizm sig'maydi.`;
    case 'BOYI_KATTA':
      return `${turNomi} uchun eng katta bo'yi — ${metr(n.chegara)}. Siz ${metr(n.qiymat)} yozdingiz.`;
    case 'BOYI_KICHIK':
      return `${turNomi} uchun eng kichik bo'yi — ${metr(n.chegara)}. Siz ${metr(n.qiymat)} yozdingiz.`;
  }
}

/**
 * Admin ekrani uchun — chegaralarning o'zi mantiqanmi.
 *
 * ⚠️ «Eng katta 2.00, eng kichik 2.50» deb yozilsa, HECH BIR
 *    o'lcham o'tmaydi va tur butunlay sotilmay qoladi. Buni
 *    saqlashdan OLDIN aytish kerak — aks holda sabab faqat
 *    birinchi mijoz oldida ma'lum bo'ladi.
 */
export function chegaralarMantiqiymi(chegara: OlchamChegarasi): string[] {
  const xatolar: string[] = [];

  if (
    chegara.minEniM !== null &&
    chegara.maksEniM !== null &&
    chegara.minEniM > chegara.maksEniM
  ) {
    xatolar.push("Eng kichik eni eng kattasidan katta — hech qanday o'lcham o'tmaydi");
  }
  if (
    chegara.minBoyiM !== null &&
    chegara.maksBoyiM !== null &&
    chegara.minBoyiM > chegara.maksBoyiM
  ) {
    xatolar.push("Eng kichik bo'yi eng kattasidan katta — hech qanday o'lcham o'tmaydi");
  }

  return xatolar;
}
