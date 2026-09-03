import Link from 'next/link';
import { turNarxlari as turNarxlariniOl } from '@/lib/amal/tur-narx';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { joriyKurs } from '@/lib/amal/kurs';
import { materialYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, MaterialFormasi, type Guruh } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiMaterial() {
  const f = await sahifaRuxsati('material.yarat');
  // §9.4 — tugmani yashirish himoya emas, server ham tekshiradi
  const guruhQoshaOladi = ruxsatBormi(f, 'material.ozgartir');
  /** ⚠️ Zahira kiritish alohida ruxsat (7.10) — sotuvchida yo'q */
  const boshlangichQilaOladi = ruxsatBormi(f, 'ombor.boshlangich');

  const ulanish = ulanishOl();

  const [guruhlar, kurs, turNarxlari] = await Promise.all([
    ulanish<Guruh[]>`
      SELECT id, nom FROM almashtirish_guruh WHERE faol = true ORDER BY nom`,
    // $ ↔ so'm ko'rsatish uchun. Kurs yo'q bo'lsa hamroh katak jim turadi
    joriyKurs(ulanish),
    /** TZ 5.4 · 6.2 — yangi materialda narxlar bo'sh, turlar ro'yxati kerak */
    turNarxlariniOl(ulanish, null),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/material" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Materiallar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi material
        </h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <MaterialFormasi
          amal={materialYaratAmali}
          qiymatlar={BOSH_QIYMATLAR}
          guruhlar={guruhlar}
          guruhQoshaOladi={guruhQoshaOladi}
          joriyKurs={kurs ?? ''}
          oxirgiKelish={null}
          turNarxlari={turNarxlari}
        tugmaMatni="Saqlash"
          zahiraSoraladi={boshlangichQilaOladi}
        />
      </div>
    </div>
  );
}
