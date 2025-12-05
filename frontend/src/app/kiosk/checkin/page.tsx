'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRScanner } from '@/components/kiosk/QRScanner';
import { kioskApi, type KioskConfig, type ValidateQRResponse, type RecentCheckIn } from '@/lib/api/kiosk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Search, RefreshCw, User, Building, MapPin } from 'lucide-react';
import { toast } from 'sonner';

// ✅ DEDUPLICATION: Minimum time between processing same QR code (prevents double-tap)
const SCAN_COOLDOWN_MS = 3000;

export default function KioskCheckinPage() {
  // State
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinRequired, setPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  
  const [manualInput, setManualInput] = useState('');
  const [processingManual, setProcessingManual] = useState(false);
  
  const [validatedData, setValidatedData] = useState<ValidateQRResponse | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  
  const barcodeBufferRef = useRef('');
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ DEDUPLICATION: Track last processed QR to prevent double-tap
  const lastProcessedRef = useRef<{ regNumber: string; timestamp: number } | null>(null);
  const processingRef = useRef<Set<string>>(new Set()); // Track in-flight requests

  // Load config and check PIN
  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-refresh recent check-ins
  useEffect(() => {
    if (authenticated && config?.showRecentCheckIns) {
      loadRecentCheckIns();
      const interval = setInterval(() => {
        loadRecentCheckIns();
      }, (config.autoRefreshInterval || 10) * 1000);
      return () => clearInterval(interval);
    }
  }, [authenticated, config]);

  // USB Barcode Scanner support
  useEffect(() => {
    if (!authenticated || !config?.enableBarcodeScanner) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Barcode scanners typically send Enter at the end
      if (e.key === 'Enter' && barcodeBufferRef.current) {
        const barcode = barcodeBufferRef.current.trim();
        if (barcode) {
          setManualInput(barcode);
          handleManualSubmit(barcode);
        }
        barcodeBufferRef.current = '';
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
      } else if (e.key.length === 1) {
        // Accumulate characters
        barcodeBufferRef.current += e.key;
        
        // Reset buffer after 100ms of no input (human typing is slower)
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
        barcodeTimeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
    };
  }, [authenticated, config]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await kioskApi.getConfig();
      setConfig(data);
      
      if (!data.enabled) {
        toast.error('Kiosk check-in is currently disabled. Please contact the administrator.');
        return;
      }
      
      if (data.hasPinProtection) {
        setPinRequired(true);
      } else {
        setAuthenticated(true);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load kiosk config:', error);
      }
      toast.error('Failed to load kiosk configuration');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }

    try {
      const result = await kioskApi.validatePin(pinInput);
      if (result.success) {
        setAuthenticated(true);
        setPinRequired(false);
        toast.success('Access granted!');
      } else {
        setPinError('Invalid PIN. Please try again.');
        setPinInput('');
      }
    } catch (error) {
      setPinError('Invalid PIN. Please try again.');
      setPinInput('');
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      setLoadingRecent(true);
      const data = await kioskApi.getRecentCheckIns('all', config?.recentCheckInsLimit || 20);
      setRecentCheckIns(data);
    } catch (error) {
      // Silently fail - recent check-ins list is not critical
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load recent check-ins:', error);
      }
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleQRScan = async (registrationNumber: string) => {
    // Extract registration number from URL if QR contains full URL
    let cleanRegNumber = registrationNumber;
    if (registrationNumber.includes('success?id=')) {
      cleanRegNumber = registrationNumber.split('success?id=')[1].split('&')[0];
    }
    
    await validateAndProcess(cleanRegNumber);
  };

  const handleManualSubmit = async (regNumber?: string) => {
    const registrationNumber = regNumber || manualInput.trim();
    if (!registrationNumber) {
      toast.error('Please enter a registration number');
      return;
    }
    
    setProcessingManual(true);
    await validateAndProcess(registrationNumber);
    setProcessingManual(false);
  };

  const validateAndProcess = useCallback(async (registrationNumber: string) => {
    const normalizedRegNumber = registrationNumber.trim().toUpperCase();
    
    // ✅ DEDUPLICATION: Check if this QR was recently processed
    const now = Date.now();
    const lastProcessed = lastProcessedRef.current;
    if (lastProcessed && 
        lastProcessed.regNumber === normalizedRegNumber && 
        (now - lastProcessed.timestamp) < SCAN_COOLDOWN_MS) {
      // Same QR scanned within cooldown period - ignore
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Check-in] Ignoring duplicate scan: ${normalizedRegNumber}`);
      }
      return;
    }
    
    // ✅ DEDUPLICATION: Check if request is already in-flight
    if (processingRef.current.has(normalizedRegNumber)) {
      toast.info('Processing in progress...', { duration: 1500 });
      return;
    }
    
    // Mark as processing
    processingRef.current.add(normalizedRegNumber);
    lastProcessedRef.current = { regNumber: normalizedRegNumber, timestamp: now };
    
    try {
      const data = await kioskApi.validateQR(normalizedRegNumber);
      
      if (data.alreadyCheckedIn) {
        // Already checked in - show info toast
        toast.info(`${data.visitor.name} is already checked in`, {
          description: `Checked in at ${new Date(data.checkInTime!).toLocaleTimeString()}`,
        });
        setManualInput('');
        return;
      }
      
      // Valid registration - check if auto-check-in is enabled
      if (config?.autoCheckIn) {
        // Auto check-in without confirmation
        await performCheckIn(normalizedRegNumber, data);
      } else {
        // Show confirmation modal
        setValidatedData(data);
        setShowConfirmModal(true);
      }
      
      setManualInput('');
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Validation error:', error);
      }
      toast.error(error.response?.data?.message || 'Invalid QR code or registration not found');
    } finally {
      // Clear processing flag after short delay (allows UI to update)
      setTimeout(() => {
        processingRef.current.delete(normalizedRegNumber);
      }, 500);
    }
  }, [config]);

  const performCheckIn = async (registrationNumber: string, data?: ValidateQRResponse) => {
    const visitorData = data || validatedData;
    if (!visitorData) return;

    try {
      setCheckingIn(true);
      const result = await kioskApi.checkIn(registrationNumber);
      
      // Play success sound if enabled
      if (config?.enableSound) {
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(() => {}); // Ignore if sound file doesn't exist
      }
      
      toast.success(`✅ ${result.visitor.name} checked in successfully!`, {
        description: `Exhibition: ${result.exhibition.name}`,
        duration: 5000,
      });
      
      setShowConfirmModal(false);
      setValidatedData(null);
      
      // Refresh recent check-ins
      if (config?.showRecentCheckIns) {
        loadRecentCheckIns();
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Check-in error:', error);
      }
      
      // ✅ IMPROVED ERROR HANDLING: Show specific message for concurrent scan
      const errorMessage = error.response?.data?.message || 'Check-in failed';
      if (errorMessage.includes('Another kiosk')) {
        toast.error('Processing on another device', {
          description: 'This visitor is being processed by another staff member. Please wait.',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleConfirmCheckIn = () => {
    if (validatedData) {
      performCheckIn(validatedData.registration.registrationNumber);
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading kiosk system...</p>
        </div>
      </div>
    );
  }

  // Kiosk disabled
  if (config && !config.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Kiosk Disabled</CardTitle>
            <CardDescription>
              The kiosk check-in system is currently disabled. Please contact the administrator for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // PIN authentication screen
  if (pinRequired && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Kiosk Access</CardTitle>
            <CardDescription>Enter PIN to access the check-in system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              {pinError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pinError}</AlertDescription>
                </Alert>
              )}
              <Button onClick={handlePinSubmit} className="w-full" size="lg">
                Submit PIN
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main kiosk screen
  return (
    <div 
      className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100"
      style={{
        backgroundColor: config?.themeColor ? `${config.themeColor}10` : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {config?.welcomeMessage || 'Welcome! Please scan your QR code to check in.'}
          </h1>
          <p className="text-gray-600">Scan your registration QR code or enter your registration number</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - QR Scanner */}
          <div className="space-y-6">
            <QRScanner
              onScan={handleQRScan}
              onError={(error) => toast.error(error)}
              scanning={true}
            />
            
            {/* Manual Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Entry</CardTitle>
                <CardDescription>
                  {config?.enableBarcodeScanner 
                    ? '💡 Use USB barcode scanner or type manually'
                    : 'Enter registration number manually'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="REG-12112025-000001"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button
                    onClick={() => handleManualSubmit()}
                    disabled={processingManual || !manualInput.trim()}
                    size="lg"
                  >
                    {processingManual ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Check In
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Check-ins */}
          {config?.showRecentCheckIns && (
            <Card className="lg:max-h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Recent Check-ins
                    </CardTitle>
                    <CardDescription>Last {config.recentCheckInsLimit} check-ins</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadRecentCheckIns}
                    disabled={loadingRecent}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingRecent ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {recentCheckIns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No check-ins yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentCheckIns.map((item, index) => (
                      <div
                        key={`${item.registrationNumber}-${index}`}
                        className="p-4 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-600" />
                              <p className="font-semibold text-gray-900">{item.visitor.name}</p>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                ✓ Checked In
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {item.visitor.company && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-3 w-3" />
                                  <span>{item.visitor.company}</span>
                                </div>
                              )}
                              {(item.visitor.city || item.visitor.state) && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{[item.visitor.city, item.visitor.state].filter(Boolean).join(', ')}</span>
                                </div>
                              )}
                              <p className="text-xs">
                                <strong>{item.exhibitionName}</strong> • {item.registrationNumber} • {formatTime(item.checkInTime)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">✅ Confirm Check-in</DialogTitle>
            <DialogDescription>Please verify the visitor details before check-in</DialogDescription>
          </DialogHeader>
          
          {validatedData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Visitor Name</p>
                  <p className="font-semibold text-lg">{validatedData.visitor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exhibition</p>
                  <p className="font-semibold">{validatedData.exhibition.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{validatedData.visitor.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{validatedData.visitor.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{validatedData.visitor.company || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City, State</p>
                  <p className="font-medium">
                    {[validatedData.visitor.city, validatedData.visitor.state].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {validatedData.registration.registrationNumber}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setValidatedData(null);
              }}
              disabled={checkingIn}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCheckIn}
              disabled={checkingIn}
              size="lg"
              className="min-w-[150px]"
            >
              {checkingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm Check-in
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

