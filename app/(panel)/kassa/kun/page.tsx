import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { ulanishOl } from '@/lib/db';
import { kunHolati } from '@/lib/amal/kun-yopish';
import { kassaQoldiqlari } from '../malumot';
import { KunYopishFormasi } from '../kun-forma';

export const dynamic = 'force-dynamic';

export default async function KunYopishSahifasi({
  searchParams,
}: {
  searchParams: Promise<{ sana?: string }>;
}) {
  const f = await sahifaRuxsati('kassa.oz.kor');
  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');

  const { sana } = await searchParams;
  const bugun = new Date().toISOString().slice(0, 10);
  const tanlangan = /^\d{4}-\d{2}-\d{2}$/.test(sana ?? '') ? (sana as string) : bugun;

  const kassalar = await kassaQoldiqlari(f.filialId, f.xodimId, barchaniKoradi);

  // TZ 12.17 — «Admin kassasida FAQAT NAQD qismi yopiladi. Kartadagi
  // pulni sanab bo'lmaydi — u bank hisobidan tekshiriladi.»
  const yopiladiganlar = kassalar.filter((k) => k.turi === 'NAQD');

  const kunlar = await Promise.all(
    yopiladiganlar.map((k) => kunHolati(ulanishOl(), k.id, tanlangan)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Kun yopish</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {tanlangan} · faqat naqd kassa yopiladi — kartadagi pul bank hisobidan tekshiriladi
          (12.17)
        </p>
      </div>

      <form className="flex items-end gap-3">
        <label className="flex flex-col gap-1" htmlFor="sana">
          <span className="text-sm font-medium text-matn-ikki">Sana</span>
          <input
            id="sana"
            name="sana"
            type="date"
            defaultValue={tanlangan}
            className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25"
          />
        </label>
        <button
          type="submit"
          className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-colors hover:bg-fon"
        >
          Ko&apos;rsatish
        </button>
      </form>

      {kunlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Yopiladigan naqd kassa yo&apos;q.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {kunlar.map((k) => (
            <section key={k.kassaId}>
              <h2 className="mb-3 text-sm font-medium text-matn-ikki">
                {k.kassaNomi}
                <span className="ml-2 text-xs text-matn-kuchsiz">{k.valyuta}</span>
              </h2>
              <KunYopishFormasi
                kun={{
                  kassaId: k.kassaId,
                  kassaNomi: k.kassaNomi,
                  sana: k.sana,
                  boshlangich: k.boshlangich,
                  kirim: k.kirim,
                  chiqim: k.chiqim,
                  hisoblangan: k.hisoblangan,
                  yopilganmi: k.yopilganmi,
                }}
              />
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-matn-kuchsiz">
        Kun yopish majburiy emas — yopilmagan kun bo&apos;lsa ham ertasi kuni ishlash mumkin
        (12.17).
      </p>
    </div>
  );
}
