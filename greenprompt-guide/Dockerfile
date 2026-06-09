FROM node:22-alpine

RUN apk add --no-cache build-base cairo-dev g++ giflib-dev jpeg-dev librsvg-dev pango-dev \
    && addgroup -S nonroot \
    && adduser -S nonroot -G nonroot

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts \
    && npm rebuild canvas

COPY app ./app
COPY public ./public
COPY prisma ./prisma
COPY domain ./domain
COPY lib ./lib

COPY next.config.ts ./
COPY next-env.d.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY prisma.config.ts ./

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/sample_database?schema=public
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run prisma:generate && npm run build \
    && mkdir -p /data/uploads/collaboration-requests \
    && mkdir -p /app/.next/cache/images \
    && chown -R nonroot:nonroot /app /data \
    && chmod -R 775 /app/.next

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV COLLABORATION_PDF_STORAGE_DIR=/data/uploads/collaboration-requests

USER nonroot

EXPOSE 3000
EXPOSE 5555
