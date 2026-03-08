import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';
import { MCPServerManager } from '../mcpServerManager';

export async function detectStack(manager: MCPServerManager) {
  const client = manager.getClient();
  if (!client) {
    const action = await vscode.window.showErrorMessage(
      'MCP Server is not running',
      'Start Server',
    );
    if (action === 'Start Server') {
      await vscode.commands.executeCommand('architectGuardian.startServer');
    }
    return;
  }

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning Project Structure (MCP Server)...',
      cancellable: false,
    },
    async () => {
      try {
        const result = await client.callTool(
          {
            name: 'detect_project_stack',
            arguments: { path: workspaceRoot },
          },
          CallToolResultSchema,
        );

        const rawData = JSON.parse((result as any).content[0].text);

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Analyzing Stack using Copilot AI...',
            cancellable: false,
          },
          async () => {
            try {
              const analyzedData = await analyzeWithLM(rawData?.rawContext || rawData);
              analyzedData.detectedFiles = rawData.detectedFiles || [];
              showWebView(analyzedData);
            } catch (lmError: any) {
              vscode.window.showErrorMessage(`AI Analysis failed: ${lmError.message}`);
            }
          },
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`Detection failed: ${error.message}`);
      }
    },
  );
}

async function analyzeWithLM(rawPayload: any): Promise<any> {
  const models = await vscode.lm.selectChatModels({ family: 'gpt-4o' });
  let model = models[0];
  if (!model) {
    const anyModels = await vscode.lm.selectChatModels({});
    model = anyModels[0];
  }

  if (!model) {
    throw new Error('No language model available (Copilot not active).');
  }

  const systemPrompt = `You are a Senior Software Architect. Analyze the following deep project structure and manifest files carefully.
Your goal is to identify with high precision:
1. The Primary Language.
2. The exact framework (e.g. "Spring Boot" instead of "None", "NestJS", "Next.js", "React + Vite", "CMake + C++").
3. The architectural patterns used (e.g. "Clean Architecture", "Hexagonal", "MVC", "Layered Architecture", "Microservices").
4. If it's a Monorepo or a simple project.

Return a STRICT JSON response (no markdown blocks, no triple backticks).
Schema:
{
  "language": "Main primary language",
  "framework": "Specific framework or engine name",
  "packageManager": "Build tool or package manager",
  "hasTests": boolean,
  "hasDocker": boolean,
  "hasCI": boolean,
  "architecturalPattern": "Detected pattern (e.g. Clean Arch, Hexagonal, MVC)",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Briefly explain why you reached this conclusion based on the file contents/structure"
}`;

  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(JSON.stringify(rawPayload).substring(0, 16000)), // Cap just in case
  ];

  const response = await model.sendRequest(
    messages,
    {},
    new vscode.CancellationTokenSource().token,
  );

  let resultText = '';
  for await (const fragment of response.text) {
    resultText += fragment;
  }

  resultText = resultText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(resultText);
}

function showWebView(data: any) {
  const panel = vscode.window.createWebviewPanel(
    'projectStack',
    'Architect Guardian - Project Stack',
    vscode.ViewColumn.One,
    { enableScripts: true },
  );

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === 'saveDossier') {
      const { saveDossier } = await import('./saveDossier.js');
      await saveDossier(data);
    }
  });

  const confidenceColor =
    data.confidence === 'high' ? '#4ec9b0' : data.confidence === 'medium' ? '#dcdcaa' : '#f44747';
  const jsonResult = JSON.stringify(data, null, 2);

  panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min"></script>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 30px; line-height: 1.6; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: var(--vscode-editor-inactiveSelectionBackground); padding: 25px; border-radius: 12px; border-left: 6px solid ${confidenceColor}; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: var(--vscode-editor-foreground); font-size: 28px; margin-bottom: 25px; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .label { font-weight: 600; color: var(--vscode-descriptionForeground); display: inline-block; width: 160px; }
        .value { color: var(--vscode-textPreformat-foreground); font-weight: 500; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 13px; margin-right: 8px; font-weight: 600; }
        .confidence { color: ${confidenceColor}; font-weight: 800; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
        .raw-header { margin-top: 35px; font-size: 18px; color: var(--vscode-foreground); opacity: 0.9; margin-bottom: 15px; }
        pre { border-radius: 8px; overflow: hidden; margin: 0; }
        code { font-family: 'Fira Code', 'Consolas', monospace; font-size: 13px; }
        .footer { margin-top: 50px; font-size: 12px; opacity: 0.6; border-top: 1px solid var(--vscode-widget-border); padding-top: 15px; text-align: center; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏛️ Architect Guardian</h1>
        
        <div class="card">
          <div style="margin-bottom: 10px;"><span class="label">Project Language:</span> <span class="value">${data.language || 'Unknown'}</span></div>
          <div style="margin-bottom: 10px;"><span class="label">Main Framework:</span> <span class="value">${data.framework || 'None detected'}</span></div>
          <div style="margin-bottom: 10px;"><span class="label">Package Manager:</span> <span class="value">${data.packageManager || 'Unknown'}</span></div>
          <div style="margin-bottom: 10px;"><span class="label">Architecture:</span> <span class="value">${data.architecturalPattern || 'Standard'}</span></div>
          <div><span class="label">Detection Confidence:</span> <span class="confidence">${data.confidence}</span></div>
        </div>

        <div class="card">
          <h3 style="margin-top: 0; margin-bottom: 15px;">Architect's Reasoning</h3>
          <p style="font-size: 14px; color: var(--vscode-descriptionForeground); margin: 0;">${data.reasoning || 'AI inferred the stack based on detected manifest files and directory topology.'}</p>
        </div>

        <div class="card" style="text-align: center; background: none; border: 1px dashed var(--vscode-button-background);">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 14px;">Want to influence Copilot?</h3>
          <p style="font-size: 12px; margin-bottom: 15px; opacity: 0.8;">Generate an Architecture Dossier to provide this context to other AI tools.</p>
          <button id="generateDossier" style="width: 100%; padding: 10px; cursor: pointer; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; font-weight: bold;">
            Generate Architecture Dossier
          </button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('generateDossier').addEventListener('click', () => {
             vscode.postMessage({ command: 'saveDossier' });
          });
        </script>

        <div class="raw-header">Raw Analysis Data</div>
        <pre><code class="language-json">${jsonResult}</code></pre>

        <div class="footer">
          Architect Guardian Phase 2 - Refinement 🔥<br>
          ${data._from_cache ? '⚡ Result loaded from high-speed cache' : '🔍 Fresh detection performed'}
        </div>
      </div>
      <script>hljs.highlightAll();</script>
    </body>
    </html>
  `;
}
