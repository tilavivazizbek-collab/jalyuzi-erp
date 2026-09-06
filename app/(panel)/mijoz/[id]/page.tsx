import Link from 'next/link';
import { faolTurlar } from '@/lib/amal/mijoz-turi';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mijozTahrirlaAmali } from '../amal';
import type { MijozHolati } from '../holat';
import { MijozFormasi, type MijozQiymatlari } from '../forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { HARAKAT_NOMI, mijozQarzi } from '../qarz-malumot';
import { tolovKassalari } from '../../buyurtma/malumot';
import { QarzTolashFormasi } from '../qarz-forma';
import { UmidsizQarzFormasi } from '../umidsiz-forma';
import { guruhTanlovlari } from '../guruh/malumot';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import {
  mijozBuyurtmalari,
  mijozXulosasi,
  nimaSotadi,
  oylikAylanma,
  tolovIntizomi,
  type MijozBuyurtmasi,
  type MijozXulosasi,
  type OylikAylanma,
  type SotilganMaterial,
  type SotilganQator,
  type TolovIntizomi,
} from './malumot';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly manzil: string | null;
  readonly eslatma: string | null;
  readonly mijoz_guruh_id: number | null;
  readonly mijoz_turi_id: number | null;
  readonly offset_turi: string | null;
  readonly offset_qiymat: string | null;
  readonly qarz_limiti: string | null;
  readonly shaxs_turi: string;
  readonly tashkilot_nomi: string | null;
  readonly inn: string | null;
  readonly yuridik_manzil: string | null;
  readonly bank_nomi: string | null;
  readonly hisob_raqam: string | null;
  readonly mfo: string | null;
  readonly shartnoma_raqam: string | null;
  readonly nds_stavka: string | null;
}

const m = (x: string | null): string => x ?? '';

export default async function MijozTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  /**
   * ⚠️ KO'RISH uchun `mijoz.kor` YETARLI.
   *
   *    Ilgari sahifa `mijoz.ozgartir` ni talab qilardi — sotuvchida
   *    esa u YO'Q. Natijada sotuvchi mijozlar ro'yxatini ko'rar,
   *    lekin BIRORTA mijoz kartochkasini ocholmasdi: qarzini ham,
   *    telefonini ham. Tahrirlash formasi pastda alohida yopiladi.
   */
  const f = await sahifaRuxsati('mijoz.kor');
  const tahrirlayOladi = ruxsatBormi(f, 'mijoz.ozgartir');

  const { id } = await params;
  const mijozId = Number(id);
  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) notFound();

  const qatorlar = await ulanishOl()<Qator[]>`SELECT * FROM mijoz WHERE id = ${mijozId}`;
  const mijoz = qatorlar[0];
  if (mijoz === undefined) notFound();

  const qiymatlar: MijozQiymatlari = {
    ism: mijoz.ism,
    telefon: m(mijoz.telefon),
    manzil: m(mijoz.manzil),
    eslatma: m(mijoz.eslatma),
    mijozGuruhId: mijoz.mijoz_guruh_id === null ? '' : String(mijoz.mijoz_guruh_id),
    mijozTuriId: mijoz.mijoz_turi_id === null ? '' : String(mijoz.mijoz_turi_id),
    offsetTuri: m(mijoz.offset_turi),
    offsetQiymat: m(mijoz.offset_qiymat),
    qarzLimiti: m(mijoz.qarz_limiti),
    shaxsTuri: mijoz.shaxs_turi,
    tashkilotNomi: m(mijoz.tashkilot_nomi),
    inn: m(mijoz.inn),
    yuridikManzil: m(mijoz.yuridik_manzil),
    bankNomi: m(mijoz.bank_nomi),
    hisobRaqam: m(mijoz.hisob_raqam),
    mfo: m(mijoz.mfo),
    shartnomaRaqam: m(mijoz.shartnoma_raqam),
    ndsStavka: m(mijoz.nds_stavka),
  };

  // TZ 6.7 · 6.8 — qarz bloki va harakatlar tarixi
  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');
  // TZ 6.10 — «ADMIN qarzni hisobdan chiqara oladi»
  const hisobdanChiqaraOladi = ruxsatBormi(f, 'kassa.storno');
  const [qarz, kassalar, guruhlar, turlar] = await Promise.all([
    mijozQarzi(mijozId),
    tolovQilaOladi ? tolovKassalari(f.filialId, f.xodimId) : Promise.resolve([]),
    guruhTanlovlari(),
    faolTurlar(ulanishOl()),
  ]);

  /**
   * ⚠️ MIJOZLAR B2B — qayta sotish uchun oladi (egasi, 2026-09-05).
   *    Shuning uchun bu raqamlar: qanday to'laydi, qanday ritmda
   *    oladi, nimani qayta sotadi.
   */
  const [xulosa, intizom, sotilgan, aylanma, buyurtmalar] = await Promise.all([
    mijozXulosasi(mijozId),
    tolovIntizomi(mijozId),
    nimaSotadi(mijozId),
    oylikAylanma(mijozId),
    mijozBuyurtmalari(mijozId),
  ]);

  const amal = async (holat: MijozHolati, forma: FormData): Promise<MijozHolati> => {
    'use server';
    return mijozTahrirlaAmali(mijozId, holat, forma);
  };

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <Link href="/mijoz" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Mijozlar
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            {mijoz.ism}
          </h1>
          {/* TZ 8.9 — mijozning butun tarixi va balansi, chek bilan birga beriladi */}
          <Link
            href={`/mijoz/${String(mijozId)}/hisob-kitob`}
            className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
          >
            Hisob-kitob varaqasi
          </Link>
        </div>
      </div>

      {/* ── Rekvizitlar va ko'rsatkichlar ── */}
      <Rekvizitlar mijoz={mijoz} />
      <Korsatkichlar xulosa={xulosa} intizom={intizom} />

      {/* ── 6.7 · Qarz bloki ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Qarz</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Qarz saqlanmaydi — harakatlar yig&apos;indisi (2.2-invariant). So&apos;m va dollar alohida
          yuritiladi (1.3).
        </p>

        <dl className="mb-4 grid max-w-xs grid-cols-2 gap-x-4 gap-y-1 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
          <dt className="text-matn-kuchsiz">So&apos;m</dt>
          <dd className={`raqam font-medium ${Number(qarz.som) > 0 ? 'text-belgi-sariq' : ''}`}>
            {pulKorsat(som(qarz.som))}
          </dd>
          <dt className="text-matn-kuchsiz">Dollar</dt>
          <dd className={`raqam font-medium ${Number(qarz.dollar) > 0 ? 'text-belgi-sariq' : ''}`}>
            {pulKorsat(dollar(qarz.dollar))}
          </dd>
        </dl>

        {tolovQilaOladi && (
          <QarzTolashFormasi
            mijozId={mijozId}
            somQarz={qarz.som}
            dollarQarz={qarz.dollar}
            kassalar={kassalar}
          />
        )}

        {hisobdanChiqaraOladi && (Number(qarz.som) > 0 || Number(qarz.dollar) > 0) && (
          <div className="mt-4 flex flex-col">
            <UmidsizQarzFormasi mijozId={mijozId} somQarz={qarz.som} dollarQarz={qarz.dollar} />
          </div>
        )}
      </section>

      {/* ── 6.8 · Qarz harakati ── */}
      {qarz.harakatlar.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qarz harakati</h2>
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Sabab</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Kim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {qarz.harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {h.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">
                      {HARAKAT_NOMI[h.turi] ?? h.turi}
                      {h.izoh !== null && (
                        <span className="ml-2 text-xs text-matn-kuchsiz">{h.izoh}</span>
                      )}
                    </td>
                    <td
                      className={`raqam px-4 py-2.5 font-medium ${
                        Number(h.summa) < 0 ? 'text-belgi-yashil' : 'text-matn-ikki'
                      }`}
                    >
                      {h.valyuta === 'SOM' ? pulKorsat(som(h.summa)) : pulKorsat(dollar(h.summa))}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-matn-kuchsiz">{h.xodimIsmi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <NimaSotadi sotilgan={sotilgan} />
      <Aylanma qatorlar={aylanma} />
      <Buyurtmalar qatorlar={buyurtmalar} />

      {tahrirlayOladi && (
      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <MijozFormasi
          amal={amal}
          qiymatlar={qiymatlar}
          tugmaMatni="O'zgarishlarni saqlash"
          guruhlar={guruhlar}
          turlar={turlar}
          guruhQoshaOladi={tahrirlayOladi}
        />
      </div>
      )}
    </div>
  );
}

// ─── B2B kartochkasining bloklari ──────────────────────────────

function raqam(x: string | number): string {
  return Number(x)
    .toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
    .replace(/,/g, ' ');
}

function Katak({
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
      <p className={`raqam mt-1 text-[18px] leading-none font-semibold ${rang ?? 'text-matn'}`}>
        {qiymat}
      </p>
      {izoh !== undefined && <p className="mt-1.5 text-[12px] text-matn-kuchsiz">{izoh}</p>}
    </div>
  );
}

/**
 * ⚠️ Rekvizitlar KARTOCHKADA, tahrirlash formasida emas.
 *    Hujjat yozayotganda INN yoki shartnoma raqamini bilish uchun
 *    formani ochib o'tirish kerak edi.
 */
function Rekvizitlar({ mijoz }: { mijoz: Qator }) {
  const qatorlar: [string, string | null][] = [
    ['Telefon', mijoz.telefon],
    ['Manzil', mijoz.manzil],
    ['Shaxs turi', mijoz.shaxs_turi === 'YURIDIK' ? 'Yuridik' : 'Jismoniy'],
    ['Tashkilot', mijoz.tashkilot_nomi],
    ['INN', mijoz.inn],
    ['Shartnoma', mijoz.shartnoma_raqam],
    ['Bank', mijoz.bank_nomi],
    ['Hisob raqam', mijoz.hisob_raqam],
    ['Qarz limiti', mijoz.qarz_limiti === null ? null : `${raqam(mijoz.qarz_limiti)} so'm`],
    ['Eslatma', mijoz.eslatma],
  ];

  const bor = qatorlar.filter(([, v]) => v !== null && v !== '');
  if (bor.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-matn-ikki">Ma&apos;lumotlari</h2>
      <dl className="grid gap-x-6 gap-y-1.5 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm sm:grid-cols-2">
        {bor.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-matn-kuchsiz">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * ⚠️ B2B DA ENG MUHIM RAQAM — TO'LOV INTIZOMI.
 *
 *    Qayta sotuvchi deyarli doim qarzga oladi. «Qancha qarz berish
 *    mumkin» degan savolga javob summada emas, to'lov tarixida.
 *
 * ⚠️ Xarid RITMI ikkinchi muhim raqam: uy egasi yiliga bir marta
 *    oladi — uzilish normal. Qayta sotuvchi to'xtasa, demak boshqa
 *    joydan olyapti.
 */
function Korsatkichlar({
  xulosa,
  intizom,
}: {
  xulosa: MijozXulosasi;
  intizom: TolovIntizomi;
}) {
  if (xulosa.buyurtmaSoni === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
        Hali xarid qilmagan.
      </p>
    );
  }

  const uzilgan =
    xulosa.ortachaOraliqKun !== null &&
    xulosa.oxirgidanBeriKun !== null &&
    xulosa.oxirgidanBeriKun > xulosa.ortachaOraliqKun * 2;

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Katak
          sarlavha="Aylanma"
          qiymat={`${raqam(xulosa.aylanmaSom)} so'm`}
          izoh={
            Number(xulosa.aylanmaDollar) !== 0
              ? `va ${raqam(xulosa.aylanmaDollar)} $`
              : `${String(xulosa.buyurtmaSoni)} buyurtma`
          }
        />

        <Katak
          sarlavha="O'rtacha chek"
          qiymat={`${raqam(xulosa.ortachaChekSom)} so'm`}
          izoh={`${String(xulosa.buyurtmaSoni)} buyurtma bo'yicha`}
        />

        {/*
          ⚠️ To'lov intizomi FAQAT to'liq to'langan buyurtmalardan
             hisoblanadi — ochiq qarz o'rtachani soxta yaxshilardi.
        */}
        <Katak
          sarlavha="To'lov intizomi"
          qiymat={
            intizom.ortachaKun === null ? '—' : `${String(intizom.ortachaKun)} kun`
          }
          izoh={
            intizom.ortachaKun === null
              ? "to'liq to'langan buyurtma yo'q"
              : `eng uzuni ${String(intizom.engUzunKun ?? 0)} kun · ${String(
                  intizom.tolanganSoni,
                )} buyurtma`
          }
          rang={
            intizom.ortachaKun !== null && intizom.ortachaKun > 30
              ? 'text-belgi-sariq'
              : undefined
          }
        />

        <Katak
          sarlavha="Xarid ritmi"
          qiymat={
            xulosa.ortachaOraliqKun === null
              ? '—'
              : `${String(xulosa.ortachaOraliqKun)} kunda bir`
          }
          izoh={
            xulosa.oxirgidanBeriKun === null
              ? undefined
              : `oxirgisi ${String(xulosa.oxirgidanBeriKun)} kun oldin`
          }
          rang={uzilgan ? 'text-belgi-qizil' : undefined}
        />
      </div>

      {uzilgan && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-[13px] text-matn">
          Odatdagidan uzoq vaqt xarid qilmadi — qo&apos;ng&apos;iroq qilib
          ko&apos;rish kerak bo&apos;lishi mumkin.
        </p>
      )}

      {intizom.ochiqQarzKun !== null && intizom.ochiqQarzKun > 0 && (
        <p className="rounded-maydon bg-fon px-3 py-2.5 text-[13px] text-matn-ikki">
          Eng eski to&apos;lanmagan buyurtma{' '}
          <b className={intizom.ochiqQarzKun > 30 ? 'text-belgi-qizil' : ''}>
            {String(intizom.ochiqQarzKun)} kunlik
          </b>
          .
        </p>
      )}
    </section>
  );
}

/**
 * ⚠️ Qayta sotuvchi «o'sha kulrangdan yana» deb qo'ng'iroq qiladi.
 *    O'lchamlar tarixi bunga yaramaydi — u har safar boshqa odamning
 *    derazasi uchun oladi. Kerakli narsa: TUR va MATO.
 */
function NimaSotadi({
  sotilgan,
}: {
  sotilgan: { turlar: SotilganQator[]; materiallar: SotilganMaterial[] };
}) {
  if (sotilgan.turlar.length === 0 && sotilgan.materiallar.length === 0) return null;

  return (
    <section className="grid gap-6 sm:grid-cols-2">
      {sotilgan.turlar.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Nima oladi</h2>
          <ul className="flex flex-col gap-1 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
            {sotilgan.turlar.map((t) => (
              <li key={t.nom} className="flex justify-between gap-4">
                <span>{t.nom}</span>
                <span className="raqam font-medium">{String(t.soni)} ta</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sotilgan.materiallar.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qaysi matolar</h2>
          <ul className="flex flex-col gap-1 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
            {sotilgan.materiallar.map((m) => (
              <li key={`${m.nom}-${m.birlik}`} className="flex justify-between gap-4">
                <span>{m.nom}</span>
                <span className="raqam font-medium">
                  {raqam(m.miqdor)} {m.birlik === 'KV_M' ? 'kv.m' : m.birlik.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Oylik aylanma — o'syaptimi yoki kamayyaptimi */
function Aylanma({ qatorlar }: { qatorlar: readonly OylikAylanma[] }) {
  if (qatorlar.length === 0) return null;

  const eng = Math.max(...qatorlar.map((q) => Number(q.som)), 1);

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-matn-ikki">Oylik aylanma</h2>
      <div className="flex flex-col gap-1.5 rounded-karta border border-chegara bg-sirt px-4 py-3">
        {qatorlar.map((q) => (
          <div key={q.oy} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-matn-kuchsiz">{q.oy}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-fon">
              <div
                className="h-full bg-brend"
                style={{ width: `${String(Math.round((Number(q.som) / eng) * 100))}%` }}
              />
            </div>
            <span className="raqam w-32 shrink-0 text-right font-medium">
              {raqam(q.som)}
              {Number(q.dollar) !== 0 && (
                <span className="ml-1 text-xs text-matn-kuchsiz">
                  +{raqam(q.dollar)} $
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Sotuvlari tarixi — shu paytgacha bu sahifada UMUMAN yo'q edi */
function Buyurtmalar({ qatorlar }: { qatorlar: readonly MijozBuyurtmasi[] }) {
  if (qatorlar.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-matn-ikki">Buyurtmalari</h2>
      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-4 py-2.5 font-medium">Sana</th>
              <th className="px-4 py-2.5 font-medium">Raqam</th>
              <th className="px-4 py-2.5 text-right font-medium">Summa</th>
              <th className="px-4 py-2.5 font-medium">To&apos;lov</th>
              <th className="px-4 py-2.5 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {qatorlar.map((b) => {
              const jami = Number(b.jami);
              const tolangan = Number(b.tolangan);
              const toliq = jami > 0 && tolangan >= jami;

              return (
                <tr key={b.id} className={b.stornomi ? 'opacity-60' : ''}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">
                    {b.sana.toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/buyurtma/${String(b.id)}`}
                      className="text-brend hover:underline"
                    >
                      {b.raqam}
                    </Link>
                    {b.stornomi && (
                      <span className="ml-2 text-[11px] text-belgi-qizil">storno</span>
                    )}
                  </td>
                  <td className="raqam px-4 py-2.5 whitespace-nowrap font-medium">
                    {raqam(b.jami)} {b.valyuta === 'USD' ? '$' : "so'm"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        toliq
                          ? 'bg-belgi-yashil-fon text-belgi-yashil'
                          : tolangan > 0
                            ? 'bg-belgi-sariq-fon text-belgi-sariq'
                            : 'bg-belgi-qizil-fon text-belgi-qizil'
                      }`}
                    >
                      {toliq ? "To'landi" : tolangan > 0 ? 'Qisman' : "To'lanmagan"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {Object.entries(b.holatlar).map(([h, n]) => (
                        <span
                          key={h}
                          className="rounded-full bg-fon px-2 py-0.5 text-[11px] whitespace-nowrap text-matn-ikki"
                        >
                          {String(n)} {HOLAT_NOMI[h as PozitsiyaHolati] ?? h}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
