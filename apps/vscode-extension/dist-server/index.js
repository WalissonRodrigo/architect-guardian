#!/usr/bin/env node
import { Server as G } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport as H } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema as V,
  ListToolsRequestSchema as q,
} from '@modelcontextprotocol/sdk/types.js';
import * as M from 'os';
import * as z from 'path';
import * as l from 'fs/promises';
import * as u from 'path';
import * as $ from 'os';
var S = class {
  cacheDir;
  ttlMs;
  memoryCache = new Map();
  constructor(t = 3600 * 1e3) {
    ((this.ttlMs = t), (this.cacheDir = u.join($.homedir(), '.architect-guardian', 'cache')));
  }
  async initialize() {
    try {
      await l.mkdir(this.cacheDir, { recursive: !0 });
    } catch (t) {
      console.error('Failed to create cache directory:', t);
    }
  }
  async get(t) {
    let e = this.memoryCache.get(t);
    if (e && this.isValid(e.timestamp)) return e.value;
    try {
      let r = t.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        i = u.join(this.cacheDir, `${r}.json`),
        s = await l.readFile(i, 'utf-8'),
        n = JSON.parse(s);
      if (this.isValid(n.timestamp)) return (this.memoryCache.set(t, n), n.value);
      (await l.unlink(i).catch(() => {}), this.memoryCache.delete(t));
    } catch {}
    return null;
  }
  async set(t, e) {
    let r = { value: e, timestamp: Date.now() };
    this.memoryCache.set(t, r);
    try {
      let i = t.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        s = u.join(this.cacheDir, `${i}.json`);
      await l.writeFile(s, JSON.stringify(r), 'utf-8');
    } catch (i) {
      console.error(`Failed to write cache for key ${t}:`, i);
    }
  }
  async clear(t) {
    if (t) {
      this.memoryCache.delete(t);
      try {
        let e = t.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        await l.unlink(u.join(this.cacheDir, `${e}.json`));
      } catch {}
    } else {
      this.memoryCache.clear();
      try {
        let e = await l.readdir(this.cacheDir);
        await Promise.all(
          e.filter((r) => r.endsWith('.json')).map((r) => l.unlink(u.join(this.cacheDir, r))),
        );
      } catch {}
    }
  }
  isValid(t) {
    return Date.now() - t < this.ttlMs;
  }
};
import I from 'chokidar';
import * as P from 'path';
var v = class {
  constructor(t, e) {
    this.skillsDir = t;
    this.onUpdate = e;
    this.watcher = I.watch(this.skillsDir, {
      ignored: /(^|[\/\\])\../,
      persistent: !0,
      ignoreInitial: !0,
    });
  }
  watcher;
  start() {
    (this.watcher
      .on('add', (t) => this.handleUpdate(t))
      .on('change', (t) => this.handleUpdate(t))
      .on('unlink', (t) => this.handleUpdate(t)),
      console.error(`Watching for skill changes in ${this.skillsDir}`));
  }
  handleUpdate(t) {
    (t.endsWith('manifest.json') || t.endsWith('prompt.md')) &&
      (console.error(`Skill changed: ${P.basename(P.dirname(t))}`), this.onUpdate());
  }
  async stop() {
    await this.watcher.close();
  }
};
import * as C from 'fs/promises';
import O from 'handlebars';
import * as g from 'path';
import { parse as L } from '@typescript-eslint/typescript-estree';
import * as N from 'fs/promises';
var d = class {
  async analyze(t) {
    let e = { classes: [], functions: [], imports: [], decorators: [] };
    try {
      let r = await N.readFile(t, 'utf-8'),
        i = L(r, { jsx: !0, loc: !0, range: !0, tokens: !1, comment: !1, useJSXTextNode: !1 });
      this.traverse(i, e);
    } catch {}
    return e;
  }
  traverse(t, e) {
    if (!(!t || typeof t != 'object')) {
      if (
        (t.type === 'ClassDeclaration' && t.id && e.classes.push(t.id.name),
        (t.type === 'FunctionDeclaration' || t.type === 'MethodDefinition') &&
          (t.key?.name || t.id?.name) &&
          e.functions.push(t.key?.name || t.id?.name),
        t.type === 'ImportDeclaration' && t.source && e.imports.push(t.source.value),
        t.decorators)
      )
        for (let r of t.decorators)
          r.expression && r.expression.callee && e.decorators.push(r.expression.callee.name);
      for (let r in t)
        if (Object.prototype.hasOwnProperty.call(t, r)) {
          let i = t[r];
          Array.isArray(i) ? i.forEach((s) => this.traverse(s, e)) : this.traverse(i, e);
        }
    }
  }
  getModuleType(t) {
    let e = t.toLowerCase();
    return e.includes('/domain/') || e.includes('/entities/')
      ? 'domain'
      : e.includes('/infrastructure/') || e.includes('/repositories/') || e.includes('/db/')
        ? 'infrastructure'
        : e.includes('/application/') || e.includes('/services/') || e.includes('/usecases/')
          ? 'application'
          : e.includes('/components/') || e.includes('/ui/') || e.includes('/view/')
            ? 'ui'
            : 'unknown';
  }
  isComponent(t, e) {
    return (
      e.endsWith('x') ||
      t.imports.some((r) => r.includes('react') || r.includes('vue') || r.includes('@angular'))
    );
  }
};
var j = class {
  skillsDir;
  analyzer;
  constructor(t) {
    ((this.skillsDir = t),
      (this.analyzer = new d()),
      O.registerHelper('json', (e) => JSON.stringify(e, null, 2)));
  }
  async executeSkill(t, e) {
    let r = Date.now();
    try {
      let i = g.join(this.skillsDir, t.name),
        s = g.join(i, 'prompt.md'),
        n;
      if (await this.exists(s)) {
        let c = await C.readFile(s, 'utf-8');
        if (e.args.filePath && typeof e.args.filePath == 'string') {
          let f = g.isAbsolute(e.args.filePath)
              ? e.args.filePath
              : g.join(e.projectPath, e.args.filePath),
            E = await this.analyzer.analyze(f);
          e.analysis = {
            ast: E,
            moduleType: this.analyzer.getModuleType(f),
            isComponent: this.analyzer.isComponent(E, f),
          };
        }
        n = O.compile(c)({
          project: { path: e.projectPath, stack: e.projectStack, config: e.config },
          args: e.args,
          analysis: e.analysis,
        });
      }
      return { success: !0, data: n, metrics: { duration: Date.now() - r } };
    } catch (i) {
      return { success: !1, error: i.message, metrics: { duration: Date.now() - r } };
    }
  }
  async exists(t) {
    try {
      return (await C.access(t), !0);
    } catch {
      return !1;
    }
  }
  findRelevantSkills(t, e) {
    return e.filter((r) => {
      let { detectors: i } = r;
      return !(
        (i.languages?.length && t.language && !i.languages.includes(t.language)) ||
        (i.frameworks?.length && t.framework && !i.frameworks.includes(t.framework))
      );
    });
  }
};
import * as k from 'fs/promises';
import * as w from 'path';
var b = class {
  astAnalyzer;
  constructor() {
    this.astAnalyzer = new d();
  }
  async detect(t) {
    let e = await this.listAllFiles(t),
      r = await this.extractManifests(t, e),
      i = await this.extractReadme(t, e);
    return {
      language: 'Dynamic via AI',
      framework: 'Pending AI Analysis',
      packageManager: 'Pending AI Analysis',
      hasTests: e.some((s) => s.includes('test')),
      hasDocker: e.some((s) => s.includes('docker') || s.includes('Docker')),
      hasCI: e.some((s) => s.includes('.github') || s.includes('gitlab-ci')),
      detectedFiles: e.slice(0, 50),
      confidence: 'medium',
      rawContext: { directoryTree: e, manifests: r, readme: i },
    };
  }
  async extractManifests(t, e) {
    let r = [
        'package.json',
        'pom.xml',
        'build.gradle',
        'build.gradle.kts',
        'CMakeLists.txt',
        'Cargo.toml',
        'go.mod',
        'requirements.txt',
        'pyproject.toml',
        'composer.json',
      ],
      i = {};
    for (let s of r)
      if (e.includes(s))
        try {
          let n = await k.readFile(w.join(t, s), 'utf8');
          i[s] = n.substring(0, 8e3);
        } catch {}
    return i;
  }
  async extractReadme(t, e) {
    let r = e.find((i) => i.toLowerCase() === 'readme.md');
    if (r)
      try {
        return (await k.readFile(w.join(t, r), 'utf8')).substring(0, 3e3);
      } catch {}
  }
  async listAllFiles(t, e = 0, r = 5) {
    let i = [];
    if (e > r) return i;
    try {
      let s = await k.readdir(t, { withFileTypes: !0 });
      for (let n of s)
        if (n.isDirectory()) {
          if (
            [
              'node_modules',
              '.git',
              'dist',
              'out',
              'build',
              'target',
              'vendor',
              '.idea',
              '.vscode',
              'coverage',
              '__pycache__',
              'venv',
              '.env',
            ].includes(n.name)
          )
            continue;
          i.push(n.name + '/');
          let c = await this.listAllFiles(w.join(t, n.name), e + 1, r);
          i.push(...c.map((h) => w.join(n.name, h)));
        } else i.push(n.name);
    } catch (s) {
      console.error('Error listing files:', s);
    }
    return i;
  }
};
import * as y from 'fs/promises';
import * as J from 'os';
import * as A from 'path';
var D = class {
  configPath;
  constructor() {
    this.configPath = A.join(J.homedir(), '.architect-guardian', 'config.json');
  }
  async loadConfig() {
    try {
      let t = await y.readFile(this.configPath, 'utf-8');
      return JSON.parse(t);
    } catch (t) {
      if (t.code === 'ENOENT') return await this.createDefaultConfig();
      throw new Error(`Failed to load config: ${t.message}`);
    }
  }
  async createDefaultConfig() {
    let t = {
        registries: [
          {
            name: 'core-skills',
            url: 'https://github.com/WalissonRodrigo/architect-guardian-skills.git',
            branch: 'main',
          },
          {
            name: 'awesome-skills',
            url: 'https://github.com/sickn33/antigravity-awesome-skills.git',
            branch: 'main',
            skillsPath: 'skills',
          },
        ],
      },
      e = A.dirname(this.configPath);
    return (
      await y.mkdir(e, { recursive: !0 }),
      await y.writeFile(this.configPath, JSON.stringify(t, null, 2), 'utf-8'),
      t
    );
  }
};
import * as m from 'fs/promises';
import * as _ from 'os';
import * as p from 'path';
import { simpleGit as W } from 'simple-git';
import { z as a } from 'zod';
var U = a.object({
    name: a.string().min(1),
    version: a.string().regex(/^\d+\.\d+\.\d+$/),
    description: a.string(),
    author: a.string().optional(),
    tags: a.array(a.string()),
    detectors: a.object({
      filePatterns: a.array(a.string()).optional(),
      languages: a.array(a.string()).optional(),
      frameworks: a.array(a.string()).optional(),
      contentPatterns: a.array(a.string()).optional(),
    }),
    capabilities: a.array(
      a.object({
        name: a.string(),
        description: a.string(),
        inputSchema: a.record(a.string(), a.any()),
        outputSchema: a.record(a.string(), a.any()).optional(),
      }),
    ),
    config: a.record(a.string(), a.any()).optional(),
  }),
  x = class {
    validate(t) {
      let e = U.safeParse(t);
      if (!e.success) {
        let r = e.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new Error(`Invalid skill manifest: ${r}`);
      }
      return e.data;
    }
  };
var T = class {
  baseCacheDir;
  validator;
  git;
  constructor() {
    ((this.baseCacheDir = p.join(_.homedir(), '.architect-guardian', 'skills')),
      (this.validator = new x()),
      (this.git = W()));
  }
  async initialize() {
    await m.mkdir(this.baseCacheDir, { recursive: !0 });
  }
  async syncRegistry(t) {
    let e = p.join(this.baseCacheDir, t.name),
      r = { registry: t.name, status: 'success', updatedSkills: [] };
    try {
      (await this.exists(e))
        ? await W(e).pull('origin', t.branch || 'main')
        : await this.git.clone(t.url, e, ['--branch', t.branch || 'main', '--depth', '1']);
      let i = p.join(e, t.skillsPath || 'skills');
      if (await this.exists(i)) {
        let s = await m.readdir(i, { withFileTypes: !0 });
        for (let n of s)
          if (n.isDirectory())
            try {
              let c = p.join(i, n.name, 'manifest.json');
              if (await this.exists(c)) {
                let h = await m.readFile(c, 'utf-8'),
                  f = JSON.parse(h);
                (this.validator.validate(f), r.updatedSkills.push(f.name));
              }
            } catch (c) {
              console.error(`Skill validation failed in ${n.name}: ${c.message}`);
            }
      }
    } catch (i) {
      ((r.status = 'failed'), (r.error = i.message));
    }
    return r;
  }
  async exists(t) {
    try {
      return (await m.access(t), !0);
    } catch {
      return !1;
    }
  }
  async listCachedSkills() {
    let t = [],
      e = await m.readdir(this.baseCacheDir);
    for (let r of e) {
      let i = p.join(this.baseCacheDir, r, 'skills');
      if (await this.exists(i)) {
        let s = await m.readdir(i);
        for (let n of s) {
          let c = p.join(i, n, 'manifest.json');
          if (await this.exists(c))
            try {
              let h = await m.readFile(c, 'utf-8');
              t.push(JSON.parse(h));
            } catch {}
        }
      }
    }
    return t;
  }
};
var K = new H(),
  R = new G({ name: 'architect-guardian', version: '0.1.0' }, { capabilities: { tools: {} } }),
  X = new S(),
  F = new T(),
  B = new j(z.join(M.homedir(), '.architect-guardian', 'skills')),
  Q = new b(),
  Y = new v(z.join(M.homedir(), '.architect-guardian', 'skills'), async () => {
    console.error('Skills registry updated, reloading...');
  });
R.setRequestHandler(q, async () => ({
  tools: (await F.listCachedSkills()).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.capabilities[0].inputSchema,
  })),
}));
R.setRequestHandler(V, async (o) => {
  try {
    let e = (await F.listCachedSkills()).find((c) => c.name === o.params.name);
    if (!e) throw new Error(`Skill ${o.params.name} not found`);
    let r = o.params.arguments || {},
      i = r.projectPath || process.cwd(),
      s = await Q.detect(i),
      n = await B.executeSkill(e, { projectPath: i, projectStack: s, args: r });
    return { content: [{ type: 'text', text: JSON.stringify(n.data, null, 2) }] };
  } catch (t) {
    return { content: [{ type: 'text', text: `Error: ${t.message}` }], isError: !0 };
  }
});
async function Z() {
  (await X.initialize(), await F.initialize(), Y.start());
  let o = new D();
  try {
    let t = await o.loadConfig();
    for (let e of t.registries)
      try {
        (console.error(`Syncing registry: ${e.name}...`),
          await F.syncRegistry(e),
          console.error(`Registry ${e.name} synced successfully.`));
      } catch (r) {
        console.error(`Failed to sync registry ${e.name}:`, r);
      }
  } catch (t) {
    console.error('Failed to load application configuration:', t);
  }
  (await R.connect(K), console.error('Architect Guardian MCP Server running on stdio'));
}
Z().catch((o) => {
  (console.error('Server error:', o), process.exit(1));
});
//# sourceMappingURL=index.js.map
