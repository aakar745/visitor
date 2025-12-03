import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Clock,
  MessageSquare,
  Send,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - Aakar Visitor',
  description: 'Get in touch with Aakar Visitor. Contact us for any inquiries about visitor management, exhibitions, or support.',
  keywords: ['contact', 'support', 'Aakar Exhibition', 'visitor management', 'help'],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-purple-50/50 to-background">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        
        <div className="container relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                <MessageSquare className="h-4 w-4" />
                <span>We're Here to Help</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Contact Us
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about our visitor management system? Need help with an exhibition? 
              We'd love to hear from you. Get in touch with our team.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-4">
          
          {/* Get In Touch Banner */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 px-6 py-2 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20">
              <Sparkles className="h-4 w-4" />
              GET IN TOUCH
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Corporate Office Card */}
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-purple-50/50 border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Corporate Office
                  </h2>
                  <p className="text-sm text-muted-foreground">Aakar Exhibition Pvt Ltd</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Address</div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Office No B-2, Wall Street 2,<br />
                      Opp. Orient Club, Ellisbridge,<br />
                      Ahmedabad, Gujarat 380006
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Business Hours</div>
                    <p className="text-muted-foreground text-sm">
                      Monday - Saturday: 10:00 AM - 7:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Person Card */}
            <Card className="p-8 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-2 border-purple-500/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    For More Information
                  </h2>
                  <p className="text-sm text-muted-foreground">Contact our team</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border shadow-sm">
                  <div className="font-semibold text-lg text-foreground mb-3">Tanvir Pathan</div>
                  
                  <div className="space-y-3">
                    <a 
                      href="tel:+917016727956" 
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Call</div>
                        <div className="font-medium text-green-700 group-hover:text-green-800">
                          +91 7016727956
                        </div>
                      </div>
                    </a>

                    <a 
                      href="mailto:visitor@aakarexhibition.com" 
                      className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Email</div>
                        <div className="font-medium text-blue-700 group-hover:text-blue-800">
                          visitor@aakarexhibition.com
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Map Section (Optional placeholder) */}
          <Card className="mt-12 max-w-5xl mx-auto overflow-hidden">
            <div className="aspect-[21/9] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground">Find Us</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Wall Street 2, Ellisbridge, Ahmedabad
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <a 
                    href="https://maps.google.com/?q=Wall+Street+2,+Ellisbridge,+Ahmedabad,+Gujarat+380006" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/90">
              Explore our exhibitions and register for upcoming events. 
              Your next great experience is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-base h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Link href="/" className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Browse Exhibitions
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base h-12 px-8 border-white text-white hover:bg-white/10"
              >
                <Link href="/about" className="flex items-center gap-2">
                  Learn About Us
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

