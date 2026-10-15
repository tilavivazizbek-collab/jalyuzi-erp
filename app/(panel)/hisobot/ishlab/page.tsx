import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { davrMatn, davrTurimi, davrYasa, kunlarSoni, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { pulKorsat, som } from '@/lib/domain/pul';
import { QK_SABAB_NOMI, type QaytaKesishSababi } from '@/lib/amal/qayta-kesish';
import {
  ishlabChiqarishBraki,
  kechikkanBuyurtmalar,
  navbatHolati,
  ustaUnumdorligi,
} from '../ishlab-malumot';

export const dynamic = 'force-dynamic';

/**
 * TZ 11.8 — ishlab chiqarish hisobotlari. 2026-10-15
 *
 * Usta unumdorligi (11.8.1), brak (11.8.2), kechikkan buyurtmalar (11.8.3),
 * navbat holati (11.8.4). Filial — ishlab chiqaruvchi filial.
 *
 * ⚠️ Ruxsat `hisobot.ishlab.kor`: usta haqi va brak zarari bor (11.10).
 */
const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'HAFTA', nom: 'Hafta' },
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
  { kod: 'YIL', nom: 'Yil' },
];

const pul = (s: string): string => pulKorsat(som(s));
const kun = (x: number | null): string => (x === null ? '—' : `${x.toFixed(1)} kun`);
const TH = 'px-4 py-2.5 font-medium';
const TD = 'px-4 py-2.5';

export default async function IshlabChiqarishHisoboti({
  searchParams,
}: {
  searchParams: Promise<{ davr?: string }>;
}) {
  const f = await sahifaRuxsati('hisobot.ishlab.kor');
  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri = davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'OY';
  const davr = davrYasa(davrTuri, new Date());
  const kunlar = Math.max(1, kunlarSoni(davr));

  const [ustalar, brak, kechikkan, navbat] = await Promise.all([
    ustaUnumdorligi(f.filialId, davr),
    ishlabChiqarishBraki(f.filialId, davr),
    kechikkanBuyurtmalar(f.filialId),
    navbatHolati(f.filialId, davr),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Ishlab chiqarish</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">{davrMatn(davr)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAVRLAR.map((d) => (
          <Link
            key={d.kod}
            href={`/hisobot/ishlab?davr=${d.kod}`}
            className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
              d.kod === davrTuri
                ? 'border-brend bg-brend text-tugma-matn'
                : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
            }`}
          >
            {d.nom}
          </Link>
        ))}
      </div>

      {/* ── 11.8.4 · Navbat — eng muhimi tepada: hozir nima yotibdi ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Navbat holati — 11.8.4</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Ustalar ishni o&apos;zlari oladi (8.5). Stavkasi past tur navbatda yotib qolishi mumkin — eng uzoq
          kutayotgan tur tepada.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Karta sarlavha="Hozir navbatda" qiymat={String(navbat.hozir)} izoh={`eng eskisi: ${kun(navbat.engEskiKun)}`} />
          <Karta sarlavha="Materialga kutmoqda" qiymat={String(navbat.materialKutmoqda)} izoh="navbatga material kelgach tushadi" />
          <Karta sarlavha="O‘rtacha kutish" qiymat={kun(navbat.ortachaKutishKun)} izoh="davrda olingan ishlar" />
          <Karta sarlavha="Eng uzun kutish" qiymat={kun(navbat.engUzunKutishKun)} izoh="davrda olingan ishlar" />
        </div>
        {navbat.turlar.length > 0 && (
          <Jadval
            sarlavhalar={['Mahsulot turi', 'Hozir navbatda', 'Eng eskisi', 'Davrda olingan', "O'rtacha kutdi", 'Eng uzun']}
            ongga={[1, 2, 3, 4, 5]}
          >
            {navbat.turlar.slice(0, 30).map((t) => (
              <tr key={t.tur} className="border-b border-chegara last:border-0">
                <td className={TD}>{t.tur}</td>
                <td className={`${TD} text-right tabular-nums`}>{t.hozir}</td>
                <td className={`${TD} text-right tabular-nums ${(t.engEskiKun ?? 0) >= 3 ? 'text-belgi-qizil' : ''}`}>
                  {kun(t.engEskiKun)}
                </td>
                <td className={`${TD} text-right tabular-nums`}>{t.olingan}</td>
                <td className={`${TD} text-right tabular-nums`}>{kun(t.ortachaKutishKun)}</td>
                <td className={`${TD} text-right tabular-nums`}>{kun(t.engUzunKutishKun)}</td>
              </tr>
            ))}
          </Jadval>
        )}
        {navbat.turlar.length > 30 && (
          <p className="mt-1.5 text-xs text-matn-kuchsiz">
            Eng uzoq kutayotgan 30 ta tur ko&apos;rsatildi ({navbat.turlar.length} tadan).
          </p>
        )}
      </section>

      {/* ── 11.8.3 · Kechikkan buyurtmalar ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">
          Kechikkan buyurtmalar — 11.8.3 · {kechikkan.length} ta
        </h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Tayyorlik sanasi o&apos;tgan, hali topshirilmagan pozitsiyasi bor. Sanasi kiritilmagan buyurtma bu yerga
          tushmaydi (3.13).
        </p>
        {kechikkan.length === 0 ? (
          <Bosh matn="Kechikkan buyurtma yo‘q." />
        ) : (
          <Jadval sarlavhalar={['Buyurtma', 'Mijoz', 'Tayyorlik sanasi', 'Kechikdi', 'Ochiq pozitsiya']} ongga={[3, 4]}>
            {kechikkan.map((k) => (
              <tr key={k.buyurtmaId} className="border-b border-chegara last:border-0">
                <td className={TD}>
                  <Link href={`/buyurtma/${String(k.buyurtmaId)}`} className="text-brend hover:underline">
                    {k.raqam}
                  </Link>
                </td>
                <td className={TD}>{k.mijoz ?? '—'}</td>
                <td className={`${TD} tabular-nums`}>{k.tayyorlikSana}</td>
                <td className={`${TD} text-right tabular-nums text-belgi-qizil`}>{k.kechikishKun} kun</td>
                <td className={`${TD} text-right tabular-nums`}>{k.ochiqPozitsiya}</td>
              </tr>
            ))}
          </Jadval>
        )}
      </section>

      {/* ── 11.8.1 · Usta unumdorligi ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Usta unumdorligi — 11.8.1</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Davrda tugatilgan pozitsiyalar. Kv.m — adolatli o&apos;lchov: bitta katta mahsulot to&apos;rtta
          kichigining mehnatiga teng (21). Haq — davrda hisoblangani (bekor qilingani ayirilgan).
        </p>
        {ustalar.length === 0 ? (
          <Bosh matn="Bu davrda tugatilgan ish yo‘q." />
        ) : (
          <Jadval
            sarlavhalar={['Usta / mahsulot turi', 'Dona', 'Kv.m', 'Kunlik o‘rtacha, kv.m', 'Hisoblangan haq']}
            ongga={[1, 2, 3, 4]}
          >
            {ustalar.map((u) => (
              <UstaQatorlari key={u.ustaId} u={u} kunlar={kunlar} />
            ))}
          </Jadval>
        )}
      </section>

      {/* ── 11.8.2 · Ishlab chiqarish braki ── */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Ishlab chiqarish braki — 11.8.2</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Tasdiqlangan qayta kesishlar. Zarar — qayta ketgan material tannarxi; ushlangan — ustadan ushlab
          qolingani (10.13). Ayb — pozitsiya ustasida.
        </p>
        {brak.length === 0 ? (
          <Bosh matn="Bu davrda brak yo‘q." />
        ) : (
          <Jadval sarlavhalar={['Usta', 'Holat', 'Sabablar', 'Zarar', 'Ushlangan']} ongga={[1, 3, 4]}>
            {brak.map((b) => (
              <tr key={String(b.ustaId)} className="border-b border-chegara last:border-0">
                <td className={TD}>{b.ism}</td>
                <td className={`${TD} text-right tabular-nums`}>{b.soni}</td>
                <td className={`${TD} text-matn-ikki`}>
                  {b.sabablar
                    .map((s) => `${QK_SABAB_NOMI[s.sabab as QaytaKesishSababi] ?? s.sabab} ${String(s.soni)}`)
                    .join(' · ')}
                </td>
                <td className={`${TD} text-right tabular-nums text-belgi-qizil`}>{pul(b.zarar)}</td>
                <td className={`${TD} text-right tabular-nums`}>{pul(b.ushlangan)}</td>
              </tr>
            ))}
          </Jadval>
        )}
      </section>
    </div>
  );
}

function UstaQatorlari({ u, kunlar }: { u: Awaited<ReturnType<typeof ustaUnumdorligi>>[number]; kunlar: number }) {
  return (
    <>
      <tr className="border-b border-chegara bg-fon/50 font-medium">
        <td className={TD}>{u.ism}</td>
        <td className={`${TD} text-right tabular-nums`}>{u.soni}</td>
        <td className={`${TD} text-right tabular-nums`}>{u.kvM}</td>
        <td className={`${TD} text-right tabular-nums`}>{(Number(u.kvM) / kunlar).toFixed(2)}</td>
        <td className={`${TD} text-right tabular-nums`}>{pul(u.haq)}</td>
      </tr>
      {u.turlar.map((t) => (
        <tr key={t.tur} className="border-b border-chegara text-matn-ikki last:border-0">
          <td className={`${TD} pl-8`}>{t.tur}</td>
          <td className={`${TD} text-right tabular-nums`}>{t.soni}</td>
          <td className={`${TD} text-right tabular-nums`}>{t.kvM}</td>
          <td className={TD} />
          <td className={TD} />
        </tr>
      ))}
    </>
  );
}

function Karta({ sarlavha, qiymat, izoh }: { sarlavha: string; qiymat: string; izoh: string }) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
      <p className="text-xs text-matn-kuchsiz">{sarlavha}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-matn">{qiymat}</p>
      <p className="mt-0.5 text-xs text-matn-kuchsiz">{izoh}</p>
    </div>
  );
}

function Jadval({
  sarlavhalar,
  ongga,
  children,
}: {
  sarlavhalar: readonly string[];
  ongga: readonly number[];
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
          <tr>
            {sarlavhalar.map((s, i) => (
              <th key={s} className={`${TH} ${ongga.includes(i) ? 'text-right' : ''}`}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Bosh({ matn }: { matn: string }) {
  return (
    <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
      {matn}
    </p>
  );
}
