# 🏛️ Architect Guardian

MCP-based Architecture Guardian for intelligent code assistance.

## 🚀 Quick Start

```bash
# 1. Execute o init script
./init-architect-guardian.sh meu-projeto WalissonRodrigo
cd meu-projeto

# 2. Instale dependências
npm install

# 3. Build
npm run build

# 4. Desenvolva com Antigravity
# Use: .architect-guardian/prompts/phases/phase-0-foundation/01-setup-complete.md
```

## 📁 Estrutura

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
