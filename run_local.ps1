<#
Simple helper to prepare and run the app locally on Windows PowerShell.

Usage: Open PowerShell in the repo root and run:
  .\run_local.ps1

This script will:
 - create a virtual environment in `.venv` if missing
 - install Python requirements
 - build the frontend (`frontend/dist`) using `npm` (requires Node.js)
 - start the backend with uvicorn at http://127.0.0.1:8000

Notes:
 - If you want to use Postgres locally, set `DATABASE_URL` in `stocksml.env` before running.
 - The script assumes you have `python` and `npm` available on PATH.
#>

$ErrorActionPreference = 'Stop'

Write-Host "Starting local run helper..." -ForegroundColor Cyan

if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment .venv" -ForegroundColor Green
    python -m venv .venv
}

Write-Host "Activating virtual environment" -ForegroundColor Green
& .\.venv\Scripts\Activate.ps1

Write-Host "Installing Python requirements" -ForegroundColor Green
pip install --upgrade pip
pip install -r requirements.txt

if (Test-Path "frontend") {
    Write-Host "Building frontend (this may take a minute)..." -ForegroundColor Green
    Push-Location frontend
    npm ci
    npm run build
    Pop-Location
} else {
    Write-Host "No frontend folder found, skipping frontend build" -ForegroundColor Yellow
}

Write-Host "Starting backend (uvicorn) at http://127.0.0.1:8000" -ForegroundColor Cyan
uvicorn backend.main:app --reload --port 8000
