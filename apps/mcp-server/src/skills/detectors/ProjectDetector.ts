import { ProjectStack } from '@architect-guardian/shared-types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ASTAnalyzer } from './ASTAnalyzer.js';

export class ProjectDetector {
  private astAnalyzer: ASTAnalyzer;

  constructor() {
    this.astAnalyzer = new ASTAnalyzer();
  }

  async detect(projectPath: string): Promise<ProjectStack> {
    const detectedFiles = await this.listAllFiles(projectPath);
    const manifests = await this.extractManifests(projectPath, detectedFiles);
    const readme = await this.extractReadme(projectPath, detectedFiles);

    // Basic heuristic for tests
    let language: string | null = 'Dynamic via AI';
    let packageManager: string | null = 'Pending AI Analysis';

    if (manifests['package.json']) {
      language = 'TypeScript'; // Default for our stack, or detected via files
      packageManager = 'npm';
      if (detectedFiles.some((f) => f.endsWith('.ts') || f.endsWith('.tsx')))
        language = 'TypeScript';
      else if (detectedFiles.some((f) => f.endsWith('.js') || f.endsWith('.jsx')))
        language = 'JavaScript';
    } else if (manifests['requirements.txt'] || manifests['pyproject.toml']) {
      language = 'Python';
      packageManager = 'pip';
    } else if (manifests['pom.xml'] || manifests['build.gradle']) {
      language = 'Java';
      packageManager = manifests['pom.xml'] ? 'maven' : 'gradle';
    }

    return {
      language,
      framework: 'Pending AI Analysis',
      packageManager,
      hasTests: detectedFiles.some((f) => f.toLowerCase().includes('test') || f.includes('spec')),
      hasDocker: detectedFiles.some((f) => f.includes('docker') || f.includes('Docker')),
      hasCI: detectedFiles.some((f) => f.includes('.github') || f.includes('gitlab-ci')),
      detectedFiles: detectedFiles.slice(0, 50),
      confidence: language !== 'Dynamic via AI' ? 'high' : 'medium',
      rawContext: {
        directoryTree: detectedFiles,
        manifests,
        readme,
      },
    };
  }

  private async extractManifests(
    projectPath: string,
    files: string[],
  ): Promise<Record<string, string>> {
    const manifestNames = [
      'package.json',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'CMakeLists.txt',
      'Cargo.toml',
      'go.mod',
      'requirements.txt',
      'pyproject.toml',
      'composer.json',
    ];

    const results: Record<string, string> = {};
    for (const m of manifestNames) {
      if (files.includes(m)) {
        try {
          const content = await fs.readFile(path.join(projectPath, m), 'utf8');
          results[m] = content.substring(0, 8000); // Cap at 8KB to avoid token overload
        } catch (e) {
          // Ignore
        }
      }
    }
    return results;
  }

  private async extractReadme(projectPath: string, files: string[]): Promise<string | undefined> {
    const readmeFile = files.find((f) => f.toLowerCase() === 'readme.md');
    if (readmeFile) {
      try {
        const content = await fs.readFile(path.join(projectPath, readmeFile), 'utf8');
        return content.substring(0, 3000); // Cap at 3KB for context
      } catch (e) {
        // Ignore
      }
    }
    return undefined;
  }

  private async listAllFiles(
    dir: string,
    currentDepth: number = 0,
    maxDepth: number = 5,
  ): Promise<string[]> {
    const files: string[] = [];
    if (currentDepth > maxDepth) return files;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (
            [
              'node_modules',
              '.git',
              'dist',
              'out',
              'build',
              'target',
              'vendor',
              '.idea',
              '.vscode',
              'coverage',
              '__pycache__',
              'venv',
              '.env',
            ].includes(entry.name)
          )
            continue;
          files.push(entry.name + '/');
          const subEntries = await this.listAllFiles(
            path.join(dir, entry.name),
            currentDepth + 1,
            maxDepth,
          );
          files.push(...subEntries.map((f) => path.join(entry.name, f)));
        } else {
          files.push(entry.name);
        }
      }
    } catch (e) {
      console.error('Error listing files:', e);
    }
    return files;
  }
}
