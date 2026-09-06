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
          className="fokus rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
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
  mahsulotEniSm,
  mahsulotBoyiSm,
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
  }[];
  mahsulotEniSm: number;
  mahsulotBoyiSm: number;
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
    manbaEni: string;
    manbaBoyi: string;
    kesmaEni: string;
    kesmaBoyi: string;
    saqlan: boolean;
  }

  const BOSH_QATOR: Qator = {
    manba: 'OSTATKA',
    manbaEni: '',
    manbaBoyi: '',
    kesmaEni: '',
    kesmaBoyi: '',
    saqlan: true,
  };

  const son = (n: number | null | undefined): string =>
    n === null || n === undefined ? '' : String(n);

  /** §2.2 — geometriya DOMAINDA, bu yerda takrorlanmaydi */
  const taklif = (b: {
    bandId: number;
    kod: string;
    turi?: string;
    eniM: number | null;
    boyiM: number | null;
  }): Qator => {
    const manba = b.turi === 'RULON' ? 'RULON' : 'OSTATKA';
    if (b.eniM === null || b.boyiM === null) return { ...BOSH_QATOR, manba };

    const r = kesimRejasi(
      {
        id: b.bandId,
        kod: b.kod,
        turi: manba,
        eniM: b.eniM,
        boyiM: b.boyiM,
        qismanOchilgan: false,
      },
      { eniM: mahsulotEniSm / 100, boyiM: mahsulotBoyiSm / 100 },
    );

    return {
      ...BOSH_QATOR,
      manba,
      manbaEni: son(r.manbaQoldiq?.eniM),
      manbaBoyi: son(r.manbaQoldiq?.boyiM),
      kesmaEni: son(r.kesma?.eniM),
      kesmaBoyi: son(r.kesma?.boyiM),
    };
  };

  const [qatorlar, qatorlarniOzgartir] = useState<Record<number, Qator>>(() =>
    Object.fromEntries(bandlar.map((b) => [b.bandId, taklif(b)])),
  );

  const qator = (bandId: number): Qator => qatorlar[bandId] ?? BOSH_QATOR;

  const ozgartir = (bandId: number, yangi: Partial<Qator>): void => {
    qatorlarniOzgartir((o) => ({ ...o, [bandId]: { ...qator(bandId), ...yangi } }));
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
        className="fokus rounded-maydon bg-belgi-yashil px-3 py-1.5 text-[13px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
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
                Mahsulot: <b className="raqam">{mahsulotEniSm}</b> ×{' '}
                <b className="raqam">{mahsulotBoyiSm}</b> sm
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
                  {h.manbaKvM !== null && (
                    <span className="raqam ml-1">
                      · {h.band.kod} · {h.band.eniM} × {h.band.boyiM} m ={' '}
                      {h.manbaKvM.toFixed(2)} kv.m
                    </span>
                  )}
                </div>

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
                      ozgartir(h.band.bandId, { manba: e.target.value });
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
                className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
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
