FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Copie séparée des manifestes pour profiter du cache Docker.
COPY package.json package-lock.json ./

# Installation déterministe des dépendances de production uniquement.
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copie du code backend.
COPY . .

# Création du dossier persistant des fichiers téléversés.
RUN mkdir -p /app/uploads \
    && chown -R node:node /app

# Le processus Node ne s'exécute pas avec root.
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["npm", "start"]

