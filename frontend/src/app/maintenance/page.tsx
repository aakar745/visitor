'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MaintenancePage() {
  const router = useRouter();
  const [maintenanceInfo, setMaintenanceInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Fetch maintenance info
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/settings/public/maintenance')
      .then(res => res.json())
      .then(data => {
        setMaintenanceInfo(data.data || data);
      })
      .catch(console.error);
  }, []);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/settings/public/maintenance');
      const data = await response.json();
      const status = data.data || data;
      
      if (!status.enabled) {
        // Maintenance mode is off, redirect to home
        router.push('/');
      } else {
        setMaintenanceInfo(status);
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 shadow-2xl bg-white/95 backdrop-blur-sm">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-[#4A7090] rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary to-[#4A7090] p-6 rounded-full">
                <AlertTriangle className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-[#4A7090] bg-clip-text text-transparent">
              Under Maintenance
            </h1>
            <p className="text-lg text-muted-foreground">
              We're currently performing scheduled maintenance
            </p>
          </div>

          {/* Message */}
          {maintenanceInfo?.message && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <p className="text-foreground">{maintenanceInfo.message}</p>
            </Card>
          )}

          {/* Started Time */}
          {maintenanceInfo?.startedAt && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Started: {new Date(maintenanceInfo.startedAt).toLocaleString()}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="space-y-3 text-muted-foreground">
            <p>We apologize for any inconvenience.</p>
            <p className="text-sm">
              Our system will be back online shortly. Thank you for your patience.
            </p>
          </div>

          {/* Check Status Button */}
          <div className="pt-4">
            <Button
              onClick={checkStatus}
              disabled={isChecking}
              size="lg"
              className="bg-gradient-to-r from-primary to-[#4A7090] hover:from-primary/90 hover:to-[#4A7090]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>
          </div>

          {/* Contact Info */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Need urgent assistance?{' '}
              <a href="mailto:support@example.com" className="text-primary hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

