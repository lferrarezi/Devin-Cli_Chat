'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const EXT = 'devinCliChat';
const FALLBACK_MODELS = ['auto'];
let provider;
let statusBar;

function cfg() { return vscode.workspace.getConfiguration(EXT); }
function workspaceRoot() {
  return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
}
function workspaceName() {
  return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]
    ? vscode.workspace.workspaceFolders[0].name
    : 'sem pasta aberta';
}
function expandHome(value) {
  if (!value) return value;
  const s = String(value);
  if (s === '~') return os.homedir();
  if (s.startsWith('~/') || s.startsWith('~\\')) return path.join(os.homedir(), s.slice(2));
  return s;
}
function resolveMaybe(value) {
  const expanded = expandEnvPath(expandHome(value));
  if (!expanded) return expanded;
  return path.isAbsolute(expanded) ? expanded : path.join(workspaceRoot() || os.homedir(), expanded);
}
function exists(filePath) {
  try { return !!filePath && fs.existsSync(filePath); } catch (_) { return false; }
}
function htmlEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
function normalizeModel(value) {
  const s = String(value || '').trim();
  if (!s || s.toLowerCase() === 'default' || s.toLowerCase() === 'padrao' || s.toLowerCase() === 'padrão') return 'auto';
  return s;
}
function readJson(filePath) {
  try {
    if (!exists(filePath)) return undefined;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return undefined;
  }
}
function appDataConfigPath() {
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(base, 'devin', 'config.json');
  }
  return path.join(os.homedir(), '.config', 'devin', 'config.json');
}
function readCurrentModelFromDevinConfig() {
  const json = readJson(appDataConfigPath());
  return json && json.agent ? normalizeModel(json.agent.model) : undefined;
}
function configuredModel() {
  return normalizeModel(cfg().get('modeloAtual') || readCurrentModelFromDevinConfig() || 'auto');
}
function modelForCli() {
  const selected = normalizeModel(cfg().get('modeloAtual') || 'auto');
  return selected === 'auto' ? undefined : selected;
}
function currentAgent() { return String(cfg().get('agenteAtual') || 'auto'); }
function devinPath() { return String(cfg().get('caminhoDevin') || 'devin'); }
function defaultCwd() { return workspaceRoot() || os.homedir(); }

function findGitBash() {
  const candidates = [
    expandHome(cfg().get('gitBashPath')),
    process.env.GIT_BASH_PATH,
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Git', 'bin', 'bash.exe')
  ].filter(Boolean);
  return candidates.find(exists);
}
function terminalShell() {
  if (process.platform === 'win32' && cfg().get('usarGitBashNoWindows', true)) return findGitBash();
  return process.env.SHELL || undefined;
}
function baseArgs() {
  const out = [...(cfg().get('argumentosPadrao') || []).map(String).filter(Boolean)];
  const modelFlag = String(cfg().get('argumentoModelo') || '').trim();
  const selectedModel = modelForCli();
  if (modelFlag && selectedModel) out.push(modelFlag, selectedModel);
  return out;
}
function currentSkills() {
  const value = cfg().get('skillsAtuais') || [];
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
function fileSizeLabel(size) {
  const n = Number(size || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 102.4) / 10} KB`;
  return `${Math.round(n / 104857.6) / 10} MB`;
}
function safeRelative(filePath) {
  try {
    const root = workspaceRoot();
    if (root && filePath && path.isAbsolute(filePath)) {
      const rel = path.relative(root, filePath);
      if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) return rel.replace(/\\/g, '/');
    }
  } catch (_) {}
  return filePath || '';
}
function frontMatterValue(markdown, key) {
  const text = String(markdown || '');
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return '';
  const re = new RegExp('^' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*["\']?([^"\'\n]+)', 'mi');
  const found = match[1].match(re);
  return found ? found[1].trim() : '';
}
function readTextLimited(filePath, maxBytes) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return undefined;
    const limit = Math.max(1024, Number(maxBytes || 65536));
    const fd = fs.openSync(filePath, 'r');
    try {
      const size = Math.min(stat.size, limit);
      const buffer = Buffer.alloc(size);
      fs.readSync(fd, buffer, 0, size, 0);
      const truncated = stat.size > limit;
      const sample = buffer.slice(0, Math.min(buffer.length, 4096));
      for (const byte of sample) { if (byte === 0) return { binary: true, size: stat.size, content: '', truncated }; }
      return { binary: false, size: stat.size, content: buffer.toString('utf8'), truncated };
    } finally {
      fs.closeSync(fd);
    }
  } catch (_) {
    return undefined;
  }
}
function standardAgentDirs() {
  const dirs = [
    resolveMaybe(cfg().get('diretorioAgentesWorkspace') || '.devin/agents'),
    resolveMaybe('.agents/agents'),
    resolveMaybe('.claude/agents'),
    resolveMaybe(cfg().get('diretorioAgentesGlobal') || (process.platform === 'win32' ? '%APPDATA%\\devin\\agents' : '~/.config/devin/agents'))
  ];
  if (process.platform === 'win32') {
    const app = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    dirs.push(path.join(app, 'devin', 'agents'));
  }
  return Array.from(new Set(dirs.filter(Boolean).map(expandEnvPath)));
}
function standardSkillDirs() {
  const dirs = [
    resolveMaybe(cfg().get('diretorioSkillsWorkspace') || '.devin/skills'),
    resolveMaybe('.skills'),
    resolveMaybe('.agents/skills'),
    resolveMaybe('.claude/skills'),
    resolveMaybe(cfg().get('diretorioSkillsGlobal') || (process.platform === 'win32' ? '%APPDATA%\\devin\\skills' : '~/.config/devin/skills'))
  ];
  if (process.platform === 'win32') {
    const app = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    dirs.push(path.join(app, 'devin', 'skills'));
  }
  return Array.from(new Set(dirs.filter(Boolean).map(expandEnvPath)));
}
function expandEnvPath(value) {
  const s = expandHome(String(value || ''));
  return s.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
}
function collectMarkdownEntries(dirs, kind) {
  const out = [];
  const seen = new Set();
  const maxEntries = 120;
  function add(filePath, fallbackId, source) {
    try {
      if (!filePath || seen.has(filePath) || !fs.existsSync(filePath)) return;
      const stat = fs.statSync(filePath);
      if (!stat.isFile() || !filePath.toLowerCase().endsWith('.md')) return;
      const preview = readTextLimited(filePath, 32768);
      const content = preview && !preview.binary ? preview.content : '';
      const base = path.basename(filePath, '.md');
      const parent = path.basename(path.dirname(filePath));
      let id = fallbackId || (base.toUpperCase() === 'AGENT' || base.toUpperCase() === 'SKILL' ? parent : base);
      const fmName = frontMatterValue(content, 'name');
      if (fmName) id = fmName;
      id = String(id || base || parent).trim().replace(/\s+/g, '-');
      if (!id || seen.has(kind + ':' + id)) return;
      const description = frontMatterValue(content, 'description');
      seen.add(filePath);
      seen.add(kind + ':' + id);
      out.push({ id, label: id, description, filePath, source, kind });
    } catch (_) {}
  }
  function walk(dir, depth, source) {
    if (out.length >= maxEntries || depth < 0) return;
    let names;
    try { names = fs.readdirSync(dir); } catch (_) { return; }
    for (const name of names) {
      if (out.length >= maxEntries) break;
      if (name.startsWith('.') && name !== '.devin' && name !== '.claude') continue;
      const full = path.join(dir, name);
      let stat;
      try { stat = fs.statSync(full); } catch (_) { continue; }
      if (stat.isDirectory()) {
        const agentFile = path.join(full, 'AGENT.md');
        const skillFile = path.join(full, 'SKILL.md');
        if (kind === 'agent' && fs.existsSync(agentFile)) add(agentFile, name, source);
        else if (kind === 'skill' && fs.existsSync(skillFile)) add(skillFile, name, source);
        else walk(full, depth - 1, source);
      } else if (stat.isFile() && full.toLowerCase().endsWith('.md')) {
        if (kind === 'agent' && name.toUpperCase() === 'SKILL.MD') continue;
        if (kind === 'skill' && name.toUpperCase() === 'AGENT.MD') continue;
        add(full, undefined, source);
      }
    }
  }
  for (const dir of dirs) {
    try {
      if (!dir || !fs.existsSync(dir)) continue;
      walk(dir, 2, safeRelative(dir));
    } catch (_) {}
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
function scanAgentEntries() { return collectMarkdownEntries(standardAgentDirs(), 'agent'); }
function scanSkillEntries() { return collectMarkdownEntries(standardSkillDirs(), 'skill'); }
function scanAgents() { return Array.from(new Set(['auto', ...scanAgentEntries().map(x => x.id)])); }
function scanSkills() { return scanSkillEntries().map(x => x.id); }
function selectedEntryIdsFromPrompt(text, entries, prefix) {
  const prompt = String(text || '');
  const ids = new Set();
  for (const entry of entries) {
    const escaped = entry.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = prefix === '@'
      ? new RegExp('(^|[^\\w.-])@' + escaped + '(?=$|[^\\w.-])', 'i')
      : new RegExp('(^|[^\\w.-])#' + escaped + '(?=$|[^\\w.-])', 'i');
    if (pattern.test(prompt)) ids.add(entry.id);
  }
  return Array.from(ids);
}
function uniqueEntriesById(entries, ids) {
  const byId = new Map(entries.map(e => [e.id, e]));
  const out = [];
  const seen = new Set();
  for (const id of ids) {
    const e = byId.get(id);
    if (e && !seen.has(e.id)) { seen.add(e.id); out.push(e); }
  }
  return out;
}
function markdownEntriesBlock(title, entries) {
  if (!entries || !entries.length || cfg().get('incluirConteudoAgenteSkillNoPrompt', true) === false) return '';
  const max = Number(cfg().get('limiteBytesArquivoMd') || 65536);
  const blocks = [];
  for (const entry of entries) {
    const data = readTextLimited(entry.filePath, max);
    if (!data || data.binary) continue;
    blocks.push([
      `### ${entry.kind === 'agent' ? 'Agente' : 'Skill'}: ${entry.id}`,
      `Arquivo: ${safeRelative(entry.filePath)}`,
      data.truncated ? `Observacao: conteudo truncado em ${fileSizeLabel(max)}.` : '',
      '```md',
      data.content,
      '```'
    ].filter(Boolean).join('\n'));
  }
  return blocks.length ? [`## ${title}`, ...blocks].join('\n\n') : '';
}
function attachmentsBlock(attachments) {
  const list = Array.isArray(attachments) ? attachments : [];
  if (!list.length) return '';
  const blocks = list.map(file => [
    `### Arquivo anexado: ${file.relativePath || file.name}`,
    `Caminho: ${file.fsPath}`,
    `Tamanho: ${fileSizeLabel(file.size)}${file.truncated ? ' (conteudo truncado)' : ''}`,
    file.binary ? 'Conteudo: arquivo binario ou nao textual; use apenas o caminho acima.' : ['```', file.content || '', '```'].join('\n')
  ].join('\n'));
  return ['## Arquivos anexados', ...blocks].join('\n\n');
}
function fullPrompt(text, extra) {
  const prefix = cfg().get('prefixoPromptPadrao') || '';
  const selectedModel = modelForCli() || configuredModel() || 'auto';
  const selectedAgent = currentAgent();
  const selectedSkills = currentSkills();
  const context = [
    `Workspace VS Code: ${workspaceName()}`,
    workspaceRoot() ? `Diretorio raiz: ${workspaceRoot()}` : 'Diretorio raiz: nao ha pasta aberta',
    `Modelo selecionado: ${selectedModel}`,
    `Agente selecionado: ${selectedAgent}`,
    `Skills selecionadas: ${selectedSkills.length ? selectedSkills.join(', ') : 'nenhuma'}`
  ].join('\n');
  const agentEntries = scanAgentEntries();
  const skillEntries = scanSkillEntries();
  const agentIds = [selectedAgent !== 'auto' ? selectedAgent : '', ...selectedEntryIdsFromPrompt(text, agentEntries, '@')].filter(Boolean);
  const skillIds = [...selectedSkills, ...selectedEntryIdsFromPrompt(text, skillEntries, '#')].filter(Boolean);
  const loadedAgents = uniqueEntriesById(agentEntries, agentIds);
  const loadedSkills = uniqueEntriesById(skillEntries, skillIds);
  const agentHint = loadedAgents.length
    ? `Aplique as instrucoes dos AGENT.md carregados abaixo. Quando o prompt mencionar @nome, trate como chamada explicita daquele agente.`
    : (selectedAgent !== 'auto' ? `Use o perfil/subagente Devin chamado "${selectedAgent}" quando aplicavel.` : '');
  const skillHint = loadedSkills.length
    ? 'Aplique as skills Markdown carregadas abaixo como playbooks operacionais para esta resposta.'
    : '';
  return [
    prefix,
    context,
    agentHint,
    skillHint,
    markdownEntriesBlock('Agentes carregados', loadedAgents),
    markdownEntriesBlock('Skills carregadas', loadedSkills),
    attachmentsBlock(extra && extra.attachments),
    text
  ].filter(Boolean).join('\n\n');
}
function terminalCommand(text, extra) {
  const executable = shellQuote(devinPath());
  const args = baseArgs().map(shellQuote).join(' ');
  if (!text) return [executable, args].filter(Boolean).join(' ');
  return [executable, args, '--', shellQuote(fullPrompt(text, extra))].filter(Boolean).join(' ');
}
function openTerminal(text, extra) {
  const shellPath = terminalShell();
  const terminal = vscode.window.createTerminal({
    name: cfg().get('nomeTerminal') || 'Devin Cli Chat',
    cwd: defaultCwd(),
    shellPath,
    shellArgs: process.platform === 'win32' && shellPath ? ['--login', '-i'] : undefined
  });
  terminal.show(true);
  terminal.sendText(terminalCommand(text, extra));
}
function runIntegrated(text, extra) {
  return new Promise((resolve) => {
    const args = [...baseArgs(), '-p', '--', fullPrompt(text, extra)];
    let settled = false;
    function done(value) {
      if (settled) return;
      settled = true;
      resolve(value);
    }
    let child;
    try {
      child = cp.execFile(devinPath(), args, {
        cwd: defaultCwd(),
        timeout: Number(cfg().get('timeoutChatMs') || 300000),
        maxBuffer: 1024 * 1024 * 16,
        windowsHide: true
      }, (err, stdout, stderr) => {
        if (err && process.platform === 'win32') {
          runIntegratedViaBash(text, err, extra).then(done);
          return;
        }
        const parts = [];
        if (stdout && stdout.trim()) parts.push(stdout.trim());
        if (stderr && stderr.trim()) parts.push(`STDERR:\n${stderr.trim()}`);
        if (err) parts.push(`Falha ao executar Devin CLI: ${err.message}`);
        done(parts.join('\n\n') || 'Sem saida do Devin CLI.');
      });
      child.on('error', (err) => {
        if (process.platform === 'win32') runIntegratedViaBash(text, err, extra).then(done);
        else done(`Falha ao iniciar Devin CLI: ${err.message}\n\nValide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`);
      });
    } catch (err) {
      if (process.platform === 'win32') runIntegratedViaBash(text, err, extra).then(done);
      else done(`Falha ao iniciar Devin CLI: ${err.message}\n\nValide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`);
    }
  });
}
function runIntegratedViaBash(text, firstError, extra) {
  return new Promise((resolve) => {
    const bash = findGitBash();
    if (!bash) {
      resolve(`Falha ao executar Devin CLI: ${firstError.message}\n\nGit Bash nao foi encontrado. Configure devinCliChat.gitBashPath ou ajuste devinCliChat.caminhoDevin.`);
      return;
    }
    const args = baseArgs().map(shellQuote).join(' ');
    const command = `${shellQuote(devinPath())} ${args} -p -- ${shellQuote(fullPrompt(text, extra))}`;
    cp.exec(command, {
      cwd: defaultCwd(),
      shell: bash,
      timeout: Number(cfg().get('timeoutChatMs') || 300000),
      maxBuffer: 1024 * 1024 * 16
    }, (err, stdout, stderr) => {
      const parts = [];
      if (stdout && stdout.trim()) parts.push(stdout.trim());
      if (stderr && stderr.trim()) parts.push(`STDERR:\n${stderr.trim()}`);
      if (err) parts.push(`Falha ao executar Devin CLI via Git Bash: ${err.message}`);
      resolve(parts.join('\n\n') || 'Sem saida do Devin CLI.');
    });
  });
}

async function setConfig(key, value) {
  await cfg().update(key, value, vscode.ConfigurationTarget.Workspace);
  updateStatusBar();
  if (provider) provider.refreshMeta();
}
function manualModels() {
  const list = cfg().get('modelosDisponiveis') || [];
  return Array.isArray(list) ? list.map(String).map(s => s.trim()).filter(Boolean) : [];
}
function cacheModelFiles() {
  const custom = cfg().get('arquivosCacheModelos') || [];
  const files = Array.isArray(custom) ? custom.map(resolveMaybe).filter(Boolean) : [];
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    files.push(path.join(local, 'Devin', 'CLI', 'team_settings.bin'));
    files.push(path.join(local, 'Devin', 'CLI', 'model_configs.bin'));
  } else {
    files.push(path.join(os.homedir(), '.local', 'share', 'Devin', 'CLI', 'team_settings.bin'));
    files.push(path.join(os.homedir(), '.local', 'share', 'Devin', 'CLI', 'model_configs.bin'));
  }
  return Array.from(new Set(files));
}
function looksLikeModel(value) {
  const s = String(value || '').trim();
  if (s.length < 2 || s.length > 80) return false;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(s)) return false;
  if (/^(true|false|null|undefined|model|models|name|display|enabled|disabled|token|config|settings)$/i.test(s)) return false;
  if (s === 'auto') return true;
  if (/(claude|sonnet|opus|haiku|gpt|codex|gemini|swe|kimi|glm|adaptive|thinking|flash|pro|mini|low|medium|high|fast)/i.test(s)) return true;
  return /\d/.test(s) && s.includes('-');
}
function readModelsFromCaches() {
  const limit = Number(cfg().get('limiteBytesCacheModelos') || 5242880);
  const out = [];
  for (const file of cacheModelFiles()) {
    try {
      if (!exists(file)) continue;
      const stat = fs.statSync(file);
      if (!stat.isFile() || stat.size > limit) continue;
      const buffer = fs.readFileSync(file);
      const text = buffer.toString('utf8');
      const matches = text.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g) || [];
      for (const value of matches) {
        if (looksLikeModel(value)) out.push(value);
      }
    } catch (_) {}
  }
  return Array.from(new Set(out));
}
function modelsForUi() {
  const current = configuredModel();
  const values = ['auto', current, readCurrentModelFromDevinConfig(), ...manualModels(), ...readModelsFromCaches()]
    .map(normalizeModel)
    .filter(Boolean);
  return Array.from(new Set(values));
}
function scanAgents() {
  const dirs = [
    resolveMaybe(cfg().get('diretorioAgentesWorkspace') || '.devin/agents'),
    resolveMaybe(cfg().get('diretorioAgentesGlobal') || '~/.config/devin/agents')
  ];
  const out = ['auto'];
  for (const dir of dirs) {
    try {
      if (!dir || !fs.existsSync(dir)) continue;
      for (const name of fs.readdirSync(dir)) {
        const agentFile = path.join(dir, name, 'AGENT.md');
        if (fs.existsSync(agentFile)) out.push(name);
      }
    } catch (_) {}
  }
  return Array.from(new Set(out));
}
function activeContext() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return 'Nenhum editor ativo.';
  const doc = editor.document;
  const text = editor.selection && !editor.selection.isEmpty ? doc.getText(editor.selection) : doc.getText();
  return [`Arquivo: ${doc.uri.fsPath}`, 'Conteudo:', '```', text.slice(0, 60000), '```'].join('\n');
}
function gitDiff() {
  try {
    return cp.execFileSync('git', ['diff', '--no-ext-diff'], {
      cwd: defaultCwd(),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 8,
      windowsHide: true
    });
  } catch (err) {
    return `Nao foi possivel obter git diff: ${err.message}`;
  }
}
function updateStatusBar() {
  if (!statusBar) {
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
    statusBar.command = 'devinCliChat.abrirPainel';
    statusBar.show();
  }
  statusBar.text = `Devin: ${configuredModel()} / ${currentAgent()}`;
  statusBar.tooltip = `Workspace: ${workspaceName()}`;
}
async function pickManualModel() {
  const value = await vscode.window.showInputBox({
    title: 'Modelo Devin',
    prompt: 'Informe exatamente o nome do modelo aceito pelo Devin CLI.',
    value: configuredModel() === 'auto' ? '' : configuredModel()
  });
  if (value && value.trim()) await setConfig('modeloAtual', value.trim());
}
async function pickModel() {
  const pick = await vscode.window.showQuickPick([...modelsForUi(), '+ Informar modelo manual'], {
    placeHolder: 'Selecione o modelo Devin'
  });
  if (!pick) return;
  if (pick.startsWith('+')) return pickManualModel();
  await setConfig('modeloAtual', pick);
}

async function pickSkills() {
  const entries = scanSkillEntries();
  if (!entries.length) {
    vscode.window.showInformationMessage('Nenhuma skill Markdown encontrada. Use .devin/skills, .skills ou configure devinCliChat.diretorioSkillsWorkspace.');
    return;
  }
  const selected = new Set(currentSkills());
  const items = entries.map(entry => ({
    label: entry.id,
    description: safeRelative(entry.filePath),
    detail: entry.description || 'Skill Markdown',
    picked: selected.has(entry.id)
  }));
  const picks = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: 'Selecione uma ou mais skills Markdown para aplicar no prompt'
  });
  if (!picks) return;
  await setConfig('skillsAtuais', picks.map(item => item.label));
}

class ChatViewProvider {
  constructor(context) {
    this.context = context;
    this.view = undefined;
    this.busy = false;
    this.attachments = [];
  }

  attachmentSummaries() {
    return this.attachments.map(file => ({ id: file.id, name: file.name, relativePath: file.relativePath, size: file.size, truncated: !!file.truncated, binary: !!file.binary }));
  }

  async attachFiles() {
    const root = workspaceRoot();
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: true,
      defaultUri: root ? vscode.Uri.file(root) : undefined,
      title: 'Anexar arquivos ao Devin Cli Chat'
    });
    if (!uris || !uris.length) return;
    const maxFiles = Math.max(1, Number(cfg().get('maximoAnexos') || 10));
    const maxBytes = Math.max(1024, Number(cfg().get('limiteBytesAnexo') || 524288));
    const current = new Map(this.attachments.map(file => [file.fsPath, file]));
    for (const uri of uris) {
      if (this.attachments.length >= maxFiles) break;
      if (!uri || uri.scheme && uri.scheme !== 'file') continue;
      const fsPath = uri.fsPath;
      if (current.has(fsPath)) continue;
      const data = readTextLimited(fsPath, maxBytes);
      if (!data) continue;
      const statSize = data.size || 0;
      const item = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        fsPath,
        name: path.basename(fsPath),
        relativePath: safeRelative(fsPath),
        size: statSize,
        content: data.content || '',
        truncated: !!data.truncated,
        binary: !!data.binary
      };
      this.attachments.push(item);
      current.set(fsPath, item);
    }
    this.refreshMeta();
    this.post({ type: 'action', ok: true, text: `${this.attachments.length} anexo(s) carregado(s).` });
  }

  removeAttachment(id) {
    this.attachments = this.attachments.filter(file => file.id !== id);
    this.refreshMeta();
  }

  clearAttachments() {
    this.attachments = [];
    this.refreshMeta();
  }

  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };
    view.webview.html = this.html(view.webview);

    view.webview.onDidReceiveMessage(async (message) => {
      try {
        const type = message && message.type;
        if (type === 'ready') {
          this.refreshMeta();
          return;
        }
        if (type === 'send') {
          await this.send(message.text || '', { echoUser: message.echo !== false });
          return;
        }
        if (type === 'terminal') {
          openTerminal(message.text || '', { attachments: this.attachments });
          this.post({ type: 'action', ok: true, text: 'Terminal aberto.' });
          return;
        }
        if (type === 'newChat') {
          this.clearAttachments();
          this.post({ type: 'action', ok: true, text: 'Nova conversa iniciada.' });
          return;
        }
        if (type === 'attachFiles') {
          await this.attachFiles();
          return;
        }
        if (type === 'removeAttachment') {
          this.removeAttachment(message.id || '');
          return;
        }
        if (type === 'clearAttachments') {
          this.clearAttachments();
          this.post({ type: 'action', ok: true, text: 'Anexos removidos.' });
          return;
        }
        if (type === 'selectSkills') {
          await pickSkills();
          return;
        }
        if (type === 'setModel') {
          await setConfig('modeloAtual', message.value || 'auto');
          return;
        }
        if (type === 'manualModel') {
          await pickManualModel();
          return;
        }
        if (type === 'refreshModels') {
          this.refreshMeta();
          this.post({ type: 'action', ok: true, text: 'Modelos atualizados a partir dos arquivos locais.' });
          return;
        }
        if (type === 'setAgent') {
          await setConfig('agenteAtual', message.value || 'auto');
          return;
        }
        if (type === 'review') {
          await this.send('Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n' + gitDiff() + '\n```', { echoUser: true });
          return;
        }
        if (type === 'selection') {
          await this.send('Analise o contexto do editor atual.\n\n' + activeContext(), { echoUser: true });
          return;
        }
        if (type === 'insertSelection') {
          this.post({ type: 'insertPrompt', text: 'Analise o contexto do editor atual.\n\n' + activeContext() });
          return;
        }
        this.post({ type: 'action', ok: false, text: `Acao desconhecida: ${type}` });
      } catch (err) {
        this.busy = false;
        this.post({ type: 'busy', value: false });
        this.post({ type: 'message', role: 'assistant', text: 'Falha ao executar acao do painel: ' + (err && err.message ? err.message : String(err)) });
      }
    });

    setTimeout(() => this.refreshMeta(), 50);
  }

  post(message) {
    try {
      if (this.view) this.view.webview.postMessage(message);
    } catch (_) {}
  }

  refreshMeta() {
    const payload = {
      type: 'meta',
      models: FALLBACK_MODELS,
      model: configuredModel(),
      agents: ['auto'],
      agent: currentAgent(),
      skills: [],
      selectedSkills: currentSkills(),
      attachments: this.attachmentSummaries(),
      workspace: workspaceName(),
      mode: cfg().get('modoExecucaoChat') || 'resposta-integrada',
      modelStatus: 'modelo: auto'
    };
    try { payload.models = modelsForUi(); } catch (_) { payload.models = FALLBACK_MODELS; }
    try { payload.agents = scanAgents(); } catch (_) { payload.agents = ['auto']; }
    try { payload.skills = scanSkills(); } catch (_) { payload.skills = []; }
    try { payload.selectedSkills = currentSkills(); } catch (_) { payload.selectedSkills = []; }
    payload.attachments = this.attachmentSummaries();
    try { payload.modelStatus = payload.models.length > 1 ? `${payload.models.length} modelos locais` : 'usando modelo auto'; } catch (_) {}
    this.post(payload);
  }

  async send(text, options) {
    const prompt = String(text || '').trim();
    if (!prompt) return;
    if (this.busy) {
      this.post({ type: 'message', role: 'assistant', text: 'Ja existe uma execucao em andamento. Aguarde a conclusao antes de enviar outro prompt.' });
      return;
    }

    this.busy = true;
    if (!options || options.echoUser !== false) this.post({ type: 'message', role: 'user', text: prompt });
    this.post({ type: 'busy', value: true });
    this.post({ type: 'action', ok: true, text: 'Enviando para o Devin CLI...' });

    try {
      const mode = cfg().get('modoExecucaoChat') || 'resposta-integrada';
      const extra = { attachments: this.attachments.slice() };
      if (mode === 'terminal') {
        openTerminal(prompt, extra);
        this.post({ type: 'message', role: 'assistant', text: 'Sessao aberta no terminal integrado, ja posicionada na pasta aberta no VS Code, com os anexos no prompt.' });
        return;
      }
      const answer = await runIntegrated(prompt, extra);
      this.post({ type: 'message', role: 'assistant', text: answer });
    } catch (err) {
      this.post({ type: 'message', role: 'assistant', text: 'Falha ao enviar para o Devin CLI: ' + (err && err.message ? err.message : String(err)) });
    } finally {
      this.busy = false;
      this.post({ type: 'busy', value: false });
      this.refreshMeta();
    }
  }

  html(webview) {
    const nonce = Date.now().toString(36);
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
:root{
  --bg:var(--vscode-sideBar-background);
  --fg:var(--vscode-foreground);
  --muted:var(--vscode-descriptionForeground);
  --border:var(--vscode-panel-border);
  --input:var(--vscode-input-background);
  --input-fg:var(--vscode-input-foreground);
  --focus:var(--vscode-focusBorder);
  --accent:var(--vscode-button-background);
  --accent-fg:var(--vscode-button-foreground);
  --secondary:var(--vscode-button-secondaryBackground);
  --secondary-fg:var(--vscode-button-secondaryForeground);
  --editor:var(--vscode-editor-background);
  --hover:var(--vscode-list-hoverBackground);
  --active:var(--vscode-list-activeSelectionBackground);
  --active-fg:var(--vscode-list-activeSelectionForeground);
  --code:var(--vscode-textCodeBlock-background);
}
*{box-sizing:border-box}
html,body{width:100%;height:100%;padding:0;margin:0;overflow:hidden;background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size)}
button,select,textarea{font:inherit;color:inherit}
.app{height:100vh;display:flex;flex-direction:column;background:var(--bg)}
.header{height:38px;min-height:38px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;padding:0 10px;background:var(--bg)}
.product{display:flex;align-items:center;gap:8px;min-width:0;font-weight:600;font-size:12px;letter-spacing:.01em;text-transform:uppercase;color:var(--muted)}
.logo{width:18px;height:18px;border-radius:999px;background:var(--accent);color:var(--accent-fg);display:grid;place-items:center;font-size:10px;font-weight:700;flex:0 0 auto}.headerSpacer{flex:1}.iconBtn{border:0;background:transparent;color:var(--muted);width:26px;height:26px;border-radius:6px;display:grid;place-items:center;cursor:pointer}.iconBtn:hover{background:var(--hover);color:var(--fg)}.iconBtn.primary{background:var(--accent);color:var(--accent-fg)}
.thread{flex:1;overflow:auto;padding:14px 14px 10px 14px;scrollbar-gutter:stable;display:flex;flex-direction:column;gap:16px;background:var(--editor)}
.contextStrip{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 2px 0;color:var(--muted);font-size:11px}.ctxPill{border:1px solid var(--border);background:var(--bg);border-radius:999px;padding:3px 8px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ctxPill strong{font-weight:600;color:var(--fg)}
.welcome{margin:auto 0;display:grid;gap:12px;padding:8px 0 18px 0}.welcomeRow{display:flex;align-items:center;gap:10px}.welcomeTitle{font-size:18px;line-height:1.25;font-weight:600}.welcomeText{color:var(--muted);line-height:1.45;max-width:560px}.starterGrid{display:grid;gap:8px;grid-template-columns:1fr}.starter{border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:10px;text-align:left;padding:10px;cursor:pointer}.starter:hover{background:var(--hover);border-color:var(--focus)}.starter b{display:block;margin-bottom:3px}.starter span{display:block;color:var(--muted);font-size:11px;line-height:1.35}
.msgRow{display:flex;gap:10px;align-items:flex-start}.msgRow.user{justify-content:flex-end}.avatar{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:var(--accent);color:var(--accent-fg);font-size:11px;font-weight:700;flex:0 0 auto;margin-top:2px}.msg{max-width:92%;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}.msg.assistant{width:100%;padding:0 2px}.msg.user{background:var(--input);border:1px solid var(--border);border-radius:16px;padding:9px 12px;max-width:82%;box-shadow:0 1px 0 rgba(0,0,0,.08)}.msgMeta{font-size:11px;color:var(--muted);margin-bottom:4px}.msg pre{background:var(--code);border:1px solid var(--border);border-radius:8px;padding:10px;overflow:auto;white-space:pre-wrap}.msg code{font-family:var(--vscode-editor-font-family);font-size:var(--vscode-editor-font-size)}
.composerWrap{border-top:1px solid var(--border);background:var(--bg);padding:10px 10px 9px 10px}.contextShelf{display:none;gap:6px;flex-wrap:wrap;margin:0 0 7px 0}.contextShelf.hasItems{display:flex}.shelfChip{border:1px solid var(--border);background:var(--bg);border-radius:999px;padding:3px 7px;font-size:10px;color:var(--muted);display:flex;align-items:center;gap:5px;max-width:100%}.shelfChip b{color:var(--fg);font-weight:600;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shelfChip button{border:0;background:transparent;color:var(--muted);cursor:pointer;padding:0 1px}.shelfChip button:hover{color:var(--fg)}.composer{border:1px solid var(--border);background:var(--input);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.02)}.composer:focus-within{border-color:var(--focus)}.inputLine{display:flex;align-items:flex-start;gap:8px;padding:8px 8px 0 8px}.mention{height:24px;border-radius:6px;background:var(--active);color:var(--active-fg);padding:3px 6px;font-size:12px;white-space:nowrap;flex:0 0 auto}textarea{width:100%;min-height:62px;max-height:200px;resize:none;background:transparent;color:var(--input-fg);border:0;outline:0;padding:3px 0 8px 0;line-height:1.4}.composerBar{display:flex;align-items:center;gap:6px;padding:6px 8px 8px 8px;border-top:1px solid var(--border)}.chip,.selectChip{height:26px;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:999px;padding:0 8px;display:flex;align-items:center;gap:5px;font-size:11px;white-space:nowrap;max-width:100%;min-width:0}.selectChip{appearance:none;cursor:pointer;padding-right:20px}.chip.small{padding:0 7px;color:var(--muted)}.barSpacer{flex:1;min-width:8px}.sendBtn{width:28px;height:28px;border-radius:8px;border:0;background:var(--accent);color:var(--accent-fg);cursor:pointer;display:grid;place-items:center;font-weight:700}.sendBtn:disabled{opacity:.5;cursor:not-allowed}.statusLine{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:10px;margin-top:6px;padding:0 2px}.statusLine span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.busyDot{display:none;width:7px;height:7px;border-radius:999px;background:var(--accent);animation:pulse 1s infinite}.is-busy .busyDot{display:block}.is-busy .sendBtn{opacity:.55}@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
@media (max-width:380px){.chip.local,.chip.approvals{display:none}.msg{max-width:100%}.msg.user{max-width:88%}.composerBar{gap:4px}.selectChip{max-width:112px}.productText{display:none}}
</style></head><body><div class="app"><header class="header"><div class="product"><div class="logo">D</div><span class="productText">Devin Cli Chat</span></div><div class="headerSpacer"></div><button type="button" class="iconBtn" data-action="newChat" title="Nova conversa">+</button><button type="button" class="iconBtn" data-action="refreshModels" title="Atualizar modelos">R</button><button type="button" class="iconBtn" data-action="terminal" title="Abrir sessao no terminal">⌁</button></header><main class="thread" id="thread"><div class="contextStrip" id="contextStrip"><span class="ctxPill">Workspace: <strong id="ctxWorkspace">${htmlEscape(workspaceName())}</strong></span><span class="ctxPill">Modelo: <strong id="ctxModel">${htmlEscape(configuredModel())}</strong></span><span class="ctxPill">Agente: <strong id="ctxAgent">${htmlEscape(currentAgent())}</strong></span></div><section class="welcome" id="welcome"><div class="welcomeRow"><div class="avatar">D</div><div><div class="welcomeTitle">Como posso ajudar neste workspace?</div><div class="welcomeText">Use o Devin CLI com contexto da pasta aberta no VS Code. Selecione modelo e agente no composer, como em uma tela de chat agentic.</div></div></div><div class="starterGrid"><button type="button" class="starter" data-action="review"><b>Revisar diff</b><span>Analisa alteracoes locais com foco produtivo.</span></button><button type="button" class="starter" data-action="starter" data-prompt="Planeje a implementacao da proxima tarefa em etapas pequenas, com riscos, testes e estrategia de rollback."><b>Planejar tarefa</b><span>Gera um plano objetivo antes de alterar codigo.</span></button><button type="button" class="starter" data-action="selection"><b>Explicar contexto</b><span>Usa arquivo aberto ou selecao atual.</span></button></div></section></main><footer class="composerWrap"><div class="contextShelf" id="contextShelf"></div><div class="composer"><div class="inputLine"><span class="mention">@devin</span><textarea id="prompt" placeholder="Use Devin CLI com o workspace atual, modelo, agente, skills e anexos..."></textarea></div><div class="composerBar"><button type="button" class="iconBtn" data-action="insertSelection" title="Adicionar contexto do editor">＋</button><button type="button" class="iconBtn" data-action="attachFiles" title="Anexar arquivos">📎</button><button type="button" class="chip small" data-action="selectSkills" title="Selecionar skills Markdown">Skills</button><span class="chip local" title="Execucao local no workspace aberto">▣ Local</span><span class="chip approvals" title="Aprovacoes padrao do Devin CLI">◇ Aprovacoes Padrao</span><select class="selectChip" id="agent" title="Agente Devin"><option value="auto">Auto</option></select><select class="selectChip" id="model" title="Modelo Devin"><option value="auto">Auto</option></select><button type="button" class="iconBtn" data-action="manualModel" title="Informar modelo manual">⚙</button><div class="barSpacer"></div><button type="button" class="sendBtn" id="send" data-action="send" title="Enviar">↑</button></div></div><div class="statusLine"><span class="busyDot"></span><span id="mode">integrado</span><span>·</span><span id="modelStatus">pronto</span></div></footer></div><script nonce="${nonce}">
(function(){
  'use strict';
  var vscode = acquireVsCodeApi();
  var busy = false;

  function byId(id){ return document.getElementById(id); }
  function text(value){ return String(value == null ? '' : value); }
  function setStatus(value){ var el = byId('modelStatus'); if(el) el.textContent = text(value); }
  function post(message){ vscode.postMessage(message); }
  function setBusy(value){
    busy = !!value;
    document.body.classList.toggle('is-busy', busy);
    var send = byId('send');
    if(send) send.disabled = busy;
  }
  function setPrompt(value){ var el = byId('prompt'); if(el){ el.value = text(value); if(typeof el.focus === 'function') el.focus(); } }
  function getPrompt(){ var el = byId('prompt'); return el ? el.value : ''; }
  function appendPrompt(value){
    var incoming = text(value).trim();
    if(!incoming) return;
    var current = getPrompt().trim();
    setPrompt(current ? current + '\\n\\n' + incoming : incoming);
  }
  function hideWelcome(){
    var welcome = byId('welcome');
    if(welcome) welcome.style.display = 'none';
  }
  function clearMessages(){
    var thread = byId('thread');
    if(thread){
      var rows = Array.prototype.slice.call(thread.querySelectorAll('.msgRow'));
      rows.forEach(function(row){ row.parentNode.removeChild(row); });
    }
    var welcome = byId('welcome');
    if(welcome) welcome.style.display = 'grid';
    setBusy(false);
    setStatus('pronto');
    setPrompt('');
  }
  function addMessage(role, value){
    hideWelcome();
    var thread = byId('thread');
    if(!thread) return;
    var row = document.createElement('div');
    row.className = 'msgRow ' + (role === 'user' ? 'user' : 'assistant');
    if(role !== 'user'){
      var avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = 'D';
      row.appendChild(avatar);
    }
    var msg = document.createElement('div');
    msg.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
    if(role !== 'user'){
      var meta = document.createElement('div');
      meta.className = 'msgMeta';
      meta.textContent = 'Devin Cli Chat';
      msg.appendChild(meta);
    }
    renderContent(msg, text(value));
    row.appendChild(msg);
    thread.appendChild(row);
    thread.scrollTop = thread.scrollHeight;
  }
  function renderContent(el, value){
    var fence = String.fromCharCode(96,96,96);
    var parts = value.split(fence);
    if(parts.length === 1){
      el.appendChild(document.createTextNode(value));
      return;
    }
    for(var i=0;i<parts.length;i++){
      if(i % 2 === 0){
        el.appendChild(document.createTextNode(parts[i]));
      }else{
        var pre = document.createElement('pre');
        var code = document.createElement('code');
        code.textContent = parts[i].replace(/^\\w+\\n/, '');
        pre.appendChild(code);
        el.appendChild(pre);
      }
    }
  }
  function fillSelect(id, items, selected){
    var sel = byId(id);
    if(!sel) return;
    var chosen = selected || sel.value || 'auto';
    var seen = {};
    var list = Array.isArray(items) ? items.slice() : [];
    if(list.indexOf(chosen) < 0) list.unshift(chosen);
    if(list.indexOf('auto') < 0) list.unshift('auto');
    sel.innerHTML = '';
    list.forEach(function(item){
      var value = text(item).trim();
      if(!value || seen[value]) return;
      seen[value] = true;
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value === 'auto' ? 'Auto' : value;
      if(value === chosen) option.selected = true;
      sel.appendChild(option);
    });
  }

  function renderShelf(attachments, skills){
    var shelf = byId('contextShelf');
    if(!shelf) return;
    shelf.innerHTML = '';
    var hasItems = false;
    (Array.isArray(attachments) ? attachments : []).forEach(function(file){
      hasItems = true;
      var chip = document.createElement('span');
      chip.className = 'shelfChip';
      var label = document.createElement('b');
      label.textContent = file.relativePath || file.name || 'arquivo';
      var meta = document.createElement('span');
      meta.textContent = file.truncated ? 'anexo truncado' : 'anexo';
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.title = 'Remover anexo';
      remove.textContent = '×';
      remove.setAttribute('data-remove-attachment', file.id || '');
      chip.appendChild(label); chip.appendChild(meta); chip.appendChild(remove); shelf.appendChild(chip);
    });
    (Array.isArray(skills) ? skills : []).forEach(function(skill){
      hasItems = true;
      var chip = document.createElement('span');
      chip.className = 'shelfChip';
      var label = document.createElement('b');
      label.textContent = '#' + skill;
      var meta = document.createElement('span');
      meta.textContent = 'skill';
      chip.appendChild(label); chip.appendChild(meta); shelf.appendChild(chip);
    });
    shelf.classList.toggle('hasItems', hasItems);
  }
  function sendPrompt(value){
    var prompt = text(value).trim();
    if(!prompt){ setStatus('Digite uma mensagem para enviar ao Devin CLI.'); return; }
    if(busy){ setStatus('Aguarde a resposta atual antes de enviar outra mensagem.'); return; }
    addMessage('user', prompt);
    setPrompt('');
    setBusy(true);
    setStatus('Enviando para o Devin CLI...');
    post({ type: 'send', text: prompt, echo: false });
  }
  function action(name, element){
    if(name === 'send') return sendPrompt(getPrompt());
    if(name === 'newChat'){ clearMessages(); return post({ type: 'newChat' }); }
    if(name === 'terminal') return post({ type: 'terminal', text: getPrompt() });
    if(name === 'attachFiles'){ setStatus('Selecionando arquivos...'); return post({ type: 'attachFiles' }); }
    if(name === 'selectSkills'){ setStatus('Selecionando skills...'); return post({ type: 'selectSkills' }); }
    if(name === 'manualModel') return post({ type: 'manualModel' });
    if(name === 'refreshModels'){ setStatus('Atualizando modelos locais...'); return post({ type: 'refreshModels' }); }
    if(name === 'insertSelection') return post({ type: 'insertSelection' });
    if(name === 'review'){ setBusy(true); setStatus('Preparando revisao do diff...'); return post({ type: 'review' }); }
    if(name === 'selection'){ setBusy(true); setStatus('Lendo contexto do editor...'); return post({ type: 'selection' }); }
    if(name === 'starter') return sendPrompt(element.getAttribute('data-prompt') || '');
  }

  document.addEventListener('click', function(event){
    var remove = event.target && event.target.closest ? event.target.closest('[data-remove-attachment]') : null;
    if(remove){
      event.preventDefault();
      post({ type: 'removeAttachment', id: remove.getAttribute('data-remove-attachment') || '' });
      return;
    }
    var button = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
    if(!button) return;
    event.preventDefault();
    try { action(button.getAttribute('data-action'), button); }
    catch(err){ setStatus('Falha no clique: ' + (err && err.message ? err.message : String(err))); }
  });

  var promptEl = byId('prompt');
  if(promptEl){
    promptEl.addEventListener('keydown', function(event){
      if(event.key === 'Enter' && !event.shiftKey){
        event.preventDefault();
        sendPrompt(getPrompt());
      }
    });
  }
  var modelEl = byId('model');
  if(modelEl){
    modelEl.addEventListener('change', function(event){
      setStatus('Modelo selecionado: ' + event.target.value);
      post({ type: 'setModel', value: event.target.value });
    });
  }
  var agentEl = byId('agent');
  if(agentEl){
    agentEl.addEventListener('change', function(event){
      setStatus('Agente selecionado: ' + event.target.value);
      post({ type: 'setAgent', value: event.target.value });
    });
  }

  window.addEventListener('message', function(event){
    var message = event.data || {};
    if(message.type === 'meta'){
      fillSelect('model', message.models || ['auto'], message.model || 'auto');
      fillSelect('agent', message.agents || ['auto'], message.agent || 'auto');
      renderShelf(message.attachments || [], message.selectedSkills || []);
      var w = byId('ctxWorkspace');
      var m = byId('ctxModel');
      var a = byId('ctxAgent');
      var mode = byId('mode');
      if(w) w.textContent = message.workspace || 'sem workspace';
      if(m) m.textContent = message.model || 'auto';
      if(a) a.textContent = message.agent || 'auto';
      if(mode) mode.textContent = message.mode === 'terminal' ? 'terminal' : 'integrado';
      setStatus(message.modelStatus || 'pronto');
    }
    if(message.type === 'message') addMessage(message.role || 'assistant', message.text || '');
    if(message.type === 'busy') setBusy(!!message.value);
    if(message.type === 'insertPrompt') appendPrompt(message.text || '');
    if(message.type === 'action') setStatus(message.text || (message.ok ? 'ok' : 'falha'));
  });

  window.addEventListener('error', function(event){
    setStatus('Erro no painel: ' + (event.message || 'erro desconhecido'));
  });
  window.addEventListener('unhandledrejection', function(event){
    setStatus('Erro no painel: ' + (event.reason && event.reason.message ? event.reason.message : String(event.reason || 'promise rejeitada')));
  });

  setBusy(false);
  setStatus('pronto');
  post({ type: 'ready' });
})();
</script></body></html>`;
  }
}

async function activate(context) {
  provider = new ChatViewProvider(context);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('devinCliChat.chatView', provider, { webviewOptions: { retainContextWhenHidden: true } }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.abrirPainel', async () => vscode.commands.executeCommand('workbench.view.extension.devinCliChat')));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.novaSessao', () => openTerminal('')));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.revisarDiff', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.devinCliChat');
    if (provider) await provider.send('Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n' + gitDiff() + '\n```');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.enviarSelecao', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.devinCliChat');
    if (provider) await provider.send('Analise o contexto do editor atual.\n\n' + activeContext());
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarModelo', pickModel));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.definirModeloManual', pickManualModel));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.atualizarModelos', () => {
    if (provider) provider.refreshMeta();
    vscode.window.showInformationMessage('Modelos atualizados a partir dos arquivos locais.');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarAgente', async () => {
    const pick = await vscode.window.showQuickPick(scanAgents(), { placeHolder: 'Selecione o agente Devin' });
    if (pick) await setConfig('agenteAtual', pick);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarSkills', pickSkills));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.anexarArquivos', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.devinCliChat');
    if (provider) await provider.attachFiles();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.limparAnexos', async () => {
    if (provider) provider.clearAttachments();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.verificarCli', () => {
    cp.execFile(devinPath(), ['--version'], { cwd: defaultCwd(), windowsHide: true }, (err, stdout, stderr) => {
      vscode.window.showInformationMessage(err ? `Falha ao verificar Devin CLI: ${err.message}` : `Devin CLI encontrado: ${(stdout || stderr || 'ok').trim()}`);
    });
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(EXT)) {
      updateStatusBar();
      if (provider) provider.refreshMeta();
    }
  }));
  updateStatusBar();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
  _internal: {
    baseArgs,
    fullPrompt,
    runIntegrated,
    modelsForUi,
    scanAgents,
    scanSkills,
    scanAgentEntries,
    scanSkillEntries,
    readTextLimited
  }
};
