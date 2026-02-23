import {
  ExecutionContext,
  ProjectStack,
  SkillManifest,
  SkillResult,
} from "@architect-guardian/shared-types";
import * as fs from "fs/promises";
import Handlebars from "handlebars";
import * as path from "path";

import { ASTAnalyzer } from "../skills/detectors/ASTAnalyzer.js";

export class SkillEngine {
  private skillsDir: string;
  private analyzer: ASTAnalyzer;

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
    this.analyzer = new ASTAnalyzer();
    // Register basic helpers for templates
    Handlebars.registerHelper("json", (context) =>
      JSON.stringify(context, null, 2),
    );
  }

  async executeSkill(
    manifest: SkillManifest,
    context: ExecutionContext,
  ): Promise<SkillResult> {
    const startTime = Date.now();
    try {
      const skillPath = path.join(this.skillsDir, manifest.name);

      // In Phase 1, we support "Prompt-based" skills and "Logic-based" skills
      // For now, let's assume skills are prompt templates
      const promptPath = path.join(skillPath, "prompt.md");
      let output: any;

      if (await this.exists(promptPath)) {
        const templateSource = await fs.readFile(promptPath, "utf-8");

        // If the skill is targeting a specific file, perform deep analysis first
        if (
          context.args.filePath &&
          typeof context.args.filePath === "string"
        ) {
          const fullPath = path.isAbsolute(context.args.filePath)
            ? context.args.filePath
            : path.join(context.projectPath, context.args.filePath);

          const astAnalysis = await this.analyzer.analyze(fullPath);
          context.analysis = {
            ast: astAnalysis,
            moduleType: this.analyzer.getModuleType(fullPath),
            isComponent: this.analyzer.isComponent(astAnalysis, fullPath),
          };
        }

        const template = Handlebars.compile(templateSource);

        // Inject context variables
        output = template({
          project: {
            path: context.projectPath,
            stack: context.projectStack,
            config: context.config,
          },
          args: context.args,
          analysis: context.analysis,
        });
      }

      return {
        success: true,
        data: output,
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metrics: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private async exists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  findRelevantSkills(
    stack: ProjectStack,
    availableSkills: SkillManifest[],
  ): SkillManifest[] {
    return availableSkills.filter((skill) => {
      const { detectors } = skill;

      // Match language
      if (detectors.languages?.length && stack.language) {
        if (!detectors.languages.includes(stack.language)) return false;
      }

      // Match framework
      if (detectors.frameworks?.length && stack.framework) {
        if (!detectors.frameworks.includes(stack.framework)) return false;
      }

      // Simple detector check for Phase 1
      return true;
    });
  }
}
