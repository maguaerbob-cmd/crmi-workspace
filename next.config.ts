import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // Static export support
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  // Required for Pages Router in newer Next.js versions if app dir exists
  reactStrictMode: true,
};

export default nextConfig;