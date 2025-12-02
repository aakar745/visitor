@echo off
echo ========================================
echo   Gujarat Pincode Import Tool
echo ========================================
echo.

echo [1/2] Fetching Gujarat pincodes...
echo This will take ~40-50 minutes
echo.
node fetch-gujarat.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fetch failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Processing data...
node process-gujarat.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Processing failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! 
echo ========================================
echo.
echo Import file created:
echo   data/output/excel/gujarat-bulk-import.csv
echo.
echo Next steps:
echo   1. Open Admin Panel
echo   2. Go to Location Management
echo   3. Click "Bulk Import"
echo   4. Upload: gujarat-bulk-import.csv
echo.
pause

