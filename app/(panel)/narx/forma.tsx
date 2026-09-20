'use client';

/**
 * app/(panel)/narx/forma.tsx — «Narxlar va turlar» · TZ 3.8 · 6.2 · 20.9
 *
 * ⚠️ NEGA BU EKRAN BOR
 *
 *    Egasi (2026-09-20) eski modelni rad etdi: narx materiallardan
 *    yig'ilardi, endi u MAHSULOT TURI va MATO DARAJASI juftligiga
 *    qo'lda qo'yiladi, o'lcham bo'yicha bosqichli.
 *
 * ⚠️ TEKSHIRISH BO'LIMI — saqlashdan OLDIN.
 *
 *    Bosqich jadvalidagi xato jimgina o'tib ketadi va faqat mijoz
 *    oldida chiqadi. Shuning uchun pastda o'lcham kiritiladi va narx
 *    darhol ko'rinadi: bo'shliq, chegarada narx tushishi va yakuniy
 *    summa — hammasi saqlashdan oldin ekranda.
 */

import { useActionState, useMemo, useState } from 'react';
import {
  bosqichlarniTekshir,
  chegaradaNarxTushadimi,
  pozitsiyaQoidaNarxi,
  type Bosqich,
  type HisoblashUsuli,
  type QoshimchaUsuli,
} from '@/lib/domain/narx-qoidasi';
import { kurs as kursYasa, pulKorsat, som } from '@/lib/domain/pul';
import { biznesXatosimi } from '@/lib/xato';
import { Modal } from '../modal';
import { NarxGuruhFormasi } from './guruh-forma';
import { BOSH_HOLAT, type NarxHolati } from './holat';
import { narxSaqlaAmali } from './amal';
import type {
  NarxGuruhQatori,
  QoidaQatori,
  QoshimchaQatori,
  TanlovQatori,
} from './malumot';

const kirish =
  'w-full rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25';
const kichik = `${kirish} py-1.5`;

const USULLAR: readonly { readonly kod: HisoblashUsuli; readonly nom: string }[] = [
  { kod: 'MAYDON', nom: "Maydondan (eni × bo'yi)" },
  { kod: 'ENI', nom: 'Eni bo‘yicha' },
  { kod: "BO'YI", nom: 'Bo‘yi bo‘yicha' },
  { kod: 'DONA', nom: 'Har donaga' },
];

const QOSHIMCHA_USULLARI: readonly { readonly kod: QoshimchaUsuli; readonly nom: string }[] = [
  { kod: 'QATIY', nom: "Qat'iy summa" },
  { kod: 'ENI', nom: 'Eni bo‘yicha' },
  { kod: "BO'YI", nom: 'Bo‘yi bo‘yicha' },
  { kod: 'MAYDON', nom: 'Maydondan' },
];

/** Bosqich birliklari usulga qarab o'zgaradi — jadval sarlavhasida ko'rinadi */
function birlikNomi(usuli: string): string {
  if (usuli === 'MAYDON') return 'kv.m';
  if (usuli === 'DONA') return 'dona';
  return 'metr';
}

interface BosqichHolati {
  dan: string;
  gacha: string;
  narx: string;
  valyuta: 'SOM' | 'USD';
}

interface QoidaHolati {
  narxGuruhId: number;
  narxGuruhNomi: string;
  mijozTuriId: number | null;
  filialId: number | null;
  hisoblashUsuli: HisoblashUsuli;
  bosqichlar: BosqichHolati[];
}

interface QoshimchaHolati {
  nom: string;
  hisoblashUsuli: QoshimchaUsuli;
  narx: string;
  valyuta: 'SOM' | 'USD';
  materialId: number | null;
  almashtirishGuruhId: number | null;
  formula: string;
}

const son = (x: string): number | null => {
  const t = x.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** Ekrandagi qatorni domen turiga aylantiradi — hisoblash uchun */
function domenBosqichlari(b: readonly BosqichHolati[]): Bosqich[] {
  return b.map((x) => ({
    dan: son(x.dan) ?? 0,
    gacha: son(x.gacha),
    narx: x.narx.trim() === '' ? '0' : x.narx.trim(),
    valyuta: x.valyuta,
  }));
}

export function NarxFormasi({
  turId,
  turNomi,
  guruhlar: boshGuruhlar,
  qoidalar: boshQoidalar,
  qoshimchalar: boshQoshimchalar,
  materiallar,
  almashtirishGuruhlari,
  mijozTurlari,
  filiallar,
  kursQiymati,
  ozgartiraOladi,
}: {
  turId: number;
  turNomi: string;
  guruhlar: readonly NarxGuruhQatori[];
  qoidalar: readonly QoidaQatori[];
  qoshimchalar: readonly QoshimchaQatori[];
  materiallar: readonly TanlovQatori[];
  almashtirishGuruhlari: readonly TanlovQatori[];
  mijozTurlari: readonly TanlovQatori[];
  filiallar: readonly TanlovQatori[];
  kursQiymati: string | null;
  ozgartiraOladi: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState<NarxHolati, FormData>(
    narxSaqlaAmali,
    BOSH_HOLAT,
  );

  const [guruhlar, setGuruhlar] = useState<readonly NarxGuruhQatori[]>(boshGuruhlar);
  const [guruhModali, setGuruhModali] = useState(false);

  const [qoidalar, setQoidalar] = useState<QoidaHolati[]>(() =>
    boshQoidalar.map((q) => ({
      narxGuruhId: q.narxGuruhId,
      narxGuruhNomi: q.narxGuruhNomi,
      mijozTuriId: q.mijozTuriId,
      filialId: q.filialId,
      hisoblashUsuli: q.hisoblashUsuli as HisoblashUsuli,
      bosqichlar: q.bosqichlar.map((b) => ({
        dan: b.dan,
        gacha: b.gacha ?? '',
        narx: b.narx,
        valyuta: b.valyuta === 'USD' ? 'USD' : 'SOM',
      })),
    })),
  );

  const [qoshimchalar, setQoshimchalar] = useState<QoshimchaHolati[]>(() =>
    boshQoshimchalar.map((q) => ({
      nom: q.nom,
      hisoblashUsuli: q.hisoblashUsuli as QoshimchaUsuli,
      narx: q.narx,
      valyuta: q.valyuta === 'USD' ? 'USD' : 'SOM',
      materialId: q.materialId,
      almashtirishGuruhId: q.almashtirishGuruhId,
      formula: q.formula ?? '',
    })),
  );

  // ─── Tekshirish kalkulyatori ────────────────────────────────────────────
  const [sinovEni, setSinovEni] = useState('180');
  const [sinovBoyi, setSinovBoyi] = useState('220');
  const [sinovGuruh, setSinovGuruh] = useState<number | null>(
    boshQoidalar[0]?.narxGuruhId ?? null,
  );
  const [tanlangan, setTanlangan] = useState<readonly number[]>([]);

  const kursObyekti = useMemo(
    () => (kursQiymati === null ? null : kursYasa(kursQiymati, new Date(), 'JORIY')),
    [kursQiymati],
  );

  const qoidaYangila = (i: number, o: Partial<QoidaHolati>): void => {
    setQoidalar((eski) => eski.map((q, j) => (i === j ? { ...q, ...o } : q)));
  };

  const bosqichYangila = (qi: number, bi: number, o: Partial<BosqichHolati>): void => {
    setQoidalar((eski) =>
      eski.map((q, j) =>
        qi === j
          ? { ...q, bosqichlar: q.bosqichlar.map((b, k) => (bi === k ? { ...b, ...o } : b)) }
          : q,
      ),
    );
  };

  /** Hali narx qo'yilmagan darajalar — «qo'shish» ro'yxatida chiqadi */
  const bandsizGuruhlar = guruhlar.filter(
    (g) => !qoidalar.some((q) => q.narxGuruhId === g.id),
  );

  // ─── Yuborishga tayyorlash ──────────────────────────────────────────────
  const yuk = {
    qoidalar: qoidalar.map((q) => ({
      narxGuruhId: q.narxGuruhId,
      mijozTuriId: q.mijozTuriId,
      filialId: q.filialId,
      hisoblashUsuli: q.hisoblashUsuli,
      bosqichlar: q.bosqichlar.map((b) => ({
        dan: son(b.dan) ?? 0,
        gacha: son(b.gacha),
        narx: b.narx.trim(),
        valyuta: b.valyuta,
      })),
    })),
    qoshimchalar: qoshimchalar.map((q) => ({
      nom: q.nom.trim(),
      hisoblashUsuli: q.hisoblashUsuli,
      narx: q.narx.trim(),
      valyuta: q.valyuta,
      materialId: q.materialId,
      almashtirishGuruhId: q.almashtirishGuruhId,
      formula: q.formula.trim() === '' ? null : q.formula.trim(),
    })),
  };

  // ─── Hisob natijasi ─────────────────────────────────────────────────────
  const natija = useMemo(() => {
    const q = qoidalar.find((x) => x.narxGuruhId === sinovGuruh);
    if (q === undefined) return { xato: "Daraja tanlanmagan", hisob: null };

    const eni = son(sinovEni);
    const boyi = son(sinovBoyi);
    if (eni === null || boyi === null || eni <= 0 || boyi <= 0) {
      return { xato: "O'lcham kiriting", hisob: null };
    }

    try {
      const hisob = pozitsiyaQoidaNarxi({
        qoida: { hisoblashUsuli: q.hisoblashUsuli, bosqichlar: domenBosqichlari(q.bosqichlar) },
        eniSm: eni,
        boyiSm: boyi,
        qoshimchalar: qoshimchalar
          .filter((_, i) => tanlangan.includes(i))
          .map((x) => ({
            nom: x.nom,
            hisoblashUsuli: x.hisoblashUsuli,
            narx: x.narx.trim() === '' ? '0' : x.narx.trim(),
            valyuta: x.valyuta,
          })),
        offset: null,
        kurs: kursObyekti,
      });
      return { xato: null, hisob };
    } catch (x) {
      return { xato: biznesXatosimi(x) ? x.message : 'Hisoblab bo‘lmadi', hisob: null };
    }
  }, [qoidalar, qoshimchalar, sinovEni, sinovBoyi, sinovGuruh, tanlangan, kursObyekti]);

  return (
    <form action={yubor} className="flex flex-col gap-5">
      <input type="hidden" name="mahsulotTurId" value={turId} />
      <input type="hidden" name="qoidalar" value={JSON.stringify(yuk.qoidalar)} />
      <input type="hidden" name="qoshimchalar" value={JSON.stringify(yuk.qoshimchalar)} />

      {holat.xato !== null && (
        <div
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          <p className="font-medium">{holat.xato}</p>
          {holat.nuqsonlar.length > 0 && (
            <ul className="mt-1.5 list-disc pl-5">
              {holat.nuqsonlar.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {holat.saqlandi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
          Saqlandi — yangi narx endi sotuvda ishlaydi. Eski buyurtmalar o‘zgarmaydi.
        </p>
      )}

      {/* ─── Narx jadvali ─────────────────────────────────────────────── */}
      <section className="rounded-maydon border border-chegara p-4">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-matn">Narx jadvali</h2>
            <p className="mt-0.5 text-[12px] text-matn-ikki">
              {turNomi} — har mato darajasi uchun alohida
            </p>
          </div>
          {ozgartiraOladi && bandsizGuruhlar.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const g = guruhlar.find((x) => x.id === Number(e.target.value));
                if (g === undefined) return;
                setQoidalar((eski) => [
                  ...eski,
                  {
                    narxGuruhId: g.id,
                    narxGuruhNomi: g.nom,
                    mijozTuriId: null,
                    filialId: null,
                    hisoblashUsuli: 'MAYDON',
                    bosqichlar: [{ dan: '0', gacha: '', narx: '', valyuta: 'SOM' }],
                  },
                ]);
              }}
              aria-label="Daraja qo‘shish"
              className={`${kichik} w-[200px]`}
            >
              <option value="">+ daraja qo‘shish</option>
              {bandsizGuruhlar.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
          )}
        </div>

        {qoidalar.length === 0 ? (
          <p className="text-sm text-matn-kuchsiz">
            Hali narx qo‘yilmagan. Yuqoridagi ro‘yxatdan mato darajasini tanlang
            {guruhlar.length === 0 && ' — avval daraja yarating'}.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {qoidalar.map((q, qi) => {
              const domen = domenBosqichlari(q.bosqichlar);
              const nuqsonlar = bosqichlarniTekshir(domen);
              const tushish = chegaradaNarxTushadimi(
                { hisoblashUsuli: q.hisoblashUsuli, bosqichlar: domen },
                kursObyekti,
              );
              const birlik = birlikNomi(q.hisoblashUsuli);

              return (
                <div key={q.narxGuruhId} className="rounded-maydon border border-chegara p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-matn">{q.narxGuruhNomi}</span>

                    <select
                      value={q.hisoblashUsuli}
                      onChange={(e) => {
                        qoidaYangila(qi, { hisoblashUsuli: e.target.value as HisoblashUsuli });
                      }}
                      aria-label="Hisoblash usuli"
                      className={`${kichik} w-[210px]`}
                      disabled={!ozgartiraOladi}
                    >
                      {USULLAR.map((u) => (
                        <option key={u.kod} value={u.kod}>
                          {u.nom}
                        </option>
                      ))}
                    </select>

                    {/* TZ 6.2 · 20.9 — bo'sh qolsa hammaga tegishli */}
                    <select
                      value={q.mijozTuriId ?? ''}
                      onChange={(e) => {
                        qoidaYangila(qi, { mijozTuriId: son(e.target.value) });
                      }}
                      aria-label="Mijoz turi"
                      className={`${kichik} w-[150px]`}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="">Hamma mijozga</option>
                      {mijozTurlari.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>

                    <select
                      value={q.filialId ?? ''}
                      onChange={(e) => {
                        qoidaYangila(qi, { filialId: son(e.target.value) });
                      }}
                      aria-label="Filial"
                      className={`${kichik} w-[150px]`}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="">Hamma filialga</option>
                      {filiallar.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom}
                        </option>
                      ))}
                    </select>

                    {ozgartiraOladi && (
                      <button
                        type="button"
                        onClick={() => {
                          setQoidalar((eski) => eski.filter((_, j) => j !== qi));
                        }}
                        className="ml-auto text-[12px] text-belgi-qizil hover:underline"
                      >
                        Darajani olib tashlash
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_1fr_1.2fr_90px_32px] gap-2 text-[11px] text-matn-kuchsiz">
                    <span>dan ({birlik})</span>
                    <span>gacha ({birlik})</span>
                    <span>narx</span>
                    <span>valyuta</span>
                    <span />
                  </div>

                  {q.bosqichlar.map((b, bi) => (
                    <div
                      key={bi}
                      className="mt-1 grid grid-cols-[1fr_1fr_1.2fr_90px_32px] items-center gap-2"
                    >
                      <input
                        value={b.dan}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { dan: e.target.value });
                        }}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Bosqich boshi"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      />
                      <input
                        value={b.gacha}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { gacha: e.target.value });
                        }}
                        inputMode="decimal"
                        placeholder="cheksiz"
                        aria-label="Bosqich oxiri"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      />
                      <input
                        value={b.narx}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { narx: e.target.value });
                        }}
                        inputMode="decimal"
                        placeholder="8"
                        aria-label="Narx"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      />
                      <select
                        value={b.valyuta}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { valyuta: e.target.value as 'SOM' | 'USD' });
                        }}
                        aria-label="Valyuta"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      >
                        <option value="SOM">so‘m</option>
                        <option value="USD">$</option>
                      </select>
                      {ozgartiraOladi && (
                        <button
                          type="button"
                          onClick={() => {
                            setQoidalar((eski) =>
                              eski.map((x, j) =>
                                qi === j
                                  ? { ...x, bosqichlar: x.bosqichlar.filter((_, k) => k !== bi) }
                                  : x,
                              ),
                            );
                          }}
                          aria-label="Bosqichni o‘chirish"
                          className="text-matn-kuchsiz hover:text-belgi-qizil"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {ozgartiraOladi && (
                    <button
                      type="button"
                      onClick={() => {
                        setQoidalar((eski) =>
                          eski.map((x, j) =>
                            qi === j
                              ? {
                                  ...x,
                                  bosqichlar: [
                                    ...x.bosqichlar,
                                    { dan: '', gacha: '', narx: '', valyuta: 'SOM' },
                                  ],
                                }
                              : x,
                          ),
                        );
                      }}
                      className="mt-2 text-[12px] text-brend hover:underline"
                    >
                      + bosqich
                    </button>
                  )}

                  {/* Saqlashdan OLDIN ko'rinadigan nuqsonlar */}
                  {nuqsonlar.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-[11px] text-belgi-qizil">
                      {nuqsonlar.map((n, i) => (
                        <li key={i}>
                          {n.tur === 'BOSQICH_YOQ' && 'Birorta bosqich kiritilmagan'}
                          {n.tur === 'BOSHLANISH' &&
                            `${String(n.dan)} ${birlik} dan kichigiga narx yo‘q`}
                          {n.tur === 'BOSHLIQ' &&
                            `${String(n.dan)}–${String(n.gacha)} ${birlik} oralig‘iga narx yo‘q`}
                          {n.tur === 'USTMA_UST' &&
                            `${String(n.dan)}–${String(n.gacha)} ${birlik} ikki marta yozilgan`}
                          {n.tur === 'CHEKSIZ_YOQ' &&
                            `${String(n.gacha)} ${birlik} dan kattasiga narx yo‘q — oxirgi bosqichning «gacha» sini bo‘sh qoldiring`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/*
                    ⚠️ BLOKLAMAYDI — egasi bosqichlarni qo'lda kiritadi va
                       stavka pasayishi uning qarori bo'lishi mumkin.
                  */}
                  {tushish.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-[11px] text-belgi-sariq">
                      {tushish.map((t, i) => (
                        <li key={i}>
                          {String(t.chegara)} {birlik} chegarasida narx tushadi:{' '}
                          {pulKorsat(som(t.oldin))} → {pulKorsat(som(t.keyin))} so‘m. Ya‘ni
                          kattaroq mahsulot arzonroq chiqadi.
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ozgartiraOladi && (
          <button
            type="button"
            onClick={() => {
              setGuruhModali(true);
            }}
            className="mt-3 text-[12px] text-brend hover:underline"
          >
            + yangi mato darajasi
          </button>
        )}
      </section>

      {/* ─── Qo'shimchalar ────────────────────────────────────────────── */}
      <section className="rounded-maydon border border-chegara p-4">
        <h2 className="text-[15px] font-semibold text-matn">Qo‘shimchalar</h2>
        <p className="mt-0.5 mb-3 text-[12px] text-matn-ikki">
          Mijoz tanlashi mumkin bo‘lgan narsalar — «usti shabalik», «o‘rnatish».
          Material biriktirilsa ombordan ham yechiladi.
        </p>

        {qoshimchalar.length === 0 ? (
          <p className="text-sm text-matn-kuchsiz">Qo‘shimcha kiritilmagan.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {qoshimchalar.map((q, i) => {
              const yangila = (o: Partial<QoshimchaHolati>): void => {
                setQoshimchalar((eski) => eski.map((x, j) => (i === j ? { ...x, ...o } : x)));
              };
              const materialBor = q.materialId !== null || q.almashtirishGuruhId !== null;

              return (
                <div key={i} className="rounded-maydon border border-chegara p-3">
                  <div className="grid gap-2 sm:grid-cols-[1.4fr_150px_1fr_90px_32px] sm:items-center">
                    <input
                      value={q.nom}
                      onChange={(e) => {
                        yangila({ nom: e.target.value });
                      }}
                      placeholder="Usti shabalik"
                      aria-label="Qo‘shimcha nomi"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    />
                    <select
                      value={q.hisoblashUsuli}
                      onChange={(e) => {
                        yangila({ hisoblashUsuli: e.target.value as QoshimchaUsuli });
                      }}
                      aria-label="Qo‘shimcha usuli"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    >
                      {QOSHIMCHA_USULLARI.map((u) => (
                        <option key={u.kod} value={u.kod}>
                          {u.nom}
                        </option>
                      ))}
                    </select>
                    <input
                      value={q.narx}
                      onChange={(e) => {
                        yangila({ narx: e.target.value });
                      }}
                      inputMode="decimal"
                      placeholder="80000"
                      aria-label="Qo‘shimcha narxi"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    />
                    <select
                      value={q.valyuta}
                      onChange={(e) => {
                        yangila({ valyuta: e.target.value as 'SOM' | 'USD' });
                      }}
                      aria-label="Qo‘shimcha valyutasi"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="SOM">so‘m</option>
                      <option value="USD">$</option>
                    </select>
                    {ozgartiraOladi && (
                      <button
                        type="button"
                        onClick={() => {
                          setQoshimchalar((eski) => eski.filter((_, j) => j !== i));
                          setTanlangan((t) => t.filter((x) => x !== i));
                        }}
                        aria-label="Qo‘shimchani o‘chirish"
                        className="text-matn-kuchsiz hover:text-belgi-qizil"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                    <select
                      value={
                        q.materialId !== null
                          ? `M:${String(q.materialId)}`
                          : q.almashtirishGuruhId !== null
                            ? `G:${String(q.almashtirishGuruhId)}`
                            : ''
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          yangila({ materialId: null, almashtirishGuruhId: null, formula: '' });
                        } else if (v.startsWith('M')) {
                          yangila({ materialId: Number(v.slice(2)), almashtirishGuruhId: null });
                        } else {
                          yangila({ almashtirishGuruhId: Number(v.slice(2)), materialId: null });
                        }
                      }}
                      aria-label="Qo‘shimcha materiali"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="">Material yo‘q — faqat narx</option>
                      <optgroup label="Guruh (sotuvchi tanlaydi)">
                        {almashtirishGuruhlari.map((g) => (
                          <option key={`G${String(g.id)}`} value={`G:${String(g.id)}`}>
                            {g.nom}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Aniq material">
                        {materiallar.map((m) => (
                          <option key={`M${String(m.id)}`} value={`M:${String(m.id)}`}>
                            {m.nom}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    {materialBor && (
                      <input
                        value={q.formula}
                        onChange={(e) => {
                          yangila({ formula: e.target.value });
                        }}
                        placeholder="ENI * 40"
                        aria-label="Sarf formulasi"
                        className={`${kichik} font-mono`}
                        disabled={!ozgartiraOladi}
                      />
                    )}
                  </div>

                  {materialBor && (
                    <p className="mt-1.5 text-[11px] text-matn-kuchsiz">
                      Ombordan yechiladi. Ishlatiladi: <code>ENI</code>,{' '}
                      <code>BO&apos;YI</code>, <code>MAYDON</code>. O&apos;lchamlar{' '}
                      <b>santimetrda</b>.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ozgartiraOladi && (
          <button
            type="button"
            onClick={() => {
              setQoshimchalar((eski) => [
                ...eski,
                {
                  nom: '',
                  hisoblashUsuli: 'QATIY',
                  narx: '',
                  valyuta: 'SOM',
                  materialId: null,
                  almashtirishGuruhId: null,
                  formula: '',
                },
              ]);
            }}
            className="mt-3 text-[12px] text-brend hover:underline"
          >
            + qo‘shimcha
          </button>
        )}
      </section>

      {/* ─── Tekshirish ───────────────────────────────────────────────── */}
      <section className="rounded-maydon border border-chegara bg-fon-ikki p-4">
        <h2 className="text-[15px] font-semibold text-matn">Tekshirish</h2>
        <p className="mt-0.5 mb-3 text-[12px] text-matn-ikki">
          Saqlashdan oldin narxni shu yerda ko‘ring
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={sinovEni}
            onChange={(e) => {
              setSinovEni(e.target.value);
            }}
            inputMode="numeric"
            aria-label="Sinov eni"
            className={`${kichik} w-[90px]`}
          />
          <span className="text-sm text-matn-kuchsiz">×</span>
          <input
            value={sinovBoyi}
            onChange={(e) => {
              setSinovBoyi(e.target.value);
            }}
            inputMode="numeric"
            aria-label="Sinov bo‘yi"
            className={`${kichik} w-[90px]`}
          />
          <span className="text-sm text-matn-kuchsiz">sm</span>

          <select
            value={sinovGuruh ?? ''}
            onChange={(e) => {
              setSinovGuruh(son(e.target.value));
            }}
            aria-label="Sinov darajasi"
            className={`${kichik} w-[180px]`}
          >
            <option value="">— daraja —</option>
            {qoidalar.map((q) => (
              <option key={q.narxGuruhId} value={q.narxGuruhId}>
                {q.narxGuruhNomi}
              </option>
            ))}
          </select>
        </div>

        {qoshimchalar.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {qoshimchalar.map((q, i) => (
              <label key={i} className="flex items-center gap-1.5 text-[12px] text-matn-ikki">
                <input
                  type="checkbox"
                  checked={tanlangan.includes(i)}
                  onChange={(e) => {
                    setTanlangan((t) =>
                      e.target.checked ? [...t, i] : t.filter((x) => x !== i),
                    );
                  }}
                />
                {q.nom === '' ? `Qo‘shimcha ${String(i + 1)}` : q.nom}
              </label>
            ))}
          </div>
        )}

        <div className="mt-3 border-t border-chegara pt-3 text-sm">
          {natija.hisob === null ? (
            <p className="text-belgi-qizil">{natija.xato}</p>
          ) : (
            <dl className="flex flex-col gap-1">
              <div className="flex justify-between">
                <dt className="text-matn-ikki">O‘lchov</dt>
                <dd className="tabular-nums">{natija.hisob.olchov.toFixed(4)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-matn-ikki">Bosqich</dt>
                <dd className="tabular-nums">
                  {natija.hisob.bosqich === null
                    ? '—'
                    : `${natija.hisob.bosqich.narx} ${natija.hisob.bosqich.valyuta === 'USD' ? '$' : "so'm"}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-matn-ikki">Asosiy narx</dt>
                <dd className="tabular-nums">{pulKorsat(som(natija.hisob.asosiy))} so‘m</dd>
              </div>
              {natija.hisob.qoshimchalar.map((q, i) => (
                <div key={i} className="flex justify-between">
                  <dt className="text-matn-ikki">{q.nom}</dt>
                  <dd className="tabular-nums">{pulKorsat(som(q.summa))} so‘m</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-chegara pt-1 font-semibold">
                <dt>Jami</dt>
                <dd className="tabular-nums">{pulKorsat(som(natija.hisob.jami))} so‘m</dd>
              </div>
            </dl>
          )}

          {kursQiymati === null && (
            <p className="mt-2 text-[11px] text-belgi-sariq">
              Bugungi kurs kiritilmagan — dollardagi narx hisoblanmaydi.
            </p>
          )}
        </div>
      </section>

      {ozgartiraOladi && (
        <div>
          <button
            type="submit"
            disabled={kutilmoqda}
            className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      )}

      <Modal
        ochiq={guruhModali}
        yop={() => {
          setGuruhModali(false);
        }}
        sarlavha="Yangi mato darajasi"
        izoh="Narx jadvali shu darajalar bo‘yicha to‘ldiriladi"
        bolalar={
          <NarxGuruhFormasi
            saqlandi={(y) => {
              setGuruhlar((eski) => [...eski, { id: y.id, nom: y.nom, materialSoni: 0 }]);
              setGuruhModali(false);
            }}
            bekor={() => {
              setGuruhModali(false);
            }}
          />
        }
      />
    </form>
  );
}
