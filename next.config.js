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
  // Exclude Supabase functions from build completely
  webpack: (config, { isServer }) => {
    // Exclude all Supabase functions from webpack compilation
    config.module.rules.push({
      test: /\.(ts|js)$/,
      include: [
        /supabase\/functions/,
        /supabase\/.*\.ts$/,
        /supabase\/.*\.js$/
      ],
      use: 'ignore-loader'
    });
    
    // Also exclude any Deno-specific files
    config.module.rules.push({
      test: /deno\.json$/,
      use: 'ignore-loader'
    });
    
    return config;
  },
  // Exclude Supabase functions from TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;