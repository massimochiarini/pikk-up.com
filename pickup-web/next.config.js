/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    // Ignore supabase functions folder (Deno edge functions)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/**', '**/node_modules/**'],
    }
    return config
  },
}

module.exports = nextConfig

