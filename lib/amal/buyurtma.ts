/**
 * lib/amal/buyurtma.ts — TZ 3.9 · 3.10 · 3.12 · 3.14 · 8.3 · 8.4 · 8.12
 *                        20.4.2 · Q-03 · Q-12 · 2.1 · 2.3-invariant
 *
 * Savatdan buyurtma yaratish.
 *
 * ⚠️ BITTA TRANZAKSIYADA (CLAUDE.md §3): buyurtma, pozitsiyalar, har
 *    slotning materiali, aksessuarlar, BAND QILISH va audit. Yarim
 *    yozilgan buyurtma bo'lmaydi — 2.1-invariant.
 *
 * ⚠️ Q-03 · TZ 20.4.2 — material yetishmasligi BUYURTMA BERILAYOTGANDA
 *    aytiladi va tekshiruv ISHLAB CHIQARUVCHI filial ombori bo'yicha
 *    o'tkaziladi. Sotuvchi Chilonzorda, buyurtma Samarqandda tikilsa —
 *    Samarqand ombori qaraladi.
 *
 * ⚠️ TZ 3.6 — ombordan `hisoblangan_miqdor` band qilinadi, sotuvchi
 *    tuzatgan son EMAS. Tuzatilgani faqat narxga tegadi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { bandQilTx, type SlotSorovi } from './band';
import { kesimOlchami } from '@/lib/domain/kesish';
import { parametrlarniOqi, sarflashniTekshir } from './sarflash';
import { narxniTekshir, qoshimchaNarxiniTekshir } from './narx-tekshir';
import { donaYech } from './dona-yechish';
import {
  boshHolat,
  otishniTekshir,
  tasdiqdanKeyin,
  type Manba,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { mijozniOgohlantir } from './bildirishnoma';
import { tasdiqlandiMatni } from '@/lib/domain/bildirishnoma';
import { BiznesXato } from '@/lib/xato';
import { chegaraXabari, olchamniTekshir } from '@/lib/domain/olcham-chegarasi';

export interface SlotKirimi {
  /** ⚠️ `null` — materialni o'zi sotish, slot yo'q (egasi qarori 2026-09-20) */
  readonly slotId: number | null;
  readonly materialId: number;
  /** Formula hisoblagani — OMBORDAN SHU band qilinadi (3.6) */
  readonly hisoblanganMiqdor: string;
  /** Sotuvchi tuzatgani — faqat narxga tegadi (3.5) */
  readonly tuzatilganMiqdor: string | null;
  readonly birlik: 'KV_M' | 'M' | 'DONA';
  /**
   * AUDIT 1-topilma — kesish sozlamalari (formadan, katalogdan keladi).
   * `kerak` to'rtburchagi shulardan qarab hisoblanadi.
   */
  readonly koeffitsient?: number | null;
  readonly kesishTuri?: 'ENIGA' | "BO'YIGA" | null;
  readonly narxSnapshot: string;
  /** Band qilish uchun kerakli o'lcham — faqat RULON materialda */
  readonly kerak: { readonly eniM: number; readonly boyiM: number } | null;
}

/**
 * Mijoz tanlagan qo'shimcha — egasi qarori 2026-09-20.
 *
 * ⚠️ Material bo'lsa u AKSESSUAR sifatida ham yoziladi: ombordan
 *    yechish zanjiri (`pozitsiya_aksessuar`) allaqachon bor va
 *    ishlaydi. `pozitsiya_qoshimcha` esa TANLOVNI va NARXNI
 *    saqlaydi — chekda «usti shabalik» deb nomi bilan chiqsin.
 *
 *    Ikki marta yechilmaydi: `pozitsiya_qoshimcha` ni hech qanday
 *    ombor kodi o'qimaydi.
 */
export interface QoshimchaKirimi {
  readonly mahsulotQoshimchaId: number;
  readonly nomSnapshot: string;
  readonly narxSnapshot: string;
  readonly materialId: number | null;
  readonly miqdor: string | null;
  readonly birlik: 'KV_M' | 'M' | 'DONA' | null;
}

export interface AksessuarKirimi {
  readonly materialId: number;
  readonly soni: string;
  readonly birlik: 'KV_M' | 'M' | 'DONA';
  readonly narxSnapshot: string;
  /** TZ 3.7 — qo'lda kiritilgan sonni formula ustidan yozmaydi */
  readonly qoldaKiritildi: boolean;
}

/**
 * Buyurtma raqami — `B-2026-000123`.
 *
 * ⚠️ Raqam SERVERDA beriladi. Ilgari bu funksiya sotuv amalining
 *    ichida turardi; endi bot ham buyurtma yaratadi (13.4) va ikkalasi
 *    AYNI ketma-ketlikdan olishi shart (§2.2). Aks holda bot va sayt
 *    bir xil raqam berib qo'yishi mumkin edi.
 */
export async function buyurtmaRaqamiOl(soruvchi: postgres.Sql): Promise<string> {
  const q = await soruvchi<{ raqam: string }[]>`
    SELECT 'B-' || to_char(now(), 'YYYY') || '-' ||
           lpad(nextval('buyurtma_raqam_seq')::text, 6, '0') AS raqam`;
  const r = q[0]?.raqam;
  if (r === undefined) throw new BiznesXato('BUYURTMA_SAQLANMADI', 'raqam');
  return r;
}

export interface PozitsiyaKirimi {
  /**
   * ⚠️ `null` — QO'SHIMCHA MAHSULOT. Mijoz uydagi buzilgan
   *    mexanizm o'rniga bittasini alohida olsa, u tayyorlanmaydi:
   *    o'lchov olinmaydi, usta ishlamaydi, kesilmaydi. Shunchaki
   *    ombordan olinib beriladi.
   */
  readonly mahsulotTurId: number | null;
  /** Qo'shimcha mahsulotda — qaysi material sotilmoqda */
  readonly qoshimchaMaterialId?: number | null;
  readonly eniM: number;
  readonly boyiM: number;
  readonly soni: number;
  /**
   * O'lchov bilan sotilgan miqdor, METR — T-16 (2026-09-21).
   * Faqat qo'shimcha buyumda; `null` bo'lsa miqdor `soni` da.
   */
  readonly miqdor?: string | null;
  readonly narxSnapshot: string;
  readonly chegirmaSumma: string;
  readonly xizmatHaqi: string;
  /** TZ 4.10 — konstruktor holati qotadi */
  readonly formulaSnapshot: unknown;
  /** Qaysi oyna — «Zal — katta oyna» (0049). Chekda ko'rinadi */
  readonly yorliq?: string | null;
  /** Ichki eslatma — usta uchun (0049). Chekka chiqmaydi */
  readonly izoh?: string | null;
  /**
   * Sotuvchi tanlagan variantlar — 0052, SNAPSHOT bilan.
   *
   * ⚠️ Ixtiyoriy: tanlovi yo'q tur avvalgidek ishlayveradi va bu
   *    maydonni bilmaydigan eski chaqiruvchilar buzilmaydi.
   */
  readonly tanlovlar?: readonly {
    readonly mahsulotTanlovId: number;
    readonly variantId: number;
    readonly tanlovNomi: string;
    readonly variantNomi: string;
    readonly qiymat: number | null;
    readonly narx: string | null;
  }[];
  readonly slotlar: readonly SlotKirimi[];
  readonly aksessuarlar: readonly AksessuarKirimi[];
  readonly qoshimchalar?: readonly QoshimchaKirimi[];
}

export interface BuyurtmaKirimi {
  readonly raqam: string;
  readonly mijozId: number | null;
  readonly sotganFilialId: number;
  readonly ishlabChiqaruvchiFilialId: number;
  readonly manba: Manba;
  readonly valyuta: 'SOM' | 'USD';
  readonly kursSnapshot: string | null;
  readonly tayyorlikSana: string | null;
  /** TZ 3.12 — to'lov to'liq emas bo'lsa qolgani qarzga yoziladi */
  readonly qarzgaKetadimi: boolean;
  /**
   * Butun savatga berilgan chegirma, FOIZDA — 2026-09-21.
   *
   * ⚠️ Sotuvchining chegarasi bilan solishtiriladi. Chegara
   *    BLOKLAMAYDI (TZ 6.4 ruhida) — oshsa audit jurnaliga
   *    yoziladi, xolos.
   *
   * ⚠️ `null` — chegirma berilmagan.
   */
  readonly chegirmaFoiz?: number | null;
  readonly pozitsiyalar: readonly PozitsiyaKirimi[];
}

export interface PozitsiyaNatijasi {
  readonly pozitsiyaId: number;
  readonly holat: PozitsiyaHolati;
  /** TZ 8.12 — band qilinmagan materiallar */
  readonly topilmaganMateriallar: readonly number[];
}

export interface BuyurtmaNatijasi {
  readonly buyurtmaId: number;
  readonly raqam: string;
  readonly pozitsiyalar: readonly PozitsiyaNatijasi[];
  /** Q-03 — hech bo'lmasa bitta pozitsiya materialga kutmoqda */
  readonly materialYetishmadi: boolean;
}

/**
 * Bitta pozitsiyani yozadi — material, aksessuar va BAND bilan.
 *
 * ⚠️ NEGA ALOHIDA FUNKSIYA
 *
 *    Buni IKKI amal chaqiradi: yangi buyurtma yaratish va mavjud
 *    buyurtmaga pozitsiya qo'shish (8.7). Nusxa ko'chirilsa bir joyda
 *    band qo'yilib, ikkinchisida unutilardi (§2.2).
 *
 * ⚠️ Chaqiruvchining TRANZAKSIYASIDA ishlaydi: buyurtma va pozitsiya
 *    bir vaqtda yoziladi yoki hech biri yozilmaydi (2.1-invariant).
 */
export interface PozitsiyaKonteksti {
  readonly buyurtmaId: number;
  /**
   * Narxni serverda qayta hisoblash uchun — 2026-09-21.
   * Mijoz turi (TZ 6.2) va guruh offseti (6.3) shundan topiladi.
   */
  readonly mijozId: number | null;
  readonly kursSnapshot: string | null;
  /** Buyurtma ichidagi tartib raqami — (buyurtma, tartib) noyob */
  readonly tartib: number;
  readonly ishlabChiqaruvchiFilialId: number;
  /** Manbaga qarab boshlang'ich holat (Q-12) */
  readonly boshHolati: PozitsiyaHolati;
  /** Tasdiqdan keyingi holat — 20.5 bo'yicha filialga bog'liq */
  readonly tasdiqHolati: PozitsiyaHolati;
  readonly tasdiqlangan: boolean;
}

export async function pozitsiyaYozTx(
  tx: postgres.TransactionSql,
  p: PozitsiyaKirimi,
  k: PozitsiyaKonteksti,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<PozitsiyaNatijasi> {
  /**
   * ⚠️ QO'SHIMCHA BUYUMDA SLOT BO'LMAYDI (3.10).
   *
   *    Bu tekshiruv qo'shimcha buyum imkoniyatidan OLDIN yozilgan
   *    edi va uni yangilash unutilgan: natijada mexanizm sotmoqchi
   *    bo'lgan sotuvchi «Savatda bironta pozitsiya yo'q» degan
   *    xatoni olardi. Baza testi topdi (2026-09-03).
   */
  const qoshimchami = p.qoshimchaMaterialId !== null && p.qoshimchaMaterialId !== undefined;

  if (!qoshimchami && p.slotlar.length === 0) {
    throw new BiznesXato('BUYURTMA_BOSH', `pozitsiya ${String(k.tartib)}`);
  }

  /**
   * §9.4 — O'LCHAM CHEGARASI SERVERDA HAM TEKSHIRILADI (0051).
   *
   * ⚠️ Ekranda tugma o'chiriladi, lekin bu HIMOYA EMAS: brauzerda
   *    ochiq turgan ESKI sahifa chegara qo'yilishidan oldingi
   *    holatni ushlab qoladi, bot esa butunlay boshqa yo'ldan
   *    keladi.
   *
   * ⚠️ BLOKLAYDI — narxdan farqli o'laroq. Narx mijoz bilan
   *    kelishiladi (TZ 3.8 · 3.11) va iz qoldirish yetarli; bu
   *    o'lchamda esa mahsulot JISMONAN qilinmaydi. Egasi qarori
   *    2026-09-22: «butunlay to'xtatsin».
   *
   * ⚠️ Qo'shimcha buyumda o'tkazilmaydi: u tayyorlanmaydi va
   *    o'lchami nol bo'ladi.
   */
  if (!qoshimchami && p.mahsulotTurId !== null) {
    const chegaraQatori = await tx<
      {
        nom: string;
        min_eni_m: string | null;
        maks_eni_m: string | null;
        min_boyi_m: string | null;
        maks_boyi_m: string | null;
      }[]
    >`
      SELECT nom, min_eni_m::text, maks_eni_m::text,
             min_boyi_m::text, maks_boyi_m::text
        FROM mahsulot_tur WHERE id = ${p.mahsulotTurId}`;

    const c = chegaraQatori[0];
    if (c !== undefined) {
      /** ⚠️ `numeric` MATN bo'lib keladi (P-13) — `Number()` shart */
      const son = (x: string | null): number | null => (x === null ? null : Number(x));

      const nuqsonlar = olchamniTekshir(
        {
          minEniM: son(c.min_eni_m),
          maksEniM: son(c.maks_eni_m),
          minBoyiM: son(c.min_boyi_m),
          maksBoyiM: son(c.maks_boyi_m),
        },
        p.eniM,
        p.boyiM,
      );

      const birinchi = nuqsonlar[0];
      if (birinchi !== undefined) {
        throw new BiznesXato('OLCHAM_CHEGARADAN', chegaraXabari(birinchi, c.nom));
      }
    }
  }

  /**
   * §9.4 — OMBOR SARFLASHI SERVERDA QAYTA HISOBLANADI.
   *
   * ⚠️ Shu paytgacha `hisoblangan_miqdor` brauzerdan kelgan ko'yi
   *    yozilardi: server uni faqat `^\d+(\.\d+)?$` bilan
   *    tekshirardi. Sotuvchining brauzerida ochiq turgan ESKI
   *    sahifa eski formulani ushlab qolardi va o'sha buyurtma
   *    eskicha sarflash bilan bazaga tushardi.
   *
   * ⚠️ NARXGA tegilmaydi: uni sotuvchi qo'lda qo'yadi (3.8, 3.11) —
   *    u mijoz bilan kelishilgan. Sarflash esa kelishuv emas.
   */
  if (!qoshimchami && p.mahsulotTurId !== null) {
    await sarflashniTekshir(tx, {
      mahsulotTurId: p.mahsulotTurId,
      eniM: p.eniM,
      boyiM: p.boyiM,
      soni: p.soni,
      formulaSnapshot: p.formulaSnapshot,
      /**
       * ⚠️ SLOTSIZ QATOR TEKSHIRILMAYDI — materialni o'zi sotishda
       *    formula ham, slot ham yo'q (egasi qarori 2026-09-20).
       *    Uning miqdori sotuvchi kiritgan o'lchamdan chiqadi va
       *    server uni kesim to'rtburchagi bilan solishtiradi.
       */
      slotlar: p.slotlar.filter((s): s is typeof s & { slotId: number } => s.slotId !== null),
    });
  }

  /**
   * §9.4 — NARX HAM SERVERDA QAYTA HISOBLANADI (2026-09-21).
   *
   * ⚠️ Ilgari bu yerda faqat SARFLASH tekshirilardi va izohda
   *    «narxga tegilmaydi, u kelishilgan» deb yozilgan edi. O'sha
   *    izoh 2026-09-20 gacha to'g'ri edi — o'shanda narx
   *    materiallardan yig'ilardi.
   *
   *    Endi narx egasining jadvalidan keladi. Egasi narxni
   *    o'zgartirsa, sotuvchining ochiq turgan ESKI sahifasi eski
   *    narxni JIMGINA yozardi — xuddi sarflash bilan bo'lgani kabi.
   *
   * ⚠️ BLOKLAMAYDI (TZ 3.8 · 3.11 — narx mijoz bilan kelishiladi).
   *    Faqat IZ qoldiradi: `qolda_narx` ustuni va audit yozuvi.
   *
   * ⚠️ Qo'shimcha buyumda o'tkazilmaydi: u tur ham, slot ham
   *    yo'q va narxi boshqa yo'ldan keladi.
   */
  let qoldaNarx = false;
  let serverNarxi: string | null = null;

  if (!qoshimchami && p.mahsulotTurId !== null) {
    const tekshiruv = await narxniTekshir(tx, {
      mahsulotTurId: p.mahsulotTurId,
      eniM: p.eniM,
      boyiM: p.boyiM,
      soni: p.soni,
      narxSnapshot: p.narxSnapshot,
      xizmatHaqi: p.xizmatHaqi,
      mijozId: k.mijozId,
      filialId: k.ishlabChiqaruvchiFilialId,
      kursSnapshot: k.kursSnapshot,
      // 0048 — daraja qaysi slotdan olinishini server ham bilishi shart
      slotlar: p.slotlar.map((x) => ({ slotId: x.slotId, materialId: x.materialId })),
      qoshimchaIdlar: (p.qoshimchalar ?? []).map((x) => x.mahsulotQoshimchaId),
      parametrlar: Object.fromEntries(parametrlarniOqi(p.formulaSnapshot)),
    });
    qoldaNarx = tekshiruv.qoldami;
    serverNarxi = tekshiruv.hisoblangan;
  }

  /**
   * ⚠️ ALOHIDA SOTILGAN BUYUM HAM TEKSHIRILADI — 2026-09-22.
   *
   *    Yuqoridagi tekshiruv faqat MAHSULOT TURI bor pozitsiyaga
   *    tegishli. Metrlab kesilgan mato, karniz va donalab sotilgan
   *    buyumda tur yo'q — ular tekshiruvdan butunlay chetda
   *    qolardi va tayyor jalyuzida yopilgan teshik shu yerda ochiq
   *    turardi.
   *
   *    «Miqdor bo'yicha bosqich» qo'shilgach (egasi qarori
   *    2026-09-22) teshik kattalashdi: endi u yerda butun bosqich
   *    jadvali turibdi va egasi uni o'zgartirsa, ochiq turgan eski
   *    sahifa eski narxda sotaverardi.
   */
  if (qoshimchami && p.qoshimchaMaterialId !== null && p.qoshimchaMaterialId !== undefined) {
    const tekshiruv = await qoshimchaNarxiniTekshir(tx, {
      materialId: p.qoshimchaMaterialId,
      narxSnapshot: p.narxSnapshot,
      /**
       * ⚠️ Metrlab sotishda miqdor `miqdor` ustunida, donalab
       *    sotishda `soni` da (T-16). Ekran ham shunday yuboradi.
       */
      miqdor: p.miqdor === null || p.miqdor === undefined ? p.soni : Number(p.miqdor),
      eniM: p.eniM,
      boyiM: p.boyiM,
      mijozId: k.mijozId,
      filialId: k.ishlabChiqaruvchiFilialId,
      kursSnapshot: k.kursSnapshot,
    });
    qoldaNarx = tekshiruv.qoldami;
    serverNarxi = tekshiruv.hisoblangan;
  }

  const q = await tx<{ id: number }[]>`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id,
                                    qoshimcha_material_id,
                                    eni_m, boyi_m, soni, miqdor, narx_snapshot,
                                    chegirma_summa, xizmat_haqi,
                                    formula_snapshot, holat, qolda_narx,
                                    yorliq, izoh, yaratdi_id)
    VALUES (${k.buyurtmaId}, ${k.tartib}, ${p.mahsulotTurId},
            ${p.qoshimchaMaterialId ?? null}, ${p.eniM}, ${p.boyiM},
            ${p.soni}, ${p.miqdor ?? null},
            ${p.narxSnapshot}, ${p.chegirmaSumma}, ${p.xizmatHaqi},
            ${tx.json(p.formulaSnapshot as never)},
            ${k.tasdiqlangan ? k.tasdiqHolati : k.boshHolati}, ${qoldaNarx},
            ${p.yorliq ?? null}, ${p.izoh ?? null},
            ${xodimId})
    RETURNING id`;

  const pozitsiyaId = q[0]?.id;
  if (pozitsiyaId === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI');

  /**
   * TZ 2.4 — NARX_QOLDA AUDITGA YOZILADI (2026-09-21).
   *
   * ⚠️ Bu hodisa `lib/audit/amallar.ts` da 2026-08 dan beri
   *    ta'riflangan va «sotuvchi intizomi» hisobotida sanaladi
   *    (`hisobot/malumot.ts`) — lekin HECH QAYERDA YOZILMAGAN edi.
   *
   *    Ya'ni hisobot har doim «narx qo'lda o'zgartirildi: 0» deb
   *    turardi va egasi undan «hech kim narxga tegmayapti» degan
   *    XATO xulosa chiqarardi. Hisobotsizlikdan yomonroq: u yolg'on
   *    tinchlik berardi.
   */
  if (qoldaNarx) {
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi,
                                obyekt_id, eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${k.ishlabChiqaruvchiFilialId}, 'NARX_QOLDA',
              'buyurtma_pozitsiya', ${pozitsiyaId},
              ${tx.json({ narx: serverNarxi })},
              ${tx.json({ narx: p.narxSnapshot })},
              ${`Jadval bo'yicha ${serverNarxi ?? '—'}, yozilgani ${p.narxSnapshot}`})`;
  }

  /**
   * TANLANGAN VARIANTLAR — 0052.
   *
   * ⚠️ NOM VA QIYMAT SNAPSHOT bo'lib yoziladi (2.3-invariant).
   *    Admin keyin variantni o'chirsa yoki nomini o'zgartirsa,
   *    eski buyurtma o'zgarmaydi: usta ham, chek ham o'sha kungi
   *    nomni ko'radi.
   *
   * ⚠️ Narx SO'MDA yoziladi — kurs o'zgarsa buyurtma o'zgarmaydi.
   */
  for (const t of p.tanlovlar ?? []) {
    await tx`
      INSERT INTO pozitsiya_tanlov (buyurtma_pozitsiya_id, mahsulot_tanlov_id,
                                    variant_id, tanlov_nomi_snapshot,
                                    variant_nomi_snapshot, qiymat_snapshot,
                                    narx_snapshot, yaratdi_id)
      VALUES (${pozitsiyaId}, ${t.mahsulotTanlovId}, ${t.variantId},
              ${t.tanlovNomi}, ${t.variantNomi}, ${t.qiymat},
              ${t.narx}, ${xodimId})`;
  }

  // Har slot — o'z `pozitsiya_material` qatori (QISM 3 §3.2.1)
  const sorovlar: SlotSorovi[] = [];

  for (const s of p.slotlar) {
    const pm = await tx<{ id: number }[]>`
      INSERT INTO pozitsiya_material (buyurtma_pozitsiya_id, slot_id, material_id,
                                      hisoblangan_miqdor, tuzatilgan_miqdor,
                                      birlik, narx_snapshot)
      VALUES (${pozitsiyaId}, ${s.slotId}, ${s.materialId},
              ${s.hisoblanganMiqdor}, ${s.tuzatilganMiqdor}, ${s.birlik},
              ${s.narxSnapshot})
      RETURNING id`;

    const pmId = pm[0]?.id;
    if (pmId === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI');

    if (s.kerak !== null) {
      /**
       * T-12 tuzatishi (2026-09-20) — `soni` MARTA band qilinadi.
       *
       * ⚠️ `s.kerak` BITTA buyum to'rtburchagi (chaqiruvchi
       *    `kesimOlchami` ga `soni` ni berdi). Uchta parda uchun
       *    uchta 1.80 m bo'lak izlanadi, bitta 5.40 m emas —
       *    bunday rulon dunyoda yo'q.
       */
      for (let i = 0; i < p.soni; i += 1) {
        sorovlar.push({
          pozitsiyaMaterialId: pmId,
          materialId: s.materialId,
          kerak: s.kerak,
          majburiy: true,
        });
      }
    }
  }

  for (const a of p.aksessuarlar) {
    await tx`
      INSERT INTO pozitsiya_aksessuar (buyurtma_pozitsiya_id, material_id,
                                       soni, birlik, narx_snapshot,
                                       qolda_kiritildi)
      VALUES (${pozitsiyaId}, ${a.materialId}, ${a.soni}, ${a.birlik},
              ${a.narxSnapshot}, ${a.qoldaKiritildi})`;
  }

  /**
   * Tanlangan qo'shimchalar — egasi qarori 2026-09-20 (T-13).
   *
   * ⚠️ Materiali borlari AKSESSUAR bo'lib ham yoziladi: shunda
   *    mavjud ombor zanjiri ularni o'zi yechadi va alohida kod
   *    yozish shart emas (§2.2).
   *
   * ⚠️ `narx_snapshot` AKSESSUAR qatorida NOL: pul allaqachon
   *    `pozitsiya_qoshimcha` da hisobga olingan va pozitsiya
   *    narxiga kirgan. Ikki marta sanalmasin.
   */
  for (const q of p.qoshimchalar ?? []) {
    await tx`
      INSERT INTO pozitsiya_qoshimcha (buyurtma_pozitsiya_id, mahsulot_qoshimcha_id,
                                       nom_snapshot, narx_snapshot,
                                       material_id, miqdor, birlik, yaratdi_id)
      VALUES (${pozitsiyaId}, ${q.mahsulotQoshimchaId}, ${q.nomSnapshot},
              ${q.narxSnapshot}, ${q.materialId}, ${q.miqdor}, ${q.birlik},
              ${xodimId})`;

    if (q.materialId !== null && q.miqdor !== null && q.birlik !== null) {
      await tx`
        INSERT INTO pozitsiya_aksessuar (buyurtma_pozitsiya_id, material_id,
                                         soni, birlik, narx_snapshot,
                                         qolda_kiritildi)
        VALUES (${pozitsiyaId}, ${q.materialId}, ${q.miqdor}, ${q.birlik},
                '0', false)`;
    }
  }

  // TZ 7.3 — «Pozitsiya "Tasdiqlangan" bo'lgan ZAHOTI tizim mos
  // bo'lakni topadi va band qiladi.» Tasdiq kutayotgani band
  // qilinmaydi.
  let holat: PozitsiyaHolati = k.tasdiqlangan ? k.tasdiqHolati : k.boshHolati;
  let topilmagan: readonly number[] = [];

  if (k.tasdiqlangan && sorovlar.length > 0) {
    const band = await bandQilTx(
      tx,
      pozitsiyaId,
      // 20.4.2 — tekshiruv ISHLAB CHIQARUVCHI filialda
      k.ishlabChiqaruvchiFilialId,
      sorovlar,
      xodimId,
      hozir,
    );

    if (band.holat === 'MATERIAL_YOQ') {
      // TZ 8.12 — «Usta ishga olmoqchi bo'ldi, material yetmadi»
      // qoidasi Q-03 bilan oldinga surildi: buyurtma berilayotganda
      holat = 'MATERIALGA_KUTMOQDA';
      topilmagan = band.topilmagan;

      await tx`
        UPDATE buyurtma_pozitsiya SET holat = 'MATERIALGA_KUTMOQDA'
        WHERE id = ${pozitsiyaId}`;
    }
  }

  /**
   * QO'SHIMCHA MAHSULOT — ombordan darhol yechiladi.
   *
   * ⚠️ Band qilinmaydi, YECHILADI: u tayyorlanmaydi, kesilmaydi
   *    va usta ishlamaydi — shu zahoti mijozga beriladi.
   *
   * ⚠️ Yetmasa pozitsiya «materialga kutmoqda» ga tushadi, xuddi
   *    mato yetmagandagi kabi (8.12). Sotuv to'xtatilmaydi:
   *    qolgan pozitsiyalar baribir tayyorlanadi.
   */
  /**
   * ⚠️ FAQAT DONALAB SOTISHDA. Metrlab kesib sotilganda (mato)
   *    pozitsiyada SLOT QATORI bor va u BAND qilinadi — kesim
   *    «Tugatdim» da bo'ladi.
   *
   *    `donaYech` esa faqat `turi = 'DONA'` bo'laklarni qidiradi:
   *    rulonni topolmay «YETMADI» derdi va pozitsiya band
   *    qilingan bo'lsa ham «materialga kutmoqda» ga tushardi.
   */
  const donalabSotiladi = p.slotlar.length === 0;

  if (
    k.tasdiqlangan &&
    donalabSotiladi &&
    p.qoshimchaMaterialId !== null &&
    p.qoshimchaMaterialId !== undefined
  ) {
    /**
     * ⚠️ BIRLIK MATERIALDAN o'qiladi (2026-09-21 auditi).
     *
     *    Ilgari bu yerda birlik `'DONA'` deb QOTIRILGAN edi va
     *    ombor jurnaliga ham doim `miqdor_dona` yozilardi. Chiziqli
     *    material (karniz) to'g'ridan-to'g'ri sotilganda esa
     *    `bolak.miqdor` ustunida METR turadi — jurnalda «5 dona
     *    karniz» deb ko'rinar, aslida 5 METR bo'lardi.
     *
     *    Qoldiq to'g'ri kamayardi, faqat TARIX yolg'on edi. Omborchi
     *    «5 dona karniz qayoqqa ketdi?» degan savolga javob topa
     *    olmasdi.
     */
    const qm = await tx<{ sarflash_birligi: string }[]>`
      SELECT sarflash_birligi FROM material WHERE id = ${p.qoshimchaMaterialId}`;
    const qmDonami = (qm[0]?.sarflash_birligi ?? 'DONA') !== 'M';

    /**
     * ⚠️ OMBORDAN NECHTA YECHILADI — T-16 (2026-09-21).
     *
     *    `miqdor` berilgan bo'lsa SHU yechiladi: karniz 2.5 metrlab
     *    sotilganda `soni` = 1 bo'lib qoladi va u miqdor emas.
     *    Berilmasa avvalgidek `soni` — donalab sotish.
     */
    const yechiladi = p.miqdor === null || p.miqdor === undefined ? p.soni : Number(p.miqdor);

    const yechim = await donaYech(
      tx,
      p.qoshimchaMaterialId,
      k.ishlabChiqaruvchiFilialId,
      yechiladi,
    );

    if (yechim.holat === 'YETMADI') {
      holat = 'MATERIALGA_KUTMOQDA';
      topilmagan = [p.qoshimchaMaterialId];

      await tx`
        UPDATE buyurtma_pozitsiya SET holat = 'MATERIALGA_KUTMOQDA'
        WHERE id = ${pozitsiyaId}`;
    } else {
      /**
       * ⚠️ Qaysi partiyadan olingani YOZILADI — tannarx keyin
       *    shundan hisoblanadi (2.3-invariant: o'tmish
       *    o'zgarmaydi).
       */
      for (const partiya of yechim.partiyalar) {
        /**
         * ⚠️ TANNARX O'Z USTUNIGA yoziladi (0037), `narx_snapshot` ga
         *    EMAS: u butun tizimda SOTUV narxini saqlaydi.
         *
         * ⚠️ `narx_snapshot` NOL: qo'shimcha buyumning daromadi
         *    POZITSIYANING O'ZIDA turibdi. Bu yerga ham yozilsa
         *    daromad ikki marta sanalardi.
         */
        await tx`
          INSERT INTO pozitsiya_aksessuar (buyurtma_pozitsiya_id, material_id,
                                           soni, birlik, narx_snapshot,
                                           tannarx_snapshot, qolda_kiritildi)
          VALUES (${pozitsiyaId}, ${p.qoshimchaMaterialId},
                  ${partiya.miqdor}, ${qmDonami ? 'DONA' : 'M'},
                  0, ${partiya.tannarx}, true)`;

        /**
         * ⚠️ OMBOR JURNALIGA HAM YOZILADI.
         *
         *    Ilgari `bolak.miqdor` kamayar, lekin `ombor_harakat`
         *    ga hech narsa tushmasdi. Natijada qoldiq to'g'ri
         *    bo'lsa ham ombor TARIXIDA bu sotuv KO'RINMASDI:
         *    omborchi «mexanizm qayoqqa ketdi?» degan savolga
         *    javob topa olmasdi (2026-09-03 auditi).
         *
         *    Yozuv MANFIY — buyum ombordan chiqmoqda. Xuddi
         *    «Tugatdim» dagi aksessuar yozuvi kabi (`ish.ts`).
         */
        const olindi = Number(partiya.miqdor);
        await tx`
          INSERT INTO ombor_harakat (filial_id, bolak_id, turi,
                                     miqdor_m, miqdor_dona,
                                     tannarx_summa, manba_turi, manba_id,
                                     izoh, xodim_id)
          VALUES (${k.ishlabChiqaruvchiFilialId}, ${partiya.bolakId}, 'KESIM',
                  ${qmDonami ? null : (-olindi).toFixed(2)},
                  ${qmDonami ? -olindi : null},
                  ${(-olindi * Number(partiya.tannarx)).toFixed(2)},
                  'buyurtma_pozitsiya', ${pozitsiyaId},
                  ${
                    qmDonami
                      ? "Qo'shimcha buyum sotildi (3.10)"
                      : "Qo'shimcha buyum sotildi — metrda (3.10)"
                  },
                  ${xodimId})`;
      }
    }
  }

  return { pozitsiyaId, holat, topilmaganMateriallar: topilmagan };
}

/**
 * TZ 3.14 — buyurtmani saqlaydi.
 *
 * Q-12 — sayt buyurtmasi darhol «Tasdiqlangan», bot buyurtmasi
 * «Tasdiq kutmoqda» bo'lib tushadi. Tasdiqlangan pozitsiya darhol band
 * qilinadi (7.3); tasdiq kutayotgani BAND QILINMAYDI — mijoz hali
 * tasdiqlamagan ishga material ushlab turishning ma'nosi yo'q.
 */
export async function buyurtmaYarat(
  ulanish: postgres.Sql,
  kirim: BuyurtmaKirimi,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<BuyurtmaNatijasi> {
  if (kirim.pozitsiyalar.length === 0) {
    throw new BiznesXato('BUYURTMA_BOSH');
  }

  // TZ 3.10 — «Mahsulot qarzga berilayotgan bo'lsa mijoz tanlash
  // MAJBURIY: tizim qarzni kimdan undirishni bilishi kerak.»
  if (kirim.qarzgaKetadimi && kirim.mijozId === null) {
    throw new BiznesXato('BUYURTMA_MIJOZ_KERAK');
  }

  // AUDIT B-04 · TZ 9.6 — dollarli buyurtmada kurs qotishi shart
  if (kirim.valyuta === 'USD' && kirim.kursSnapshot === null) {
    throw new BiznesXato('KURS_KERAK', 'dollarli buyurtma');
  }

  return ulanish.begin(async (tx) => {
    const b = await tx<{ id: number }[]>`
      INSERT INTO buyurtma (raqam, mijoz_id, sotuvchi_id, sotgan_filial_id,
                            ishlab_chiqaruvchi_filial_id, manba, valyuta,
                            kurs_snapshot, tayyorlik_sana, yaratdi_id)
      VALUES (${kirim.raqam}, ${kirim.mijozId}, ${xodimId}, ${kirim.sotganFilialId},
              ${kirim.ishlabChiqaruvchiFilialId}, ${kirim.manba}, ${kirim.valyuta},
              ${kirim.kursSnapshot}, ${kirim.tayyorlikSana}, ${xodimId})
      RETURNING id`;

    const buyurtmaId = b[0]?.id;
    if (buyurtmaId === undefined) throw new BiznesXato('BUYURTMA_TOPILMADI', kirim.raqam);

    const bosh = boshHolat(kirim.manba);
    const tasdiqlangan = bosh === 'TASDIQLANGAN';

    // 20.5 — filiallar har xil bo'lsa pozitsiya «Filialga yuborildi» bo'ladi
    const tasdiqHolati = tasdiqdanKeyin(kirim.sotganFilialId, kirim.ishlabChiqaruvchiFilialId);

    const natijalar: PozitsiyaNatijasi[] = [];
    let yetishmadi = false;

    for (const [i, p] of kirim.pozitsiyalar.entries()) {
      // §2.2 — pozitsiya yozish mantig'i BITTA joyda
      const n = await pozitsiyaYozTx(
        tx,
        p,
        {
          buyurtmaId,
          mijozId: kirim.mijozId,
          kursSnapshot: kirim.kursSnapshot,
          tartib: i + 1,
          ishlabChiqaruvchiFilialId: kirim.ishlabChiqaruvchiFilialId,
          boshHolati: bosh,
          tasdiqHolati,
          tasdiqlangan,
        },
        xodimId,
        hozir,
      );

      if (n.holat === 'MATERIALGA_KUTMOQDA') yetishmadi = true;
      natijalar.push(n);
    }

    /**
     * TZ 6.8 — «Sotuv qarzni OSHIRADI.»
     *
     * ⚠️ Qarz SHU YERDA yoziladi, to'lovda emas: sotuv BIR MARTA
     *    bo'ladi, to'lov esa bir necha marta. To'lovda yozilsa har
     *    to'lov qarzni yana oshirardi.
     *
     * ⚠️ Mijozsiz buyurtmada qarz yo'q (3.10) — «ko'chadagi tasodifiy
     *    xaridor».
     */
    if (kirim.mijozId !== null) {
      const jami = kirim.pozitsiyalar.reduce(
        (y, p) => y.plus(new Decimal(p.narxSnapshot)).minus(new Decimal(p.chegirmaSumma)),
        new Decimal(0),
      );

      await tx`
        INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                   kurs_snapshot, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${kirim.mijozId}, ${kirim.sotganFilialId}, 'SOTUV',
                ${jami.toFixed(2)}, ${kirim.valyuta}, ${kirim.kursSnapshot},
                'buyurtma', ${buyurtmaId}, ${`Buyurtma ${kirim.raqam}`},
                ${xodimId})`;
    }

    /**
     * Q-23 · TZ 8.14 — NDS AJRATILADI (2026-09-21).
     *
     * ⚠️ Uchta ustun (`nds_stavka`, `nds_summa`, `summa_ndssiz`)
     *    2026-08 dan beri bazada turardi va HECH QACHON
     *    to'ldirilmasdi. Mijoz kartochkasida «NDS to'lovchisi»
     *    belgisi va stavkasi yig'ilardi, buyurtmaga esa
     *    o'tmasdi — yuridik mijozga chekda NDS ajratilmasdi.
     *
     * ⚠️ «AJRATILADI», qo'shilmaydi: narx NDS bilan aytiladi va
     *    undan ichki summa chiqariladi (Q-23). Qo'shilsa mijoz
     *    kelishilgan summadan ortiq to'lardi.
     *
     * ⚠️ CHEGIRMADAN KEYIN (Q-23 ning o'zida yozilgan): avval
     *    chegirma, keyin NDS. Teskari bo'lsa NDS chegirma berilmagan
     *    summadan hisoblanib, soliq ortiqcha chiqardi.
     *
     * ⚠️ Mijoz NDS to'lovchisi bo'lmasa — nol. Mijozsiz
     *    buyurtmada ham nol (3.10 — «ko'chadagi xaridor»).
     */
    const ndsMijoz =
      kirim.mijozId === null
        ? null
        : ((
            await tx<{ nds_tolovchi: boolean; nds_stavka: string | null }[]>`
              SELECT nds_tolovchi, nds_stavka::text FROM mijoz
               WHERE id = ${kirim.mijozId}`
          )[0] ?? null);

    const ndsStavka =
      ndsMijoz !== null && ndsMijoz.nds_tolovchi && ndsMijoz.nds_stavka !== null
        ? new Decimal(ndsMijoz.nds_stavka)
        : new Decimal(0);

    if (ndsStavka.greaterThan(0)) {
      const jamiChegirmali = kirim.pozitsiyalar.reduce(
        (y, p) => y.plus(new Decimal(p.narxSnapshot)).minus(new Decimal(p.chegirmaSumma)),
        new Decimal(0),
      );

      /** summa ÷ (1 + stavka/100) — NDSsiz asos */
      const ndssiz = jamiChegirmali.div(ndsStavka.div(100).plus(1));
      const ndsSumma = jamiChegirmali.minus(ndssiz);

      await tx`
        UPDATE buyurtma
           SET nds_stavka = ${ndsStavka.toFixed(2)},
               nds_summa = ${ndsSumma.toFixed(2)},
               summa_ndssiz = ${ndssiz.toFixed(2)}
         WHERE id = ${buyurtmaId}`;
    }

    /**
     * TZ 2.4 · 6.4 — CHEGIRMA CHEGARASI (2026-09-21).
     *
     * ⚠️ `CHEGIRMA_LIMITIDAN_OSHDI` hodisasi `audit/amallar.ts`
     *    da 2026-08 dan beri ta'riflangan va «sotuvchi intizomi»
     *    hisobotida SANALADI — lekin hech qayerda yozilmagan, va
     *    chegara tushunchasining O'ZI ham yo'q edi. Hisobot har doim
     *    nol ko'rsatardi va egasi «hech kim ortiqcha chegirma
     *    bermayapti» degan XATO xulosa chiqarardi.
     *
     * ⚠️ BLOKLAMAYDI. Qarz limiti ham bloklamaydi (TZ 6.4:
     *    «sotuvchi mustaqil qaror qabul qiladi»). Bu O'LCHOV.
     *
     * ⚠️ Chegara `null` bo'lsa tekshiruv umuman o'tkazilmaydi —
     *    bu standart holat, egasi kerakli sotuvchiga o'zi qo'yadi.
     */
    if (kirim.chegirmaFoiz !== null && kirim.chegirmaFoiz !== undefined) {
      const x = await tx<{ chegirma_limit_foiz: string | null; ism: string }[]>`
        SELECT chegirma_limit_foiz::text, ism FROM xodim WHERE id = ${xodimId}`;

      const chegara = x[0]?.chegirma_limit_foiz;
      if (chegara !== null && chegara !== undefined) {
        const berilgan = new Decimal(kirim.chegirmaFoiz);
        if (berilgan.greaterThan(new Decimal(chegara))) {
          await tx`
            INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi,
                                      obyekt_id, eski_qiymat, yangi_qiymat, izoh)
            VALUES (${xodimId}, ${kirim.sotganFilialId},
                    'CHEGIRMA_LIMITIDAN_OSHDI', 'buyurtma', ${buyurtmaId},
                    ${tx.json({ chegara })},
                    ${tx.json({ berilgan: berilgan.toFixed(2) })},
                    ${`Chegara ${chegara}%, berilgani ${berilgan.toFixed(2)}%`})`;
        }
      }
    }

    // TZ 2.4 — har buyurtma audit jurnalida
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${kirim.sotganFilialId}, 'YARATISH', 'buyurtma',
              ${buyurtmaId},
              ${tx.json({
                raqam: kirim.raqam,
                pozitsiya_soni: kirim.pozitsiyalar.length,
                manba: kirim.manba,
                valyuta: kirim.valyuta,
                tikuvchi_filial: kirim.ishlabChiqaruvchiFilialId,
              })},
              ${`Buyurtma ${kirim.raqam}`})`;

    return {
      buyurtmaId,
      raqam: kirim.raqam,
      pozitsiyalar: natijalar,
      materialYetishmadi: yetishmadi,
    };
  });
}

/**
 * TZ 8.4 — botdan kelgan pozitsiyani sotuvchi tasdiqlaydi.
 *
 * Tasdiqlangan zahoti band qilinadi (7.3). Material yo'q bo'lsa
 * pozitsiya «Materialga kutmoqda» ga tushadi va kirim bo'lgach
 * avtomatik qaytadi (8.12).
 */
export async function pozitsiyaniTasdiqla(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<{ holat: PozitsiyaHolati; topilmagan: readonly number[] }> {
  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        holat: string;
        sotgan_filial_id: number;
        ishlab_chiqaruvchi_filial_id: number;
        raqam: string;
        mijoz_id: number | null;
        narx: string;
      }[]
    >`
      SELECT p.id, p.holat, b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id,
             b.raqam, b.mijoz_id, p.narx_snapshot::text AS narx
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${pozitsiyaId}
      FOR UPDATE OF p`;

    const p = q[0];
    if (p === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI', String(pozitsiyaId));

    const yangi = tasdiqdanKeyin(p.sotgan_filial_id, p.ishlab_chiqaruvchi_filial_id);
    // §2.2 — o'tish qoidasi domainda, bu yerda takrorlanmaydi
    otishniTekshir(p.holat as PozitsiyaHolati, yangi);

    const slotlar = await tx<
      {
        id: number;
        material_id: number;
        hisoblangan_miqdor: string;
        birlik: string;
        koeffitsient: string;
        kesish_turi: string;
        kesim_eni_m: string | null;
      }[]
    >`
      SELECT pm.id, pm.material_id, pm.hisoblangan_miqdor, pm.birlik,
             s.koeffitsient::text, s.kesish_turi, s.kesim_eni_m::text
      FROM pozitsiya_material pm
      JOIN mahsulot_slot s ON s.id = pm.slot_id
      WHERE pm.buyurtma_pozitsiya_id = ${pozitsiyaId}`;

    // O'lchamni pozitsiyadan olamiz — band qilish METRDA ishlaydi (Q-05)
    const olcham = await tx<{ eni_m: string; boyi_m: string; soni: number }[]>`
      SELECT eni_m::text, boyi_m::text, soni FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;

    /** ⚠️ `numeric` matn bo'lib keladi (P-13) — `Number()` shart */
    const boyiM = Number(olcham[0]?.boyi_m ?? 0);
    /** T-12 — pozitsiyadagi buyum soni; kesim BITTA buyum uchun */
    const soni = olcham[0]?.soni ?? 1;

    /**
     * ⚠️ P-24 — BAND SLOT KESIMIDAN, butun mahsulot enidan EMAS.
     *
     *    Dikke 180 × 220 da CHET sloti atigi 0.30 m keladi. Butun eni
     *    ishlatilsa, 30 smlik chet uchun 180 smlik bo'lak band qilinar
     *    va qolgan ikki slotga material yetmay «Materialga kutmoqda»
     *    ga tushardi.
     *
     *    Veb sotuv yo'li buni to'g'ri qilardi
     *    (`app/(panel)/buyurtma/yangi/amal.ts`), BOT yo'li esa yo'q —
     *    ikki yo'l bir xil buyurtmani boshqacha band qilardi.
     *
     * ⚠️ `hisoblangan_miqdor`, `tuzatilgan_miqdor` EMAS: narx
     *    tuzatilgan songa, ombor esa hisoblanganiga bog'lanadi (3.6).
     */
    /**
     * T-12 tuzatishi (2026-09-20) — `soni > 1` bo'lsa `soni` MARTA
     * band qilinadi, har biri BITTA buyum to'rtburchagi bilan.
     *
     * ⚠️ Ilgari jami maydon bitta to'rtburchakka aylanardi: uchta
     *    180 sm parda 5.40 metr KENG bo'lak talab qilardi va
     *    bunday rulon topilmasdi. Endi uchta 1.80 m bo'lak izlanadi.
     *
     * ⚠️ `band` jadvalidagi noyoblik `bolak_id` bo'yicha, ya'ni
     *    bitta pozitsiya_material ga bir nechta band qo'yish mumkin.
     */
    const sorovlar: SlotSorovi[] = slotlar
      .filter((s) => s.birlik === 'KV_M')
      .flatMap((s) => {
        const kerak = kesimOlchami(s.hisoblangan_miqdor, boyiM, {
          koeffitsient: Number(s.koeffitsient),
          yonalish: s.kesish_turi === "BO'YIGA" ? ("BO'YIGA" as const) : ('ENIGA' as const),
          soni,
          /**
           * ⚠️ «DIKKEY» — rulon eni o'zgarmaydi (egasi, 2026-09-20).
           *    Berilgan bo'lsa eni SHU bo'ladi, bo'yi maydondan chiqadi.
           */
          kesimEniM: s.kesim_eni_m === null ? null : Number(s.kesim_eni_m),
        });
        return Array.from({ length: soni }, () => ({
          pozitsiyaMaterialId: s.id,
          materialId: s.material_id,
          kerak,
          majburiy: true,
        }));
      });

    const band =
      sorovlar.length === 0
        ? ({ holat: 'BAND_QILINDI', bandlar: [] } as const)
        : await bandQilTx(
            tx,
            pozitsiyaId,
            p.ishlab_chiqaruvchi_filial_id,
            sorovlar,
            xodimId,
            hozir,
          );

    const holat: PozitsiyaHolati = band.holat === 'MATERIAL_YOQ' ? 'MATERIALGA_KUTMOQDA' : yangi;

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = ${holat}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.sotgan_filial_id}, 'TASDIQLASH', 'buyurtma_pozitsiya',
              ${pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat })},
              ${'Pozitsiya tasdiqlandi'})`;

    /**
     * TZ 13.5 — «Sotuvchi tasdiqlayotganda narxni o'zgartirsa mijozga
     * xabar ketadi... Aks holda mijoz "botda boshqacha yozgan edi"
     * deydi va sotuvchi tushuntirib o'tiradi.»
     *
     * ⚠️ Xabar faqat BOT orqali kelgan buyurtmaga yuboriladi:
     *    saytdan kiritilgan buyurtmada mijoz narxni sotuvchidan
     *    o'z og'zidan eshitgan.
     *
     * ⚠️ Bu yerda narx O'ZGARISHI tekshirilmaydi — tasdiqlashda
     *    pozitsiya narxi allaqachon yangilangan bo'ladi. Eski narx
     *    audit jurnalida qoladi; mijozga joriy narx aytiladi.
     */
    if (p.mijoz_id !== null) {
      await mijozniOgohlantir(
        tx,
        {
          mijozId: p.mijoz_id,
          matn: tasdiqlandiMatni({
            raqam: p.raqam,
            yangiNarx: p.narx,
            eskiNarx: null,
          }),
          manbaTuri: 'buyurtma_pozitsiya',
          manbaId: pozitsiyaId,
        },
        xodimId,
      );
    }

    return {
      holat,
      topilmagan: band.holat === 'MATERIAL_YOQ' ? band.topilmagan : [],
    };
  });
}
