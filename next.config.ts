import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        followSymlinks: true,
      };

      config.snapshot.managedPaths = [];
    }

    return config;
  },
  experimental: {
    turbo: {
      unstablePersistentCaching: false,
    },
  },
};

export default nextConfig;
