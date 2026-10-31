@echo off
title IELTS Preparation Bot
echo ========================================
echo    IELTS Preparation Bot
echo ========================================
echo.

cd /d "%~dp0"

:: Locate Python
set "PYTHON_CMD="
if exist "C:\Python314\python.exe" (
    set "PYTHON_CMD=C:\Python314\python.exe"
) else (
    python --version >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org
    pause
    exit /b 1
)

:: Check if requirements are installed
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] First run - installing dependencies...
    "%PYTHON_CMD%" -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    echo.
    echo [INFO] Setup complete!
    echo.
) else (
    call venv\Scripts\activate.bat
)

:: Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo.
    echo Creating .env template...
    echo # Get your bot token from @BotFather on Telegram > .env
    echo TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE >> .env
    echo. >> .env
    echo # Each user provides their own AI API key >> .env
    echo # No AI keys needed here >> .env
    echo.
    echo Please edit .env and add your Telegram bot token!
    echo.
    pause
    exit /b 1
)

:: Run the bot
echo [INFO] Starting IELTS Bot...
echo [INFO] Each user will provide their own AI API key
echo [INFO] Press Ctrl+C to stop
echo.
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe ielts_bot.py
) else (
    "%PYTHON_CMD%" ielts_bot.py
)

echo.
echo [INFO] Bot stopped.
pause
