'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { OTPLoginSkeleton, FormSkeleton } from '@/components/shared/LoadingSkeleton';

// ✅ Lazy load heavy components for better performance on old devices
const OTPLogin = lazy(() => import('@/components/forms/OTPLogin').then(m => ({ default: m.OTPLogin })));
const RegistrationForm = lazy(() => import('@/components/forms/RegistrationForm').then(m => ({ default: m.RegistrationForm })));
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { exhibitorsApi } from '@/lib/api/exhibitors';
import { useVisitorAuthStore } from '@/lib/store/visitorAuthStore';
import { AlertCircle, ArrowLeft, Building2, Users, Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateRangeShort } from '@/lib/utils/dateFormatter';
import Image from 'next/image';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    exhibitionSlug: string;
    exhibitorSlug: string;
  }>;
}

/**
 * Exhibitor Referral Page - Client Side with OTP Flow
 * Shows co-branded header with both exhibition and exhibitor logos
 * Includes OTP authentication before showing registration form
 */
export default function ExhibitorReferralPage({ params: paramsPromise }: PageProps) {
  const router = useRouter();
  const [exhibitionSlug, setExhibitionSlug] = useState<string>('');
  const [exhibitorSlug, setExhibitorSlug] = useState<string>('');
  const [paramsLoaded, setParamsLoaded] = useState(false);
  
  const [exhibition, setExhibition] = useState<any>(null);
  const [exhibitor, setExhibitor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const { isAuthenticated, clearAuthentication } = useVisitorAuthStore();

  // Load params first (Next.js 15+ async params)
  useEffect(() => {
    const loadParams = async () => {
      const params = await paramsPromise;
      setExhibitionSlug(params.exhibitionSlug);
      setExhibitorSlug(params.exhibitorSlug);
      setParamsLoaded(true);
    };
    loadParams();
  }, [paramsPromise]);

  // Fetch exhibition and exhibitor data
  useEffect(() => {
    if (!paramsLoaded || !exhibitionSlug || !exhibitorSlug) return;

    const fetchData = async () => {

      try {
        const exhibitionData = await exhibitionsApi.getExhibitionBySlug(exhibitionSlug);
        setExhibition(exhibitionData);
        
        const exhibitorData = await exhibitorsApi.getExhibitorBySlug(exhibitionData._id, exhibitorSlug);
        setExhibitor(exhibitorData);
      } catch (error) {
        console.error('[ExhibitorReferralPage] Fetch error:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [exhibitionSlug, exhibitorSlug, paramsLoaded]);

  if (isLoading || !exhibition || !exhibitor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="Loading exhibitor page..." />
      </div>
    );
  }

  const isRegistrationOpen = exhibitionsApi.isRegistrationOpen(exhibition);

  // Helper function to get full image URL
  const getImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const logoUrl = getImageUrl(exhibition.logoUrl);
  const exhibitorLogoUrl = getImageUrl(exhibitor.logo);
  const bannerUrl = getImageUrl(exhibition.bannerImageUrl);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />

      {/* Hero Section with Exhibition Banner - SAME AS DIRECT REGISTRATION */}
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
          {/* Sidebar - Exhibition Info - SAME AS DIRECT REGISTRATION */}
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
                      {format(new Date(exhibition.onsiteStartDate), 'MMM dd')} - {format(new Date(exhibition.onsiteEndDate), 'MMM dd, yyyy')}
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
                      {format(new Date(exhibition.registrationStartDate), 'MMM dd')} - {format(new Date(exhibition.registrationEndDate), 'MMM dd, yyyy')}
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
                  /* Show OTP Login Screen with Exhibitor Context */
                  <>
                    <Suspense fallback={<OTPLoginSkeleton />}>
                      <OTPLogin
                        exhibitionId={exhibition._id || exhibition.id}
                        exhibitionName={exhibition.name}
                        exhibitionLogo={logoUrl}
                        exhibitorLogo={exhibitorLogoUrl}
                        exhibitor={{
                          name: exhibitor.name,
                          companyName: exhibitor.companyName,
                          boothNumber: exhibitor.boothNumber
                        }}
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
                  /* Show Registration Form (NO exhibitor branding) */
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

                    {/* Registration Form - NO EXHIBITOR BRANDING */}
                    <Suspense fallback={<FormSkeleton />}>
                      <RegistrationForm exhibition={exhibition} exhibitor={exhibitor} />
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
                    Registration period: {new Date(exhibition.registrationStartDate).toLocaleDateString()} - {new Date(exhibition.registrationEndDate).toLocaleDateString()}
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

        {/* Exhibition Banner - Full Width Centered (SAME AS DIRECT REGISTRATION) */}
        {bannerUrl && (
          <div className="flex justify-center w-full mt-8">
            <div className="rounded-xl overflow-hidden shadow-lg max-w-4xl w-full">
              <div className="relative w-full h-[400px]">
                <Image
                  src={bannerUrl}
                  alt={`${exhibition.name} banner`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      
      {/* 🔥 reCAPTCHA container - MUST be outside React components and conditional rendering */}
      {/* Required for Firebase Phone Auth - created on-demand during OTP send */}
      <div id="recaptcha-container"></div>
      
      {/* Hide reCAPTCHA badge (notice is now in Footer for ToS compliance) */}
      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
    </div>
  );
}

