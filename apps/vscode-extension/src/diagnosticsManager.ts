import * as vscode from 'vscode';
import { MCPServerManager } from './mcpServerManager';

export class DiagnosticsManager {
    private diagnosticsCollection: vscode.DiagnosticCollection;
    private timer: NodeJS.Timeout | undefined;

    constructor(private serverManager: MCPServerManager) {
        this.diagnosticsCollection = vscode.languages.createDiagnosticCollection('architectGuardian');
    }

    public activate(subscriptions: vscode.Disposable[]) {
        // Run on save
        vscode.workspace.onDidSaveTextDocument(doc => this.runAnalysis(doc), null, subscriptions);
        
        // Run on open
        vscode.workspace.onDidOpenTextDocument(doc => this.runAnalysis(doc), null, subscriptions);

        // Run on change (debounced)
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(() => this.runAnalysis(event.document), 1000);
        }, null, subscriptions);

        // Initial analysis for active editor
        if (vscode.window.activeTextEditor) {
            this.runAnalysis(vscode.window.activeTextEditor.document);
        }
    }

    private async runAnalysis(document: vscode.TextDocument) {
        if (!this.shouldAnalyze(document)) return;

        const client = this.serverManager.getClient();
        if (!client) return;

        const filePath = document.uri.fsPath;
        let toolName = "";

        if (filePath.includes('components')) {
            toolName = 'skill_atomic-design-checker_validate_structure';
        } else if (filePath.includes('domain') || filePath.includes('infrastructure')) {
            toolName = 'skill_ddd-boundary-enforcer_check_imports';
        }

        if (!toolName) {
            this.diagnosticsCollection.delete(document.uri);
            return;
        }

        try {
            const result = await client.callTool({
                name: toolName,
                arguments: { filePath }
            });

            const content = (result.content as any)[0].text;
            const data = JSON.parse(content);

            if (data.success && data.data.includes('VIOLATION')) {
                this.updateDiagnostics(document, data.data);
            } else {
                this.diagnosticsCollection.delete(document.uri);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        }
    }

    private shouldAnalyze(document: vscode.TextDocument): boolean {
        const lang = document.languageId;
        return lang === 'typescript' || lang === 'typescriptreact' || lang === 'javascript' || lang === 'javascriptreact';
    }

    private updateDiagnostics(document: vscode.TextDocument, report: string) {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Regex to find violations and potentially the line if mentioned
        // For Phase 6, we'll mark the first line/header if we can't find precise loc
        const lines = report.split('\n');
        for (const line of lines) {
            if (line.includes('VIOLATION')) {
                const range = new vscode.Range(0, 0, 0, 100); // Default to first line for now
                const diagnostic = new vscode.Diagnostic(
                    range,
                    line.replace('VIOLATION:', '').trim(),
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'Architect Guardian';
                diagnostic.code = 'ARCH_VIOLATION';
                diagnostics.push(diagnostic);
            }
        }

        this.diagnosticsCollection.set(document.uri, diagnostics);
    }

    public dispose() {
        this.diagnosticsCollection.dispose();
    }
}
