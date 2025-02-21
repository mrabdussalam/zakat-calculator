/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Custom webpack config to handle caching and module resolution
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      }
    }
    
    // Configure module resolution
    config.resolve = {
      ...config.resolve,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx'],
        '.jsx': ['.jsx', '.tsx']
      }
    }
    
    return config
  }
}

module.exports = nextConfig 