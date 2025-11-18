@echo off
echo ==========================================
echo  Badge Print Service - Installation
echo ==========================================
echo.

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Creating environment file...
if not exist .env (
    echo PORT=9100 > .env
    echo PRINTER_INTERFACE=usb://Brother/QL-800 >> .env
    echo.
    echo ✓ Created .env file
) else (
    echo ✓ .env file already exists
)

echo.
echo [3/3] Testing installation...
node -v

echo.
echo ==========================================
echo  ✓ Installation Complete!
echo ==========================================
echo.
echo Next steps:
echo   1. Connect Brother QL-800 via USB
echo   2. Run: start.bat
echo.
pause

