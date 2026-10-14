import { Fragment } from 'react';
import Link from 'next/link';
import { chegaraBirligi } from '@/lib/domain/birlik-tanlovi';
import { nolmi, nolSom, pulKorsat, qosh, som, teng } from '@/lib/domain/pul';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { sahifaKesimi, sahifaRaqami } from '@/lib/domain/sahifa';
import { Sahifalar } from '../sahifalar';
import { ruxsatBormi, tannarxniKoradimi, yigindiQamrov } from '@/lib/ruxsat/tekshir';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import {
  barchaFilialQoldigi,
  filialNomi,
  filialQoldigi,
  qoldiqTarkibi,
  type FilialQoldigi,
  type MaterialQoldigi,
  type QoldiqTarkibi,
} from './malumot';
import {
  QOLDIQ_HOLATLARI,
  QOLDIQ_SARALASH,
  holatSanoqlari,
  omborda,
  qoldiqFiltriniOqi,
  qoldiqniFiltrla,
} from './qoldiq-filtr';

export const dynamic = 'force-dynamic';

/** Bir sahifada nechta material — ko'p bo'lsa sahifa sekinlashadi (2026-10-14) */
const SAHIFA_HAJMI = 100;

/** Q-05 — kv.m faqat KO'RSATISH uchun, sanashda ishlatilmaydi. */
const kvM = (n: number): string => n.toFixed(2);

const GURUH_NOMI: Record<QoldiqTarkibi['guruh'], string> = {
  RULON: 'Butun rulon',
  OCHILGAN: 'Ochilgan rulon',
  KESMA: 'Qoldiq kesma',
};

/**
 * TZ 7.4 — material qatori ostidagi TARKIB.
 *
 * ⚠️ «60 kv.m» degan raqam yetarli emas: u bitta 3 × 20 rulon ham,
 *    oltita 1 × 10 parcha ham bo'lishi mumkin. Ikkinchisi bilan
 *    3 metrlik parda tikib bo'lmaydi. Shuning uchun har o'lcham
 *    soni bilan ko'rsatiladi.
 */
function TarkibQatori({ tarkib }: { tarkib: readonly QoldiqTarkibi[] }) {
  if (tarkib.length === 0) return null;

  return (
    <tr className="bg-fon/70">
      <td colSpan={8} className="px-4 pb-3 pt-1">
        <div className="flex flex-col gap-1">
          {tarkib.map((t) => (
            <div
              key={`${t.guruh}-${String(t.eniM)}-${String(t.boyiM)}`}
              className="flex items-center gap-2 text-xs text-matn-ikki"
            >
              <span className="w-32 shrink-0 text-matn-kuchsiz">{GURUH_NOMI[t.guruh]}</span>
              <span className="raqam w-12 shrink-0">{t.soni} ta</span>
              <span className="raqam">
                {t.eniM.toFixed(2)} × {t.boyiM.toFixed(2)} m
              </span>
              <span className="raqam ml-auto text-matn-kuchsiz">{kvM(t.kvM)}</span>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default async function OmborQoldigi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const kirimQilaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');
  /**
   * ⚠️ TANNARX — faqat ombor hisobotini ko'radiganga (material kartochkasi
   *    bilan bir xil qoida). Sotuvchi bu sahifani ko'radi (TZ 3.3 — qoldiq),
   *    lekin tannarxni ko'rmasligi kerak (11.10).
   */
  const pulniKoradi = tannarxniKoradimi(f);

  /**
   * TZ 20.6.2 — «Bosh filial admini barcha filiallarni bir jadvalda
   * ko'ra oladi.» Qamrov `BARCHA` bo'lmagan odam bu ko'rinishni
   * so'rasa ham o'z filialida qoladi (§9.4 — tekshiruv serverda).
   */
  const barchasiniKoradi = yigindiQamrov(f, 'ombor.qoldiq.kor') === 'BARCHA';
  const sp = await searchParams;
  const filial = typeof sp['filial'] === 'string' ? sp['filial'] : undefined;
  const barchasimi = barchasiniKoradi && filial === 'barcha';

  const nomi = await filialNomi(f.filialId);
  const filiallar = barchasimi ? await barchaFilialQoldigi() : [];

  const qoldiq = barchasimi ? [] : await filialQoldigi(f.filialId);
  // TZ 7.4 — «qancha» yetarli emas, «nimadan iborat» ham kerak
  const tarkib = barchasimi ? [] : await qoldiqTarkibi(f.filialId);
  /**
   * ⚠️ QIDIRUV VA FILTR — ombor auditi 2026-10-06 (2-band). Ro'yxat endi
   *    tugagan matoni ham o'z ichiga oladi; asosiy ko'rinish («Omborda
   *    bor») avvalgidek, tugagan va kam qolganlar o'z tugmasida.
   */
  const filtr = qoldiqFiltriniOqi(sp);
  const sanoq = holatSanoqlari(qoldiq);
  const korinadi = qoldiqniFiltrla(qoldiq, filtr);
  const omborBoshmi = !qoldiq.some(omborda);
  const guruhlar = [
    ...new Map(
      qoldiq
        .filter((q) => q.guruhId !== null && q.guruhNomi !== null)
        .map((q) => [q.guruhId as number, q.guruhNomi as string]),
    ),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const filtrBor = filtr.qidiruv !== '' || filtr.holat !== 'bor' || filtr.guruhId !== null;
  const havola = (holat: string): string => {
    const u = new URLSearchParams();
    if (filtr.qidiruv !== '') u.set('q', filtr.qidiruv);
    if (filtr.guruhId !== null) u.set('guruh', String(filtr.guruhId));
    if (filtr.saralash !== 'nom') u.set('saralash', filtr.saralash);
    if (holat !== 'bor') u.set('holat', holat);
    const t = u.toString();
    return t === '' ? '/ombor' : `/ombor?${t}`;
  };
  const tanla = 'rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px]';
  const eksportHavola = havola(filtr.holat).replace(/^\/ombor/, '/ombor/eksport');

  /** Pul `number` bilan qo'shilmaydi (§3) — `Som` bilan */
  const qiymatJami = (r: readonly MaterialQoldigi[]) =>
    r.reduce((y, q) => qosh(y, som(q.qiymat)), nolSom());
  const koringanQiymat = qiymatJami(korinadi);
  const jamiQiymat = qiymatJami(qoldiq);

  /**
   * ⚠️ SAHIFALASH — 2026-10-14. Katta omborda 4 678 qator 16 MB HTML va
   *    56 soniya edi (SQL 60 ms). Jami va sanoqlar yuqorida BUTUN ro'yxatdan
   *    olingan; bu yerda faqat chiziladigani cheklanadi. Rulonlar avval —
   *    ikki bo'lim sahifalarda aralashmasin.
   */
  const tartibli = [
    ...korinadi.filter((q) => q.hisobTuri === 'RULON'),
    ...korinadi.filter((q) => q.hisobTuri !== 'RULON'),
  ];
  const kesim = sahifaKesimi(tartibli, sahifaRaqami(sp['sahifa']), SAHIFA_HAJMI);
  const sahifaHavolasi = (n: number): string => {
    const asos = havola(filtr.holat);
    return n <= 1 ? asos : `${asos}${asos.includes('?') ? '&' : '?'}sahifa=${String(n)}`;
  };
  const olchamli = kesim.qatorlar.filter((q) => q.hisobTuri === 'RULON');
  const donali = kesim.qatorlar.filter((q) => q.hisobTuri !== 'RULON');
  const tarkibi = new Map<number, QoldiqTarkibi[]>();
  for (const t of tarkib) {
    const r = tarkibi.get(t.materialId);
    if (r === undefined) tarkibi.set(t.materialId, [t]);
    else r.push(t);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Ombor qoldig&apos;i
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {barchasimi ? 'Barcha filiallar' : nomi} · har filialda o&apos;z ombori (Q-25)
          </p>
          {pulniKoradi && !barchasimi && (
            <p className="mt-1 text-sm text-matn-ikki">
              Omborda: <b className="raqam text-matn">{pulKorsat(jamiQiymat)} so&apos;m</b>
              <span className="text-matn-kuchsiz"> tannarxda</span>
              {filtrBor && !teng(koringanQiymat, jamiQiymat) && (
                <span className="text-matn-kuchsiz">
                  {' '}
                  · ko&apos;rsatilganlari {pulKorsat(koringanQiymat)} so&apos;m
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {barchasiniKoradi && (
            <Link
              href={barchasimi ? '/ombor' : '/ombor?filial=barcha'}
              className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
            >
              {barchasimi ? nomi : 'Barcha filiallar'}
            </Link>
          )}
          {/* Ekranda ko'ringan ro'yxatning o'zi tushadi — joriy filtr bilan */}
          {!barchasimi && (
            <a href={eksportHavola} className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon">
              Excel&apos;ga yuklash
            </a>
          )}
          {/* 8-band — kam qolgan va kelguncha tugaydiganlar, yetkazib beruvchi bo'yicha */}
          {!barchasimi && (
            <Link
              href="/ombor/xarid/kerak"
              className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm font-medium text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
            >
              Buyurtma kerak
            </Link>
          )}
          <Link
            href="/ombor/kirim"
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm font-medium text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
          >
            Kirim hujjatlari
          </Link>
          {kirimQilaOladi && (
            <Link
              href="/ombor/kirim/yangi"
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq"
            >
              Yangi kirim
            </Link>
          )}
        </div>
      </div>

      {!barchasimi && (
        <div className="flex flex-col gap-3">
          {/* Tezkor tugmalar — omborchi birinchi shuni ko'radi */}
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {(Object.keys(QOLDIQ_HOLATLARI) as (keyof typeof QOLDIQ_HOLATLARI)[]).map((h) => {
              const son =
                h === 'kam'
                  ? sanoq.kam
                  : h === 'tugagan'
                    ? sanoq.tugagan
                    : h === 'yolda'
                      ? sanoq.yolda
                      : null;
              const faol = filtr.holat === h;
              const xavf = (h === 'kam' || h === 'tugagan') && son !== null && son > 0;
              return (
                <Link
                  key={h}
                  href={havola(h)}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    faol
                      ? 'border-brend bg-brend text-tugma-matn'
                      : xavf
                        ? 'border-belgi-qizil/40 bg-belgi-qizil-fon text-belgi-qizil'
                        : 'border-chegara-quyuq bg-sirt text-matn-ikki hover:bg-fon'
                  }`}
                >
                  {QOLDIQ_HOLATLARI[h]}
                  {son !== null && <b className="ml-1.5">{son}</b>}
                </Link>
              );
            })}
          </div>

          {/* Oddiy GET forma — havolani nusxalasa o'sha ko'rinish ochiladi */}
          <form method="get" className="flex flex-wrap items-center gap-2">
            {filtr.holat !== 'bor' && <input type="hidden" name="holat" value={filtr.holat} />}
            <input
              name="q"
              defaultValue={filtr.qidiruv}
              placeholder="Mato yoki guruh nomi"
              aria-label="Qidirish"
              className={`${tanla} min-w-[220px] flex-1`}
            />
            {guruhlar.length > 0 && (
              <select
                name="guruh"
                defaultValue={filtr.guruhId === null ? '' : String(filtr.guruhId)}
                aria-label="Guruh"
                className={tanla}
              >
                <option value="">Barcha guruhlar</option>
                {guruhlar.map(([id, nom]) => (
                  <option key={id} value={id}>
                    {nom}
                  </option>
                ))}
              </select>
            )}
            <select
              name="saralash"
              defaultValue={filtr.saralash}
              aria-label="Saralash"
              className={tanla}
            >
              {Object.entries(QOLDIQ_SARALASH).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-maydon bg-brend px-3.5 py-1.5 text-[13px] font-medium text-tugma-matn hover:bg-brend-quyuq"
            >
              Ko&apos;rsatish
            </button>
            {filtrBor && (
              <Link href="/ombor" className="text-[13px] text-matn-kuchsiz hover:text-matn">
                Tozalash
              </Link>
            )}
          </form>
        </div>
      )}

      {barchasimi ? (
        <BarchaFiliallar filiallar={filiallar} />
      ) : omborBoshmi && !filtrBor ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Omborda hali material yo&apos;q. Kirim hujjati bilan boshlanadi.
        </p>
      ) : korinadi.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          {filtr.holat === 'kam' || filtr.holat === 'tugagan'
            ? 'Bunday mahsulot yo‘q — hammasi yetarli.'
            : 'Bu filtr bo‘yicha mahsulot topilmadi.'}
        </p>
      ) : (
        <>
          {olchamli.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-matn-ikki">Rulon va qoldiq kesma</h2>
              <p className="mb-3 text-xs text-matn-kuchsiz">
                Qoldiq <b>eni × bo&apos;yi</b> bilan saqlanadi, kv.m hisoblanadi (Q-05). Band —
                pozitsiyaga biriktirilgan, hali kesilmagan (7.3). <b>Ochilgan rulon</b> — enisi
                o&apos;sha, bo&apos;yi kamaygan; buyurtma tushganda tizim avval shuni tugatadi (7.6).
              </p>

              <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                <table className="w-full text-sm">
                  <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                      <th className="px-4 py-2.5 text-right font-medium">Jami</th>
                      <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh</th>
                      <th className="px-4 py-2.5 text-right font-medium">Band</th>
                      <th className="px-4 py-2.5 text-right font-medium">Yo&apos;lda</th>
                      <th className="px-4 py-2.5 text-right font-medium">Bo&apos;lak</th>
                      {pulniKoradi && (
                        <th className="px-4 py-2.5 text-right font-medium">Qiymati</th>
                      )}
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                    {olchamli.map((q) => (
                      <Fragment key={q.materialId}>
                      <tr>
                        <td className="px-4 py-2.5 font-medium">
                          {q.nom}
                          <KamBelgisi q={q} />
                        </td>
                        <td className="raqam px-4 py-2.5">{kvM(q.jamiKvM)}</td>
                        <td className="raqam px-4 py-2.5 text-belgi-yashil">{kvM(q.boshKvM)}</td>
                        <td className="raqam px-4 py-2.5 text-belgi-sariq">
                          {q.bandKvM > 0 ? (
                            kvM(q.bandKvM)
                          ) : (
                            <span className="text-matn-kuchsiz">—</span>
                          )}
                        </td>
                        {/* 20.7.4 — jo'natilgan, hali qabul qilinmagan */}
                        <td className="raqam px-4 py-2.5 text-brend">
                          {q.yoldaKvM > 0 ? (
                            kvM(q.yoldaKvM)
                          ) : (
                            <span className="text-matn-kuchsiz">—</span>
                          )}
                        </td>
                        <td className="raqam px-4 py-2.5 text-matn-kuchsiz">{q.bolakSoni}</td>
                        {pulniKoradi && <QiymatKatagi qiymat={q.qiymat} />}
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/ombor/${String(q.materialId)}`}
                            className="text-matn-ikki hover:text-matn"
                          >
                            Kartochka
                          </Link>
                        </td>
                      </tr>
                      <TarkibQatori tarkib={tarkibi.get(q.materialId) ?? []} />
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-matn-kuchsiz">Barcha son — kv.m</p>
            </section>
          )}

          {donali.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-matn-ikki">Chiziqli va dona mahsulot</h2>
              <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                <table className="w-full text-sm">
                  <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                      <th className="px-4 py-2.5 text-right font-medium">Qoldiq</th>
                      <th className="px-4 py-2.5 font-medium">Birlik</th>
                      {pulniKoradi && (
                        <th className="px-4 py-2.5 text-right font-medium">Qiymati</th>
                      )}
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                    {donali.map((q) => {
                      const birlik = q.sarflashBirligi as SarflashBirligi;
                      // Q-01 — chiziqli material ham, ekran ham METRDA (2026-09-20)
                      const korinish =
                        birlik === 'M'
                          ? `${q.miqdor.toFixed(2)} m`
                          : `${String(q.miqdor)} ${SARFLASH_BIRLIGI_NOMI[birlik]}`;

                      return (
                        <tr key={q.materialId}>
                          <td className="px-4 py-2.5 font-medium">
                            {q.nom}
                            <KamBelgisi q={q} />
                          </td>
                          <td className="raqam px-4 py-2.5">{korinish}</td>
                          <td className="px-4 py-2.5 text-matn-kuchsiz">
                            {birlik === 'M'
                              ? 'metrda saqlanadi (Q-01)'
                              : SARFLASH_BIRLIGI_NOMI[birlik]}
                          </td>
                          {pulniKoradi && <QiymatKatagi qiymat={q.qiymat} />}
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              href={`/ombor/${String(q.materialId)}`}
                              className="text-matn-ikki hover:text-matn"
                            >
                              Kartochka
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <Sahifalar joriy={kesim.joriy} jami={kesim.jami} havola={sahifaHavolasi} />
        </>
      )}
    </div>
  );
}

/** Qoldiqning tannarx qiymati — nol bo'lsa chiziqcha */
function QiymatKatagi({ qiymat }: { qiymat: string }) {
  const p = som(qiymat);
  return (
    <td className="raqam px-4 py-2.5 text-right text-matn-ikki">
      {nolmi(p) ? <span className="text-matn-kuchsiz">—</span> : pulKorsat(p)}
    </td>
  );
}

/**
 * Kam qoldiq / tugagan belgisi — rulonda ham, donada ham BIR XIL
 * (`chegaraBirligidaQoldiq`). Ilgari rulonda belgi umuman yo'q edi,
 * donada esa band qilingani ham qoldiq deb sanalardi.
 */
function KamBelgisi({ q }: { q: MaterialQoldigi }) {
  /**
   * ⚠️ Bo'sh qoldiq yo'q — lekin ikki xil sabab. Rulon omborda turib,
   *    hammasi buyurtmaga band bo'lsa «tugagan» deyish omborchini
   *    chalg'itadi: u rulonni ko'rib turibdi. Sotish uchun ikkalasi bir xil.
   */
  if (q.tugagan) {
    const bandBor = q.bandKvM > 0 || q.bolakSoni > 0;
    return (
      <span
        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          bandBor ? 'bg-belgi-sariq-fon text-belgi-sariq' : 'bg-belgi-qizil-fon text-belgi-qizil'
        }`}
        title={bandBor ? 'Omborda bor, lekin hammasi buyurtmaga band — yangi sotuvga yo‘q' : undefined}
      >
        {bandBor ? 'hammasi band' : 'tugagan'}
      </span>
    );
  }
  if (!q.kamQoldiq || q.kamQoldiqChegaraM === null) return null;
  const birlik = chegaraBirligi(q.sarflashBirligi);
  return (
    <span
      className="ml-2 rounded-full bg-belgi-sariq-fon px-2 py-0.5 text-[11px] font-medium text-belgi-sariq"
      title={`Bo'sh qoldiq ${String(q.chegaraQoldiq)} ${birlik} — chegara ${String(q.kamQoldiqChegaraM)} ${birlik}`}
    >
      kam: {q.chegaraQoldiq} {birlik}
    </span>
  );
}

/**
 * TZ 20.6.2 — barcha filiallar bir jadvalda.
 *
 * ⚠️ «Yo'lda» ustuni alohida turadi (20.7.4): u hech qaysi filial
 *    qoldig'ida emas, lekin korxonada bor — yig'indi shundan
 *    to'g'ri chiqadi (2.1-invariant).
 */
function BarchaFiliallar({ filiallar }: { filiallar: readonly FilialQoldigi[] }) {
  const qatorlar = filiallar.flatMap((f) =>
    f.materiallar
      .filter((m) => m.hisobTuri === 'RULON')
      .map((m) => ({ filialNomi: f.filialNomi, material: m })),
  );

  if (qatorlar.length === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
        Hech bir filialda material yo&apos;q.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
          <tr>
            <th className="px-4 py-2.5 font-medium">Mahsulot</th>
            <th className="px-4 py-2.5 font-medium">Filial</th>
            <th className="px-4 py-2.5 text-right font-medium">Jami</th>
            <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh</th>
            <th className="px-4 py-2.5 text-right font-medium">Band</th>
            <th className="px-4 py-2.5 text-right font-medium">Yo&apos;lda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
          {qatorlar.map((q) => (
            <tr key={`${q.filialNomi}-${String(q.material.materialId)}`}>
              <td className="px-4 py-2.5 font-medium">{q.material.nom}</td>
              <td className="px-4 py-2.5 text-matn-ikki">{q.filialNomi}</td>
              <td className="raqam px-4 py-2.5">{kvM(q.material.jamiKvM)}</td>
              <td className="raqam px-4 py-2.5 text-belgi-yashil">{kvM(q.material.boshKvM)}</td>
              <td className="raqam px-4 py-2.5 text-belgi-sariq">
                {q.material.bandKvM > 0 ? (
                  kvM(q.material.bandKvM)
                ) : (
                  <span className="text-matn-kuchsiz">—</span>
                )}
              </td>
              <td className="raqam px-4 py-2.5 text-brend">
                {q.material.yoldaKvM > 0 ? (
                  kvM(q.material.yoldaKvM)
                ) : (
                  <span className="text-matn-kuchsiz">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
