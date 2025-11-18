@echo off
:: ============================================
:: KIOSK AUTO-PRINT UNINSTALLER
:: ============================================

echo.
echo ========================================================
echo    UNINSTALL KIOSK AUTO-PRINT SERVICE
echo ========================================================
echo.
pause

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator rights required!
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo [1/3] Stopping service...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Badge Print Service*" >nul 2>&1
echo     ✓ Service stopped

echo.
echo [2/3] Removing auto-start...
schtasks /Delete /TN "BadgePrintService" /F >nul 2>&1
echo     ✓ Auto-start removed

echo.
echo [3/3] Removing desktop shortcut...
del "%USERPROFILE%\Desktop\Print Service.lnk" >nul 2>&1
echo     ✓ Shortcut removed

echo.
echo ========================================================
echo    ✓ UNINSTALL COMPLETE!
echo ========================================================
echo.
pause

