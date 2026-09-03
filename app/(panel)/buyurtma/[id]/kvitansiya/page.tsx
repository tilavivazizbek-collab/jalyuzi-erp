import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { buyurtmaKvitansiyasi } from '@/lib/amal/chek';
import type { Kvitansiya } from '@/lib/domain/kvitansiya';
import type { ChekQatori } from '@/lib/domain/chek';
import { OddiyChopTugmasi } from '../../../chop-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/buyurtma/[id]/kvitansiya` — TZ 8.9
 *
 * QISMAN TOPSHIRISH KVITANSIYASI. Mijoz buyurtmaning bir qismini
 * olib ketayotganda qo'liga beriladigan qog'oz.
 *
 * ⚠️ Chek bilan ADASHTIRMASLIK kerak:
 *
 *      chek       → buyurtma TO'LIQ yopilgach, bir marta, QR bilan
 *      kvitansiya → istalgan payt, necha marta kerak bo'lsa, QRsiz
 *
 *    Shuning uchun bu sahifa chek jurnaliga (`chek_chop`) YOZMAYDI.
 *
 * ⚠️ Chek bilan bir xil 80 mm lentaga chiqadi — kassada bitta
 *    printer turadi.
 */
export default async function KvitansiyaSahifasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const f = await sahifaRuxsati('buyurtma.kor');

  const { id } = await params;
  const buyurtmaId = Number(id);
  if (!Number.isSafeInteger(buyurtmaId) || buyurtmaId <= 0) notFound();

  const k = await buyurtmaKvitansiyasi(ulanishOl(), buyurtmaId, f.filialId);
  if (k === null) notFound();

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
        <OddiyChopTugmasi matn="Kvitansiyani chop etish" />
      </div>

      {/*
        ⚠️ Hamma pozitsiya topshirilgan bo'lsa, to'g'ri hujjat —
           CHEK. Kvitansiya baribir chiqadi (mijoz eski nusxani
           so'rashi mumkin), lekin sotuvchi chalkashmasligi uchun
           ogohlantiriladi.
      */}
      {k.toliqTopshirildi && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Buyurtmaning hamma pozitsiyasi topshirilgan — mijozga{' '}
          <Link href={`/buyurtma/${String(buyurtmaId)}/chek`} className="underline">
            chek
          </Link>{' '}
          berilishi kerak (8.9).
        </p>
      )}

      {k.topshirilgan.length === 0 && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Hali hech qaysi pozitsiya topshirilmagan — kvitansiyada berilgan buyum
          ko&apos;rinmaydi.
        </p>
      )}

      <KvitansiyaBlogi k={k} />
    </div>
  );
}

function KvitansiyaBlogi({ k }: { k: Kvitansiya }) {
  return (
    <>
      {/* ⚠️ Sahifa o'lchami shu yerda — chek bilan bir xil lenta */}
      <style>{'@media print { @page { size: 80mm auto; margin: 0 } }'}</style>
      <div className="chek border border-chegara bg-white p-[3mm] text-black">
        {/* ── Korxona (14.3) ── */}
        <div className="text-center leading-tight">
          {k.korxonaNom !== null && (
            <div className="text-[11pt] font-bold uppercase">{k.korxonaNom}</div>
          )}
          {k.korxonaManzil !== null && <div className="text-[8pt]">{k.korxonaManzil}</div>}
          {k.korxonaTelefon !== null && <div className="text-[8pt]">{k.korxonaTelefon}</div>}
        </div>

        <Chiziq />

        {/*
          ⚠️ Sarlavha KATTA yozilgan: mijoz qo'lidagi qog'oz chek
             emasligini bir qarashda bilishi kerak.
        */}
        <div className="text-center text-[10pt] font-bold uppercase">Kvitansiya</div>
        <div className="text-center text-[7.5pt] text-neutral-500">qisman topshirish</div>

        <Chiziq />

        <div className="text-[8pt] leading-snug">
          <Juft yorliq="Buyurtma" qiymat={k.buyurtmaRaqam} />
          <Juft yorliq="Buyurtma sanasi" qiymat={k.sanaMatn} />
          <Juft yorliq="Berildi" qiymat={k.chiqarilganMatn} />
          <Juft yorliq="Sotuvchi" qiymat={k.sotuvchi} />
          {k.mijoz !== null && <Juft yorliq="Mijoz" qiymat={k.mijoz} />}
        </div>

        <Chiziq />

        {/* ── Bugun berilganlari ── */}
        <div className="text-[8.5pt] font-semibold">Topshirildi</div>
        {k.topshirilgan.length === 0 ? (
          <div className="text-[8pt] text-neutral-500">—</div>
        ) : (
          <div className="mt-[1mm] flex flex-col gap-[1.5mm] text-[8pt] leading-snug">
            {k.topshirilgan.map((q) => (
              <Qator key={q.tartib} q={q} />
            ))}
          </div>
        )}

        {/*
          ── Qolganlari ──

          ⚠️ NARXSIZ chiqadi. Mijoz hali olmagan buyumning narxini
             o'qib «shuncha to'ladimmi?» deb hisoblay boshlaydi;
             pul hisobi pastda, butun buyurtma bo'yicha turadi.
        */}
        {k.qolgan.length > 0 && (
          <>
            <Chiziq />
            <div className="text-[8.5pt] font-semibold">Kutilmoqda</div>
            <div className="mt-[1mm] flex flex-col gap-[1mm] text-[8pt] leading-snug">
              {k.qolgan.map((q) => (
                <div key={q.tartib} className="break-words">
                  {q.sarlavha}
                  {q.miqdor !== null && (
                    <span className="text-[7.5pt] text-neutral-500"> · {q.miqdor}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <Chiziq />

        {/* ── Pul: BUTUN buyurtma bo'yicha ── */}
        <div className="text-[8pt] leading-snug">
          <Juft yorliq="Buyurtma jami" qiymat={k.jami} raqam qalin />
          <Juft yorliq="To'langan" qiymat={k.tolangan} raqam />
          {k.qarz !== null && <Juft yorliq="Qarz" qiymat={k.qarz} raqam qalin />}
        </div>

        <Chiziq />

        {/* ── Imzo: mijoz buyumni olganini tasdiqlaydi ── */}
        <div className="mt-[2mm] flex items-end justify-between gap-[3mm] text-[7.5pt]">
          <div className="flex-1">
            <div className="text-neutral-500">Topshirdi</div>
            <div className="mt-[5mm] border-t border-neutral-400" />
          </div>
          <div className="flex-1">
            <div className="text-neutral-500">Qabul qildi</div>
            <div className="mt-[5mm] border-t border-neutral-400" />
          </div>
        </div>

        <div className="mt-[2mm] text-center text-[7pt] leading-snug text-neutral-500">
          Yakuniy chek buyurtma to&apos;liq topshirilgach beriladi
        </div>
      </div>
    </>
  );
}

function Qator({ q }: { q: ChekQatori }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-[2mm]">
        <span className="min-w-0 flex-1 break-words">{q.sarlavha}</span>
        <span className="raqam shrink-0 font-semibold">{q.narx}</span>
      </div>
      {q.miqdor !== null && <div className="text-[7.5pt]">{q.miqdor}</div>}
      {q.tarkib.map((t) => (
        <div key={t} className="pl-[3mm] text-[7pt] text-neutral-500">
          {t}
        </div>
      ))}
      {q.izoh !== null && <div className="pl-[3mm] text-[7pt] text-neutral-500">{q.izoh}</div>}
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
