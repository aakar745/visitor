try {
    $htmlPath = "E:\\Project\\visitor\\print-service\\labels\\label-1763100348882.html"
    $printerName = "Brother QL-800"
    
    Write-Host "Attempting to print: $htmlPath"
    Write-Host "Target printer: $printerName"
    
    # Verify printer exists and is online
    $printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue
    if (-not $printer) {
        Write-Error "Printer '$printerName' not found"
        exit 1
    }
    
    Write-Host "Printer found: $($printer.Name) - Status: $($printer.PrinterStatus)"
    
    # Set as default printer
    $WshNetwork = New-Object -ComObject WScript.Network
    $WshNetwork.SetDefaultPrinter($printerName)
    Write-Host "Set as default printer"
    
    # Get initial print job count
    $initialJobs = @(Get-PrintJob -PrinterName $printerName -ErrorAction SilentlyContinue).Count
    Write-Host "Initial print jobs: $initialJobs"
    
    # Method 1: Try IE COM with ExecWB
    try {
        $ie = New-Object -ComObject InternetExplorer.Application
        $ie.Visible = $false
        $ie.Silent = $true
        $ie.Navigate($htmlPath)
        
        # Wait for document to load completely
        $timeout = 0
        while (($ie.Busy -or $ie.ReadyState -ne 4) -and $timeout -lt 50) {
            Start-Sleep -Milliseconds 100
            $timeout++
        }
        
        if ($timeout -ge 50) {
            Write-Host "Timeout waiting for page load, trying anyway..."
        }
        
        # Wait a bit more for rendering
        Start-Sleep -Milliseconds 500
        
        # Print using ExecWB (6 = print, 2 = no prompt)
        $ie.ExecWB(6, 2)
        Write-Host "Print command sent via IE COM"
        
        # Wait for print to spool
        Start-Sleep -Seconds 3
        
        # Check if print job was created
        $finalJobs = @(Get-PrintJob -PrinterName $printerName -ErrorAction SilentlyContinue).Count
        Write-Host "Final print jobs: $finalJobs"
        
        if ($finalJobs -gt $initialJobs) {
            Write-Host "SUCCESS: Print job created!"
        } else {
            Write-Host "WARNING: No new print job detected"
        }
        
        # Clean up IE
        $ie.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ie) | Out-Null
        
    } catch {
        Write-Host "IE method failed: $($_.Exception.Message)"
        Write-Host "Trying alternative method..."
        
        # Method 2: Shell.Application print verb
        $shell = New-Object -ComObject Shell.Application
        $folder = $shell.NameSpace((Split-Path $htmlPath))
        $file = $folder.ParseName((Split-Path $htmlPath -Leaf))
        $file.InvokeVerb("print")
        
        Write-Host "Print initiated via Shell.Application"
        Start-Sleep -Seconds 2
    }
    
    Write-Host "Print process completed"
    exit 0
    
} catch {
    Write-Error "FATAL ERROR: $($_.Exception.Message)"
    exit 1
}