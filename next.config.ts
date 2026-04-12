import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dtabpbuqodditvhsbpur.supabase.co",
      },
    ],
  },
};

export default nextConfig;
