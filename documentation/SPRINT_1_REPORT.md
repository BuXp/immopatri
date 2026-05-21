# Sprint 1 — Hiérarchie Sites / Immeubles / Lots

## Objectif

Implémenter la hiérarchie patrimoniale à 3 niveaux (Site > Immeuble > Lot) qui
manque dans MRE (2 niveaux), cœur métier du projet (DAT 2.3 → 2.5, 3.5).

## Livrables

### Modèle de données (`services/common`, `types`)

- `collections/site.ts` — collection **Site** (nom, adresse, ville, banque,
  assurance, taxe foncière, propriétaires[], documents, timestamps), index `realmId`.
- `collections/immeuble.ts` — collection **Immeuble** rattachée à un site
  (`siteId`), avec `modeDetention`, `appelsCharges[]`, assurance, IBAN, travaux[].
  Index `realmId + siteId`.
- `collections/property.ts` — **Lot** étendu : `immeubleId`, `statut`, `loyerHC`,
  `charges`, `loyerTotal`, `depotGarantie`, `dpe`, `diagnostics[]`, `photos[]`,
  liens propriétaires. Index `realmId + immeubleId`.
- `types/src/common/collections.ts` — types `Site`, `Immeuble`, `Proprietaire`,
  sous-types partagés (`PartAssurance`, `PartProprietaireLink`, `PartDPE`,
  `PartDiagnostic`) et extension du type `Property`.
- Enregistrement dans `collections/index.ts`.

### API REST (`services/api`)

- `managers/sitemanager.js`, `immeublemanager.js` — CRUD complet scopé `realmId`.
  Le listing d'immeubles accepte `?siteId=` pour le filtrage par site.
- `managers/validation.js` — validateurs server-side purs et testables.
- Routes montées sous `/api/v2/sites` et `/api/v2/immeubles` dans `routes.js`.

### Tests

- `__tests__/managers/immopatri-validation.test.js` — Jest, couvre la validation
  des sites/immeubles/propriétaires et le calcul de quote-part.

## Écarts / restes à faire

- Pages frontend Next.js (`webapps/landlord`) : non livrées dans cet incrément.
- Migration des `properties` existantes vers un `immeubleId` : à ajouter dans
  `services/api/scripts/migration.js`.
- Le contrôle RBAC fin "accès au site demandé" repose pour l'instant sur le
  scoping `realmId` (organisation).
