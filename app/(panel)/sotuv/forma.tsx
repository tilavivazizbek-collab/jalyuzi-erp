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

import { useActionState, useMemo, useState } from 'react';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { sm, type SarflashBirligi } from '@/lib/domain/birlik';
import {
  nolSom,
  pulKorsat,
  pulMatn,
  qosh,
  som,
  type Som,
} from '@/lib/domain/pul';
import { aksessuarNarxi, matoNarxi, qatorSummasi } from '@/lib/domain/narx';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';
import { mijozOffseti } from '@/lib/domain/mijoz';
import { biznesXatosimi } from '@/lib/xato';
import { Maydon, kirishUslubi } from '../maydon';
import { buyurtmaYaratAmali, turTafsiliAmali } from './amal';
import { BOSH_HOLAT } from './holat';
import type { SotuvMijozi, SotuvTuri } from './malumot';

const BIRLIK_MATNI: Record<SarflashBirligi, string> = {
  KV_M: 'kv.m',
  SM: 'sm',
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
  readonly turId: number;
  readonly turNomi: string;
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly narx: string;
  readonly yuk: unknown;
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
 * ⚠️ `USD` offseti JORIY kursni talab qiladi (6.3). Kurs sotuv ekraniga
 *    hali ulanmagan, shuning uchun dollarli offset qo'llanmaydi va
 *    sotuvchiga ochiq aytiladi — jimgina noto'g'ri narx chiqarishdan
 *    ko'ra ko'rinadigan cheklov yaxshi.
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
}: {
  /** Faqat nom va raqam — yengil ro'yxat (3.2) */
  turlar: readonly { id: number; nom: string }[];
  /** Ekran bo'sh ochilmasligi uchun birinchi turning tafsiloti */
  birinchiTur: SotuvTuri | null;
  filiallar: readonly { id: number; nom: string; bosh: boolean }[];
  ozFilialId: number;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(buyurtmaYaratAmali, BOSH_HOLAT);

  const [turId, turniOzgartir] = useState<number | null>(turlar[0]?.id ?? null);

  /**
   * ⚠️ Tanlangan turning TAFSILOTI. Ilgari hamma tur tafsiloti
   *    birdan kelardi va sahifa og'irlashardi; endi tanlangani
   *    kerak bo'lganda yuklanadi.
   */
  const [tur, turniYukla] = useState<SotuvTuri | null>(birinchiTur);
  const [turYuklanmoqda, yuklanishniOzgartir] = useState(false);
  const [eni, eniniOzgartir] = useState('210');
  const [boyi, boyiniOzgartir] = useState('140');
  const [parametrlar, parametrlarniOzgartir] = useState<Record<string, string>>({});
  const [slotlar, slotlarniOzgartir] = useState<Record<number, SlotTanlovi>>({});
  const [aksessuarlar, aksessuarlarniOzgartir] = useState<
    Record<number, AksessuarTanlovi>
  >({});
  const [savat, savatniOzgartir] = useState<readonly SavatQatori[]>([]);
  const [mijoz, mijozniOzgartir] = useState<SotuvMijozi | null>(null);
  const [tikuvchi, tikuvchiniOzgartir] = useState(ozFilialId);
  const [tayyorlik, tayyorlikniOzgartir] = useState('');
  const [kelishilgan, kelishilganniOzgartir] = useState('');

  const offset = mijozOffseti(mijoz);

  /** TZ 3.5 — har slot uchun formula bo'yicha miqdor. */
  const hisob = useMemo(() => {
    if (tur === null) return null;

    const eniSm = son(eni);
    const boyiSm = son(boyi);
    if (eniSm === null || boyiSm === null || eniSm <= 0 || boyiSm <= 0) return null;

    const qiymatlar: Record<string, number> = {};
    for (const p of tur.parametrlar) {
      const q = son(parametrlar[p.kod] ?? p.standartQiymat ?? '');
      if (q !== null) qiymatlar[p.kod] = q;
    }

    const asos = standartQiymatlar(sm(eniSm), sm(boyiSm), 1, qiymatlar);

    const qatorlar = tur.slotlar.map((s) => {
      const tanlov = slotlar[s.id];
      const material = tanlov
        ? (s.materiallar.find((m) => m.id === Number(tanlov.materialId)) ?? null)
        : null;

      const birlik = (material?.sarflashBirligi ?? 'KV_M') as SarflashBirligi;

      let hisoblangan: number | null = null;
      let xato: string | null = null;
      try {
        hisoblangan = sarflashHisobla(s.formula, asos, birlik);
      } catch (x) {
        xato = biznesXatosimi(x) ? x.message : 'Formulada xato';
      }

      const tuzatilgan = son(tanlov?.tuzatilgan ?? '');
      /**
       * TZ 20.9.3 ning to'liq zanjiri — `lib/domain/narx.ts` da:
       * filial narxi → mijoz offseti → yaxlitlash.
       *
       * Filial narxi SQL da hal qilingan (`COALESCE`), shuning uchun
       * bu yerda `filialNarxi` yo'q.
       */
      const narxMatn =
        material === null || material.narx === null
          ? null
          : pulMatn(
              matoNarxi({
                standart: som(material.narx),
                filialNarxi: null,
                offset,
                kurs: null,
              }),
            );

      /**
       * TZ 3.6 — NARX tuzatilgan songa, ombor hisoblanganiga tayanadi.
       *
       * ⚠️ Summa `lib/domain/pozitsiya-narxi.ts` dagi umumiy
       *    funksiyadan olinadi (§2.2): bot ham AYNAN shuni chaqiradi.
       *    Ikki joyda hisoblansa botda bir narx, saytda boshqa narx
       *    chiqardi.
       */
      const summa =
        narxMatn === null || hisoblangan === null
          ? nolSom()
          : som(
              pozitsiyaNarxiniHisobla({
                eniSm,
                boyiSm,
                soni: 1,
                parametrlar: qiymatlar,
                slotlar: [
                  {
                    nom: s.nom,
                    formula: s.formula,
                    sarflashBirligi: birlik,
                    narx: material?.narx ?? null,
                    tuzatilganMiqdor: tuzatilgan,
                  },
                ],
                aksessuarlar: [],
                offset,
                xizmatHaqi: null,
              }).jami,
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
        slot: s, material, birlik, hisoblangan, tuzatilgan, summa, xato,
        narxMatn, yetarlimi,
      };
    });

    const aksQatorlar = tur.aksessuarlar
      .filter((a) => {
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

        // ⚠️ TZ 6.3 — «Offset FAQAT MATOGA qo'llanadi, AKSESSUARGA TEGMAYDI.»
        const narx = a.narx === null ? null : aksessuarNarxi(som(a.narx), null);

        const summa =
          narx === null
            ? nolSom()
            : qatorSummasi({
                nom: a.nom,
                sarflashBirligi: birlik,
                miqdor: soni as never,
                narx,
              });

        return { aksessuar: a, birlik, soni, summa, narx };
      });

    const xizmat = tur.xizmatHaqi === null ? nolSom() : som(tur.xizmatHaqi);

    const jami = [...qatorlar, ...aksQatorlar].reduce<Som>(
      (y, q) => qosh(y, q.summa),
      xizmat,
    );

    return { qatorlar, aksQatorlar, xizmat, jami, eniSm, boyiSm };
  }, [tur, eni, boyi, parametrlar, slotlar, aksessuarlar, offset]);

  const savatJami = savat.reduce<Som>((y, q) => qosh(y, som(q.narx)), nolSom());

  // Q-03 — yetmaydigan matolar (ogohlantirish, bloklamaydi)
  const yetmaydiganlar = (hisob?.qatorlar ?? []).filter((q) => !q.yetarlimi);

  const savatgaQoshilsinmi =
    hisob !== null &&
    tur !== null &&
    tur.slotlar
      .filter((s) => s.majburiy)
      .every((s) => (slotlar[s.id]?.materialId ?? '') !== '');

  function savatgaQosh(): void {
    if (hisob === null || tur === null) return;

    keyingiKalit += 1;
    const yuk = {
      mahsulotTurId: tur.id,
      eniSm: hisob.eniSm,
      boyiSm: hisob.boyiSm,
      soni: 1,
      narxSnapshot: pulMatn(hisob.jami),
      chegirmaSumma: '0',
      xizmatHaqi: pulMatn(hisob.xizmat),
      // TZ 4.10 — konstruktor holati QOTADI
      formulaSnapshot: {
        tur: tur.nom,
        slotlar: tur.slotlar.map((s) => ({ nom: s.nom, formula: s.formula })),
        parametrlar: tur.parametrlar.map((p) => ({
          kod: p.kod,
          qiymat: parametrlar[p.kod] ?? p.standartQiymat,
        })),
      },
      slotlar: hisob.qatorlar
        .filter((q) => q.material !== null && q.hisoblangan !== null)
        .map((q) => ({
          slotId: q.slot.id,
          materialId: q.material?.id ?? 0,
          hisoblanganMiqdor: String(q.hisoblangan ?? 0),
          tuzatilganMiqdor: q.tuzatilgan === null ? null : String(q.tuzatilgan),
          birlik: q.birlik,
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

    savatniOzgartir((s) => [
      ...s,
      {
        kalit: keyingiKalit,
        turId: tur.id,
        turNomi: tur.nom,
        eniSm: hisob.eniSm,
        boyiSm: hisob.boyiSm,
        narx: pulMatn(hisob.jami),
        yuk,
      },
    ]);

    slotlarniOzgartir({});
    aksessuarlarniOzgartir({});
  }

  const kelishilganSom = son(kelishilgan);
  const chegirma =
    kelishilganSom === null
      ? null
      : Number(pulMatn(savatJami)) - kelishilganSom;

  const yuborilajak = {
    mijozId: mijoz?.id ?? null,
    ishlabChiqaruvchiFilialId: tikuvchi,
    valyuta: 'SOM' as const,
    kursSnapshot: null,
    tayyorlikSana: tayyorlik === '' ? null : tayyorlik,
    qarzgaKetadimi: false,
    pozitsiyalar: savat.map((q) => q.yuk),
  };

  return (
    <form action={yubor} className="flex flex-col gap-6">
      <input type="hidden" name="buyurtma" value={JSON.stringify(yuborilajak)} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {holat.buyurtmaRaqam !== null && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <b>{holat.buyurtmaRaqam}</b> saqlandi.
          {holat.materialgaKutmoqda.length > 0 && (
            <span className="mt-1 block text-amber-900">
              {holat.materialgaKutmoqda.join(', ')}-pozitsiya uchun mos material
              topilmadi — «Materialga kutmoqda» holatida turibdi (Q-03). Kirim
              bo&apos;lgach avtomatik navbatga qaytadi (8.12).
            </span>
          )}
        </div>
      )}

      {/* ── 3.2 · Mahsulot turlari ── */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-700">Mahsulot turi</h2>
        {turlar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Faol mahsulot turi yo&apos;q. Avval konstruktorda tur qo&apos;shing.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
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
                    })
                    .finally(() => {
                      yuklanishniOzgartir(false);
                    });
                }}
                disabled={turYuklanmoqda}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  t.id === turId
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.nom}
              </button>
            ))}
          </div>
        )}
      </section>

      {tur !== null && (
        <>
          {/* ── 3.4 · O'lcham ── */}
          <section className="flex flex-wrap items-end gap-4">
            <Maydon nom="eni" yorliq="Eni (sm)">
              <input
                id="eni"
                value={eni}
                onChange={(e) => {
                  eniniOzgartir(e.target.value);
                }}
                inputMode="numeric"
                className={`${kirishUslubi(false)} w-28`}
              />
            </Maydon>
            <Maydon nom="boyi" yorliq="Bo'yi (sm)">
              <input
                id="boyi"
                value={boyi}
                onChange={(e) => {
                  boyiniOzgartir(e.target.value);
                }}
                inputMode="numeric"
                className={`${kirishUslubi(false)} w-28`}
              />
            </Maydon>

            {tur.parametrlar.map((p) => (
              <Maydon key={p.kod} nom={`p-${p.kod}`} yorliq={`${p.nom} (sm)`}>
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

          {/* ── 3.3 · 3.5 · Slotlar ── */}
          <section>
            <h2 className="mb-1 text-sm font-medium text-slate-700">Matolar</h2>
            <p className="mb-3 text-xs text-slate-500">
              Har slotda faqat o&apos;sha slotga bog&apos;langan matolar chiqadi
              (3.3). Hisoblangan son yonidagi maydonga o&apos;zgacha kelishilsa
              yozing — <b>narx shunga</b>, ombordan esa hisoblangani yechiladi
              (3.6).
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Slot</th>
                    <th className="px-3 py-2.5 font-medium">Mato</th>
                    <th className="px-3 py-2.5 text-right font-medium">Hisoblangan</th>
                    <th className="px-3 py-2.5 font-medium">Kelishilgan</th>
                    <th className="px-3 py-2.5 text-right font-medium">Narx</th>
                    <th className="px-3 py-2.5 text-right font-medium">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(hisob?.qatorlar ?? []).map((q) => (
                    <tr key={q.slot.id}>
                      <td className="px-3 py-2">
                        {q.slot.nom}
                        {!q.slot.majburiy && (
                          <span className="ml-2 text-xs text-slate-400">ixtiyoriy</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={slotlar[q.slot.id]?.materialId ?? ''}
                          onChange={(e) => {
                            slotlarniOzgartir((o) => ({
                              ...o,
                              [q.slot.id]: {
                                materialId: e.target.value,
                                tuzatilgan: o[q.slot.id]?.tuzatilgan ?? '',
                              },
                            }));
                          }}
                          className={`${kirishUslubi(false)} w-56`}
                        >
                          <option value="">— tanlang —</option>
                          {q.slot.materiallar.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nom}
                              {m.sarflashBirligi === 'KV_M'
                                ? ` · ${m.boshKvM.toFixed(2)} kv.m`
                                : ` · ${String(m.boshDona)}`}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="raqam px-3 py-2">
                        {q.xato !== null ? (
                          <span className="text-red-700">{q.xato}</span>
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
                          placeholder={
                            q.hisoblangan === null ? '' : q.hisoblangan.toFixed(2)
                          }
                          className={`${kirishUslubi(false)} w-24`}
                        />
                      </td>
                      <td className="raqam px-3 py-2">
                        {q.narxMatn === null ? '—' : pulKorsat(som(q.narxMatn))}
                      </td>
                      <td className="raqam px-3 py-2 font-medium">
                        {pulKorsat(q.summa)}
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
              <h2 className="mb-1 text-sm font-medium text-slate-700">Aksessuarlar</h2>
              <p className="mb-3 text-xs text-slate-500">
                Komplekt avtomatik tushadi. Sonini qo&apos;lda o&apos;zgartirsangiz
                — o&apos;lcham keyin o&apos;zgarsa ham formula uni{' '}
                <b>ustidan yozmaydi</b> (3.7).
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {(hisob?.aksQatorlar ?? []).map((a) => (
                      <tr key={a.aksessuar.materialId}>
                        <td className="px-3 py-2">{a.aksessuar.nom}</td>
                        <td className="px-3 py-2">
                          <input
                            value={
                              aksessuarlar[a.aksessuar.materialId]?.qoldaKiritildi ===
                              true
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
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {BIRLIK_MATNI[a.birlik]}
                        </td>
                        <td className="raqam px-3 py-2">
                          {a.narx === null ? '—' : pulKorsat(a.narx)}
                        </td>
                        <td className="raqam px-3 py-2 font-medium">
                          {pulKorsat(a.summa)}
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
                            className="text-xs text-slate-400 hover:text-red-700"
                          >
                            olib tashlash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Q-03 · QABUL S3.4 — yetishmovchilik OGOHI, bloklamaydi */}
          {yetmaydiganlar.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <b>Bu mato hozir yetarli emas:</b>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {yetmaydiganlar.map((q) => (
                  <li key={q.slot.id}>
                    {q.material?.nom ?? q.slot.nom} — kerak{' '}
                    {(q.hisoblangan ?? 0).toFixed(2)} {BIRLIK_MATNI[q.birlik]}, bo&apos;sh{' '}
                    {q.birlik === 'KV_M'
                      ? (q.material?.boshKvM ?? 0).toFixed(2)
                      : String(q.material?.boshDona ?? 0)}{' '}
                    {BIRLIK_MATNI[q.birlik]}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                Davom etsangiz buyurtma <b>saqlanadi</b>, pozitsiya «Materialga
                kutmoqda» holatiga tushadi va kirim bo&apos;lgach avtomatik
                navbatga qaytadi (8.12). Yoki yuqoridan <b>boshqa mato</b>
                &nbsp;tanlang.
              </p>
            </div>
          )}

          {/* ── 3.8 · Pozitsiya narxi ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm">
              Pozitsiya narxi:{' '}
              <b className="raqam">{pulKorsat(hisob?.jami ?? nolSom())}</b>
              {tur.xizmatHaqi !== null && Number(tur.xizmatHaqi) > 0 && (
                <span className="ml-2 text-xs text-slate-500">
                  xizmat haqi {pulKorsat(som(tur.xizmatHaqi))} bilan
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={!savatgaQoshilsinmi}
              onClick={savatgaQosh}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Savatga qo&apos;shish
            </button>
          </div>
        </>
      )}

      {/* ── 3.9 · Savat ── */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-700">
          Savat ({savat.length})
        </h2>

        {savat.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Savat bo&apos;sh. Bitta buyurtmada bir nechta xona va mahsulot
            bo&apos;lishi mumkin.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {savat.map((q) => (
                  <tr key={q.kalit}>
                    <td className="px-3 py-2">{q.turNomi}</td>
                    <td className="raqam px-3 py-2">
                      {q.eniSm} × {q.boyiSm} sm
                    </td>
                    <td className="raqam px-3 py-2 font-medium">
                      {pulKorsat(som(q.narx))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          savatniOzgartir((s) => s.filter((x) => x.kalit !== q.kalit));
                        }}
                        className="text-xs text-slate-400 hover:text-red-700"
                      >
                        olib tashlash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 3.10 · 3.11 · 3.13 · 20.4 ── */}
      <section className="grid gap-4 sm:grid-cols-2">
        <MijozTanlash tanlangan={mijoz} ozgartir={mijozniOzgartir} />

        <Maydon
          nom="tikuvchi"
          yorliq="Ishlab chiqaruvchi filial"
          izoh="Material shu filial omborida tekshiriladi (20.4.2)"
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

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <div className="text-sm text-slate-500">Jami</div>
          <div className="raqam text-xl font-semibold">{pulKorsat(savatJami)}</div>
          {chegirma !== null && chegirma !== 0 && (
            <div className="mt-1 text-xs text-amber-800">
              {chegirma > 0
                ? `chegirma ${pulKorsat(som(chegirma.toFixed(2)))}`
                : `qo'shimcha haq ${pulKorsat(som(Math.abs(chegirma).toFixed(2)))}`}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={kutilmoqda || savat.length === 0}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Buyurtmani saqlash'}
        </button>
      </div>
    </form>
  );
}

/** TZ 3.10 — mijoz MAJBURIY EMAS: ko'chadagi tasodifiy xaridor. */
function MijozTanlash({
  tanlangan,
  ozgartir,
}: {
  tanlangan: SotuvMijozi | null;
  ozgartir: (m: SotuvMijozi | null) => void;
}) {
  const [matn, matnniOzgartir] = useState('');
  const [topilgan, topilganniOzgartir] = useState<readonly SotuvMijozi[]>([]);
  const [qidirilmoqda, qidirilmoqdaOzgartir] = useState(false);

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
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <div className="font-medium">{tanlangan.ism}</div>
        <div className="text-xs text-slate-500">{tanlangan.telefon ?? '—'}</div>
        <button
          type="button"
          onClick={() => {
            ozgartir(null);
          }}
          className="mt-2 text-xs text-slate-500 underline underline-offset-2 hover:text-slate-900"
        >
          boshqa mijoz
        </button>
      </div>
    );
  }

  return (
    <Maydon
      nom="mijoz"
      yorliq="Mijoz"
      izoh="Majburiy emas — ko'chadagi xaridorga ham sotiladi (3.10)"
    >
      <input
        id="mijoz"
        value={matn}
        onChange={(e) => {
          void qidir(e.target.value);
        }}
        placeholder="Ism yoki telefon"
        className={kirishUslubi(false)}
      />
      {qidirilmoqda && <span className="text-xs text-slate-400">qidirilmoqda…</span>}
      {topilgan.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {topilgan.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                ozgartir(m);
                matnniOzgartir('');
                topilganniOzgartir([]);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              {m.ism}
              <span className="ml-2 text-xs text-slate-500">{m.telefon ?? ''}</span>
            </button>
          ))}
        </div>
      )}
    </Maydon>
  );
}
