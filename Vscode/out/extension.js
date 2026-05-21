"use strict";var c=require("vscode"),p=require("fs"),r=require("path"),x=require("os"),D=require("child_process"),ge="devinCliChat",Ne=["auto","sonnet","opus","swe","gpt"],ee=["auto","adaptive","sonnet","opus","swe","gpt","codex"],xe="devinCliChat.chatHistory.v1",Fe=50,Z=1024*1024,X=50,ze=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),v,E,O,I,w,T=!1,F={at:0,values:void 0},z={at:0,values:void 0},H={at:0,values:void 0};function m(n){let t=new Date().toISOString();I&&I.appendLine(`[${t}] ${n}`)}function be(){return 1e4}function He(){return Math.max(0,Number(u().get("cacheModelosMs")||18e5))}function q(){F={at:0,values:void 0},z={at:0,values:void 0},H={at:0,values:void 0}}function ye(n){return/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$/.test(String(n||"").trim())}function u(){return c.workspace.getConfiguration(ge)}function g(){return c.workspace.workspaceFolders&&c.workspace.workspaceFolders[0]?c.workspace.workspaceFolders[0].uri.fsPath:void 0}function j(){return c.workspace.workspaceFolders&&c.workspace.workspaceFolders[0]?c.workspace.workspaceFolders[0].name:"sem pasta aberta"}function we(n){if(!n)return n;let t=String(n);return t==="~"?x.homedir():t.startsWith("~/")||t.startsWith("~\\")?r.join(x.homedir(),t.slice(2)):t}function S(n){let t=we(n);return t&&(r.isAbsolute(t)?t:r.join(g()||x.homedir(),t))}function ie(n){try{return!!n&&p.existsSync(n)}catch{return!1}}function L(n){return`'${String(n).replace(/'/g,"'\\''")}'`}function $(n){let t=String(n||"").trim().toLowerCase();return!t||t==="default"||t==="padrao"||t==="padr\xE3o"?"auto":ye(t)?t:"auto"}function ke(n){return $(n)}function he(){return[...ee]}function je(n){try{return ie(n)?JSON.parse(p.readFileSync(n,"utf8")):void 0}catch{return}}function _e(){if(process.platform==="win32"){let n=process.env.APPDATA||r.join(x.homedir(),"AppData","Roaming");return r.join(n,"devin","config.json")}return r.join(x.homedir(),".config","devin","config.json")}function se(){let n=je(_e());return n&&n.agent?ke(n.agent.model):void 0}function k(){return ke(u().get("modeloAtual")||se()||"auto")}function Ce(){return $(u().get("modeloAtual")||se()||"auto")}function U(){return String(u().get("agenteAtual")||"auto")}function G(){return String(u().get("modoExecucaoChat")||"resposta-integrada")}function P(){let n=u().get("skillsSelecionadas")||[];return Array.isArray(n)?n.map(String).filter(Boolean):[]}function b(){return String(u().get("caminhoDevin")||"devin")}function C(){return g()||x.homedir()}function fe(n){try{if(p.existsSync(n))return p.realpathSync.native?p.realpathSync.native(n):p.realpathSync(n)}catch{}return r.resolve(n)}function Oe(n,t){let a=r.relative(n,t);return a===""||!!a&&!a.startsWith("..")&&!r.isAbsolute(a)}function V(n){let t=g();if(!t)return null;let a=fe(t),e=String(n||"").replace(/\\/g,r.sep).trim(),o=r.isAbsolute(e)?r.resolve(e):r.resolve(a,e),i=fe(o);return Oe(a,i)?i:null}function Se(){return[we(u().get("gitBashPath")),process.env.GIT_BASH_PATH,"C:\\Program Files\\Git\\bin\\bash.exe","C:\\Program Files\\Git\\usr\\bin\\bash.exe","C:\\Program Files (x86)\\Git\\bin\\bash.exe",r.join(x.homedir(),"AppData","Local","Programs","Git","bin","bash.exe")].filter(Boolean).find(ie)}function Re(){return process.platform==="win32"&&u().get("usarGitBashNoWindows",!0)?Se():process.env.SHELL||void 0}function J(){let n=[...(u().get("argumentosPadrao")||[]).map(String).filter(Boolean)],t=String(u().get("argumentoModelo")||"").trim(),a=Ce();return t&&a&&a!=="auto"&&n.push(t,a),n}function B(n){let t=u().get("prefixoPromptPadrao")||"",a=Ce()||k()||"auto",e=U(),o=P(),i=[`Workspace VS Code: ${j()}`,g()?`Diretorio raiz: ${g()}`:"Diretorio raiz: nao ha pasta aberta",`Modelo selecionado: ${a}`,`Agente selecionado: ${e}`,o.length?`Skills disponiveis: ${o.join(", ")}`:""].filter(Boolean).join(`
`),l=e!=="auto"?`Use o perfil/subagente Devin chamado "${e}" quando aplicavel. Se a CLI nao aceitar selecao direta de agente nesta chamada, trate este agente como persona operacional e siga as instrucoes do respectivo AGENT.md.`:"",s=o.length?`Invoque a skill via tool 'skill' quando aplicavel: ${o.map(d=>`"${d}"`).join(", ")}. Siga as instrucoes do respectivo SKILL.md.`:"";return[t,i,l,s,n].filter(Boolean).join(`

`)}function We(n){let t=L(b()),a=J().map(L).join(" ");return n?[t,a,"-p","--",L(B(n))].filter(Boolean).join(" "):[t,a].filter(Boolean).join(" ")}function qe(n){return n?String(n).split(/\r?\n/).filter(t=>!/were not migrated because they already exist/i.test(t)).filter(t=>!/migration.*already exist/i.test(t)).join(`
`).trim():""}function Me(n,t,a){let e=qe(t),o=[n||"",e||"",a&&a.message?a.message:""].join(`
`);if(/No active model set in cog manager/i.test(o))return["Modelo Devin nao configurado para esta execucao.","","A extensao tentou enviar o alias selecionado, mas o Devin CLI informou que nao ha modelo ativo no cog manager.","","Acoes recomendadas:",`1. Execute no terminal: devin model set ${k()||"auto"}`,"2. Se houver conflito de migracao de config, mantenha apenas o valor desejado em agent.model no config.json do Devin.","3. No chat, reabra o seletor de modelo e escolha um dos aliases validos: auto, sonnet, opus, swe, gpt."].join(`
`);let i=[];return n&&n.trim()&&i.push(n.trim()),e&&i.push(`STDERR:
${e}`),a&&i.push(`Falha ao executar Devin CLI: ${a.message}`),i.join(`

`)||"Sem saida do Devin CLI."}function te(n){let t=Re(),a=c.window.createTerminal({name:u().get("nomeTerminal")||"Devin Cli Chat",cwd:C(),shellPath:t,shellArgs:process.platform==="win32"&&t?["--login","-i"]:void 0});a.show(!0),a.sendText(We(n))}function re(){if(T=!0,!w||w.killed)return!1;try{return w.kill(),!0}catch(n){return m(`cancelIntegratedRun erro: ${n&&n.message?n.message:String(n)}`),!1}}function Ee(n){return new Promise(t=>{T=!1;let a=[...J(),"-p","--",B(n)];m(`runIntegrated: ${b()} ${a.slice(0,-1).join(" ")} -- [prompt ${B(n).length} chars]`),m(`  cwd: ${C()}`);let e=!1;function o(i){e||(e=!0,w=void 0,t(i))}try{w=D.execFile(b(),a,{cwd:C(),timeout:Number(u().get("timeoutChatMs")||3e5),maxBuffer:1024*1024*16,windowsHide:!0},(i,l,s)=>{if(T){o("Execucao cancelada pelo usuario.");return}if(i&&m(`runIntegrated erro: code=${i.code} signal=${i.signal} killed=${i.killed} msg=${i.message}`),s&&s.trim()&&m(`runIntegrated stderr: ${s.slice(0,500)}`),l&&l.trim()&&m(`runIntegrated stdout: ${l.slice(0,200)}...`),i&&process.platform==="win32"){Y(n,i).then(o);return}o(Me(l,s,i))}),w.on("error",i=>{if(m(`runIntegrated child error: ${i.message}`),T){o("Execucao cancelada pelo usuario.");return}process.platform==="win32"?Y(n,i).then(o):o(`Falha ao iniciar Devin CLI: ${i.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)})}catch(i){if(m(`runIntegrated catch: ${i.message}`),T){o("Execucao cancelada pelo usuario.");return}process.platform==="win32"?Y(n,i).then(o):o(`Falha ao iniciar Devin CLI: ${i.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)}})}function Y(n,t){return new Promise(a=>{let e=Se();if(!e){a(`Falha ao executar Devin CLI: ${t.message}

Git Bash nao foi encontrado. Configure devinCliChat.gitBashPath ou ajuste devinCliChat.caminhoDevin.`);return}let o=J().map(L).join(" "),i=`${L(b())} ${o} -p -- ${L(B(n))}`;w=D.exec(i,{cwd:C(),shell:e,timeout:Number(u().get("timeoutChatMs")||3e5),maxBuffer:1024*1024*16},(l,s,d)=>{if(w=void 0,T){a("Execucao cancelada pelo usuario.");return}let h=Me(s,d,l);a(h.replace("Falha ao executar Devin CLI:","Falha ao executar Devin CLI via Git Bash:"))})})}async function y(n,t){await u().update(n,t,c.ConfigurationTarget.Workspace),q(),ae(),v&&v.refreshMeta()}function Ge(){let n=u().get("modelosDisponiveis")||[];return Array.isArray(n)?n.map(String).map(t=>t.trim()).filter(Boolean):[]}function Ve(){let n=u().get("arquivosCacheModelos")||[],t=Array.isArray(n)?n.map(S).filter(Boolean):[];if(process.platform==="win32"){let a=process.env.LOCALAPPDATA||r.join(x.homedir(),"AppData","Local");t.push(r.join(a,"Devin","CLI","team_settings.bin")),t.push(r.join(a,"Devin","CLI","model_configs.bin"))}else t.push(r.join(x.homedir(),".local","share","Devin","CLI","team_settings.bin")),t.push(r.join(x.homedir(),".local","share","Devin","CLI","model_configs.bin"));return Array.from(new Set(t))}function Ae(n){return Ne.includes(String(n||"").trim().toLowerCase())}function Ue(){let n=Number(u().get("limiteBytesCacheModelos")||5242880),t=[];for(let a of Ve())try{if(!ie(a))continue;let e=p.statSync(a);if(!e.isFile()||e.size>n)continue;let l=p.readFileSync(a).toString("utf8").match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g)||[];for(let s of l)Ae(s)&&t.push(s)}catch{}return Array.from(new Set(t))}function Te(){return new Promise(n=>{let t=String(u().get("comandoDescobertaModelos")||"").trim();if(!t){n([]);return}try{D.execFile(b(),t.split(/\s+/),{cwd:C(),timeout:Number(u().get("timeoutDescobertaModelosMs")||2500),windowsHide:!0},(a,e)=>{if(a||!e){n([]);return}try{let i=JSON.parse(e),l=Array.isArray(i)?i:i&&i.models||[];n(l.map(s=>typeof s=="string"?s:s&&(s.name||s.id)).filter(Boolean));return}catch{}let o=e.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g)||[];n(o.filter(Ae))})}catch{n([])}})}function R(){let n=He(),t=Date.now();if(n>0&&F.values&&t-F.at<n)return F.values;let a=[k(),se(),...Ge(),...Ue(),...he()].map($).filter(Boolean),e=Array.from(new Set([...he(),...a]));return F={at:t,values:e},e}function le(){let n=Date.now();if(z.values&&n-z.at<be())return z.values;let t=[S(u().get("diretorioAgentesWorkspace")||".devin/agents"),S(u().get("diretorioAgentesGlobal")||"~/.config/devin/agents")],a=["auto"];for(let o of t)try{if(!o||!p.existsSync(o))continue;for(let i of p.readdirSync(o)){let l=r.join(o,i,"AGENT.md");p.existsSync(l)&&a.push(i)}}catch{}let e=Array.from(new Set(a));return z={at:n,values:e},e}function ce(){let n=Date.now();if(H.values&&n-H.at<be())return H.values;let t=[S(u().get("diretorioSkillsWorkspace")||".devin/skills"),S(u().get("diretorioSkillsGlobal")||"~/.config/devin/skills"),S(".claude/skills"),S("~/.claude/skills")],a=[];for(let o of t)try{if(!o||!p.existsSync(o))continue;for(let i of p.readdirSync(o)){let l=r.join(o,i,"SKILL.md");p.existsSync(l)&&a.push(i)}}catch{}let e=Array.from(new Set(a)).sort();return H={at:n,values:e},e}function ne(){let n=c.window.activeTextEditor;if(!n)return"Nenhum editor ativo.";let t=n.document,a=n.selection&&!n.selection.isEmpty?t.getText(n.selection):t.getText();return[`Arquivo: ${t.uri.fsPath}`,"Conteudo:","```",a.slice(0,6e4),"```"].join(`
`)}function ve(n){return n?Math.max(1,Math.ceil(String(n).length/4)):0}function Je(n){if(!n||!n.selection||n.selection.isEmpty)return null;let t=n.document,a=n.selection,e=t.getText(a);if(!e||!e.trim())return null;let o=t.uri.fsPath,i=r.basename(o),l=a.start.line+1,s=a.end.line+1;return{id:"sel-"+Date.now().toString(36),file:o,base:i,language:t.languageId,startLine:l,endLine:s,text:e,preview:e.split(`
`).slice(0,2).join(" ").slice(0,80),label:`${i}:${l}-${s}`}}function Ie(){try{if(u().get("usarContextoEditorAutomatico")===!1)return null;let t=String(u().get("modoContextoEditorAutomatico")||"selecao-ou-arquivo");if(t==="desativado")return null;let a=c.window.activeTextEditor;if(!a)return null;let e=a.document;if(!e||!e.uri||e.uri.scheme!=="file")return null;let o=e.uri.fsPath,i=r.basename(o),l=e.languageId||r.extname(o).slice(1)||"",s="```",d=a.selection,h=!!(d&&!d.isEmpty);if(t!=="somente-arquivo"&&h){let Q=e.getText(d);if(!Q||!Q.trim())return null;let Be=d.start.line+1,De=d.end.line+1,me=`${i}:${Be}-${De}`,$e=["","",`[Contexto automatico do editor: ${me}]`,s+l,Q,s].join(`
`);return{label:me,promptBlock:$e}}if(t==="somente-selecao")return null;let f=e.getText();if(!f||!f.trim())return null;let N=Number(u().get("limiteBytesContextoEditorAutomatico")),M=Number.isFinite(N)&&N>0?N:2e5,W=Buffer.from(f,"utf8"),K=W.length>M,Pe=K?W.subarray(0,M).toString("utf8"):f,pe=K?`${i} (truncado)`:i,ue=["","",`[Contexto automatico do editor: ${pe}]`,s+l,Pe,s];return K&&ue.push(`[NOTA: arquivo truncado em ${M} bytes para limitar o tamanho do contexto automatico.]`),{label:pe,promptBlock:ue.join(`
`)}}catch{return null}}function Le(){try{return D.execFileSync("git",["diff","--no-ext-diff"],{cwd:C(),encoding:"utf8",maxBuffer:1024*1024*8,windowsHide:!0})}catch(n){return`Nao foi possivel obter git diff: ${n.message}`}}function ae(){E||(E=c.window.createStatusBarItem(c.StatusBarAlignment.Right,90),E.command="devinCliChat.abrirPainel",E.show()),E.text=`Devin: ${k()} / ${U()}`,E.tooltip=`Workspace: ${j()} | Modo: ${G()} | Skills: ${P().length}`}async function de(){let n=await c.window.showInputBox({title:"Modelo Devin",prompt:"Aliases aceitos pelo Devin CLI nesta build: auto, sonnet, opus, swe, gpt.",value:k()==="auto"?"":k()});if(!n||!n.trim())return;let t=$(n);t!==String(n).trim().toLowerCase()&&c.window.showInformationMessage(`Modelo "${n.trim()}" nao e aceito por esta versao do Devin CLI. Usando "${t}".`),await y("modeloAtual",t)}async function Ke(){let n=await c.window.showQuickPick([...R(),"+ Informar modelo manual"],{placeHolder:"Selecione o modelo Devin"});if(n){if(n.startsWith("+"))return de();await y("modeloAtual",n)}}async function Qe(){let n=ce();if(!n.length){c.window.showInformationMessage("Nenhuma skill encontrada em .devin/skills ou ~/.config/devin/skills.");return}let t=new Set(P()),a=n.map(o=>({label:o,picked:t.has(o)})),e=await c.window.showQuickPick(a,{canPickMany:!0,placeHolder:"Selecione skills disponiveis para o Devin"});e&&await y("skillsSelecionadas",e.map(o=>o.label))}function A(){try{return O&&O.globalState.get(xe)||[]}catch{return[]}}async function _(n){try{O&&await O.globalState.update(xe,n.slice(0,Fe))}catch{}}var oe=class{constructor(t){this.context=t,this.view=void 0,this.busy=!1,this.session=this.newSession()}newSession(){return{id:"sess-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6),title:"Nova conversa",createdAt:Date.now(),updatedAt:Date.now(),workspace:j(),model:k(),agent:U(),mode:G(),skills:P(),messages:[]}}async persistSession(){if(!this.session||!this.session.messages.length)return;let t=A(),a=t.findIndex(e=>e.id===this.session.id);if(this.session.updatedAt=Date.now(),!this.session.title||this.session.title==="Nova conversa"){let e=this.session.messages.find(o=>o.role==="user");e&&(this.session.title=String(e.text).slice(0,60).replace(/\s+/g," ").trim())}a>=0?t[a]=this.session:t.unshift(this.session),t.sort((e,o)=>(o.updatedAt||0)-(e.updatedAt||0)),await _(t)}resolveWebviewView(t){this.view=t,t.webview.options={enableScripts:!0,localResourceRoots:[this.context.extensionUri]},t.webview.html=this.html(t.webview),m("WebView resolvida e HTML injetado."),t.webview.onDidReceiveMessage(async a=>{try{let e=a&&a.type;if(m(`Mensagem recebida do webview: type=${e}`),e==="ready"){this.refreshMeta(),this.replaySession(),this.pushCurrentSelection();return}if(e==="clientError"){m(`ERRO no cliente webview: ${a.text||"sem detalhes"}`),this.post({type:"message",role:"assistant",text:"Falha no painel: "+(a.text||"erro sem detalhes")});return}if(e==="cancelRun"){let o=re();this.post({type:"action",ok:o,text:o?"Cancelamento solicitado.":"Nenhuma execucao integrada ativa para cancelar."});return}if(e==="verifyCli"){this.verifyCli();return}if(e==="requestSelection"){this.pushCurrentSelection(!0);return}if(e==="attachMenu"){await this.chooseAttachSource();return}if(e==="attachFiles"){await this.attachFiles();return}if(e==="pickWorkspaceFiles"){await this.pickWorkspaceFiles();return}if(e==="listWorkspace"){this.listWorkspaceDir(a.path||"");return}if(e==="attachFolder"){await this.attachFolder(a.path||"");return}if(e==="attachWorkspacePath"){await this.attachWorkspacePath(a.path||"");return}if(e==="send"){await this.send(a.text||"",{echoUser:a.echo!==!1,displayText:a.displayText||a.text||"",hasExplicitContext:!!a.hasExplicitContext});return}if(e==="terminal"){te(a.text||""),this.post({type:"action",ok:!0,text:"Terminal aberto."});return}if(e==="setModel"){await y("modeloAtual",$(a.value||"auto"));return}if(e==="setMode"){await y("modoExecucaoChat",a.value||"resposta-integrada");return}if(e==="setAgent"){await y("agenteAtual",a.value||"auto");return}if(e==="toggleSkill"){let o=new Set(P());a.value&&o.has(a.value)?o.delete(a.value):a.value&&o.add(a.value),await y("skillsSelecionadas",Array.from(o));return}if(e==="manualModel"){await de();return}if(e==="refreshModels"){this.refreshMeta();let o=await Te();if(o.length){let i=Array.from(new Set([...u().get("modelosDisponiveis")||[],...o]));await u().update("modelosDisponiveis",i,c.ConfigurationTarget.Workspace)}this.refreshMeta(),this.post({type:"action",ok:!0,text:"Modelos atualizados ("+R().length+" disponiveis)."});return}if(e==="review"){await this.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+Le()+"\n```",{echoUser:!0});return}if(e==="selection"){await this.send(`Analise o contexto do editor atual.

`+ne(),{echoUser:!0});return}if(e==="insertSelection"){this.post({type:"insertPrompt",text:`Analise o contexto do editor atual.

`+ne()});return}if(e==="newChat"){await this.persistSession(),this.session=this.newSession(),this.post({type:"clearThread"}),this.refreshMeta();return}if(e==="getHistory"){await this.openHistory();return}if(e==="loadSession"){await this.persistSession();let i=A().find(l=>l.id===a.id);i&&(this.session=JSON.parse(JSON.stringify(i)),this.post({type:"clearThread"}),this.replaySession(),this.refreshMeta(),this.post({type:"action",ok:!0,text:"Sessao carregada: "+(i.title||i.id)}));return}if(e==="deleteSession"){let o=A().filter(i=>i.id!==a.id);await _(o),this.session&&this.session.id===a.id&&(this.session=this.newSession(),this.post({type:"clearThread"})),this.post({type:"history",sessions:o}),this.refreshMeta();return}if(e==="clearHistory"){await _([]),this.session=this.newSession(),this.post({type:"clearThread"}),this.post({type:"history",sessions:[]}),this.refreshMeta();return}this.post({type:"action",ok:!1,text:`Acao desconhecida: ${e}`})}catch(e){this.busy=!1,this.post({type:"busy",value:!1}),m(`ERRO no handler do webview: ${e&&e.message?e.message:String(e)}`),e&&e.stack&&m(e.stack),this.post({type:"message",role:"assistant",text:"Falha ao executar acao do painel: "+(e&&e.message?e.message:String(e))})}}),setTimeout(()=>this.refreshMeta(),50)}post(t){try{this.view&&this.view.webview.postMessage(t)}catch{}}async openHistory(){await this.persistSession();let t=A().filter(a=>a&&a.messages&&a.messages.length);this.post({type:"openHistory",sessions:t}),this.refreshMeta()}verifyCli(){I.show(!0),m(`Verificando Devin CLI pelo painel: ${b()}`),D.execFile(b(),["--version"],{cwd:C(),windowsHide:!0},(t,a,e)=>{if(t){let l=`Falha ao verificar Devin CLI: ${t.message}`;m(l),this.post({type:"message",role:"assistant",text:l}),this.post({type:"action",ok:!1,text:l});return}let i=`Devin CLI encontrado: ${(a||e||"ok").trim()}`;m(i),this.post({type:"message",role:"assistant",text:i}),this.post({type:"action",ok:!0,text:i})})}pushCurrentSelection(t){let a=c.window.activeTextEditor,e=Je(a);e&&this.post({type:"selectionAvailable",selection:e})}attachmentId(t){return t+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}readFileItem(t,a){let e=p.statSync(t);if(e.size>Z)return{skipped:!0,reason:`Arquivo muito grande: ${r.basename(t)} (${e.size} bytes).`};let o=p.readFileSync(t,"utf8"),i=r.extname(t).slice(1);return{id:this.attachmentId("file"),file:t,base:r.basename(t),label:a||r.basename(t),type:"file",text:o,language:i,lines:o.split(`
`).length}}readFolderItem(t,a){let e=g(),o=a||r.basename(t)||"workspace",i=[],l=[t];for(;l.length&&i.length<X;){let s=l.pop(),d;try{d=p.readdirSync(s,{withFileTypes:!0})}catch{continue}for(let h of d){let f=r.join(s,h.name);if(h.isDirectory())!ze.has(h.name)&&!h.name.startsWith(".")&&l.push(f);else if(h.isFile())try{if(p.statSync(f).size>Z)continue;let M=p.readFileSync(f,"utf8"),W=e&&f.startsWith(e)?r.relative(e,f):r.join(o,r.relative(t,f));if(i.push({file:f,rel:W.replace(/\\/g,"/"),base:r.basename(f),text:M,language:r.extname(f).slice(1),lines:M.split(`
`).length}),i.length>=X)break}catch{}}}return{id:this.attachmentId("folder"),file:t,base:o,label:`${o} (${i.length})`,type:"folder",files:i,count:i.length,truncated:i.length>=X}}async chooseAttachSource(){let t=await c.window.showQuickPick([{label:"$(folder) Pastas",description:"Anexar pasta recursivamente como chip unico",value:"folders"},{label:"$(file) Arquivos abertos",description:"Anexar arquivos atualmente abertos no editor",value:"openFiles"}],{placeHolder:"Anexar contexto ao Devin"});if(!t)return;if(t.value==="folders"){let s=await c.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!1,canSelectFolders:!0,defaultUri:g()?c.Uri.file(g()):void 0,openLabel:"Anexar pasta"});if(!s||!s.length)return;let d=[];for(let h of s)try{let f=this.readFolderItem(h.fsPath,r.basename(h.fsPath));f.files&&f.files.length&&d.push(f)}catch(f){this.post({type:"action",ok:!1,text:`Falha ao anexar pasta ${h.fsPath}: ${f.message}`})}d.length&&this.post({type:"attachItems",items:d}),this.post({type:"action",ok:!0,text:`Anexadas ${d.length} pasta(s).`});return}let a=c.workspace.textDocuments.filter(s=>s.uri&&s.uri.scheme==="file"&&!s.isUntitled);if(!a.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo aberto para anexar."});return}let e=g()||"",o=a.map(s=>({label:"$(file) "+r.basename(s.uri.fsPath),description:e?r.dirname(r.relative(e,s.uri.fsPath)):r.dirname(s.uri.fsPath),detail:s.uri.fsPath,doc:s})),i=await c.window.showQuickPick(o,{canPickMany:!0,placeHolder:"Selecione arquivos abertos para anexar"});if(!i||!i.length)return;let l=[];for(let s of i){let d=s.doc,h=d.getText();if(Buffer.byteLength(h,"utf8")>Z){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${r.basename(d.uri.fsPath)}.`});continue}l.push({id:this.attachmentId("file"),file:d.uri.fsPath,base:r.basename(d.uri.fsPath),label:r.basename(d.uri.fsPath),type:"file",text:h,language:d.languageId||r.extname(d.uri.fsPath).slice(1),lines:h.split(`
`).length})}l.length&&this.post({type:"attachItems",items:l})}async attachFiles(){try{let t=await c.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!0,canSelectFolders:!1,defaultUri:g()?c.Uri.file(g()):void 0,openLabel:"Anexar ao chat"});if(!t||!t.length)return;let a=[];for(let e of t)try{let o=p.statSync(e.fsPath);if(o.size>1024*1024){a.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:e.fsPath,base:r.basename(e.fsPath),label:r.basename(e.fsPath),type:"file",text:`Arquivo ${e.fsPath} muito grande (${o.size} bytes) - nao anexado.`,language:"",tooBig:!0});continue}let i=p.readFileSync(e.fsPath,"utf8"),l=r.extname(e.fsPath).slice(1);a.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:e.fsPath,base:r.basename(e.fsPath),label:r.basename(e.fsPath),type:"file",text:i,language:l,lines:i.split(`
`).length})}catch(o){this.post({type:"action",ok:!1,text:`Falha ao ler ${e.fsPath}: ${o.message}`})}a.length&&this.post({type:"attachItems",items:a})}catch(t){this.post({type:"action",ok:!1,text:"Falha ao anexar: "+(t&&t.message?t.message:String(t))})}}async pickWorkspaceFiles(){try{let t=await c.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__}/**",5e3);if(!t.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo encontrado."});return}let a=g()||"",e=t.map(l=>({label:r.relative(a,l.fsPath)||r.basename(l.fsPath),description:"",uri:l})),o=await c.window.showQuickPick(e,{placeHolder:"Selecione arquivos do workspace para anexar",canPickMany:!0,matchOnDescription:!0});if(!o||!o.length)return;let i=[];for(let l of o)try{if(p.statSync(l.uri.fsPath).size>1024*1024)continue;let d=p.readFileSync(l.uri.fsPath,"utf8"),h=r.extname(l.uri.fsPath).slice(1);i.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:l.uri.fsPath,base:r.basename(l.uri.fsPath),label:r.basename(l.uri.fsPath),type:"file",text:d,language:h})}catch{}i.length&&this.post({type:"attachItems",items:i})}catch(t){this.post({type:"action",ok:!1,text:"Falha: "+(t&&t.message?t.message:String(t))})}}listWorkspaceDir(t){try{let a=g();if(!a){this.post({type:"workspaceList",path:t||"",entries:[],error:"Sem workspace aberto."});return}let e=V(t||"");if(!e){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio fora do workspace."});return}if(!p.existsSync(e)||!p.statSync(e).isDirectory()){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio invalido."});return}let o=r.relative(a,e).replace(/\\/g,"/"),i=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),l=p.readdirSync(e,{withFileTypes:!0}).filter(s=>!s.name.startsWith(".")||[".cognition",".devin",".claude",".cursor",".vscode"].includes(s.name)).filter(s=>!(s.isDirectory()&&i.has(s.name))).map(s=>{let d=0;try{s.isFile()&&(d=p.statSync(r.join(e,s.name)).size)}catch{}return{name:s.name,isDir:s.isDirectory(),size:d}}).sort((s,d)=>d.isDir-s.isDir||s.name.localeCompare(d.name));this.post({type:"workspaceList",path:o,entries:l})}catch(a){this.post({type:"workspaceList",path:"",entries:[],error:a.message})}}async attachWorkspacePath(t){if(!g())return;let e=V(t||"");if(!e){this.post({type:"action",ok:!1,text:"Caminho fora do workspace."});return}if(!p.existsSync(e)){this.post({type:"action",ok:!1,text:"Caminho invalido."});return}if(p.statSync(e).isDirectory()){await this.attachFolder(t);return}try{let o=p.statSync(e);if(o.size>1024*1024){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${r.basename(e)} (${o.size} bytes).`});return}let i=p.readFileSync(e,"utf8"),l=r.extname(e).slice(1);this.post({type:"attachItems",items:[{id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:e,base:r.basename(e),label:r.basename(e),type:"file",text:i,language:l}]})}catch(o){this.post({type:"action",ok:!1,text:"Falha: "+o.message})}}async attachFolder(t){let a=g();if(!a)return;let e=V(t||"");if(!e){this.post({type:"action",ok:!1,text:"Pasta fora do workspace."});return}let o=r.relative(a,e).replace(/\\/g,"/");if(!p.existsSync(e)||!p.statSync(e).isDirectory()){this.post({type:"action",ok:!1,text:"Pasta invalida."});return}let i=this.readFolderItem(e,o?r.basename(e):j());i.files&&i.files.length&&this.post({type:"attachItems",items:[i]}),this.post({type:"action",ok:!0,text:`Pasta anexada como chip unico: ${i.label}.`})}replaySession(){if(!(!this.session||!this.session.messages.length))for(let t of this.session.messages)this.post({type:"message",role:t.role,text:t.text,replay:!0})}refreshMeta(){let t={type:"meta",models:ee,model:k(),agents:["auto"],agent:U(),skills:[],selectedSkills:P(),mode:G(),workspace:j(),sessionId:this.session&&this.session.id,sessionTitle:this.session&&this.session.title,modelLocked:!1,hasMessages:!!(this.session&&this.session.messages&&this.session.messages.length),tokensTotal:this.session&&this.session.tokens||0,tokensIn:this.session&&this.session.tokensIn||0,tokensOut:this.session&&this.session.tokensOut||0,modelStatus:"modelo: auto"};try{t.models=R()}catch{t.models=ee}try{t.agents=le()}catch{t.agents=["auto"]}try{t.skills=ce()}catch{t.skills=[]}try{t.recentSessions=A().slice(0,3).map(a=>({id:a.id,title:a.title||"Sem titulo",updatedAt:a.updatedAt,messages:(a.messages||[]).length,model:a.model||"auto"}))}catch{t.recentSessions=[]}try{t.modelStatus=`${t.models.length} modelos | ${t.skills.length} skills`}catch{}this.post(t)}async send(t,a){let e=String(t||"").trim();if(!e)return;let o=String(a&&a.displayText?a.displayText:e).trim(),i=null;if(!a||!a.hasExplicitContext){let s=Ie();s&&s.promptBlock&&(e=e+s.promptBlock,o=o+`

[Contexto automatico: `+s.label+"]",i=s.label)}if(this.busy){this.post({type:"message",role:"assistant",text:"Ja existe uma execucao em andamento. A concorrencia permanece controlada no backend."});return}this.busy=!0;let l=ve(B(e));this.session.tokensIn=(this.session.tokensIn||0)+l,this.session.tokens=(this.session.tokens||0)+l,(!a||a.echoUser!==!1)&&this.post({type:"message",role:"user",text:o}),this.session.messages.push({role:"user",text:o,fullText:e,ts:Date.now(),tokens:l}),this.post({type:"busy",value:!0}),i&&this.post({type:"ctxHint",text:"\u{1F4C4} Contexto automatico: "+i}),this.post({type:"action",ok:!0,text:"Enviando para o Devin CLI..."}),this.refreshMeta();try{let s=G();if(m(`send: modo=${s} prompt=${e.length} chars`),s==="terminal"){te(e);let f="Sessao aberta no terminal integrado, ja posicionada na pasta aberta no VS Code.";this.post({type:"message",role:"assistant",text:f}),this.session.messages.push({role:"assistant",text:f,ts:Date.now()});return}let d=await Ee(e);m(`send: resposta recebida (${d?d.length:0} chars)`);let h=ve(d);this.session.tokensOut=(this.session.tokensOut||0)+h,this.session.tokens=(this.session.tokens||0)+h,this.post({type:"message",role:"assistant",text:d}),this.session.messages.push({role:"assistant",text:d,ts:Date.now(),tokens:h})}catch(s){m(`send ERRO: ${s&&s.message?s.message:String(s)}`);let d="Falha ao enviar para o Devin CLI: "+(s&&s.message?s.message:String(s));this.post({type:"message",role:"assistant",text:d}),this.session.messages.push({role:"assistant",text:d,ts:Date.now()})}finally{this.busy=!1,this.post({type:"busy",value:!1}),await this.persistSession(),this.refreshMeta()}}html(t){let a=Date.now().toString(36),e={history:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.4 1.6"/></svg>',plus:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',refresh:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.55"/><path d="M13 3v3h-3"/></svg>',terminal:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7l2 1.5L5 10M8.5 10.5h3"/></svg>',lock:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',paperclip:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',attach:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',file:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13"/></svg>',folder:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>',close:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',send:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 13.5L14 8 2 2.5 2 7l8 1-8 1z"/></svg>',brain:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3a2 2 0 0 0-2 2 2 2 0 0 0-1 3.5 2 2 0 0 0 1.5 3 2 2 0 0 0 3.5 0V3.5A1.5 1.5 0 0 0 5.5 3z"/><path d="M10.5 3a2 2 0 0 1 2 2 2 2 0 0 1 1 3.5 2 2 0 0 1-1.5 3 2 2 0 0 1-3.5 0V3.5A1.5 1.5 0 0 1 10.5 3z"/></svg>',bot:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="10" height="7" rx="1.5"/><path d="M8 3v2.5M5.5 8.5h.01M10.5 8.5h.01M2 9.5v1.5M14 9.5v1.5"/></svg>',mode:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5h12M2 8h8M2 10.5h10"/></svg>',sparkle:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l1.2 3.4L12.5 6.5 9.2 7.6 8 11l-1.2-3.4L3.5 6.5 6.8 5.4z"/></svg>',caret:'<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l6 5-6 5z"/></svg>'},o=[{label:"auto",value:"auto"},{label:"sonnet",value:"sonnet"},{label:"opus",value:"opus"},{label:"swe",value:"swe"},{label:"gpt",value:"gpt"}];return`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${t.cspSource} data:; style-src 'unsafe-inline' ${t.cspSource}; script-src 'nonce-${a}';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
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
.msgMeta{font-size:11px;color:var(--muted);margin-bottom:4px}.autoCtxHint{font-size:11px;color:var(--muted);margin-top:4px;opacity:.85}
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
  <button type="button" class="iconBtn" data-action="toggleHistory" title="Historico">${e.history}</button>
  <button type="button" class="iconBtn" data-action="newChat" title="Nova conversa">${e.plus}</button>
  <button type="button" class="iconBtn" data-action="refreshModels" title="Atualizar modelos">${e.refresh}</button>
  <button type="button" class="iconBtn" data-action="verifyCli" title="Verificar Devin CLI">i</button>
  <button type="button" class="iconBtn" data-action="terminal" title="Abrir sessao no terminal">${e.terminal}</button>
</header>
<div id="historyPanel" class="panel"><header>Historico <div class="barSpacer"></div><button data-action="clearHistory">Limpar</button></header><div id="historyList"></div></div>

<main class="thread" id="thread">
  <section class="welcome" id="welcome">
    <div class="welcomeTitle">Como posso ajudar neste workspace?</div>
    <div class="welcomeText">Selecione modelo, agente, modo e skills antes de enviar. As ultimas conversas ficam disponiveis para continuar.</div>
    <div id="recentBlock" class="recentBlock" style="display:none">
      <div class="recentHead">${e.history} Conversas recentes</div>
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
      <button type="button" class="chipBtn" data-action="attachMenu" id="attachBtn" title="Anexar contexto">${e.attach}<span class="chipText">Anexar</span></button>
      <button type="button" class="chipBtn" data-action="openModelMenu" id="modelChip" title="Modelo">${e.brain}<span class="chipText" id="modelChipText">Modelo</span><span class="caret">${e.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openAgentMenu" id="agentChip" title="Agente">${e.bot}<span class="chipText" id="agentChipText">Agente</span><span class="caret">${e.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openModeMenu" id="modeChip" title="Modo">${e.mode}<span class="chipText" id="modeChipText">Modo</span><span class="caret">${e.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openSkillsMenu" id="skillsBtn" title="Skills">${e.sparkle}<span class="chipText">Skills <span id="skillsCount">0</span></span></button>
      <span class="barSpacer"></span>
      <span class="busyDot"></span>
      <span class="tokenPie" id="tokenPie" title="Tokens"></span>
      <button class="stopBtn" id="cancel" type="button" data-action="cancelRun" title="Cancelar execucao">\xD7</button>
      <button class="sendBtn" id="send" type="button" data-action="send" title="Enviar">${e.send}</button>
    </div>
  </div>
</footer>
</div>
<script nonce="${a}">
(function(){
'use strict';
var vscode = acquireVsCodeApi();
var ICONS = ${JSON.stringify(e)};
var MODEL_TREE = ${JSON.stringify(o)};
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
  if(item.type === 'folder') return '\u{1F4CE} ' + (item.label || item.base || 'pasta');
  if(item.type === 'file') return '\u{1F4CE} ' + (item.label || item.base || 'arquivo');
  return '\u{1F4CE} Contexto: ' + (item.label || 'selecao');
}
function attachmentFullBlock(item){
  if(!item) return '';
  var fence = String.fromCharCode(96,96,96);
  if(item.type === 'folder'){
    var files = item.files || [];
    var truncNote = item.truncated ? '\\n\\n[NOTA: pasta truncada \u2014 exibindo ' + files.length + ' arquivo(s); demais arquivos ignorados por limite ou por serem muito grandes (>1 MB).]' : '';
    return files.map(function(f){
      var lang = f.language || '';
      return '\\n\\nArquivo anexado ' + (f.rel || f.file || f.base || 'arquivo') + ' (' + lang + '):\\n' + fence + lang + '\\n' + (f.text || '') + '\\n' + fence;
    }).join('') + truncNote;
  }
  var heading = item.type === 'file' ? ('Arquivo anexado ' + (item.file || item.label)) : ('Contexto anexado de ' + item.label);
  var fileTruncNote = item.truncated ? '\\n[NOTA: arquivo truncado \u2014 exibindo apenas os primeiros bytes por limite de tamanho.]' : '';
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
  var hasExplicitContext = attachedItems.length > 0;
  var refs = attachedItems.map(attachmentReference).filter(Boolean);
  var displayText = basePrompt + (refs.length ? '\\n\\n' + refs.join(', ') : '');
  var fullText = basePrompt + attachedItems.map(attachmentFullBlock).join('');
  addMessage('user', displayText);
  setPrompt('');
  attachedItems = [];
  renderContextChips();
  setBusy(true);
  post({ type: 'send', text: fullText, displayText: displayText, echo: false, hasExplicitContext: hasExplicitContext });
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
  if(m.type === 'ctxHint'){
    var thread2 = byId('thread');
    if(thread2){
      var rows2 = thread2.querySelectorAll('.msgRow.user');
      var last2 = rows2.length ? rows2[rows2.length - 1] : null;
      if(last2){
        var bubble2 = last2.querySelector('.msg.user');
        var host2 = bubble2 || last2;
        var hint2 = document.createElement('div');
        hint2.className = 'autoCtxHint';
        hint2.textContent = m.text || '';
        host2.appendChild(hint2);
        thread2.scrollTop = thread2.scrollHeight;
      }
    }
  }
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
</script></body></html>`}};async function Ze(n){O=n,I=c.window.createOutputChannel("Devin Cli Chat"),n.subscriptions.push(I),m(`Extens\xE3o ativando \u2014 VS Code ${c.version}, extens\xE3o ${n.extension.packageJSON.version}`),m(`Plataforma: ${process.platform} ${process.arch}`),m(`Devin CLI path configurado: ${b()}`),m(`Workspace: ${g()||"nenhum"}`),v=new oe(n),n.subscriptions.push(c.window.registerWebviewViewProvider("devinCliChat.chatView",v,{webviewOptions:{retainContextWhenHidden:!0}})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.abrirPainel",async()=>c.commands.executeCommand("workbench.view.extension.devinCliChat"))),n.subscriptions.push(c.commands.registerCommand("devinCliChat.abrirHistorico",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),setTimeout(()=>{v&&v.openHistory()},100)})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.novaSessao",()=>te(""))),n.subscriptions.push(c.commands.registerCommand("devinCliChat.revisarDiff",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),v&&await v.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+Le()+"\n```")})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.enviarSelecao",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),v&&await v.send(`Analise o contexto do editor atual.

`+ne())})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarModelo",Ke)),n.subscriptions.push(c.commands.registerCommand("devinCliChat.definirModeloManual",de)),n.subscriptions.push(c.commands.registerCommand("devinCliChat.atualizarModelos",async()=>{q(),v&&v.refreshMeta();let e=await Te();if(e.length){let o=Array.from(new Set([...u().get("modelosDisponiveis")||[],...e]));await u().update("modelosDisponiveis",o,c.ConfigurationTarget.Workspace),q()}v&&v.refreshMeta(),c.window.showInformationMessage(`Modelos atualizados (${R().length} disponiveis).`)})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarAgente",async()=>{let e=await c.window.showQuickPick(le(),{placeHolder:"Selecione o agente Devin"});e&&await y("agenteAtual",e)})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarSkills",Qe)),n.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarModo",async()=>{let e=await c.window.showQuickPick([{label:"Integrado (resposta no chat)",value:"resposta-integrada"},{label:"Terminal",value:"terminal"}],{placeHolder:"Selecione o modo de execucao"});e&&await y("modoExecucaoChat",e.value)})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.limparHistorico",async()=>{await c.window.showWarningMessage("Limpar todo o historico de chats?",{modal:!0},"Limpar")==="Limpar"&&(await _([]),v&&v.post({type:"history",sessions:[]}))})),n.subscriptions.push(c.commands.registerCommand("devinCliChat.verificarCli",()=>{I.show(!0),m(`Verificando Devin CLI: ${b()}`),D.execFile(b(),["--version"],{cwd:C(),windowsHide:!0},(e,o,i)=>{if(e)m(`verificarCli ERRO: code=${e.code} msg=${e.message}`),c.window.showErrorMessage(`Falha ao verificar Devin CLI: ${e.message}`);else{let l=(o||i||"ok").trim();m(`verificarCli OK: ${l}`),c.window.showInformationMessage(`Devin CLI encontrado: ${l}`)}})}));let t,a=()=>{t&&clearTimeout(t),t=setTimeout(()=>{v&&v.pushCurrentSelection(!0)},150)};n.subscriptions.push(c.window.onDidChangeTextEditorSelection(a)),n.subscriptions.push(c.window.onDidChangeActiveTextEditor(a)),n.subscriptions.push(c.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration(ge)&&(q(),ae(),v&&v.refreshMeta())})),ae()}function Xe(){re()}module.exports={activate:Ze,deactivate:Xe,_internal:{baseArgs:J,fullPrompt:B,runIntegrated:Ee,modelsForUi:R,scanAgents:le,scanSkills:ce,loadHistory:A,saveHistory:_,sanitizeModel:$,isSafeModelId:ye,cancelIntegratedRun:re,automaticEditorContext:Ie,resolveWorkspacePathSafe:V}};
