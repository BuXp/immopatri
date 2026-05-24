# Sprint 6 — Rapprochement bancaire CSV

## Objectif

Importer un relevé bancaire au format CSV, détecter automatiquement les
virements de loyers et les rapprocher des loyers attendus, puis enregistrer les
paiements correspondants (DAT Sprint 6).

## Livrables

### Backend (`services/api`)

- `services/bankreconciliation.js` — **logique pure et testée** :
  - `parseAmount` : montants français (`1 234,56`, `1.234,56`) et anglais.
  - `parseBankCsv` : relevé CSV → `[{ date, label, amount }]`. Gère délimiteur
    `;`/`,`, en-tête optionnel, colonne montant signée **ou** colonnes
    crédit/débit séparées.
  - `reconcile(transactions, candidates, { tolerance })` : ne considère que les
    crédits, score chaque locataire par correspondance de **libellé** (jetons du
    nom, accents ignorés) et de **montant** ; chaque locataire est rapproché au
    plus une fois (glouton par score, seuil ≥ 2 pour éviter les faux positifs).
- `rapprochementmanager.analyse` + route `POST /api/v2/rapprochement`
  (**lecture seule** : renvoie les suggestions, n'enregistre rien). Calcule le
  montant attendu de chaque locataire depuis ses loyers du terme.
- Tests : **11 cas** (parsing FR/EN, crédit/débit, en-tête/positionnel,
  scoring, unicité du rapprochement).

### Frontend (`webapps/landlord`)

- Store `Rapprochement.analyse({ csv, year, month })`.
- Page **Rapprochement bancaire** : saisie/upload du CSV, sélection du
  mois/année, tableau des correspondances (cases à cocher) et des transactions
  non rapprochées. L'enregistrement réutilise le **flux de paiement existant**
  (`store.rent.pay`) pour chaque correspondance sélectionnée — aucune logique de
  mutation dupliquée.
- Entrée de menu **Rapprochement** (après Comptabilité).

## Validation effectuée

- Jest : **44 tests verts** au total (+11 pour le rapprochement).
- ESLint : **vert** sur api et landlord.
- Logique vérifiée par smoke-test (parsing FR, débit ignoré, matching
  nom+montant).

### Non vérifié de bout en bout dans cet environnement (pas d'infra runtime)

- L'enregistrement effectif des paiements (nécessite Mongo + le service `api`
  en marche) — réutilise le endpoint `PATCH /rents/payment/:id/:term` existant.

## Restes / pistes

- Mémoriser les libellés déjà rapprochés pour améliorer les suggestions.
- Gérer les paiements partiels et les virements groupés (un virement pour
  plusieurs loyers).
