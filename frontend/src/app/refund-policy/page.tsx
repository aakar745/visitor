import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCcw, 
  XCircle,
  CheckCircle,
  Clock,
  CreditCard,
  UserPlus,
  Calendar,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  ArrowRight,
  Shield
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy - Aakar Visitor',
  description: 'Refund and Cancellation Policy for Aakar Visitor - Learn about our refund process, cancellation terms, and ticket transfer options.',
  keywords: ['refund policy', 'cancellation policy', 'ticket refund', 'event cancellation'],
};

export default function RefundPolicyPage() {
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
                <RefreshCcw className="h-4 w-4" />
                <span>Customer First</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Refund & Cancellation Policy
            </h1>

            <p className="text-muted-foreground max-w-3xl mx-auto">
              Welcome to Aakar Visitors! We value your trust in our services and aim to provide you 
              with a seamless and enjoyable experience. We understand that plans may change, and 
              you may need to cancel or request a refund.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <section className="py-8 bg-muted/30 border-y">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50/50 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">48 Hours</div>
                  <div className="text-xs text-green-600">Cancellation Notice</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-blue-50/50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-800">7-10 Days</div>
                  <div className="text-xs text-blue-600">Refund Processing</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-purple-50/50 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-purple-800">24 Hours</div>
                  <div className="text-xs text-purple-600">Ticket Transfer Notice</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="prose prose-lg max-w-none">

            {/* 1. Cancellation Policy */}
            <div id="cancellation" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. Cancellation Policy</h2>
              </div>
              
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-primary mt-0 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">1.1</span>
                    Cancellation by the Ticket Holder
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    If you wish to cancel your event ticket registration, you must notify us by contacting 
                    our customer support team <strong>at least 48 hours before the scheduled event date</strong>.
                  </p>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
                      <CheckCircle className="h-4 w-4" />
                      Full Refund Eligible
                    </div>
                    <p className="text-sm text-green-700 mb-0">
                      You will be eligible for a full refund, excluding any non-refundable fees or charges 
                      as mentioned below.
                    </p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-purple-600 mt-0 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-sm text-purple-600">1.2</span>
                    Cancellation by Aakar Visitors
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    In rare circumstances beyond our control, we may have to cancel or reschedule an event. 
                    If this occurs, we will notify all registered attendees via email or phone as soon as possible.
                  </p>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-800 font-semibold mb-1">
                      <CheckCircle className="h-4 w-4" />
                      Full Refund Guaranteed
                    </div>
                    <p className="text-sm text-purple-700 mb-0">
                      You will be entitled to a full refund, <strong>including any applicable fees</strong>.
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* 2. Refund Policy */}
            <div id="refund" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. Refund Policy</h2>
              </div>

              <div className="space-y-6">
                {/* 2.1 Refund Eligibility */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-primary mt-0 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">2.1</span>
                    Refund Eligibility
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Refunds will only be issued to eligible event ticket holders who meet the following criteria:
                  </p>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-800">
                        If the ticket holder cancels the registration <strong>at least 48 hours</strong> before the event date.
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-800">
                        If Aakar Visitors cancels or reschedules an event.
                      </span>
                    </div>
                  </div>
                </Card>

                {/* 2.2 Non-Refundable Fees */}
                <Card className="p-6 bg-amber-50/50 border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-800 mt-0 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">2.2</span>
                      Non-Refundable Fees or Charges
                    </span>
                  </h3>
                  <p className="text-amber-700 mb-3">
                    Please note that certain fees or charges associated with the event ticket registration 
                    may be <strong>non-refundable</strong>. These include but are not limited to:
                  </p>
                  <ul className="space-y-2 text-amber-700">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Processing fees
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Service charges
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Fees levied by third-party payment processors
                    </li>
                  </ul>
                </Card>

                {/* 2.3 Refund Process */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-primary mt-0 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">2.3</span>
                    Refund Process
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    To request a refund, eligible ticket holders must contact our customer support team 
                    by email or phone, providing the necessary details:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-sm">Required Information</div>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Ticket reference number</li>
                        <li>• Reason for refund request</li>
                        <li>• Contact details</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-sm text-blue-800">Processing Time</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-700 font-semibold">7-10 business days</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">from the date of receiving a valid refund request</p>
                    </div>
                  </div>
                </Card>

                {/* 2.4 Refund Method */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-primary mt-0 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">2.4</span>
                    Refund Method
                  </h3>
                  <p className="text-muted-foreground mb-0">
                    Refunds will be issued using the <strong>same payment method</strong> that was used for 
                    the original ticket purchase. If, for any reason, this is not possible, we will work 
                    with the ticket holder to find an appropriate alternative.
                  </p>
                </Card>
              </div>
            </div>

            {/* 3. Transfer of Registration */}
            <div id="transfer" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. Transfer of Registration</h2>
              </div>

              <Card className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/30 border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mt-0 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm text-purple-700">3.1</span>
                  Ticket Transfer Policy
                </h3>
                <p className="text-purple-700 mb-4">
                  If you are unable to attend the event after purchasing a ticket, you have the option 
                  to transfer your ticket to another individual.
                </p>
                <div className="p-4 bg-white/80 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-purple-800">24 Hours Notice Required</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    The ticket transfer must be requested at least 24 hours before the event date.
                  </p>
                  <div className="text-sm text-purple-600">
                    To initiate the transfer, please contact our customer support team with the new attendee's details.
                  </div>
                </div>
              </Card>
            </div>

            {/* 4. Event Changes or Cancellations */}
            <div id="event-changes" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. Event Changes or Cancellations</h2>
              </div>

              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-primary mt-0 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">4.1</span>
                    Event Changes
                  </h3>
                  <p className="text-muted-foreground mb-0">
                    Aakar Visitors reserves the right to make changes to event details, such as event timing, 
                    venue, or speakers, if necessary. In such cases, we will inform registered attendees promptly.
                  </p>
                </Card>

                <Card className="p-6 bg-red-50/50 border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mt-0 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-sm">4.2</span>
                      Liability Disclaimer
                    </span>
                  </h3>
                  <p className="text-red-700 mb-0">
                    If an event is cancelled or rescheduled due to unforeseen circumstances, Aakar Visitors 
                    will <strong>not be liable</strong> for any expenses incurred by the attendees, such as 
                    travel or accommodation costs.
                  </p>
                </Card>
              </div>
            </div>

            {/* 5. Contact Us */}
            <div id="contact" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Contact Us</h2>
              </div>

              <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-50/50 border-primary/20">
                <p className="text-muted-foreground mb-6">
                  If you have any questions or concerns regarding our refund and cancellation policy or 
                  require assistance with cancelling or refunding your event ticket registration, please 
                  feel free to contact our customer support team:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <a href="mailto:visitor@aakarexhibition.com" className="font-semibold text-primary hover:underline">
                          visitor@aakarexhibition.com
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Phone (Tanvir Pathan)</div>
                        <a href="tel:+917016727956" className="font-semibold text-green-700 hover:underline">
                          +91 7016727956
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Important Notice */}
            <Card className="p-6 mt-12 bg-amber-50/50 border-amber-200">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mt-0 mb-2">Important Notice</h3>
                  <p className="text-amber-700 text-sm mb-3">
                    Please ensure that you have read and understood our refund and cancellation policy 
                    before registering for event tickets on aakarvisitors.com. Your satisfaction is our 
                    top priority, and we strive to offer the best possible service to make your event 
                    experience unforgettable.
                  </p>
                  <p className="text-amber-600 text-xs mb-0">
                    <strong>Note:</strong> This policy is subject to change without prior notice. Please refer 
                    to the refund and cancellation policy on our website for the most up-to-date information.
                  </p>
                </div>
              </div>
            </Card>

            {/* CTA Section */}
            <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 via-purple-50/50 to-pink-50/30 rounded-2xl text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Need Assistance?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our customer support team is here to help you with any questions about refunds, 
                cancellations, or ticket transfers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  <a href="mailto:visitor@aakarexhibition.com" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/" className="flex items-center gap-2">
                    Browse Events
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
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
                  href="/terms" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  Terms of Use
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

