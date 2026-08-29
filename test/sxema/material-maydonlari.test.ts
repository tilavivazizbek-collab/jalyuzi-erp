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
import { MATERIAL_MAYDONLARI, NARX_MAYDONLARI } from '@/app/(panel)/material/maydonlar';

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

    /**
     * ⚠️ `rasm` ATAYLAB Zod sxemasidan tashqarida.
     *
     *    U matn emas, BAYTLAR: `data:image/webp;base64,...`.
     *    Zod uni tekshirsa ham hech narsa bermasdi — rasm turi,
     *    hajmi va formati `lib/domain/rasm.ts` da tekshiriladi,
     *    u yerda `Buffer` bilan ishlash mumkin.
     */
    const sxemadanTashqari = new Set(['rasm']);

    const ortiqchalar = MATERIAL_MAYDONLARI.filter(
      (m) => !kalitlar.has(m) && !sxemadanTashqari.has(m),
    );
    expect(ortiqchalar).toEqual([]);
  });

  it('rasm maydoni formadan o‘qiladi — u Zoddan tashqarida', () => {
    /**
     * ⚠️ Tashqarida bo'lgani uchun uni unutib qo'yish oson:
     *    forma yuboradi, lekin server o'qimasdi va rasm
     *    jimgina yo'qolardi.
     */
    expect(MATERIAL_MAYDONLARI).toContain('rasm');
  });

  it("ro'yxatda nom takrorlanmaydi", () => {
    expect(new Set(MATERIAL_MAYDONLARI).size).toBe(MATERIAL_MAYDONLARI.length);
  });

  it('kelish narxi — aynan shu xato takrorlanmasin', () => {
    expect(MATERIAL_MAYDONLARI).toContain('kutilayotganKelishNarx');
    expect(MATERIAL_MAYDONLARI).toContain('kutilayotganKelishValyuta');
  });
});

/**
 * ⚠️ 2026-08-29 — MATERIAL UMUMAN SAQLANMASDI.
 *
 * Narx katagi valyuta maydonining nomini `${nom}Valyuta` deb
 * YASARDI: `sotuvNarxValyuta`. Sxema esa `sotuvValyuta` kutardi.
 * Valyuta hech qachon yetib bormay, `z.enum` bo'sh matnni rad
 * etardi. Ekranda esa valyuta alohida maydon emas — shuning
 * uchun qizil belgi HECH QAYERDA chiqmasdi va egasi «qizil
 * maydonni to'ldiring deyapti, qizil maydon yo'q» degan
 * holatga tushdi.
 *
 * Quyidagi test to'ldirilgan formani boshdan-oxir tekshiradi:
 * bitta maydon nomi xato bo'lsa — darhol yiqiladi.
 */
describe("To'ldirilgan forma saqlanadi", () => {
  /** Omborchi kiritadigan eng oddiy material */
  function toldirilganForma(): Record<string, string> {
    const kirim: Record<string, string> = {};
    for (const m of MATERIAL_MAYDONLARI) kirim[m] = '';

    kirim['nom'] = 'Mato — oq';
    kirim['hisobTuri'] = 'RULON';
    kirim['kirimBirligi'] = 'rulon';
    kirim['sarflashBirligi'] = 'KV_M';
    kirim['koeffitsient'] = '100';

    /** Narx katagi yuboradigan yashirin maydonlar */
    for (const j of NARX_MAYDONLARI) {
      kirim[j.narx] = '50000';
      kirim[j.valyuta] = 'SOM';
    }
    return kirim;
  }

  it('faqat majburiy maydonlar bilan ham saqlanadi', () => {
    const n = materialSxema.safeParse(toldirilganForma());
    const xatolar = n.success ? [] : n.error.issues.map((i) => i.path.join('.'));
    expect(xatolar).toEqual([]);
  });

  it('narx juftligining ikkala nomi ham sxemada bor', () => {
    const kalitlar = new Set(sxemaKalitlari());
    for (const j of NARX_MAYDONLARI) {
      expect(kalitlar.has(j.narx), `${j.narx} sxemada yo'q`).toBe(true);
      expect(kalitlar.has(j.valyuta), `${j.valyuta} sxemada yo'q`).toBe(true);
      expect(MATERIAL_MAYDONLARI).toContain(j.narx);
      expect(MATERIAL_MAYDONLARI).toContain(j.valyuta);
    }
  });
});
