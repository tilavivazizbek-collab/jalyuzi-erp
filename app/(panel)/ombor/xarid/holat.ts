import type { XaridHolati } from '@/lib/domain/xarid';

/** Holat belgisi ranglari — ro'yxat va kartochkada bir xil */
export const HOLAT_RANGI: Readonly<Record<XaridHolati, string>> = {
  KUTILMOQDA: 'bg-belgi-kok-fon text-belgi-kok',
  QISMAN: 'bg-belgi-sariq-fon text-belgi-sariq',
  TOLIQ: 'bg-belgi-yashil-fon text-belgi-yashil',
  YOPILDI: 'bg-fon text-matn-ikki',
  BEKOR: 'bg-fon text-matn-kuchsiz line-through',
};
