'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, StopCircle, RotateCw, SwitchCamera, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

interface QRScannerProps {
  onScan: (decodedText: string) => Promise<void> | void;
  onError?: (error: string) => void;
  scanning?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, scanning = true }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; timestamp: number } | null>(null);
  const processingRef = useRef<boolean>(false);
  const qrCodeRegionId = 'qr-reader';

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Try to select back camera by default (usually better for QR scanning)
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setErrorMessage('No cameras found on this device. Please use manual input instead.');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        const errorMsg = err.name === 'NotFoundError' 
          ? 'No camera detected. Please connect a camera or use manual input.'
          : 'Failed to access camera. Please check permissions or use manual input.';
        setErrorMessage(errorMsg);
      });

    return () => {
      stopScanning();
    };
  }, []);

  // Auto-start/stop scanning based on props and camera selection
  useEffect(() => {
    if (scanning && selectedCamera && !isProcessing) {
      startScanning();
    } else if (!scanning) {
      stopScanning();
    }
  }, [scanning, selectedCamera]);

  // Handle camera switching - auto-restart scanner with new camera
  useEffect(() => {
    if (isScanning && selectedCamera) {
      handleCameraSwitch();
    }
  }, [selectedCamera]);

  const startScanning = async () => {
    if (!selectedCamera) {
      setErrorMessage('No camera selected');
      return;
    }

    if (scannerRef.current) {
      await stopScanning();
    }

    try {
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10, // Frames per second for scanning
          qrbox: { width: 250, height: 250 }, // QR scanning box size
          aspectRatio: 1.0, // Square scanning area
        },
        async (decodedText) => {
          // ✅ AUTO-PAUSE FLOW: Prevent duplicate scans
          // Check if already processing a scan
          if (processingRef.current) {
            console.log('[QR Scanner] Already processing, ignoring scan');
            return;
          }

          // Debounce: Check if same QR was scanned recently (within 3 seconds)
          const now = Date.now();
          if (
            lastScannedRef.current &&
            lastScannedRef.current.code === decodedText &&
            now - lastScannedRef.current.timestamp < 3000
          ) {
            console.log('[QR Scanner] Duplicate scan ignored (debounced)');
            return;
          }

          // Mark as processing and pause scanning
          processingRef.current = true;
          setIsProcessing(true);
          lastScannedRef.current = { code: decodedText, timestamp: now };
          console.log('[QR Scanner] 🔍 QR Detected - Auto-pausing scanner');

          try {
            // Process the scan (validate, show modal, etc.)
            await onScan(decodedText);
          } catch (error) {
            console.error('[QR Scanner] Scan processing error:', error);
          } finally {
            // ✅ AUTO-RESUME: Resume scanning after processing
            console.log('[QR Scanner] ✅ Processing complete - Auto-resuming scanner');
            setTimeout(() => {
              processingRef.current = false;
              setIsProcessing(false);
            }, 500); // Small delay to prevent immediate re-scan
          }
        },
        () => {
          // Error callback (optional, fires continuously while scanning)
          // Silently ignore - this fires for every frame without QR
        }
      );

      setIsScanning(true);
      setErrorMessage('');
      console.log('[QR Scanner] ✅ Scanner started successfully');
    } catch (err: any) {
      console.error('[QR Scanner] Start error:', err);
      setErrorMessage(err.message || 'Failed to start camera');
      setIsScanning(false);
      processingRef.current = false;
      setIsProcessing(false);
      if (onError) {
        onError(err.message || 'Failed to start camera');
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        processingRef.current = false;
        setIsProcessing(false);
      } catch (err) {
        console.error('[QR Scanner] Stop error:', err);
      }
    }
  };

  const handleRestart = async () => {
    await stopScanning();
    setTimeout(() => startScanning(), 500);
  };

  const handleCameraSwitch = async () => {
    console.log('[QR Scanner] Switching camera...');
    await stopScanning();
    setTimeout(() => startScanning(), 300);
  };

  const switchToNextCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((cam) => cam.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span>QR Code Scanner</span>
          {isProcessing && (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          )}
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {/* Quick Camera Switch Button (for mobile) */}
          {cameras.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={switchToNextCamera}
              disabled={!isScanning}
              title="Switch Camera (Front/Back)"
            >
              <SwitchCamera className="h-4 w-4 mr-2" />
              Switch
            </Button>
          )}
          {isScanning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopScanning}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={startScanning}
              disabled={!selectedCamera}
            >
              <Camera className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            disabled={!isScanning}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Restart
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {cameras.length === 0 && !errorMessage && (
          <Alert className="mb-4">
            <AlertDescription>Loading Cameras...</AlertDescription>
          </Alert>
        )}

        {/* QR Scanner View */}
        <div className="flex flex-col items-center gap-4">
          <div
            id={qrCodeRegionId}
            className={`w-full max-w-md rounded-lg overflow-hidden ${
              isScanning ? 'border-2 border-green-500' : 'border-2 border-dashed border-gray-300'
            }`}
          />

          {isProcessing && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
              <p className="text-yellow-600 font-semibold text-center">
                🔍 Processing QR code...
              </p>
            </div>
          )}

          {isScanning && !isProcessing && (
            <p className="text-green-600 font-semibold text-center">
              📷 Camera Active - Scanning for QR codes...
            </p>
          )}

          {!isScanning && !errorMessage && (
            <p className="text-gray-500 text-center">
              Click "Start" to activate camera
            </p>
          )}
        </div>

        {/* Camera Selection (if multiple cameras available) - Desktop/Tablet View */}
        {cameras.length > 1 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold mb-2">Available Cameras:</p>
            <div className="flex flex-wrap gap-2">
              {cameras.map((camera) => {
                const isFrontCamera = 
                  camera.label.toLowerCase().includes('front') || 
                  camera.label.toLowerCase().includes('user') ||
                  camera.label.toLowerCase().includes('face');
                const isBackCamera = 
                  camera.label.toLowerCase().includes('back') || 
                  camera.label.toLowerCase().includes('rear') ||
                  camera.label.toLowerCase().includes('environment');
                
                let cameraName = camera.label;
                if (isFrontCamera) cameraName = '📱 Front Camera';
                else if (isBackCamera) cameraName = '📷 Back Camera';
                
                return (
                  <Button
                    key={camera.id}
                    variant={selectedCamera === camera.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCamera(camera.id)}
                    disabled={isProcessing}
                  >
                    {cameraName}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Use the "Switch" button for quick camera toggle on mobile
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

