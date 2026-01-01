# PowerShell startup script for CIDM Emotion Evaluation System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting CIDM Emotion Evaluation System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend Server (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate.ps1; uvicorn main:app --reload"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend\vmee-frontend; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers are starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers, close their respective PowerShell windows." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

