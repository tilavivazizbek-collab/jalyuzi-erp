'use client';

/**
 * app/(panel)/tanlov-modal.tsx — ro'yxat + «shu yerda yangi qo'shish».
 *
 * ⚠️ Muammo: odam ish ustida turib «bu ro'yxatda yo'q ekan» deb
 *    qolardi. Uni qo'shish uchun boshqa sahifaga o'tish, yarim
 *    to'ldirilgan formani tashlab ketish va qaytib kelib
 *    hammasini qaytadan terish kerak edi.
 *
 *    Endi «+ Yangi» bosilsa MODAL OYNA ochiladi va ichida
 *    TO'LIQ kartochka turadi. Saqlangach oyna yopiladi va yangi
 *    yozuv darhol tanlanadi. Orqadagi forma joyida qoladi.
 *
 * ⚠️ Ruxsat SERVERDA tekshiriladi (§9.4). Bu yerdagi `qoshaOladi`
 *    faqat tugmani yashiradi — himoya emas.
 */

import { useState, type ReactNode } from 'react';
import { Maydon, kirishUslubi } from './maydon';
import { Modal } from './modal';
import type { YaratilganYozuv } from './modal-holat';

export interface TanlovBandi {
  readonly id: number;
  readonly nom: string;
}

export function TanlovModal({
  nom,
  yorliq,
  izoh,
  bandlar,
  boshlangich,
  boshMatn = '— tanlanmagan —',
  yangiYorliq,
  modalSarlavha,
  modalIzoh,
  qoshaOladi,
  keng = false,
  forma,
  tanlandi,
}: {
  /** `name` — forma shu nom bilan yuboradi */
  nom: string;
  yorliq: string;
  izoh?: string;
  bandlar: readonly TanlovBandi[];
  boshlangich?: string;
  boshMatn?: string;
  /** «Yangi mijoz» kabi — oldiga «+» qo'yiladi */
  yangiYorliq: string;
  modalSarlavha: string;
  modalIzoh?: string;
  qoshaOladi: boolean;
  keng?: boolean;
  /**
   * Modal ichidagi forma.
   *
   * ⚠️ Funksiya bo'lib beriladi: forma «saqlandi» va «yop» ni
   *    olishi kerak, lekin ular shu qismning ichki holatiga
   *    tegishli.
   */
  forma: (saqlandi: (y: YaratilganYozuv) => void, yop: () => void) => ReactNode;
  /** Tanlov o'zgarganda — chaqiruvchiga xabar */
  tanlandi?: (id: number | null) => void;
}) {
  const [royxat, royxatniOzgartir] = useState<readonly TanlovBandi[]>(bandlar);
  const [tanlangan, tanlanganniOzgartir] = useState(boshlangich ?? '');
  const [ochiq, ochiqniOzgartir] = useState(false);

  function yop(): void {
    ochiqniOzgartir(false);
  }

  function saqlandi(y: YaratilganYozuv): void {
    /**
     * ⚠️ Yangi yozuv ro'yxatga qo'shiladi VA darhol tanlanadi.
     *    Aks holda odam uni qo'shib, keyin yana qidirib tanlashi
     *    kerak bo'lardi.
     *
     * ⚠️ Allaqachon ro'yxatda bo'lishi mumkin: dublikat topilib
     *    «mavjudini tanlash» bosilgan bo'lsa. U holda ikkinchi
     *    marta qo'shilmaydi.
     */
    royxatniOzgartir((r) => (r.some((b) => b.id === y.id) ? r : [...r, y]));
    tanlanganniOzgartir(String(y.id));
    tanlandi?.(y.id);
    yop();
  }

  return (
    <Maydon nom={nom} yorliq={yorliq} izoh={izoh}>
      <div className="flex flex-col gap-2">
        <select
          id={nom}
          name={nom}
          value={tanlangan}
          onChange={(e) => {
            tanlanganniOzgartir(e.target.value);
            tanlandi?.(e.target.value === '' ? null : Number(e.target.value));
          }}
          className={kirishUslubi(false)}
        >
          <option value="">{boshMatn}</option>
          {royxat.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.nom}
            </option>
          ))}
        </select>

        {qoshaOladi && (
          <button
            type="button"
            onClick={() => {
              ochiqniOzgartir(true);
            }}
            className="fokus self-start rounded-maydon px-1 py-0.5 text-[12px] font-medium text-brend transition-colors hover:underline"
          >
            + {yangiYorliq}
          </button>
        )}
      </div>

      <Modal
        ochiq={ochiq}
        yop={yop}
        sarlavha={modalSarlavha}
        izoh={modalIzoh}
        keng={keng}
        bolalar={forma(saqlandi, yop)}
      />
    </Maydon>
  );
}
