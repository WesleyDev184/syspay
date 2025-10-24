FROM node:20.17 as builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . . 

RUN pnpm prisma db push --accept-data-loss

RUN pnpm prisma generate

RUN pnpm run build

RUN pnpm install --frozen-lockfile --prod

FROM node:20.17-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/package.json ./

EXPOSE 5000
CMD ["node", "dist/main.js"]