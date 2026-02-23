import * as vscode from 'vscode';
import { MCPServerManager } from './mcpServerManager';

export class HealthDashboardProvider {
    public static readonly viewType = 'architectGuardian.healthDashboard';

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly serverManager: MCPServerManager
    ) {}

    public show() {
        const panel = vscode.window.createWebviewPanel(
            HealthDashboardProvider.viewType,
            'Architectural Health Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getHtmlForWebview(panel.webview);
        this.updateDashboard(panel);
    }

    private async updateDashboard(panel: vscode.WebviewPanel) {
        const client = this.serverManager.getClient();
        if (!client) return;

        try {
            // Request full project analysis
            const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!rootPath) return;

            const result = await client.callTool({
                name: 'detect_project_stack',
                arguments: { path: rootPath }
            });

            const stack = JSON.parse((result.content as any)[0].text);
            
            // Send data to webview
            panel.webview.postMessage({
                type: 'update',
                stack,
                healthScore: this.calculateHealthScore(stack)
            });
        } catch (error) {
            console.error('Failed to update dashboard:', error);
        }
    }

    private calculateHealthScore(stack: any): number {
        let score = 100;
        if (stack.confidence === 'medium') score -= 10;
        if (stack.confidence === 'low') score -= 30;
        if (!stack.hasTests) score -= 20;
        if (!stack.hasCI) score -= 10;
        if (!stack.hasDocker) score -= 5;
        return Math.max(0, score);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Architectural Health</title>
                <style>
                    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 20px; }
                    .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 8px solid #4CAF50; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto; }
                    .status-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--vscode-widget-border); }
                    .status-ok { color: #4CAF50; }
                    .status-warn { color: #FFC107; }
                </style>
            </head>
            <body>
                <h1>Architectural Health Dashboard</h1>
                <div class="card">
                    <div id="score" class="score-circle">--</div>
                    <p style="text-align: center; margin-top: 10px;">Project Health Score</p>
                </div>
                <div class="card" id="details">
                    <div class="status-item"><span>Language</span> <span id="lang">--</span></div>
                    <div class="status-item"><span>Framework</span> <span id="framework">--</span></div>
                    <div class="status-item"><span>Tests</span> <span id="tests">--</span></div>
                    <div class="status-item"><span>CI/CD</span> <span id="ci">--</span></div>
                </div>

                <script>
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'update') {
                            document.getElementById('score').innerText = message.healthScore + '%';
                            document.getElementById('lang').innerText = message.stack.language || 'Unknown';
                            document.getElementById('framework').innerText = message.stack.framework || 'None';
                            document.getElementById('tests').innerText = message.stack.hasTests ? '✅ Found' : '❌ Missing';
                            document.getElementById('ci').innerText = message.stack.hasCI ? '✅ Found' : '❌ Missing';
                            
                            const color = message.healthScore > 80 ? '#4CAF50' : (message.healthScore > 50 ? '#FFC107' : '#F44336');
                            document.getElementById('score').style.borderColor = color;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
