import * as vscode from 'vscode';
import { MCPServerManager } from '../mcpServerManager';

export async function addCustomSkill(manager: MCPServerManager) {
  const client = manager.getClient();
  if (!client) {
    vscode.window.showErrorMessage('MCP Server is not running');
    return;
  }

  const name = await vscode.window.showInputBox({
    prompt: 'Enter skill name (e.g., java-unit-test)',
    placeHolder: 'java-unit-test',
  });

  if (!name) return;

  const description = await vscode.window.showInputBox({
    prompt: 'Enter skill description',
    placeHolder: 'Generate unit tests for Java classes',
  });

  if (!description) return;

  const language = await vscode.window.showInputBox({
    prompt: 'Enter target language (optional)',
    placeHolder: 'java',
  });

  const prompt = await vscode.window.showInputBox({
    prompt: 'Enter the prompt template for this skill',
    placeHolder: 'Write a JUnit test for the following Java class: {{analysis.ast.classes[0]}}',
  });

  if (!prompt) return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Adding Skill: ${name}...`,
      cancellable: false,
    },
    async () => {
      try {
        await client.callTool({
          name: 'add_custom_skill',
          arguments: {
            name,
            description,
            prompt,
            language,
          },
        });

        vscode.window.showInformationMessage(`Skill '${name}' registered successfully!`);
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to add skill: ${error.message}`);
      }
    },
  );
}
