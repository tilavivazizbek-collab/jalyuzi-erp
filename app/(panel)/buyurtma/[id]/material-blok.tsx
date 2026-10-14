/**
 * Buyurtma kartochkasida material bloki — LOYIHA T-07. 2026-10-14
 *
 * «Bu buyurtmaga qaysi bo'laklardan qancha ketdi» — nizo chiqqanda
 * («mato boshqacha edi») javob. Ma'lumot ombor harakatlarida bor (Q-02).
 *
 * ⚠️ Manba ikkita: pozitsiyaning o'z yechimi (`buyurtma_pozitsiya`) va
 *    qayta kesish yechimi (`qayta_kesish`) — ikkinchi marta ketgan material.
 * ⚠️ TANNARX faqat `tannarx` = true bo'lsa (sotuvchi tannarxni ko'rmaydi).
 * ⚠️ Nom va miqdor `lib/domain/ombor-harakat.ts` dan — ombor tarixi bilan
 *    bir xil so'z (§2.2).
 */

import Link from 'next/link';
import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { harakatNomi, miqdorMatni } from '@/lib/domain/ombor-harakat';
import { pulKorsat, som } from '@/lib/domain/pul';

interface Qator {
  readonly pozitsiyaId: number;
  readonly turi: string;
  readonly qaytaKesish: boolean;
  readonly bolakId: number;
  readonly bolakKod: string;
  readonly material: string;
  readonly miqdorKvM: number | null;
  readonly miqdorM: number | null;
  readonly miqdorDona: number | null;
  readonly tannarx: string;
}

export async function pozitsiyaMateriallari(pozitsiyaIdlar: readonly number[]): Promise<Qator[]> {
  if (pozitsiyaIdlar.length === 0) return [];
  const ids = pozitsiyaIdlar as number[];
  const q = await ulanishOl()<
    {
      pozitsiya_id: number;
      turi: string;
      qk: boolean;
      bolak_id: number;
      kod: string;
      material: string;
      kv: string | null;
      m: string | null;
      dona: number | null;
      tannarx: string;
    }[]
  >`
    SELECT COALESCE(qk.buyurtma_pozitsiya_id, oh.manba_id) AS pozitsiya_id,
           oh.turi, (oh.manba_turi = 'qayta_kesish') AS qk,
           bo.id AS bolak_id, bo.kod, m.nom AS material,
           oh.miqdor_kv_m::text AS kv, oh.miqdor_m::text AS m, oh.miqdor_dona AS dona,
           COALESCE(oh.tannarx_summa, 0)::text AS tannarx
    FROM ombor_harakat oh
    JOIN bolak bo ON bo.id = oh.bolak_id
    JOIN material m ON m.id = bo.material_id
    LEFT JOIN qayta_kesish qk ON oh.manba_turi = 'qayta_kesish' AND qk.id = oh.manba_id
    WHERE (oh.manba_turi = 'buyurtma_pozitsiya' AND oh.manba_id = ANY(${ids}))
       OR (oh.manba_turi = 'qayta_kesish' AND qk.buyurtma_pozitsiya_id = ANY(${ids}))
    ORDER BY oh.id`;
  return q.map((x) => ({
    pozitsiyaId: x.pozitsiya_id,
    turi: x.turi,
    qaytaKesish: x.qk,
    bolakId: x.bolak_id,
    bolakKod: x.kod,
    material: x.material,
    miqdorKvM: x.kv === null ? null : Number(x.kv),
    miqdorM: x.m === null ? null : Number(x.m),
    miqdorDona: x.dona,
    tannarx: x.tannarx,
  }));
}

export function MaterialBlok({
  qatorlar,
  tartib,
  tannarx,
}: {
  qatorlar: readonly Qator[];
  /** pozitsiya id → «1-pozitsiya» kabi tartib raqami */
  tartib: ReadonlyMap<number, number>;
  tannarx: boolean;
}) {
  if (qatorlar.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-matn-ikki">Material — qaysi bo&apos;lakdan qancha ketdi</h2>
      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
              <th className="px-3 py-2 font-medium">Poz.</th>
              <th className="px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 font-medium">Bo&apos;lak</th>
              <th className="px-3 py-2 font-medium">Harakat</th>
              <th className="px-3 py-2 text-right font-medium">Miqdor</th>
              {tannarx && <th className="px-3 py-2 text-right font-medium">Tannarx</th>}
            </tr>
          </thead>
          <tbody>
            {qatorlar.map((q, i) => (
              <tr key={`${String(q.bolakId)}-${String(i)}`} className="border-b border-chegara last:border-0">
                <td className="px-3 py-2 text-matn-ikki">{tartib.get(q.pozitsiyaId) ?? '—'}</td>
                <td className="px-3 py-2 text-matn">{q.material}</td>
                <td className="px-3 py-2">
                  <Link href={`/ombor/bolak/${String(q.bolakId)}`} className="font-mono text-[13px] text-brend hover:underline">
                    {q.bolakKod}
                  </Link>
                </td>
                <td className="px-3 py-2 text-matn-ikki">
                  {harakatNomi(q.turi)}
                  {q.qaytaKesish && (
                    <span className="ml-1.5 rounded bg-belgi-sariq-fon px-1.5 py-0.5 text-[11px] text-belgi-sariq">qayta kesish</span>
                  )}
                </td>
                <td className="raqam px-3 py-2 text-matn">{miqdorMatni(q)}</td>
                {/* Bazada chiqim manfiy — ustunda mutlaq qiymat (minus chalg'itardi) */}
                {tannarx && (
                  <td className="raqam px-3 py-2 text-matn-ikki">{pulKorsat(som(new Decimal(q.tannarx).abs().toFixed(2)))}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
