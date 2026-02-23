import { ArchitecturalPattern } from "./manifest.js";

/**
 * Skill system types
 */

export interface ASTAnalysis {
  classes: string[];
  functions: string[];
  imports: string[];
  decorators: string[];
}

export interface ASTAnalysis {
  classes: string[];
  functions: string[];
  imports: string[];
  decorators: string[];
}

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags: string[];
  detectors: SkillDetectors;
  capabilities: SkillCapability[];
  config?: Record<string, unknown>;
}

export interface SkillDetectors {
  filePatterns?: string[];
  languages?: string[];
  frameworks?: string[];
  contentPatterns?: string[];
}

export interface SkillCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface Skill {
  manifest: SkillManifest;
  execute(context: ExecutionContext): Promise<SkillResult>;
}

export interface ExecutionContext {
  projectPath: string;
  projectStack: ProjectStack;
  config?: ArchitectConfig;
  previousResults?: SkillResult[];
  args: Record<string, unknown>;
  analysis?: Record<string, any>; // Generic analysis data (e.g., AST)
}

export interface SkillResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metrics?: {
    duration: number;
    tokensUsed?: number;
  };
}

export interface ProjectStack {
  language: string | null;
  framework: string | null;
  packageManager: string | null;
  hasTests: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  detectedFiles: string[];
  confidence: "high" | "medium" | "low";
  architecturalPattern?: string;
  reasoning?: string;
  rawContext?: {
    directoryTree: string[];
    manifests: Record<string, string>;
    readme?: string;
  };
}

export interface ArchitectConfig {
  version: string;
  contract: {
    adoptedPatterns: ArchitecturalPattern[];
    rejectedPatterns: string[];
  };
}
