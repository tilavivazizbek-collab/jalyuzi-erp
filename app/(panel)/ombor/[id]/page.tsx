import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { BekorTugmasi } from '../chiqim/bekor';
import { TuzatishTugmasi } from './tuzatish-tugma';
import { pulKorsat, som } from '@/lib/domain/pul';
import { daraja, type Chegaralar } from '@/lib/domain/kesish';
import { harakatNomi, miqdorMatni } from '@/lib/domain/ombor-harakat';
import { kamQoldiqmi } from '@/lib/domain/birlik-tanlovi';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import {
  kutayotganBuyurtmalar,
  materialTezligi,
  materialUstamasi,
  materialYetkazuvchilari,
  tannarxDinamikasi,
  yoldaMiqdori,
  type KutayotganPozitsiya,
  type MaterialTezligi,
  type MaterialUstamasi,
  type MaterialYetkazuvchisi,
  type TannarxNuqtasi,
} from './malumot';
import {
  materialBolaklari,
  materialHarakatlari,
  materialSarlavhasi,
  materialXulosasi,
  oxirgiSanoq,
  type BolakQatori,
  type MaterialXulosasi,
} from '../malumot';

export const dynamic = 'force-dynamic';

const HOLAT_NOMI: Record<string, string> = {
  BOSH: "bo'sh",
  BAND: 'band',
  YOLDA: "yo'lda",
  ISHLATILDI: 'ishlatilgan',
  BRAK: 'brak',
  CHIQINDI: 'chiqindi',
};


/**
 * TZ 7.5 — daraja ENI bo'yicha, maydon bo'yicha emas.
 *
 * ⚠️ Chegara MATERIALDAN keladi, qotirib qo'yilmaydi. Ilgari bu
 *    yerda `{ yaroqsizM: null, kamIshlatiladiganM: null }` turardi
 *    va ekran har doim standart 0.5 / 1.0 ni ishlatardi. Materialga
 *    boshqa raqam yozilsa, kesish unga bo'ysunar, ekran esa yo'q.
 */
function darajaBelgisi(b: BolakQatori, chegaralar: Chegaralar): string | null {
  if (b.turi !== 'OSTATKA' || b.eniM === null) return null;
  const d = daraja(b.eniM, chegaralar);
  if (d === 'YAROQSIZ') return 'yaroqsiz';
  if (d === 'KAM_ISHLATILADIGAN') return 'kam ishlatiladigan';
  return null;
}


export default async function MaterialKartochkasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  // TZ 14.6 — omborchida kirim bor, chiqim yo'q bo'lishi mumkin
  const chiqaraOladi = ruxsatBormi(f, 'ombor.chiqim');
  const boshlangichQilaOladi = ruxsatBormi(f, 'ombor.boshlangich');
  // TZ 15.1 — qoldiqni to'g'rilash faqat adminda
  const tuzataOladi = ruxsatBormi(f, 'ombor.tuzatish');

  /**
   * ⚠️ TZ 11.10 — «Sotuvchiga TANNARX, FOYDA va ish haqi
   *    KO'RSATILMAYDI.»
   *
   *    Sotuvchida `ombor.qoldiq.kor` BOR (3.3 — sotuv ekranida
   *    qoldiq ko'rinishi kerak), lekin `hisobot.ombor.kor` YO'Q —
   *    urug'da ataylab berilmagan. Pul ustunlari shu ikkinchisiga
   *    bog'lanadi.
   *
   *    2026-09-05: shu paytgacha kartochka HAR BO'LAKNING tannarxini
   *    va harakatlar summasini hammaga ko'rsatib turardi.
   */
  const pulniKoradi = ruxsatBormi(f, 'hisobot.ombor.kor');
  const kirimQilaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');

  const { id } = await params;
  const materialId = Number(id);
  if (!Number.isSafeInteger(materialId) || materialId <= 0) notFound();

  const sarlavha = await materialSarlavhasi(materialId);
  if (sarlavha === null) notFound();

  // TZ 7.5 — chegaralar MATERIALDAN, standart faqat bo'sh qolganda
  const chegaralar: Chegaralar = {
    yaroqsizM: sarlavha.yaroqsizM,
    kamIshlatiladiganM: sarlavha.kamIshlatiladiganM,
  };

  const [tezlik, kutayotgan, tannarxlar, ustama, yetkazuvchilar, yolda] =
    await Promise.all([
      materialTezligi(materialId, f.filialId),
      kutayotganBuyurtmalar(materialId, f.filialId),
      tannarxDinamikasi(materialId),
      pulniKoradi
        ? materialUstamasi(materialId, f.filialId)
        : Promise.resolve(null),
      materialYetkazuvchilari(materialId),
      yoldaMiqdori(materialId, f.filialId),
    ]);

  const [bolaklar, harakatlar, sanoq, xulosa] = await Promise.all([
    materialBolaklari(materialId, f.filialId),
    materialHarakatlari(materialId, f.filialId),
    oxirgiSanoq(materialId, f.filialId),
    materialXulosasi(materialId, f.filialId),
  ]);

  const olchamli = sarlavha.hisobTuri === 'RULON';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ombor qoldig&apos;i
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          {sarlavha.nom}
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {bolaklar.length} ta bo&apos;lak · filial #{f.filialId}
          {/* 20.7.4 — jo'natilgan, hali qabul qilinmagan */}
          {yolda.bolakSoni > 0 &&
            ` · yo'lda ${son(yolda.miqdor)} (${String(yolda.bolakSoni)} bo'lak)`}
          {/* TZ 15.1 — oxirgi sanoq kartochkada ko'rinadi */}
          {sanoq !== null && ` · oxirgi sanoq ${sanoq.sana} (${sanoq.kim})`}
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          {boshlangichQilaOladi && bolaklar.length === 0 && (
            <Link
              href={`/ombor/boshlangich/${String(materialId)}`}
              className="inline-block rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
            >
              Boshlang&apos;ich qoldiq kiritish
            </Link>
          )}

          {/*
            ⚠️ Faqat ADMIN. Miqdorni to'g'rilash — omborda turgan
               mahsulotning pul qiymatiga tegadi, shuning uchun
               tezkor yo'l nazoratsiz qolmaydi (15.1).
          */}
          {tuzataOladi && bolaklar.length > 0 && (
            <TuzatishTugmasi materialId={materialId} />
          )}

          {/* Xarid shu yerdan boshlanadi — material allaqachon ma'lum */}
          {kirimQilaOladi && (
            <Link
              href={`/ombor/kirim/yangi?material=${String(materialId)}`}
              className="inline-block rounded-maydon bg-brend px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
            >
              Kirim qilish
            </Link>
          )}
        </div>
      </div>

      {/* ── Nima qilish kerak ── */}
      <NimaQilishKerak
        tezlik={tezlik}
        kutayotgan={kutayotgan}
        ustama={ustama}
      />

      {/* ── Qoldiq tarkibi (7.11) ── */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qoldiq tarkibi</h2>
        {bolaklar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Bo&apos;lak yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kod</th>
                  <th className="px-4 py-2.5 font-medium">Turi</th>
                  <th className="px-4 py-2.5 font-medium">{olchamli ? "O'lcham" : 'Miqdor'}</th>
                  <th className="px-4 py-2.5 font-medium">Holat</th>
                  {pulniKoradi && (
                    <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                  )}
                  <th className="px-4 py-2.5 font-medium">Kirim</th>
                  {chiqaraOladi && <th className="px-4 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {bolaklar.map((b) => {
                  const belgi = darajaBelgisi(b, chegaralar);
                  return (
                    <tr key={b.id} className={b.holat === 'BOSH' ? '' : 'text-matn-kuchsiz'}>
                      <td className="px-4 py-2.5 font-mono text-xs">{b.kod}</td>
                      <td className="px-4 py-2.5">
                        {b.turi === 'RULON'
                          ? 'Rulon'
                          : b.turi === 'OSTATKA'
                            ? 'Qoldiq kesma'
                            : 'Dona'}
                      </td>
                      <td className="raqam px-4 py-2.5">
                        {b.eniM !== null && b.boyiM !== null
                          ? `${b.eniM.toFixed(2)} × ${b.boyiM.toFixed(2)} m`
                          : b.miqdor !== null
                            ? String(b.miqdor)
                            : '—'}
                        {belgi !== null && (
                          <span className="ml-2 text-xs text-belgi-sariq">{belgi}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            b.holat === 'BOSH'
                              ? 'text-belgi-yashil'
                              : b.holat === 'BAND'
                                ? 'text-belgi-sariq'
                                : 'text-matn-kuchsiz'
                          }
                        >
                          {HOLAT_NOMI[b.holat] ?? b.holat}
                        </span>
                      </td>
                      {pulniKoradi && (
                        <td className="raqam px-4 py-2.5">{pulKorsat(som(b.tannarx))}</td>
                      )}
                      <td className="px-4 py-2.5 text-xs text-matn-kuchsiz">
                        {b.kirimRaqam ?? '—'}
                      </td>
                      {chiqaraOladi && (
                        <td className="px-4 py-2.5 text-right">
                          {b.holat === 'BOSH' || b.holat === 'BAND' ? (
                            <Link
                              href={`/ombor/chiqim/${String(b.id)}`}
                              className="text-xs text-belgi-qizil underline underline-offset-2 hover:text-belgi-qizil"
                            >
                              Hisobdan chiqarish
                            </Link>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-matn-kuchsiz">
          Har bo&apos;lak o&apos;z kirimini va tannarxini eslab qoladi (7.8).
        </p>
      </section>

      {/* ── Qisqa xulosa (7.11) ── */}
      <Xulosa xulosa={xulosa} birlik={sarlavha.sarflashBirligi} />

      {/* ── Tannarx dinamikasi va yetkazib beruvchilar ── */}
      {pulniKoradi && (
        <TannarxVaYetkazuvchi qatorlar={tannarxlar} yetkazuvchilar={yetkazuvchilar} />
      )}

      {/* ── Harakatlar tarixi (7.11) ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Harakatlar tarixi</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Qoldiq alohida saqlanmaydi — u shu jadvalning yig&apos;indisi (2.2-invariant). Yozuvlar
          o&apos;zgartirilmaydi va o&apos;chirilmaydi (§6.5).
        </p>

        {harakatlar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Harakat yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Turi</th>
                  <th className="px-4 py-2.5 font-medium">Bo&apos;lak</th>
                  <th className="px-4 py-2.5 text-right font-medium">Miqdor</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                  {chiqaraOladi && <th className="px-4 py-2.5 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {h.sana.toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">{harakatNomi(h.turi)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{h.bolakKod}</td>
                    <td className="raqam px-4 py-2.5">{miqdorMatni(h)}</td>
                    <td className="raqam px-4 py-2.5">{pulKorsat(som(h.tannarxSumma))}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{h.xodimIsmi}</td>
                    {chiqaraOladi && (
                      <td className="px-4 py-2.5 text-right align-top">
                        {h.turi === 'BRAK' && !h.bekorQilingan ? (
                          <BekorTugmasi harakatId={h.id} bolakKod={h.bolakKod} />
                        ) : h.turi === 'BRAK' ? (
                          <span className="text-xs text-matn-kuchsiz">bekor qilingan</span>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * TZ 7.11 — kartochkaning to'rt raqami.
 *
 * ⚠️ Bu OMBOR BO'LIMINING umumiy paneli (11.11) EMAS — faqat shu
 *    bitta materialning xulosasi.
 *
 * ⚠️ Raqamlar harakatlar tarixidan hisoblanadi va HECH QAYERDA
 *    saqlanmaydi (2.2-invariant) — xuddi qoldiqning o'zi kabi.
 */
function Xulosa({
  xulosa,
  birlik,
}: {
  xulosa: MaterialXulosasi;
  birlik: string;
}) {
  const b = birlik === 'KV_M' ? 'kv.m' : birlik === 'SM' ? 'sm' : 'dona';
  const raqam = (n: number): string =>
    n.toLocaleString('uz-UZ', { maximumFractionDigits: 2 });

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
        <div className="text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase">
          Jami kirim
        </div>
        <div className="raqam mt-0.5 text-[18px] font-semibold">
          {raqam(xulosa.kirimMiqdor)} <span className="text-[13px]">{b}</span>
        </div>
        <div className="raqam mt-0.5 text-[12px] text-matn-kuchsiz">
          {pulKorsat(som(xulosa.kirimSumma))}
        </div>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
        <div className="text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase">
          Jami sarflangan
        </div>
        <div className="raqam mt-0.5 text-[18px] font-semibold">
          {raqam(xulosa.sarfMiqdor)} <span className="text-[13px]">{b}</span>
        </div>
        {/* «Qayerga ketdi» — eng ko'p olgan turlar */}
        <div className="mt-0.5 text-[12px] text-matn-kuchsiz">
          {xulosa.sarfUlushlari.length === 0
            ? pulKorsat(som(xulosa.sarfSumma))
            : xulosa.sarfUlushlari
                .map((u) => `${String(u.foiz)}% — ${u.turNomi}`)
                .join(' · ')}
        </div>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
        <div className="text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase">
          Chiqindi va brak
        </div>
        <div
          className={`raqam mt-0.5 text-[18px] font-semibold ${
            xulosa.yoqotishMiqdor > 0 ? 'text-belgi-qizil' : ''
          }`}
        >
          {raqam(xulosa.yoqotishMiqdor)} <span className="text-[13px]">{b}</span>
        </div>
        <div className="raqam mt-0.5 text-[12px] text-matn-kuchsiz">
          {pulKorsat(som(xulosa.yoqotishSumma))} zarar
        </div>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
        <div className="text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase">
          Qoldiq qiymati
        </div>
        <div className="raqam mt-0.5 text-[18px] font-semibold">
          {pulKorsat(som(xulosa.qoldiqQiymati))}
        </div>
        <div className="mt-0.5 text-[12px] text-matn-kuchsiz">
          har bo&apos;lak o&apos;z tannarxida (2.3)
        </div>
      </div>
    </section>
  );
}

// ─── Qarorga yordam beradigan bloklar ───────────────────────────

/** Birlik nomi — ro'yxat sxemada, bir joyda (§2.2) */
function birlikNomi(birlik: string): string {
  return SARFLASH_BIRLIGI_NOMI[birlik as SarflashBirligi] ?? birlik;
}

/** Miqdorni o'qiladigan qilib — kv.m, m yoki dona */
function son(x: number): string {
  return x.toLocaleString('uz-UZ', { maximumFractionDigits: 2 }).replace(/,/g, ' ');
}

const BASHORAT_RANGI: Record<string, string> = {
  TUGAGAN: 'text-belgi-qizil',
  XAVF: 'text-belgi-qizil',
  OGOHLANTIRISH: 'text-belgi-sariq',
  YETARLI: 'text-belgi-yashil',
  NOMALUM: 'text-matn-kuchsiz',
};

/**
 * ⚠️ Bu blok «qancha bor» emas, «NIMA QILISH KERAK» degan
 *    savolga javob beradi — shuning uchun eng tepada turadi.
 */
function NimaQilishKerak({
  tezlik,
  kutayotgan,
  ustama,
}: {
  tezlik: MaterialTezligi | null;
  kutayotgan: readonly KutayotganPozitsiya[];
  ustama: MaterialUstamasi | null;
}) {
  if (tezlik === null) return null;

  const kam = kamQoldiqmi(
    tezlik.sarflashBirligi,
    tezlik.qoldiq,
    tezlik.kamQoldiqChegaraM,
  );

  const b = tezlik.bashorat;

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Raqam
          sarlavha="Qoldiq"
          qiymat={`${son(tezlik.qoldiq)} ${birlikNomi(tezlik.sarflashBirligi)}`}
          izoh={kam ? 'kam qoldiq — chegaradan past' : undefined}
          rang={kam ? 'text-belgi-sariq' : undefined}
        />

        <Raqam
          sarlavha="Kunlik sarf"
          qiymat={`${son(tezlik.kunlikTezlik)} ${birlikNomi(tezlik.sarflashBirligi)}`}
          izoh="oxirgi 90 kun bo'yicha"
        />

        {/*
          ⚠️ «NOMALUM» «tugamaydi» degani EMAS — harakat yo'qligi
             ko'pincha teskarisini bildiradi: mato o'lik yotibdi
             (11.7.6 — muzlab qolgan pul).
        */}
        <Raqam
          sarlavha="Yetadi"
          qiymat={b.kunlar === null ? '—' : `${String(b.kunlar)} kun`}
          izoh={
            b.kunlar === null
              ? 'sarf yo\u2019q — hisoblab bo\u2019lmaydi'
              : b.sana === null
                ? undefined
                : `taxminan ${b.sana.toLocaleDateString('uz-UZ')}`
          }
          rang={BASHORAT_RANGI[b.holati]}
        />

        {ustama !== null && (
          <Raqam
            sarlavha="Ustama"
            qiymat={ustama.ustamaFoiz === null ? '—' : `${String(ustama.ustamaFoiz)}%`}
            izoh={
              ustama.sotuvNarx === null || ustama.ortachaTannarx === null
                ? 'narx yoki tannarx yo\u2019q'
                : `${pulKorsat(som(ustama.sotuvNarx))} ← ${pulKorsat(
                    som(Number(ustama.ortachaTannarx).toFixed(2)),
                  )}`
            }
          />
        )}
      </div>

      {/*
        ⚠️ XARID USTUVORLIGI SHU YERDA.
           «Qoldiq kam» shoshilinch degani emas — MIJOZ KUTAYOTGANI
           shoshilinch. Bu ro'yxat mato kelishi bilan qaysi buyurtmalar
           ochilishini ko'rsatadi.
      */}
      {kutayotgan.length > 0 && (
        <div className="rounded-karta border border-belgi-sariq bg-belgi-sariq-fon px-4 py-3">
          <p className="text-sm font-medium text-matn">
            {kutayotgan.length} ta pozitsiya shu matoni kutmoqda
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-[13px] text-matn-ikki">
            {kutayotgan.slice(0, 6).map((k) => (
              <li key={k.pozitsiyaId} className="flex flex-wrap items-center gap-x-2">
                <Link
                  href={`/buyurtma/${String(k.buyurtmaId)}`}
                  className="font-medium text-brend hover:underline"
                >
                  {k.buyurtmaRaqam}
                </Link>
                <span>· {String(k.tartib)}-pozitsiya</span>
                <span className="text-matn-kuchsiz">
                  · {k.mijozIsmi ?? 'mijozsiz'}
                </span>
                <span className="raqam">
                  · {son(Number(k.kerakMiqdor))} {birlikNomi(k.birlik)}
                </span>
                <span className={k.kutmoqdaKun >= 3 ? 'text-belgi-qizil' : ''}>
                  · {String(k.kutmoqdaKun)} kundan beri
                </span>
              </li>
            ))}
          </ul>
          {kutayotgan.length > 6 && (
            <p className="mt-1.5 text-xs text-matn-kuchsiz">
              va yana {String(kutayotgan.length - 6)} ta
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Raqam({
  sarlavha,
  qiymat,
  izoh,
  rang,
}: {
  sarlavha: string;
  qiymat: string;
  izoh?: string;
  rang?: string;
}) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt px-4 py-3.5">
      <p className="text-[12px] font-medium tracking-[0.03em] text-matn-kuchsiz uppercase">
        {sarlavha}
      </p>
      <p
        className={`raqam mt-1 text-[18px] leading-none font-semibold ${rang ?? 'text-matn'}`}
      >
        {qiymat}
      </p>
      {izoh !== undefined && <p className="mt-1.5 text-[12px] text-matn-kuchsiz">{izoh}</p>}
    </div>
  );
}

/**
 * ⚠️ FAQAT PUL KO'RADIGANLARGA (11.10). Tannarx va yetkazib
 *    beruvchi narxi — ikkalasi ham sotuvchiga yopiq.
 */
function TannarxVaYetkazuvchi({
  qatorlar,
  yetkazuvchilar,
}: {
  qatorlar: readonly TannarxNuqtasi[];
  yetkazuvchilar: readonly MaterialYetkazuvchisi[];
}) {
  if (qatorlar.length === 0 && yetkazuvchilar.length === 0) return null;

  const birinchi = qatorlar[0];
  const oxirgi = qatorlar[qatorlar.length - 1];
  const ozgarish =
    birinchi !== undefined && oxirgi !== undefined && Number(birinchi.tannarx) > 0
      ? Math.round(
          ((Number(oxirgi.tannarx) - Number(birinchi.tannarx)) /
            Number(birinchi.tannarx)) *
            100,
        )
      : null;

  return (
    <section className="flex flex-col gap-6">
      {qatorlar.length > 0 && (
        <div>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Tannarx dinamikasi</h2>
          {/*
            ⚠️ Mato dollarga olinadi, kurs esa o'zgaradi. Bu qator
               «sotuv narxini ko'tarish kerakmi» degan savolga javob
               beradi (11.7.5 — ustama eroziyasi).
          */}
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Har kirimda hisoblangan birlik tannarxi. Transport va bojxona shu
            raqamga allaqachon qo&apos;shilgan (7.9).
            {ozgarish !== null && (
              <>
                {' '}
                Boshidan oxirigacha{' '}
                <b className={ozgarish > 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'}>
                  {ozgarish > 0 ? '+' : ''}
                  {String(ozgarish)}%
                </b>
                .
              </>
            )}
          </p>

          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Kirim</th>
                  <th className="px-4 py-2.5 font-medium">Yetkazuvchi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {qatorlar.map((q) => (
                  <tr key={`${q.kirimRaqam}-${q.sana}`}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">{q.sana}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{q.kirimRaqam}</td>
                    <td className="px-4 py-2.5">{q.yetkazuvchi}</td>
                    <td className="raqam px-4 py-2.5">
                      {pulKorsat(som(Number(q.tannarx).toFixed(2)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {yetkazuvchilar.length > 0 && (
        <div>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Yetkazib beruvchilar</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Ikki yetkazuvchi bo&apos;lsa narxlarini solishtirasiz.
          </p>

          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Yetkazuvchi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kirim soni</th>
                  <th className="px-4 py-2.5 font-medium">Oxirgi kirim</th>
                  <th className="px-4 py-2.5 text-right font-medium">Oxirgi narx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {yetkazuvchilar.map((y) => (
                  <tr key={y.id}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/yetkazib/${String(y.id)}`}
                        className="text-brend hover:underline"
                      >
                        {y.nom}
                      </Link>
                    </td>
                    <td className="raqam px-4 py-2.5">{String(y.kirimSoni)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">
                      {y.oxirgiSana}
                    </td>
                    <td className="raqam px-4 py-2.5 whitespace-nowrap">
                      {y.valyuta === 'USD'
                        ? `${y.oxirgiNarx} $`
                        : pulKorsat(som(Number(y.oxirgiNarx).toFixed(2)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
