'use client';

/**
 * app/(panel)/buyurtma/tahrir.tsx — TZ 8.7
 *
 * «Pozitsiya "Ishlab chiqarilmoqda" ga o'tmaguncha tahrirlanadi:
 *  rang, o'lcham, aksessuar, narx.»
 *
 * ⚠️ 2026-09-03 gacha bu ekran UMUMAN yo'q edi: o'lchamni xato
 *    kiritgan sotuvchi pozitsiyani bekor qilib qaytadan kiritishi
 *    kerak edi.
 *
 * ⚠️ NARX QO'LDA. Mato o'lchami o'zgarsa sarflash formuladan QAYTA
 *    hisoblanadi va ekranda ko'rinadi, narxni esa sotuvchi o'zi
 *    qo'yadi — u mijoz bilan kelishilgan (3.8, 3.11).
 *
 * ⚠️ Aksessuarlar O'ZGARISHSIZ qaytariladi: server tahrirda ro'yxatni
 *    ustidan yozadi, shuning uchun ular yo'qolib qolmasligi kerak.
 */

import { useActionState, useEffect, useState } from 'react';
import { Modal } from '../modal';
import { kirishUslubi } from '../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { sm, type SarflashBirligi } from '@/lib/domain/birlik';
import { turTafsiliAmali } from './yangi/amal';
import { pozitsiyaTahrirAmali } from './tahrir-amal';
import { BOSH_TAHRIR } from './tahrir-holat';
import type { SotuvTuri } from '@/lib/amal/katalog';
import type { PozitsiyaTahriri } from './malumot';

/** Qotib qolgan formulalar — `formula_snapshot` dan (4.10). */
interface QotganFormula {
  readonly nom?: unknown;
  readonly formula?: unknown;
}

function qotganFormulalar(xom: unknown): Map<string, string> {
  const xarita = new Map<string, string>();
  if (typeof xom !== 'object' || xom === null) return xarita;
  const s = (xom as { slotlar?: unknown }).slotlar;
  if (!Array.isArray(s)) return xarita;

  for (const q of s as QotganFormula[]) {
    if (typeof q.nom === 'string' && typeof q.formula === 'string') {
      xarita.set(q.nom, q.formula);
    }
  }
  return xarita;
}

export function TahrirTugmasi({ pozitsiya }: { pozitsiya: PozitsiyaTahriri }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [tur, turniOzgartir] = useState<SotuvTuri | null>(null);
  const [yuklanmoqda, yuklanmoqdaniOzgartir] = useState(false);

  const [holat, yubor, kutilmoqda] = useActionState(
    pozitsiyaTahrirAmali.bind(null, pozitsiya.pozitsiyaId),
    BOSH_TAHRIR,
  );

  const [eni, eniniOzgartir] = useState(String(pozitsiya.eniSm));
  const [boyi, boyiniOzgartir] = useState(String(pozitsiya.boyiSm));
  const [narx, narxniOzgartir] = useState(pozitsiya.narxSnapshot);
  const [chegirma, chegirmaniOzgartir] = useState(pozitsiya.chegirmaSumma);
  const [matolar, matolarniOzgartir] = useState<Record<number, number>>(() =>
    Object.fromEntries(pozitsiya.slotlar.map((s) => [s.slotId, s.materialId])),
  );

  /** Tur tafsiloti faqat oyna ochilganda yuklanadi — ro'yxat og'ir (3.2) */
  useEffect(() => {
    if (!ochiq || tur !== null || yuklanmoqda) return;
    yuklanmoqdaniOzgartir(true);
    void turTafsiliAmali(pozitsiya.mahsulotTurId)
      .then((t) => {
        turniOzgartir(t);
      })
      .finally(() => {
        yuklanmoqdaniOzgartir(false);
      });
  }, [ochiq, tur, yuklanmoqda, pozitsiya.mahsulotTurId]);

  const eniSm = Number(eni);
  const boyiSm = Number(boyi);
  const olchamYaroqli =
    Number.isInteger(eniSm) && Number.isInteger(boyiSm) && eniSm > 0 && boyiSm > 0;

  const qotgan = qotganFormulalar(pozitsiya.formulaSnapshot);

  /**
   * Har slot uchun sarflash QAYTA hisoblanadi.
   *
   * ⚠️ Formula `formula_snapshot` dan olinadi (4.10) — konstruktor
   *    keyin o'zgargan bo'lsa ham eski buyurtma eski qoida bilan
   *    hisoblanadi. Snapshotda topilmasa joriysi ishlatiladi.
   */
  const qatorlar = pozitsiya.slotlar.map((s) => {
    const slot = tur?.slotlar.find((x) => x.id === s.slotId);
    const formula = (slot === undefined ? undefined : qotgan.get(slot.nom)) ?? slot?.formula;

    let miqdor: number | null = null;
    if (olchamYaroqli && formula !== undefined) {
      try {
        const asos = standartQiymatlar(sm(eniSm), sm(boyiSm), pozitsiya.soni, {});
        miqdor = sarflashHisobla(formula, asos, s.birlik as SarflashBirligi);
      } catch {
        miqdor = null;
      }
    }

    return {
      slot: s,
      nom: slot?.nom ?? `Slot ${String(s.slotId)}`,
      materiallar: slot?.materiallar ?? [],
      miqdor,
    };
  });

  const yuborilajak = {
    mahsulotTurId: pozitsiya.mahsulotTurId,
    qoshimchaMaterialId: null,
    eniSm: olchamYaroqli ? eniSm : 0,
    boyiSm: olchamYaroqli ? boyiSm : 0,
    soni: pozitsiya.soni,
    narxSnapshot: narx.trim(),
    chegirmaSumma: chegirma.trim() === '' ? '0' : chegirma.trim(),
    xizmatHaqi: pozitsiya.xizmatHaqi,
    formulaSnapshot: pozitsiya.formulaSnapshot,
    slotlar: qatorlar.map((q) => ({
      slotId: q.slot.slotId,
      materialId: matolar[q.slot.slotId] ?? q.slot.materialId,
      hisoblanganMiqdor:
        q.miqdor === null ? q.slot.hisoblanganMiqdor : q.miqdor.toFixed(4),
      tuzatilganMiqdor: q.slot.tuzatilganMiqdor,
      birlik: q.slot.birlik,
      narxSnapshot: q.slot.narxSnapshot,
    })),
    // ⚠️ O'zgarishsiz qaytariladi — server ro'yxatni ustidan yozadi
    aksessuarlar: pozitsiya.aksessuarlar.map((a) => ({
      materialId: a.materialId,
      soni: a.soni,
      birlik: a.birlik,
      narxSnapshot: a.narxSnapshot,
      qoldaKiritildi: a.qoldaKiritildi,
    })),
  };

  const narxYaroqli = /^\d+(\.\d{1,2})?$/.test(narx.trim());

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon border border-chegara px-3 py-1.5 text-[13px] font-medium text-matn-ikki transition-colors hover:bg-fon"
      >
        Tahrirlash
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha={`${pozitsiya.turNomi} — tahrirlash`}
        izoh="Ish boshlangunga qadar o'lcham, mato va narx o'zgartiriladi (8.7)"
        bolalar={
          <form action={yubor} className="flex flex-col gap-4">
            <input type="hidden" name="pozitsiya" value={JSON.stringify(yuborilajak)} />

            {holat.xato !== null && (
              <p
                role="alert"
                className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
              >
                {holat.xato}
              </p>
            )}

            {holat.bajarildi && (
              <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
                Saqlandi.
                {holat.qarzFarqi !== null && (
                  <span className="ml-1">
                    Mijoz qarzi{' '}
                    <b className="raqam">
                      {pulKorsat(som(holat.qarzFarqi.replace('-', '')))}
                    </b>{' '}
                    {holat.qarzFarqi.startsWith('-') ? 'kamaydi' : 'oshdi'}.
                  </span>
                )}
                {holat.materialgaKutmoqda && (
                  <span className="ml-1 text-belgi-sariq">
                    Yangi o&apos;lchamga mato yetmadi — «Materialga kutmoqda».
                  </span>
                )}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Eni (sm)</span>
                <input
                  value={eni}
                  onChange={(e) => {
                    eniniOzgartir(e.target.value);
                  }}
                  inputMode="numeric"
                  className={kirishUslubi(!olchamYaroqli)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">
                  Bo&apos;yi (sm)
                </span>
                <input
                  value={boyi}
                  onChange={(e) => {
                    boyiniOzgartir(e.target.value);
                  }}
                  inputMode="numeric"
                  className={kirishUslubi(!olchamYaroqli)}
                />
              </label>
            </div>

            {yuklanmoqda && (
              <p className="text-[13px] text-matn-kuchsiz">Matolar yuklanmoqda…</p>
            )}

            {qatorlar.map((q) => (
              <label key={q.slot.slotId} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">{q.nom}</span>
                <select
                  value={String(matolar[q.slot.slotId] ?? q.slot.materialId)}
                  onChange={(e) => {
                    matolarniOzgartir((o) => ({
                      ...o,
                      [q.slot.slotId]: Number(e.target.value),
                    }));
                  }}
                  disabled={q.materiallar.length === 0}
                  className={kirishUslubi(false)}
                >
                  {q.materiallar.length === 0 ? (
                    <option value={String(q.slot.materialId)}>
                      (mato ro&apos;yxati yuklanmadi)
                    </option>
                  ) : (
                    q.materiallar.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))
                  )}
                </select>
                {q.miqdor !== null && (
                  <span className="raqam text-[12px] text-matn-kuchsiz">
                    sarflash: {q.miqdor.toFixed(4)} {q.slot.birlik === 'KV_M' ? 'kv.m' : q.slot.birlik.toLowerCase()}
                  </span>
                )}
              </label>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Narx</span>
                <input
                  value={narx}
                  onChange={(e) => {
                    narxniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  className={kirishUslubi(!narxYaroqli)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Chegirma</span>
                <input
                  value={chegirma}
                  onChange={(e) => {
                    chegirmaniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  className={kirishUslubi(false)}
                />
              </label>
            </div>

            {pozitsiya.aksessuarlar.length > 0 && (
              <p className="rounded-maydon bg-fon px-3 py-2 text-[12px] text-matn-kuchsiz">
                Aksessuarlar o&apos;zgarishsiz qoladi:{' '}
                {pozitsiya.aksessuarlar.map((a) => a.nom).join(' · ')}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={kutilmoqda || !olchamYaroqli || !narxYaroqli}
                className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
              >
                {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
              <button
                type="button"
                onClick={() => {
                  ochiqniOzgartir(false);
                }}
                className="fokus rounded-maydon px-2 py-2 text-sm text-matn-kuchsiz hover:text-matn"
              >
                Yopish
              </button>
            </div>
          </form>
        }
      />
    </>
  );
}
