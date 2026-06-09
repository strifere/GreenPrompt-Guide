FROM node:22-alpine

RUN apk add --no-cache build-base cairo-dev g++ giflib-dev jpeg-dev librsvg-dev pango-dev \
    && addgroup -g 1001 nonroot \
    && adduser -u 1001 -G nonroot -D nonroot

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
COPY instrumentation.ts ./

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/sample_database?schema=public
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_CACHE_DIR=/tmp/next-cache

RUN npm run prisma:generate && npm run build \
    && mkdir -p /data/uploads/collaboration-requests \
    && chown -R nonroot:nonroot /app /data \
    && mkdir -p /tmp/next-cache \
    && chown -R nonroot:nonroot /tmp/next-cache

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV COLLABORATION_PDF_STORAGE_DIR=/data/uploads/collaboration-requests

USER nonroot

EXPOSE 3000
EXPOSE 5555
