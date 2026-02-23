#!/usr/bin/env node

/**
 * Architect Guardian - Smart Bootstrap Script
 * Automates: install, build, and extension packaging.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function run(command, cwd = rootDir) {
  console.log(`\n\x1b[36m> Running: ${command}\x1b[0m`);
  execSync(command, { stdio: "inherit", cwd });
}

async function bootstrap() {
  console.log("\x1b[32m=== Architect Guardian: Smart Setup ===\x1b[0m");

  // 1. Install dependencies
  run("npm install");

  // 2. Build everything
  console.log("\n\x1b[33mBuilding monorepo...\x1b[0m");
  run("npx turbo run build");

  // 2.5 Bundle and Copy MCP Server to Extension
  console.log(
    "\n\x1b[33mBundling MCP Server for extension distribution...\x1b[0m",
  );
  const mcpServerDir = path.join(rootDir, "apps", "mcp-server");
  const extensionDir = path.join(rootDir, "apps", "vscode-extension");
  const distServerDir = path.join(extensionDir, "dist-server");

  run("npm run bundle", mcpServerDir);

  if (!fs.existsSync(distServerDir)) {
    fs.mkdirSync(distServerDir, { recursive: true });
  }

  const serverSource = path.join(mcpServerDir, "dist", "index.cjs");
  const serverDest = path.join(distServerDir, "index.cjs");
  fs.copyFileSync(serverSource, serverDest);

  const mapSource = path.join(mcpServerDir, "dist", "index.cjs.map");
  if (fs.existsSync(mapSource)) {
    fs.copyFileSync(mapSource, path.join(distServerDir, "index.cjs.map"));
  }

  // 3. Package extension
  console.log("\n\x1b[33mPackaging VS Code Extension (.vsix)...\x1b[0m");
  run("npm run vsix", extensionDir);

  // 4. Locate the VSIX
  const files = fs.readdirSync(extensionDir);
  const vsixFile = files.find((f) => f.endsWith(".vsix"));

  console.log("\n\x1b[32m=== Setup Complete! ===\x1b[0m");
  if (vsixFile) {
    console.log(
      `\x1b[35mExtension ready at: apps/vscode-extension/${vsixFile}\x1b[0m`,
    );
  }

  console.log("\n\x1b[1mNext Steps:\x1b[0m");
  console.log("1. Install the .vsix in your VS Code.");
  console.log("2. The MCP server is located in apps/mcp-server/dist/server.js");
  console.log(
    '3. Run "npx @architect-guardian/mcp-server install-claude" to auto-configure Claude Desktop (Coming soon).',
  );
}

bootstrap().catch((err) => {
  console.error("\n\x1b[31mSetup failed:\x1b[0m", err.message);
  process.exit(1);
});
