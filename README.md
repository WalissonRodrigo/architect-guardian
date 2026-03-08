# 🏛️ Architect Guardian

MCP-based Architecture Guardian for intelligent code assistance.

## 🚀 Instalação Rápida

O Architect Guardian pode ser instalado em qualquer IDE moderna (Trae, VS Code, Windsurf, Claude Desktop, etc.) através do nosso CLI oficial:

```bash
# Para Claude Desktop
npx @architect-guardian/mcp-server setup-claude

# Para VS Code / Trae
# 1. Baixe o .vsix em Releases
# 2. Instale manualmente no VS Code/Trae
```

Consulte o [Guia de Instalação (INSTALL.md)](file:///mnt/d/Walisson%20Rodrigo/Documents/WR%20Systems/architect-guardian/INSTALL.md) para detalhes de cada plataforma.

## 📁 Estrutura do Monorepo

- `apps/mcp-server` - Servidor MCP
- `apps/vscode-extension` - Extensão VS Code
- `packages/shared-types` - Tipos compartilhados
- `.architect-guardian/` - Configs e prompts

## 🧠 Desenvolvimento com IA

| Fase | Modelo                     | Prompt                                                                       |
| ---- | -------------------------- | ---------------------------------------------------------------------------- |
| 0    | Gemini 3.1 Pro             | `.architect-guardian/prompts/phases/phase-0-foundation/01-setup-complete.md` |
| 1    | Gemini 3.1 Pro → 2.0 Flash | (a criar)                                                                    |
| 2    | Gemini 3 Flash             | (a criar)                                                                    |

## 🛣️ Roadmap

- [x] Estrutura base (init script)
- [x] ProjectDetector funcional
- [ ] Git sync para skills
- [ ] Sistema de .architect.yml
- [ ] Code review automático

## 👤 Autor

Criado por **WalissonRodrigo** com assistência de IA.
