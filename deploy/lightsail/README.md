# Updating the Lightsail installation

These instructions use the existing Ubuntu installation at `/var/www/dtms`, PHP 8.4, Nginx, MySQL, `dtms-queue.service`, and `dtms-ocr.service`. `setup.sh` and `setup-ocr.sh` are installation scripts; use `update.sh` for releases. The updater preserves the server `.env`, application key, database records, uploaded documents, and OCR token file. It runs any pending migrations, so take a Lightsail snapshot or a verified database/storage backup before updating.

## 1. Prepare the release on your PC

From `C:\laragon\www\dtms` in PowerShell, using the same source revision you are deploying:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy/lightsail/package.ps1
```

`public/build` is ignored by Git. A commit, push, or server `git pull` does **not** upload it. Upload the entire build folder, including `manifest.json`, `fonts-manifest.json`, all chunks, PDF worker files, and fonts. Do not copy just the main JavaScript or CSS file. Keep older hashed assets on the server during the update so already-open tabs can still load them.

The helper runs TypeScript checks and a production build, verifies referenced assets, and creates `$env:TEMP\dtms-deploy\dtms-release.tar.gz` plus its SHA-256 checksum. The archive contains only `build/` and `lightsail/`. It excludes `.env`, storage, local recovery backups, credentials, dependencies, and the Vite development-server file. If dependencies have changed since your last local install, run `npm ci` before packaging.

Commit and push **all release source**, including new migrations, services, jobs, and deployment files. The helper warns if the working tree has uncommitted changes; the archive cannot replace a source push. Build and deploy matching source. Committing unchanged source after packaging is fine; repackage if application source changes.

Transfer the archive and checksum from **your PC's PowerShell** using your existing Lightsail key and IP:

```powershell
scp -i "C:\Users\villa\Downloads\LightsailDefaultKey-ap-southeast-2.pem" "$env:TEMP\dtms-deploy\dtms-release.tar.gz" "$env:TEMP\dtms-deploy\dtms-release.tar.gz.sha256" ubuntu@32.237.3.53:/tmp/
ssh -i "C:\Users\villa\Downloads\LightsailDefaultKey-ap-southeast-2.pem" ubuntu@32.237.3.53
```

On Lightsail, verify and unpack into a fresh temporary directory:

```bash
cd /tmp
sha256sum -c dtms-release.tar.gz.sha256
RELEASE_DIR=$(mktemp -d /tmp/dtms-release.XXXXXX)
tar -xzf /tmp/dtms-release.tar.gz -C "$RELEASE_DIR"
```

Stop if checksum verification fails. Keep using the same SSH session below so `RELEASE_DIR` stays available. The packaged shell scripts use Linux line endings even when packaged on Windows.

WinSCP/SFTP is an alternative to `scp`. A clone or pull inside the Lightsail terminal retrieves tracked source only; it cannot retrieve this Git-ignored build. If `/var/www/dtms` is already a Git checkout, update it with `git pull` rather than cloning over the live installation. If the existing installation has no `.git` directory, clone into a separate staging directory, then copy source into the app with the exclusions in step 3; keep the existing `.env` and document storage.

## 2. Pause the app before replacing code

SSH into the existing Lightsail instance:

```bash
cd /var/www/dtms
sudo bash "$RELEASE_DIR/lightsail/update.sh" --prepare
```

Use the packaged helper before pulling. This loads the updated shutdown allowance without modifying tracked deployment files in the live checkout.

This enables maintenance mode and waits for the current queue job to finish before stopping the worker. It can take up to seven minutes. Leave the OCR service running until the queue has stopped.

Preparation also makes `storage` and `bootstrap/cache` writable by the app directory's owner and the `www-data` group. Keep the app directory owned by your deployment user (normally `ubuntu`) so Git can update tracked files in these directories. The finishing step reapplies the same ownership instead of transferring these directories exclusively to the web server.

## 3. Copy the latest source and build

If the server has a Git checkout, run as the owner of that checkout:

```bash
git status --short
git branch --show-current
git pull --ff-only
git log -1 --oneline
```

Confirm that the server is on the release branch (`test` in the previous deployment) and that its latest commit matches the release you pushed. If Git reports local modifications or a conflict, resolve those before continuing; do not reset the server checkout blindly. If you deploy through WinSCP/SFTP instead, upload the latest source files now, removing source files that the release deleted. Preserve the server `.env`, `storage/`, `vendor/`, `services/ocr/.venv/`, and `/etc/dtms-ocr.env`. Do not upload the workstation's `bootstrap/cache/*.php`, `public/hot`, `public/storage`, `node_modules`, or Windows `vendor` directory.

If the existing app has **no `.git` directory**, clone into a fresh staging directory instead. Replace the repository URL and choose another staging directory if `/tmp/dtms-source-release` already exists:

```bash
git clone --branch test YOUR_REPOSITORY_URL /tmp/dtms-source-release
cd /tmp/dtms-source-release
git log -1 --oneline
git archive --format=tar HEAD -o /tmp/dtms-source.tar
sudo tar -xf /tmp/dtms-source.tar -C /var/www/dtms
cd /var/www/dtms
```

This copies the repository's tracked source into the existing installation. Git-ignored `.env`, documents, dependencies, and Python virtualenv stay on the server. Files deleted from the repository remain in a tar-copy installation; review release deletions and remove the corresponding obsolete source files only. Do not remove storage or configuration files to match a fresh clone.

Copy the build into the existing public directory without deleting old hashed assets:

```bash
sudo install -d /var/www/dtms/public/build
sudo cp -a "$RELEASE_DIR/build/." /var/www/dtms/public/build/
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

Keep the existing `APP_KEY`, `APP_URL`, database credentials, Paddle/Groq tokens, and `OCR_TOKEN`. Check the server `.env` before running the updater: `APP_ENV=production`, `APP_DEBUG=false`, `QUEUE_CONNECTION=database`, `DB_QUEUE_RETRY_AFTER=420`, and `SCOUT_DRIVER=collection`. Use the application name from `env.production.example`. Mapping now uses `GROQ_API_KEY`; Paddle uses `PADDLE_OCR_TOKEN` and `PADDLE_OCR_MODEL=PP-OCRv6` (see `env.ocr.example`). Old Bedrock, Ollama, and OpenRouter settings are no longer used. Do not copy your local `.env` over the production file.

These releases include office ownership, routing, tracking, audit, endorsement, and status migrations. The updater runs pending migrations with `migrate --force`; it never recreates the database or seeds demo records. Older unassigned documents and cabinets initially belong to Receiving. Review office permissions after deployment, including which offices may take action. The new deletion cleanup retry job uses the same database queue; the updater stops and starts the worker so it loads the new job class and its retry policy.

After editing `.env` outside an update, run:

```bash
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan queue:restart
```

### Existing Nginx configuration

The template now allows 210 seconds for PHP responses, covering the default 180-second Groq mapping timeout. Nginx's [default FastCGI read timeout is 60 seconds](https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_read_timeout). The updater preserves your active Nginx configuration, including any HTTPS settings. In `/etc/nginx/sites-available/tdms`, add or update this directive inside the existing PHP `location` block (use your actual site file if renamed):

```nginx
fastcgi_read_timeout 210s;
```

Then validate before reloading:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Verify the release

```bash
systemctl status php8.4-fpm nginx dtms-queue dtms-ocr --no-pager
curl -fsS http://127.0.0.1/up
curl -fsS http://127.0.0.1:8001/health
sudo -u www-data php artisan migrate:status
sudo -u www-data php artisan route:list --path=documents/upload-options
sudo -u www-data php artisan route:list --path=documents --method=DELETE
sudo -u www-data php artisan queue:failed
```

In the browser, refresh and check command search, the Archive/Route upload choices, recent filing locations, the Date of Letter/Declaration date switch, and all document views. Confirm offices see their own cabinets and documents; check routing, receiving/releasing, status badges, audit, and OCR review. Upload a small disposable document to verify OCR, mapping, and thumbnails. Delete that test document through its card menu and verify removal plus book/folder position adjustment. Check failed jobs if file cleanup reports a retry. If the UI still looks old, hard-refresh with Ctrl+Shift+R and confirm the uploaded build belongs to the same source revision.

## If an update fails

The updater stops at a failed command and does not automatically undo migrations. It leaves maintenance enabled during installation failures and attempts to re-enable it if the final health checks fail. Read the error, fix it, and rerun the updater. Useful logs:

```bash
sudo journalctl -u dtms-queue -u dtms-ocr -n 100 --no-pager
sudo tail -n 100 /var/www/dtms/storage/logs/laravel.log
sudo tail -n 100 /var/log/nginx/error.log
```

If you restore a previous release, restore its matching source and build. Review any applied migrations before reverting code; restoring source alone does not reverse database changes. Keep the site in maintenance mode until the release is consistent. Do not run `key:generate`, `migrate:fresh`, or seeders against the existing installation.

Framework references: [Laravel deployment](https://laravel.com/docs/13.x/deployment), [queue deployment](https://laravel.com/docs/13.x/queues#queue-workers-and-deployment), and [systemd shutdown behavior](https://www.freedesktop.org/software/systemd/man/latest/systemd.kill.html).
