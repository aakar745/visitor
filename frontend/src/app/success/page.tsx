'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CheckCircle2, Download, Mail, Home, Calendar, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRegistrationDetails } from '@/lib/hooks/useRegistration';

/**
 * Success Page - Shown after successful registration
 */
export default function SuccessPage() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('registrationId');
  
  const { data: registration, isLoading } = useRegistrationDetails(registrationId);

  // Function to download badge (or fallback to QR code)
  const downloadBadge = async () => {
    // Prefer badge URL (full branded badge), fallback to plain QR code
    const downloadUrl = registration?.badgeUrl || registration?.qrCode;
    if (!downloadUrl) return;
    
    try {
      // For data URLs, download directly
      if (downloadUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `badge-${registration.registration.registrationNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // For HTTP URLs (badgeUrl), fetch as blob to force download
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `badge-${registration.registration.registrationNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />

      <div className="container mx-auto max-w-4xl px-4 py-20 flex-1 flex items-center">
        <Card className="w-full p-12 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading registration details...</p>
            </div>
          ) : (
            <>
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Registration Successful!
              </h1>

              {/* Registration Number */}
              {registration?.registration.registrationNumber && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Your Registration Number</p>
                  <div className="inline-block px-6 py-3 bg-primary/10 border-2 border-primary rounded-lg">
                    <p className="text-2xl font-mono font-bold text-primary">
                      {registration.registration.registrationNumber}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Thank you for registering! We've sent a confirmation email with your visitor badge. 
                Please check your inbox and spam folder.
              </p>

              {/* Visitor Badge Display (Enterprise Design) */}
              {(registration?.badgeUrl || registration?.qrCode) && (
                <div className="mb-8">
                  <div className="inline-block p-6 bg-white rounded-lg shadow-2xl border-2 border-primary/20">
                    <img 
                      src={registration.badgeUrl || registration.qrCode} 
                      alt="Visitor Badge" 
                      className={registration.badgeUrl ? "w-full max-w-md mx-auto" : "w-64 h-64 mx-auto"}
                      style={{ maxHeight: '600px' }}
                    />
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      {registration.badgeUrl ? 'Show this badge at the venue' : 'Show this QR code at the venue'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={downloadBadge}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {registration.badgeUrl ? 'Download Visitor Badge' : 'Download QR Code'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!isLoading && (
            <>
              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-muted/50">
                  <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Check Your Email</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirmation sent
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Download className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">QR Code Ready</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download above
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-6 w-6 text-pink-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Event Reminder</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll remind you
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-purple-600">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Back to Home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/" className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Browse More Events
              </Link>
            </Button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-muted-foreground mt-8">
            Need help? Contact us at{' '}
            <a href="mailto:info@exhibithub.com" className="text-primary hover:underline">
              info@exhibithub.com
            </a>
              </p>
            </>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
}
