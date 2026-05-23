# Sprint 4 — Copropriété & modes de détention

## Objectif

Gérer le mode de détention de chaque immeuble (monopropriété, copropriété,
indivision, SCI…) et, pour les copropriétés, le suivi du syndic, des tantièmes
et la répartition des appels de charges par lot (DAT Sprint 4).

## Correctif de schéma (bloquant)

Deux sous-documents Mongoose étaient mal déclarés à cause du piège classique de
la clé `type` :

- `immeuble.modeDetention` (`{ type: String, syndic: String, … }`) était
  interprété comme un **simple champ String** → syndic, tantièmes, etc. jamais
  persistés.
- `property.diagnostics` (`[{ type: String, … }]`) était interprété comme un
  **tableau de String** → dates d'expiration perdues (cassait aussi le Sprint 3).

Corrigés en `type: { type: String }`. Comportement vérifié empiriquement avec
Mongoose (`schema.path(...)`) avant et après le correctif.

## Livrables

### Backend (`services/common`, `services/api`)

- Champ `tantiemes` ajouté au Lot (`Property`) + type.
- `validation.js` → `repartirCharges(lots, montant)` : répartition pure
  proportionnelle aux tantièmes, base = somme des tantièmes, le dernier lot
  absorbe l'arrondi pour que la somme retombe exactement sur `montant`.
- `immeublemanager.repartition` + route `GET /api/v2/immeubles/:id/repartition?montant=X`
  → `{ montant, totalTantiemes, lignes[] }`.
- Tests `repartirCharges` (proportionnalité, arrondi, tantièmes nuls, montant
  invalide).

### Frontend (`webapps/landlord`)

- `ImmeubleFormDialog` : section **Copropriété** conditionnelle (syndic, contact,
  email, n° lot, tantièmes, charges copro/an) affichée quand le mode = copropriété.
- `CoproprieteSection` : infos syndic, liste des appels de charges, et un
  **simulateur de répartition** (saisie d'un montant → quote-part par lot).
- Page détail Immeuble : section Copropriété affichée pour les copropriétés.
- `PropertyForm` : champ **Tantièmes** sur la fiche lot.
- Store `Immeuble.repartition(immeubleId, montant)`.

## Validation effectuée

- `tsc --build` types + common : **OK**.
- ESLint API + landlord : **vert**.
- Jest : **26 tests verts** (validation + alerteService), dont 4 nouveaux pour
  `repartirCharges`.

## Restes à faire

- CRUD des appels de charges (création/édition depuis l'UI ; actuellement en
  lecture seule).
- Génération automatique des appels de charges récurrents.
- Import du règlement de copropriété (upload MinIO).
