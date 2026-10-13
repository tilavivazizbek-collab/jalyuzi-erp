import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { oyBoshi, oyNomi, oyQosh, rejaKaliti, yigindiTekshir } from '@/lib/domain/reja';
import { toshkentKuni } from '@/lib/domain/sana';
import { rejaEkrani, rejaQamrovi } from './malumot';
import { RejaFormasi, type FormaBolimi } from './forma';

export const dynamic = 'force-dynamic';

/**
 * Sozlamalar → Rejalar — TZ 21.3. 2026-10-13.
 * Korxona va filial — tushum + foyda; sotuvchi — faqat tushum (21.2).
 */

const korsat = (s: string | null | undefined): string => (s === null || s === undefined ? '' : pulKorsat(som(s)));

export default async function Rejalar({ searchParams }: { searchParams: Promise<{ oy?: string }> }) {
  const f = await sahifaRuxsati('reja.boshqar');
  const q = rejaQamrovi(f);
  const bugun = toshkentKuni();
  const { oy: xom } = await searchParams;
  const oy = xom !== undefined && /^\d{4}-\d{2}-01$/.test(xom) ? xom : oyBoshi(bugun);
  const e = await rejaEkrani(oy, oyQosh(oy, -1), q);
  const r = (kalit: string) => e.rejalar.get(kalit);

  const bolimlar: FormaBolimi[] = [];
  const korxonaKalit = rejaKaliti('KORXONA', null, null);
  if (q.korxona) {
    bolimlar.push({
      nom: 'Korxona',
      qatorlar: [
        {
          kalit: korxonaKalit,
          nom: 'Butun korxona',
          tushum: korsat(r(korxonaKalit)?.tushum),
          foyda: korsat(r(korxonaKalit)?.foyda),
          ozgargan: r(korxonaKalit)?.oyIchidaOzgardi ?? false,
        },
      ],
    });
  }

  const filialQatorlari = e.filiallar.map((fl) => {
    const kalit = rejaKaliti('FILIAL', fl.id, null);
    return { id: fl.id, kalit, nom: fl.nom, saqlangan: r(kalit) };
  });
  // 21.3.1 — tekshiruv, majburiyat emas; faqat korxona ko'rinsa (bosh admin)
  const filialTekshiruv = q.korxona
    ? yigindiTekshir(r(korxonaKalit)?.tushum ?? null, filialQatorlari.map((x) => x.saqlangan?.tushum ?? null))
    : null;
  bolimlar.push({
    nom: 'Filiallar',
    qatorlar: filialQatorlari.map((x) => ({
      kalit: x.kalit,
      nom: x.nom,
      tushum: korsat(x.saqlangan?.tushum),
      foyda: korsat(x.saqlangan?.foyda),
      ozgargan: x.saqlangan?.oyIchidaOzgardi ?? false,
    })),
    tekshiruv:
      filialTekshiruv === null || filialTekshiruv.teng === null
        ? null
        : {
            teng: filialTekshiruv.teng,
            matn: `Filiallar tushumi yig'indisi ${korsat(filialTekshiruv.yigindi)} · korxona rejasi ${korsat(r(korxonaKalit)?.tushum)}`,
          },
  });

  const sotuvchiQatorlari = e.sotuvchilar.map((s) => {
    const kalit = rejaKaliti('SOTUVCHI', s.filialId, s.id);
    return { ...s, kalit, saqlangan: r(kalit) };
  });
  const filialYigindisi = yigindiTekshir(null, filialQatorlari.map((x) => x.saqlangan?.tushum ?? null)).yigindi;
  const sotuvchiTekshiruv = yigindiTekshir(filialYigindisi, sotuvchiQatorlari.map((x) => x.saqlangan?.tushum ?? null));
  if (sotuvchiQatorlari.length > 0) {
    bolimlar.push({
      nom: 'Sotuvchilar (faqat tushum)',
      qatorlar: sotuvchiQatorlari.map((s) => ({
        kalit: s.kalit,
        nom: s.ism,
        izoh: e.filiallar.length > 1 ? e.filiallar.find((fl) => fl.id === s.filialId)?.nom : undefined,
        tushum: korsat(s.saqlangan?.tushum),
        foyda: null,
        ozgargan: s.saqlangan?.oyIchidaOzgardi ?? false,
      })),
      tekshiruv: {
        teng: sotuvchiTekshiruv.teng === true,
        matn: `Sotuvchilar yig'indisi ${korsat(sotuvchiTekshiruv.yigindi)} · filiallar yig'indisi ${korsat(filialYigindisi)}`,
      },
    });
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/sozlama" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Sozlamalar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Reja · {oyNomi(oy)}</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Bo&apos;sh qoldirilsa — reja yo&apos;q, bajarilish hisoblanmaydi. Yig&apos;indilar teng bo&apos;lishi shart
          emas, faqat ko&apos;rsatiladi.
        </p>
      </div>

      <nav className="flex gap-2 text-[13px]">
        <Link href={`/sozlama/reja?oy=${oyQosh(oy, -1)}`} className="rounded-maydon border border-chegara bg-sirt px-3 py-1.5 text-matn-ikki hover:text-matn">
          ← {oyNomi(oyQosh(oy, -1))}
        </Link>
        <Link href={`/sozlama/reja?oy=${oyQosh(oy, 1)}`} className="rounded-maydon border border-chegara bg-sirt px-3 py-1.5 text-matn-ikki hover:text-matn">
          {oyNomi(oyQosh(oy, 1))} →
        </Link>
      </nav>

      <RejaFormasi
        oy={oy}
        bolimlar={bolimlar}
        sababKerak={bugun >= oy}
        nusxa={q.korxona && e.otganOydaBor}
      />
    </div>
  );
}
