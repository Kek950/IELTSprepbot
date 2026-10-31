@echo off
title IELTS Preparation Platform — Unified Suite (Telegram + Web)
echo ======================================================================
echo       IELTS Preparation Platform — Unified Suite (Telegram + Web)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Locate Python
set "PYTHON_CMD="
if exist "venv\Scripts\python.exe" (
    set "PYTHON_CMD=venv\Scripts\python.exe"
) else if exist "C:\Python314\python.exe" (
    set "PYTHON_CMD=C:\Python314\python.exe"
) else (
    python --version >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org
    pause
    exit /b 1
)

:: 2. Ensure virtualenv exists and dependencies installed
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] First run setup: creating virtual environment...
    "%PYTHON_CMD%" -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    set "PYTHON_CMD=venv\Scripts\python.exe"
    echo.
) else (
    call venv\Scripts\activate.bat
    set "PYTHON_CMD=venv\Scripts\python.exe"
)

:: 3. Ensure frontend production bundle exists
if not exist "web\dist\index.html" (
    echo [INFO] Building React web application...
    cd /d "%~dp0web"
    if not exist "node_modules" (
        call npm install
    )
    call npm run build
    cd /d "%~dp0"
    echo.
)

:: 4. Launch unified launcher (starts both Web companion and Telegram Bot)
echo [INFO] Launching IELTS Unified Platform (Web + Telegram)...
"%PYTHON_CMD%" run_all.py
pause
