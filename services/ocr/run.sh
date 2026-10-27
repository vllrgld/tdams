#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi

export OCR_API_TOKEN="${OCR_API_TOKEN:-local-dev-token}"
export WATCHFILES_FORCE_POLLING="${WATCHFILES_FORCE_POLLING:-true}"

exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
