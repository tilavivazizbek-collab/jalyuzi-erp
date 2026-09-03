import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { kunHarakatlari, kunHolati } from '@/lib/amal/kun-yopish';
import { kassaQoldiqlari } from '../../malumot';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som, dollar } from '@/lib/domain/pul';
import { OddiyChopTugmasi } from '../../../chop-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/kassa/kun/varaqa` — TZ 15.4 · 12.17
 *
 * KUNLIK YOPISH VARAQASI — qog'ozga chiqadigan hujjat.
 *
 * ⚠️ NEGA KERAK
 *
 *    Kun yopish ekranda bor, lekin kassir kun oxirida QOG'OZDA
 *    imzo qo'yadi va uni papkaga qo'yadi. Ekrandagi raqamni
 *    ko'chirib yozish — xato manbayi; varaqa o'sha raqamlarni
 *    o'zi chiqaradi.
 *
 * ⚠️ Varaqa HISOBLANGAN qoldiqni ko'rsatadi, HAQIQIYni emas:
 *    haqiqiy summa sanab yoziladi va farq shu yerda ko'rinadi
 *    (12.17). Tizim uni oldindan to'ldirib qo'ysa, sanashning
 *    ma'nosi qolmasdi.
 */

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'USD' ? pulKorsat(dollar(summa)) : pulKorsat(som(summa));

export default async function KunlikVaraqa({
  searchParams,
}: {
  searchParams: Promise<{ kassa?: string; sana?: string }>;
}) {
  const f = await sahifaRuxsati('kassa.oz.kor');
  const s = await searchParams;

  const bugun = new Date().toISOString().slice(0, 10);
  const sana = /^\d{4}-\d{2}-\d{2}$/.test(s.sana ?? '') ? (s.sana ?? bugun) : bugun;

  /** §9.4 — o'z kassasi yoki hammasi: ruxsatga qarab */
  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');
  const kassalar = await kassaQoldiqlari(f.filialId, f.xodimId, barchaniKoradi);

  const tanlangan = Number(s.kassa);
  const kassa =
    kassalar.find((k) => k.id === tanlangan) ?? kassalar[0];
  if (kassa === undefined) notFound();

  const ulanish = ulanishOl();
  const [holat, kitob] = await Promise.all([
    kunHolati(ulanish, kassa.id, sana),
    kunHarakatlari(ulanish, kassa.id, sana),
  ]);

  const korxona = await ulanish<{ kalit: string; qiymat: string }[]>`
    SELECT kalit, qiymat FROM sozlama WHERE kalit = 'korxona_nom'`;

  return (
    <div className="flex flex-col gap-5">
      <style>{'@media print { @page { size: A4; margin: 12mm } }'}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/kassa/kun" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kun yopish
        </Link>
        <OddiyChopTugmasi matn="Varaqani chop etish" />
      </div>

      {/* Kassa tanlash — varaqaning o'zida emas, tepasida */}
      {kassalar.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {kassalar.map((k) => (
            <Link
              key={k.id}
              href={`/kassa/kun/varaqa?kassa=${String(k.id)}&sana=${sana}`}
              className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
                k.id === kassa.id
                  ? 'border-brend bg-brend text-white'
                  : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
              }`}
            >
              {k.nom}
            </Link>
          ))}
        </div>
      )}

      <div className="varaqa rounded-karta border border-chegara bg-white p-6 text-black">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{korxona[0]?.qiymat ?? '—'}</p>
            <p className="text-sm text-neutral-500">{kassa.nom}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Kunlik yopish varaqasi</p>
            <p className="text-neutral-500">{sana}</p>
          </div>
        </div>

        {/* ── 12.17 · Hisob ── */}
        <table className="mb-5 w-full text-sm">
          <tbody>
            <Qator
              nom="Kun boshidagi qoldiq"
              qiymat={pul(holat.boshlangich, holat.valyuta)}
            />
            <Qator nom="Kirim" qiymat={pul(holat.kirim, holat.valyuta)} />
            <Qator nom="Chiqim" qiymat={pul(holat.chiqim, holat.valyuta)} />
            <Qator
              nom="Hisoblangan qoldiq"
              qiymat={pul(holat.hisoblangan, holat.valyuta)}
              qalin
            />
          </tbody>
        </table>

        {/*
          ⚠️ Bu ikki qator BO'SH chiqadi — kassir qo'lda to'ldiradi.
             Tizim haqiqiy summani bilmaydi: uni sanash kerak.
        */}
        <table className="mb-5 w-full text-sm">
          <tbody>
            <tr className="border-b border-neutral-300">
              <td className="py-2.5">Haqiqiy sanalgan summa</td>
              <td className="w-40 border-b border-neutral-400 py-2.5" />
            </tr>
            <tr className="border-b border-neutral-300">
              <td className="py-2.5">Farq (ortiqcha / kamomad)</td>
              <td className="w-40 border-b border-neutral-400 py-2.5" />
            </tr>
          </tbody>
        </table>

        {/* ── Kun harakatlari ── */}
        <p className="mb-2 text-sm font-semibold">Kun harakatlari</p>
        {kitob.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">
            Bu kunda harakat bo&apos;lmagan.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-400 text-left">
              <tr>
                <th className="py-2 font-medium">Vaqt</th>
                <th className="py-2 font-medium">Kod</th>
                <th className="py-2 font-medium">Izoh</th>
                <th className="py-2 text-right font-medium">Summa</th>
              </tr>
            </thead>
            <tbody>
              {kitob.map((k) => (
                <tr key={k.id} className="border-b border-neutral-200">
                  <td className="whitespace-nowrap py-2">
                    {k.sana.toLocaleTimeString('uz-UZ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2">{k.kod}</td>
                  <td className="py-2 text-neutral-500">{k.izoh ?? '—'}</td>
                  <td className="raqam py-2 text-right">
                    {pul(k.summa, holat.valyuta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-8 flex justify-between text-sm">
          <div>
            <p className="mb-6 text-neutral-500">Kassir</p>
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

function Qator({
  nom,
  qiymat,
  qalin = false,
}: {
  nom: string;
  qiymat: string;
  qalin?: boolean;
}) {
  return (
    <tr className={`border-b border-neutral-300 ${qalin ? 'font-semibold' : ''}`}>
      <td className="py-2.5">{nom}</td>
      <td className="raqam w-40 py-2.5 text-right">{qiymat}</td>
    </tr>
  );
}
