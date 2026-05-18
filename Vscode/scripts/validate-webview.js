#!/usr/bin/env node
'use strict';

/**
 * Valida estaticamente o bloco <script> embutido da webview em extension.ts.
 * Extrai o script, substitui expressões de template e testa a sintaxe com new Function().
 * Falha (exit 1) se o script tiver erro de sintaxe ou faltar marcadores obrigatórios.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcFile = path.join(root, 'src', 'extension.ts');

let passed = 0, failed = 0, warned = 0;
function ok(msg)   { console.log('  OK   ' + msg); passed++; }
function fail(msg) { console.log('  FAIL ' + msg); failed++; }
function warn(msg) { console.log('  WARN ' + msg); warned++; }

if (!fs.existsSync(srcFile)) {
  console.error('ERRO: ' + srcFile + ' não encontrado.');
  process.exit(1);
}

const src = fs.readFileSync(srcFile, 'utf8');

// ── 1. Localizar bloco de script ──────────────────────────────────────────────
const scriptRe = /<script nonce="\$\{nonce\}">([\s\S]*?)<\/script>/;
const scriptMatch = src.match(scriptRe);
if (!scriptMatch) {
  fail('<script nonce="${nonce}"> não encontrado no fonte');
  process.exit(1);
}
const rawScript = scriptMatch[1];
ok('bloco <script nonce> encontrado (' + rawScript.length + ' chars)');

// ── 2. Verificar CSP ──────────────────────────────────────────────────────────
if (/Content-Security-Policy/.test(src) && /script-src 'nonce-\$\{nonce\}'/.test(src)) {
  ok('CSP contém script-src com nonce');
} else {
  fail('CSP não contém script-src com nonce');
}

if (/script-src.*'unsafe-inline'/.test(src)) {
  fail("CSP contém 'unsafe-inline' em script-src");
} else {
  ok("CSP sem 'unsafe-inline'");
}

if (/script-src.*'unsafe-eval'/.test(src)) {
  fail("CSP contém 'unsafe-eval' em script-src");
} else {
  ok("CSP sem 'unsafe-eval'");
}

// ── 3. Validar sintaxe do script ──────────────────────────────────────────────
// Substitui expressões de template ${...} por string literal para que new Function() funcione
const cleanScript = rawScript.replace(/\$\{[^}]+\}/g, '"__TMPL__"');
try {
  // eslint-disable-next-line no-new-func
  new Function(cleanScript);
  ok('webview script syntax: OK');
} catch (e) {
  fail('webview script syntax ERROR: ' + e.message);
}

// ── 4. Marcadores obrigatórios ────────────────────────────────────────────────
const required = [
  ["document.addEventListener('click'", 'delegação de clique'],
  ['verifyCli',                          'ação verifyCli'],
  ['cancelRun',                          'ação cancelRun'],
  ["post({ type: 'send'",               'ação send'],
  ["post({ type: 'ready'",              'post ready'],
];
for (const [pattern, label] of required) {
  if (rawScript.includes(pattern)) ok('tem ' + label);
  else fail('falta ' + label + ' (' + pattern + ')');
}

// ── 5. Padrões perigosos ──────────────────────────────────────────────────────
const dangerous = [
  ['eval(',        'uso de eval()'],
  ['document.write', 'uso de document.write'],
];
for (const [pattern, label] of dangerous) {
  if (rawScript.includes(pattern)) fail(label);
  else ok('sem ' + label);
}

// ── 6. innerHTML com dados potencialmente controlados pelo usuário ────────────
const lines = rawScript.split('\n');
const dangerousInnerHTMLLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes('innerHTML')) continue;
  // Limpar: atribuições é '' ou "" são seguras (limpeza)
  if (/innerHTML\s*=\s*['"]'?\s*['"]?\s*;/.test(line)) continue;
  // Verificar padrões onde e.name / item.label / sel.file entram via concatenação
  if (/innerHTML\s*=\s*.*\be\.(name|label|rel|file)\b/.test(line) ||
      /innerHTML\s*=\s*.*\bsel\.(file|label)\b/.test(line) ||
      /innerHTML\s*=\s*.*\bpending[Ss]election\.(label|file)\b/.test(line)) {
    dangerousInnerHTMLLines.push({ line: i + 1, text: line.trim().slice(0, 120) });
  }
}

if (dangerousInnerHTMLLines.length > 0) {
  for (const { line, text } of dangerousInnerHTMLLines) {
    fail(`innerHTML com dado de usuário (linha ~${line}): ${text}`);
  }
} else {
  ok('nenhum innerHTML com dados não sanitizados detectado');
}

// ── 7. nonce não vaza em comentário / log ─────────────────────────────────────
const nonceInLog = rawScript.match(/console\.log[^;]*nonce/);
if (nonceInLog) warn('possível vazamento de nonce em console.log: ' + nonceInLog[0].slice(0, 80));
else ok('nonce não aparece em logs do script');

// ── Resultado ─────────────────────────────────────────────────────────────────
console.log('');
console.log(`${passed} passed, ${warned} warnings, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
