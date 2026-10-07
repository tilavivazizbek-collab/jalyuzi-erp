import Link from 'next/link';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { OddiyChopTugmasi } from '../../chop-tugma';
import { YORLIQ_ENG_KOP, yorliqBolaklari, type YorliqBolagi } from '../joy-malumot';

export const dynamic = 'force-dynamic';

/**
 * QR YORLIQLAR — rulonga yopishtiriladi (0062). Ombor auditi 2026-10-07.
 *
 * ⚠️ VARAQ — standart A4 stiker (3 × 7 = 21 ta, 63.5 × 38.1 mm). Har
 *    kanselyariyada sotiladi va oddiy ofis printerida chop etiladi —
 *    alohida yorliq printeri shart emas.
 *
 * ⚠️ QR ichida TO'LIQ MANZIL — telefon kamerasi uni ochadi va bo'lak
 *    sahifasiga olib boradi. Manzil so'rovning o'zidan olinadi: sayt
 *    qaysi domenda ishlasa (lokal, Render, keyin o'z domeni) — o'sha.
 *
 * Manba (bittasi): `?id=1,2,3` · `?material=7` · `?kirim=12`
 */
export default async function Yorliqlar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const sp = await searchParams;
  const bir = (k: string): string => (typeof sp[k] === 'string' ? sp[k] : '');
  const son = (x: string): number | undefined => {
    const n = Number(x);
    return x !== '' && Number.isSafeInteger(n) && n > 0 ? n : undefined;
  };

  const idlar = bir('id')
    .split(',')
    .map((x) => son(x.trim()))
    .filter((x): x is number => x !== undefined);
  const bolaklar = await yorliqBolaklari(
    f.filialId,
    idlar.length > 0
      ? { idlar }
      : son(bir('material')) !== undefined
        ? { materialId: son(bir('material')) }
        : { kirimId: son(bir('kirim')) ?? 0 },
  );

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const asos = `${proto}://${host}`;

  const qrlar = await Promise.all(
    bolaklar.map((b) =>
      QRCode.toString(`${asos}/ombor/bolak/${String(b.id)}`, {
        type: 'svg',
        margin: 0,
        /** Yorliq ishqalanadi, burchagi yirtiladi — yuqori tiklanish darajasi */
        errorCorrectionLevel: 'Q',
      }),
    ),
  );

  return (
    <div className="flex flex-col gap-5">
      {/*
        ⚠️ Sahifa o'lchami SHU YERDA: A4 stiker varag'i. Chetlar standart
           varaqqa mos (yuqori 15 mm, yon 7 mm).
      */}
      <style>{`
        @media print { @page { size: A4; margin: 15mm 7mm 0 7mm } }
        .yorliq-varaq { display: grid; grid-template-columns: repeat(3, 63.5mm); grid-auto-rows: 38.1mm; column-gap: 2.5mm; }
        .yorliq { box-sizing: border-box; break-inside: avoid; overflow: hidden; }
        .yorliq-qr svg { width: 100%; height: 100%; }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            QR yorliqlar
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {bolaklar.length} ta · A4 stiker varag&apos;i, 3 × 7 (63.5 × 38.1 mm). Telefon
            kamerasi bilan skanerlansa — bo&apos;lak sahifasi ochiladi.
            {bolaklar.length >= YORLIQ_ENG_KOP && ` Bir martada ko'pi bilan ${String(YORLIQ_ENG_KOP)} ta.`}
          </p>
        </div>
        {bolaklar.length > 0 && <OddiyChopTugmasi matn="Yorliqlarni chop etish" />}
      </div>

      {bolaklar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Yorliq chop etiladigan bo&apos;lak yo&apos;q — omborda turgani bo&apos;lishi kerak.
        </p>
      ) : (
        <div className="varaqa overflow-x-auto bg-white p-2 text-black">
          <div className="yorliq-varaq">
            {bolaklar.map((b, i) => (
              <Yorliq key={b.id} b={b} qr={qrlar[i] ?? ''} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Yorliq({ b, qr }: { b: YorliqBolagi; qr: string }) {
  const olcham =
    b.turi === 'DONA'
      ? `${b.miqdor ?? '0'} dona`
      : b.eniM !== null && b.boyiM !== null
        ? `${b.eniM} × ${b.boyiM} m`
        : '';
  return (
    <div className="yorliq flex gap-[2mm] border border-dashed border-neutral-300 p-[2mm] print:border-0">
      {/* SVG serverda `qrcode` bilan yasaladi — o'zgarmas matn, foydalanuvchi kiritgani emas */}
      <div
        className="yorliq-qr h-[30mm] w-[30mm] shrink-0"
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <div className="flex min-w-0 flex-col justify-between text-[9pt] leading-tight">
        <div>
          <p className="line-clamp-2 font-bold">{b.materialNomi}</p>
          <p className="mt-[1mm] text-[11pt] font-bold">{olcham}</p>
        </div>
        <div className="text-[7.5pt]">
          <p className="font-mono">{b.kod}</p>
          {b.joyNomi !== null && <p>Joy: {b.joyNomi}</p>}
          {b.kirimSana !== null && <p>Kirim: {b.kirimSana}</p>}
        </div>
      </div>
    </div>
  );
}
