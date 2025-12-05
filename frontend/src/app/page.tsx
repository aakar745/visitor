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
  Zap, 
  Shield,
  Clock,
  Smartphone,
  QrCode,
  Scan,
  CheckCircle,
  Printer,
  MessageCircle,
  Users,
  BadgeCheck
} from 'lucide-react';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { Exhibition } from '@/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/constants';

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

      {/* Hero Section - Exhibition Registration System */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50" />
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="container relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Live Badge */}
              <div className="flex justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>{exhibitions.length > 0 ? `${exhibitions.length} Exhibition${exhibitions.length !== 1 ? 's' : ''} Open for Registration` : 'Registration System Active'}</span>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="text-foreground">Your Digital</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Visitor Badge
                  </span>
                  <br />
                  <span className="text-foreground">In Seconds</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  Register for exhibitions, receive your <strong>QR-coded visitor pass</strong> instantly 
                  via WhatsApp, and walk into events hassle-free.
                </p>
              </div>

              {/* Process Steps - Mini */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <span className="text-sm font-medium">Register</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block self-center" />
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-600">2</div>
                  <span className="text-sm font-medium">Get Badge</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block self-center" />
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-600">3</div>
                  <span className="text-sm font-medium">Walk In</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-base h-14 px-8 rounded-xl"
                >
                  <Link href="#exhibitions" className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Register Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 rounded-xl border-2 hover:bg-muted/50"
                >
                  <Link href="#how-it-works" className="flex items-center gap-2">
                    Learn How It Works
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Secure & Private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span>Instant Badge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Free Registration</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Floating Badge Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-2xl" />
              
              {/* Badge Container with 3D Effect */}
              <div className="relative">
                {/* Scanning Animation Ring */}
                <div className="absolute inset-0 -m-4">
                  <div className="absolute inset-0 rounded-3xl border-2 border-primary/30 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                </div>
                
                {/* Main Badge Card */}
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-72 sm:w-80 transform hover:scale-105 transition-transform duration-500 border border-gray-100">
                  {/* Badge Header */}
                  <div className="text-center space-y-3 pb-4 border-b border-dashed border-gray-200">
                    <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Visitor Pass</span>
                    </div>
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">V</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Your Name</h3>
                      <p className="text-sm text-gray-500">Company / Organization</p>
                    </div>
                  </div>
                  
                  {/* QR Code Section */}
                  <div className="py-4 text-center">
                    <div className="relative inline-block">
                      {/* QR Code Placeholder with animated border */}
                      <div className="w-32 h-32 mx-auto bg-gray-50 rounded-xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        <QrCode className="h-20 w-20 text-gray-800" />
                      </div>
                      {/* Scan Line Animation */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Scan at entry for instant check-in</p>
                  </div>
                  
                  {/* Badge Footer */}
                  <div className="pt-3 border-t border-dashed border-gray-200 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Exhibition 2025</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Verified Visitor
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements Around Badge */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <Scan className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Exhibitions Section - Moved right after Hero */}
      <section id="exhibitions" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-4">
              <Calendar className="h-4 w-4" />
              <span>Now Open for Registration</span>
            </div>
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
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {exhibitions.map((exhibition) => (
                <ExhibitionCard key={exhibition._id || exhibition.id} exhibition={exhibition} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        <div className="container relative mx-auto max-w-7xl px-4">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 px-5 py-2 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20">
              <Sparkles className="h-4 w-4" />
              <span>Your Journey to the Exhibition</span>
            </div>
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              How It <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From online registration to walking into the exhibition with your printed badge — 
              a seamless 4-step experience
            </p>
          </div>

          {/* Timeline Process Flow */}
          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line - Desktop */}
            <div className="hidden lg:block absolute top-32 left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary via-purple-500 via-pink-500 to-green-500 rounded-full opacity-20" />
            <div className="hidden lg:block absolute top-32 left-[10%] right-[10%] h-1">
              <div className="h-full bg-gradient-to-r from-primary via-purple-500 via-pink-500 to-green-500 rounded-full animate-pulse opacity-40" style={{ width: '100%' }} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-stretch">
              
              {/* Step 1: Register Online */}
              <div className="relative group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-primary/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col w-full">
                  {/* Step Number - Floating */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                      1
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Smartphone className="h-10 w-10 text-primary" />
                      </div>
                      {/* Decorative ring */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 scale-110 group-hover:scale-125 transition-transform duration-500" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center space-y-2 flex-grow">
                    <h3 className="text-xl font-bold text-foreground">Register Online</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Fill the quick registration form with your details. Takes less than 2 minutes!
                    </p>
                  </div>
                  
                  {/* Feature Tags */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2 pt-2">
                    <span className="text-xs bg-primary/5 text-primary px-2 py-1 rounded-full">Mobile Friendly</span>
                    <span className="text-xs bg-primary/5 text-primary px-2 py-1 rounded-full">OTP Login</span>
                  </div>
                </div>
                
                {/* Arrow - Mobile */}
                <div className="lg:hidden flex justify-center py-4">
                  <ArrowRight className="h-6 w-6 text-primary/40 rotate-90" />
                </div>
              </div>

              {/* Step 2: Receive Digital Badge */}
              <div className="relative group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-purple-500/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col w-full">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                      2
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="relative">
                          <QrCode className="h-10 w-10 text-purple-600" />
                          <MessageCircle className="h-5 w-5 text-green-500 absolute -bottom-1 -right-1 fill-green-500" />
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/20 scale-110 group-hover:scale-125 transition-transform duration-500" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2 flex-grow">
                    <h3 className="text-xl font-bold text-foreground">Receive Digital Badge</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Get your unique QR-coded visitor badge instantly via WhatsApp & Email
                    </p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-2 pt-2">
                    <span className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </span>
                    <span className="text-xs bg-purple-500/10 text-purple-700 px-2 py-1 rounded-full">Email</span>
                  </div>
                </div>
                
                <div className="lg:hidden flex justify-center py-4">
                  <ArrowRight className="h-6 w-6 text-purple-400/40 rotate-90" />
                </div>
              </div>

              {/* Step 3: Visit Kiosk/Volunteer */}
              <div className="relative group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-pink-500/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col w-full">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                      3
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="relative">
                          <Scan className="h-10 w-10 text-pink-600" />
                          <Users className="h-5 w-5 text-orange-500 absolute -bottom-1 -right-1" />
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-pink-500/20 scale-110 group-hover:scale-125 transition-transform duration-500" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2 flex-grow">
                    <h3 className="text-xl font-bold text-foreground">Visit Kiosk / Volunteer</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Show your QR badge at the kiosk or to a volunteer at the venue entrance
                    </p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-2 pt-2">
                    <span className="text-xs bg-pink-500/10 text-pink-700 px-2 py-1 rounded-full">Self-Service Kiosk</span>
                    <span className="text-xs bg-orange-500/10 text-orange-700 px-2 py-1 rounded-full">Volunteer Desk</span>
                  </div>
                </div>
                
                <div className="lg:hidden flex justify-center py-4">
                  <ArrowRight className="h-6 w-6 text-pink-400/40 rotate-90" />
                </div>
              </div>

              {/* Step 4: Get Badge Printed */}
              <div className="relative group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-green-500/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col w-full">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                      4
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="relative">
                          <Printer className="h-10 w-10 text-green-600" />
                          <BadgeCheck className="h-5 w-5 text-emerald-500 absolute -bottom-1 -right-1 fill-emerald-100" />
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-green-500/20 scale-110 group-hover:scale-125 transition-transform duration-500" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2 flex-grow">
                    <h3 className="text-xl font-bold text-foreground">Get Badge Printed</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your physical badge is printed instantly — wear it and enjoy the exhibition!
                    </p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-2 pt-2">
                    <span className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Instant Print
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-700 px-2 py-1 rounded-full">Walk In</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Bar */}
          <div className="mt-20">
            <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-primary/5 via-purple-50/50 to-green-50/30 border-2 border-primary/10 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Under 2 Minutes</div>
                    <div className="text-sm text-muted-foreground">Complete registration</div>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
                    <Shield className="h-7 w-7 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">100% Secure</div>
                    <div className="text-sm text-muted-foreground">Your data is protected</div>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                    <Zap className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Instant Badge</div>
                    <div className="text-sm text-muted-foreground">Print on arrival</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
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
 * Helper function to get full image URL
 */
function getImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Use API_BASE_URL constant (remove /api/v1 suffix)
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Exhibition Card Component - Modern Design
 */
function ExhibitionCard({ exhibition }: { exhibition: Exhibition }) {
  const isRegistrationOpen = exhibitionsApi.isRegistrationOpen(exhibition);
  
  // Process image URLs - check multiple possible field names
  // Backend uses exhibitionLogo/bannerImage, but toJSON transforms to logoUrl/bannerImageUrl
  const bannerUrl = getImageUrl(exhibition.bannerImageUrl || (exhibition as any).bannerImage);
  const logoUrl = getImageUrl(exhibition.logoUrl || (exhibition as any).exhibitionLogo);
  const displayImage = logoUrl || bannerUrl; // Prioritize logo over banner
  
  // Debug logging
  console.log('[ExhibitionCard] Exhibition:', exhibition.name, {
    bannerImageUrl: exhibition.bannerImageUrl,
    bannerImage: (exhibition as any).bannerImage,
    logoUrl: exhibition.logoUrl,
    exhibitionLogo: (exhibition as any).exhibitionLogo,
    processedBanner: bannerUrl,
    processedLogo: logoUrl,
    displayImage,
  });

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 hover:border-primary/20">
      {/* Mobile: Horizontal Layout | Desktop: Vertical Layout */}
      <div className="flex flex-row md:flex-col">
        {/* Exhibition Image - Smaller on mobile, larger on desktop */}
        <div className="relative w-32 h-32 md:w-full md:h-56 flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 via-purple-50/50 to-pink-50/30">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={exhibition.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              unoptimized // Bypass Next.js image optimization for dynamic external URLs
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-purple-100/50 to-pink-100/30">
              <span className="text-3xl md:text-6xl font-bold text-primary opacity-20">
                {exhibition.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute right-2 top-2 md:right-3 md:top-3">
            {isRegistrationOpen ? (
              <div className="flex items-center gap-1 md:gap-1.5 rounded-full bg-green-500 px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-semibold text-white shadow-lg backdrop-blur">
                <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-white animate-pulse" />
                Open
              </div>
            ) : (
              <div className="rounded-full bg-muted/90 px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-semibold text-foreground shadow-lg backdrop-blur">
                Closed
              </div>
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content - Compact on mobile */}
        <div className="flex-1 p-3 md:p-6 space-y-2 md:space-y-4 flex flex-col">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-base md:text-xl font-bold line-clamp-1 md:line-clamp-2 group-hover:text-primary transition-colors">
              {exhibition.name}
            </h3>

            {exhibition.tagline && (
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
                {exhibition.tagline}
              </p>
            )}
          </div>

          {/* Details - More compact on mobile */}
          <div className="space-y-1.5 md:space-y-3 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
              <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <span className="line-clamp-1 flex-1">{exhibition.venue}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
              <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg bg-purple-500/10 flex-shrink-0">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
              </div>
              <span className="text-[11px] md:text-sm">
                {format(new Date(exhibition.onsiteStartDate), 'MMM dd')} -{' '}
                {format(new Date(exhibition.onsiteEndDate), 'MMM dd, yyyy')}
              </span>
            </div>
            
            {exhibition.isPaid && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <Badge variant="secondary" className="text-[10px] md:text-xs">
                  Paid Event
                </Badge>
                {exhibition.pricingTiers && exhibition.pricingTiers.length > 0 && (
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    From ₹{Math.min(...exhibition.pricingTiers.map(t => t.price))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CTA - Compact button on mobile */}
          <div className="pt-1 md:pt-2 mt-auto">
            {isRegistrationOpen ? (
              <Link href={`/${exhibition.slug}`} className={buttonVariants({ 
                className: "w-full group/btn bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-md hover:shadow-lg transition-all text-xs md:text-sm h-8 md:h-10" 
              })}>
                Register Now
                <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            ) : (
              <button 
                disabled 
                className={buttonVariants({ 
                  variant: 'outline', 
                  className: "w-full cursor-not-allowed opacity-60 text-xs md:text-sm h-8 md:h-10" 
                })}
              >
                Registration Closed
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
