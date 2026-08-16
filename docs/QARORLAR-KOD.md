# QARORLAR — KOD

Kod yozilayotganda `docs/LOYIHA.md` dan chetga chiqilgan yoki hujjatda
aniqlanmagan joy uchun qabul qilingan texnik qarorlar.

QISM 1 §2.4: «Kod TZ dan chetga chiqsa — TZ yangilanadi, kod emas.»
Shu sabab bu yerdagi har qaror **egasi tasdig'idan keyin** `LOYIHA.md` ga
ko'chiriladi. Tasdiqlanmagani `⏳` bilan belgilanadi.

| # | Nima | Holat |
|---|---|---|
| P-01 | `Som` / `Dollar` yopiq tur qilindi | ⏳ tasdiq kutilmoqda |
| P-02 | `filial_id` boshidanoq qo'yiladi | ⏳ tasdiq kutilmoqda |
| P-03 | Kanonik testlar bosqichma-bosqich yoziladi | ⏳ tasdiq kutilmoqda |
| P-04 | Node 22 majburiy emas, tavsiya | ⏳ tasdiq kutilmoqda |
| P-05 | `xodim_rol` jadvali — xodimda bir nechta rol | ⏳ tasdiq kutilmoqda |
| P-06 | Audit jurnali baza darajasida o'zgarmas | ⏳ tasdiq kutilmoqda |
| P-07 | `yaratdi_id` tashqi kalitlari `DEFERRABLE` | ⏳ tasdiq kutilmoqda |
| P-08 | `rol.kod` — tizimli rollarning barqaror belgisi | ⏳ tasdiq kutilmoqda |

---

## P-01 · `Som` va `Dollar` yopiq tur

**Bosqich:** 0 · **Tegadi:** QISM 1 §3.1 · 1.3-invariant

### Hujjatda nima yozilgan

```ts
export type Som    = Decimal & { readonly [brand]: 'SOM' };
export type Dollar = Decimal & { readonly [brand]: 'USD' };

a.plus(b);   // ❌ TypeScript xato beradi — 1.3-invariant kafolatlandi
```

### Muammo

Bu namuna **xato bermaydi**. Sabab:

- `plus()` ning imzosi — `plus(n: Decimal.Value): Decimal`
- `Decimal.Value = string | number | Decimal`
- `Dollar` — bu `Decimal` **va** brend. Ya'ni u `Decimal` ham hisoblanadi

Demak `Dollar` ni `plus()` ga berish mumkin va kompilyator jim qoladi.
Brend faqat funksiya parametrlarida ushlaydi, `Decimal` dan meros olgan
metodlarda emas.

Bu §1.1 ning butun asosini yo'qqa chiqaradi: «1.3-invariant TypeScript da
kompilyator darajasida ushlanadi» degan jumla amalda bajarilmagan bo'lardi.

### Qaror

`Som` va `Dollar` — **yopiq turlar**. Ular `Decimal` dan meros olmaydi,
ichki qiymat eksport qilinmagan simvol ostida turadi:

```ts
const QIYMAT: unique symbol = Symbol('pul.qiymat');
export interface Som { readonly [BREND]: 'SOM'; readonly [QIYMAT]: Decimal }
```

Har amal — `lib/domain/pul.ts` dagi funksiya orqali:

```ts
qosh(a, som(30_000))     // ✅
qosh(a, dollar(50))      // ❌ kompilyatsiya xatosi
a.plus(b)                // ❌ bunday metod umuman yo'q
```

`NoInfer<P>` ikkinchi argumentdan tur chiqarishni to'xtatadi — shusiz
TypeScript `Som | Dollar` deb umumlashtirib, xatoni o'tkazib yuborardi.

### Narxi

Kod biroz uzunroq: `a.plus(b)` o'rniga `qosh(a, b)`. Buning evaziga
valyuta aralashishi **umuman mumkin emas** bo'lib qoladi.

### Isboti

`test/turlar.tur-test.ts` — har qatorda `@ts-expect-error`. Agar himoya
bir kun buzilsa, TypeScript «ishlatilmagan `@ts-expect-error`» deb
`npm run typecheck` ni yiqitadi.

### Hujjatga o'zgartirish

QISM 1 §3.1 dagi namuna kod almashtirilishi kerak.

---

## P-02 · `filial_id` boshidanoq qo'yiladi

**Bosqich:** 0 (1-bosqichga tayyorgarlik) · **Tegadi:** QISM 1 §20 · Q-21 · Q-25

### Ziddiyat

| Qayerda | Nima yozilgan |
|---|---|
| QISM 1 §20 | «Tizim **bitta ombor va bitta filial** uchun quriladi. Jadvallarda `ombor_id` **qo'yilmaydi**» |
| Q-21 | «Filial **aniq ochiladi** — tizim ko'p filial uchun quriladi» |
| Q-25 | «Har filialda **o'z ombori**» |
| QISM 1 §21.2 | «**Filial asosi 1-bosqichda** — undan keyin har jadval `filial_id` bilan tug'iladi» |

QISM 1 §20 — 20-bo'lim (ko'p filial) yozilishidan oldingi qoldiq.

### Qaror

**0-qism ustun** (hujjatning o'z tartibi bo'yicha). Q-21 va Q-25 amal qiladi:
har jadval `filial_id` bilan yaratiladi, keyin migratsiya bilan qo'shilmaydi.

Sabab: §21.1 ning o'zi buni tushuntiradi — ko'p filial 24 bandga tegadi,
keyinroq qo'shish har modulni qayta ochishni talab qiladi.

### Hujjatga o'zgartirish

QISM 1 §20 dagi «Bitta ombor» qatori olib tashlanishi kerak.

---

## P-03 · Kanonik testlar bosqichma-bosqich yoziladi

**Bosqich:** 0 · **Tegadi:** QISM 1 §14.1 · CLAUDE.md §6

### Muammo

«Kanonik raqamlar — **birinchi haftada**» (CLAUDE.md §6). Lekin 11 raqamdan
9 tasi hali qurilmagan modullarga tayanadi:

| Raqam | Kerak bo'lgan modul | Bosqich |
|---|---|---|
| Transport taqsimoti, FIFO | `lib/domain/tannarx.ts` | 3 |
| Kesim uch qatori | `lib/domain/kesish.ts` | 3 |
| Kanonik buyurtma 678 400 | `lib/domain/narx.ts` | 4 |
| Kun yopish | `lib/domain/kassa.ts` | 5 |
| Usta balansi | `lib/domain/stavka.ts` + bot | 7 |
| ... | | |

Ularni hozir yozish faqat bitta yo'l bilan mumkin edi: `skip` qilish.
CLAUDE.md §5 buni **taqiqlaydi**.

### Qaror

- **Barcha 11 raqam hozir muzlatiladi** — `test/kanonik.ts`
- Testi moduli qurilgan bosqichda `test/kanonik.test.ts` ga qo'shiladi
- Hech qaysi test `skip` qilinmaydi — yozilgani o'tadi

Shunda raqamlar «kod chiqmayotgani uchun» sekin siljib ketmaydi:
`kanonik.ts` ni o'zgartirish uchun TZ o'zgarishi kerak.

### Hozirgi holat

| Bosqich | Raqam |
|---|---|
| 0 | K-01, K-02 — ✅ o'tadi |
| 2 | K-07 |
| 3 | K-04, K-05, K-06 |
| 4 | K-03 |
| 5 | K-09 |
| 6 | K-11 |
| 7 | K-10 |
| 8 | K-08 |

---

## P-04 · Node 22 — majburiy emas, tavsiya

**Bosqich:** 0 · **Tegadi:** QISM 1 §1

Stekda «Node.js 22 LTS» yozilgan. Egasining kompyuterida Node 24 turibdi
(u ham LTS). `package.json` da `"node": ">=22"`, `.nvmrc` da `22`,
Dockerfile da `node:22-alpine`.

Ya'ni **ishlab chiqarish 22 da**, loqal ishlab chiqish 24 da ham ishlaydi.
Node 22 ni o'rnatish tavsiya qilinadi, lekin ishni to'xtatmaydi.

---

## P-05 · `xodim_rol` — xodimda bir nechta rol

**Bosqich:** 1 · **Tegadi:** QISM 3 §1.2 · TZ 10.3, 13, 14.6, 14.10, EC-XOD-10

### Ziddiyat

Funksional TZ **besh joyda** ko'p rol deydi:

| Band | Nima yozilgan |
|---|---|
| 10.3 | «Xodimga bir vaqtning o'zida bir nechta rol berilishi mumkin. Ruxsatlar yig'indi» |
| 13 (bot) | «Bir nechta rol bo'lsa — panellar orasida almashish tugmasi chiqadi» |
| 14.6 | «Xodimda bir nechta rol bo'lsa (10.3) — ruxsatlar yig'indi bo'ladi» |
| 14.10 | Qarorlar jadvali: «Bir nechta rol → Ruxsatlar yig'indi» |
| EC-XOD-10 | «Bitta odam admin ham, omborchi ham» — **KELISHILDI** |

Ma'lumotlar modeli (QISM 3 §1.2) esa:

```sql
rol_id  BIGINT NOT NULL REFERENCES rol(id)   -- bitta rol
```

Audit bu ziddiyatni ushlamagan.

### Qaror

Funksional TZ ustun (14.10 buni **qaror** sifatida qayd etgan, EC-XOD-10
kelishilgan). `xodim.rol_id` olib tashlanadi, o'rniga `xodim_rol` bog'lovchi
jadvali:

```sql
xodim_rol (xodim_id, rol_id)  PRIMARY KEY (xodim_id, rol_id)
```

Ruxsat tekshiruvi barcha rollarning ruxsatlari **yig'indisi** bo'yicha ishlaydi.

Jadvallar soni: 44 → **45**.

### Nega bu muhim

10.3 ning o'z izohi: «Kichik korxonada adminning o'zi omborchi ham bo'ladi.
Bitta rol majburlansa, u ikkinchi hisob ochishga majbur bo'ladi va audit
jurnalida ikki xil odam ko'rinadi.» Ya'ni bitta rol modeli audit jurnalini
ishonchsiz qiladi.

### Hujjatga o'zgartirish

QISM 3 §1.2 dan `rol_id` olib tashlanadi, §1.2.1 qo'shiladi. §13 jadvallar
ro'yxati va bosh sahifadagi «44 jadval» raqami yangilanadi.

---

## P-06 · Audit jurnali baza darajasida o'zgarmas

**Bosqich:** 1 · **Tegadi:** QISM 1 §6.5, §10, §16 · TZ 2.4

### Muammo

§16: «Pul amallari — har biri audit jurnalida». Bu kafolat jurnal
o'zgartirilishi mumkin bo'lsa hech narsani anglatmaydi.

Hujjat §6.5 da `UPDATE`/`DELETE` taqiqini beshta harakat jadvaliga qo'ygan,
lekin `audit_jurnal` ro'yxatga kirmagan — u shu beshtasini nazorat qiladigan
jadval bo'lsa ham.

### Qaror

`audit_jurnal` ga `BEFORE UPDATE OR DELETE` trigger qo'yiladi
(`0002_audit_himoya.sql`). Bir xil `faqat_qoshiladi()` funksiyasi keyin
§6.5 dagi beshta jadvalga ham ishlatiladi.

Dastur kodidagi tekshiruv yetarli emas: bazaga to'g'ridan-to'g'ri ulangan
odam uni chetlab o'tadi.

---

## P-07 · `yaratdi_id` tashqi kalitlari `DEFERRABLE`

**Bosqich:** 1 · **Tegadi:** QISM 3 §0.1

### Muammo

§0.1: `yaratdi_id BIGINT NOT NULL REFERENCES xodim(id)` — har jadvalda.
Lekin bu halqa hosil qiladi:

```
filial.yaratdi_id  →  xodim.id
xodim.filial_id    →  filial.id      ← halqa
xodim.yaratdi_id   →  xodim.id       ← o'ziga o'zi
```

Birinchi filial va birinchi xodim bir-birisiz mavjud bo'la olmaydi. Oddiy
tashqi kalit bilan urug' (seed) hech qachon yozilmaydi.

### Qaror

`filial`, `xodim`, `rol`, `xodim_rol` jadvallarining `yaratdi_id` /
`ozgartirdi_id` / `filial_id` kalitlari **`DEFERRABLE INITIALLY DEFERRED`**
(`0001_izlar_fk.sql`). Tekshiruv har qatordan keyin emas, tranzaksiya
oxirida bajariladi.

Urug' birinchi filial va birinchi adminni **bitta tranzaksiyada** yozadi.

Qolgan jadvallarda oddiy tashqi kalit — ularda halqa yo'q.

`ON DELETE CASCADE` hech qayerda yo'q (§6.3).

---

## P-08 · `rol.kod` — tizimli rollarning barqaror belgisi

**Bosqich:** 1 · **Tegadi:** QISM 3 §1.3 · Q-04 · TZ 20.12.1

### Muammo

Q-04 va 20.12.1 to'rtta qattiq qoidani **kodda** talab qiladi:

1. Usta roli saytga kira olmaydi
2. Sotuvchi boshqa sotuvchi kassasini ko'rmaydi
3. Admin `sozlama.ozgartir` ni o'zidan olib qo'ya olmaydi
4. Filial xodimi boshqa filial kassasini ko'rmaydi

Birinchi va to'rtinchi qoida uchun kod «usta» va «admin» rolini **tanishi**
kerak. Modelda (§1.3) esa faqat `nom TEXT UNIQUE` bor.

`nom` ni admin sozlamalardan o'zgartira oladi. «Usta» ni «Tikuvchi» deb
nomlasa — qoida jimgina ishlamay qoladi va usta saytga kira boshlaydi.
Hech kim sezmaydi.

### Qaror

`rol` jadvaliga `kod TEXT UNIQUE` ustuni. Faqat tizimli rollarda to'ladi:

```
ADMIN · SOTUVCHI · OMBORCHI · USTA
```

`CHECK` bilan bog'landi: `tizimli = true` bo'lsa `kod` majburiy,
`tizimli = false` bo'lsa `kod` NULL.

Admin `nom` ni xohlaganicha o'zgartiradi, `kod` esa hech qachon o'zgarmaydi.

### Hujjatga o'zgartirish

QISM 3 §1.3 dagi `rol` jadvaliga `kod` qo'shiladi.
