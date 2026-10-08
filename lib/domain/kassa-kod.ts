/**
 * lib/domain/kassa-kod.ts — kassa kodlari va manba ko'rinishi (TZ 12.5 · 12.6).
 * Kassa auditi 2026-10-08.
 *
 * ⚠️ BITTA JOY. Ilgari nomlar `kassa/page.tsx` ichida turardi va
 *    K10, K11, C11, C12 (ayirboshlash va filiallararo to'lov) YO'Q edi —
 *    kassa kitobida ular xom «C11» bo'lib chiqardi.
 *
 * ⚠️ Manba ustunida `buyurtma#12` kabi ichki belgi chiqardi. Endi —
 *    odam o'qiydigan nom va (bo'lsa) hujjatga havola.
 */

export const KASSA_KOD_NOMI: Readonly<Record<string, string>> = {
  K1: "Buyurtma to'lovi",
  K2: "Buyurtma to'lovi (keyin)",
  K3: "Mijoz qarzini to'lash",
  K4: 'Mijoz avansi',
  K5: 'Hisobdan chiqarilgan qarz qaytdi',
  K6: "Egasi pul qo'shdi",
  K7: 'Sotuvchidan topshiriq',
  K8: "Boshlang'ich qoldiq",
  K9: 'Boshqa kirim',
  K10: 'Ayirboshlash — kirdi',
  K11: "Filialdan qarz to'lovi",
  C1: "Yetkazib beruvchiga to'lov",
  C2: 'Yetkazib beruvchiga avans',
  C3: "Transport / bojxona to'lovi",
  C4: "Ish haqi to'lovi",
  C5: 'Xodimga avans',
  C6: 'Mijozga qaytarish',
  C7: 'Operatsion xarajat',
  C8: 'Egasi pul oldi',
  C9: 'Adminga topshiriq',
  C10: 'Boshqa chiqim',
  C11: 'Ayirboshlash — chiqdi',
  C12: "Filialga qarz to'lovi",
};

export function kassaKodNomi(kod: string): string {
  return KASSA_KOD_NOMI[kod] ?? kod;
}

export interface ManbaKorinishi {
  readonly matn: string;
  /** Hujjat sahifasi; `null` — alohida sahifasi yo'q */
  readonly havola: string | null;
}

/**
 * @param nom bazadan topilgan nom yoki raqam (buyurtma raqami, mijoz ismi…);
 *   topilmasa `null` — shunda ham ichki belgi emas, tur nomi chiqadi.
 */
export function manbaKorinishi(
  turi: string,
  id: number,
  nom: string | null,
  /** Qaytarishda — pozitsiyaning buyurtmasi (havola shunga) */
  bogliqId: number | null = null,
): ManbaKorinishi {
  const n = nom ?? `№${String(id)}`;
  switch (turi) {
    case 'buyurtma':
      return { matn: `Buyurtma ${n}`, havola: `/buyurtma/${String(id)}` };
    case 'qaytarish':
      // manba — pozitsiya; nom — uning buyurtmasi raqami
      return {
        matn: `Qaytarish · buyurtma ${n}`,
        havola: bogliqId === null ? null : `/buyurtma/${String(bogliqId)}`,
      };
    case 'mijoz':
      return { matn: `Mijoz: ${n}`, havola: `/mijoz/${String(id)}` };
    case 'kirim':
      return { matn: `Kirim ${n}`, havola: `/ombor/kirim/${String(id)}` };
    case 'yetkazib_beruvchi':
      return { matn: `Yetkazib beruvchi: ${n}`, havola: `/yetkazib/${String(id)}` };
    case 'xodim':
      return { matn: `Xodim: ${n}`, havola: `/kassa/xodim/${String(id)}` };
    case 'topshiriq':
      return { matn: nom === null ? 'Topshiriq' : `Topshiriq: ${nom}`, havola: null };
    case 'ayirboshlash':
      return { matn: 'Valyuta ayirboshlash', havola: null };
    case 'filial_tolov':
      return { matn: 'Filiallararo qarz', havola: null };
    case 'egasi':
      return { matn: 'Egasi', havola: null };
    case 'qolda':
      return { matn: "Qo'lda kiritilgan", havola: null };
    case 'kassa_boshlangich':
      return { matn: "Boshlang'ich qoldiq", havola: null };
    case 'storno':
      return { matn: `Storno · yozuv №${String(id)}`, havola: null };
    default:
      return { matn: n, havola: null };
  }
}
