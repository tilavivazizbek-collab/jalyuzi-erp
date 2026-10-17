import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { Sahifalar } from '../sahifalar';
import { ModulPanel } from '../modul-panel';
import { mijozPaneli } from './panel';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { telefonKorsat } from '@/lib/domain/telefon';
import { dollar, musbatmi, manfiymi, pulKorsat, som } from '@/lib/domain/pul';
import { joriyKurs } from '@/lib/amal/kurs';
import { OchirTugma } from '../ochir-tugma';
import { OchirilganlarHavolasi, QaytarTugma } from '../ochirilganlar';
import {
  HOLAT_FILTRLARI,
  SAHIFA_HAJMI,
  SARALASHLAR,
  SEGMENT_NOMI,
  filtrTanlovlari,
  filtrniOqi,
  mijozlarRoyxati,
  ochirilganSoni,
  type Parametrlar,
  type Segment,
} from './malumot';

export const dynamic = 'force-dynamic';

/** Joriy filtr bilan havola — faqat bitta qiymat o'zgaradi */
function havola(sp: Parametrlar, ozgar: Record<string, string | null>, yol = '/mijoz'): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === 'string' && v !== '') u.set(k, v);
  for (const [k, v] of Object.entries(ozgar)) {
    if (v === null || v === '') u.delete(k);
    else u.set(k, v);
  }
  const s = u.toString();
  return s === '' ? yol : `${yol}?${s}`;
}

const SEGMENT_USLUBI: Record<Segment, string> = {
  TOP: 'bg-belgi-yashil-fon text-belgi-yashil',
  YANGI: 'bg-belgi-kok-fon text-belgi-kok',
  FAOL: 'bg-fon text-matn-ikki',
  UXLAGAN: 'bg-belgi-sariq-fon text-belgi-sariq',
  YOQOTILGAN: 'bg-belgi-qizil-fon text-belgi-qizil',
  XARIDSIZ: 'bg-fon text-matn-kuchsiz',
};

export default async function MijozRoyxati({
  searchParams,
}: {
  searchParams: Promise<Parametrlar>;
}) {
  const f = await sahifaRuxsati('mijoz.kor');
  const yarataOladi = ruxsatBormi(f, 'mijoz.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'mijoz.ozgartir');

  const sp = await searchParams;
  const filtr = filtrniOqi(sp);

  const kurs = await joriyKurs(ulanishOl());
  const [ochirilgan, natija, tanlov, panel] = await Promise.all([
    ochirilganSoni(),
    mijozlarRoyxati(filtr, kurs),
    filtrTanlovlari(),
    mijozPaneli(f.filialId),
  ]);

  const sahifalar = Math.max(1, Math.ceil(natija.jamiSoni / SAHIFA_HAJMI));
  const filtrBor =
    filtr.qidiruv !== '' ||
    filtr.holat !== null ||
    filtr.segment !== null ||
    filtr.guruhId !== null ||
    filtr.turiId !== null ||
    filtr.masulId !== null;

  const tanla = 'rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px]';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Mijozlar</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {natija.jamiSoni} ta{filtrBor ? ' (filtr bo‘yicha)' : ''} · barcha filial uchun umumiy
            (Q-26)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilgan} korsatilmoqda={filtr.ochirilganlar} />
          {/* Joriy filtr bilan — ekranda ko'rgan ro'yxatning o'zi tushadi */}
          <a
            href={havola(sp, { sahifa: null }, '/mijoz/eksport')}
            className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm text-matn-ikki transition-colors hover:bg-fon"
          >
            Excel&apos;ga yuklash
          </a>
          <Link
            href="/mijoz/qarzdorlik"
            className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm text-matn-ikki transition-colors hover:bg-fon"
          >
            Qarzdorlik hisoboti
          </Link>
          {yarataOladi && (
            <>
              <Link
                href="/mijoz/import"
                className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm text-matn-ikki transition-colors hover:bg-fon"
              >
                Import
              </Link>
              <Link
                href="/mijoz/yangi"
                className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq"
              >
                Mijoz qo&apos;shish
              </Link>
            </>
          )}
        </div>
      </div>

      {/* TZ 11.11 — holat · bu oy · diqqat (filtrsiz, butun baza bo'yicha) */}
      <ModulPanel holat={panel.holat} davr={panel.davr} diqqat={panel.diqqat} />

      {/*
        ⚠️ ODDIY GET FORMA — JavaScript shart emas. Filtr URL da turadi:
           havolani nusxalab yuborsa, o'sha ro'yxat ochiladi.
      */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        {filtr.ochirilganlar && <input type="hidden" name="ochirilgan" value="1" />}
        <input
          name="q"
          defaultValue={filtr.qidiruv}
          placeholder="Ism, telefon, tashkilot yoki INN"
          aria-label="Qidirish"
          className={`${tanla} min-w-[240px] flex-1`}
        />
        <select name="holat" defaultValue={filtr.holat ?? ''} aria-label="Holati" className={tanla}>
          <option value="">Hammasi</option>
          {Object.entries(HOLAT_FILTRLARI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          name="segment"
          defaultValue={filtr.segment ?? ''}
          aria-label="Segment"
          className={tanla}
        >
          <option value="">Har qanday segment</option>
          {Object.entries(SEGMENT_NOMI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {tanlov.guruhlar.length > 0 && (
          <select
            name="guruh"
            defaultValue={filtr.guruhId === null ? '' : String(filtr.guruhId)}
            aria-label="Guruh"
            className={tanla}
          >
            <option value="">Har qanday guruh</option>
            {tanlov.guruhlar.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>
        )}
        {tanlov.turlar.length > 0 && (
          <select
            name="tur"
            defaultValue={filtr.turiId === null ? '' : String(filtr.turiId)}
            aria-label="Turi"
            className={tanla}
          >
            <option value="">Har qanday tur</option>
            {tanlov.turlar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        )}
        <select
          name="masul"
          defaultValue={filtr.masulId === null ? '' : String(filtr.masulId)}
          aria-label="Mas'ul sotuvchi"
          className={tanla}
        >
          <option value="">Har qanday mas&apos;ul</option>
          {tanlov.xodimlar.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nom}
            </option>
          ))}
        </select>
        <select name="saralash" defaultValue={filtr.saralash} aria-label="Saralash" className={tanla}>
          {Object.entries(SARALASHLAR).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-maydon bg-brend px-3.5 py-1.5 text-[13px] font-medium text-tugma-matn hover:bg-brend-quyuq"
        >
          Ko&apos;rsatish
        </button>
        {filtrBor && (
          <Link
            href={filtr.ochirilganlar ? '/mijoz?ochirilgan=1' : '/mijoz'}
            className="text-[13px] text-matn-kuchsiz hover:text-matn"
          >
            Tozalash
          </Link>
        )}
      </form>

      {/* Filtrdagi BARCHA mijozlarning qarzi — kimdan qancha olish kerak */}
      {(musbatmi(som(natija.jamiQarzSom)) || musbatmi(dollar(natija.jamiQarzUsd))) && (
        <p className="text-[13px] text-matn-ikki">
          Jami qarz:{' '}
          {musbatmi(som(natija.jamiQarzSom)) && (
            <b className="text-belgi-sariq">{pulKorsat(som(natija.jamiQarzSom))} so&apos;m </b>
          )}
          {musbatmi(dollar(natija.jamiQarzUsd)) && (
            <b className="text-belgi-sariq">{pulKorsat(dollar(natija.jamiQarzUsd))} $</b>
          )}
        </p>
      )}

      {natija.qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          {filtrBor ? 'Bu filtr bo‘yicha mijoz topilmadi.' : 'Hali mijoz yo‘q.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mijoz</th>
                <th className="px-4 py-2.5 font-medium">Telefon</th>
                <th className="px-4 py-2.5 font-medium">Turi · guruh</th>
                <th className="px-4 py-2.5 text-right font-medium">Qarz</th>
                <th className="px-4 py-2.5 font-medium">Oxirgi xarid</th>
                <th className="px-4 py-2.5 text-right font-medium">Sotuv</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {natija.qatorlar.map((m) => {
                const qSom = som(m.qarz_som);
                const qUsd = dollar(m.qarz_usd);
                return (
                  <tr key={m.id} className={m.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/mijoz/${String(m.id)}`}
                        className="font-medium text-brend hover:underline"
                      >
                        {m.ism}
                      </Link>
                      {!m.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${SEGMENT_USLUBI[m.segment]}`}
                      >
                        {SEGMENT_NOMI[m.segment]}
                      </span>
                      {(m.tashkilot_nomi !== null || m.masul_ismi !== null) && (
                        <span className="mt-0.5 block text-xs text-matn-kuchsiz">
                          {m.tashkilot_nomi}
                          {m.tashkilot_nomi !== null && m.masul_ismi !== null && ' · '}
                          {m.masul_ismi !== null && `mas'ul: ${m.masul_ismi}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.telefon === null ? (
                        <span className="text-matn-kuchsiz">—</span>
                      ) : (
                        telefonKorsat(m.telefon)
                      )}
                      {/*
                        ⚠️ 2026-10-06 — ilgari botga ulanMAGAN har mijozda
                           «qo'ng'iroq qiling» turardi: hammasida bir xil
                           yozuv hech narsa demasdi. Endi ULANGANI belgilanadi.
                      */}
                      {m.telegram_id !== null && (
                        <span
                          className="ml-2 rounded-full bg-belgi-kok-fon px-1.5 py-0.5 text-[10px] font-medium text-belgi-kok"
                          title="Botga ulangan — xabar yuborsa bo'ladi"
                        >
                          TG
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {m.turi_nomi ?? (m.shaxs_turi === 'YURIDIK' ? 'Yuridik' : 'Jismoniy')}
                      {m.guruh_nomi !== null && (
                        <span className="text-matn-kuchsiz"> · {m.guruh_nomi}</span>
                      )}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right whitespace-nowrap">
                      {!musbatmi(qSom) && !musbatmi(qUsd) && !manfiymi(qSom) && !manfiymi(qUsd) ? (
                        <span className="text-matn-kuchsiz">—</span>
                      ) : (
                        <span className="flex flex-col items-end">
                          {!pulNol(m.qarz_som) && (
                            <span
                              className={
                                manfiymi(qSom) ? 'text-belgi-yashil' : 'font-medium text-belgi-sariq'
                              }
                              title={manfiymi(qSom) ? 'Avans — oldindan to‘langan' : undefined}
                            >
                              {pulKorsat(qSom)} so&apos;m
                            </span>
                          )}
                          {!pulNol(m.qarz_usd) && (
                            <span
                              className={
                                manfiymi(qUsd) ? 'text-belgi-yashil' : 'font-medium text-belgi-sariq'
                              }
                            >
                              {pulKorsat(qUsd)} $
                            </span>
                          )}
                        </span>
                      )}
                      {m.limit_oshgan && (
                        <span className="mt-0.5 block text-[11px] text-belgi-qizil">
                          limit {m.qarz_limiti === null ? '' : pulKorsat(som(m.qarz_limiti))} dan
                          oshgan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">
                      {m.oxirgi === null ? (
                        <span className="text-matn-kuchsiz">—</span>
                      ) : (
                        m.oxirgi.toLocaleDateString('uz-UZ')
                      )}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right whitespace-nowrap text-matn-ikki">
                      {pulNol(m.sotuv_som) && pulNol(m.sotuv_usd) ? (
                        <span className="text-matn-kuchsiz">—</span>
                      ) : (
                        <>
                          {!pulNol(m.sotuv_som) && <span>{pulKorsat(som(m.sotuv_som))}</span>}
                          {!pulNol(m.sotuv_usd) && (
                            <span className="ml-1 text-xs">+{pulKorsat(dollar(m.sotuv_usd))} $</span>
                          )}
                        </>
                      )}
                    </td>
                    {ozgartiraOladi && (
                      <td className="px-4 py-2.5 text-right">
                        {!m.faol && <QaytarTugma tur="mijoz" id={m.id} nom={m.ism} />}
                        {/* O'chirish = nofaol qilish; qarzi bori to'siladi */}
                        {m.faol && <OchirTugma tur="mijoz" id={m.id} nom={m.ism} ixcham />}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sahifalar
        joriy={filtr.sahifa}
        jami={sahifalar}
        havola={(n) => havola(sp, { sahifa: String(n) })}
      />
    </div>
  );
}

/** NUMERIC matni nolmi — `0`, `0.00`, `-0.00` */
function pulNol(x: string): boolean {
  return /^-?0+(\.0+)?$/.test(x);
}
