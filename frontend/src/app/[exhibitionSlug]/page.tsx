'use client';

import { useState, lazy, Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { OTPLoginSkeleton, FormSkeleton } from '@/components/shared/LoadingSkeleton';

// ✅ Lazy load heavy components for better performance on old devices
const OTPLogin = lazy(() => import('@/components/forms/OTPLogin').then(m => ({ default: m.OTPLogin })));
const RegistrationForm = lazy(() => import('@/components/forms/RegistrationForm').then(m => ({ default: m.RegistrationForm })));
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { formatDateRangeShort } from '@/lib/utils/dateFormatter';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PageProps {
  params: Promise<{
    exhibitionSlug: string;
  }>;
}

/**
 * Exhibition Page - Modern Design with OTP Authentication
 * Client Side Component for interactivity
 */
export default function ExhibitionPage({ params: paramsPromise }: PageProps) {
  const router = useRouter();
  const [exhibitionSlug, setExhibitionSlug] = useState<string>('');
  const [paramsLoaded, setParamsLoaded] = useState(false);
  
  const [exhibition, setExhibition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const { isAuthenticated, clearAuthentication } = useVisitorAuthStore();

  // Load params first (Next.js 15+ async params)
  useEffect(() => {
    const loadParams = async () => {
      const params = await paramsPromise;
      setExhibitionSlug(params.exhibitionSlug);
      setParamsLoaded(true);
    };
    loadParams();
  }, [paramsPromise]);

  // Fetch exhibition data
  useEffect(() => {
    if (!paramsLoaded || !exhibitionSlug) return;

    const fetchExhibition = async () => {
      try {
        const data = await exhibitionsApi.getExhibitionBySlug(exhibitionSlug);
        setExhibition(data);
      } catch (error) {
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchExhibition();
  }, [exhibitionSlug, paramsLoaded]);

  if (isLoading || !exhibition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="Loading exhibition details..." />
      </div>
    );
  }

  const isRegistrationOpen = exhibitionsApi.isRegistrationOpen(exhibition);

  // Helper function to get full image URL
  const getImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    // If already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, prepend API base URL (remove /api/v1 suffix)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const bannerUrl = getImageUrl(exhibition.bannerImageUrl);
  const logoUrl = getImageUrl(exhibition.logoUrl);

  // Debug logging
  console.log('[Exhibition Page] Exhibition data:', {
    name: exhibition.name,
    bannerImageUrl: exhibition.bannerImageUrl,
    logoUrl: exhibition.logoUrl,
    processedBannerUrl: bannerUrl,
    processedLogoUrl: logoUrl,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />

      {/* Hero Section with Exhibition Banner */}
      <section className="relative h-[400px] overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        {/* Hero Content */}
        <div className="container relative z-10 mx-auto max-w-7xl px-4 h-full flex flex-col justify-end pb-12">
          <div className="text-white max-w-4xl space-y-8">
            {/* Back Button */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20 shadow-lg font-medium w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Exhibitions
            </Link>

            {/* Title Section */}
            <div className="space-y-4">
              {/* Registration Badge */}
              {isRegistrationOpen && (
                <div>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-2xl text-sm font-semibold px-5 py-2.5 rounded-full inline-flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Registration Open
                  </Badge>
                </div>
              )}

              {/* Exhibition Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-2xl tracking-tight leading-tight">
                {exhibition.name}
              </h1>

              {/* Tagline */}
              {exhibition.tagline && (
                <p className="text-base sm:text-lg md:text-xl text-white/95 drop-shadow-lg font-medium max-w-3xl">
                  {exhibition.tagline}
                </p>
              )}

              {/* About This Event */}
              {exhibition.description && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-3xl">
                  <h3 className="text-lg font-semibold mb-3 text-white">About This Event</h3>
                  <p className="text-white/90 leading-relaxed">
                    {exhibition.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12 flex-1">
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          {/* Sidebar - Exhibition Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Details Card */}
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground">Event Dates</div>
                    <div className="text-sm font-semibold mt-0.5">
                      {formatDateRangeShort(exhibition.onsiteStartDate, exhibition.onsiteEndDate)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 flex-shrink-0">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground">Registration Period</div>
                    <div className="text-sm font-semibold mt-0.5">
                      {formatDateRangeShort(exhibition.registrationStartDate, exhibition.registrationEndDate)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground">Venue</div>
                    <div className="text-sm font-semibold mt-0.5">
                      {exhibition.venue}
                    </div>
                  </div>
                </div>

                {exhibition.isPaid && exhibition.pricingTiers && exhibition.pricingTiers.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 flex-shrink-0">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground">Pricing</div>
                        <div className="text-sm font-semibold mt-0.5">
                          From ₹{Math.min(...exhibition.pricingTiers.map((t: any) => t.price))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content - OTP Login or Registration Form */}
          <div className="lg:col-span-2">
            {isRegistrationOpen ? (
              <div className="space-y-6">
                {!showForm ? (
                  /* Show OTP Login Screen */
                  <>
                   

                    {/* OTP Login Component - Lazy Loaded */}
                    <Suspense fallback={<OTPLoginSkeleton />}>
                      <OTPLogin
                        exhibitionId={exhibition._id || exhibition.id}
                        exhibitionName={exhibition.name}
                        exhibitionLogo={logoUrl}
                        exhibitorLogo={undefined}
                        exhibitor={undefined} // Direct registration (no exhibitor)
                        onAuthSuccess={(hasExistingRegistration, registrationId) => {
                          if (hasExistingRegistration && registrationId) {
                            // Redirect to success page with existing registration
                            router.push(`/success?registrationId=${registrationId}`);
                          } else {
                            // Show registration form
                            setShowForm(true);
                          }
                        }}
                      />
                    </Suspense>
                  </>
                ) : (
                  /* Show Registration Form */
                  <>
                    {/* Form Header with Logout Option */}
                    <Card className="px-4 py-3 bg-gradient-to-r from-primary/5 via-purple-50/30 to-background border border-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white flex-shrink-0">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold">Complete Registration</h2>
                          <p className="text-sm text-muted-foreground">
                            Fill in your details to complete registration
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 text-sm"
                          onClick={() => {
                            clearAuthentication();
                            setShowForm(false);
                          }}
                        >
                          Change Number
                        </Button>
                      </div>
                    </Card>

                    {/* Registration Form - Lazy Loaded */}
                    <Suspense fallback={<FormSkeleton />}>
                      <RegistrationForm exhibition={exhibition} />
                    </Suspense>
                  </>
                )}
              </div>
            ) : (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  <p className="font-semibold text-base mb-2">Registration is Currently Closed</p>
                  <p className="text-sm">
                    Registration period: {formatDateRangeShort(exhibition.registrationStartDate, exhibition.registrationEndDate)}
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      View Other Exhibitions
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Exhibition Banner - Full Width Centered */}
        {bannerUrl && (
          <div className="flex justify-center w-full mt-8">
            <div className="rounded-xl overflow-hidden shadow-lg w-full" style={{ maxWidth: '2000px' }}>
              <Image
                src={bannerUrl}
                alt={`${exhibition.name} banner`}
                width={2000}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
      </div>

      <Footer />
      
      {/* 🔥 reCAPTCHA container - MUST be outside React components and conditional rendering */}
      {/* Required for Firebase Phone Auth - created on-demand during OTP send */}
      <div id="recaptcha-container"></div>
      
      {/* Hide reCAPTCHA badge (Google's terms require showing alternative notice) */}
      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
      
      {/* reCAPTCHA Terms Notice (required when hiding badge) */}
      <div className="fixed bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm z-50">
        Protected by <a href="https://www.google.com/recaptcha/about/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">reCAPTCHA</a>
      </div>
    </div>
  );
}

