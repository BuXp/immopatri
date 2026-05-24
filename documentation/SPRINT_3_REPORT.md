# Sprint 3 — DPE & Diagnostics

## Objectif

Suivi des diagnostics réglementaires obligatoires (DPE, amiante, plomb, ERP…)
avec détection préventive des échéances et tableau de bord de conformité
(DAT 2.9, Sprint 3).

## Livrables

### Backend (`services/common`, `services/api`)

- Collection **Alerte** (`collections/alerte.ts`) + type — `lotId`, `siteId`,
  `immeubleId`, `type`, `niveau` (orange/rouge), `message`, `dateExpiration`,
  `dateAlerte`, `envoyeEmail`, `acquittee`.
- `services/alerteService.js` — **logique pure et testée** :
  - `evaluateExpiration(date, type, now)` → `rouge` (échu) / `orange`
    (proche) / `null`, seuils par type (DPE 6 mois, ERP/autres 1 mois).
  - `checkDiagnosticExpiration(lot, now)` → alertes du lot ; DPE dérivé de
    `dateRealisation + 10 ans`, alerte **Loi Climat** pour les classes F/G.
- `managers/alertemanager.js` — `scanAlertes(realm)` régénère les alertes non
  acquittées (conserve les acquittées), `all` (filtres niveau/type/lotId/siteId),
  `acknowledge`.
- Routes `/api/v2/alertes` : `GET`, `POST /scan`, `PATCH /:id/acquittement`.
- `jobs/alertejob.js` — scan quotidien (`0 8 * * *`) ; `node-cron` est une
  dépendance **optionnelle** chargée dynamiquement (jamais importée au
  démarrage, donc aucun risque si absente).
- Tests `__tests__/managers/alerteService.test.js` (9 tests, dates simulées) —
  **verts**.

### Frontend (`webapps/landlord`)

- Store `store/Alerte.js` (fetch filtrable / scan / acquittement) + helpers
  `fetchAlertes`, `scanAlertes`.
- Page **Conformité** (`pages/[organization]/conformite/index.js`) : tableau
  filtrable par niveau et type, bouton « Scanner la conformité », badges de
  couleur, acquittement par ligne, lien vers le lot.
- Composant `AlerteBadge` et entrée **Conformité** dans `AppMenu.js`.

## Validation effectuée

- `tsc --build` des packages `types` et `common` : **OK** (collections/types
  compilent).
- ESLint des fichiers ajoutés (API + landlord) : **vert**.
- Jest `alerteService` et `immopatri-validation` : **22 tests verts**.

## Restes à faire

- Activer le cron : `yarn workspace @immopatri/api add node-cron` puis appeler
  `startAlerteJob()` dans `src/index.js`.
- Envoi email des alertes (intégration service `emailer`, template HTML).
- Export PDF du rapport de conformité (service `pdfgenerator`/Puppeteer).
- Formulaire de saisie DPE/diagnostics dans la fiche lot (UI).
- `BadgeAlerte` compteur sur les cartes Lot/Immeuble.
