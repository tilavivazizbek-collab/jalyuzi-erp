/**
 * TZ 5 · Q-01 · Q-05 · Q-10 · Q-14
 */
import { describe, expect, it } from 'vitest';
import {
  HISOB_TURLARI,
  STANDART_KAM_ISHLATILADIGAN,
  STANDART_YAROQSIZ,
  birlikOzgartirilsinmi,
  birlikOzgartirishniTalabQil,
  chegaraKvMda,
  kamQoldiqmi,
  kirimdanSarflashga,
  koeffitsientKerakmi,
  koeffitsientTekshir,
  nofaolQilinsinmi,
  ochirilsinmi,
  ostatkaDarajasi,
  saqlashTekshir,
  type SaqlashKirishi,
} from '@/lib/domain/material';
import { m } from '@/lib/domain/birlik';
import { BiznesXato } from '@/lib/xato';

// ─── 5.2 · Hisob turlari ──────────────────────────────────────────────────

describe("5.2 — to'rt hisob turi", () => {
  it("v1.13 dagi ikkitasi emas, to'rttasi", () => {
    expect(HISOB_TURLARI).toEqual(['RULON', 'KV_M', 'CHIZIQLI', 'DONA']);
  });
});

// ─── 5.3 · Konversiya (Q-01) ──────────────────────────────────────────────

describe('Q-01 — koeffitsient SANTIMETRDA', () => {
  it('1 shtanga = 300 sm', () => {
    expect(kirimdanSarflashga(1, 300, 'SM')).toBe(300);
    expect(kirimdanSarflashga(5, 300, 'SM')).toBe(1500);
  });

  it('1 metr = 100 sm', () => {
    expect(kirimdanSarflashga(1, 100, 'SM')).toBe(100);
  });

  it('1 quti = 3000 sm', () => {
    expect(kirimdanSarflashga(2, 3000, 'SM')).toBe(6000);
  });

  it("koeffitsient 3 EMAS 300 — Z-01 ning o'zagi", () => {
    // Eski TZ da «koeffitsient 3» deb yozilgan edi, natijada 100 barobar xato
    expect(kirimdanSarflashga(1, 300, 'SM')).not.toBe(3);
  });

  it('nol va manfiy koeffitsient bloklanadi (5.8)', () => {
    expect(() => koeffitsientTekshir(0)).toThrow(BiznesXato);
    expect(() => koeffitsientTekshir(-1)).toThrow(BiznesXato);
    expect(() => koeffitsientTekshir(Number.NaN)).toThrow(BiznesXato);
    expect(koeffitsientTekshir(300)).toBe(300);
  });

  it('dona → dona da koeffitsient kerak emas', () => {
    expect(koeffitsientKerakmi('dona', 'DONA')).toBe(false);
    expect(koeffitsientKerakmi('shtanga', 'SM')).toBe(true);
    expect(koeffitsientKerakmi('rulon', 'KV_M')).toBe(true);
  });
});

describe("5.3 — qoldiq bor ekan birlik o'zgarmaydi", () => {
  it("qoldiq 0 bo'lsa o'zgartiriladi", () => {
    expect(birlikOzgartirilsinmi(0)).toBe(true);
    expect(() => { birlikOzgartirishniTalabQil(0); }).not.toThrow();
  });

  it("qoldiq bor bo'lsa bloklanadi va sabab ko'rsatiladi", () => {
    expect(birlikOzgartirilsinmi(12.5)).toBe(false);
    expect(() => { birlikOzgartirishniTalabQil(12.5); }).toThrow(BiznesXato);
  });
});

// ─── 5.5 · Ostatka darajalari ─────────────────────────────────────────────

describe('5.5 va 7.5 — uchta daraja, ENI bo\'yicha', () => {
  const yaroqsiz = m(0.5);
  const kam = m(1.0);

  it('0.5 dan kichik — yaroqsiz', () => {
    expect(ostatkaDarajasi(m(0.3), yaroqsiz, kam)).toBe('YAROQSIZ');
    expect(ostatkaDarajasi(m(0.49), yaroqsiz, kam)).toBe('YAROQSIZ');
  });

  it('0.5 va 1.0 orasi — kam ishlatiladigan', () => {
    expect(ostatkaDarajasi(m(0.5), yaroqsiz, kam)).toBe('KAM_ISHLATILADIGAN');
    expect(ostatkaDarajasi(m(0.99), yaroqsiz, kam)).toBe('KAM_ISHLATILADIGAN');
  });

  it('1.0 va undan katta — normal', () => {
    expect(ostatkaDarajasi(m(1.0), yaroqsiz, kam)).toBe('NORMAL');
    expect(ostatkaDarajasi(m(3.0), yaroqsiz, kam)).toBe('NORMAL');
  });

  it("chegara belgilanmagan bo'lsa standart ishlaydi", () => {
    expect(STANDART_YAROQSIZ).toBe(0.5);
    expect(STANDART_KAM_ISHLATILADIGAN).toBe(1.0);
    expect(ostatkaDarajasi(m(0.3), null, null)).toBe('YAROQSIZ');
    expect(ostatkaDarajasi(m(2), null, null)).toBe('NORMAL');
  });

  it("MAYDON emas, ENI — `0.20 × 6` bo'lak 1.2 kv.m bo'lsa ham yaroqsiz", () => {
    expect(ostatkaDarajasi(m(0.2), yaroqsiz, kam)).toBe('YAROQSIZ');
  });
});

// ─── Q-14 · Chegarani kv.m ga o'girish ────────────────────────────────────

describe("Q-14 — kam qoldiq chegarasi kv.m ga standart rulon eni orqali", () => {
  it('standart rulon eni ishlatiladi', () => {
    expect(chegaraKvMda(m(5), m(1.8), null)).toBe(9);
  });

  it("bo'sh bo'lsa oxirgi kirimdan olinadi", () => {
    expect(chegaraKvMda(m(5), null, m(2.0))).toBe(10);
  });

  it('ikkalasi ham yo\'q — hisoblab bo\'lmaydi', () => {
    expect(chegaraKvMda(m(5), null, null)).toBe(null);
  });

  it('standart rulon eni ustun', () => {
    expect(chegaraKvMda(m(5), m(1.8), m(2.0))).toBe(9);
  });
});

describe('Q-10 — kam qoldiq ogohlantirishi', () => {
  it('chegaradan past tushsa', () => {
    expect(kamQoldiqmi(3, 5)).toBe(true);
    expect(kamQoldiqmi(5, 5)).toBe(false);
    expect(kamQoldiqmi(7, 5)).toBe(false);
  });

  it("chegara belgilanmagan bo'lsa ogohlantirmaydi", () => {
    expect(kamQoldiqmi(0, null)).toBe(false);
  });
});

// ─── 5.8 · Saqlash tekshiruvi ─────────────────────────────────────────────

describe('5.8 — nima bloklaydi, nima ogohlantiradi', () => {
  const yaxshi: SaqlashKirishi = {
    nom: "Ko'k mato",
    sotuvNarxiSoni: 120_000,
    koeffitsient: 1,
    tannarxSoni: 90_000,
    slotgaBoglanganmi: true,
    kamQoldiqChegarasiSoni: 5,
    joriyQoldiq: 20,
    ustamaFoizi: 33,
    minimalUstamaFoizi: 30,
  };

  it("hammasi joyida — saqlanadi, ogohlantirish yo'q", () => {
    const n = saqlashTekshir(yaxshi);
    expect(n.saqlansinmi).toBe(true);
    expect(n.ogohlantirishlar).toEqual([]);
  });

  it("BLOKLAYDI: nom bo'sh, narx manfiy, koeffitsient 0", () => {
    expect(saqlashTekshir({ ...yaxshi, nom: '  ' }).bloklovchilar).toContain('MAJBURIY_BOSH');
    expect(saqlashTekshir({ ...yaxshi, sotuvNarxiSoni: -1 }).bloklovchilar).toContain(
      'NARX_MANFIY',
    );
    expect(saqlashTekshir({ ...yaxshi, koeffitsient: 0 }).bloklovchilar).toContain(
      'KOEFFITSIENT_NOTOGRI',
    );
    expect(saqlashTekshir({ ...yaxshi, nom: '' }).saqlansinmi).toBe(false);
  });

  it('OGOHLANTIRADI, lekin saqlaydi: narx tannarxdan past', () => {
    const n = saqlashTekshir({ ...yaxshi, sotuvNarxiSoni: 80_000 });
    expect(n.saqlansinmi).toBe(true);
    expect(n.ogohlantirishlar).toContain('NARX_TANNARXDAN_PAST');
  });

  it("OGOHLANTIRADI: hech qaysi slotga bog'lanmagan", () => {
    const n = saqlashTekshir({ ...yaxshi, slotgaBoglanganmi: false });
    expect(n.saqlansinmi).toBe(true);
    expect(n.ogohlantirishlar).toContain('SLOTGA_BOGLANMAGAN');
  });

  it('OGOHLANTIRADI: chegara joriy qoldiqdan yuqori', () => {
    const n = saqlashTekshir({ ...yaxshi, kamQoldiqChegarasiSoni: 50, joriyQoldiq: 20 });
    expect(n.ogohlantirishlar).toContain('CHEGARA_QOLDIQDAN_YUQORI');
  });

  it('OGOHLANTIRADI: ustama minimal chegaradan past (5.4, 20.9.5)', () => {
    const n = saqlashTekshir({ ...yaxshi, ustamaFoizi: 12, minimalUstamaFoizi: 30 });
    expect(n.saqlansinmi).toBe(true);
    expect(n.ogohlantirishlar).toContain('USTAMA_CHEGARADAN_PAST');
  });
});

// ─── 5.9 · Material holati ────────────────────────────────────────────────

describe('5.9 va 2.1-invariant — material holati', () => {
  it("harakati bo'lmagan material butunlay o'chiriladi", () => {
    expect(ochirilsinmi(false)).toBe(true);
  });

  it('harakati bori nofaol qilinadi', () => {
    expect(ochirilsinmi(true)).toBe(false);
  });

  it("majburiy komplektda va guruhda boshqa variant yo'q — BLOKLANADI", () => {
    expect(
      nofaolQilinsinmi({ majburiyKomplektda: true, guruhdaBoshqaFaolBormi: false }),
    ).toBe(false);
  });

  it("guruhda boshqa faol variant bor — nofaol qilsa bo'ladi", () => {
    expect(
      nofaolQilinsinmi({ majburiyKomplektda: true, guruhdaBoshqaFaolBormi: true }),
    ).toBe(true);
  });

  it("majburiy komplektda emas — nofaol qilsa bo'ladi", () => {
    expect(
      nofaolQilinsinmi({ majburiyKomplektda: false, guruhdaBoshqaFaolBormi: false }),
    ).toBe(true);
  });
});
