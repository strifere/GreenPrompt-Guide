FROM node:22-alpine

RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

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
    && chown -R nonroot:nonroot /app /data

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV COLLABORATION_PDF_STORAGE_DIR=/data/uploads/collaboration-requests

USER nonroot

EXPOSE 3000
EXPOSE 5555
