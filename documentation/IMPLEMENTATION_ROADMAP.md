# ImmoPatri — Roadmap d'implémentation du DAT v1.0

Ce document mappe le Document d'Architecture Technique (DAT v1.0) sur
l'architecture **réelle** du monorepo (fork ImmoPatri), qui diffère de
l'arborescence simplifiée supposée par les prompts du DAT (`api/models/*.js`,
`frontend/pages/*`).

## Correspondance architecture

| DAT (prompt) | Emplacement réel dans ce dépôt |
| --- | --- |
| `api/models/Site.js` | `services/common/src/collections/site.ts` (schéma Mongoose typé) |
| `api/models/Immeuble.js` | `services/common/src/collections/immeuble.ts` |
| `api/models/Proprietaire.js` | `services/common/src/collections/proprietaire.ts` |
| Extension `Property` (lot) | `services/common/src/collections/property.ts` + type dans `types/src/common/collections.ts` |
| `api/routes/sites.js` | managers `services/api/src/managers/sitemanager.js` câblés dans `services/api/src/routes.js` |
| Validation Joi | `services/api/src/managers/validation.js` (validateurs purs, testables) |
| Endpoints `/api/v1/...` | montés sous le préfixe réel **`/api/v2/...`** via la gateway |
| `frontend/pages/*` | webapp Next.js `webapps/landlord` (à venir) |

## Multi-tenant

IP isole les données par `realmId` (organisation), injecté par le middleware
`checkOrganization`. Toutes les nouvelles collections embarquent `realmId` et
tous les managers filtrent dessus — c'est la base du contrôle d'accès RBAC
server-side exigé au DAT 3.6.

## État d'avancement par sprint

| Sprint | Périmètre DAT | État |
| --- | --- | --- |
| 0 | Fondations DevSecOps (CI/CD, backup, provision, Nginx, MinIO/Kuma) | ✅ Fichiers livrés (pipeline en `workflow_dispatch`) |
| 1 | Hiérarchie Sites > Immeubles > Lots (modèles + API CRUD) | ✅ Backend livré — ui Next.js à venir |
| 2 | Propriétaires multiples (modèle + API + patrimoine) | ✅ Backend livré — ui & upload MinIO à venir |
| 3 | DPE & Diagnostics + alertes (cron, email) | 🟡 Schéma préparé (champs `dpe`/`diagnostics` sur le lot) — service/cron à venir |
| 4 | Copropriété & modes de détention | 🟡 Schéma préparé (`modeDetention`, `appelsCharges`) — routes/import à venir |
| 5 | Exports PDF/Excel & quittances | ⬛ À faire (service `pdfgenerator` existant à étendre) |
| 6 | Rapprochement bancaire CSV | ⬛ À faire |
| 7–9 | Tableau de bord, conformité RGPD, hardening | ⬛ À faire |

## Prochaines étapes recommandées

1. Pages Next.js `webapps/landlord` : Sites (cards + formulaire), détail Site >
   Immeubles, détail Immeuble > Lots, breadcrumb.
2. Sélecteur multi-propriétaires réutilisable dans les formulaires.
3. Service d'alertes (`alerteService` + `alerteJob` node-cron) pour DPE/diagnostics.
4. Migration de données : rattacher les `properties` IP existantes à un immeuble.
