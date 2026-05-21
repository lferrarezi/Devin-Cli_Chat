"use strict";var d=require("vscode"),m=require("fs"),c=require("path"),w=require("os"),j=require("child_process"),it=require("crypto"),Fe="devinCliChat",ie=["auto","sonnet","opus","codex"],he="devinCliChat.chatHistory.v1",re="devinCliChat.firstInstallLayout.v1",rt=50,oe=1024*1024,ae=50,lt=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),g,P,U,D,K=new Map,R={at:0,values:void 0},O={at:0,values:void 0},q={at:0,values:void 0},W={at:0,values:void 0};function f(t){let e=new Date().toISOString();D&&D.appendLine(`[${e}] ${t}`)}function fe(){return 1e4}function ct(){let t=u().get("cacheModelosMs");return Math.max(0,Number(t??18e5))}function E(){R={at:0,values:void 0},O={at:0,values:void 0},q={at:0,values:void 0},W={at:0,values:void 0}}function ge(t){return/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$/.test(String(t||"").trim())}function u(){return d.workspace.getConfiguration(Fe)}function v(){return d.workspace.workspaceFolders&&d.workspace.workspaceFolders[0]?d.workspace.workspaceFolders[0].uri.fsPath:void 0}function F(){return d.workspace.workspaceFolders&&d.workspace.workspaceFolders[0]?d.workspace.workspaceFolders[0].name:"sem pasta aberta"}function $e(t){if(!t)return t;let e=String(t);return e==="~"?w.homedir():e.startsWith("~/")||e.startsWith("~\\")?c.join(w.homedir(),e.slice(2)):e}function x(t){let e=$e(t);return e&&(c.isAbsolute(e)?e:c.join(v()||w.homedir(),e))}function ve(t){try{return!!t&&m.existsSync(t)}catch{return!1}}function Ne(){return it.randomBytes(18).toString("base64")}function A(t,e){if(typeof t!="string")return;let o=e||2e4;return t.length>o?t.slice(0,o):t}function Be(t){return typeof t=="boolean"?t:void 0}function dt(t){return typeof t=="string"&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(t)}function ze(t){if(!t||typeof t!="object"||Array.isArray(t))return null;let e=A(t.type,40);if(new Set(["ready","cancelRun","verifyCli","requestSelection","attachMenu","attachFiles","pickWorkspaceFiles","manualModel","refreshModels","review","selection","insertSelection","newChat","getHistory","clearHistory","importAgentFile","importSkillFile","importToolFile"]).has(e))return{type:e};if(e==="clientError")return{type:e,text:A(t.text,2e3)||""};if(e==="send"){let n=A(t.text,2e5);if(n===void 0)return null;let a={type:e,text:n},s=A(t.displayText,2e5),i=Be(t.echo),r=Be(t.hasExplicitContext);return s!==void 0&&(a.displayText=s),i!==void 0&&(a.echo=i),r!==void 0&&(a.hasExplicitContext=r),a}if(e==="searchWorkspaceFiles")return{type:e,query:A(t.query||"",200)||""};if(e==="setModel"||e==="setAgent"||e==="toggleSkill"||e==="toggleTool"){let n=A(t.value,200);return n===void 0?null:{type:e,value:n}}if(e==="listWorkspace"||e==="attachFolder"||e==="attachWorkspacePath"){let n=A(t.path||"",2e3);return n===void 0?null:{type:e,path:n}}return(e==="loadSession"||e==="deleteSession"||e==="exportSession")&&dt(t.id)?{type:e,id:t.id}:null}function _e(t){let e=String(t||"").trim();if(!e.startsWith("/"))return null;let n=(e.slice(1).split(/\s+/).shift()||"").toLowerCase(),s=e.slice(n.length+2).trim()||"o contexto atual",r={review:"Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.",tests:`Proponha e implemente testes para ${s}. Priorize cobertura de comportamento, regressao e caminhos de erro.`,plan:`Crie um plano tecnico objetivo para ${s}. Agrupe por impacto, risco e ordem de execucao.`,explain:`Explique ${s} com foco em arquitetura, fluxo de dados e pontos de manutencao.`,security:`Revise ${s} com foco em riscos de seguranca, entrada nao confiavel, execucao de comandos e exposicao de dados.`,docs:`Gere documentacao pratica para ${s}, incluindo objetivo, uso, limites e exemplos.`,"commit-msg":"Gere uma mensagem de commit convencional para as mudancas atuais, com escopo claro e resumo curto."}[n];return r?{command:n,text:r,displayText:e}:null}function H(t){return String(t??"").replace(/\r?\n/g," ").trim()}function je(t){let e=t||{},o=[];o.push("# "+(H(e.title)||"Sessao Devin")),o.push(""),o.push("- Workspace: "+(H(e.workspace)||F())),o.push("- Modelo: "+(H(e.model)||"auto")),o.push("- Agente: "+(H(e.agent)||"auto")),o.push("- Modo: "+(H(e.mode)||"resposta-integrada")),e.createdAt&&o.push("- Criada em: "+new Date(e.createdAt).toISOString()),e.updatedAt&&o.push("- Atualizada em: "+new Date(e.updatedAt).toISOString()),o.push("");let n=Array.isArray(e.messages)?e.messages:[];for(let a of n){let s=String(a&&a.role||"message").toLowerCase();o.push("## "+s.charAt(0).toUpperCase()+s.slice(1)),a&&a.ts&&o.push("_"+new Date(a.ts).toISOString()+"_"),o.push(""),o.push(String(a&&a.text||"").trim()),o.push("")}return o.join(`
`).trim()+`
`}function $(t){return`'${String(t).replace(/'/g,"'\\''")}'`}function He(t){return String(t??"").replace(/\u0000/g,"")}function M(t){let e=String(t||"").trim().toLowerCase();return!e||e==="default"||e==="padrao"||e==="padr\xE3o"?"auto":ge(e)?e:"auto"}function Re(t){return M(t)}function pt(){return[...ie]}function ut(t){try{return ve(t)?JSON.parse(m.readFileSync(t,"utf8")):void 0}catch{return}}function mt(){if(process.platform==="win32"){let t=process.env.APPDATA||c.join(w.homedir(),"AppData","Roaming");return c.join(t,"devin","config.json")}return c.join(w.homedir(),".config","devin","config.json")}function xe(){let t=ut(mt());return t&&t.agent?Re(t.agent.model):void 0}function S(){let t=u().get("modeloAtual");return Re(t??(xe()||"auto"))}function Oe(){let t=u().get("modeloAtual");return M(t??(xe()||"auto"))}function Z(){return String(u().get("agenteAtual")||"auto")}function le(){return"resposta-integrada"}function L(){let t=u().get("skillsSelecionadas")||[];return Array.isArray(t)?t.map(String).filter(Boolean):[]}function N(){let t=u().get("toolsSelecionadas")||[];return Array.isArray(t)?t.map(String).filter(Boolean):[]}function k(){return String(u().get("caminhoDevin")||"devin")}function T(){return v()||w.homedir()}function Pe(t){try{if(m.existsSync(t))return m.realpathSync.native?m.realpathSync.native(t):m.realpathSync(t)}catch{}return c.resolve(t)}function ht(t,e){let o=c.relative(t,e);return o===""||!!o&&!o.startsWith("..")&&!c.isAbsolute(o)}function Q(t){let e=v();if(!e)return null;let o=Pe(e),n=String(t||"").replace(/\\/g,c.sep).trim(),a=c.isAbsolute(n)?c.resolve(n):c.resolve(o,n),s=Pe(a);return ht(o,s)?s:null}function qe(){return[$e(u().get("gitBashPath")),process.env.GIT_BASH_PATH,"C:\\Program Files\\Git\\bin\\bash.exe","C:\\Program Files\\Git\\usr\\bin\\bash.exe","C:\\Program Files (x86)\\Git\\bin\\bash.exe",c.join(w.homedir(),"AppData","Local","Programs","Git","bin","bash.exe")].filter(Boolean).find(ve)}function ft(){return process.platform==="win32"&&u().get("usarGitBashNoWindows",!0)?qe():process.env.SHELL||void 0}function X(){let t=[...(u().get("argumentosPadrao")||[]).map(String).filter(Boolean)],e=String(u().get("argumentoModelo")||"").trim(),o=Oe();return e&&o&&o!=="auto"&&t.push(e,o),t}function _(t){let e=u().get("prefixoPromptPadrao")||"",o=Oe()||S()||"auto",n=Z(),a=L(),s=N(),i=[`Workspace VS Code: ${F()}`,v()?`Diretorio raiz: ${v()}`:"Diretorio raiz: nao ha pasta aberta",`Modelo selecionado: ${o}`,`Agente selecionado: ${n}`,a.length?`Skills disponiveis: ${a.join(", ")}`:"",s.length?`Tools disponiveis: ${s.join(", ")}`:""].filter(Boolean).join(`
`),r=n!=="auto"?`Use o perfil/subagente Devin chamado "${n}" quando aplicavel. Se a CLI nao aceitar selecao direta de agente nesta chamada, trate este agente como persona operacional e siga as instrucoes do respectivo AGENT.md.`:"",l=a.length?`Invoque a skill via tool 'skill' quando aplicavel: ${a.map(h=>`"${h}"`).join(", ")}. Siga as instrucoes do respectivo SKILL.md.`:"",p=s.length?`Use as tools selecionadas quando aplicavel: ${s.map(h=>`"${h}"`).join(", ")}. Siga as instrucoes do respectivo TOOL.md.`:"";return He([e,i,r,l,p,t].filter(Boolean).join(`

`))}function gt(t){let e=$(k()),o=X().map($).join(" ");return t?[e,o,"-p","--",$(_(t))].filter(Boolean).join(" "):[e,o].filter(Boolean).join(" ")}function vt(t){return t?String(t).split(/\r?\n/).filter(e=>!/were not migrated because they already exist/i.test(e)).filter(e=>!/migration.*already exist/i.test(e)).join(`
`).trim():""}function We(t,e,o){let n=vt(e),a=[t||"",n||"",o&&o.message?o.message:""].join(`
`);if(/No active model set in cog manager/i.test(a))return["Modelo Devin nao configurado para esta execucao.","","A extensao tentou enviar o alias selecionado, mas o Devin CLI informou que nao ha modelo ativo no cog manager.","","Acoes recomendadas:",`1. Execute no terminal: devin model set ${S()||"auto"}`,"2. Se houver conflito de migracao de config, mantenha apenas o valor desejado em agent.model no config.json do Devin.","3. No chat, reabra o seletor de modelo e escolha um dos aliases validos: auto, sonnet, opus, swe, gpt."].join(`
`);let s=[];return t&&t.trim()&&s.push(t.trim()),n&&s.push(`STDERR:
${n}`),o&&s.push(`Falha ao executar Devin CLI: ${o.message}`),s.join(`

`)||"Sem saida do Devin CLI."}function xt(t){let e=ft(),o=d.window.createTerminal({name:u().get("nomeTerminal")||"Devin Cli Chat",cwd:T(),shellPath:e,shellArgs:process.platform==="win32"&&e?["--login","-i"]:void 0});o.show(!0),o.sendText(gt(t))}function J(t){return t||"__default__"}function be(t,e){let o=J(t);return K.set(o,Object.assign({sessionId:o,cancelRequested:!1,startedAt:Date.now()},e||{})),K.get(o)}function G(t){return K.get(J(t))}function ye(t){K.delete(J(t))}function Ge(){return Array.from(K.keys())}function we(t){let e=G(t);if(!e)return!1;e.cancelRequested=!0;let o=e.process;if(!o||o.killed)return!1;try{return o.kill(),!0}catch(n){return f(`cancelIntegratedRun erro: ${n&&n.message?n.message:String(n)}`),!1}}function Ve(t,e){return new Promise(o=>{let n=J(e&&e.sessionId),a=[...X(),"-p","--",_(t)];f(`runIntegrated: session=${n} ${k()} ${a.slice(0,-1).join(" ")} -- [prompt ${_(t).length} chars]`),f(`  cwd: ${T()}`);let s=!1;function i(r){s||(s=!0,ye(n),o(r))}try{let r=j.execFile(k(),a,{cwd:T(),timeout:Number(u().get("timeoutChatMs")||3e5),maxBuffer:16777216,windowsHide:!0},(l,p,h)=>{let y=G(n);if(y&&y.cancelRequested){i("Execucao cancelada pelo usuario.");return}if(l&&f(`runIntegrated erro: code=${l.code} signal=${l.signal} killed=${l.killed} msg=${l.message}`),h&&h.trim()&&f(`runIntegrated stderr: ${h.slice(0,500)}`),p&&p.trim()&&f(`runIntegrated stdout: ${p.slice(0,200)}...`),l&&process.platform==="win32"){se(t,l,{sessionId:n}).then(i);return}i(We(p,h,l))});be(n,{process:r,mode:"integrated"}),r.on("error",l=>{f(`runIntegrated child error: ${l.message}`);let p=G(n);if(p&&p.cancelRequested){i("Execucao cancelada pelo usuario.");return}process.platform==="win32"?se(t,l,{sessionId:n}).then(i):i(`Falha ao iniciar Devin CLI: ${l.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)})}catch(r){f(`runIntegrated catch: ${r.message}`);let l=G(n);if(l&&l.cancelRequested){i("Execucao cancelada pelo usuario.");return}process.platform==="win32"?se(t,r,{sessionId:n}).then(i):i(`Falha ao iniciar Devin CLI: ${r.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)}})}function se(t,e,o){return new Promise(n=>{let a=J(o&&o.sessionId),s=qe();if(!s){n(`Falha ao executar Devin CLI: ${e.message}

Git Bash nao foi encontrado. Configure devinCliChat.gitBashPath ou ajuste devinCliChat.caminhoDevin.`);return}let i=X().map($).join(" "),r=`${$(k())} ${i} -p -- ${$(_(t))}`,l=j.exec(r,{cwd:T(),shell:s,timeout:Number(u().get("timeoutChatMs")||3e5),maxBuffer:1024*1024*16},(p,h,y)=>{let C=G(a);if(ye(a),C&&C.cancelRequested){n("Execucao cancelada pelo usuario.");return}let B=We(h,y,p);n(B.replace("Falha ao executar Devin CLI:","Falha ao executar Devin CLI via Git Bash:"))});be(a,{process:l,mode:"bash"})})}async function b(t,e){await u().update(t,e,d.ConfigurationTarget.Workspace),E(),ue(),g&&g.refreshMeta()}function bt(){let t=u().get("modelosDisponiveis")||[];return Array.isArray(t)?t.map(String).map(e=>e.trim()).filter(Boolean):[]}function yt(){let t=u().get("arquivosCacheModelos")||[],e=Array.isArray(t)?t.map(x).filter(Boolean):[];if(process.platform==="win32"){let o=process.env.LOCALAPPDATA||c.join(w.homedir(),"AppData","Local");e.push(c.join(o,"Devin","CLI","team_settings.bin")),e.push(c.join(o,"Devin","CLI","model_configs.bin"))}else e.push(c.join(w.homedir(),".local","share","Devin","CLI","team_settings.bin")),e.push(c.join(w.homedir(),".local","share","Devin","CLI","model_configs.bin"));return Array.from(new Set(e))}function ce(t){let e=String(t||"").trim().toLowerCase();return!ge(e)||["model","models","use","eg","env","devin_model","default"].includes(e)?!1:/^(auto|sonnet|opus|codex|gpt|claude|o[0-9]|gpt-|claude-|.*[._-].*)/.test(e)}function Ue(t){let e=[],o=String(t||""),n=o.match(/"([^"]{2,80})"/g)||[];for(let s of n){let i=s.slice(1,-1).trim();ce(i)&&e.push(i)}let a=o.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g)||[];for(let s of a)ce(s)&&e.push(s);return Array.from(new Set(e.map(M))).filter(Boolean)}function wt(){let t=Number(u().get("limiteBytesCacheModelos")||5242880),e=[];for(let o of yt())try{if(!ve(o))continue;let n=m.statSync(o);if(!n.isFile()||n.size>t)continue;let s=m.readFileSync(o).toString("utf8");e.push(...Ue(s))}catch{}return Array.from(new Set(e))}function Y(){return new Promise(t=>{let e=String(u().get("comandoDescobertaModelos")||"").trim(),o=e?e.split(/\s+/):["--help"];try{j.execFile(k(),o,{cwd:T(),timeout:Number(u().get("timeoutDescobertaModelosMs")||2500),windowsHide:!0},(n,a,s)=>{let i=[a||"",s||""].join(`
`);if(n&&!i.trim()){t([]);return}try{let r=JSON.parse(i),l=Array.isArray(r)?r:r&&r.models||[];t(l.map(p=>typeof p=="string"?p:p&&(p.name||p.id)).filter(ce).map(M));return}catch{}t(Ue(i))})}catch{t([])}})}function z(){let t=ct(),e=Date.now();if(t>0&&R.values&&e-R.at<t)return R.values;let o=S(),n=[xe(),...bt(),...wt()].map(M).filter(Boolean).filter(i=>i!=="auto"),a=n.length?["auto",o,...n]:["auto",o,...pt()],s=Array.from(new Set(a.map(M).filter(Boolean)));return R={at:e,values:s},s}function ke(){let t=Date.now();if(O.values&&t-O.at<fe())return O.values;let e=[x(u().get("diretorioAgentesWorkspace")||".devin/agents"),x(u().get("diretorioAgentesGlobal")||"~/.config/devin/agents")],o=["auto"];for(let a of e)try{if(!a||!m.existsSync(a))continue;for(let s of m.readdirSync(a)){let i=c.join(a,s,"AGENT.md");m.existsSync(i)&&o.push(s)}}catch{}let n=Array.from(new Set(o));return O={at:t,values:n},n}function Ce(){let t=Date.now();if(W.values&&t-W.at<fe())return W.values;let e=[x(u().get("diretorioToolsWorkspace")||".devin/tools"),x(u().get("diretorioToolsGlobal")||"~/.config/devin/tools")],o=[];for(let a of e)try{if(!a||!m.existsSync(a))continue;for(let s of m.readdirSync(a)){let i=c.join(a,s,"TOOL.md");m.existsSync(i)&&o.push(s)}}catch{}let n=Array.from(new Set(o)).sort();return W={at:t,values:n},n}function Se(){let t=Date.now();if(q.values&&t-q.at<fe())return q.values;let e=[x(u().get("diretorioSkillsWorkspace")||".devin/skills"),x(u().get("diretorioSkillsGlobal")||"~/.config/devin/skills"),x(".claude/skills"),x("~/.claude/skills")],o=[];for(let a of e)try{if(!a||!m.existsSync(a))continue;for(let s of m.readdirSync(a)){let i=c.join(a,s,"SKILL.md");m.existsSync(i)&&o.push(s)}}catch{}let n=Array.from(new Set(o)).sort();return q={at:t,values:n},n}function Ke(t){return c.basename(String(t||""),c.extname(String(t||""))).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^[._-]+|[._-]+$/g,"").replace(/-{2,}/g,"-")||"skill"}function kt(){return x(u().get("diretorioSkillsWorkspace")||".devin/skills")}function Ct(){return x(u().get("diretorioAgentesWorkspace")||".devin/agents")}function St(){return x(u().get("diretorioToolsWorkspace")||".devin/tools")}function Mt(t,e){let o=c.join(t,e),n=2;for(;m.existsSync(o);)o=c.join(t,`${e}-${n}`),n++;return o}function Je(t){return Ee(t,kt(),"SKILL.md")}function Qe(t){return Ee(t,Ct(),"AGENT.md")}function Me(t){return Ee(t,St(),"TOOL.md")}function Ee(t,e,o){let n=String(t||"");if(!n||c.extname(n).toLowerCase()!==".md")throw new Error("Selecione um arquivo .md para importar.");if(!m.existsSync(n)||!m.statSync(n).isFile())throw new Error("Arquivo markdown nao encontrado: "+n);if(!e)throw new Error("Diretorio padrao nao resolvido.");let a=Ke(n),s=Mt(e,a),i=c.basename(s);m.mkdirSync(s,{recursive:!0});let r=c.join(s,o);return m.copyFileSync(n,r),E(),{name:i,file:r,dir:s}}function de(){let t=d.window.activeTextEditor;if(!t)return"Nenhum editor ativo.";let e=t.document,o=t.selection&&!t.selection.isEmpty?e.getText(t.selection):e.getText();return[`Arquivo: ${e.uri.fsPath}`,"Conteudo:","```",o.slice(0,6e4),"```"].join(`
`)}function De(t){return t?Math.max(1,Math.ceil(String(t).length/4)):0}function Et(t){if(!t||!t.selection||t.selection.isEmpty)return null;let e=t.document,o=t.selection,n=e.getText(o);if(!n||!n.trim())return null;let a=e.uri.fsPath,s=c.basename(a),i=o.start.line+1,r=o.end.line+1;return{id:"sel-"+Date.now().toString(36),file:a,base:s,language:e.languageId,startLine:i,endLine:r,text:n,preview:n.split(`
`).slice(0,2).join(" ").slice(0,80),label:`${s}:${i}-${r}`}}function Ze(){try{if(u().get("usarContextoEditorAutomatico")===!1)return null;let e=String(u().get("modoContextoEditorAutomatico")||"selecao-ou-arquivo");if(e==="desativado")return null;let o=d.window.activeTextEditor;if(!o)return null;let n=o.document;if(!n||!n.uri||n.uri.scheme!=="file")return null;let a=n.uri.fsPath,s=c.basename(a),i=n.languageId||c.extname(a).slice(1)||"",r="```",l=o.selection,p=!!(l&&!l.isEmpty);if(e!=="somente-arquivo"&&p){let ne=n.getText(l);if(!ne||!ne.trim())return null;let ot=l.start.line+1,at=l.end.line+1,Le=`${s}:${ot}-${at}`,st=["","",`[Contexto automatico do editor: ${Le}]`,r+i,ne,r].join(`
`);return{label:Le,promptBlock:st}}if(e==="somente-selecao")return null;let h=n.getText();if(!h||!h.trim())return null;let y=Number(u().get("limiteBytesContextoEditorAutomatico")),C=Number.isFinite(y)&&y>0?y:2e5,B=Buffer.from(h,"utf8"),te=B.length>C,nt=te?B.subarray(0,C).toString("utf8"):h,Ae=te?`${s} (truncado)`:s,Ie=["","",`[Contexto automatico do editor: ${Ae}]`,r+i,nt,r];return te&&Ie.push(`[NOTA: arquivo truncado em ${C} bytes para limitar o tamanho do contexto automatico.]`),{label:Ae,promptBlock:Ie.join(`
`)}}catch{return null}}function pe(){try{return j.execFileSync("git",["diff","--no-ext-diff"],{cwd:T(),encoding:"utf8",maxBuffer:1024*1024*8,windowsHide:!0})}catch(t){return`Nao foi possivel obter git diff: ${t.message}`}}function ue(){P||(P=d.window.createStatusBarItem(d.StatusBarAlignment.Right,90),P.command="devinCliChat.abrirPainel",P.show()),P.text=`Devin: ${S()} / ${Z()}`,P.tooltip=`Workspace: ${F()} | Modo: ${le()} | Skills: ${L().length}`}async function Te(){let t=await d.window.showInputBox({title:"Modelo Devin",prompt:"Informe um modelo aceito pelo seu Devin CLI, por exemplo claude-sonnet-4, claude-opus-4.6, opus ou codex.",value:S()==="auto"?"":S()});if(!t||!t.trim())return;let e=M(t);e!==String(t).trim().toLowerCase()&&d.window.showInformationMessage(`Modelo "${t.trim()}" foi normalizado para "${e}".`),await b("modeloAtual",e)}async function Tt(){E();let t=await Y();if(t.length){let o=Array.from(new Set([...u().get("modelosDisponiveis")||[],...t]));await u().update("modelosDisponiveis",o,d.ConfigurationTarget.Workspace),E()}let e=await d.window.showQuickPick([...z(),"+ Informar modelo manual"],{placeHolder:"Selecione o modelo Devin"});if(e){if(e.startsWith("+"))return Te();await b("modeloAtual",e)}}async function At(){let t=Se(),e="+ Importar arquivo .md como skill",o=new Set(L()),n=[{label:e,description:"Copia para o diretorio padrao de skills"},...t.map(i=>({label:i,picked:o.has(i)}))],a=await d.window.showQuickPick(n,{canPickMany:!0,placeHolder:t.length?"Selecione skills disponiveis para o Devin":"Importe um .md ou selecione skills disponiveis"});if(!a)return;let s=a.filter(i=>i.label!==e).map(i=>i.label);if(a.some(i=>i.label===e)){let i=await Ye({selectImported:!1});i&&s.push(i.name)}await b("skillsSelecionadas",Array.from(new Set(s)))}async function It(){let t=Ce(),e="+ Importar arquivo .md como tool",o=new Set(N()),n=[{label:e,description:"Copia para o diretorio padrao de tools"},...t.map(i=>({label:i,picked:o.has(i)}))],a=await d.window.showQuickPick(n,{canPickMany:!0,placeHolder:t.length?"Selecione tools disponiveis para o Devin":"Importe um .md ou selecione tools disponiveis"});if(!a)return;let s=a.filter(i=>i.label!==e).map(i=>i.label);if(a.some(i=>i.label===e)){let i=await ee({kind:"tool",importer:Me,configKey:"toolsSelecionadas",selectImported:!1});i&&s.push(i.name)}await b("toolsSelecionadas",Array.from(new Set(s)))}async function Ye(t){return ee({kind:"skill",importer:Je,configKey:"skillsSelecionadas",selectImported:!t||t.selectImported!==!1})}async function Xe(t){return await ee({kind:"agente",importer:Qe,configKey:"agenteAtual",singleValue:!0,selectImported:!t||t.selectImported!==!1})}async function Lt(t){return ee({kind:"tool",importer:Me,configKey:"toolsSelecionadas",selectImported:!t||t.selectImported!==!1})}async function ee(t){let e=await d.window.showOpenDialog({canSelectFiles:!0,canSelectFolders:!1,canSelectMany:!1,filters:{Markdown:["md"]},title:"Importar arquivo Markdown como "+t.kind+" Devin"});if(!e||!e.length)return null;try{let o=t.importer(e[0].fsPath);if(t.selectImported!==!1)if(t.singleValue)await b(t.configKey,o.name);else{let n=new Set(t.configKey==="toolsSelecionadas"?N():L());n.add(o.name),await b(t.configKey,Array.from(n))}return g&&g.refreshMeta(),d.window.showInformationMessage(`${t.kind} "${o.name}" importado para ${o.file}.`),o}catch(o){return d.window.showErrorMessage("Falha ao importar "+t.kind+": "+(o&&o.message?o.message:String(o))),null}}function I(){try{return U&&U.globalState.get(he)||[]}catch{return[]}}async function V(t){try{U&&await U.globalState.update(he,t.slice(0,rt))}catch{}}function et(t){try{if(!t||!t.globalState||t.globalState.get(re))return!1;let e=t.globalState.get(he)||[];return!Array.isArray(e)||e.length===0}catch{return!1}}async function tt(t){if(!et(t))return!1;try{return await d.workspace.getConfiguration("workbench").update("sideBar.location","right",d.ConfigurationTarget.Global),await t.globalState.update(re,!0),f("Primeira instalacao: sideBar.location definido como right."),!0}catch(e){f("Falha ao posicionar sidebar a direita: "+(e&&e.message?e.message:String(e)));try{await t.globalState.update(re,!0)}catch{}return!1}}var me=class{constructor(e){this.context=e,this.view=void 0,this.busy=!1,this.session=this.newSession()}newSession(){return{id:"sess-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6),title:"Nova conversa",createdAt:Date.now(),updatedAt:Date.now(),workspace:F(),model:S(),agent:Z(),mode:le(),skills:L(),tools:N(),messages:[]}}async persistSession(){if(!this.session||!this.session.messages.length)return;let e=I(),o=e.findIndex(n=>n.id===this.session.id);if(this.session.updatedAt=Date.now(),!this.session.title||this.session.title==="Nova conversa"){let n=this.session.messages.find(a=>a.role==="user");n&&(this.session.title=String(n.text).slice(0,60).replace(/\s+/g," ").trim())}o>=0?e[o]=this.session:e.unshift(this.session),e.sort((n,a)=>(a.updatedAt||0)-(n.updatedAt||0)),await V(e)}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this.context.extensionUri]},e.webview.html=this.html(e.webview),f("WebView resolvida e HTML injetado."),e.webview.onDidReceiveMessage(async o=>{try{let n=ze(o);if(!n){f("Mensagem webview rejeitada por validacao.");return}let a=n.type;if(f(`Mensagem recebida do webview: type=${a}`),a==="ready"){this.refreshMeta(),this.replaySession(),this.pushCurrentSelection();return}if(a==="clientError"){f(`ERRO no cliente webview: ${n.text||"sem detalhes"}`),this.post({type:"message",role:"assistant",text:"Falha no painel: "+(n.text||"erro sem detalhes")});return}if(a==="cancelRun"){let s=we(this.session&&this.session.id);this.post({type:"action",ok:s,text:s?"Cancelamento solicitado.":"Nenhuma execucao integrada ativa para cancelar."});return}if(a==="verifyCli"){this.verifyCli();return}if(a==="requestSelection"){this.pushCurrentSelection(!0);return}if(a==="attachMenu"){await this.chooseAttachSource();return}if(a==="attachFiles"){await this.attachFiles();return}if(a==="pickWorkspaceFiles"){await this.pickWorkspaceFiles();return}if(a==="listWorkspace"){this.listWorkspaceDir(n.path||"");return}if(a==="attachFolder"){await this.attachFolder(n.path||"");return}if(a==="attachWorkspacePath"){await this.attachWorkspacePath(n.path||"");return}if(a==="searchWorkspaceFiles"){await this.searchWorkspaceFiles(n.query||"");return}if(a==="send"){await this.send(n.text||"",{echoUser:n.echo!==!1,displayText:n.displayText||n.text||"",hasExplicitContext:!!n.hasExplicitContext});return}if(a==="setModel"){await b("modeloAtual",M(n.value||"auto"));return}if(a==="setAgent"){await b("agenteAtual",n.value||"auto");return}if(a==="importAgentFile"){let s=await Xe();s&&this.post({type:"action",ok:!0,text:"Agente importado: "+s.name});return}if(a==="importSkillFile"){let s=await Ye();s&&this.post({type:"action",ok:!0,text:"Skill importada: "+s.name});return}if(a==="importToolFile"){let s=await Lt();s&&this.post({type:"action",ok:!0,text:"Tool importada: "+s.name});return}if(a==="toggleSkill"){let s=new Set(L());n.value&&s.has(n.value)?s.delete(n.value):n.value&&s.add(n.value),await b("skillsSelecionadas",Array.from(s));return}if(a==="toggleTool"){let s=new Set(N());n.value&&s.has(n.value)?s.delete(n.value):n.value&&s.add(n.value),await b("toolsSelecionadas",Array.from(s));return}if(a==="manualModel"){await Te();return}if(a==="refreshModels"){this.refreshMeta();let s=await Y();if(s.length){let i=Array.from(new Set([...u().get("modelosDisponiveis")||[],...s]));await u().update("modelosDisponiveis",i,d.ConfigurationTarget.Workspace)}this.refreshMeta(),this.post({type:"action",ok:!0,text:"Modelos atualizados ("+z().length+" disponiveis)."});return}if(a==="review"){await this.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+pe()+"\n```",{echoUser:!0});return}if(a==="selection"){await this.send(`Analise o contexto do editor atual.

`+de(),{echoUser:!0});return}if(a==="insertSelection"){this.post({type:"insertPrompt",text:`Analise o contexto do editor atual.

`+de()});return}if(a==="newChat"){await this.persistSession(),this.session=this.newSession(),this.post({type:"clearThread"}),this.refreshMeta();return}if(a==="getHistory"){await this.openHistory();return}if(a==="exportSession"){await this.exportSession(n.id);return}if(a==="loadSession"){await this.persistSession();let i=I().find(r=>r.id===n.id);i&&(this.session=JSON.parse(JSON.stringify(i)),this.post({type:"clearThread"}),this.replaySession(),this.refreshMeta(),this.post({type:"action",ok:!0,text:"Sessao carregada: "+(i.title||i.id)}));return}if(a==="deleteSession"){let s=I().filter(i=>i.id!==n.id);await V(s),this.session&&this.session.id===n.id&&(this.session=this.newSession(),this.post({type:"clearThread"})),this.post({type:"history",sessions:s}),this.refreshMeta();return}if(a==="clearHistory"){await V([]),this.session=this.newSession(),this.post({type:"clearThread"}),this.post({type:"history",sessions:[]}),this.refreshMeta();return}this.post({type:"action",ok:!1,text:`Acao desconhecida: ${a}`})}catch(n){this.busy=!1,this.post({type:"busy",value:!1}),f(`ERRO no handler do webview: ${n&&n.message?n.message:String(n)}`),n&&n.stack&&f(n.stack),this.post({type:"message",role:"assistant",text:"Falha ao executar acao do painel: "+(n&&n.message?n.message:String(n))})}}),setTimeout(()=>this.refreshMeta(),50)}post(e){try{this.view&&this.view.webview.postMessage(e)}catch{}}async openHistory(){await this.persistSession();let e=I().filter(o=>o&&o.messages&&o.messages.length);this.post({type:"openHistory",sessions:e}),this.refreshMeta()}async exportSession(e){await this.persistSession();let o=I(),a=(e?o.find(i=>i.id===e):null)||this.session;if(!a||!a.messages||!a.messages.length){let i="Nao ha conversa com mensagens para exportar.";this.post({type:"action",ok:!1,text:i}),d.window.showInformationMessage(i);return}await d.env.clipboard.writeText(je(a));let s="Conversa exportada em Markdown para a area de transferencia.";this.post({type:"action",ok:!0,text:s}),d.window.showInformationMessage(s)}verifyCli(){D.show(!0),f(`Verificando Devin CLI pelo painel: ${k()}`),j.execFile(k(),["--version"],{cwd:T(),windowsHide:!0},(e,o,n)=>{if(e){let i=`Falha ao verificar Devin CLI: ${e.message}`;f(i),this.post({type:"message",role:"assistant",text:i}),this.post({type:"action",ok:!1,text:i});return}let s=`Devin CLI encontrado: ${(o||n||"ok").trim()}`;f(s),this.post({type:"message",role:"assistant",text:s}),this.post({type:"action",ok:!0,text:s})})}pushCurrentSelection(e){let o=d.window.activeTextEditor,n=Et(o);n&&this.post({type:"selectionAvailable",selection:n})}attachmentId(e){return e+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}readFileItem(e,o){let n=m.statSync(e);if(n.size>oe)return{skipped:!0,reason:`Arquivo muito grande: ${c.basename(e)} (${n.size} bytes).`};let a=m.readFileSync(e,"utf8"),s=c.extname(e).slice(1);return{id:this.attachmentId("file"),file:e,base:c.basename(e),label:o||c.basename(e),type:"file",text:a,language:s,lines:a.split(`
`).length}}readFolderItem(e,o){let n=v(),a=o||c.basename(e)||"workspace",s=[],i=[e];for(;i.length&&s.length<ae;){let r=i.pop(),l;try{l=m.readdirSync(r,{withFileTypes:!0})}catch{continue}for(let p of l){let h=c.join(r,p.name);if(p.isDirectory())!lt.has(p.name)&&!p.name.startsWith(".")&&i.push(h);else if(p.isFile())try{if(m.statSync(h).size>oe)continue;let C=m.readFileSync(h,"utf8"),B=n&&h.startsWith(n)?c.relative(n,h):c.join(a,c.relative(e,h));if(s.push({file:h,rel:B.replace(/\\/g,"/"),base:c.basename(h),text:C,language:c.extname(h).slice(1),lines:C.split(`
`).length}),s.length>=ae)break}catch{}}}return{id:this.attachmentId("folder"),file:e,base:a,label:`${a} (${s.length})`,type:"folder",files:s,count:s.length,truncated:s.length>=ae}}async chooseAttachSource(){let e=await d.window.showQuickPick([{label:"$(folder) Pastas",description:"Anexar pasta recursivamente como chip unico",value:"folders"},{label:"$(file) Arquivos abertos",description:"Anexar arquivos atualmente abertos no editor",value:"openFiles"}],{placeHolder:"Anexar contexto ao Devin"});if(!e)return;if(e.value==="folders"){let r=await d.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!1,canSelectFolders:!0,defaultUri:v()?d.Uri.file(v()):void 0,openLabel:"Anexar pasta"});if(!r||!r.length)return;let l=[];for(let p of r)try{let h=this.readFolderItem(p.fsPath,c.basename(p.fsPath));h.files&&h.files.length&&l.push(h)}catch(h){this.post({type:"action",ok:!1,text:`Falha ao anexar pasta ${p.fsPath}: ${h.message}`})}l.length&&this.post({type:"attachItems",items:l}),this.post({type:"action",ok:!0,text:`Anexadas ${l.length} pasta(s).`});return}let o=d.workspace.textDocuments.filter(r=>r.uri&&r.uri.scheme==="file"&&!r.isUntitled);if(!o.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo aberto para anexar."});return}let n=v()||"",a=o.map(r=>({label:"$(file) "+c.basename(r.uri.fsPath),description:n?c.dirname(c.relative(n,r.uri.fsPath)):c.dirname(r.uri.fsPath),detail:r.uri.fsPath,doc:r})),s=await d.window.showQuickPick(a,{canPickMany:!0,placeHolder:"Selecione arquivos abertos para anexar"});if(!s||!s.length)return;let i=[];for(let r of s){let l=r.doc,p=l.getText();if(Buffer.byteLength(p,"utf8")>oe){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${c.basename(l.uri.fsPath)}.`});continue}i.push({id:this.attachmentId("file"),file:l.uri.fsPath,base:c.basename(l.uri.fsPath),label:c.basename(l.uri.fsPath),type:"file",text:p,language:l.languageId||c.extname(l.uri.fsPath).slice(1),lines:p.split(`
`).length})}i.length&&this.post({type:"attachItems",items:i})}async attachFiles(){try{let e=await d.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!0,canSelectFolders:!1,defaultUri:v()?d.Uri.file(v()):void 0,openLabel:"Anexar ao chat"});if(!e||!e.length)return;let o=[];for(let n of e)try{let a=m.statSync(n.fsPath);if(a.size>1024*1024){o.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n.fsPath,base:c.basename(n.fsPath),label:c.basename(n.fsPath),type:"file",text:`Arquivo ${n.fsPath} muito grande (${a.size} bytes) - nao anexado.`,language:"",tooBig:!0});continue}let s=m.readFileSync(n.fsPath,"utf8"),i=c.extname(n.fsPath).slice(1);o.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n.fsPath,base:c.basename(n.fsPath),label:c.basename(n.fsPath),type:"file",text:s,language:i,lines:s.split(`
`).length})}catch(a){this.post({type:"action",ok:!1,text:`Falha ao ler ${n.fsPath}: ${a.message}`})}o.length&&this.post({type:"attachItems",items:o})}catch(e){this.post({type:"action",ok:!1,text:"Falha ao anexar: "+(e&&e.message?e.message:String(e))})}}async pickWorkspaceFiles(){try{let e=await d.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__}/**",5e3);if(!e.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo encontrado."});return}let o=v()||"",n=e.map(i=>({label:c.relative(o,i.fsPath)||c.basename(i.fsPath),description:"",uri:i})),a=await d.window.showQuickPick(n,{placeHolder:"Selecione arquivos do workspace para anexar",canPickMany:!0,matchOnDescription:!0});if(!a||!a.length)return;let s=[];for(let i of a)try{if(m.statSync(i.uri.fsPath).size>1024*1024)continue;let l=m.readFileSync(i.uri.fsPath,"utf8"),p=c.extname(i.uri.fsPath).slice(1);s.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:i.uri.fsPath,base:c.basename(i.uri.fsPath),label:c.basename(i.uri.fsPath),type:"file",text:l,language:p})}catch{}s.length&&this.post({type:"attachItems",items:s})}catch(e){this.post({type:"action",ok:!1,text:"Falha: "+(e&&e.message?e.message:String(e))})}}listWorkspaceDir(e){try{let o=v();if(!o){this.post({type:"workspaceList",path:e||"",entries:[],error:"Sem workspace aberto."});return}let n=Q(e||"");if(!n){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio fora do workspace."});return}if(!m.existsSync(n)||!m.statSync(n).isDirectory()){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio invalido."});return}let a=c.relative(o,n).replace(/\\/g,"/"),s=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),i=m.readdirSync(n,{withFileTypes:!0}).filter(r=>!r.name.startsWith(".")||[".cognition",".devin",".claude",".cursor",".vscode"].includes(r.name)).filter(r=>!(r.isDirectory()&&s.has(r.name))).map(r=>{let l=0;try{r.isFile()&&(l=m.statSync(c.join(n,r.name)).size)}catch{}return{name:r.name,isDir:r.isDirectory(),size:l}}).sort((r,l)=>l.isDir-r.isDir||r.name.localeCompare(l.name));this.post({type:"workspaceList",path:a,entries:i})}catch(o){this.post({type:"workspaceList",path:"",entries:[],error:o.message})}}async attachWorkspacePath(e){if(!v())return;let n=Q(e||"");if(!n){this.post({type:"action",ok:!1,text:"Caminho fora do workspace."});return}if(!m.existsSync(n)){this.post({type:"action",ok:!1,text:"Caminho invalido."});return}if(m.statSync(n).isDirectory()){await this.attachFolder(e);return}try{let a=m.statSync(n);if(a.size>1024*1024){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${c.basename(n)} (${a.size} bytes).`});return}let s=m.readFileSync(n,"utf8"),i=c.extname(n).slice(1);this.post({type:"attachItems",items:[{id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n,base:c.basename(n),label:c.basename(n),type:"file",text:s,language:i}]})}catch(a){this.post({type:"action",ok:!1,text:"Falha: "+a.message})}}async searchWorkspaceFiles(e){try{let o=v();if(!o){this.post({type:"workspaceFileSuggestions",query:e,files:[]});return}let n=String(e||"").toLowerCase(),s=(await d.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__,.next,.nuxt,.cache,target,.idea}/**",1e3)).map(i=>{let r=c.relative(o,i.fsPath).replace(/\\/g,"/");return{label:r,path:r,base:c.basename(i.fsPath)}}).filter(i=>!n||i.label.toLowerCase().includes(n)||i.base.toLowerCase().includes(n)).slice(0,20);this.post({type:"workspaceFileSuggestions",query:e,files:s})}catch(o){this.post({type:"workspaceFileSuggestions",query:e,files:[],error:o&&o.message?o.message:String(o)})}}async attachFolder(e){let o=v();if(!o)return;let n=Q(e||"");if(!n){this.post({type:"action",ok:!1,text:"Pasta fora do workspace."});return}let a=c.relative(o,n).replace(/\\/g,"/");if(!m.existsSync(n)||!m.statSync(n).isDirectory()){this.post({type:"action",ok:!1,text:"Pasta invalida."});return}let s=this.readFolderItem(n,a?c.basename(n):F());s.files&&s.files.length&&this.post({type:"attachItems",items:[s]}),this.post({type:"action",ok:!0,text:`Pasta anexada como chip unico: ${s.label}.`})}replaySession(){if(!(!this.session||!this.session.messages.length))for(let e of this.session.messages)this.post({type:"message",role:e.role,text:e.text,replay:!0})}refreshMeta(){let e={type:"meta",models:ie,model:S(),agents:["auto"],agent:Z(),skills:[],selectedSkills:L(),selectedTools:N(),mode:le(),workspace:F(),sessionId:this.session&&this.session.id,sessionTitle:this.session&&this.session.title,modelLocked:!1,hasMessages:!!(this.session&&this.session.messages&&this.session.messages.length),tokensTotal:this.session&&this.session.tokens||0,tokensIn:this.session&&this.session.tokensIn||0,tokensOut:this.session&&this.session.tokensOut||0,modelStatus:"modelo: auto"};try{e.models=z()}catch{e.models=ie}try{e.agents=ke()}catch{e.agents=["auto"]}try{e.skills=Se()}catch{e.skills=[]}try{e.tools=Ce()}catch{e.tools=[]}try{e.recentSessions=I().slice(0,3).map(o=>({id:o.id,title:o.title||"Sem titulo",updatedAt:o.updatedAt,messages:(o.messages||[]).length,model:o.model||"auto"}))}catch{e.recentSessions=[]}try{e.modelStatus=`${e.models.length} modelos | ${e.skills.length} skills | ${e.tools.length} tools`}catch{}this.post(e),this.refreshModelsFromCliInBackground()}refreshModelsFromCliInBackground(){u().get("descobrirModelosAutomaticamente",!0)&&(this.refreshingModels||(this.refreshingModels=!0,Y().then(async e=>{if(e&&e.length){let o=Array.from(new Set([...u().get("modelosDisponiveis")||[],...e]));await u().update("modelosDisponiveis",o,d.ConfigurationTarget.Workspace),E();let n=z();this.post({type:"meta",models:n,model:S(),modelStatus:`${n.length} modelos do Devin CLI`})}}).catch(e=>{f("Falha ao descobrir modelos em background: "+(e&&e.message?e.message:String(e)))}).finally(()=>{this.refreshingModels=!1})))}async send(e,o){let n=String(e||"").trim();if(!n)return;let a=String(o&&o.displayText?o.displayText:n).trim(),s=_e(n);s&&(n=s.text,s.command==="review"&&(n=n+"\n\n```diff\n"+pe()+"\n```"),a=s.displayText||a);let i=null;if(!o||!o.hasExplicitContext){let l=Ze();l&&l.promptBlock&&(n=n+l.promptBlock,a=a+`

[Contexto automatico: `+l.label+"]",i=l.label)}if(this.busy){this.post({type:"message",role:"assistant",text:"Ja existe uma execucao em andamento. A concorrencia permanece controlada no backend."});return}this.busy=!0;let r=De(_(n));this.session.tokensIn=(this.session.tokensIn||0)+r,this.session.tokens=(this.session.tokens||0)+r,(!o||o.echoUser!==!1)&&this.post({type:"message",role:"user",text:a}),this.session.messages.push({role:"user",text:a,fullText:n,ts:Date.now(),tokens:r}),this.post({type:"busy",value:!0}),i&&this.post({type:"ctxHint",text:"\u{1F4C4} Contexto automatico: "+i}),this.post({type:"action",ok:!0,text:"Enviando para o Devin CLI..."}),this.refreshMeta();try{f(`send: modo=resposta-integrada prompt=${n.length} chars`);let l=await Ve(n,{sessionId:this.session.id});f(`send: resposta recebida (${l?l.length:0} chars)`);let p=De(l);this.session.tokensOut=(this.session.tokensOut||0)+p,this.session.tokens=(this.session.tokens||0)+p,this.post({type:"message",role:"assistant",text:l}),this.session.messages.push({role:"assistant",text:l,ts:Date.now(),tokens:p})}catch(l){f(`send ERRO: ${l&&l.message?l.message:String(l)}`);let p="Falha ao enviar para o Devin CLI: "+(l&&l.message?l.message:String(l));this.post({type:"message",role:"assistant",text:p}),this.session.messages.push({role:"assistant",text:p,ts:Date.now()})}finally{this.busy=!1,this.post({type:"busy",value:!1}),await this.persistSession(),this.refreshMeta()}}html(e){let o=Ne(),n={history:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.4 1.6"/></svg>',plus:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',refresh:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.55"/><path d="M13 3v3h-3"/></svg>',terminal:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7l2 1.5L5 10M8.5 10.5h3"/></svg>',lock:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',paperclip:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',attach:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',file:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13"/></svg>',folder:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>',close:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',send:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 13.5L14 8 2 2.5 2 7l8 1-8 1z"/></svg>',brain:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3a2 2 0 0 0-2 2 2 2 0 0 0-1 3.5 2 2 0 0 0 1.5 3 2 2 0 0 0 3.5 0V3.5A1.5 1.5 0 0 0 5.5 3z"/><path d="M10.5 3a2 2 0 0 1 2 2 2 2 0 0 1 1 3.5 2 2 0 0 1-1.5 3 2 2 0 0 1-3.5 0V3.5A1.5 1.5 0 0 1 10.5 3z"/></svg>',bot:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="10" height="7" rx="1.5"/><path d="M8 3v2.5M5.5 8.5h.01M10.5 8.5h.01M2 9.5v1.5M14 9.5v1.5"/></svg>',mode:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5h12M2 8h8M2 10.5h10"/></svg>',sparkle:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l1.2 3.4L12.5 6.5 9.2 7.6 8 11l-1.2-3.4L3.5 6.5 6.8 5.4z"/></svg>',wrench:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M10.8 2.2a3.2 3.2 0 0 0-3.7 4.1L2.6 10.8a1.7 1.7 0 0 0 2.4 2.4l4.5-4.5a3.2 3.2 0 0 0 4.1-3.7l-2.2 2.2-2.1-.5-.5-2.1z"/></svg>',caret:'<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l6 5-6 5z"/></svg>'},a=[{label:"auto",value:"auto"},{label:"sonnet",value:"sonnet"},{label:"opus",value:"opus"},{label:"swe",value:"swe"},{label:"gpt",value:"gpt"}];return`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${e.cspSource} data:; style-src 'unsafe-inline' ${e.cspSource}; script-src 'nonce-${o}';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
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
.composerBar{display:flex;align-items:center;gap:6px;padding:6px 8px 8px 8px;border-top:1px solid var(--border);overflow-x:auto;scrollbar-width:none}
.composerBar::-webkit-scrollbar{display:none}
.chipBtn{height:26px;border:0;background:transparent;color:var(--muted);border-radius:6px;padding:0 8px;display:inline-flex;align-items:center;gap:5px;font-size:11px;white-space:nowrap;cursor:pointer;flex:0 0 auto;min-width:max-content}
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
.menu .menuAction{width:100%;border:0;border-bottom:1px solid var(--border);background:transparent;color:var(--fg);cursor:pointer;text-align:left;padding:7px 12px;font-size:12px}
.menu .menuAction:hover{background:var(--hover)}
.suggestMenu{position:absolute;left:10px;right:10px;bottom:74px;max-height:220px;overflow:auto;background:var(--bg);border:1px solid var(--border);border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.35);z-index:45;padding:4px 0;font-size:12px}
.suggestItem{display:flex;flex-direction:column;gap:2px;padding:7px 10px;cursor:pointer}
.suggestItem:hover,.suggestItem.active{background:var(--hover)}
.suggestItem .title{color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.suggestItem .desc{color:var(--muted);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.narrow .chipBtn .chipText{display:inline}
body.narrow .chipBtn{padding:0 7px;width:auto;justify-content:center}
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
  <button type="button" class="iconBtn" data-action="toggleHistory" title="Historico">${n.history}</button>
  <button type="button" class="iconBtn" data-action="newChat" title="Nova conversa">${n.plus}</button>
  <button type="button" class="iconBtn" data-action="refreshModels" title="Atualizar modelos">${n.refresh}</button>
  <button type="button" class="iconBtn" data-action="verifyCli" title="Verificar Devin CLI">i</button>
</header>
<div id="historyPanel" class="panel"><header>Historico <div class="barSpacer"></div><button data-action="clearHistory">Limpar</button></header><div id="historyList"></div></div>

<main class="thread" id="thread">
  <section class="welcome" id="welcome">
    <div class="welcomeTitle">Como posso ajudar neste workspace?</div>
    <div class="welcomeText">Selecione modelo, agente, skills e tools antes de enviar. As ultimas conversas ficam disponiveis para continuar.</div>
    <div id="recentBlock" class="recentBlock" style="display:none">
      <div class="recentHead">${n.history} Conversas recentes</div>
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
      <button type="button" class="chipBtn" data-action="attachMenu" id="attachBtn" title="Anexar contexto">${n.attach}<span class="chipText">Anexar</span></button>
      <button type="button" class="chipBtn" data-action="openModelMenu" id="modelChip" title="Modelo">${n.brain}<span class="chipText" id="modelChipText">Modelo</span><span class="caret">${n.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openAgentMenu" id="agentChip" title="Agente">${n.bot}<span class="chipText" id="agentChipText">Agente</span><span class="caret">${n.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openSkillsMenu" id="skillsBtn" title="Skills">${n.sparkle}<span class="chipText">Skills <span id="skillsCount">0</span></span></button>
      <button type="button" class="chipBtn" data-action="openToolsMenu" id="toolsBtn" title="Tools">${n.wrench}<span class="chipText">Tools <span id="toolsCount">0</span></span></button>
      <span class="barSpacer"></span>
      <span class="busyDot"></span>
      <span class="tokenPie" id="tokenPie" title="Tokens"></span>
      <button class="stopBtn" id="cancel" type="button" data-action="cancelRun" title="Cancelar execucao">\xD7</button>
      <button class="sendBtn" id="send" type="button" data-action="send" title="Enviar">${n.send}</button>
    </div>
  </div>
</footer>
</div>
<script nonce="${o}">
(function(){
'use strict';
var vscode = acquireVsCodeApi();
var ICONS = ${JSON.stringify(n)};
var MODEL_TREE = ${JSON.stringify(a)};
var META = { skills: [], selectedSkills: [], tools: [], selectedTools: [], modelLocked: false, hasMessages: false, model: 'auto', agent: 'auto', mode: 'resposta-integrada', agents: ['auto'], tokensTotal: 0, tokensIn: 0, tokensOut: 0, recentSessions: [] };
var busy = false;
var pendingSelection = null;
var attachedItems = [];
var openMenu = null;

function byId(id){ return document.getElementById(id); }
function txt(v){ return String(v == null ? '' : v); }
function post(m){ vscode.postMessage(m); }
function setStatus(v){ /* status removido da barra */ }
function estTokens(t){ if(!t) return 0; return Math.max(1, Math.ceil(String(t).length/4)); }
function stripNulls(t){ return String(t == null ? '' : t).replace(/\\u0000/g, ''); }

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
  if(item.type === 'folder' && item.files){ return item.files.map(function(f){ return stripNulls(f.text || ''); }).join('\\n'); }
  return stripNulls(item.text || '');
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
      return '\\n\\nArquivo anexado ' + (f.rel || f.file || f.base || 'arquivo') + ' (' + lang + '):\\n' + fence + lang + '\\n' + stripNulls(f.text || '') + '\\n' + fence;
    }).join('') + truncNote;
  }
  var heading = item.type === 'file' ? ('Arquivo anexado ' + (item.file || item.label)) : ('Contexto anexado de ' + item.label);
  var fileTruncNote = item.truncated ? '\\n[NOTA: arquivo truncado \u2014 exibindo apenas os primeiros bytes por limite de tamanho.]' : '';
  return '\\n\\n' + heading + ' (' + (item.language||'') + '):\\n' + fence + (item.language||'') + '\\n' + stripNulls(item.text || '') + '\\n' + fence + fileTruncNote;
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
    var exp = document.createElement('button'); exp.type = 'button'; exp.textContent = 'Exportar';
    var del = document.createElement('button'); del.type = 'button'; del.textContent = 'Excluir';
    load.addEventListener('click', function(e){ e.stopPropagation(); post({ type: 'loadSession', id: s.id }); byId('historyPanel').classList.remove('open'); });
    exp.addEventListener('click', function(e){ e.stopPropagation(); post({ type: 'exportSession', id: s.id }); });
    del.addEventListener('click', function(e){
      e.stopPropagation();
      post({ type: 'deleteSession', id: s.id });
    });
    actions.appendChild(load); actions.appendChild(exp); actions.appendChild(del);
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
  var menu = document.createElement('div'); menu.className = 'menu'; menu.dataset.level = 1;
  var importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'menuAction';
  importBtn.textContent = '+ Importar .md como agente';
  importBtn.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'importAgentFile' }); closeAllMenus(); });
  menu.appendChild(importBtn);
  (META.agents || ['auto']).forEach(function(a){
    var row = document.createElement('div'); row.className = 'item';
    if(a === META.agent) row.classList.add('selected');
    var span = document.createElement('span'); span.textContent = a;
    row.appendChild(span);
    row.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'setAgent', value: a }); closeAllMenus(); });
    menu.appendChild(row);
  });
  document.body.appendChild(menu);
  positionMenuAnchor(menu, anchor);
  openMenu = 'agent';
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
  var importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'menuAction';
  importBtn.textContent = '+ Importar .md como skill';
  importBtn.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'importSkillFile' }); });
  menu.appendChild(importBtn);
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

function openToolsMenu(){
  closeAllMenus();
  var anchor = byId('toolsBtn');
  var menu = document.createElement('div'); menu.className = 'menu'; menu.dataset.level = 1;
  var head = document.createElement('div'); head.className = 'head';
  var title = document.createElement('span'); title.textContent = 'Tools disponiveis';
  var sp = document.createElement('span'); sp.className = 'barSpacer';
  head.appendChild(title); head.appendChild(sp);
  menu.appendChild(head);
  var tools = META.tools || []; var sel = new Set(META.selectedTools || []);
  if(!tools.length){ var e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Nenhuma tool em .devin/tools'; menu.appendChild(e); }
  var importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'menuAction';
  importBtn.textContent = '+ Importar .md como tool';
  importBtn.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'importToolFile' }); closeAllMenus(); });
  menu.appendChild(importBtn);
  tools.forEach(function(name){
    var lab = document.createElement('label'); lab.className = 'check';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = sel.has(name);
    cb.addEventListener('change', function(ev){ ev.stopPropagation(); post({ type: 'toggleTool', value: name }); if(cb.checked) sel.add(name); else sel.delete(name); });
    var span = document.createElement('span'); span.textContent = name;
    lab.appendChild(cb); lab.appendChild(span);
    lab.addEventListener('click', function(ev){ ev.stopPropagation(); });
    menu.appendChild(lab);
  });
  document.body.appendChild(menu);
  positionMenuAnchor(menu, anchor);
  openMenu = 'tools';
}

var browserPath = '';
var browserMenuEl = null;
var suggestMenuEl = null;
var suggestTrigger = null;
var slashItems = [
  { label: '/review', desc: 'Revisar git diff atual' },
  { label: '/tests ', desc: 'Planejar/implementar testes para um tema' },
  { label: '/plan ', desc: 'Criar plano tecnico' },
  { label: '/explain ', desc: 'Explicar arquitetura ou trecho' },
  { label: '/security ', desc: 'Revisar riscos de seguranca' },
  { label: '/docs ', desc: 'Gerar documentacao pratica' },
  { label: '/commit-msg', desc: 'Gerar mensagem de commit' }
];
function closeSuggestions(){
  if(suggestMenuEl && suggestMenuEl.parentNode) suggestMenuEl.parentNode.removeChild(suggestMenuEl);
  suggestMenuEl = null; suggestTrigger = null;
}
function promptTrigger(){
  var el = byId('prompt'); if(!el) return null;
  var before = el.value.slice(0, el.selectionStart || 0);
  var slash = before.match(new RegExp('(?:^|\\\\n)(/[^\\\\s]*)$'));
  if(slash) return { type: 'slash', token: slash[1], start: before.length - slash[1].length };
  var at = before.match(new RegExp('(?:^|\\\\s)@([^\\\\s]*)$'));
  if(at) return { type: 'file', token: at[1], start: before.length - at[1].length - 1 };
  return null;
}
function replacePromptRange(start, end, value){
  var el = byId('prompt'); if(!el) return;
  var v = el.value;
  el.value = v.slice(0, start) + value + v.slice(end);
  el.selectionStart = el.selectionEnd = start + value.length;
  el.focus(); updateTokens(); updateSuggestions();
}
function renderSuggestions(items, trigger){
  closeSuggestions();
  if(!items || !items.length) return;
  suggestTrigger = trigger;
  var menu = document.createElement('div'); menu.className = 'suggestMenu';
  items.slice(0, 12).forEach(function(it){
    var row = document.createElement('div'); row.className = 'suggestItem';
    var title = document.createElement('div'); title.className = 'title'; title.textContent = it.label;
    var desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = it.desc || it.path || '';
    row.appendChild(title); row.appendChild(desc);
    row.addEventListener('mousedown', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      var el = byId('prompt'); if(!el || !suggestTrigger) return;
      if(suggestTrigger.type === 'slash') replacePromptRange(suggestTrigger.start, el.selectionStart || 0, it.label);
      else {
        replacePromptRange(suggestTrigger.start, el.selectionStart || 0, '@' + it.path + ' ');
        post({ type: 'attachWorkspacePath', path: it.path });
      }
      closeSuggestions();
    });
    menu.appendChild(row);
  });
  document.body.appendChild(menu);
  suggestMenuEl = menu;
}
function updateSuggestions(){
  var trig = promptTrigger();
  if(!trig){ closeSuggestions(); return; }
  if(trig.type === 'slash'){
    var q = trig.token.toLowerCase();
    renderSuggestions(slashItems.filter(function(i){ return i.label.indexOf(q) === 0; }), trig);
  } else {
    post({ type: 'searchWorkspaceFiles', query: trig.token });
  }
}
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
  if(name === 'refreshModels') return post({ type: 'refreshModels' });
  if(name === 'review'){ setBusy(true); return post({ type: 'review' }); }
  if(name === 'selection'){ setBusy(true); return post({ type: 'selection' }); }
  if(name === 'starter') return sendPrompt(element.getAttribute('data-prompt') || '');
  if(name === 'toggleHistory'){ if(togglePanel('historyPanel')) post({ type: 'getHistory' }); return; }
  if(name === 'openSkillsMenu') return openSkillsMenu();
  if(name === 'openToolsMenu') return openToolsMenu();
  if(name === 'clearHistory'){ post({ type: 'clearHistory' }); return; }
  if(name === 'openModelMenu') return openModelMenu();
  if(name === 'openAgentMenu') return openAgentMenu();
  if(name === 'attachMenu') return post({ type: 'attachMenu' });
  if(name === 'verifyCli') return post({ type: 'verifyCli' });
  if(name === 'cancelRun') return post({ type: 'cancelRun' });
}

document.addEventListener('click', function(e){
  var b = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
  if(!b){ if(!e.target.closest('.menu')) closeAllMenus(); if(!e.target.closest('.suggestMenu')) closeSuggestions(); return; }
  e.preventDefault();
  closeAllMenus();
  try { action(b.getAttribute('data-action'), b); } catch(err){ clientError('acao ' + b.getAttribute('data-action'), err); }
});

var pe = byId('prompt');
if(pe){
  pe.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); sendPrompt(getPrompt()); } });
  pe.addEventListener('input', function(){ updateTokens(); updateSuggestions(); });
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
    META.tools = m.tools || []; META.selectedTools = m.selectedTools || [];
    META.modelLocked = !!m.modelLocked; META.hasMessages = !!m.hasMessages;
    META.model = m.model || 'auto'; META.agent = m.agent || 'auto'; META.mode = 'resposta-integrada';
    META.agents = m.agents || ['auto'];
    META.tokensTotal = m.tokensTotal || 0; META.tokensIn = m.tokensIn || 0; META.tokensOut = m.tokensOut || 0;
    META.recentSessions = m.recentSessions || [];

    var modelChip = byId('modelChip');
    var modelText = byId('modelChipText');
    if(modelText) modelText.textContent = META.model || 'Modelo';
    if(modelChip){ modelChip.disabled = false; modelChip.classList.toggle('has', !!META.model); }
    var agentText = byId('agentChipText'); if(agentText) agentText.textContent = META.agent === 'auto' ? 'Agente' : META.agent;
    var agentChip = byId('agentChip'); if(agentChip) agentChip.classList.toggle('has', META.agent !== 'auto');
    var c = byId('skillsCount'); if(c) c.textContent = (META.selectedSkills || []).length;
    var sb = byId('skillsBtn'); if(sb) sb.classList.toggle('has', (META.selectedSkills || []).length > 0);
    var tc = byId('toolsCount'); if(tc) tc.textContent = (META.selectedTools || []).length;
    var tb = byId('toolsBtn'); if(tb) tb.classList.toggle('has', (META.selectedTools || []).length > 0);

    if(openMenu === 'skills'){ openSkillsMenu(); }
    if(openMenu === 'tools'){ openToolsMenu(); }
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
  if(m.type === 'workspaceFileSuggestions'){
    var trig = promptTrigger();
    if(trig && trig.type === 'file') renderSuggestions((m.files || []).map(function(f){ return { label: '@' + f.label, desc: 'Anexar arquivo do workspace', path: f.path }; }), trig);
  }
});

setBusy(false); updateTokens(); renderContextChips();
post({ type: 'ready' });
})();
</script></body></html>`}};async function Bt(t){U=t,D=d.window.createOutputChannel("Devin Cli Chat"),t.subscriptions.push(D),f(`Extens\xE3o ativando \u2014 VS Code ${d.version}, extens\xE3o ${t.extension.packageJSON.version}`),f(`Plataforma: ${process.platform} ${process.arch}`),f(`Devin CLI path configurado: ${k()}`),f(`Workspace: ${v()||"nenhum"}`),await tt(t),g=new me(t),t.subscriptions.push(d.window.registerWebviewViewProvider("devinCliChat.chatView",g,{webviewOptions:{retainContextWhenHidden:!0}})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.abrirPainel",async()=>d.commands.executeCommand("workbench.view.extension.devinCliChat"))),t.subscriptions.push(d.commands.registerCommand("devinCliChat.abrirHistorico",async()=>{await d.commands.executeCommand("workbench.view.extension.devinCliChat"),setTimeout(()=>{g&&g.openHistory()},100)})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.exportarSessaoAtual",async()=>{await d.commands.executeCommand("workbench.view.extension.devinCliChat"),g&&await g.exportSession()})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.novaSessao",()=>xt(""))),t.subscriptions.push(d.commands.registerCommand("devinCliChat.revisarDiff",async()=>{await d.commands.executeCommand("workbench.view.extension.devinCliChat"),g&&await g.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+pe()+"\n```")})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.enviarSelecao",async()=>{await d.commands.executeCommand("workbench.view.extension.devinCliChat"),g&&await g.send(`Analise o contexto do editor atual.

`+de())})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.selecionarModelo",Tt)),t.subscriptions.push(d.commands.registerCommand("devinCliChat.definirModeloManual",Te)),t.subscriptions.push(d.commands.registerCommand("devinCliChat.atualizarModelos",async()=>{E(),g&&g.refreshMeta();let n=await Y();if(n.length){let a=Array.from(new Set([...u().get("modelosDisponiveis")||[],...n]));await u().update("modelosDisponiveis",a,d.ConfigurationTarget.Workspace),E()}g&&g.refreshMeta(),d.window.showInformationMessage(`Modelos atualizados (${z().length} disponiveis).`)})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.selecionarAgente",async()=>{let n="+ Importar arquivo .md como agente",a=await d.window.showQuickPick([n,...ke()],{placeHolder:"Selecione o agente Devin"});if(a){if(a===n){await Xe();return}await b("agenteAtual",a)}})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.selecionarSkills",At)),t.subscriptions.push(d.commands.registerCommand("devinCliChat.selecionarTools",It)),t.subscriptions.push(d.commands.registerCommand("devinCliChat.limparHistorico",async()=>{await d.window.showWarningMessage("Limpar todo o historico de chats?",{modal:!0},"Limpar")==="Limpar"&&(await V([]),g&&g.post({type:"history",sessions:[]}))})),t.subscriptions.push(d.commands.registerCommand("devinCliChat.verificarCli",()=>{D.show(!0),f(`Verificando Devin CLI: ${k()}`),j.execFile(k(),["--version"],{cwd:T(),windowsHide:!0},(n,a,s)=>{if(n)f(`verificarCli ERRO: code=${n.code} msg=${n.message}`),d.window.showErrorMessage(`Falha ao verificar Devin CLI: ${n.message}`);else{let i=(a||s||"ok").trim();f(`verificarCli OK: ${i}`),d.window.showInformationMessage(`Devin CLI encontrado: ${i}`)}})}));let e,o=()=>{e&&clearTimeout(e),e=setTimeout(()=>{g&&g.pushCurrentSelection(!0)},150)};t.subscriptions.push(d.window.onDidChangeTextEditorSelection(o)),t.subscriptions.push(d.window.onDidChangeActiveTextEditor(o)),t.subscriptions.push(d.workspace.onDidChangeConfiguration(n=>{n.affectsConfiguration(Fe)&&(E(),ue(),g&&g.refreshMeta())})),ue()}function Pt(){for(let t of Ge())we(t)}module.exports={activate:Bt,deactivate:Pt,_internal:{baseArgs:X,fullPrompt:_,runIntegrated:Ve,modelsForUi:z,scanAgents:ke,scanSkills:Se,scanTools:Ce,skillNameFromMarkdownFile:Ke,importSkillMarkdownFile:Je,importAgentMarkdownFile:Qe,importToolMarkdownFile:Me,loadHistory:I,saveHistory:V,sanitizeModel:M,sanitizePromptText:He,isSafeModelId:ge,cancelIntegratedRun:we,automaticEditorContext:Ze,resolveWorkspacePathSafe:Q,registerRunState:be,unregisterRunState:ye,activeRunIds:Ge,createNonce:Ne,validateWebviewMessage:ze,expandSlashCommand:_e,exportSessionMarkdown:je,shouldApplyFirstInstallRightSidebar:et,applyFirstInstallRightSidebar:tt}};
