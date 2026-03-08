import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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
    // 1. Fetch available skills (tools) from MCP server
    const toolsResult = await client.request(ListToolsRequestSchema, {});
    const skills = toolsResult.tools.filter((t) => t.name !== 'add_custom_skill');

    if (skills.length === 0) {
      vscode.window.showInformationMessage(
        'No architectural skills available. Try syncing or adding one.',
      );
      return;
    }

    // 2. Let user pick a skill
    const selectedTool = await vscode.window.showQuickPick(
      skills.map((s) => ({
        label: s.name,
        description: s.description,
        tool: s,
      })),
      { placeHolder: 'Select an architectural skill to run' },
    );

    if (!selectedTool) return;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Architect Guardian: Running ${selectedTool.label}...`,
        cancellable: false,
      },
      async (progress) => {
        const result = await client.callTool({
          name: selectedTool.label,
          arguments: { filePath, projectPath: vscode.workspace.workspaceFolders?.[0].uri.fsPath },
        });

        const content = (result.content as any)[0].text;
        const data = JSON.parse(content);

        if (data.success) {
          // Show result in a webview or output channel
          const panel = vscode.window.createWebviewPanel(
            'archReview',
            'Architectural Review',
            vscode.ViewColumn.Two,
            {},
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
      },
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error executing architectural check: ${error.message}`);
  }
}
