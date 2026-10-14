/**
 * Umumiy sahifalash tugmalari — «← Oldingi · 2 / 7 · Keyingi →». 2026-10-14
 *
 * ⚠️ Havola sahifaning O'ZI yasaydi (`havola(n)`): har ro'yxatda filtr
 *    parametrlari boshqacha, ular yo'qolmasligi kerak.
 */
import Link from 'next/link';

export function Sahifalar({
  joriy,
  jami,
  havola,
}: {
  joriy: number;
  jami: number;
  havola: (sahifa: number) => string;
}) {
  if (jami <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-3 text-sm" aria-label="Sahifalar">
      {joriy > 1 ? (
        <Link href={havola(joriy - 1)} className="text-brend hover:underline">
          ← Oldingi
        </Link>
      ) : (
        <span className="text-matn-kuchsiz">← Oldingi</span>
      )}
      <span className="text-matn-ikki">
        {joriy} / {jami}
      </span>
      {joriy < jami ? (
        <Link href={havola(joriy + 1)} className="text-brend hover:underline">
          Keyingi →
        </Link>
      ) : (
        <span className="text-matn-kuchsiz">Keyingi →</span>
      )}
    </nav>
  );
}
