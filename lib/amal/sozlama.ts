/**
 * lib/amal/sozlama.ts — TZ 14.3 · 14.4 · QISM 1 §10 (U-08)
 *
 * Korxona rekvizitlari va chekka tegishli sozlamalar.
 *
 * ⚠️ NEGA KERAK EDI
 *
 *    `sozlama` jadvali poydevor bosqichidan beri BO'SH turardi:
 *    o'quvchi kod ham, yozuvchi kod ham yo'q edi. Chekda korxona
 *    nomi kerak bo'ldi va uni kodga yozib qo'yish eng oson yo'l
 *    edi — TZ 14.3 aynan buni taqiqlaydi: «Korxona ma'lumotlari:
 *    nomi · manzili · telefoni · logotipi. Chek, kvitansiya,
 *    hisob-kitob varaqasi va ish varaqasida chiqadi.»
 *
 * ⚠️ Nom kodga yozilsa, uni o'zgartirish uchun dasturchi kerak
 *    bo'lardi. Egasi telefon raqamini o'zi almashtira olishi shart.
 *
 * ⚠️ QISM 1 §10 U-08 — sozlama o'zgarishi AUDIT JURNALIGA tushadi.
 *    Chekdagi rekvizit soliqqa ko'rinadigan narsa: kim va qachon
 *    o'zgartirgani yozilib qolishi kerak.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';
import { farqniAjrat, ozgarishBormi } from '@/lib/audit/amallar';

/** Tranzaksiya ichida ham, tashqarisida ham o'qiladi */
type Soruvchi = postgres.Sql | postgres.TransactionSql;

// ─── 14.3 · Kalitlar ──────────────────────────────────────────────────────

/**
 * Chekda va boshqa hujjatlarda ishlatiladigan sozlamalar.
 *
 * ⚠️ Kalit nomi BAZADA turadi va o'zgarmaydi (QARORLAR-KOD P-08):
 *    o'zgartirilsa eski qator yetim qolib, qiymat yo'qoladi.
 */
export const KORXONA_KALITLARI = [
  'korxona_nom',
  'korxona_manzil',
  'korxona_telefon',
  'bot_username',
  'filial_kod',
] as const;

export type KorxonaKalit = (typeof KORXONA_KALITLARI)[number];

export interface KalitTavsifi {
  readonly nom: string;
  readonly izoh: string;
  readonly tzBand: string;
  readonly majburiy: boolean;
}

export const KALIT_TAVSIFI: Readonly<Record<KorxonaKalit, KalitTavsifi>> = {
  korxona_nom: {
    nom: 'Korxona nomi',
    izoh: 'Chekning eng tepasida chiqadi',
    tzBand: '14.3',
    majburiy: true,
  },
  korxona_manzil: {
    nom: 'Manzil',
    izoh: 'Chekda nom ostida chiqadi',
    tzBand: '14.3',
    majburiy: false,
  },
  korxona_telefon: {
    nom: 'Telefon',
    izoh: 'Chekda manzil ostida chiqadi',
    tzBand: '14.3',
    majburiy: false,
  },
  bot_username: {
    nom: 'Telegram bot nomi',
    izoh: "@ belgisisiz. Chekdagi QR kod shu botga olib boradi — mijoz balansini ko'radi",
    tzBand: '13.7',
    majburiy: false,
  },
  filial_kod: {
    nom: 'Filial kodi',
    izoh: 'Ikki xonali raqam. Chek raqamining boshida turadi: 14 + sana + chek raqami',
    tzBand: '14.3',
    majburiy: true,
  },
};

/**
 * ⚠️ Bo'sh qiymat SAQLANMAYDI — qator umuman yozilmaydi. Shuning
 *    uchun o'qishda har biri `null` bo'lishi mumkin va chek buni
 *    «sozlanmagan» deb ko'rsatadi, o'ylab topilgan qiymat bilan
 *    to'ldirmaydi.
 */
export type KorxonaMalumotlari = Readonly<Record<KorxonaKalit, string | null>>;

export const BOSH_KORXONA: KorxonaMalumotlari = {
  korxona_nom: null,
  korxona_manzil: null,
  korxona_telefon: null,
  bot_username: null,
  filial_kod: null,
};

// ─── O'qish ───────────────────────────────────────────────────────────────

export async function korxonaMalumotlari(ulanish: Soruvchi): Promise<KorxonaMalumotlari> {
  const q = await ulanish<{ kalit: string; qiymat: string }[]>`
    SELECT kalit, qiymat FROM sozlama
    WHERE kalit = ANY(${[...KORXONA_KALITLARI]})`;

  const natija: Record<string, string | null> = { ...BOSH_KORXONA };
  for (const r of q) {
    natija[r.kalit] = r.qiymat === '' ? null : r.qiymat;
  }

  return natija as KorxonaMalumotlari;
}

// ─── Tekshiruv ────────────────────────────────────────────────────────────

/**
 * ⚠️ Tekshiruv SERVERDA (§9.4). Brauzerdagi `pattern` atributi
 *    faqat qulaylik uchun.
 */
export function qiymatniTekshir(kalit: KorxonaKalit, xom: string): string {
  const q = xom.trim();

  if (q === '') {
    if (KALIT_TAVSIFI[kalit].majburiy) {
      throw new BiznesXato('SOZLAMA_NOTOGRI', `${KALIT_TAVSIFI[kalit].nom} bo'sh`);
    }
    return '';
  }

  if (kalit === 'filial_kod') {
    if (!/^\d{2}$/.test(q)) {
      throw new BiznesXato(
        'SOZLAMA_NOTOGRI',
        `filial kodi ikki xonali raqam bo'lishi kerak (masalan 14), kelgani: ${q}`,
      );
    }
    return q;
  }

  if (kalit === 'bot_username') {
    /** Egasi «@bot» deb yozishi tabiiy — @ olib tashlanadi, xato emas */
    const u = q.startsWith('@') ? q.slice(1) : q;
    if (!/^[A-Za-z0-9_]{5,32}$/.test(u)) {
      throw new BiznesXato(
        'SOZLAMA_NOTOGRI',
        'bot nomi 5–32 belgi: harf, raqam va pastki chiziq (masalan jalyuzi_bot)',
      );
    }
    return u;
  }

  if (q.length > 200) {
    throw new BiznesXato('SOZLAMA_NOTOGRI', `${KALIT_TAVSIFI[kalit].nom} juda uzun`);
  }

  return q;
}

// ─── Yozish ───────────────────────────────────────────────────────────────

export type SaqlashNatijasi = { holat: 'SAQLANDI' } | { holat: 'OZGARISH_YOQ' };

/**
 * Kelgan kalitlarni saqlaydi. Berilmagan kalitga TEGILMAYDI.
 *
 * ⚠️ Bitta tranzaksiyada: yarim saqlangan rekvizit (nomi yangi,
 *    telefoni eski) chekka chiqib ketmasligi kerak.
 */
export async function sozlamalarniSaqla(
  ulanish: postgres.Sql,
  kiritilgan: Partial<Record<KorxonaKalit, string>>,
  xodimId: number,
  filialId: number,
): Promise<SaqlashNatijasi> {
  const tozalangan = new Map<KorxonaKalit, string>();
  for (const kalit of KORXONA_KALITLARI) {
    const xom = kiritilgan[kalit];
    if (xom === undefined) continue;
    tozalangan.set(kalit, qiymatniTekshir(kalit, xom));
  }

  if (tozalangan.size === 0) return { holat: 'OZGARISH_YOQ' };

  return ulanish.begin(async (tx) => {
    const eskisi = await korxonaMalumotlari(tx);

    const eskiQ: Record<string, unknown> = {};
    const yangiQ: Record<string, unknown> = {};
    for (const [kalit, qiymat] of tozalangan) {
      eskiQ[kalit] = eskisi[kalit];
      yangiQ[kalit] = qiymat === '' ? null : qiymat;
    }

    if (!ozgarishBormi(eskiQ, yangiQ)) {
      return { holat: 'OZGARISH_YOQ' } as const;
    }

    for (const [kalit, qiymat] of tozalangan) {
      /**
       * ⚠️ Bo'shatilgan ixtiyoriy maydon O'CHIRILADI. Bo'sh satr
       *    saqlansa, o'quvchi uni «sozlangan» deb hisoblab chekka
       *    bo'sh qator chiqarardi.
       */
      if (qiymat === '') {
        await tx`DELETE FROM sozlama WHERE kalit = ${kalit}`;
        continue;
      }

      await tx`
        INSERT INTO sozlama (kalit, qiymat, turi, guruh, tz_band, izoh, yaratdi_id)
        VALUES (${kalit}, ${qiymat}, 'MATN', 'ASOSIY',
                ${KALIT_TAVSIFI[kalit].tzBand}, ${KALIT_TAVSIFI[kalit].izoh},
                ${xodimId})
        ON CONFLICT (kalit) DO UPDATE
          SET qiymat = ${qiymat},
              ozgartirildi = now(),
              ozgartirdi_id = ${xodimId}`;
    }

    const farq = farqniAjrat(eskiQ, yangiQ);
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'SOZLAMA_OZGARDI', 'sozlama', 0,
              ${tx.json(farq.eski as never)}, ${tx.json(farq.yangi as never)},
              ${'Korxona ma’lumotlari (14.3)'})`;

    return { holat: 'SAQLANDI' } as const;
  });
}
