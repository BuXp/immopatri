# Sprint 5 — Exports PDF/Excel & quittances

## Objectif

Produire les documents de gestion : quittance de loyer (PDF) et exports
tableur (Excel) de l'état locatif et du patrimoine (DAT Sprint 5).

## Livrables

### Quittance de loyer (PDF)

Réutilise le pipeline `pdfgenerator` existant (Chrome headless + EJS), basé sur
la convention de fichiers `templates/<id>.ejs` + `data/<id>/index.js`.

- `templates/quittance.ejs` : quittance française (« Je soussigné… reconnais
  avoir reçu… et lui en donne quittance »), réutilise les partials existants
  (header, adresse, lieu/date, signature, footer) et les classes CSS d'impression.
- `data/quittance/index.js` : ré-exporte la data de l'`invoice` (mêmes champs
  bailleur / locataire / loyer / période / paiement).
- Accessible via la route générique `GET /api/v2/documents/quittance/:tenantId/:term`
  (aucun enregistrement de route nécessaire — résolution par convention).
- **UI** : bouton de téléchargement (icône reçu) sur chaque ligne de loyer
  **réglé** dans `RentTable`.

### Exports Excel (.xlsx)

Ajout de la dépendance `exceljs` au service `api`.

- `exportbuilders.js` : **fonctions pures et testées**
  - `buildEtatLocatifRows(lots, immeublesById, sitesById)` — état locatif
    (site, immeuble, lot, surface, statut, loyers, tantièmes, nb propriétaires).
  - `buildPatrimoineRows(proprietaires, lots)` — patrimoine par propriétaire
    (nb lots, loyer mensuel pondéré par la quote-part, valeur estimée).
- `exportmanager.js` : génère les classeurs `.xlsx` (en-têtes en gras, largeurs)
  et les renvoie en pièce jointe.
- Routes : `GET /api/v2/exports/etat-locatif` et `GET /api/v2/exports/patrimoine`.
- **UI** : bouton « Exporter l'état locatif » (page Sites) et « Exporter le
  patrimoine » (page Propriétaires).

## Validation effectuée

- Jest : **33 tests verts** (+4 pour les builders d'export). Les builders sont
  isolés d'`exceljs` pour rester testables sans charger la librairie.
- ESLint : **vert** sur api, pdfgenerator et landlord.
- Import `exceljs` vérifié (génération de classeur fonctionnelle).

### Non vérifié de bout en bout dans cet environnement (pas d'infra runtime)

- Le **rendu visuel du PDF** de la quittance (nécessite le service
  `pdfgenerator` + Chrome headless en marche). Le template suit strictement la
  structure et les partials de l'`invoice` existante.

## Restes / pistes

- Quittance groupée (plusieurs locataires / une période) en un seul PDF.
- Export Excel de la comptabilité annuelle (la version CSV existe déjà).
