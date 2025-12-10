# PowerShell setup script for CIDM Emotion Evaluation System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up CIDM Emotion Evaluation System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Write-Host "[1/3] Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (Test-Path "venv") {
    Write-Host "Virtual environment already exists." -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\activate.ps1"
pip install -r requirements.txt

Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Frontend Setup
Write-Host "[2/3] Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend\vmee-frontend
npm install
Write-Host "Frontend setup complete!" -ForegroundColor Green
Write-Host ""

Set-Location ..\..

# Completion Message
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host "  1. Run 'start.bat' or 'start.ps1' to start both servers" -ForegroundColor White
Write-Host "  2. Or manually:" -ForegroundColor White
Write-Host "     - Backend: cd backend && .\venv\Scripts\activate && uvicorn main:app --reload" -ForegroundColor Gray
Write-Host "     - Frontend: cd frontend\vmee-frontend && npm run dev" -ForegroundColor Gray
Write-Host ""

