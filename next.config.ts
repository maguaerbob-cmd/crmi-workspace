import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Игнорируем ошибки типов при сборке для ускорения деплоя
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорируем линтинг при сборке
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // Важно: для App Hosting НЕ используем 'output: export'
  reactStrictMode: true,
};

export default nextConfig;
