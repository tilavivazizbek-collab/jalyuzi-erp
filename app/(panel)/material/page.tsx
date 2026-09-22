import Link from 'next/link';
import { RasmKorish } from '../rasm-korish';
import { ulanishOl } from '@/lib/db';
import { OchirTugma } from '../ochir-tugma';
import { OchirilganlarHavolasi, QaytarTugma } from '../ochirilganlar';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import {
  HISOB_TURI_NOMI,
  SARFLASH_BIRLIGI_NOMI,
  type HisobTuri,
  type SarflashBirligi,
} from '@/lib/sxema/material';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  /** Ta'minotchi artikuli — 0050 */
  readonly kod: string | null;
  readonly hisob_turi: string;
  readonly kirim_birligi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly guruh_nomi: string | null;
  /** Mato darajasi — endi mijoz narxini AYNAN shu belgilaydi */
  readonly daraja_nomi: string | null;
  /**
   * Shu filialdagi BO'SH qoldiq — band qilinganlari sanalmaydi.
   *
   * ⚠️ Birligi materialga qarab o'zgaradi: `KV_M` da kv.m,
   *    boshqasida sarflash birligi (metr yoki dona).
   */
  readonly bosh_qoldiq: string | null;
  readonly faol: boolean;
  readonly rasm_bormi: boolean;
  readonly ozgartirildi: Date | null;
}

/**
 * Ro'yxat filtri — egasi qarori 2026-09-22.
 *
 * ⚠️ Yangi ustun QO'SHILMADI: bo'linish materialning `hisob_turi`
 *    idan kelib chiqadi va u allaqachon bor. Mato maydon bilan
 *    o'lchanadi (RULON yoki KV_M), karniz chiziqli, aksessuar dona.
 *    Alohida «kategoriya» ustuni bo'lsa, u hisob turi bilan
 *    ziddiyatga tushishi mumkin edi — ikki haqiqat.
 */
const TUR_FILTRLARI = {
  MATO: { nom: 'Mato', turlar: ['RULON', 'KV_M'] },
  CHIZIQLI: { nom: 'Karniz va profil', turlar: ['CHIZIQLI'] },
  DONA: { nom: 'Aksessuar', turlar: ['DONA'] },
} as const;

const BARCHA_TURLAR = ['RULON', 'KV_M', 'CHIZIQLI', 'DONA'];

/** Qoldiq birligi — `KV_M` da kv.m, qolganida sarflash birligi */
function qoldiqBirligi(sarflash: string): string {
  return sarflash === 'KV_M' ? 'kv.m' : sarflash === 'M' ? 'm' : 'dona';
}

export default async function MaterialRoyxati({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('material.kor');
  const yarataOladi = ruxsatBormi(f, 'material.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'material.ozgartir');

  /**
   * ⚠️ O'CHIRILGAN YOZUV RO'YXATDA KO'RINMAYDI. Ilgari u faqat
   *    kulrang bo'lib turardi va ro'yxatni to'ldirardi.
   *    «O'chirilganlar» havolasi bosilsa ko'rsatiladi — qaytarish
   *    uchun.
   */
  const p = await searchParams;
  const ochirilganlar = p['ochirilgan'] === '1';

  /**
   * QIDIRUV va FILTR — egasi qarori 2026-09-22.
   *
   * ⚠️ Ilgari ro'yxatda na qidiruv, na filtr bor edi: 88 material
   *    orasidan keraklisi ko'z bilan izlanardi.
   *
   * ⚠️ Manzilda turadi (`?q=`, `?tur=`) — sahifa yangilansa ham
   *    tanlov saqlanadi va havolani yuborsa bo'ladi.
   */
  const qidiruv = typeof p['q'] === 'string' ? p['q'].trim() : '';
  const naqsh = `%${qidiruv}%`;
  const turKaliti = typeof p['tur'] === 'string' ? p['tur'] : '';
  const turFiltri =
    turKaliti in TUR_FILTRLARI
      ? [...TUR_FILTRLARI[turKaliti as keyof typeof TUR_FILTRLARI].turlar]
      : BARCHA_TURLAR;

  const sql = ulanishOl();

  /**
   * ⚠️ QOLDIQ shu FILIALGA tegishli. Katalogning o'zi umumiy (Q-26),
   *    lekin «omborda bormi» degan savolning javobi filialga qarab
   *    o'zgaradi — sotuvchi o'z filialidagi holatni ko'rishi kerak.
   *
   * ⚠️ Faqat BO'SH bo'laklar sanaladi. Band qilingani boshqa
   *    buyurtmaga ajratilgan: uni «bor» deb ko'rsatish sotuvchini
   *    adashtirardi.
   */
  const qatorlar = await sql<Qator[]>`
    SELECT m.id, m.nom, m.kod, m.hisob_turi, m.kirim_birligi, m.sarflash_birligi,
           m.koeffitsient, m.faol,
           (m.rasm IS NOT NULL) AS rasm_bormi, m.ozgartirildi,
           g.nom AS guruh_nomi, d.nom AS daraja_nomi,
           qoldiq.bosh::text AS bosh_qoldiq
    FROM material m
    LEFT JOIN almashtirish_guruh g ON g.id = m.almashtirish_guruh_id
    LEFT JOIN narx_guruh d ON d.id = m.narx_guruh_id
    LEFT JOIN LATERAL (
      SELECT CASE WHEN m.sarflash_birligi = 'KV_M'
                  THEN SUM(b.eni_m * b.boyi_m)
                  ELSE SUM(b.miqdor) END AS bosh
      FROM bolak b
      WHERE b.material_id = m.id
        AND b.filial_id = ${f.filialId}
        AND b.faol = true
        AND b.holat = 'BOSH'
    ) qoldiq ON true
    WHERE m.faol = ${!ochirilganlar}
      AND m.hisob_turi = ANY(${turFiltri})
      AND (
        ${qidiruv} = ''
        OR m.nom ILIKE ${naqsh}
        OR COALESCE(m.kod, '') ILIKE ${naqsh}
      )
    ORDER BY m.nom`;

  const ochirilganSoni = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM material WHERE faol = false`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Mahsulotlar</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta · katalog barcha filialga umumiy (Q-26), qoldiq —
            shu filialniki
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi
            soni={ochirilganSoni[0]?.n ?? 0}
            korsatilmoqda={ochirilganlar}
          />

          {yarataOladi && (
            <Link
              href="/material/yangi"
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
            >
              Material qo&apos;shish
            </Link>
          )}
        </div>
      </div>

      {/*
        ⚠️ QIDIRUV VA FILTR — egasi qarori 2026-09-22.

           Oddiy `<form method="get">`: JavaScript kerak emas, sahifa
           server tomonda chiziladi va tanlov manzilda qoladi.
           Ilgari 88 material orasidan keraklisi ko'z bilan izlanardi.

        ⚠️ `ochirilgan` yashirin maydon bilan olib o'tiladi: aks holda
           «o'chirilganlar» ro'yxatida qidirilganda tanlov yo'qolib,
           foydalanuvchi faol ro'yxatga qaytib tushardi.
      */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        {ochirilganlar && <input type="hidden" name="ochirilgan" value="1" />}
        <input
          name="q"
          defaultValue={qidiruv}
          placeholder="Nomi yoki artikuli bo'yicha qidirish"
          aria-label="Qidirish"
          className="min-w-56 flex-1 rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25"
        />
        <select
          name="tur"
          defaultValue={turKaliti}
          aria-label="Turi"
          className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25"
        >
          <option value="">Hammasi</option>
          {Object.entries(TUR_FILTRLARI).map(([kalit, t]) => (
            <option key={kalit} value={kalit}>
              {t.nom}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="fokus rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm font-medium transition-colors hover:bg-fon"
        >
          Qidirish
        </button>
        {(qidiruv !== '' || turKaliti !== '') && (
          <Link
            href={ochirilganlar ? '/material?ochirilgan=1' : '/material'}
            className="text-sm text-matn-kuchsiz hover:text-matn"
          >
            Tozalash
          </Link>
        )}
      </form>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali material yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                {/*
                  ⚠️ Egasi (2026-08-30): «mahsulotlar ro'yxat bo'lib
                     turadi-ku — o'sha payt rasmlari bilan tursin».
                     Matoni nomidan emas, RANGIDAN tanish osonroq.
                */}
                <th className="w-12 px-4 py-2.5 font-medium" />
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Hisob turi</th>
                <th className="px-4 py-2.5 font-medium">Guruh</th>
                {/*
                  ⚠️ «Sotuv narxi» ustuni DARAJA va QOLDIQ ga
                     almashtirildi (egasi, 2026-09-22).

                     Narx endi bu yerdan boshqarilmaydi, ustun esa
                     ko'pincha bo'sh turardi. Uning o'rnida kunlik
                     ishda kerak bo'ladigan ikki javob turadi:
                     «bu matoning darajasi qaysi» va «omborda bormi».
                */}
                <th className="px-4 py-2.5 font-medium">Daraja</th>
                <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh qoldiq</th>
                <th className="px-4 py-2.5 font-medium">Birliklar</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((m) => (
                <tr key={m.id} className={m.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                  <td className="py-2 pl-4 pr-0">
                    {m.rasm_bormi ? (
                      <RasmKorish
                        manzil={`/api/rasm/material/${String(m.id)}?v=${String(m.ozgartirildi?.getTime() ?? 0)}`}
                        nom={m.nom}
                        olcham="size-10"
                      />
                    ) : (
                      /** Rasm yo'q — joy baribir band, qatorlar tekis tursin */
                      <div className="size-10 rounded-maydon border border-dashed border-chegara-quyuq" />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{m.nom}</span>
                    {/* 0050 — artikul nom ostida, xira */}
                    {m.kod !== null && (
                      <span className="raqam mt-0.5 block text-[12px] text-matn-kuchsiz">
                        {m.kod}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {HISOB_TURI_NOMI[m.hisob_turi as HisobTuri] ?? m.hisob_turi}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.guruh_nomi ?? <span className="text-belgi-sariq">— yo&apos;q —</span>}
                  </td>
                  {/*
                    ⚠️ DARAJASI YO'Q mato sotuvda NARXSIZ qoladi —
                       shuning uchun bo'shligi qizil bilan aytiladi,
                       xira chiziqcha bilan emas.
                  */}
                  <td className="px-4 py-2.5">
                    {m.daraja_nomi ?? (
                      <span className="text-belgi-qizil" title="Narx darajasi tanlanmagan — sotuvda narxi topilmaydi">
                        — yo&apos;q —
                      </span>
                    )}
                  </td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {m.bosh_qoldiq === null || Number(m.bosh_qoldiq) === 0 ? (
                      <span className="text-matn-kuchsiz">0</span>
                    ) : (
                      <>
                        {Number(m.bosh_qoldiq).toFixed(2)}
                        <span className="ml-1 text-xs text-matn-kuchsiz">
                          {qoldiqBirligi(m.sarflash_birligi)}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    1 {m.kirim_birligi} = {Number(m.koeffitsient)}{' '}
                    {SARFLASH_BIRLIGI_NOMI[m.sarflash_birligi as SarflashBirligi]}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        {/* ⚠️ O'chirilganda faqat qaytarish mumkin */}
                        {m.faol ? (
                          <Link
                            href={`/material/${String(m.id)}`}
                            className="text-matn-ikki hover:text-matn"
                          >
                            Tahrirlash
                          </Link>
                        ) : (
                          <QaytarTugma tur="material" id={m.id} nom={m.nom} />
                        )}
                        {/*
                          ⚠️ O'chirish = nofaol qilish. Omborda
                             qoldig'i bor material o'chirilmaydi va
                             sabab ko'rsatiladi.
                        */}
                        {m.faol && (
                          <OchirTugma tur="material" id={m.id} nom={m.nom} ixcham />
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
