import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import * as vscode from 'vscode';

export class MCPServerManager {
  private client: Client | undefined;
  private transport: StdioClientTransport | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  async start(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    const config = vscode.workspace.getConfiguration('architectGuardian');
    let serverPath = config.get<string>('serverPath');

    if (!serverPath) {
      // Self-contained path within the extension bundle
      serverPath = join(this.context.extensionPath, 'dist-server', 'index.cjs');
    }

    console.log(`Starting MCP Server from: ${serverPath}`);

    this.transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
      },
    });

    this.client = new Client(
      { name: 'architect-guardian-client', version: '0.1.0' },
      { capabilities: {} },
    );

    try {
      await this.client.connect(this.transport);
      console.log('MCP Server connected successfully');
    } catch (error) {
      console.error('Failed to connect to MCP Server:', error);
      throw error;
    }
    return this.client;
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = undefined;
    }
    this.transport = undefined;
  }

  getClient(): Client | undefined {
    return this.client;
  }

  isExecuting(): boolean {
    return !!this.client;
  }
}
