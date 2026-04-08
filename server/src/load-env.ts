import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Resolve `server/.env` whether the process is started from `server/` or the repo root. */
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(serverRoot, ".env") });
