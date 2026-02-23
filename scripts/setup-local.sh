#!/bin/bash
# Setup após clonar o repo

echo "📦 Instalando dependências..."
npm install

echo "🔨 Build inicial..."
npm run build

echo "✅ Setup concluído com sucesso!"
echo ""
echo "=========================================================="
echo "🚀 COMO TESTAR E VER A EXTENSÃO FUNCIONANDO:"
echo "=========================================================="
echo "1. No VS Code, aperte a tecla F5 (ou vá no menu 'Run' -> 'Start Debugging')."
echo "2. Isso vai abrir uma *nova* janela do VS Code com a extensão ativada."
echo "3. Na nova janela, abra a pasta do projeto 'demo-project' recém-criada."
echo "4. O servidor MCP irá iniciar automaticamente e os squiggles vermelhos aparecerão!"
echo "=========================================================="
