import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { yetmaganXabarlar } from '@/lib/amal/bildirishnoma';
import { Eslatmalar } from '../eslatma';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { nolSom, pulKorsat, pulMatn, qosh, ayir, som } from '@/lib/domain/pul';
import {
  bekorQilinadimi,
  HOLAT_NOMI,
  qaytaribOlinadimi,
  tahrirlanadimi,
  tasdiqlanadimi,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import {
  bandBolaklar,
  buyurtmaTafsili,
  pozitsiyaTahriri,
  type BandBolak,
  type PozitsiyaTahriri,
  ishOlaOladiganlar,
  tolovHolati,
  tolovKassalari,
} from '../malumot';
import { TasdiqlashTugmasi } from '../tasdiqla';
import { BekorTugmasi, BuyurtmaniOchirishTugmasi, QaytaribOlishTugmasi } from '../amallar';
import { QaytarishTugmasi, RadEtishTugmasi, TopshirishTugmasi, YetibKeldiTugmasi } from '../hayot';
import { TolovFormasi } from '../tolov-forma';
import { IshniBoshlashTugmasi, TugatdimTugmasi, type UstaTanlovi } from '../ish';
import { TahrirTugmasi } from '../tahrir';
import { StornoTugmasi } from '../storno';
import { HolatTuzatishTugmasi } from '../holat-tuzat';

export const dynamic = 'force-dynamic';

const BIRLIK: Record<string, string> = { KV_M: 'kv.m', SM: 'sm', DONA: 'dona' };

export default async function BuyurtmaKartochkasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('buyurtma.kor');
  const tasdiqlayOladi = ruxsatBormi(f, 'buyurtma.tasdiqla');
  const bekorQilaOladi = ruxsatBormi(f, 'buyurtma.bekor');
  const tahrirlayOladi = ruxsatBormi(f, 'buyurtma.tahrirla');
  // TZ 8.8 — storno FAQAT adminda: sotuvchi o'z xatosini o'zi yashira olmaydi
  const stornoQilaOladi = ruxsatBormi(f, 'buyurtma.storno');
  // TZ 8.3 — qotib qolgan holatni qo'lda to'g'rilash, faqat adminda
  const holatTuzataOladi = ruxsatBormi(f, 'buyurtma.holat.tuzat');

  const { id } = await params;
  const buyurtmaId = Number(id);
  if (!Number.isSafeInteger(buyurtmaId) || buyurtmaId <= 0) notFound();

  const b = await buyurtmaTafsili(buyurtmaId, f.filialId);
  if (b === null) notFound();

  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');

  /**
   * ⚠️ 2026-08-30 — ish oqimi VEB-DA. Ilgari «Ishni oldim» va
   *    «Tugatdim» faqat botda edi va buyurtma tasdiqdan keyin
   *    qotib qolardi.
   */
  const ishniOlaOladi = ruxsatBormi(f, 'ish.ol');
  const ishniTugataOladi = ruxsatBormi(f, 'ish.tugat');

  const [tolov, kassalar, ustalar, bandlar, tahrirlar] = await Promise.all([
    tolovHolati(buyurtmaId, f.filialId),
    tolovQilaOladi ? tolovKassalari(f.filialId, f.xodimId) : Promise.resolve([]),
    ishniOlaOladi ? ishOlaOladiganlar(f.filialId) : Promise.resolve([] as readonly UstaTanlovi[]),
    ishniTugataOladi ? bandBolaklar(b.pozitsiyalar.map((p) => p.id)) : Promise.resolve([]),
    /**
     * TZ 8.7 — tahrirlanadigan pozitsiyalarning tarkibi.
     *
     * ⚠️ Faqat tahrir MUMKIN bo'lganlari yuklanadi: ish boshlangan
     *    pozitsiya uchun bu ma'lumot keraksiz yuk.
     */
    tahrirlayOladi
      ? Promise.all(
          b.pozitsiyalar
            .filter(
              (p) =>
                p.mahsulotTurId !== null &&
                tahrirlanadimi(p.holat as PozitsiyaHolati),
            )
            .map((p) => pozitsiyaTahriri(p.id, f.filialId)),
        )
      : Promise.resolve([] as (PozitsiyaTahriri | null)[]),
  ]);

  /**
   * TZ 13.11 · 6.7 — mijozga yetib bormagan xabarlar. Sotuvchi
   * qizil holatni ko'rib qo'ng'iroq qiladi.
   */
  const eslatmalar = (
    await Promise.all(
      b.pozitsiyalar.map((p) =>
        yetmaganXabarlar(ulanishOl(), {
          manbaTuri: 'buyurtma_pozitsiya',
          manbaId: p.id,
        }),
      ),
    )
  ).flat();

  const somda = b.valyuta === 'SOM';
  const pul = (x: string): string => (somda ? pulKorsat(som(x)) : `${x} $`);

  // §3.1 — pul JS `number` bilan qo'shilmaydi, `Som` bilan yig'iladi
  const jami = b.pozitsiyalar.reduce(
    (y, p) => qosh(y, ayir(som(p.narx), som(p.chegirma))),
    nolSom(),
  );

  const filiallararo = b.sotganFilialId !== b.tikuvchiFilialId;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/buyurtma" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Buyurtmalar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{b.raqam}</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {b.sana.toLocaleDateString('uz-UZ')} · {b.sotuvchiIsmi} · {b.manba}
          {b.mijozIsmi !== null && ` · ${b.mijozIsmi}`}
          {b.mijozTelefon !== null && ` (${b.mijozTelefon})`}
        </p>

        {/*
          ⚠️ Storno banneri ENG TEPADA: bu buyurtma «bo'lmagan» deb
             belgilangan va uni oddiy buyurtma deb o'qish xato
             bo'lardi (8.8).
        */}
        {b.stornoSana !== null && (
          <p className="mt-3 rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-[13px] text-belgi-qizil">
            <b>STORNO</b> — {b.stornoSana.toLocaleDateString('uz-UZ')} ·{' '}
            {b.stornoSabab}
            <span className="mt-1 block text-matn-ikki">
              Xato yozuv sifatida chiqarilgan. Hisobotda bekor qilinganlardan alohida
              sanaladi.
            </span>
          </p>
        )}

        {/*
          TZ 8.9 · 8.14 — «Chek» tugmasi FAQAT buyurtma to'liq
          yopilganda chiqadi. Qisman topshirishda kvitansiya
          beriladi, u boshqa hujjat.
        */}
        <div className="mt-3 flex flex-wrap gap-2">
          {b.yopildi !== null && (
            <Link
              href={`/buyurtma/${String(b.id)}/chek`}
              className="fokus inline-block rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm font-medium text-matn transition-all hover:bg-fon active:scale-[0.98]"
            >
              Chek
            </Link>
          )}

          {/*
            ⚠️ Kvitansiya YOPILMAGAN buyurtmada chiqadi — aynan
               qisman topshirish uchun. Yopilgach chek beriladi va
               bu tugma yo'qoladi: sotuvchi ikkilanib qolmaydi.
          */}
          {b.yopildi === null && (
            <Link
              href={`/buyurtma/${String(b.id)}/kvitansiya`}
              className="fokus inline-block rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm font-medium text-matn transition-all hover:bg-fon active:scale-[0.98]"
            >
              Kvitansiya
            </Link>
          )}

          {/*
            ⚠️ Storno qilingan buyurtmada tugma YO'Q: ikkinchi marta
               qilib bo'lmaydi va tranzaksiya ham buni rad etadi.
          */}
          {stornoQilaOladi && b.stornoSana === null && (
            <StornoTugmasi buyurtmaId={b.id} raqam={b.raqam} />
          )}
        </div>
      </div>

      {/* ── 8.14 · Pul bloki ── */}
      <dl className="grid max-w-lg grid-cols-2 gap-x-4 gap-y-2 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <dt className="text-matn-kuchsiz">Pozitsiyalar</dt>
        <dd className="raqam">{b.pozitsiyalar.length}</dd>
        <dt className="text-matn-kuchsiz">Jami</dt>
        <dd className="raqam font-semibold">{pul(pulMatn(jami))}</dd>
        <dt className="text-matn-kuchsiz">Tayyorlik sanasi</dt>
        <dd>
          {b.tayyorlikSana ?? (
            <span className="text-matn-kuchsiz">kiritilmagan — kechikmaydi (3.13)</span>
          )}
        </dd>
        {!somda && (
          <>
            <dt className="text-matn-kuchsiz">Kurs</dt>
            <dd className="raqam">{b.kursSnapshot ?? '—'}</dd>
          </>
        )}
      </dl>

      {/* ── 3.12 · 8.14 · To'lovlar ── */}
      {tolov !== null && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">To&apos;lovlar</h2>

          <dl className="mb-3 grid max-w-md grid-cols-2 gap-x-4 gap-y-1 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
            <dt className="text-matn-kuchsiz">Jami</dt>
            <dd className="raqam">{pul(tolov.jami)}</dd>
            <dt className="text-matn-kuchsiz">To&apos;langan</dt>
            <dd className="raqam text-belgi-yashil">{pul(tolov.tolangan)}</dd>
            <dt className="border-t border-chegara pt-1 font-medium">Qarz</dt>
            <dd
              className={`raqam border-t border-chegara pt-1 font-semibold ${
                Number(tolov.qarz) > 0 ? 'text-belgi-sariq' : ''
              }`}
            >
              {pul(tolov.qarz)}
            </dd>
          </dl>

          {tolov.qatorlar.length > 0 && (
            <div className="mb-3 overflow-x-auto rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {tolov.qatorlar.map((q) => (
                    <tr key={q.id} className={q.stornoQilinganmi ? 'text-matn-kuchsiz' : ''}>
                      <td className="px-4 py-2 text-matn-ikki">
                        {q.sana.toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-2">{q.kassaNomi}</td>
                      <td className="raqam px-4 py-2 font-medium">
                        {pul(q.summa)}
                        {q.stornoQilinganmi && (
                          <span className="ml-2 text-xs">storno qilingan</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-matn-kuchsiz">{q.xodimIsmi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tolovQilaOladi && Number(tolov.qarz) > 0 && (
            <TolovFormasi
              buyurtmaId={b.id}
              qarz={tolov.qarz}
              valyuta={b.valyuta}
              kassalar={kassalar}
            />
          )}
        </section>
      )}

      {filiallararo && (
        <p className="rounded-karta bg-brend-fon px-4 py-3 text-sm text-brend ">
          Buyurtma <b>#{b.sotganFilialId}</b> filialda sotilgan, <b>#{b.tikuvchiFilialId}</b>{' '}
          filialda tikiladi. Material tikuvchi filial omborida band qilinadi (20.4.2).
        </p>
      )}

      {/* ── 8.14 · Pozitsiyalar tabi ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Pozitsiyalar</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Har pozitsiyaning O&apos;Z holati bor — bittasi topshirilgan bo&apos;lsa ham, ikkinchisi
          hali tikilayotgan bo&apos;lishi mumkin (8.2).
        </p>

        <div className="flex flex-col gap-4">
          {b.pozitsiyalar.map((p) => (
            <div key={p.id} className="rounded-karta border border-chegara bg-sirt">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chegara px-4 py-3">
                <div>
                  <span className="font-medium">
                    {p.tartib}. {p.turNomi}
                  </span>
                  <span className="raqam ml-3 text-sm text-matn-ikki">
                    {p.eniSm} × {p.boyiSm} sm
                  </span>
                  {p.soni > 1 && (
                    <span className="raqam ml-2 text-sm text-matn-kuchsiz">× {p.soni}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      p.holat === 'MATERIALGA_KUTMOQDA'
                        ? 'bg-belgi-sariq-fon text-belgi-sariq'
                        : p.holat === 'TOPSHIRILDI'
                          ? 'bg-belgi-yashil-fon text-belgi-yashil'
                          : 'bg-fon text-matn-ikki'
                    }`}
                  >
                    {HOLAT_NOMI[p.holat as PozitsiyaHolati] ?? p.holat}
                  </span>
                  <span className="raqam text-sm font-medium">
                    {pul(pulMatn(ayir(som(p.narx), som(p.chegirma))))}
                  </span>
                  {tasdiqlayOladi && tasdiqlanadimi(p.holat as PozitsiyaHolati) && (
                    <TasdiqlashTugmasi pozitsiyaId={p.id} />
                  )}
                </div>
              </div>

              <table className="w-full text-sm">
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {p.materiallar.map((m) => (
                    <tr key={m.slotNomi}>
                      <td className="px-4 py-2 text-matn-kuchsiz">{m.slotNomi}</td>
                      <td className="px-4 py-2">{m.materialNomi}</td>
                      <td className="raqam px-4 py-2">
                        {m.hisoblangan.toFixed(m.birlik === 'DONA' ? 0 : 2)}{' '}
                        {BIRLIK[m.birlik] ?? m.birlik}
                        {m.tuzatilgan !== null && (
                          // TZ 3.6 — narx tuzatilganiga, ombor hisoblanganiga
                          <span className="ml-2 text-xs text-belgi-sariq">
                            narxda {m.tuzatilgan.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-matn-kuchsiz">
                        {m.bandKodlari.length > 0 ? m.bandKodlari.join(', ') : 'band yo’q'}
                      </td>
                    </tr>
                  ))}

                  {p.aksessuarlar.map((a) => (
                    <tr key={a.nom} className="text-matn-ikki">
                      <td className="px-4 py-2 text-matn-kuchsiz">aksessuar</td>
                      <td className="px-4 py-2">{a.nom}</td>
                      <td className="raqam px-4 py-2">
                        {a.soni} {BIRLIK[a.birlik] ?? a.birlik}
                        {a.qoldaKiritildi && (
                          <span className="ml-2 text-xs text-matn-kuchsiz">qo&apos;lda</span>
                        )}
                      </td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>

              {p.ustaIsmi !== null && (
                <div className="border-t border-chegara px-4 py-2 text-xs text-matn-kuchsiz">
                  Usta: {p.ustaIsmi}
                </div>
              )}

              {/* TZ 8.6 · 8.8 · 8.9 · 8.10 — amallar holatga qarab ochiladi */}
              <PozitsiyaAmallari
                holat={p.holat as PozitsiyaHolati}
                pozitsiyaId={p.id}
                tartib={p.tartib}
                buyurtmaRaqam={b.raqam}
                holatTuzataOladi={holatTuzataOladi}
                ustaIsmi={p.ustaIsmi}
                narx={pulMatn(ayir(som(p.narx), som(p.chegirma)))}
                bekorQilaOladi={bekorQilaOladi}
                tahrirlayOladi={tahrirlayOladi}
                tolovQilaOladi={tolovQilaOladi}
                kassalar={kassalar}
                ishniOlaOladi={ishniOlaOladi}
                ishniTugataOladi={ishniTugataOladi}
                ustalar={ustalar}
                bandlar={bandlar.filter((x) => x.pozitsiyaId === p.id)}
                tahrir={tahrirlar.find((t) => t !== null && t.pozitsiyaId === p.id) ?? null}
                eniSm={p.eniSm}
                boyiSm={p.boyiSm}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 13.11 · 6.7 — yetib bormagan xabarlar */}
      <Eslatmalar xabarlar={eslatmalar} />

      {/*
        TZ 8.8 · 8.15 — butun buyurtmani o'chirish.

        ⚠️ Eng pastda va ajratilgan: bu buyurtmadagi eng qaytmas
           amal. Yopilgan buyurtmada tugma umuman chiqmaydi —
           topshirilgan mahsulotni «bekor qilib» bo'lmaydi.
      */}
      {bekorQilaOladi && b.yopildi === null && (
        <div className="border-t border-chegara pt-5">
          {/*
            TZ 8.7 — «Mijoz ertasi kuni "yana bittasi kerak" desa —
            mavjud buyurtmaga qo'shiladi, yangi buyurtma ochilmaydi.
            Aks holda bitta mijoz, bitta manzil, ikkita chek bo'ladi.»

            ⚠️ Yopilgan buyurtmada ko'rinmaydi: cheki chiqarilgan.
          */}
          {tahrirlayOladi && b.yopildi === null && (
            <Link
              href={`/buyurtma/yangi?qoshish=${String(b.id)}`}
              className="fokus rounded-maydon border border-chegara px-3 py-1.5 text-[13px] text-matn-ikki transition-colors hover:border-brend hover:text-brend"
            >
              + Pozitsiya qo&apos;shish
            </Link>
          )}
          <BuyurtmaniOchirishTugmasi buyurtmaId={b.id} />
        </div>
      )}
    </div>
  );
}

/**
 * TZ 8.3 — pozitsiyaning holati qaysi amallarni ochishini bir joyda
 * hal qiladi.
 *
 * ⚠️ Shartlar TAKRORLANMAYDI (§2.2): tekshiruvlar `lib/domain/buyurtma.ts`
 *    dagi funksiyalarga tayanadi.
 */
function PozitsiyaAmallari({
  holat,
  pozitsiyaId,
  tartib,
  buyurtmaRaqam,
  holatTuzataOladi,
  ustaIsmi,
  narx,
  bekorQilaOladi,
  tahrirlayOladi,
  tolovQilaOladi,
  kassalar,
  ishniOlaOladi,
  ishniTugataOladi,
  ustalar,
  bandlar,
  tahrir,
  eniSm,
  boyiSm,
}: {
  holat: PozitsiyaHolati;
  pozitsiyaId: number;
  tartib: number;
  buyurtmaRaqam: string;
  /** TZ 8.3 — faqat admin: holatni qo'lda to'g'rilash */
  holatTuzataOladi: boolean;
  ustaIsmi: string | null;
  narx: string;
  bekorQilaOladi: boolean;
  tahrirlayOladi: boolean;
  tolovQilaOladi: boolean;
  kassalar: readonly { id: number; nom: string; turi: string; valyuta: string }[];
  ishniOlaOladi: boolean;
  ishniTugataOladi: boolean;
  ustalar: readonly UstaTanlovi[];
  /**
   * Pozitsiyaga band qilingan bo'laklar — «Tugatdim» oynasida ko'rinadi.
   *
   * Har KV_M slot uchun bittadan: Rollo da ikkita, Dikke da uchta.
   */
  bandlar: readonly BandBolak[];
  /** TZ 8.7 — tahrir mumkin bo'lsa pozitsiyaning joriy tarkibi */
  tahrir: PozitsiyaTahriri | null;
  eniSm: number;
  boyiSm: number;
}) {
  const bekor = bekorQilaOladi && bekorQilinadimi(holat);
  // 20.5.1 — yo'ldagi tayyor mahsulotni sotgan filial qabul qiladi
  const yetibKeldi = tahrirlayOladi && holat === 'TAYYOR_YOLDA';
  const qaytaribOl = tahrirlayOladi && qaytaribOlinadimi(holat);
  // 8.9 — topshirish faqat TAYYOR yoki YETIB_KELDI dan
  const topshir = tahrirlayOladi && (holat === 'TAYYOR' || holat === 'YETIB_KELDI');
  // 8.8 — rad etish ham o'sha holatlardan
  const radEt = bekorQilaOladi && (holat === 'TAYYOR' || holat === 'YETIB_KELDI');
  // 8.10 — qaytarish faqat TOPSHIRILGANDAN keyin
  const qaytar = tolovQilaOladi && holat === 'TOPSHIRILDI';

  /**
   * 8.5 — ish TASDIQLANGAN yoki materialga kutayotgan pozitsiyadan
   * olinadi. 7.6 — «Tugatdim» faqat ish ketayotganda.
   */
  const boshla = ishniOlaOladi && (holat === 'TASDIQLANGAN' || holat === 'MATERIALGA_KUTMOQDA');
  const tugat = ishniTugataOladi && holat === 'ISHLAB_CHIQARILMOQDA';

  /**
   * TZ 8.7 — «Ishlab chiqarilmoqda» ga o'tgach tahrirlash tugmasi
   * O'CHADI.
   *
   * ⚠️ Ilgari u shunchaki YO'QOLARDI va sotuvchi «tugma qani?» deb
   *    o'ylardi. Endi ko'rinib turadi, lekin bosilmaydi — sababi
   *    ustiga olib borilganda yoziladi.
   */
  const tahrirOchiq = tahrirlayOladi && tahrir === null && holat === 'ISHLAB_CHIQARILMOQDA';

  if (
    !bekor && !qaytaribOl && !topshir && !radEt && !qaytar && !yetibKeldi &&
    !boshla && !tugat && tahrir === null && !tahrirOchiq &&
    !holatTuzataOladi
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-start gap-6 border-t border-chegara px-4 py-3">
      {/* TZ 8.7 — ish boshlangunga qadar tahrirlanadi */}
      {tahrir !== null && <TahrirTugmasi pozitsiya={tahrir} />}

      {/*
        ⚠️ TZ 8.3 — QOTIB QOLGAN holat uchun, odatdagi yo'l emas.
           Tugma o'zi oqibatini tushuntiradi va sabab so'raydi.
           Faqat adminda ko'rinadi.
      */}
      {holatTuzataOladi && (
        <HolatTuzatishTugmasi
          pozitsiyaId={pozitsiyaId}
          tartib={tartib}
          joriyHolat={holat}
          buyurtmaRaqam={buyurtmaRaqam}
        />
      )}
      {tahrirOchiq && (
        <button
          type="button"
          disabled
          title="Ishlab chiqarilmoqda — o'zgartirib bo'lmaydi (8.7). Kerak bo'lsa pozitsiyani bekor qilib, yangisini qo'shing."
          className="rounded-maydon border border-chegara px-3 py-1.5 text-[13px] text-matn-kuchsiz opacity-60"
        >
          Tahrirlash
        </button>
      )}
      {boshla && <IshniBoshlashTugmasi pozitsiyaId={pozitsiyaId} ustalar={ustalar} />}
      {tugat && (
        <TugatdimTugmasi
          pozitsiyaId={pozitsiyaId}
          bandlar={bandlar}
          mahsulotEniSm={eniSm}
          mahsulotBoyiSm={boyiSm}
        />
      )}
      {yetibKeldi && <YetibKeldiTugmasi pozitsiyaId={pozitsiyaId} />}
      {topshir && <TopshirishTugmasi pozitsiyaId={pozitsiyaId} />}
      {radEt && <RadEtishTugmasi pozitsiyaId={pozitsiyaId} />}
      {qaytar && <QaytarishTugmasi pozitsiyaId={pozitsiyaId} narx={narx} kassalar={kassalar} />}
      {bekor && <BekorTugmasi pozitsiyaId={pozitsiyaId} />}
      {qaytaribOl && <QaytaribOlishTugmasi pozitsiyaId={pozitsiyaId} ustaIsmi={ustaIsmi} />}
    </div>
  );
}
