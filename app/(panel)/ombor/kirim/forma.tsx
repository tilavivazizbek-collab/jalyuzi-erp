'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../../maydon';
import { kirimYaratAmali } from './amal';
import { BOSH_HOLAT } from './holat';
import { pulKorsat, som, nolSom, qosh, kopaytir } from '@/lib/domain/pul';

export interface MaterialTanlovi {
  readonly id: number;
  readonly nom: string;
  readonly hisobTuri: string;
  readonly kirimBirligi: string;
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
  materiallar,
  yetkazuvchilar,
}: {
  materiallar: readonly MaterialTanlovi[];
  yetkazuvchilar: readonly YetkazibTanlovi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(kirimYaratAmali, BOSH_HOLAT);

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
        (_, k) => q.bolaklar[k] ?? { eniM: '', boyiM: '' },
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
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200">
          {holat.xato}
        </p>
      )}

      {/* TZ 7.9 — ustama past, lekin hujjat SAQLANGAN */}
      {holat.saqlandi && holat.ogohlantirishlar.length > 0 && (
        <div role="alert" className="rounded-lg bg-amber-50 p-4 text-sm ring-1 ring-amber-300">
          <p className="font-medium text-amber-900">
            Hujjat saqlandi, lekin ustama chegaradan past
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-amber-900">
            {holat.ogohlantirishlar.map((o) => (
              <li key={o.materialNomi}>
                <b>{o.materialNomi}</b> — ustama {o.ustamaFoiz.toFixed(1)}%, chegara{' '}
                {o.chegara}%
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            Bloklanmadi — mol allaqachon kelgan (7.9). Sotuv narxini ko&apos;rib chiqing.
          </p>
          <Link
            href="/ombor"
            className="mt-3 inline-block rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Omborga o&apos;tish
          </Link>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
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

          <Maydon nom="yetkazibBeruvchiId" yorliq="Yetkazib beruvchi">
            <select id="yetkazibBeruvchiId" name="yetkazibBeruvchiId" required className={kirishUslubi(false)}>
              <option value="">— tanlang —</option>
              {yetkazuvchilar.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.nom}
                </option>
              ))}
            </select>
          </Maydon>

          <Maydon nom="valyuta" yorliq="Valyuta">
            <select
              id="valyuta"
              name="valyuta"
              value={valyuta}
              onChange={(e) => { setValyuta(e.target.value); }}
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
              <input id="kursSnapshot" name="kursSnapshot" inputMode="decimal" required className={kirishUslubi(false)} />
            </Maydon>
          )}

          <Maydon nom="tolovMuddati" yorliq="To'lov muddati" izoh="faqat ogohlantirish uchun (9.4)">
            <input id="tolovMuddati" name="tolovMuddati" type="date" className={kirishUslubi(false)} />
          </Maydon>
        </div>
      </section>

      {/* ── Qatorlar ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
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
                    narxBirlik: '',
                    defektMiqdor: '',
                    defektTuri: null,
                    bolaklar: [],
                  },
                ]);
              }
            }}
            disabled={materiallar.length === 0}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
          >
            + qator
          </button>
        </div>

        {materiallar.length === 0 ? (
          <p className="text-sm text-amber-700">
            Avval material qo&apos;shing — kirim qilinadigan narsa yo&apos;q.
          </p>
        ) : qatorlar.length === 0 ? (
          <p className="text-sm text-slate-400">Qator qo&apos;shing.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {qatorlar.map((q, i) => {
              const m = material(q.materialId);
              const rulonmi = m?.hisobTuri === 'RULON';

              return (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_100px_130px_32px]">
                    <select
                      value={q.materialId}
                      onChange={(e) => {
                        yangila(i, { materialId: Number(e.target.value), bolaklar: [] });
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
                      onChange={(e) => { miqdorniYangila(i, e.target.value); }}
                      placeholder={m?.kirimBirligi ?? 'miqdor'}
                      inputMode="decimal"
                      className={kichik}
                    />

                    <input
                      value={q.narxBirlik}
                      onChange={(e) => { yangila(i, { narxBirlik: e.target.value }); }}
                      placeholder="narx / birlik"
                      inputMode="decimal"
                      className={kichik}
                    />

                    <button
                      type="button"
                      onClick={() => { setQatorlar(qatorlar.filter((_, j) => j !== i)); }}
                      className="rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700"
                      aria-label="O'chirish"
                    >
                      ✕
                    </button>
                  </div>

                  {/* TZ 7.9 — rulon uchun har birining o'lchami */}
                  {rulonmi && q.bolaklar.length > 0 && (
                    <div className="mt-3 rounded-md bg-slate-50 p-3">
                      <p className="mb-2 text-xs text-slate-600">
                        Har rulon alohida bo&apos;lak bo&apos;lib tushadi — o&apos;lchamini
                        kiriting (7.9)
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {q.bolaklar.map((b, k) => (
                          <div key={k} className="flex items-center gap-2 text-sm">
                            <span className="w-16 shrink-0 text-xs text-slate-500">
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
                            <span className="text-slate-400">×</span>
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
                    <span className="text-xs text-slate-500">Defekt:</span>
                    <input
                      value={q.defektMiqdor}
                      onChange={(e) => { yangila(i, { defektMiqdor: e.target.value }); }}
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
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold">Qo&apos;shimcha xarajatlar</h2>
        <p className="mb-3 text-xs text-slate-500">
          Summa ulushi bo&apos;yicha qatorlarga taqsimlanadi va{' '}
          <b>tannarxga qo&apos;shiladi</b> (7.9). Brak esa taqsimlanmaydi — u
          alohida zarar bo&apos;lib ko&apos;rinadi.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Maydon nom="transportSumma" yorliq="Transport">
            <input
              id="transportSumma"
              name="transportSumma"
              value={transport}
              onChange={(e) => { setTransport(e.target.value); }}
              inputMode="decimal"
              className={kirishUslubi(false)}
            />
          </Maydon>
          <Maydon nom="bojxonaSumma" yorliq="Bojxona">
            <input
              id="bojxonaSumma"
              name="bojxonaSumma"
              value={bojxona}
              onChange={(e) => { setBojxona(e.target.value); }}
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
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : 'Kirim qilish'}
          </button>
          <Link href="/ombor" className="text-sm text-slate-600 hover:text-slate-900">
            Bekor qilish
          </Link>
        </div>

        <div className="text-sm">
          <span className="text-slate-500">Jami: </span>
          <span className="raqam font-semibold">{pulKorsat(jami)}</span>
          <span className="ml-1 text-xs text-slate-400">
            {valyuta === 'USD' ? '$' : "so'm"}
          </span>
        </div>
      </div>
    </form>
  );
}
