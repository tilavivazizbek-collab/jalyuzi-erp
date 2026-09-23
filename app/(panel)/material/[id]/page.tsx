import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { materialTahrirlaAmali } from '../amal';
import type { FormaHolati } from '../holat';
import { MaterialFormasi, type Guruh, type MaterialQiymatlari } from '../forma';
import { filialNarxlari } from '@/lib/amal/filial-narx';
import { joriyKurs } from '@/lib/amal/kurs';
import { oxirgiKelishNarxi } from '../malumot';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { FilialNarxlari } from '../narx-forma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly kod: string | null;
  readonly hisob_turi: string;
  readonly kirim_birligi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly sotuv_narx: string | null;
  readonly sotuv_valyuta: string;
  readonly kutilayotgan_kelish_narx: string | null;
  readonly kutilayotgan_kelish_valyuta: string;
  readonly min_ustama_foiz: string | null;
  readonly yaroqsiz_chegara_m: string | null;
  readonly kam_ishlatiladigan_m: string | null;
  readonly kam_qoldiq_chegara_m: string | null;
  readonly standart_rulon_eni_m: string | null;
  /**
   * ⚠️ Rasmning O'ZI olinmaydi — faqat BORMI degan javob.
   *    Baytlarni sahifaga yuklash uni og'irlashtirardi; rasm
   *    alohida yo'l orqali keladi va keshlanadi.
   */
  readonly rasm_bormi: boolean;
  readonly ozgartirildi: string | null;
  readonly odatdagi_rulon_boyi_m: string | null;
  readonly almashtirish_guruh_id: number | null;
  readonly narx_guruh_id: number | null;
  readonly togridan_sotiladi: boolean;
  readonly yaxlitlash_qadami: string | null;
  readonly kirim_narx_asosi: string;
}

/** `NUMERIC` bazadan matn bo'lib keladi; bo'sh maydon formada '' bo'ladi. */
const m = (x: string | null): string => x ?? '';

export default async function MaterialTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('material.ozgartir');

  const { id } = await params;
  const materialId = Number(id);
  if (!Number.isSafeInteger(materialId) || materialId <= 0) notFound();

  const ulanish = ulanishOl();
  /**
   * ⚠️ `SELECT *` EMAS: `rasm` ustuni bir necha yuz kilobayt va u
   *    sahifaga umuman kerak emas — rasm alohida yo'l orqali
   *    keladi va keshlanadi. Ilgari `*` bo'lgani uchun har
   *    ochilishda rasm ikki marta yuklanardi.
   */
  const qatorlar = await ulanish<Qator[]>`
    SELECT id, nom, kod, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
           sotuv_narx, sotuv_valyuta, kutilayotgan_kelish_narx,
           kutilayotgan_kelish_valyuta, min_ustama_foiz, yaroqsiz_chegara_m,
           kam_ishlatiladigan_m, kam_qoldiq_chegara_m, standart_rulon_eni_m,
           odatdagi_rulon_boyi_m, almashtirish_guruh_id, narx_guruh_id,
           togridan_sotiladi, yaxlitlash_qadami,
           kirim_narx_asosi,
           (rasm IS NOT NULL) AS rasm_bormi,
           to_char(ozgartirildi, 'YYYYMMDDHH24MISS') AS ozgartirildi
    FROM material WHERE id = ${materialId}`;
  const material = qatorlar[0];
  if (material === undefined) notFound();

  const [guruhlar, narxGuruhlari, kurs, oxirgiKelish] = await Promise.all([
    ulanish<Guruh[]>`
      SELECT id, nom FROM almashtirish_guruh WHERE faol = true ORDER BY nom`,
    /** Mato darajalari — mijoz narxi shundan (egasi qarori 2026-09-20) */
    ulanish<Guruh[]>`
      SELECT id, nom FROM narx_guruh WHERE faol = true ORDER BY tartib, nom`,
    // $ ↔ so'm ko'rsatish uchun (bazaga yozilmaydi)
    joriyKurs(ulanish),
    // TZ 5.4 — haqiqiy tannarx kirimdan keladi, faqat ko'rsatiladi
    oxirgiKelishNarxi(materialId),
    /** TZ 5.4 · 6.2 — mijoz turi bo'yicha narxlar */
  ]);

  /*
   * ── OMBORDAGI QOLDIQ ─────────────────────────────────
   *
   * Egasi (2026-09-24): «mahsulot qo'shish pageda ombordagi
   * qoldiqni kiritish inputi yo'q, bo'lsa ham qaysi birlikda
   * kiritish kerak aniq emas».
   *
   * ⚠️ Egasi kartochkadagi «eni / bo'yi» kataklarini QOLDIQ deb
   *    o'ylagan. Ular esa KIRIM FORMASI uchun odatdagi o'lcham va
   *    omborga hech narsa qo'shmaydi. Ekran buni aytmasdi —
   *    natijada ikkita rulon materiali omborda NOL bo'lib turardi.
   *
   * ⚠️ IKKALA USTUN ham olinadi (maydon va miqdor), qaysi biri
   *    kerakligini TS hal qiladi. Birlikni SQL ga qo'shish
   *    so'rovni ikki xil qilib, farqini ko'zdan qochirardi.
   */
  const [qoldiq, boshlangich] = await Promise.all([
    ulanish<{ bosh_kv_m: string | null; bosh_miqdor: string | null; soni: number }[]>`
      SELECT SUM(COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0))::text AS bosh_kv_m,
             SUM(COALESCE(b.miqdor, 0))::text AS bosh_miqdor,
             count(*)::int AS soni
        FROM bolak b
       WHERE b.material_id = ${materialId}
         AND b.filial_id = ${f.filialId}
         AND b.faol = true
         AND b.holat = 'BOSH'`,
    ulanish<{ n: number }[]>`
      SELECT count(*)::int AS n
        FROM ombor_harakat oh
        JOIN bolak b ON b.id = oh.bolak_id
       WHERE oh.turi = 'BOSHLANGICH' AND oh.filial_id = ${f.filialId}
         AND b.material_id = ${materialId}`,
  ]);

  const kvMmi = material.sarflash_birligi === 'KV_M';
  const qoldiqSoni = Number(
    (kvMmi ? qoldiq[0]?.bosh_kv_m : qoldiq[0]?.bosh_miqdor) ?? '0',
  );
  const bolakSoni = qoldiq[0]?.soni ?? 0;
  /** ⚠️ Boshlang'ich BIR MARTA kiritiladi — ikkinchisi rad etiladi */
  const boshlangichKiritilgan = (boshlangich[0]?.n ?? 0) > 0;

  // 20.9 — filial narx istisnolari (Q-28)
  const narxOzgartiraOladi = ruxsatBormi(f, 'narx.filial.ozgartir');
  const narxlar = narxOzgartiraOladi ? await filialNarxlari(ulanish, materialId) : [];

  const qiymatlar: MaterialQiymatlari = {
    nom: material.nom,
    /** 0050 — artikul; `null` bo'lsa katak bo'sh turadi */
    kod: material.kod ?? '',
    hisobTuri: material.hisob_turi,
    kirimBirligi: material.kirim_birligi,
    sarflashBirligi: material.sarflash_birligi,
    koeffitsient: material.koeffitsient,
    sotuvNarx: m(material.sotuv_narx),
    sotuvValyuta: material.sotuv_valyuta,
    kutilayotganKelishNarx: m(material.kutilayotgan_kelish_narx),
    kutilayotganKelishValyuta: material.kutilayotgan_kelish_valyuta,
    minUstamaFoiz: m(material.min_ustama_foiz),
    yaroqsizChegaraM: m(material.yaroqsiz_chegara_m),
    kamIshlatiladiganM: m(material.kam_ishlatiladigan_m),
    kamQoldiqChegaraM: m(material.kam_qoldiq_chegara_m),
    standartRulonEniM: m(material.standart_rulon_eni_m),
    odatdagiRulonBoyiM: m(material.odatdagi_rulon_boyi_m),
    almashtirishGuruhId:
      material.almashtirish_guruh_id === null ? '' : String(material.almashtirish_guruh_id),
    narxGuruhId:
      material.narx_guruh_id === null ? '' : String(material.narx_guruh_id),
    togridanSotiladi: material.togridan_sotiladi,
    yaxlitlashQadami: m(material.yaxlitlash_qadami),
    kirimNarxAsosi: material.kirim_narx_asosi,
  };

  const amal = async (holat: FormaHolati, forma: FormData): Promise<FormaHolati> => {
    'use server';
    return materialTahrirlaAmali(materialId, holat, forma);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/material" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Materiallar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          {material.nom}
        </h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <MaterialFormasi
          /*
            QOLDIQ — 2026-09-24. Kartochkada HAQIQIY qoldiq
            birligi bilan ko'rinadi, kiritilmagan bo'lsa shu
            yerdan kiritiladi.
          */
          joriyQoldiq={{
            materialId,
            miqdor: qoldiqSoni,
            bolakSoni,
            birlik: kvMmi ? 'kv.m' : material.sarflash_birligi === 'M' ? 'm' : 'dona',
            kiritilgan: boshlangichKiritilgan,
          }}
          /*
           * ⚠️ ZAHIRA BLOKI TAHRIRDA CHIQMAYDI — ataylab.
           *
           *    Zahira mantig'i faqat YARATISH amalida
           *    (`yaratIchki`). Blokni bu yerda ko'rsatsak, forma
           *    maydonlarni yuborar, server esa ularni JIMGINA
           *    tashlab yuborardi — 0049 dagi aynan o'sha xato.
           *
           *    Uning o'rniga mavjud ekranga havola beriladi:
           *    u allaqachon narx asosini ham, rulon qatorlarini ham
           *    biladi (CLAUDE.md §3 — ikkinchi kiritish joyi
           *    yaratilmaydi).
           */
          amal={amal}
          qiymatlar={qiymatlar}
          guruhlar={guruhlar}
          narxGuruhlari={narxGuruhlari}
          narxGuruhQoshaOladi={ruxsatBormi(f, 'narx.standart.ozgartir')}
          guruhQoshaOladi={ruxsatBormi(f, 'material.ozgartir')}
          joriyKurs={kurs ?? ''}
          oxirgiKelish={oxirgiKelish}
        tugmaMatni="O'zgarishlarni saqlash"
          /**
           * ⚠️ Manzilga o'zgarish vaqti qo'shiladi: rasm bir yilga
           *    keshlanadi, lekin yangisi yuklansa manzil ham
           *    o'zgaradi va brauzer eskisini ko'rsatmaydi.
           */
          rasmManzili={
            material.rasm_bormi
              ? `/api/rasm/material/${String(materialId)}?v=${material.ozgartirildi ?? ''}`
              : null
          }
        />
      </div>

      {narxOzgartiraOladi && narxlar.length > 0 && (
        <FilialNarxlari
          materialId={materialId}
          standartNarx={material.sotuv_narx}
          qatorlar={narxlar}
        />
      )}
    </div>
  );
}
