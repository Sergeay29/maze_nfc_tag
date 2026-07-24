# ─────────────────────────────────────────────────────────────
# Étape 1 : compilation de l'application React avec Vite
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Les variables Vite sont intégrées dans le JavaScript
# au moment du build.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build


# ─────────────────────────────────────────────────────────────
# Étape 2 : serveur web léger pour les fichiers compilés
# ─────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]