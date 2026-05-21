# Sprint 2 — Propriétaires multiples

## Objectif

Gérer plusieurs propriétaires avec types juridiques (personne physique, SCI,
SARL, SAS, indivision) et rattachement flexible aux biens (DAT 2.8).

## Livrables

- `services/common/src/collections/proprietaire.ts` — collection **Proprietaire**
  (type juridique, SIREN, coordonnées, banques[], assurances[], documents[],
  valeur estimée du patrimoine), index `realmId`.
- Type `Proprietaire` dans `types/src/common/collections.ts`.
- `services/api/src/managers/proprietairemanager.js` — CRUD + endpoint
  `GET /api/v2/proprietaires/:id/patrimoine` qui consolide sites, immeubles et
  lots liés avec le total des loyers mensuels attendus.
- Validation dédiée (`validateProprietaire`) : cohérence type/raison sociale,
  format email.
- Liens `proprietaires: [{ proprietaireId, pourcentage }]` ajoutés aux
  collections Site, Immeuble et Property (pourcentages de détention).

## Restes à faire

- Composant `MultiProprietaireSelector` et fiche détail à 4 onglets (frontend).
- Upload des documents propriétaire vers MinIO.
- Calcul automatique enrichi de la valeur de patrimoine (agrégation des prix de
  lots pondérés par les pourcentages de détention).
