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
}

module.exports = nextConfig
