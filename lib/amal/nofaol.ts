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

export const OCHIRILADIGAN_TURLAR = [
  'material',
  'guruh',
  'mijoz',
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
    bandmi: async (tx, id) => {
      /**
       * ⚠️ Omborda qoldiq bo'lsa o'chirilmaydi. `CHIQINDI`,
       *    `ISHLATILDI` va `BRAK` — bular tugagan bo'laklar,
       *    ular to'smaydi.
       */
      const qoldiq = await son(tx`SELECT COUNT(*)::int AS n FROM bolak
           WHERE material_id = ${id} AND faol = true
             AND holat IN ('BOSH','BAND','YOLDA')`);
      if (qoldiq > 0) {
        return `omborda ${String(qoldiq)} ta bo'lak bor — avval ularni chiqarish kerak`;
      }

      const aksessuar = await son(tx`SELECT COUNT(*)::int AS n FROM mahsulot_aksessuar
           WHERE material_id = ${id} AND faol = true`);
      if (aksessuar > 0) {
        return `${String(aksessuar)} ta mahsulot turida ishlatilmoqda`;
      }

      return null;
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

      const ochiq = await son(tx`SELECT COUNT(*)::int AS n FROM buyurtma
           WHERE mijoz_id = ${id} AND holat NOT IN ('TOPSHIRILDI','BEKOR')`);
      if (ochiq > 0) return `${String(ochiq)} ta tugallanmagan buyurtmasi bor`;

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
    bandmi: async (tx, id) => {
      /**
       * ⚠️ Tugallanmagan buyurtma bo'lsa o'chirilmaydi: usta uni
       *    yasayotgan bo'lishi mumkin va tur yo'qolsa formula ham
       *    yo'qolardi.
       */
      const ochiq = await son(tx`SELECT COUNT(*)::int AS n FROM buyurtma_pozitsiya
           WHERE mahsulot_tur_id = ${id}
             AND holat NOT IN ('TOPSHIRILDI','BEKOR')`);
      if (ochiq > 0) return `${String(ochiq)} ta tugallanmagan buyurtmada ishlatilmoqda`;

      return null;
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
    bandmi: async (tx, id) => {
      const kassa = (await tx`
        SELECT COALESCE(SUM(y.summa), 0)::text AS qoldiq
        FROM kassa k
        LEFT JOIN kassa_yozuv y ON y.kassa_id = k.id
        WHERE k.xodim_id = ${id} AND k.faol = true`) as unknown as { qoldiq: string }[];

      if (Number(kassa[0]?.qoldiq ?? '0') !== 0) {
        return `kassasida ${kassa[0]?.qoldiq ?? '0'} qoldiq bor`;
      }

      const q = (await tx`
        SELECT COALESCE(SUM(summa), 0)::text AS qoldiq
        FROM xodim_harakat WHERE xodim_id = ${id}`) as unknown as { qoldiq: string }[];

      if (Number(q[0]?.qoldiq ?? '0') !== 0) {
        return `hisob-kitob yopilmagan: ${q[0]?.qoldiq ?? '0'}`;
      }

      return null;
    },
  },
};

export interface NofaolNatijasi {
  readonly holat: 'OCHIRILDI' | 'BAND';
  /** `BAND` bo'lsa — nega o'chirilmagani */
  readonly sabab: string | null;
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

    return { holat: 'OCHIRILDI', sabab: null };
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
