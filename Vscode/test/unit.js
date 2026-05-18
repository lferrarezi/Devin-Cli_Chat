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
  diretorioAgentesWorkspace: '.devin/agents',
  diretorioAgentesGlobal: '~/.config/devin/agents',
  diretorioSkillsWorkspace: '.devin/skills',
  diretorioSkillsGlobal: '~/.config/devin/skills',
  caminhoDevin: 'devin',
  nomeTerminal: 'Devin Cli Chat',
  usarGitBashNoWindows: false,
  gitBashPath: '',
};

const mockVscode = {
  workspace: {
    getConfiguration: (_ext) => ({
      get: (key, def) => {
        const v = mockConfigValues[key];
        return v !== undefined ? v : def;
      },
      update: async () => {},
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
  isSafeModelId,
  baseArgs,
  fullPrompt,
  modelsForUi,
  scanAgents,
  scanSkills,
  cancelIntegratedRun,
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

// ── Resultado ─────────────────────────────────────────────────────────────────
console.log('');
console.log(`${_passed} passed, ${_failed} failed`);
if (_failures.length) {
  console.log('\nFalhas:');
  _failures.forEach(f => console.log('  - ' + f.name + ': ' + f.error));
}
process.exit(_failed > 0 ? 1 : 0);
