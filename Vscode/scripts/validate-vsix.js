#!/usr/bin/env node
'use strict';

/**
 * Valida a estrutura e conteúdo do VSIX gerado.
 * Uso: node scripts/validate-vsix.js [caminho-do-vsix]
 * Se não receber argumento, localiza o VSIX mais recente da versão atual em Vscode/.
 */

const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

const root = path.join(__dirname, '..');
const pkg  = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedVersion = pkg.version;

// ── Localizar VSIX ────────────────────────────────────────────────────────────
let vsixPath;
if (process.argv[2]) {
  vsixPath = path.isAbsolute(process.argv[2])
    ? process.argv[2]
    : path.join(process.cwd(), process.argv[2]);
} else {
  const candidates = fs.readdirSync(root)
    .filter(f => f.endsWith('.vsix') && f.includes(expectedVersion))
    .map(f => path.join(root, f));
  if (!candidates.length) {
    console.error('ERRO: nenhum VSIX encontrado para versão ' + expectedVersion + ' em ' + root);
    console.error('Gere o pacote com: npm run package');
    process.exit(1);
  }
  // Usa o mais recente
  vsixPath = candidates.sort().pop();
}

if (!fs.existsSync(vsixPath)) {
  console.error('ERRO: VSIX não encontrado: ' + vsixPath);
  process.exit(1);
}

console.log('Validando: ' + path.basename(vsixPath));
console.log('');

let passed = 0, failed = 0, warned = 0;
function ok(msg)   { console.log('  OK   ' + msg); passed++; }
function fail(msg) { console.log('  FAIL ' + msg); failed++; }
function warn(msg) { console.log('  WARN ' + msg); warned++; }

// ── Helper: listar arquivos no VSIX ───────────────────────────────────────────
let listing = '';
try {
  listing = cp.execFileSync('unzip', ['-l', vsixPath], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
} catch (e) {
  fail('Falha ao listar VSIX com unzip: ' + e.message);
  process.exit(1);
}
const vsixFiles = listing.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const hasPath = (p) => vsixFiles.some(l => l.includes(p));

// ── Helper: extrair arquivo do VSIX ───────────────────────────────────────────
function extractFile(internalPath) {
  try {
    return cp.execFileSync('unzip', ['-p', vsixPath, internalPath], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 10
    });
  } catch (e) {
    return null;
  }
}

// ── 1. Arquivos obrigatórios ───────────────────────────────────────────────────
const required = [
  'extension/package.json',
  'extension/out/extension.js',
  'extension/src/extension.ts',
  'extension/readme.md',
  'extension/changelog.md',
  'extension/LICENSE.txt',
  'extension/NOTICE',
  'extension/media/',
];
for (const req of required) {
  if (hasPath(req)) ok(req + ' presente');
  else fail(req + ' AUSENTE');
}

// ── 2. Arquivos proibidos ─────────────────────────────────────────────────────
const forbidden = [
  { path: 'node_modules/typescript', label: 'node_modules/typescript' },
  { path: 'node_modules/',           label: 'node_modules/' },
  { path: 'source/',                 label: 'diretório source/' },
  { path: '_old/',                   label: 'diretório _old/' },
  { path: 'VERSION_0.29',            label: 'VERSION_0.29_ANALISE.md' },
  { path: '.DS_Store',               label: '.DS_Store' },
];
for (const { path: fp, label } of forbidden) {
  if (hasPath(fp)) fail('contém ' + label + ' (PROIBIDO)');
  else ok('sem ' + label);
}

// ── 3. VSIX aninhado proibido ─────────────────────────────────────────────────
// Usa unzip -l cujas linhas de arquivo têm formato: "  SIZE  DATE  TIME  PATH"
// Ignora linhas de header/footer e verifica o final de cada linha (caminho do arquivo)
const vsixBasename = path.basename(vsixPath);
const nestedVsix = vsixFiles.filter(l => {
  const trimmed = l.trim();
  // Pular header/footer do unzip (linhas sem pattern de arquivo)
  if (trimmed.startsWith('Archive:') || trimmed.startsWith('-----') || trimmed === '') return false;
  if (/^Length\s+Date/.test(trimmed) || /^\d+ files/.test(trimmed)) return false;
  // O campo de nome do arquivo é sempre o último campo na saída do unzip -l
  // mas como paths podem ter espaços, usamos outro critério: a linha termina em .vsix
  return trimmed.endsWith('.vsix') && !trimmed.endsWith(vsixBasename);
});
if (nestedVsix.length > 0) fail('contém VSIX aninhado: ' + nestedVsix[0]);
else ok('sem VSIX aninhado');

// ── 4. Versão interna bate com esperada ───────────────────────────────────────
const pkgContent = extractFile('extension/package.json');
let innerPkg = null;
if (!pkgContent) {
  fail('falha ao extrair extension/package.json');
} else {
  try {
    innerPkg = JSON.parse(pkgContent);
    if (innerPkg.version === expectedVersion) {
      ok('versão interna correta: ' + innerPkg.version);
    } else {
      fail('versão interna ' + innerPkg.version + ' != esperado ' + expectedVersion);
    }
    if (innerPkg.main === './out/extension.js') ok('main aponta para ./out/extension.js');
    else fail('main incorreto: ' + innerPkg.main);
  } catch (e) {
    fail('extension/package.json inválido: ' + e.message);
  }
}

// ── 4b. Validações específicas para Release Candidate ─────────────────────────
const isPrerelease = expectedVersion.includes('-');
if (isPrerelease) {
  console.log('  (RC) versão prerelease detectada: ' + expectedVersion);
  // SemVer prerelease: deve conter sufixo com hífem e pelo menos um segmento
  const semverPre = /^\d+\.\d+\.\d+-.+$/.test(expectedVersion);
  if (semverPre) ok('versão SemVer prerelease válida: ' + expectedVersion);
  else fail('formato de versão prerelease inválido: ' + expectedVersion);
  // preview: true obrigatório em releases candidate
  if (innerPkg) {
    if (innerPkg.preview === true) ok('"preview": true presente (obrigatório no RC)');
    else fail('"preview": true AUSENTE no package.json do RC');
  }
}

// ── 5. Sintaxe do extension.js extraído ──────────────────────────────────────
const extJs = extractFile('extension/out/extension.js');
if (!extJs) {
  fail('falha ao extrair extension/out/extension.js');
} else {
  try {
    // node --check não aceita stdin; salvar em temp
    const tmpFile = require('os').tmpdir() + '/validate-vsix-ext.js';
    fs.writeFileSync(tmpFile, extJs);
    cp.execFileSync('node', ['-c', tmpFile], { stdio: ['pipe', 'pipe', 'pipe'] });
    ok('extension.js syntax: OK');
    fs.unlinkSync(tmpFile);
  } catch (e) {
    fail('extension.js syntax ERROR: ' + e.message.split('\n')[0]);
  }
}

// ── 6. Script da webview extraído de extension.js ─────────────────────────────
if (extJs) {
  const scriptRe = /<script nonce=\\"\$\{nonce\}\\">([\s\S]*?)<\/script>/;
  // No JS compilado, as aspas podem ser escapadas diferente; tentar alternativa
  const match = extJs.match(/<script nonce=\\"[^"]*\\">([\s\S]{500,}?)<\/script>/) ||
                extJs.match(/\(function\(\)\{[\s\S]{500,}?\}\)\(\);/);
  if (match) {
    const scriptFragment = match[0];
    // Verificar sintaxe com new Function
    try {
      const clean = scriptFragment.replace(/\$\{[^}]+\}/g, '"__TMPL__"');
      // eslint-disable-next-line no-new-func
      new Function(clean);
      ok('fragmento de script da webview no VSIX: sintaxe OK');
    } catch (e) {
      // Se new Function falhar por contexto de template literal, apenas logar warning
      warn('webview script fragment new Function: ' + e.message.slice(0, 80));
    }
  } else {
    warn('fragmento de script da webview não encontrado no extension.js extraído');
  }
}

// ── 7. Tamanho do VSIX ────────────────────────────────────────────────────────
const sizeMB = fs.statSync(vsixPath).size / 1024 / 1024;
if (sizeMB < 5) ok('tamanho do VSIX: ' + sizeMB.toFixed(2) + ' MB (< 5 MB)');
else if (sizeMB < 10) warn('VSIX > 5 MB: ' + sizeMB.toFixed(2) + ' MB');
else fail('VSIX muito grande: ' + sizeMB.toFixed(2) + ' MB (> 10 MB)');

// ── Resultado ─────────────────────────────────────────────────────────────────
console.log('');
console.log(`${passed} passed, ${warned} warnings, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
