'use client';

/**
 * TZ 3 — sotuv ekrani.
 *
 * «Sotuvchi mijoz oldida turib buyurtma rasmiylashtiradi. Ekran bitta —
 *  boshqa sahifaga o'tish shart emas.» (3.1)
 *
 * ⚠️ Hisob-kitob `lib/domain/` da: sarflash `formula.ts`, narx `narx.ts`.
 *    Bu yerda formula ham, narx qoidasi ham TAKRORLANMAYDI (§2.2) —
 *    brauzerda ko'ringan raqam serverda ham aynan shu chiqadi.
 *
 * ⚠️ TZ 3.5 — «Umumiy maydon TAHRIRLANMAYDI, u faqat yig'indi bo'lib
 *    ko'rinadi. Aks holda ikki joydan bir narsa o'zgartiriladi va qaysi
 *    biri ustun ekani noaniq bo'lib qoladi.»
 */

import { enterYuborilmasin } from '../../forma-yordamchi';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { sarflashHisobla, slotSarfi, standartQiymatlar } from '@/lib/domain/formula';
import { m, type SarflashBirligi } from '@/lib/domain/birlik';
import { dollar, kurs, nolSom, pulKorsat, pulMatn, qosh, som, type Som } from '@/lib/domain/pul';
import { aksessuarNarxi, katalogNarxi, matoNarxi } from '@/lib/domain/narx';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';
import {
  darajaliSlotniTop,
  type HisoblashUsuli,
  type QoshimchaUsuli,
} from '@/lib/domain/narx-qoidasi';
import { chegaraXabari, olchamniTekshir } from '@/lib/domain/olcham-chegarasi';
import {
  ornatishYuki,
  ornatishniTop,
  standartOrnatish,
  tayyorOlcham,
  qoshimchaMatni,
} from '@/lib/domain/olcham-qoidasi';
import {
  aksessuarKeraklimi,
  tanlovQiymatlari,
  tanlovYuki,
  yetishmaganTanlovlar,
} from '@/lib/domain/tanlov';
import { amaldagiOffset, limitHolati, offsetQollanmadimi } from '@/lib/domain/mijoz';
import { chegirmaMatni } from '../../mijoz/guruh/royxat';
import { biznesXatosimi } from '@/lib/xato';
import { Maydon, kirishUslubi } from '../../maydon';
import { Tanlagich } from '../../tanlagich';
import { Modal } from '../../modal';
import { RasmKorish } from '../../rasm-korish';
import {
  MijozFormasi,
  BOSH_QIYMATLAR as MIJOZ_BOSH_QIYMATLAR,
} from '../../mijoz/forma';
import { mijozModalYaratAmali } from '../../mijoz/amal';
import { pozitsiyalarQoshAmali, buyurtmaYaratAmali, turTafsiliAmali } from './amal';
import { BOSH_HOLAT } from './holat';
import type { SotuvMijozi, SotuvTuri } from './malumot';
import { QoshimchaQoshish, type QoshimchaMaterial } from './qoshimcha';
import type { MaterialNarxQoidasi } from './malumot';

const BIRLIK_MATNI: Record<SarflashBirligi, string> = {
  KV_M: 'kv.m',
  M: 'm',
  DONA: 'dona',
};

interface SlotTanlovi {
  materialId: string;
  /** Sotuvchi tuzatgan miqdor — bo'sh bo'lsa hisoblangani ishlatiladi */
  tuzatilgan: string;
}

interface AksessuarTanlovi {
  materialId: number;
  soni: string;
  qoldaKiritildi: boolean;
  ochirilgan: boolean;
}

interface SavatQatori {
  readonly kalit: number;
  /** ⚠️ `null` — qo'shimcha mahsulot, tayyorlanmaydi */
  readonly turId: number | null;
  readonly turNomi: string;
  readonly eniM: number;
  readonly boyiM: number;
  readonly narx: string;
  /** «Zal — katta oyna» — savatda va chekda ko'rinadi (0049) */
  readonly yorliq: string | null;
  readonly yuk: unknown;
  /**
   * Tahrirlash uchun EKRAN HOLATI — 2026-09-21.
   *
   * ⚠️ `yuk` dan teskari tiklash mumkin emas: u serverga
   *    ketadigan shakl va unda ekrandagi tanlovlar (qaysi
   *    qo'shimcha belgilangan, qaysi aksessuar qo'lda kiritilgan)
   *    yo'q. Shuning uchun holat AYNAN saqlanadi.
   */
  readonly tahrir?: {
    readonly eni: string;
    readonly boyi: string;
    readonly soni: string;
    /**
     * 0053 — oyna o'lchami va o'rnatish turi.
     *
     * ⚠️ IXTIYORIY: brauzer xotirasida eski shakldagi savat
     *    turgan bo'lishi mumkin va u sotuvchining ishini
     *    to'xtatmasligi kerak.
     */
    readonly oynaEni?: string;
    readonly oynaBoyi?: string;
    readonly ornatishId?: number | null;
    readonly olchamQolda?: boolean;
    readonly yorliq: string;
    readonly izoh: string;
    readonly tanlanganlar: Record<number, number>;
    readonly parametrlar: Record<string, string>;
    readonly slotlar: Record<number, SlotTanlovi>;
    readonly aksessuarlar: Record<number, AksessuarTanlovi>;
    readonly tanlanganQoshimchalar: readonly number[];
    readonly qoshimchaMateriali: Record<number, string>;
    readonly qoldaNarx: string | null;
  };
  /** Qo'shimcha mahsulotda — nechta dona */
  readonly soni?: number;
  /**
   * O'lchov bilan sotilgan miqdor, METR — T-16 (2026-09-21).
   * `null`/yo'q bo'lsa donalab sotilgan.
   */
  readonly miqdor?: string | null;
}

let keyingiKalit = 0;

/**
 * TZ 3.10 — «Mijoz tanlangach uning offseti darhol ko'rinadi va narx
 * QAYTA HISOBLANADI.»
 *
 * ⚠️ Offset BARCHA matolarga bir xil qo'llanadi (6.3) va yaxlitlash
 *    zanjirning oxirida bir marta bajariladi (20.9.3) — shuning uchun
 *    bu yerda yaxlitlanmaydi.
 *
 * ⚠️ `USD` offseti JORIY kursda so'mga o'giriladi (6.3). Kurs
 *    kiritilmagan bo'lsa offset QO'LLANMAYDI va sotuvchiga ochiq
 *    aytiladi — jimgina noto'g'ri narx chiqarishdan ko'ra
 *    ko'rinadigan cheklov yaxshi.
 */

const son = (x: string): number | null => {
  const t = x.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function SotuvFormasi({
  turlar,
  birinchiTur,
  filiallar,
  ozFilialId,
  mijozQoshaOladi,
  mijozGuruhlari,
  mijozTurlari,
  joriyKurs,
  qoshimchalar,
  materialQoidalari,
  kassalar,
  qoshish = null,
}: {
  /** Faqat nom va raqam — yengil ro'yxat (3.2) */
  turlar: readonly { id: number; nom: string; rasmBormi: boolean }[];
  /** Ekran bo'sh ochilmasligi uchun birinchi turning tafsiloti */
  birinchiTur: SotuvTuri | null;
  filiallar: readonly { id: number; nom: string; bosh: boolean }[];
  ozFilialId: number;
  mijozQoshaOladi: boolean;
  /**
   * TZ 8.7 — MAVJUD buyurtmaga pozitsiya qo'shish rejimi.
   *
   * ⚠️ `null` — odatiy sotuv. Aks holda mijoz, filial va to'lov
   *    QAYTA SO'RALMAYDI: ular buyurtmada allaqachon bor va
   *    o'zgartirilmaydi.
   */
  qoshish?: { readonly buyurtmaId: number; readonly raqam: string } | null;
  /** TZ 6.3 — modalda yangi mijozga darhol guruh tanlash uchun */
  mijozGuruhlari: readonly { id: number; nom: string }[];
  /** TZ 6.2 — mijoz turlari (narx darajasi) */
  mijozTurlari: readonly { id: number; nom: string; soliqKerak: boolean }[];
  /**
   * ⚠️ Dollardagi material narxini so'mga o'girish uchun (5.4).
   *    Kurs kiritilmagan bo'lsa `null` — u holda dollardagi mato
   *    tanlanganda tushunarli xato chiqadi.
   */
  joriyKurs: string | null;
  /** Alohida sotiladigan buyumlar — mexanizm, kronshteyn, zanjir */
  qoshimchalar: readonly QoshimchaMaterial[];
  /** Materialni o'zi sotish narx qoidalari (egasi qarori 2026-09-20) */
  materialQoidalari: readonly MaterialNarxQoidasi[];
  /**
   * TZ 12.2 — oldindan to'lov tushadigan kassalar. Bo'sh bo'lsa
   * to'lov qismi ko'rinmaydi: sotuvchida kassa huquqi yo'q.
   */
  kassalar: readonly { id: number; nom: string; turi: string; valyuta: string }[];
}) {
  /**
   * ⚠️ Ikkala rejim BIR XIL formani ishlatadi (§2.2): pozitsiya
   *    yig'ish mantig'i — tur, slot, mato, narx — bir joyda turadi.
   */
  const [holat, yubor, kutilmoqda] = useActionState(
    qoshish === null
      ? buyurtmaYaratAmali
      : pozitsiyalarQoshAmali.bind(null, qoshish.buyurtmaId),
    BOSH_HOLAT,
  );

  /**
   * ⚠️ Kurs `Kurs` turiga o'raladi — `ogir()` faqat shuni qabul
   *    qiladi (§3.2). `JORIY` manbasi: bu bugungi kurs, yozuvga
   *    qotgan snapshot emas.
   */
  const kursObyekti = useMemo(
    () => (joriyKurs === null || joriyKurs.trim() === '' ? null : kurs(joriyKurs, new Date(), 'JORIY')),
    [joriyKurs],
  );

  const [turId, turniOzgartir] = useState<number | null>(turlar[0]?.id ?? null);

  /**
   * ⚠️ Tanlangan turning TAFSILOTI. Ilgari hamma tur tafsiloti
   *    birdan kelardi va sahifa og'irlashardi; endi tanlangani
   *    kerak bo'lganda yuklanadi.
   */
  const [tur, turniYukla] = useState<SotuvTuri | null>(birinchiTur);
  const [turYuklanmoqda, yuklanishniOzgartir] = useState(false);
  /**
   * ⚠️ METRDA — 2026-09-21 da tuzatildi. Bu yerda `'210'` va
   *    `'140'` turardi: metrga o'tishda (2026-09-20) tushib qolgan
   *    eski SANTIMETR qiymatlari. Forma har safar 210 × 140 METR
   *    bilan ochilardi — sotuvchi buni sezmasa ombordan hech narsa
   *    topilmasdi.
   */
  const [eni, eniniOzgartir] = useState('2.10');
  const [boyi, boyiniOzgartir] = useState('1.40');
  /**
   * SONI — 2026-09-21 da qo'shildi.
   *
   * ⚠️ Server `soni > 1` ni ALLAQACHON qo'llab-quvvatlardi
   *    (T-12: band `soni` marta qo'yiladi, kesim bitta buyum
   *    o'lchamida bo'ladi, narx `soni` ga ko'paytiriladi) — lekin
   *    EKRANDA uni kiritish joyi yo'q edi va `soni: 1` qotirilgan
   *    edi. Ya'ni uchta bir xil parda uch marta savatga solinardi.
   */
  const [soni, soniniOzgartir] = useState('1');

  /*
   * ─── OYNA O'LCHAMI VA O'RNATISH TURI — 0053 ────────────────
   *
   * Zamerchi OYNANI o'lchaydi, tizim esa TAYYOR jalyuzi o'lchamini
   * kutadi. Farqni shu paytgacha sotuvchi boshida hisoblardi.
   *
   * ⚠️ Yuqoridagi `eni`/`boyi` MA'NOSI O'ZGARMADI — ular doim
   *    TAYYOR o'lcham va butun hisob o'shalarga tayanadi. Bu
   *    yerdagilar ularni TO'LDIRADI, o'rnini bosmaydi.
   */
  const [oynaEni, oynaEniniOzgartir] = useState('');
  const [oynaBoyi, oynaBoyiniOzgartir] = useState('');
  const [ornatishId, ornatishIdniOzgartir] = useState<number | null>(
    /** ⚠️ Birinchi tur ham standart bilan ochilsin — bo'sh
     *     dropdown sotuvchini tanlashni unuttirardi */
    standartOrnatish(birinchiTur?.ornatishlar ?? [])?.id ?? null,
  );
  /**
   * Tayyor o'lcham QO'LDA yozildimi — egasining o'z gapi:
   * «usta xohishicha o'zgartiraveradi inputni, agar o'zgartirmasa
   *  eski holatida saqlanadi».
   *
   * ⚠️ `true` bo'lgach oyna o'lchami yoki o'rnatish turi
   *    o'zgarsa ham tayyor o'lcham QAYTA HISOBLANMAYDI. Qo'lda
   *    yozilgan raqam ustidan yozish — odamning ishini bekor
   *    qilish degani.
   */
  const [olchamQolda, olchamQoldaniOzgartir] = useState(false);

  const [parametrlar, parametrlarniOzgartir] = useState<Record<string, string>>({});
  /**
   * QAYSI OYNA va ICHKI IZOH — soha auditi 2026-09-22 (0049).
   *
   * ⚠️ Ilgari bunday matnni yozadigan joy BUTUN TIZIMDA yo'q edi:
   *    «zanjir o'ngdan», «yuqori qavat, lift yo'q» og'zaki aytilib
   *    yo'qolardi.
   */
  /**
   * TANLANGAN VARIANTLAR — 0052. Kalit: tanlov id, qiymat: variant id.
   *
   * Egasi to'rt marta bir xil savol berdi (zebra, dikkey ochilishi,
   * motorli, burchak oyna) va har safar «ikki alohida tur qiling»
   * degan javob oldi. Endi bitta turda tanlov bo'ladi.
   */
  const [tanlanganlar, tanlanganlarniOzgartir] = useState<Record<number, number>>({});

  const [yorliq, yorliqniOzgartir] = useState('');
  const [izoh, izohniOzgartir] = useState('');
  const [slotlar, slotlarniOzgartir] = useState<Record<number, SlotTanlovi>>({});
  const [aksessuarlar, aksessuarlarniOzgartir] = useState<Record<number, AksessuarTanlovi>>({});
  /**
   * SAVAT BRAUZERDA SAQLANADI — 2026-09-21.
   *
   * ⚠️ Ilgari savat faqat xotirada turardi. Sotuvchi mijoz oldida
   *    beshta xonani kiritadi, sahifa yangilanadi yoki telefon
   *    uxlab qoladi — HAMMASI yo'qolardi. Botda qoralama bor
   *    (TZ 13.10), saytda yo'q edi.
   *
   * ⚠️ `sessionStorage`, `localStorage` EMAS: savat shu ish
   *    seansiniki. Boshqa kun ochilganda eski savat chiqib kelsa,
   *    sotuvchi uni sezmasdan yuborib yuborishi mumkin edi.
   *
   * ⚠️ Faqat SAVAT saqlanadi, yig'ilayotgan pozitsiya emas:
   *    yarim to'ldirilgan holatni tiklash chalkashlik tug'dirardi
   *    (qaysi mato tanlangan edi, narx qayerdan chiqqan edi).
   */
  const SAVAT_KALITI = 'sotuv:savat';

  const [savat, savatniOzgartir] = useState<readonly SavatQatori[]>([]);

  /*
   * ─── OYNA → TAYYOR O'LCHAM — 0053 ──────────────────────
   *
   * ⚠️ Hisob DOMAINDAN (`tayyorOlcham`) — server, ustaning
   *    ekrani va bot ham AYNAN shu funksiyani chaqiradi
   *    (CLAUDE.md §3). Bu yerda alohida qo'shish yozilsa, ekrandagi
   *    raqam saqlangandan keyingisidan farq qilib qolardi.
   */
  const ornatishQoidasi = tur === null ? null : ornatishniTop(tur.ornatishlar, ornatishId);
  const ornatishBormi = tur !== null && tur.ornatishlar.length > 0;

  const oynadanHisob = useMemo((): {
    olcham: { eniM: number; boyiM: number } | null;
    xato: string | null;
  } => {
    if (!ornatishBormi) return { olcham: null, xato: null };
    const oe = son(oynaEni);
    const ob = son(oynaBoyi);
    if (oe === null || ob === null || oe <= 0 || ob <= 0) {
      return { olcham: null, xato: null };
    }
    try {
      return { olcham: tayyorOlcham({ eniM: oe, boyiM: ob }, ornatishQoidasi), xato: null };
    } catch (x) {
      return { olcham: null, xato: biznesXatosimi(x) ? x.message : "O'lchamni hisoblab bo'lmadi" };
    }
  }, [ornatishBormi, oynaEni, oynaBoyi, ornatishQoidasi]);

  /**
   * Tur almashganda o'rnatish turi STANDARTGA qaytadi.
   *
   * ⚠️ BU EFFEKT EMAS, oddiy funksiya — ataylab.
   *
   *    `useEffect(..., [tur])` qilinsa, savatdan qaytarishda
   *    poyga chiqardi: `qatorniTahrirla` saqlangan o'rnatish
   *    turini qo'yadi, effekt esa turdan keyin ishlab uni
   *    STANDARTGA qaytarib tashlardi — sotuvchi qaytargan
   *    qatorda boshqa qoida ko'rardi.
   *
   *    Endi chaqiruv joyi ANIQ: tur tugmasi bosilganda standart,
   *    savatdan qaytarishda saqlangani.
   */
  const ornatishniTiklash = (t: SotuvTuri | null): void => {
    ornatishIdniOzgartir(t === null ? null : (standartOrnatish(t.ornatishlar)?.id ?? null));
    olchamQoldaniOzgartir(false);
    oynaEniniOzgartir('');
    oynaBoyiniOzgartir('');
  };

  /**
   * Hisoblangan tayyor o'lcham kataklarga TUSHADI.
   *
   * ⚠️ `olchamQolda` bo'lsa TEGILMAYDI — egasining gapi:
   *    «agar o'zgartirmasa eski holatida saqlanadi». Qo'lda
   *    yozilgan raqam ustidan yozish odamning ishini bekor qilish
   *    degani.
   */
  useEffect(() => {
    if (olchamQolda) return;
    const o = oynadanHisob.olcham;
    if (o === null) return;
    eniniOzgartir(o.eniM.toFixed(2));
    boyiniOzgartir(o.boyiM.toFixed(2));
  }, [oynadanHisob, olchamQolda]);

  /** Sahifa ochilganda tiklash — bir marta */
  useEffect(() => {
    try {
      const xom = sessionStorage.getItem(SAVAT_KALITI);
      if (xom === null) return;
      const q = JSON.parse(xom) as SavatQatori[];
      if (!Array.isArray(q) || q.length === 0) return;
      savatniOzgartir(q);
      /** Kalitlar takrorlanmasin */
      keyingiKalit = Math.max(keyingiKalit, ...q.map((x) => x.kalit));
    } catch {
      /**
       * ⚠️ JIM O'TILADI. Buzuq yoki eski shakldagi yozuv
       *    sotuvchining ishini TO'XTATMASLIGI kerak — u shunchaki
       *    bo'sh savatdan boshlaydi.
       */
    }
  }, []);

  /**
   * ⚠️ BUYURTMA SAQLANGACH SAVAT TOZALANADI. Aks holda sotuvchi
   *    sahifani yangilaganda allaqachon yuborilgan savat qaytib
   *    kelar va u ikkinchi marta yuborilishi mumkin edi.
   */
  useEffect(() => {
    if (holat.buyurtmaRaqam === null) return;
    savatniOzgartir([]);
    try {
      sessionStorage.removeItem(SAVAT_KALITI);
    } catch {
      /** Xotira taqiqlangan — ish davom etadi */
    }
  }, [holat.buyurtmaRaqam]);

  /** Har o'zgarishda yozib boriladi */
  useEffect(() => {
    try {
      if (savat.length === 0) sessionStorage.removeItem(SAVAT_KALITI);
      else sessionStorage.setItem(SAVAT_KALITI, JSON.stringify(savat));
    } catch {
      /** Xotira to'lgan yoki taqiqlangan — ish davom etadi */
    }
  }, [savat]);
  /**
   * SAVAT QATORINI TAHRIRLASH — 2026-09-21.
   *
   * ⚠️ Ilgari savatga faqat QO'SHISH va O'CHIRISH bor edi.
   *    Beshinchi qatorda bo'yi adashsa, sotuvchi uni o'chirib,
   *    matoni, aksessuarni va qo'shimchalarni BOSHIDAN yig'ardi —
   *    mijoz oldida turib.
   *
   *    `null` — yangi pozitsiya yig'ilmoqda. Son bo'lsa — o'sha
   *    kalitli qator tahrirlanmoqda va «Saqlash» uni O'RNIGA
   *    qaytaradi, oxiriga qo'shmaydi.
   */
  const [tahrirKaliti, tahrirKalitiniOzgartir] = useState<number | null>(null);
  const [mijoz, mijozniOzgartir] = useState<SotuvMijozi | null>(null);
  const [tikuvchi, tikuvchiniOzgartir] = useState(ozFilialId);
  const [tayyorlik, tayyorlikniOzgartir] = useState('');
  const [kelishilgan, kelishilganniOzgartir] = useState('');

  /**
   * TZ 6.3 — mijozning SHAXSIY chegirmasi guruhnikidan ustun.
   *    Qoida `lib/domain/mijoz.ts` da — bot ham shuni ishlatadi.
   */
  const guruhOffseti =
    mijoz === null
      ? null
      : { offsetTuri: mijoz.guruhOffsetTuri, offsetQiymat: mijoz.guruhOffsetQiymat };

  /** TZ 6.3 — USD offseti JORIY kursda so'mga o'giriladi */
  const offset = amaldagiOffset(mijoz, guruhOffseti, kursObyekti);

  /**
   * ⚠️ Kurs kiritilmagan bo'lsa USD offseti QO'LLANMAYDI va buni
   *    sotuvchi BILISHI kerak. Ilgari u jimgina tashlab yuborilardi:
   *    kartochkada «−10 $» turar, mijoz esa standart narxda olardi.
   */
  const offsetOgohi = offsetQollanmadimi(mijoz, guruhOffseti, kursObyekti);

  /**
   * TZ 6.4 — «Limitdan oshsa sotuvchi mustaqil qaror qabul qiladi,
   * tizim BLOKLAMAYDI.» Faqat ogohlantirish chiqadi.
   *
   * ⚠️ Bu qoida yozilgan-u, HECH QAYERDAN chaqirilmagan edi: mijozning
   *    joriy qarzi umuman so'ralmasdi. Ya'ni ogohlantirish hech qachon
   *    chiqmagan.
   *
   * ⚠️ Dollar qarzi JORIY kursda qo'shiladi (6.4). Kurs yo'q bo'lsa
   *    tekshiruv o'tkazib yuboriladi — noto'g'ri ogohlantirishdan
   *    ko'ra ogohlantirmaslik yaxshi.
   */
  const limit = useMemo(() => {
    if (mijoz === null || mijoz.qarzLimiti === null || kursObyekti === null) return null;
    return limitHolati(
      { som: som(mijoz.qarzSom), dollar: dollar(mijoz.qarzDollar) },
      som(mijoz.qarzLimiti),
      kursObyekti,
    );
  }, [mijoz, kursObyekti]);

  /**
   * TZ 6.2 — tanlangan mijoz TURI uchun material narxi.
   *
   * ⚠️ Xarita katalog bilan birga kelgan — mijoz tanlanganda
   *    serverga qayta murojaat qilinmaydi, narx bir zumda
   *    o'zgaradi.
   */
  const turNarxi = (
    turNarxlari: Record<number, { narx: string; valyuta: string }>,
  ): Som | null => {
    if (mijoz === null || mijoz.mijozTuriId === null) return null;
    const n = turNarxlari[mijoz.mijozTuriId];
    if (n === undefined) return null;
    return katalogNarxi(n.narx, n.valyuta, kursObyekti) ?? som(n.narx);
  };

  /**
   * Mijoz tanlagan qo'shimchalar — «usti shabalik», «o'rnatish».
   * Egasi qarori 2026-09-20: «mijoz 1 ta narx ko'radi, lekin
   * o'rnatish narxi yoki qo'shimcha narx qo'shilishi mumkin».
   */
  const [tanlanganQoshimchalar, tanlanganQoshimchalarniOzgartir] = useState<readonly number[]>(
    [],
  );

  /** Guruhli qo'shimchada sotuvchi materialni tanlaydi (mato rangi) */
  const [qoshimchaMateriali, qoshimchaMaterialiniOzgartir] = useState<
    Record<number, string>
  >({});

  /** TZ 3.5 — har slot uchun formula bo'yicha miqdor. */
  const hisob = useMemo(() => {
    if (tur === null) return null;

    const eniM = son(eni);
    const boyiM = son(boyi);
    if (eniM === null || boyiM === null || eniM <= 0 || boyiM <= 0) return null;

    /**
     * ⚠️ SONI butun va musbat bo'lishi shart. Noto'g'ri yozilsa
     *    1 deb olinadi — hisob to'xtamaydi, sotuvchi raqamni
     *    tuzatgach o'zi yangilanadi.
     */
    const soniSoni = son(soni);
    const buyumSoni =
      soniSoni !== null && Number.isInteger(soniSoni) && soniSoni > 0 ? soniSoni : 1;

    const qiymatlar: Record<string, number> = {};
    for (const p of tur.parametrlar) {
      const q = son(parametrlar[p.kod] ?? p.standartQiymat ?? '');
      if (q !== null) qiymatlar[p.kod] = q;
    }

    /**
     * TANLOV QIYMATLARI FORMULAGA — 0052.
     *
     * Tanlovning kodi formulada o'zgaruvchi bo'lib ishlatiladi:
     * CEIL(ENI / LAMEL_ENI). Mavjud parametr mexanizmi qayta
     * ishlatiladi — yangi formula tili yozilmaydi.
     *
     * Tanlov qiymatlari parametrlardan KEYIN qo'yiladi: kod
     * to'qnashuvi bazada va sxemada taqiqlangan, lekin eski
     * ma'lumotda uchrasa tanlov ustun bo'lsin — u sotuvchining
     * ayni paytdagi tanlovi.
     */
    const asos = standartQiymatlar(m(eniM), m(boyiM), buyumSoni, {
      ...qiymatlar,
      ...tanlovQiymatlari(tur.tanlovlar, tanlanganlar),
    });

    const qatorlar = tur.slotlar.map((s) => {
      const tanlov = slotlar[s.id];
      const material = tanlov
        ? (s.materiallar.find((m) => m.id === Number(tanlov.materialId)) ?? null)
        : null;

      const birlik = (material?.sarflashBirligi ?? 'KV_M') as SarflashBirligi;

      let hisoblangan: number | null = null;
      let xato: string | null = null;
      try {
        // AUDIT 1-topilma — jami sarf = formula × slot koeffitsienti
        hisoblangan = slotSarfi(s.formula, asos, birlik, s.koeffitsient);
      } catch (x) {
        xato = biznesXatosimi(x) ? x.message : 'Formulada xato';
      }

      const tuzatilgan = son(tanlov?.tuzatilgan ?? '');
      /**
       * ⚠️ Bu MIJOZ NARXI EMAS (egasi qarori 2026-09-20). Mijoz narxi
       *    endi «Narxlar va turlar» jadvalidan keladi va quyida
       *    bir marta hisoblanadi.
       *
       *    Bu qiymat faqat `pozitsiya_material.narx_snapshot` ga
       *    yoziladi: material o'sha kuni qanday narxda turgani
       *    tarixda qolsin (2.3-invariant) va tannarx hisobotlari
       *    ishlayversin. EKRANDA KO'RSATILMAYDI.
       */
      const narxMatn =
        material === null || material.narx === null
          ? null
          : pulMatn(
              matoNarxi({
                standart:
                  katalogNarxi(material.narx, material.narxValyuta, kursObyekti) ??
                  som(material.narx),
                filialNarxi: null,
                turNarxi: turNarxi(material.turNarxlari),
                offset,
                kurs: kursObyekti,
              }),
            );

      /**
       * Q-03 · QABUL S3.4 — «Bu mato hozir yetarli emas» ogohi
       * BUYURTMA BERILAYOTGANDA chiqadi, usta olganda emas.
       *
       * ⚠️ Bu ogoh — TAXMIN, aniq javob emas: bu yerda umumiy bo'sh
       *    qoldiq ko'riladi, band qilish esa TO'RTBURCHAK qidiradi
       *    (7.6). Aniq javobni server beradi va u ham bloklamaydi —
       *    pozitsiya «Materialga kutmoqda» ga tushadi (8.12).
       */
      const yetarlimi =
        material === null || hisoblangan === null
          ? true
          : birlik === 'KV_M'
            ? material.boshKvM >= hisoblangan
            : material.boshDona >= hisoblangan;

      return {
        slot: s,
        material,
        birlik,
        hisoblangan,
        tuzatilgan,
        xato,
        narxMatn,
        yetarlimi,
      };
    });

    const aksQatorlar = tur.aksessuarlar
      .filter((a) => {
        /**
         * VARIANTGA BOG'LANGAN AKSESSUAR — 0052.
         *
         * Motorli jalyuzida zanjir QO'SHILMAYDI, kabel va quvvat
         * manbai qo'shiladi. Qo'lda boshqariladiganda teskari.
         * Bog'lanmagan aksessuar (null) avvalgidek DOIM qo'shiladi.
         */
        if (!aksessuarKeraklimi(a.variantId, tanlanganlar)) return false;

        const t = aksessuarlar[a.materialId];
        if (t?.ochirilgan === true) return false;
        return a.majburiy || t !== undefined;
      })
      .map((a) => {
        const t = aksessuarlar[a.materialId];
        const birlik = a.sarflashBirligi as SarflashBirligi;

        let hisoblangan = 0;
        try {
          hisoblangan = sarflashHisobla(a.formula, asos, birlik);
        } catch {
          hisoblangan = 0;
        }

        // TZ 3.7 — qo'lda kiritilgan sonni formula USTIDAN YOZMAYDI
        const soni = t?.qoldaKiritildi === true ? (son(t.soni) ?? 0) : hisoblangan;

        /**
         * ⚠️ TZ 6.3 — «Offset FAQAT MATOGA qo'llanadi, AKSESSUARGA
         *    TEGMAYDI». Lekin TUR NARXI qo'llanadi (6.2): u
         *    chegirma emas, mahsulotning o'z narxi — optomchi
         *    mexanizmni ham optom narxda oladi.
         */
        const narx =
          a.narx === null
            ? null
            : aksessuarNarxi(
                katalogNarxi(a.narx, a.narxValyuta, kursObyekti) ?? som(a.narx),
                null,
                turNarxi(a.turNarxlari),
              );

        return { aksessuar: a, birlik, soni, narx };
      });

    const xizmat = tur.xizmatHaqi === null ? nolSom() : som(tur.xizmatHaqi);

    /**
     * ⚠️ MIJOZ NARXI — egasi qarori 2026-09-20.
     *
     *    Tanlangan matoning DARAJASI qoidani topadi, qoida esa
     *    o'lchamga qarab bosqichni tanlaydi. Materiallarning narxi
     *    endi mijoz narxiga umuman ta'sir qilmaydi.
     *
     * ⚠️ DARAJA QAYSI SLOTDAN OLINISHI — `darajaliSlotniTop()` da,
     *    bu yerda EMAS (egasi qarori 2026-09-22, migratsiya 0048).
     *
     *    Ilgari bu qoida SHU YERDA, `lib/amal/narx-tekshir.ts` da va
     *    `bot/buyurtma-oqimi.ts` da — UCH JOYDA alohida yozilgan edi.
     *    Uchalasi bir xil ishlashi shart, aks holda mijoz ko'rgan
     *    narx, bazaga tushgan narx va botdagi narx uch xil bo'lardi.
     *    Endi qoida bitta joyda (CLAUDE.md §3).
     */
    const darajaliQator = darajaliSlotniTop(
      qatorlar.map((q) => ({
        narxBelgilaydi: q.slot.narxBelgilaydi,
        matomi: q.birlik === 'KV_M',
        narxGuruhId: q.material?.narxGuruhId ?? null,
        qator: q,
      })),
    );
    const narxGuruhId = darajaliQator?.narxGuruhId ?? null;
    /** Xato xabarida ko'rsatish uchun — sotuvchi sababni ko'rsin */
    const darajaNomi = darajaliQator?.qator.material?.narxGuruhNomi ?? null;
    const darajaliMaterial = darajaliQator?.qator.material?.nom ?? null;

    /**
     * TZ 6.2 — mijoz turiga qo'yilgan qoida umumiysidan USTUN.
     * Yozuv bo'lsa shu narx, bo'lmasa umumiysi.
     */
    const mijozTuriId = mijoz?.mijozTuriId ?? null;
    const qoidaQatori =
      narxGuruhId === null
        ? undefined
        : (tur.narxQoidalari.find(
            (q) => q.narxGuruhId === narxGuruhId && q.mijozTuriId === mijozTuriId,
          ) ??
          tur.narxQoidalari.find(
            (q) => q.narxGuruhId === narxGuruhId && q.mijozTuriId === null,
          ));

    /**
     * ⚠️ `slotlar` va `aksessuarlar` BO'SH berilyapti — sarf
     *    yuqorida allaqachon hisoblandi (ekran material tanlovini,
     *    qoldiqni va tuzatilgan sonni ham biladi). Bu yerdan faqat
     *    NARX olinadi. Bot esa o'sha funksiyadan ikkalasini ham
     *    oladi — mantiq baribir bitta joyda (§2.2).
     */
    const narx = pozitsiyaNarxiniHisobla({
      eniM,
      boyiM,
      soni: buyumSoni,
      parametrlar: qiymatlar,
      slotlar: [],
      aksessuarlar: [],
      qoida:
        qoidaQatori === undefined
          ? null
          : {
              hisoblashUsuli: qoidaQatori.hisoblashUsuli as HisoblashUsuli,
              bosqichlar: qoidaQatori.bosqichlar.map((b) => ({
                dan: b.dan,
                gacha: b.gacha,
                narx: b.narx,
                valyuta: b.valyuta,
              })),
            },
      qoshimchalar: [
        ...tur.qoshimchalar
          .filter((q) => tanlanganQoshimchalar.includes(q.id))
          .map((q) => ({
            nom: q.nom,
            hisoblashUsuli: q.hisoblashUsuli as QoshimchaUsuli,
            narx: q.narx,
            valyuta: q.valyuta,
          })),
        /**
         * TANLOV NARXI — 0052.
         *
         * Variantning narxi MAVJUD qo'shimcha mexanizmiga qo'shiladi:
         * `QATIY` usul — o'lchamga bog'liq emas. Yangi narx yo'li
         * yozilmaydi, ya'ni server tekshiruvi va bot ham o'sha
         * hisobni ko'radi (§2.2).
         *
         * O'lchamga bog'liq narx kerak bo'lsa `qo'shimchalar` ishlatiladi —
         * u MAYDON/ENI/BO'YI usullarini allaqachon biladi.
         */
        ...tanlovYuki(tur.tanlovlar, tanlanganlar)
          .filter((y) => y.narx !== null)
          .map((y) => ({
            nom: `${y.tanlovNomi}: ${y.variantNomi}`,
            hisoblashUsuli: 'QATIY' as const,
            narx: y.narx ?? '0',
            valyuta: 'SOM',
          })),
      ],
      offset,
      kurs: kursObyekti,
      xizmatHaqi: tur.xizmatHaqi,
    });

    const jami = narx.jami === null ? nolSom() : som(narx.jami);

    /**
     * Buyurtmaga yoziladigan qo'shimchalar — T-13.
     *
     * ⚠️ Narx `narx.narxQatorlari` dan olinadi, qayta hisoblanmaydi:
     *    mijoz ko'rgan raqam bilan bazaga tushgan raqam bir xil
     *    bo'lishi shart.
     */
    const qoshimchaYuki = tur.qoshimchalar
      .filter((q) => tanlanganQoshimchalar.includes(q.id))
      .map((q) => {
        const qator = narx.narxQatorlari.find((x) => x.nom === q.nom);

        /** Guruhli bo'lsa sotuvchi tanlagan material, aks holda qat'iysi */
        const tanlangan =
          q.materialId ??
          (qoshimchaMateriali[q.id] === undefined
            ? null
            : Number(qoshimchaMateriali[q.id]));

        const birlik =
          q.materialId !== null
            ? q.sarflashBirligi
            : (q.materiallar.find((m) => m.id === tanlangan)?.sarflashBirligi ?? null);

        let miqdor: string | null = null;
        if (tanlangan !== null && birlik !== null && q.formula !== null) {
          try {
            miqdor = String(
              sarflashHisobla(q.formula, asos, birlik as SarflashBirligi),
            );
          } catch {
            miqdor = null;
          }
        }

        return {
          mahsulotQoshimchaId: q.id,
          nomSnapshot: q.nom,
          narxSnapshot: qator?.summa ?? '0',
          /** ⚠️ Miqdor chiqmasa material ham yozilmaydi — sxema shuni talab qiladi */
          materialId: miqdor === null ? null : tanlangan,
          miqdor,
          birlik: miqdor === null ? null : (birlik as 'KV_M' | 'M' | 'DONA'),
        };
      });

    return {
      qatorlar,
      aksQatorlar,
      xizmat,
      narx,
      jami,
      qoshimchaYuki,
      eniM,
      boyiM,
      buyumSoni,
      darajaNomi,
      darajaliMaterial,
    };
  }, [
    tur,
    eni,
    boyi,
    soni,
    parametrlar,
    slotlar,
    aksessuarlar,
    offset,
    mijoz,
    tanlanganQoshimchalar,
    qoshimchaMateriali,
  ]);

  const savatJami = savat.reduce<Som>((y, q) => qosh(y, som(q.narx)), nolSom());

  // Q-03 — yetmaydigan matolar (ogohlantirish, bloklamaydi)
  const yetmaydiganlar = (hisob?.qatorlar ?? []).filter((q) => !q.yetarlimi);

  /**
   * Pozitsiya narxi — SOTUVCHI TUZATISHI MUMKIN (3.8).
   *
   * ⚠️ Egasi (2026-08-30): «savatga qo'shishdan oldin pastda narx
   *    hisoblanadi — o'shani ham o'zgartirib bo'lsin, narx inputda
   *    tursin».
   *
   * ⚠️ `null` — «hisoblangani ishlatiladi». Sotuvchi tegsa, raqam
   *    QOTADI va o'lchamlar o'zgarganda ham o'zgarmaydi: u mijoz
   *    bilan kelishilgan narx.
   */
  const [qoldaNarx, qoldaNarxniOzgartir] = useState<string | null>(null);

  const hisoblanganNarx = hisob === null ? '' : pulMatn(hisob.jami);
  const korsatiladiganNarx = qoldaNarx ?? hisoblanganNarx;

  /** Kiritilgan narx pul sifatida yaroqlimi */
  const narxYaroqli = /^\d+(\.\d{1,2})?$/.test(korsatiladiganNarx.trim());

  /**
   * O'LCHAM CHEGARASI — egasi qarori 2026-09-22 (0051).
   *
   * ⚠️ Ilgari chegara umuman yo'q edi: 4 metrli rulon parda ham
   *    savatga tushardi va muammo USTANING oldida chiqardi.
   *
   * ⚠️ Egasi: «butunlay to'xtatsin». Narxdan farqi shu — narx mijoz
   *    bilan kelishiladi (TZ 3.8), jismoniy chegara kelishilmaydi.
   *
   * ⚠️ Qoida `lib/domain/olcham-chegarasi.ts` da; bu yerda faqat
   *    chaqiriladi. Server (`lib/amal/buyurtma.ts`) va bot ham
   *    AYNI funksiyani chaqiradi — §9.4: tugmani o'chirish himoya
   *    emas.
   */
  const chegaraNuqsonlari =
    tur === null || hisob === null
      ? []
      : olchamniTekshir(tur.chegara, hisob.eniM, hisob.boyiM);

  const savatgaQoshilsinmi =
    hisob !== null &&
    /** ⚠️ Narx qo'yilmagan pozitsiya savatga TUSHMAYDI — bepulga sotilmaydi */
    hisob.narx.xato === null &&
    tur !== null &&
    narxYaroqli &&
    /** ⚠️ Chegaradan chiqqan o'lcham ham TUSHMAYDI */
    chegaraNuqsonlari.length === 0 &&
    /** ⚠️ Majburiy tanlov tanlanmagan bo'lsa ham TUSHMAYDI (0052) */
    yetishmaganTanlovlar(tur.tanlovlar, tanlanganlar).length === 0 &&
    tur.slotlar.filter((s) => s.majburiy).every((s) => (slotlar[s.id]?.materialId ?? '') !== '');

  /**
   * Savat qatorini yasaydi — QO'SHISH va TAHRIRLASH ikkalasi ham
   * shu funksiyadan foydalanadi (§2.2).
   *
   * ⚠️ Nusxa ko'chirilsa, bir joyda tuzatilgan xato ikkinchisida
   *    qolib ketardi: masalan «soni» qo'shishda hisobga olinib,
   *    tahrirda olinmay qolardi.
   */
  function savatQatoriYasa(kalit: number): SavatQatori {
    if (hisob === null || tur === null) throw new Error("hisob yo'q");

    const yuk = {
      mahsulotTurId: tur.id,
      eniM: hisob.eniM,
      boyiM: hisob.boyiM,
      /*
       * OYNA O'LCHAMI VA O'RNATISH QOIDASI — 0053.
       *
       * ⚠️ Yuqoridagi `eniM`/`boyiM` o'sha-o'sha TAYYOR o'lcham.
       *    Quyidagilar QO'SHIMCHA yozuv: usta ish varag'ida
       *    «oyna 1.50 → tayyor 1.60» ni ko'rsin va «oyna qancha
       *    edi?» degan savolni tekshirib bo'lsin.
       *
       * ⚠️ Oyna o'lchami YOZILMAGAN bo'lsa hammasi `null` —
       *    qoidasiz turda yolg'on ma'lumot saqlanmaydi.
       */
      ...(ornatishBormi && oynadanHisob.olcham !== null
        ? {
            oynaEniM: son(oynaEni),
            oynaBoyiM: son(oynaBoyi),
            olchamQolda,
            ...(ornatishYuki(ornatishQoidasi) ?? {}),
          }
        : {}),
      /** ⚠️ Ekrandan keladi (2026-09-21); ilgari 1 qotirilgan edi */
      soni: hisob.buyumSoni,
      /** ⚠️ Sotuvchi tuzatgan bo'lsa — o'sha raqam, aks holda hisoblangani */
      narxSnapshot: qoldaNarx ?? pulMatn(hisob.jami),
      chegirmaSumma: '0',
      xizmatHaqi: pulMatn(hisob.xizmat),
      /** 0049 — bo'sh bo'lsa `null`, bazadagi cheklov bilan bir xil */
      yorliq: yorliq.trim() === '' ? null : yorliq.trim(),
      izoh: izoh.trim() === '' ? null : izoh.trim(),
      /**
       * TANLANGAN VARIANTLAR — 0052, SNAPSHOT bilan.
       *
       * Nom va qiymat NUSXA bo'lib ketadi: admin keyin variantni
       * o'chirsa yoki nomini o'zgartirsa, eski buyurtmada o'sha
       * kungi nom turadi (2.3-invariant).
       */
      tanlovlar: tanlovYuki(tur.tanlovlar, tanlanganlar).map((y) => ({
        mahsulotTanlovId: y.tanlovId,
        variantId: y.variantId,
        tanlovNomi: y.tanlovNomi,
        variantNomi: y.variantNomi,
        qiymat:
          tur.tanlovlar
            .find((t) => t.id === y.tanlovId)
            ?.variantlar.find((v) => v.id === y.variantId)?.qiymat ?? null,
        narx: y.narx,
      })),
      // TZ 4.10 — konstruktor holati QOTADI
      formulaSnapshot: {
        tur: tur.nom,
        slotlar: tur.slotlar.map((s) => ({ nom: s.nom, formula: s.formula })),
        parametrlar: tur.parametrlar.map((p) => ({
          kod: p.kod,
          qiymat: parametrlar[p.kod] ?? p.standartQiymat,
        })),
      },
      qoshimchalar: hisob.qoshimchaYuki,
      slotlar: hisob.qatorlar
        .filter((q) => q.material !== null && q.hisoblangan !== null)
        .map((q) => ({
          slotId: q.slot.id,
          materialId: q.material?.id ?? 0,
          hisoblanganMiqdor: String(q.hisoblangan ?? 0),
          tuzatilganMiqdor: q.tuzatilgan === null ? null : String(q.tuzatilgan),
          birlik: q.birlik,
          koeffitsient: q.slot.koeffitsient,
          kesishTuri: q.slot.kesishTuri,
          /** ⚠️ «DIKKEY» — rulon eni o'zgarmaydi (egasi, 2026-09-20) */
          kesimEniM: q.slot.kesimEniM,
          narxSnapshot: q.narxMatn ?? '0',
        })),
      aksessuarlar: hisob.aksQatorlar.map((a) => ({
        materialId: a.aksessuar.materialId,
        soni: String(a.soni),
        birlik: a.birlik,
        narxSnapshot: a.narx === null ? '0' : pulMatn(a.narx),
        qoldaKiritildi: aksessuarlar[a.aksessuar.materialId]?.qoldaKiritildi ?? false,
      })),
    };

    return {
      kalit,
      turId: tur.id,
      turNomi: tur.nom,
      eniM: hisob.eniM,
      boyiM: hisob.boyiM,
      /** ⚠️ Savatda ham ko'rinsin: «2.10 × 1.40 m × 3» */
      soni: hisob.buyumSoni,
      /** ⚠️ Savatdagi raqam ham TUZATILGANI — jami shundan chiqadi */
      narx: qoldaNarx ?? pulMatn(hisob.jami),
      yorliq: yorliq.trim() === '' ? null : yorliq.trim(),
      yuk,
      tahrir: {
        eni,
        boyi,
        soni,
        /** 0053 — savatdan qaytarilganda oyna katagi ham tiklanadi */
        oynaEni,
        oynaBoyi,
        ornatishId,
        olchamQolda,
        yorliq,
        izoh,
        tanlanganlar: { ...tanlanganlar },
        parametrlar: { ...parametrlar },
        slotlar: { ...slotlar },
        aksessuarlar: { ...aksessuarlar },
        tanlanganQoshimchalar: [...tanlanganQoshimchalar],
        qoshimchaMateriali: { ...qoshimchaMateriali },
        qoldaNarx,
      },
    };
  }

  /**
   * Savat qatorini chap ustunga QAYTARADI.
   *
   * ⚠️ Tur ham qayta yuklanadi: sotuvchi oradan boshqa turni
   *    tanlagan bo'lishi mumkin, ekrandagi slotlar esa o'sha
   *    turniki bo'lardi.
   */
  function qatorniTahrirla(q: SavatQatori): void {
    if (q.turId === null || q.tahrir === undefined) return;

    const t = q.tahrir;
    tahrirKalitiniOzgartir(q.kalit);
    eniniOzgartir(t.eni);
    boyiniOzgartir(t.boyi);
    soniniOzgartir(t.soni);
    /**
     * 0053 — oyna o'lchami va o'rnatish turi ham qaytariladi.
     *
     * ⚠️ `olchamQolda` OXIRIDA emas, SHU YERDA: hisob effekti
     *    uni ko'rib turishi kerak, aks holda qaytarilgan qator
     *    ustidan qayta hisoblangan o'lcham yozilib ketardi.
     *
     * ⚠️ Eski shakldagi savat yozuvida bu maydonlar yo'q —
     *    `?? ''` bilan bo'sh qoladi va eski xulq saqlanadi.
     */
    oynaEniniOzgartir(t.oynaEni ?? '');
    oynaBoyiniOzgartir(t.oynaBoyi ?? '');
    ornatishIdniOzgartir(t.ornatishId ?? null);
    olchamQoldaniOzgartir(t.olchamQolda ?? false);
    yorliqniOzgartir(t.yorliq);
    izohniOzgartir(t.izoh);
    tanlanganlarniOzgartir(t.tanlanganlar);
    parametrlarniOzgartir(t.parametrlar);
    tanlanganQoshimchalarniOzgartir([...t.tanlanganQoshimchalar]);
    qoshimchaMaterialiniOzgartir(t.qoshimchaMateriali);
    qoldaNarxniOzgartir(t.qoldaNarx);

    if (q.turId === turId) {
      slotlarniOzgartir(t.slotlar);
      aksessuarlarniOzgartir(t.aksessuarlar);
      return;
    }

    turniOzgartir(q.turId);
    yuklanishniOzgartir(true);
    void turTafsiliAmali(q.turId)
      .then((x) => {
        turniYukla(x);
        /** ⚠️ Slotlar tur YUKLANGACH qo'yiladi — aks holda
         *     tur almashishi ularni tozalab yuborardi */
        slotlarniOzgartir(t.slotlar);
        aksessuarlarniOzgartir(t.aksessuarlar);
      })
      .finally(() => {
        yuklanishniOzgartir(false);
      });
  }

  function savatgaQosh(): void {
    if (hisob === null || tur === null) return;

    keyingiKalit += 1;
    savatniOzgartir((s) => [...s, savatQatoriYasa(keyingiKalit)]);

    slotlarniOzgartir({});
    aksessuarlarniOzgartir({});
    /** Keyingi pozitsiya yana hisoblangan narxdan boshlanadi */
    qoldaNarxniOzgartir(null);
    /**
     * ⚠️ Yorliq va izoh HAM tozalanadi: aks holda «Zal» yorlig'i
     *    keyingi oynaga ham yopishib qolardi va chekda ikkita
     *    «Zal» chiqardi.
     */
    yorliqniOzgartir('');
    izohniOzgartir('');
    /**
     * Tanlovlar HAM tozalanadi: «markazdan» tanlovi keyingi
     * oynaga yopishib qolsa, usta noto'g'ri mahsulot qilardi.
     */
    tanlanganlarniOzgartir({});
  }

  /**
   * Tahrirlanayotgan qatorni O'RNIGA qaytaradi.
   *
   * ⚠️ Tartib SAQLANADI: qator oxiriga ko'chib ketsa, sotuvchi
   *    «qaysi xona edi» deb adashardi.
   */
  function tahrirniSaqla(): void {
    if (hisob === null || tur === null || tahrirKaliti === null) return;

    const yangi = savatQatoriYasa(tahrirKaliti);
    savatniOzgartir((sv) => sv.map((x) => (x.kalit === tahrirKaliti ? yangi : x)));

    tahrirKalitiniOzgartir(null);
    slotlarniOzgartir({});
    aksessuarlarniOzgartir({});
    qoldaNarxniOzgartir(null);
    yorliqniOzgartir('');
    izohniOzgartir('');
    tanlanganlarniOzgartir({});
  }

  /** Tahrirni bekor qilish — qator o'zgarishsiz qoladi */
  function tahrirniBekor(): void {
    tahrirKalitiniOzgartir(null);
    slotlarniOzgartir({});
    aksessuarlarniOzgartir({});
    qoldaNarxniOzgartir(null);
    yorliqniOzgartir('');
    izohniOzgartir('');
    tanlanganlarniOzgartir({});
  }

  /**
   * QATORNI NUSXALASH — soha auditi 2026-09-22.
   *
   * ⚠️ NEGA KERAK: bir xonada bir xil beshta oyna bo'lishi odatiy
   *    hol. Ilgari sotuvchi beshalasini QAYTADAN kiritardi —
   *    o'lcham, mato, aksessuar, qo'shimcha. Bir joyda adashsa
   *    mahsulot noto'g'ri chiqardi.
   *
   * ⚠️ Nusxa DARHOL savatga tushadi, chap ustunni band qilmaydi:
   *    sotuvchi tahrir rejimida turgan bo'lishi mumkin va uning
   *    ishini uzib qo'yish noto'g'ri bo'lardi.
   *
   * ⚠️ Yorliqqa « (2)» qo'shiladi — ikkita bir xil «Zal» qatori
   *    chekda ajralib turishi uchun. Sotuvchi keyin tahrirlaydi.
   */
  function qatorniNusxala(q: SavatQatori): void {
    keyingiKalit += 1;
    const kalit = keyingiKalit;

    savatniOzgartir((sv) => {
      const nechta = sv.filter((x) => x.turId === q.turId).length;
      const yangiYorliq =
        q.yorliq === null ? null : `${q.yorliq} (${String(nechta + 1)})`;

      const nusxa: SavatQatori = {
        ...q,
        kalit,
        yorliq: yangiYorliq,
        yuk:
          typeof q.yuk === 'object' && q.yuk !== null
            ? { ...q.yuk, yorliq: yangiYorliq }
            : q.yuk,
        tahrir:
          q.tahrir === undefined
            ? undefined
            : { ...q.tahrir, yorliq: yangiYorliq ?? '' },
      };

      /** ⚠️ Nusxa asl qatorning YONIGA qo'yiladi, oxiriga emas */
      const joy = sv.findIndex((x) => x.kalit === q.kalit);
      return joy < 0 ? [...sv, nusxa] : [...sv.slice(0, joy + 1), nusxa, ...sv.slice(joy + 1)];
    });
  }

  const kelishilganSom = son(kelishilgan);
  const chegirma = kelishilganSom === null ? null : Number(pulMatn(savatJami)) - kelishilganSom;

  /**
   * OLDINDAN TO'LOV — TZ 12.5.
   *
   * ⚠️ Kassa BIRINCHISI bilan ochiladi: sotuvchida odatda bitta
   *    naqd kassa bo'ladi va undan savol so'rashning ma'nosi yo'q.
   */
  const [tolovSumma, tolovSummaniOzgartir] = useState('');
  const [tolovKassaId, tolovKassaIdniOzgartir] = useState(
    kassalar[0] === undefined ? '' : String(kassalar[0].id),
  );

  /** Qancha qarz qoladi — sotuvchi mijozga shuni aytadi */
  const tolovQoldiq = ((): number | null => {
    const t = Number(tolovSumma);
    if (tolovSumma.trim() === '' || !Number.isFinite(t) || t < 0) return null;
    const jami = kelishilganSom ?? Number(pulMatn(savatJami));
    return Number((jami - t).toFixed(2));
  })();

  /**
   * TZ 3.10 — QARZGA SOTISHDA MIJOZ MAJBURIY.
   *
   * ⚠️ Egasi (2026-09-03): «mijoz kiritilmasa qarz saqlanmaydi» —
   *    shuning uchun qarz qoladigan buyurtma mijozsiz UMUMAN
   *    saqlanmaydi. Ilgari buyurtma saqlanar, to'lov esa rad
   *    etilardi: pul kassada qolib, tizimga tushmasdi va kun
   *    yopilganda ortiqcha bo'lib chiqardi.
   *
   * ⚠️ To'lov kiritilmagan bo'lsa ham qarz qoladi — bepul berilmaydi.
   */
  const qarzQoladi = tolovQoldiq === null ? savat.length > 0 : tolovQoldiq > 0.009;
  /**
   * ⚠️ Qo'shish rejimida mijoz SO'RALMAYDI: u buyurtmada bor.
   *    Qarz ham o'sha buyurtmaga yoziladi (8.7 · 6.8).
   */
  const mijozKerak = qoshish === null && qarzQoladi && mijoz === null;

  const yuborilajak = {
    mijozId: mijoz?.id ?? null,
    ishlabChiqaruvchiFilialId: tikuvchi,
    valyuta: 'SOM' as const,
    /**
     * ⚠️ Buyurtma so'mda bo'lsa ham kurs YOZILADI — dollardagi
     *    material narxi shu kursda so'mga o'girilgan. Yozilmasa,
     *    keyin «bu narx qayerdan chiqqan» degan savolga javob
     *    topilmasdi (2.3-invariant: o'tmish o'zgarmaydi).
     */
    kursSnapshot: joriyKurs,
    tayyorlikSana: tayyorlik === '' ? null : tayyorlik,
    qarzgaKetadimi: qarzQoladi,
    /**
     * TZ 3.11 — kelishilgan summa SERVERGA ketadi va u yerda
     * chegirma bo'lib pozitsiyalarga taqsimlanadi.
     *
     * ⚠️ Ilgari bu maydon shu ro'yxatga QO'SHILMAGAN edi: ekranda
     *    «chegirma 78 400» ko'rinar, bazaga esa 0 yozilardi.
     */
    kelishilganSumma: kelishilgan.trim() === '' ? null : kelishilgan.trim(),
    pozitsiyalar: savat.map((q) => q.yuk),
  };

  return (
    /**
     * ⚠️ Keng ekranda IKKI USTUN: chapda pozitsiya yig'iladi, o'ngda
     *    narx va savat YOPISHIB turadi. Ilgari hammasi bir ustunda
     *    edi va sotuvchi savatni ko'rish uchun pastga tushardi —
     *    jami summani ko'rmay turib mijozga narx aytardi.
     *
     * ⚠️ Tor ekranda bir ustun bo'lib qoladi: telefonda yon ustun
     *    joy yeydi.
     */
    <form action={yubor} onKeyDown={enterYuborilmasin} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="buyurtma" value={JSON.stringify(yuborilajak)} />

      {/* Xabarlar ikki ustunning USTIDA — ko'zdan qochmasin */}
      <div className="contents xl:col-span-2">
        {holat.xato !== null && (
          <p
            role="alert"
            className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
          >
            {holat.xato}
          </p>
        )}

        {holat.buyurtmaRaqam !== null && (
          <div className="rounded-karta bg-belgi-yashil-fon px-4 py-3 text-sm text-belgi-yashil ring-1 ring-belgi-yashil/20">
            <b>{holat.buyurtmaRaqam}</b> saqlandi.
            {holat.materialgaKutmoqda.length > 0 && (
              <span className="mt-1 block text-belgi-sariq">
                {holat.materialgaKutmoqda.join(', ')}-pozitsiya uchun mos material topilmadi —
                «Materialga kutmoqda» holatida turibdi (Q-03). Kirim bo&apos;lgach avtomatik
                navbatga qaytadi (8.12).
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══ CHAP USTUN — pozitsiya yig'iladi ═══════════════════ */}
      <div className="flex flex-col gap-6">
        {/* ── 3.2 · Mahsulot turlari ── */}
        <section>
          <h2 className="mb-1.5 text-sm font-medium text-matn-ikki">Tur</h2>
          {turlar.length === 0 ? (
            <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
              Faol tur yo&apos;q. Avval «Tur yig&apos;ish» bo&apos;limida tur qo&apos;shing.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {turlar.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (t.id === turId) return;
                    turniOzgartir(t.id);
                    slotlarniOzgartir({});
                    aksessuarlarniOzgartir({});
                    yuklanishniOzgartir(true);

                    void turTafsiliAmali(t.id)
                      .then((x) => {
                        turniYukla(x);
                        /** 0053 — yangi turning standart qoidasi */
                        ornatishniTiklash(x);
                      })
                      .finally(() => {
                        yuklanishniOzgartir(false);
                      });
                  }}
                  disabled={turYuklanmoqda}
                  /**
                   * ⚠️ Faol tur BREND rangida, qora emas. Ekranda 15–20
                   *    amal bor; qora fon eng kuchli signal va u
                   *    «Buyurtmani saqlash» tugmasiga tegishli.
                   */
                  /**
                   * ⚠️ IXCHAM. Tur soni o'nlab bo'lishi mumkin —
                   *    katta tugmalar bir necha qatorga yoyilib,
                   *    o'lcham kiritish maydonini ekrandan
                   *    surib yuborardi.
                   */
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    t.id === turId
                      ? 'bg-brend text-white'
                      : 'border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn'
                  } ${turYuklanmoqda ? 'opacity-60' : ''}`}
                >
                  {/*
                    ⚠️ TZ 4.2 — katalog rasmi. Tugma ichida kichik
                       belgi bo'lib turadi: mijoz «qaysi mahsulot?»
                       deganda sotuvchi ekranni buradi.
                  */}
                  {t.rasmBormi && (
                    <img
                      src={`/api/rasm/mahsulot/${String(t.id)}`}
                      alt=""
                      loading="lazy"
                      className="mr-1.5 inline-block size-4 rounded-[3px] object-cover align-[-3px]"
                    />
                  )}
                  {t.nom}
                </button>
              ))}
            </div>
          )}
        </section>

        {tur !== null && (
          <>
            {/*
              ── QAYSI OYNA va IZOH — soha auditi 2026-09-22 (0049) ──

              ⚠️ O'LCHAMDAN OLDIN turadi: sotuvchi mijoz bilan
                 gaplashib «zal, katta oyna» deb yozadi, keyin
                 o'lchamga o'tadi. Tartib suhbat tartibiga mos.

              ⚠️ Majburiy emas. Majburiy qilinsa sotuvchi shoshib
                 nuqta qo'yib ketardi va maydon ma'nosini
                 yo'qotardi.
            */}
            <section className="flex flex-wrap items-end gap-4">
              <Maydon nom="yorliq" yorliq="Qaysi oyna">
                <input
                  id="yorliq"
                  value={yorliq}
                  onChange={(e) => {
                    yorliqniOzgartir(e.target.value);
                  }}
                  maxLength={60}
                  placeholder="Zal — katta oyna"
                  className={`${kirishUslubi(false)} w-56`}
                />
              </Maydon>
              <Maydon nom="izoh" yorliq="Izoh (usta uchun)">
                <input
                  id="izoh"
                  value={izoh}
                  onChange={(e) => {
                    izohniOzgartir(e.target.value);
                  }}
                  maxLength={500}
                  placeholder="zanjir o'ngdan"
                  className={`${kirishUslubi(false)} w-72`}
                />
              </Maydon>
            </section>

            {/*
              ── OYNA O'LCHAMI — 0053 ────────────────────────

              Zamerchi OYNANI o'lchaydi, tizim TAYYOR jalyuzi
              o'lchamini kutadi. Farqni shu paytgacha sotuvchi
              boshida hisoblardi — peredelkaning birinchi sababi.

              ⚠️ Bu blok FAQAT turda o'rnatish qoidasi bo'lsa
                 chiqadi. Qoidasiz turda pastdagi «Eni/Bo'yi»
                 avvalgidek to'g'ridan-to'g'ri yoziladi.
            */}
            {ornatishBormi && (
              <section className="rounded-maydon border border-chegara bg-fon-ikki p-3">
                <div className="flex flex-wrap items-end gap-3">
                  <Maydon nom="oynaEni" yorliq="Oyna eni (m)">
                    <input
                      id="oynaEni"
                      value={oynaEni}
                      onChange={(e) => {
                        oynaEniniOzgartir(e.target.value);
                      }}
                      inputMode="decimal"
                      placeholder="1.50"
                      className={`${kirishUslubi(false)} w-28`}
                    />
                  </Maydon>
                  <Maydon nom="oynaBoyi" yorliq="Oyna bo'yi (m)">
                    <input
                      id="oynaBoyi"
                      value={oynaBoyi}
                      onChange={(e) => {
                        oynaBoyiniOzgartir(e.target.value);
                      }}
                      inputMode="decimal"
                      placeholder="2.00"
                      className={`${kirishUslubi(false)} w-28`}
                    />
                  </Maydon>
                  <Maydon nom="ornatish" yorliq="O'rnatish">
                    <Tanlagich
                      id="ornatish"
                      sinf="w-56"
                      qiymat={ornatishId === null ? '' : String(ornatishId)}
                      ozgartir={(v) => {
                        ornatishIdniOzgartir(v === '' ? null : Number(v));
                      }}
                      ariaYorliq="O&#39;rnatish turi"
                      yozuvlar={tur.ornatishlar.map((o) => ({
                        qiymat: String(o.id),
                        matn: o.nom,
                        /** Qo'shimcha IKKINCHI QATORDA — nom bilan aralashmasin */
                        izoh: qoshimchaMatni(o),
                      }))}
                    />
                  </Maydon>
                </div>

                {oynadanHisob.xato !== null && (
                  <p role="alert" className="mt-2 text-[13px] text-belgi-qizil">
                    {oynadanHisob.xato}
                  </p>
                )}

                {/*
                  ⚠️ QO'LDA YOZILGANI OCHIQ AYTILADI. Aks holda
                     sotuvchi oyna o'lchamini o'zgartirib, pastdagi
                     raqam nega yangilanmayotganini tushunmasdi.
                */}
                {olchamQolda && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-belgi-sariq">
                    Tayyor o&apos;lcham qo&apos;lda yozilgan — oyna
                    o&apos;lchamidan qayta hisoblanmaydi.
                    <button
                      type="button"
                      onClick={() => {
                        olchamQoldaniOzgartir(false);
                      }}
                      className="text-brend hover:underline"
                    >
                      qoidaga qaytar
                    </button>
                  </p>
                )}
              </section>
            )}

            {/* ── 3.4 · O'lcham ── */}
            <section className="flex flex-wrap items-end gap-4">
              <Maydon nom="eni" yorliq={ornatishBormi ? 'Tayyor eni (m)' : 'Eni (m)'}>
                {/*
                  ⚠️ BU KATAK DOIM TAHRIRLANADI — egasining o'z
                     gapi: «usta xohishicha o'zgartiraveradi inputni,
                     agar o'zgartirmasa eski holatida saqlanadi».
                     Faqat o'qiladigan qilib qo'yilsa qoida hayotdagi
                     istisnolarni ko'tara olmasdi.
                */}
                <input
                  id="eni"
                  value={eni}
                  onChange={(e) => {
                    eniniOzgartir(e.target.value);
                    if (ornatishBormi) olchamQoldaniOzgartir(true);
                  }}
                  inputMode="decimal"
                  className={`${kirishUslubi(false)} w-28`}
                />
              </Maydon>
              <Maydon nom="boyi" yorliq={ornatishBormi ? "Tayyor bo'yi (m)" : "Bo'yi (m)"}>
                <input
                  id="boyi"
                  value={boyi}
                  onChange={(e) => {
                    boyiniOzgartir(e.target.value);
                    if (ornatishBormi) olchamQoldaniOzgartir(true);
                  }}
                  inputMode="decimal"
                  className={`${kirishUslubi(false)} w-28`}
                />
              </Maydon>

              {/*
                ⚠️ SONI — 2026-09-21 da qo'shildi. Uchta bir xil
                   parda uchun uchta alohida savat qatori kerak
                   emas: server har biriga ALOHIDA bo'lak band
                   qiladi (T-12) va narxni `soni` ga ko'paytiradi.
              */}
              <Maydon nom="soni" yorliq="Soni (dona)">
                <input
                  id="soni"
                  value={soni}
                  onChange={(e) => {
                    soniniOzgartir(e.target.value);
                  }}
                  inputMode="numeric"
                  className={`${kirishUslubi(false)} w-20`}
                />
              </Maydon>

              {tur.parametrlar.map((p) => (
                <Maydon key={p.kod} nom={`p-${p.kod}`} yorliq={`${p.nom} (m)`}>
                  <input
                    id={`p-${p.kod}`}
                    value={parametrlar[p.kod] ?? p.standartQiymat ?? ''}
                    onChange={(e) => {
                      parametrlarniOzgartir((o) => ({ ...o, [p.kod]: e.target.value }));
                    }}
                    inputMode="decimal"
                    className={`${kirishUslubi(false)} w-24`}
                  />
                </Maydon>
              ))}
            </section>

            {/*
              TANLOVLAR — 0052, egasi holatlari 2026-09-22.

              O'lchamdan KEYIN turadi: sotuvchi avval o'lchamni
              oladi, keyin «qaysi tomonga ochilsin» deb so'raydi.

              Majburiy tanlov tanlanmaguncha savatga qo'shib
              bo'lmaydi — aks holda usta yarim ma'lumot bilan
              qolardi.
            */}
            {tur.tanlovlar.length > 0 && (
              <section className="flex flex-wrap items-end gap-4">
                {tur.tanlovlar.map((t) => {
                  const tanlangan = tanlanganlar[t.id];
                  const bosh = t.majburiy && tanlangan === undefined;

                  return (
                    <Maydon
                      key={t.id}
                      nom={`tanlov-${String(t.id)}`}
                      yorliq={t.majburiy ? t.nom : `${t.nom} (ixtiyoriy)`}
                    >
                      <select
                        id={`tanlov-${String(t.id)}`}
                        value={tanlangan === undefined ? '' : String(tanlangan)}
                        onChange={(e) => {
                          const v = e.target.value;
                          tanlanganlarniOzgartir((o) => {
                            if (v === '') {
                              /**
                               * Tanlov bekor qilindi — kalit butunlay
                               * olib tashlanadi. `undefined` qoldirilsa
                               * `yetishmaganTanlovlar()` uni «tanlangan»
                               * deb hisoblab qolishi mumkin edi.
                               */
                              return Object.fromEntries(
                                Object.entries(o).filter(([k]) => Number(k) !== t.id),
                              );
                            }
                            return { ...o, [t.id]: Number(v) };
                          });
                        }}
                        className={`${kirishUslubi(bosh)} w-44`}
                      >
                        <option value="">— tanlang —</option>
                        {t.variantlar.map((v) => (
                          <option key={v.id} value={String(v.id)}>
                            {v.nom}
                            {v.narx === null ? '' : ` (+${pulKorsat(som(v.narx))})`}
                          </option>
                        ))}
                      </select>
                    </Maydon>
                  );
                })}
              </section>
            )}

            {/*
              Majburiy tanlov tanlanmagan bo'lsa sabab AYTILADI.
              Faqat tugmani o'chirish yetarli emas: sotuvchi nega
              ishlamayotganini bilmasdi.
            */}
            {yetishmaganTanlovlar(tur.tanlovlar, tanlanganlar).length > 0 && (
              <p role="alert" className="text-[13px] text-belgi-qizil">
                Tanlanmagan: {yetishmaganTanlovlar(tur.tanlovlar, tanlanganlar).join(', ')}
              </p>
            )}

            {/*
              ⚠️ O'LCHAM CHEGARASI XABARI — egasi qarori 2026-09-22.

                 O'lcham kataklaridan KEYIN turadi: sotuvchi raqamni
                 yozgan zahoti javobni shu yerda ko'radi, savat
                 tugmasiga borib «nega ishlamayapti» deb o'ylamaydi.

              ⚠️ Xabar uch narsani aytadi: qaysi chegara, qancha
                 yozilgan va nega bo'lmaydi. Faqat «o'lcham
                 noto'g'ri» deyilsa, sotuvchi raqamni tasodifiy
                 o'zgartirib ko'raveradi.
            */}
            {chegaraNuqsonlari.length > 0 && (
              <div
                role="alert"
                className="rounded-karta border border-belgi-qizil/30 bg-belgi-qizil-fon px-4 py-3"
              >
                <p className="text-sm font-medium text-belgi-qizil">
                  Bu o&apos;lchamda mahsulot qilib bo&apos;lmaydi
                </p>
                <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 text-[13px] text-belgi-qizil">
                  {chegaraNuqsonlari.map((n) => (
                    <li key={n.tur}>{chegaraXabari(n, tur.nom)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── 3.3 · 3.5 · Slotlar ── */}
            <section>
              <h2 className="mb-1 text-sm font-medium text-matn-ikki">Matolar</h2>
              <p className="mb-3 text-xs text-matn-kuchsiz">
                Har slotda faqat o&apos;sha slotga bog&apos;langan matolar chiqadi (3.3).
                Hisoblangan son yonidagi maydonga o&apos;zgacha kelishilsa yozing —{' '}
                <b>narx shunga</b>, ombordan esa hisoblangani yechiladi (3.6).
              </p>

              <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                <table className="w-full text-sm">
                  <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Slot</th>
                      <th className="px-3 py-2.5 font-medium">Mato</th>
                      <th className="px-3 py-2.5 text-right font-medium">Hisoblangan</th>
                      {/*
                        ⚠️ «Narx» va «Summa» ustunlari OLIB TASHLANDI —
                           egasi qarori 2026-09-20: «ro'yxatda baribir
                           qaysi mahsulotdan qancha ketishi bo'ladi,
                           faqat ularni narxi yozilmaydi».
                      */}
                      <th className="px-3 py-2.5 font-medium">Kelishilgan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                    {(hisob?.qatorlar ?? []).map((q) => (
                      <tr key={q.slot.id}>
                        <td className="px-3 py-2">
                          {q.slot.nom}
                          {!q.slot.majburiy && (
                            <span className="ml-2 text-xs text-matn-kuchsiz">ixtiyoriy</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {/*
                            QIDIRUVLI RO'YXAT — 2026-09-23.

                            ⚠️ Bu tizimdagi ENG UZUN ro'yxat: omborda
                               yuzta mato bo'lishi mumkin. Brauzerning
                               o'z ro'yxatida qidiruv yo'q edi va
                               sotuvchi mijoz oldida aylanib izlardi.

                            ⚠️ QOLDIQ endi IKKINCHI QATORDA. Ilgari u
                               nom bilan bir qatorda edi va uzun nomli
                               matoda ekranga sig'may qirqilardi —
                               ya'ni eng kerakli raqam ko'rinmasdi.
                          */}
                          <Tanlagich
                            sinf="w-56"
                            qiymat={slotlar[q.slot.id]?.materialId ?? ''}
                            ozgartir={(v) => {
                              slotlarniOzgartir((o) => ({
                                ...o,
                                [q.slot.id]: {
                                  materialId: v,
                                  tuzatilgan: o[q.slot.id]?.tuzatilgan ?? '',
                                },
                              }));
                            }}
                            boshQator="— tanlang —"
                            joyBelgisi="— tanlang —"
                            ariaYorliq={`${q.slot.nom} materiali`}
                            yozuvlar={q.slot.materiallar.map((mt) => ({
                              qiymat: String(mt.id),
                              matn: mt.nom,
                              /**
                               * ⚠️ BIRLIK YOZILADI — 2026-09-21.
                               *    Ilgari shunchaki «· 8» turardi:
                               *    metrmi, donami — bilib bo'lmasdi.
                               */
                              izoh:
                                mt.sarflashBirligi === 'KV_M'
                                  ? `qoldiq ${mt.boshKvM.toFixed(2)} kv.m`
                                  : mt.sarflashBirligi === 'M'
                                    ? `qoldiq ${mt.boshDona.toFixed(2)} m`
                                    : `qoldiq ${String(mt.boshDona)} dona`,
                            }))}
                          />

                          {/*
                            ⚠️ TZ 3.3 — «mijozga ekranni burib
                               ko'rsatish uchun». `<option>` ichida
                               rasm ko'rsatib bo'lmaydi, shuning
                               uchun TANLANGANI yonida turadi.
                          */}
                          {q.material?.rasmBormi === true && (
                            <div className="mt-1">
                              <RasmKorish
                                manzil={`/api/rasm/material/${String(q.material.id)}`}
                                nom={q.material.nom}
                              />
                            </div>
                          )}
                        </td>
                        <td className="raqam px-3 py-2">
                          {q.xato !== null ? (
                            <span className="text-belgi-qizil">{q.xato}</span>
                          ) : q.hisoblangan === null ? (
                            '—'
                          ) : (
                            `${q.hisoblangan.toFixed(q.birlik === 'DONA' ? 0 : 2)} ${BIRLIK_MATNI[q.birlik]}`
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={slotlar[q.slot.id]?.tuzatilgan ?? ''}
                            onChange={(e) => {
                              slotlarniOzgartir((o) => ({
                                ...o,
                                [q.slot.id]: {
                                  materialId: o[q.slot.id]?.materialId ?? '',
                                  tuzatilgan: e.target.value,
                                },
                              }));
                            }}
                            inputMode="decimal"
                            placeholder={q.hisoblangan === null ? '' : q.hisoblangan.toFixed(2)}
                            className={`${kirishUslubi(false)} w-24`}
                          />
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 3.7 · Aksessuarlar ── */}
            {tur.aksessuarlar.length > 0 && (
              <section>
                <h2 className="mb-1 text-sm font-medium text-matn-ikki">Aksessuarlar</h2>
                <p className="mb-3 text-xs text-matn-kuchsiz">
                  Komplekt avtomatik tushadi. Sonini qo&apos;lda o&apos;zgartirsangiz — o&apos;lcham
                  keyin o&apos;zgarsa ham formula uni <b>ustidan yozmaydi</b> (3.7).
                </p>

                <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                      {(hisob?.aksQatorlar ?? []).map((a) => (
                        <tr key={a.aksessuar.materialId}>
                          <td className="px-3 py-2">{a.aksessuar.nom}</td>
                          <td className="px-3 py-2">
                            <input
                              value={
                                aksessuarlar[a.aksessuar.materialId]?.qoldaKiritildi === true
                                  ? (aksessuarlar[a.aksessuar.materialId]?.soni ?? '')
                                  : String(a.soni)
                              }
                              onChange={(e) => {
                                aksessuarlarniOzgartir((o) => ({
                                  ...o,
                                  [a.aksessuar.materialId]: {
                                    materialId: a.aksessuar.materialId,
                                    soni: e.target.value,
                                    qoldaKiritildi: true,
                                    ochirilgan: false,
                                  },
                                }));
                              }}
                              inputMode="decimal"
                              className={`${kirishUslubi(false)} w-20`}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-matn-kuchsiz">
                            {BIRLIK_MATNI[a.birlik]}
                          </td>

                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                aksessuarlarniOzgartir((o) => ({
                                  ...o,
                                  [a.aksessuar.materialId]: {
                                    materialId: a.aksessuar.materialId,
                                    soni: '0',
                                    qoldaKiritildi: false,
                                    ochirilgan: true,
                                  },
                                }));
                              }}
                              className="text-xs text-matn-kuchsiz hover:text-belgi-qizil"
                            >
                              olib tashlash
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                {/*
                  ⚠️ TZ 4.6 — «Ixtiyoriy aksessuar sotuvda AVTOMATIK
                     KELMAYDI, mijoz so'ragandagina qo'shiladi.»

                     Mantiq bor edi, lekin QO'SHISH YO'LI yo'q edi:
                     ixtiyoriy aksessuar ro'yxatda umuman
                     ko'rinmasdi va uni sotib bo'lmasdi.
                */}
                {(() => {
                  const qoshilgan = new Set(
                    (hisob?.aksQatorlar ?? []).map((a) => a.aksessuar.materialId),
                  );
                  const ixtiyoriy = (tur?.aksessuarlar ?? []).filter(
                    (a) => !qoshilgan.has(a.materialId),
                  );

                  if (ixtiyoriy.length === 0) return null;

                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-matn-kuchsiz">
                        Mijoz so&apos;rasa qo&apos;shiladi:
                      </span>
                      {ixtiyoriy.map((a) => (
                        <button
                          key={a.materialId}
                          type="button"
                          onClick={() => {
                            aksessuarlarniOzgartir((o) => ({
                              ...o,
                              [a.materialId]: {
                                materialId: a.materialId,
                                soni: '',
                                /**
                                 * ⚠️ `qoldaKiritildi: false` —
                                 *    formula sonini o'zi hisoblaydi
                                 *    (3.7). Sotuvchi xohlasa keyin
                                 *    qo'lda o'zgartiradi.
                                 */
                                qoldaKiritildi: false,
                                ochirilgan: false,
                              },
                            }));
                          }}
                          className="fokus rounded-full border border-chegara bg-sirt px-2.5 py-1 text-[12px] font-medium text-brend transition-colors hover:border-brend/40 hover:bg-brend/5"
                        >
                          + {a.nom}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                </div>
              </section>
            )}

            {/* Q-03 · QABUL S3.4 — yetishmovchilik OGOHI, bloklamaydi */}
            {yetmaydiganlar.length > 0 && (
              <div className="rounded-karta border border-belgi-sariq/20 bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq">
                <b>Bu mato hozir yetarli emas:</b>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {yetmaydiganlar.map((q) => (
                    <li key={q.slot.id}>
                      {q.material?.nom ?? q.slot.nom} — kerak {(q.hisoblangan ?? 0).toFixed(2)}{' '}
                      {BIRLIK_MATNI[q.birlik]}, bo&apos;sh{' '}
                      {q.birlik === 'KV_M'
                        ? (q.material?.boshKvM ?? 0).toFixed(2)
                        : String(q.material?.boshDona ?? 0)}{' '}
                      {BIRLIK_MATNI[q.birlik]}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Davom etsangiz buyurtma <b>saqlanadi</b>, pozitsiya «Materialga kutmoqda» holatiga
                  tushadi va kirim bo&apos;lgach avtomatik navbatga qaytadi (8.12). Yoki yuqoridan{' '}
                  <b>boshqa mato</b>
                  &nbsp;tanlang.
                </p>
              </div>
            )}

            {/* ── Qo'shimchalar — egasi qarori 2026-09-20 ── */}
            {tur.qoshimchalar.length > 0 && (
              <section>
                <h2 className="mb-1 text-sm font-medium text-matn-ikki">Qo&apos;shimchalar</h2>
                <p className="mb-3 text-xs text-matn-kuchsiz">
                  Mijoz tanlasa narxga qo&apos;shiladi. Materiali bo&apos;lgani ombordan ham
                  yechiladi.
                </p>

                <div className="flex flex-col gap-2 rounded-karta border border-chegara bg-sirt p-4">
                  {tur.qoshimchalar.map((q) => {
                    const tanlandimi = tanlanganQoshimchalar.includes(q.id);
                    return (
                      <div key={q.id} className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={tanlandimi}
                            onChange={(e) => {
                              tanlanganQoshimchalarniOzgartir((t) =>
                                e.target.checked ? [...t, q.id] : t.filter((x) => x !== q.id),
                              );
                            }}
                          />
                          <span>{q.nom}</span>
                          {q.materialId !== null || q.almashtirishGuruhId !== null ? (
                            <span className="text-[11px] text-matn-kuchsiz">
                              · ombordan yechiladi
                            </span>
                          ) : null}
                        </label>

                        {/*
                          ⚠️ Guruhli qo'shimchada MATERIAL TANLANADI — mato
                             rangi mijozga bog'liq. Tanlanmasa ombordan
                             hech narsa yechilmaydi va buni sotuvchi
                             ko'rib turishi kerak.
                        */}
                        {tanlandimi && q.materiallar.length > 0 && (
                          <Tanlagich
                            sinf="w-52"
                            qiymat={qoshimchaMateriali[q.id] ?? ''}
                            ozgartir={(v) => {
                              qoshimchaMaterialiniOzgartir((o) => ({
                                ...o,
                                [q.id]: v,
                              }));
                            }}
                            ariaYorliq={`${q.nom} materiali`}
                            boshQator="— material tanlang —"
                            joyBelgisi="— material tanlang —"
                            yozuvlar={q.materiallar.map((mt) => ({
                              qiymat: String(mt.id),
                              matn: mt.nom,
                            }))}
                          />
                        )}

                        {tanlandimi &&
                          q.materiallar.length > 0 &&
                          (qoshimchaMateriali[q.id] ?? '') === '' && (
                            <span className="text-[11px] text-belgi-sariq">
                              material tanlanmasa ombordan yechilmaydi
                            </span>
                          )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/*
              ⚠️ NARX QO'YILMAGAN — sotuv TO'XTAYDI.

                 Jimgina nol narx bilan savatga qo'shish jalyuzini
                 bepulga berish demak edi. Sotuvchi sababni ko'radi
                 va adminga aytadi.
            */}
            {hisob !== null && hisob.narx.xato !== null && (
              <div
                role="alert"
                className="rounded-karta border border-belgi-qizil bg-belgi-qizil-fon px-5 py-4 text-sm text-belgi-qizil"
              >
                <p className="font-medium">{hisob.narx.xato}</p>
                {/*
                  ⚠️ SABABNI AYTAMIZ — 2026-09-21. Egasi «narx
                     belgiladim, sotuvda baribir narx qo'yilmagan
                     deydi» dedi va sababni topolmadi: qoida
                     «oddiy» darajasiga, mato esa «qimmat»
                     darajasida edi. Endi ekranning o'zi aytadi.
                */}
                {hisob.darajaNomi !== null && (
                  <p className="mt-1 text-xs">
                    Tanlangan mato <b>{hisob.darajaliMaterial}</b> — darajasi{' '}
                    <b>«{hisob.darajaNomi}»</b>. «Narxlar va turlar» da shu tur uchun
                    AYNAN SHU daraja bo'yicha narx qo'ying yoki material kartochkasida
                    darajani o'zgartiring.
                  </p>
                )}
                {hisob.darajaNomi === null && (
                  <p className="mt-1 text-xs">
                    Tanlangan matoga <b>daraja qo&apos;yilmagan</b>. Material kartochkasida
                    narx darajasini tanlang — narx o&apos;sha daraja bo&apos;yicha
                    topiladi.
                  </p>
                )}
              </div>
            )}

            {/* Narx nimadan chiqqani — sotuvchi mijozga tushuntira olsin */}
            {hisob !== null && hisob.narx.xato === null && (
              <div className="rounded-karta border border-chegara bg-sirt px-5 py-4 text-sm">
                <dl className="flex flex-col gap-1">
                  {hisob.narx.olchov !== null && (
                    <div className="flex justify-between text-[12px] text-matn-kuchsiz">
                      <dt>
                        O&apos;lchov
                        {hisob.narx.bosqich === null
                          ? ''
                          : ` · bosqich ${hisob.narx.bosqich.narx} ${
                              hisob.narx.bosqich.valyuta === 'USD' ? '$' : "so'm"
                            }`}
                      </dt>
                      <dd className="raqam">{hisob.narx.olchov.toFixed(4)}</dd>
                    </div>
                  )}
                  {hisob.narx.narxQatorlari.map((q, i) => (
                    <div key={i} className="flex justify-between">
                      <dt className="text-matn-ikki">{q.nom}</dt>
                      <dd className="raqam">{pulKorsat(som(q.summa))}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* ── 3.8 · Pozitsiya narxi ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-karta border border-chegara bg-sirt px-5 py-4">
              <div>
                <label
                  htmlFor="pozitsiyaNarxi"
                  className="block text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase"
                >
                  Pozitsiya narxi
                </label>

                {/*
                  ⚠️ Narx TUZATILADI (3.8). Mijoz bilan kelishilgan
                     raqam hisoblanganidan boshqa bo'lishi mumkin.
                     Sotuvchi tegsa — raqam QOTADI: o'lchamlar
                     o'zgarsa ham o'zgarmaydi.
                */}
                <input
                  id="pozitsiyaNarxi"
                  value={korsatiladiganNarx}
                  onChange={(e) => {
                    qoldaNarxniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  aria-invalid={!narxYaroqli}
                  className={`raqam mt-0.5 w-44 rounded-maydon border bg-fon px-3 py-1.5 text-[20px] leading-tight font-semibold tracking-[-0.02em] ${
                    narxYaroqli ? 'border-chegara' : 'border-belgi-qizil'
                  }`}
                />

                {qoldaNarx !== null && qoldaNarx !== hisoblanganNarx && (
                  <span className="mt-1 block text-[12px] text-belgi-sariq">
                    hisoblangani {pulKorsat(hisob?.jami ?? nolSom())} —{' '}
                    <button
                      type="button"
                      onClick={() => {
                        qoldaNarxniOzgartir(null);
                      }}
                      className="fokus rounded-maydon underline underline-offset-2"
                    >
                      qaytarish
                    </button>
                  </span>
                )}

                {!narxYaroqli && (
                  <span role="alert" className="mt-1 block text-[12px] text-belgi-qizil">
                    Narx — faqat son (masalan 678400)
                  </span>
                )}

                {tur.xizmatHaqi !== null && Number(tur.xizmatHaqi) > 0 && (
                  <span className="mt-0.5 block text-[12px] text-matn-kuchsiz">
                    xizmat haqi {pulKorsat(som(tur.xizmatHaqi))} bilan
                  </span>
                )}
              </div>
              {/*
                ⚠️ TAHRIR REJIMIDA tugmalar boshqa: qator SAVATGA
                   QO'SHILMAYDI, o'z o'rniga QAYTADI. Aks holda
                   tahrirlangan qator ikkinchi nusxa bo'lib qolardi.
              */}
              {tahrirKaliti === null ? (
                <button
                  type="button"
                  disabled={!savatgaQoshilsinmi}
                  onClick={savatgaQosh}
                  className="rounded-maydon bg-brend px-4 py-2.5 text-[13px] font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
                >
                  Savatga qo&apos;shish
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={tahrirniBekor}
                    className="rounded-maydon px-3 py-2.5 text-[13px] text-matn-kuchsiz transition-colors hover:text-matn"
                  >
                    Bekor
                  </button>
                  <button
                    type="button"
                    disabled={!savatgaQoshilsinmi}
                    onClick={tahrirniSaqla}
                    className="rounded-maydon bg-brend px-4 py-2.5 text-[13px] font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
                  >
                    O&apos;zgarishni saqlash
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══ O'NG USTUN — narx doim ko'z oldida ══════════════════ */}
      <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
        {/* ── 3.9 · Savat ── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-matn-ikki">Savat ({savat.length})</h2>

            {/*
              ⚠️ Mijoz «uydagi mexanizm buzilgan» desa — tayyor
                 mahsulotsiz, alohida buyum sotiladi.
            */}
            <QoshimchaQoshish
              materiallar={qoshimchalar}
              kurs={kursObyekti}
              /** Materialni o'zi sotish narxi — egasi qarori 2026-09-20 */
              qoidalar={materialQoidalari}
              mijozTuriId={mijoz?.mijozTuriId ?? null}
              qoshildi={(t) => {
                savatniOzgartir((sv) => [
                  ...sv,
                  {
                    kalit: Date.now(),
                    turId: null,
                    turNomi: t.nom,
                    eniM: t.eniM,
                    boyiM: t.boyiM,
                    soni: t.soni,
                    miqdor: t.miqdor,
                    narx: t.narx,
                    /** Qo'shimcha buyumda yorliq so'ralmaydi (0049) */
                    yorliq: null,
                    yuk: {
                      mahsulotTurId: null,
                      qoshimchaMaterialId: t.materialId,
                      eniM: t.eniM,
                      boyiM: t.boyiM,
                      soni: t.soni,
                      /** ⚠️ O'lchovli miqdor — T-16 (2026-09-21) */
                      miqdor: t.miqdor,
                      narxSnapshot: t.narx,
                      chegirmaSumma: '0',
                      xizmatHaqi: '0',
                      /** ⚠️ Formula yo'q — bu buyum tayyorlanmaydi */
                      formulaSnapshot: { qoshimcha: true },
                      /**
                       * ⚠️ METRLAB SOTISHDA SLOTSIZ QATOR YOZILADI —
                       *    band qilish va kesish zanjiri `pozitsiya_material`
                       *    dan o'qiydi. Usiz mato sotilar, lekin ombordan
                       *    hech narsa yechilmasdi.
                       *
                       *    Kesim to'rtburchagini SERVER hisoblaydi
                       *    (`kesimOlchami`) — jami maydon va bo'yi bilan.
                       */
                      slotlar:
                        t.miqdorKvM === null
                          ? []
                          : [
                              {
                                slotId: null,
                                materialId: t.materialId,
                                hisoblanganMiqdor: t.miqdorKvM,
                                tuzatilganMiqdor: null,
                                birlik: 'KV_M' as const,
                                narxSnapshot: t.narx,
                              },
                            ],
                      aksessuarlar: [],
                    },
                  },
                ]);
              }}
            />
          </div>

          {savat.length === 0 ? (
            <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-[13px] text-matn-kuchsiz">
              Savat bo&apos;sh.
              <span className="mt-1 block">
                Bitta buyurtmada bir nechta xona bo&apos;lishi mumkin.
              </span>
            </p>
          ) : (
            <div className="overflow-hidden rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-[13px]">
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {savat.map((q) => (
                    <tr key={q.kalit}>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-matn">{q.turNomi}</span>
                        {/*
                          ⚠️ YORLIQ tur nomidan KEYIN, o'lchamdan
                             OLDIN: olti qatorli savatda sotuvchi
                             «qaysi oyna» degan savolga darrov javob
                             topsin (0049).
                        */}
                        {q.yorliq !== null && (
                          <span className="ml-1.5 text-[12px] text-brend">{q.yorliq}</span>
                        )}
                        <span className="raqam mt-0.5 block text-left text-[12px] text-matn-kuchsiz">
                          {/*
                            ⚠️ Qo'shimcha mahsulotda o'lcham yo'q —
                               u tayyorlanmaydi, ombordan olinadi.
                          */}
                          {/*
                            ⚠️ O'LCHOVLI MIQDOR ALOHIDA ko'rsatiladi
                               (T-16). Ilgari savatda har qo'shimcha
                               buyum «1 dona» deb turardi — 2.5 metr
                               karniz ham.
                          */}
                          {q.turId === null
                            ? typeof q.miqdor === 'string' && q.miqdor !== ''
                              ? `${q.miqdor} m`
                              : `${String(q.soni ?? 1)} dona`
                            : `${String(q.eniM)} × ${String(q.boyiM)} m${
                                (q.soni ?? 1) > 1 ? ` × ${String(q.soni ?? 1)}` : ''
                              }`}
                        </span>
                      </td>
                      <td className="raqam px-3 py-2.5 font-medium">{pulKorsat(som(q.narx))}</td>
                      <td className="px-2 py-2.5 text-right">
                        {/*
                          ⚠️ TAHRIRLASH — 2026-09-21. Ilgari faqat
                             o'chirish bor edi: beshinchi qatorda bo'yi
                             adashsa, sotuvchi matoni, aksessuarni va
                             qo'shimchani BOSHIDAN yig'ardi.

                          ⚠️ Faqat TAYYOR MAHSULOT tahrirlanadi.
                             Qo'shimcha buyum (`turId === null`) alohida
                             oynadan qo'shiladi — uni chap ustunga
                             qaytarib bo'lmaydi.
                        */}
                        {q.turId !== null && tahrirKaliti === null && (
                          <button
                            type="button"
                            onClick={() => {
                              qatorniTahrirla(q);
                            }}
                            aria-label="Tahrirlash"
                            className="fokus rounded-maydon px-1.5 py-1 text-matn-kuchsiz transition-colors hover:bg-fon-ikki hover:text-brend"
                          >
                            ✎
                          </button>
                        )}
                        {/*
                          ⚠️ NUSXALASH — soha auditi 2026-09-22.
                             Bir xonada beshta bir xil oyna odatiy
                             hol; ilgari beshalasi qo'lda kiritilardi.

                          ⚠️ Qo'shimcha buyumda ham ishlaydi: ikkita
                             bir xil mexanizm sotish ham uchraydi.
                        */}
                        {tahrirKaliti === null && (
                          <button
                            type="button"
                            onClick={() => {
                              qatorniNusxala(q);
                            }}
                            aria-label="Nusxalash"
                            title="Nusxalash"
                            className="fokus rounded-maydon px-1.5 py-1 text-matn-kuchsiz transition-colors hover:bg-fon-ikki hover:text-brend"
                          >
                            ⧉
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            savatniOzgartir((s) => s.filter((x) => x.kalit !== q.kalit));
                            if (tahrirKaliti === q.kalit) tahrirKalitiniOzgartir(null);
                          }}
                          aria-label="Olib tashlash"
                          className="fokus rounded-maydon px-1.5 py-1 text-matn-kuchsiz transition-colors hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/*
          ⚠️ QO'SHISH REJIMIDA bu blok YASHIRINADI: mijoz, filial va
             tayyorlik sanasi buyurtmada allaqachon bor va o'zgarmaydi
             (8.7). Ularni qayta so'rash sotuvchini adashtirardi.
        */}
        {qoshish !== null && (
          <p className="rounded-maydon bg-fon px-4 py-3 text-[13px] text-matn-ikki">
            <b className="raqam">{qoshish.raqam}</b> buyurtmasiga pozitsiya
            qo&apos;shilmoqda. Mijoz, filial va to&apos;lov o&apos;zgarmaydi (8.7).
          </p>
        )}

        {/* ── 3.10 · 3.11 · 3.13 · 20.4 ── */}
        <section
          className={`grid gap-4 sm:grid-cols-2 ${qoshish === null ? '' : 'hidden'}`}
        >
          <MijozTanlash
            tanlangan={mijoz}
            ozgartir={mijozniOzgartir}
            qoshaOladi={mijozQoshaOladi}
            guruhlar={mijozGuruhlari}
            turlar={mijozTurlari}
            ogohlantir={offsetOgohi}
            limitOshdi={
              limit !== null && limit.oshganmi && limit.limit !== null
                ? `${pulKorsat(limit.jamiSomda)} / ${pulKorsat(limit.limit)} so'm`
                : null
            }
          />

          <Maydon
            nom="tikuvchi"
            yorliq="Ishlab chiqaruvchi filial"
            izoh="Mahsulot shu filial omborida tekshiriladi (20.4.2)"
          >
            <select
              id="tikuvchi"
              value={tikuvchi}
              onChange={(e) => {
                tikuvchiniOzgartir(Number(e.target.value));
              }}
              className={kirishUslubi(false)}
            >
              {filiallar.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </Maydon>

          <Maydon
            nom="tayyorlik"
            yorliq="Tayyorlik sanasi"
            izoh="Ixtiyoriy — kiritilmasa buyurtma «kechikkan» hisoblanmaydi (3.13)"
          >
            <input
              id="tayyorlik"
              type="date"
              value={tayyorlik}
              onChange={(e) => {
                tayyorlikniOzgartir(e.target.value);
              }}
              className={kirishUslubi(false)}
            />
          </Maydon>

          <Maydon
            nom="kelishilgan"
            yorliq="Kelishilgan summa"
            izoh="Bo'sh qoldirilsa hisoblangan summa olinadi"
          >
            <input
              id="kelishilgan"
              value={kelishilgan}
              onChange={(e) => {
                kelishilganniOzgartir(e.target.value);
              }}
              inputMode="decimal"
              placeholder={pulMatn(savatJami)}
              className={kirishUslubi(false)}
            />
          </Maydon>
        </section>

        {/*
        ⚠️ Jami va saqlash tugmasi O'NG USTUN PASTIDA, yopishib
           turadi. Sotuvchi mijozga narx aytayotganda uni ko'rib
           turishi kerak — pastga tushib qidirmasin.
      */}
        <div className="flex flex-col gap-3 rounded-karta border border-chegara bg-sirt px-5 py-4">
          <div>
            <div className="text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase">Jami</div>
            <div className="raqam text-left text-[24px] leading-tight font-semibold tracking-[-0.02em]">
              {pulKorsat(savatJami)}
            </div>
            {chegirma !== null && chegirma !== 0 && (
              <div className="mt-1 text-[12px] text-belgi-sariq">
                {chegirma > 0
                  ? `chegirma ${pulKorsat(som(chegirma.toFixed(2)))}`
                  : `qo'shimcha haq ${pulKorsat(som(Math.abs(chegirma).toFixed(2)))}`}
              </div>
            )}
          </div>

          {/*
            ⚠️ OLDINDAN TO'LOV — TZ 12.5 (K1).

               Egasi (2026-08-30): «mijoz to'lov qilishi uchun input
               hech qayerda yo'q». Mijoz buyurtma berayotganda odatda
               oldindan to'laydi; ilgari buni yozish uchun buyurtmani
               saqlab, kartochkasini ochib, «To'lov» tugmasini bosish
               kerak edi.

            ⚠️ Kassasi yo'q sotuvchida bu qism KO'RINMAYDI — u pul
               qabul qila olmaydi (12.2).
          */}
          {kassalar.length > 0 && qoshish === null && (
            <div className="border-t border-chegara pt-3">
              <label
                htmlFor="oldindanTolov"
                className="block text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase"
              >
                Mijoz to&apos;ladi
              </label>

              <div className="mt-1 flex flex-col gap-2">
                <input
                  id="oldindanTolov"
                  name="oldindanTolov"
                  value={tolovSumma}
                  onChange={(e) => {
                    tolovSummaniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  placeholder="0 — to'lamadi"
                  className={kirishUslubi(false)}
                />

                {/* Bitta kassa bo'lsa tanlov ko'rsatilmaydi — ortiqcha savol */}
                {kassalar.length > 1 ? (
                  <select
                    name="tolovKassaId"
                    value={tolovKassaId}
                    onChange={(e) => {
                      tolovKassaIdniOzgartir(e.target.value);
                    }}
                    className={kirishUslubi(false)}
                  >
                    {kassalar.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nom} · {k.valyuta}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="hidden" name="tolovKassaId" value={tolovKassaId} />
                )}

                {tolovQoldiq !== null && (
                  <p
                    className={`text-[12px] ${
                      tolovQoldiq > 0 ? 'text-belgi-sariq' : 'text-belgi-yashil'
                    }`}
                  >
                    {tolovQoldiq > 0
                      ? `qarz qoladi: ${pulKorsat(som(tolovQoldiq.toFixed(2)))}`
                      : tolovQoldiq === 0
                        ? "to'liq to'landi"
                        : `ortiqcha: ${pulKorsat(som(Math.abs(tolovQoldiq).toFixed(2)))}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/*
            TZ 3.10 — sotuvchi xato bosishdan OLDIN ko'radi. Xato
            xabari yetarli emas: buyurtma saqlanmay qaytsa sotuvchi
            nima bo'lganini tushunmaydi.
          */}
          {mijozKerak && (
            <p className="rounded-maydon border border-belgi-sariq/40 bg-belgi-sariq-fon px-3 py-2 text-[12px] text-belgi-sariq">
              Qarz qoladi — mijozni tanlang. Tizim qarzni kimdan
              undirishni bilishi kerak (3.10).
            </p>
          )}

          <button
            type="submit"
            disabled={kutilmoqda || savat.length === 0 || mijozKerak}
            className="fokus w-full rounded-maydon bg-brend px-5 py-3 text-[14px] font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
          >
            {kutilmoqda
              ? 'Saqlanmoqda…'
              : qoshish === null
                ? 'Buyurtmani saqlash'
                : "Buyurtmaga qo'shish"}
          </button>
        </div>
      </aside>
    </form>
  );
}

/** TZ 3.10 — mijoz MAJBURIY EMAS: ko'chadagi tasodifiy xaridor. */
function MijozTanlash({
  tanlangan,
  ozgartir,
  qoshaOladi,
  guruhlar,
  turlar,
  ogohlantir = false,
  limitOshdi = null,
}: {
  tanlangan: SotuvMijozi | null;
  ozgartir: (m: SotuvMijozi | null) => void;
  qoshaOladi: boolean;
  /** TZ 6.3 — modaldagi yangi mijozga guruh tanlash uchun */
  guruhlar: readonly { id: number; nom: string }[];
  turlar: readonly { id: number; nom: string; soliqKerak: boolean }[];
  /** TZ 6.3 — dollardagi chegirma kurssiz qo'llanmadi */
  ogohlantir?: boolean;
  /** TZ 6.4 — limitdan oshgan bo'lsa: «6 897 500 / 6 500 000» */
  limitOshdi?: string | null;
}) {
  const [matn, matnniOzgartir] = useState('');
  const [topilgan, topilganniOzgartir] = useState<readonly SotuvMijozi[]>([]);
  const [qidirilmoqda, qidirilmoqdaOzgartir] = useState(false);
  const [modalOchiq, modalniOzgartir] = useState(false);

  const izlanayotgan = matn.trim();

  /**
   * ⚠️ Modalda TO'LIQ mijoz kartochkasi to'ldiriladi: telefon,
   *    shaxs turi, offset, qarz limiti. Ilgari bu yerda faqat ism
   *    so'ralardi va qolgani keyin qo'shilishi kerak edi —
   *    ko'pincha unutilardi.
   *
   * ⚠️ Yangi mijozning OFFSETI shu yerda ma'lum emas: modal faqat
   *    raqam va ismni qaytaradi. Shuning uchun narx odatdagi
   *    filial narxida qoladi va offset sahifa yangilangach
   *    ishlaydi. Boshqacha qilish uchun mijozni qaytadan
   *    qidirtirish kerak bo'lardi — u ish oqimini uzardi.
   */
  function modaldaYaratildi(m: { id: number; ism: string }): void {
    ozgartir({
      id: m.id,
      ism: m.ism,
      telefon: null,
      qarzLimiti: null,
      offsetTuri: null,
      offsetQiymat: null,
      guruhNomi: null,
      guruhOffsetTuri: null,
      guruhOffsetQiymat: null,
      mijozTuriId: null,
      turNomi: null,
      // Yangi mijozning qarzi hali yo'q (6.4)
      qarzSom: '0',
      qarzDollar: '0',
    });
    matnniOzgartir('');
    topilganniOzgartir([]);
    modalniOzgartir(false);
  }

  async function qidir(q: string): Promise<void> {
    matnniOzgartir(q);
    if (q.trim().length < 2) {
      topilganniOzgartir([]);
      return;
    }
    qidirilmoqdaOzgartir(true);
    try {
      const j = await fetch(`/api/mijoz-qidir?q=${encodeURIComponent(q)}`);
      topilganniOzgartir((await j.json()) as SotuvMijozi[]);
    } catch {
      topilganniOzgartir([]);
    } finally {
      qidirilmoqdaOzgartir(false);
    }
  }

  if (tanlangan !== null) {
    return (
      <div className="rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <div className="font-medium">{tanlangan.ism}</div>
        <div className="text-xs text-matn-kuchsiz">{tanlangan.telefon ?? '—'}</div>

        {/*
          ⚠️ Chegirma KO'RINIB TURADI (3.10). Sotuvchi «narx nega
             bunday?» degan savolga darrov javob bera olsin.
             Shaxsiy chegirma bo'lsa guruhniki qo'llanmaydi —
             shuning uchun ikkalasi birdan yozilmaydi.
        */}
        {tanlangan.offsetTuri !== null ? (
          <div className="mt-1 text-xs text-brend">
            Shaxsiy chegirma: {chegirmaMatni(tanlangan.offsetTuri, tanlangan.offsetQiymat)}
          </div>
        ) : tanlangan.guruhOffsetTuri !== null ? (
          <div className="mt-1 text-xs text-brend">
            {tanlangan.guruhNomi ?? 'Guruh'}:{' '}
            {chegirmaMatni(tanlangan.guruhOffsetTuri, tanlangan.guruhOffsetQiymat)}
          </div>
        ) : null}

        {/*
          ⚠️ Dollardagi chegirma kurssiz QO'LLANMAYDI. Ilgari u
             jimgina tashlab yuborilardi: kartochkada «−10 $» turar,
             mijoz esa standart narxda olardi (6.3).
        */}
        {ogohlantir && (
          <div className="mt-1 text-xs text-belgi-sariq">
            Dollardagi chegirma qo&apos;llanmadi — kurs kiritilmagan.
          </div>
        )}

        {/*
          ⚠️ TZ 6.4 — BLOKLAMAYDI. «Sotuvchi mustaqil qaror qabul
             qiladi»: mijoz ishonchli bo'lishi, pul yo'lda bo'lishi
             mumkin. Tizim faqat raqamni ko'rsatadi.
        */}
        {limitOshdi !== null && (
          <div className="mt-1 text-xs text-belgi-qizil">
            Qarz limitidan oshgan: {limitOshdi}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            ozgartir(null);
          }}
          className="mt-2 text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
        >
          boshqa mijoz
        </button>
      </div>
    );
  }

  /**
   * ⚠️ `<Maydon>` (ya'ni `<label>`) ISHLATILMAYDI.
   *
   *    HTML da `<label>` ichiga tugma qo'yish taqiqlangan: brauzer
   *    bosishni tugmaga emas, kirish maydoniga yo'naltiradi va
   *    topilgan mijozni TANLAB BO'LMASDI.
   */
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="mijoz" className="text-sm font-medium text-matn-ikki">
        Mijoz
      </label>

      <input
        id="mijoz"
        value={matn}
        onChange={(e) => {
          void qidir(e.target.value);
        }}
        placeholder="Ism yoki telefon"
        autoComplete="off"
        className={kirishUslubi(false)}
      />

      {qidirilmoqda && <span className="text-xs text-matn-kuchsiz">qidirilmoqda…</span>}

      {topilgan.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-maydon border border-chegara bg-sirt">
          {topilgan.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                ozgartir(m);
                matnniOzgartir('');
                topilganniOzgartir([]);
              }}
              className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-fon"
            >
              {m.ism}
              <span className="ml-2 text-xs text-matn-kuchsiz">{m.telefon ?? ''}</span>
            </button>
          ))}
        </div>
      )}

      {/*
        ⚠️ SUKUT SAQLAMAYDI. Ilgari bitta harf yozilsa hech narsa
           bo'lmasdi va odam «qidiruv ishlamayapti» deb o'ylardi.
           Endi nima kutilayotgani aytiladi.
      */}
      {izlanayotgan.length === 1 && (
        <span className="text-xs text-matn-kuchsiz">yana bitta harf yozing…</span>
      )}

      {izlanayotgan.length >= 2 && !qidirilmoqda && topilgan.length === 0 && (
        <span className="text-xs text-matn-kuchsiz">
          «{izlanayotgan}» bo&apos;yicha mijoz topilmadi
        </span>
      )}

      <span className="text-xs text-matn-kuchsiz">
        Majburiy emas — ko&apos;chadagi xaridorga ham sotiladi (3.10)
      </span>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {qoshaOladi && (
          <button
            type="button"
            onClick={() => {
              modalniOzgartir(true);
            }}
            className="fokus rounded-maydon px-1 py-0.5 text-[12px] font-medium text-brend transition-colors hover:underline"
          >
            + Yangi mijoz
          </button>
        )}

        {/* ⚠️ Yangi oynada — yarim yozilgan buyurtma tashlab ketilmasin */}
        <a
          href="/mijoz"
          target="_blank"
          rel="noopener"
          className="fokus rounded-maydon px-1 py-0.5 text-[12px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
        >
          Ro&apos;yxat ↗
        </a>
      </div>

      <Modal
        ochiq={modalOchiq}
        yop={() => {
          modalniOzgartir(false);
        }}
        sarlavha="Yangi mijoz"
        izoh="Saqlangach buyurtmaga darhol biriktiriladi"
        keng
        bolalar={
          <MijozFormasi
            amal={mijozModalYaratAmali}
            /**
             * ⚠️ Qidiruvga yozilgan ism formaga o'tkaziladi —
             *    sotuvchi uni ikkinchi marta terib o'tirmasin.
             */
            qiymatlar={{ ...MIJOZ_BOSH_QIYMATLAR, ism: izlanayotgan }}
            tugmaMatni="Saqlash"
            guruhlar={guruhlar}
            turlar={turlar}
            saqlandi={modaldaYaratildi}
            bekor={() => {
              modalniOzgartir(false);
            }}
          />
        }
      />
    </div>
  );
}
