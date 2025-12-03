'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Calendar, Mail, MapPin, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getPublicSettings } from '@/lib/api/settings';
import { API_BASE_URL } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [footerLogoUrl, setFooterLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('ExhibitHub');

  useEffect(() => {
    // Fetch public settings on mount
    getPublicSettings().then((settings) => {
      setFooterLogoUrl(settings.footerLogoUrl);
      if (settings.appName) {
        setAppName(settings.appName);
      }
    });
  }, []);

  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              {footerLogoUrl ? (
                <div className="relative h-10 w-auto">
                  <Image
                    src={`${API_BASE_URL.replace('/api/v1', '')}${footerLogoUrl}`}
                    alt={appName}
                    width={120}
                    height={40}
                    className="h-10 object-contain"
                    style={{ width: 'auto', height: 'auto', maxHeight: '40px' }}
                  />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-[#4A7090] rounded-lg blur-lg opacity-50" />
                    <div className="relative bg-gradient-to-r from-primary via-primary to-[#4A7090] p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary to-[#4A7090] bg-clip-text text-transparent">
                    {appName}
                  </span>
                </>
              )}
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your premier platform for discovering and registering for exhibitions and events worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Exhibitions
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:visitor@aakarexhibition.com"
                  className="hover:text-foreground transition-colors"
                >
                  visitor@aakarexhibition.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+917016727956"
                  className="hover:text-foreground transition-colors"
                >
                  +91 7016727956
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Office No B-2, Wall Street 2, Opp. Orient Club, Ellisbridge, Ahmedabad 380006</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} Aakar Visitor. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

