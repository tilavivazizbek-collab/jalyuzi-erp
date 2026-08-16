/**
 * lib/db/schema/asos.ts — QISM 3 §1 · TZ 20.2, 10.2, 10.3, 14.6, 20.12
 *
 * Asos jadvallari: filial, xodim, rollar, ruxsatlar, sessiya.
 *
 * ⚠️ Modelga nisbatan bitta o'zgarish: `xodim.rol_id` o'rniga `xodim_rol`
 *    bog'lovchi jadvali. Sabab — TZ 10.3, 13, 14.6, 14.10 va EC-XOD-10
 *    xodimda bir nechta rol bo'lishini talab qiladi, model esa bitta rol
 *    yozib qo'ygan. Batafsil: docs/QARORLAR-KOD.md, P-05.
 */

import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { id, izlar, ochirilmaydi } from './ustunlar';

// ─── 1.1 · filial — TZ 20.2 ───────────────────────────────────────────────

export const filial = pgTable(
  'filial',
  {
    id: id(),
    nom: text('nom').notNull(),
    manzil: text('manzil'),
    telefon: text('telefon'),

    /** TZ 20.2.1 — to'rt rejim shu ikki bayroqdan kelib chiqadi */
    sotadi: boolean('sotadi').notNull().default(true),
    ishlabChiqaradi: boolean('ishlab_chiqaradi').notNull().default(true),

    /** O'zi tikmasa — buyurtma qaysi filialga ketadi (20.2) */
    standartIshlabChiqaruvchiId: bigint('standart_ishlab_chiqaruvchi_id', {
      mode: 'number',
    }).references((): AnyPgColumn => filial.id),

    /** Q-17 — kassa kuni 20:00 da tugaydi, filial o'zgartirishi mumkin */
    kassaYopilishSoati: time('kassa_yopilish_soati').notNull().default('20:00'),

    /** TZ 20.2.2 — bosh filial standart narx va spravochniklarni boshqaradi */
    bosh: boolean('bosh').notNull().default(false),

    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    // TZ 20.2.2 — bosh filial faqat bitta
    uniqueIndex('filial_bitta_bosh').on(t.bosh).where(sql`${t.bosh} = true`),
    // TZ 20.2 — o'zi tikmasa, qayerda tikilishi ko'rsatilishi shart
    check(
      'filial_ishlab_chiqaruvchi_kerak',
      sql`${t.ishlabChiqaradi} = true OR ${t.standartIshlabChiqaruvchiId} IS NOT NULL`,
    ),
    // O'ziga o'zi yuborolmaydi
    check(
      'filial_ozi_ozgaga_emas',
      sql`${t.standartIshlabChiqaruvchiId} IS NULL OR ${t.standartIshlabChiqaruvchiId} <> ${t.id}`,
    ),
  ],
);

// ─── 1.3 · rol · ruxsat · rol_ruxsat — TZ 14.6, 20.12 ─────────────────────

export const rol = pgTable(
  'rol',
  {
    id: id(),
    nom: text('nom').notNull().unique(),
    /** Tizimli rolni o'chirib bo'lmaydi (admin, usta) */
    tizimli: boolean('tizimli').notNull().default(false),
    ...ochirilmaydi,
    ...izlar,
  },
  () => [],
);

/**
 * Ruxsat — spravochnik, KODDA belgilanadi (QISM 3 §1.3).
 * Yangi ruxsat kodi kod bilan birga keladi, admin qo'lda qo'sha olmaydi.
 */
export const ruxsat = pgTable('ruxsat', {
  kod: text('kod').primaryKey(), // 'ombor.kirim.yarat'
  nom: text('nom').notNull(),
  guruh: text('guruh').notNull(), // 'Ombor'
});

/** TZ 20.12 — har ruxsatning filial qamrovi bor */
export const QAMROVLAR = ['OZ_FILIALI', 'BARCHA'] as const;
export type Qamrov = (typeof QAMROVLAR)[number];

export const rolRuxsat = pgTable(
  'rol_ruxsat',
  {
    rolId: bigint('rol_id', { mode: 'number' })
      .notNull()
      .references(() => rol.id),
    ruxsatKod: text('ruxsat_kod')
      .notNull()
      .references(() => ruxsat.kod),
    qamrov: text('qamrov').notNull().default('OZ_FILIALI'),
    ...izlar,
  },
  (t) => [
    primaryKey({ columns: [t.rolId, t.ruxsatKod] }),
    check('rol_ruxsat_qamrov', sql`${t.qamrov} IN ('OZ_FILIALI','BARCHA')`),
  ],
);

// ─── 1.2 · xodim — TZ 10.2, 20.11 ─────────────────────────────────────────

export const xodim = pgTable(
  'xodim',
  {
    id: id(),
    /** Q-29 — xodim aniq bitta filialda */
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    ism: text('ism').notNull(),
    telefon: text('telefon').notNull().unique(),

    /** Usta saytga kirmaydi → parol bo'lmasligi mumkin (Q-04 qattiq qoidasi) */
    parolHash: text('parol_hash'),

    /** Telegram ID — 52 bitdan oshmaydi, `number` yetarli */
    telegramId: bigint('telegram_id', { mode: 'number' }).unique(),

    ishgaKirdi: timestamp('ishga_kirdi', { withTimezone: false, mode: 'string' }),
    ishdanChiqdi: timestamp('ishdan_chiqdi', { withTimezone: false, mode: 'string' }),

    /** §8 — 5 muvaffaqiyatsiz urinishdan keyin 15 daqiqa blok */
    xatoUrinish: bigint('xato_urinish', { mode: 'number' }).notNull().default(0),
    bloklangan: timestamp('bloklangan', { withTimezone: true }),

    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [index('xodim_filial').on(t.filialId)],
);

/**
 * 1.2.1 · xodim_rol — TZ 10.3, 14.6, EC-XOD-10 (QARORLAR-KOD P-05)
 *
 * Xodimda bir nechta rol bo'lishi mumkin, ruxsatlar ularning YIG'INDISI.
 */
export const xodimRol = pgTable(
  'xodim_rol',
  {
    xodimId: bigint('xodim_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),
    rolId: bigint('rol_id', { mode: 'number' })
      .notNull()
      .references(() => rol.id),
    ...izlar,
  },
  (t) => [primaryKey({ columns: [t.xodimId, t.rolId] }), index('xodim_rol_rol').on(t.rolId)],
);

// ─── 1.4 · sessiya — QISM 1 §8 ────────────────────────────────────────────

/** JWT emas — bazada, darhol bekor qilish uchun (§8). */
export const sessiya = pgTable(
  'sessiya',
  {
    id: id(),
    xodimId: bigint('xodim_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),
    tokenHash: text('token_hash').notNull().unique(),
    amalQiladi: timestamp('amal_qiladi', { withTimezone: true }).notNull(),
    bekorQilindi: timestamp('bekor_qilindi', { withTimezone: true }),
    ip: text('ip'),
    qurilma: text('qurilma'),
    ...izlar,
  },
  (t) => [index('sessiya_xodim').on(t.xodimId, t.amalQiladi)],
);

// ─── Bog'lanishlar ────────────────────────────────────────────────────────

export const filialBoglanish = relations(filial, ({ many, one }) => ({
  xodimlar: many(xodim),
  standartIshlabChiqaruvchi: one(filial, {
    fields: [filial.standartIshlabChiqaruvchiId],
    references: [filial.id],
  }),
}));

export const xodimBoglanish = relations(xodim, ({ many, one }) => ({
  filial: one(filial, { fields: [xodim.filialId], references: [filial.id] }),
  rollar: many(xodimRol),
  sessiyalar: many(sessiya),
}));

export const rolBoglanish = relations(rol, ({ many }) => ({
  ruxsatlar: many(rolRuxsat),
  xodimlar: many(xodimRol),
}));

export const xodimRolBoglanish = relations(xodimRol, ({ one }) => ({
  xodim: one(xodim, { fields: [xodimRol.xodimId], references: [xodim.id] }),
  rol: one(rol, { fields: [xodimRol.rolId], references: [rol.id] }),
}));

export const rolRuxsatBoglanish = relations(rolRuxsat, ({ one }) => ({
  rol: one(rol, { fields: [rolRuxsat.rolId], references: [rol.id] }),
  ruxsat: one(ruxsat, { fields: [rolRuxsat.ruxsatKod], references: [ruxsat.kod] }),
}));
