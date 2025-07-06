@echo off
REM Food Allergen Tracker - Windows Startup Script
REM This script sets up the food allergen tracker to start automatically on Windows

echo Setting up Food Allergen Tracker for automatic startup on Windows...

REM Get the current directory
set SCRIPT_DIR=%~dp0

REM Install pm2-windows-service globally if not already installed
echo Installing PM2 Windows Service...
npm install -g pm2-windows-service

REM Install the Windows service
echo Creating Windows service...
pm2-service-install -n "FoodAllergenTracker"

REM Start PM2 and the application
echo Starting the service...
pm2 start "%SCRIPT_DIR%ecosystem.config.js"

REM Save PM2 configuration
pm2 save

echo.
echo ✅ Food Allergen Tracker has been set up to start automatically!
echo The app will start on boot and restart if it crashes.
echo.
echo To manually control the service:
echo   Start:   pm2 start food-allergen-tracker
echo   Stop:    pm2 stop food-allergen-tracker
echo   Status:  pm2 status
echo   Restart: pm2 restart food-allergen-tracker
echo.
echo Logs are saved in: %SCRIPT_DIR%logs\
echo PM2 logs: pm2 logs food-allergen-tracker
echo.
pause