/**
 * lib/amal/xodim.ts — TZ 10.2 · 10.3 · §8
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * 2026-08-28 auditida chiqdi: xodim qo'shish tizimda UMUMAN yo'q
 * edi. Bazadagi 5 ta xodim urug'dan kelgan. Yangi sotuvchi ishga
 * olinsa, uni tizimga kiritib bo'lmasdi.
 */

import type postgres from 'postgres';
import { BiznesXato } from '@/lib/xato';
import { ochirilganEgasi } from './ochirilgan-tekshir';
import { telefonKanonik } from '@/lib/domain/telefon';
import { parolHash } from '@/lib/kirish/parol';
import type { XodimKirimi } from '@/lib/sxema/xodim';

export interface XodimNatijasi {
  readonly id: number;
  readonly ism: string;
}

/**
 * Yangi xodim.
 *
 * ⚠️ TRANZAKSIYA: xodim va uning rollari birga yoziladi. Rolsiz
 *    xodim tizimga kirsa HECH NARSA ko'ra olmasdi va sabab
 *    tushunarsiz bo'lardi (2.1-invariant).
 *
 * ⚠️ Parol XESHLANADI (argon2id) va hech qayerga logga tushmaydi.
 */
export async function xodimYarat(
  ulanish: postgres.Sql,
  kirim: XodimKirimi,
  yaratdiId: number,
): Promise<XodimNatijasi> {
  const telefon = telefonKanonik(kirim.telefon);
  const hash = kirim.parol === undefined ? null : await parolHash(kirim.parol);

  return ulanish.begin(async (tx) => {
    /**
     * ⚠️ Telefon NOYOB — bazada ham cheklov bor, lekin u yerdan
     *    kelgan xato («duplicate key value») odamga hech narsa
     *    aytmaydi.
     */
    const bor = await tx<{ ism: string; faol: boolean }[]>`
      SELECT ism, faol FROM xodim WHERE telefon = ${telefon}`;

    if (bor[0] !== undefined) {
      throw new BiznesXato(
        'TELEFON_BAND',
        bor[0].faol
          ? `Bu raqam ${bor[0].ism} da ishlatilmoqda`
          : `Bu raqam o'chirilgan xodimda (${bor[0].ism}) — avval uni qaytaring`,
      );
    }

    const rollar = await tx<{ id: number }[]>`
      SELECT id FROM rol WHERE id = ANY(${kirim.rolIdlar})`;

    if (rollar.length !== kirim.rolIdlar.length) {
      throw new BiznesXato('ROL_YOQ', 'Tanlangan rol topilmadi');
    }

    /** ⚠️ O'chirilgan xodimning telefoni ham band turadi (2026-08-30) */
    const ochirilgan = await ochirilganEgasi(tx, 'xodim', kirim.telefon);
    if (ochirilgan !== null) {
      throw new BiznesXato(
        'OCHIRILGANDA_BAND',
        `Bu telefon o'chirilgan xodimga tegishli: ${ochirilgan}. ` +
          `Xodimlar ro'yxatidagi «O'chirilganlar» dan uni qaytaring.`,
      );
    }

    const q = await tx<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, parol_hash, ishga_kirdi,
                         chegirma_limit_foiz, yaratdi_id)
      VALUES (${kirim.filialId}, ${kirim.ism}, ${telefon}, ${hash},
              ${kirim.ishgaKirdi ?? null},
              ${kirim.chegirmaLimitFoiz === undefined || kirim.chegirmaLimitFoiz === ''
                  ? null
                  : kirim.chegirmaLimitFoiz},
              ${yaratdiId})
      RETURNING id`;

    const id = q[0]?.id;
    if (id === undefined) throw new BiznesXato('SAQLANMADI', 'Xodim saqlanmadi');

    for (const rolId of kirim.rolIdlar) {
      await tx`
        INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
        VALUES (${id}, ${rolId}, ${yaratdiId})`;
    }

    return { id, ism: kirim.ism };
  });
}

/**
 * Xodimni tahrirlash.
 *
 * ⚠️ Parol bo'sh qoldirilsa ESKISI QOLADI. Aks holda har
 *    tahrirlashda parol o'chib ketardi va odam tizimga kira
 *    olmay qolardi.
 *
 *    Buning uchun SQL da `COALESCE(yangi, eski)` ishlatiladi —
 *    shartli so'rov qurishdan ko'ra ishonchli: so'rov matni har
 *    doim bir xil bo'ladi.
 */
export async function xodimTahrirla(
  ulanish: postgres.Sql,
  id: number,
  kirim: XodimKirimi,
  ozgartirdiId: number,
): Promise<XodimNatijasi> {
  const telefon = telefonKanonik(kirim.telefon);
  const hash = kirim.parol === undefined ? null : await parolHash(kirim.parol);

  return ulanish.begin(async (tx) => {
    const bor = await tx<{ ism: string }[]>`
      SELECT ism FROM xodim WHERE telefon = ${telefon} AND id <> ${id}`;

    if (bor[0] !== undefined) {
      throw new BiznesXato('TELEFON_BAND', `Bu raqam ${bor[0].ism} da ishlatilmoqda`);
    }

    const rollar = await tx<{ id: number }[]>`
      SELECT id FROM rol WHERE id = ANY(${kirim.rolIdlar})`;
    if (rollar.length !== kirim.rolIdlar.length) {
      throw new BiznesXato('ROL_YOQ', 'Tanlangan rol topilmadi');
    }

    await tx`
      UPDATE xodim SET
        filial_id = ${kirim.filialId},
        ism = ${kirim.ism},
        telefon = ${telefon},
        ishga_kirdi = ${kirim.ishgaKirdi ?? null},
        chegirma_limit_foiz = ${kirim.chegirmaLimitFoiz === undefined || kirim.chegirmaLimitFoiz === ''
            ? null
            : kirim.chegirmaLimitFoiz},
        /* Parol bo'sh qoldirilsa eskisi qoladi — izoh funksiya tepasida */
        parol_hash = COALESCE(${hash}, parol_hash),
        ozgartirdi_id = ${ozgartirdiId},
        ozgartirildi = now()
      WHERE id = ${id}`;

    /**
     * TZ 2.4 · QISM 1 §8 — PAROL O'ZGARISHI JURNALGA TUSHADI.
     *
     * ⚠️ Parolning O'ZI hech qayerga yozilmaydi — faqat
     *    o'zgartirilgani qayd etiladi. Kim kimning parolini
     *    almashtirgani javobgarlik savoli: undan keyin o'sha
     *    hisob bilan kirilgan har ish shu odamga bog'lanadi.
     */
    if (hash !== null) {
      await tx`
        INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi,
                                  obyekt_id, izoh)
        SELECT ${ozgartirdiId}, x.filial_id, 'PAROL_OZGARTIRILDI', 'xodim',
               ${id}, ${`${kirim.ism} paroli almashtirildi`}
          FROM xodim x WHERE x.id = ${ozgartirdiId}`;
    }

    /**
     * ⚠️ Rollar QAYTA yoziladi: eskisi o'chirilib yangisi
     *    qo'yiladi. `xodim_rol` — bog'lanish jadvali, unda tarix
     *    saqlanmaydi.
     *
     * ⚠️ AYNAN SHUNING UCHUN AUDIT KERAK (TZ 2.4 · 14.6, 2026-09-22).
     *    Bog'lanish jadvalida tarix qolmagani uchun «kim kimga
     *    admin huquqini bergan?» degan savolga javob beradigan
     *    yagona joy shu yozuv bo'ladi. Ilgari u YO'Q edi.
     */
    const eskiRollar = await tx<{ id: number; nom: string }[]>`
      SELECT r.id, r.nom FROM xodim_rol xr
      JOIN rol r ON r.id = xr.rol_id
      WHERE xr.xodim_id = ${id}
      ORDER BY r.id`;

    await tx`DELETE FROM xodim_rol WHERE xodim_id = ${id}`;
    for (const rolId of kirim.rolIdlar) {
      await tx`
        INSERT INTO xodim_rol (xodim_id, rol_id, yaratdi_id)
        VALUES (${id}, ${rolId}, ${ozgartirdiId})`;
    }

    /** ⚠️ O'zgarmagan bo'lsa yozilmaydi — jurnal shovqinga aylanmasin */
    const eskiIdlar = eskiRollar.map((r) => r.id);
    const yangiIdlar = [...kirim.rolIdlar].sort((a, b) => a - b);

    if (
      eskiIdlar.length !== yangiIdlar.length ||
      eskiIdlar.some((x, i) => x !== yangiIdlar[i])
    ) {
      const yangiNomlar = await tx<{ nom: string }[]>`
        SELECT nom FROM rol WHERE id = ANY(${kirim.rolIdlar}) ORDER BY id`;

      await tx`
        INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi,
                                  obyekt_id, eski_qiymat, yangi_qiymat, izoh)
        SELECT ${ozgartirdiId}, x.filial_id, 'RUXSAT_OZGARDI', 'xodim',
               ${id},
               ${tx.json({ rollar: eskiRollar.map((r) => r.nom) })},
               ${tx.json({ rollar: yangiNomlar.map((r) => r.nom) })},
               ${`${kirim.ism} rollari o'zgardi`}
          FROM xodim x WHERE x.id = ${ozgartirdiId}`;
    }

    return { id, ism: kirim.ism };
  });
}
