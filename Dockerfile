FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

RUN mkdir -p /data && chown node:node /data

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/package.json ./

USER node

ENV DB_PATH=/data/dcc.db
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "build"]
