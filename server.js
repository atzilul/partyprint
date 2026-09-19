// A host may resolve its entry file from the project root instead of the
// configured output directory. Both locations must start the same artifact.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const entry = new URL("./dist/standalone/server.js", import.meta.url);
if (!existsSync(entry)) {
  throw new Error("PartyPrint production output is missing. Run npm run build before starting the server.");
}

// The SQLite adapter locates the packaged migrations beside the entry file.
// This also normalizes entry discovery when a process manager imports this file.
// Hostinger's LiteSpeed launcher loads this file with require(), so this entry
// must not contain top-level await. The promise keeps the process alive through
// the HTTP server and reports startup failures to the launcher logs.
process.argv[1] = fileURLToPath(entry);
import(entry.href).catch(error => {
  console.error("[partyprint] Failed to start production server");
  console.error(error);
  process.exitCode = 1;
});
