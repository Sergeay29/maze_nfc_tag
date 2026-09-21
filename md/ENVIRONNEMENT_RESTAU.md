# Maze-NFC — environnement de développement

## Stack retenue

- Frontend : React, TypeScript, Vite et Tailwind CSS dans `frontend/` ;
- Backend : Node.js, Express et Sequelize dans `backend/` ;
- Base de données : PostgreSQL 17 ;
- Conteneurisation : Docker Compose ;
- CI : GitHub Actions pour lint, vérification TypeScript, build frontend et contrôle de syntaxe backend.

## Préparation locale

Prérequis : Node.js 22, npm, Docker Desktop et Git.

```powershell
Copy-Item .env.local.example .env.local
docker compose -f compose.dev.yaml --env-file .env.local up -d postgres

Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Set-Location backend
npm ci
npm run db:migrate
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm run dev'

Set-Location ../frontend
npm ci
npm run dev
```

Le frontend est disponible sur `http://localhost:5173` et l'API sur `http://localhost:3000`. Le fichier `backend/.env` reste local et ne doit jamais être commité.

## Variables locales

`.env.local.example` configure uniquement le conteneur PostgreSQL. Les variables applicatives sont documentées dans `backend/.env.example` et `frontend/.env.example`.

Pour le développement hors Docker, `DB_HOST=localhost` et `DB_PORT=5432` sont attendus par le backend.

## Conventions de travail

- une fonctionnalité Restau part de `production` via une branche `feature/...` ;
- les changements de schéma sont livrés avec une migration Sequelize ;
- les secrets et fichiers `.env` restent hors Git ;
- avant une Pull Request : `npm run lint`, `npm run typecheck`, `npm run build` côté frontend et contrôle de syntaxe côté backend ;
- les fonctionnalités Premium doivent être protégées par le plan actif, côté API et côté interface.
