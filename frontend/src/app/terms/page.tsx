import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  Building2,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Globe,
  Ticket,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Scale,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Use - Aakar Visitor',
  description: 'Terms of Use for Aakar Visitor - Read our terms and conditions for using our visitor management platform.',
  keywords: ['terms of use', 'terms and conditions', 'legal', 'user agreement'],
};

export default function TermsPage() {
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
                <Scale className="h-4 w-4" />
                <span>Legal Agreement</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Terms of Use
            </h1>

            <p className="text-muted-foreground max-w-3xl mx-auto">
              These Terms of Use create a legally binding agreement for you to avail the services 
              offered by Aakar Exhibition Pvt Ltd. ("AEPL"). Please read these terms carefully 
              before using our Platform.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 bg-muted/30 border-y">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'User Rights', href: '#user-rights', icon: Users },
              { label: 'Organiser Rights', href: '#organiser-rights', icon: Building2 },
              { label: 'Accounts', href: '#accounts', icon: UserCheck },
              { label: 'Ticket Sales', href: '#ticket-sales', icon: Ticket },
              { label: 'Payments', href: '#payments', icon: CreditCard },
              { label: 'Acceptable Use', href: '#acceptable-use', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm font-medium"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-purple-50/50 border-primary/20">
              <div className="flex gap-4">
                <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-primary mt-0 mb-2">About This Agreement</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    AEPL provides an internet-based ticketing portal operated for providing event discovery, 
                    promotion, and ticketing services on their platform ("Platform"). We provide information 
                    relating to the pricing, availability, and reservation of tickets for any events across 
                    cities and rural areas.
                  </p>
                  <p className="text-muted-foreground text-sm mb-0">
                    By registering, accessing, browsing and/or using the Platform, you agree to be bound by 
                    these Terms and acknowledge having read the Privacy Policy. If you do not agree to these 
                    Terms, you should immediately cease using our Platform.
                  </p>
                </div>
              </div>
            </Card>

            {/* Definitions */}
            <Card className="p-6 mb-8 bg-blue-50/50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mt-0 mb-4">Key Definitions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-semibold text-blue-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-0">
                    A person or legal entity who uses the Platform to get information or purchases tickets 
                    for any upcoming events.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-semibold text-blue-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Organizer
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-0">
                    Creators publishing, promoting and selling tickets of their upcoming events to Users 
                    on the Platform.
                  </p>
                </div>
              </div>
            </Card>

            {/* User Rights */}
            <div id="user-rights" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">User Rights</h2>
              </div>
              
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">
                  Subject to compliance with these Terms, AEPL grants the User:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>A <strong>non-exclusive</strong> right to browse the Platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>A <strong>non-transferable</strong> right to search for and view events</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>A <strong>non-sublicensable</strong> right to register for events</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>A <strong>revocable</strong> right to purchase tickets or registrations to events published on the Platform</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Organiser Rights */}
            <div id="organiser-rights" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Organiser Rights</h2>
              </div>
              
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">
                  Subject to compliance with these Terms, AEPL grants the Organiser:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <span>Create, publish, and promote any upcoming events on the <strong>Brand Page</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <span>Sell tickets, manage, track, and collect sale proceeds through the <strong>Event Page</strong></span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4 mb-0">
                  These rights are non-exclusive, non-transferable, non-sublicensable, and revocable.
                </p>
              </Card>
            </div>

            {/* User Account */}
            <div id="accounts" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">User Account</h2>
              </div>
              
              <p className="text-muted-foreground">
                The User may choose to register on the Platform to enjoy certain benefits and additional 
                features available to registered Users. The User can sign in and create their account by 
                providing a username and password, or can also sign in using any of their social media 
                or third-party sign-on services ("Account").
              </p>
            </div>

            {/* Brand and Event Page */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Organiser's Brand and Event Page</h2>
              </div>
              
              <Card className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Brand Page</h4>
                  <p className="text-sm text-muted-foreground">
                    The Organiser can create a page on the Platform to publish information about their business, 
                    the list of events they have organized in the past, and upcoming events. Organizers can 
                    create a Brand Page by signing in with their business name and business URL.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">Event Page</h4>
                  <p className="text-sm text-muted-foreground">
                    Only after the creation of a Brand Page, Organisers shall be allowed to post information 
                    about and sell tickets for their upcoming events on the "Events Page".
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-pink-600 mb-2">Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    AEPL may collect additional information from the Organiser for verification purposes to 
                    verify identity, validity/legality of transactions, and qualification to use the Platform. 
                    Organisers agree to provide this information in a timely, accurate and complete manner.
                  </p>
                </div>
              </Card>
            </div>

            {/* Acceptable Use */}
            <div id="acceptable-use" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Acceptable Use Policy</h2>
              </div>
              
              <Card className="p-6 bg-red-50/50 border-red-200">
                <h4 className="font-semibold text-red-800 mb-4">The Organiser and User agree NOT to:</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>License, sublicense, sell, resell, rent, lease, transfer, assign, distribute, or make the Platform available to any third party</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Modify, adapt, or hack the Platform or attempt to gain unauthorized access</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Use the Platform to store or transmit content that infringes intellectual property rights or is unlawful, racist, hateful, abusive, libelous, obscene, or discriminatory</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Post, transmit, upload, or store any viruses, malware, trojan horses, or harmful software</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>"Crawl," "scrape," or "spider" any page, data, or portion of the Platform</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 mt-6">
                <h4 className="font-semibold text-primary mb-4">Additionally, the Organiser agrees to:</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Not publish events containing sexually explicit or suggestive content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Not publish events promoting political or religious extremism or violence</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Not store or transmit User data in violation of applicable laws, including privacy rights and export control laws</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Ensure all necessary approvals for organizing the event have been obtained from authorities</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Provide public notice of cancellation or postponement and notify AEPL and Users immediately</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Sale of Tickets */}
            <div id="ticket-sales" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Sale of Tickets</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Users can buy tickets for any event from the Event Page of the Organiser. The User directly 
                  enters into an agreement with the Organiser. The Organiser shall ensure to publish only 
                  authentic events on the Brand Page.
                </p>

                <Card className="p-6 bg-amber-50/50 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3">Important: Republished Events</h4>
                  <p className="text-sm text-amber-700 mb-0">
                    AEPL strictly prohibits any Organiser to republish or resell the tickets of any event 
                    that has been already published by another Organiser on their Brand Page ("Republished Event").
                  </p>
                </Card>

                <Card className="p-6">
                  <h4 className="font-semibold mb-3">AEPL is NOT responsible for:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• The accuracy, legality, safety, or quality of events published</li>
                    <li>• Change of event place</li>
                    <li>• Cancellation or postponement of events</li>
                    <li>• Restriction of entry of the User to the event venue</li>
                    <li>• Any purchase of tickets by directly contacting the Organiser or through other platforms</li>
                    <li>• Sale of tickets for any Republished Events</li>
                    <li>• Any physical or virtual promotion of events by the Organiser outside the Platform</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-green-50/50 border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Ticket Confirmation</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Upon purchase, AEPL shall provide Users with a confirmation message with a unique QR code. 
                    For physical tickets, they will be provided by the Organiser at the event venue.
                  </p>
                  <p className="text-sm text-green-700 mb-0">
                    The Organiser agrees to unconditionally accept and honor all ticketing commitments confirmed 
                    by AEPL. Exchange, resale, or transfer of tickets can only be done at the discretion of 
                    the Organiser.
                  </p>
                </Card>
              </div>
            </div>

            {/* Third-Party Websites */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Third-Party Websites</h2>
              </div>
              
              <p className="text-muted-foreground">
                Organiser and User acknowledge that the Platform may contain links to third-party websites. 
                Use of such websites shall be subject to their own terms and privacy policies. AEPL shall 
                not be responsible for the contents of such websites or any error, omission or misrepresentation. 
                Links to third-party websites do not amount to endorsement by AEPL.
              </p>
            </div>

            {/* Payment and Refunds */}
            <div id="payments" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Payment and Refunds</h2>
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-4">For Events in India</h3>
              
              <Card className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-primary mb-2">Pricing Structure</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><strong>Base Price:</strong> Set by the Organiser for tickets</li>
                    <li><strong>Booking Fee:</strong> Transaction fee collected by AEPL</li>
                    <li><strong>Event Registration Fee:</strong> Base Price + Booking Fee (total paid by User)</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-primary">Withholding Period</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-0">
                    AEPL shall withhold payments to Organisers for <strong>3 days</strong> post-event to review 
                    any complaints from Users. Upon completion without complaints, the Base Price shall be 
                    transferred to the Organiser's bank account.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Refund Policy</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• AEPL has no liability for refund requests post the Withholding Period</li>
                    <li>• Users must contact the Organiser directly for refund-related queries</li>
                    <li>• The Organiser shall include a refund policy on their Event Page</li>
                    <li>• Booking Fee and handling fees are <strong>non-refundable</strong></li>
                  </ul>
                </div>
              </Card>

              <h3 className="text-xl font-semibold mt-8 mb-4">For Events Outside India</h3>
              
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">
                  For events outside India, AEPL shall not collect the Event Registration Fee. Users shall 
                  directly pay the Organiser through third-party payment gateways (PayPal, Stripe, etc.).
                </p>
                <p className="text-muted-foreground mb-0">
                  AEPL shall not be responsible for any refund requests for such events. Users must contact 
                  the Organiser directly in accordance with the refund policy on the Event Page.
                </p>
              </Card>
            </div>

            {/* Advanced Plans */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Advanced Plans</h2>
              </div>
              
              <p className="text-muted-foreground">
                Organizers can subscribe to advanced plans (Professional, Business, etc.) for additional 
                features. AEPL shall collect a <strong>Platform Usage Fee</strong> for these plans in accordance 
                with the pricing schedule. Payment must be made within the specified time limit and manner.
              </p>
            </div>

            {/* Marketing Fee */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">Marketing Fee</h2>
              </div>
              
              <p className="text-muted-foreground">
                Organisers can subscribe to AEPL's marketing plan for promoting and marketing events 
                published on their Event Page. AEPL shall collect a <strong>Marketing Fee</strong> as 
                specified in the event marketing plan. Payment must be made within the specified time 
                limit and manner.
              </p>
            </div>

            {/* Contact Section */}
            <div className="scroll-mt-24 mt-12">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-50/50 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                    <p className="text-muted-foreground mb-3">
                      <strong>Aakar Exhibition Pvt Ltd.</strong><br />
                      Office No B-2, Wall Street 2,<br />
                      Opp. Orient Club, Ellisbridge,<br />
                      Ahmedabad, Gujarat 380006, India
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Contact:</strong> Tanvir Pathan<br />
                      <strong>Phone:</strong> <a href="tel:+917016727956" className="text-primary hover:underline">+91 7016727956</a><br />
                      <strong>Email:</strong> <a href="mailto:visitor@aakarexhibition.com" className="text-primary hover:underline">visitor@aakarexhibition.com</a>
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Related Links */}
            <div className="mt-12 p-6 bg-muted/30 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Related Policies</h3>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/privacy-policy" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  Privacy Policy
                </Link>
                <Link 
                  href="/refund-policy" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm font-medium"
                >
                  <CreditCard className="h-4 w-4 text-primary" />
                  Refund Policy
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

