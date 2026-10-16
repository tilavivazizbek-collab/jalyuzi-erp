/**
 * TZ 11.2 — hisobot eksportining xom ma'lumoti. 2026-10-16.
 * Xom qatorlar ekrandagi hisobot bilan BIR XIL raqam beradi:
 * xom tushum yig'indisi = sotuvchi kesimidagi tushum yig'indisi.
 */
import { afterAll, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { sotuvXom, xarajatXom } from '@/app/(panel)/hisobot/xom-malumot';
import { foydaZararMalumoti, turBoyichaFoyda } from '@/app/(panel)/hisobot/malumot';
import { foydaZarar } from '@/lib/domain/hisobot/foyda-zarar';

afterAll(async () => {
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.2 — sotuv xom ma’lumoti', () => {
  it('EC-EKS-01: xom tannarx yig‘indisi = tur bo‘yicha foydadagi tannarx', async () => {
    const davr = davrYasa('OY', new Date());
    const [xom, turlar] = await Promise.all([sotuvXom(1, davr), turBoyichaFoyda(1, davr)]);
    const sum = (r: readonly string[]) => r.reduce((y, x) => y.plus(x), new Decimal(0)).toFixed(2);
    const turli = xom.filter((q) => q.tur !== null);
    expect(sum(turli.map((q) => new Decimal(q.tannarx).plus(q.ishHaqi).toFixed(2)))).toBe(
      sum(turlar.map((t) => t.tannarx)),
    );
  });
});

describe('TZ 11.2 · 11.4 — moliya xom ma’lumoti', () => {
  it('EC-EKS-02: «xarajatlarda» qatorlari yig‘indisi = foyda-zarar xarajat jami + kurs farqi', async () => {
    const davr = davrYasa('OY', new Date());
    const [xom, fz] = await Promise.all([xarajatXom(1, davr), foydaZararMalumoti(1, davr)]);
    const j = foydaZarar(fz);
    const xarajatlarda = xom.filter((x) => !x.tannarxda && x.somda !== null);
    const jami = xarajatlarda.reduce((y, x) => y.plus(x.somda ?? '0'), new Decimal(0));
    const kutilgan = new Decimal(j.xarajatJami).plus(j.kursZarar).minus(j.kursDaromad);
    expect(jami.toFixed(2)).toBe(kutilgan.toFixed(2));
  });
});
