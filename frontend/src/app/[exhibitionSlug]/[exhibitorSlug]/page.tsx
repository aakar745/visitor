import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { ExhibitionHeader } from '@/components/exhibition/ExhibitionHeader';
import { ExhibitionInfo } from '@/components/exhibition/ExhibitionInfo';
import { ExhibitorBadge } from '@/components/exhibition/ExhibitorBadge';
import { RegistrationForm } from '@/components/forms/RegistrationForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { exhibitorsApi } from '@/lib/api/exhibitors';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    exhibitionSlug: string;
    exhibitorSlug: string;
  }>;
}

// Enable ISR - Revalidate every 60 seconds
export const revalidate = 60;

/**
 * Generate metadata for SEO with timeout protection
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { exhibitionSlug } = await params;
    
    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Metadata fetch timeout')), 3000)
    );
    
    const exhibition = await Promise.race([
      exhibitionsApi.getExhibitionBySlug(exhibitionSlug),
      timeoutPromise
    ]);

    return {
      title: `${exhibition.name} - Registration via Exhibitor`,
      description: `Register for ${exhibition.name} through exhibitor referral`,
    };
  } catch (error) {
    return {
      title: 'Exhibition Registration',
      description: 'Register for upcoming exhibitions',
    };
  }
}

/**
 * Exhibitor Referral Page - Server Side Rendered with timeout protection
 * Shows exhibition details with exhibitor branding and registration form
 */
export default async function ExhibitorReferralPage({ params }: PageProps) {
  const { exhibitionSlug, exhibitorSlug } = await params;
  let exhibition, exhibitor;

  try {
    // Add timeout protection for server-side fetching
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('API timeout')), 5000)
    );

    // Fetch exhibition first with timeout
    exhibition = await Promise.race([
      exhibitionsApi.getExhibitionBySlug(exhibitionSlug),
      timeoutPromise
    ]);

    // Then fetch exhibitor using exhibition ID with timeout
    const exhibitorTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Exhibitor API timeout')), 5000)
    );
    
    exhibitor = await Promise.race([
      exhibitorsApi.getExhibitorBySlug(exhibition._id, exhibitorSlug),
      exhibitorTimeoutPromise
    ]);
  } catch (error: any) {
    console.error('[ExhibitorReferralPage] Fetch error:', error?.message || error);
    notFound();
  }

  const isRegistrationOpen = exhibitionsApi.isRegistrationOpen(exhibition);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exhibitions
          </Link>
        </div>
      </div>

      {/* Exhibition Header */}
      <ExhibitionHeader exhibition={exhibition} />

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Exhibitor Badge */}
            <ExhibitorBadge exhibitor={exhibitor} />

            {/* Exhibition Info */}
            <ExhibitionInfo exhibition={exhibition} />
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            {isRegistrationOpen ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold">Register Now</h2>
                  <p className="mt-1 text-muted-foreground">
                    Complete your registration through {exhibitor.name}
                  </p>
                </div>
                <RegistrationForm exhibition={exhibition} exhibitor={exhibitor} />
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Registration is not currently open</p>
                  <p className="mt-1 text-sm">
                    Registration period: {new Date(exhibition.registrationStartDate).toLocaleDateString()} - {new Date(exhibition.registrationEndDate).toLocaleDateString()}
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading State
 */
export function loading() {
  return (
    <div className="min-h-screen bg-background">
      <LoadingSpinner message="Loading registration page..." />
    </div>
  );
}

