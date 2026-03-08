import * as vscode from 'vscode';

export class ArchitecturalCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((diagnostic) => diagnostic.source === 'Architect Guardian')
      .map((diagnostic) => this.createFix(document, diagnostic));
  }

  private createFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(
      `Review Architectural Guidance for: ${diagnostic.message}`,
      vscode.CodeActionKind.QuickFix,
    );
    fix.diagnostics = [diagnostic];
    fix.isPreferred = true;

    // Command to trigger deep review or open dashboard
    fix.command = {
      title: 'Verify Architecture',
      command: 'architectGuardian.verifyArchitecture',
    };

    return fix;
  }
}
