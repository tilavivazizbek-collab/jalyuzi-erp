'use client';

/**
 * Umumiy «Chop etish» tugmasi — jurnalsiz hujjatlar uchun.
 *
 * ⚠️ Chekdan FARQI: chek chop etilishi `chek_chop` jurnaliga
 *    yoziladi (8.14 — takroriy chek nazorati). Hisob-kitob
 *    varaqasi va kunlik yopish varaqasi esa pul hujjati emas,
 *    ularni necha marta chiqarish cheklanmaydi.
 */

export function OddiyChopTugmasi({ matn = 'Chop etish' }: { matn?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.print();
      }}
      className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
    >
      {matn}
    </button>
  );
}
