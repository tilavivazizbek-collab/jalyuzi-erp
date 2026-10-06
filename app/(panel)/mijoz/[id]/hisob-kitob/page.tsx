import Decimal from 'decimal.js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { hisobKitobVaraqasi } from '@/lib/amal/hisob-kitob';
import { pulKorsat, som, dollar } from '@/lib/domain/pul';
import { OddiyChopTugmasi } from '../../../chop-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/mijoz/[id]/hisob-kitob` — TZ 8.9
 *
 * Mijozning butun xarid tarixi va balansi. Chek bilan birga
 * beriladi: chek bitta buyurtma haqida, bu esa «umuman qancha
 * qarzim bor?» degan savolga javob.
 *
 * ⚠️ Ruxsat: `mijoz.kor` — bu yerda TANNARX yo'q, faqat mijozning
 *    o'z hisobi. Sotuvchi ham ko'ra oladi (11.10).
 */

/**
 * ⚠️ Ro'yxat bazadagi `mijoz_harakat_turi` CHECK bilan bir xil.
 *    Noma'lum tur KODI BILAN ko'rsatiladi — jimgina bo'sh katak
 *    emas, teshik darrov ko'rinadi.
 */
const HARAKAT_NOMI: Record<string, string> = {
  SOTUV: 'Xarid',
  TOLOV: "To'lov",
  QAYTARISH: 'Qaytarish',
  AVANS: 'Avans',
  UMIDSIZ_QARZ: 'Umidsiz deb hisobdan chiqarildi',
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'USD' ? pulKorsat(dollar(summa)) : pulKorsat(som(summa));

const SANA = /^\d{4}-\d{2}-\d{2}$/;

/** Toshkent kuni — `YYYY-MM-DD` (UTC emas: tunda kun almashadi) */
const toshkentKuni = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(d);

/** Ikki NUMERIC matnni qo'shadi — Decimal orqali, `number` emas (§3) */
const qoshMatn = (a: string, b: string): string => new Decimal(a).plus(b).toFixed(2);

const valyutaNomi = (v: string): string => (v === 'USD' ? '$' : "so'm");

export default async function HisobKitobSahifasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await sahifaRuxsati('mijoz.kor');

  const { id } = await params;
  const mijozId = Number(id);
  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) notFound();

  const v = await hisobKitobVaraqasi(ulanishOl(), mijozId);
  if (v === null) notFound();

  const bugun = new Date().toLocaleDateString('uz-UZ');

  /**
   * ⚠️ DAVR — SOLISHTIRISH DALOLATNOMASI (akt sverka), egasi auditi
   *    2026-10-06. Yuridik mijoz har oy «1-sentabrdan 30-sentabrgacha»
   *    so'raydi: boshidagi qoldiq, davrdagi harakatlar, oxiridagi qoldiq.
   *
   *    Qoldiqlar QAYTA HISOBLANMAYDI — `hisobKitobVaraqasi` dagi o'suvchi
   *    yig'indidan olinadi: davr boshidagi qoldiq = davrdan oldingi
   *    oxirgi qatorning qoldig'i. Davrli va davrsiz varaqa hech qachon
   *    bir-biridan farq qilmaydi.
   */
  const sp = await searchParams;
  const danXom = sp['dan'];
  const gachaXom = sp['gacha'];
  const dan = typeof danXom === 'string' && SANA.test(danXom) ? danXom : null;
  const gacha = typeof gachaXom === 'string' && SANA.test(gachaXom) ? gachaXom : null;
  const davrli = dan !== null || gacha !== null;

  const boshQoldiq = new Map<string, string>();
  const oxirQoldiq = new Map<string, string>();
  const qatorlar = v.qatorlar.filter((q) => {
    const k = toshkentKuni(q.sana);
    if (dan !== null && k < dan) {
      boshQoldiq.set(q.valyuta, q.qoldiq);
      oxirQoldiq.set(q.valyuta, q.qoldiq);
      return false;
    }
    if (gacha !== null && k > gacha) return false;
    oxirQoldiq.set(q.valyuta, q.qoldiq);
    return true;
  });

  /** Davrdagi oshgan va kamaygan — valyuta bo'yicha alohida (1.3) */
  const davrJami = new Map<string, { oshdi: string; kamaydi: string }>();
  for (const q of qatorlar) {
    const j = davrJami.get(q.valyuta) ?? { oshdi: '0', kamaydi: '0' };
    davrJami.set(
      q.valyuta,
      q.summa.startsWith('-')
        ? { ...j, kamaydi: qoshMatn(j.kamaydi, q.summa.slice(1)) }
        : { ...j, oshdi: qoshMatn(j.oshdi, q.summa) },
    );
  }
  const valyutalar = [...new Set([...boshQoldiq.keys(), ...oxirQoldiq.keys()])];

  const sanaKatak = 'rounded-maydon border border-chegara-quyuq bg-sirt px-2 py-1';

  return (
    <div className="flex flex-col gap-5">
      {/*
        ⚠️ Sahifa o'lchami SHU YERDA: bu A4 hujjat, chek emas.
      */}
      <style>{'@media print { @page { size: A4; margin: 12mm } }'}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/mijoz/${String(mijozId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← Mijoz kartochkasi
        </Link>
        {/* Davr tanlash — bo'sh bo'lsa butun tarix */}
        <form method="get" className="flex flex-wrap items-center gap-2 text-[13px]">
          <label className="flex items-center gap-1">
            dan
            <input type="date" name="dan" defaultValue={dan ?? ''} className={sanaKatak} />
          </label>
          <label className="flex items-center gap-1">
            gacha
            <input type="date" name="gacha" defaultValue={gacha ?? ''} className={sanaKatak} />
          </label>
          <button
            type="submit"
            className="rounded-maydon bg-brend px-3 py-1 font-medium text-tugma-matn"
          >
            Davr bo&apos;yicha
          </button>
          {davrli && (
            <Link
              href={`/mijoz/${String(mijozId)}/hisob-kitob`}
              className="text-matn-kuchsiz hover:text-matn"
            >
              Butun tarix
            </Link>
          )}
        </form>
        <OddiyChopTugmasi />
      </div>

      {v.korxonaNom === null && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Korxona nomi sozlanmagan — varaqa nomsiz chiqadi.{' '}
          <Link href="/sozlama" className="underline">
            Sozlash
          </Link>
        </p>
      )}

      <div className="varaqa rounded-karta border border-chegara bg-white p-6 text-black">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{v.korxonaNom ?? '—'}</p>
            {v.korxonaTelefon !== null && (
              <p className="text-sm text-neutral-500">{v.korxonaTelefon}</p>
            )}
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">
              {davrli ? 'Solishtirish dalolatnomasi' : 'Hisob-kitob varaqasi'}
            </p>
            {davrli && (
              <p className="text-neutral-500">
                {dan ?? '…'} — {gacha ?? '…'}
              </p>
            )}
            <p className="text-neutral-500">{bugun}</p>
          </div>
        </div>

        <div className="mb-4 border-y border-neutral-300 py-3">
          <p className="text-sm text-neutral-500">Mijoz</p>
          <p className="text-base font-semibold">{v.ism}</p>
          {v.telefon !== null && <p className="text-sm">{v.telefon}</p>}
        </div>

        {davrli && (
          <div className="mb-3 text-sm">
            {valyutalar.length === 0 ? (
              <p>Davr boshida qoldiq: 0</p>
            ) : (
              valyutalar.map((val) => (
                <p key={val}>
                  Davr boshida qoldiq ({valyutaNomi(val)}):{' '}
                  <b className="raqam">{pul(boshQoldiq.get(val) ?? '0', val)}</b>
                </p>
              ))
            )}
          </div>
        )}

        {qatorlar.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            {davrli ? "Bu davrda harakat yo'q." : "Bu mijozda hali hisob-kitob harakati yo'q."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-400 text-left">
              <tr>
                <th className="py-2 font-medium">Sana</th>
                <th className="py-2 font-medium">Amal</th>
                <th className="py-2 font-medium">Izoh</th>
                <th className="py-2 text-right font-medium">Summa</th>
                <th className="py-2 text-right font-medium">Qoldiq</th>
              </tr>
            </thead>
            <tbody>
              {qatorlar.map((q, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td className="whitespace-nowrap py-2">{q.sana.toLocaleDateString('uz-UZ')}</td>
                  <td className="py-2">{HARAKAT_NOMI[q.turi] ?? q.turi}</td>
                  <td className="py-2 text-neutral-500">{q.izoh ?? '—'}</td>
                  <td className="raqam py-2 text-right">{pul(q.summa, q.valyuta)}</td>
                  <td className="raqam py-2 text-right font-medium">{pul(q.qoldiq, q.valyuta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {davrli && valyutalar.length > 0 && (
          <div className="mt-4 text-sm">
            {valyutalar.map((val) => {
              const j = davrJami.get(val);
              return (
                <p key={val}>
                  Davrda ({valyutaNomi(val)}): qarz oshdi{' '}
                  <b className="raqam">{pul(j?.oshdi ?? '0', val)}</b> · to&apos;lov va kamayish{' '}
                  <b className="raqam">{pul(j?.kamaydi ?? '0', val)}</b> · davr oxirida qoldiq{' '}
                  <b className="raqam">{pul(oxirQoldiq.get(val) ?? '0', val)}</b>
                </p>
              );
            })}
          </div>
        )}

        {/*
          ⚠️ Ishora TUSHUNTIRILADI. «−150 000» degan raqam
             mijozga hech narsa aytmaydi; «avans» so'zi aytadi.
        */}
        <div className="mt-5 border-t border-neutral-400 pt-3">
          {davrli && <p className="mb-1 text-sm text-neutral-500">Bugungi holat:</p>}
          {v.qoldiqlar.length === 0 ? (
            <p className="text-base font-semibold">Qarz yo&apos;q — hisob toza.</p>
          ) : (
            v.qoldiqlar.map((q) => (
              <p key={q.valyuta} className="text-base font-semibold">
                {/* ⚠️ Ishora MATNDAN olinadi — `Number()` bilan pul hisoblanmaydi (§3) */}
                {q.summa.startsWith('-') ? 'Avans (bizda turibdi): ' : 'Qarz: '}
                <span className="raqam">{pul(q.summa.replace(/^-/, ''), q.valyuta)}</span>{' '}
                {valyutaNomi(q.valyuta)}
              </p>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-between text-sm">
          <div>
            <p className="mb-6 text-neutral-500">Topshirdi</p>
            <p className="w-40 border-t border-neutral-400" />
          </div>
          <div>
            <p className="mb-6 text-neutral-500">Qabul qildi</p>
            <p className="w-40 border-t border-neutral-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
