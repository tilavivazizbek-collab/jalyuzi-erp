/**
 * app/(panel)/modal-holat.ts — modalda yaratilgan yozuv.
 *
 * ⚠️ Har forma ikki joyda ishlaydi: o'z sahifasida va modal
 *    oynada. Sahifada saqlangach ro'yxatga YO'NALTIRILADI, modalda
 *    esa yo'naltirish yo'q — oyna yopilib, yangi yozuv darhol
 *    tanlanishi kerak. Shuning uchun uning raqami qaytariladi.
 *
 * ⚠️ Maydon IXTIYORIY: yo'qligi «yaratilmadi» degani. Shu sababli
 *    mavjud holat qurilgan o'nlab joyni o'zgartirish shart emas.
 */
export interface YaratilganYozuv {
  readonly id: number;
  readonly nom: string;
}
