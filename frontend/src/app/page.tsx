import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Users, 
  Zap, 
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { Exhibition } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';

// Enable ISR - Revalidate every 60 seconds
// This caches the page and revalidates in background
export const revalidate = 60;

// Handle errors gracefully without crashing
export const dynamicParams = true;

/**
 * Home Page - Modern Design with Hero Section
 * Server Side Rendered for SEO with graceful fallback
 */
export default async function HomePage() {
  // Fetch exhibitions server-side for SEO with timeout and error handling
  let exhibitions: Exhibition[] = [];
  
  try {
    // Add timeout protection for server-side fetching
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('API timeout')), 5000)
    );
    
    exhibitions = await Promise.race([
      exhibitionsApi.getActiveExhibitions(),
      timeoutPromise
    ]);
  } catch (error: any) {
    // Gracefully handle errors - don't crash the page
    console.error('[HomePage] Failed to fetch exhibitions:', error?.message || error);
    console.log('[HomePage] Rendering page with empty exhibitions list');
    exhibitions = [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-purple-50/50 to-background dark:from-primary/10 dark:via-purple-950/20 dark:to-background">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="container relative mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                <Sparkles className="h-4 w-4" />
                <span>Your Gateway to Amazing Events</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Discover & Register for
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                World-Class Exhibitions
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of attendees in experiencing cutting-edge exhibitions, 
              networking opportunities, and industry insights. Simple, fast, and secure registration.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base h-12 px-8"
              >
                <Link href="#exhibitions" className="flex items-center gap-2">
                  Browse Exhibitions
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base h-12 px-8">
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 max-w-2xl mx-auto">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Active Events</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-purple-600">10K+</div>
                <div className="text-sm text-muted-foreground">Attendees</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-pink-600">500+</div>
                <div className="text-sm text-muted-foreground">Exhibitors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Why Choose ExhibitHub?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience seamless event registration with our cutting-edge platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Register in under 2 minutes with our streamlined process
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-purple-500/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Safe</h3>
                <p className="text-muted-foreground">
                  Bank-grade security to protect your personal information
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-pink-500/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold">10K+ Attendees</h3>
                <p className="text-muted-foreground">
                  Join a thriving community of exhibition enthusiasts
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-blue-500/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold">Real-time Updates</h3>
                <p className="text-muted-foreground">
                  Get instant notifications about exhibition updates
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Exhibitions Section */}
      <section id="exhibitions" className="py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl">Active Exhibitions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {exhibitions.length > 0
                ? `${exhibitions.length} exhibition${exhibitions.length !== 1 ? 's' : ''} available for registration`
                : 'Check back soon for upcoming exhibitions'}
            </p>
          </div>

          {exhibitions.length === 0 ? (
            <Card className="p-16 text-center max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">No Active Exhibitions</h3>
                  <p className="text-muted-foreground">
                    There are currently no active exhibitions available for registration.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New exhibitions are added regularly. Please check back later!
                  </p>
                </div>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="#contact">Get Notified</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {exhibitions.map((exhibition) => (
                <ExhibitionCard key={exhibition._id || exhibition.id} exhibition={exhibition} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Experience Something Amazing?
            </h2>
            <p className="text-lg text-white/90">
              Don't miss out on the opportunity to attend world-class exhibitions. 
              Register now and be part of something extraordinary.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-base h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <Link href="#exhibitions" className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                View All Exhibitions
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/**
 * Exhibition Card Component - Modern Design
 */
function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const isRegistrationOpen = exhibitionsApi.isRegistrationOpen(exhibition);

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 hover:border-primary/20">
      {/* Exhibition Image */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-purple-50/50 to-pink-50/30">
        {exhibition.bannerImageUrl || exhibition.logoUrl ? (
          <Image
            src={exhibition.bannerImageUrl || exhibition.logoUrl!}
            alt={exhibition.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-purple-100/50 to-pink-100/30">
            <span className="text-6xl font-bold text-primary opacity-20">
              {exhibition.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          {isRegistrationOpen ? (
            <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Open
            </div>
          ) : (
            <div className="rounded-full bg-muted/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur">
              Closed
            </div>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {exhibition.name}
          </h3>

          {exhibition.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {exhibition.tagline}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span className="line-clamp-1 flex-1">{exhibition.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <span>
              {format(new Date(exhibition.onsiteStartDate), 'MMM dd')} -{' '}
              {format(new Date(exhibition.onsiteEndDate), 'MMM dd, yyyy')}
            </span>
          </div>
          
          {exhibition.isPaid && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Paid Event
              </Badge>
              {exhibition.pricingTiers && exhibition.pricingTiers.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  From ₹{Math.min(...exhibition.pricingTiers.map(t => t.price))}
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-2">
          {isRegistrationOpen ? (
            <Link href={`/${exhibition.slug}`} className={buttonVariants({ 
              className: "w-full group/btn bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-md hover:shadow-lg transition-all" 
            })}>
              Register Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          ) : (
            <button 
              disabled 
              className={buttonVariants({ 
                variant: 'outline', 
                className: "w-full cursor-not-allowed opacity-60" 
              })}
            >
              Registration Closed
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
