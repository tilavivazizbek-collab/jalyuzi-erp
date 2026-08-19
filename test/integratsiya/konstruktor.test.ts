/**
 * TZ 4 · 2.1-invariant · 2.4 · QISM 1 §14.2
 *
 * Mahsulot turi TO'RT jadvalga yoziladi. Bu testlar tranzaksiyaning
 * butunligini va TZ 4 qoidalarini haqiqiy bazada tekshiradi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mahsulotTuriTahrirla, mahsulotTuriYarat } from '@/lib/amal/konstruktor';
import type { MahsulotTurKirimi } from '@/lib/sxema/konstruktor';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let guruhId: number;
let materialId: number;

const ASOS: MahsulotTurKirimi = {
  nom: 'Sinov Dikke',
  xizmatHaqi: '50000',
  tartib: '1',
  oynadaKorinadi: true,
  botdaKorinadi: true,
  slotlar: [],
  parametrlar: [{ kod: 'CHET', nom: 'Chet kengligi', standartQiymat: '30' }],
  aksessuarlar: [],
};

beforeAll(async () => {
  sql = sinovUlanishi();

  const g = await sql<{ id: number }[]>`
    INSERT INTO almashtirish_guruh (nom, yaratdi_id)
    VALUES ('Konstruktor sinov guruhi', 1) RETURNING id`;
  const gid = g[0]?.id;
  if (gid === undefined) throw new Error('guruh yaratilmadi');
  guruhId = gid;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          sotuv_narx, almashtirish_guruh_id, yaratdi_id)
    VALUES ('Konstruktor sinov matosi', 'RULON', 'rulon', 'KV_M', 120000,
            ${guruhId}, 1) RETURNING id`;
  const mid = m[0]?.id;
  if (mid === undefined) throw new Error('material yaratilmadi');
  materialId = mid;
}, 60_000);

afterAll(async () => {
  await sql.end();
});

const bilan = (o: Partial<MahsulotTurKirimi>): MahsulotTurKirimi => ({ ...ASOS, ...o });

const slot = (nom: string, formula: string) => ({
  nom,
  formula,
  majburiy: true,
  almashtirishGuruhId: guruhId,
});

describe('TZ 4.5 — nuqson bo\'lsa SAQLANMAYDI', () => {
  it("noma'lum parametr rad etiladi", async () => {
    const n = await mahsulotTuriYarat(
      sql,
      bilan({ nom: 'Nuqson 1', slotlar: [slot('Mato', 'QALINLIK × 2')] }),
      1,
    );
    expect(n.holat).toBe('NUQSON');
    if (n.holat === 'NUQSON') {
      expect(n.xabarlar.join(' ')).toContain('QALINLIK');
    }
  });

  it('sintaksis xatosi rad etiladi', async () => {
    const n = await mahsulotTuriYarat(
      sql,
      bilan({ nom: 'Nuqson 2', slotlar: [slot('Mato', '(ENI + ')] }),
      1,
    );
    expect(n.holat).toBe('NUQSON');
  });

  it('guruhsiz slot rad etiladi — sotuvda bo\'sh ro\'yxat chiqardi (5.6)', async () => {
    const n = await mahsulotTuriYarat(
      sql,
      bilan({
        nom: 'Nuqson 3',
        slotlar: [{ nom: 'Mato', formula: 'MAYDON', majburiy: true, almashtirishGuruhId: null }],
      }),
      1,
    );
    expect(n.holat).toBe('NUQSON');
    if (n.holat === 'NUQSON') {
      expect(n.xabarlar.join(' ')).toContain('guruh');
    }
  });

  it('rad etilgan tur bazaga YOZILMAYDI', async () => {
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_tur WHERE nom LIKE 'Nuqson %'`;
    expect(q[0]?.n).toBe(0);
  });
});

describe('2.1-invariant — to\'rt jadval bitta tranzaksiyada', () => {
  let turId: number;

  it("to'g'ri sozlangan tur saqlanadi", async () => {
    const n = await mahsulotTuriYarat(
      sql,
      bilan({
        slotlar: [
          slot('Chet mato', "CHET × BO'YI"),
          slot("O'rta mato", "(ENI − 2×CHET) × BO'YI"),
        ],
        aksessuarlar: [{ materialId, formula: 'ENI × 2', majburiy: true }],
      }),
      1,
    );
    expect(n.holat).toBe('SAQLANDI');
    if (n.holat === 'SAQLANDI') turId = n.id;
  });

  it('slotlar tartibi bilan yozilgan', async () => {
    const q = await sql<{ nom: string; tartib: number }[]>`
      SELECT nom, tartib FROM mahsulot_slot
      WHERE mahsulot_tur_id = ${turId} AND faol = true ORDER BY tartib`;
    expect(q.map((s) => s.nom)).toEqual(['Chet mato', "O'rta mato"]);
    expect(q.map((s) => s.tartib)).toEqual([0, 1]);
  });

  it('parametr va aksessuar ham yozilgan', async () => {
    const p = await sql<{ kod: string }[]>`
      SELECT kod FROM mahsulot_parametr WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(p.map((x) => x.kod)).toEqual(['CHET']);

    const a = await sql<{ formula: string }[]>`
      SELECT formula FROM mahsulot_aksessuar WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(a.map((x) => x.formula)).toEqual(['ENI × 2']);
  });

  it('tahrirlash eski slotlarni O\'CHIRMAYDI, nofaol qiladi (4.10)', async () => {
    const n = await mahsulotTuriTahrirla(
      sql,
      turId,
      bilan({ nom: 'Sinov Dikke — yangilangan', slotlar: [slot('Bitta mato', 'MAYDON')] }),
      1,
      1,
    );
    expect(n.holat).toBe('SAQLANDI');

    const faol = await sql<{ nom: string }[]>`
      SELECT nom FROM mahsulot_slot WHERE mahsulot_tur_id = ${turId} AND faol = true`;
    expect(faol.map((s) => s.nom)).toEqual(['Bitta mato']);

    // Eski qatorlar joyida qoladi — ular eski buyurtmalarda havola bo'lishi mumkin
    const hammasi = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_slot WHERE mahsulot_tur_id = ${turId}`;
    expect(hammasi[0]?.n).toBe(3);
  });

  it('TZ 2.4 — tahrir audit jurnaliga tushadi', async () => {
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE amal = 'MAHSULOT_TURI_TAHRIRLANDI' AND obyekt_id = ${turId}`;
    expect(q[0]?.n).toBe(1);
  });

  it('jurnalda eski va yangi nom bor', async () => {
    const q = await sql<{ eski_qiymat: { nom: string }; yangi_qiymat: { nom: string } }[]>`
      SELECT eski_qiymat, yangi_qiymat FROM audit_jurnal
      WHERE amal = 'MAHSULOT_TURI_TAHRIRLANDI' AND obyekt_id = ${turId}`;
    expect(q[0]?.eski_qiymat.nom).toBe('Sinov Dikke');
    expect(q[0]?.yangi_qiymat.nom).toBe('Sinov Dikke — yangilangan');
  });
});

describe('TZ 4.3 — parametr kodi bazada ham tekshiriladi', () => {
  it("kichik harfli kod baza CHECK ida to'siladi", async () => {
    // Sxema ham to'sadi, lekin baza OXIRGI to'siq bo'lib qolishi kerak
    await expect(
      sql`INSERT INTO mahsulot_parametr (mahsulot_tur_id, kod, nom, yaratdi_id)
          SELECT id, 'kichik', 'Yomon', 1 FROM mahsulot_tur
          WHERE nom = 'Sinov Dikke — yangilangan' LIMIT 1`,
    ).rejects.toThrow();
  });
});
