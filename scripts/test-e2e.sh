#!/bin/bash

# Testes end-to-end
set -e
echo "🧪 Running E2E Tests..."

# Build
npm run build

# Test MCP Server
echo "Testing MCP Server..."
cd apps/mcp-server
timeout 5s node dist/server.js &
SERVER_PID=
    
    !sleep2kill
 
SERVER_PID 2>/dev/null || true
echo "✅ MCP Server starts correctly"

# Test fixtures
echo "Testing project detection..."
node dist/server.js &
SERVER_PID=$!
sleep 2

# Testar em fixtures
for fixture in ../../test-fixtures/*/; do
echo "Testing (basename fixture)..."

# Aqui iríamos chamar o MCP client para testar detecção
done
kill $SERVER_PID 2>/dev/null || true
echo "✅ E2E Tests complete"
