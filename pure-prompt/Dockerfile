FROM node:20-alpine

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/sample_database?schema=public
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:push && npm run start"]
