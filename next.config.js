/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' - this prevents Server Actions from working
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
    serverActions: true, // Enable Server Actions
  },
  // Removed distDir: 'out' - not needed without static export
  typescript: {
    ignoreBuildErrors: true,
  },
  // Simplified webpack config
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