/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'psiuknphchmhsthvhkpt.supabase.co' },
    ],
  },
  trailingSlash: false,
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/sitemap/:id(\\d+)\\.xml',
          destination: '/sitemap-chunk/:id',
        },
      ],
    }
  },
}

module.exports = nextConfig
