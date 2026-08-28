'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../../maydon';
import { kirimYaratAmali } from './amal';
import { BOSH_HOLAT } from './holat';
import { pulKorsat, som, nolSom, qosh, kopaytir } from '@/lib/domain/pul';
import { TanlovModal } from '../../tanlov-modal';
import { Modal } from '../../modal';
import {
  MaterialFormasi,
  BOSH_QIYMATLAR as MATERIAL_BOSH_QIYMATLAR,
} from '../../material/forma';
import { materialModalYaratAmali } from '../../material/amal';
import {
  YetkazibFormasi,
  BOSH_QIYMATLAR as YETKAZIB_BOSH_QIYMATLAR,
} from '../../yetkazib/forma';
import { yetkazibModalYaratAmali } from '../../yetkazib/amal';
import { BIRLIK_TAVSIFI } from '@/lib/domain/birlik-tanlovi';

export interface MaterialTanlovi {
  readonly id: number;
  readonly nom: string;
  readonly hisobTuri: string;
  readonly kirimBirligi: string;
  /**
   * Kartochkadagi odatdagi o'lchamlar — rulon qatorlari SHU qiymat
   * bilan ochiladi.
   *
   * ⚠️ Bu HISOBGA TEGMAYDI: qoldiq baribir omborchi kiritgan
   *    HAQIQIY o'lchamdan hisoblanadi. Bu faqat terishni qisqartiradi.
   */
  readonly odatdagiEniM: string | null;
  readonly odatdagiBoyiM: string | null;

  /**
   * Kartochkadagi kutilayotgan kelish narxi va uning valyutasi.
   *
   * ⚠️ Bu TANNARX EMAS (5.4). Faqat qatorni oldindan to'ldiradi;
   *    haqiqiy tannarx omborchi kiritgan narxdan hisoblanadi.
   */
  readonly kutilayotganNarx: string | null;
  readonly kutilayotganValyuta: string;
}

export interface YetkazibTanlovi {
  readonly id: number;
  readonly nom: string;
  readonly tolovMuddatiKun: number | null;
  readonly valyuta: string;
}

interface BolakQatori {
  eniM: string;
  boyiM: string;
}

interface Qator {
  materialId: number;
  miqdorKirim: string;
  narxBirlik: string;
  defektMiqdor: string;
  defektTuri: 'QAYTARILADI' | 'HISOBDAN_CHIQADI' | null;
  bolaklar: BolakQatori[];
}

const kichik = `${kirishUslubi(false)} py-1.5`;

export function KirimFormasi({
  materiallar: boshMateriallar,
  yetkazuvchilar,
  yetkazibQoshaOladi,
  materialQoshaOladi,
}: {
  materiallar: readonly MaterialTanlovi[];
  yetkazuvchilar: readonly YetkazibTanlovi[];
  yetkazibQoshaOladi: boolean;
  /** §9.4 — server amali ham `material.yarat` ni tekshiradi */
  materialQoshaOladi: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(kirimYaratAmali, BOSH_HOLAT);

  /**
   * ⚠️ Ro'yxat shu yerda o'zgaradi: hujjat ichidan qo'shilgan
   *    material darhol tanlanadigan bo'lishi kerak.
   */
  const [materiallar, setMateriallar] =
    useState<readonly MaterialTanlovi[]>(boshMateriallar);
  const [materialModali, materialModaliniOzgartir] = useState(false);

  const [valyuta, setValyuta] = useState('SOM');
  const [transport, setTransport] = useState('');
  const [bojxona, setBojxona] = useState('');
  const [qatorlar, setQatorlar] = useState<Qator[]>([]);

  const material = (id: number): MaterialTanlovi | undefined =>
    materiallar.find((m) => m.id === id);

  const yangila = (i: number, o: Partial<Qator>): void => {
    setQatorlar((eski) => eski.map((q, j) => (i === j ? { ...q, ...o } : q)));
  };

  /**
   * TZ 7.9 — rulon uchun har birining o'lchami alohida kiritiladi.
   * Miqdor o'zgarsa o'lcham qatorlari ham moslashadi.
   */
  const miqdorniYangila = (i: number, miqdor: string): void => {
    const q = qatorlar[i];
    if (q === undefined) return;

    const m = material(q.materialId);
    const soni = Number(miqdor);

    if (m?.hisobTuri === 'RULON' && Number.isInteger(soni) && soni > 0 && soni <= 50) {
      const bolaklar = Array.from(
        { length: soni },
        (_, k) =>
          q.bolaklar[k] ?? {
            eniM: m.odatdagiEniM ?? '',
            boyiM: m.odatdagiBoyiM ?? '',
          },
      );
      yangila(i, { miqdorKirim: miqdor, bolaklar });
    } else {
      yangila(i, { miqdorKirim: miqdor });
    }
  };

  const jami = useMemo(() => {
    let s = nolSom();
    for (const q of qatorlar) {
      const narx = Number(q.narxBirlik);
      const miqdor = Number(q.miqdorKirim);
      if (Number.isFinite(narx) && Number.isFinite(miqdor) && narx >= 0 && miqdor > 0) {
        s = qosh(s, kopaytir(som(q.narxBirlik), miqdor));
      }
    }
    const t = Number(transport);
    const b = Number(bojxona);
    if (Number.isFinite(t) && t > 0) s = qosh(s, som(transport));
    if (Number.isFinite(b) && b > 0) s = qosh(s, som(bojxona));
    return s;
  }, [qatorlar, transport, bojxona]);

  return (
    <form action={yubor} className="flex flex-col gap-6">
      <input type="hidden" name="qatorlar" value={JSON.stringify(qatorlar)} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {/* TZ 7.9 — ustama past, lekin hujjat SAQLANGAN */}
      {holat.saqlandi && holat.ogohlantirishlar.length > 0 && (
        <div role="alert" className="rounded-maydon bg-belgi-sariq-fon p-4 text-sm ">
          <p className="font-medium text-belgi-sariq">
            Hujjat saqlandi, lekin ustama chegaradan past
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-belgi-sariq">
            {holat.ogohlantirishlar.map((o) => (
              <li key={o.materialNomi}>
                <b>{o.materialNomi}</b> — ustama {o.ustamaFoiz.toFixed(1)}%, chegara {o.chegara}%
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-belgi-sariq">
            Bloklanmadi — mol allaqachon kelgan (7.9). Sotuv narxini ko&apos;rib chiqing.
          </p>
          <Link
            href="/ombor"
            className="mt-3 inline-block rounded-maydon bg-belgi-sariq px-3 py-1.5 text-xs font-medium text-white"
          >
            Omborga o&apos;tish
          </Link>
        </div>
      )}

      <section className="rounded-karta border border-chegara bg-sirt p-5">
        <h2 className="mb-4 text-sm font-semibold">Hujjat</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Maydon nom="raqam" yorliq="Hujjat raqami">
            <input id="raqam" name="raqam" required className={kirishUslubi(false)} />
          </Maydon>

          <Maydon nom="sana" yorliq="Sana">
            <input
              id="sana"
              name="sana"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={kirishUslubi(false)}
            />
          </Maydon>

          <TanlovModal
            nom="yetkazibBeruvchiId"
            yorliq="Yetkazib beruvchi"
            bandlar={yetkazuvchilar}
            boshMatn="— tanlang —"
            yangiYorliq="Yangi yetkazib beruvchi"
            modalSarlavha="Yangi yetkazib beruvchi"
            modalIzoh="Saqlangach hujjatga darhol biriktiriladi"
            qoshaOladi={yetkazibQoshaOladi}
            keng
            forma={(saqlandi, yop) => (
              <YetkazibFormasi
                amal={yetkazibModalYaratAmali}
                qiymatlar={YETKAZIB_BOSH_QIYMATLAR}
                tugmaMatni="Saqlash"
                saqlandi={saqlandi}
                bekor={yop}
              />
            )}
          />

          <Maydon nom="valyuta" yorliq="Valyuta">
            <select
              id="valyuta"
              name="valyuta"
              value={valyuta}
              onChange={(e) => {
                setValyuta(e.target.value);
              }}
              className={kirishUslubi(false)}
            >
              <option value="SOM">so&apos;m</option>
              <option value="USD">dollar</option>
            </select>
          </Maydon>

          {valyuta === 'USD' && (
            <Maydon
              nom="kursSnapshot"
              yorliq="Kurs"
              izoh="tannarx SHU kursda qotadi va keyin o'zgarmaydi (9.6)"
            >
              <input
                id="kursSnapshot"
                name="kursSnapshot"
                inputMode="decimal"
                required
                className={kirishUslubi(false)}
              />
            </Maydon>
          )}

          <Maydon nom="tolovMuddati" yorliq="To'lov muddati" izoh="faqat ogohlantirish uchun (9.4)">
            <input
              id="tolovMuddati"
              name="tolovMuddati"
              type="date"
              className={kirishUslubi(false)}
            />
          </Maydon>
        </div>
      </section>

      {/* ── Qatorlar ── */}
      <section className="rounded-karta border border-chegara bg-sirt p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Materiallar</h2>
          <button
            type="button"
            onClick={() => {
              const birinchi = materiallar[0];
              if (birinchi !== undefined) {
                setQatorlar([
                  ...qatorlar,
                  {
                    materialId: birinchi.id,
                    miqdorKirim: '',
                    narxBirlik: boshlangichNarx(birinchi, valyuta),
                    defektMiqdor: '',
                    defektTuri: null,
                    bolaklar: [],
                  },
                ]);
              }
            }}
            disabled={materiallar.length === 0}
            className="rounded-maydon border border-chegara-quyuq px-2.5 py-1 text-xs hover:bg-fon disabled:opacity-40"
          >
            + qator
          </button>
        </div>

        {/*
          ⚠️ Omborchi kirim yozayotib «bu material ro'yxatda yo'q
             ekan» deb qolardi. Uni qo'shish uchun boshqa sahifaga
             o'tish va yarim to'ldirilgan hujjatni tashlab ketish
             kerak edi.
        */}
        {materialQoshaOladi && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => {
                materialModaliniOzgartir(true);
              }}
              className="fokus rounded-maydon px-1 py-0.5 text-[12px] font-medium text-brend transition-colors hover:underline"
            >
              + Yangi material
            </button>
          </div>
        )}

        <Modal
          ochiq={materialModali}
          yop={() => {
            materialModaliniOzgartir(false);
          }}
          sarlavha="Yangi material"
          izoh="Saqlangach hujjatga qator qo'shishda tanlanadi"
          keng
          bolalar={
            <MaterialFormasi
              amal={materialModalYaratAmali}
              qiymatlar={MATERIAL_BOSH_QIYMATLAR}
              guruhlar={[]}
              guruhQoshaOladi={false}
              joriyKurs=""
              oxirgiKelish={null}
              tugmaMatni="Saqlash"
              saqlandi={(y) => {
                /**
                 * ⚠️ Modal faqat raqam va nomni qaytaradi. O'lchov
                 *    birligi va narxni bilish uchun sahifa qayta
                 *    yuklanishi kerak — shuning uchun qator
                 *    ehtiyotkorlik bilan RULON deb ochiladi va
                 *    omborchi tekshiradi.
                 */
                setMateriallar((r) => [
                  ...r,
                  {
                    id: y.id,
                    nom: y.nom,
                    hisobTuri: BIRLIK_TAVSIFI.RULON.hisobTuri,
                    kirimBirligi: BIRLIK_TAVSIFI.RULON.kirimBirligi,
                    odatdagiEniM: null,
                    odatdagiBoyiM: null,
                    kutilayotganNarx: null,
                    kutilayotganValyuta: 'SOM',
                  },
                ]);
                materialModaliniOzgartir(false);
              }}
              bekor={() => {
                materialModaliniOzgartir(false);
              }}
            />
          }
        />

        {materiallar.length === 0 ? (
          <p className="text-sm text-belgi-sariq">
            Avval material qo&apos;shing — kirim qilinadigan narsa yo&apos;q.
          </p>
        ) : qatorlar.length === 0 ? (
          <p className="text-sm text-matn-kuchsiz">Qator qo&apos;shing.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {qatorlar.map((q, i) => {
              const m = material(q.materialId);
              const rulonmi = m?.hisobTuri === 'RULON';

              return (
                <div key={i} className="rounded-maydon border border-chegara p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_100px_130px_32px]">
                    <select
                      value={q.materialId}
                      onChange={(e) => {
                        const yangiId = Number(e.target.value);
                        const yangiM = materiallar.find((z) => z.id === yangiId);
                        yangila(i, {
                          materialId: yangiId,
                          bolaklar: [],
                          narxBirlik:
                            yangiM === undefined ? '' : boshlangichNarx(yangiM, valyuta),
                        });
                      }}
                      className={kichik}
                    >
                      {materiallar.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nom}
                        </option>
                      ))}
                    </select>

                    <input
                      value={q.miqdorKirim}
                      onChange={(e) => {
                        miqdorniYangila(i, e.target.value);
                      }}
                      placeholder={m?.kirimBirligi ?? 'miqdor'}
                      inputMode="decimal"
                      className={kichik}
                    />

                    <input
                      value={q.narxBirlik}
                      onChange={(e) => {
                        yangila(i, { narxBirlik: e.target.value });
                      }}
                      placeholder="narx / birlik"
                      inputMode="decimal"
                      className={kichik}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setQatorlar(qatorlar.filter((_, j) => j !== i));
                      }}
                      className="rounded-maydon text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                      aria-label="O'chirish"
                    >
                      ✕
                    </button>
                  </div>

                  {/* TZ 7.9 — rulon uchun har birining o'lchami */}
                  {rulonmi && q.bolaklar.length > 0 && (
                    <div className="mt-3 rounded-maydon bg-fon p-3">
                      <p className="mb-2 text-xs text-matn-ikki">
                        Har rulon alohida bo&apos;lak bo&apos;lib tushadi — o&apos;lchamini kiriting
                        (7.9)
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {q.bolaklar.map((b, k) => (
                          <div key={k} className="flex items-center gap-2 text-sm">
                            <span className="w-16 shrink-0 text-xs text-matn-kuchsiz">
                              #{k + 1}
                            </span>
                            <input
                              value={b.eniM}
                              onChange={(e) => {
                                const yangi = [...q.bolaklar];
                                yangi[k] = { ...b, eniM: e.target.value };
                                yangila(i, { bolaklar: yangi });
                              }}
                              placeholder="eni (m)"
                              inputMode="decimal"
                              className={`${kichik} max-w-28`}
                            />
                            <span className="text-matn-kuchsiz">×</span>
                            <input
                              value={b.boyiM}
                              onChange={(e) => {
                                const yangi = [...q.bolaklar];
                                yangi[k] = { ...b, boyiM: e.target.value };
                                yangila(i, { bolaklar: yangi });
                              }}
                              placeholder="bo'yi (m)"
                              inputMode="decimal"
                              className={`${kichik} max-w-28`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TZ 7.9 — defekt ikki yo'ldan biriga ketadi */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-matn-kuchsiz">Defekt:</span>
                    <input
                      value={q.defektMiqdor}
                      onChange={(e) => {
                        yangila(i, { defektMiqdor: e.target.value });
                      }}
                      placeholder="0"
                      inputMode="decimal"
                      className={`${kichik} max-w-20`}
                    />
                    {Number(q.defektMiqdor) > 0 && (
                      <select
                        value={q.defektTuri ?? ''}
                        onChange={(e) => {
                          yangila(i, {
                            defektTuri:
                              e.target.value === ''
                                ? null
                                : (e.target.value as 'QAYTARILADI' | 'HISOBDAN_CHIQADI'),
                          });
                        }}
                        className={`${kichik} max-w-60`}
                      >
                        <option value="">— qayerga? —</option>
                        <option value="QAYTARILADI">Qaytariladi — qarzdan chegiriladi</option>
                        <option value="HISOBDAN_CHIQADI">
                          O&apos;zimizdan brakka — zarar bizda
                        </option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Qo'shimcha xarajatlar (7.9) ── */}
      <section className="rounded-karta border border-chegara bg-sirt p-5">
        <h2 className="mb-1 text-sm font-semibold">Qo&apos;shimcha xarajatlar</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Summa ulushi bo&apos;yicha qatorlarga taqsimlanadi va <b>tannarxga qo&apos;shiladi</b>{' '}
          (7.9). Brak esa taqsimlanmaydi — u alohida zarar bo&apos;lib ko&apos;rinadi.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Maydon nom="transportSumma" yorliq="Transport">
            <input
              id="transportSumma"
              name="transportSumma"
              value={transport}
              onChange={(e) => {
                setTransport(e.target.value);
              }}
              inputMode="decimal"
              className={kirishUslubi(false)}
            />
          </Maydon>
          <Maydon nom="bojxonaSumma" yorliq="Bojxona">
            <input
              id="bojxonaSumma"
              name="bojxonaSumma"
              value={bojxona}
              onChange={(e) => {
                setBojxona(e.target.value);
              }}
              inputMode="decimal"
              className={kirishUslubi(false)}
            />
          </Maydon>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={kutilmoqda || qatorlar.length === 0}
            className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : 'Kirim qilish'}
          </button>
          <Link href="/ombor" className="text-sm text-matn-ikki hover:text-matn">
            Bekor qilish
          </Link>
        </div>

        <div className="text-sm">
          <span className="text-matn-kuchsiz">Jami: </span>
          <span className="raqam font-semibold">{pulKorsat(jami)}</span>
          <span className="ml-1 text-xs text-matn-kuchsiz">{valyuta === 'USD' ? '$' : "so'm"}</span>
        </div>
      </div>
    </form>
  );
}

/**
 * Qator ochilganda narx katagida nima turadi.
 *
 * ⚠️ Kartochkadagi narx faqat hujjat valyutasi bilan MOS bo'lsa
 *    qo'yiladi. Aks holda dollarli narx so'mli hujjatga tushib
 *    ketardi va omborchi buni sezmasligi mumkin edi — tannarx
 *    ming barobar xato chiqardi.
 *
 * ⚠️ Bu shunchaki BOSHLANG'ICH qiymat. Omborchi uni o'zgartiradi
 *    va tannarx doim u kiritgan narxdan hisoblanadi (5.4).
 */
function boshlangichNarx(m: MaterialTanlovi, hujjatValyutasi: string): string {
  if (m.kutilayotganNarx === null) return '';
  if (m.kutilayotganValyuta !== hujjatValyutasi) return '';
  return m.kutilayotganNarx;
}
