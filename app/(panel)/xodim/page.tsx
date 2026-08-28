import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { telefonKorsat } from '@/lib/domain/telefon';
import { OchirTugma } from '../ochir-tugma';
import { xodimOchirilganSoni, xodimRoyxati } from './malumot';
import { OchirilganlarHavolasi, QaytarTugma } from '../ochirilganlar';

export const dynamic = 'force-dynamic';

/**
 * TZ 10.1 — xodimlar.
 *
 * ⚠️ Bu bo'lim ILGARI YO'Q edi: bazadagi xodimlar faqat urug'dan
 *    kelgan va yangi sotuvchi ishga olinsa uni tizimga kiritib
 *    bo'lmasdi.
 */
export default async function XodimSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('xodim.kor');

  const yarataOladi = ruxsatBormi(f, 'xodim.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'xodim.ozgartir');

  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const [qatorlar, ochirilganSoni] = await Promise.all([
    xodimRoyxati(ochirilganlar),
    xodimOchirilganSoni(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Xodimlar</h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Rollar qo&apos;shiladi — bir odamda bir nechta rol bo&apos;lishi mumkin (10.3)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />

          {yarataOladi && (
            <Link
              href="/xodim/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
          >
              + Yangi xodim
            </Link>
          )}
        </div>
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
          Hali xodim yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ismi</th>
                <th className="px-4 py-2.5 font-medium">Telefon</th>
                <th className="px-4 py-2.5 font-medium">Filial</th>
                <th className="px-4 py-2.5 font-medium">Rollar</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((x) => (
                <tr key={x.id} className={x.faol ? '' : 'text-matn-kuchsiz'}>
                  <td className="px-4 py-2.5 font-medium">{x.ism}</td>
                  <td className="raqam px-4 py-2.5">{telefonKorsat(x.telefon)}</td>
                  <td className="px-4 py-2.5 text-matn-ikki">{x.filialNomi}</td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    {x.rollar === '' ? (
                      <span className="text-belgi-qizil">rol berilmagan</span>
                    ) : (
                      x.rollar
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {!x.faol ? (
                      <span className="text-matn-kuchsiz">o&apos;chirilgan</span>
                    ) : x.parolBormi ? (
                      <span className="text-belgi-yashil">faol</span>
                    ) : (
                      /*
                        ⚠️ Parolsiz xodim saytga KIRA OLMAYDI. Usta
                           uchun bu normal — u botdan ishlaydi.
                           Sotuvchi uchun esa xato, shuning uchun
                           holat ko'rinib turadi.
                      */
                      <span className="text-belgi-sariq">botdan (parolsiz)</span>
                    )}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        {x.faol ? (
                          <>
                            <Link
                              href={`/xodim/${String(x.id)}`}
                              className="text-matn-ikki hover:text-matn"
                            >
                              Tahrirlash
                            </Link>
                            <OchirTugma tur="xodim" id={x.id} nom={x.ism} ixcham />
                          </>
                        ) : (
                          <QaytarTugma tur="xodim" id={x.id} nom={x.ism} />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
