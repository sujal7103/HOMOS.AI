import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'rate-limiter-flexible',
    '@inngest/agent-kit',
  ],
};

export default nextConfig;
