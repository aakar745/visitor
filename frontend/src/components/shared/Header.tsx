'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPublicSettings } from '@/lib/api/settings';
import { API_BASE_URL } from '@/lib/constants';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('ExhibitHub');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch public settings on mount
    getPublicSettings().then((settings) => {
      setHeaderLogoUrl(settings.headerLogoUrl);
      if (settings.appName) {
        setAppName(settings.appName);
      }
    });
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            {headerLogoUrl ? (
              <div className="relative h-10 w-auto">
                <Image
                  src={`${API_BASE_URL.replace('/api/v1', '')}${headerLogoUrl}`}
                  alt={appName}
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-[#4A7090] rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" className="text-sm font-medium">
                Exhibitions
              </Button>
            </Link>
            <Link href="/#about">
              <Button variant="ghost" className="text-sm font-medium">
                About
              </Button>
            </Link>
            <Link href="/#features">
              <Button variant="ghost" className="text-sm font-medium">
                Features
              </Button>
            </Link>
            <Link href="/#contact">
              <Button variant="ghost" className="text-sm font-medium">
                Contact
              </Button>
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-[#4A7090] hover:from-primary/90 hover:to-[#4A7090]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/#exhibitions" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Browse Events
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-1 p-4">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                  Exhibitions
                </Button>
              </Link>
              <Link href="/#about" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                  About
                </Button>
              </Link>
              <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                  Features
                </Button>
              </Link>
              <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                  Contact
                </Button>
              </Link>
              <Button
                asChild
                className="w-full mt-4 bg-gradient-to-r from-primary to-[#4A7090] hover:from-primary/90 hover:to-[#4A7090]/90 text-white"
              >
                <Link
                  href="/#exhibitions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Browse Events
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

