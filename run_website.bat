@echo off
title IELTS Prep Bot — React Web Suite
echo ========================================================
echo    IELTS Preparation Bot — React + Vite Web Suite
echo ========================================================
echo.
cd /d "%~dp0web"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo Installing node dependencies...
    call npm install
)

echo.
echo [2/2] Starting React Vite dev server...
echo The website will open in your browser automatically at http://localhost:5173
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173
npm run dev
pause
