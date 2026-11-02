FROM node:18.20.8-alpine3.20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18.20.8-alpine3.20 AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY openapi.yaml ./openapi.yaml
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]