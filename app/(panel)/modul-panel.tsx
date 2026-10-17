/**
 * TZ 11.11 — har modul sahifasining tepasidagi ko'rsatkichlar paneli. 2026-10-17
 *
 * «Tuzilishi hamma joyda bir xil»:
 *   1 — Holat  : hozir nima bor (qoldiq, balans, soni)
 *   2 — Davr   : bu oy nima bo'ldi, o'tgan davr bilan taqqoslab
 *   3 — Diqqat : harakat talab qiladiganlar, raqam va havola bilan
 *
 * ⚠️ Panel HISOBLANADI, saqlanmaydi — raqamlarni sahifa o'z modulining
 *    mavjud funksiyalaridan beradi; bu komponent faqat ko'rsatadi.
 * ⚠️ Diqqat bandida son 0 bo'lsa kulrang — muammo yo'qligi ham ma'lumot.
 */
import Link from 'next/link';

export interface PanelBandi {
  readonly nom: string;
  readonly qiymat: string;
  /** Ikkinchi qator: dollar, taqqoslash yoki izoh */
  readonly izoh?: string | null;
  readonly havola?: string;
  /** Faqat «Diqqat» qatorida: `xavf` — qizil, `ogoh` — sariq, `null` — kulrang (nol) */
  readonly ton?: 'xavf' | 'ogoh' | null;
}

const QATOR_NOMI = { holat: 'Holat', davr: 'Bu oy', diqqat: 'Diqqat' } as const;

export function ModulPanel({
  holat,
  davr,
  diqqat,
}: {
  holat: readonly PanelBandi[];
  davr: readonly PanelBandi[];
  diqqat: readonly PanelBandi[];
}) {
  return (
    <section aria-label="Ko'rsatkichlar" className="flex flex-col gap-2">
      {(['holat', 'davr', 'diqqat'] as const).map((qator) => {
        const bandlar = qator === 'holat' ? holat : qator === 'davr' ? davr : diqqat;
        if (bandlar.length === 0) return null;
        return (
          <div key={qator} className="grid grid-cols-[4.5rem_1fr] items-start gap-3">
            <span className="pt-2 text-[11px] font-medium uppercase tracking-wide text-matn-kuchsiz">
              {QATOR_NOMI[qator]}
            </span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {bandlar.map((b) => (
                <Band key={b.nom} b={b} diqqat={qator === 'diqqat'} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function Band({ b, diqqat }: { b: PanelBandi; diqqat: boolean }) {
  const ton = diqqat ? (b.ton ?? null) : null;
  const sinf = `flex flex-col rounded-karta border px-3 py-2 ${
    ton === 'xavf'
      ? 'border-belgi-qizil/30 bg-belgi-qizil-fon'
      : ton === 'ogoh'
        ? 'border-belgi-sariq/30 bg-belgi-sariq-fon'
        : 'border-chegara bg-sirt'
  }`;
  const qiymatRang =
    ton === 'xavf' ? 'text-belgi-qizil' : ton === 'ogoh' ? 'text-belgi-sariq' : diqqat ? 'text-matn-kuchsiz' : 'text-matn';
  const ichi = (
    <>
      <span className="text-[12px] text-matn-ikki">{b.nom}</span>
      <span className={`text-[17px] font-semibold tabular-nums ${qiymatRang}`}>{b.qiymat}</span>
      {b.izoh !== undefined && b.izoh !== null && <span className="text-[11px] text-matn-kuchsiz">{b.izoh}</span>}
    </>
  );
  return b.havola === undefined ? (
    <div className={sinf}>{ichi}</div>
  ) : (
    <Link href={b.havola} className={`fokus ${sinf} transition-colors hover:bg-fon`}>
      {ichi}
    </Link>
  );
}
