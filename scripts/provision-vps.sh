#!/usr/bin/env bash
#
# ImmoPatri — Provisionnement d'un VPS Ubuntu 22.04 LTS (DAT v1.0, Partie 3.3)
# Installe Docker, Docker Compose, Git, Nginx et Certbot. Idempotent.
# A lancer en root : sudo bash scripts/provision-vps.sh

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ce script doit etre execute en root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[provision] mise a jour des paquets"
apt-get update -y
apt-get upgrade -y

echo "[provision] dependances de base"
apt-get install -y ca-certificates curl gnupg git nginx ufw

if ! command -v docker >/dev/null 2>&1; then
  echo "[provision] installation de Docker Engine + compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "[provision] installation de Certbot"
  apt-get install -y certbot python3-certbot-nginx
fi

echo "[provision] pare-feu UFW (OpenSSH + Nginx Full)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

systemctl enable --now docker
systemctl enable --now nginx

echo "[provision] termine. Configurez ensuite nginx/immopatri.conf et le .env."
