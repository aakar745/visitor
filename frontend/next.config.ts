import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
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
