/**
 * app/(panel)/yetkazib/tablar.tsx — TZ 9.7 · 9.8 · 9.9
 *
 * Kartochkaning olti tabi. Har biri sahifadan tayyor ma'lumot oladi —
 * o'zi so'rov yubormaydi, shuning uchun tab bosilganda kutish yo'q.
 *
 * ⚠️ Hammasi SERVER qismi: JS yuklanmaydi.
 */

import Link from 'next/link';
import { pulKorsat, som } from '@/lib/domain/pul';
import { DavoTugmalari } from './davo-tugma';
import { IzohFormasi } from './izoh-forma';
import type {
  DavoQatori,
  IzohQatori,
  KirimQatori,
  MaterialQatori,
  QarzQatori,
  TolovQatori,
} from './malumot';

const belgi = (valyuta: string): string => (valyuta === 'USD' ? '$' : "so'm");

const BOSH = (
  <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
    Yozuv yo&apos;q.
  </p>
);

function Jadval({ boshlar, children }: { boshlar: readonly string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara bg-fon text-left text-xs tracking-wide text-matn-kuchsiz uppercase">
          <tr>
            {boshlar.map((b) => (
              <th key={b} className="px-4 py-2.5 font-medium">
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">{children}</tbody>
      </table>
    </div>
  );
}

/** TZ 9 — harakat turlarining o'zbekcha nomi */
const HARAKAT_NOMI: Record<string, string> = {
  XARID: 'Xarid (qarz)',
  TOLOV: "To'lov",
  AVANS: 'Avans',
  DAVO: "Da'vo",
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

// ─── 1-tab · Qarz harakati ────────────────────────────────────────────────

/**
 * TZ 9.7 — «oldingi va keyingi balans» bilan.
 *
 * ⚠️ Birinchi qator — boshlang'ich qoldiq (2.2): balans saqlanmaydi,
 *    u shu jadvalning o'sib boruvchi yig'indisi.
 */
export function QarzTabi({ qatorlar }: { qatorlar: readonly QarzQatori[] }) {
  if (qatorlar.length === 0) return BOSH;

  return (
    <Jadval boshlar={['Sana', 'Sabab', 'Summa', 'Oldingi', 'Keyingi', 'Kim']}>
      {qatorlar.map((q) => (
        <tr key={q.id}>
          <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">
            {q.sana.toLocaleDateString('uz-UZ')}
          </td>
          <td className="px-4 py-2.5">
            {HARAKAT_NOMI[q.turi] ?? q.turi}
            {q.izoh !== null && (
              <span className="ml-1 text-[12px] text-matn-kuchsiz">· {q.izoh}</span>
            )}
          </td>
          {/* ⚠️ Musbat — biz qarzdormiz, manfiy — avans berganmiz */}
          <td
            className={`raqam px-4 py-2.5 text-right font-medium whitespace-nowrap ${
              Number(q.summa) > 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
            }`}
          >
            {pulKorsat(som(q.summa))}{' '}
            <span className="text-xs font-normal text-matn-kuchsiz">{belgi(q.valyuta)}</span>
          </td>
          <td className="raqam px-4 py-2.5 text-right text-matn-kuchsiz">
            {pulKorsat(som(q.oldingi))}
          </td>
          <td className="raqam px-4 py-2.5 text-right font-medium">
            {pulKorsat(som(q.keyingi))}
          </td>
          <td className="px-4 py-2.5 text-matn-ikki">{q.kim}</td>
        </tr>
      ))}
    </Jadval>
  );
}

// ─── 2-tab · Kirimlar ─────────────────────────────────────────────────────

export function KirimlarTabi({ qatorlar }: { qatorlar: readonly KirimQatori[] }) {
  if (qatorlar.length === 0) return BOSH;

  return (
    <Jadval
      boshlar={['Hujjat', 'Sana', 'Tarkib', 'Summa', "To'langan", 'Qoldi', 'Muddat', 'Holat']}
    >
      {qatorlar.map((k) => (
        <tr key={k.id}>
          <td className="px-4 py-2.5 whitespace-nowrap">
            <Link href={`/ombor/kirim/${String(k.id)}`} className="text-brend hover:underline">
              {k.raqam}
            </Link>
          </td>
          <td className="raqam px-4 py-2.5 whitespace-nowrap text-matn-ikki">{k.sana}</td>
          <td className="px-4 py-2.5 text-[13px] text-matn-ikki">{k.tarkib}</td>
          <td className="raqam px-4 py-2.5 text-right font-medium whitespace-nowrap">
            {pulKorsat(som(k.summa))}{' '}
            <span className="text-xs font-normal text-matn-kuchsiz">{belgi(k.valyuta)}</span>
          </td>
          <td className="raqam px-4 py-2.5 text-right text-belgi-yashil">
            {pulKorsat(som(k.tolangan))}
          </td>
          <td
            className={`raqam px-4 py-2.5 text-right font-medium ${
              Number(k.qoldi) > 0 ? 'text-belgi-qizil' : 'text-matn-kuchsiz'
            }`}
          >
            {pulKorsat(som(k.qoldi))}
          </td>
          <td className="raqam px-4 py-2.5 whitespace-nowrap text-matn-kuchsiz">
            {k.muddat ?? '—'}
          </td>
          <td className="px-4 py-2.5 text-[13px]">
            {k.holat === 'STORNO' ? (
              <span className="text-belgi-qizil">Storno</span>
            ) : Number(k.qoldi) <= 0 ? (
              <span className="text-belgi-yashil">To&apos;langan</span>
            ) : (
              <span className="text-belgi-sariq">Qarz</span>
            )}
          </td>
        </tr>
      ))}
    </Jadval>
  );
}

// ─── 3-tab · To'lovlar ────────────────────────────────────────────────────

export function TolovlarTabi({ qatorlar }: { qatorlar: readonly TolovQatori[] }) {
  if (qatorlar.length === 0) return BOSH;

  return (
    <Jadval boshlar={['Sana', 'Usul', 'Summa', 'Kurs', 'Qaysi hujjatga', 'Kim']}>
      {qatorlar.map((t) => (
        <tr key={t.id}>
          <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">
            {t.sana.toLocaleDateString('uz-UZ')}
          </td>
          <td className="px-4 py-2.5 text-[13px]">{t.usul}</td>
          <td className="raqam px-4 py-2.5 text-right font-medium whitespace-nowrap">
            {pulKorsat(som(t.summa))}{' '}
            <span className="text-xs font-normal text-matn-kuchsiz">{belgi(t.valyuta)}</span>
          </td>
          <td className="raqam px-4 py-2.5 text-right text-matn-kuchsiz">{t.kurs ?? '—'}</td>
          <td className="px-4 py-2.5 text-[13px] text-matn-ikki">
            {t.hujjat ?? <span className="text-matn-kuchsiz">umumiy balansga</span>}
          </td>
          <td className="px-4 py-2.5 text-matn-ikki">{t.kim}</td>
        </tr>
      ))}
    </Jadval>
  );
}

// ─── 4-tab · Materiallar va narx tarixi (9.8) ─────────────────────────────

/**
 * TZ 9.8 — «oxirgi uchta kirim narxi va o'zgarish foizi».
 *
 * > Ko'k mato: 1 872 000 → 1 950 000 → 2 100 000, 8 oyda +12.2%
 *
 * ⚠️ «Bu ma'lumot boshqa hech qayerdan chiqmaydi» — qaysi material
 *    qimmatlashayotganini faqat shu jadval ko'rsatadi.
 */
export function MateriallarTabi({ qatorlar }: { qatorlar: readonly MaterialQatori[] }) {
  if (qatorlar.length === 0) return BOSH;

  return (
    <Jadval boshlar={['Material', 'Narx tarixi', "O'zgarish"]}>
      {qatorlar.map((m) => (
        <tr key={m.materialId}>
          <td className="px-4 py-2.5">
            <Link
              href={`/ombor/${String(m.materialId)}`}
              className="text-brend hover:underline"
            >
              {m.nom}
            </Link>
          </td>
          <td className="raqam px-4 py-2.5 text-[13px] text-matn-ikki">
            {m.narxlar.map((n) => pulKorsat(som(n.narx))).join(' → ')}{' '}
            <span className="text-xs text-matn-kuchsiz">{belgi(m.valyuta)}</span>
          </td>
          <td className="px-4 py-2.5 text-right whitespace-nowrap">
            {m.ozgarish === null ? (
              <span className="text-[13px] text-matn-kuchsiz">bitta kirim</span>
            ) : (
              <span
                className={`raqam font-medium ${
                  m.ozgarish > 0
                    ? 'text-belgi-qizil'
                    : m.ozgarish < 0
                      ? 'text-belgi-yashil'
                      : 'text-matn-kuchsiz'
                }`}
              >
                {m.oylar !== null && (
                  <span className="mr-1 text-[12px] font-normal text-matn-kuchsiz">
                    {m.oylar} oyda
                  </span>
                )}
                {m.ozgarish > 0 ? '+' : ''}
                {m.ozgarish}%
              </span>
            )}
          </td>
        </tr>
      ))}
    </Jadval>
  );
}

// ─── 5-tab · Brak va da'volar (9.9) ───────────────────────────────────────

/**
 * TZ 9.9 — «Kirimda "qaytariladi" deb belgilangan defekt hal
 * qilinmaguncha shu tabda turadi.»
 *
 * ⚠️ Ikki tugma (9.9):
 *      «Qabul qildi» → qarzimiz KAMAYADI, xarajat yo'q
 *      «O'zimizga»   → XARAJAT yoziladi, qarz o'zgarmaydi
 *
 *    Ikkalasi ham kassaga tegmaydi (12.1).
 */
export function DavolarTabi({ qatorlar }: { qatorlar: readonly DavoQatori[] }) {
  if (qatorlar.length === 0) return BOSH;

  const ochiq = qatorlar.filter((d) => !d.yopilgan && d.turi === 'QAYTARILADI');
  const tarix = qatorlar.filter((d) => d.yopilgan || d.turi !== 'QAYTARILADI');

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-sm font-medium text-matn-ikki">
          Ochiq da&apos;volar
          {ochiq.length > 0 && <span className="raqam ml-1.5">{ochiq.length}</span>}
        </h3>
        {ochiq.length === 0 ? (
          <p className="text-sm text-belgi-yashil">Ochiq da&apos;vo yo&apos;q.</p>
        ) : (
          <Jadval boshlar={['Hujjat', 'Sana', 'Material', 'Miqdor', 'Summa', 'Qaror']}>
            {ochiq.map((d) => (
              <tr key={d.qatorId}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/ombor/kirim/${String(d.kirimId)}`}
                    className="text-brend hover:underline"
                  >
                    {d.kirimRaqam}
                  </Link>
                </td>
                <td className="raqam px-4 py-2.5 text-matn-ikki">{d.sana}</td>
                <td className="px-4 py-2.5">{d.materialNom}</td>
                <td className="raqam px-4 py-2.5 text-right">{d.miqdor}</td>
                <td className="raqam px-4 py-2.5 text-right font-medium text-belgi-sariq">
                  {pulKorsat(som(d.summa))}{' '}
                  <span className="text-xs font-normal text-matn-kuchsiz">
                    {belgi(d.valyuta)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <DavoTugmalari qatorId={d.qatorId} materialNomi={d.materialNom} />
                </td>
              </tr>
            ))}
          </Jadval>
        )}
      </div>

      {tarix.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-matn-ikki">Brak tarixi</h3>
          <Jadval boshlar={['Hujjat', 'Sana', 'Material', 'Miqdor', 'Qayerga']}>
            {tarix.map((d) => (
              <tr key={d.qatorId}>
                <td className="px-4 py-2.5 text-matn-ikki">{d.kirimRaqam}</td>
                <td className="raqam px-4 py-2.5 text-matn-ikki">{d.sana}</td>
                <td className="px-4 py-2.5">{d.materialNom}</td>
                <td className="raqam px-4 py-2.5 text-right">{d.miqdor}</td>
                <td className="px-4 py-2.5 text-[13px] text-matn-kuchsiz">
                  {d.turi === 'QAYTARILADI' ? "Qaytarildi — da'vo yopilgan" : "O'zimizga (brak)"}
                </td>
              </tr>
            ))}
          </Jadval>
        </div>
      )}
    </div>
  );
}

// ─── 6-tab · Izohlar ──────────────────────────────────────────────────────

/**
 * TZ 9.7 — «erkin matn, xodim va sana bilan».
 *
 * ⚠️ Eski `yetkazib_beruvchi.eslatma` ustuni ham ko'rsatiladi: unda
 *    yozilgan gaplar yo'qolmasin (2.1-invariant). Yangi izohlar
 *    alohida jadvalda, har biri o'z egasi va sanasi bilan.
 */
export function IzohlarTabi({
  yetkazibBeruvchiId,
  izohlar,
  eslatma,
}: {
  yetkazibBeruvchiId: number;
  izohlar: readonly IzohQatori[];
  eslatma: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <IzohFormasi yetkazibBeruvchiId={yetkazibBeruvchiId} />

      {eslatma !== null && eslatma.trim() !== '' && (
        <div className="rounded-karta border border-chegara bg-fon px-4 py-3">
          <div className="mb-1 text-[12px] text-matn-kuchsiz">
            Kartochkadagi eslatma
          </div>
          <p className="text-sm whitespace-pre-wrap">{eslatma}</p>
        </div>
      )}

      {izohlar.length === 0 ? (
        BOSH
      ) : (
        <ul className="flex flex-col gap-2">
          {izohlar.map((i) => (
            <li
              key={i.id}
              className="rounded-karta border border-chegara bg-sirt px-4 py-3"
            >
              <p className="text-sm whitespace-pre-wrap">{i.matn}</p>
              <p className="mt-1.5 text-[12px] text-matn-kuchsiz">
                {i.kim} · {i.sana.toLocaleDateString('uz-UZ')}{' '}
                {i.sana.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
