#!/usr/bin/env node

/**
 * Sync Versions Script
 * Sincroniza a versão do package.json raiz com todos os apps e packages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const newVersion = rootPackageJson.version;

const workspaces = [
  'apps/mcp-server',
  'apps/vscode-extension',
  'packages/shared-types',
  'packages/skill-schema'
];

console.log(`\x1b[32mSincronizando versão ${newVersion} em todo o monorepo...\x1b[0m`);

workspaces.forEach(workspace => {
  const pkgPath = path.join(rootDir, workspace, 'package.json');
  
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    
    // Também sincroniza dependências internas se houver
    if (pkg.dependencies) {
      Object.keys(pkg.dependencies).forEach(dep => {
        if (dep.startsWith('@architect-guardian/')) {
          pkg.dependencies[dep] = newVersion;
        }
      });
    }
    
    if (pkg.devDependencies) {
      Object.keys(pkg.devDependencies).forEach(dep => {
        if (dep.startsWith('@architect-guardian/')) {
          pkg.devDependencies[dep] = newVersion;
        }
      });
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ ${workspace} atualizado para ${newVersion}`);
  }
});

console.log('\x1b[32mSincronização concluída!\x1b[0m');
