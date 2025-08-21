import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'photonotes-992da.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Exclude functions directory from Next.js build
  webpack: (config, { isServer }) => {
    // Ignore functions directory in webpack resolution
    config.watchOptions = {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/functions/**',
        '**/scripts/**',
      ],
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Additional optimization settings
  experimental: {
    optimizePackageImports: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
};

export default nextConfig;
