FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY ../../package.json ../../pnpm-workspace.yaml ./
COPY ../../prisma ./prisma
COPY ./package.json ./
COPY ./ .
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --no-frozen-lockfile
RUN npx prisma generate
RUN cd apps/web && npx prisma generate --schema ../../prisma/schema.prisma
RUN pnpm build

FROM node:20-bookworm-slim AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json ./package.json
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]

