# Hardening & sécurité — ImmoPatri (DAT Sprint 9)

Mesures appliquées et points de vigilance pour le durcissement de
l'application.

## Cloisonnement des données (multi-tenant)

- Toutes les requêtes des managers ImmoPatri sont **scopées au realm**
  (`realmId: req.realm._id`) : sites, immeubles, lots, propriétaires, alertes,
  exports, rapprochement, RGPD. Un utilisateur ne peut lire/écrire que les
  données de son organisation.

## Entrées non fiables

- **Téléchargement de fichiers par clé** (`GET /documents/download?url=`) :
  rejet des chemins contenant `..` (anti-traversée) et **vérification du
  préfixe d'organisation** (`<orgName>-<orgId>`) pour empêcher la lecture
  inter-organisations.
- **Rapprochement bancaire** : la taille du CSV est bornée
  (`csvLimitErrors`, 1 Mo / 5000 lignes max) avant parsing, pour éviter une
  consommation mémoire abusive ; renvoie `413` si dépassement.
- **Validation** systématique des corps de requête (`validation.js`,
  `validateImmeuble`/`validateSite`/`validateProprietaire`, montants/statuts
  des appels de charges) avec renvoi `422`.

## Données personnelles (RGPD)

- Export des données personnelles d'un propriétaire (`GET /rgpd/.../export`).
- Anonymisation irréversible (`POST /rgpd/.../anonymisation`) : effacement des
  identifiants directs (nom, contact, IBAN, documents) et marquage
  `anonymise: true`.
- Helpers de **masquage PII pour les logs** (`maskEmail`, `maskIban`) afin de ne
  jamais journaliser d'email ou d'IBAN en clair.

## À configurer au niveau infrastructure (hors code applicatif)

Ces points relèvent du déploiement (gateway Nginx / variables
d'environnement) et ne sont pas modifiés ici pour ne pas casser la stack :

- En-têtes de sécurité HTTP (HSTS, X-Content-Type-Options, CSP) au niveau du
  reverse proxy.
- Limitation de débit (rate limiting) sur les routes d'authentification.
- Secrets (`*_TOKEN_SECRET`, identifiants SMTP/S3) fournis uniquement via les
  variables d'environnement, jamais committés.
- TLS terminé au niveau de la gateway.
- Sauvegardes chiffrées (cf. Sprint 0).
