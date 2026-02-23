#!/bin/bash
# Iniciar ambiente de dev

echo "🚀 Iniciando Architect Guardian dev mode..."

# Terminal 1: Server
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev:server"' 2>/dev/null || \
gnome-terminal -- bash -c "cd $(pwd) && npm run dev:server" 2>/dev/null || \
echo "Abra manualmente: npm run dev:server"

sleep 2

# Terminal 2: Extension
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev:extension"' 2>/dev/null || \
gnome-terminal -- bash -c "cd $(pwd) && npm run dev:extension" 2>/dev/null || \
echo "Abra manualmente: npm run dev:extension"

echo "💡 Abra VS Code em apps/vscode-extension e pressione F5"
