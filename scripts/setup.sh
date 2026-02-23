#!/bin/bash
# Setup script para desenvolvimento local
set -e
echo "🚀 Architect Guardian - Setup Local"
# Verificar Node.js
if ! command -v node &> /dev/null; then
echo "❌ Node.js não encontrado"
exit 1
fi
echo "✅ Node.js $(node -v)"
# Instalar dependências
echo "📦 Instalando dependências..."
npm install
# Build inicial
echo "🔨 Build inicial..."
npm run build
# Setup git hooks
echo "🎣 Configurando git hooks..."
npx husky install || true
echo ""
echo "✅ Setup completo!"
echo ""
echo "Próximos passos:"
echo "  npm run dev:server    # Iniciar MCP Server"
echo "  npm run dev:extension # Iniciar Extension (outro terminal)"
echo "  code apps/vscode-extension # Abrir em VS Code"
echo ""
echo "Ou use: ./scripts/dev.sh para iniciar tudo"
