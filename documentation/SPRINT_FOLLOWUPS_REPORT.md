# Restes des sprints précédents — traités

Reprise des trois points laissés en suspens : upload MinIO, envoi email des
alertes, et CRUD des appels de charges.

## 1. Upload de documents (MinIO / FS)

Réutilise l'infrastructure existante du service `pdfgenerator`
(`POST /documents/upload`, qui écrit sur MinIO/S3 quand le realm a `thirdParties.b2`
configuré, sinon sur le système de fichiers).

- **Backend** : nouvelle route `GET /api/v2/documents/download?url=<clé>` dans
  `pdfgenerator` qui streame un fichier par sa clé de stockage (FS ou S3), sans
  exiger d'enregistrement `Document`. Sécurisée : refus des `..` et scoping au
  répertoire de l'organisation (`<orgName>-<orgId>`).
- **Frontend** : composant générique `EntityDocuments` (téléverser / lister /
  télécharger / supprimer), branché dans l'onglet **Documents** de la fiche
  propriétaire (remplace le placeholder). Les clés sont stockées dans
  `proprietaire.documents` et persistées via l'update existant.

## 2. Envoi email des alertes de conformité

Ajout **purement additif** au service `emailer` (n'impacte pas les templates
existants) :

- nouveau template `alerte` : `emailparts/data/alerte`, `recipients/alerte`
  (destinataires = membres enregistrés de l'organisation, via la config
  d'envoi `thirdParties` du realm), `contents/alerte` (subject + html + text).
- `'alerte'` ajouté aux `allowedTemplates` de l'emailer.
- **API** : `alertemanager.notify` + route `POST /api/v2/alertes/notify`
  (best-effort : poste vers `EMAILER_URL`, marque les alertes `envoyeEmail`,
  renvoie 502 en cas d'échec sans casser le scan).
- **Frontend** : bouton « Notifier par email » sur la page Conformité.

## 3. CRUD des appels de charges

- **Backend** : validation `appelsCharges` (montant numérique, statut dans
  `appele|paye|impaye|en_attente`) ajoutée à `validateImmeuble` + tests. La
  persistance passe par l'update Immeuble existant.
- **Frontend** : `CoproprieteSection` rend les appels de charges éditables
  (ajout / édition période-montant-statut-date / suppression + bouton
  « Enregistrer les appels »).

## Validation

- ESLint : **vert** sur les 4 services touchés (api, pdfgenerator, emailer,
  landlord).
- Jest : **29 tests verts** (+3 pour la validation des appels de charges).

### Non vérifié de bout en bout dans cet environnement (pas d'infra runtime)

- Le **roundtrip d'upload** réel vers MinIO (nécessite un realm avec S3
  configuré ou le volume FS) — le code réutilise le chemin déjà en place.
- L'**envoi SMTP réel** de l'email d'alerte (nécessite l'emailer démarré + un
  service d'envoi configuré sur l'organisation). Le template suit strictement
  le format des templates existants.
