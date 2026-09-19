import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("dist/standalone/", root);
for (const path of ["server.js", "dist/server/index.js", "package.json"]) {
  if (!existsSync(new URL(path, output))) throw new Error(`Missing Node build artifact: ${path}`);
}
cpSync(new URL("drizzle", root), new URL("drizzle", output), { recursive: true });
const source = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const manifestPath = new URL("package.json", output);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
writeFileSync(manifestPath, JSON.stringify({
  ...manifest,
  name: "partyprint-production",
  version: source.version,
  private: true,
  type: "module",
  main: "server.js",
  engines: source.engines,
  scripts: { start: "node server.js" },
}, null, 2) + "\n");
console.log(`[partyprint] Packaged Node entry, start script and migrations at ${fileURLToPath(output)}`);
