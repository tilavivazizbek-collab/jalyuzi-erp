import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { buyurtmaCheki, chekChopEtilganmi } from '@/lib/amal/chek';
import { biznesXatosimi } from '@/lib/xato';
import type { Chek } from '@/lib/domain/chek';
import { ChopTugmasi } from './chop-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/buyurtma/[id]/chek` — TZ 8.9 · 8.13 · 8.14 · 13.7 · 14.3
 *
 * 80 mm termoprinter uchun sotuv cheki.
 *
 * ⚠️ Chek FAQAT to'liq yopilgan buyurtmada ochiladi. Qisman
 *    topshirishda kvitansiya chiqadi — u boshqa hujjat va bu
 *    sahifaga aloqasi yo'q.
 */
export default async function ChekSahifasi({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('buyurtma.kor');

  const { id } = await params;
  const buyurtmaId = Number(id);
  if (!Number.isSafeInteger(buyurtmaId) || buyurtmaId <= 0) notFound();

  let chek: Chek | null;
  try {
    chek = await buyurtmaCheki(ulanishOl(), buyurtmaId, f.filialId);
  } catch (x) {
    /** 8.9 — yopilmagan buyurtma: sabab tushuntiriladi, 404 emas */
    if (biznesXatosimi(x) && x.kod === 'CHEK_BUYURTMA_OCHIQ') {
      return <ChekYoq buyurtmaId={buyurtmaId} sabab={x.message} />;
    }
    throw x;
  }

  if (chek === null) notFound();

  const [qrSvg, ilgariChopEtilgan] = await Promise.all([
    QRCode.toString(chek.qrMatni, {
      type: 'svg',
      margin: 0,
      /** Termoprinterda mayda nuqta yopishib ketadi — o'rta daraja yetarli */
      errorCorrectionLevel: 'M',
    }),
    chekChopEtilganmi(ulanishOl(), buyurtmaId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {/* ⚠️ Bu blok chop etilmaydi — `.chek` dan tashqarida */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/buyurtma/${String(buyurtmaId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← Buyurtma kartochkasi
        </Link>
        <div className="flex items-center gap-3">
          {ilgariChopEtilgan && (
            <span className="text-xs text-matn-kuchsiz">
              bu chek ilgari chop etilgan — qayta chiqarish jurnalga yoziladi
            </span>
          )}
          <ChopTugmasi buyurtmaId={buyurtmaId} />
        </div>
      </div>

      {chek.korxonaNom === null && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Korxona nomi sozlanmagan — chek nomsiz chiqadi.{' '}
          <Link href="/sozlama" className="underline">
            Sozlamalar
          </Link>
        </p>
      )}

      <ChekBlogi chek={chek} qrSvg={qrSvg} />
    </div>
  );
}

/**
 * 80 mm chek.
 *
 * ⚠️ `chek` klassi — chop etishda FAQAT shu blok qog'ozga tushadi
 *    (global.css). Ichidagi o'lchamlar mm da: piksel ekranda to'g'ri
 *    ko'rinib, qog'ozda siljib ketardi.
 */
function ChekBlogi({ chek, qrSvg }: { chek: Chek; qrSvg: string }) {
  return (
    <div className="chek border border-chegara bg-white p-[3mm] text-black">
      {/* ── Korxona (14.3) ── */}
      <div className="text-center leading-tight">
        {chek.korxonaNom !== null && (
          <div className="text-[11pt] font-bold uppercase">{chek.korxonaNom}</div>
        )}
        {chek.korxonaManzil !== null && <div className="text-[8pt]">{chek.korxonaManzil}</div>}
        {chek.korxonaTelefon !== null && <div className="text-[8pt]">{chek.korxonaTelefon}</div>}
      </div>

      <Chiziq />

      {/* ── Chek boshi (8.9 · 8.14) ── */}
      <div className="text-[8pt] leading-snug">
        <Juft yorliq="Chek №" qiymat={chek.chekRaqam} />
        <Juft yorliq="Sana" qiymat={chek.sanaMatn} />
        <Juft yorliq="Sotuvchi" qiymat={chek.sotuvchi} />
        {chek.mijoz !== null && <Juft yorliq="Mijoz" qiymat={chek.mijoz} />}
      </div>

      <Chiziq />

      {/* ── Pozitsiyalar (8.14) ── */}
      <div className="flex flex-col gap-[1.5mm] text-[8pt] leading-snug">
        {chek.qatorlar.map((q) => (
          <div key={q.tartib}>
            <div className="flex items-start justify-between gap-[2mm]">
              {/* ⚠️ Uzun nom qatorga sig'masa ikkinchi qatorga o'tadi */}
              <span className="min-w-0 flex-1 break-words">{q.sarlavha}</span>
              <span className="raqam shrink-0 font-semibold">{q.narx}</span>
            </div>

            {q.miqdor !== null && <div className="text-[7.5pt]">{q.miqdor}</div>}

            {/*
              ⚠️ Tarkib NARXSIZ va xira: mijoz nima berilganini
                 ko'radi, ichki narxni emas.
            */}
            {q.tarkib.map((t) => (
              <div key={t} className="pl-[3mm] text-[7pt] text-neutral-500">
                {t}
              </div>
            ))}

            {q.izoh !== null && (
              <div className="pl-[3mm] text-[7pt] text-neutral-500">{q.izoh}</div>
            )}
          </div>
        ))}
      </div>

      <Chiziq />

      {/* ── Pul bloki (8.13) ── */}
      <div className="text-[8pt] leading-snug">
        <Juft yorliq="Hisoblangan" qiymat={chek.hisoblangan} raqam />
        {chek.chegirma !== null && <Juft yorliq="Chegirma" qiymat={chek.chegirma} raqam />}
        <Juft yorliq="Jami" qiymat={chek.jami} raqam qalin />
        <Juft yorliq="To'langan" qiymat={chek.tolangan} raqam />
        {/* ⚠️ Qarz nol bo'lsa bu qator UMUMAN yo'q (8.13) */}
        {chek.qarz !== null && <Juft yorliq="Qarz (shu savdodan)" qiymat={chek.qarz} raqam qalin />}
      </div>

      {/* ── Umumiy qarz (6.8) ── */}
      {chek.qarzKeyin.length > 0 && (
        <>
          <Chiziq />
          <div className="text-[8pt] leading-snug">
            <div className="font-semibold">Oldingi qarz</div>
            {chek.qarzOldin.map((q) => (
              <Juft key={q.valyuta} yorliq="" qiymat={q.matn} raqam />
            ))}
            <div className="mt-[1mm] font-semibold">Savdodan keyingi qarz</div>
            {chek.qarzKeyin.map((q) => (
              <Juft key={q.valyuta} yorliq="" qiymat={q.matn} raqam />
            ))}
          </div>
        </>
      )}

      <Chiziq />

      {/* ── QR va raqam ── */}
      <div className="flex flex-col items-center gap-[1mm]">
        <div
          className="h-[22mm] w-[22mm] [&>svg]:h-full [&>svg]:w-full"
          /**
           * ⚠️ SVG serverda `qrcode` kutubxonasi bilan yasaladi va
           *    o'zgarmas matn: foydalanuvchi kiritgan ma'lumot emas.
           */
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        {/* Skaner ishlamasa qo'lda kiritish uchun */}
        <div className="raqam text-[8pt] tracking-wide">{chek.qrRaqam}</div>
      </div>

      <Chiziq />

      {/* ── Bot va xayrlashuv (13.7) ── */}
      <div className="text-center text-[7.5pt] leading-snug">
        {chek.botUsername !== null && <div>Balansni @{chek.botUsername} da tekshiring</div>}
        <div className="mt-[1mm] text-[9pt] font-semibold">Rahmat!</div>
      </div>
    </div>
  );
}

function Chiziq() {
  return <div className="my-[1.5mm] border-t border-dashed border-neutral-400" />;
}

function Juft({
  yorliq,
  qiymat,
  raqam = false,
  qalin = false,
}: {
  yorliq: string;
  qiymat: string;
  raqam?: boolean;
  qalin?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-[2mm] ${qalin ? 'font-bold' : ''}`}>
      <span className="shrink-0">{yorliq}</span>
      <span className={`min-w-0 break-words text-right ${raqam ? 'raqam' : ''}`}>{qiymat}</span>
    </div>
  );
}

/** 8.9 — buyurtma hali yopilmagan */
function ChekYoq({ buyurtmaId, sabab }: { buyurtmaId: number; sabab: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/buyurtma/${String(buyurtmaId)}`}
        className="text-sm text-matn-kuchsiz hover:text-matn"
      >
        ← Buyurtma kartochkasi
      </Link>
      <p className="max-w-lg rounded-karta bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq">
        {sabab}
      </p>
      <p className="max-w-lg text-sm text-matn-kuchsiz">
        Qisman topshirishda kvitansiya beriladi — chek esa barcha pozitsiya topshirilgach, bir marta
        chiqadi (8.9).
      </p>
    </div>
  );
}
