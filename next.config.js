/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // For dynamic routes in static export, we need to handle them differently
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/auth': { page: '/auth' },
      '/dashboard': { page: '/dashboard' },
      '/discovery': { page: '/discovery' },
      '/coaches': { page: '/coaches' },
      '/verify-email': { page: '/verify-email' },
      '/session/ai-specialist': { page: '/session/ai-specialist' },
      '/session/digital-chemistry': { page: '/session/digital-chemistry' },
      '/session/human-voice-ai': { page: '/session/human-voice-ai' },
      // Dynamic session detail pages will be handled client-side
    };
  },
};

module.exports = nextConfig;