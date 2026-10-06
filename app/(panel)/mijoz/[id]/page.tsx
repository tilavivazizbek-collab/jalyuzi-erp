import Link from 'next/link';
import { faolTurlar } from '@/lib/amal/mijoz-turi';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mijozTahrirlaAmali } from '../amal';
import type { MijozHolati } from '../holat';
import { MijozFormasi, type MijozQiymatlari } from '../forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, kurs as kursYasa, musbatmi, nolmi, pulKorsat, som } from '@/lib/domain/pul';
import { limitHolati } from '@/lib/domain/mijoz';
import {
  YOSH_ORALIQLARI,
  muddatOtganQarz,
  qarzYoshi,
  qarzniTaqsimla,
  tolovIntizomi,
  type TolovIntizomi,
} from '@/lib/domain/qarz-taqsimot';
import { joriyKurs } from '@/lib/amal/kurs';
import { telefonKorsat } from '@/lib/domain/telefon';
import { HARAKAT_NOMI, mijozJurnali, mijozQarzi } from '../qarz-malumot';
import { filtrTanlovlari } from '../malumot';
import { mijozKontaktlari, mijozMuloqotlari } from './crm-malumot';
import { Kontaktlar, Muloqotlar, TelegramEslatma } from './crm';
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
  type MijozBuyurtmasi,
  type MijozXulosasi,
  type OylikAylanma,
  type SotilganMaterial,
  type SotilganQator,
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
  /** `to_char` bilan — vaqt mintaqasi siljitmasin */
  readonly shartnoma_sana_matn: string | null;
  readonly nds_stavka: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly masul_xodim_id: number | null;
  readonly masul_ismi: string | null;
  readonly manba: string | null;
  readonly telegram_id: number | null;
  readonly faol: boolean;
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

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT m.*, to_char(m.shartnoma_sana, 'YYYY-MM-DD') AS shartnoma_sana_matn,
           x.ism AS masul_ismi
    FROM mijoz m
    LEFT JOIN xodim x ON x.id = m.masul_xodim_id
    WHERE m.id = ${mijozId}`;
  const mijoz = qatorlar[0];
  if (mijoz === undefined) notFound();

  const qiymatlar: MijozQiymatlari = {
    ism: mijoz.ism,
    telefon: mijoz.telefon === null ? '' : telefonKorsat(mijoz.telefon),
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
    shartnomaSana: m(mijoz.shartnoma_sana_matn),
    ndsStavka: m(mijoz.nds_stavka),
    tolovMuddatiKun:
      mijoz.tolov_muddati_kun === null ? '' : String(mijoz.tolov_muddati_kun),
    masulXodimId: mijoz.masul_xodim_id === null ? '' : String(mijoz.masul_xodim_id),
    manba: m(mijoz.manba),
  };

  // TZ 6.7 · 6.8 — qarz bloki va harakatlar tarixi
  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');
  /**
   * TZ 6.10 — «ADMIN qarzni hisobdan chiqara oladi».
   *
   * ⚠️ 2026-10-06 — ilgari `kassa.storno` tekshirilardi, rollarda esa
   *    ALOHIDA «Qarzni hisobdan chiqarish» ruxsati turardi va u hech
   *    narsani boshqarmasdi. Endi o'sha ruxsat ishlaydi.
   */
  const hisobdanChiqaraOladi = ruxsatBormi(f, 'mijoz.qarz.hisobdan');
  const [qarz, kassalar, guruhlar, turlar, tanlov] = await Promise.all([
    mijozQarzi(mijozId),
    tolovQilaOladi ? tolovKassalari(f.filialId, f.xodimId) : Promise.resolve([]),
    guruhTanlovlari(),
    faolTurlar(ulanishOl()),
    filtrTanlovlari(),
  ]);

  /**
   * ⚠️ MIJOZLAR B2B — qayta sotish uchun oladi (egasi, 2026-09-05).
   *    Shuning uchun bu raqamlar: qanday to'laydi, qanday ritmda
   *    oladi, nimani qayta sotadi.
   */
  const [xulosa, jurnal, sotilgan, aylanma, buyurtmalar, kursMatni, kontaktlar, muloqotlar] =
    await Promise.all([
      mijozXulosasi(mijozId),
      mijozJurnali(mijozId),
      nimaSotadi(mijozId),
      oylikAylanma(mijozId),
      mijozBuyurtmalari(mijozId),
      joriyKurs(ulanishOl()),
      mijozKontaktlari(mijozId),
      mijozMuloqotlari(mijozId),
    ]);
  /** Sotuvchi ham qo'ng'iroq va va'dani yozadi — `mijoz.yarat` unda bor */
  const crmYozaOladi = ruxsatBormi(f, 'mijoz.yarat');

  /**
   * ⚠️ TAQSIMOT — egasi auditi 2026-10-06. Kartochkadan to'langan qarz
   *    endi eng eski buyurtmalarni yopadi: «To'landi» belgisi, to'lov
   *    intizomi va eng eski qarz shu bitta hisobdan chiqadi.
   */
  const bugun = new Date();
  const taqsimot = qarzniTaqsimla(jurnal);
  const intizom = tolovIntizomi(taqsimot.bandlar, bugun);
  const buyurtmaQoldigi = new Map(
    taqsimot.bandlar
      .filter((b) => b.buyurtmaId !== null)
      .map((b) => [b.buyurtmaId as number, { tolangan: b.tolangan, qolgan: b.qolgan }]),
  );

  /**
   * To'lov muddati o'tgan qarz va qarz yoshi — egasi auditi 2026-10-06.
   * Ikkalasi ham TAQSIMOTDAN: kartochkadan to'langan pul eng eski
   * buyurtmani yopgan bo'ladi.
   */
  const muddatOtgan = {
    SOM: muddatOtganQarz(taqsimot.bandlar, 'SOM', mijoz.tolov_muddati_kun, bugun),
    USD: muddatOtganQarz(taqsimot.bandlar, 'USD', mijoz.tolov_muddati_kun, bugun),
  };
  const yosh = {
    SOM: qarzYoshi(taqsimot.bandlar, 'SOM', bugun),
    USD: qarzYoshi(taqsimot.bandlar, 'USD', bugun),
  };

  /** TZ 6.4 — limit sotuv ekranidagi bilan BIR XIL hisob (`limitHolati`) */
  /**
   * ⚠️ Kurs FAQAT dollar qarzi bo'lsa kerak. Ilgari kurs kiritilmagan
   *    bo'lsa tekshiruv butunlay o'tkazib yuborilardi — faqat so'mda
   *    qarzi bor mijozda ham limit ogohlantirishi chiqmasdi
   *    (egasi auditi 2026-10-06).
   */
  const dollarQarziBor = !nolmi(dollar(qarz.dollar));
  const limit =
    mijoz.qarz_limiti === null || (kursMatni === null && dollarQarziBor)
      ? null
      : limitHolati(
          { som: som(qarz.som), dollar: dollar(qarz.dollar) },
          som(mijoz.qarz_limiti),
          kursYasa(kursMatni ?? '1', bugun, 'JORIY'),
        );

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
      {!mijoz.faol && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-[13px] text-belgi-sariq">
          Bu mijoz o&apos;chirilgan (nofaol). Ro&apos;yxatdagi «O&apos;chirilganlar» dan qaytarish
          mumkin.
        </p>
      )}
      <Rekvizitlar mijoz={mijoz} />
      <Kontaktlar
        mijozId={mijozId}
        kontaktlar={kontaktlar}
        qoshaOladi={crmYozaOladi}
        ochiraOladi={tahrirlayOladi}
      />
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
          <dd className={`raqam font-medium ${musbatmi(som(qarz.som)) ? 'text-belgi-sariq' : ''}`}>
            {pulKorsat(som(qarz.som))}
          </dd>
          <dt className="text-matn-kuchsiz">Dollar</dt>
          <dd className={`raqam font-medium ${musbatmi(dollar(qarz.dollar)) ? 'text-belgi-sariq' : ''}`}>
            {pulKorsat(dollar(qarz.dollar))}
          </dd>
        </dl>

        {/* TZ 6.4 — limit oshgani kartochkada ham ko'rinadi, faqat sotuvda emas */}
        {limit?.oshganmi === true && limit.limit !== null && (
          <p className="mb-4 max-w-xl rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-[13px] text-belgi-qizil">
            Qarz limitdan oshgan: {pulKorsat(limit.jamiSomda)} so&apos;m (dollar joriy kursda) —
            limit {pulKorsat(limit.limit)} so&apos;m.
          </p>
        )}

        {(musbatmi(som(muddatOtgan.SOM.summa)) || musbatmi(dollar(muddatOtgan.USD.summa))) && (
          <p className="mb-4 max-w-xl rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-[13px] text-belgi-qizil">
            To&apos;lov muddati ({String(mijoz.tolov_muddati_kun)} kun) o&apos;tgan qarz:{' '}
            {musbatmi(som(muddatOtgan.SOM.summa)) && (
              <b>{pulKorsat(som(muddatOtgan.SOM.summa))} so&apos;m </b>
            )}
            {musbatmi(dollar(muddatOtgan.USD.summa)) && (
              <b>{pulKorsat(dollar(muddatOtgan.USD.summa))} $ </b>
            )}
            — eng eskisi{' '}
            {String(Math.max(muddatOtgan.SOM.engEskiKun ?? 0, muddatOtgan.USD.engEskiKun ?? 0))}{' '}
            kun kechikdi.
          </p>
        )}

        <QarzYoshiJadvali yosh={yosh} />

        {/* Ortiqcha to'langan pul — keyingi xariddan yechiladi */}
        {(musbatmi(som(taqsimot.avans.SOM)) || musbatmi(dollar(taqsimot.avans.USD))) && (
          <p className="mb-4 max-w-xl rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-[13px] text-belgi-yashil">
            Avans (oldindan to&apos;langan):{' '}
            {musbatmi(som(taqsimot.avans.SOM)) && <b>{pulKorsat(som(taqsimot.avans.SOM))} so&apos;m </b>}
            {musbatmi(dollar(taqsimot.avans.USD)) && <b>{pulKorsat(dollar(taqsimot.avans.USD))} $</b>}
          </p>
        )}

        {tolovQilaOladi && (
          <QarzTolashFormasi
            mijozId={mijozId}
            somQarz={qarz.som}
            dollarQarz={qarz.dollar}
            kassalar={kassalar}
          />
        )}

        {hisobdanChiqaraOladi && (musbatmi(som(qarz.som)) || musbatmi(dollar(qarz.dollar))) && (
          <div className="mt-4 flex flex-col">
            <UmidsizQarzFormasi mijozId={mijozId} somQarz={qarz.som} dollarQarz={qarz.dollar} />
          </div>
        )}

        {/* TZ 13.6 — faqat botga ulangan va qarzi bor mijozga */}
        {crmYozaOladi &&
          mijoz.telegram_id !== null &&
          (musbatmi(som(qarz.som)) || musbatmi(dollar(qarz.dollar))) && (
            <div className="mt-4">
              <TelegramEslatma mijozId={mijozId} />
            </div>
          )}
      </section>

      <Muloqotlar mijozId={mijozId} qatorlar={muloqotlar} yozaOladi={crmYozaOladi} />

      {/* ── 6.8 · Qarz harakati ── */}
      {qarz.harakatlar.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qarz harakati</h2>
          {qarz.harakatlar.length >= 50 && (
            <p className="mb-2 text-xs text-matn-kuchsiz">
              Oxirgi 50 tasi. To&apos;liq tarix va qoldiq —{' '}
              <Link
                href={`/mijoz/${String(mijozId)}/hisob-kitob`}
                className="text-brend hover:underline"
              >
                hisob-kitob varaqasida
              </Link>
              .
            </p>
          )}
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
                        h.summa.startsWith('-') ? 'text-belgi-yashil' : 'text-matn-ikki'
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
      <Buyurtmalar qatorlar={buyurtmalar} qoldiqlar={buyurtmaQoldigi} />

      {tahrirlayOladi && (
      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <MijozFormasi
          amal={amal}
          qiymatlar={qiymatlar}
          tugmaMatni="O'zgarishlarni saqlash"
          guruhlar={guruhlar}
          turlar={turlar}
          guruhQoshaOladi={tahrirlayOladi}
          xodimlar={tanlov.xodimlar}
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
    ['Telefon', mijoz.telefon === null ? null : telefonKorsat(mijoz.telefon)],
    ['Manzil', mijoz.manzil],
    ['Shaxs turi', mijoz.shaxs_turi === 'YURIDIK' ? 'Yuridik' : 'Jismoniy'],
    ['Tashkilot', mijoz.tashkilot_nomi],
    ['INN', mijoz.inn],
    [
      'Shartnoma',
      mijoz.shartnoma_raqam === null
        ? null
        : `${mijoz.shartnoma_raqam}${mijoz.shartnoma_sana_matn === null ? '' : ` · ${mijoz.shartnoma_sana_matn}`}`,
    ],
    ['Bank', mijoz.bank_nomi],
    ['Hisob raqam', mijoz.hisob_raqam],
    ['Qarz limiti', mijoz.qarz_limiti === null ? null : `${pulKorsat(som(mijoz.qarz_limiti))} so'm`],
    [
      "To'lov muddati",
      mijoz.tolov_muddati_kun === null ? null : `${String(mijoz.tolov_muddati_kun)} kun`,
    ],
    ["Mas'ul sotuvchi", mijoz.masul_ismi],
    ['Qayerdan keldi', mijoz.manba],
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
function Buyurtmalar({
  qatorlar,
  qoldiqlar,
}: {
  qatorlar: readonly MijozBuyurtmasi[];
  /** Qarz taqsimotidan — `qarzniTaqsimla()` */
  qoldiqlar: ReadonlyMap<number, { tolangan: string; qolgan: string }>;
}) {
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
              /**
               * ⚠️ 2026-10-06 — holat QARZ TAQSIMOTIDAN. Ilgari faqat
               *    buyurtmaga bog'langan kassa yozuvi sanalardi va
               *    kartochkadan to'langan qarz bu yerda ko'rinmasdi.
               *    Taqsimotda yo'q buyurtma (mijozsiz, storno) qarz emas.
               */
              const t = qoldiqlar.get(b.id);
              const toliq = t === undefined || !musbatmi(som(t.qolgan));
              const qisman = t !== undefined && musbatmi(som(t.tolangan));

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
                          : qisman
                            ? 'bg-belgi-sariq-fon text-belgi-sariq'
                            : 'bg-belgi-qizil-fon text-belgi-qizil'
                      }`}
                    >
                      {b.stornomi ? '—' : toliq ? "To'landi" : qisman ? 'Qisman' : "To'lanmagan"}
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

/**
 * QARZ YOSHI — egasi auditi 2026-10-06. Har qanday ERP da birinchi
 * hisobot: qarzning qanchasi yangi, qanchasi eskirgan.
 */
function QarzYoshiJadvali({
  yosh,
}: {
  yosh: Record<'SOM' | 'USD', Record<(typeof YOSH_ORALIQLARI)[number], string>>;
}) {
  const valyutalar = (['SOM', 'USD'] as const).filter((v) =>
    YOSH_ORALIQLARI.some((o) => !/^0+(\.0+)?$/.test(yosh[v][o])),
  );
  if (valyutalar.length === 0) return null;
  return (
    <table className="mb-4 max-w-xl text-[13px]">
      <thead className="text-left text-[11px] uppercase tracking-wide text-matn-kuchsiz">
        <tr>
          <th className="pr-4 pb-1 font-medium">Qarz yoshi</th>
          {YOSH_ORALIQLARI.map((o) => (
            <th key={o} className="px-3 pb-1 text-right font-medium">
              {o} kun
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {valyutalar.map((v) => (
          <tr key={v}>
            <td className="pr-4 text-matn-kuchsiz">{v === 'SOM' ? "so'm" : '$'}</td>
            {YOSH_ORALIQLARI.map((o) => {
              const x = v === 'SOM' ? som(yosh[v][o]) : dollar(yosh[v][o]);
              return (
                <td
                  key={o}
                  className={`raqam px-3 text-right ${
                    musbatmi(x) && (o === '61-90' || o === '90+')
                      ? 'font-medium text-belgi-qizil'
                      : musbatmi(x)
                        ? 'text-matn'
                        : 'text-matn-kuchsiz'
                  }`}
                >
                  {musbatmi(x) ? pulKorsat(x) : '—'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
