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
  optimizeFonts: false,
  experimental: {
    fontLoaders: [],
    serverActions: true, // Enable Server Actions
  },
  distDir: 'out',
  typescript: {
    ignoreBuildErrors: true,
  },
  // Simplified webpack config - no complex ignore rules
  webpack: (config) => {
    // Simple exclusion of problematic files
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