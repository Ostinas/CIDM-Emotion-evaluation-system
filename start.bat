@echo off
echo ========================================
echo Starting CIDM Emotion Evaluation System
echo ========================================
echo.
echo Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd frontend\vmee-frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Close this window when done.
echo To stop servers, close their respective windows.
echo ========================================

