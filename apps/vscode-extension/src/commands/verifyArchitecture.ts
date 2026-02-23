import * as vscode from 'vscode';
import { MCPServerManager } from '../mcpServerManager';

export async function verifyArchitecture(serverManager: MCPServerManager) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const client = serverManager.getClient();

    if (!client) {
        vscode.window.showErrorMessage('Architect Guardian server is not running.');
        return;
    }

    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Architect Guardian: Verifying Architecture...",
            cancellable: false
        }, async (progress) => {
            // Determine skill based on path (best effort)
            let toolName = "";
            let args: any = { filePath };

            if (filePath.includes('components')) {
                toolName = 'skill_atomic-design-checker_validate_structure';
            } else if (filePath.includes('domain') || filePath.includes('infrastructure')) {
                toolName = 'skill_ddd-boundary-enforcer_check_imports';
            }

            if (!toolName) {
                vscode.window.showInformationMessage('No specific architectural skill found for this file type.');
                return;
            }

            const result = await client.callTool({
                name: toolName,
                arguments: args
            });

            const content = (result.content as any)[0].text;
            const data = JSON.parse(content);

            if (data.success) {
                // Show result in a webview or output channel
                const panel = vscode.window.createWebviewPanel(
                    'archReview',
                    'Architectural Review',
                    vscode.ViewColumn.Two,
                    {}
                );
                panel.webview.html = `
                    <html>
                    <body style="padding: 20px; font-family: sans-serif; line-height: 1.6;">
                        <h1>Architectural Review</h1>
                        <div style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px;">
                            ${data.data.replace(/\n/g, '<br>')}
                        </div>
                    </body>
                    </html>
                `;
            } else {
                vscode.window.showErrorMessage(`Analysis failed: ${data.error}`);
            }
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error executing architectural check: ${error.message}`);
    }
}
