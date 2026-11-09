# 1 GB Lightsail: FastAPI + Paddle OCR + compression

The Laravel trial is installed with `setup.sh`. This package adds **one** queue worker and FastAPI on **127.0.0.1:8001** for Ghostscript compression.

Paddle OCR and Ollama field mapping are HTTPS APIs (almost no RAM). Ghostscript needs CPU and RAM on the box, not a GPU. On 1 GB, keep the **2 GB swap** from `setup.sh` and use **Paddle** in Settings. Local Tesseract as the OCR engine will swap hard or time out.

Do not run `npm run build` on the instance. Build `public/build` on your PC before copy. For later releases, follow [the update guide](README.md) and use `update.sh --ocr` when the OCR code or requirements changed.

## Install

After `sudo bash deploy/lightsail/setup.sh`:

```bash
sudo bash deploy/lightsail/setup-ocr.sh
```

Then paste tokens into `/var/www/dtms/.env`:

```
PADDLE_OCR_TOKEN=
OLLAMA_API_KEY=
```

```bash
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan queue:restart
```

In the app: Settings → OCR → **Paddle**. FastAPI stays loopback (not public). Original uploads are not overwritten; compressed previews go to `documents/ocr/{id}.pdf`.

## Limits on 1 GB / 2 vCPU / 40 GB

- One queue worker, one uvicorn worker. Do not parallelize OCR jobs.
- The queue has a 420-second shutdown allowance so a running 360-second job can finish during an update. Keep `DB_QUEUE_RETRY_AFTER=420` (longer than the worker timeout).
- Ghostscript may use swap (tens of seconds to a few minutes per scan). The job timeout is 360 seconds.
- If compression fails, Paddle text is still saved and the original file is the preview.
- PHP upload cap is 52 MB. Prefer smaller scans.
- 40 GB SSD is enough for the app and declaration files.

## Checks

```bash
swapon --show
systemctl status dtms-ocr dtms-queue
curl -sS http://127.0.0.1:8001/health
```

`/health` should return `{"status":"ok"}`. `http://127.0.0.1:8001/openapi.json` should list `/v1/ocr`, `/v1/pdf`, and `/v1/thumbnail`. Thumbnails are generated through this local service even when Paddle performs OCR remotely, then saved by Laravel under `documents/thumbnails/` on the private storage disk.
