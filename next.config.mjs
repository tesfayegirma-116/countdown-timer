/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable server-side features for static export
  trailingSlash: true,
  // Exclude API routes from static export
  generateBuildId: async () => {
    return 'build'
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude better-sqlite3 from server-side bundle for static export
      config.externals = config.externals || []
      config.externals.push('better-sqlite3')
    }
    return config
  },
}

export default nextConfig
