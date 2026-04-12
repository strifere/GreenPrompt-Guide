FROM node:22-alpine

RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/sample_database?schema=public
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run prisma:generate && npm run build \
    && chown -R nonroot:nonroot /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER nonroot

EXPOSE 3000
EXPOSE 5555

CMD ["npm", "run", "start"]
