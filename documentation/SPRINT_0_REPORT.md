# Sprint 0 — Setup & Fondations DevSecOps

## Objectif

Préparer la chaîne DevSecOps et l'infrastructure décrite au DAT (Parties 3.3, 3.4,
4.4) sans perturber le CI d'intégration déjà présent dans le dépôt.

## Livrables

| Fichier | Description |
| --- | --- |
| `.github/workflows/immopatri-deploy.yml` | Pipeline DevSecOps (SAST Semgrep, tests+couverture, build Docker + scan Trivy, deploy SSH, E2E Playwright). Déclenchement **manuel** (`workflow_dispatch`) pour éviter tout déploiement involontaire. |
| `scripts/backup.sh` | `mongodump` gzip + miroir MinIO optionnel + archivage + purge rétention 30 j. Paramétré par variables d'environnement (aucun secret en dur). |
| `scripts/provision-vps.sh` | Provisionnement idempotent Ubuntu 22.04 : Docker, compose plugin, Git, Nginx, Certbot, UFW. |
| `nginx/immopatri.conf` | Reverse proxy durci : redirection HTTPS, HSTS, CSP, X-Frame-Options, proxy vers `:8080`. |
| `docker-compose.immopatri.yml` | Services additionnels **opt-in** : MinIO (stockage chiffré) + Uptime-Kuma (monitoring). |

## Décisions / écarts vs DAT

- Le dépôt possède déjà `ci.yml`, `pr-ci.yml`, `codeql-analysis.yml`, `release.yml`.
  Le nouveau pipeline est donc **complémentaire** et nommé `immopatri-deploy.yml`.
- Le job `deploy` (et l'E2E qui en dépend) ne s'exécute que si l'entrée
  `deploy=true` est fournie manuellement, et requiert les secrets
  `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `APP_URL`.
- `docker-compose.immopatri.yml` n'est volontairement **pas** un
  `docker-compose.override.yml` (qui serait fusionné automatiquement) afin de ne
  pas modifier le comportement de développement existant.
- Outillage aligné sur **Yarn** (le dépôt utilise yarn workspaces), au lieu de npm.

## Suite

Voir `documentation/IMPLEMENTATION_ROADMAP.md`.
