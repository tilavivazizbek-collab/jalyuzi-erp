import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { joriyKurs } from '@/lib/amal/kurs';
import { kursTarixi } from '@/lib/amal/kurs-belgila';
import { KursFormasi } from './forma';

export const dynamic = 'force-dynamic';

/**
 * `/kurs` — TZ 14.5
 *
 * ⚠️ NEGA ALOHIDA EKRAN
 *
 *    Kursni belgilaydigan joy umuman yo'q edi: jadval bor,
 *    o'quvchi kod bor, yozuvchi yo'q. Egasi kursni har mahsulot
 *    kartochkasida qaytadan terardi va u hech qayerda
 *    saqlanmasdi. Dollarli kirim esa umuman ishlamasdi.
 *
 * ⚠️ Kurs BITTA joyda belgilanadi va hamma ekran o'shani
 *    o'qiydi (§2.2): mahsulot, kirim, sotuv.
 */
export default async function KursSahifasi() {
  const f = await sahifaRuxsati('sozlama.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'sozlama.ozgartir');

  const sql = ulanishOl();
  const [joriy, tarix] = await Promise.all([joriyKurs(sql), kursTarixi(sql)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Dollar kursi
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Shu yerda belgilangan kurs mahsulot, kirim va sotuv ekranlarida
          o&apos;zi ishlatiladi.
        </p>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        {joriy === null ? (
          <p className="mb-4 rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
            Kurs hali belgilanmagan. Dollarda narx qo&apos;yish va dollarda kirim qilish
            uchun u kerak.
          </p>
        ) : (
          <p className="mb-4 text-sm text-matn-ikki">
            Bugungi kurs: <b className="raqam text-matn">{joriy}</b> so&apos;m
          </p>
        )}

        {ozgartiraOladi ? (
          <KursFormasi joriy={joriy} />
        ) : (
          <p className="text-sm text-matn-kuchsiz">
            Kursni faqat sozlamalarni o&apos;zgartira oladigan xodim belgilaydi.
          </p>
        )}
      </div>

      {tarix.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Oxirgi kunlar</h2>
          {/*
            ⚠️ Tarix KO'RSATILADI, lekin tahrirlanmaydi: o'tgan kun
               kursiga tayangan hujjatlar o'z snapshotini olib
               bo'lgan (2.3-invariant).
          */}
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kurs</th>
                  <th className="px-4 py-2.5 font-medium">Kim belgilagan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {tarix.map((k) => (
                  <tr key={k.sana}>
                    <td className="px-4 py-2.5 text-matn-ikki">{k.sana}</td>
                    <td className="raqam px-4 py-2.5 text-right font-medium">{k.qiymat}</td>
                    <td className="px-4 py-2.5 text-matn-kuchsiz">{k.kim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
