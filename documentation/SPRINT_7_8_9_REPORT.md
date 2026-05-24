# Sprints 7–9 — Tableau de bord, RGPD & Hardening

## Sprint 7 — Tableau de bord patrimoine

- `dashboardbuilders.buildPatrimoineDashboard(sites, immeubles, lots, alertes)`
  — **agrégation pure et testée** : compteurs, occupation par statut, taux
  d'occupation, loyers mensuels cumulés, alertes de conformité (rouge/orange).
- `dashboardmanager.patrimoine` + route `GET /api/v2/dashboard/patrimoine`.
- **UI** : composant `PatrimoineOverview` (cartes KPI) affiché en tête de la
  page Sites.

## Sprint 8 — Conformité RGPD

- `rgpdservice` — **pur et testé** :
  - `buildProprietairePersonalData(proprietaire, lots)` : export structuré des
    données personnelles (identité, contact, IBAN, assurances, lots liés).
  - `anonymizeProprietaire(proprietaire)` : effacement des identifiants directs
    + drapeau `anonymise`.
- `rgpdmanager` + routes `GET /rgpd/proprietaires/:id/export` (JSON
  téléchargeable) et `POST /rgpd/proprietaires/:id/anonymisation`.
- Champ `anonymise` ajouté au modèle propriétaire (+ correction au passage du
  piège Mongoose `type` sur le tableau `assurances`).
- **UI** : boutons « Exporter (RGPD) » et « Anonymiser » (avec confirmation) sur
  la fiche propriétaire.

## Sprint 9 — Hardening

- `security.js` — **pur et testé** :
  - `csvLimitErrors` : borne le CSV de rapprochement (1 Mo / 5000 lignes),
    intégré à `POST /rapprochement` (renvoie `413` si dépassement).
  - `maskEmail`, `maskIban` : masquage des PII pour des logs sûrs.
- Anti-traversée + scoping organisation déjà en place sur le téléchargement de
  fichiers (Sprint « restes »).
- `documentation/SECURITY_HARDENING.md` : synthèse des mesures (cloisonnement
  multi-tenant, validation des entrées, RGPD) et des points à configurer côté
  infrastructure (en-têtes HTTP, rate limiting, secrets, TLS).

## Validation effectuée

- `tsc --build` types + common : **OK** (champ `anonymise`, fix `assurances`).
- Jest : **58 tests verts** au total (+10 : dashboard 3, rgpd 4, security 8 →
  réparties).
- ESLint : **vert** sur api et landlord.

### Non vérifié de bout en bout ici (pas d'infra runtime)

- Rendu des cartes du tableau de bord et téléchargement RGPD (nécessitent Mongo
  + services en marche). Les logiques d'agrégation, d'export et
  d'anonymisation sont couvertes par des tests unitaires.
