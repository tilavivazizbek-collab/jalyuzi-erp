'use client';

/**
 * app/(panel)/buyurtma/ish.tsx — TZ 8.5 · 7.6
 *
 * «Ishni boshlash» va «Tugatdim» — VEB-DA.
 *
 * ⚠️ Ilgari bu ikkalasi faqat botda edi va buyurtma tasdiqdan
 *    keyin qotib qolardi (2026-08-30).
 */

import { useActionState, useState } from 'react';
import { Modal } from '../modal';
import { kirishUslubi } from '../maydon';
import { kesimRejasi } from '@/lib/domain/kesish';
import { ishniBoshlaAmali, tugatdimAmali } from './ish-amal';
import { BOSH_ISH_HOLATI } from './ish-holat';

export interface UstaTanlovi {
  readonly id: number;
  readonly ism: string;
}

const xatoQatori = (xato: string | null) =>
  xato === null ? null : (
    <p role="alert" className="mt-1 text-[12px] text-belgi-qizil">
      {xato}
    </p>
  );

// ─── 8.5 · Ishni boshlash ────────────────────────────────────────────────

export function IshniBoshlashTugmasi({
  pozitsiyaId,
  ustalar,
}: {
  pozitsiyaId: number;
  ustalar: readonly UstaTanlovi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    ishniBoshlaAmali.bind(null, pozitsiyaId),
    BOSH_ISH_HOLATI,
  );

  return (
    <form action={yubor} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {/*
          ⚠️ Usta TANLANADI: veb-da ishni ko'pincha admin yozadi.
             Bo'sh qolsa amal o'zi bosgan odamni qo'yadi.
        */}
        {ustalar.length > 0 && (
          <select
            name="ustaId"
            defaultValue=""
            aria-label="Ishni kim oladi"
            className={`${kirishUslubi(false)} w-44 py-1.5 text-[13px]`}
          >
            <option value="">— o&apos;zim —</option>
            {ustalar.map((u) => (
              <option key={u.id} value={u.id}>
                {u.ism}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Boshlanmoqda…' : 'Ishni boshlash'}
        </button>
      </div>
      {xatoQatori(holat.xato)}
    </form>
  );
}

// ─── 7.6 · «Tugatdim» ────────────────────────────────────────────────────

/**
 * TZ 7.6 — «Tugatdim».
 *
 * ⚠️ HAR MATO uchun alohida qoldiq so'raladi (2026-09-03 tuzatishi).
 *    Rollo da ikki mato, Dikke da uchta: har biri o'z bo'lagidan
 *    kesiladi va o'z qoldig'ini beradi. Ilgari oyna bitta qoldiq
 *    so'rar, faqat birinchi mato ombordan chiqar, qolganlari esa
 *    band bo'lib qolaverardi.
 */
export function TugatdimTugmasi({
  pozitsiyaId,
  bandlar,
  mahsulotEniM,
  mahsulotBoyiM,
}: {
  pozitsiyaId: number;
  /** Band qilingan bo'laklar — usta shulardan kesadi (7.3) */
  bandlar: readonly {
    bandId: number;
    kod: string;
    materialNom: string;
    /** TZ 7.4 — rulonmi yoki kesma: qoldiq shunga qarab hisoblanadi */
    turi?: string;
    eniM: number | null;
    boyiM: number | null;
    /** SHU MATODAN kesiladigan to'rtburchak — 2026-09-22 */
    kesimEniM: number | null;
    kesimBoyiM: number | null;
    slotNomi: string | null;
    hisoblanganKvM: number | null;
  }[];
  mahsulotEniM: number;
  mahsulotBoyiM: number;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(
    tugatdimAmali.bind(null, pozitsiyaId),
    BOSH_ISH_HOLATI,
  );

  /**
   * ⚠️ IKKI QOLDIQ (7.4): rulonning davomi va yon kesma.
   *
   *    Egasining qarori (2026-09-05): raqamlarni TIZIM hisoblaydi,
   *    usta esa tasdiqlaydi. Mato qiyshiq kesilsa (5–10 sm og'ish
   *    oddiy) usta raqamni o'zgartiradi.
   */
  interface Qator {
    manba: string;
    /**
     * USTA HAQIQATDA QANCHA KESDI — egasi talabi 2026-09-22:
     * «ustalar buncha kesdik yoki buncha kesdik deb».
     *
     * ⚠️ Tizim taklif qiladi, usta tuzatadi. O'zgartirilsa qoldiq
     *    O'ZI qayta hisoblanadi — usta ikkita raqamni qo'lda
     *    ayirib o'tirmaydi.
     */
    kesimEni: string;
    kesimBoyi: string;
    manbaEni: string;
    manbaBoyi: string;
    kesmaEni: string;
    kesmaBoyi: string;
    saqlan: boolean;
  }

  const BOSH_QATOR: Qator = {
    manba: 'OSTATKA',
    kesimEni: '',
    kesimBoyi: '',
    manbaEni: '',
    manbaBoyi: '',
    kesmaEni: '',
    kesmaBoyi: '',
    saqlan: true,
  };

  const son = (n: number | null | undefined): string =>
    n === null || n === undefined ? '' : String(n);

  /**
   * Kesimdan qoldiqni hisoblaydi — §2.2: geometriya DOMAINDA
   * (`kesimRejasi`), bu yerda takrorlanmaydi.
   *
   * ⚠️ Usta kesim raqamini o'zgartirsa, qoldiq SHU funksiya bilan
   *    qayta hisoblanadi. Ikkita alohida hisob bo'lsa, ular
   *    bir-biridan farq qilib qolishi mumkin edi.
   */
  const qoldiqTaklifi = (
    b: { bandId: number; kod: string; eniM: number | null; boyiM: number | null },
    manba: string,
    kesimEniM: number | null,
    kesimBoyiM: number | null,
  ): Pick<Qator, 'manbaEni' | 'manbaBoyi' | 'kesmaEni' | 'kesmaBoyi'> => {
    /**
     * ⚠️ Kesim yoki manba noma'lum bo'lsa taklif BERILMAYDI:
     *    noto'g'ri raqamdan ko'ra bo'sh katak yaxshi — usta
     *    o'zi o'lchab yozadi.
     */
    if (
      b.eniM === null ||
      b.boyiM === null ||
      kesimEniM === null ||
      kesimBoyiM === null ||
      kesimEniM <= 0 ||
      kesimBoyiM <= 0
    ) {
      return { manbaEni: '', manbaBoyi: '', kesmaEni: '', kesmaBoyi: '' };
    }

    const r = kesimRejasi(
      {
        id: b.bandId,
        kod: b.kod,
        turi: manba === 'RULON' ? 'RULON' : 'OSTATKA',
        eniM: b.eniM,
        boyiM: b.boyiM,
        qismanOchilgan: false,
      },
      { eniM: kesimEniM, boyiM: kesimBoyiM },
    );

    return {
      manbaEni: son(r.manbaQoldiq?.eniM),
      manbaBoyi: son(r.manbaQoldiq?.boyiM),
      kesmaEni: son(r.kesma?.eniM),
      kesmaBoyi: son(r.kesma?.boyiM),
    };
  };

  /** §2.2 — geometriya DOMAINDA, bu yerda takrorlanmaydi */
  const taklif = (b: {
    bandId: number;
    kod: string;
    turi?: string;
    eniM: number | null;
    boyiM: number | null;
    kesimEniM: number | null;
    kesimBoyiM: number | null;
  }): Qator => {
    const manba = b.turi === 'RULON' ? 'RULON' : 'OSTATKA';
    if (b.eniM === null || b.boyiM === null) return { ...BOSH_QATOR, manba };

    /**
     * ⚠️ KESIM O'LCHAMI, mahsulot o'lchami EMAS — 2026-09-22.
     *
     *    Ilgari bu yerga `{ eniM: mahsulotEniM, boyiM: mahsulotBoyiM }`
     *    berilardi, ya'ni OYNANING o'lchami. Rulon pardada bu tasodifan
     *    to'g'ri chiqardi (kesim ≈ oyna), lekin koeffitsient, kesish
     *    yo'nalishi yoki qat'iy kesim eni bo'lgan turda butunlay
     *    noto'g'ri edi.
     *
     *    Dikkeyda: haqiqiy kesim 0.40 × 45 m, ekran esa 2 × 2.5 deb
     *    hisoblab rulon qoldig'ini 97.5 m deb taklif qilardi —
     *    haqiqatda 55 m. Usta tasdiqlasa 42.5 metr mato (17 kv.m)
     *    omborga QAYTIB QOLARDI. Har buyurtmada.
     *
     * ⚠️ Kesim hisoblanmagan bo'lsa (chiziqli yoki dona material)
     *    taklif berilmaydi: noto'g'ri raqamdan ko'ra bo'sh katak
     *    yaxshi — usta o'zi o'lchab yozadi.
     */
    if (b.kesimEniM === null || b.kesimBoyiM === null) {
      return { ...BOSH_QATOR, manba };
    }

    return {
      ...BOSH_QATOR,
      manba,
      kesimEni: son(b.kesimEniM),
      kesimBoyi: son(b.kesimBoyiM),
      ...qoldiqTaklifi(b, manba, b.kesimEniM, b.kesimBoyiM),
    };
  };

  const [qatorlar, qatorlarniOzgartir] = useState<Record<number, Qator>>(() =>
    Object.fromEntries(bandlar.map((b) => [b.bandId, taklif(b)])),
  );

  const qator = (bandId: number): Qator => qatorlar[bandId] ?? BOSH_QATOR;

  const ozgartir = (bandId: number, yangi: Partial<Qator>): void => {
    qatorlarniOzgartir((o) => ({ ...o, [bandId]: { ...qator(bandId), ...yangi } }));
  };

  /**
   * KESIM O'ZGARTIRILDI — qoldiq O'ZI qayta hisoblanadi.
   *
   * ⚠️ Egasi talabi 2026-09-22: «ustalar buncha kesdik yoki buncha
   *    kesdik deb». Usta kesgan raqamini yozadi, qolganini tizim
   *    hisoblaydi — u ikkita raqamni qo'lda ayirib o'tirmaydi.
   *
   * ⚠️ Manba ham o'zgarsa (rulondan emas, ostatkadan kesilgan
   *    bo'lsa) qoldiq ham boshqacha bo'ladi, shuning uchun manba
   *    almashganda ham SHU funksiya chaqiriladi.
   */
  const kesimniOzgartir = (
    b: { bandId: number; kod: string; eniM: number | null; boyiM: number | null },
    yangi: { kesimEni?: string; kesimBoyi?: string; manba?: string },
  ): void => {
    const joriy = qator(b.bandId);
    const kesimEni = yangi.kesimEni ?? joriy.kesimEni;
    const kesimBoyi = yangi.kesimBoyi ?? joriy.kesimBoyi;
    const manba = yangi.manba ?? joriy.manba;

    const eni = Number(kesimEni);
    const boyi = Number(kesimBoyi);

    ozgartir(b.bandId, {
      ...yangi,
      ...qoldiqTaklifi(
        b,
        manba,
        Number.isFinite(eni) && eni > 0 ? eni : null,
        Number.isFinite(boyi) && boyi > 0 ? boyi : null,
      ),
    });
  };

  const maydon = (e: string, b: string): number => {
    const x = Number(e);
    const y = Number(b);
    return x > 0 && y > 0 ? x * y : 0;
  };

  /** Har mato bo'yicha hisob — usta raqamni adashsa darhol ko'radi */
  const hisob = bandlar.map((b) => {
    const q = qator(b.bandId);
    const manbaKvM = b.eniM !== null && b.boyiM !== null ? b.eniM * b.boyiM : null;
    const kesmaKvM = maydon(q.kesmaEni, q.kesmaBoyi);
    // Omborga qaytadigan qism: manba qoldig'i + saqlanadigan yon kesma
    const qoldiqKvM = maydon(q.manbaEni, q.manbaBoyi) + (q.saqlan ? kesmaKvM : 0);
    // Manbadan chiqmagan qism: chiqindiga chiqarilgani ham shu yerda
    const jamiQolgan = maydon(q.manbaEni, q.manbaBoyi) + kesmaKvM;
    return {
      band: b,
      q,
      manbaKvM,
      qoldiqKvM,
      mahsulotgaKvM: manbaKvM === null ? null : manbaKvM - jamiQolgan,
      kop: manbaKvM !== null && jamiQolgan > manbaKvM + 1e-9,
    };
  });

  const xatolik = hisob.some((h) => h.kop);
  /** Bo'sh maydon — «bunday bo'lak qolmadi» degani, bu xato emas */
  const toldirilmagan = false;

  const yuborilajak = bandlar.map((b) => {
    const q = qator(b.bandId);
    const raqam = (x: string): string => (x.trim() === '' ? '0' : x.trim());
    return {
      bandId: b.bandId,
      manba: q.manba,
      manbaEni: raqam(q.manbaEni),
      manbaBoyi: raqam(q.manbaBoyi),
      kesmaEni: raqam(q.kesmaEni),
      kesmaBoyi: raqam(q.kesmaBoyi),
      saqlansinmi: q.saqlan,
    };
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon bg-belgi-yashil px-3 py-1.5 text-[13px] font-medium text-tugma-matn transition-all hover:opacity-90 active:scale-[0.98]"
      >
        Tugatdim
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha="Ishni yakunlash"
        izoh="Har mato uchun kesimdan keyin qolgan bo'lak o'lchamini kiriting (7.6)"
        bolalar={
          <form action={yubor} className="flex flex-col gap-4">
            <input type="hidden" name="kesimlar" value={JSON.stringify(yuborilajak)} />

            <div className="rounded-maydon bg-fon px-3 py-2.5 text-[13px] text-matn-ikki">
              <p>
                Mahsulot: <b className="raqam">{mahsulotEniM}</b> ×{' '}
                <b className="raqam">{mahsulotBoyiM}</b> m
              </p>
            </div>

            {bandlar.length === 0 && (
              <p role="alert" className="text-[13px] text-belgi-qizil">
                Bu pozitsiyaga band qilingan bo&apos;lak yo&apos;q — ishni yakunlab
                bo&apos;lmaydi.
              </p>
            )}

            {hisob.map((h) => (
              <div
                key={h.band.bandId}
                className="flex flex-col gap-3 rounded-karta border border-chegara px-3 py-3"
              >
                <div className="text-[13px] text-matn-ikki">
                  <b className="text-matn">{h.band.materialNom}</b>
                  {h.band.slotNomi !== null && (
                    <span className="ml-1 text-matn-kuchsiz">({h.band.slotNomi})</span>
                  )}
                  {h.manbaKvM !== null && (
                    <span className="raqam ml-1">
                      · {h.band.kod} · {h.band.eniM} × {h.band.boyiM} m ={' '}
                      {h.manbaKvM.toFixed(2)} kv.m
                    </span>
                  )}
                </div>

                {/*
                  ⚠️ KESIM O'LCHAMI — egasi talabi 2026-09-22:
                     «usta saytida mato sarfi eni va bo'yi qancha
                     bo'lishi aniq va ravshan ko'rinib turadi».

                     Ilgari faqat kv.m ko'rinardi. Usta esa kv.m ni
                     kesmaydi — u eni va bo'yini kesadi.
                */}
                {h.band.kesimEniM !== null && h.band.kesimBoyiM !== null && (
                  <div className="rounded-maydon bg-brend/5 px-3 py-2.5">
                    <div className="mb-1.5 text-[13px] text-matn-ikki">
                      Qancha kesildi
                      <span className="ml-1 text-matn-kuchsiz">
                        · tizim hisobi {h.band.kesimEniM.toFixed(2)} ×{' '}
                        {h.band.kesimBoyiM.toFixed(2)} m
                        {h.band.hisoblanganKvM !== null && (
                          <> = {h.band.hisoblanganKvM.toFixed(2)} kv.m</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={h.q.kesimEni}
                        onChange={(e) => {
                          kesimniOzgartir(h.band, { kesimEni: e.target.value });
                        }}
                        inputMode="decimal"
                        aria-label="Kesilgan eni, metrda"
                        className={`${kirishUslubi(false)} w-24`}
                      />
                      <span className="text-matn-kuchsiz">×</span>
                      <input
                        value={h.q.kesimBoyi}
                        onChange={(e) => {
                          kesimniOzgartir(h.band, { kesimBoyi: e.target.value });
                        }}
                        inputMode="decimal"
                        aria-label="Kesilgan bo'yi, metrda"
                        className={`${kirishUslubi(false)} w-24`}
                      />
                      <span className="text-[13px] text-matn-kuchsiz">m</span>
                      {maydon(h.q.kesimEni, h.q.kesimBoyi) > 0 && (
                        <span className="raqam text-[13px] text-matn-ikki">
                          = {maydon(h.q.kesimEni, h.q.kesimBoyi).toFixed(2)} kv.m
                        </span>
                      )}
                    </div>
                    {/*
                      ⚠️ Kesim o'zgartirilsa QOLDIQ o'zi qayta
                         hisoblanadi — usta ikkita raqamni qo'lda
                         ayirib o'tirmaydi.
                    */}
                    <p className="mt-1.5 text-xs text-matn-kuchsiz">
                      O&apos;zgartirsangiz pastdagi qoldiq o&apos;zi qayta
                      hisoblanadi.
                    </p>
                  </div>
                )}

                {/*
                  ⚠️ Manba TASDIQLANADI (7.6): tizim ostatkani band
                     qilgan bo'lishi mumkin, usta esa rulondan kesgan
                     bo'lishi mumkin — haqiqat ustada.
                */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-matn-ikki">Nimadan kesildi</span>
                  <select
                    value={h.q.manba}
                    onChange={(e) => {
                      /** ⚠️ Manba almashsa qoldiq ham boshqacha bo'ladi */
                      kesimniOzgartir(h.band, { manba: e.target.value });
                    }}
                    className={kirishUslubi(false)}
                  >
                    <option value="OSTATKA">Qoldiq kesmadan (ostatka)</option>
                    <option value="RULON">Butun rulondan</option>
                  </select>
                </label>

                <p className="text-xs text-matn-kuchsiz">
                  Raqamlarni tizim hisobladi. Mato boshqacha kesilgan bo&apos;lsa
                  o&apos;zgartiring; bo&apos;sh qoldirilgani &mdash; bunday bo&apos;lak
                  qolmadi degani.
                </p>

                {/* TZ 7.4 — rulonning ENISI o'zgarmaydi, faqat BO'YI kamayadi */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-matn-ikki">
                      {h.q.manba === 'RULON' ? 'Rulonda qoldi' : "Bo'lakda qoldi"} &mdash; eni (m)
                    </span>
                    <input
                      value={h.q.manbaEni}
                      onChange={(e) => {
                        ozgartir(h.band.bandId, { manbaEni: e.target.value });
                      }}
                      inputMode="decimal"
                      placeholder="qolmadi"
                      className={kirishUslubi(h.kop)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-matn-ikki">Bo&apos;yi (m)</span>
                    <input
                      value={h.q.manbaBoyi}
                      onChange={(e) => {
                        ozgartir(h.band.bandId, { manbaBoyi: e.target.value });
                      }}
                      inputMode="decimal"
                      placeholder="qolmadi"
                      className={kirishUslubi(h.kop)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-matn-ikki">
                      Yon kesma &mdash; eni (m)
                    </span>
                    <input
                      value={h.q.kesmaEni}
                      onChange={(e) => {
                        ozgartir(h.band.bandId, { kesmaEni: e.target.value });
                      }}
                      inputMode="decimal"
                      placeholder="qolmadi"
                      className={kirishUslubi(h.kop)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-matn-ikki">Bo&apos;yi (m)</span>
                    <input
                      value={h.q.kesmaBoyi}
                      onChange={(e) => {
                        ozgartir(h.band.bandId, { kesmaBoyi: e.target.value });
                      }}
                      inputMode="decimal"
                      placeholder="qolmadi"
                      className={kirishUslubi(h.kop)}
                    />
                  </label>
                </div>

                {/*
                  ⚠️ Hisob DARHOL ko'rinadi: usta raqamni adashib
                     yozsa, mahsulotga ketgan qism aql bovar
                     qilmaydigan chiqadi va u buni ko'radi.
                */}
                {h.manbaKvM !== null && h.qoldiqKvM > 0 && (
                  <p
                    className={`rounded-maydon px-3 py-2 text-[13px] ${
                      h.kop ? 'bg-belgi-qizil-fon text-belgi-qizil' : 'bg-fon text-matn-ikki'
                    }`}
                  >
                    {h.kop ? (
                      <>Qolgan bo&apos;lak manbadan katta — o&apos;lchamni tekshiring.</>
                    ) : (
                      <>
                        Qoldiq <b className="raqam">{h.qoldiqKvM.toFixed(2)}</b> kv.m ·
                        mahsulotga{' '}
                        <b className="raqam">{(h.mahsulotgaKvM ?? 0).toFixed(2)}</b> kv.m
                      </>
                    )}
                  </p>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={h.q.saqlan}
                    onChange={(e) => {
                      ozgartir(h.band.bandId, { saqlan: e.target.checked });
                    }}
                    className="size-4"
                  />
                  <span className="text-matn-ikki">
                    Yon kesma omborga qaytsin
                    <span className="ml-1 text-xs text-matn-kuchsiz">
                      belgilanmasa chiqindiga yoziladi (7.5)
                    </span>
                  </span>
                </label>
              </div>
            ))}

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Izoh</span>
              <input name="izoh" placeholder="ixtiyoriy" className={kirishUslubi(false)} />
            </label>

            {xatoQatori(holat.xato)}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={kutilmoqda || xatolik || toldirilmagan || bandlar.length === 0}
                className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
              >
                {kutilmoqda ? 'Yakunlanmoqda…' : 'Ishni yakunlash'}
              </button>
              <button
                type="button"
                onClick={() => {
                  ochiqniOzgartir(false);
                }}
                className="fokus rounded-maydon px-2 py-2 text-sm text-matn-kuchsiz hover:text-matn"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        }
      />
    </>
  );
}
