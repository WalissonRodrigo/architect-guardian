import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { RegistryConfig } from "./GitSyncEngine.js";

export interface AppConfig {
  registries: RegistryConfig[];
}

export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(
      os.homedir(),
      ".architect-guardian",
      "config.json",
    );
  }

  async loadConfig(): Promise<AppConfig> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      return JSON.parse(content) as AppConfig;
    } catch (e: any) {
      if (e.code === "ENOENT") {
        return await this.createDefaultConfig();
      }
      throw new Error(`Failed to load config: ${e.message}`);
    }
  }

  private async createDefaultConfig(): Promise<AppConfig> {
    const defaultConfig: AppConfig = {
      registries: [
        {
          name: "core-skills",
          url: "https://github.com/WalissonRodrigo/architect-guardian-skills.git",
          branch: "main",
        },
        {
          name: "awesome-skills", // The repository chosen by the user for pro and mastery architectural skills
          url: "https://github.com/sickn33/antigravity-awesome-skills.git",
          branch: "main",
          skillsPath: "skills",
        },
      ],
    };

    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.configPath,
      JSON.stringify(defaultConfig, null, 2),
      "utf-8",
    );
    return defaultConfig;
  }
}
