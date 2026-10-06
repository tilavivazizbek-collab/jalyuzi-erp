/** Ombor qoldig'i — qidiruv, filtr, saralash (ombor auditi 2026-10-06, 2-band) */
import { describe, expect, it } from 'vitest';
import {
  holatSanoqlari,
  normalla,
  qoldiqFiltriniOqi,
  qoldiqniFiltrla,
} from '@/app/(panel)/ombor/qoldiq-filtr';
import type { MaterialQoldigi } from '@/app/(panel)/ombor/malumot';

const m = (o: Partial<MaterialQoldigi> & { nom: string }): MaterialQoldigi => ({
  materialId: Math.floor(Math.random() * 1e9),
  hisobTuri: 'RULON',
  sarflashBirligi: 'KV_M',
  guruhId: null,
  guruhNomi: null,
  jamiKvM: 0,
  boshKvM: 0,
  bandKvM: 0,
  yoldaKvM: 0,
  bolakSoni: 0,
  miqdor: 0,
  kamQoldiqChegaraM: null,
  chegaraQoldiq: 0,
  kamQoldiq: false,
  tugagan: true,
  ...o,
});

const royxat = [
  m({ nom: "Qo'ng'ir blackout", guruhId: 1, guruhNomi: 'Rulonli', boshKvM: 60, jamiKvM: 60, bolakSoni: 2, chegaraQoldiq: 20, tugagan: false }),
  m({ nom: 'Oq tul', guruhId: 2, guruhNomi: 'Tul', boshKvM: 9, jamiKvM: 9, bolakSoni: 1, chegaraQoldiq: 3, kamQoldiqChegaraM: 10, kamQoldiq: true, tugagan: false }),
  m({ nom: 'Zebra kulrang', guruhId: 1, guruhNomi: 'Rulonli', kamQoldiqChegaraM: 15 }),
  m({ nom: 'Kronshteyn', hisobTuri: 'DONA', sarflashBirligi: 'DONA', miqdor: 40, bolakSoni: 1, chegaraQoldiq: 40, tugagan: false }),
  m({ nom: 'Dikkey lamel', yoldaKvM: 12 }),
];
const nomlar = (r: readonly MaterialQoldigi[]): string[] => r.map((q) => q.nom);

describe('qoldiqniFiltrla', () => {
  it('EC-OMB-F1: asosiy ko‘rinish — faqat omborda bor va yo‘ldagisi', () => {
    expect(nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({})))).toEqual([
      'Dikkey lamel',
      'Kronshteyn',
      'Oq tul',
      "Qo'ng'ir blackout",
    ]);
  });

  it('EC-OMB-F2: tugagan mato endi YO‘QOLMAYDI — «Tugagan» filtrida chiqadi', () => {
    expect(nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({ holat: 'tugagan' })))).toEqual([
      'Dikkey lamel',
      'Zebra kulrang',
    ]);
  });

  it('EC-OMB-F3: «kam qolgan» — chegaradan kam va chegarasi bor tugaganlar', () => {
    expect(nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({ holat: 'kam' })))).toEqual([
      'Oq tul',
      'Zebra kulrang',
    ]);
  });

  it('EC-OMB-F4: qidiruv apostrofga va katta harfga qaramaydi, guruh nomini ham topadi', () => {
    expect(nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({ q: 'QOʻNGʻIR' })))).toEqual([
      "Qo'ng'ir blackout",
    ]);
    expect(nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({ q: 'tul', holat: 'hammasi' })))).toEqual([
      'Oq tul',
    ]);
    expect(normalla('  Qo‘ng‘ir  ')).toBe("qo'ng'ir");
  });

  it('EC-OMB-F5: guruh filtri va saralash', () => {
    expect(
      nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({ guruh: '1', holat: 'hammasi' }))),
    ).toEqual(["Qo'ng'ir blackout", 'Zebra kulrang']);
    expect(nomlar(qoldiqniFiltrla(royxat, qoldiqFiltriniOqi({ saralash: 'kop' })))[0]).toBe(
      "Qo'ng'ir blackout",
    );
  });

  it('EC-OMB-F6: noto‘g‘ri URL qiymatlari jimgina standartga qaytadi', () => {
    expect(qoldiqFiltriniOqi({ holat: 'xxx', saralash: 'yyy', guruh: '-3' })).toEqual({
      qidiruv: '',
      holat: 'bor',
      guruhId: null,
      saralash: 'nom',
    });
  });

  it('EC-OMB-F7: tezkor tugma sanoqlari', () => {
    expect(holatSanoqlari(royxat)).toEqual({ kam: 2, tugagan: 2, yolda: 1 });
  });
});
