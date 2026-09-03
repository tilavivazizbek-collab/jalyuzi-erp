/**
 * lib/domain/chek.ts — TZ 8.9 · 8.13 · 8.14 · 13.7 · 14.3 · 2.3-invariant
 *
 * Sotuv chekining SOF mantiqi: qaysi qator chiqadi, qaysi summa
 * qayerdan keladi, qaysi qator umuman ko'rinmaydi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1). Ma'lumotni `lib/amal/chek.ts` keltiradi,
 *    bu fayl uni chop etiladigan shaklga aylantiradi. Shu sababli
 *    har qoida bazasiz testlanadi.
 *
 * ⚠️ 1.3-band · 2.3-invariant — BITTA CHEKDA BITTA VALYUTA. Buyurtma
 *    dollarda bo'lsa hamma summa dollarda chiqadi; so'mga o'girilmaydi
 *    va kurs umuman ko'rsatilmaydi. Aks holda mijoz «qaysi raqamga
 *    ishonay?» degan savol bilan qolardi.
 */

import {
  ayir,
  dollar,
  nolDollar,
  nolmi,
  nolSom,
  pulKorsat,
  pulMatn,
  qosh,
  som,
  valyutasi,
  type Pul,
  type Valyuta,
} from './pul';

// ─── Kirish ma'lumoti ─────────────────────────────────────────────────────

/**
 * Chekka tushmaydigan holatlar.
 *
 * Bekor qilingan va rad etilgan pozitsiya mijozga BERILMAGAN va
 * puli ham olinmaydi — kartochkadagi «jami» ham ularni tashlab
 * ketadi (8.14). Chek o'sha hisob bilan bitta bo'lishi shart.
 */
export const CHEKKA_TUSHMAYDI: readonly string[] = ['BEKOR', 'RAD_ETILGAN'];

export interface ChekPozitsiyasi {
  readonly tartib: number;
  /** Mahsulot turi nomi yoki qo'shimcha buyum materialining nomi */
  readonly nom: string;
  /** Qo'shimcha buyumda ikkalasi ham 0 — o'lchov umuman yo'q */
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly soni: number;
  /** `narx_snapshot` — chegirmasiz, kelishilgan narx (3.9) */
  readonly narx: string;
  readonly chegirma: string;
  readonly holat: string;
  /**
   * Composite pozitsiyaning tarkibi: «Mato M13-45», «Karniz».
   *
   * ⚠️ NARXSIZ. Mijoz mato narxini alohida ko'rsa, keyingi safar
   *    «matoni o'zim olib kelaman» deydi va tur narxi buziladi.
   *    Tarkib faqat NIMA berilgani ko'rinishi uchun.
   */
  readonly tarkib: readonly string[];
}

export interface ChekKirimi {
  readonly buyurtmaRaqam: string;
  readonly sana: Date;
  readonly sotuvchi: string;
  readonly mijoz: string | null;
  readonly valyuta: Valyuta;
  readonly pozitsiyalar: readonly ChekPozitsiyasi[];
  /** Kassa yozuvlaridan yig'ilgan to'lov (2.2-invariant) */
  readonly tolangan: string;
  /**
   * Mijozning SHU PAYTDAGI umumiy qarzi — ya'ni savdodan KEYINGI.
   * Mijozsiz buyurtmada (3.10 — ko'chadagi xaridor) `null`.
   */
  readonly qarzKeyin: IkkiValyutaQarz | null;
  /** 14.3 — sozlamalardan, kodda yo'q */
  readonly korxonaNom: string | null;
  readonly korxonaManzil: string | null;
  readonly korxonaTelefon: string | null;
  /** 13.7 — «Balansni @bot da tekshiring» */
  readonly botUsername: string | null;
  /** 14.3 — chek raqamining ikki xonali boshi */
  readonly filialKod: string | null;
}

export interface IkkiValyutaQarz {
  readonly som: string;
  readonly dollar: string;
}

// ─── Chiqish shakli ───────────────────────────────────────────────────────

export interface ChekQatori {
  readonly tartib: number;
  /** «Rollo parda 1.40×1.60 m» */
  readonly sarlavha: string;
  /** Soni 1 dan katta bo'lsa: «2 × $8.50». Aks holda `null` */
  readonly miqdor: string | null;
  readonly narx: string;
  /** Composite tarkibi — narxsiz, xira rangda chiqadi */
  readonly tarkib: readonly string[];
  /** Qaytarilgan pozitsiya belgilanadi, yashirilmaydi (8.10) */
  readonly izoh: string | null;
}

export interface QarzQatori {
  readonly valyuta: Valyuta;
  readonly matn: string;
}

export interface Chek {
  readonly korxonaNom: string | null;
  readonly korxonaManzil: string | null;
  readonly korxonaTelefon: string | null;

  /**
   * ⚠️ Chekda ro'yxatdagi buyurtma raqami turadi (`B-2026-000184`) —
   *    sotuvchi uni qidiruvga ko'chirib qo'ya oladi. 14 xonali
   *    `qrRaqam` esa QR ostida, skaner uchun.
   */
  readonly chekRaqam: string;
  readonly sanaMatn: string;
  readonly sotuvchi: string;
  readonly mijoz: string | null;
  readonly valyuta: Valyuta;

  readonly qatorlar: readonly ChekQatori[];

  readonly hisoblangan: string;
  /** Nol bo'lsa `null` — chegirmasiz savdoda bu qator ham chiqmaydi */
  readonly chegirma: string | null;
  readonly jami: string;
  readonly tolangan: string;
  /** ⚠️ Nol bo'lsa `null` — «$0.00» yozilmaydi, qator YO'Q bo'ladi */
  readonly qarz: string | null;

  /** Faqat qarzi bor valyutalar. Ikkalasi ham nol bo'lsa — bo'sh ro'yxat */
  readonly qarzOldin: readonly QarzQatori[];
  readonly qarzKeyin: readonly QarzQatori[];

  /** QR ichidagi matn — bot havolasi yoki (bot sozlanmagan bo'lsa) raqam */
  readonly qrMatni: string;
  /** QR ostida chiqadigan raqam — skaner ishlamasa qo'lda kiritish uchun */
  readonly qrRaqam: string;
  readonly botUsername: string | null;
}

// ─── Chek raqami ──────────────────────────────────────────────────────────

export const FILIAL_KOD_UZUNLIGI = 2;
export const CHEK_RAQAM_UZUNLIGI = 4;

/**
 * `[filial kodi 2] + [sana YYYYMMDD] + [chek raqami 4]`
 *
 * Misol: filial `14`, `2026-08-30`, buyurtma `B-2026-000184` →
 * `14202608300184`.
 *
 * ⚠️ Buyurtma raqami OLTI xonali ketma-ketlik (`B-2026-000184`),
 *    chek raqamiga esa to'rttasi sig'adi. Oxirgi to'rtta olinadi:
 *    sana ham raqam ichida turgani uchun bir kunda takrorlanishi
 *    uchun 10 000 ta buyurtma kerak bo'lardi.
 *
 * ⚠️ Filial kodi sozlanmagan bo'lsa `00` — chek baribir chiqadi.
 *    Chop etilmay qolgan chek sozlanmagan raqamdan yomonroq.
 */
export function chekRaqami(filialKod: string | null, sana: Date, buyurtmaRaqam: string): string {
  const kod = (filialKod ?? '').padStart(FILIAL_KOD_UZUNLIGI, '0').slice(-FILIAL_KOD_UZUNLIGI);

  /** Jarayon `TZ=Asia/Tashkent` bilan ishlaydi (QISM 1 §19) */
  const y = sana.getFullYear().toString().padStart(4, '0');
  const o = (sana.getMonth() + 1).toString().padStart(2, '0');
  const k = sana.getDate().toString().padStart(2, '0');

  const raqamlar = buyurtmaRaqam.replace(/\D/g, '');
  const oxirgi = raqamlar.slice(-CHEK_RAQAM_UZUNLIGI).padStart(CHEK_RAQAM_UZUNLIGI, '0');

  return `${kod}${y}${o}${k}${oxirgi}`;
}

/**
 * QR ichidagi matn.
 *
 * Bot sozlangan bo'lsa — mijoz telefoni bilan skanerlaganda to'g'ridan
 * to'g'ri botga tushadi va balansini ko'radi (13.7). Sozlanmagan bo'lsa
 * QR ichida chek raqami qoladi: skanerlansa ham foydali bo'ladi.
 */
export function qrMatni(
  botUsername: string | null,
  buyurtmaRaqam: string,
  chekRaqam: string,
): string {
  if (botUsername === null || botUsername.trim() === '') return chekRaqam;
  return `https://t.me/${botUsername}?start=${buyurtmaRaqam}`;
}

// ─── Pul ko'rinishi ───────────────────────────────────────────────────────

/**
 * ⚠️ Valyuta belgisi HAR summada turadi. Chekda ikkita raqam ustma-ust
 *    tursa, qaysi biri dollar ekani ko'rinib turishi kerak.
 */
export function chekPuli(qiymat: Pul): string {
  const korinish = pulKorsat(qiymat);
  return valyutasi(qiymat) === 'USD' ? `$${korinish}` : `${korinish} so'm`;
}

/** Matn summani buyurtma valyutasidagi pulga aylantiradi */
export function pulYasa(qiymat: string, valyuta: Valyuta): Pul {
  return valyuta === 'USD' ? dollar(qiymat) : som(qiymat);
}

export function nolPul(valyuta: Valyuta): Pul {
  return valyuta === 'USD' ? nolDollar() : nolSom();
}

// ─── O'lcham ──────────────────────────────────────────────────────────────

/**
 * Chekda o'lcham METRDA yoziladi — mijoz shunday gapiradi
 * («bir yarim metrlik parda»), buyurtma esa smda saqlanadi (3.4).
 */
export function olchamMatni(eniSm: number, boyiSm: number): string | null {
  if (eniSm <= 0 || boyiSm <= 0) return null;
  return `${(eniSm / 100).toFixed(2)}×${(boyiSm / 100).toFixed(2)} m`;
}

// ─── Pozitsiya qatori ─────────────────────────────────────────────────────

/**
 * Bitta pozitsiyani chek qatoriga aylantiradi.
 *
 * ⚠️ Narx FAQAT TUR DARAJASIDA. Composite pozitsiyada ichidagi
 *    mato va mexanizm narxsiz chiqadi (vazifa talabi, 8.14).
 */
export function qatorYasa(p: ChekPozitsiyasi, valyuta: Valyuta): ChekQatori {
  const olcham = olchamMatni(p.eniSm, p.boyiSm);
  const jami = pulYasa(p.narx, valyuta);

  /**
   * Soni birdan katta bo'lsa dona narxi ko'rsatiladi: mijoz
   * «nega ikki barobar?» deb so'ramasligi uchun.
   *
   * ⚠️ Dona narxi KO'RSATISH uchun bo'linadi, hisobda ishlatilmaydi:
   *    jami baribir `narx_snapshot` dan olinadi (2.3).
   */
  const miqdor =
    p.soni > 1
      ? `${String(p.soni)} × ${chekPuli(pulYasa(donaNarxi(p.narx, p.soni), valyuta))}`
      : null;

  return {
    tartib: p.tartib,
    sarlavha: olcham === null ? p.nom : `${p.nom} ${olcham}`,
    miqdor,
    narx: chekPuli(jami),
    tarkib: p.tarkib,
    izoh: p.holat === 'QAYTARILGAN' ? 'qaytarildi' : null,
  };
}

/** Dona narxi — ko'rsatish uchun, ikki xonagacha */
function donaNarxi(jami: string, soni: number): string {
  if (soni <= 0) return jami;
  const d = Number(jami) / soni;
  return d.toFixed(2);
}

// ─── Qarz qatorlari ───────────────────────────────────────────────────────

/**
 * TZ 6.8 — mijozning umumiy qarzi so'm va dollarda ALOHIDA turadi.
 *
 * ⚠️ Faqat NOLDAN FARQLI valyuta chiqadi. Mijozda faqat dollar qarzi
 *    bo'lsa, chekda «0 so'm» degan qator turishining ma'nosi yo'q.
 *
 * ⚠️ Ikkala blok (oldingi va keyingi) BIR XIL valyutalarni ko'rsatadi:
 *    biri chiqib, ikkinchisi chiqmasa taqqoslab bo'lmasdi.
 */
export function qarzQatorlari(
  qarz: IkkiValyutaQarz,
  korinadigan: ReadonlySet<Valyuta>,
): readonly QarzQatori[] {
  const natija: QarzQatori[] = [];
  if (korinadigan.has('SOM')) {
    natija.push({ valyuta: 'SOM', matn: chekPuli(som(qarz.som)) });
  }
  if (korinadigan.has('USD')) {
    natija.push({ valyuta: 'USD', matn: chekPuli(dollar(qarz.dollar)) });
  }
  return natija;
}

/**
 * SAVDODAN OLDINGI qarz.
 *
 * ⚠️ Shu savdodan qolgan qarz FAQAT SHU SAVDONING VALYUTASIDAGI
 *    qarzdan ayiriladi. Boshqa valyutadagi qarz o'zgarmaydi:
 *
 *      oldin $600 va 4 000 000 so'm · savdo dollarda, qarzi $8.93
 *      → keyin $608.93 va 4 000 000 so'm
 *
 *    Ikkalasini qo'shib yuborish 1.3-bandni buzardi va mijozning
 *    so'mdagi qarzi kursga qarab «o'zidan-o'zi» o'zgarib turardi.
 */
export function qarzOldingi(
  keyin: IkkiValyutaQarz,
  savdoQarzi: string,
  valyuta: Valyuta,
): IkkiValyutaQarz {
  if (valyuta === 'USD') {
    return {
      som: keyin.som,
      dollar: pulMatn(ayir(dollar(keyin.dollar), dollar(savdoQarzi))),
    };
  }
  return {
    som: pulMatn(ayir(som(keyin.som), som(savdoQarzi))),
    dollar: keyin.dollar,
  };
}

/** Ikkala blokda ham ko'rinadigan valyutalar */
export function korinadiganValyutalar(
  oldin: IkkiValyutaQarz,
  keyin: IkkiValyutaQarz,
): ReadonlySet<Valyuta> {
  const natija = new Set<Valyuta>();
  if (!nolmi(som(oldin.som)) || !nolmi(som(keyin.som))) natija.add('SOM');
  if (!nolmi(dollar(oldin.dollar)) || !nolmi(dollar(keyin.dollar))) {
    natija.add('USD');
  }
  return natija;
}

// ─── Chekni yig'ish ───────────────────────────────────────────────────────

export function chekYasa(k: ChekKirimi): Chek {
  const chiqadigan = k.pozitsiyalar.filter((p) => !CHEKKA_TUSHMAYDI.includes(p.holat));

  const nol = nolPul(k.valyuta);

  const hisoblangan = chiqadigan.reduce<Pul>((y, p) => qosh(y, pulYasa(p.narx, k.valyuta)), nol);
  const chegirma = chiqadigan.reduce<Pul>((y, p) => qosh(y, pulYasa(p.chegirma, k.valyuta)), nol);
  const jami = ayir(hisoblangan, chegirma);
  const tolangan = pulYasa(k.tolangan, k.valyuta);
  const qarz = ayir(jami, tolangan);

  const chekRaqam = chekRaqami(k.filialKod, k.sana, k.buyurtmaRaqam);

  /** Mijozsiz buyurtmada qarz bloklari umuman chiqmaydi (3.10) */
  const keyin = k.qarzKeyin;
  const oldin = keyin === null ? null : qarzOldingi(keyin, pulMatn(qarz), k.valyuta);

  const korinadigan =
    keyin === null || oldin === null ? new Set<Valyuta>() : korinadiganValyutalar(oldin, keyin);

  return {
    korxonaNom: k.korxonaNom,
    korxonaManzil: k.korxonaManzil,
    korxonaTelefon: k.korxonaTelefon,

    chekRaqam: k.buyurtmaRaqam,
    sanaMatn: sanaVaqtMatni(k.sana),
    sotuvchi: k.sotuvchi,
    mijoz: k.mijoz,
    valyuta: k.valyuta,

    qatorlar: chiqadigan.map((p) => qatorYasa(p, k.valyuta)),

    hisoblangan: chekPuli(hisoblangan),
    chegirma: nolmi(chegirma) ? null : chekPuli(chegirma),
    jami: chekPuli(jami),
    tolangan: chekPuli(tolangan),
    /** ⚠️ To'liq to'langan bo'lsa qator UMUMAN chiqmaydi */
    qarz: nolmi(qarz) ? null : chekPuli(qarz),

    qarzOldin: oldin === null ? [] : qarzQatorlari(oldin, korinadigan),
    qarzKeyin: keyin === null ? [] : qarzQatorlari(keyin, korinadigan),

    qrMatni: qrMatni(k.botUsername, k.buyurtmaRaqam, chekRaqam),
    qrRaqam: chekRaqam,
    botUsername: k.botUsername,
  };
}

/** `30.08.2026 14:35` — chekda sana va vaqt birga turadi (8.9) */
export function sanaVaqtMatni(sana: Date): string {
  const ikki = (n: number): string => n.toString().padStart(2, '0');
  return (
    `${ikki(sana.getDate())}.${ikki(sana.getMonth() + 1)}.${String(sana.getFullYear())} ` +
    `${ikki(sana.getHours())}:${ikki(sana.getMinutes())}`
  );
}
