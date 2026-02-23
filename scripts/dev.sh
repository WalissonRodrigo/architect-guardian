#!/bin/bash
# Script de desenvolvimento - inicia tudo
echo "🚀 Iniciando ambiente de desenvolvimento..."
# Criar diretórios necessários
mkdir -p ~/.architect-guardian/{cache,logs}
# Terminal 1: MCP Server
osascript -e 'tell app "Terminal" to do script "cd '
(pwd)' && npm run dev:server"' 2>/dev/null || \
gnome-terminal -- bash -c "cd 
 
(pwd) && npm run dev:server; exec bash" 2>/dev/null || \
xterm -e "cd $(pwd) && npm run dev:server" 2>/dev/null || \
echo "Abra manualmente: npm run dev:server"
sleep 2
# Terminal 2: VS Code Extension Watch
osascript -e 'tell app "Terminal" to do script "cd '
(pwd)' && npm run dev:extension"' 2>/dev/null || \
gnome-terminal -- bash -c "cd 
 
(pwd) && npm run dev:extension; exec bash" 2>/dev/null || 
xterm -e "cd $(pwd) && npm run dev:extension" 2>/dev/null || 
echo "Abra manualmente: npm run dev:extension"
echo ""
echo "✅ Servidores iniciados!"
echo "💡 Abra VS Code em apps/vscode-extension e pressione F5"
