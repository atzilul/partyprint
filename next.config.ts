import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vinext emits the Node.js production entry at dist/standalone/server.js.
  output: "standalone",
  redirects: async () => [{
    source: "/:path*",
    has: [{ type: "host", value: "www.partyprint.co.il" }],
    destination: "https://partyprint.co.il/:path*",
    permanent: true,
  }],
  headers: async () => [
    ...['/admin/:path*','/api/:path*','/design/:path*','/track/:path*','/signin-with-chatgpt','/signout-with-chatgpt','/chatgpt-auth/:path*'].map(source=>({source,headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]})),
    {
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ],
  }],
};

export default nextConfig;
