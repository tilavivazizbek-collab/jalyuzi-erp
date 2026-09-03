/**
 * TZ 11.7 — ombor hisobotlari.
 *
 * K-08 (ustama eroziyasi, 37.4%) shu yerda yopiladi — CLAUDE.md §6.
 */
import { describe, expect, it } from 'vitest';
import {
  USTAMA_STANDART_CHEGARA,
  kerakliNarx,
  ustamaEroziyasi,
  ustamaQatori,
} from '@/lib/domain/hisobot/ustama-eroziya';
import {
  QIMIRLAMAGAN_OY,
  muzlaganPul,
  ostatkasizQoldiq,
  qimirlamaganKun,
} from '@/lib/domain/hisobot/muzlagan-pul';
import { pulMatn, som } from '@/lib/domain/pul';
import { K08 } from '@/test/kanonik';

const material = (
  nom: string,
  tannarx: number,
  sotuvNarx: number,
  chegara: number | null = null,
) => ({ materialId: 1, nom, tannarx: som(tannarx), sotuvNarx: som(sotuvNarx), chegara });

describe('K-08: ustama eroziyasi — TZ 11.7.5', () => {
  it("Ko'k mato: (120 000 − 87 333) / 87 333 = 37.4%", () => {
    const q = ustamaQatori(material(K08.nom, Number(K08.tannarx), Number(K08.sotuvNarx)));
    expect(q.ustamaFoiz).toBe(K08.ustamaFoiz);
    expect(q.pastmi).toBe(false);
  });

  it('TZ 11.7.5 jadvalidagi uch qator ham to‘g‘ri chiqadi', () => {
    const h = ustamaEroziyasi([
      { ...material('Alyuminiy karniz', 30_815, 35_000), materialId: 1 },
      { ...material("Ko'k mato", 87_333, 120_000), materialId: 2 },
      { ...material('Kronshteyn', 4_490, 5_000), materialId: 3 },
    ]);
    const foizlar = Object.fromEntries(h.qatorlar.map((q) => [q.nom, q.ustamaFoiz]));
    expect(foizlar['Alyuminiy karniz']).toBe(13.6);
    expect(foizlar["Ko'k mato"]).toBe(37.4);
    expect(foizlar['Kronshteyn']).toBe(11.4);
    expect(h.pastSoni).toBe(2);
  });

  it('chegaradan pastlar tepada, ular ichida eng yomoni birinchi', () => {
    const h = ustamaEroziyasi([
      material("Ko'k mato", 87_333, 120_000),
      material('Alyuminiy karniz', 30_815, 35_000),
      material('Kronshteyn', 4_490, 5_000),
    ]);
    expect(h.qatorlar.map((q) => q.nom)).toEqual([
      'Kronshteyn', // 11.4% — eng past
      'Alyuminiy karniz', // 13.6%
      "Ko'k mato", // 37.4% — chegaradan yuqori
    ]);
  });

  it('materialning shaxsiy chegarasi standartdan ustun — 5.4', () => {
    expect(USTAMA_STANDART_CHEGARA).toBe(30);
    // 20% ustama: standart chegarada past, shaxsiy 15% chegarada emas.
    expect(ustamaQatori(material('Mato', 100_000, 120_000)).pastmi).toBe(true);
    expect(ustamaQatori(material('Mato', 100_000, 120_000, 15)).pastmi).toBe(false);
  });

  it('chegaraga AYNAN teng ustama past hisoblanmaydi', () => {
    expect(ustamaQatori(material('Mato', 100_000, 130_000)).pastmi).toBe(false);
  });

  it('tannarxi nol material — 0% emas, «hisoblanmadi»', () => {
    // Boshlang'ich qoldiq kiritilmagan material shunday bo'ladi. 0% deb
    // ko'rsatilsa u «ustamasi yo'q» degan noto'g'ri xulosaga olib keladi.
    const q = ustamaQatori(material('Yangi material', 0, 50_000));
    expect(q.hisoblanmadi).toBe(true);
    expect(q.pastmi).toBe(false);
  });

  it('hisoblanmaganlar ro‘yxat OXIRIDA turadi', () => {
    const h = ustamaEroziyasi([
      material('Narxsiz', 0, 0),
      material('Yaxshi', 100_000, 200_000),
      material('Past', 100_000, 105_000),
    ]);
    expect(h.qatorlar.map((q) => q.nom)).toEqual(['Past', 'Yaxshi', 'Narxsiz']);
    expect(h.hisoblanmaganSoni).toBe(1);
    expect(h.jamiSoni).toBe(3);
  });

  it('bo‘sh ombor — hisobot yiqilmaydi', () => {
    const h = ustamaEroziyasi([]);
    expect(h.jamiSoni).toBe(0);
    expect(h.pastSoni).toBe(0);
  });

  it('kerakli narx: 30% chegara uchun 30 815 → 40 059.50', () => {
    expect(pulMatn(kerakliNarx(som(30_815), 30))).toBe('40059.50');
    expect(pulMatn(kerakliNarx(som(0), 30))).toBe('0.00');
  });
});

describe('muzlab qolgan pul — TZ 11.7.6', () => {
  const ostatka = (bolakId: number, materialId: number, qiymat: number) => ({
    bolakId,
    materialId,
    materialNom: `Material ${String(materialId)}`,
    qiymat: som(qiymat),
  });
  const tayyor = (buyurtmaId: number, qiymat: number, kutganKun: number) => ({
    buyurtmaId,
    raqam: `#${String(buyurtmaId)}`,
    mijozNom: 'Mijoz',
    qiymat: som(qiymat),
    kutganKun,
  });
  const qimirlamagan = (materialId: number, qiymat: number) => ({
    materialId,
    nom: `Material ${String(materialId)}`,
    qiymat: som(qiymat),
    oxirgiHarakat: new Date(2026, 0, 15),
  });

  it('uch bo‘lak yig‘iladi va ulushi hisoblanadi', () => {
    const n = muzlaganPul({
      ostatkalar: [ostatka(1, 10, 300_000), ostatka(2, 11, 200_000)],
      tayyorMahsulot: [tayyor(1247, 300_000, 40)],
      qimirlamagan: [qimirlamagan(20, 200_000)],
    });
    expect(pulMatn(n.jami)).toBe('1000000.00');
    expect(n.ostatkalar.ulushFoiz).toBe(50);
    expect(n.tayyorMahsulot.ulushFoiz).toBe(30);
    expect(n.qimirlamagan.ulushFoiz).toBe(20);
    expect(n.ostatkalar.soni).toBe(2);
  });

  it('bir material ikki bo‘lakda bo‘lsa — qo‘sh sanash ushlanadi (12.1)', () => {
    const n = muzlaganPul({
      ostatkalar: [ostatka(1, 10, 300_000)],
      tayyorMahsulot: [],
      qimirlamagan: [qimirlamagan(10, 500_000)],
    });
    expect(n.kesishgan).toEqual([10]);
  });

  it('to‘g‘ri tayyorlangan ma’lumotda kesishma yo‘q', () => {
    const n = muzlaganPul({
      ostatkalar: [ostatka(1, 10, 300_000)],
      tayyorMahsulot: [],
      qimirlamagan: [qimirlamagan(20, 500_000)],
    });
    expect(n.kesishgan).toEqual([]);
  });

  it('bo‘sh ombor — nolga bo‘linish yo‘q', () => {
    const n = muzlaganPul({ ostatkalar: [], tayyorMahsulot: [], qimirlamagan: [] });
    expect(pulMatn(n.jami)).toBe('0.00');
    expect(n.ostatkalar.ulushFoiz).toBe(0);
  });

  it('ostatkasiz qoldiq — ayirish pul turlarida bajariladi', () => {
    expect(pulMatn(ostatkasizQoldiq(som(500_000), som(120_000)))).toBe('380000.00');
  });

  it('ostatka qoldiqdan katta bo‘lsa nol — manfiy muzlagan pul bo‘lmaydi', () => {
    expect(pulMatn(ostatkasizQoldiq(som(100_000), som(150_000)))).toBe('0.00');
  });

  it('qimirlamagan kunlar', () => {
    const bugun = new Date(2026, 7, 12);
    expect(qimirlamaganKun(new Date(2026, 7, 2), bugun)).toBe(10);
    expect(qimirlamaganKun(null, bugun)).toBeNull();
    // Kelajakdagi sana (soat farqi) manfiy bermaydi
    expect(qimirlamaganKun(new Date(2026, 7, 13), bugun)).toBe(0);
    expect(QIMIRLAMAGAN_OY).toBe(6);
  });
});
