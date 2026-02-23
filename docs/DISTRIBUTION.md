# Architect Guardian: Distribution & Community Testing Guide

To easily share and test the **Architect Guardian** project without requiring users to build from source, follow this two-step distribution guide.

## 1. Automated Setup (Recommended)

To build everything and package the extension in one step, run:

```bash
npm run bootstrap
```

This will:

- Install all dependencies.
- Build the monorepo (`mcp-server`, `shared-types`, `vscode-extension`).
- Package the VS Code extension into a `.vsix` file in `apps/vscode-extension/`.

## 2. Extension Installation

- Navigate to `apps/vscode-extension/`.
- Look for the `.vsix` file (e.g., `architect-guardian-0.1.0.vsix`).
- This file is **self-contained** and includes the MCP server.
- Install it in VS Code via "Install from VSIX..." or by dragging the file into the IDE.

## 3. (Optional) Intelligent MCP Configuration for Claude Desktop

To automatically configure your local MCP server with **Claude Desktop**, run:

```bash
npm run setup-claude --workspace=@architect-guardian/mcp-server
```

_Note: Make sure to restart Claude Desktop after running this._

## 4. Architecture Dossier Integration

When running the "Detect Project Stack" command, use the **"Generate Architecture Dossier"** button to persist analysis into:

- `.architect-guardian/stack.json`
- `.copilot/copilot-instructions.md`

This provides immediate context to other AI agents and tools in your project.
