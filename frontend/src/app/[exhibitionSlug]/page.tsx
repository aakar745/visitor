'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { OTPLogin } from '@/components/forms/OTPLogin';
import { RegistrationForm } from '@/components/forms/RegistrationForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />

      {/* Hero Section with Exhibition Banner */}
      <section className="relative h-[400px] overflow-hidden bg-gradient-to-br from-primary/10 via-purple-50/50 to-pink-50/30">
        {exhibition.bannerImageUrl || exhibition.logoUrl ? (
          <>
            <Image
              src={exhibition.bannerImageUrl || exhibition.logoUrl!}
              alt={exhibition.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-100/50 to-pink-100/30" />
        )}

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto max-w-7xl px-4 h-full flex items-end pb-12">
          <div className="space-y-4 text-white max-w-4xl">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Exhibitions
            </Link>

            {isRegistrationOpen && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Registration Open
                </div>
              </Badge>
            )}

            <h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg">
              {exhibition.name}
            </h1>

            {exhibition.tagline && (
              <p className="text-xl text-white/90 drop-shadow">
                {exhibition.tagline}
              </p>
            )}

            {/* Quick Info Pills */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {formatDateRangeShort(exhibition.onsiteStartDate, exhibition.onsiteEndDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium line-clamp-1">
                  {exhibition.venue}
                </span>
              </div>
              {exhibition.isPaid && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Paid Event</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12 flex-1">
        <div className="grid gap-8 lg:grid-cols-3">
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

            {/* Description Card */}
            {exhibition.description && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">About This Event</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {exhibition.description}
                </p>
              </Card>
            )}
          </div>

          {/* Main Content - OTP Login or Registration Form */}
          <div className="lg:col-span-2">
            {isRegistrationOpen ? (
              <div className="space-y-6">
                {!showForm ? (
                  /* Show OTP Login Screen */
                  <>
                   

                    {/* OTP Login Component */}
                    <OTPLogin
                      exhibitionId={exhibition._id || exhibition.id}
                      exhibitionName={exhibition.name}
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
                  </>
                ) : (
                  /* Show Registration Form */
                  <>
                    {/* Form Header with Logout Option */}
                    <Card className="p-6 bg-gradient-to-r from-primary/5 via-purple-50/50 to-pink-50/30 border-2 border-primary/10">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white flex-shrink-0">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold mb-1">Complete Registration</h2>
                          <p className="text-muted-foreground">
                            Fill in your details below to complete your registration
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            clearAuthentication();
                            setShowForm(false);
                          }}
                        >
                          Change Number
                        </Button>
                      </div>
                    </Card>

                    {/* Registration Form */}
                    <RegistrationForm exhibition={exhibition} />
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
      </div>

      <Footer />
    </div>
  );
}

