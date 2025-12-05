'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRScanner } from '@/components/kiosk/QRScanner';
import { kioskApi, type KioskConfig, type ValidateQRResponse } from '@/lib/api/kiosk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Printer, User, MapPin, Hash, Camera, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { getKioskId } from '@/lib/utils/kioskId';

// ✅ Development-only logging (no console.log in production)
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    devLog('', ...args);
  }
};

const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    devError('', ...args);
  }
};

export default function AutoPrintPage() {
  // State
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [lastPrinted, setLastPrinted] = useState<{name: string; time: Date} | null>(null);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  
  const processingRef = useRef(false);
  const scanBufferRef = useRef('');
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef<KioskConfig | null>(null);
  const lastScannedRef = useRef<{ regNumber: string; timestamp: number } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  // Hardware QR Scanner Support (USB barcode scanner)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Enter key - process the scanned code
      if (e.key === 'Enter') {
        if (scanBufferRef.current.length > 0) {
          devLog('[Hardware Scanner] Detected scan:', scanBufferRef.current);
          handleQRScan(scanBufferRef.current);
          scanBufferRef.current = '';
        }
        return;
      }

      // Accumulate characters
      if (e.key.length === 1) {
        scanBufferRef.current += e.key;

        // Clear buffer after 100ms of no input (in case it's manual typing)
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        scanTimeoutRef.current = setTimeout(() => {
          scanBufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await kioskApi.getConfig();
      setConfig(data);
      configRef.current = data; // Update ref immediately
      
      devLog('Config loaded:', {
        allowRepeatPrinting: data.allowRepeatPrinting,
        autoPrintEnabled: data.autoPrintEnabled,
        enabled: data.enabled
      });
      
      if (!data.enabled) {
        toast.error('Kiosk system is disabled');
        return;
      }
      
      if (!data.autoPrintEnabled) {
        toast.error('Auto-print feature is disabled. Please enable it in Kiosk Settings.');
        return;
      }
      
      // Show success message when manually reloading (not on initial load)
      if (!loading) {
        toast.success('Configuration reloaded successfully', {
          description: `Repeat printing: ${data.allowRepeatPrinting ? 'Enabled ✅' : 'Disabled ❌'}`
        });
      }
    } catch (error: any) {
      devError('Failed to load config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (scannedData: string) => {
    // Prevent duplicate processing
    if (processingRef.current) {
      devLog(' Already processing, ignoring scan');
      return;
    }

    // Prevent scanning before config is loaded
    if (!configRef.current) {
      devLog(' Config not loaded yet, ignoring scan');
      toast.warning('System initializing, please wait...');
      return;
    }

    // Parse the scanned data to extract registration number
    let registrationNumber = scannedData;
    
    try {
      // Try parsing as JSON (if QR code contains full registration object)
      const parsed = JSON.parse(scannedData);
      if (parsed.registrationNumber) {
        registrationNumber = parsed.registrationNumber;
        devLog(' Extracted registration number from JSON:', registrationNumber);
      }
    } catch (e) {
      // Not JSON, check if it's a URL
      if (scannedData.includes('success?id=')) {
        registrationNumber = scannedData.split('success?id=')[1].split('&')[0];
        devLog(' Extracted registration number from URL:', registrationNumber);
      } else {
        // Plain text registration number
        registrationNumber = scannedData.trim();
      }
    }
    
    // 🔒 DUPLICATE SCAN PREVENTION (USB Scanner Protection)
    // Check if this same registration was scanned recently (within 5 seconds)
    const now = Date.now();
    const lastScanned = lastScannedRef.current;
    
    if (lastScanned && lastScanned.regNumber === registrationNumber) {
      const timeSinceLastScan = now - lastScanned.timestamp;
      if (timeSinceLastScan < 5000) { // 5 seconds
        devLog(`🛑 DUPLICATE SCAN BLOCKED - Same registration scanned ${timeSinceLastScan}ms ago`);
        toast.warning('Please wait before scanning again', {
          description: `Last scan was ${Math.round(timeSinceLastScan / 1000)}s ago`,
          duration: 2000,
        });
        return; // Ignore duplicate scan
      }
    }
    
    // Mark as processing and store last scanned info
    processingRef.current = true;
    lastScannedRef.current = { regNumber: registrationNumber, timestamp: now };
    
    await processAndPrint(registrationNumber);
    
    // Allow next scan after 3 seconds (prevents USB scanner rapid-fire)
    // USB scanners can emit 10-20 events per second when QR is visible!
    setTimeout(() => {
      processingRef.current = false;
    }, 3000); // Increased from 500ms to 3000ms (3 seconds)
  };

  const processAndPrint = async (registrationNumber: string) => {
    try {
      setPrinting(true);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
      
      // Get config from ref (always up-to-date)
      const currentConfig = configRef.current;
      if (!currentConfig) {
        devError(' ERROR: Config is null in processAndPrint!');
        toast.error('Configuration error, please refresh the page');
        setPrinting(false);
        return;
      }
      
      // Step 1: Validate QR code
      devLog(' Validating:', registrationNumber);
      const data = await kioskApi.validateQR(registrationNumber);
      devLog(' Validation result:', {
        alreadyCheckedIn: data.alreadyCheckedIn,
        checkInTime: data.checkInTime,
        allowRepeatPrinting: currentConfig.allowRepeatPrinting,
        configLoaded: !!currentConfig,
        visitorName: data.visitor.name
      });
      
      if (data.alreadyCheckedIn && !currentConfig.allowRepeatPrinting) {
        devLog(' ⛔ Already checked in - Repeated printing is DISABLED');
        toast.warning(`${data.visitor.name} is already checked in`, {
          description: `Checked in at ${new Date(data.checkInTime!).toLocaleTimeString()}. Repeated printing is disabled.`,
        });
        setPrinting(false);
        setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        return;
      }
      
      if (data.alreadyCheckedIn && currentConfig.allowRepeatPrinting) {
        devLog(' ✅ Already checked in - Repeated printing is ENABLED - Reprinting badge');
        toast.info(`${data.visitor.name} - Reprinting badge`, {
          description: 'This visitor is already checked in',
        });
      }
      
      // Step 2: Check-in visitor (skip if already checked in)
      if (!data.alreadyCheckedIn) {
        devLog(' Checking in...');
        await kioskApi.checkIn(registrationNumber);
      } else {
        devLog(' Skipping check-in (already checked in)');
      }
      
      // Step 3: Queue print job (NEW - uses Redis queue for better reliability)
      devLog(' Queuing print job...');
      
      if (currentConfig.printTestMode) {
        // Test mode - simulate printing
        devLog(' TEST MODE - Would queue print job');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        toast.success(`✅ TEST MODE: ${data.visitor.name}`, {
          description: 'Print job would be queued in production mode',
        });
      } else {
        // Real printing - queue the job
        const kioskId = getKioskId(); // Get unique kiosk ID from localStorage
        devLog(' Using kiosk ID:', kioskId);
        
        const queueResult = await kioskApi.queuePrintJob(
          registrationNumber,
          currentConfig.printerServiceUrl || 'http://localhost:9100',
          kioskId
        );
        
        devLog('✅ Print job queued:', queueResult);
        devLog(`Job ID: ${queueResult.jobId}, Queue position: ${queueResult.queuePosition}`);
        
        toast.success(`✅ ${data.visitor.name}`, {
          description: `Badge queued for printing (Position: ${queueResult.queuePosition})`,
          duration: 3000,
        });
      }
      
      // Update stats
      setStats(prev => ({ ...prev, success: prev.success + 1 }));
      setLastPrinted({ name: data.visitor.name, time: new Date() });
      
    } catch (error: any) {
      devError(' Error:', error);
      setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      
      if (error.message?.includes('print service')) {
        toast.error('Printer Connection Error', {
          description: 'Cannot connect to print service. Please check if the print service is running.',
        });
      } else {
        toast.error('Auto-Print Failed', {
          description: error.response?.data?.message || error.message || 'Please try again or contact support',
        });
      }
    } finally {
      setPrinting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading auto-print system...</p>
        </div>
      </div>
    );
  }

  // Disabled state
  if (!config?.enabled || !config?.autoPrintEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Auto-Print Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {!config?.enabled 
                ? 'The kiosk system is currently disabled.'
                : 'The auto-print feature is currently disabled. Please enable it in the admin panel under Kiosk Settings.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main auto-print screen
  return (
    <div 
      className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-emerald-100"
      style={{
        backgroundColor: config.themeColor ? `${config.themeColor}10` : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Printer className="h-10 w-10 text-green-600" />
            <h1 className="text-5xl font-bold text-gray-900">
              {config.autoPrintWelcomeMessage || 'Scan QR Code to Print Badge'}
            </h1>
          </div>
          <p className="text-xl text-gray-600">Your badge will print automatically</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - QR Scanner (larger) */}
          <div className="lg:col-span-2">
            <QRScanner
              onScan={handleQRScan}
              onError={(error) => toast.error(error)}
              scanning={!printing}
            />
            
            {printing && (
              <Card className="mt-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
                    <div>
                      <p className="text-xl font-semibold text-yellow-900">
                        Printing your badge...
                      </p>
                      <p className="text-yellow-700">Please wait, do not move</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status & Stats */}
          <div className="space-y-6">
            {/* Last Printed */}
            {lastPrinted && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Last Printed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <p className="font-semibold text-gray-900">{lastPrinted.name}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatTime(lastPrinted.time)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Scans</span>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {stats.total}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600">✓ Successful</span>
                  <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                    {stats.success}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600">✗ Failed</span>
                  <Badge className="bg-red-100 text-red-800 text-lg px-3 py-1">
                    {stats.failed}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Label Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Label Configuration</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadConfig}
                    className="text-xs"
                  >
                    Reload
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium">{config.labelWidth}mm × {config.labelHeight}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Content</span>
                  <span className="font-medium">QR + Name</span>
                </div>
                {config.showLocationOnLabel && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">Location included</span>
                  </div>
                )}
                {config.showRegNumberOnLabel && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="h-3 w-3" />
                    <span className="text-xs">Reg. number included</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Repeat Printing</span>
                    <Badge 
                      variant={config.allowRepeatPrinting ? "default" : "secondary"}
                      className={config.allowRepeatPrinting ? "bg-green-600" : "bg-gray-400"}
                    >
                      {config.allowRepeatPrinting ? "Enabled ✓" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Mode Alert */}
            {config.printTestMode && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Test Mode Active</strong>
                  <br />
                  <span className="text-xs">Printing is simulated. No actual labels will be printed.</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Refresh Button */}
            <Button 
              onClick={loadConfig} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reload Configuration
            </Button>
          </div>
        </div>

        {/* Scanning Methods Info */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Camera Scanning</p>
                  <p className="text-sm text-gray-600">Point QR code at camera above</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="p-3 bg-purple-100 rounded-full">
                  <ScanLine className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Hardware Scanner</p>
                  <p className="text-sm text-gray-600">Use USB barcode/QR scanner device</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center border-t pt-6">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
                <p className="font-semibold text-gray-900">Scan QR Code</p>
                <p className="text-sm text-gray-600">Use camera or hardware scanner</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
                <p className="font-semibold text-gray-900">Auto Processing</p>
                <p className="text-sm text-gray-600">System validates and prints automatically</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
                <p className="font-semibold text-gray-900">Collect Badge</p>
                <p className="text-sm text-gray-600">Pick up your printed label from the printer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

