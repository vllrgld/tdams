#!/usr/bin/env bash
# Trial host for a 1 GB Lightsail instance.
#
# Console steps when the AWS CLI is not signed in on the workstation:
#   1. Run `npm run build` on the workstation so public/build exists.
#   2. Create Ubuntu 24.04 at 1 GB, attach a static IP, allow SSH and HTTP.
#   3. Copy the project to /var/www/dtms, including public/build.
#      Leave .env, node_modules, and vendor behind.
#   4. sudo bash deploy/lightsail/setup.sh
#   5. Set APP_URL in /var/www/dtms/.env to http://<static-ip> and run
#      `sudo -u www-data php artisan config:cache`.
#   6. Create one user with the command printed at the end of this script.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
    echo "Run as root: sudo bash deploy/lightsail/setup.sh" >&2
    exit 1
fi

APP_DIR="/var/www/dtms"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASSWORD_FILE="/root/dtms-mysql.password"

if [[ ! -f "${APP_DIR}/artisan" ]]; then
    echo "Copy the project to ${APP_DIR} before running this script." >&2
    exit 1
fi

if [[ ! -f "${APP_DIR}/public/build/manifest.json" ]]; then
    echo "public/build is missing. On your computer run npm run build, then copy public/build to ${APP_DIR}/public/build." >&2
    exit 1
fi

rm -f "${APP_DIR}/public/hot"

if ! swapon --show | grep -q '/swapfile'; then
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
apt-get install -y software-properties-common ca-certificates
add-apt-repository -y ppa:ondrej/php
apt-get update
apt-get install -y \
    nginx \
    mysql-server \
    curl \
    unzip \
    php8.4-cli \
    php8.4-fpm \
    php8.4-mysql \
    php8.4-xml \
    php8.4-mbstring \
    php8.4-curl \
    php8.4-zip \
    php8.4-bcmath \
    php8.4-intl \
    php8.4-opcache
update-alternatives --set php /usr/bin/php8.4

if [[ ! -x /usr/local/bin/composer ]]; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

install -m 644 "${SCRIPT_DIR}/mysql.cnf" /etc/mysql/mysql.conf.d/zz-dtms.cnf
systemctl enable mysql
systemctl restart mysql

if [[ ! -f "${PASSWORD_FILE}" ]]; then
    openssl rand -hex 24 > "${PASSWORD_FILE}"
    chmod 600 "${PASSWORD_FILE}"
fi
DB_PASSWORD="$(tr -d '[:space:]' < "${PASSWORD_FILE}")"

mysql --batch <<SQL
CREATE DATABASE IF NOT EXISTS dtms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dtms'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER 'dtms'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON dtms.* TO 'dtms'@'localhost';
FLUSH PRIVILEGES;
SQL

if [[ ! -f "${APP_DIR}/.env" ]]; then
    cp "${SCRIPT_DIR}/env.production.example" "${APP_DIR}/.env"
fi

python3 - "${APP_DIR}/.env" "${DB_PASSWORD}" <<'PY'
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
password = sys.argv[2]
text = env_path.read_text()
updates = {
    "DB_CONNECTION": "mysql",
    "DB_HOST": "127.0.0.1",
    "DB_PORT": "3306",
    "DB_DATABASE": "dtms",
    "DB_USERNAME": "dtms",
    "DB_PASSWORD": password,
}
lines = text.splitlines()
seen = set()
out = []
for line in lines:
    key = line.split("=", 1)[0]
    if key in updates:
        out.append(f"{key}={updates[key]}")
        seen.add(key)
    else:
        out.append(line)
for key, value in updates.items():
    if key not in seen:
        out.append(f"{key}={value}")
env_path.write_text("\n".join(out) + "\n")
PY
chown www-data:www-data "${APP_DIR}/.env"
chmod 640 "${APP_DIR}/.env"

install -m 644 "${SCRIPT_DIR}/php-fpm.conf" /etc/php/8.4/fpm/pool.d/www.conf
systemctl enable php8.4-fpm
systemctl restart php8.4-fpm

install -m 644 "${SCRIPT_DIR}/tdms.conf" /etc/nginx/sites-available/tdms
ln -sfn /etc/nginx/sites-available/tdms /etc/nginx/sites-enabled/tdms
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

cd "${APP_DIR}"
export COMPOSER_MEMORY_LIMIT=512M
composer install --no-dev --optimize-autoloader --no-interaction

chown -R www-data:www-data storage bootstrap/cache public
chmod -R ug+rwx storage bootstrap/cache

if ! grep -q '^APP_KEY=' .env; then
    echo 'APP_KEY=' >> .env
    chown www-data:www-data .env
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    sudo -u www-data php artisan key:generate --force
fi

sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan storage:link
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan view:cache

echo
echo "MySQL password for user dtms is stored in ${PASSWORD_FILE} and written to ${APP_DIR}/.env."
echo "Set APP_URL in ${APP_DIR}/.env to http://<static-ip>, then run:"
echo "  sudo -u www-data php artisan config:cache"
echo
echo "Mail is written to the log, so create one already-verified user. Replace the email and password:"
echo "  sudo -u www-data php artisan tinker --execute=\"\\App\\Models\\User::create(['name' => 'Admin', 'email' => 'you@example.com', 'password' => \\Illuminate\\Support\\Facades\\Hash::make('choose-a-password'), 'email_verified_at' => now()]);\""
echo
echo "Open http://<static-ip> after APP_URL matches that address."
