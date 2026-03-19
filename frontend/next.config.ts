import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production deployment on Render uses npm start (next start) */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
