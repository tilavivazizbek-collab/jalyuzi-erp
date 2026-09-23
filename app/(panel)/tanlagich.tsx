'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * TANLAGICH — qidiruvli dropdown (2026-09-23).
 *
 * ⚠️ NEGA BROWSER `<select>` YETMADI
 *
 *    Tizimda 79 ta dropdown bor va ularning ko'pi UZUN ro'yxat:
 *    materiallar, mahsulot turlari, mijozlar, xodimlar. Brauzerning
 *    o'z ro'yxatida QIDIRUV yo'q — sotuvchi yuzta matoning ichidan
 *    sichqoncha bilan aylanib izlardi. Ustiga, `<select>` ning
 *    ko'rinishini Windows ham, Android ham o'zicha chizadi: bitta
 *    ekranda uch xil uslub turardi.
 *
 * ⚠️ PANEL `document.body` GA CHIQARILADI (portal).
 *
 *    Dropdownlarning yarmi jadval ichida, jadvallar esa
 *    `overflow-x-auto` va `overflow-hidden` konteynerlarda turadi.
 *    Oddiy `absolute` panel o'sha konteynerda QIRQILIB qolardi —
 *    ro'yxatning pastki yarmi ko'rinmasdi. Portal bu muammoni
 *    butunlay yo'q qiladi.
 *
 * ⚠️ FORMA BUZILMAYDI: yashirin `<input name=...>` qoladi, ya'ni
 *    server amallari `FormData` dan avvalgidek o'qiydi. Boshqarilgan
 *    (`qiymat` + `ozgartir`) va boshqarilmagan (`boshQiymat`) —
 *    ikkala usul ham ishlaydi.
 *
 * ⚠️ QIDIRUV KATAGI QISQA RO'YXATDA CHIQMAYDI. «SOM / USD» ustida
 *    qidiruv katagi — foydasiz shovqin. Chegara `qidiruvChegarasi`
 *    bilan o'zgartiriladi (standart 7 ta).
 */

export interface TanlagichYozuvi {
  /** `<option value>` bilan bir xil — doim MATN */
  readonly qiymat: string;
  readonly matn: string;
  /** Ikkinchi qator: «0.40 m enli · qoldiq 12.5 m» */
  readonly izoh?: string;
  /** `<optgroup label>` o'rnida */
  readonly guruh?: string;
  readonly ochirilgan?: boolean;
}

interface Xossalar {
  /** `FormData` kaliti. Berilmasa yashirin input yozilmaydi */
  readonly nom?: string;
  readonly yozuvlar: readonly TanlagichYozuvi[];
  /** Boshqarilgan holat */
  readonly qiymat?: string;
  readonly ozgartir?: (q: string) => void;
  /** Boshqarilmagan holat — forma o'zi yuboradi */
  readonly boshQiymat?: string;
  /** Hech narsa tanlanmaganda ko'rinadigan matn */
  readonly joyBelgisi?: string;
  /**
   * BO'SH TANLOV. Berilsa ro'yxat tepasida shu matnli qator turadi
   * va uning qiymati `''` bo'ladi.
   */
  readonly boshQator?: string;
  readonly xatoBormi?: boolean;
  readonly ochirilgan?: boolean;
  readonly id?: string;
  readonly ariaYorliq?: string;
  /** Jadval ichidagi ixcham ko'rinish */
  readonly kichik?: boolean;
  readonly qidiruvChegarasi?: number;
  readonly sinf?: string;
}

const PANEL_BALANDLIGI = 320;

export function Tanlagich({
  nom,
  yozuvlar,
  qiymat,
  ozgartir,
  boshQiymat,
  joyBelgisi = 'Tanlang',
  boshQator,
  xatoBormi = false,
  ochirilgan = false,
  id,
  ariaYorliq,
  kichik = false,
  qidiruvChegarasi = 7,
  sinf = '',
}: Xossalar) {
  const avtoId = useId();
  const tugmaId = id ?? nom ?? avtoId;
  const royxatId = `${avtoId}-royxat`;

  /**
   * ⚠️ BOSHQARILMAGAN HOLAT ICHKARIDA SAQLANADI. `<select>` da buni
   *    brauzer qilardi; bu yerda o'zimiz qilamiz, aks holda
   *    `boshQiymat` bilan ishlatilgan joylarda tanlov ko'rinmasdi.
   */
  const boshqariladimi = qiymat !== undefined;
  const [ichkiQiymat, ichkiQiymatniOzgartir] = useState(boshQiymat ?? '');
  const joriy = boshqariladimi ? qiymat : ichkiQiymat;

  const [ochiq, ochiqniOzgartir] = useState(false);
  const [qidiruv, qidiruvniOzgartir] = useState('');
  const [faol, faolniOzgartir] = useState(0);
  const [joy, joyniOzgartir] = useState<{
    chap: number;
    tepa: number;
    eni: number;
    yuqorigami: boolean;
  } | null>(null);

  const tugmaRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const qidiruvRef = useRef<HTMLInputElement | null>(null);
  /**
   * ⚠️ Tashqi bosish va aylantirish effekti `ochVaYop` ni REF
   *    orqali chaqiradi: funksiya har chizilishda yangidan
   *    yaratiladi va uni effekt bog'liqligiga qo'yish tinglovchini
   *    har safar qayta ulardi.
   */
  const ochVaYopRef = useRef<(h: boolean) => void>(() => undefined);

  /** Bo'sh qator ham oddiy yozuv — qolgan mantiq uni ajratmaydi */
  const hammaYozuv = useMemo<readonly TanlagichYozuvi[]>(
    () =>
      boshQator === undefined
        ? yozuvlar
        : [{ qiymat: '', matn: boshQator }, ...yozuvlar],
    [yozuvlar, boshQator],
  );

  const qidiruvBormi = hammaYozuv.length >= qidiruvChegarasi;

  const koringan = useMemo(() => {
    const s = qidiruv.trim().toLowerCase();
    if (s === '') return hammaYozuv;
    return hammaYozuv.filter(
      (y) =>
        y.matn.toLowerCase().includes(s) ||
        (y.izoh ?? '').toLowerCase().includes(s) ||
        (y.guruh ?? '').toLowerCase().includes(s),
    );
  }, [hammaYozuv, qidiruv]);

  const tanlangan = hammaYozuv.find((y) => y.qiymat === joriy);

  // ─── Joylashuv ──────────────────────────────────────────────────────────

  /**
   * ⚠️ `fixed` + `getBoundingClientRect`. Panel `body` da turgani
   *    uchun sahifa aylantirilsa u JOYIDA QOLIB KETARDI — shuning
   *    uchun aylantirishda dropdown YOPILADI (pastdagi effekt).
   */
  const joyniHisobla = useCallback(() => {
    const t = tugmaRef.current;
    if (t === null) return;
    const r = t.getBoundingClientRect();
    const pastdaJoy = window.innerHeight - r.bottom;
    const yuqorigami = pastdaJoy < PANEL_BALANDLIGI && r.top > pastdaJoy;
    joyniOzgartir({
      chap: r.left,
      tepa: yuqorigami ? r.top : r.bottom,
      eni: r.width,
      yuqorigami,
    });
  }, []);

  useLayoutEffect(() => {
    if (ochiq) joyniHisobla();
  }, [ochiq, joyniHisobla]);

  useEffect(() => {
    if (!ochiq) return;

    const tashqariBosildi = (e: PointerEvent): void => {
      const n = e.target as Node;
      if (tugmaRef.current?.contains(n) === true) return;
      if (panelRef.current?.contains(n) === true) return;
      ochVaYopRef.current(false);
    };

    /*
     * ── AYLANTIRISHDA YOPMAYMIZ, JOYINI QAYTA HISOBLAYMIZ ──────
     *
     * ⚠️ BU YERDA XATO BOR EDI (egasi 2026-09-24): «dropdown
     *    sichqoncha bosmasdan yopilib ketayapti».
     *
     *    Panel ochilganda faol qatorga `scrollIntoView` qilinadi va
     *    u panelning O'Z ichida `scroll` hodisasini chiqaradi.
     *    Tinglovchi `capture: true` bilan o'rnatilgani uchun o'sha
     *    ichki siljishni ham ushlab, panelni DARHOL yopardi —
     *    ya'ni ro'yxat ochilishi bilan yopilardi.
     *
     * ⚠️ PANEL ICHIDAGI siljish butunlay E'TIBORSIZ qoldiriladi:
     *    uzun ro'yxatni aylantirish ham hodisa chiqaradi va u ham
     *    panelni yopib qo'yardi.
     *
     * ⚠️ Tashqi siljishda panel YOPILMAYDI, balki tugma bilan
     *    birga SURILADI. Yopish ilgari «osongina to'g'ri» yechim
     *    edi, lekin foydalanuvchi uchun u buzilgandek tuyuladi.
     */
    const siljidi = (e: Event): void => {
      const n = e.target as Node | null;
      if (n !== null && panelRef.current?.contains(n) === true) return;
      joyniHisobla();
    };
    const olchamOzgardi = (): void => {
      joyniHisobla();
    };

    document.addEventListener('pointerdown', tashqariBosildi);
    window.addEventListener('scroll', siljidi, true);
    window.addEventListener('resize', olchamOzgardi);
    return () => {
      document.removeEventListener('pointerdown', tashqariBosildi);
      window.removeEventListener('scroll', siljidi, true);
      window.removeEventListener('resize', olchamOzgardi);
    };
  }, [ochiq, joyniHisobla]);

  /**
   * OCHISH — EFFEKT EMAS, oddiy funksiya.
   *
   * ⚠️ `useEffect(..., [ochiq, koringan])` qilingan edi va u
   *    HAR HARF yozilganda qayta ishlab, faol qatorni tanlangan
   *    qatorga qaytarib tashlardi: foydalanuvchi qidirib, pastga
   *    tushib, Enter bosganda BOSHQA yozuv tanlanardi.
   *
   *    `koringan` ni ro'yxatdan olib tashlash esa yolg'on
   *    bog'liqlik bo'lardi. To'g'ri yechim — buni umuman effekt
   *    qilmaslik: ochish AMAL, holat kuzatuvi emas.
   */
  const ochVaYop = (yangiHolat: boolean): void => {
    ochiqniOzgartir(yangiHolat);
    if (!yangiHolat) {
      qidiruvniOzgartir('');
      return;
    }
    qidiruvniOzgartir('');
    const i = hammaYozuv.findIndex((y) => y.qiymat === joriy);
    faolniOzgartir(i < 0 ? 0 : i);
  };

  /**
   * ⚠️ REF EFFEKTDA yangilanadi, chizilish paytida EMAS:
   *    `reactStrictMode` ostida komponent ikki marta chiziladi va
   *    chizilish paytidagi yon ta'sir chalkashlik manbai.
   *    Effektlar har qanday foydalanuvchi amalidan OLDIN yuradi,
   *    ya'ni tinglovchi doim yangi funksiyani chaqiradi.
   */
  useEffect(() => {
    ochVaYopRef.current = ochVaYop;
  });

  /** Qidiruv katagiga fokus — panel chizilgandan KEYIN */
  useEffect(() => {
    if (ochiq && qidiruvBormi) qidiruvRef.current?.focus();
  }, [ochiq, qidiruvBormi]);

  // ─── Tanlash ────────────────────────────────────────────────────────────

  const tanla = (y: TanlagichYozuvi): void => {
    if (y.ochirilgan === true) return;
    if (!boshqariladimi) ichkiQiymatniOzgartir(y.qiymat);
    ozgartir?.(y.qiymat);
    ochVaYop(false);
    tugmaRef.current?.focus();
  };

  const keyingiFaol = (yonalish: 1 | -1): void => {
    faolniOzgartir((eski) => {
      if (koringan.length === 0) return 0;
      let i = eski;
      for (let n = 0; n < koringan.length; n += 1) {
        i = (i + yonalish + koringan.length) % koringan.length;
        if (koringan[i]?.ochirilgan !== true) return i;
      }
      return eski;
    });
  };

  const klavish = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      ochVaYop(false);
      tugmaRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!ochiq) {
        ochVaYop(true);
        return;
      }
      keyingiFaol(1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!ochiq) {
        ochVaYop(true);
        return;
      }
      keyingiFaol(-1);
      return;
    }
    if (e.key === 'Enter') {
      /**
       * ⚠️ FORMA YUBORILIB KETMASIN. Ro'yxat ochiq bo'lsa Enter —
       *    «shuni tanla» degani, «buyurtmani saqla» emas.
       */
      if (ochiq) {
        e.preventDefault();
        const y = koringan[faol];
        if (y !== undefined) tanla(y);
      }
      return;
    }
    if (e.key === ' ' && !ochiq) {
      e.preventDefault();
      ochVaYop(true);
    }
  };

  /**
   * Faol qator ko'rinib tursin.
   *
   * ⚠️ `scrollIntoView` PANELNING O'Z ichida siljish hodisasini
   *    chiqaradi. Yuqoridagi tinglovchi uni e'tiborsiz qoldiradi —
   *    aks holda ro'yxat ochilishi bilan yopilardi.
   */
  useEffect(() => {
    if (!ochiq) return;
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-i="${String(faol)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [faol, ochiq]);

  // ─── Ko'rinish ──────────────────────────────────────────────────────────

  const tugmaUslubi = [
    'flex w-full items-center justify-between gap-2 rounded-maydon border bg-sirt text-left outline-none transition-colors',
    kichik ? 'px-2.5 py-1.5 text-[13px]' : 'px-3 py-2 text-sm',
    xatoBormi ? 'border-belgi-qizil' : 'border-chegara-quyuq',
    ochirilgan
      ? 'cursor-not-allowed opacity-50'
      : 'hover:border-chegara-quyuq focus:ring-2 focus:ring-brend/25',
    ochiq ? 'ring-2 ring-brend/25' : '',
    sinf,
  ].join(' ');

  return (
    <>
      {nom !== undefined && <input type="hidden" name={nom} value={joriy} />}

      <button
        type="button"
        id={tugmaId}
        ref={tugmaRef}
        disabled={ochirilgan}
        onClick={() => {
          if (!ochirilgan) ochVaYop(!ochiq);
        }}
        onKeyDown={klavish}
        role="combobox"
        aria-expanded={ochiq}
        aria-controls={ochiq ? royxatId : undefined}
        aria-haspopup="listbox"
        aria-label={ariaYorliq}
        className={tugmaUslubi}
      >
        <span className={`truncate ${tanlangan === undefined ? 'text-matn-kuchsiz' : 'text-matn'}`}>
          {tanlangan?.matn ?? (joriy === '' ? joyBelgisi : joriy)}
        </span>
        {/* Uchburchak — ro'yxat ochilishini bildiradi */}
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`size-3 shrink-0 text-matn-kuchsiz transition-transform ${ochiq ? 'rotate-180' : ''}`}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {ochiq &&
        joy !== null &&
        createPortal(
          <div
            ref={panelRef}
            id={royxatId}
            role="listbox"
            aria-label={ariaYorliq}
            style={{
              position: 'fixed',
              left: joy.chap,
              top: joy.yuqorigami ? undefined : joy.tepa + 4,
              bottom: joy.yuqorigami ? window.innerHeight - joy.tepa + 4 : undefined,
              width: Math.max(joy.eni, 220),
              maxHeight: PANEL_BALANDLIGI,
              zIndex: 90,
            }}
            className="flex flex-col overflow-hidden rounded-karta border border-chegara bg-sirt shadow-suzuvchi"
          >
            {qidiruvBormi && (
              /*
                QIDIRUV KATAGI — egasining so'rovi 2026-09-23.

                ⚠️ Uzun ro'yxatda sichqoncha bilan aylanib izlash
                   sotuvchining vaqtini yeydi. Nom ham, izoh ham
                   (masalan material kodi yoki qoldiq) qidiriladi.
              */
              <div className="border-b border-chegara p-2">
                <input
                  ref={qidiruvRef}
                  value={qidiruv}
                  onChange={(e) => {
                    qidiruvniOzgartir(e.target.value);
                    /** Yangi qidiruvda faol qator birinchisiga qaytadi */
                    faolniOzgartir(0);
                  }}
                  onKeyDown={klavish}
                  placeholder="Qidirish…"
                  aria-label="Ro'yxatdan qidirish"
                  className="w-full rounded-maydon border border-chegara-quyuq px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brend/25"
                />
              </div>
            )}

            <div className="overflow-y-auto overscroll-contain py-1">
              {koringan.length === 0 ? (
                <p className="px-3 py-4 text-center text-[13px] text-matn-kuchsiz">
                  Topilmadi
                </p>
              ) : (
                koringan.map((y, i) => {
                  const oldingi = i === 0 ? undefined : koringan[i - 1];
                  const guruhBoshimi =
                    y.guruh !== undefined && y.guruh !== oldingi?.guruh;
                  const tanlandimi = y.qiymat === joriy;

                  return (
                    <div key={`${y.qiymat}-${String(i)}`}>
                      {guruhBoshimi && (
                        <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-matn-kuchsiz">
                          {y.guruh}
                        </p>
                      )}
                      <button
                        type="button"
                        data-i={i}
                        role="option"
                        aria-selected={tanlandimi}
                        disabled={y.ochirilgan}
                        onMouseEnter={() => {
                          faolniOzgartir(i);
                        }}
                        onClick={() => {
                          tanla(y);
                        }}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                          y.ochirilgan === true
                            ? 'cursor-not-allowed text-matn-kuchsiz'
                            : i === faol
                              ? 'bg-brend-fon text-matn'
                              : 'text-matn'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{y.matn}</span>
                          {y.izoh !== undefined && (
                            <span className="block truncate text-[12px] text-matn-kuchsiz">
                              {y.izoh}
                            </span>
                          )}
                        </span>
                        {tanlandimi && (
                          <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3.5 shrink-0 text-brend">
                            <path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
