/**
 * Kechki hisobot ma'lumoti va navbatga qo'yish. 2026-10-12.
 *
 * ⚠️ YANGI HISOB YO'Q: kassadagi pul, kutilayotgan to'lovlar va «pul
 *    yetmaydi» — pul prognozidan; muammolar — ma'lumot salomatligidan;
 *    odatdan tashqari amallar — nazoratdan. Telegramdagi raqam saytdagi
 *    raqam bilan bir xil chiqadi.
 * ⚠️ Xabar tranzaksiyada YUBORILMAYDI — navbatga yoziladi (2.1-invariant),
 *    `bot/yuboruvchi` jo'natadi.
 * ⚠️ Kuniga BIR marta: bot qayta ishga tushsa ham ikkinchi xabar ketmaydi —
 *    bugun shu filial uchun navbatga yozilgan xabar bo'lsa, o'tkaziladi.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { kunigaBirMartaOgohlantir } from '@/lib/amal/bildirishnoma';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { kechkiHisobotMatni, type KechkiKirimi } from '@/lib/domain/hisobot/kechki';
import { NAZORAT_TAVSIFI, nazoratniGuruhla } from '@/lib/domain/hisobot/nazorat';
import { kunQosh, pulPrognozi } from '@/lib/domain/hisobot/pul-prognozi';
import { VAQT_ZONASI, toshkentKuni } from '@/lib/domain/sana';
import { pulPrognoziMalumoti } from './malumot';
import { malumotSalomatligi } from './salomatlik-malumot';
import { nazoratHodisalari } from './nazorat-malumot';

const OLDINDA_KUN = 7;
const MANBA = 'kechki_hisobot';

const MIJOZDAN = ['K1', 'K2', 'K3', 'K4'];
const YETKAZIBGA = ['C1', 'C2', 'C3'];
const XARAJAT = ['C4', 'C5', 'C7', 'C10', 'C13'];

export async function kechkiHisobotMalumoti(filialId: number): Promise<KechkiKirimi> {
  const sql = ulanishOl();
  const hozir = new Date();
  const bugunDavr = davrYasa('BUGUN', hozir);
  const [savdo, kassa, prognozXom, salomatlik, nazorat] = await Promise.all([
    sql<{ n: number; s: string | null }[]>`
      SELECT COUNT(DISTINCT b.id)::int AS n,
             SUM((COALESCE(p.narx_snapshot, 0) - COALESCE(p.chegirma_summa, 0))
                 * CASE WHEN b.valyuta = 'USD' THEN COALESCE(b.kurs_snapshot, 0) ELSE 1 END)
               ::numeric(14,2)::text AS s
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.sotgan_filial_id = ${filialId}
        AND b.sana >= ${bugunDavr.boshi} AND b.sana < ${bugunDavr.oxiri}
        AND p.holat NOT IN ('BEKOR', 'RAD_ETILGAN')`,
    sql<{ mijoz: string | null; yetkazib: string | null; xarajat: string | null }[]>`
      SELECT SUM(y.summa) FILTER (WHERE y.kod = ANY(${MIJOZDAN}))::numeric(14,2)::text AS mijoz,
             (-SUM(y.summa) FILTER (WHERE y.kod = ANY(${YETKAZIBGA})))::numeric(14,2)::text AS yetkazib,
             (-SUM(y.summa) FILTER (WHERE y.kod = ANY(${XARAJAT})))::numeric(14,2)::text AS xarajat
      FROM kassa_yozuv y JOIN kassa k ON k.id = y.kassa_id
      WHERE k.filial_id = ${filialId} AND y.valyuta = 'SOM'
        AND y.sana >= ${bugunDavr.boshi} AND y.sana < ${bugunDavr.oxiri}`,
    pulPrognoziMalumoti(filialId),
    malumotSalomatligi(filialId),
    nazoratHodisalari(filialId, bugunDavr),
  ]);

  const prognoz = pulPrognozi({
    bugun: prognozXom.bugun,
    boshlangich: prognozXom.boshlangich,
    kirimlar: prognozXom.kirimlar,
    chiqimlar: prognozXom.chiqimlar,
    kunlikKirim: prognozXom.kunlikKirim,
    kunlikChiqim: prognozXom.kunlikChiqim,
  });
  const chegara = kunQosh(prognozXom.bugun, OLDINDA_KUN);
  const yigindi = (r: readonly { sana: string; summa: string }[]): string =>
    r
      .filter((h) => h.sana <= chegara)
      .reduce((a, h) => a.plus(h.summa), new Decimal(0))
      .toFixed(2);

  const k = kassa[0];
  return {
    sana: prognozXom.bugun,
    buyurtmaSoni: savdo[0]?.n ?? 0,
    buyurtmaSumma: savdo[0]?.s ?? '0',
    mijozdanTushdi: k?.mijoz ?? '0',
    yetkazibgaTolandi: k?.yetkazib ?? '0',
    xarajat: k?.xarajat ?? '0',
    kassadaPul: prognozXom.boshlangich,
    // ⚠️ Muddati o'tgan chiqim prognozda «bugun» — bu yerda ham kiradi
    kutilayotganKirim: yigindi(prognozXom.kirimlar),
    kutilayotganChiqim: yigindi(prognozXom.chiqimlar),
    muddatiOtganQarz: prognozXom.muddatiOtganKirim,
    pulYetmaydi: prognoz.yetmaydi,
    nazorat: nazoratniGuruhla(nazorat).turlar.map((t) => ({ nom: NAZORAT_TAVSIFI[t.turi].nom, soni: t.soni })),
    malumotMuammosi: salomatlik.filter((m) => m.daraja === 'XAVF').length,
  };
}

/**
 * Kassa yopilish soati o'tgan va bugun hisobot olmagan filiallarga
 * kechki hisobotni navbatga qo'yadi.
 *
 * @returns navbatga yozilgan xabarlar soni (filial × admin)
 */
export async function kechkiHisobotlarniNavbatgaQoy(
  hozir: Date = new Date(),
  filialIdlar?: readonly number[],
): ReturnType<typeof kunigaBirMartaOgohlantir> {
  const sql = ulanishOl();
  return kunigaBirMartaOgohlantir(sql, {
    hodisa: 'KECHKI_HISOBOT',
    manbaTuri: MANBA,
    bugun: toshkentKuni(hozir),
    filialIdlar,
    qoshimchaShart: sql`
      AND f.sotadi
      AND (${hozir}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::time >= f.kassa_yopilish_soati`,
    matnYasa: async (filialId) => kechkiHisobotMatni(await kechkiHisobotMalumoti(filialId)),
  });
}
