/**
 * lib/amal/telegram-yubor.ts — sayt jarayonidan Telegramga TO'G'RIDAN-TO'G'RI.
 * 2026-10-13
 *
 * ⚠️ Odatdagi xabarlar navbat orqali ketadi (`bot_xabar` → `bot/yuboruvchi`,
 *    2.1-invariant). Bu yerdagisi — faqat ZAXIRA uchun: fayl katta, u bazaga
 *    yozilmaydi; xato xabari esa aynan baza ishlamay qolganda ham yetishi kerak.
 * ⚠️ Token hech qachon xato matniga tushmaydi.
 */

const API = 'https://api.telegram.org';

async function tekshir(javob: Response): Promise<void> {
  if (javob.ok) return;
  const matn = await javob.text().catch(() => '');
  throw new Error(`Telegram ${String(javob.status)}: ${matn.slice(0, 300)}`);
}

export async function telegramgaFayl(
  token: string,
  chatId: string,
  fayl: Buffer,
  nom: string,
  izoh: string,
): Promise<void> {
  const forma = new FormData();
  forma.set('chat_id', chatId);
  forma.set('caption', izoh);
  forma.set('document', new Blob([new Uint8Array(fayl)], { type: 'application/gzip' }), nom);
  await tekshir(await fetch(`${API}/bot${token}/sendDocument`, { method: 'POST', body: forma }));
}

export async function telegramgaMatn(token: string, chatId: string, matn: string): Promise<void> {
  await tekshir(
    await fetch(`${API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: matn }),
    }),
  );
}
