#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as os from "os";
import * as path from "path";
import { CacheManager } from "./cache/CacheManager.js";
import { FileWatcher } from "./engine/FileWatcher.js";
import { SkillEngine } from "./engine/SkillEngine.js";
import { ProjectDetector } from "./skills/detectors/ProjectDetector.js";
import { ConfigManager } from "./sync/ConfigManager.js";
import { GitSyncEngine } from "./sync/GitSyncEngine.js";

const transport = new StdioServerTransport();
const server = new Server(
  {
    name: "architect-guardian",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const cacheManager = new CacheManager();
const syncEngine = new GitSyncEngine();
const skillEngine = new SkillEngine(
  path.join(os.homedir(), ".architect-guardian", "skills"),
);
const projectDetector = new ProjectDetector();

// Error handling for registry updates
const watcher = new FileWatcher(
  path.join(os.homedir(), ".architect-guardian", "skills"),
  async () => {
    console.error("Skills registry updated, reloading...");
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const skills = await syncEngine.listCachedSkills();
  return {
    tools: skills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      inputSchema: skill.capabilities[0].inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const skills = await syncEngine.listCachedSkills();
    const skill = skills.find((s) => s.name === request.params.name);

    if (!skill) {
      throw new Error(`Skill ${request.params.name} not found`);
    }

    const args = (request.params.arguments || {}) as Record<string, any>;
    const projectPath = (args.projectPath as string) || process.cwd();
    const stack = await projectDetector.detect(projectPath);

    const result = await skillEngine.executeSkill(skill, {
      projectPath,
      projectStack: stack,
      args: args,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  await cacheManager.initialize();
  await syncEngine.initialize();
  watcher.start();

  const configManager = new ConfigManager();

  try {
    const config = await configManager.loadConfig();
    for (const registry of config.registries) {
      try {
        console.error(`Syncing registry: ${registry.name}...`);
        await syncEngine.syncRegistry(registry);
        console.error(`Registry ${registry.name} synced successfully.`);
      } catch (error) {
        console.error(`Failed to sync registry ${registry.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to load application configuration:", error);
  }

  await server.connect(transport);
  console.error("Architect Guardian MCP Server running on stdio");
}

main().catch((error: any) => {
  console.error("Server error:", error);
  process.exit(1);
});
