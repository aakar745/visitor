import type { NextConfig } from "next";

// Environment-aware CSP configuration
const isDev = process.env.NODE_ENV === 'development';

// Security Headers Configuration
const securityHeaders = [
  // 1. HSTS - Force HTTPS for 1 year, include subdomains (production only)
  ...(isDev ? [] : [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  }]),
  // 2. Prevent clickjacking - Only allow framing from same origin
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // 3. Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 4. Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 5. Permissions Policy - Restrict browser features
  // Note: camera=(self) is needed for kiosk QR code scanner
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
  },
  // 6. XSS Protection (legacy browsers)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // 7. Content Security Policy (relaxed in development to allow localhost)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // For inline styles & Google Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      // Allow localhost in dev, only HTTPS in production
      isDev 
        ? "connect-src 'self' http://localhost:* http://127.0.0.1:* https: wss: ws:"
        : "connect-src 'self' https: wss: ws:",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // Don't upgrade insecure requests in dev (allows localhost HTTP)
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // ✅ Security Headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
  // ✅ Optimize images for better performance
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats with better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon/thumbnail sizes
    minimumCacheTTL: 60, // Cache images for 60 seconds
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // ✅ Compiler optimizations (Next.js 16 uses SWC by default)
  compiler: {
    // Remove console.log in production (reduces bundle size)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },
  
  // ✅ Disable source maps in production (reduces build size by ~30%)
  productionBrowserSourceMaps: false,
  
  // ✅ Experimental optimizations for better performance
  experimental: {
    // Optimize CSS output
    optimizeCss: true,
    // Optimize specific package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },
  
  // ✅ Turbopack configuration (Next.js 16+)
  // Empty config to acknowledge we're using Turbopack (no webpack config needed)
  turbopack: {},
};

export default nextConfig;
