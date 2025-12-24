import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce memory usage for low-memory environments (512MB)
  experimental: {
    // Reduce build-time memory usage
    webpackMemoryOptimizations: true,
    // Enable server actions for WorkOS auth
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,
  // Optimize image handling
  images: {
    // Reduce memory for image optimization
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    // Allow WorkOS profile images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.workos.com",
      },
      {
        protocol: "https",
        hostname: "**.gravatar.com",
      },
    ],
  },
  // Enable compression
  compress: true,
};

export default nextConfig;
