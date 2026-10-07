import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { BOLAK_HOLAT_NOMI, BOLAK_TURI_NOMI } from '@/lib/domain/ombor-harakat';
import { bolakTafsiloti, filialJoylari } from '../../joy-malumot';
import { BolakJoyFormasi } from '../../joy-forma';

export const dynamic = 'force-dynamic';

/**
 * Bitta bo'lak — QR yorliq skanerlanganda SHU sahifa ochiladi (0062).
 * Ombor auditi 2026-10-07, 6-band.
 *
 * ⚠️ TELEFONDA ochiladi — omborchi rulon oldida turibdi. Shuning uchun:
 *    katta yozuv, eng muhimi tepada (nima, qancha, qayerda), joyni
 *    o'zgartirish shu yerning o'zida.
 * ⚠️ Faqat o'z filiali (Q-25) — boshqa filialning rulonini skanerlasa
 *    «topilmadi».
 * ⚠️ TANNARX YO'Q — sahifa omborchi va sotuvchiga bir xil (TZ 11.10).
 */
export default async function BolakSahifasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const joyQoyaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');

  const { id } = await params;
  const bolakId = Number(id);
  if (!Number.isSafeInteger(bolakId) || bolakId <= 0) notFound();

  const [b, joylar] = await Promise.all([
    bolakTafsiloti(bolakId, f.filialId),
    joyQoyaOladi ? filialJoylari(f.filialId) : Promise.resolve([]),
  ]);
  if (b === null) notFound();

  const omborda = b.holat === 'BOSH' || b.holat === 'BAND' || b.holat === 'YOLDA';
  const olcham =
    b.turi === 'DONA'
      ? `${b.miqdor ?? '0'} dona`
      : b.eniM !== null && b.boyiM !== null
        ? `${b.eniM} × ${b.boyiM} m`
        : '—';

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div>
        <Link
          href={`/ombor/${String(b.materialId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← {b.materialNomi}
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          {b.materialNomi}
        </h1>
        <p className="raqam mt-1 text-sm text-matn-kuchsiz">{b.kod}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">O&apos;lcham</dt>
          <dd className="raqam mt-1 text-xl font-semibold">{olcham}</dd>
          <dd className="mt-0.5 text-xs text-matn-kuchsiz">
            {BOLAK_TURI_NOMI[b.turi] ?? b.turi}
            {b.ochilgan && b.turi === 'RULON' ? ' · ochilgan' : ''}
          </dd>
        </div>
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Joyi</dt>
          <dd className={`mt-1 text-xl font-semibold ${b.joyNomi === null ? 'text-matn-kuchsiz' : ''}`}>
            {b.joyNomi ?? 'yozilmagan'}
          </dd>
          <dd className="mt-0.5 text-xs text-matn-kuchsiz">
            holati: {BOLAK_HOLAT_NOMI[b.holat] ?? b.holat}
          </dd>
        </div>
      </dl>

      {!omborda && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-[13px] text-belgi-sariq">
          Bu bo&apos;lak endi omborda yo&apos;q ({BOLAK_HOLAT_NOMI[b.holat] ?? b.holat}). Yorliqni
          olib tashlang.
        </p>
      )}

      {omborda && joyQoyaOladi && (
        <section className="rounded-karta border border-chegara bg-sirt p-4">
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Joyini o&apos;zgartirish</h2>
          <BolakJoyFormasi joylar={joylar} joriyJoyId={b.joyId} bolakIdlar={[b.id]} />
        </section>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <dt className="text-matn-kuchsiz">Kirim</dt>
        <dd>
          {b.kirimId === null ? (
            <span className="text-matn-kuchsiz">boshlang&apos;ich qoldiq yoki kesmadan</span>
          ) : (
            <Link href={`/ombor/kirim/${String(b.kirimId)}`} className="text-brend hover:underline">
              {b.kirimRaqam} · {b.kirimSana}
            </Link>
          )}
        </dd>
        <dt className="text-matn-kuchsiz">Omborga tushgan</dt>
        <dd>{b.yaratildi.toLocaleDateString('uz-UZ')}</dd>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/ombor/${String(b.materialId)}`}
          className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki hover:bg-fon"
        >
          Material kartochkasi
        </Link>
        {omborda && (
          <Link
            href={`/ombor/yorliq?id=${String(b.id)}`}
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki hover:bg-fon"
          >
            Yorliqni qayta chop etish
          </Link>
        )}
      </div>
    </div>
  );
}
