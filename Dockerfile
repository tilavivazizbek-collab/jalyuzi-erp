# QISM 1 §2.3 — oddiy Node konteyneri. Platforma SDK si yo'q, shuning uchun
# bu tasvir istalgan serverda ham, loqal kompyuterda ham bir xil ishlaydi.
# Node versiyasi §1 stekiga mos: 22 LTS.

FROM node:22-alpine AS bogliqliklar
WORKDIR /dastur
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS quruvchi
WORKDIR /dastur
COPY --from=bogliqliklar /dastur/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS ishga
WORKDIR /dastur
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Tashkent

RUN addgroup -g 1001 -S erp && adduser -u 1001 -S erp -G erp

# ⚠️ `public/` bo'sh bo'lsa ham MAVJUD bo'lishi shart: Docker
#    yo'q papkani ko'chira olmaydi va qurish yiqiladi. Shuning
#    uchun omborda `public/.gitkeep` turadi.
COPY --from=quruvchi /dastur/public ./public
COPY --from=quruvchi --chown=erp:erp /dastur/.next/standalone ./
COPY --from=quruvchi --chown=erp:erp /dastur/.next/static ./.next/static

USER erp
EXPOSE 3000
CMD ["node", "server.js"]
