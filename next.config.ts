import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vinext emits the Node.js production entry at dist/standalone/server.js.
  output: "standalone",
};

export default nextConfig;
