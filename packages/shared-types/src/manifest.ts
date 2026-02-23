/**
 * .architect.yml manifest types
 */

export interface ArchitectManifest {
  version: string;
  name: string;
  description?: string;
  createdAt: string;
  lastReview: string;
  stack: TechStack;
  adoptedPatterns: ArchitecturalPattern[];
  rejectedPatterns: string[];
  qualityGates: QualityGates;
  conventions: CodeConventions;
}

export interface TechStack {
  language: string;
  framework?: string;
  runtime?: string;
  orm?: string;
  testing?: string;
  database?: string;
}

export interface ArchitecturalPattern {
  name: string;
  scope: string;
  strictness: 'guide' | 'warn' | 'enforce';
  rationale?: string;
}

export interface QualityGates {
  coverage?: number;
  complexity?: number;
  dependencies?: boolean;
  typescript?: TypeScriptConfig;
}

export interface TypeScriptConfig {
  strict: boolean;
  noImplicitAny: boolean;
  strictNullChecks: boolean;
}

export interface CodeConventions {
  naming: NamingConventions;
  structure: StructureConventions;
  imports: ImportConventions;
}

export interface NamingConventions {
  classes: string;
  interfaces: string;
  functions: string;
  constants: string;
  files: string;
}

export interface StructureConventions {
  maxFileLines: number;
  maxFunctionLines: number;
  maxParameters: number;
}

export interface ImportConventions {
  order: string[];
  avoid: string[];
}
