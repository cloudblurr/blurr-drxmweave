/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev-only stability: this experiment can cause module id/require mismatches
  // that surface as `Cannot read properties of undefined (reading 'call')`.
  // Re-enable once confirmed stable with your Next/React versions.
  experimental: {}
};

export default nextConfig;
