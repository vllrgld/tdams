#!/usr/bin/env bash
# Update an existing Lightsail installation. Build public/build on your PC first.
# Use --prepare before replacing source files; use --ocr when services/ocr changed.
set -Eeuo pipefail

APP_DIR="/var/www/dtms"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREPARE_ONLY=false
UPDATE_OCR=false
APP_ONLINE=false

for argument in "$@"; do
    case "${argument}" in
        --prepare) PREPARE_ONLY=true ;;
        --ocr) UPDATE_OCR=true ;;
        --help)
            echo "Usage: sudo bash deploy/lightsail/update.sh [--prepare | --ocr]"
            echo "  --prepare  Enter maintenance and stop the queue before copying code/assets."
            echo "  --ocr      Also install OCR requirements and restart the existing OCR service."
            exit 0
            ;;
        *) echo "Unknown option: ${argument}" >&2; exit 1 ;;
    esac
done

if [[ "${EUID}" -ne 0 ]]; then
    echo "Run as root: sudo bash deploy/lightsail/update.sh" >&2
    exit 1
fi

if ${PREPARE_ONLY} && ${UPDATE_OCR}; then
    echo "Use --prepare before copying files, then --ocr after copying them." >&2
    exit 1
fi

exec 9>/run/lock/dtms-update.lock
flock -n 9 || { echo "Another DTMS update is running." >&2; exit 1; }

cd "${APP_DIR}"
for required_file in artisan .env composer.lock vendor/autoload.php; do
    if [[ ! -f "${required_file}" ]]; then
        echo "Missing ${APP_DIR}/${required_file}. This script requires an existing installation." >&2
        exit 1
    fi
done

if [[ "$(systemctl show -p LoadState --value dtms-queue.service)" != "loaded" ]]; then
    echo "dtms-queue.service is missing. Complete setup-ocr.sh before using this updater." >&2
    exit 1
fi

if ${UPDATE_OCR}; then
    if [[ ! -x services/ocr/.venv/bin/pip || ! -f services/ocr/requirements.txt ]] ||
        [[ "$(systemctl show -p LoadState --value dtms-ocr.service)" != "loaded" ]]; then
        echo "OCR installation is incomplete. Run setup-ocr.sh first." >&2
        exit 1
    fi
fi

if ! ${PREPARE_ONLY}; then
    python3 - "${APP_DIR}/public/build" <<'PY'
import json
import re
import sys
from pathlib import Path

build = Path(sys.argv[1]).resolve()
manifest = json.loads((build / "manifest.json").read_text())
for entry in ("resources/js/app.tsx", "resources/css/app.css"):
    if entry not in manifest:
        raise SystemExit(f"Build is missing {entry}. Rebuild and upload all of public/build.")

files = set()
for chunk in manifest.values():
    files.add(chunk["file"])
    files.update(chunk.get("css", []))
    files.update(chunk.get("assets", []))

fonts = json.loads((build / "fonts-manifest.json").read_text())
files.add(fonts["style"]["file"])
files.update(font["file"] for font in fonts.get("preloads", []))
for style in fonts["style"].get("familyStyles", {}).values():
    files.update(re.findall(r'/build/([^"\s)]+)', style))

for filename in sorted(files):
    path = (build / filename).resolve()
    if not path.is_relative_to(build) or not path.is_file():
        raise SystemExit(f"Build asset missing or invalid: {filename}. Upload all of public/build.")
print(f"Verified {len(files)} build assets. Use a build from the same source revision.")
PY
fi

on_error() {
    if ${APP_ONLINE}; then
        sudo -u www-data php artisan down --render="errors::503" --retry=60 || true
    fi
    echo "Update stopped. Check the error above; maintenance mode may still be enabled." >&2
    echo "Fix the error and rerun this script. No automatic rollback has been performed." >&2
}
trap on_error ERR

# Install the longer shutdown allowance before stopping a running OCR job.
install -m 644 "${SCRIPT_DIR}/queue.service" /etc/systemd/system/dtms-queue.service
systemctl daemon-reload
sudo -u www-data php artisan down --render="errors::503" --retry=60
systemctl stop dtms-queue.service

set_runtime_permissions() {
    local deploy_uid
    deploy_uid="$(stat -c '%u' "${APP_DIR}")"
    chown -R "${deploy_uid}:www-data" storage bootstrap/cache
    chmod -R ug+rwX storage bootstrap/cache
}

set_runtime_permissions

if ${PREPARE_ONLY}; then
    echo "Maintenance enabled and queue stopped. Copy the new code and public/build now."
    echo "Then run: sudo bash deploy/lightsail/update.sh (add --ocr if services/ocr changed)."
    exit 0
fi

rm -f public/hot bootstrap/cache/config.php bootstrap/cache/events.php bootstrap/cache/routes-v7.php
export COMPOSER_ALLOW_SUPERUSER=1
export COMPOSER_MEMORY_LIMIT=512M
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
composer check-platform-reqs --no-dev

if ${UPDATE_OCR}; then
    systemctl stop dtms-ocr.service
    services/ocr/.venv/bin/pip install -r services/ocr/requirements.txt
    chown -R www-data:www-data services/ocr/.venv
    install -m 644 "${SCRIPT_DIR}/ocr.service" /etc/systemd/system/dtms-ocr.service
    systemctl daemon-reload
    systemctl start dtms-ocr.service
    curl --fail --silent --show-error --retry 15 --retry-connrefused --retry-delay 2 \
        --max-time 5 http://127.0.0.1:8001/health
fi

chown -R www-data:www-data public/build
set_runtime_permissions
sudo -u www-data php artisan migrate --force --no-interaction
if [[ ! -e public/storage && ! -L public/storage ]]; then
    sudo -u www-data php artisan storage:link
fi

# Cache individually so any failing command stops the deployment.
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan event:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

systemctl reload php8.4-fpm
sudo -u www-data php artisan up
APP_ONLINE=true
systemctl start dtms-queue.service
systemctl is-active --quiet php8.4-fpm
systemctl is-active --quiet dtms-queue.service
curl --fail --silent --show-error --max-time 15 http://127.0.0.1/up >/dev/null

echo
echo "DTMS update complete. Open the site and refresh the browser."
echo "Check command search, Upload, Dates/Sort, and a document thumbnail."
