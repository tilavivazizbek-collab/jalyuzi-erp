import { redirect } from 'next/navigation';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';

export const dynamic = 'force-dynamic';

export default async function Sahifa() {
  const f = await joriyFoydalanuvchi();
  redirect(f === null ? '/kirish' : '/boshqaruv');
}
