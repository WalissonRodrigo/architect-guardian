import {
  ExecutionContext,
  ProjectStack,
} from "@architect-guardian/shared-types";
import * as path from "path";
import { beforeEach, describe, expect, it } from "vitest";
import { SkillEngine } from "../engine/SkillEngine.js";

describe("Architectural Skills Verification", () => {
  let engine: SkillEngine;
  const skillsDir = path.resolve(process.cwd(), "../../skills");
  const projectPath = path.resolve(
    process.cwd(),
    "../../test-fixtures/violations",
  );

  const mockStack: ProjectStack = {
    language: "TypeScript",
    framework: "React",
    packageManager: "npm",
    hasTests: true,
    hasDocker: false,
    hasCI: false,
    detectedFiles: [],
    confidence: "high",
  };

  beforeEach(() => {
    engine = new SkillEngine(skillsDir);
  });

  it("should inject Atomic Design metadata into the prompt for Button.tsx", async () => {
    const manifest = {
      name: "patterns/atomic-design",
      version: "1.0.0",
    } as any;

    const context: ExecutionContext = {
      projectPath,
      projectStack: mockStack,
      args: {
        filePath: "atomic-design/Button.tsx",
      },
    };

    const result = await engine.executeSkill(manifest, context);
    expect(result.success).toBe(true);
    // Verify AST data is present in the prompt
    expect(result.data).toContain("organisms/Header");
    expect(result.data).toContain("(Componente: true)");
  });

  it("should inject DDD metadata into the prompt for UserEntity.ts", async () => {
    const manifest = {
      name: "patterns/ddd",
      version: "1.0.0",
    } as any;

    const context: ExecutionContext = {
      projectPath,
      projectStack: mockStack,
      args: {
        filePath: "ddd/UserEntity.ts",
      },
    };

    const result = await engine.executeSkill(manifest, context);
    expect(result.success).toBe(true);
    // Verify AST data is present
    expect(result.data).toContain("infrastructure/UserRepository");
    expect(result.data).toContain('"classes": [');
    expect(result.data).toContain('"UserEntity"');
  });
});
