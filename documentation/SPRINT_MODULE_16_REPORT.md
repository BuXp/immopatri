# Module 16 — États des lieux guidés par photos (DAT v1.1)

Implémentation du module de réalisation des états des lieux d'entrée et de
sortie guidé par photos, avec comparaison IA et validation humaine
obligatoire. Basé sur le cahier des charges d'Emmanuel Le Benoist du
23 novembre 2026 et l'Annexe 2 des 12 scénarios BDD Gherkin.

## Livrables

### Modèle de données (`services/common`, `types`)

- `collections/configurationlogement.ts` — une config par lot
  (`typeLocation: 'entier' | 'colocation'`, modèles de départ, pièces avec
  `estPrivative` + `chambreId`, équipements, annexes).
- `collections/dossieredl.ts` — un dossier par locataire et par type
  (entrée/sortie) avec `lienToken` JWT, `lienExpiration`, `pieces[]` (photos
  + observations), compteurs, clés, inventaire, détection de fumée, versions.
- `collections/comparaisonedl.ts` — résultats par signalement avec
  `niveauConfiance`, `statutValidation` et `zoneSignalee`.
- `collections/historiquecommun.ts` — historique immuable des séries de
  photos des espaces communs en colocation.

Tous les sous-documents dont un champ s'appelle `type` utilisent le
`type: { type: String }` reconnu par Mongoose (piège déjà corrigé lors des
sprints précédents).

### Services métier purs et testables (`services/api/src/services/`)

- `edlService.js` — règles pures : `evaluateObservation`
  (« réponse manquante ≠ bon état »), `filterPiecesForLocataire` (isolation
  coloc), `appendSerieCommun` (immuabilité historique),
  `selectEntreeSerieForSortie` (sélection entrée du bon locataire),
  chemins MinIO (`buildPrivatePhotoKey`, `buildCommonPhotoKey`), templates de
  départ `MODELES_DEPART` et `applyModeleDepart`.
- `edlTokens.js` — JWT dédiés au parcours : `generateEdlToken`,
  `verifyEdlToken` (codes `expired` / `invalid` / `server_misconfigured`),
  audience `immopatri:edl`, algo HS256 pour parité avec l'infra JWT
  existante (upgrade ES256 commenté : un paramètre à changer).
- `edlComparaison.js` — `parseAiResponse` (tolérant au bruit), prompt
  système officiel, `requiresHumanReview` (toujours `true`, cf. CDC 16.7 /
  @critique « aucun montant automatique »), `confidenceCategory`,
  `validateComparaisonDecision`, `compareImagePair` (fonction `callAi`
  injectable — câblable sur OpenAI Vision via `OPENAI_API_KEY`).

### API (`services/api/src/managers/` + `routes.js`)

Côté propriétaire (sous `/api/v2/edl`, derrière l'auth classique) :
- `GET/PUT /configurations/:lotId`, `POST /configurations/modele`
- `GET /dossiers`, `POST /dossiers`, `GET /dossiers/:id`,
  `POST /dossiers/:id/signer`, `GET /dossiers/:id/rapport`
- `POST /comparaisons`, `POST /comparaisons/dry-run`,
  `GET /comparaisons`, `GET /comparaisons/:id`,
  `PATCH /comparaisons/:id/items/:index`

Côté parcours locataire (sous `/api/v2/edl/parcours/:token`, **hors**
`needAccessToken` — monté avant le routeur protégé) :
- `GET /:token`, `POST /:token/photo`, `PUT /:token/observation`,
  `POST /:token/compteur`, `POST /:token/transmettre`

Un middleware `withDossier` vérifie le token EDL (code 410 sur expiration,
401 sur signature invalide — CDC § dossier expiré) et attache le dossier à
`req.edlDossier`.

### Frontend (`webapps/landlord`)

- Store MobX `Edl` (dossiers, comparaisons, config, actions typiques).
- `pages/[organization]/edl/index.js` — tableau de bord des dossiers avec
  statuts colorés et bouton « Copier le lien ».
- `pages/[organization]/edl/configurer/[lotId].js` — choix du modèle de
  départ + type de location, aperçu des pièces, création d'un nouveau
  dossier avec copie automatique du lien dans le presse-papier.
- `pages/[organization]/edl/comparaison/[id].js` — validation humaine item
  par item (confirmer / écarter / demander complément) avec rappel
  « aucun montant automatique » bien visible.
- `pages/edl/parcours/[token].js` — **page publique** (hors
  `withAuthentication`) : parcours locataire PWA minimaliste, consignes
  initiales, formulaire état/propreté/fonctionnement avec rappel explicite
  « non renseigné ≠ bon », transmission finale.
- Entrée de menu « États des lieux » (icône caméra).

### Tests Jest (`services/api/src/__tests__/managers/edlService.test.js`)

26 tests verts couvrant explicitement les scénarios `@critique` de
l'Annexe 2 :

| @critique BDD scenario | Test unitaire correspondant |
| --- | --- |
| Réponse manquante ≠ bon état | `evaluateObservation` cases + `summariseObservations` |
| Colocation — isolation des dossiers | `filterPiecesForLocataire` |
| Colocation — historique commun immuable | `appendSerieCommun` (pure, non-mutative) |
| Colocation — comparaison sortie bon locataire | `selectEntreeSerieForSortie` |
| Token EDL expiré | `verifyEdlToken` (code `expired`) + forgé (code `invalid`) |
| Comparaison IA + validation humaine | `parseAiResponse` + `requiresHumanReview` toujours vrai |
| IA — statut comparaison impossible | `parseAiResponse` sur JSON invalide / payload explicite |

Les scénarios Playwright E2E et l'intégration OpenAI Vision réelle sont
documentés comme suite — ils nécessitent une stack runtime complète (Mongo,
services démarrés, clé OPENAI_API_KEY).

## Validation effectuée

- `tsc --build` types + common : **vert** (nouvelles collections typées et
  piège Mongoose maîtrisé).
- `yarn lint` racine (tous les workspaces) : **vert**.
- Jest : **nouveau suite + anciennes passent** — mes 26 tests EDL +
  tous les tests déjà verts avant. Les 3 suites rouges pré-existantes
  (`contract`, `computeRent`, `url`) sont présentes sur `master` et hors
  scope de ce sprint.

## Restes / pistes

- Upload binaire des photos vers MinIO : à brancher en réutilisant
  l'endpoint `/documents/upload` du service `pdfgenerator` (le manager
  parcours enregistre déjà la clé retournée, cf. `registerPhoto`).
- Template Handlebars `rapport_edl.hbs` et `rapport_comparatif.hbs`
  (service `pdfgenerator`) — le manager renvoie aujourd'hui la donnée JSON.
- Superposition transparente entrée/sortie côté locataire (slider
  d'opacité) et détection flou via Canvas API — placeholder à iterer.
- Branchement OpenAI Vision réel (remplacer `stubCallAi` par un appel
  authentifié via `OPENAI_API_KEY`).
- Scénarios Playwright E2E — à écrire une fois une stack d'intégration
  disponible.

## Non vérifié de bout en bout ici (pas d'infra runtime)

- Flux complet en conditions réelles (Mongo + pdfgenerator + webapp
  démarrés, tunnel d'un token sur mobile) — le code suit strictement le
  contrat BDD mais mérite une passe de validation E2E manuelle.
