#!/usr/bin/env node
'use strict';

/**
 * Suite de testes unitários para devin-cli-chat.
 * Executa com: node test/unit.js
 * Sem dependências de framework — usa apenas Node.js built-ins.
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');

// ── Mock de vscode ────────────────────────────────────────────────────────────
// Precisa ser instalado ANTES de require('../out/extension.js')

const mockConfigValues = {
  argumentosPadrao: [],
  argumentoModelo: '--model',
  modeloAtual: 'auto',
  agenteAtual: 'auto',
  modoExecucaoChat: 'resposta-integrada',
  prefixoPromptPadrao: '',
  cacheModelosMs: 0,           // desabilita cache nos testes
  timeoutChatMs: 300000,
  timeoutDescobertaModelosMs: 100,
  timeoutTotalDescobertaModelosMs: 200,
  modelosDisponiveis: [],
  arquivosCacheModelos: [],
  limiteBytesCacheModelos: 5242880,
  descobrirModelosAutomaticamente: false,
  comandoDescobertaModelos: '',
  usarAcpParaDescobertaModelos: false,
  tentarComandosLegadosDescobertaModelos: false,
  skillsSelecionadas: [],
  toolsSelecionadas: [],
  diretorioAgentesWorkspace: '.devin/agents',
  diretorioAgentesGlobal: '~/.config/devin/agents',
  diretorioSkillsWorkspace: '.devin/skills',
  diretorioSkillsGlobal: '~/.config/devin/skills',
  diretorioToolsWorkspace: '.devin/tools',
  diretorioToolsGlobal: '~/.config/devin/tools',
  caminhoDevin: 'devin',
  nomeTerminal: 'Devin Cli Chat',
  usarGitBashNoWindows: false,
  gitBashPath: '',
  usarContextoEditorAutomatico: true,
  modoContextoEditorAutomatico: 'selecao-ou-arquivo',
  limiteBytesContextoEditorAutomatico: 200000,
};
const mockGlobalState = new Map();
const mockConfigUpdates = [];

const mockVscode = {
  workspace: {
    getConfiguration: (_ext) => ({
      get: (key, def) => {
        const v = mockConfigValues[key];
        return v !== undefined ? v : def;
      },
      update: async (key, value, target) => { mockConfigUpdates.push({ section: _ext, key, value, target }); },
    }),
    workspaceFolders: null,
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },
  window: {
    createOutputChannel: (_name) => ({
      appendLine: () => {},
      show: () => {},
      dispose: () => {},
    }),
    createStatusBarItem: () => ({
      text: '',
      tooltip: '',
      show: () => {},
      hide: () => {},
      dispose: () => {},
    }),
    registerWebviewViewProvider: () => ({ dispose: () => {} }),
    onDidChangeTextEditorSelection: () => ({ dispose: () => {} }),
    onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
    activeTextEditor: null,
    showInformationMessage: async () => undefined,
    showErrorMessage: async () => undefined,
    showWarningMessage: async () => undefined,
    showQuickPick: async () => undefined,
    showInputBox: async () => undefined,
    createTerminal: () => ({
      show: () => {},
      sendText: () => {},
      dispose: () => {},
    }),
  },
  commands: {
    registerCommand: (_cmd, _fn) => ({ dispose: () => {} }),
    executeCommand: async () => undefined,
  },
  Uri: {
    file: (p) => ({ fsPath: p, scheme: 'file', toString: () => 'file://' + p }),
  },
  StatusBarAlignment: { Left: 1, Right: 2 },
  ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
  EventEmitter: class {
    constructor() { this.event = () => {}; }
    fire() {}
    dispose() {}
  },
  ExtensionMode: { Development: 1, Production: 2, Test: 3 },
  ViewColumn: { One: 1 },
};

// Instalar mock em require.cache antes de qualquer require do código da extensão
const Module = require('module');
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === 'vscode') return '__vscode_mock__';
  return origResolveFilename.call(this, request, ...args);
};
require.cache['__vscode_mock__'] = {
  id: '__vscode_mock__',
  filename: '__vscode_mock__',
  loaded: true,
  exports: mockVscode,
};

// ── Carregar extensão ─────────────────────────────────────────────────────────
const extPath = path.join(__dirname, '..', 'out', 'extension.js');
if (!fs.existsSync(extPath)) {
  console.error('ERRO: ' + extPath + ' não encontrado. Execute: npm run compile');
  process.exit(1);
}
const ext = require(extPath);
const {
  sanitizeModel,
  sanitizePromptText,
  isSafeModelId,
  baseArgs,
  fullPrompt,
  modelsForUi,
  scanAgents,
  scanSkills,
  scanTools,
  skillNameFromMarkdownFile,
  importSkillMarkdownFile,
  importAgentMarkdownFile,
  importToolMarkdownFile,
  cancelIntegratedRun,
  automaticEditorContext,
  resolveWorkspacePathSafe,
  registerRunState,
  unregisterRunState,
  activeRunIds,
  createNonce,
  validateWebviewMessage,
  expandSlashCommand,
  exportSessionMarkdown,
  shouldApplyFirstInstallRightSidebar,
} = ext._internal;

// ── Mini runner de testes ─────────────────────────────────────────────────────
let _passed = 0, _failed = 0;
const _failures = [];

function test(name, fn) {
  try {
    fn();
    console.log('  PASS ' + name);
    _passed++;
  } catch (e) {
    console.log('  FAIL ' + name);
    console.log('       ' + (e.message || String(e)));
    _failed++;
    _failures.push({ name, error: e.message });
  }
}

// ── Testes: sanitizeModel ─────────────────────────────────────────────────────
console.log('\n── sanitizeModel ──');

test('auto → auto', () => {
  assert.strictEqual(sanitizeModel('auto'), 'auto');
});
test('Auto → auto (case-insensitive)', () => {
  assert.strictEqual(sanitizeModel('Auto'), 'auto');
});
test('string vazia → auto', () => {
  assert.strictEqual(sanitizeModel(''), 'auto');
});
test('null → auto', () => {
  assert.strictEqual(sanitizeModel(null), 'auto');
});
test('undefined → auto', () => {
  assert.strictEqual(sanitizeModel(undefined), 'auto');
});
test('"default" → auto', () => {
  assert.strictEqual(sanitizeModel('default'), 'auto');
});
test('"padrao" → auto', () => {
  assert.strictEqual(sanitizeModel('padrao'), 'auto');
});
test('sonnet → sonnet (alias válido)', () => {
  assert.strictEqual(sanitizeModel('sonnet'), 'sonnet');
});
test('claude-3.5-sonnet → claude-3.5-sonnet (ID livre válido)', () => {
  assert.strictEqual(sanitizeModel('claude-3.5-sonnet'), 'claude-3.5-sonnet');
});
test('modelo com caractere proibido "<" → auto', () => {
  assert.strictEqual(sanitizeModel('<script>'), 'auto');
});
test('modelo com espaço → auto', () => {
  assert.strictEqual(sanitizeModel('meu modelo'), 'auto');
});
test('string muito longa (>81 chars) → auto', () => {
  assert.strictEqual(sanitizeModel('a'.repeat(200)), 'auto');
});
test('string de 82 chars (no limite) → auto', () => {
  // isSafeModelId: 1 char inicial + 1..80 = total 2..81 chars válidos; 82 é inválido
  assert.strictEqual(sanitizeModel('a'.repeat(82)), 'auto');
});
test('string de 81 chars (no limite) → não auto', () => {
  const s = 'a'.repeat(81);
  assert.notStrictEqual(sanitizeModel(s), 'auto');
});

// ── Testes: isSafeModelId ─────────────────────────────────────────────────────
console.log('\n── isSafeModelId ──');

test('"auto" → true', () => {
  assert.ok(isSafeModelId('auto'));
});
test('"claude-3.5-sonnet" → true', () => {
  assert.ok(isSafeModelId('claude-3.5-sonnet'));
});
test('"model_v2.0" → true (underscore e ponto)', () => {
  assert.ok(isSafeModelId('model_v2.0'));
});
test('"" → false', () => {
  assert.ok(!isSafeModelId(''));
});
test('"<script>" → false', () => {
  assert.ok(!isSafeModelId('<script>'));
});
test('"a b" → false (espaço)', () => {
  assert.ok(!isSafeModelId('a b'));
});
test('"a".repeat(200) → false (muito longo)', () => {
  assert.ok(!isSafeModelId('a'.repeat(200)));
});
test('"-auto" → false (começa com hífen)', () => {
  assert.ok(!isSafeModelId('-auto'));
});
test('"a" → false (1 char, mínimo 2)', () => {
  assert.ok(!isSafeModelId('a'));
});
test('"ab" → true (2 chars, mínimo)', () => {
  assert.ok(isSafeModelId('ab'));
});

// ── Testes: baseArgs ──────────────────────────────────────────────────────────
console.log('\n── baseArgs ──');

test('model=auto NÃO envia --model', () => {
  mockConfigValues.modeloAtual = 'auto';
  mockConfigValues.argumentosPadrao = [];
  const args = baseArgs();
  assert.ok(!args.includes('--model'), 'args não deve conter --model: ' + JSON.stringify(args));
  assert.ok(!args.includes('auto'), 'args não deve conter "auto": ' + JSON.stringify(args));
});

test('model=sonnet envia --model sonnet', () => {
  mockConfigValues.modeloAtual = 'sonnet';
  const args = baseArgs();
  assert.ok(args.includes('--model'), 'deve conter --model');
  assert.ok(args.includes('sonnet'), 'deve conter sonnet');
});

test('model=claude-3.5-sonnet envia --model claude-3.5-sonnet', () => {
  mockConfigValues.modeloAtual = 'claude-3.5-sonnet';
  const args = baseArgs();
  assert.ok(args.includes('--model'), 'deve conter --model');
  assert.ok(args.includes('claude-3.5-sonnet'), 'deve conter o ID');
});

test('model inválido "<script>" → sanitizado para auto, NÃO envia --model', () => {
  mockConfigValues.modeloAtual = '<script>';
  const args = baseArgs();
  assert.ok(!args.includes('--model'), 'args não deve conter --model');
});

test('model="" → auto, NÃO envia --model', () => {
  mockConfigValues.modeloAtual = '';
  const args = baseArgs();
  assert.ok(!args.includes('--model'));
});

test('argumentosPadrao=["--timeout","60"] → incluídos', () => {
  mockConfigValues.modeloAtual = 'auto';
  mockConfigValues.argumentosPadrao = ['--timeout', '60'];
  const args = baseArgs();
  assert.ok(args.includes('--timeout'));
  assert.ok(args.includes('60'));
  // Restaurar
  mockConfigValues.argumentosPadrao = [];
});

test('argumentoModelo vazio → não envia modelo mesmo com model válido', () => {
  mockConfigValues.modeloAtual = 'sonnet';
  mockConfigValues.argumentoModelo = '';
  const args = baseArgs();
  assert.ok(!args.includes('--model'));
  assert.ok(!args.includes('sonnet'));
  // Restaurar
  mockConfigValues.argumentoModelo = '--model';
  mockConfigValues.modeloAtual = 'auto';
});

// ── Testes: fullPrompt ────────────────────────────────────────────────────────
console.log('\n── fullPrompt ──');

test('texto simples aparece no prompt', () => {
  mockConfigValues.prefixoPromptPadrao = '';
  mockConfigValues.agenteAtual = 'auto';
  mockConfigValues.skillsSelecionadas = [];
  const prompt = fullPrompt('ola mundo');
  assert.ok(prompt.includes('ola mundo'), 'prompt deve conter o texto');
});

test('prefixo é incluído quando configurado', () => {
  mockConfigValues.prefixoPromptPadrao = 'Responda em pt-BR.';
  const prompt = fullPrompt('teste');
  assert.ok(prompt.includes('Responda em pt-BR.'));
  mockConfigValues.prefixoPromptPadrao = '';
});

test('agente não-auto gera hint no prompt', () => {
  mockConfigValues.agenteAtual = 'meu-agente';
  const prompt = fullPrompt('teste');
  assert.ok(prompt.includes('meu-agente'), 'prompt deve mencionar o agente');
  mockConfigValues.agenteAtual = 'auto';
});

test('skills selecionadas são mencionadas no prompt', () => {
  mockConfigValues.skillsSelecionadas = ['skill-a', 'skill-b'];
  const prompt = fullPrompt('teste');
  assert.ok(prompt.includes('skill-a'), 'prompt deve mencionar skill-a');
  mockConfigValues.skillsSelecionadas = [];
});

test('tools selecionadas são mencionadas no prompt', () => {
  mockConfigValues.toolsSelecionadas = ['tool-a', 'tool-b'];
  const prompt = fullPrompt('teste');
  assert.ok(prompt.includes('tool-a'), 'prompt deve mencionar tool-a');
  assert.ok(prompt.includes('TOOL.md'), 'prompt deve orientar TOOL.md');
  mockConfigValues.toolsSelecionadas = [];
});

test('fullPrompt remove bytes nulos antes de chamar a CLI', () => {
  const prompt = fullPrompt('arquivo binario\u0000com byte nulo');
  assert.ok(!prompt.includes('\u0000'), 'prompt final nao pode conter byte nulo');
  assert.strictEqual(sanitizePromptText('a\u0000b'), 'ab');
});

// ── Testes: modelsForUi ───────────────────────────────────────────────────────
console.log('\n── modelsForUi ──');

test('sempre inclui "auto"', () => {
  const models = modelsForUi();
  assert.ok(Array.isArray(models), 'deve ser array');
  assert.ok(models.includes('auto'), 'deve incluir auto: ' + JSON.stringify(models));
});

test('retorna pelo menos os aliases base', () => {
  const models = modelsForUi();
  for (const alias of ['auto', 'sonnet', 'opus']) {
    assert.ok(models.includes(alias), 'deve incluir ' + alias);
  }
});

// ── Testes: scanAgents / scanSkills ───────────────────────────────────────────
console.log('\n── scanAgents / scanSkills ──');

test('scanAgents em diretório vazio retorna array com "auto"', () => {
  // Config aponta para diretório inexistente
  mockConfigValues.diretorioAgentesWorkspace = path.join(os.tmpdir(), 'devin-test-agents-' + Date.now());
  mockConfigValues.diretorioAgentesGlobal = path.join(os.tmpdir(), 'devin-test-agents-global-' + Date.now());
  const agents = scanAgents();
  assert.ok(Array.isArray(agents), 'deve ser array');
  assert.ok(agents.includes('auto'), 'deve incluir auto');
  // Restaurar
  mockConfigValues.diretorioAgentesWorkspace = '.devin/agents';
  mockConfigValues.diretorioAgentesGlobal = '~/.config/devin/agents';
});

test('scanSkills em diretório vazio retorna array vazio ou array', () => {
  mockConfigValues.diretorioSkillsWorkspace = path.join(os.tmpdir(), 'devin-test-skills-' + Date.now());
  mockConfigValues.diretorioSkillsGlobal = path.join(os.tmpdir(), 'devin-test-skills-global-' + Date.now());
  const skills = scanSkills();
  assert.ok(Array.isArray(skills), 'deve ser array');
  // Restaurar
  mockConfigValues.diretorioSkillsWorkspace = '.devin/skills';
  mockConfigValues.diretorioSkillsGlobal = '~/.config/devin/skills';
});

test('skillNameFromMarkdownFile normaliza nome de arquivo .md para skill', () => {
  assert.strictEqual(skillNameFromMarkdownFile('/tmp/Code Review Avancado.md'), 'code-review-avancado');
  assert.strictEqual(skillNameFromMarkdownFile('/tmp/@@@.md'), 'skill');
});

test('importSkillMarkdownFile copia .md para diretorio padrao como SKILL.md', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devin-import-skill-'));
  const source = path.join(root, 'Minha Skill.md');
  const skillsDir = path.join(root, 'skills');
  fs.writeFileSync(source, '# Minha Skill\n\nUse esta skill.', 'utf8');
  mockConfigValues.diretorioSkillsWorkspace = skillsDir;
  mockConfigValues.diretorioSkillsGlobal = path.join(root, 'global-skills');
  const imported = importSkillMarkdownFile(source);
  assert.strictEqual(imported.name, 'minha-skill');
  assert.ok(fs.existsSync(path.join(skillsDir, 'minha-skill', 'SKILL.md')), 'SKILL.md deve ser criado');
  assert.ok(scanSkills().includes('minha-skill'), 'scanSkills deve encontrar a skill importada');
  mockConfigValues.diretorioSkillsWorkspace = '.devin/skills';
  mockConfigValues.diretorioSkillsGlobal = '~/.config/devin/skills';
});

test('importAgentMarkdownFile copia .md para diretorio padrao como AGENT.md', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devin-import-agent-'));
  const source = path.join(root, 'Meu Agente.md');
  const agentsDir = path.join(root, 'agents');
  fs.writeFileSync(source, '# Meu Agente', 'utf8');
  mockConfigValues.diretorioAgentesWorkspace = agentsDir;
  const imported = importAgentMarkdownFile(source);
  assert.strictEqual(imported.name, 'meu-agente');
  assert.ok(fs.existsSync(path.join(agentsDir, 'meu-agente', 'AGENT.md')), 'AGENT.md deve ser criado');
  assert.ok(scanAgents().includes('meu-agente'), 'scanAgents deve encontrar o agente importado');
  mockConfigValues.diretorioAgentesWorkspace = '.devin/agents';
});

test('importToolMarkdownFile copia .md para diretorio padrao como TOOL.md', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devin-import-tool-'));
  const source = path.join(root, 'Minha Tool.md');
  const toolsDir = path.join(root, 'tools');
  fs.writeFileSync(source, '# Minha Tool', 'utf8');
  mockConfigValues.diretorioToolsWorkspace = toolsDir;
  mockConfigValues.diretorioToolsGlobal = path.join(root, 'global-tools');
  const imported = importToolMarkdownFile(source);
  assert.strictEqual(imported.name, 'minha-tool');
  assert.ok(fs.existsSync(path.join(toolsDir, 'minha-tool', 'TOOL.md')), 'TOOL.md deve ser criado');
  assert.ok(scanTools().includes('minha-tool'), 'scanTools deve encontrar a tool importada');
  mockConfigValues.diretorioToolsWorkspace = '.devin/tools';
  mockConfigValues.diretorioToolsGlobal = '~/.config/devin/tools';
});

// ── Teste: sintaxe do script da webview (via extension.ts) ───────────────────
console.log('\n── webview script syntax ──');

test('script embutido da webview compila sem SyntaxError', () => {
  const srcFile = path.join(__dirname, '..', 'src', 'extension.ts');
  assert.ok(fs.existsSync(srcFile), 'extension.ts deve existir');
  const src = fs.readFileSync(srcFile, 'utf8');
  const scriptMatch = src.match(/<script nonce="\$\{nonce\}">([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'bloco <script nonce> deve existir no fonte');
  const rawScript = scriptMatch[1];
  const clean = rawScript.replace(/\$\{[^}]+\}/g, '"__TMPL__"');
  // eslint-disable-next-line no-new-func
  assert.doesNotThrow(() => { new Function(clean); }, 'script deve compilar sem SyntaxError');
});

test('script da webview tem delegação de clique', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'extension.ts'), 'utf8');
  const scriptMatch = src.match(/<script nonce="\$\{nonce\}">([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch && scriptMatch[1].includes("document.addEventListener('click'"),
    'deve ter delegação de clique');
});

test('script da webview tem ação verifyCli', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'extension.ts'), 'utf8');
  const scriptMatch = src.match(/<script nonce="\$\{nonce\}">([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch && scriptMatch[1].includes('verifyCli'), 'deve ter verifyCli');
});

test('script da webview tem ação cancelRun', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'extension.ts'), 'utf8');
  const scriptMatch = src.match(/<script nonce="\$\{nonce\}">([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch && scriptMatch[1].includes('cancelRun'), 'deve ter cancelRun');
});

test('script da webview tem sugestoes de slash command e arquivo com @', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'extension.ts'), 'utf8');
  const scriptMatch = src.match(/<script nonce="\$\{nonce\}">([\s\S]*?)<\/script>/);
  const script = scriptMatch ? scriptMatch[1] : '';
  assert.ok(script.includes('slashItems'), 'deve conter lista de slash commands');
  assert.ok(script.includes('searchWorkspaceFiles'), 'deve buscar arquivos do workspace para @');
  assert.ok(script.includes('workspaceFileSuggestions'), 'deve renderizar sugestoes de arquivos');
});

// ── Testes: automaticEditorContext ────────────────────────────────────────────
console.log('\n── automaticEditorContext ──');

function makeEditor(opts) {
  opts = opts || {};
  var fileText = opts.fileText != null ? opts.fileText : 'linha1\nlinha2\n';
  var selText  = opts.selText  != null ? opts.selText  : '';
  var startLine = opts.startLine != null ? opts.startLine : 0;
  var endLine   = opts.endLine   != null ? opts.endLine   : 0;
  var isEmpty   = !selText;
  return {
    document: {
      uri: {
        fsPath: opts.fsPath || '/tmp/base.ts',
        scheme: opts.scheme || 'file',
        toString: function() { return 'file://' + (opts.fsPath || '/tmp/base.ts'); }
      },
      languageId: opts.languageId || 'typescript',
      getText: function(sel) { return sel ? selText : fileText; },
    },
    selection: {
      isEmpty: isEmpty,
      start: { line: startLine, character: 0 },
      end:   { line: endLine,   character: 0 },
    },
  };
}

test('automaticEditorContext: desativado por config → null', () => {
  mockConfigValues.usarContextoEditorAutomatico = false;
  mockVscode.window.activeTextEditor = makeEditor({ selText: 'abc' });
  const r = automaticEditorContext();
  assert.strictEqual(r, null);
  mockConfigValues.usarContextoEditorAutomatico = true;
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: modo=desativado → null', () => {
  mockConfigValues.modoContextoEditorAutomatico = 'desativado';
  mockVscode.window.activeTextEditor = makeEditor({ selText: 'abc' });
  const r = automaticEditorContext();
  assert.strictEqual(r, null);
  mockConfigValues.modoContextoEditorAutomatico = 'selecao-ou-arquivo';
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: sem editor ativo → null', () => {
  mockVscode.window.activeTextEditor = null;
  const r = automaticEditorContext();
  assert.strictEqual(r, null);
});

test('automaticEditorContext: scheme!=file → null', () => {
  mockVscode.window.activeTextEditor = makeEditor({ scheme: 'untitled', fileText: 'x' });
  const r = automaticEditorContext();
  assert.strictEqual(r, null);
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: com selecao → label arquivo:start-end, promptBlock com texto', () => {
  mockVscode.window.activeTextEditor = makeEditor({
    fsPath: '/proj/src/app.ts',
    selText: 'const x = 1;',
    startLine: 9, endLine: 24,
  });
  const r = automaticEditorContext();
  assert.ok(r, 'deve retornar objeto');
  assert.strictEqual(r.label, 'app.ts:10-25');
  assert.ok(r.promptBlock.includes('const x = 1;'), 'deve conter texto selecionado');
  assert.ok(r.promptBlock.includes('app.ts:10-25'), 'deve conter label');
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: sem selecao → arquivo inteiro com label=basename', () => {
  mockVscode.window.activeTextEditor = makeEditor({
    fsPath: '/proj/src/util.ts',
    fileText: 'export function hello() { return "world"; }',
    selText: '',
  });
  const r = automaticEditorContext();
  assert.ok(r, 'deve retornar objeto');
  assert.strictEqual(r.label, 'util.ts');
  assert.ok(r.promptBlock.includes('export function hello'));
  assert.ok(!r.promptBlock.includes('truncado'));
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: arquivo grande → truncado, nota, label com "(truncado)"', () => {
  mockConfigValues.limiteBytesContextoEditorAutomatico = 100;
  mockVscode.window.activeTextEditor = makeEditor({
    fsPath: '/proj/src/big.ts',
    fileText: 'x'.repeat(500),
    selText: '',
  });
  const r = automaticEditorContext();
  assert.ok(r, 'deve retornar objeto');
  assert.ok(r.label.includes('(truncado)'), 'label deve ter (truncado): ' + r.label);
  assert.ok(r.promptBlock.includes('[NOTA:'), 'deve ter nota de truncamento');
  mockConfigValues.limiteBytesContextoEditorAutomatico = 200000;
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: modo=somente-selecao sem selecao → null', () => {
  mockConfigValues.modoContextoEditorAutomatico = 'somente-selecao';
  mockVscode.window.activeTextEditor = makeEditor({ selText: '', fileText: 'algo' });
  const r = automaticEditorContext();
  assert.strictEqual(r, null);
  mockConfigValues.modoContextoEditorAutomatico = 'selecao-ou-arquivo';
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: modo=somente-selecao com selecao → retorna selecao', () => {
  mockConfigValues.modoContextoEditorAutomatico = 'somente-selecao';
  mockVscode.window.activeTextEditor = makeEditor({
    fsPath: '/tmp/x.ts', selText: 'foo', startLine: 0, endLine: 0,
  });
  const r = automaticEditorContext();
  assert.ok(r, 'deve retornar objeto');
  assert.strictEqual(r.label, 'x.ts:1-1');
  mockConfigValues.modoContextoEditorAutomatico = 'selecao-ou-arquivo';
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: modo=somente-arquivo sem selecao → retorna arquivo', () => {
  mockConfigValues.modoContextoEditorAutomatico = 'somente-arquivo';
  mockVscode.window.activeTextEditor = makeEditor({
    fsPath: '/tmp/z.ts', selText: '', fileText: 'inteiro',
  });
  const r = automaticEditorContext();
  assert.ok(r, 'deve retornar objeto');
  assert.strictEqual(r.label, 'z.ts');
  assert.ok(r.promptBlock.includes('inteiro'));
  mockConfigValues.modoContextoEditorAutomatico = 'selecao-ou-arquivo';
  mockVscode.window.activeTextEditor = null;
});

test('automaticEditorContext: modo=somente-arquivo com selecao → retorna arquivo (ignora selecao)', () => {
  mockConfigValues.modoContextoEditorAutomatico = 'somente-arquivo';
  mockVscode.window.activeTextEditor = makeEditor({
    fsPath: '/tmp/y.ts', selText: 'ignorar', startLine: 2, endLine: 3,
    fileText: 'arquivo todo aqui',
  });
  const r = automaticEditorContext();
  assert.ok(r, 'deve retornar objeto');
  assert.strictEqual(r.label, 'y.ts');
  assert.ok(r.promptBlock.includes('arquivo todo aqui'));
  mockConfigValues.modoContextoEditorAutomatico = 'selecao-ou-arquivo';
  mockVscode.window.activeTextEditor = null;
});

// ── Testes: workspace path safety ────────────────────────────────────────────
console.log('\n── workspace path safety ──');

test('resolveWorkspacePathSafe permite caminho relativo dentro do workspace', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devin-safe-root-'));
  mockVscode.workspace.workspaceFolders = [{ name: 'safe', uri: mockVscode.Uri.file(root) }];
  const resolved = resolveWorkspacePathSafe('src/app.ts');
  const realRoot = fs.realpathSync.native ? fs.realpathSync.native(root) : fs.realpathSync(root);
  assert.strictEqual(resolved, path.join(realRoot, 'src', 'app.ts'));
  mockVscode.workspace.workspaceFolders = null;
  fs.rmSync(root, { recursive: true, force: true });
});

test('resolveWorkspacePathSafe bloqueia traversal fora do workspace', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devin-safe-root-'));
  mockVscode.workspace.workspaceFolders = [{ name: 'safe', uri: mockVscode.Uri.file(root) }];
  assert.strictEqual(resolveWorkspacePathSafe('../outside.txt'), null);
  assert.strictEqual(resolveWorkspacePathSafe('sub/../../outside.txt'), null);
  mockVscode.workspace.workspaceFolders = null;
  fs.rmSync(root, { recursive: true, force: true });
});

test('resolveWorkspacePathSafe bloqueia path absoluto fora do workspace', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devin-safe-root-'));
  const outside = path.join(os.tmpdir(), 'outside.txt');
  mockVscode.workspace.workspaceFolders = [{ name: 'safe', uri: mockVscode.Uri.file(root) }];
  assert.strictEqual(resolveWorkspacePathSafe(outside), null);
  mockVscode.workspace.workspaceFolders = null;
  fs.rmSync(root, { recursive: true, force: true });
});

// ── Testes: prerelease workflow ──────────────────────────────────────────────
console.log('\n── prerelease workflow ──');

test('publish workflow calcula flag de pre-release para versão menor ímpar', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'publish.yml'), 'utf8');
  assert.ok(workflow.includes('minor % 2 === 1'), 'workflow deve detectar versão menor ímpar');
  assert.ok(workflow.includes('--pre-release'), 'workflow deve empacotar/publicar pre-release com --pre-release');
  assert.ok(workflow.includes('prerelease_flag'), 'workflow deve propagar flag de pre-release');
});

// ── Testes: run state por sessão ─────────────────────────────────────────────
console.log('\n── run state por sessão ──');

test('cancelIntegratedRun cancela apenas a execução da sessão informada', () => {
  let killedA = false;
  let killedB = false;
  registerRunState('sess-a', { process: { killed: false, kill: () => { killedA = true; } } });
  registerRunState('sess-b', { process: { killed: false, kill: () => { killedB = true; } } });
  assert.strictEqual(cancelIntegratedRun('sess-a'), true);
  assert.strictEqual(killedA, true);
  assert.strictEqual(killedB, false);
  unregisterRunState('sess-a');
  unregisterRunState('sess-b');
});

test('unregisterRunState remove execução finalizada da sessão', () => {
  registerRunState('sess-final', { process: { killed: false, kill: () => {} } });
  assert.ok(activeRunIds().includes('sess-final'), 'sessão deve estar registrada');
  unregisterRunState('sess-final');
  assert.ok(!activeRunIds().includes('sess-final'), 'sessão finalizada não deve permanecer registrada');
});

// ── Testes: webview hardening ────────────────────────────────────────────────
console.log('\n── webview hardening ──');

test('createNonce gera nonce criptografico sem timestamp previsivel', () => {
  const nonce = createNonce();
  assert.ok(/^[A-Za-z0-9+/=]{20,}$/.test(nonce), 'nonce deve parecer base64 forte: ' + nonce);
  assert.notStrictEqual(nonce, Date.now().toString(36), 'nonce não deve ser Date.now()');
  assert.notStrictEqual(createNonce(), nonce, 'nonces consecutivos devem diferir');
});

test('validateWebviewMessage rejeita payload malformado', () => {
  assert.strictEqual(validateWebviewMessage(null), null);
  assert.strictEqual(validateWebviewMessage({ type: 'send', text: { bad: true } }), null);
  assert.strictEqual(validateWebviewMessage({ type: 'loadSession', id: '../x' }), null);
  assert.strictEqual(validateWebviewMessage({ type: 'unknownAction' }), null);
});

test('validateWebviewMessage normaliza payload valido', () => {
  const msg = validateWebviewMessage({ type: 'send', text: 'ola', displayText: 'ola', echo: false, hasExplicitContext: true });
  assert.deepStrictEqual(msg, { type: 'send', text: 'ola', displayText: 'ola', echo: false, hasExplicitContext: true });
});

test('validateWebviewMessage aceita busca de arquivos do workspace', () => {
  assert.deepStrictEqual(validateWebviewMessage({ type: 'searchWorkspaceFiles', query: 'src/ext' }), { type: 'searchWorkspaceFiles', query: 'src/ext' });
});

// ── Testes: slash commands e export ──────────────────────────────────────────
console.log('\n── slash commands e export ──');

test('expandSlashCommand transforma comandos produtivos em prompts estruturados', () => {
  assert.ok(expandSlashCommand('/review').text.includes('Revise o git diff atual'));
  assert.ok(expandSlashCommand('/tests fluxo de login').text.includes('testes'));
  assert.ok(expandSlashCommand('texto normal') === null);
});

test('exportSessionMarkdown gera markdown com metadados e mensagens', () => {
  const md = exportSessionMarkdown({
    title: 'Sessao teste',
    workspace: 'demo',
    model: 'sonnet',
    agent: 'auto',
    messages: [
      { role: 'user', text: 'pergunta' },
      { role: 'assistant', text: 'resposta' },
    ],
  });
  assert.ok(md.includes('# Sessao teste'));
  assert.ok(md.includes('Workspace: demo'));
  assert.ok(md.includes('## User'));
  assert.ok(md.includes('pergunta'));
  assert.ok(md.includes('## Assistant'));
});

// ── Testes: layout inicial ───────────────────────────────────────────────────
console.log('\n── layout inicial ──');

test('shouldApplyFirstInstallRightSidebar aplica apenas sem flag e sem historico', () => {
  const context = {
    globalState: {
      get: (key) => mockGlobalState.get(key),
    },
  };
  mockGlobalState.clear();
  assert.strictEqual(shouldApplyFirstInstallRightSidebar(context), true);
  mockGlobalState.set('devinCliChat.chatHistory.v1', [{ id: 'sess-1' }]);
  assert.strictEqual(shouldApplyFirstInstallRightSidebar(context), false);
  mockGlobalState.clear();
  mockGlobalState.set('devinCliChat.firstInstallLayout.v1', true);
  assert.strictEqual(shouldApplyFirstInstallRightSidebar(context), false);
  mockGlobalState.clear();
});

// ── Teste: activate smoke ─────────────────────────────────────────────────────
console.log('\n── activate smoke ──');

test('activate não lança exceção e registra subscriptions', () => {
  const subscriptions = [];
  const mockCtx = {
    subscriptions,
    extensionPath: path.join(__dirname, '..'),
    extensionUri: mockVscode.Uri.file(path.join(__dirname, '..')),
    globalState: {
      get: (key) => mockGlobalState.get(key),
      update: async (key, value) => { mockGlobalState.set(key, value); },
      setKeysForSync: () => {},
      keys: () => [],
    },
    workspaceState: {
      get: () => undefined,
      update: async () => {},
      keys: () => [],
    },
    storagePath: os.tmpdir(),
    globalStoragePath: os.tmpdir(),
    logPath: os.tmpdir(),
    extensionMode: 3,
    storageUri: null,
    globalStorageUri: null,
    logUri: null,
    secrets: {
      get: async () => undefined,
      store: async () => {},
      delete: async () => {},
      onDidChange: () => ({ dispose: () => {} }),
    },
    extension: { id: 'test.devin-cli-chat', packageJSON: {} },
    asAbsolutePath: (p) => path.join(__dirname, '..', p),
  };
  assert.doesNotThrow(() => { ext.activate(mockCtx); }, 'activate não deve lançar exceção');
  assert.ok(subscriptions.length > 0, 'deve registrar ≥1 subscription, registrou: ' + subscriptions.length);
});

// ── Resultado ─────────────────────────────────────────────────────────────────
console.log('');
console.log(`${_passed} passed, ${_failed} failed`);
if (_failures.length) {
  console.log('\nFalhas:');
  _failures.forEach(f => console.log('  - ' + f.name + ': ' + f.error));
}
process.exit(_failed > 0 ? 1 : 0);
