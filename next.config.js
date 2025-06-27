/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  optimizeFonts: false,
  experimental: {
    fontLoaders: [],
    serverActions: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Generate static pages for better deployment compatibility
  generateStaticParams: async () => {
    return [];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;