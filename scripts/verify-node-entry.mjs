// Packaging smoke test, intentionally independent of real orders and credentials.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "partyprint-entry-"));
const isolated = join(temp, "app");
async function check(label, cwd, args) {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(PARTYPRINT_|VINEXT_|RESEND_|MAIL_)/.test(key)) delete env[key];
  }
  Object.assign(env, { NODE_ENV: "production", HOST: "127.0.0.1", PORT: String(port) });
  let logs = "";
  const child = spawn(process.execPath, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", bytes => { logs += bytes; });
  child.stderr.on("data", bytes => { logs += bytes; });
  const closed = new Promise(resolve => {
    child.once("error", error => { logs += error.message; resolve(); });
    child.once("close", resolve);
  });
  try {
    let response;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
      try {
        response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
        break;
      } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert.equal(response?.status, 200, `${label} did not boot successfully.\n${logs}`);
    const html = await response.text();
    assert.match(html, /PARTYPRINT/i);
    console.log(`[partyprint] PASS ${label}: HTTP 200 on Node ${process.versions.node}`);
  } finally {
    child.kill("SIGTERM");
    const killTimer = setTimeout(() => child.kill("SIGKILL"), 3000);
    await closed;
    clearTimeout(killTimer);
  }
}
try {
  await check("repository server.js", temp, [join(root, "server.js")]);
  // A real copy outside the checkout prevents resolution from source dependencies.
  await cp(join(root, "dist/standalone"), isolated, { recursive: true, dereference: true });
  await check("isolated standalone server.js", isolated, [join(isolated, "server.js")]);
  console.log("[partyprint] Node artifact boot verified. Order storage and staff access still require runtime configuration.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
