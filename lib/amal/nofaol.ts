/**
 * lib/amal/nofaol.ts — yozuvni o'chirish (nofaol qilish).
 *
 * ⚠️ O'CHIRISH = NOFAOL QILISH
 *
 *    §3 qat'iy qoidasi: `DELETE` yo'q. Yozuv `faol = false`
 *    bo'ladi va tarixda qoladi.
 *
 *    Egasi uchun farqi yo'q — yozuv ro'yxatlardan, dropdownlardan
 *    va sotuvdan YO'QOLADI. Lekin o'tgan yilgi buyurtmada uning
 *    nomi ko'rinib turadi. Aks holda eski hujjatlar «noma'lum
 *    material» bo'lib qolardi (2.3-invariant: o'tmish o'zgarmaydi).
 *
 * ⚠️ ISHLATILAYOTGAN NARSA O'CHIRILMAYDI
 *
 *    Har turga o'z tekshiruvi bor va u SABABNI aytadi. Omborda
 *    qoldig'i bor materialni o'chirsak, qoldiq egasiz qolardi.
 *    Qarzi bor mijozni o'chirsak, pul yo'qolgandek bo'lardi.
 *
 *    Tekshiruv TRANZAKSIYA ICHIDA, o'chirish bilan birga bo'ladi:
 *    aks holda tekshiruv bilan o'chirish orasida qoldiq paydo
 *    bo'lishi mumkin edi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';
import type { RuxsatKod } from '@/lib/ruxsat/kodlar';
import { YOPIQ_HOLATLAR } from '@/lib/domain/buyurtma';
import { nofaolQilinadimi, type Balans } from '@/lib/domain/balans';
import { dollar, nolmi, pulKorsat, pulMatn, som } from '@/lib/domain/pul';

export const OCHIRILADIGAN_TURLAR = [
  'material',
  'guruh',
  'mijoz',
  'mijozTuri',
  'mijozGuruh',
  'yetkazib',
  'mahsulot',
  'kassa',
  'filial',
  'xodim',
] as const;

export type OchiriladiganTur = (typeof OCHIRILADIGAN_TURLAR)[number];

interface TurTavsifi {
  /** Bazadagi jadval nomi */
  readonly jadval: string;
  /** Ekranda ko'rsatiladigan nom */
  readonly nom: string;
  /**
   * Qaysi ruxsat kodi kerak.
   *
   * ⚠️ O'chirish alohida ruxsat EMAS, tahrirlash bilan bir xil:
   *    kim yozuvni o'zgartira olsa, uni ro'yxatdan olib ham
   *    tashlay oladi. Asosiy himoya ruxsatda emas —
   *    ISHLATILAYOTGANINI tekshirishda.
   *
   *    Kassada `.ozgartir` kodi yo'q, shuning uchun `kassa.yarat`:
   *    kim kassa ocha olsa, uni yopa ham oladi.
   */
  readonly ruxsat: RuxsatKod;
  /**
   * Ishlatilayotgan bo'lsa SABABNI qaytaradi, aks holda `null`.
   *
   * ⚠️ Sabab TUSHUNARLI bo'lishi kerak: «FK constraint violation»
   *    emas, «omborda 4 ta bo'lak bor» kabi.
   */
  readonly bandmi: (tx: Tranzaksiya, id: number) => Promise<string | null>;
  /**
   * O'chirilgandan KEYIN bajariladigan ish va odamga aytiladigan
   * xabar.
   *
   * ⚠️ NEGA KERAK: ba'zi bog'liqlik o'chirishni TO'SMAYDI, lekin
   *    jimgina qolib ketsa ham bo'lmaydi. Masalan material
   *    mahsulot turida aksessuar bo'lib tursa — material
   *    o'chirilgach, u tur ham shu aksessuarsiz qolishi kerak,
   *    va egasi buni BILISHI kerak.
   *
   *    Shuning uchun bu qadam ham TRANZAKSIYA ichida: yo ikkalasi
   *    bo'ladi, yo hech biri (2.1-invariant).
   */
  readonly ochirilgandan?: (tx: Tranzaksiya, id: number) => Promise<string | null>;
}

/**
 * ⚠️ `postgres.Sql` EMAS: tranzaksiya turida `end()` va `begin()`
 *    yo'q. `lib/amal/band.ts` ham shu turni ishlatadi.
 */
type Tranzaksiya = postgres.TransactionSql;

/** Bitta son qaytaradigan so'rovni o'qiydi. */
async function son(sorov: Promise<unknown>): Promise<number> {
  const q = (await sorov) as { n: number }[];
  return q[0]?.n ?? 0;
}

export const TUR_TAVSIFI: Record<OchiriladiganTur, TurTavsifi> = {
  material: {
    jadval: 'material',
    nom: 'Material',
    ruxsat: 'material.ozgartir',
    // Hech qanday to'siq yo'q — sababi quyida
    bandmi: () => {
      /**
       * ⚠️ OMBORDA QOLDIQ BO'LSA HAM O'CHIRILADI (egasi, 2026-09-06).
       *
       *    Ilgari bu yerda «omborda N ta bo'lak bor» degan to'siq
       *    turardi. Egasi uni olib tashlashni so'radi va u haq:
       *    material ro'yxatdan chiqarilishi — «buni endi
       *    sotmaymiz» degani, omborda qolgani esa baribir
       *    sotilib yoki hisobdan chiqarilib ketadi.
       *
       * ⚠️ LEKIN QOLDIQ KO'RINMAY QOLMASLIGI SHART.
       *
       *    To'siq bejiz qo'yilmagan edi: `omborQiymati` hisoboti
       *    (11.7.1) faqat FAOL materialni sanardi, ya'ni nofaol
       *    qilingan materialning matosi omborda turib, ombor
       *    QIYMATIDAN yo'qolardi — pul kitobdan chiqib ketardi.
       *
       *    Shuning uchun to'siq bilan BIRGA hisobot ham tuzatildi:
       *    endi qoldiq materialning holatidan qat'i nazar sanaladi.
       *    Ombor ro'yxati buni allaqachon to'g'ri qilardi.
       */

      /**
       * ⚠️ 2026-09-03: ilgari bu yerda «N ta mahsulot turida
       *    ishlatilmoqda» degan TO'SIQ ham bor edi. Egasi uni
       *    olib tashlashni so'radi va u haq:
       *
       *    Mahsulot turida ishlatilishi materialning o'zini
       *    qamab qo'yish uchun sabab emas. Eski buyurtmalar
       *    `formula_snapshot` bilan ishlaydi (2.3-invariant),
       *    ya'ni ular baribir buzilmaydi. Yagona haqiqiy ish —
       *    turdan ham chiqarib qo'yish, va u endi
       *    `ochirilgandan` da avtomatik bajariladi.
       *
       *    2026-09-06 da omborda qoldiq borligi ham to'siq
       *    bo'lishdan chiqdi — yuqoridagi izohga qara. Endi bu
       *    material HECH QACHON to'silmaydi.
       */
      return Promise.resolve(null);
    },

    ochirilgandan: async (tx, id) => {
      const q = (await tx`
        UPDATE mahsulot_aksessuar
        SET faol = false, ozgartirildi = now()
        WHERE material_id = ${id} AND faol = true
        RETURNING mahsulot_tur_id`) as unknown as { mahsulot_tur_id: number }[];

      if (q.length === 0) return null;

      const turlar = new Set(q.map((x) => x.mahsulot_tur_id)).size;
      return (
        `${String(turlar)} ta mahsulot turidan ham chiqarildi — ` +
        `o'sha turlarga endi bu aksessuar qo'shilmaydi`
      );
    },
  },

  guruh: {
    jadval: 'almashtirish_guruh',
    nom: 'Guruh',
    ruxsat: 'material.ozgartir',
    bandmi: async (tx, id) => {
      const material = await son(tx`SELECT COUNT(*)::int AS n FROM material
           WHERE almashtirish_guruh_id = ${id} AND faol = true`);
      if (material > 0) {
        return `${String(material)} ta material shu guruhda — avval ularni boshqa guruhga o'tkazing`;
      }

      const slot = await son(tx`SELECT COUNT(*)::int AS n FROM mahsulot_slot
           WHERE almashtirish_guruh_id = ${id} AND faol = true`);
      if (slot > 0) {
        return `${String(slot)} ta mahsulot turida ishlatilmoqda`;
      }

      return null;
    },
  },

  mijoz: {
    jadval: 'mijoz',
    nom: 'Mijoz',
    ruxsat: 'mijoz.ozgartir',
    bandmi: async (tx, id) => {
      /**
       * ⚠️ Qarzi bor mijoz o'chirilmaydi — qarz egasiz qolardi va
       *    hisobotdan yo'qolardi. Avval qarz yopiladi yoki
       *    umidsiz deb hisobdan chiqariladi (6.10).
       */
      const q = (await tx`
        SELECT valyuta, SUM(summa)::text AS qarz
        FROM mijoz_harakat WHERE mijoz_id = ${id}
        GROUP BY valyuta HAVING SUM(summa) <> 0`) as unknown as {
        valyuta: string;
        qarz: string;
      }[];

      if (q.length > 0) {
        const r = q
          .map((x) => `${x.qarz} ${x.valyuta === 'USD' ? '$' : "so'm"}`)
          .join(', ');
        return `qarzi bor: ${r} — avval yopish yoki hisobdan chiqarish kerak (6.10)`;
      }

      /**
       * ⚠️ 2026-08-29: bu yerda `buyurtma.holat` yozilgan edi —
       *    BUNDAY USTUN YO'Q. TZ 8.2: «buyurtmaning umumiy
       *    statusi yo'q», holat har POZITSIYADA turadi.
       *
       *    Natijada har «o'chirish» SQL xatosi bilan yiqilardi
       *    va mijoz ro'yxatda qolaverardi. Ekranda esa faqat
       *    «O'chirib bo'lmadi» degan qisqa yozuv chiqardi.
       */
      const ochiq = await son(tx`
        SELECT COUNT(DISTINCT b.id)::int AS n
        FROM buyurtma b
        JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
        WHERE b.mijoz_id = ${id}
          AND p.holat <> ALL (${YOPIQ_HOLATLAR})`);
      if (ochiq > 0) return `${String(ochiq)} ta tugallanmagan buyurtmasi bor`;

      return null;
    },
  },

  mijozTuri: {
    jadval: 'mijoz_turi',
    nom: 'Mijoz turi',
    ruxsat: 'mijoz.ozgartir',
    bandmi: async (tx, id) => {
      /**
       * TZ 14.9 — «ishlatilayotgan YAGONA turni nofaol qilish
       * bloklanadi» («Naqd» to'lov usuli misoli kabi).
       *
       * ⚠️ Turda mijoz turgani O'ZI to'siq emas: tur tarixda
       *    qoladi va eski buyurtmalar narxi o'zgarmaydi
       *    (2.3-invariant). To'siq faqat BOSHQA FAOL TUR
       *    qolmaganda — aks holda yangi mijozni umuman
       *    ro'yxatga olib bo'lmasdi.
       */
      const mijozlar = await son(tx`SELECT COUNT(*)::int AS n FROM mijoz
           WHERE mijoz_turi_id = ${id} AND faol = true`);

      const boshqa = await son(tx`SELECT COUNT(*)::int AS n FROM mijoz_turi
           WHERE id <> ${id} AND faol = true`);

      if (mijozlar > 0 && boshqa === 0) {
        return `${String(mijozlar)} ta mijoz shu turda va boshqa faol tur yo'q — ` +
          `avval yangi tur qo'shing`;
      }
      return null;
    },
  },

  mijozGuruh: {
    jadval: 'mijoz_guruh',
    nom: 'Mijoz guruhi',
    ruxsat: 'mijoz.ozgartir',
    bandmi: async (tx, id) => {
      /**
       * ⚠️ Guruhda mijoz turgan bo'lsa o'chirilmaydi.
       *
       *    Avtomatik uzib qo'yish XAVFLI: o'nlab mijoz
       *    bildirmasdan chegirmasiz qolardi va buni faqat
       *    mijoz «narx nega oshdi?» deganda bilardik.
       *
       *    Shuning uchun avval mijozlarni boshqa guruhga
       *    o'tkazish kerak — bu ongli qaror.
       */
      const n = await son(tx`SELECT COUNT(*)::int AS n FROM mijoz
           WHERE mijoz_guruh_id = ${id} AND faol = true`);
      if (n > 0) {
        return `${String(n)} ta mijoz shu guruhda — avval ularni boshqa guruhga o'tkazing`;
      }
      return null;
    },
  },

  yetkazib: {
    jadval: 'yetkazib_beruvchi',
    nom: 'Yetkazib beruvchi',
    ruxsat: 'yetkazib.ozgartir',
    bandmi: async (tx, id) => {
      const q = (await tx`
        SELECT valyuta, SUM(summa)::text AS qarz
        FROM yetkazib_beruvchi_harakat WHERE yetkazib_beruvchi_id = ${id}
        GROUP BY valyuta HAVING SUM(summa) <> 0`) as unknown as {
        valyuta: string;
        qarz: string;
      }[];

      if (q.length > 0) {
        const r = q
          .map((x) => `${x.qarz} ${x.valyuta === 'USD' ? '$' : "so'm"}`)
          .join(', ');
        return `hisob-kitob yopilmagan: ${r}`;
      }

      return null;
    },
  },

  mahsulot: {
    jadval: 'mahsulot_tur',
    nom: 'Mahsulot turi',
    ruxsat: 'mahsulot.ozgartir',
    /**
     * ⚠️ 2026-09-03: bu yerda «N ta tugallanmagan buyurtmada
     *    ishlatilmoqda» degan to'siq bor edi — OLIB TASHLANDI.
     *
     *    Eski izohda «tur yo'qolsa formula ham yo'qoladi»
     *    deyilgan edi, lekin bu NOTO'G'RI: pozitsiyada
     *    `formula_snapshot` turadi (4.10) va ishlab chiqarish
     *    o'shandan o'qiydi. Tur nomi ham yo'qolmaydi — yozuv
     *    bazada qoladi, faqat `faol = false` bo'ladi.
     *
     *    Ya'ni tur o'chirilgach:
     *      · yangi buyurtmada uni TANLAB BO'LMAYDI
     *      · eski buyurtma o'z holicha ishlaydi va TUGATILADI
     *
     *    Aynan egasi so'ragan xatti-harakat, va u xavfsiz.
     */
    /** ⚠️ Hech qanday to'siq yo'q — shuning uchun kutish ham yo'q */
    bandmi: () => Promise.resolve(null),

    ochirilgandan: async (tx, id) => {
      const ochiq = await son(tx`SELECT COUNT(*)::int AS n FROM buyurtma_pozitsiya
           WHERE mahsulot_tur_id = ${id}
             AND holat <> ALL (${YOPIQ_HOLATLAR})`);

      if (ochiq === 0) return null;

      return (
        `${String(ochiq)} ta tugallanmagan buyurtmada ishlatilmoqda — ` +
        `ular ishlashda davom etadi va tugatiladi, faqat yangi ` +
        `buyurtmaga bu tur qo'shilmaydi`
      );
    },
  },

  kassa: {
    jadval: 'kassa',
    nom: 'Kassa',
    ruxsat: 'kassa.yarat',
    bandmi: async (tx, id) => {
      /**
       * ⚠️ Ichida puli bor kassa o'chirilmaydi — pul yo'qolgandek
       *    bo'lardi. Avval topshirish yoki ayirboshlash orqali
       *    bo'shatiladi.
       */
      const q = (await tx`
        SELECT COALESCE(SUM(summa), 0)::text AS qoldiq
        FROM kassa_yozuv WHERE kassa_id = ${id}`) as unknown as { qoldiq: string }[];

      const qoldiq = Number(q[0]?.qoldiq ?? '0');
      if (qoldiq !== 0) {
        return `kassada ${q[0]?.qoldiq ?? '0'} qoldiq bor — avval bo'shatish kerak`;
      }

      return null;
    },
  },

  filial: {
    jadval: 'filial',
    nom: 'Filial',
    ruxsat: 'filial.ozgartir',
    bandmi: async (tx, id) => {
      const bosh = (await tx`
        SELECT bosh FROM filial WHERE id = ${id}`) as unknown as { bosh: boolean }[];
      if (bosh[0]?.bosh === true) return "bosh filial o'chirilmaydi";

      const bolak = await son(tx`SELECT COUNT(*)::int AS n FROM bolak
           WHERE filial_id = ${id} AND faol = true
             AND holat IN ('BOSH','BAND','YOLDA')`);
      if (bolak > 0) return `omborida ${String(bolak)} ta bo'lak bor`;

      const xodim = await son(tx`SELECT COUNT(*)::int AS n FROM xodim
           WHERE filial_id = ${id} AND faol = true`);
      if (xodim > 0) return `${String(xodim)} ta xodim biriktirilgan`;

      return null;
    },
  },

  xodim: {
    jadval: 'xodim',
    nom: 'Xodim',
    ruxsat: 'xodim.ozgartir',
    /**
     * TZ 10.4 — «Balansi 0 dan farq qiladigan xodimni NOFAOL QILIB
     * BO'LMAYDI.»
     *
     * ⚠️ VALYUTALAR ALOHIDA TEKSHIRILADI (1.3-invariant).
     *
     *    Ilgari ikkalasi bitta `SUM(summa)` bilan qo'shilardi.
     *    Bu shunchaki noaniqlik emas — XAVFSIZLIK TESHIGI edi:
     *
     *      +1 000 so'm  va  −1 000 dollar  →  yig'indi NOL
     *
     *    Tizim «hisob-kitob yopilgan» deb xodimni nofaol qilardi,
     *    holbuki ikkala tomonda ham pul osilib turardi. Teskarisi
     *    ham bo'lardi: haqiqatan yopilgan hisob «ochiq» ko'rinib,
     *    ishdan bo'shagan xodimni ro'yxatdan chiqarib bo'lmasdi.
     */
    bandmi: async (tx, id) => {
      const kassa = (await tx`
        SELECT COALESCE(SUM(y.summa) FILTER (WHERE y.valyuta = 'SOM'), 0)::text AS som,
               COALESCE(SUM(y.summa) FILTER (WHERE y.valyuta = 'USD'), 0)::text AS dollar
        FROM kassa k
        LEFT JOIN kassa_yozuv y ON y.kassa_id = k.id
        WHERE k.xodim_id = ${id} AND k.faol = true`) as unknown as {
        som: string;
        dollar: string;
      }[];

      /**
       * ⚠️ QAROR DOMENDA, bu yerda emas (§2.2).
       *
       *    «Balans nolmi» savoliga `nofaolQilinadimi()` javob beradi —
       *    u TZ 10.4 ni o'qib yozilgan va o'z testlari bor. Ilgari bu
       *    yerda `Number(...) !== 0` turardi: qoida ikki joyda edi va
       *    pul JavaScript soni bilan solishtirilardi (CLAUDE.md §3 buni
       *    taqiqlaydi — katta summada aniqlik yo'qoladi).
       */
      const kassaBalansi: Balans = {
        som: som(kassa[0]?.som ?? '0'),
        dollar: dollar(kassa[0]?.dollar ?? '0'),
      };

      if (!nofaolQilinadimi(kassaBalansi)) {
        if (!nolmi(kassaBalansi.som)) {
          return `kassasida ${pulKorsat(kassaBalansi.som)} so'm qoldiq bor`;
        }
        return `kassasida ${pulMatn(kassaBalansi.dollar)} dollar qoldiq bor`;
      }

      const q = (await tx`
        SELECT COALESCE(SUM(summa) FILTER (WHERE valyuta = 'SOM'), 0)::text AS som,
               COALESCE(SUM(summa) FILTER (WHERE valyuta = 'USD'), 0)::text AS dollar
        FROM xodim_harakat WHERE xodim_id = ${id}`) as unknown as {
        som: string;
        dollar: string;
      }[];

      const balans: Balans = {
        som: som(q[0]?.som ?? '0'),
        dollar: dollar(q[0]?.dollar ?? '0'),
      };

      if (!nofaolQilinadimi(balans)) {
        if (!nolmi(balans.som)) {
          return `hisob-kitob yopilmagan: ${pulKorsat(balans.som)} so'm`;
        }
        return `hisob-kitob yopilmagan: ${pulMatn(balans.dollar)} dollar`;
      }

      return null;
    },
  },
};

export interface NofaolNatijasi {
  readonly holat: 'OCHIRILDI' | 'BAND';
  /** `BAND` bo'lsa — nega o'chirilmagani */
  readonly sabab: string | null;
  /**
   * O'chirildi, LEKIN yon ta'siri bor — odam bilishi kerak.
   * Xato emas: ekranda oddiy eslatma bo'lib chiqadi.
   */
  readonly izoh?: string | null;
}

/**
 * Yozuvni nofaol qiladi.
 *
 * ⚠️ Tekshiruv va o'chirish BITTA tranzaksiyada (2.1-invariant):
 *    aks holda tekshiruv o'tgandan keyin, o'chirishdan oldin
 *    qoldiq paydo bo'lishi mumkin edi.
 */
export async function nofaolQil(
  ulanish: postgres.Sql,
  tur: OchiriladiganTur,
  id: number,
  xodimId: number,
): Promise<NofaolNatijasi> {
  const tavsif = TUR_TAVSIFI[tur];

  return ulanish.begin(async (tx) => {
    const bor = (await tx`
      SELECT faol FROM ${tx(tavsif.jadval)} WHERE id = ${id}`) as unknown as {
      faol: boolean;
    }[];

    if (bor[0] === undefined) {
      throw new BiznesXato('YOZUV_YOQ', `${tavsif.nom} topilmadi`);
    }

    // Allaqachon o'chirilgan bo'lsa — takroriy bosish, xato emas
    if (!bor[0].faol) return { holat: 'OCHIRILDI', sabab: null };

    const sabab = await tavsif.bandmi(tx, id);
    if (sabab !== null) return { holat: 'BAND', sabab };

    await tx`
      UPDATE ${tx(tavsif.jadval)}
      SET faol = false, ochirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${id}`;

    /** ⚠️ Yon ta'sir ham SHU tranzaksiyada (2.1-invariant) */
    const izoh =
      tavsif.ochirilgandan === undefined ? null : await tavsif.ochirilgandan(tx, id);

    return { holat: 'OCHIRILDI', sabab: null, izoh };
  });
}

/**
 * O'chirilgan yozuvni qaytaradi.
 *
 * ⚠️ Kerak, chunki o'chirish qaytarib bo'lmaydigan bo'lsa odam
 *    undan qo'rqadi va keraksiz yozuvlar ro'yxatda to'planib
 *    qolaveradi.
 */
export async function qaytar(
  ulanish: postgres.Sql,
  tur: OchiriladiganTur,
  id: number,
  xodimId: number,
): Promise<void> {
  const tavsif = TUR_TAVSIFI[tur];

  await ulanish`
    UPDATE ${ulanish(tavsif.jadval)}
    SET faol = true, ochirildi = NULL, ozgartirdi_id = ${xodimId}
    WHERE id = ${id}`;
}
