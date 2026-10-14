/**
 * Material kartochkasida sotuv narxi tarixi — LOYIHA T-08. 2026-10-14
 *
 * «Narxni oxirgi marta qachon ko'targanmiz?» — 11.7.5 ustama eroziyasini
 * ko'rsatadi, lekin bu savolga javob yo'q edi.
 *
 * ⚠️ Yangi jadval YO'Q: narx saqlanganda eski `mahsulot_narx` qatori
 *    o'chirilmaydi, nofaol qilinadi (0059, `lib/amal/narx-qoida.ts`) —
 *    tarix allaqachon bazada. Bu yerda faqat o'qiladi.
 * ⚠️ Faqat materialning O'Z narxi (`material_id`) — «materialni o'zi
 *    sotish». Tur narxlari tur sahifasida.
 */

import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';

interface Bosqich {
  readonly dan: string;
  readonly gacha: string | null;
  readonly narx: string;
  readonly valyuta: string;
}

export interface NarxVersiyasi {
  readonly id: number;
  readonly boshlandi: Date;
  /** `null` — hozir amalda */
  readonly tugadi: Date | null;
  readonly kim: string;
  readonly mijozTuri: string | null;
  readonly filial: string | null;
  readonly bosqichlar: readonly Bosqich[];
}

/** Eng yangisi birinchi; juda eski tarix sahifani og'irlashtirmasin — 30 ta versiya. */
export async function materialNarxTarixi(materialId: number): Promise<NarxVersiyasi[]> {
  const sql = ulanishOl();
  const versiyalar = await sql<
    {
      id: number;
      boshlandi: Date;
      tugadi: Date | null;
      kim: string;
      mijoz_turi: string | null;
      filial: string | null;
    }[]
  >`
    SELECT mn.id, mn.yaratildi AS boshlandi,
           CASE WHEN mn.faol THEN NULL ELSE mn.ozgartirildi END AS tugadi,
           COALESCE(x.ism, '—') AS kim, mt.nom AS mijoz_turi, f.nom AS filial
    FROM mahsulot_narx mn
    LEFT JOIN xodim x ON x.id = mn.yaratdi_id
    LEFT JOIN mijoz_turi mt ON mt.id = mn.mijoz_turi_id
    LEFT JOIN filial f ON f.id = mn.filial_id
    WHERE mn.material_id = ${materialId}
    ORDER BY mn.yaratildi DESC, mn.id DESC
    LIMIT 30`;
  if (versiyalar.length === 0) return [];

  const bosqichlar = await sql<
    { mahsulot_narx_id: number; dan: string; gacha: string | null; narx: string; valyuta: string }[]
  >`
    SELECT b.mahsulot_narx_id, b.dan::text, b.gacha::text, b.narx::text, b.valyuta
    FROM mahsulot_narx_bosqich b
    JOIN mahsulot_narx mn ON mn.id = b.mahsulot_narx_id
    WHERE b.mahsulot_narx_id = ANY(${versiyalar.map((v) => v.id)})
      -- Amaldagi versiyada faqat faol bosqichlar; tugaganida esa hammasi
      -- birga nofaol qilingan (narx-qoida.ts), shuning uchun hammasi olinadi
      AND (b.faol OR NOT mn.faol)
    ORDER BY b.mahsulot_narx_id, b.tartib, b.dan`;

  return versiyalar.map((v) => ({
    id: v.id,
    boshlandi: v.boshlandi,
    tugadi: v.tugadi,
    kim: v.kim,
    mijozTuri: v.mijoz_turi,
    filial: v.filial,
    bosqichlar: bosqichlar
      .filter((b) => b.mahsulot_narx_id === v.id)
      .map((b) => ({ dan: b.dan, gacha: b.gacha, narx: b.narx, valyuta: b.valyuta })),
  }));
}

const SANA = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: VAQT_ZONASI,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'USD' ? `$${pulKorsat(dollar(summa))}` : pulKorsat(som(summa));

/** «0–10: 50 000 · 10+: 45 000» — bosqich bitta bo'lsa faqat narx. */
function bosqichMatni(b: readonly Bosqich[]): string {
  if (b.length === 0) return '—';
  if (b.length === 1 && b[0] !== undefined) return pul(b[0].narx, b[0].valyuta);
  const son = (x: string): string => String(Number(x));
  return b
    .map((q) => `${son(q.dan)}${q.gacha === null ? '+' : `–${son(q.gacha)}`}: ${pul(q.narx, q.valyuta)}`)
    .join(' · ');
}

export function NarxTarixi({ versiyalar }: { versiyalar: readonly NarxVersiyasi[] }) {
  if (versiyalar.length === 0) return null;
  const amaldagi = versiyalar.find((v) => v.tugadi === null);
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-matn-ikki">Sotuv narxi tarixi</h2>
        <Link href="/narx" className="text-xs text-brend hover:underline">
          Narxni o&apos;zgartirish →
        </Link>
      </div>
      {amaldagi !== undefined && (
        <p className="mb-2 text-xs text-matn-kuchsiz">
          Oxirgi o&apos;zgarish: {SANA.format(amaldagi.boshlandi)} · {amaldagi.kim}
        </p>
      )}
      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
              <th className="px-3 py-2 font-medium">Davr</th>
              <th className="px-3 py-2 font-medium">Kimga</th>
              <th className="px-3 py-2 text-right font-medium">Narx</th>
              <th className="px-3 py-2 font-medium">Kim qo&apos;ydi</th>
            </tr>
          </thead>
          <tbody>
            {versiyalar.map((v) => (
              <tr
                key={v.id}
                className={`border-b border-chegara last:border-0 ${v.tugadi === null ? '' : 'text-matn-kuchsiz'}`}
              >
                <td className="whitespace-nowrap px-3 py-2">
                  {SANA.format(v.boshlandi)} —{' '}
                  {v.tugadi === null ? (
                    <span className="rounded bg-belgi-yashil-fon px-1.5 py-0.5 text-[11px] text-belgi-yashil">
                      amalda
                    </span>
                  ) : (
                    SANA.format(v.tugadi)
                  )}
                </td>
                <td className="px-3 py-2">
                  {v.mijozTuri ?? 'Hamma mijoz'}
                  {v.filial !== null && <span className="text-matn-kuchsiz"> · {v.filial}</span>}
                </td>
                <td className="raqam px-3 py-2">{bosqichMatni(v.bosqichlar)}</td>
                <td className="px-3 py-2">{v.kim}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
