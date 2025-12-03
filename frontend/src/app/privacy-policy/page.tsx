import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Card } from '@/components/ui/card';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database,
  Globe,
  Clock,
  UserCheck,
  Mail,
  FileText,
  AlertCircle,
  Cookie,
  Baby,
  Building2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Aakar Visitor',
  description: 'Privacy Policy for Aakar Visitor - Learn how we collect, use, and protect your personal data.',
  keywords: ['privacy policy', 'data protection', 'personal data', 'GDPR', 'CCPA'],
};

export default function PrivacyPolicyPage() {
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
                <Shield className="h-4 w-4" />
                <span>Your Privacy Matters</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Privacy Policy
            </h1>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span><strong>Effective Date:</strong> March 30, 2023</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span><strong>Last Updated:</strong> March 30, 2023</span>
              </div>
            </div>

            <p className="text-muted-foreground max-w-3xl mx-auto">
              This privacy policy explains how Aakar Exhibitions Private Limited or any of its affiliates 
              or subsidiaries ("We", "Us", "Our") Process Personal Data collected from natural persons 
              as a Controller ("You").
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 bg-muted/30 border-y">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Definitions', href: '#definitions', icon: FileText },
              { label: 'Data Collection', href: '#data-collection', icon: Database },
              { label: 'Legal Basis', href: '#legal-basis', icon: Lock },
              { label: 'Your Rights', href: '#your-rights', icon: UserCheck },
              { label: 'Cookies', href: '#cookies', icon: Cookie },
              { label: 'Contact', href: '#contact', icon: Mail },
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
            
            {/* Important Notice */}
            <Card className="p-6 mb-8 bg-amber-50/50 border-amber-200">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mt-0 mb-2">Important Notice</h3>
                  <p className="text-amber-700 text-sm mb-0">
                    If You do not agree to the collection and Processing of Your Personal Data, You are 
                    free to not provide the Personal Data sought by Us for collection and Processing, 
                    in which case You may not use Our Platform or Website for which the said Personal 
                    Data was sought.
                  </p>
                </div>
              </div>
            </Card>

            {/* 1. Definitions */}
            <div id="definitions" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">1. Definitions</h2>
              </div>
              
              <Card className="p-6 space-y-4">
                <DefinitionItem term="Controller" definition="means the natural or legal person, public authority, agency, or other body which alone or jointly with others, determines the purposes and means of the Processing of Personal Data." />
                <DefinitionItem term="Organiser" definition="means any person or entity who uses the Platform to publish and promote upcoming events to the Users." />
                <DefinitionItem term="Personal Data" definition="means any information relating to an identified or identifiable natural person; an identifiable natural person is one who can be identified, directly or indirectly, in particular by reference to an identifier such as a name, an identification number, location data, an online identifier or to one or more factors specific to the physical, physiological, genetic, mental, economic, cultural or social identity of that natural person." />
                <DefinitionItem term="Process/Processing" definition="means any operation or set of operations which is performed on Personal Data or on sets of Personal Data, whether or not by automated means, such as collection, recording, organisation, structuring, storage, adaptation or alteration, retrieval, consultation, use, disclosure by transmission, dissemination or otherwise making available, alignment or combination, restriction, erasure or destruction." />
                <DefinitionItem term="Processor" definition="means a natural or legal person, public authority, agency, or other body which Processes Personal Data on behalf of the Controller." />
                <DefinitionItem term="Platform" definition="shall have the meaning ascribed to it in the Terms of Use." />
                <DefinitionItem term="Sensitive Personal Data" definition="shall have the meaning ascribed to it under rule 3 of the SPDI Rules." />
                <DefinitionItem term="SPDI Rules" definition="means the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011." />
                <DefinitionItem term="User" definition="means any person or entity who uses or accesses the Platform to get information about upcoming events in the city." />
              </Card>
            </div>

            {/* 2. Data Collection */}
            <div id="data-collection" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">2. How We Collect, Use, and Share Your Personal Data</h2>
              </div>

              <h3 className="text-xl font-semibold mt-8 mb-4">2.1 Personal Data Collected by Us</h3>
              
              <Card className="p-6 mb-6">
                <h4 className="font-semibold text-primary mb-3">For Users (Event Registration/Inquiry)</h4>
                <div className="space-y-3 text-sm">
                  <div><strong>What We Collect:</strong> Your contact information such as full name, email address, telephone number, and other sign-up information.</div>
                  <div><strong>How We Use It:</strong>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Creation of a User account and verification of identity</li>
                      <li>Help you log into Our Platform</li>
                      <li>Communicate updates on the Platform</li>
                      <li>Market events based on your interests and city preference</li>
                      <li>Process transactions during ticket sales</li>
                    </ul>
                  </div>
                  <div><strong>Shared With:</strong> Third-party partners who assist Us in providing Our Platform to You.</div>
                </div>
              </Card>

              <Card className="p-6 mb-6">
                <h4 className="font-semibold text-purple-600 mb-3">For Organisers</h4>
                <div className="space-y-3 text-sm">
                  <div><strong>What We Collect:</strong> Business name, business portal, contact information (email, phone), and financial information (bank account, PayPal, or third-party payment accounts).</div>
                  <div><strong>How We Use It:</strong>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Creation of brand and event pages</li>
                      <li>Verification of Organiser identity</li>
                      <li>Payment and billing purposes</li>
                      <li>Taxation purposes</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <h3 className="text-xl font-semibold mt-8 mb-4">2.2 Personal Data Collected Automatically</h3>
              
              <Card className="p-6 mb-6">
                <h4 className="font-semibold text-pink-600 mb-3">Website Visitors</h4>
                <div className="space-y-3 text-sm">
                  <div><strong>What We Collect:</strong> IP addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, number of clicks, and other identifiers.</div>
                  <div><strong>How We Use It:</strong> Market analysis, research, protecting data from threats, and promoting Our Platform.</div>
                </div>
              </Card>

              <h3 className="text-xl font-semibold mt-8 mb-4">2.3 Personal Data of Other Individuals</h3>
              <p className="text-muted-foreground">
                If You provide Us with any Personal Data relating to other individuals, You represent that You 
                have the authority to do so, and where required, have obtained the necessary consent. If You 
                believe that Your Personal Data has been provided to Us improperly, please contact Us.
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-4">2.4 Sharing Your Personal Data</h3>
              <p className="text-muted-foreground mb-4">We may also share Your Personal Data with:</p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>An entity to which we divest all or a portion of Our business, or in connection with a merger, consolidation, or reorganization</li>
                <li>Law enforcement authorities, government authorities, courts, dispute resolution bodies, regulators, and auditors</li>
                <li>Professional advisors who assist Us in enforcing Our contracts and policies</li>
              </ul>
            </div>

            {/* 3. Legal Basis */}
            <div id="legal-basis" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">3. Legal Basis for Processing (EEA Region)</h2>
              </div>
              
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">
                  If You are a data subject from the European Economic Area, Our legal basis for collecting 
                  and using the Personal Data will depend on the Personal Data concerned and the specific 
                  context in which We collect it.
                </p>
                <p className="text-muted-foreground mb-4">
                  We will normally collect Personal Data from You only where:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                  <li>It needs it to perform a contract with You</li>
                  <li>The Processing is in Our legitimate interests and not overridden by Your data protection interests</li>
                  <li>We have Your consent</li>
                  <li>We have a legal obligation to collect Personal Data from You</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Note:</strong> If We Process Personal Data with reliance on Your consent, You may withdraw 
                  Your consent at any time.
                </p>
              </Card>
            </div>

            {/* 4. International Transfer */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">4. International Transfer</h2>
              </div>
              
              <p className="text-muted-foreground">
                We mainly Process Personal Data in our primary location. However, We may transfer Personal 
                Data outside for the purposes referred to in Section 2. We will ensure that the recipient 
                of Your Personal Data offers an adequate level of protection that is at least comparable 
                to that which is provided under applicable data protection laws.
              </p>
              <p className="text-muted-foreground mt-4">
                For EEA residents, when Your Personal Data is Processed outside EEA, We will ensure adequate 
                protection by entering into standard contractual clauses as approved by the European Commission 
                (Article 46 GDPR), or We will ask for Your prior consent.
              </p>
            </div>

            {/* 5. Retention */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">5. Retention of Personal Data</h2>
              </div>
              
              <p className="text-muted-foreground">
                We retain Personal Data collected where an ongoing legitimate business requires retention. 
                In the absence of such a need, We will either delete it or aggregate it, or if this is not 
                possible, We will securely store Your Personal Data and isolate it from any further processing 
                until deletion is possible.
              </p>
            </div>

            {/* 6. Security */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">6. Security of Personal Data</h2>
              </div>
              
              <p className="text-muted-foreground">
                We use appropriate technical and organizational measures to protect the Personal Data that 
                We collect and Process. The measures We use are designed to provide a level of security 
                appropriate to the risk of Processing Your Personal Data. If You have questions about the 
                security of Your Personal Data, please contact Us immediately.
              </p>
            </div>

            {/* 7. Your Rights */}
            <div id="your-rights" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">7. Your Rights</h2>
              </div>
              
              <Card className="p-6">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <span>You can request access and correction of Your Personal Data.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <span>You can withdraw Your consent at any time. Withdrawal will not affect the lawfulness of Processing conducted prior to withdrawal.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <span>You have the right to complain to a data protection authority about Our collection and use of Your Personal Data.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <span>You have the right to opt-out of marketing communications at any time by clicking "unsubscribe" in our emails.</span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Additional Rights for EEA, UK, and Switzerland Residents:</h4>
                  <ul className="list-disc ml-6 space-y-2 text-sm text-purple-700">
                    <li>Request deletion and erasure of Your Personal Data</li>
                    <li>Object to Processing of Your Personal Data</li>
                    <li>Request restriction of Processing</li>
                    <li>Request portability of Your Personal Data</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* 8. California Residents */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">8. Notice for California Residents</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">
                This clause applies only to California residents. "CCPA" means the California Consumer Privacy 
                Act of 2018 as amended by the CPRA. "CPRA" means the California Privacy Rights Act.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Categories of Personal Information Collected:</h3>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Identifiers (name, address, email, IP address, account name)</li>
                <li>Financial information (bank account, credit/debit card numbers)</li>
                <li>Protected classification characteristics (gender, date of birth)</li>
                <li>Internet activity (browsing history, search history, interactions)</li>
                <li>Geolocation data</li>
                <li>Audio, electronic, visual, or similar information</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Your CCPA Rights:</h3>
              <Card className="p-6">
                <ul className="space-y-3 text-sm">
                  <li>✓ Request disclosure of categories and details of Personal Information collected</li>
                  <li>✓ Request disclosure of Personal Information collected 12 months prior</li>
                  <li>✓ Request disclosure of Personal Information Sold or Shared</li>
                  <li>✓ Request correction of inaccurate Personal Information</li>
                  <li>✓ Request deletion of Personal Information</li>
                  <li>✓ Opt-out of any Sale or Sharing of Personal Information</li>
                  <li>✓ Request to limit use of Sensitive Personal Information</li>
                  <li>✓ Request transfer of Personal Information to another entity</li>
                  <li>✓ Right to not be discriminated against for exercising Your rights</li>
                </ul>
              </Card>
            </div>

            {/* 9. Cookie Policy */}
            <div id="cookies" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Cookie className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">9. Cookie Policy</h2>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Cookies are text files placed on Your computer to collect standard internet log information 
                and visitor behaviour information. When You visit the Website(s), We may collect Personal 
                Data automatically through cookies or similar technology.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold text-primary mb-2">Essential Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable core functionality such as security, network management, and accessibility. 
                    You may not opt-out of these cookies.
                  </p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold text-purple-600 mb-2">Analytics & Advertising Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Help Us improve Our Website(s) by collecting and reporting information on how You use it. 
                    These do not directly identify anyone.
                  </p>
                </Card>
              </div>
            </div>

            {/* 10. Privacy of Children */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Baby className="h-5 w-5 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">10. Privacy of Children</h2>
              </div>
              
              <p className="text-muted-foreground">
                We recognize the importance of children's safety and privacy. We do not request, or knowingly 
                collect, any Personal Data from children under the age of 16 without consent given or authorized 
                by the parent or guardian. Parents or guardians can revoke consent and review, edit, or delete 
                the Personal Data of their children.
              </p>
            </div>

            {/* 11. Notice to User */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">11. Notice to User and Other Exclusions</h2>
              </div>
              
              <ul className="space-y-4 text-muted-foreground">
                <li>
                  Where Personal Data of Users are collected by the Organiser on their event page, that 
                  Organiser is the Controller of such Personal Data.
                </li>
                <li>
                  Our Website(s) contain links to other websites. Our Policy applies only to our Website(s), 
                  so if You click on a link to another website, You should read their privacy policy.
                </li>
                <li>
                  This Policy does not apply to aggregated information which summarises statistical 
                  information about groups of members.
                </li>
              </ul>
            </div>

            {/* 12. Contact */}
            <div id="contact" className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">12. Contacting Our Grievance Officer</h2>
              </div>
              
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-50/50 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Kind Attention: Tanvir Pathan</h4>
                    <p className="text-muted-foreground mb-3">
                      <strong>Address:</strong><br />
                      Office No B-2, Wall Street 2,<br />
                      Opp. Orient Club, Ellisbridge,<br />
                      Ahmedabad, Gujarat 380006, India
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Phone:</strong> <a href="tel:+917016727956" className="text-primary hover:underline">+91 7016727956</a><br />
                      <strong>Email:</strong> <a href="mailto:visitor@aakarexhibition.com" className="text-primary hover:underline">visitor@aakarexhibition.com</a>
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 13. Changes */}
            <div className="scroll-mt-24 mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-2xl font-bold m-0">13. Changes to the Policy</h2>
              </div>
              
              <p className="text-muted-foreground">
                We keep this Policy under regular review and may update this webpage at any time. This Policy 
                may be amended at any time and You shall be notified only if there are material changes to 
                this Policy.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Helper component for definitions
function DefinitionItem({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <dt className="font-semibold text-primary">{term}</dt>
      <dd className="text-muted-foreground text-sm mt-1">{definition}</dd>
    </div>
  );
}

