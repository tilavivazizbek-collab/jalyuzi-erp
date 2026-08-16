/**
 * QISM 1 §8, §16 — argon2id
 */
import { describe, expect, it } from 'vitest';
import { PAROL_ENG_KAM, parolHash, parolTogrimi, parolYaroqlimi } from '@/lib/kirish/parol';
import { BiznesXato } from '@/lib/xato';

describe('parol hashlash', () => {
  it("to'g'ri parolni taniydi", async () => {
    const h = await parolHash('juda-maxfiy-parol');
    expect(await parolTogrimi(h, 'juda-maxfiy-parol')).toBe(true);
  });

  it("noto'g'ri parolni rad etadi", async () => {
    const h = await parolHash('juda-maxfiy-parol');
    expect(await parolTogrimi(h, 'juda-maxfiy-paro1')).toBe(false);
  });

  it('argon2id ishlatiladi', async () => {
    const h = await parolHash('juda-maxfiy-parol');
    expect(h.startsWith('$argon2id$')).toBe(true);
  });

  it("bir xil parol har safar boshqa hash beradi — tuz tasodifiy", async () => {
    const a = await parolHash('juda-maxfiy-parol');
    const b = await parolHash('juda-maxfiy-parol');
    expect(a).not.toBe(b);
    expect(await parolTogrimi(a, 'juda-maxfiy-parol')).toBe(true);
    expect(await parolTogrimi(b, 'juda-maxfiy-parol')).toBe(true);
  });

  it('hash ichida parol matni yo\'q', async () => {
    const h = await parolHash('juda-maxfiy-parol');
    expect(h).not.toContain('juda-maxfiy-parol');
  });
});

describe('uzunlik talabi', () => {
  it(`${String(PAROL_ENG_KAM)} belgidan qisqa parol rad etiladi`, async () => {
    expect(parolYaroqlimi('qisqa')).toBe(false);
    await expect(parolHash('qisqa')).rejects.toThrow(BiznesXato);
  });

  it('chegara qiymatlari', () => {
    expect(parolYaroqlimi('a'.repeat(PAROL_ENG_KAM - 1))).toBe(false);
    expect(parolYaroqlimi('a'.repeat(PAROL_ENG_KAM))).toBe(true);
    expect(parolYaroqlimi('a'.repeat(128))).toBe(true);
    expect(parolYaroqlimi('a'.repeat(129))).toBe(false);
  });

  it('xato xabarida parol matni chiqmaydi (§16)', async () => {
    try {
      await parolHash('sir123');
      expect.unreachable('xato otilishi kerak edi');
    } catch (x) {
      expect(x).toBeInstanceOf(BiznesXato);
      expect((x as BiznesXato).message).not.toContain('sir123');
    }
  });
});

describe('buzuq hash', () => {
  it('yiqilmaydi, false qaytaradi — kirish ekrani ishlab tursin', async () => {
    expect(await parolTogrimi('buzuq-hash', 'juda-maxfiy-parol')).toBe(false);
    expect(await parolTogrimi('', 'juda-maxfiy-parol')).toBe(false);
  });
});
