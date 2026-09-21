import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
// The same checkout can be built for Sites/Cloudflare or for Hostinger's
// ordinary Node process. Hostinger and CI do not have the Sites profile; the
// explicit switch also lets us verify that target inside the managed sandbox.
const nodeBuild = process.env.PARTYPRINT_NODE_BUILD === "1";
const managedLinux = readExecutionProfile() === "managed-linux" && !nodeBuild;
const generatedCloudflareRuntime = new URL("./runtime/.generated-cloudflare.ts", import.meta.url);

function prepareCloudflareRuntime() {
  if (!managedLinux) return;

  // Keep the Worker-only module out of the repository source tree. Hostinger
  // builds the portable Node target and rejects that module even though the
  // Node bundle never imports it.
  const workerModule = ["cloudflare:", "workers"].join("");
  writeFileSync(generatedCloudflareRuntime, `import { env as workerEnv } from ${JSON.stringify(workerModule)};
import type { RuntimeEnv, RuntimeUser } from './types';
export const env = workerEnv as unknown as RuntimeEnv;
export const runtimeKind = 'cloudflare';
export function publicOrigin() { return 'https://partyprint-ai.atzilul.chatgpt.site'; }
export async function authenticatedUser(h: Headers): Promise<RuntimeUser | null> {
  const userId = h.get('oai-authenticated-user-id');
  const email = h.get('oai-authenticated-user-email');
  if (!userId || !email) return null;
  let fullName: string | null = null;
  try {
    if (h.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
      fullName = decodeURIComponent(h.get('oai-authenticated-user-full-name') || '') || null;
    }
  } catch {}
  return { userId, email, fullName, displayName: fullName || email };
}
export async function login(_r: Request): Promise<Response> { void _r; return new Response(null, { status: 404 }); }
export async function logout(_r: Request): Promise<Response> { void _r; return new Response(null, { status: 404 }); }
export function clientKey(r: Request) {
  return r.headers.get('CF-Connecting-IP') || r.headers.get('oai-authenticated-user-id') || 'anonymous';
}
`);
}

const localBindingConfig = {
  main: "vinext/server/fetch-handler",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  prepareCloudflareRuntime();

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const cloudflarePlugin = managedLinux ? (await import("@cloudflare/vite-plugin")).cloudflare : null;

  return {
    resolve: {
      alias: {
        "#partyprint-runtime": managedLinux
          ? fileURLToPath(generatedCloudflareRuntime)
          : fileURLToPath(new URL("./runtime/node.ts", import.meta.url)),
      },
    },
    server: {
      ...(managedLinux ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] } : {}),
      ...(isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    },
    plugins: [
      vinext(),
      sites({ mockAuth: !managedLinux }),
      ...(cloudflarePlugin ? [cloudflarePlugin({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      })] : []),
    ],
  };
});
