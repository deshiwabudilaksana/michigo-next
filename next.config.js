/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Environment variables that Next.js should expose to the client
    // (only variables added here will be available in the browser)
  },
  async rewrites() {
    return [
      // Optional: redirect all /api/v1/* to /api/*
      // { source: '/api/v1/:path*', destination: '/api/:path*' },
    ];
  },
};

module.exports = nextConfig;