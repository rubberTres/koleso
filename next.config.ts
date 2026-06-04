import type { NextConfig } from "next";

const r2PublicHost = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2PublicHost ? [{ protocol: "https", hostname: r2PublicHost }] : [],
  },
};

export default nextConfig;
