#!/usr/bin/env bash
# FastAPI (Ghostscript compression) + one queue worker on the 1 GB Lightsail host.
# Run after deploy/lightsail/setup.sh. Does not change Nginx, PHP-FPM, MySQL, or app code.
#
#   sudo bash deploy/lightsail/setup-ocr.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
    echo "Run as root: sudo bash deploy/lightsail/setup-ocr.sh" >&2
    exit 1
fi

APP_DIR="/var/www/dtms"
OCR_DIR="${APP_DIR}/services/ocr"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OCR_ENV="/etc/dtms-ocr.env"

if [[ ! -f "${APP_DIR}/artisan" ]]; then
    echo "DTMS is not at ${APP_DIR}. Run deploy/lightsail/setup.sh first." >&2
    exit 1
fi

if [[ ! -f "${OCR_DIR}/requirements.txt" ]]; then
    echo "Missing ${OCR_DIR}/requirements.txt." >&2
    exit 1
fi

if [[ ! -f "${APP_DIR}/.env" ]]; then
    echo "Missing ${APP_DIR}/.env." >&2
    exit 1
fi

if ! swapon --show | grep -q '/swapfile'; then
    echo "Creating 2 GB swap so Ghostscript does not OOM on 1 GB RAM."
    if ! fallocate -l 2G /swapfile; then
        dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    fi
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y \
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-eng \
    qpdf \
    pngquant \
    python3 \
    python3-venv \
    python3-pip

if [[ ! -d "${OCR_DIR}/.venv" ]]; then
    python3 -m venv "${OCR_DIR}/.venv"
fi

"${OCR_DIR}/.venv/bin/pip" install --upgrade pip
"${OCR_DIR}/.venv/bin/pip" install -r "${OCR_DIR}/requirements.txt"
chown -R www-data:www-data "${OCR_DIR}/.venv"

python3 - "${APP_DIR}/.env" "${SCRIPT_DIR}/env.ocr.example" <<'PY'
from pathlib import Path
import sys

env_path = Path(sys.argv[1])
example_path = Path(sys.argv[2])
existing_keys = set()
for line in env_path.read_text().splitlines():
    stripped = line.strip()
    if stripped == "" or stripped.startswith("#") or "=" not in line:
        continue
    existing_keys.add(line.split("=", 1)[0])

additions = []
for line in example_path.read_text().splitlines():
    stripped = line.strip()
    if stripped == "" or stripped.startswith("#") or "=" not in line:
        continue
    key = line.split("=", 1)[0]
    if key not in existing_keys:
        additions.append(line)

if additions:
    text = env_path.read_text()
    if not text.endswith("\n"):
        text += "\n"
    env_path.write_text(text + "\n".join(additions) + "\n")
PY

chown www-data:www-data "${APP_DIR}/.env"
chmod 640 "${APP_DIR}/.env"

OCR_TOKEN="$(sed -n 's/^OCR_TOKEN=//p' "${APP_DIR}/.env" | tail -n1)"
OCR_TOKEN="${OCR_TOKEN:-local-dev-token}"
printf 'OCR_API_TOKEN=%s\n' "${OCR_TOKEN}" > "${OCR_ENV}"
chmod 640 "${OCR_ENV}"
chown root:www-data "${OCR_ENV}"

install -m 644 "${SCRIPT_DIR}/ocr.service" /etc/systemd/system/dtms-ocr.service
install -m 644 "${SCRIPT_DIR}/queue.service" /etc/systemd/system/dtms-queue.service
systemctl daemon-reload
systemctl enable dtms-ocr.service dtms-queue.service
systemctl restart dtms-ocr.service dtms-queue.service

cd "${APP_DIR}"
sudo -u www-data php artisan config:cache

echo
echo "FastAPI listens on 127.0.0.1:8001 (--workers 1). Queue runs one job at a time."
echo "Use Settings → OCR → Paddle. Do not use Local OCRmyPDF as the default on 1 GB RAM."
echo "Paste PADDLE_OCR_TOKEN and OLLAMA_API_KEY into ${APP_DIR}/.env, then:"
echo "  sudo -u www-data php artisan config:cache"
echo "Health: curl -sS http://127.0.0.1:8001/health"
echo "Status: systemctl status dtms-ocr dtms-queue"
