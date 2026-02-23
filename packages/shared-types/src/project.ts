/**
 * Project analysis types
 */

export interface ProjectAnalysis {
  path: string;
  stack: import("./skill.js").ProjectStack;
  architecture?: ArchitectureAnalysis;
  quality?: QualityMetrics;
  timestamp: Date;
}

export interface ArchitectureAnalysis {
  patterns: DetectedPattern[];
  violations: ArchitectureViolation[];
  suggestions: string[];
}

export interface DetectedPattern {
  name: string;
  confidence: number;
  evidence: string[];
}

export interface ArchitectureViolation {
  rule: string;
  severity: "error" | "warning" | "info";
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface QualityMetrics {
  testCoverage?: number;
  codeComplexity?: number;
  duplicationScore?: number;
  maintainabilityIndex?: number;
}
