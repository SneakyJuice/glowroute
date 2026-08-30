/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com', 'psiuknphchmhsthvhkpt.supabase.co'],
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
