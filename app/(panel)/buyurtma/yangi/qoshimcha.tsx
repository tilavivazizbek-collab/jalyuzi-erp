'use client';

/**
 * app/(panel)/buyurtma/yangi/qoshimcha.tsx — savatga qo'shimcha mahsulot.
 *
 * ⚠️ NEGA KERAK
 *
 * Egasi: «mijoz yana qo'shimcha xohladi — uyidagi eski mexanizm
 * buzilgani uchun bittasini alohida olay».
 *
 * ⚠️ IKKI XIL BO'LADI — egasi qarori 2026-09-20.
 *
 *    DONALAB (kronshteyn, mexanizm): tayyorlanmaydi, kesilmaydi,
 *    o'lchami yo'q. Shunchaki ombordan olinib beriladi va narxi
 *    materialning o'z sotuv narxidan keladi.
 *
 *    METRLAB (mato): rulondan KESILADI. O'lcham so'raladi, band
 *    qilinadi, narx esa «Narxlar va turlar» dagi «Materialni o'zi
 *    sotish» jadvalidan keladi — mato darajasiga qarab, bosqichli.
 */

import { useState } from 'react';
import { Modal } from '../../modal';
import { kirishUslubi } from '../../maydon';
import { pulKorsat, pulMatn, kopaytir, som } from '@/lib/domain/pul';
import { katalogNarxi } from '@/lib/domain/narx';
import type { Kurs } from '@/lib/domain/pul';
import {
  pozitsiyaQoidaNarxi,
  type HisoblashUsuli,
} from '@/lib/domain/narx-qoidasi';
import { biznesXatosimi } from '@/lib/xato';
import type { MaterialNarxQoidasi } from './malumot';

export interface QoshimchaMaterial {
  readonly id: number;
  readonly nom: string;
  readonly narx: string | null;
  readonly narxValyuta: string;
  /** Q-25 — shu filialdagi bo'sh qoldiq */
  readonly boshDona: number;
  /** `DONA` — donalab, `RULON` — metrlab kesib sotiladi */
  readonly hisobTuri: string;
  readonly sarflashBirligi: string;
  /** Mato darajasi — metrlab sotishda narx shundan */
  readonly narxGuruhId: number | null;
  readonly boshKvM: number;
  /** Eng keng bo'lak, metr — «bundan keng kesib bo'lmaydi» */
  readonly engKengM: number;
}

export interface QoshimchaTanlovi {
  readonly materialId: number;
  readonly nom: string;
  readonly soni: number;
  readonly narx: string;
  /** ⚠️ Metrlab kesib sotishda — METRDA (2026-09-20) */
  readonly eniM: number;
  readonly boyiM: number;
  /** Kesib sotishda ombordan yechiladigan maydon, kv.m */
  readonly miqdorKvM: string | null;
}

export function QoshimchaQoshish({
  materiallar,
  kurs,
  qoshildi,
  qoidalar = [],
  mijozTuriId = null,
}: {
  materiallar: readonly QoshimchaMaterial[];
  kurs: Kurs | null;
  qoshildi: (t: QoshimchaTanlovi) => void;
  /** Materialni o'zi sotish narxi — metrlab kesishda ishlatiladi */
  qoidalar?: readonly MaterialNarxQoidasi[];
  /** TZ 6.2 — mijoz turiga qo'yilgan qoida umumiysidan ustun */
  mijozTuriId?: number | null;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [materialId, materialniOzgartir] = useState('');
  const [soni, soniniOzgartir] = useState('1');
  /** ⚠️ Metrda kiritiladi, santimetrga o'giriladi (TZ 5.3) */
  const [eni, eniniOzgartir] = useState('');
  const [boyi, boyiniOzgartir] = useState('');
  const [xato, xatoniOzgartir] = useState<string | null>(null);

  const tanlangan = materiallar.find((m) => String(m.id) === materialId);

  /**
   * ⚠️ Narx katalogdan keladi va dollarda bo'lsa kursga uriladi
   *    (5.4). Mijoz offseti bu yerda QO'LLANMAYDI — u faqat
   *    matoga tegishli (6.3).
   */
  const birlikNarx =
    tanlangan === undefined || tanlangan.narx === null
      ? null
      : katalogNarxi(tanlangan.narx, tanlangan.narxValyuta, kurs);

  /** Rulon — metrlab kesib sotiladi, dona — shunchaki olinadi */
  const kesiladimi = tanlangan?.hisobTuri === 'RULON';

  /**
   * ⚠️ BIRLIK — 2026-09-21 auditida topilgan nuqson.
   *
   *    Ekran har qanday kesilmaydigan materialni «dona» deb
   *    ko'rsatardi va katakni «Soni» deb atardi. Chiziqli
   *    materialda (`M`) esa `bolak.miqdor` ustunida METR turadi:
   *    «omborda 8 dona» aslida 8 METR degani edi, kiritilgan
   *    «5» esa 5 metrni yechardi.
   *
   *    Hisob-kitob to'g'ri ishlar edi (narx ham 1 metr uchun),
   *    lekin YORLIQ YOLG'ON edi — sotuvchi nechta yozayotganini
   *    bilmasdi. Egasi bu sinf xatoni allaqachon bir marta
   *    aytgan: «u metrmi santimetrmi aniq emas».
   */
  const metrlik = tanlangan?.sarflashBirligi === 'M';

  const son = Number(soni);
  const eniM = Number(eni);
  const boyiM = Number(boyi);
  const olchamYaroqli =
    Number.isFinite(eniM) && Number.isFinite(boyiM) && eniM > 0 && boyiM > 0;

  /**
   * ⚠️ Metrlab sotishda narx MATERIALDAN EMAS, «Materialni o'zi
   *    sotish» jadvalidan keladi (egasi qarori 2026-09-20).
   *
   *    TZ 6.2 — mijoz turiga qo'yilgan qoida umumiysidan ustun.
   */
  const qoida = (() => {
    if (!kesiladimi || (tanlangan?.narxGuruhId ?? null) === null) return null;
    const g = tanlangan.narxGuruhId;
    return (
      qoidalar.find((q) => q.narxGuruhId === g && q.mijozTuriId === mijozTuriId) ??
      qoidalar.find((q) => q.narxGuruhId === g && q.mijozTuriId === null) ??
      null
    );
  })();

  const kesimNatijasi = (() => {
    if (!kesiladimi) return null;
    if (qoida === null || !olchamYaroqli) return null;
    try {
      return pozitsiyaQoidaNarxi({
        qoida: {
          hisoblashUsuli: qoida.hisoblashUsuli as HisoblashUsuli,
          bosqichlar: qoida.bosqichlar.map((x) => ({
            dan: x.dan,
            gacha: x.gacha,
            narx: x.narx,
            valyuta: x.valyuta,
          })),
        },
        eniM,
        boyiM,
        qoshimchalar: [],
        offset: null,
        kurs,
      });
    } catch (x) {
      return { xato: biznesXatosimi(x) ? x.message : 'Narxni hisoblab bo‘lmadi' };
    }
  })();

  const jami = kesiladimi
    ? kesimNatijasi !== null && 'jami' in kesimNatijasi
      ? som(kesimNatijasi.jami)
      : null
    : birlikNarx === null || !Number.isFinite(son) || son <= 0
      ? null
      : kopaytir(birlikNarx, son);

  function yop(): void {
    ochiqniOzgartir(false);
    xatoniOzgartir(null);
  }

  function qosh(): void {
    if (tanlangan === undefined) {
      xatoniOzgartir('Mahsulotni tanlang');
      return;
    }

    if (kesiladimi) {
      if (!olchamYaroqli) {
        xatoniOzgartir("Eni va bo'yini metrda kiriting");
        return;
      }
      if (qoida === null) {
        xatoniOzgartir(
          "Bu mato darajasi uchun narx qo'yilmagan — «Narxlar va turlar» → «Materialni o'zi sotish»",
        );
        return;
      }
      if (jami === null) {
        xatoniOzgartir(
          kesimNatijasi !== null && 'xato' in kesimNatijasi
            ? kesimNatijasi.xato
            : "Bu o'lcham uchun bosqich qo'yilmagan",
        );
        return;
      }
    } else {
      /**
       * ⚠️ KASR QABUL QILINMAYDI — metrda ham.
       *
       *    Chiziqli materialni 2.5 metrlab to'g'ridan-to'g'ri
       *    sotish HOZIR MUMKIN EMAS: miqdor `buyurtma_pozitsiya.soni`
       *    ustunida saqlanadi va u `integer`. Matoda bunday muammo
       *    yo'q — u o'lchamda (`eni_m` × `boyi_m`) yuradi.
       *
       *    Bu yerda kasr qabul qilinsa, server uni RAD ETARDI
       *    (`sotuv.ts`: `z.number().int()`) va sotuvchi tushunarsiz
       *    xato olardi. Shuning uchun cheklov ekranda, sabab bilan
       *    aytiladi. Yechim sxema o'zgarishini talab qiladi —
       *    egasining qarori (QARZLAR.md T-16).
       */
      if (!Number.isInteger(son) || son <= 0) {
        xatoniOzgartir(
          metrlik
            ? "Butun metr kiriting — kasr metrni hozircha sotib bo'lmaydi"
            : "Soni butun va noldan katta bo'lishi kerak",
        );
        return;
      }
      if (jami === null) {
        xatoniOzgartir('Bu mahsulotning sotuv narxi belgilanmagan');
        return;
      }
    }

    /**
     * ⚠️ Qoldiq yetmasa TO'XTATILMAYDI, faqat ogohlantiriladi:
     *    aniq javobni server beradi va pozitsiya «materialga
     *    kutmoqda» ga tushadi (8.12, Q-03).
     */
    qoshildi({
      materialId: tanlangan.id,
      nom: tanlangan.nom,
      soni: kesiladimi ? 1 : son,
      narx: pulMatn(jami),
      eniM: kesiladimi ? eniM : 0,
      boyiM: kesiladimi ? boyiM : 0,
      /** ⚠️ Ombordan yechiladigan maydon — kesim to'rtburchagi (Q-05) */
      miqdorKvM: kesiladimi ? (eniM * boyiM).toFixed(4) : null,
    });

    materialniOzgartir('');
    soniniOzgartir('1');
    eniniOzgartir('');
    boyiniOzgartir('');
    yop();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] font-medium text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
      >
        + Qo&apos;shimcha mahsulot
      </button>

      <Modal
        ochiq={ochiq}
        yop={yop}
        sarlavha="Qo'shimcha mahsulot"
        izoh="Donalab — ombordan olinadi · metrlab — rulondan kesiladi"
        bolalar={
          <div className="flex flex-col gap-4">
            {xato !== null && (
              <p
                role="alert"
                className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
              >
                {xato}
              </p>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Mahsulot</span>
              <select
                value={materialId}
                onChange={(e) => {
                  materialniOzgartir(e.target.value);
                  xatoniOzgartir(null);
                }}
                className={kirishUslubi(false)}
              >
                <option value="">— tanlang —</option>
                {materiallar.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} ·{' '}
                    {m.hisobTuri === 'RULON'
                      ? `omborda ${m.boshKvM.toFixed(1)} kv.m`
                      : m.sarflashBirligi === 'M'
                        ? `omborda ${m.boshDona.toFixed(2)} metr`
                        : `omborda ${String(m.boshDona)} dona`}
                  </option>
                ))}
              </select>
              {/*
                ⚠️ RO'YXAT BO'SH BO'LSA SABABI AYTILADI. Ilgari
                   sotuvchi bo'sh dropdownni ko'rib «tizim buzilibdi»
                   deb o'ylardi — aslida hech bir materialga
                   «to'g'ridan-to'g'ri sotiladi» belgisi qo'yilmagan
                   bo'lardi (egasi qarori 2026-09-20).
              */}
              {materiallar.length === 0 && (
                <span className="text-[12px] text-belgi-sariq">
                  Alohida sotiladigan buyum yo&apos;q. Material kartochkasida
                  «To&apos;g&apos;ridan-to&apos;g&apos;ri sotiladi» belgisini
                  qo&apos;ying va sotuv narxini yozing.
                </span>
              )}
            </label>

            {kesiladimi ? (
              /*
                ⚠️ METRLAB SOTISH — rulondan kesiladi, shuning uchun
                   soni emas, O'LCHAM so'raladi. Birlik sarlavhada
                   yoziladi: placeholder yozishni boshlagan zahoti
                   yo'qoladi va omborchi santimetr yozib qo'yardi.
              */
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">
                  Kesim o&apos;lchami — <b>metrda</b>
                </span>
                <div className="flex items-center gap-2">
                  <input
                    value={eni}
                    onChange={(e) => {
                      eniniOzgartir(e.target.value);
                      xatoniOzgartir(null);
                    }}
                    inputMode="decimal"
                    placeholder="eni, metr"
                    aria-label="Kesim eni, metr"
                    className={`${kirishUslubi(false)} max-w-32`}
                  />
                  <span className="text-matn-kuchsiz">×</span>
                  <input
                    value={boyi}
                    onChange={(e) => {
                      boyiniOzgartir(e.target.value);
                      xatoniOzgartir(null);
                    }}
                    inputMode="decimal"
                    placeholder="bo'yi, metr"
                    aria-label="Kesim bo'yi, metr"
                    className={`${kirishUslubi(false)} max-w-32`}
                  />
                </div>
                {/*
                  ⚠️ ENG KENG BO'LAK aytiladi. Aks holda sotuvchi 3 m
                     so'rab, pozitsiya «materialga kutmoqda» ga
                     tushgandan keyin sababni qidirardi.
                */}
                {tanlangan !== undefined && tanlangan.engKengM > 0 && (
                  <span className="text-[12px] text-matn-kuchsiz">
                    Omborda eng keng bo&apos;lak: <b>{tanlangan.engKengM.toFixed(2)} m</b> ·
                    jami {tanlangan.boshKvM.toFixed(2)} kv.m
                  </span>
                )}
              </div>
            ) : (
              <label className="flex max-w-40 flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">
                  {metrlik ? 'Necha metr' : 'Soni (dona)'}
                </span>
                <input
                  value={soni}
                  onChange={(e) => {
                    soniniOzgartir(e.target.value);
                    xatoniOzgartir(null);
                  }}
                  inputMode="numeric"
                  className={kirishUslubi(false)}
                />
              </label>
            )}

            {tanlangan !== undefined && (
              <div className="rounded-maydon bg-fon px-3 py-2.5 text-sm">
                {kesiladimi ? (
                  qoida === null ? (
                    <span className="text-belgi-sariq">
                      Bu mato darajasi uchun narx qo&apos;yilmagan — «Narxlar va
                      turlar» → «Materialni o&apos;zi sotish»
                    </span>
                  ) : jami === null ? (
                    <span className="text-matn-kuchsiz">
                      {olchamYaroqli
                        ? "Bu o'lcham uchun bosqich qo'yilmagan"
                        : "O'lchamni kiriting"}
                    </span>
                  ) : (
                    <>
                      <span className="text-matn-kuchsiz">
                        {(eniM * boyiM).toFixed(4)} kv.m ={' '}
                      </span>
                      <b>{pulKorsat(jami)}</b>
                    </>
                  )
                ) : birlikNarx === null ? (
                  <span className="text-belgi-sariq">
                    Bu materialning sotuv narxi belgilanmagan
                  </span>
                ) : (
                  <>
                    <span className="text-matn-kuchsiz">
                      {pulKorsat(birlikNarx)} × {soni} ={' '}
                    </span>
                    <b>{jami === null ? '—' : pulKorsat(jami)}</b>
                  </>
                )}

                {/*
                  ⚠️ Qoldiq YETMASA ham qo'shishga ruxsat beriladi:
                     aniq javobni server beradi va pozitsiya
                     «materialga kutmoqda» ga tushadi (Q-03, 8.12).
                */}
                {Number.isFinite(son) && son > tanlangan.boshDona && (
                  <p className="mt-1.5 text-[12px] text-belgi-sariq">
                    Omborda {tanlangan.boshDona} ta bor — yetmasa buyurtma
                    «materialga kutmoqda» bo&apos;lib turadi
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={qosh}
                className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
              >
                Savatga qo&apos;shish
              </button>
              <button
                type="button"
                onClick={yop}
                className="fokus rounded-maydon px-2 py-1 text-sm text-matn-ikki transition-colors hover:text-matn"
              >
                Bekor
              </button>
            </div>
          </div>
        }
      />
    </>
  );
}
