/**
 * app/(panel)/qism.tsx — TIZIMNING QURILISH BLOKLARI.
 *
 * ⚠️ Har sahifa shu yerdagi qismlardan quriladi. Sahifa o'z
 *    uslubini yozmaydi.
 *
 *    Sabab: 39 ta sahifa bor. Har biri o'zicha bo'yalsa, bir
 *    haftada ular bir-biridan uzoqlashadi — bir joyda jadval
 *    sarlavhasi kulrang, boshqasida qora bo'lib qoladi. Bir
 *    joyni o'zgartirish butun tizimga tarqalishi kerak.
 *
 * ⚠️ Rang, o'lcham va bo'shliq `app/global.css` dagi nomlangan
 *    qiymatlardan olinadi. Bu yerda `#123456` yozilmaydi.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

// ─── Sahifa sarlavhasi ────────────────────────────────────────────────────

/**
 * Har sahifaning boshi: nom, tushuntirish va asosiy amal.
 *
 * ⚠️ Tushuntirish MAJBURIY emas. Sarlavha o'zi tushunarli bo'lsa
 *    ortiqcha gap yozilmaydi — ekran shovqinsiz qolsin.
 */
export function Sarlavha({ nom, izoh, amal }: { nom: string; izoh?: string; amal?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">{nom}</h1>
        {izoh !== undefined && <p className="mt-0.5 text-[13px] text-matn-ikki">{izoh}</p>}
      </div>
      {amal}
    </div>
  );
}

// ─── Tugmalar ─────────────────────────────────────────────────────────────

const TUGMA_ASOS =
  'fokus inline-flex items-center justify-center rounded-maydon text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const TUGMA_OLCHAM = 'px-4 py-2.5';

/**
 * Asosiy amal — ekranda **BITTA** bo'ladi.
 *
 * ⚠️ Ikkita qora tugma bo'lsa ko'z qayerga qarashni bilmaydi.
 *    Ikkinchi darajali amallar `IkkilamchiTugma` bilan.
 */
export function BirlamchiTugma({
  children,
  ...qolgan
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...qolgan}
      className={`${TUGMA_ASOS} ${TUGMA_OLCHAM} bg-amal text-white hover:bg-amal-hover`}
    >
      {children}
    </button>
  );
}

export function IkkilamchiTugma({
  children,
  ...qolgan
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...qolgan}
      className={`${TUGMA_ASOS} ${TUGMA_OLCHAM} border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn`}
    >
      {children}
    </button>
  );
}

/**
 * Qaytarib bo'lmaydigan amal — storno, bekor qilish, hisobdan
 * chiqarish.
 *
 * ⚠️ Qizil ATAYLAB kam ishlatiladi: har joyda bo'lsa odam unga
 *    ko'nikadi va haqiqiy xavfni sezmay qoladi.
 */
export function XatarliTugma({
  children,
  ...qolgan
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...qolgan}
      className={`${TUGMA_ASOS} ${TUGMA_OLCHAM} bg-belgi-qizil text-white hover:brightness-95`}
    >
      {children}
    </button>
  );
}

/** Havola ko'rinishidagi asosiy amal. */
export function BirlamchiHavola({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`${TUGMA_ASOS} ${TUGMA_OLCHAM} bg-amal text-white hover:bg-amal-hover`}
    >
      {children}
    </Link>
  );
}

export function IkkilamchiHavola({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`${TUGMA_ASOS} ${TUGMA_OLCHAM} border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn`}
    >
      {children}
    </Link>
  );
}

// ─── Karta ────────────────────────────────────────────────────────────────

export function Karta({
  sarlavha,
  yon,
  children,
}: {
  sarlavha?: string;
  yon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt">
      {sarlavha !== undefined && (
        <div className="flex items-baseline justify-between gap-3 border-b border-chegara px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-matn">{sarlavha}</h2>
          {yon}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Jadval ───────────────────────────────────────────────────────────────

/**
 * ⚠️ Jadval har doim `overflow-x-auto` ichida: tor ekranda sahifa
 *    emas, JADVAL suriladi. Aks holda butun sahifa qiyshayib
 *    ketadi.
 */
export function Jadval({
  ustunlar,
  children,
}: {
  ustunlar: readonly { nom: string; ong?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-[13px]">
        <thead className="border-b border-chegara text-left text-[11px] font-medium tracking-[0.04em] text-matn-kuchsiz uppercase">
          <tr>
            {ustunlar.map((u) => (
              <th key={u.nom} className={`px-4 py-3 ${u.ong === true ? 'text-right' : ''}`}>
                {u.nom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara">{children}</tbody>
      </table>
    </div>
  );
}

/** Jadval qatori — sichqoncha tegganda yorishadi. */
export function Qator({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-fon">{children}</tr>;
}

export function Katak({
  children,
  ong,
  raqam,
  kuchsiz,
}: {
  children: ReactNode;
  ong?: boolean;
  /** Pul va o'lcham — tik turishi uchun */
  raqam?: boolean;
  kuchsiz?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 ${ong === true ? 'text-right' : ''} ${
        raqam === true ? 'raqam' : ''
      } ${kuchsiz === true ? 'text-matn-kuchsiz' : ''}`}
    >
      {children}
    </td>
  );
}

// ─── Nishoncha ────────────────────────────────────────────────────────────

export type NishonchaRangi = 'yashil' | 'sariq' | 'qizil' | 'brend' | 'kulrang';

const NISHONCHA: Record<NishonchaRangi, string> = {
  yashil: 'bg-belgi-yashil-fon text-belgi-yashil',
  sariq: 'bg-belgi-sariq-fon text-belgi-sariq',
  qizil: 'bg-belgi-qizil-fon text-belgi-qizil',
  brend: 'bg-brend-fon text-brend',
  kulrang: 'bg-fon text-matn-ikki',
};

/**
 * Holat nishonchasi.
 *
 * ⚠️ Rang BIZNES MA'NOSIGA ega va o'zgartirilmaydi:
 *    yashil — tugadi · sariq — kutmoqda · qizil — muammo.
 *    Xodimlar buni yodlab oladi.
 */
export function Nishoncha({
  children,
  rang = 'kulrang',
}: {
  children: ReactNode;
  rang?: NishonchaRangi;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${NISHONCHA[rang]}`}
    >
      {children}
    </span>
  );
}

// ─── Bosh harf ────────────────────────────────────────────────────────────

/**
 * ⚠️ Uzun ro'yxatda ko'z ismlarni o'qib chiqmaydi — shakl bo'yicha
 *    topadi. Shuning uchun mijoz va xodim nomi oldida dumaloq
 *    belgi turadi.
 */
export function BoshHarf({ ism }: { ism: string | null }) {
  const harf = (ism ?? '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brend-fon text-[12px] font-semibold text-brend"
      aria-hidden="true"
    >
      {harf === '' ? '?' : harf}
    </span>
  );
}

// ─── Bo'sh holat ──────────────────────────────────────────────────────────

/**
 * ⚠️ Bo'sh ekran «xato» emas. Shuning uchun u qizil emas va
 *    KEYINGI QADAMNI aytadi: «Kirim hujjati bilan boshlanadi».
 *    Quruq «ma'lumot yo'q» odamni to'xtatib qo'yadi.
 */
export function Bosh({ matn, qadam, amal }: { matn: string; qadam?: string; amal?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-karta border border-dashed border-chegara-quyuq px-4 py-12 text-center">
      <p className="text-[14px] font-medium text-matn-ikki">{matn}</p>
      {qadam !== undefined && <p className="max-w-sm text-[13px] text-matn-kuchsiz">{qadam}</p>}
      {amal}
    </div>
  );
}

// ─── Xabarlar ─────────────────────────────────────────────────────────────

export function Xato({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-maydon bg-belgi-qizil-fon px-3.5 py-2.5 text-[13px] text-belgi-qizil"
    >
      {children}
    </p>
  );
}

export function Muvaffaqiyat({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-maydon bg-belgi-yashil-fon px-3.5 py-2.5 text-[13px] text-belgi-yashil">
      {children}
    </p>
  );
}

/**
 * ⚠️ Ogohlantirish — «bu xato emas, lekin bilib qo'ying». Masalan
 *    material yetishmasligi (Q-03): buyurtma baribir yoziladi.
 */
export function Ogoh({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-maydon bg-belgi-sariq-fon px-3.5 py-2.5 text-[13px] text-belgi-sariq">
      {children}
    </p>
  );
}

// ─── Filtr tugmalari ──────────────────────────────────────────────────────

export function FiltrQatori({ children }: { children: ReactNode }) {
  return <nav className="flex flex-wrap gap-2">{children}</nav>;
}

export function FiltrTugmasi({
  href,
  faol,
  children,
}: {
  href: string;
  faol: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={faol ? 'page' : undefined}
      className={`fokus rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        faol
          ? 'bg-brend text-white'
          : 'border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn'
      }`}
    >
      {children}
    </Link>
  );
}
