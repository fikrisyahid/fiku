import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/transaksi",
        destination: "/transaction",
        permanent: true,
      },
      {
        source: "/ringkasan",
        destination: "/summary",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
