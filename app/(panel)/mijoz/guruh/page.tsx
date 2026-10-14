import { redirect } from 'next/navigation';

/**
 * `/mijoz/guruh` — 2026-10-14 dan guruhlar BITTA sahifada (`/guruh`,
 * egasi so'ragan, QAMROV «5-qadam»). Eski havola va xatcho'plar
 * buzilmasin — shu yerga yo'naltiriladi, «o'chirilganlar» ham saqlanadi.
 */
export default async function MijozGuruhYonaltirish({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  redirect(sp['ochirilgan'] === '1' ? '/guruh?tur=mijoz&ochirilgan=1' : '/guruh?tur=mijoz');
}
