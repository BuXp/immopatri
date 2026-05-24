# Sprint 2 — Propriétaires multiples

## Objectif

Gérer plusieurs propriétaires avec types juridiques (personne physique, SCI,
SARL, SAS, indivision) et rattachement flexible aux biens (DAT 2.8).

## Livrables

### Modèle & API (`services/common`, `services/api`)

- `collections/proprietaire.ts` — collection **Proprietaire** (type juridique,
  SIREN, coordonnées, banques[], assurances[], documents[], valeur estimée du
  patrimoine), index `realmId`.
- Type `Proprietaire` dans `types/src/common/collections.ts`.
- `managers/proprietairemanager.js` — CRUD + endpoint
  `GET /api/v2/proprietaires/:id/patrimoine` qui consolide sites, immeubles et
  lots liés avec le total des loyers mensuels attendus.
- Validation dédiée (`validateProprietaire`) : cohérence type/raison sociale,
  format email.
- Liens `proprietaires: [{ proprietaireId, pourcentage }]` sur Site, Immeuble et
  Property.

### Frontend (`webapps/landlord`)

- Store MobX `store/Proprietaire.js` (CRUD + `patrimoine(id)`), enregistré et
  hydraté dans `store/Store.js`.
- Helpers `fetchProprietaires` / `fetchProprietairePatrimoine` + clé
  `QueryKeys.PROPRIETAIRES` dans `utils/restcalls.js`.
- Utilitaires `utils/proprietaire.js` (nom d'affichage, initiales, types).
- Page liste **Propriétaires** : `pages/[organization]/proprietaires/index.js`
  (cards avec avatar + badge type juridique + dialog de création à formulaire
  conditionnel physique / personne morale).
- Fiche détail : `pages/[organization]/proprietaires/[id].js` — 4 onglets
  **Biens | Loyers | Documents | Financier** alimentés par l'endpoint
  `patrimoine`, avec fil d'Ariane.
- Entrée **Propriétaires** dans `AppMenu.js`.

## Restes à faire

- Composant `MultiProprietaireSelector` à insérer dans les formulaires Site /
  Immeuble / Lot pour rattacher les propriétaires avec pourcentages.
- Upload des documents propriétaire vers MinIO (onglet Documents).
- Édition / suppression depuis l'UI.
- Calcul automatique enrichi de la valeur de patrimoine (agrégation des prix de
  lots pondérés par les pourcentages de détention).
