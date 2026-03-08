#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { CacheManager } from './cache/CacheManager.js';
import { FileWatcher } from './engine/FileWatcher.js';
import { SkillEngine } from './engine/SkillEngine.js';
import { ProjectDetector } from './skills/detectors/ProjectDetector.js';
import { ConfigManager } from './sync/ConfigManager.js';
import { GitSyncEngine } from './sync/GitSyncEngine.js';

const transport = new StdioServerTransport();
const server = new Server(
  {
    name: 'architect-guardian',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const cacheManager = new CacheManager();
const syncEngine = new GitSyncEngine();
const skillEngine = new SkillEngine();
const projectDetector = new ProjectDetector();

// Error handling for registry updates
const watcher = new FileWatcher(
  path.join(os.homedir(), '.architect-guardian', 'skills'),
  async () => {
    console.error('Skills registry updated, reloading...');
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const skillLocations = await syncEngine.listCachedSkills();
  const tools = skillLocations.map((loc) => ({
    name: loc.manifest.name,
    description: loc.manifest.description,
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string' },
        ...(loc.manifest.capabilities[0].inputSchema.properties as any),
      },
      required: [
        'projectPath',
        ...((loc.manifest.capabilities[0].inputSchema.required as string[]) || []),
      ],
    },
  }));

  // Add system tools
  tools.push({
    name: 'add_custom_skill',
    description: 'Add a new custom skill to the local registry',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        prompt: { type: 'string' },
        language: { type: 'string' },
      },
      required: ['name', 'description', 'prompt'],
    } as any,
  });

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'add_custom_skill') {
      const args = request.params.arguments as any;
      const localSkillsPath = path.join(
        os.homedir(),
        '.architect-guardian',
        'skills',
        'local',
        'skills',
      );
      const skillPath = path.join(localSkillsPath, args.name);
      await fs.mkdir(skillPath, { recursive: true });

      const manifest = {
        name: args.name,
        version: '0.1.0',
        description: args.description,
        tags: ['custom'],
        detectors: {
          languages: args.language ? [args.language] : [],
        },
        capabilities: [
          {
            name: 'execute',
            description: args.description,
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };

      await fs.writeFile(path.join(skillPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
      await fs.writeFile(path.join(skillPath, 'prompt.md'), args.prompt);

      return {
        content: [
          { type: 'text', text: `Skill '${args.name}' added successfully to local registry.` },
        ],
      };
    }

    const skillLocations = await syncEngine.listCachedSkills();
    const skillLoc = skillLocations.find((loc) => loc.manifest.name === request.params.name);

    if (!skillLoc) {
      throw new Error(`Skill ${request.params.name} not found`);
    }

    const args = (request.params.arguments || {}) as Record<string, any>;
    const projectPath = (args.projectPath as string) || process.cwd();
    const stack = await projectDetector.detect(projectPath);

    const result = await skillEngine.executeSkill(
      skillLoc.manifest,
      {
        projectPath,
        projectStack: stack,
        args: args,
      },
      skillLoc.path,
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
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
    console.error('Failed to load application configuration:', error);
  }

  await server.connect(transport);
  console.error('Architect Guardian MCP Server running on stdio');
}

main().catch((error: any) => {
  console.error('Server error:', error);
  process.exit(1);
});
