import * as vscode from "vscode";
import { ArchitectGuardianChatParticipant } from "./chatParticipant";
import { detectStack } from "./commands/detectStack";
import { syncSkills } from "./commands/syncSkills";
import { verifyArchitecture } from "./commands/verifyArchitecture";
import { MCPServerManager } from "./mcpServerManager";

import { ArchitecturalCodeActionProvider } from "./codeActionProvider";
import { DiagnosticsManager } from "./diagnosticsManager";
import { HealthDashboardProvider } from "./healthDashboardProvider";

let serverManager: MCPServerManager;
let statusBarItem: vscode.StatusBarItem;
let diagnosticsManager: DiagnosticsManager;
let healthDashboard: HealthDashboardProvider;

export async function activate(context: vscode.ExtensionContext) {
  console.log("Architect Guardian activated");

  serverManager = new MCPServerManager(context);
  diagnosticsManager = new DiagnosticsManager(serverManager);
  diagnosticsManager.activate(context.subscriptions);

  const chatParticipant = new ArchitectGuardianChatParticipant(serverManager);
  chatParticipant.register(context);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: "typescript", scheme: "file" },
      new ArchitecturalCodeActionProvider(),
      {
        providedCodeActionKinds:
          ArchitecturalCodeActionProvider.providedCodeActionKinds,
      },
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: "typescriptreact", scheme: "file" },
      new ArchitecturalCodeActionProvider(),
      {
        providedCodeActionKinds:
          ArchitecturalCodeActionProvider.providedCodeActionKinds,
      },
    ),
  );

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "architectGuardian.detectStack";
  context.subscriptions.push(statusBarItem);

  // Start Server Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "architectGuardian.startServer",
      async () => {
        try {
          await serverManager.start();
          statusBarItem.text = `$(shield) AG: Running`;
          statusBarItem.show();
          vscode.window.showInformationMessage(
            "Architect Guardian MCP Server connected",
          );
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Failed to connect to MCP Server: ${error.message}`,
          );
        }
      },
    ),
  );

  // Stop Server Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "architectGuardian.stopServer",
      async () => {
        await serverManager.stop();
        statusBarItem.hide();
        vscode.window.showInformationMessage(
          "Architect Guardian MCP Server stopped",
        );
      },
    ),
  );

  // Sync Registries Command
  context.subscriptions.push(
    vscode.commands.registerCommand("architectGuardian.syncSkills", () =>
      syncSkills(serverManager),
    ),
  );

  // Verify Architecture Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "architectGuardian.verifyArchitecture",
      () => verifyArchitecture(serverManager),
    ),
  );

  healthDashboard = new HealthDashboardProvider(context, serverManager);

  // Open Dashboard Command
  context.subscriptions.push(
    vscode.commands.registerCommand("architectGuardian.openDashboard", () =>
      healthDashboard.show(),
    ),
  );

  // Detect Stack Command
  context.subscriptions.push(
    vscode.commands.registerCommand("architectGuardian.detectStack", () =>
      detectStack(serverManager),
    ),
  );

  // Save Dossier Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "architectGuardian.saveDossier",
      async (data) => {
        const { saveDossier } = await import("./commands/saveDossier.js");
        await saveDossier(data);
      },
    ),
  );

  // Auto-start
  const config = vscode.workspace.getConfiguration("architectGuardian");
  if (config.get<boolean>("autoStart")) {
    vscode.commands.executeCommand("architectGuardian.startServer");
  }
}

export function deactivate() {
  if (serverManager) {
    serverManager.stop();
  }
  if (diagnosticsManager) {
    diagnosticsManager.dispose();
  }
}
