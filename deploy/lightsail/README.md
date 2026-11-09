# Updating the Lightsail installation

These instructions use the existing Ubuntu installation at `/var/www/dtms`, PHP 8.4, Nginx, MySQL, `dtms-queue.service`, and `dtms-ocr.service`. `setup.sh` and `setup-ocr.sh` are installation scripts; use `update.sh` for releases. The updater preserves the server `.env`, application key, database records, uploaded documents, and OCR token file. It runs any pending migrations, so take a Lightsail snapshot or a verified database/storage backup before updating.

## 1. Build the React app on your PC

From `C:\laragon\www\dtms` in PowerShell, using the same source revision you are deploying:

```powershell
npm ci
npm run build
tar -czf "$env:TEMP\dtms-build.tar.gz" -C public build
```

`public/build` is ignored by Git. A commit, push, or server `git pull` does **not** upload it. Upload the entire build folder, including `manifest.json`, `fonts-manifest.json`, all chunks, PDF worker files, and fonts. Do not copy just the main JavaScript or CSS file. Keep older hashed assets on the server during the update so already-open tabs can still load them.

Commit and push the updated deployment files along with your release. For the first update using this helper, transfer the deployment folder to a temporary directory on the server first. Later updates can use the already-installed helper before pulling the new source.

Transfer the build archive from **your PC's PowerShell**, replacing the key path and static IP:

```powershell
scp -i "C:\path\LightsailKey.pem" "$env:TEMP\dtms-build.tar.gz" ubuntu@YOUR_STATIC_IP:/tmp/dtms-build.tar.gz
```

For that first helper installation, you can also copy the deployment folder from your PC:

```powershell
scp -i "C:\path\LightsailKey.pem" -r deploy/lightsail ubuntu@YOUR_STATIC_IP:/tmp/dtms-lightsail
```

WinSCP/SFTP is an alternative to `scp`. A clone or pull inside the Lightsail terminal retrieves tracked source only; it cannot retrieve this Git-ignored build. If `/var/www/dtms` is already a Git checkout, update it with `git pull` rather than cloning over the live installation. If the existing installation has no `.git` directory, clone into a separate staging directory, then copy source into the app with the exclusions in step 3; keep the existing `.env` and document storage.

## 2. Pause the app before replacing code

SSH into the existing Lightsail instance:

```bash
cd /var/www/dtms
sudo bash /tmp/dtms-lightsail/update.sh --prepare
```

For later updates, once the helper is in the live checkout, use `sudo bash deploy/lightsail/update.sh --prepare` instead. Running the temporary helper on the first update avoids creating uncommitted changes in the live Git checkout before pulling.

This enables maintenance mode and waits for the current queue job to finish before stopping the worker. It can take up to seven minutes. Leave the OCR service running until the queue has stopped.

## 3. Copy the latest source and build

If the server has a Git checkout, run as the owner of that checkout:

```bash
git status --short
git pull --ff-only
git log -1 --oneline
```

If Git reports local modifications or a conflict, resolve those before continuing; do not reset the server checkout blindly. If you deploy through WinSCP/SFTP instead, upload the latest source files now, removing source files that the release deleted. Preserve the server `.env`, `storage/`, `vendor/`, `services/ocr/.venv/`, and `/etc/dtms-ocr.env`. Do not upload the workstation's `bootstrap/cache/*.php`, `public/hot`, `public/storage`, `node_modules`, or Windows `vendor` directory.

If the existing app has **no `.git` directory**, clone into a fresh staging directory instead. Replace the repository URL and choose another staging directory if `/tmp/dtms-release` already exists:

```bash
git clone YOUR_REPOSITORY_URL /tmp/dtms-release
cd /tmp/dtms-release
git log -1 --oneline
git archive --format=tar HEAD -o /tmp/dtms-source.tar
sudo tar -xf /tmp/dtms-source.tar -C /var/www/dtms
cd /var/www/dtms
```

This copies the repository's tracked source into the existing installation. Git-ignored `.env`, documents, dependencies, and Python virtualenv stay on the server. Files deleted from the repository remain in a tar-copy installation; review release deletions and remove the corresponding obsolete source files only. Do not remove storage or configuration files to match a fresh clone.

Extract the build into the existing public directory without deleting old hashed assets:

```bash
sudo tar -xzf /tmp/dtms-build.tar.gz -C /var/www/dtms/public
```

If you already copied the latest source and build, continue to step 4. Pushing to the remote Git repository alone is not the same as updating the Lightsail checkout.

## 4. Finish the update

For React and Laravel changes:

```bash
cd /var/www/dtms
sudo bash deploy/lightsail/update.sh
```

If `services/ocr` Python files or `requirements.txt` changed since the server's last release, use this **instead**:

```bash
sudo bash deploy/lightsail/update.sh --ocr
```

The updater checks build assets, installs locked production Composer dependencies, applies pending migrations, rebuilds configuration/event/route/view caches, reloads PHP-FPM, brings the app online, starts the queue, and checks `/up`. `--ocr` also installs the existing OCR requirements, updates its service definition, restarts it, and checks `/health`. It does not run npm on the 1 GB instance or replace Nginx, MySQL, or PHP pool configuration. Do not rerun `setup.sh` for an ordinary update.

The command search and latest toolbar/upload changes do not add environment variables. Keep the existing `APP_KEY`, `APP_URL`, database credentials, Paddle/Ollama tokens, and `OCR_TOKEN`. Ensure `DB_QUEUE_RETRY_AFTER=420` in the production `.env`. After editing `.env` outside an update, run:

```bash
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan queue:restart
```

## 5. Verify the release

```bash
systemctl status php8.4-fpm nginx dtms-queue dtms-ocr --no-pager
curl -fsS http://127.0.0.1/up
curl -fsS http://127.0.0.1:8001/health
sudo -u www-data php artisan migrate:status
sudo -u www-data php artisan route:list --path=documents/upload-options
```

In the browser, refresh and check command search (including Upload and Accessibility), the header Upload dialog, Dates/Sort/Clear filters, and all document views. Upload one small test document to verify queue processing and stored thumbnails. If the UI still looks old, hard-refresh with Ctrl+Shift+R and confirm the uploaded build belongs to the same source revision.

## If an update fails

The updater stops at a failed command and does not automatically undo migrations. It leaves maintenance enabled during installation failures and attempts to re-enable it if the final health checks fail. Read the error, fix it, and rerun the updater. Useful logs:

```bash
sudo journalctl -u dtms-queue -u dtms-ocr -n 100 --no-pager
sudo tail -n 100 /var/www/dtms/storage/logs/laravel.log
sudo tail -n 100 /var/log/nginx/error.log
```

If you restore a previous release, restore its matching source and build. Review any applied migrations before reverting code; restoring source alone does not reverse database changes. Keep the site in maintenance mode until the release is consistent. Do not run `key:generate`, `migrate:fresh`, or seeders against the existing installation.

Framework references: [Laravel deployment](https://laravel.com/docs/13.x/deployment), [queue deployment](https://laravel.com/docs/13.x/queues#queue-workers-and-deployment), and [systemd shutdown behavior](https://www.freedesktop.org/software/systemd/man/latest/systemd.kill.html).
