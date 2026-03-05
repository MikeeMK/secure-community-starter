# Secure Community Starter (Web + API)

Un starter **full-stack** (monorepo) pensé pour une plateforme "communauté + rencontres" avec **sécurité / modération** dès le jour 1.
⚠️ Ce starter est **générique** (rencontres/communauté). Il n’implémente pas de fonctionnalités illégales.

## Stack (proposée)
- **Web**: Next.js (App Router) + TypeScript
- **API**: NestJS + TypeScript
- **DB**: Postgres (via Docker) + Prisma ORM
- **Cache/Jobs (optionnel)**: Redis (via Docker)
- **Emails (optionnel)**: provider au choix

## Objectif du starter
- Auth (squelette) + modèles DB
- Messagerie (squelette)
- Forum / groupes (squelette)
- Modération: reports, audit log, trust score (structure)
- Rate limiting (structure)
- Upload: architecture prévue (S3/R2 recommandé), stub

## Démarrage rapide
### 1) Prérequis
- Node.js 20+
- Docker Desktop
- pnpm: `npm i -g pnpm`

### 2) Installer
```bash
pnpm install
cp .env.example .env
```

### 3) Lancer Postgres (et Redis optionnel)
```bash
docker compose up -d
```

### 4) Migrer la DB
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5) Lancer API + Web
```bash
pnpm dev
```

## Scripts utiles
- `pnpm dev` : web + api en parallèle
- `pnpm -C apps/web dev` : web seul
- `pnpm -C apps/api start:dev` : api seule
- `pnpm db:studio` : Prisma Studio
- `pnpm lint` / `pnpm typecheck`

## Conformité & sécurité (notes)
Ce starter inclut des structures pour:
- signalements (reports) + file de modération
- audit logs des actions admin/mod
- trust score (anti-spam)
- limites pour nouveaux comptes
- règles/évolutions à définir selon juridiction (UE/France: DSA, etc.)

## Important
Avant d’aller en prod, prévois:
- politique de contenu + procédures
- stockage chiffré / gestion secrets
- supervision + alerting (Sentry, etc.)
- un vrai prestataire de vérification d’âge si nécessaire

Bon dev.
