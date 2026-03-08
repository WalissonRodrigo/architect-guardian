# 🛠️ Guia de Instalação: Architect Guardian

O **Architect Guardian** é um sistema de governança arquitetural baseado em MCP (Model Context Protocol), projetado para funcionar em qualquer IDE moderna (Trae, VS Code, Windsurf, Cursor, etc.).

## 🚀 Instalação Rápida (via npx)

A maneira mais fácil de configurar o Architect Guardian no seu ambiente é usando o nosso CLI:

```bash
npx @architect-guardian/mcp-server install
```

Este comando irá:

1. Detectar seu sistema operacional.
2. Baixar a versão estável mais recente do servidor MCP.
3. Configurar automaticamente o `claude_desktop_config.json` para uso com Claude Desktop.

---

## 💻 Suporte por IDE

### **VS Code & Trae**

1. Baixe o arquivo `architect-guardian-0.1.0.vsix` na aba de [Releases](https://github.com/WalissonRodrigo/architect-guardian/releases).
2. No VS Code/Trae, vá em extensões -> `...` -> `Install from VSIX...`.
3. A extensão iniciará o servidor MCP localmente de forma automática.

### **Windsurf / Cursor / Kilo**

Como essas IDEs suportam o protocolo MCP nativamente:

1. Adicione o servidor MCP nas configurações da IDE:
   - **Command:** `node`
   - **Args:** `path/to/architect-guardian/apps/mcp-server/dist/server.js`
2. Ou use o comando npx diretamente se a IDE permitir:
   - **Command:** `npx`
   - **Args:** `-y @architect-guardian/mcp-server`

### **Claude Desktop**

Para usar o Architect Guardian como um "Architect" no seu chat do Claude:

1. Rode `npx @architect-guardian/mcp-server setup-claude`.
2. Reinicie o Claude Desktop.

---

## 🛠️ Comandos Úteis

| Comando       | Descrição                                                   |
| ------------- | ----------------------------------------------------------- |
| `sync-skills` | Sincroniza suas habilidades arquiteturais do GitHub.        |
| `add-skill`   | Adiciona uma nova habilidade customizada (ex: Testes Java). |
| `verify-arch` | Roda uma verificação completa no arquivo ativo.             |

---

## 🛡️ Requisitos

- Node.js >= 20.0.0
- Git (para sincronização de skills)

---

## 👤 Autor

Criado por **WalissonRodrigo**.
