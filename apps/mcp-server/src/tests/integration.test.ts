import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProjectDetector } from "../skills/detectors/ProjectDetector.js";

describe("ProjectDetector Integration Tests", () => {
  let detector: ProjectDetector;
  let tempDir: string;

  beforeEach(async () => {
    detector = new ProjectDetector();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ag-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should detect a Node.js project with TypeScript and Jest", async () => {
    // Setup fixture
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { typescript: "^5.0.0" },
        devDependencies: { jest: "^29.0.0" },
      }),
    );
    await fs.writeFile(path.join(tempDir, "tsconfig.json"), "{}");
    await fs.mkdir(path.join(tempDir, "tests"));

    const result = await detector.detect(tempDir);

    expect(result.language).toBe("TypeScript");
    expect(result.packageManager).toBe("npm"); // Default
    expect(result.hasTests).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("should detect a Python project with requirements.txt", async () => {
    await fs.writeFile(path.join(tempDir, "requirements.txt"), "flask\npytest");
    await fs.writeFile(path.join(tempDir, "app.py"), 'print("hello")');
    await fs.writeFile(
      path.join(tempDir, "test_app.py"),
      "def test_pass(): pass",
    );

    const result = await detector.detect(tempDir);

    expect(result.language).toBe("Python");
    expect(result.hasTests).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("should detect Docker and CI files", async () => {
    await fs.writeFile(path.join(tempDir, "Dockerfile"), "FROM node");
    await fs.mkdir(path.join(tempDir, ".github/workflows"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(tempDir, ".github/workflows/main.yml"),
      "name: CI",
    );

    const result = await detector.detect(tempDir);

    expect(result.hasDocker).toBe(true);
    expect(result.hasCI).toBe(true);
  });
});
