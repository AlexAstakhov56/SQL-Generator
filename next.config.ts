import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        util: false,
        assert: false,
        child_process: false,
        dns: false,
        http2: false,
        https: false,
        zlib: false,
        querystring: false,
        ssh2: false,
        dockerode: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["dockerode", "ssh2"],
  },
};

export default nextConfig;
