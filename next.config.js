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
  },
  distDir: 'out',
  // Completely exclude Supabase functions and Deno files from webpack
  webpack: (config, { isServer }) => {
    // Ignore all Supabase function files
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Add rules to ignore Deno and Supabase function files
    config.module.rules.push({
      test: /\.(ts|js)$/,
      include: [
        /supabase\/functions/,
        /deno\.json$/,
        /deno\.lock$/,
      ],
      use: 'ignore-loader'
    });
    
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;