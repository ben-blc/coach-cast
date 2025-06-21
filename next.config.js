/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // For static export, we define all the routes we want to pre-generate
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
      '/session-detail': { page: '/session-detail' }, // Static route for session details
    };
  },
};

module.exports = nextConfig;