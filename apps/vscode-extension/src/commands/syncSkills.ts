import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import * as vscode from 'vscode';
import { MCPServerManager } from '../mcpServerManager';

export async function syncSkills(manager: MCPServerManager) {
    const client = manager.getClient();
    if (!client) {
        vscode.window.showErrorMessage('MCP Server is not running');
        return;
    }

    const registries = [
        {
            name: "local-repo",
            url: "https://github.com/WalissonRodrigo/mcp-skills-registry", // Placeholder
            branch: "main"
        }
    ];

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Syncing Skill Registries...",
        cancellable: false
    }, async () => {
        try {
            const result = await client.callTool({
                name: "sync_registries",
                arguments: { registries }
            }, CallToolResultSchema);

            vscode.window.showInformationMessage(`Sync complete: ${JSON.stringify((result as any).content[0].text)}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Sync failed: ${error.message}`);
        }
    });
}
