import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jfrhlnsylnevqerdnmsc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
