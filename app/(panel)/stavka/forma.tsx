'use client';

/**
 * app/(panel)/stavka/forma.tsx — TZ 10.8 · 10.9
 *
 * ⚠️ EGASI DASTURCHI EMAS. Uch usul uchta atama emas, uchta
 *    JUMLA bilan ko'rsatiladi va tanlangani darrov MISOL bilan
 *    tushuntiriladi. «Qat'iy summa · DONA» degan yozuv hech
 *    narsani anglatmaydi; «o'lchamdan qat'i nazar 15 000 so'm»
 *    anglatadi.
 */

import { useActionState, useMemo, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { enterYuborilmasin } from '../forma-yordamchi';
import { stavkaAmali } from './amal';
import { BOSH_STAVKA_HOLATI } from './holat';

export interface Tanlov {
  readonly id: number;
  readonly nom: string;
}

interface BosqichQatori {
  /**
   * ⚠️ Qatorning O'Z belgisi. React ro'yxatni shu bo'yicha
   *    taniydi — tartib raqami bo'yicha emas: o'rtadagi qator
   *    o'chirilsa keyingilarining raqami surilib ketardi va odam
   *    terayotgan katak boshqa qatorga «sakrab» qolardi.
   */
  readonly belgi: number;
  readonly chegaraKvM: string;
  readonly qiymat: string;
}

const BOSH_BOSQICHLAR: readonly BosqichQatori[] = [
  { belgi: 1, chegaraKvM: '1', qiymat: '' },
  { belgi: 2, chegaraKvM: '1.5', qiymat: '' },
  { belgi: 3, chegaraKvM: '', qiymat: '' },
];

const USULLAR = [
  {
    kod: 'DONA',
    nom: "Qat'iy summa",
    izoh: "Har buyum uchun bir xil summa — o'lchami qanday bo'lishidan qat'i nazar.",
    misol: '15 000 so‘m qo‘ysangiz, kichkina zashitka ham, kattasi ham 15 000.',
  },
  {
    kod: 'KV_M',
    nom: 'Kvadrat metrga',
    izoh: 'Summa buyum maydoniga ko‘paytiriladi.',
    misol: '18 000 so‘m/kv.m · 3.2 kv.m parda → 57 600 so‘m.',
  },
  {
    kod: 'BOSQICH',
    nom: 'O‘lchamga qarab jadval',
    izoh: 'Har o‘lcham oralig‘i uchun o‘z summasi. Ko‘paytirilmaydi.',
    misol: '1 kv.m gacha 10 000 · 1–1.5 → 20 000 · undan katta → 30 000.',
  },
] as const;

export function StavkaFormasi({
  turlar,
  filiallar,
  ustalar,
}: {
  turlar: readonly Tanlov[];
  filiallar: readonly Tanlov[];
  ustalar: readonly Tanlov[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(stavkaAmali, BOSH_STAVKA_HOLATI);
  const [usul, usulniOzgartir] = useState<string>('DONA');
  const [bosqichlar, bosqichlarniOzgartir] =
    useState<readonly BosqichQatori[]>(BOSH_BOSQICHLAR);

  const tanlangan = USULLAR.find((u) => u.kod === usul) ?? USULLAR[0];

  /**
   * ⚠️ Jadval brauzerdan JSON bo'lib boradi: qatorlar soni
   *    o'zgaruvchan, oddiy maydon nomlari bilan yuborib bo'lmaydi.
   */
  const bosqichJson = useMemo(
    () =>
      usul === 'BOSQICH'
        ? JSON.stringify(
            bosqichlar.map((q) => ({ chegaraKvM: q.chegaraKvM, qiymat: q.qiymat })),
          )
        : '',
    [usul, bosqichlar],
  );

  const qatorniOzgartir = (
    tartib: number,
    maydon: keyof BosqichQatori,
    qiymat: string,
  ): void => {
    bosqichlarniOzgartir((eski) =>
      eski.map((q, i) => (i === tartib ? { ...q, [maydon]: qiymat } : q)),
    );
  };

  const bugun = new Date().toISOString().slice(0, 10);
  const k = holat.kiritilgan ?? {};
  const u = holat.urinish ?? 0;

  return (
    <form action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      {holat.saqlandi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
          Stavka saqlandi — shu kundan keyingi ishlarga qo&apos;llanadi.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Maydon
          nom="mahsulotTurId"
          yorliq="Mahsulot turi"
          xato={holat.maydonlar.mahsulotTurId}
        >
          <select
            key={`tur-${String(u)}`}
            id="mahsulotTurId"
            name="mahsulotTurId"
            defaultValue={k.mahsulotTurId ?? ''}
            className={kirishUslubi(holat.maydonlar.mahsulotTurId !== undefined)}
          >
            <option value="">— tanlang —</option>
            {turlar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon
          nom="amalQiladiDan"
          yorliq="Qaysi kundan"
          izoh="Shu kungacha bajarilgan ishlar eski stavkada qoladi"
          xato={holat.maydonlar.amalQiladiDan}
        >
          <input
            key={`sana-${String(u)}`}
            id="amalQiladiDan"
            name="amalQiladiDan"
            type="date"
            defaultValue={k.amalQiladiDan ?? bugun}
            className={kirishUslubi(holat.maydonlar.amalQiladiDan !== undefined)}
          />
        </Maydon>

        {/*
          ⚠️ TZ 10.9 — standart + istisno. Ikkalasi ham bo'sh
             qolsa stavka HAMMAGA tegishli bo'ladi; bu eng ko'p
             ishlatiladigan holat, shuning uchun standart shu.
        */}
        <Maydon
          nom="filialId"
          yorliq="Filial"
          izoh="Bo‘sh — barcha filialga"
          xato={holat.maydonlar.filialId}
        >
          <select
            key={`filial-${String(u)}`}
            id="filialId"
            name="filialId"
            defaultValue={k.filialId ?? ''}
            className={kirishUslubi(holat.maydonlar.filialId !== undefined)}
          >
            <option value="">Barcha filialga</option>
            {filiallar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon
          nom="xodimId"
          yorliq="Usta"
          izoh="Bo‘sh — barcha ustaga"
          xato={holat.maydonlar.xodimId}
        >
          <select
            key={`usta-${String(u)}`}
            id="xodimId"
            name="xodimId"
            defaultValue={k.xodimId ?? ''}
            className={kirishUslubi(holat.maydonlar.xodimId !== undefined)}
          >
            <option value="">Barcha ustaga</option>
            {ustalar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        </Maydon>
      </div>

      {/* ─── Usul ─────────────────────────────────────────────── */}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-matn-ikki">
          Qanday hisoblanadi
        </legend>

        <div className="grid gap-2 sm:grid-cols-3">
          {USULLAR.map((x) => (
            <label
              key={x.kod}
              className={`fokus cursor-pointer rounded-maydon border px-3 py-2.5 text-sm transition-colors ${
                usul === x.kod
                  ? 'border-brend bg-brend/5 text-matn'
                  : 'border-chegara-quyuq text-matn-ikki hover:border-chegara'
              }`}
            >
              <input
                type="radio"
                name="birlik"
                value={x.kod}
                checked={usul === x.kod}
                onChange={() => {
                  usulniOzgartir(x.kod);
                }}
                className="sr-only"
              />
              <span className="font-medium">{x.nom}</span>
              <span className="mt-0.5 block text-xs text-matn-kuchsiz">{x.izoh}</span>
            </label>
          ))}
        </div>

        <p className="rounded-maydon bg-fon px-3 py-2 text-xs text-matn-kuchsiz">
          Masalan: {tanlangan.misol}
        </p>
      </fieldset>

      {usul === 'BOSQICH' ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-matn-ikki">O&apos;lcham jadvali</span>

          {holat.maydonlar.bosqichlar !== undefined && (
            <p className="text-xs text-belgi-qizil">{holat.maydonlar.bosqichlar}</p>
          )}

          <div className="overflow-x-auto rounded-karta border border-chegara">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-3 py-2 font-medium">Nechi kv.m gacha</th>
                  <th className="px-3 py-2 font-medium">Haq (so&apos;m)</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara">
                {bosqichlar.map((q, i) => (
                  <tr key={q.belgi}>
                    <td className="px-3 py-2">
                      <input
                        inputMode="decimal"
                        value={q.chegaraKvM}
                        onChange={(e) => {
                          qatorniOzgartir(i, 'chegaraKvM', e.target.value);
                        }}
                        placeholder={
                          i === bosqichlar.length - 1 ? 'bo‘sh — undan kattasi' : '1.5'
                        }
                        className={kirishUslubi(false)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        inputMode="decimal"
                        value={q.qiymat}
                        onChange={(e) => {
                          qatorniOzgartir(i, 'qiymat', e.target.value);
                        }}
                        placeholder="20000"
                        className={kirishUslubi(false)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {bosqichlar.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            bosqichlarniOzgartir((eski) =>
                              eski.filter((_, j) => j !== i),
                            );
                          }}
                          className="fokus rounded-[6px] px-2 py-1 text-xs text-belgi-qizil hover:bg-belgi-qizil-fon"
                        >
                          o&apos;chir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                /*
                 * ⚠️ Yangi qator OXIRIDAN OLDIN qo'shiladi: oxirgi
                 *    qator — «bundan kattasining hammasi» va u
                 *    doim eng pastda turishi kerak.
                 */
                bosqichlarniOzgartir((eski) => [
                  ...eski.slice(0, -1),
                  {
                    belgi: Math.max(...eski.map((q) => q.belgi)) + 1,
                    chegaraKvM: '',
                    qiymat: '',
                  },
                  ...eski.slice(-1),
                ]);
              }}
              className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-xs font-medium text-matn-ikki hover:border-chegara"
            >
              + Bosqich qo&apos;shish
            </button>
          </div>

          <p className="text-xs text-matn-kuchsiz">
            Oxirgi qatorning chegarasi bo&apos;sh qoladi — undan katta
            o&apos;lchamlarning hammasi shunga tushadi. Chegaraga aynan teng
            o&apos;lcham quyi bosqichda hisoblanadi.
          </p>

          <input type="hidden" name="bosqichlar" value={bosqichJson} />
          <input type="hidden" name="qiymat" value="" />
        </div>
      ) : (
        <div className="max-w-xs">
          <Maydon
            nom="qiymat"
            yorliq={usul === 'KV_M' ? "Haq (so'm / kv.m)" : "Haq (so'm)"}
            xato={holat.maydonlar.qiymat}
          >
            <input
              key={`qiymat-${String(u)}`}
              id="qiymat"
              name="qiymat"
              inputMode="decimal"
              defaultValue={k.qiymat ?? ''}
              placeholder={usul === 'KV_M' ? '18000' : '15000'}
              className={kirishUslubi(holat.maydonlar.qiymat !== undefined)}
            />
          </Maydon>
          <input type="hidden" name="bosqichlar" value="" />
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Stavkani belgilash'}
        </button>
      </div>
    </form>
  );
}
