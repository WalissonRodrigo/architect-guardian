import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "..", "server.js");

async function setupClaude() {
  console.log("--- Architect Guardian: Claude Desktop Integration ---");

  let configPath: string;
  const platform = process.platform;

  if (platform === "win32") {
    configPath = path.join(
      process.env.APPDATA || "",
      "Claude",
      "claude_desktop_config.json",
    );
  } else if (platform === "darwin") {
    configPath = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );
  } else {
    configPath = path.join(
      os.homedir(),
      ".config",
      "Claude",
      "claude_desktop_config.json",
    );
  }

  try {
    let config: any = { mcpServers: {} };
    try {
      const content = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(content);
    } catch (e) {
      console.log("Creating new Claude config file...");
      await fs.mkdir(path.dirname(configPath), { recursive: true });
    }

    if (!config.mcpServers) config.mcpServers = {};

    config.mcpServers["architect-guardian"] = {
      command: "node",
      args: [serverPath],
      env: {
        // Add any necessary env vars here
      },
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log(
      `\x1b[32mSuccessfully added Architect Guardian to Claude Desktop config!\x1b[0m`,
    );
    console.log(`Config location: ${configPath}`);
    console.log("Please restart Claude Desktop to apply changes.");
  } catch (err: any) {
    console.error(
      `\x1b[31mFailed to update Claude config: ${err.message}\x1b[0m`,
    );
  }
}

setupClaude();
