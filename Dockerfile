# ==========================
# Stage 1 - Build
# ==========================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ==========================
# Stage 2 - Runtime
# ==========================
FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

COPY docker-entrypoint.sh /docker-entrypoint.d/99-env.sh

RUN chmod +x /docker-entrypoint.d/99-env.sh

EXPOSE 5173
