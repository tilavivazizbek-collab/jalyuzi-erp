/**
 * TZ 11.2 — hisobot eksportining xom ma'lumoti. 2026-10-16.
 * Xom qatorlar ekrandagi hisobot bilan BIR XIL raqam beradi:
 * xom tushum yig'indisi = sotuvchi kesimidagi tushum yig'indisi.
 */
import { afterAll, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { sotuvXom } from '@/app/(panel)/hisobot/xom-malumot';
import { turBoyichaFoyda } from '@/app/(panel)/hisobot/malumot';

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
