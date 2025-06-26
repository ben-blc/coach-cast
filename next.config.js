/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow dynamic routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Optimize fonts to prevent loading errors
  optimizeFonts: false,
  // Disable font optimization to prevent fetch errors
  experimental: {
    fontLoaders: [],
    serverActions: true, // Enable Server Actions
  },
};

module.exports = nextConfig;