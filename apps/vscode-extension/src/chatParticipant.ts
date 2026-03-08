import * as vscode from 'vscode';
import { MCPServerManager } from './mcpServerManager';

export class ArchitectGuardianChatParticipant {
  private manager: MCPServerManager;

  constructor(manager: MCPServerManager) {
    this.manager = manager;
  }

  public register(context: vscode.ExtensionContext) {
    const participant = vscode.chat.createChatParticipant(
      'architect-guardian',
      this.handler.bind(this),
    );
    participant.iconPath = new vscode.ThemeIcon('shield');
    context.subscriptions.push(participant);
  }

  private async handler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    responseStream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<void> {
    responseStream.progress('Thinking...');

    const client = this.manager.getClient();
    if (!client) {
      responseStream.markdown(
        'The Architect Guardian MCP Server is not running. Please start it using the command palette.',
      );
      return;
    }

    try {
      // Fetch tools from the MCP server
      const toolsResponse = await client.listTools();
      const tools = toolsResponse.tools;

      // Get active workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const currentProjectPath =
        workspaceFolders && workspaceFolders.length > 0
          ? workspaceFolders[0].uri.fsPath
          : 'No project currently open';

      // Construct System Prompt
      const systemPrompt = `You are Architect Guardian, an expert software architecture assistant. 
You analyze code, detect stacks, and enforce architectural boundaries.
Current Workspace Path: ${currentProjectPath}

You have access to the following server tools:
${JSON.stringify(tools, null, 2)}

If you need to use a tool to answer the user's query, you MUST output a JSON block in this exact format, and nothing else before it if possible:
\`\`\`json
{
  "tool": "tool_name",
  "arguments": { "argName": "argValue" }
}
\`\`\`
IMPORTANT RULES:
1. DO NOT ask the user for the project path. Always use the "Current Workspace Path" provided above as the "path" or "projectPath" argument for your tools.
2. After receiving a tool result, answer the user normally using markdown headers and bullet points.`;

      const messages = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
        vscode.LanguageModelChatMessage.User(request.prompt),
      ];

      const models = await vscode.lm.selectChatModels({ family: 'gpt-4o' });
      let model = models[0];
      if (!model) {
        // Fallback to any available model
        const allModels = await vscode.lm.selectChatModels({});
        model = allModels[0];
      }

      if (!model) {
        responseStream.markdown(
          'No suitable language model found. Please ensure GitHub Copilot or another Chat Provider is active.',
        );
        return;
      }

      const chatResponse = await model.sendRequest(messages, {}, token);
      let fullResponse = '';

      for await (const fragment of chatResponse.text) {
        fullResponse += fragment;
      }

      // Check if the model wants to call a tool
      const toolCallMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/);
      if (toolCallMatch) {
        try {
          const toolCall = JSON.parse(toolCallMatch[1]);
          if (toolCall.tool && toolCall.arguments) {
            responseStream.progress(`Executing tool: ${toolCall.tool}...`);

            // Execute tool via MCP
            const result = await client.callTool({
              name: toolCall.tool,
              arguments: toolCall.arguments,
            });

            const toolResultText = (result.content as any)[0].text;

            // Send follow-up request to the model with the tool result
            messages.push(vscode.LanguageModelChatMessage.Assistant(fullResponse));
            messages.push(
              vscode.LanguageModelChatMessage.User(
                `Tool ${toolCall.tool} returned:\n${toolResultText}\n\nBased on this result, please answer the user's original query. Use markdown headers and lists where appropriate.`,
              ),
            );

            responseStream.progress('Analyzing results...');
            const followUpResponse = await model.sendRequest(messages, {}, token);

            for await (const fragment of followUpResponse.text) {
              responseStream.markdown(fragment);
            }
            return; // Finished successfully
          }
        } catch (e) {
          console.error('Failed to parse tool call JSON', e);
        }
      }

      // If no tool was called or parsing failed, just output the raw response
      responseStream.markdown(fullResponse);
    } catch (error: any) {
      responseStream.markdown(`Error during Architect Guardian chat processing: ${error.message}`);
    }
  }
}
