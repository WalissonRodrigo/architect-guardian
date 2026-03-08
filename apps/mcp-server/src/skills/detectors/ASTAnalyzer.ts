import { ASTAnalysis } from '@architect-guardian/shared-types';
import { parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs/promises';

export class ASTAnalyzer {
  async analyze(filePath: string): Promise<ASTAnalysis> {
    const analysis: ASTAnalysis = {
      classes: [],
      functions: [],
      imports: [],
      decorators: [],
    };

    try {
      const code = await fs.readFile(filePath, 'utf-8');
      const ast = parse(code, {
        jsx: true,
        loc: true,
        range: true,
        tokens: false,
        comment: false,
        useJSXTextNode: false,
      });

      this.traverse(ast, analysis);
    } catch (error) {
      // Silently fail for non-TS/JS files or parse errors
    }

    return analysis;
  }

  private traverse(node: any, analysis: ASTAnalysis) {
    if (!node || typeof node !== 'object') return;

    // Extract Classes
    if (node.type === 'ClassDeclaration' && node.id) {
      analysis.classes.push(node.id.name);
    }

    // Extract Functions
    if (
      (node.type === 'FunctionDeclaration' || node.type === 'MethodDefinition') &&
      (node.key?.name || node.id?.name)
    ) {
      analysis.functions.push(node.key?.name || node.id?.name);
    }

    // Extract Imports
    if (node.type === 'ImportDeclaration' && node.source) {
      analysis.imports.push(node.source.value);
    }

    // Extract Decorators (TS specific)
    if (node.decorators) {
      for (const decorator of node.decorators) {
        if (decorator.expression && decorator.expression.callee) {
          analysis.decorators.push(decorator.expression.callee.name);
        }
      }
    }

    // Recurse
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => this.traverse(c, analysis));
        } else {
          this.traverse(child, analysis);
        }
      }
    }
  }

  /**
   * Identifica o tipo de módulo baseado no caminho do arquivo
   */
  getModuleType(filePath: string): 'domain' | 'infrastructure' | 'application' | 'ui' | 'unknown' {
    const normalized = filePath.toLowerCase();
    if (normalized.includes('/domain/') || normalized.includes('/entities/')) return 'domain';
    if (
      normalized.includes('/infrastructure/') ||
      normalized.includes('/repositories/') ||
      normalized.includes('/db/')
    )
      return 'infrastructure';
    if (
      normalized.includes('/application/') ||
      normalized.includes('/services/') ||
      normalized.includes('/usecases/')
    )
      return 'application';
    if (
      normalized.includes('/components/') ||
      normalized.includes('/ui/') ||
      normalized.includes('/view/')
    )
      return 'ui';
    return 'unknown';
  }

  /**
   * Identifica se um arquivo parece ser um componente de UI
   */
  isComponent(analysis: ASTAnalysis, filePath: string): boolean {
    return (
      filePath.endsWith('x') ||
      analysis.imports.some(
        (i: string) => i.includes('react') || i.includes('vue') || i.includes('@angular'),
      )
    );
  }
}
