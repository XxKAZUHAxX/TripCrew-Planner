FROM node:20-alpine AS builder
WORKDIR /app

# Copy the shared package first (server depends on file:../shared)
COPY shared/ ./shared/
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
RUN cd server && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/server.js"]