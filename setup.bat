@echo off
echo ========================================
echo Setting up CIDM Emotion Evaluation System
echo ========================================
echo.

echo [1/3] Setting up Backend...
cd backend

:: Check if venv exists
if exist venv (
    echo Virtual environment already exists.
) else (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo Backend setup complete!
echo.

cd ..

echo [2/3] Setting up Frontend...
cd frontend\vmee-frontend
call npm install
echo Frontend setup complete!
echo.

cd ..\..

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo   1. Run 'start.bat' to start both servers
echo   2. Or manually:
echo      - Backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn main:app --reload
echo      - Frontend: cd frontend\vmee-frontend ^&^& npm run dev
echo.
pause

