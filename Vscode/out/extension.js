"use strict";var c=require("vscode"),p=require("fs"),l=require("path"),w=require("os"),N=require("child_process"),rt=require("crypto"),De="devinCliChat",lt=["auto","sonnet","opus","swe","gpt"],se=["auto","adaptive","sonnet","opus","swe","gpt","codex"],me="devinCliChat.chatHistory.v1",re="devinCliChat.firstInstallLayout.v1",ct=50,ae=1024*1024,oe=50,dt=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),g,L,V,B,U=new Map,H={at:0,values:void 0},j={at:0,values:void 0},R={at:0,values:void 0},O={at:0,values:void 0};function f(t){let e=new Date().toISOString();B&&B.appendLine(`[${e}] ${t}`)}function he(){return 1e4}function pt(){return Math.max(0,Number(m().get("cacheModelosMs")||18e5))}function q(){H={at:0,values:void 0},j={at:0,values:void 0},R={at:0,values:void 0},O={at:0,values:void 0}}function $e(t){return/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$/.test(String(t||"").trim())}function m(){return c.workspace.getConfiguration(De)}function v(){return c.workspace.workspaceFolders&&c.workspace.workspaceFolders[0]?c.workspace.workspaceFolders[0].uri.fsPath:void 0}function P(){return c.workspace.workspaceFolders&&c.workspace.workspaceFolders[0]?c.workspace.workspaceFolders[0].name:"sem pasta aberta"}function Fe(t){if(!t)return t;let e=String(t);return e==="~"?w.homedir():e.startsWith("~/")||e.startsWith("~\\")?l.join(w.homedir(),e.slice(2)):e}function y(t){let e=Fe(t);return e&&(l.isAbsolute(e)?e:l.join(v()||w.homedir(),e))}function fe(t){try{return!!t&&p.existsSync(t)}catch{return!1}}function Ne(){return rt.randomBytes(18).toString("base64")}function S(t,e){if(typeof t!="string")return;let a=e||2e4;return t.length>a?t.slice(0,a):t}function Ie(t){return typeof t=="boolean"?t:void 0}function ut(t){return typeof t=="string"&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(t)}function ze(t){if(!t||typeof t!="object"||Array.isArray(t))return null;let e=S(t.type,40);if(new Set(["ready","cancelRun","verifyCli","requestSelection","attachMenu","attachFiles","pickWorkspaceFiles","manualModel","refreshModels","review","selection","insertSelection","newChat","getHistory","clearHistory","importAgentFile","importSkillFile","importToolFile"]).has(e))return{type:e};if(e==="clientError")return{type:e,text:S(t.text,2e3)||""};if(e==="send"){let n=S(t.text,2e5);if(n===void 0)return null;let o={type:e,text:n},i=S(t.displayText,2e5),s=Ie(t.echo),r=Ie(t.hasExplicitContext);return i!==void 0&&(o.displayText=i),s!==void 0&&(o.echo=s),r!==void 0&&(o.hasExplicitContext=r),o}if(e==="terminal"){let n=S(t.text,2e5);return n===void 0?null:{type:e,text:n}}if(e==="searchWorkspaceFiles")return{type:e,query:S(t.query||"",200)||""};if(e==="setModel"||e==="setMode"||e==="setAgent"||e==="toggleSkill"||e==="toggleTool"){let n=S(t.value,200);return n===void 0?null:{type:e,value:n}}if(e==="listWorkspace"||e==="attachFolder"||e==="attachWorkspacePath"){let n=S(t.path||"",2e3);return n===void 0?null:{type:e,path:n}}return(e==="loadSession"||e==="deleteSession"||e==="exportSession")&&ut(t.id)?{type:e,id:t.id}:null}function _e(t){let e=String(t||"").trim();if(!e.startsWith("/"))return null;let n=(e.slice(1).split(/\s+/).shift()||"").toLowerCase(),i=e.slice(n.length+2).trim()||"o contexto atual",r={review:"Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.",tests:`Proponha e implemente testes para ${i}. Priorize cobertura de comportamento, regressao e caminhos de erro.`,plan:`Crie um plano tecnico objetivo para ${i}. Agrupe por impacto, risco e ordem de execucao.`,explain:`Explique ${i} com foco em arquitetura, fluxo de dados e pontos de manutencao.`,security:`Revise ${i} com foco em riscos de seguranca, entrada nao confiavel, execucao de comandos e exposicao de dados.`,docs:`Gere documentacao pratica para ${i}, incluindo objetivo, uso, limites e exemplos.`,"commit-msg":"Gere uma mensagem de commit convencional para as mudancas atuais, com escopo claro e resumo curto."}[n];return r?{command:n,text:r,displayText:e}:null}function _(t){return String(t??"").replace(/\r?\n/g," ").trim()}function He(t){let e=t||{},a=[];a.push("# "+(_(e.title)||"Sessao Devin")),a.push(""),a.push("- Workspace: "+(_(e.workspace)||P())),a.push("- Modelo: "+(_(e.model)||"auto")),a.push("- Agente: "+(_(e.agent)||"auto")),a.push("- Modo: "+(_(e.mode)||"resposta-integrada")),e.createdAt&&a.push("- Criada em: "+new Date(e.createdAt).toISOString()),e.updatedAt&&a.push("- Atualizada em: "+new Date(e.updatedAt).toISOString()),a.push("");let n=Array.isArray(e.messages)?e.messages:[];for(let o of n){let i=String(o&&o.role||"message").toLowerCase();a.push("## "+i.charAt(0).toUpperCase()+i.slice(1)),o&&o.ts&&a.push("_"+new Date(o.ts).toISOString()+"_"),a.push(""),a.push(String(o&&o.text||"").trim()),a.push("")}return a.join(`
`).trim()+`
`}function D(t){return`'${String(t).replace(/'/g,"'\\''")}'`}function je(t){return String(t??"").replace(/\u0000/g,"")}function z(t){let e=String(t||"").trim().toLowerCase();return!e||e==="default"||e==="padrao"||e==="padr\xE3o"?"auto":$e(e)?e:"auto"}function Re(t){return z(t)}function Le(){return[...se]}function mt(t){try{return fe(t)?JSON.parse(p.readFileSync(t,"utf8")):void 0}catch{return}}function ht(){if(process.platform==="win32"){let t=process.env.APPDATA||l.join(w.homedir(),"AppData","Roaming");return l.join(t,"devin","config.json")}return l.join(w.homedir(),".config","devin","config.json")}function ge(){let t=mt(ht());return t&&t.agent?Re(t.agent.model):void 0}function M(){let t=m().get("modeloAtual");return Re(t??(ge()||"auto"))}function Oe(){let t=m().get("modeloAtual");return z(t??(ge()||"auto"))}function Y(){return String(m().get("agenteAtual")||"auto")}function Q(){return String(m().get("modoExecucaoChat")||"resposta-integrada")}function A(){let t=m().get("skillsSelecionadas")||[];return Array.isArray(t)?t.map(String).filter(Boolean):[]}function $(){let t=m().get("toolsSelecionadas")||[];return Array.isArray(t)?t.map(String).filter(Boolean):[]}function k(){return String(m().get("caminhoDevin")||"devin")}function E(){return v()||w.homedir()}function Be(t){try{if(p.existsSync(t))return p.realpathSync.native?p.realpathSync.native(t):p.realpathSync(t)}catch{}return l.resolve(t)}function ft(t,e){let a=l.relative(t,e);return a===""||!!a&&!a.startsWith("..")&&!l.isAbsolute(a)}function Z(t){let e=v();if(!e)return null;let a=Be(e),n=String(t||"").replace(/\\/g,l.sep).trim(),o=l.isAbsolute(n)?l.resolve(n):l.resolve(a,n),i=Be(o);return ft(a,i)?i:null}function qe(){return[Fe(m().get("gitBashPath")),process.env.GIT_BASH_PATH,"C:\\Program Files\\Git\\bin\\bash.exe","C:\\Program Files\\Git\\usr\\bin\\bash.exe","C:\\Program Files (x86)\\Git\\bin\\bash.exe",l.join(w.homedir(),"AppData","Local","Programs","Git","bin","bash.exe")].filter(Boolean).find(fe)}function gt(){return process.platform==="win32"&&m().get("usarGitBashNoWindows",!0)?qe():process.env.SHELL||void 0}function X(){let t=[...(m().get("argumentosPadrao")||[]).map(String).filter(Boolean)],e=String(m().get("argumentoModelo")||"").trim(),a=Oe();return e&&a&&a!=="auto"&&t.push(e,a),t}function F(t){let e=m().get("prefixoPromptPadrao")||"",a=Oe()||M()||"auto",n=Y(),o=A(),i=$(),s=[`Workspace VS Code: ${P()}`,v()?`Diretorio raiz: ${v()}`:"Diretorio raiz: nao ha pasta aberta",`Modelo selecionado: ${a}`,`Agente selecionado: ${n}`,o.length?`Skills disponiveis: ${o.join(", ")}`:"",i.length?`Tools disponiveis: ${i.join(", ")}`:""].filter(Boolean).join(`
`),r=n!=="auto"?`Use o perfil/subagente Devin chamado "${n}" quando aplicavel. Se a CLI nao aceitar selecao direta de agente nesta chamada, trate este agente como persona operacional e siga as instrucoes do respectivo AGENT.md.`:"",d=o.length?`Invoque a skill via tool 'skill' quando aplicavel: ${o.map(h=>`"${h}"`).join(", ")}. Siga as instrucoes do respectivo SKILL.md.`:"",u=i.length?`Use as tools selecionadas quando aplicavel: ${i.map(h=>`"${h}"`).join(", ")}. Siga as instrucoes do respectivo TOOL.md.`:"";return je([e,s,r,d,u,t].filter(Boolean).join(`

`))}function vt(t){let e=D(k()),a=X().map(D).join(" ");return t?[e,a,"-p","--",D(F(t))].filter(Boolean).join(" "):[e,a].filter(Boolean).join(" ")}function xt(t){return t?String(t).split(/\r?\n/).filter(e=>!/were not migrated because they already exist/i.test(e)).filter(e=>!/migration.*already exist/i.test(e)).join(`
`).trim():""}function We(t,e,a){let n=xt(e),o=[t||"",n||"",a&&a.message?a.message:""].join(`
`);if(/No active model set in cog manager/i.test(o))return["Modelo Devin nao configurado para esta execucao.","","A extensao tentou enviar o alias selecionado, mas o Devin CLI informou que nao ha modelo ativo no cog manager.","","Acoes recomendadas:",`1. Execute no terminal: devin model set ${M()||"auto"}`,"2. Se houver conflito de migracao de config, mantenha apenas o valor desejado em agent.model no config.json do Devin.","3. No chat, reabra o seletor de modelo e escolha um dos aliases validos: auto, sonnet, opus, swe, gpt."].join(`
`);let i=[];return t&&t.trim()&&i.push(t.trim()),n&&i.push(`STDERR:
${n}`),a&&i.push(`Falha ao executar Devin CLI: ${a.message}`),i.join(`

`)||"Sem saida do Devin CLI."}function le(t){let e=gt(),a=c.window.createTerminal({name:m().get("nomeTerminal")||"Devin Cli Chat",cwd:E(),shellPath:e,shellArgs:process.platform==="win32"&&e?["--login","-i"]:void 0});a.show(!0),a.sendText(vt(t))}function J(t){return t||"__default__"}function ve(t,e){let a=J(t);return U.set(a,Object.assign({sessionId:a,cancelRequested:!1,startedAt:Date.now()},e||{})),U.get(a)}function W(t){return U.get(J(t))}function xe(t){U.delete(J(t))}function Ge(){return Array.from(U.keys())}function be(t){let e=W(t);if(!e)return!1;e.cancelRequested=!0;let a=e.process;if(!a||a.killed)return!1;try{return a.kill(),!0}catch(n){return f(`cancelIntegratedRun erro: ${n&&n.message?n.message:String(n)}`),!1}}function Ve(t,e){return new Promise(a=>{let n=J(e&&e.sessionId),o=[...X(),"-p","--",F(t)];f(`runIntegrated: session=${n} ${k()} ${o.slice(0,-1).join(" ")} -- [prompt ${F(t).length} chars]`),f(`  cwd: ${E()}`);let i=!1;function s(r){i||(i=!0,xe(n),a(r))}try{let r=N.execFile(k(),o,{cwd:E(),timeout:Number(m().get("timeoutChatMs")||3e5),maxBuffer:16777216,windowsHide:!0},(d,u,h)=>{let x=W(n);if(x&&x.cancelRequested){s("Execucao cancelada pelo usuario.");return}if(d&&f(`runIntegrated erro: code=${d.code} signal=${d.signal} killed=${d.killed} msg=${d.message}`),h&&h.trim()&&f(`runIntegrated stderr: ${h.slice(0,500)}`),u&&u.trim()&&f(`runIntegrated stdout: ${u.slice(0,200)}...`),d&&process.platform==="win32"){ie(t,d,{sessionId:n}).then(s);return}s(We(u,h,d))});ve(n,{process:r,mode:"integrated"}),r.on("error",d=>{f(`runIntegrated child error: ${d.message}`);let u=W(n);if(u&&u.cancelRequested){s("Execucao cancelada pelo usuario.");return}process.platform==="win32"?ie(t,d,{sessionId:n}).then(s):s(`Falha ao iniciar Devin CLI: ${d.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)})}catch(r){f(`runIntegrated catch: ${r.message}`);let d=W(n);if(d&&d.cancelRequested){s("Execucao cancelada pelo usuario.");return}process.platform==="win32"?ie(t,r,{sessionId:n}).then(s):s(`Falha ao iniciar Devin CLI: ${r.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)}})}function ie(t,e,a){return new Promise(n=>{let o=J(a&&a.sessionId),i=qe();if(!i){n(`Falha ao executar Devin CLI: ${e.message}

Git Bash nao foi encontrado. Configure devinCliChat.gitBashPath ou ajuste devinCliChat.caminhoDevin.`);return}let s=X().map(D).join(" "),r=`${D(k())} ${s} -p -- ${D(F(t))}`,d=N.exec(r,{cwd:E(),shell:i,timeout:Number(m().get("timeoutChatMs")||3e5),maxBuffer:1024*1024*16},(u,h,x)=>{let C=W(o);if(xe(o),C&&C.cancelRequested){n("Execucao cancelada pelo usuario.");return}let I=We(h,x,u);n(I.replace("Falha ao executar Devin CLI:","Falha ao executar Devin CLI via Git Bash:"))});ve(o,{process:d,mode:"bash"})})}async function b(t,e){await m().update(t,e,c.ConfigurationTarget.Workspace),q(),pe(),g&&g.refreshMeta()}function bt(){let t=m().get("modelosDisponiveis")||[];return Array.isArray(t)?t.map(String).map(e=>e.trim()).filter(Boolean):[]}function yt(){let t=m().get("arquivosCacheModelos")||[],e=Array.isArray(t)?t.map(y).filter(Boolean):[];if(process.platform==="win32"){let a=process.env.LOCALAPPDATA||l.join(w.homedir(),"AppData","Local");e.push(l.join(a,"Devin","CLI","team_settings.bin")),e.push(l.join(a,"Devin","CLI","model_configs.bin"))}else e.push(l.join(w.homedir(),".local","share","Devin","CLI","team_settings.bin")),e.push(l.join(w.homedir(),".local","share","Devin","CLI","model_configs.bin"));return Array.from(new Set(e))}function Ue(t){return lt.includes(String(t||"").trim().toLowerCase())}function wt(){let t=Number(m().get("limiteBytesCacheModelos")||5242880),e=[];for(let a of yt())try{if(!fe(a))continue;let n=p.statSync(a);if(!n.isFile()||n.size>t)continue;let s=p.readFileSync(a).toString("utf8").match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g)||[];for(let r of s)Ue(r)&&e.push(r)}catch{}return Array.from(new Set(e))}function Ke(){return new Promise(t=>{let e=String(m().get("comandoDescobertaModelos")||"").trim();if(!e){t([]);return}try{N.execFile(k(),e.split(/\s+/),{cwd:E(),timeout:Number(m().get("timeoutDescobertaModelosMs")||2500),windowsHide:!0},(a,n)=>{if(a||!n){t([]);return}try{let i=JSON.parse(n),s=Array.isArray(i)?i:i&&i.models||[];t(s.map(r=>typeof r=="string"?r:r&&(r.name||r.id)).filter(Boolean));return}catch{}let o=n.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g)||[];t(o.filter(Ue))})}catch{t([])}})}function K(){let t=pt(),e=Date.now();if(t>0&&H.values&&e-H.at<t)return H.values;let a=[M(),ge(),...bt(),...wt(),...Le()].map(z).filter(Boolean),n=Array.from(new Set([...Le(),...a]));return H={at:e,values:n},n}function ye(){let t=Date.now();if(j.values&&t-j.at<he())return j.values;let e=[y(m().get("diretorioAgentesWorkspace")||".devin/agents"),y(m().get("diretorioAgentesGlobal")||"~/.config/devin/agents")],a=["auto"];for(let o of e)try{if(!o||!p.existsSync(o))continue;for(let i of p.readdirSync(o)){let s=l.join(o,i,"AGENT.md");p.existsSync(s)&&a.push(i)}}catch{}let n=Array.from(new Set(a));return j={at:t,values:n},n}function we(){let t=Date.now();if(O.values&&t-O.at<he())return O.values;let e=[y(m().get("diretorioToolsWorkspace")||".devin/tools"),y(m().get("diretorioToolsGlobal")||"~/.config/devin/tools")],a=[];for(let o of e)try{if(!o||!p.existsSync(o))continue;for(let i of p.readdirSync(o)){let s=l.join(o,i,"TOOL.md");p.existsSync(s)&&a.push(i)}}catch{}let n=Array.from(new Set(a)).sort();return O={at:t,values:n},n}function ke(){let t=Date.now();if(R.values&&t-R.at<he())return R.values;let e=[y(m().get("diretorioSkillsWorkspace")||".devin/skills"),y(m().get("diretorioSkillsGlobal")||"~/.config/devin/skills"),y(".claude/skills"),y("~/.claude/skills")],a=[];for(let o of e)try{if(!o||!p.existsSync(o))continue;for(let i of p.readdirSync(o)){let s=l.join(o,i,"SKILL.md");p.existsSync(s)&&a.push(i)}}catch{}let n=Array.from(new Set(a)).sort();return R={at:t,values:n},n}function Je(t){return l.basename(String(t||""),l.extname(String(t||""))).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^[._-]+|[._-]+$/g,"").replace(/-{2,}/g,"-")||"skill"}function kt(){return y(m().get("diretorioSkillsWorkspace")||".devin/skills")}function Ct(){return y(m().get("diretorioAgentesWorkspace")||".devin/agents")}function St(){return y(m().get("diretorioToolsWorkspace")||".devin/tools")}function Mt(t,e){let a=l.join(t,e),n=2;for(;p.existsSync(a);)a=l.join(t,`${e}-${n}`),n++;return a}function Qe(t){return Se(t,kt(),"SKILL.md")}function Ze(t){return Se(t,Ct(),"AGENT.md")}function Ce(t){return Se(t,St(),"TOOL.md")}function Se(t,e,a){let n=String(t||"");if(!n||l.extname(n).toLowerCase()!==".md")throw new Error("Selecione um arquivo .md para importar.");if(!p.existsSync(n)||!p.statSync(n).isFile())throw new Error("Arquivo markdown nao encontrado: "+n);if(!e)throw new Error("Diretorio padrao nao resolvido.");let o=Je(n),i=Mt(e,o),s=l.basename(i);p.mkdirSync(i,{recursive:!0});let r=l.join(i,a);return p.copyFileSync(n,r),q(),{name:s,file:r,dir:i}}function ce(){let t=c.window.activeTextEditor;if(!t)return"Nenhum editor ativo.";let e=t.document,a=t.selection&&!t.selection.isEmpty?e.getText(t.selection):e.getText();return[`Arquivo: ${e.uri.fsPath}`,"Conteudo:","```",a.slice(0,6e4),"```"].join(`
`)}function Pe(t){return t?Math.max(1,Math.ceil(String(t).length/4)):0}function Et(t){if(!t||!t.selection||t.selection.isEmpty)return null;let e=t.document,a=t.selection,n=e.getText(a);if(!n||!n.trim())return null;let o=e.uri.fsPath,i=l.basename(o),s=a.start.line+1,r=a.end.line+1;return{id:"sel-"+Date.now().toString(36),file:o,base:i,language:e.languageId,startLine:s,endLine:r,text:n,preview:n.split(`
`).slice(0,2).join(" ").slice(0,80),label:`${i}:${s}-${r}`}}function Ye(){try{if(m().get("usarContextoEditorAutomatico")===!1)return null;let e=String(m().get("modoContextoEditorAutomatico")||"selecao-ou-arquivo");if(e==="desativado")return null;let a=c.window.activeTextEditor;if(!a)return null;let n=a.document;if(!n||!n.uri||n.uri.scheme!=="file")return null;let o=n.uri.fsPath,i=l.basename(o),s=n.languageId||l.extname(o).slice(1)||"",r="```",d=a.selection,u=!!(d&&!d.isEmpty);if(e!=="somente-arquivo"&&u){let ne=n.getText(d);if(!ne||!ne.trim())return null;let ot=d.start.line+1,it=d.end.line+1,Ae=`${i}:${ot}-${it}`,st=["","",`[Contexto automatico do editor: ${Ae}]`,r+s,ne,r].join(`
`);return{label:Ae,promptBlock:st}}if(e==="somente-selecao")return null;let h=n.getText();if(!h||!h.trim())return null;let x=Number(m().get("limiteBytesContextoEditorAutomatico")),C=Number.isFinite(x)&&x>0?x:2e5,I=Buffer.from(h,"utf8"),te=I.length>C,at=te?I.subarray(0,C).toString("utf8"):h,Ee=te?`${i} (truncado)`:i,Te=["","",`[Contexto automatico do editor: ${Ee}]`,r+s,at,r];return te&&Te.push(`[NOTA: arquivo truncado em ${C} bytes para limitar o tamanho do contexto automatico.]`),{label:Ee,promptBlock:Te.join(`
`)}}catch{return null}}function de(){try{return N.execFileSync("git",["diff","--no-ext-diff"],{cwd:E(),encoding:"utf8",maxBuffer:1024*1024*8,windowsHide:!0})}catch(t){return`Nao foi possivel obter git diff: ${t.message}`}}function pe(){L||(L=c.window.createStatusBarItem(c.StatusBarAlignment.Right,90),L.command="devinCliChat.abrirPainel",L.show()),L.text=`Devin: ${M()} / ${Y()}`,L.tooltip=`Workspace: ${P()} | Modo: ${Q()} | Skills: ${A().length}`}async function Me(){let t=await c.window.showInputBox({title:"Modelo Devin",prompt:"Aliases aceitos pelo Devin CLI nesta build: auto, sonnet, opus, swe, gpt.",value:M()==="auto"?"":M()});if(!t||!t.trim())return;let e=z(t);e!==String(t).trim().toLowerCase()&&c.window.showInformationMessage(`Modelo "${t.trim()}" nao e aceito por esta versao do Devin CLI. Usando "${e}".`),await b("modeloAtual",e)}async function Tt(){let t=await c.window.showQuickPick([...K(),"+ Informar modelo manual"],{placeHolder:"Selecione o modelo Devin"});if(t){if(t.startsWith("+"))return Me();await b("modeloAtual",t)}}async function At(){let t=ke(),e="+ Importar arquivo .md como skill",a=new Set(A()),n=[{label:e,description:"Copia para o diretorio padrao de skills"},...t.map(s=>({label:s,picked:a.has(s)}))],o=await c.window.showQuickPick(n,{canPickMany:!0,placeHolder:t.length?"Selecione skills disponiveis para o Devin":"Importe um .md ou selecione skills disponiveis"});if(!o)return;let i=o.filter(s=>s.label!==e).map(s=>s.label);if(o.some(s=>s.label===e)){let s=await Xe({selectImported:!1});s&&i.push(s.name)}await b("skillsSelecionadas",Array.from(new Set(i)))}async function It(){let t=we(),e="+ Importar arquivo .md como tool",a=new Set($()),n=[{label:e,description:"Copia para o diretorio padrao de tools"},...t.map(s=>({label:s,picked:a.has(s)}))],o=await c.window.showQuickPick(n,{canPickMany:!0,placeHolder:t.length?"Selecione tools disponiveis para o Devin":"Importe um .md ou selecione tools disponiveis"});if(!o)return;let i=o.filter(s=>s.label!==e).map(s=>s.label);if(o.some(s=>s.label===e)){let s=await ee({kind:"tool",importer:Ce,configKey:"toolsSelecionadas",selectImported:!1});s&&i.push(s.name)}await b("toolsSelecionadas",Array.from(new Set(i)))}async function Xe(t){return ee({kind:"skill",importer:Qe,configKey:"skillsSelecionadas",selectImported:!t||t.selectImported!==!1})}async function et(t){return await ee({kind:"agente",importer:Ze,configKey:"agenteAtual",singleValue:!0,selectImported:!t||t.selectImported!==!1})}async function Lt(t){return ee({kind:"tool",importer:Ce,configKey:"toolsSelecionadas",selectImported:!t||t.selectImported!==!1})}async function ee(t){let e=await c.window.showOpenDialog({canSelectFiles:!0,canSelectFolders:!1,canSelectMany:!1,filters:{Markdown:["md"]},title:"Importar arquivo Markdown como "+t.kind+" Devin"});if(!e||!e.length)return null;try{let a=t.importer(e[0].fsPath);if(t.selectImported!==!1)if(t.singleValue)await b(t.configKey,a.name);else{let n=new Set(t.configKey==="toolsSelecionadas"?$():A());n.add(a.name),await b(t.configKey,Array.from(n))}return g&&g.refreshMeta(),c.window.showInformationMessage(`${t.kind} "${a.name}" importado para ${a.file}.`),a}catch(a){return c.window.showErrorMessage("Falha ao importar "+t.kind+": "+(a&&a.message?a.message:String(a))),null}}function T(){try{return V&&V.globalState.get(me)||[]}catch{return[]}}async function G(t){try{V&&await V.globalState.update(me,t.slice(0,ct))}catch{}}function tt(t){try{if(!t||!t.globalState||t.globalState.get(re))return!1;let e=t.globalState.get(me)||[];return!Array.isArray(e)||e.length===0}catch{return!1}}async function nt(t){if(!tt(t))return!1;try{return await c.workspace.getConfiguration("workbench").update("sideBar.location","right",c.ConfigurationTarget.Global),await t.globalState.update(re,!0),f("Primeira instalacao: sideBar.location definido como right."),!0}catch(e){f("Falha ao posicionar sidebar a direita: "+(e&&e.message?e.message:String(e)));try{await t.globalState.update(re,!0)}catch{}return!1}}var ue=class{constructor(e){this.context=e,this.view=void 0,this.busy=!1,this.session=this.newSession()}newSession(){return{id:"sess-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6),title:"Nova conversa",createdAt:Date.now(),updatedAt:Date.now(),workspace:P(),model:M(),agent:Y(),mode:Q(),skills:A(),tools:$(),messages:[]}}async persistSession(){if(!this.session||!this.session.messages.length)return;let e=T(),a=e.findIndex(n=>n.id===this.session.id);if(this.session.updatedAt=Date.now(),!this.session.title||this.session.title==="Nova conversa"){let n=this.session.messages.find(o=>o.role==="user");n&&(this.session.title=String(n.text).slice(0,60).replace(/\s+/g," ").trim())}a>=0?e[a]=this.session:e.unshift(this.session),e.sort((n,o)=>(o.updatedAt||0)-(n.updatedAt||0)),await G(e)}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this.context.extensionUri]},e.webview.html=this.html(e.webview),f("WebView resolvida e HTML injetado."),e.webview.onDidReceiveMessage(async a=>{try{let n=ze(a);if(!n){f("Mensagem webview rejeitada por validacao.");return}let o=n.type;if(f(`Mensagem recebida do webview: type=${o}`),o==="ready"){this.refreshMeta(),this.replaySession(),this.pushCurrentSelection();return}if(o==="clientError"){f(`ERRO no cliente webview: ${n.text||"sem detalhes"}`),this.post({type:"message",role:"assistant",text:"Falha no painel: "+(n.text||"erro sem detalhes")});return}if(o==="cancelRun"){let i=be(this.session&&this.session.id);this.post({type:"action",ok:i,text:i?"Cancelamento solicitado.":"Nenhuma execucao integrada ativa para cancelar."});return}if(o==="verifyCli"){this.verifyCli();return}if(o==="requestSelection"){this.pushCurrentSelection(!0);return}if(o==="attachMenu"){await this.chooseAttachSource();return}if(o==="attachFiles"){await this.attachFiles();return}if(o==="pickWorkspaceFiles"){await this.pickWorkspaceFiles();return}if(o==="listWorkspace"){this.listWorkspaceDir(n.path||"");return}if(o==="attachFolder"){await this.attachFolder(n.path||"");return}if(o==="attachWorkspacePath"){await this.attachWorkspacePath(n.path||"");return}if(o==="searchWorkspaceFiles"){await this.searchWorkspaceFiles(n.query||"");return}if(o==="send"){await this.send(n.text||"",{echoUser:n.echo!==!1,displayText:n.displayText||n.text||"",hasExplicitContext:!!n.hasExplicitContext});return}if(o==="terminal"){le(n.text||""),this.post({type:"action",ok:!0,text:"Terminal aberto."});return}if(o==="setModel"){await b("modeloAtual",z(n.value||"auto"));return}if(o==="setMode"){await b("modoExecucaoChat",n.value||"resposta-integrada");return}if(o==="setAgent"){await b("agenteAtual",n.value||"auto");return}if(o==="importAgentFile"){let i=await et();i&&this.post({type:"action",ok:!0,text:"Agente importado: "+i.name});return}if(o==="importSkillFile"){let i=await Xe();i&&this.post({type:"action",ok:!0,text:"Skill importada: "+i.name});return}if(o==="importToolFile"){let i=await Lt();i&&this.post({type:"action",ok:!0,text:"Tool importada: "+i.name});return}if(o==="toggleSkill"){let i=new Set(A());n.value&&i.has(n.value)?i.delete(n.value):n.value&&i.add(n.value),await b("skillsSelecionadas",Array.from(i));return}if(o==="toggleTool"){let i=new Set($());n.value&&i.has(n.value)?i.delete(n.value):n.value&&i.add(n.value),await b("toolsSelecionadas",Array.from(i));return}if(o==="manualModel"){await Me();return}if(o==="refreshModels"){this.refreshMeta();let i=await Ke();if(i.length){let s=Array.from(new Set([...m().get("modelosDisponiveis")||[],...i]));await m().update("modelosDisponiveis",s,c.ConfigurationTarget.Workspace)}this.refreshMeta(),this.post({type:"action",ok:!0,text:"Modelos atualizados ("+K().length+" disponiveis)."});return}if(o==="review"){await this.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+de()+"\n```",{echoUser:!0});return}if(o==="selection"){await this.send(`Analise o contexto do editor atual.

`+ce(),{echoUser:!0});return}if(o==="insertSelection"){this.post({type:"insertPrompt",text:`Analise o contexto do editor atual.

`+ce()});return}if(o==="newChat"){await this.persistSession(),this.session=this.newSession(),this.post({type:"clearThread"}),this.refreshMeta();return}if(o==="getHistory"){await this.openHistory();return}if(o==="exportSession"){await this.exportSession(n.id);return}if(o==="loadSession"){await this.persistSession();let s=T().find(r=>r.id===n.id);s&&(this.session=JSON.parse(JSON.stringify(s)),this.post({type:"clearThread"}),this.replaySession(),this.refreshMeta(),this.post({type:"action",ok:!0,text:"Sessao carregada: "+(s.title||s.id)}));return}if(o==="deleteSession"){let i=T().filter(s=>s.id!==n.id);await G(i),this.session&&this.session.id===n.id&&(this.session=this.newSession(),this.post({type:"clearThread"})),this.post({type:"history",sessions:i}),this.refreshMeta();return}if(o==="clearHistory"){await G([]),this.session=this.newSession(),this.post({type:"clearThread"}),this.post({type:"history",sessions:[]}),this.refreshMeta();return}this.post({type:"action",ok:!1,text:`Acao desconhecida: ${o}`})}catch(n){this.busy=!1,this.post({type:"busy",value:!1}),f(`ERRO no handler do webview: ${n&&n.message?n.message:String(n)}`),n&&n.stack&&f(n.stack),this.post({type:"message",role:"assistant",text:"Falha ao executar acao do painel: "+(n&&n.message?n.message:String(n))})}}),setTimeout(()=>this.refreshMeta(),50)}post(e){try{this.view&&this.view.webview.postMessage(e)}catch{}}async openHistory(){await this.persistSession();let e=T().filter(a=>a&&a.messages&&a.messages.length);this.post({type:"openHistory",sessions:e}),this.refreshMeta()}async exportSession(e){await this.persistSession();let a=T(),o=(e?a.find(s=>s.id===e):null)||this.session;if(!o||!o.messages||!o.messages.length){let s="Nao ha conversa com mensagens para exportar.";this.post({type:"action",ok:!1,text:s}),c.window.showInformationMessage(s);return}await c.env.clipboard.writeText(He(o));let i="Conversa exportada em Markdown para a area de transferencia.";this.post({type:"action",ok:!0,text:i}),c.window.showInformationMessage(i)}verifyCli(){B.show(!0),f(`Verificando Devin CLI pelo painel: ${k()}`),N.execFile(k(),["--version"],{cwd:E(),windowsHide:!0},(e,a,n)=>{if(e){let s=`Falha ao verificar Devin CLI: ${e.message}`;f(s),this.post({type:"message",role:"assistant",text:s}),this.post({type:"action",ok:!1,text:s});return}let i=`Devin CLI encontrado: ${(a||n||"ok").trim()}`;f(i),this.post({type:"message",role:"assistant",text:i}),this.post({type:"action",ok:!0,text:i})})}pushCurrentSelection(e){let a=c.window.activeTextEditor,n=Et(a);n&&this.post({type:"selectionAvailable",selection:n})}attachmentId(e){return e+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}readFileItem(e,a){let n=p.statSync(e);if(n.size>ae)return{skipped:!0,reason:`Arquivo muito grande: ${l.basename(e)} (${n.size} bytes).`};let o=p.readFileSync(e,"utf8"),i=l.extname(e).slice(1);return{id:this.attachmentId("file"),file:e,base:l.basename(e),label:a||l.basename(e),type:"file",text:o,language:i,lines:o.split(`
`).length}}readFolderItem(e,a){let n=v(),o=a||l.basename(e)||"workspace",i=[],s=[e];for(;s.length&&i.length<oe;){let r=s.pop(),d;try{d=p.readdirSync(r,{withFileTypes:!0})}catch{continue}for(let u of d){let h=l.join(r,u.name);if(u.isDirectory())!dt.has(u.name)&&!u.name.startsWith(".")&&s.push(h);else if(u.isFile())try{if(p.statSync(h).size>ae)continue;let C=p.readFileSync(h,"utf8"),I=n&&h.startsWith(n)?l.relative(n,h):l.join(o,l.relative(e,h));if(i.push({file:h,rel:I.replace(/\\/g,"/"),base:l.basename(h),text:C,language:l.extname(h).slice(1),lines:C.split(`
`).length}),i.length>=oe)break}catch{}}}return{id:this.attachmentId("folder"),file:e,base:o,label:`${o} (${i.length})`,type:"folder",files:i,count:i.length,truncated:i.length>=oe}}async chooseAttachSource(){let e=await c.window.showQuickPick([{label:"$(folder) Pastas",description:"Anexar pasta recursivamente como chip unico",value:"folders"},{label:"$(file) Arquivos abertos",description:"Anexar arquivos atualmente abertos no editor",value:"openFiles"}],{placeHolder:"Anexar contexto ao Devin"});if(!e)return;if(e.value==="folders"){let r=await c.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!1,canSelectFolders:!0,defaultUri:v()?c.Uri.file(v()):void 0,openLabel:"Anexar pasta"});if(!r||!r.length)return;let d=[];for(let u of r)try{let h=this.readFolderItem(u.fsPath,l.basename(u.fsPath));h.files&&h.files.length&&d.push(h)}catch(h){this.post({type:"action",ok:!1,text:`Falha ao anexar pasta ${u.fsPath}: ${h.message}`})}d.length&&this.post({type:"attachItems",items:d}),this.post({type:"action",ok:!0,text:`Anexadas ${d.length} pasta(s).`});return}let a=c.workspace.textDocuments.filter(r=>r.uri&&r.uri.scheme==="file"&&!r.isUntitled);if(!a.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo aberto para anexar."});return}let n=v()||"",o=a.map(r=>({label:"$(file) "+l.basename(r.uri.fsPath),description:n?l.dirname(l.relative(n,r.uri.fsPath)):l.dirname(r.uri.fsPath),detail:r.uri.fsPath,doc:r})),i=await c.window.showQuickPick(o,{canPickMany:!0,placeHolder:"Selecione arquivos abertos para anexar"});if(!i||!i.length)return;let s=[];for(let r of i){let d=r.doc,u=d.getText();if(Buffer.byteLength(u,"utf8")>ae){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${l.basename(d.uri.fsPath)}.`});continue}s.push({id:this.attachmentId("file"),file:d.uri.fsPath,base:l.basename(d.uri.fsPath),label:l.basename(d.uri.fsPath),type:"file",text:u,language:d.languageId||l.extname(d.uri.fsPath).slice(1),lines:u.split(`
`).length})}s.length&&this.post({type:"attachItems",items:s})}async attachFiles(){try{let e=await c.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!0,canSelectFolders:!1,defaultUri:v()?c.Uri.file(v()):void 0,openLabel:"Anexar ao chat"});if(!e||!e.length)return;let a=[];for(let n of e)try{let o=p.statSync(n.fsPath);if(o.size>1024*1024){a.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n.fsPath,base:l.basename(n.fsPath),label:l.basename(n.fsPath),type:"file",text:`Arquivo ${n.fsPath} muito grande (${o.size} bytes) - nao anexado.`,language:"",tooBig:!0});continue}let i=p.readFileSync(n.fsPath,"utf8"),s=l.extname(n.fsPath).slice(1);a.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n.fsPath,base:l.basename(n.fsPath),label:l.basename(n.fsPath),type:"file",text:i,language:s,lines:i.split(`
`).length})}catch(o){this.post({type:"action",ok:!1,text:`Falha ao ler ${n.fsPath}: ${o.message}`})}a.length&&this.post({type:"attachItems",items:a})}catch(e){this.post({type:"action",ok:!1,text:"Falha ao anexar: "+(e&&e.message?e.message:String(e))})}}async pickWorkspaceFiles(){try{let e=await c.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__}/**",5e3);if(!e.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo encontrado."});return}let a=v()||"",n=e.map(s=>({label:l.relative(a,s.fsPath)||l.basename(s.fsPath),description:"",uri:s})),o=await c.window.showQuickPick(n,{placeHolder:"Selecione arquivos do workspace para anexar",canPickMany:!0,matchOnDescription:!0});if(!o||!o.length)return;let i=[];for(let s of o)try{if(p.statSync(s.uri.fsPath).size>1024*1024)continue;let d=p.readFileSync(s.uri.fsPath,"utf8"),u=l.extname(s.uri.fsPath).slice(1);i.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:s.uri.fsPath,base:l.basename(s.uri.fsPath),label:l.basename(s.uri.fsPath),type:"file",text:d,language:u})}catch{}i.length&&this.post({type:"attachItems",items:i})}catch(e){this.post({type:"action",ok:!1,text:"Falha: "+(e&&e.message?e.message:String(e))})}}listWorkspaceDir(e){try{let a=v();if(!a){this.post({type:"workspaceList",path:e||"",entries:[],error:"Sem workspace aberto."});return}let n=Z(e||"");if(!n){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio fora do workspace."});return}if(!p.existsSync(n)||!p.statSync(n).isDirectory()){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio invalido."});return}let o=l.relative(a,n).replace(/\\/g,"/"),i=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),s=p.readdirSync(n,{withFileTypes:!0}).filter(r=>!r.name.startsWith(".")||[".cognition",".devin",".claude",".cursor",".vscode"].includes(r.name)).filter(r=>!(r.isDirectory()&&i.has(r.name))).map(r=>{let d=0;try{r.isFile()&&(d=p.statSync(l.join(n,r.name)).size)}catch{}return{name:r.name,isDir:r.isDirectory(),size:d}}).sort((r,d)=>d.isDir-r.isDir||r.name.localeCompare(d.name));this.post({type:"workspaceList",path:o,entries:s})}catch(a){this.post({type:"workspaceList",path:"",entries:[],error:a.message})}}async attachWorkspacePath(e){if(!v())return;let n=Z(e||"");if(!n){this.post({type:"action",ok:!1,text:"Caminho fora do workspace."});return}if(!p.existsSync(n)){this.post({type:"action",ok:!1,text:"Caminho invalido."});return}if(p.statSync(n).isDirectory()){await this.attachFolder(e);return}try{let o=p.statSync(n);if(o.size>1024*1024){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${l.basename(n)} (${o.size} bytes).`});return}let i=p.readFileSync(n,"utf8"),s=l.extname(n).slice(1);this.post({type:"attachItems",items:[{id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n,base:l.basename(n),label:l.basename(n),type:"file",text:i,language:s}]})}catch(o){this.post({type:"action",ok:!1,text:"Falha: "+o.message})}}async searchWorkspaceFiles(e){try{let a=v();if(!a){this.post({type:"workspaceFileSuggestions",query:e,files:[]});return}let n=String(e||"").toLowerCase(),i=(await c.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__,.next,.nuxt,.cache,target,.idea}/**",1e3)).map(s=>{let r=l.relative(a,s.fsPath).replace(/\\/g,"/");return{label:r,path:r,base:l.basename(s.fsPath)}}).filter(s=>!n||s.label.toLowerCase().includes(n)||s.base.toLowerCase().includes(n)).slice(0,20);this.post({type:"workspaceFileSuggestions",query:e,files:i})}catch(a){this.post({type:"workspaceFileSuggestions",query:e,files:[],error:a&&a.message?a.message:String(a)})}}async attachFolder(e){let a=v();if(!a)return;let n=Z(e||"");if(!n){this.post({type:"action",ok:!1,text:"Pasta fora do workspace."});return}let o=l.relative(a,n).replace(/\\/g,"/");if(!p.existsSync(n)||!p.statSync(n).isDirectory()){this.post({type:"action",ok:!1,text:"Pasta invalida."});return}let i=this.readFolderItem(n,o?l.basename(n):P());i.files&&i.files.length&&this.post({type:"attachItems",items:[i]}),this.post({type:"action",ok:!0,text:`Pasta anexada como chip unico: ${i.label}.`})}replaySession(){if(!(!this.session||!this.session.messages.length))for(let e of this.session.messages)this.post({type:"message",role:e.role,text:e.text,replay:!0})}refreshMeta(){let e={type:"meta",models:se,model:M(),agents:["auto"],agent:Y(),skills:[],selectedSkills:A(),selectedTools:$(),mode:Q(),workspace:P(),sessionId:this.session&&this.session.id,sessionTitle:this.session&&this.session.title,modelLocked:!1,hasMessages:!!(this.session&&this.session.messages&&this.session.messages.length),tokensTotal:this.session&&this.session.tokens||0,tokensIn:this.session&&this.session.tokensIn||0,tokensOut:this.session&&this.session.tokensOut||0,modelStatus:"modelo: auto"};try{e.models=K()}catch{e.models=se}try{e.agents=ye()}catch{e.agents=["auto"]}try{e.skills=ke()}catch{e.skills=[]}try{e.tools=we()}catch{e.tools=[]}try{e.recentSessions=T().slice(0,3).map(a=>({id:a.id,title:a.title||"Sem titulo",updatedAt:a.updatedAt,messages:(a.messages||[]).length,model:a.model||"auto"}))}catch{e.recentSessions=[]}try{e.modelStatus=`${e.models.length} modelos | ${e.skills.length} skills | ${e.tools.length} tools`}catch{}this.post(e)}async send(e,a){let n=String(e||"").trim();if(!n)return;let o=String(a&&a.displayText?a.displayText:n).trim(),i=_e(n);i&&(n=i.text,i.command==="review"&&(n=n+"\n\n```diff\n"+de()+"\n```"),o=i.displayText||o);let s=null;if(!a||!a.hasExplicitContext){let d=Ye();d&&d.promptBlock&&(n=n+d.promptBlock,o=o+`

[Contexto automatico: `+d.label+"]",s=d.label)}if(this.busy){this.post({type:"message",role:"assistant",text:"Ja existe uma execucao em andamento. A concorrencia permanece controlada no backend."});return}this.busy=!0;let r=Pe(F(n));this.session.tokensIn=(this.session.tokensIn||0)+r,this.session.tokens=(this.session.tokens||0)+r,(!a||a.echoUser!==!1)&&this.post({type:"message",role:"user",text:o}),this.session.messages.push({role:"user",text:o,fullText:n,ts:Date.now(),tokens:r}),this.post({type:"busy",value:!0}),s&&this.post({type:"ctxHint",text:"\u{1F4C4} Contexto automatico: "+s}),this.post({type:"action",ok:!0,text:"Enviando para o Devin CLI..."}),this.refreshMeta();try{let d=Q();if(f(`send: modo=${d} prompt=${n.length} chars`),d==="terminal"){le(n);let x="Sessao aberta no terminal integrado, ja posicionada na pasta aberta no VS Code.";this.post({type:"message",role:"assistant",text:x}),this.session.messages.push({role:"assistant",text:x,ts:Date.now()});return}let u=await Ve(n,{sessionId:this.session.id});f(`send: resposta recebida (${u?u.length:0} chars)`);let h=Pe(u);this.session.tokensOut=(this.session.tokensOut||0)+h,this.session.tokens=(this.session.tokens||0)+h,this.post({type:"message",role:"assistant",text:u}),this.session.messages.push({role:"assistant",text:u,ts:Date.now(),tokens:h})}catch(d){f(`send ERRO: ${d&&d.message?d.message:String(d)}`);let u="Falha ao enviar para o Devin CLI: "+(d&&d.message?d.message:String(d));this.post({type:"message",role:"assistant",text:u}),this.session.messages.push({role:"assistant",text:u,ts:Date.now()})}finally{this.busy=!1,this.post({type:"busy",value:!1}),await this.persistSession(),this.refreshMeta()}}html(e){let a=Ne(),n={history:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.4 1.6"/></svg>',plus:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',refresh:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.55"/><path d="M13 3v3h-3"/></svg>',terminal:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7l2 1.5L5 10M8.5 10.5h3"/></svg>',lock:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',paperclip:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',attach:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',file:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13"/></svg>',folder:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>',close:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',send:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 13.5L14 8 2 2.5 2 7l8 1-8 1z"/></svg>',brain:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3a2 2 0 0 0-2 2 2 2 0 0 0-1 3.5 2 2 0 0 0 1.5 3 2 2 0 0 0 3.5 0V3.5A1.5 1.5 0 0 0 5.5 3z"/><path d="M10.5 3a2 2 0 0 1 2 2 2 2 0 0 1 1 3.5 2 2 0 0 1-1.5 3 2 2 0 0 1-3.5 0V3.5A1.5 1.5 0 0 1 10.5 3z"/></svg>',bot:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="10" height="7" rx="1.5"/><path d="M8 3v2.5M5.5 8.5h.01M10.5 8.5h.01M2 9.5v1.5M14 9.5v1.5"/></svg>',mode:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5h12M2 8h8M2 10.5h10"/></svg>',sparkle:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l1.2 3.4L12.5 6.5 9.2 7.6 8 11l-1.2-3.4L3.5 6.5 6.8 5.4z"/></svg>',wrench:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M10.8 2.2a3.2 3.2 0 0 0-3.7 4.1L2.6 10.8a1.7 1.7 0 0 0 2.4 2.4l4.5-4.5a3.2 3.2 0 0 0 4.1-3.7l-2.2 2.2-2.1-.5-.5-2.1z"/></svg>',caret:'<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l6 5-6 5z"/></svg>'},o=[{label:"auto",value:"auto"},{label:"sonnet",value:"sonnet"},{label:"opus",value:"opus"},{label:"swe",value:"swe"},{label:"gpt",value:"gpt"}];return`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${e.cspSource} data:; style-src 'unsafe-inline' ${e.cspSource}; script-src 'nonce-${a}';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
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
  <button type="button" class="iconBtn" data-action="terminal" title="Abrir sessao no terminal">${n.terminal}</button>
</header>
<div id="historyPanel" class="panel"><header>Historico <div class="barSpacer"></div><button data-action="clearHistory">Limpar</button></header><div id="historyList"></div></div>

<main class="thread" id="thread">
  <section class="welcome" id="welcome">
    <div class="welcomeTitle">Como posso ajudar neste workspace?</div>
    <div class="welcomeText">Selecione modelo, agente, modo e skills antes de enviar. As ultimas conversas ficam disponiveis para continuar.</div>
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
      <button type="button" class="chipBtn" data-action="openModeMenu" id="modeChip" title="Modo">${n.mode}<span class="chipText" id="modeChipText">Modo</span><span class="caret">${n.caret}</span></button>
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
<script nonce="${a}">
(function(){
'use strict';
var vscode = acquireVsCodeApi();
var ICONS = ${JSON.stringify(n)};
var MODEL_TREE = ${JSON.stringify(o)};
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
  if(name === 'terminal') return post({ type: 'terminal', text: getPrompt() });
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
  if(name === 'openModeMenu') return openModeMenu();
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
</script></body></html>`}};async function Bt(t){V=t,B=c.window.createOutputChannel("Devin Cli Chat"),t.subscriptions.push(B),f(`Extens\xE3o ativando \u2014 VS Code ${c.version}, extens\xE3o ${t.extension.packageJSON.version}`),f(`Plataforma: ${process.platform} ${process.arch}`),f(`Devin CLI path configurado: ${k()}`),f(`Workspace: ${v()||"nenhum"}`),await nt(t),g=new ue(t),t.subscriptions.push(c.window.registerWebviewViewProvider("devinCliChat.chatView",g,{webviewOptions:{retainContextWhenHidden:!0}})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.abrirPainel",async()=>c.commands.executeCommand("workbench.view.extension.devinCliChat"))),t.subscriptions.push(c.commands.registerCommand("devinCliChat.abrirHistorico",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),setTimeout(()=>{g&&g.openHistory()},100)})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.exportarSessaoAtual",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),g&&await g.exportSession()})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.novaSessao",()=>le(""))),t.subscriptions.push(c.commands.registerCommand("devinCliChat.revisarDiff",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),g&&await g.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+de()+"\n```")})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.enviarSelecao",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),g&&await g.send(`Analise o contexto do editor atual.

`+ce())})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarModelo",Tt)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.definirModeloManual",Me)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.atualizarModelos",async()=>{q(),g&&g.refreshMeta();let n=await Ke();if(n.length){let o=Array.from(new Set([...m().get("modelosDisponiveis")||[],...n]));await m().update("modelosDisponiveis",o,c.ConfigurationTarget.Workspace),q()}g&&g.refreshMeta(),c.window.showInformationMessage(`Modelos atualizados (${K().length} disponiveis).`)})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarAgente",async()=>{let n="+ Importar arquivo .md como agente",o=await c.window.showQuickPick([n,...ye()],{placeHolder:"Selecione o agente Devin"});if(o){if(o===n){await et();return}await b("agenteAtual",o)}})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarSkills",At)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarTools",It)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarModo",async()=>{let n=await c.window.showQuickPick([{label:"Integrado (resposta no chat)",value:"resposta-integrada"},{label:"Terminal",value:"terminal"}],{placeHolder:"Selecione o modo de execucao"});n&&await b("modoExecucaoChat",n.value)})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.limparHistorico",async()=>{await c.window.showWarningMessage("Limpar todo o historico de chats?",{modal:!0},"Limpar")==="Limpar"&&(await G([]),g&&g.post({type:"history",sessions:[]}))})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.verificarCli",()=>{B.show(!0),f(`Verificando Devin CLI: ${k()}`),N.execFile(k(),["--version"],{cwd:E(),windowsHide:!0},(n,o,i)=>{if(n)f(`verificarCli ERRO: code=${n.code} msg=${n.message}`),c.window.showErrorMessage(`Falha ao verificar Devin CLI: ${n.message}`);else{let s=(o||i||"ok").trim();f(`verificarCli OK: ${s}`),c.window.showInformationMessage(`Devin CLI encontrado: ${s}`)}})}));let e,a=()=>{e&&clearTimeout(e),e=setTimeout(()=>{g&&g.pushCurrentSelection(!0)},150)};t.subscriptions.push(c.window.onDidChangeTextEditorSelection(a)),t.subscriptions.push(c.window.onDidChangeActiveTextEditor(a)),t.subscriptions.push(c.workspace.onDidChangeConfiguration(n=>{n.affectsConfiguration(De)&&(q(),pe(),g&&g.refreshMeta())})),pe()}function Pt(){for(let t of Ge())be(t)}module.exports={activate:Bt,deactivate:Pt,_internal:{baseArgs:X,fullPrompt:F,runIntegrated:Ve,modelsForUi:K,scanAgents:ye,scanSkills:ke,scanTools:we,skillNameFromMarkdownFile:Je,importSkillMarkdownFile:Qe,importAgentMarkdownFile:Ze,importToolMarkdownFile:Ce,loadHistory:T,saveHistory:G,sanitizeModel:z,sanitizePromptText:je,isSafeModelId:$e,cancelIntegratedRun:be,automaticEditorContext:Ye,resolveWorkspacePathSafe:Z,registerRunState:ve,unregisterRunState:xe,activeRunIds:Ge,createNonce:Ne,validateWebviewMessage:ze,expandSlashCommand:_e,exportSessionMarkdown:He,shouldApplyFirstInstallRightSidebar:tt,applyFirstInstallRightSidebar:nt}};
