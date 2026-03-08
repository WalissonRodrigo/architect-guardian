import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(extensionDir, "../..");
const mcpServerDir = path.join(rootDir, "apps", "mcp-server");
const distServerDir = path.join(extensionDir, "dist-server");

console.log("\x1b[33mBuilding MCP Server for extension distribution...\x1b[0m");

// 1. Bundle the MCP server
try {
  execSync("npm run bundle", { stdio: "inherit", cwd: mcpServerDir });
} catch (error) {
  console.error(
    "\x1b[31mFailed to bundle the MCP server.\x1b[0m",
    error.message,
  );
  process.exit(1);
}

// 2. Ensure dist-server exists
if (!fs.existsSync(distServerDir)) {
  fs.mkdirSync(distServerDir, { recursive: true });
}

// 3. Copy the bundled server and its source map
const serverSource = path.join(mcpServerDir, "dist", "index.cjs");
const serverDest = path.join(distServerDir, "index.cjs");

if (fs.existsSync(serverSource)) {
  fs.copyFileSync(serverSource, serverDest);
  console.log(`\x1b[32mCopied ${serverSource} to ${serverDest}\x1b[0m`);
} else {
  console.error(`\x1b[31mSource file not found: ${serverSource}\x1b[0m`);
  process.exit(1);
}

const mapSource = path.join(mcpServerDir, "dist", "index.cjs.map");
if (fs.existsSync(mapSource)) {
  fs.copyFileSync(mapSource, path.join(distServerDir, "index.cjs.map"));
  console.log(`\x1b[32mCopied source map to dist-server\x1b[0m`);
}
