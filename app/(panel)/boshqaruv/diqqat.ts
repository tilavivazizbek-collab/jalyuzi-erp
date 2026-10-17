/**
 * TZ 11.3 — dashboard ikkinchi qatori: «Diqqat talab qiladi». 2026-10-17
 *
 * «Har biri raqam va havola. Bosilganda tegishli filtr bilan ro'yxat ochiladi.»
 *
 * ⚠️ SANOQ RO'YXAT BILAN BIR XIL BO'LISHI SHART — bosilganda boshqa son
 *    chiqsa ishonch yo'qoladi. Shuning uchun har band o'sha ro'yxatning
 *    O'Z shartini yoki funksiyasini chaqiradi (muddatiOtganSharti,
 *    mijozlarRoyxati, holatSanoqlari, yetkazibHolatlari, ochiqDavoSharti).
 * ⚠️ Ruxsatga qarab: ro'yxatni ko'ra olmaydigan odamga band chiqmaydi (11.3).
 */

import { ulanishOl } from '@/lib/db';
import { ruxsatBormi, type Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import { toshkentKuni } from '@/lib/domain/sana';
import { joriyKurs } from '@/lib/amal/kurs';
import { muddatiOtganSharti } from '../buyurtma/malumot';
import { filialQoldigi } from '../ombor/malumot';
import { holatSanoqlari } from '../ombor/qoldiq-filtr';
import { filtrniOqi, mijozlarRoyxati } from '../mijoz/malumot';
import { yetkazibHolatlari } from '../yetkazib/taqsimot';
import { ochiqDavoSharti } from '../yetkazib/malumot';
import { ustamaHisoboti } from '../hisobot/malumot';

export interface DiqqatBandi {
  readonly nom: string;
  readonly soni: number;
  readonly havola: string;
  /** Qizil — masalan, 24 soatdan oshgan tasdiq (11.3) */
  readonly xavf: boolean;
  readonly izoh: string | null;
}

export async function diqqatBandlari(f: Foydalanuvchi): Promise<DiqqatBandi[]> {
  const sql = ulanishOl();
  const bandlar: Promise<DiqqatBandi | null>[] = [];

  if (ruxsatBormi(f, 'buyurtma.kor')) {
    bandlar.push(...buyurtmaDiqqati(f.filialId));
  }

  if (ruxsatBormi(f, 'ombor.qoldiq.kor')) {
    bandlar.push(
      (async () => {
        const s = holatSanoqlari(await filialQoldigi(f.filialId));
        return {
          nom: 'Kam qolgan material',
          soni: s.kam,
          havola: '/ombor?holat=kam',
          xavf: false,
          izoh: s.tugagan > 0 ? `${String(s.tugagan)} tasi tugagan` : null,
        };
      })(),
    );
  }

  if (ruxsatBormi(f, 'hisobot.ombor.kor')) {
    bandlar.push(
      (async () => {
        const u = await ustamaHisoboti(f.filialId);
        return {
          nom: 'Ustamasi chegaradan past',
          soni: u.pastSoni,
          havola: '/hisobot/ombor',
          xavf: false,
          izoh: null,
        };
      })(),
    );
  }

  if (ruxsatBormi(f, 'mijoz.kor')) {
    bandlar.push(
      (async () => {
        const r = await mijozlarRoyxati(filtrniOqi({ holat: 'limit' }), await joriyKurs(sql), 1);
        return {
          nom: 'Limitdan oshgan mijoz',
          soni: r.jamiSoni,
          havola: '/mijoz?holat=limit',
          xavf: r.jamiSoni > 0,
          izoh: null,
        };
      })(),
    );
  }

  if (ruxsatBormi(f, 'yetkazib.kor')) {
    bandlar.push(
      (async () => {
        const holatlar = await yetkazibHolatlari(null);
        const n = [...holatlar.values()].filter((h) => h.muddat.muddatOtganSoni > 0).length;
        return {
          nom: "Yetkazib beruvchiga muddati o'tgan to'lov",
          soni: n,
          havola: '/yetkazib?filtr=muddat',
          xavf: n > 0,
          izoh: null,
        };
      })(),
      (async () => {
        const q = await sql<{ n: number; y: number }[]>`
          SELECT COUNT(*)::int AS n, COUNT(DISTINCT k.yetkazib_beruvchi_id)::int AS y
          FROM kirim_qator kq JOIN kirim k ON k.id = kq.kirim_id
          WHERE ${ochiqDavoSharti(sql)}`;
        const n = q[0]?.n ?? 0;
        return {
          nom: "Ochiq da'vo",
          soni: n,
          havola: '/yetkazib',
          xavf: false,
          izoh: n > 0 ? `${String(q[0]?.y ?? 0)} ta yetkazib beruvchida` : null,
        };
      })(),
    );
  }

  return (await Promise.all(bandlar)).filter((b): b is DiqqatBandi => b !== null);
}

/**
 * Buyurtma bandlari — dashboard va Buyurtmalar sahifasi paneli (11.11) bir xil
 * sanasin. Ruxsatni chaqiruvchi tekshiradi.
 */
export function buyurtmaDiqqati(filialId: number): Promise<DiqqatBandi>[] {
  const sql = ulanishOl();
  return [
      (async () => {
        const q = await sql<{ n: number; eski: number }[]>`
          SELECT COUNT(DISTINCT b.id)::int AS n,
                 COUNT(DISTINCT b.id) FILTER (WHERE p.yaratildi < now() - interval '24 hours')::int AS eski
          FROM buyurtma b
          JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id AND p.holat = 'TASDIQ_KUTMOQDA'
          WHERE b.sotgan_filial_id = ${filialId}`;
        const eski = q[0]?.eski ?? 0;
        return {
          nom: 'Tasdiq kutayotgan buyurtma',
          soni: q[0]?.n ?? 0,
          havola: '/buyurtma?filtr=TASDIQ_KUTMOQDA',
          xavf: eski > 0,
          izoh: eski > 0 ? `${String(eski)} tasi 24 soatdan oshgan` : null,
        };
      })(),
      (async () => {
        const q = await sql<{ n: number }[]>`
          SELECT COUNT(*)::int AS n FROM buyurtma b
          WHERE b.sotgan_filial_id = ${filialId}
            AND EXISTS (SELECT 1 FROM buyurtma_pozitsiya x WHERE x.buyurtma_id = b.id AND x.holat <> 'BEKOR')
            ${muddatiOtganSharti(toshkentKuni())}`;
        const n = q[0]?.n ?? 0;
        return { nom: "Muddati o'tgan buyurtma", soni: n, havola: '/buyurtma?filtr=MUDDATI_OTGAN', xavf: n > 0, izoh: null };
      })(),
      (async () => {
        const q = await sql<{ n: number; b: number }[]>`
          SELECT COUNT(*)::int AS n, COUNT(DISTINCT b.id)::int AS b
          FROM buyurtma b
          JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id AND p.holat = 'MATERIALGA_KUTMOQDA'
          WHERE b.sotgan_filial_id = ${filialId}`;
        const n = q[0]?.n ?? 0;
        return {
          nom: 'Materialga kutayotgan pozitsiya',
          soni: n,
          havola: '/buyurtma?filtr=MATERIALGA_KUTMOQDA',
          xavf: false,
          izoh: n > 0 ? `${String(q[0]?.b ?? 0)} ta buyurtmada` : null,
        };
      })(),
  ];
}
