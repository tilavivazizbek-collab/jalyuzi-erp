import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import Decimal from 'decimal.js';
import { telefonKorsat } from '@/lib/domain/telefon';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { yetkazibHolatlari } from './taqsimot';
import { OchirTugma } from '../ochir-tugma';
import { OchirilganlarHavolasi, QaytarTugma } from '../ochirilganlar';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly nima_yetkazadi: string | null;
  readonly kontakt_shaxs: string | null;
  readonly telefon: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly valyuta: string;
  readonly faol: boolean;
  readonly oxirgi_kirim: string | null;
  readonly ochiq_xarid: number;
}

const FILTRLAR = [
  { k: 'hammasi', nom: 'Hammasi' },
  { k: 'qarz', nom: 'Qarzimiz bor' },
  { k: 'muddat', nom: 'Muddati o‘tgan' },
] as const;
type Filtr = (typeof FILTRLAR)[number]['k'];

/** Valyuta bo'yicha — hech qachon bitta songa qo'shilmaydi (1.3) */
function pulJuft(x: { SOM: string; USD: string }): string {
  const q: string[] = [];
  if (!new Decimal(x.SOM).isZero()) q.push(`${pulKorsat(som(x.SOM))} so'm`);
  if (!new Decimal(x.USD).isZero()) q.push(`${pulKorsat(dollar(x.USD))} $`);
  return q.length === 0 ? '—' : q.join(' · ');
}

export default async function YetkazibRoyxati({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('yetkazib.kor');

  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI (§13) */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';
  const yarataOladi = ruxsatBormi(f, 'yetkazib.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'yetkazib.ozgartir');
  const xomFiltr = typeof sp['filtr'] === 'string' ? sp['filtr'] : '';
  const filtr: Filtr = FILTRLAR.some((x) => x.k === xomFiltr) ? (xomFiltr as Filtr) : 'hammasi';

  const sql = ulanishOl();

  const ochirilganSoni = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM yetkazib_beruvchi WHERE faol = false`;

  const [hammaQatorlar, holatlar] = await Promise.all([
    sql<Qator[]>`
      SELECT y.id, y.nom, y.nima_yetkazadi, y.kontakt_shaxs, y.telefon,
             y.tolov_muddati_kun, y.valyuta, y.faol,
             (SELECT MAX(k.sana)::text FROM kirim k
               WHERE k.yetkazib_beruvchi_id = y.id AND k.holat = 'FAOL') AS oxirgi_kirim,
             (SELECT COUNT(*)::int FROM xarid_buyurtma x
               WHERE x.yetkazib_beruvchi_id = y.id AND x.holat = 'OCHIQ') AS ochiq_xarid
      FROM yetkazib_beruvchi y WHERE y.faol = ${!ochirilganlar} ORDER BY y.nom`,
    /**
     * ⚠️ Audit 2026-10-07 — ro'yxatda QARZ ko'rinmasdi: kimga qancha
     *    qarzdorligimizni bilish uchun har kartochkani ochish kerak edi.
     *    Qarz va muddat — kartochka bilan BITTA taqsimotdan.
     */
    yetkazibHolatlari(null),
  ]);
  const holatOl = (id: number) => holatlar.get(id);
  const qarzBormi = (id: number): boolean => {
    const h = holatOl(id);
    return h !== undefined && (new Decimal(h.taqsimot.qarz.SOM).gt(0) || new Decimal(h.taqsimot.qarz.USD).gt(0));
  };
  const muddatOtdimi = (id: number): boolean => (holatOl(id)?.muddat.muddatOtganSoni ?? 0) > 0;
  const qatorlar = hammaQatorlar.filter((y) =>
    filtr === 'qarz' ? qarzBormi(y.id) : filtr === 'muddat' ? muddatOtdimi(y.id) : true,
  );

  /** Sarlavhadagi jami — ko'rinib turgan ro'yxat bo'yicha, valyuta alohida */
  const jami = { SOM: new Decimal(0), USD: new Decimal(0) };
  const jamiOtgan = { SOM: new Decimal(0), USD: new Decimal(0) };
  for (const y of qatorlar) {
    const h = holatOl(y.id);
    if (h === undefined) continue;
    for (const v of ['SOM', 'USD'] as const) {
      const q = new Decimal(h.taqsimot.qarz[v]);
      if (q.gt(0)) jami[v] = jami[v].plus(q);
      jamiOtgan[v] = jamiOtgan[v].plus(h.muddat.muddatOtgan[v]);
    }
  }
  const matn = (x: { SOM: Decimal; USD: Decimal }) => ({ SOM: x.SOM.toFixed(2), USD: x.USD.toFixed(2) });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Yetkazib beruvchilar
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta · qarzi umumiy, filialga bog&apos;lanmagan (Q-26)
          </p>
          {!ochirilganlar && (
            <p className="mt-1 text-sm">
              Qarzimiz: <b className="raqam">{pulJuft(matn(jami))}</b>
              {(!jamiOtgan.SOM.isZero() || !jamiOtgan.USD.isZero()) && (
                <span className="ml-2 text-belgi-qizil">
                  · muddati o&apos;tgan: <b className="raqam">{pulJuft(matn(jamiOtgan))}</b>
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi
            soni={ochirilganSoni[0]?.n ?? 0}
            korsatilmoqda={ochirilganlar}
          />

          {yarataOladi && (
            <Link
              href="/yetkazib/yangi"
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq"
            >
              Qo&apos;shish
            </Link>
          )}
        </div>
      </div>

      {!ochirilganlar && (
        <nav className="flex gap-1.5" aria-label="Filtr">
          {FILTRLAR.map((x) => (
            <Link
              key={x.k}
              href={x.k === 'hammasi' ? '/yetkazib' : `/yetkazib?filtr=${x.k}`}
              aria-current={filtr === x.k ? 'page' : undefined}
              className={`rounded-full border px-3 py-1 text-[13px] ${
                filtr === x.k
                  ? 'border-brend bg-brend text-tugma-matn'
                  : 'border-chegara-quyuq text-matn-ikki hover:bg-fon'
              }`}
            >
              {x.nom}
            </Link>
          ))}
        </nav>
      )}

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          {filtr === 'hammasi' ? 'Hali yetkazib beruvchi yo‘q.' : 'Bu filtrga mos yetkazib beruvchi yo‘q.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Nima yetkazadi</th>
                <th className="px-4 py-2.5 text-right font-medium">Qarzimiz</th>
                <th className="px-4 py-2.5 font-medium">Oxirgi kirim</th>
                <th className="px-4 py-2.5 font-medium">Kontakt</th>
                <th className="px-4 py-2.5 font-medium">To&apos;lov muddati</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((y) => (
                <tr key={y.id} className={y.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                  {/*
                    ⚠️ NOM — KARTOCHKAGA HAVOLA.

                       Ilgari kartochkaga faqat «Tahrirlash» orqali
                       kirilardi va u FAQAT `yetkazib.ozgartir` bor
                       odamga ko'rinardi. Omborchi qarzni, to'lov
                       muddatini va bank rekvizitlarini ko'rish
                       yo'lini umuman topolmasdi.
                  */}
                  <td className="px-4 py-2.5 font-medium">
                    <Link
                      href={`/yetkazib/${String(y.id)}`}
                      className="text-brend hover:underline"
                    >
                      {y.nom}
                    </Link>
                    {!y.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    {y.nima_yetkazadi ?? <span className="text-matn-kuchsiz">—</span>}
                  </td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {(() => {
                      const h = holatOl(y.id);
                      if (h === undefined) return <span className="text-matn-kuchsiz">—</span>;
                      const q = {
                        SOM: Decimal.max(h.taqsimot.qarz.SOM, 0).toFixed(2),
                        USD: Decimal.max(h.taqsimot.qarz.USD, 0).toFixed(2),
                      };
                      const otgan = h.muddat.muddatOtganSoni > 0;
                      return (
                        <>
                          <span className={otgan ? 'font-medium text-belgi-qizil' : ''}>{pulJuft(q)}</span>
                          {otgan && (
                            <span className="block text-[11px] text-belgi-qizil">
                              muddati o&apos;tgan: {pulJuft(h.muddat.muddatOtgan)}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    {y.oxirgi_kirim ?? <span className="text-matn-kuchsiz">—</span>}
                    {y.ochiq_xarid > 0 && (
                      <span className="block text-[11px] text-belgi-kok">
                        {y.ochiq_xarid} ta buyurtma kutilmoqda
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {y.kontakt_shaxs ?? ''}
                    {y.telefon !== null && (
                      <span className="ml-2 text-matn-kuchsiz">{telefonKorsat(y.telefon)}</span>
                    )}
                    {y.kontakt_shaxs === null && y.telefon === null && (
                      <span className="text-matn-kuchsiz">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {y.tolov_muddati_kun === null ? (
                      <span className="text-matn-kuchsiz">standart</span>
                    ) : (
                      `${String(y.tolov_muddati_kun)} kun`
                    )}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* ⚠️ O'chirilganda faqat qaytarish mumkin */}
                        {/* Nom allaqachon havola — takroriy «Tahrirlash» olib tashlandi */}
                        {!y.faol && <QaytarTugma tur="yetkazib" id={y.id} nom={y.nom} />}
                        {/* O'chirish = nofaol qilish; ishlatilayotgani to'siladi */}
                        {y.faol && (
                          <OchirTugma tur="yetkazib" id={y.id} nom={y.nom} ixcham />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
