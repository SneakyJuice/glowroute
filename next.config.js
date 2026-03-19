/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig
