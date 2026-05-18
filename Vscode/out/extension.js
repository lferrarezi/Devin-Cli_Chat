// @ts-nocheck
'use strict';
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const EXT = 'devinCliChat';
const VALID_MODELS = ['auto', 'sonnet', 'opus', 'swe', 'gpt'];
const FALLBACK_MODELS = ['auto', 'adaptive', 'sonnet', 'opus', 'swe', 'gpt', 'codex'];
const HISTORY_KEY = 'devinCliChat.chatHistory.v1';
const MAX_HISTORY = 50;
const MAX_ATTACHMENT_BYTES = 1024 * 1024;
const MAX_FOLDER_FILES = 50;
const ATTACH_SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.venv', '__pycache__', '.next', '.nuxt', '.cache', 'target', '.idea']);
let provider;
let statusBar;
let extContext;
let outputChannel;
let activeChild;
let cancelRequested = false;
let modelCache = { at: 0, values: undefined };
let agentsCache = { at: 0, values: undefined };
let skillsCache = { at: 0, values: undefined };
function log(msg) {
    const ts = new Date().toISOString();
    if (outputChannel)
        outputChannel.appendLine(`[${ts}] ${msg}`);
}
function metadataCacheMs() { return 10000; }
function modelCacheMs() { return Math.max(0, Number(cfg().get('cacheModelosMs') || 1800000)); }
function invalidateMetaCache() {
    modelCache = { at: 0, values: undefined };
    agentsCache = { at: 0, values: undefined };
    skillsCache = { at: 0, values: undefined };
}
function isSafeModelId(value) {
    return /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$/.test(String(value || '').trim());
}
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
    if (!value)
        return value;
    const s = String(value);
    if (s === '~')
        return os.homedir();
    if (s.startsWith('~/') || s.startsWith('~\\'))
        return path.join(os.homedir(), s.slice(2));
    return s;
}
function resolveMaybe(value) {
    const expanded = expandHome(value);
    if (!expanded)
        return expanded;
    return path.isAbsolute(expanded) ? expanded : path.join(workspaceRoot() || os.homedir(), expanded);
}
function exists(filePath) {
    try {
        return !!filePath && fs.existsSync(filePath);
    }
    catch (_) {
        return false;
    }
}
function htmlEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function shellQuote(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
function sanitizeModel(value) {
    const s = String(value || '').trim().toLowerCase();
    if (!s || s === 'default' || s === 'padrao' || s === 'padrão')
        return 'auto';
    return isSafeModelId(s) ? s : 'auto';
}
function normalizeModel(value) { return sanitizeModel(value); }
function validModelsForUi() { return [...FALLBACK_MODELS]; }
function readJson(filePath) {
    try {
        if (!exists(filePath))
            return undefined;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch (_) {
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
    return sanitizeModel(cfg().get('modeloAtual') || readCurrentModelFromDevinConfig() || 'auto');
}
function currentAgent() { return String(cfg().get('agenteAtual') || 'auto'); }
function currentMode() { return String(cfg().get('modoExecucaoChat') || 'resposta-integrada'); }
function selectedSkills() {
    const list = cfg().get('skillsSelecionadas') || [];
    return Array.isArray(list) ? list.map(String).filter(Boolean) : [];
}
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
    if (process.platform === 'win32' && cfg().get('usarGitBashNoWindows', true))
        return findGitBash();
    return process.env.SHELL || undefined;
}
function baseArgs() {
    const out = [...(cfg().get('argumentosPadrao') || []).map(String).filter(Boolean)];
    const modelFlag = String(cfg().get('argumentoModelo') || '').trim();
    const selectedModel = modelForCli();
    if (modelFlag && selectedModel && selectedModel !== 'auto')
        out.push(modelFlag, selectedModel);
    return out;
}
function fullPrompt(text) {
    const prefix = cfg().get('prefixoPromptPadrao') || '';
    const selectedModel = modelForCli() || configuredModel() || 'auto';
    const selectedAgent = currentAgent();
    const skills = selectedSkills();
    const context = [
        `Workspace VS Code: ${workspaceName()}`,
        workspaceRoot() ? `Diretorio raiz: ${workspaceRoot()}` : 'Diretorio raiz: nao ha pasta aberta',
        `Modelo selecionado: ${selectedModel}`,
        `Agente selecionado: ${selectedAgent}`,
        skills.length ? `Skills disponiveis: ${skills.join(', ')}` : ''
    ].filter(Boolean).join('\n');
    const agentHint = selectedAgent !== 'auto'
        ? `Use o perfil/subagente Devin chamado "${selectedAgent}" quando aplicavel. Se a CLI nao aceitar selecao direta de agente nesta chamada, trate este agente como persona operacional e siga as instrucoes do respectivo AGENT.md.`
        : '';
    const skillsHint = skills.length
        ? `Invoque a skill via tool 'skill' quando aplicavel: ${skills.map(s => `"${s}"`).join(', ')}. Siga as instrucoes do respectivo SKILL.md.`
        : '';
    return [prefix, context, agentHint, skillsHint, text].filter(Boolean).join('\n\n');
}
function terminalCommand(text) {
    const executable = shellQuote(devinPath());
    const args = baseArgs().map(shellQuote).join(' ');
    if (!text)
        return [executable, args].filter(Boolean).join(' ');
    return [executable, args, '-p', '--', shellQuote(fullPrompt(text))].filter(Boolean).join(' ');
}
function cleanStderr(stderr) {
    if (!stderr)
        return '';
    return String(stderr)
        .split(/\r?\n/)
        .filter(line => !/were not migrated because they already exist/i.test(line))
        .filter(line => !/migration.*already exist/i.test(line))
        .join('\n')
        .trim();
}
function friendlyCliOutput(stdout, stderr, err) {
    const cleanErr = cleanStderr(stderr);
    const combined = [stdout || '', cleanErr || '', err && err.message ? err.message : ''].join('\n');
    if (/No active model set in cog manager/i.test(combined)) {
        return [
            'Modelo Devin nao configurado para esta execucao.',
            '',
            'A extensao tentou enviar o alias selecionado, mas o Devin CLI informou que nao ha modelo ativo no cog manager.',
            '',
            'Acoes recomendadas:',
            `1. Execute no terminal: devin model set ${configuredModel() || 'auto'}`,
            '2. Se houver conflito de migracao de config, mantenha apenas o valor desejado em agent.model no config.json do Devin.',
            '3. No chat, reabra o seletor de modelo e escolha um dos aliases validos: auto, sonnet, opus, swe, gpt.'
        ].join('\n');
    }
    const parts = [];
    if (stdout && stdout.trim())
        parts.push(stdout.trim());
    if (cleanErr)
        parts.push(`STDERR:\n${cleanErr}`);
    if (err)
        parts.push(`Falha ao executar Devin CLI: ${err.message}`);
    return parts.join('\n\n') || 'Sem saida do Devin CLI.';
}
function openTerminal(text) {
    const shellPath = terminalShell();
    const terminal = vscode.window.createTerminal({
        name: cfg().get('nomeTerminal') || 'Devin Cli Chat',
        cwd: defaultCwd(),
        shellPath,
        shellArgs: process.platform === 'win32' && shellPath ? ['--login', '-i'] : undefined
    });
    terminal.show(true);
    terminal.sendText(terminalCommand(text));
}
function cancelIntegratedRun() {
    cancelRequested = true;
    if (!activeChild || activeChild.killed)
        return false;
    try {
        activeChild.kill();
        return true;
    }
    catch (err) {
        log(`cancelIntegratedRun erro: ${err && err.message ? err.message : String(err)}`);
        return false;
    }
}
function runIntegrated(text) {
    return new Promise((resolve) => {
        cancelRequested = false;
        const args = [...baseArgs(), '-p', '--', fullPrompt(text)];
        log(`runIntegrated: ${devinPath()} ${args.slice(0, -1).join(' ')} -- [prompt ${fullPrompt(text).length} chars]`);
        log(`  cwd: ${defaultCwd()}`);
        let settled = false;
        function done(value) {
            if (settled)
                return;
            settled = true;
            activeChild = undefined;
            resolve(value);
        }
        try {
            activeChild = cp.execFile(devinPath(), args, {
                cwd: defaultCwd(),
                timeout: Number(cfg().get('timeoutChatMs') || 300000),
                maxBuffer: 1024 * 1024 * 16,
                windowsHide: true
            }, (err, stdout, stderr) => {
                if (cancelRequested) {
                    done('Execucao cancelada pelo usuario.');
                    return;
                }
                if (err)
                    log(`runIntegrated erro: code=${err.code} signal=${err.signal} killed=${err.killed} msg=${err.message}`);
                if (stderr && stderr.trim())
                    log(`runIntegrated stderr: ${stderr.slice(0, 500)}`);
                if (stdout && stdout.trim())
                    log(`runIntegrated stdout: ${stdout.slice(0, 200)}...`);
                if (err && process.platform === 'win32') {
                    runIntegratedViaBash(text, err).then(done);
                    return;
                }
                done(friendlyCliOutput(stdout, stderr, err));
            });
            activeChild.on('error', (err) => {
                log(`runIntegrated child error: ${err.message}`);
                if (cancelRequested) {
                    done('Execucao cancelada pelo usuario.');
                    return;
                }
                if (process.platform === 'win32')
                    runIntegratedViaBash(text, err).then(done);
                else
                    done(`Falha ao iniciar Devin CLI: ${err.message}\n\nValide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`);
            });
        }
        catch (err) {
            log(`runIntegrated catch: ${err.message}`);
            if (cancelRequested) {
                done('Execucao cancelada pelo usuario.');
                return;
            }
            if (process.platform === 'win32')
                runIntegratedViaBash(text, err).then(done);
            else
                done(`Falha ao iniciar Devin CLI: ${err.message}\n\nValide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`);
        }
    });
}
function runIntegratedViaBash(text, firstError) {
    return new Promise((resolve) => {
        const bash = findGitBash();
        if (!bash) {
            resolve(`Falha ao executar Devin CLI: ${firstError.message}\n\nGit Bash nao foi encontrado. Configure devinCliChat.gitBashPath ou ajuste devinCliChat.caminhoDevin.`);
            return;
        }
        const args = baseArgs().map(shellQuote).join(' ');
        const command = `${shellQuote(devinPath())} ${args} -p -- ${shellQuote(fullPrompt(text))}`;
        activeChild = cp.exec(command, {
            cwd: defaultCwd(),
            shell: bash,
            timeout: Number(cfg().get('timeoutChatMs') || 300000),
            maxBuffer: 1024 * 1024 * 16
        }, (err, stdout, stderr) => {
            activeChild = undefined;
            if (cancelRequested) {
                resolve('Execucao cancelada pelo usuario.');
                return;
            }
            const output = friendlyCliOutput(stdout, stderr, err);
            resolve(output.replace('Falha ao executar Devin CLI:', 'Falha ao executar Devin CLI via Git Bash:'));
        });
    });
}
async function setConfig(key, value) {
    await cfg().update(key, value, vscode.ConfigurationTarget.Workspace);
    invalidateMetaCache();
    updateStatusBar();
    if (provider)
        provider.refreshMeta();
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
    }
    else {
        files.push(path.join(os.homedir(), '.local', 'share', 'Devin', 'CLI', 'team_settings.bin'));
        files.push(path.join(os.homedir(), '.local', 'share', 'Devin', 'CLI', 'model_configs.bin'));
    }
    return Array.from(new Set(files));
}
function looksLikeModel(value) {
    return VALID_MODELS.includes(String(value || '').trim().toLowerCase());
}
function readModelsFromCaches() {
    const limit = Number(cfg().get('limiteBytesCacheModelos') || 5242880);
    const out = [];
    for (const file of cacheModelFiles()) {
        try {
            if (!exists(file))
                continue;
            const stat = fs.statSync(file);
            if (!stat.isFile() || stat.size > limit)
                continue;
            const buffer = fs.readFileSync(file);
            const text = buffer.toString('utf8');
            const matches = text.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g) || [];
            for (const value of matches) {
                if (looksLikeModel(value))
                    out.push(value);
            }
        }
        catch (_) { }
    }
    return Array.from(new Set(out));
}
function discoverModelsFromCli() {
    return new Promise((resolve) => {
        const customCmd = String(cfg().get('comandoDescobertaModelos') || '').trim();
        if (!customCmd) {
            resolve([]);
            return;
        }
        try {
            cp.execFile(devinPath(), customCmd.split(/\s+/), {
                cwd: defaultCwd(),
                timeout: Number(cfg().get('timeoutDescobertaModelosMs') || 2500),
                windowsHide: true
            }, (err, stdout) => {
                if (err || !stdout) {
                    resolve([]);
                    return;
                }
                try {
                    const parsed = JSON.parse(stdout);
                    const list = Array.isArray(parsed) ? parsed : (parsed && parsed.models) || [];
                    resolve(list.map(m => typeof m === 'string' ? m : (m && (m.name || m.id))).filter(Boolean));
                    return;
                }
                catch (_) { }
                const matches = stdout.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g) || [];
                resolve(matches.filter(looksLikeModel));
            });
        }
        catch (_) {
            resolve([]);
        }
    });
}
function modelsForUi() {
    const ttl = modelCacheMs();
    const now = Date.now();
    if (ttl > 0 && modelCache.values && now - modelCache.at < ttl)
        return modelCache.values;
    const values = [configuredModel(), readCurrentModelFromDevinConfig(), ...manualModels(), ...readModelsFromCaches(), ...validModelsForUi()]
        .map(sanitizeModel)
        .filter(Boolean);
    const result = Array.from(new Set([...validModelsForUi(), ...values]));
    modelCache = { at: now, values: result };
    return result;
}
function scanAgents() {
    const now = Date.now();
    if (agentsCache.values && now - agentsCache.at < metadataCacheMs())
        return agentsCache.values;
    const dirs = [
        resolveMaybe(cfg().get('diretorioAgentesWorkspace') || '.devin/agents'),
        resolveMaybe(cfg().get('diretorioAgentesGlobal') || '~/.config/devin/agents')
    ];
    const out = ['auto'];
    for (const dir of dirs) {
        try {
            if (!dir || !fs.existsSync(dir))
                continue;
            for (const name of fs.readdirSync(dir)) {
                const agentFile = path.join(dir, name, 'AGENT.md');
                if (fs.existsSync(agentFile))
                    out.push(name);
            }
        }
        catch (_) { }
    }
    const result = Array.from(new Set(out));
    agentsCache = { at: now, values: result };
    return result;
}
function scanSkills() {
    const now = Date.now();
    if (skillsCache.values && now - skillsCache.at < metadataCacheMs())
        return skillsCache.values;
    const dirs = [
        resolveMaybe(cfg().get('diretorioSkillsWorkspace') || '.devin/skills'),
        resolveMaybe(cfg().get('diretorioSkillsGlobal') || '~/.config/devin/skills'),
        resolveMaybe('.claude/skills'),
        resolveMaybe('~/.claude/skills')
    ];
    const out = [];
    for (const dir of dirs) {
        try {
            if (!dir || !fs.existsSync(dir))
                continue;
            for (const name of fs.readdirSync(dir)) {
                const skillFile = path.join(dir, name, 'SKILL.md');
                if (fs.existsSync(skillFile))
                    out.push(name);
            }
        }
        catch (_) { }
    }
    const result = Array.from(new Set(out)).sort();
    skillsCache = { at: now, values: result };
    return result;
}
function activeContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return 'Nenhum editor ativo.';
    const doc = editor.document;
    const text = editor.selection && !editor.selection.isEmpty ? doc.getText(editor.selection) : doc.getText();
    return [`Arquivo: ${doc.uri.fsPath}`, 'Conteudo:', '```', text.slice(0, 60000), '```'].join('\n');
}
function estimateTokens(text) {
    if (!text)
        return 0;
    return Math.max(1, Math.ceil(String(text).length / 4));
}
function buildSelectionPayload(editor) {
    if (!editor || !editor.selection || editor.selection.isEmpty)
        return null;
    const doc = editor.document;
    const sel = editor.selection;
    const text = doc.getText(sel);
    if (!text || !text.trim())
        return null;
    const file = doc.uri.fsPath;
    const base = path.basename(file);
    const startLine = sel.start.line + 1;
    const endLine = sel.end.line + 1;
    return {
        id: 'sel-' + Date.now().toString(36),
        file,
        base,
        language: doc.languageId,
        startLine,
        endLine,
        text,
        preview: text.split('\n').slice(0, 2).join(' ').slice(0, 80),
        label: `${base}:${startLine}-${endLine}`
    };
}
function gitDiff() {
    try {
        return cp.execFileSync('git', ['diff', '--no-ext-diff'], {
            cwd: defaultCwd(),
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 8,
            windowsHide: true
        });
    }
    catch (err) {
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
    statusBar.tooltip = `Workspace: ${workspaceName()} | Modo: ${currentMode()} | Skills: ${selectedSkills().length}`;
}
async function pickManualModel() {
    const value = await vscode.window.showInputBox({
        title: 'Modelo Devin',
        prompt: 'Aliases aceitos pelo Devin CLI nesta build: auto, sonnet, opus, swe, gpt.',
        value: configuredModel() === 'auto' ? '' : configuredModel()
    });
    if (!value || !value.trim())
        return;
    const sanitized = sanitizeModel(value);
    if (sanitized !== String(value).trim().toLowerCase()) {
        vscode.window.showInformationMessage(`Modelo "${value.trim()}" nao e aceito por esta versao do Devin CLI. Usando "${sanitized}".`);
    }
    await setConfig('modeloAtual', sanitized);
}
async function pickModel() {
    const pick = await vscode.window.showQuickPick([...modelsForUi(), '+ Informar modelo manual'], {
        placeHolder: 'Selecione o modelo Devin'
    });
    if (!pick)
        return;
    if (pick.startsWith('+'))
        return pickManualModel();
    await setConfig('modeloAtual', pick);
}
async function pickSkills() {
    const available = scanSkills();
    if (!available.length) {
        vscode.window.showInformationMessage('Nenhuma skill encontrada em .devin/skills ou ~/.config/devin/skills.');
        return;
    }
    const current = new Set(selectedSkills());
    const items = available.map(s => ({ label: s, picked: current.has(s) }));
    const picked = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: 'Selecione skills disponiveis para o Devin'
    });
    if (!picked)
        return;
    await setConfig('skillsSelecionadas', picked.map(p => p.label));
}
function loadHistory() {
    try {
        return extContext && extContext.globalState.get(HISTORY_KEY) || [];
    }
    catch (_) {
        return [];
    }
}
async function saveHistory(sessions) {
    try {
        if (extContext)
            await extContext.globalState.update(HISTORY_KEY, sessions.slice(0, MAX_HISTORY));
    }
    catch (_) { }
}
class ChatViewProvider {
    constructor(context) {
        this.context = context;
        this.view = undefined;
        this.busy = false;
        this.session = this.newSession();
    }
    newSession() {
        return {
            id: 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            title: 'Nova conversa',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            workspace: workspaceName(),
            model: configuredModel(),
            agent: currentAgent(),
            mode: currentMode(),
            skills: selectedSkills(),
            messages: []
        };
    }
    async persistSession() {
        if (!this.session || !this.session.messages.length)
            return;
        const all = loadHistory();
        const idx = all.findIndex(s => s.id === this.session.id);
        this.session.updatedAt = Date.now();
        if (!this.session.title || this.session.title === 'Nova conversa') {
            const first = this.session.messages.find(m => m.role === 'user');
            if (first)
                this.session.title = String(first.text).slice(0, 60).replace(/\s+/g, ' ').trim();
        }
        if (idx >= 0)
            all[idx] = this.session;
        else
            all.unshift(this.session);
        all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        await saveHistory(all);
    }
    resolveWebviewView(view) {
        this.view = view;
        view.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };
        view.webview.html = this.html(view.webview);
        log('WebView resolvida e HTML injetado.');
        view.webview.onDidReceiveMessage(async (message) => {
            try {
                const type = message && message.type;
                log(`Mensagem recebida do webview: type=${type}`);
                if (type === 'ready') {
                    this.refreshMeta();
                    this.replaySession();
                    this.pushCurrentSelection();
                    return;
                }
                if (type === 'clientError') {
                    log(`ERRO no cliente webview: ${message.text || 'sem detalhes'}`);
                    this.post({ type: 'message', role: 'assistant', text: 'Falha no painel: ' + (message.text || 'erro sem detalhes') });
                    return;
                }
                if (type === 'cancelRun') {
                    const ok = cancelIntegratedRun();
                    this.post({ type: 'action', ok, text: ok ? 'Cancelamento solicitado.' : 'Nenhuma execucao integrada ativa para cancelar.' });
                    return;
                }
                if (type === 'verifyCli') {
                    this.verifyCli();
                    return;
                }
                if (type === 'requestSelection') {
                    this.pushCurrentSelection(true);
                    return;
                }
                if (type === 'attachMenu') {
                    await this.chooseAttachSource();
                    return;
                }
                if (type === 'attachFiles') {
                    await this.attachFiles();
                    return;
                }
                if (type === 'pickWorkspaceFiles') {
                    await this.pickWorkspaceFiles();
                    return;
                }
                if (type === 'listWorkspace') {
                    this.listWorkspaceDir(message.path || '');
                    return;
                }
                if (type === 'attachFolder') {
                    await this.attachFolder(message.path || '');
                    return;
                }
                if (type === 'attachWorkspacePath') {
                    await this.attachWorkspacePath(message.path || '');
                    return;
                }
                if (type === 'send') {
                    await this.send(message.text || '', { echoUser: message.echo !== false, displayText: message.displayText || message.text || '' });
                    return;
                }
                if (type === 'terminal') {
                    openTerminal(message.text || '');
                    this.post({ type: 'action', ok: true, text: 'Terminal aberto.' });
                    return;
                }
                if (type === 'setModel') {
                    await setConfig('modeloAtual', sanitizeModel(message.value || 'auto'));
                    return;
                }
                if (type === 'setMode') {
                    await setConfig('modoExecucaoChat', message.value || 'resposta-integrada');
                    return;
                }
                if (type === 'setAgent') {
                    await setConfig('agenteAtual', message.value || 'auto');
                    return;
                }
                if (type === 'toggleSkill') {
                    const set = new Set(selectedSkills());
                    if (message.value && set.has(message.value))
                        set.delete(message.value);
                    else if (message.value)
                        set.add(message.value);
                    await setConfig('skillsSelecionadas', Array.from(set));
                    return;
                }
                if (type === 'manualModel') {
                    await pickManualModel();
                    return;
                }
                if (type === 'refreshModels') {
                    this.refreshMeta();
                    const extra = await discoverModelsFromCli();
                    if (extra.length) {
                        const merged = Array.from(new Set([...(cfg().get('modelosDisponiveis') || []), ...extra]));
                        await cfg().update('modelosDisponiveis', merged, vscode.ConfigurationTarget.Workspace);
                    }
                    this.refreshMeta();
                    this.post({ type: 'action', ok: true, text: 'Modelos atualizados (' + modelsForUi().length + ' disponiveis).' });
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
                if (type === 'newChat') {
                    await this.persistSession();
                    this.session = this.newSession();
                    this.post({ type: 'clearThread' });
                    this.refreshMeta();
                    return;
                }
                if (type === 'getHistory') {
                    await this.openHistory();
                    return;
                }
                if (type === 'loadSession') {
                    await this.persistSession();
                    const all = loadHistory();
                    const found = all.find(s => s.id === message.id);
                    if (found) {
                        this.session = JSON.parse(JSON.stringify(found));
                        this.post({ type: 'clearThread' });
                        this.replaySession();
                        this.refreshMeta();
                        this.post({ type: 'action', ok: true, text: 'Sessao carregada: ' + (found.title || found.id) });
                    }
                    return;
                }
                if (type === 'deleteSession') {
                    const all = loadHistory().filter(s => s.id !== message.id);
                    await saveHistory(all);
                    if (this.session && this.session.id === message.id) {
                        this.session = this.newSession();
                        this.post({ type: 'clearThread' });
                    }
                    this.post({ type: 'history', sessions: all });
                    this.refreshMeta();
                    return;
                }
                if (type === 'clearHistory') {
                    await saveHistory([]);
                    this.session = this.newSession();
                    this.post({ type: 'clearThread' });
                    this.post({ type: 'history', sessions: [] });
                    this.refreshMeta();
                    return;
                }
                this.post({ type: 'action', ok: false, text: `Acao desconhecida: ${type}` });
            }
            catch (err) {
                this.busy = false;
                this.post({ type: 'busy', value: false });
                log(`ERRO no handler do webview: ${err && err.message ? err.message : String(err)}`);
                if (err && err.stack)
                    log(err.stack);
                this.post({ type: 'message', role: 'assistant', text: 'Falha ao executar acao do painel: ' + (err && err.message ? err.message : String(err)) });
            }
        });
        setTimeout(() => this.refreshMeta(), 50);
    }
    post(message) { try {
        if (this.view)
            this.view.webview.postMessage(message);
    }
    catch (_) { } }
    async openHistory() {
        await this.persistSession();
        const sessions = loadHistory().filter(s => s && s.messages && s.messages.length);
        this.post({ type: 'openHistory', sessions });
        this.refreshMeta();
    }
    verifyCli() {
        outputChannel.show(true);
        log(`Verificando Devin CLI pelo painel: ${devinPath()}`);
        cp.execFile(devinPath(), ['--version'], { cwd: defaultCwd(), windowsHide: true }, (err, stdout, stderr) => {
            if (err) {
                const text = `Falha ao verificar Devin CLI: ${err.message}`;
                log(text);
                this.post({ type: 'message', role: 'assistant', text });
                this.post({ type: 'action', ok: false, text });
                return;
            }
            const version = (stdout || stderr || 'ok').trim();
            const text = `Devin CLI encontrado: ${version}`;
            log(text);
            this.post({ type: 'message', role: 'assistant', text });
            this.post({ type: 'action', ok: true, text });
        });
    }
    pushCurrentSelection(force) {
        const editor = vscode.window.activeTextEditor;
        const payload = buildSelectionPayload(editor);
        if (payload)
            this.post({ type: 'selectionAvailable', selection: payload });
    }
    attachmentId(prefix) {
        return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
    readFileItem(filePath, label) {
        const stat = fs.statSync(filePath);
        if (stat.size > MAX_ATTACHMENT_BYTES) {
            return { skipped: true, reason: `Arquivo muito grande: ${path.basename(filePath)} (${stat.size} bytes).` };
        }
        const text = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath).slice(1);
        return {
            id: this.attachmentId('file'),
            file: filePath,
            base: path.basename(filePath),
            label: label || path.basename(filePath),
            type: 'file',
            text,
            language: ext,
            lines: text.split('\n').length
        };
    }
    readFolderItem(folderPath, displayName) {
        const root = workspaceRoot();
        const folderName = displayName || path.basename(folderPath) || 'workspace';
        const files = [];
        const stack = [folderPath];
        while (stack.length && files.length < MAX_FOLDER_FILES) {
            const cur = stack.pop();
            let entries;
            try {
                entries = fs.readdirSync(cur, { withFileTypes: true });
            }
            catch (_) {
                continue;
            }
            for (const e of entries) {
                const full = path.join(cur, e.name);
                if (e.isDirectory()) {
                    if (!ATTACH_SKIP_DIRS.has(e.name) && !e.name.startsWith('.'))
                        stack.push(full);
                }
                else if (e.isFile()) {
                    try {
                        const st = fs.statSync(full);
                        if (st.size > MAX_ATTACHMENT_BYTES)
                            continue;
                        const text = fs.readFileSync(full, 'utf8');
                        const rel = root && full.startsWith(root) ? path.relative(root, full) : path.join(folderName, path.relative(folderPath, full));
                        files.push({
                            file: full,
                            rel: rel.replace(/\\/g, '/'),
                            base: path.basename(full),
                            text,
                            language: path.extname(full).slice(1),
                            lines: text.split('\n').length
                        });
                        if (files.length >= MAX_FOLDER_FILES)
                            break;
                    }
                    catch (_) { }
                }
            }
        }
        return {
            id: this.attachmentId('folder'),
            file: folderPath,
            base: folderName,
            label: `${folderName} (${files.length})`,
            type: 'folder',
            files,
            count: files.length,
            truncated: files.length >= MAX_FOLDER_FILES
        };
    }
    async chooseAttachSource() {
        const pick = await vscode.window.showQuickPick([
            { label: '$(folder) Pastas', description: 'Anexar pasta recursivamente como chip unico', value: 'folders' },
            { label: '$(file) Arquivos abertos', description: 'Anexar arquivos atualmente abertos no editor', value: 'openFiles' }
        ], { placeHolder: 'Anexar contexto ao Devin' });
        if (!pick)
            return;
        if (pick.value === 'folders') {
            const uris = await vscode.window.showOpenDialog({
                canSelectMany: true,
                canSelectFiles: false,
                canSelectFolders: true,
                defaultUri: workspaceRoot() ? vscode.Uri.file(workspaceRoot()) : undefined,
                openLabel: 'Anexar pasta'
            });
            if (!uris || !uris.length)
                return;
            const items = [];
            for (const uri of uris) {
                try {
                    const item = this.readFolderItem(uri.fsPath, path.basename(uri.fsPath));
                    if (item.files && item.files.length)
                        items.push(item);
                }
                catch (err) {
                    this.post({ type: 'action', ok: false, text: `Falha ao anexar pasta ${uri.fsPath}: ${err.message}` });
                }
            }
            if (items.length)
                this.post({ type: 'attachItems', items });
            this.post({ type: 'action', ok: true, text: `Anexadas ${items.length} pasta(s).` });
            return;
        }
        const docs = vscode.workspace.textDocuments.filter(d => d.uri && d.uri.scheme === 'file' && !d.isUntitled);
        if (!docs.length) {
            this.post({ type: 'action', ok: false, text: 'Nenhum arquivo aberto para anexar.' });
            return;
        }
        const root = workspaceRoot() || '';
        const choices = docs.map(doc => ({
            label: '$(file) ' + path.basename(doc.uri.fsPath),
            description: root ? path.dirname(path.relative(root, doc.uri.fsPath)) : path.dirname(doc.uri.fsPath),
            detail: doc.uri.fsPath,
            doc
        }));
        const picked = await vscode.window.showQuickPick(choices, { canPickMany: true, placeHolder: 'Selecione arquivos abertos para anexar' });
        if (!picked || !picked.length)
            return;
        const items = [];
        for (const p of picked) {
            const doc = p.doc;
            const text = doc.getText();
            if (Buffer.byteLength(text, 'utf8') > MAX_ATTACHMENT_BYTES) {
                this.post({ type: 'action', ok: false, text: `Arquivo muito grande: ${path.basename(doc.uri.fsPath)}.` });
                continue;
            }
            items.push({
                id: this.attachmentId('file'),
                file: doc.uri.fsPath,
                base: path.basename(doc.uri.fsPath),
                label: path.basename(doc.uri.fsPath),
                type: 'file',
                text,
                language: doc.languageId || path.extname(doc.uri.fsPath).slice(1),
                lines: text.split('\n').length
            });
        }
        if (items.length)
            this.post({ type: 'attachItems', items });
    }
    async attachFiles() {
        try {
            const uris = await vscode.window.showOpenDialog({
                canSelectMany: true,
                canSelectFiles: true,
                canSelectFolders: false,
                defaultUri: workspaceRoot() ? vscode.Uri.file(workspaceRoot()) : undefined,
                openLabel: 'Anexar ao chat'
            });
            if (!uris || !uris.length)
                return;
            const items = [];
            for (const uri of uris) {
                try {
                    const stat = fs.statSync(uri.fsPath);
                    if (stat.size > 1024 * 1024) {
                        items.push({ id: 'file-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), file: uri.fsPath, base: path.basename(uri.fsPath), label: path.basename(uri.fsPath), type: 'file', text: `Arquivo ${uri.fsPath} muito grande (${stat.size} bytes) - nao anexado.`, language: '', tooBig: true });
                        continue;
                    }
                    const text = fs.readFileSync(uri.fsPath, 'utf8');
                    const ext = path.extname(uri.fsPath).slice(1);
                    items.push({ id: 'file-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), file: uri.fsPath, base: path.basename(uri.fsPath), label: path.basename(uri.fsPath), type: 'file', text, language: ext, lines: text.split('\n').length });
                }
                catch (err) {
                    this.post({ type: 'action', ok: false, text: `Falha ao ler ${uri.fsPath}: ${err.message}` });
                }
            }
            if (items.length)
                this.post({ type: 'attachItems', items });
        }
        catch (err) {
            this.post({ type: 'action', ok: false, text: 'Falha ao anexar: ' + (err && err.message ? err.message : String(err)) });
        }
    }
    async pickWorkspaceFiles() {
        try {
            const found = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,dist,build,out,.venv,__pycache__}/**', 5000);
            if (!found.length) {
                this.post({ type: 'action', ok: false, text: 'Nenhum arquivo encontrado.' });
                return;
            }
            const root = workspaceRoot() || '';
            const items = found.map(uri => ({ label: path.relative(root, uri.fsPath) || path.basename(uri.fsPath), description: '', uri }));
            const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Selecione arquivos do workspace para anexar', canPickMany: true, matchOnDescription: true });
            if (!pick || !pick.length)
                return;
            const out = [];
            for (const p of pick) {
                try {
                    const stat = fs.statSync(p.uri.fsPath);
                    if (stat.size > 1024 * 1024)
                        continue;
                    const text = fs.readFileSync(p.uri.fsPath, 'utf8');
                    const ext = path.extname(p.uri.fsPath).slice(1);
                    out.push({ id: 'file-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), file: p.uri.fsPath, base: path.basename(p.uri.fsPath), label: path.basename(p.uri.fsPath), type: 'file', text, language: ext });
                }
                catch (_) { }
            }
            if (out.length)
                this.post({ type: 'attachItems', items: out });
        }
        catch (err) {
            this.post({ type: 'action', ok: false, text: 'Falha: ' + (err && err.message ? err.message : String(err)) });
        }
    }
    listWorkspaceDir(relPath) {
        try {
            const root = workspaceRoot();
            if (!root) {
                this.post({ type: 'workspaceList', path: relPath || '', entries: [], error: 'Sem workspace aberto.' });
                return;
            }
            const safe = String(relPath || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.\/?/g, '');
            const dir = safe ? path.join(root, safe) : root;
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
                this.post({ type: 'workspaceList', path: '', entries: [], error: 'Diretorio invalido.' });
                return;
            }
            const skip = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.venv', '__pycache__', '.next', '.nuxt', '.cache', 'target', '.idea']);
            const list = fs.readdirSync(dir, { withFileTypes: true })
                .filter(e => !e.name.startsWith('.') || ['.cognition', '.devin', '.claude', '.cursor', '.vscode'].includes(e.name))
                .filter(e => !(e.isDirectory() && skip.has(e.name)))
                .map(e => {
                let size = 0;
                try {
                    if (e.isFile())
                        size = fs.statSync(path.join(dir, e.name)).size;
                }
                catch (_) { }
                return { name: e.name, isDir: e.isDirectory(), size };
            })
                .sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name));
            this.post({ type: 'workspaceList', path: safe, entries: list });
        }
        catch (err) {
            this.post({ type: 'workspaceList', path: '', entries: [], error: err.message });
        }
    }
    async attachWorkspacePath(relPath) {
        const root = workspaceRoot();
        if (!root)
            return;
        const abs = path.join(root, String(relPath || '').replace(/\\/g, '/').replace(/^\/+/, ''));
        if (!fs.existsSync(abs)) {
            this.post({ type: 'action', ok: false, text: 'Caminho invalido.' });
            return;
        }
        if (fs.statSync(abs).isDirectory()) {
            await this.attachFolder(relPath);
            return;
        }
        try {
            const stat = fs.statSync(abs);
            if (stat.size > 1024 * 1024) {
                this.post({ type: 'action', ok: false, text: `Arquivo muito grande: ${path.basename(abs)} (${stat.size} bytes).` });
                return;
            }
            const text = fs.readFileSync(abs, 'utf8');
            const ext = path.extname(abs).slice(1);
            this.post({ type: 'attachItems', items: [{ id: 'file-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), file: abs, base: path.basename(abs), label: path.basename(abs), type: 'file', text, language: ext }] });
        }
        catch (err) {
            this.post({ type: 'action', ok: false, text: 'Falha: ' + err.message });
        }
    }
    async attachFolder(relPath) {
        const root = workspaceRoot();
        if (!root)
            return;
        const safe = String(relPath || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.\/?/g, '');
        const abs = safe ? path.join(root, safe) : root;
        if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
            this.post({ type: 'action', ok: false, text: 'Pasta invalida.' });
            return;
        }
        const item = this.readFolderItem(abs, safe ? path.basename(abs) : workspaceName());
        if (item.files && item.files.length)
            this.post({ type: 'attachItems', items: [item] });
        this.post({ type: 'action', ok: true, text: `Pasta anexada como chip unico: ${item.label}.` });
    }
    replaySession() {
        if (!this.session || !this.session.messages.length)
            return;
        for (const m of this.session.messages)
            this.post({ type: 'message', role: m.role, text: m.text, replay: true });
    }
    refreshMeta() {
        const payload = {
            type: 'meta',
            models: FALLBACK_MODELS,
            model: configuredModel(),
            agents: ['auto'],
            agent: currentAgent(),
            skills: [],
            selectedSkills: selectedSkills(),
            mode: currentMode(),
            workspace: workspaceName(),
            sessionId: this.session && this.session.id,
            sessionTitle: this.session && this.session.title,
            modelLocked: false,
            hasMessages: !!(this.session && this.session.messages && this.session.messages.length),
            tokensTotal: this.session ? (this.session.tokens || 0) : 0,
            tokensIn: this.session ? (this.session.tokensIn || 0) : 0,
            tokensOut: this.session ? (this.session.tokensOut || 0) : 0,
            modelStatus: 'modelo: auto'
        };
        try {
            payload.models = modelsForUi();
        }
        catch (_) {
            payload.models = FALLBACK_MODELS;
        }
        try {
            payload.agents = scanAgents();
        }
        catch (_) {
            payload.agents = ['auto'];
        }
        try {
            payload.skills = scanSkills();
        }
        catch (_) {
            payload.skills = [];
        }
        try {
            payload.recentSessions = loadHistory().slice(0, 3).map(s => ({
                id: s.id,
                title: s.title || 'Sem titulo',
                updatedAt: s.updatedAt,
                messages: (s.messages || []).length,
                model: s.model || 'auto'
            }));
        }
        catch (_) {
            payload.recentSessions = [];
        }
        try {
            payload.modelStatus = `${payload.models.length} modelos | ${payload.skills.length} skills`;
        }
        catch (_) { }
        this.post(payload);
    }
    async send(text, options) {
        const prompt = String(text || '').trim();
        if (!prompt)
            return;
        const displayPrompt = String(options && options.displayText ? options.displayText : prompt).trim();
        if (this.busy) {
            this.post({ type: 'message', role: 'assistant', text: 'Ja existe uma execucao em andamento. A concorrencia permanece controlada no backend.' });
            return;
        }
        this.busy = true;
        const inTokens = estimateTokens(fullPrompt(prompt));
        this.session.tokensIn = (this.session.tokensIn || 0) + inTokens;
        this.session.tokens = (this.session.tokens || 0) + inTokens;
        if (!options || options.echoUser !== false)
            this.post({ type: 'message', role: 'user', text: displayPrompt });
        this.session.messages.push({ role: 'user', text: displayPrompt, fullText: prompt, ts: Date.now(), tokens: inTokens });
        this.post({ type: 'busy', value: true });
        this.post({ type: 'action', ok: true, text: 'Enviando para o Devin CLI...' });
        this.refreshMeta();
        try {
            const mode = currentMode();
            log(`send: modo=${mode} prompt=${prompt.length} chars`);
            if (mode === 'terminal') {
                openTerminal(prompt);
                const reply = 'Sessao aberta no terminal integrado, ja posicionada na pasta aberta no VS Code.';
                this.post({ type: 'message', role: 'assistant', text: reply });
                this.session.messages.push({ role: 'assistant', text: reply, ts: Date.now() });
                return;
            }
            const answer = await runIntegrated(prompt);
            log(`send: resposta recebida (${answer ? answer.length : 0} chars)`);
            const outTokens = estimateTokens(answer);
            this.session.tokensOut = (this.session.tokensOut || 0) + outTokens;
            this.session.tokens = (this.session.tokens || 0) + outTokens;
            this.post({ type: 'message', role: 'assistant', text: answer });
            this.session.messages.push({ role: 'assistant', text: answer, ts: Date.now(), tokens: outTokens });
        }
        catch (err) {
            log(`send ERRO: ${err && err.message ? err.message : String(err)}`);
            const msg = 'Falha ao enviar para o Devin CLI: ' + (err && err.message ? err.message : String(err));
            this.post({ type: 'message', role: 'assistant', text: msg });
            this.session.messages.push({ role: 'assistant', text: msg, ts: Date.now() });
        }
        finally {
            this.busy = false;
            this.post({ type: 'busy', value: false });
            await this.persistSession();
            this.refreshMeta();
        }
    }
    html(webview) {
        const nonce = Date.now().toString(36);
        const ICONS = {
            history: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.4 1.6"/></svg>',
            plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
            refresh: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.55"/><path d="M13 3v3h-3"/></svg>',
            terminal: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7l2 1.5L5 10M8.5 10.5h3"/></svg>',
            lock: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
            paperclip: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',
            attach: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',
            file: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13"/></svg>',
            folder: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>',
            close: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
            send: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 13.5L14 8 2 2.5 2 7l8 1-8 1z"/></svg>',
            brain: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3a2 2 0 0 0-2 2 2 2 0 0 0-1 3.5 2 2 0 0 0 1.5 3 2 2 0 0 0 3.5 0V3.5A1.5 1.5 0 0 0 5.5 3z"/><path d="M10.5 3a2 2 0 0 1 2 2 2 2 0 0 1 1 3.5 2 2 0 0 1-1.5 3 2 2 0 0 1-3.5 0V3.5A1.5 1.5 0 0 1 10.5 3z"/></svg>',
            bot: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="10" height="7" rx="1.5"/><path d="M8 3v2.5M5.5 8.5h.01M10.5 8.5h.01M2 9.5v1.5M14 9.5v1.5"/></svg>',
            mode: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5h12M2 8h8M2 10.5h10"/></svg>',
            sparkle: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l1.2 3.4L12.5 6.5 9.2 7.6 8 11l-1.2-3.4L3.5 6.5 6.8 5.4z"/></svg>',
            caret: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l6 5-6 5z"/></svg>'
        };
        const MODEL_TREE = [
            { label: 'auto', value: 'auto' },
            { label: 'sonnet', value: 'sonnet' },
            { label: 'opus', value: 'opus' },
            { label: 'swe', value: 'swe' },
            { label: 'gpt', value: 'gpt' }
        ];
        return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
:root{--bg:var(--vscode-sideBar-background);--fg:var(--vscode-foreground);--muted:var(--vscode-descriptionForeground);--border:var(--vscode-panel-border);--input:var(--vscode-input-background);--input-fg:var(--vscode-input-foreground);--focus:var(--vscode-focusBorder);--accent:var(--vscode-button-background);--accent-fg:var(--vscode-button-foreground);--editor:var(--vscode-editor-background);--hover:var(--vscode-list-hoverBackground);--active:var(--vscode-list-activeSelectionBackground);--active-fg:var(--vscode-list-activeSelectionForeground);--code:var(--vscode-textCodeBlock-background)}
*{box-sizing:border-box}html,body{width:100%;height:100%;padding:0;margin:0;overflow:hidden;background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family);font-size:var(--vscode-font-size)}
button,select,textarea{font:inherit;color:inherit}
.app{height:100vh;display:flex;flex-direction:column;background:var(--bg);position:relative}
.header{height:38px;min-height:38px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;padding:0 10px}
.product{display:flex;align-items:center;gap:8px;font-weight:600;font-size:12px;color:var(--muted)}
.logo{width:20px;height:20px;display:grid;place-items:center}
.logo svg{display:block;width:20px;height:20px}
.headerSpacer{flex:1}
.iconBtn{border:0;background:transparent;color:var(--muted);width:26px;height:26px;border-radius:6px;display:grid;place-items:center;cursor:pointer}
.iconBtn:hover{background:var(--hover);color:var(--fg)}
.iconBtn.active{background:var(--active);color:var(--active-fg)}
.iconBtn svg{display:block}
.thread{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:16px;background:var(--editor)}
.welcome{margin:auto 0;display:grid;gap:14px}
.welcomeTitle{font-size:18px;font-weight:600}
.welcomeText{color:var(--muted);max-width:560px;font-size:12px;line-height:1.5}
.starterGrid{display:grid;gap:8px}
.starter{border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:10px;text-align:left;padding:10px;cursor:pointer}
.starter:hover{background:var(--hover);border-color:var(--focus)}
.starter b{display:block;margin-bottom:3px;font-size:13px}
.starter span{display:block;color:var(--muted);font-size:11px;line-height:1.4}
.recentBlock{border:1px solid var(--border);border-radius:10px;background:var(--bg);overflow:hidden}
.recentHead{padding:8px 10px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px}
.recentItem{padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;flex-direction:column;gap:2px}
.recentItem:last-child{border-bottom:0}
.recentItem:hover{background:var(--hover)}
.recentItem .t{font-size:13px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.recentItem .m{font-size:11px;color:var(--muted)}
.recentEmpty{padding:10px;font-size:11px;color:var(--muted)}
.msgRow{display:flex;gap:10px;align-items:flex-start}
.msgRow.user{justify-content:flex-end}
.avatar{width:24px;height:24px;border-radius:999px;background:var(--accent);color:var(--accent-fg);display:grid;place-items:center;font-size:11px;font-weight:700;flex:0 0 auto;margin-top:2px}
.msg{max-width:92%;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}
.msg.assistant{width:100%}
.msg.user{background:var(--input);border:1px solid var(--border);border-radius:16px;padding:9px 12px;max-width:82%}
.msgMeta{font-size:11px;color:var(--muted);margin-bottom:4px}
.msg pre{background:var(--code);border:1px solid var(--border);border-radius:8px;padding:10px;overflow:auto;white-space:pre-wrap}
.composerWrap{border-top:1px solid var(--border);background:var(--bg);padding:10px;position:relative}
.composer{border:1px solid var(--border);background:var(--input);border-radius:12px;display:flex;flex-direction:column;overflow:hidden}
.composer:focus-within{border-color:var(--focus)}
.inputLine{display:flex;align-items:flex-start;gap:8px;padding:8px 8px 0 8px}
.mention{height:24px;border-radius:6px;background:var(--active);color:var(--active-fg);padding:3px 6px;font-size:12px}
textarea{width:100%;min-height:62px;max-height:200px;resize:none;background:transparent;color:var(--input-fg);border:0;outline:0;padding:3px 0 8px 0;line-height:1.4}
.composerBar{display:flex;align-items:center;gap:6px;padding:6px 8px 8px 8px;border-top:1px solid var(--border)}
.chipBtn{height:26px;border:0;background:transparent;color:var(--muted);border-radius:6px;padding:0 7px;display:inline-flex;align-items:center;gap:5px;font-size:11px;white-space:nowrap;cursor:pointer;flex:0 0 auto}
.chipBtn:hover{background:var(--hover);color:var(--fg)}
.chipBtn:disabled{opacity:.6;cursor:not-allowed}
.chipBtn.has{color:var(--fg)}
.chipBtn.has svg{color:var(--accent)}
.chipBtn .chipText{overflow:hidden;text-overflow:ellipsis;max-width:120px}
.chipBtn .caret{opacity:.6}
.chipBtn svg{flex:0 0 auto}
.modelLockBadge{display:none;align-items:center;gap:3px;font-size:10px;color:var(--muted);flex:0 0 auto}
.modelLockBadge.show{display:inline-flex}
.barSpacer{flex:1;min-width:6px}
.tokenInfo{font-size:10px;color:var(--muted);white-space:nowrap;flex:0 0 auto}
.tokenPie{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex:0 0 auto;cursor:help}
.tokenPie svg{width:18px;height:18px;display:block}
.menu .check{display:inline-flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer}
.menu .check:hover{background:var(--hover)}
.menu .check input{margin:0;accent-color:var(--accent)}
.menu .head{padding:6px 10px;font-size:10px;text-transform:uppercase;color:var(--muted);letter-spacing:.04em;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px}
.menu .head .barSpacer{flex:1}
.menu .head button{border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:10px;text-transform:none;letter-spacing:0;padding:2px 6px;border-radius:4px}
.menu .head button:hover{color:var(--fg);background:var(--hover)}
.menu.browser{min-width:320px;max-width:420px}
.menu.browser .item{padding:5px 10px}
.menu.browser .browserItem{justify-content:space-between}
.menu.browser .rowBtn{border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:14px;width:18px;height:18px;border-radius:4px;display:grid;place-items:center}
.menu.browser .rowBtn:hover{background:var(--hover);color:var(--fg)}
.busyDot{display:none;width:7px;height:7px;border-radius:999px;background:var(--accent);animation:pulse 1s infinite;flex:0 0 auto}
.is-busy .busyDot{display:block}.is-busy .sendBtn{opacity:.55}
.stopBtn{display:none;width:28px;height:28px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--fg);cursor:pointer;place-items:center;flex:0 0 auto;font-size:16px;line-height:1}
.is-busy .stopBtn{display:grid}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
.sendBtn{width:28px;height:28px;border-radius:8px;border:0;background:var(--accent);color:var(--accent-fg);cursor:pointer;display:grid;place-items:center;flex:0 0 auto}
.sendBtn:disabled{opacity:.5}
.sendBtn svg{display:block}
.modelGate{display:none;background:var(--input);border:1px solid var(--focus);border-radius:8px;padding:8px 10px;font-size:11px;color:var(--fg);margin:0 0 8px 0;align-items:center;gap:8px}
.modelGate.show{display:flex}
.contextChips{display:flex;flex-wrap:wrap;gap:5px;padding:6px 8px 0 8px}
.contextChips:empty{padding:0}
.attachChip{display:inline-flex;align-items:center;gap:5px;background:var(--bg);border:1px dashed var(--border);border-radius:8px;padding:3px 7px;font-size:11px;color:var(--fg);max-width:240px;cursor:pointer}
.attachChip:hover{border-style:solid;border-color:var(--focus);background:var(--hover)}
.attachChip.attached{border-style:solid;background:var(--active);color:var(--active-fg)}
.attachChip .lbl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px}
.attachChip .rm{border:0;background:transparent;color:inherit;cursor:pointer;display:grid;place-items:center;padding:0;width:14px;height:14px;border-radius:3px}
.attachChip .rm:hover{background:rgba(127,127,127,.25)}
.attachChip svg{flex:0 0 auto;opacity:.85}
.panel{position:absolute;top:38px;right:8px;width:300px;max-height:60vh;overflow:auto;background:var(--bg);border:1px solid var(--border);border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.3);z-index:30;display:none}
.panel.open{display:block}
.panel header{padding:8px 10px;border-bottom:1px solid var(--border);font-weight:600;font-size:12px;display:flex;align-items:center;gap:6px}
.panel header .barSpacer{flex:1}
.panel header button{border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:11px}
.panel header button:hover{color:var(--fg)}
.skillItem{padding:6px 10px;display:flex;align-items:center;gap:8px;cursor:pointer;border-bottom:1px solid var(--border)}
.skillItem:hover{background:var(--hover)}
.skillItem input{margin:0}
.skillItem.empty{color:var(--muted);cursor:default;font-size:11px;padding:12px 10px}
.histItem{padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;flex-direction:column;gap:2px}
.histItem:hover{background:var(--hover)}
.histItem .t{font-size:12px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.histItem .m{font-size:10px;color:var(--muted);display:flex;justify-content:space-between;gap:6px}
.histItem .actions{display:flex;gap:4px;justify-content:flex-end;margin-top:4px}
.histItem .actions button{border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;font-size:10px;border-radius:4px;padding:2px 6px}
.histItem .actions button:hover{color:var(--fg);background:var(--hover)}
.menu{position:absolute;background:var(--bg);border:1px solid var(--border);border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.4);z-index:40;min-width:200px;max-height:55vh;overflow:auto;padding:4px 0;font-size:12px}
.menu .item{display:flex;align-items:center;gap:6px;padding:5px 12px;cursor:pointer;justify-content:space-between;white-space:nowrap}
.menu .item:hover,.menu .item.activeHover{background:var(--hover)}
.menu .item.selected{color:var(--accent);font-weight:600}
.menu .item .arrow{opacity:.5;font-size:10px;flex:0 0 auto}
.menu .empty{padding:8px 12px;color:var(--muted);font-size:11px}
body.narrow .chipBtn .chipText{display:none}
body.narrow .chipBtn{padding:0 6px;width:30px;justify-content:center}
body.narrow .chipBtn.alwaysText .chipText{display:inline}
body.narrow .chipBtn.alwaysText{width:auto;padding:0 9px}
body.narrow .tokenInfo{display:none}
body.narrow .tokenPie{display:none}
body.narrow .modelLockBadge.show span{display:none}
</style></head><body><div class="app">
<header class="header">
  <div class="product">
    <div class="logo"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="hg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#5eead4"/><stop offset="55%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0e7490"/></radialGradient></defs><g transform="translate(12 12)" fill="url(#hg)"><circle cx="0" cy="-5.5" r="3.2"/><circle cx="4.8" cy="-2.75" r="3.2"/><circle cx="4.8" cy="2.75" r="3.2"/><circle cx="0" cy="5.5" r="3.2"/><circle cx="-4.8" cy="2.75" r="3.2"/><circle cx="-4.8" cy="-2.75" r="3.2"/></g></svg></div>
    <span>Devin Cli Chat</span>
  </div>
  <div class="headerSpacer"></div>
  <button type="button" class="iconBtn" data-action="toggleHistory" title="Historico">${ICONS.history}</button>
  <button type="button" class="iconBtn" data-action="newChat" title="Nova conversa">${ICONS.plus}</button>
  <button type="button" class="iconBtn" data-action="refreshModels" title="Atualizar modelos">${ICONS.refresh}</button>
  <button type="button" class="iconBtn" data-action="verifyCli" title="Verificar Devin CLI">i</button>
  <button type="button" class="iconBtn" data-action="terminal" title="Abrir sessao no terminal">${ICONS.terminal}</button>
</header>
<div id="historyPanel" class="panel"><header>Historico <div class="barSpacer"></div><button data-action="clearHistory">Limpar</button></header><div id="historyList"></div></div>

<main class="thread" id="thread">
  <section class="welcome" id="welcome">
    <div class="welcomeTitle">Como posso ajudar neste workspace?</div>
    <div class="welcomeText">Selecione modelo, agente, modo e skills antes de enviar. As ultimas conversas ficam disponiveis para continuar.</div>
    <div id="recentBlock" class="recentBlock" style="display:none">
      <div class="recentHead">${ICONS.history} Conversas recentes</div>
      <div id="recentList"></div>
    </div>
    <div class="starterGrid">
      <button type="button" class="starter" data-action="review"><b>Revisar diff</b><span>Analisa alteracoes locais.</span></button>
      <button type="button" class="starter" data-action="starter" data-prompt="Planeje a implementacao da proxima tarefa em etapas pequenas, com riscos, testes e estrategia de rollback."><b>Planejar tarefa</b><span>Plano objetivo antes de codar.</span></button>
      <button type="button" class="starter" data-action="selection"><b>Explicar contexto</b><span>Usa arquivo aberto ou selecao.</span></button>
    </div>
  </section>
</main>
<footer class="composerWrap">
  <div id="modelGate" class="modelGate"><b>Selecione um modelo</b><span>antes de iniciar a conversa.</span></div>
  <div class="composer">
    <div id="contextChips" class="contextChips"></div>
    <div class="inputLine"><textarea id="prompt" placeholder="Escreva sua mensagem..."></textarea></div>
    <div class="composerBar">
      <button type="button" class="chipBtn" data-action="attachMenu" id="attachBtn" title="Anexar contexto">${ICONS.attach}<span class="chipText">Anexar</span></button>
      <button type="button" class="chipBtn" data-action="openModelMenu" id="modelChip" title="Modelo">${ICONS.brain}<span class="chipText" id="modelChipText">Modelo</span><span class="caret">${ICONS.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openAgentMenu" id="agentChip" title="Agente">${ICONS.bot}<span class="chipText" id="agentChipText">Agente</span><span class="caret">${ICONS.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openModeMenu" id="modeChip" title="Modo">${ICONS.mode}<span class="chipText" id="modeChipText">Modo</span><span class="caret">${ICONS.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openSkillsMenu" id="skillsBtn" title="Skills">${ICONS.sparkle}<span class="chipText">Skills <span id="skillsCount">0</span></span></button>
      <span class="barSpacer"></span>
      <span class="busyDot"></span>
      <span class="tokenPie" id="tokenPie" title="Tokens"></span>
      <button class="stopBtn" id="cancel" type="button" data-action="cancelRun" title="Cancelar execucao">×</button>
      <button class="sendBtn" id="send" type="button" data-action="send" title="Enviar">${ICONS.send}</button>
    </div>
  </div>
</footer>
</div>
<script nonce="${nonce}">
(function(){
'use strict';
var vscode = acquireVsCodeApi();
var ICONS = ${JSON.stringify(ICONS)};
var MODEL_TREE = ${JSON.stringify(MODEL_TREE)};
var META = { skills: [], selectedSkills: [], modelLocked: false, hasMessages: false, model: 'auto', agent: 'auto', mode: 'resposta-integrada', agents: ['auto'], tokensTotal: 0, tokensIn: 0, tokensOut: 0, recentSessions: [] };
var busy = false;
var pendingSelection = null;
var attachedItems = [];
var openMenu = null;

function byId(id){ return document.getElementById(id); }
function txt(v){ return String(v == null ? '' : v); }
function post(m){ vscode.postMessage(m); }
function setStatus(v){ /* status removido da barra */ }
function estTokens(t){ if(!t) return 0; return Math.max(1, Math.ceil(String(t).length/4)); }

function setBusy(v){ busy = !!v; document.body.classList.toggle('is-busy', busy); var s = byId('send'); if(s) s.disabled = false; updateGate(); }
function setPrompt(v){ var el = byId('prompt'); if(el){ el.value = txt(v); el.focus && el.focus(); updateTokens(); } }
function getPrompt(){ var el = byId('prompt'); return el ? el.value : ''; }
function appendPrompt(v){ var i = txt(v).trim(); if(!i) return; var c = getPrompt().trim(); setPrompt(c ? c + '\\n\\n' + i : i); }
function hideWelcome(){ var w = byId('welcome'); if(w) w.style.display = 'none'; }
function showWelcome(){ var w = byId('welcome'); if(w) w.style.display = 'grid'; renderRecent(); }

function updateGate(){
  var gate = byId('modelGate'); if(!gate) return;
  var needs = !META.hasMessages && !META.model;
  gate.classList.toggle('show', needs);
  var s = byId('send'); if(s) s.disabled = needs;
}

var MODEL_LIMITS = {
  'auto': 200000,
  'sonnet': 200000,
  'opus': 200000,
  'swe': 200000,
  'gpt': 400000
};
function modelLimit(){ return MODEL_LIMITS[META.model] || 200000; }
function pieSlice(cx, cy, r, a0, a1){
  var x0 = cx + r * Math.sin(a0), y0 = cy - r * Math.cos(a0);
  var x1 = cx + r * Math.sin(a1), y1 = cy - r * Math.cos(a1);
  var large = (a1 - a0) > Math.PI ? 1 : 0;
  return 'M' + cx + ' ' + cy + ' L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z';
}
function fmtTok(n){
  if(n >= 1000000) return (n/1000000).toFixed(1).replace(/\\.0$/,'') + 'M';
  if(n >= 1000) return (n/1000).toFixed(1).replace(/\\.0$/,'') + 'k';
  return String(n);
}
function attachmentTextForTokens(item){
  if(!item) return '';
  if(item.type === 'folder' && item.files){ return item.files.map(function(f){ return f.text || ''; }).join('\\n'); }
  return item.text || '';
}
function updateTokens(){
  var el = byId('tokenPie'); if(!el) return;
  var promptT = estTokens(getPrompt());
  for(var i=0;i<attachedItems.length;i++) promptT += estTokens(attachmentTextForTokens(attachedItems[i]));
  var session = META.tokensTotal || 0;
  var limit = modelLimit();
  var used = Math.min(limit, session);
  var draft = Math.min(limit - used, promptT);
  var TWO_PI = Math.PI * 2;
  var a1 = TWO_PI * (used / limit);
  var a2 = a1 + TWO_PI * (draft / limit);
  if(a1 >= TWO_PI) a1 = TWO_PI - 0.001;
  if(a2 >= TWO_PI) a2 = TWO_PI - 0.001;
  var svg = '<svg viewBox="0 0 20 20">';
  svg += '<circle cx="10" cy="10" r="9" fill="#bdbdbd" stroke="#fff" stroke-width="1"/>';
  if(a1 > 0.001) svg += '<path d="' + pieSlice(10, 10, 9, 0, a1) + '" fill="#111" stroke="#fff" stroke-width="0.5"/>';
  if(a2 > a1 + 0.001) svg += '<path d="' + pieSlice(10, 10, 9, a1, a2) + '" fill="#777" stroke="#fff" stroke-width="0.5"/>';
  svg += '</svg>';
  el.innerHTML = svg;
  var pct = ((used + draft) / limit * 100).toFixed(1);
  el.title = 'Modelo: ' + META.model + '\\nLimite: ' + fmtTok(limit) + ' tokens\\nUsado na sessao: ' + fmtTok(session) + '\\nPrompt atual: ~' + fmtTok(promptT) + '\\nTotal: ~' + pct + '%';
}

function clearMessages(){
  var t = byId('thread');
  if(t){ Array.prototype.slice.call(t.querySelectorAll('.msgRow')).forEach(function(r){ r.parentNode.removeChild(r); }); }
  showWelcome();
  attachedItems = []; renderContextChips();
  setBusy(false); setPrompt(''); updateTokens();
}

function renderRecent(){
  var blk = byId('recentBlock'); var list = byId('recentList');
  if(!blk || !list) return;
  list.innerHTML = '';
  var items = META.recentSessions || [];
  if(!items.length){ blk.style.display = 'none'; return; }
  blk.style.display = 'block';
  items.slice(0, 3).forEach(function(s){
    var div = document.createElement('div'); div.className = 'recentItem';
    var t = document.createElement('div'); t.className = 't'; t.textContent = s.title || 'Sem titulo';
    var m = document.createElement('div'); m.className = 'm';
    var when = s.updatedAt ? new Date(s.updatedAt).toLocaleString() : '';
    m.textContent = (s.messages || 0) + ' msgs - ' + (s.model || 'auto') + ' - ' + when;
    div.appendChild(t); div.appendChild(m);
    div.addEventListener('click', function(){ post({ type: 'loadSession', id: s.id }); });
    list.appendChild(div);
  });
}

function attachmentReference(item){
  if(!item) return '';
  if(item.type === 'folder') return '📎 ' + (item.label || item.base || 'pasta');
  if(item.type === 'file') return '📎 ' + (item.label || item.base || 'arquivo');
  return '📎 Contexto: ' + (item.label || 'selecao');
}
function attachmentFullBlock(item){
  if(!item) return '';
  var fence = String.fromCharCode(96,96,96);
  if(item.type === 'folder'){
    var files = item.files || [];
    var truncNote = item.truncated ? '\\n\\n[NOTA: pasta truncada — exibindo ' + files.length + ' arquivo(s); demais arquivos ignorados por limite ou por serem muito grandes (>1 MB).]' : '';
    return files.map(function(f){
      var lang = f.language || '';
      return '\\n\\nArquivo anexado ' + (f.rel || f.file || f.base || 'arquivo') + ' (' + lang + '):\\n' + fence + lang + '\\n' + (f.text || '') + '\\n' + fence;
    }).join('') + truncNote;
  }
  var heading = item.type === 'file' ? ('Arquivo anexado ' + (item.file || item.label)) : ('Contexto anexado de ' + item.label);
  var fileTruncNote = item.truncated ? '\\n[NOTA: arquivo truncado — exibindo apenas os primeiros bytes por limite de tamanho.]' : '';
  return '\\n\\n' + heading + ' (' + (item.language||'') + '):\\n' + fence + (item.language||'') + '\\n' + (item.text || '') + '\\n' + fence + fileTruncNote;
}

function renderContextChips(){
  var bar = byId('contextChips'); if(!bar) return;
  bar.innerHTML = '';
  attachedItems.forEach(function(sel, idx){
    var chip = document.createElement('span'); chip.className = 'attachChip attached';
    var icn = sel.type === 'folder' ? ICONS.folder : (sel.type === 'file' ? ICONS.file : ICONS.paperclip);
    var icoChip = document.createElement('span'); icoChip.innerHTML = icn;
    var lblChip = document.createElement('span'); lblChip.className = 'lbl'; lblChip.title = sel.file||''; lblChip.textContent = sel.label||'';
    chip.appendChild(icoChip); chip.appendChild(lblChip);
    var rm = document.createElement('button'); rm.className = 'rm'; rm.type = 'button'; rm.title = 'Remover'; rm.innerHTML = ICONS.close;
    rm.addEventListener('click', function(e){ e.stopPropagation(); attachedItems.splice(idx, 1); renderContextChips(); updateTokens(); });
    chip.appendChild(rm);
    bar.appendChild(chip);
  });
  if(pendingSelection && !attachedItems.some(function(a){ return a.label === pendingSelection.label && a.type !== 'file'; })){
    var sug = document.createElement('span'); sug.className = 'attachChip pending'; sug.title = 'Clique para anexar selecao do editor';
    var icoSug = document.createElement('span'); icoSug.innerHTML = ICONS.paperclip;
    var lblSug = document.createElement('span'); lblSug.className = 'lbl'; lblSug.textContent = pendingSelection.label;
    sug.appendChild(icoSug); sug.appendChild(lblSug);
    sug.addEventListener('click', function(){ attachedItems.push(pendingSelection); pendingSelection = null; renderContextChips(); updateTokens(); });
    var x = document.createElement('button'); x.className = 'rm'; x.type = 'button'; x.title = 'Descartar selecao'; x.innerHTML = ICONS.close;
    x.addEventListener('click', function(e){ e.stopPropagation(); pendingSelection = null; renderContextChips(); updateTokens(); });
    sug.appendChild(x);
    bar.appendChild(sug);
  }
}


function addMessage(role, value){
  hideWelcome();
  var thread = byId('thread'); if(!thread) return;
  var row = document.createElement('div');
  row.className = 'msgRow ' + (role === 'user' ? 'user' : 'assistant');
  if(role !== 'user'){ var av = document.createElement('div'); av.className = 'avatar'; av.textContent = 'D'; row.appendChild(av); }
  var msg = document.createElement('div'); msg.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
  if(role !== 'user'){ var meta = document.createElement('div'); meta.className = 'msgMeta'; meta.textContent = 'Devin'; msg.appendChild(meta); }
  renderContent(msg, txt(value));
  row.appendChild(msg);
  thread.appendChild(row);
  thread.scrollTop = thread.scrollHeight;
}
function renderContent(el, value){
  var fence = String.fromCharCode(96,96,96);
  var parts = value.split(fence);
  if(parts.length === 1){ el.appendChild(document.createTextNode(value)); return; }
  for(var i=0;i<parts.length;i++){
    if(i % 2 === 0) el.appendChild(document.createTextNode(parts[i]));
    else { var pre = document.createElement('pre'); var code = document.createElement('code'); code.textContent = parts[i].replace(/^\\w+\\n/, ''); pre.appendChild(code); el.appendChild(pre); }
  }
}

function sendPrompt(value){
  var basePrompt = txt(value).trim();
  if(!basePrompt){ return; }
  if(!META.hasMessages && !META.model){ var mg = byId('modelGate'); if(mg) mg.classList.add('show'); return; }
  var refs = attachedItems.map(attachmentReference).filter(Boolean);
  var displayText = basePrompt + (refs.length ? '\\n\\n' + refs.join(', ') : '');
  var fullText = basePrompt + attachedItems.map(attachmentFullBlock).join('');
  addMessage('user', displayText);
  setPrompt('');
  attachedItems = [];
  renderContextChips();
  setBusy(true);
  post({ type: 'send', text: fullText, displayText: displayText, echo: false });
}


function togglePanel(id, other){
  var p = byId(id); if(!p) return false;
  var open = !p.classList.contains('open');
  if(other){ var o = byId(other); if(o) o.classList.remove('open'); }
  p.classList.toggle('open', open);
  return open;
}

function renderHistory(sessions){
  var list = byId('historyList'); if(!list) return;
  list.innerHTML = '';
  if(!sessions || !sessions.length){ var d = document.createElement('div'); d.className = 'skillItem empty'; d.textContent = 'Sem conversas anteriores.'; list.appendChild(d); return; }
  sessions.forEach(function(s){
    var div = document.createElement('div'); div.className = 'histItem';
    var t = document.createElement('div'); t.className = 't'; t.textContent = s.title || s.id;
    var m = document.createElement('div'); m.className = 'm';
    var when = new Date(s.updatedAt || s.createdAt || Date.now());
    var info = document.createElement('span'); info.textContent = (s.messages||[]).length + ' msgs - ' + (s.model || 'auto') + ' - ' + when.toLocaleString();
    m.appendChild(info);
    var actions = document.createElement('div'); actions.className = 'actions';
    var load = document.createElement('button'); load.type = 'button'; load.textContent = 'Carregar';
    var del = document.createElement('button'); del.type = 'button'; del.textContent = 'Excluir';
    load.addEventListener('click', function(e){ e.stopPropagation(); post({ type: 'loadSession', id: s.id }); byId('historyPanel').classList.remove('open'); });
    del.addEventListener('click', function(e){
      e.stopPropagation();
      if(confirm('Excluir esta conversa do historico?')) post({ type: 'deleteSession', id: s.id });
    });
    actions.appendChild(load); actions.appendChild(del);
    div.appendChild(t); div.appendChild(m); div.appendChild(actions);
    div.addEventListener('dblclick', function(){ post({ type: 'loadSession', id: s.id }); byId('historyPanel').classList.remove('open'); });
    list.appendChild(div);
  });
}

function renderSkills(){
  var list = byId('skillsList'); if(!list) return;
  list.innerHTML = '';
  var skills = META.skills || []; var sel = new Set(META.selectedSkills || []);
  if(!skills.length){ var d = document.createElement('div'); d.className = 'skillItem empty'; d.textContent = 'Nenhuma skill em .devin/skills'; list.appendChild(d); return; }
  skills.forEach(function(name){
    var item = document.createElement('label'); item.className = 'skillItem';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = sel.has(name);
    cb.addEventListener('change', function(){ post({ type: 'toggleSkill', value: name }); });
    var span = document.createElement('span'); span.textContent = name;
    item.appendChild(cb); item.appendChild(span);
    list.appendChild(item);
  });
  var btn = byId('skillsBtn'); if(btn) btn.classList.toggle('has', sel.size > 0);
  var c = byId('skillsCount'); if(c) c.textContent = sel.size;
}

function closeAllMenus(){
  document.querySelectorAll('.menu').forEach(function(m){ m.parentNode && m.parentNode.removeChild(m); });
  openMenu = null;
}

function buildMenu(items, anchor, onPick, level){
  var menu = document.createElement('div'); menu.className = 'menu';
  menu.dataset.level = level;
  if(!items || !items.length){ var e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Nenhuma opcao'; menu.appendChild(e); }
  items.forEach(function(it){
    var row = document.createElement('div'); row.className = 'item';
    var lbl = document.createElement('span'); lbl.textContent = it.label;
    row.appendChild(lbl);
    if(it.children && it.children.length){
      var arr = document.createElement('span'); arr.className = 'arrow'; arr.innerHTML = ICONS.caret;
      row.appendChild(arr);
      row.addEventListener('mouseenter', function(){
        document.querySelectorAll('.menu').forEach(function(m){ if(Number(m.dataset.level) > level) m.parentNode && m.parentNode.removeChild(m); });
        Array.prototype.slice.call(menu.querySelectorAll('.item.activeHover')).forEach(function(x){ x.classList.remove('activeHover'); });
        row.classList.add('activeHover');
        var sub = buildMenu(it.children, row, onPick, level + 1);
        positionMenuBeside(sub, row);
      });
      row.addEventListener('click', function(ev){ ev.stopPropagation(); });
    } else {
      if(it.value === META.model) row.classList.add('selected');
      row.addEventListener('mouseenter', function(){
        document.querySelectorAll('.menu').forEach(function(m){ if(Number(m.dataset.level) > level) m.parentNode && m.parentNode.removeChild(m); });
      });
      row.addEventListener('click', function(ev){ ev.stopPropagation(); onPick(it.value); closeAllMenus(); });
    }
    menu.appendChild(row);
  });
  document.body.appendChild(menu);
  return menu;
}

function positionMenuAnchor(menu, anchor){
  var r = anchor.getBoundingClientRect();
  var mw = menu.offsetWidth || 220;
  var mh = menu.offsetHeight || 200;
  var top = r.top - mh - 4;
  if(top < 8) top = r.bottom + 4;
  var left = r.left;
  if(left + mw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - mw - 8);
  menu.style.left = left + 'px'; menu.style.top = top + 'px';
}
function positionMenuBeside(menu, anchorRow){
  var r = anchorRow.getBoundingClientRect();
  var mw = menu.offsetWidth || 220;
  var mh = menu.offsetHeight || 200;
  var left = r.right + 2;
  if(left + mw > window.innerWidth - 8) left = Math.max(8, r.left - mw - 2);
  var top = r.top;
  if(top + mh > window.innerHeight - 8) top = Math.max(8, window.innerHeight - mh - 8);
  menu.style.left = left + 'px'; menu.style.top = top + 'px';
}

function openModelMenu(){
  closeAllMenus();
  var anchor = byId('modelChip');
  var menu = buildMenu(MODEL_TREE, anchor, function(value){ post({ type: 'setModel', value: value || 'auto' }); }, 1);
  positionMenuAnchor(menu, anchor);
  openMenu = 'model';
}

function openAgentMenu(){
  closeAllMenus();
  var anchor = byId('agentChip');
  var items = (META.agents || ['auto']).map(function(a){ return { label: a, value: a }; });
  var menu = buildMenu(items, anchor, function(value){ post({ type: 'setAgent', value: value }); }, 1);
  positionMenuAnchor(menu, anchor);
  openMenu = 'agent';
}

function openModeMenu(){
  closeAllMenus();
  var anchor = byId('modeChip');
  var items = [
    { label: 'Integrado (resposta no chat)', value: 'resposta-integrada' },
    { label: 'Terminal', value: 'terminal' }
  ];
  var menu = buildMenu(items, anchor, function(value){ post({ type: 'setMode', value: value }); }, 1);
  positionMenuAnchor(menu, anchor);
  openMenu = 'mode';
}

function openSkillsMenu(){
  closeAllMenus();
  var anchor = byId('skillsBtn');
  var menu = document.createElement('div'); menu.className = 'menu'; menu.dataset.level = 1;
  var head = document.createElement('div'); head.className = 'head';
  var title = document.createElement('span'); title.textContent = 'Skills disponiveis';
  var sp = document.createElement('span'); sp.className = 'barSpacer';
  head.appendChild(title); head.appendChild(sp);
  menu.appendChild(head);
  var skills = META.skills || []; var sel = new Set(META.selectedSkills || []);
  if(!skills.length){ var e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Nenhuma skill em .devin/skills'; menu.appendChild(e); }
  skills.forEach(function(name){
    var lab = document.createElement('label'); lab.className = 'check';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = sel.has(name);
    cb.addEventListener('change', function(ev){ ev.stopPropagation(); post({ type: 'toggleSkill', value: name }); if(cb.checked) sel.add(name); else sel.delete(name); });
    var span = document.createElement('span'); span.textContent = name;
    lab.appendChild(cb); lab.appendChild(span);
    lab.addEventListener('click', function(ev){ ev.stopPropagation(); });
    menu.appendChild(lab);
  });
  document.body.appendChild(menu);
  positionMenuAnchor(menu, anchor);
  openMenu = 'skills';
}

var browserPath = '';
var browserMenuEl = null;
function openAttachBrowser(){
  closeAllMenus();
  var anchor = byId('attachBtn');
  var menu = document.createElement('div'); menu.className = 'menu browser'; menu.dataset.level = 1;
  browserMenuEl = menu;
  document.body.appendChild(menu);
  positionMenuAnchor(menu, anchor);
  openMenu = 'attach';
  browserPath = '';
  renderBrowserLoading();
  post({ type: 'listWorkspace', path: '' });
}
function renderBrowserLoading(){
  if(!browserMenuEl) return;
  browserMenuEl.innerHTML = '';
  var head = document.createElement('div'); head.className = 'head';
  head.appendChild(document.createTextNode('Carregando...'));
  browserMenuEl.appendChild(head);
}
function fmtSize(n){ if(n>=1048576) return (n/1048576).toFixed(1)+'MB'; if(n>=1024) return (n/1024).toFixed(1)+'KB'; return n+'B'; }
function renderBrowser(payload){
  if(!browserMenuEl || openMenu !== 'attach') return;
  var menu = browserMenuEl;
  menu.innerHTML = '';
  var head = document.createElement('div'); head.className = 'head';
  var crumbs = document.createElement('span'); crumbs.style.flex = '1'; crumbs.style.overflow = 'hidden'; crumbs.style.textOverflow = 'ellipsis'; crumbs.style.whiteSpace = 'nowrap';
  var parts = (payload.path || '').split('/').filter(Boolean);
  var cum = '';
  function crumb(label, p){
    var a = document.createElement('a'); a.textContent = label; a.style.color = 'var(--accent)'; a.style.cursor = 'pointer'; a.style.marginRight = '4px';
    a.addEventListener('click', function(ev){ ev.stopPropagation(); browserPath = p; renderBrowserLoading(); post({ type: 'listWorkspace', path: p }); });
    crumbs.appendChild(a);
  }
  crumb('/', '');
  parts.forEach(function(p, i){ cum = cum ? cum + '/' + p : p; var sep = document.createElement('span'); sep.textContent = '/ '; sep.style.color = 'var(--muted)'; crumbs.appendChild(sep); crumb(p, cum); });
  head.appendChild(crumbs);
  if(payload.path){
    var attachAll = document.createElement('button'); attachAll.textContent = '+ pasta'; attachAll.title = 'Anexar pasta inteira';
    attachAll.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'attachFolder', path: payload.path }); closeAllMenus(); });
    head.appendChild(attachAll);
  }
  var disk = document.createElement('button'); disk.textContent = 'disco...'; disk.title = 'Anexar arquivos do disco (fora do workspace)';
  disk.addEventListener('click', function(ev){ ev.stopPropagation(); closeAllMenus(); post({ type: 'attachFiles' }); });
  head.appendChild(disk);
  menu.appendChild(head);

  if(payload.error){ var e = document.createElement('div'); e.className = 'empty'; e.textContent = payload.error; menu.appendChild(e); return; }
  var entries = payload.entries || [];
  if(payload.path){
    var up = document.createElement('div'); up.className = 'item';
    up.innerHTML = ICONS.caret + '<span style="margin-left:6px">..</span>';
    up.addEventListener('click', function(ev){ ev.stopPropagation(); var newP = parts.slice(0, parts.length - 1).join('/'); browserPath = newP; renderBrowserLoading(); post({ type: 'listWorkspace', path: newP }); });
    menu.appendChild(up);
  }
  if(!entries.length){ var em = document.createElement('div'); em.className = 'empty'; em.textContent = 'Pasta vazia.'; menu.appendChild(em); return; }
  entries.forEach(function(e){
    var row = document.createElement('div'); row.className = 'item browserItem';
    var left = document.createElement('span'); left.style.display = 'inline-flex'; left.style.alignItems = 'center'; left.style.gap = '6px'; left.style.overflow = 'hidden';
    var icoL = document.createElement('span'); icoL.innerHTML = e.isDir ? ICONS.folder : ICONS.file;
    var nmL = document.createElement('span'); nmL.style.overflow='hidden'; nmL.style.textOverflow='ellipsis'; nmL.style.whiteSpace='nowrap'; nmL.textContent = e.name;
    left.appendChild(icoL); left.appendChild(nmL);
    var right = document.createElement('span'); right.style.display = 'inline-flex'; right.style.alignItems = 'center'; right.style.gap = '6px';
    var fullPath = (payload.path ? payload.path + '/' : '') + e.name;
    if(e.isDir){
      var addBtn = document.createElement('button'); addBtn.textContent = '+'; addBtn.title = 'Anexar pasta'; addBtn.className = 'rowBtn';
      addBtn.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'attachFolder', path: fullPath }); closeAllMenus(); });
      right.appendChild(addBtn);
      row.addEventListener('click', function(ev){ ev.stopPropagation(); browserPath = fullPath; renderBrowserLoading(); post({ type: 'listWorkspace', path: fullPath }); });
    } else {
      var sz = document.createElement('span'); sz.style.color = 'var(--muted)'; sz.style.fontSize = '10px'; sz.textContent = fmtSize(e.size || 0);
      right.appendChild(sz);
      row.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'attachWorkspacePath', path: fullPath }); closeAllMenus(); });
    }
    row.appendChild(left); row.appendChild(right);
    menu.appendChild(row);
  });
  if(pendingSelection){
    var hr = document.createElement('div'); hr.className = 'head'; hr.textContent = 'Sugerido';
    menu.appendChild(hr);
    var sel = document.createElement('div'); sel.className = 'item';
    var icoPend = document.createElement('span'); icoPend.innerHTML = ICONS.paperclip;
    var lblPend = document.createElement('span'); lblPend.style.marginLeft = '6px'; lblPend.textContent = pendingSelection.label;
    sel.appendChild(icoPend); sel.appendChild(lblPend);
    sel.addEventListener('click', function(ev){ ev.stopPropagation(); attachedItems.push(pendingSelection); pendingSelection = null; renderContextChips(); updateTokens(); closeAllMenus(); });
    menu.appendChild(sel);
  }
}

function clientError(context, err){
  var msg = err && err.message ? err.message : String(err || 'erro desconhecido');
  try { console.error(context, err); } catch(_){}
  try { post({ type: 'clientError', text: context + ': ' + msg }); } catch(_){}
}

function action(name, element){
  if(name === 'send') return sendPrompt(getPrompt());
  if(name === 'newChat'){ post({ type: 'newChat' }); return; }
  if(name === 'terminal') return post({ type: 'terminal', text: getPrompt() });
  if(name === 'refreshModels') return post({ type: 'refreshModels' });
  if(name === 'review'){ setBusy(true); return post({ type: 'review' }); }
  if(name === 'selection'){ setBusy(true); return post({ type: 'selection' }); }
  if(name === 'starter') return sendPrompt(element.getAttribute('data-prompt') || '');
  if(name === 'toggleHistory'){ if(togglePanel('historyPanel')) post({ type: 'getHistory' }); return; }
  if(name === 'openSkillsMenu') return openSkillsMenu();
  if(name === 'clearHistory'){ if(confirm('Limpar todo o historico?')) post({ type: 'clearHistory' }); return; }
  if(name === 'openModelMenu') return openModelMenu();
  if(name === 'openAgentMenu') return openAgentMenu();
  if(name === 'openModeMenu') return openModeMenu();
  if(name === 'attachMenu') return post({ type: 'attachMenu' });
  if(name === 'verifyCli') return post({ type: 'verifyCli' });
  if(name === 'cancelRun') return post({ type: 'cancelRun' });
}

document.addEventListener('click', function(e){
  var b = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
  if(!b){ if(!e.target.closest('.menu')) closeAllMenus(); return; }
  e.preventDefault();
  closeAllMenus();
  try { action(b.getAttribute('data-action'), b); } catch(err){ clientError('acao ' + b.getAttribute('data-action'), err); }
});

var pe = byId('prompt');
if(pe){
  pe.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); sendPrompt(getPrompt()); } });
  pe.addEventListener('input', updateTokens);
}

function applyResponsive(){
  var w = window.innerWidth;
  document.body.classList.toggle('narrow', w < 520);
}
window.addEventListener('resize', applyResponsive);
applyResponsive();
window.addEventListener('error', function(ev){ clientError('erro no webview', ev.error || ev.message); });
window.addEventListener('unhandledrejection', function(ev){ clientError('promise rejeitada no webview', ev.reason || 'sem motivo'); });

window.addEventListener('message', function(ev){
  var m = ev.data || {};
  if(m.type === 'meta'){
    META.skills = m.skills || []; META.selectedSkills = m.selectedSkills || [];
    META.modelLocked = !!m.modelLocked; META.hasMessages = !!m.hasMessages;
    META.model = m.model || 'auto'; META.agent = m.agent || 'auto'; META.mode = m.mode || 'resposta-integrada';
    META.agents = m.agents || ['auto'];
    META.tokensTotal = m.tokensTotal || 0; META.tokensIn = m.tokensIn || 0; META.tokensOut = m.tokensOut || 0;
    META.recentSessions = m.recentSessions || [];

    var modelChip = byId('modelChip');
    var modelText = byId('modelChipText');
    if(modelText) modelText.textContent = META.model || 'Modelo';
    if(modelChip){ modelChip.disabled = false; modelChip.classList.toggle('has', !!META.model); }
    var agentText = byId('agentChipText'); if(agentText) agentText.textContent = META.agent === 'auto' ? 'Agente' : META.agent;
    var agentChip = byId('agentChip'); if(agentChip) agentChip.classList.toggle('has', META.agent !== 'auto');
    var modeText = byId('modeChipText'); if(modeText) modeText.textContent = META.mode === 'terminal' ? 'Terminal' : 'Integrado';
    var c = byId('skillsCount'); if(c) c.textContent = (META.selectedSkills || []).length;
    var sb = byId('skillsBtn'); if(sb) sb.classList.toggle('has', (META.selectedSkills || []).length > 0);

    if(openMenu === 'skills'){ openSkillsMenu(); }
    renderRecent();
    updateGate(); updateTokens();
  }
  if(m.type === 'message') addMessage(m.role || 'assistant', m.text || '');
  if(m.type === 'busy') setBusy(!!m.value);
  if(m.type === 'insertPrompt') appendPrompt(m.text || '');
  if(m.type === 'history') renderHistory(m.sessions || []);
  if(m.type === 'openHistory'){ renderHistory(m.sessions || []); var hp = byId('historyPanel'); if(hp) hp.classList.add('open'); }
  if(m.type === 'clearThread') clearMessages();
  if(m.type === 'selectionAvailable'){ pendingSelection = m.selection || null; renderContextChips(); updateTokens(); }
  if(m.type === 'attachItems'){
    var arr = m.items || [];
    for(var i=0;i<arr.length;i++) attachedItems.push(arr[i]);
    renderContextChips(); updateTokens();
  }
  if(m.type === 'workspaceList'){ renderBrowser(m); }
});

setBusy(false); updateTokens(); renderContextChips();
post({ type: 'ready' });
})();
</script></body></html>`;
    }
}
async function activate(context) {
    extContext = context;
    outputChannel = vscode.window.createOutputChannel('Devin Cli Chat');
    context.subscriptions.push(outputChannel);
    log(`Extensão ativando — VS Code ${vscode.version}, extensão ${context.extension.packageJSON.version}`);
    log(`Plataforma: ${process.platform} ${process.arch}`);
    log(`Devin CLI path configurado: ${devinPath()}`);
    log(`Workspace: ${workspaceRoot() || 'nenhum'}`);
    provider = new ChatViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('devinCliChat.chatView', provider, { webviewOptions: { retainContextWhenHidden: true } }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.abrirPainel', async () => vscode.commands.executeCommand('workbench.view.extension.devinCliChat')));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.abrirHistorico', async () => {
        await vscode.commands.executeCommand('workbench.view.extension.devinCliChat');
        setTimeout(() => { if (provider)
            provider.openHistory(); }, 100);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.novaSessao', () => openTerminal('')));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.revisarDiff', async () => {
        await vscode.commands.executeCommand('workbench.view.extension.devinCliChat');
        if (provider)
            await provider.send('Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n' + gitDiff() + '\n```');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.enviarSelecao', async () => {
        await vscode.commands.executeCommand('workbench.view.extension.devinCliChat');
        if (provider)
            await provider.send('Analise o contexto do editor atual.\n\n' + activeContext());
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarModelo', pickModel));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.definirModeloManual', pickManualModel));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.atualizarModelos', async () => {
        invalidateMetaCache();
        if (provider)
            provider.refreshMeta();
        const extra = await discoverModelsFromCli();
        if (extra.length) {
            const merged = Array.from(new Set([...(cfg().get('modelosDisponiveis') || []), ...extra]));
            await cfg().update('modelosDisponiveis', merged, vscode.ConfigurationTarget.Workspace);
            invalidateMetaCache();
        }
        if (provider)
            provider.refreshMeta();
        vscode.window.showInformationMessage(`Modelos atualizados (${modelsForUi().length} disponiveis).`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarAgente', async () => {
        const pick = await vscode.window.showQuickPick(scanAgents(), { placeHolder: 'Selecione o agente Devin' });
        if (pick)
            await setConfig('agenteAtual', pick);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarSkills', pickSkills));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.selecionarModo', async () => {
        const pick = await vscode.window.showQuickPick([
            { label: 'Integrado (resposta no chat)', value: 'resposta-integrada' },
            { label: 'Terminal', value: 'terminal' }
        ], { placeHolder: 'Selecione o modo de execucao' });
        if (pick)
            await setConfig('modoExecucaoChat', pick.value);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.limparHistorico', async () => {
        const ok = await vscode.window.showWarningMessage('Limpar todo o historico de chats?', { modal: true }, 'Limpar');
        if (ok === 'Limpar') {
            await saveHistory([]);
            if (provider)
                provider.post({ type: 'history', sessions: [] });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devinCliChat.verificarCli', () => {
        outputChannel.show(true);
        log(`Verificando Devin CLI: ${devinPath()}`);
        cp.execFile(devinPath(), ['--version'], { cwd: defaultCwd(), windowsHide: true }, (err, stdout, stderr) => {
            if (err) {
                log(`verificarCli ERRO: code=${err.code} msg=${err.message}`);
                vscode.window.showErrorMessage(`Falha ao verificar Devin CLI: ${err.message}`);
            }
            else {
                const version = (stdout || stderr || 'ok').trim();
                log(`verificarCli OK: ${version}`);
                vscode.window.showInformationMessage(`Devin CLI encontrado: ${version}`);
            }
        });
    }));
    let selectionTimer;
    const fireSelection = () => {
        if (selectionTimer)
            clearTimeout(selectionTimer);
        selectionTimer = setTimeout(() => { if (provider)
            provider.pushCurrentSelection(true); }, 150);
    };
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(fireSelection));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(fireSelection));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(EXT)) {
            invalidateMetaCache();
            updateStatusBar();
            if (provider)
                provider.refreshMeta();
        }
    }));
    updateStatusBar();
}
function deactivate() { }
module.exports = {
    activate,
    deactivate,
    _internal: { baseArgs, fullPrompt, runIntegrated, modelsForUi, scanAgents, scanSkills, loadHistory, saveHistory, sanitizeModel, isSafeModelId, cancelIntegratedRun }
};
