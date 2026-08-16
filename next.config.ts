import type { NextConfig } from 'next';

const config: NextConfig = {
  // Dockerfile shu chiqishga tayanadi — §2.3 platformaga bog'lanmaslik tekshiruvi
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    // Xato yashirilmaydi — QISM 1 §5
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default config;
