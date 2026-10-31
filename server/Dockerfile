FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY server/ ./server/
RUN npm --workspace=server run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --omit=dev

COPY --from=builder /app/server/dist ./server/dist
COPY server/.env.example ./server/.env

WORKDIR /app/server
EXPOSE 5000

CMD ["node", "dist/index.js"]

