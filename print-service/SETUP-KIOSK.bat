@echo off
SETLOCAL EnableDelayedExpansion

:: ============================================
:: KIOSK AUTO-PRINT INSTALLER
:: For Brother QL-800 Label Printer
:: ============================================

echo.
echo ========================================================
echo    KIOSK AUTO-PRINT INSTALLER
echo    For Brother QL-800 Label Printer
echo ========================================================
echo.
echo This will install and configure the print service
echo to run automatically on Windows startup.
echo.
pause

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Administrator rights required!
    echo Please right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Node.js installation...
node -v >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18 or higher from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo     ✓ Node.js is installed
node -v

echo.
echo [2/6] Installing dependencies...
call npm install --production --silent
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo     ✓ Dependencies installed

echo.
echo [3/6] Creating configuration...
if not exist .env (
    (
        echo PORT=9100
        echo PRINTER_INTERFACE=usb://Brother/QL-800
    ) > .env
    echo     ✓ Configuration created
) else (
    echo     ✓ Configuration already exists
)

echo.
echo [4/6] Creating Windows Task Scheduler entry...
set "TASK_NAME=BadgePrintService"
set "SCRIPT_PATH=%CD%\server.js"

:: Delete existing task if it exists
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

:: Create new task
schtasks /Create /TN "%TASK_NAME%" /TR "node.exe \"%SCRIPT_PATH%\"" /SC ONSTART /RU SYSTEM /RL HIGHEST /F >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Failed to create Windows Task
    pause
    exit /b 1
)
echo     ✓ Auto-start configured

echo.
echo [5/6] Creating desktop shortcut...
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Print Service.lnk"
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'node.exe'; $Shortcut.Arguments = '\"%SCRIPT_PATH%\"'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Save()"
echo     ✓ Desktop shortcut created

echo.
echo [6/6] Starting service...
start "Badge Print Service" /MIN node.exe "%SCRIPT_PATH%"
timeout /t 3 /nobreak >nul
echo     ✓ Service started

echo.
echo ========================================================
echo    ✓ INSTALLATION COMPLETE!
echo ========================================================
echo.
echo The print service is now running and will auto-start
echo on Windows boot.
echo.
echo Service URL: http://localhost:9100
echo.
echo Desktop shortcut created: "Print Service.lnk"
echo.
echo To test: Open browser to http://localhost:9100/health
echo.
pause

