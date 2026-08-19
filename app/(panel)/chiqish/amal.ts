'use server';

import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { chiq } from '@/lib/amal/kirish';
import { sessiyaCookieOchir, sessiyaCookieOl } from '@/lib/kirish/cookie';

/** §8 — chiqishda sessiya bazada DARHOL bekor qilinadi, cookie o'chiriladi. */
export async function chiqishAmali(): Promise<void> {
  const token = await sessiyaCookieOl();
  if (token !== null && token !== '') {
    await chiq(ulanishOl(), token);
  }
  await sessiyaCookieOchir();
  redirect('/kirish');
}
