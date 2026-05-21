#!/usr/bin/env bash
#
# ImmoPatri — Sauvegarde automatique MongoDB + MinIO (DAT v1.0, Partie 4.4)
# A planifier via cron, ex. : 0 3 * * * /opt/immopatri/scripts/backup.sh
#
# Variables d'environnement attendues (jamais de secret en dur) :
#   MONGO_URI         URI de connexion MongoDB (ex. mongodb://user:pass@host:27017/db)
#   BACKUP_DIR        Repertoire local des sauvegardes (defaut: /opt/immopatri/backups)
#   RETENTION_DAYS    Retention en jours (defaut: 30)
#   MINIO_ALIAS       Alias mc configure (optionnel, ex: local)
#   MINIO_BUCKET      Bucket source MinIO a sauvegarder (optionnel)

set -euo pipefail

MONGO_URI="${MONGO_URI:?MONGO_URI is required}"
BACKUP_DIR="${BACKUP_DIR:-/opt/immopatri/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${BACKUP_DIR}/${STAMP}"

mkdir -p "${DEST}"

echo "[backup] mongodump -> ${DEST}/mongo"
mongodump --uri="${MONGO_URI}" --gzip --out="${DEST}/mongo"

if [[ -n "${MINIO_ALIAS:-}" && -n "${MINIO_BUCKET:-}" ]]; then
  echo "[backup] mirror MinIO ${MINIO_ALIAS}/${MINIO_BUCKET} -> ${DEST}/minio"
  mc mirror --overwrite "${MINIO_ALIAS}/${MINIO_BUCKET}" "${DEST}/minio"
fi

echo "[backup] archivage chiffrable ${DEST}.tar.gz"
tar -czf "${DEST}.tar.gz" -C "${BACKUP_DIR}" "${STAMP}"
rm -rf "${DEST}"

echo "[backup] purge des sauvegardes > ${RETENTION_DAYS} jours"
find "${BACKUP_DIR}" -maxdepth 1 -name '*.tar.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete

echo "[backup] termine: ${DEST}.tar.gz"
