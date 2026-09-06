/**
 * lib/amal/davo.ts — TZ 9.9 · 7.9 · 12.1 · 2.1-invariant
 *
 * Yetkazib beruvchiga qo'yilgan DA'VONI hal qilish.
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 *    TZ 9.9: «Kirimda "qaytariladi" deb belgilangan defekt hal
 *    qilinmaguncha shu tabda turadi. Ikki tugma: "Qabul qildi" —
 *    qarzdan chegiriladi, da'vo yopiladi. "O'zimizga" — material
 *    brakka chiqadi, zarar bizda qoladi.»
 *
 *    2026-09-03 auditigacha da'vo qo'yish bor edi, HAL QILISH yo'q:
 *    defekt kirimda belgilanardi va abadiy ochiq qolardi.
 *
 * ⚠️ IKKI YO'LNING PUL OQIMI BUTUNLAY BOSHQACHA:
 *
 *    QABUL     → yetkazib beruvchi qarzi KAMAYADI (`DAVO` harakati).
 *                Xarajat YO'Q: biz hech narsa yo'qotmadik.
 *    O'ZIMIZGA → XARAJAT yoziladi (`YETKAZIB_BERUVCHI_DEFEKTI`).
 *                Qarz o'zgarmaydi: molni to'liq to'laymiz.
 *
 *    Ikkalasi ham KASSAGA TEGMAYDI (12.1): pul hech qayerga
 *    ko'chmadi — biri qarzni, ikkinchisi foydani o'zgartiradi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { xarajatYozTx } from './kassa';
import { BiznesXato } from '@/lib/xato';

/** TZ 9.9 — ikki tugma. */
export type DavoQarori = 'QABUL' | 'OZIMIZGA';

export interface DavoKirimi {
  readonly kirimQatorId: number;
  readonly qaror: DavoQarori;
  readonly izoh: string | null;
}

export interface DavoNatijasi {
  readonly qaror: DavoQarori;
  /** Qarzdan chegirilgan yoki xarajatga yozilgan summa */
  readonly summa: string;
  readonly valyuta: string;
  readonly materialNomi: string;
}

interface Qator {
  readonly id: number;
  readonly kirim_id: number;
  readonly defekt_miqdor: string;
  readonly defekt_turi: string | null;
  readonly narx_birlik: string;
  readonly tannarx_birlik: string;
  readonly material_nomi: string;
  readonly kirim_raqam: string;
  readonly kirim_holat: string;
  readonly valyuta: string;
  readonly kurs_snapshot: string | null;
  readonly yetkazib_beruvchi_id: number;
  readonly filial_id: number;
}

/**
 * TZ 9.9 — da'voni hal qiladi.
 *
 * ⚠️ Bitta tranzaksiyada: qaror yoziladi, qator holati yangilanadi va
 *    audit qoladi. Yarim hal qilingan da'vo bo'lmaydi (2.1).
 */
export async function davoniHalQil(
  ulanish: postgres.Sql,
  kirim: DavoKirimi,
  xodimId: number,
): Promise<DavoNatijasi> {
  return ulanish.begin(async (tx) => {
    const q = await tx<Qator[]>`
      SELECT kq.id, kq.kirim_id, kq.defekt_miqdor::text, kq.defekt_turi,
             kq.narx_birlik::text, kq.tannarx_birlik::text,
             m.nom AS material_nomi,
             k.raqam AS kirim_raqam, k.holat AS kirim_holat, k.valyuta,
             k.kurs_snapshot::text, k.yetkazib_beruvchi_id, k.filial_id
      FROM kirim_qator kq
      JOIN kirim k ON k.id = kq.kirim_id
      JOIN material m ON m.id = kq.material_id
      WHERE kq.id = ${kirim.kirimQatorId}
      FOR UPDATE OF kq`;

    const r = q[0];
    if (r === undefined) throw new BiznesXato('KIRIM_TOPILMADI', String(kirim.kirimQatorId));

    if (r.kirim_holat !== 'FAOL') {
      throw new BiznesXato('KIRIM_STORNO_QILINGAN', r.kirim_raqam);
    }

    const miqdor = new Decimal(r.defekt_miqdor);
    if (miqdor.lessThanOrEqualTo(0)) {
      throw new BiznesXato('DAVO_YOQ', r.kirim_raqam);
    }

    /**
     * ⚠️ Faqat «qaytariladi» da'vo bo'ladi. «Hisobdan chiqadi»
     *    allaqachon bizning zararimiz — hal qiladigan narsa yo'q.
     */
    if (r.defekt_turi !== 'QAYTARILADI') {
      throw new BiznesXato('DAVO_YOPILGAN', r.kirim_raqam);
    }

    const bor = await tx<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM yetkazib_beruvchi_harakat
      WHERE turi = 'DAVO' AND manba_turi = 'kirim_qator'
        AND manba_id = ${kirim.kirimQatorId}`;

    if ((bor[0]?.n ?? 0) > 0) {
      throw new BiznesXato('DAVO_YOPILGAN', r.kirim_raqam);
    }

    const izoh =
      kirim.izoh === null || kirim.izoh.trim() === '' ? null : kirim.izoh.trim();

    if (kirim.qaror === 'QABUL') {
      /**
       * TZ 9.9 — «Qabul qildi: qarzdan chegiriladi.»
       *
       * ⚠️ Summa KIRIM NARXIDA — biz shuncha to'lashimiz kerak edi,
       *    endi shuncha kam to'laymiz. Tannarx emas: tannarxga
       *    transport ham kirgan, uni yetkazib beruvchi qaytarmaydi.
       *
       * ⚠️ Qarz hujjat valyutasida kamayadi (1.3) va kurs kirim
       *    kunidagi kursda qoladi (2.3).
       */
      const summa = miqdor.times(new Decimal(r.narx_birlik)).toFixed(2);

      await tx`
        INSERT INTO yetkazib_beruvchi_harakat
          (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
           manba_turi, manba_id, izoh, xodim_id)
        VALUES (${r.yetkazib_beruvchi_id}, ${r.filial_id}, 'DAVO',
                ${`-${summa}`}, ${r.valyuta}, ${r.kurs_snapshot},
                'kirim_qator', ${kirim.kirimQatorId},
                ${izoh ?? `Da'vo qabul qilindi — ${r.material_nomi}`}, ${xodimId})`;

      await tx`
        INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                  eski_qiymat, yangi_qiymat, izoh)
        VALUES (${xodimId}, ${r.filial_id}, 'DAVO_HAL', 'kirim_qator',
                ${kirim.kirimQatorId},
                ${tx.json({ defekt_turi: 'QAYTARILADI', ochiq: true })},
                ${tx.json({ qaror: 'QABUL', summa, valyuta: r.valyuta })},
                ${izoh ?? "Da'vo qabul qilindi (9.9)"})`;

      return {
        qaror: 'QABUL',
        summa,
        valyuta: r.valyuta,
        materialNomi: r.material_nomi,
      } as const;
    }

    /**
     * TZ 9.9 — «O'zimizga: material brakka chiqadi, zarar bizda
     * qoladi.»
     *
     * ⚠️ Ombor qoldig'iga TEGILMAYDI: «qaytariladi» defekt omborga
     *    UMUMAN KIRMAGAN (7.9 · `birlikTannarxi`). Shuning uchun
     *    chiqaradigan bo'lak yo'q — faqat zarar tan olinadi.
     *
     * ⚠️ Zarar TANNARXDA: mol bizda qoldi, unga transport ham
     *    to'langan.
     */
    const zarar = miqdor.times(new Decimal(r.tannarx_birlik)).toFixed(2);

    /** Qator holati rostlanadi — endi bu da'vo emas, bizning brakimiz */
    await tx`
      UPDATE kirim_qator SET defekt_turi = 'HISOBDAN_CHIQADI'
      WHERE id = ${kirim.kirimQatorId}`;

    // 12.1 — pul chiqmagan xarajat
    await xarajatYozTx(
      tx,
      {
        sana: new Date().toISOString().slice(0, 10),
        filialId: r.filial_id,
        modda: 'YETKAZIB_BERUVCHI_DEFEKTI',
        summa: zarar,
        valyuta: 'SOM',
        kassaYozuvId: null,
        manbaTuri: 'kirim_qator',
        manbaId: kirim.kirimQatorId,
        izoh: izoh ?? `Da'vo rad etildi — ${r.material_nomi} (${r.kirim_raqam})`,
      },
      xodimId,
    );

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${r.filial_id}, 'DAVO_HAL', 'kirim_qator',
              ${kirim.kirimQatorId},
              ${tx.json({ defekt_turi: 'QAYTARILADI', ochiq: true })},
              ${tx.json({ qaror: 'OZIMIZGA', zarar, defekt_turi: 'HISOBDAN_CHIQADI' })},
              ${izoh ?? "Zarar o'zimizga olindi (9.9)"})`;

    return {
      qaror: 'OZIMIZGA',
      summa: zarar,
      valyuta: 'SOM',
      materialNomi: r.material_nomi,
    } as const;
  });
}
