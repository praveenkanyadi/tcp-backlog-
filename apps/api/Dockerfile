FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/index.js"]
