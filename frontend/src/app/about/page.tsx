import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  QrCode, 
  Bell, 
  BarChart3, 
  Lock, 
  Plug, 
  Camera,
  ClipboardCheck,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Building2,
  Sparkles,
  CheckCircle2,
  Target,
  Award
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us - Aakar Visitor',
  description: 'Learn about Aakar Visitor - the visitor management wing of Aakar Exhibition Pvt Ltd. Discover how we help organizations manage and track visitors efficiently.',
  keywords: ['visitor management', 'Aakar Exhibition', 'visitor database', 'security', 'access control'],
};

export default function AboutPage() {
  const coreFeatures = [
    {
      icon: ClipboardCheck,
      title: 'Visitor Registration',
      description: 'Visitors can provide their personal details such as name, contact information, purpose of visit, and any necessary identification documents.',
      color: 'primary',
      bgColor: 'from-primary/20 to-primary/10',
    },
    {
      icon: UserCheck,
      title: 'Check-In and Check-Out',
      description: 'The system allows visitors to check in upon arrival and check out when leaving. This helps track the duration of their visit and ensures that all visitors are accounted for.',
      color: 'purple-600',
      bgColor: 'from-purple-500/20 to-purple-500/10',
    },
    {
      icon: QrCode,
      title: 'Badge/Visitor Pass Printing',
      description: 'The software can generate visitor badges or passes with relevant information and access permissions. These can be printed or issued electronically for easy identification.',
      color: 'pink-600',
      bgColor: 'from-pink-500/20 to-pink-500/10',
    },
    {
      icon: Shield,
      title: 'Security and Access Control',
      description: 'The database can integrate with security systems such as access control, CCTV cameras, and alarms to ensure authorized access and monitor visitor movements within the premises.',
      color: 'green-600',
      bgColor: 'from-green-500/20 to-green-500/10',
    },
    {
      icon: Bell,
      title: 'Pre-registration and Host Notifications',
      description: 'For planned visits, the system enables pre-registration, where hosts can schedule visits and receive automated notifications when their guests arrive.',
      color: 'blue-600',
      bgColor: 'from-blue-500/20 to-blue-500/10',
    },
    {
      icon: AlertTriangle,
      title: 'Watchlist Screening',
      description: 'The database can be linked to external databases or watchlists to check if any visitor matches known security risks, allowing proactive security measures to be taken.',
      color: 'orange-600',
      bgColor: 'from-orange-500/20 to-orange-500/10',
    },
    {
      icon: BarChart3,
      title: 'Reporting and Analytics',
      description: 'The system generates reports and analytics on visitor data, including visitor traffic, peak hours, average visit duration, and other relevant metrics.',
      color: 'cyan-600',
      bgColor: 'from-cyan-500/20 to-cyan-500/10',
    },
    {
      icon: Lock,
      title: 'Data Privacy and Compliance',
      description: 'Visitor management databases adhere to data protection regulations, ensuring the secure handling and storage of visitor information.',
      color: 'red-600',
      bgColor: 'from-red-500/20 to-red-500/10',
    },
    {
      icon: Plug,
      title: 'Integration with other Systems',
      description: 'The visitor management database may integrate with other systems like HR databases, access control systems, or facility management software.',
      color: 'indigo-600',
      bgColor: 'from-indigo-500/20 to-indigo-500/10',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-purple-50/50 to-background">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        
        <div className="container relative mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                <Building2 className="h-4 w-4" />
                <span>A Wing of Aakar Exhibition Pvt Ltd</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              About
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Aakar Visitor
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Aakar Visitor is the visitor management wing of <strong>Aakar Exhibition Pvt Ltd</strong>. 
              Our main function is to provide a visitor management database that helps organizations 
              manage and track visitors entering their premises. The system offers a centralized 
              platform to collect, store, and retrieve visitor information, enhancing security, 
              efficiency, and overall visitor experience.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto">
              <div className="space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur border border-primary/10">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Exhibitions Managed</div>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur border border-purple-500/10">
                <div className="text-3xl font-bold text-purple-600">100K+</div>
                <div className="text-sm text-muted-foreground">Visitors Registered</div>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur border border-pink-500/10">
                <div className="text-3xl font-bold text-pink-600">99.9%</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-white/50 backdrop-blur border border-green-500/10">
                <div className="text-3xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-muted-foreground">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-purple-50/50 border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Our Mission
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To streamline the check-in/check-out process, enhance security, and provide 
                  valuable insights into visitor patterns and behavior, enabling organizations 
                  to create a safer and more efficient environment for both visitors and staff.
                </p>
              </div>
            </Card>

            {/* Vision */}
            <Card className="p-8 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-2 border-purple-500/20 hover:shadow-xl transition-all duration-300">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Our Vision
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To be the leading visitor management solution provider, revolutionizing 
                  how organizations handle visitor experiences through innovative technology, 
                  seamless integration, and unwavering commitment to security and efficiency.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
              <Sparkles className="h-4 w-4" />
              <span>Comprehensive Solution</span>
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Core Features of Our
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Visitor Management Database
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete suite of tools designed to manage every aspect of visitor management
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 hover:-translate-y-1 group"
                >
                  <div className="space-y-4">
                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-7 w-7 text-${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-7xl px-4">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 via-purple-50/30 to-pink-50/30 border-2 border-primary/10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Creating Safer & More Efficient Environments
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Overall, Aakar Visitor's management database streamlines the check-in/check-out process, 
                enhances security, and provides valuable insights into visitor patterns and behavior, 
                enabling organizations to create a safer and more efficient environment for both 
                visitors and staff.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/#exhibitions" className="flex items-center gap-2">
                    Browse Exhibitions
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/#contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Transform Your Visitor Experience?
            </h2>
            <p className="text-lg text-white/90">
              Join thousands of organizations that trust Aakar Visitor for their 
              visitor management needs. Experience the difference today.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-base h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Get Started Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

