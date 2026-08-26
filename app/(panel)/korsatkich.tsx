/**
 * app/(panel)/korsatkich.tsx — ko'rsatkich kartasi.
 *
 * ⚠️ Har karta O'Z rangida. Bu bezak emas: egasi ertalab ekranga
 *    qaraydi va «tushum qani, qarz qani» deb o'qib chiqmaydi —
 *    rang bo'yicha topadi. Rang o'zgarmaydi, chunki u yodlab
 *    olinadi.
 *
 * ⚠️ Raqam KATTA va qalin, sarlavha mayda va kuchsiz. Ko'z avval
 *    raqamga tushishi kerak — sarlavha faqat tushuntiradi.
 */

export type BelgiRangi = 'kok' | 'yashil' | 'qizil' | 'sariq';

const RANG: Record<BelgiRangi, string> = {
  kok: 'bg-belgi-kok-fon text-belgi-kok',
  yashil: 'bg-belgi-yashil-fon text-belgi-yashil',
  qizil: 'bg-belgi-qizil-fon text-belgi-qizil',
  sariq: 'bg-belgi-sariq-fon text-belgi-sariq',
};

export function KorsatkichKartasi({
  sarlavha,
  qiymat,
  izoh,
  rang,
  belgi,
}: {
  sarlavha: string;
  qiymat: string;
  izoh?: string;
  rang: BelgiRangi;
  belgi: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-karta border border-chegara bg-sirt p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium tracking-[0.03em] text-matn-kuchsiz uppercase">
          {sarlavha}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${RANG[rang]}`}
          aria-hidden="true"
        >
          {belgi}
        </span>
      </div>

      <div>
        <p className="raqam text-left text-[22px] leading-none font-semibold tracking-[-0.02em] text-matn">
          {qiymat}
        </p>
        {izoh !== undefined && <p className="mt-1.5 text-[12px] text-matn-kuchsiz">{izoh}</p>}
      </div>
    </div>
  );
}

// ─── Belgilar ─────────────────────────────────────────────────────────────
// ⚠️ SVG ichkarida: tashqi kutubxona qo'shilmasin (§12 — stek
//    o'zgartirilmaydi) va ular oflaynda ham chizilsin.

const chiziq = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function SavatBelgisi() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...chiziq}>
      <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 7H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}

export function PulBelgisi() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...chiziq}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function QarzBelgisi() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...chiziq}>
      <path d="M12 3v18M8 7h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h7" />
    </svg>
  );
}

export function QutiBelgisi() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...chiziq}>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12m0 9V12m8.5-4.5L12 12" />
    </svg>
  );
}
