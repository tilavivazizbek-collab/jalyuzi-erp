'use client';

/**
 * app/(panel)/modal-holat.tsx — modal rejimidagi formalar uchun
 * umumiy qismlar.
 *
 * ⚠️ Naqsh to'rt formada takrorlanadi (mijoz · yetkazuvchi ·
 *    material · guruh). Nusxa ko'chirilsa biri tuzatilib
 *    qolganlari eskiligicha qolardi (§2.2).
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { YaratilganYozuv } from './modal-holat';

/**
 * Yozuv saqlangani haqida BIR MARTA xabar beradi.
 *
 * ⚠️ Bir marta bo'lishi shart: React formani qayta chizganda
 *    oyna qayta-qayta yopilishga urinardi.
 */
export function useSaqlanganda(
  yaratildi: YaratilganYozuv | null | undefined,
  saqlandi: ((y: YaratilganYozuv) => void) | undefined,
): void {
  const xabarBerildi = useRef(false);

  useEffect(() => {
    if (yaratildi === null || yaratildi === undefined || xabarBerildi.current) return;
    xabarBerildi.current = true;
    saqlandi?.(yaratildi);
  }, [yaratildi, saqlandi]);
}

/**
 * «Bekor qilish» — sahifada ro'yxatga havola, modalda oynani
 * yopadigan tugma.
 */
export function BekorQilish({ yol, bekor }: { yol: string; bekor?: () => void }) {
  if (bekor === undefined) {
    return (
      <Link href={yol} className="text-sm text-matn-ikki hover:text-matn">
        Bekor qilish
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={bekor}
      className="fokus rounded-maydon px-2 py-1 text-sm text-matn-ikki transition-colors hover:text-matn"
    >
      Bekor qilish
    </button>
  );
}
