/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Optimize fonts to prevent loading errors
  optimizeFonts: false,
  // Disable font optimization to prevent fetch errors
  experimental: {
    fontLoaders: [],
  },
  // Ensure static export works properly
  distDir: 'out',
  // Handle dynamic routes for static export
  generateStaticParams: async () => {
    return [];
  },
  // Disable server-side features for static export
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
};

module.exports = nextConfig;