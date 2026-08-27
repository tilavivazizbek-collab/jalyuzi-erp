/**
 * QISM 1 §11 — «Zod sxemasi BIR MARTA yoziladi, uch joyda ishlatiladi.»
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * 2026-08-27 da material kartochkasiga «kelish narxi» qo'shildi:
 * baza ustuni bor edi, Zod sxemasida bor edi, formada katak bor edi —
 * lekin `app/(panel)/material/amal.ts` dagi MAYDONLAR ro'yxatiga
 * qo'shilmagan edi. Ro'yxat maydonlarni NOMMA-NOM o'qiydi, shuning
 * uchun kiritilgan narx jimgina yo'qolardi.
 *
 * `tsc` buni ko'rmaydi: ro'yxat — oddiy matnlar massivi. Odam ham
 * sezmasdi: forma xatosiz saqlanardi, faqat narx bo'sh qolardi.
 *
 * Shu sabab bu test ikki ro'yxatni solishtiradi. Yangi maydon
 * qo'shilib, ro'yxatga tushmasa — test darhol yiqiladi.
 */
import { describe, expect, it } from 'vitest';
import { materialSxema } from '@/lib/sxema/material';
import { MATERIAL_MAYDONLARI } from '@/app/(panel)/material/maydonlar';

/**
 * `materialSxema` — `.refine()` bilan o'ralgan. Ichkaridagi
 * `z.object` ning kalitlari kerak.
 */
function sxemaKalitlari(): string[] {
  const ichki = (materialSxema as unknown as { def: { type: string; innerType?: unknown } }).def;

  const obyekt =
    ichki.type === 'object'
      ? (materialSxema as unknown as { shape: Record<string, unknown> })
      : (ichki.innerType as { shape: Record<string, unknown> });

  return Object.keys(obyekt.shape);
}

describe('Material formasi maydonlari Zod sxemasi bilan mos', () => {
  it("sxemadagi har maydon formadan o'qiladi", () => {
    const kalitlar = sxemaKalitlari();

    /**
     * `eslatma` — sxemada bor, lekin formada katak yo'q (hali
     * qo'shilmagan). Uni ataylab chetlab o'tamiz, chunki u
     * ixtiyoriy va yo'qligi ma'lumot yo'qotmaydi.
     */
    const kutilmaydiganlar = new Set(['eslatma']);

    const tushmaganlar = kalitlar.filter(
      (k) => !kutilmaydiganlar.has(k) && !MATERIAL_MAYDONLARI.includes(k),
    );

    expect(tushmaganlar).toEqual([]);
  });

  it("ro'yxatdagi har maydon sxemada bor — ortiqcha nom qolib ketmasin", () => {
    const kalitlar = new Set(sxemaKalitlari());
    const ortiqchalar = MATERIAL_MAYDONLARI.filter((m) => !kalitlar.has(m));
    expect(ortiqchalar).toEqual([]);
  });

  it("ro'yxatda nom takrorlanmaydi", () => {
    expect(new Set(MATERIAL_MAYDONLARI).size).toBe(MATERIAL_MAYDONLARI.length);
  });

  it('kelish narxi — aynan shu xato takrorlanmasin', () => {
    expect(MATERIAL_MAYDONLARI).toContain('kutilayotganKelishNarx');
    expect(MATERIAL_MAYDONLARI).toContain('kutilayotganKelishValyuta');
  });
});
