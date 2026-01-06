import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  eslint: {
    // Warning: This disables ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This disables TypeScript type checking during builds
    ignoreBuildErrors: true,
  },
  // Static site generation for shared hosting
  //output: 'export', // Re-enabled for deployment
  // Set this if your site is not hosted at the root of the domain
  // basePath: '',
  // This helps with routing on shared hosting
  trailingSlash: true,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
} as NextConfig;

export default nextConfig;
