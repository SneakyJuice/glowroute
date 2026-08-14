/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Keep static generation within Supabase connection/query limits.
  // Clinic pages fetch metadata and content from Supabase during the build.
  experimental: { cpus: 1 },
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com', 'psiuknphchmhsthvhkpt.supabase.co'],
  },
  trailingSlash: false,
}

module.exports = nextConfig
