/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendBase = process.env.BACKEND_INTERNAL_BASE_URL || "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;

