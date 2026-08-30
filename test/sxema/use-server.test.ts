/**
 * ⚠️ 2026-08-30 — `/kurs` sahifasi ishlab chiqarishda YIQILDI:
 *    «A "use server" file can only export async functions,
 *    found object».
 *
 *    Sabab: `amal.ts` da `BOSH_KURS_HOLATI` obyekti eksport
 *    qilingan edi. Loyihada bu qoida uchun `holat.ts` fayllari
 *    bor, lekin uni unutish oson.
 *
 * ⚠️ `npm run build` BUNI KO'RMAYDI. Xato faqat sahifa
 *    ochilganda chiqadi — ya'ni egasi ko'radi.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function fayllar(kok: string): string[] {
  const natija: string[] = [];
  for (const nom of readdirSync(kok)) {
    const yol = join(kok, nom);
    if (statSync(yol).isDirectory()) {
      if (nom === 'node_modules' || nom === '.next') continue;
      natija.push(...fayllar(yol));
    } else if (nom.endsWith('.ts') || nom.endsWith('.tsx')) {
      natija.push(yol);
    }
  }
  return natija;
}

describe("'use server' fayllari faqat async funksiya eksport qiladi", () => {
  it('boshqa eksport yo‘q', () => {
    const buzilgan: string[] = [];

    for (const yol of fayllar('app')) {
      const matn = readFileSync(yol, 'utf-8');
      if (!/^\s*['"]use server['"]/.test(matn)) continue;

      for (const qator of matn.split('\n')) {
        const t = qator.trim();
        if (!t.startsWith('export ')) continue;

        /** Tur eksporti kompilyatsiyada yo'qoladi — muammo emas */
        if (
          t.startsWith('export type') ||
          t.startsWith('export interface') ||
          t.startsWith('export async function')
        ) {
          continue;
        }

        buzilgan.push(`${yol}: ${t}`);
      }
    }

    expect(buzilgan).toEqual([]);
  });
});
