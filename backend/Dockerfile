# --- Base build stage ---
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
ENV NODE_ENV=production
RUN npm run build

# --- Development stage ---
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm","run","dev"]

# --- Production stage ---
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=base /app/dist ./dist
COPY prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","dist/index.js"]
