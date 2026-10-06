'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { mijozImportAmali, type ImportHolati } from './amal';

const BOSH: ImportHolati = { xato: null, qatorlar: [], sinov: true };

const NATIJA: Record<string, { matn: string; uslub: string }> = {
  SAQLANDI: { matn: 'Saqlandi', uslub: 'text-belgi-yashil' },
  TEKSHIRILDI: { matn: 'To‘g‘ri', uslub: 'text-belgi-yashil' },
  DUBLIKAT: { matn: 'Bor edi', uslub: 'text-belgi-sariq' },
  XATO: { matn: 'Xato', uslub: 'text-belgi-qizil' },
};

const NAMUNA = `Ism;Telefon;Manzil;Tashkilot;INN;Qarz limiti;To'lov muddati;Manba;Izoh
Alisher Karimov;+998 90 123 45 67;Chilonzor 5;;;5000000;15;Instagram;
"Parda Market" MChJ;+998 71 200 30 40;Yunusobod;"Parda Market" MChJ;123456789;20000000;30;Tavsiya (tanish);ulgurji`;

export function ImportFormasi() {
  const [holat, yubor, kutilmoqda] = useActionState(mijozImportAmali, BOSH);
  const [matn, setMatn] = useState('');

  const soni = (n: string): number => holat.qatorlar.filter((q) => q.natija === n).length;

  return (
    <div className="flex flex-col gap-5">
      <form action={yubor} className="flex flex-col gap-3 rounded-karta border border-chegara bg-sirt p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki hover:bg-fon">
            Faylni tanlash (.csv)
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const fayl = e.target.files?.[0];
                if (fayl === undefined) return;
                void fayl.text().then(setMatn);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setMatn(NAMUNA);
            }}
            className="text-[13px] text-brend hover:underline"
          >
            Namunani ko&apos;rsatish
          </button>
          <span className="text-xs text-matn-kuchsiz">
            Excel: «Saqlash» → «CSV (разделители — точка с запятой)». Yoki jadvaldan nusxalab shu
            yerga joylang.
          </span>
        </div>

        <textarea
          name="matn"
          value={matn}
          onChange={(e) => {
            setMatn(e.target.value);
          }}
          rows={10}
          placeholder="Ism;Telefon;Manzil;…"
          aria-label="CSV matni"
          className="w-full rounded-maydon border border-chegara-quyuq bg-sirt px-3 py-2 font-mono text-[12px] outline-none focus:ring-2 focus:ring-brend/25"
        />

        {holat.xato !== null && (
          <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2 text-sm text-belgi-qizil">
            {holat.xato}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* ⚠️ Avval TEKSHIRISH — bazaga hech narsa yozilmaydi */}
          <button
            type="submit"
            name="sinov"
            value="1"
            disabled={kutilmoqda || matn.trim() === ''}
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki hover:bg-fon disabled:opacity-60"
          >
            Tekshirish (saqlamasdan)
          </button>
          <button
            type="submit"
            name="sinov"
            value="0"
            disabled={kutilmoqda || matn.trim() === ''}
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn hover:bg-brend-quyuq disabled:opacity-60"
          >
            {kutilmoqda ? 'Ishlanmoqda…' : 'Import qilish'}
          </button>
          <Link href="/mijoz" className="text-sm text-matn-ikki hover:text-matn">
            Mijozlarga qaytish
          </Link>
        </div>
      </form>

      {holat.qatorlar.length > 0 && (
        <section>
          <p className="mb-2 text-sm text-matn-ikki">
            {holat.sinov ? 'Tekshiruv natijasi — hech narsa saqlanmadi: ' : 'Natija: '}
            <b className="text-belgi-yashil">
              {holat.sinov ? soni('TEKSHIRILDI') : soni('SAQLANDI')}
            </b>{' '}
            {holat.sinov ? 'to‘g‘ri' : 'saqlandi'} ·{' '}
            <b className="text-belgi-sariq">{soni('DUBLIKAT')}</b> bor edi ·{' '}
            <b className="text-belgi-qizil">{soni('XATO')}</b> xato
          </p>
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2 font-medium">Qator</th>
                  <th className="px-4 py-2 font-medium">Ism</th>
                  <th className="px-4 py-2 font-medium">Natija</th>
                  <th className="px-4 py-2 font-medium">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara">
                {holat.qatorlar.map((q) => (
                  <tr key={q.raqam}>
                    <td className="raqam px-4 py-2 text-matn-kuchsiz">{q.raqam}</td>
                    <td className="px-4 py-2">{q.ism === '' ? '—' : q.ism}</td>
                    <td className={`px-4 py-2 font-medium ${NATIJA[q.natija]?.uslub ?? ''}`}>
                      {NATIJA[q.natija]?.matn ?? q.natija}
                    </td>
                    <td className="px-4 py-2 text-[13px] text-matn-ikki">{q.izoh ?? ''}</td>
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
