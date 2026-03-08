import { SkillManifest } from '@architect-guardian/shared-types';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { SchemaValidator } from './SchemaValidator.js';

export interface RegistryConfig {
  name: string;
  url: string;
  branch?: string;
  skillsPath?: string;
  autoUpdate?: boolean;
}

export interface SyncReport {
  registry: string;
  status: 'success' | 'failed';
  updatedSkills: string[];
  error?: string;
}

export interface SkillLocation {
  manifest: SkillManifest;
  path: string;
}

export class GitSyncEngine {
  private baseCacheDir: string;
  private validator: SchemaValidator;
  private git: SimpleGit;

  constructor() {
    this.baseCacheDir = path.join(os.homedir(), '.architect-guardian', 'skills');
    this.validator = new SchemaValidator();
    this.git = simpleGit();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.baseCacheDir, { recursive: true });
    // Ensure local skills directory exists
    await fs.mkdir(path.join(this.baseCacheDir, 'local', 'skills'), { recursive: true });
  }

  async syncRegistry(config: RegistryConfig): Promise<SyncReport> {
    const registryDir = path.join(this.baseCacheDir, config.name);
    const report: SyncReport = {
      registry: config.name,
      status: 'success',
      updatedSkills: [],
    };

    try {
      if (await this.exists(registryDir)) {
        // Update
        const repoGit = simpleGit(registryDir);
        await repoGit.pull('origin', config.branch || 'main');
      } else {
        // Clone
        await this.git.clone(config.url, registryDir, [
          '--branch',
          config.branch || 'main',
          '--depth',
          '1',
        ]);
      }

      // Load and validate skills
      const skillsPath = path.join(registryDir, config.skillsPath || 'skills');
      if (await this.exists(skillsPath)) {
        const skillDirs = await fs.readdir(skillsPath, { withFileTypes: true });
        for (const entry of skillDirs) {
          if (entry.isDirectory()) {
            try {
              const manifestPath = path.join(skillsPath, entry.name, 'manifest.json');
              if (await this.exists(manifestPath)) {
                const content = await fs.readFile(manifestPath, 'utf-8');
                const data = JSON.parse(content);
                this.validator.validate(data);
                report.updatedSkills.push(data.name);
              }
            } catch (e: any) {
              console.error(`Skill validation failed in ${entry.name}: ${e.message}`);
            }
          }
        }
      }
    } catch (error: any) {
      report.status = 'failed';
      report.error = error.message;
    }

    return report;
  }

  private async exists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  async listCachedSkills(): Promise<SkillLocation[]> {
    const skills: SkillLocation[] = [];
    const registries = await fs.readdir(this.baseCacheDir);

    for (const registry of registries) {
      const skillsPath = path.join(this.baseCacheDir, registry, 'skills');
      if (await this.exists(skillsPath)) {
        const skillDirs = await fs.readdir(skillsPath);
        for (const skillName of skillDirs) {
          const skillDir = path.join(skillsPath, skillName);
          const manifestPath = path.join(skillDir, 'manifest.json');
          if (await this.exists(manifestPath)) {
            try {
              const content = await fs.readFile(manifestPath, 'utf-8');
              skills.push({
                manifest: JSON.parse(content),
                path: skillDir,
              });
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    }
    return skills;
  }
}
