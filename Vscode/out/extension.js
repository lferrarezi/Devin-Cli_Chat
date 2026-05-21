"use strict";var c=require("vscode"),m=require("fs"),d=require("path"),M=require("os"),F=require("child_process"),vt=require("crypto"),Re="devinCliChat",he=["auto","sonnet","opus","codex"],Oe=["low","medium","high"],bt=new Set(["config.json","permission-mode","prompt-file","settings-file","api-key","base-url","model","models","use","eg","env","devin_model","default","help","version","print","verbose","debug","workspace","cache","team-settings","model-configs"]),We="devinCliChat.chatHistory.v1",xt=50,pe=1024*1024,ue=50,yt=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),v,z,X,_,Y=new Map,V={at:0,values:void 0},S={at:0,values:void 0,flag:void 0},U={at:0,values:void 0},K={at:0,values:void 0},Z={at:0,values:void 0};function g(t){let e=new Date().toISOString();_&&_.appendLine(`[${e}] ${t}`)}function we(){return 1e4}function qe(){let t=p().get("cacheModelosMs");return Math.max(0,Number(t??18e5))}function E(){V={at:0,values:void 0},S={at:0,values:void 0,flag:void 0},U={at:0,values:void 0},K={at:0,values:void 0},Z={at:0,values:void 0}}function ke(t){return/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$/.test(String(t||"").trim())}function Ce(t){return/^[a-zA-Z][a-zA-Z0-9._-]{1,40}$/.test(String(t||"").trim())}function p(){return c.workspace.getConfiguration(Re)}function ne(){return String(c.env&&c.env.language||"en").toLowerCase().startsWith("pt")?"pt":"en"}var P={pt:{defaultPromptPrefix:"Responda em portugu\xEAs brasileiro. Seja objetivo, cite arquivos concretos e priorize impacto produtivo, seguran\xE7a, testes e rollback.",htmlLang:"pt-BR",product:"Devin-Cli",history:"Historico",clear:"Limpar",newChat:"Nova conversa",refreshModels:"Atualizar modelos",verifyCli:"Verificar Devin CLI",welcomeTitle:"Como posso ajudar neste workspace?",welcomeText:"Selecione modelo, agente, skills, tools e Bypass antes de enviar. As ultimas conversas ficam disponiveis para continuar.",recent:"Conversas recentes",reviewDiff:"Revisar diff",reviewDiffDesc:"Analisa alteracoes locais.",planTask:"Planejar tarefa",planTaskDesc:"Plano objetivo antes de codar.",explainContext:"Explicar contexto",explainContextDesc:"Usa arquivo aberto ou selecao.",planPrompt:"Planeje a implementacao da proxima tarefa em etapas pequenas, com riscos, testes e estrategia de rollback.",selectModel:"Selecione um modelo",beforeChat:"antes de iniciar a conversa.",placeholder:"Escreva sua mensagem...",attach:"Anexar",attachTitle:"Anexar contexto",model:"Modelo",agent:"Agente",bypass:"Bypass",bypassTitle:"Modo Bypass (--permission-mode dangerous)",cancel:"Cancelar execucao",send:"Enviar"},en:{defaultPromptPrefix:"Answer in English. Be concise, cite concrete files, and prioritize productive impact, security, tests, and rollback.",htmlLang:"en",product:"Devin-Cli",history:"History",clear:"Clear",newChat:"New chat",refreshModels:"Refresh models",verifyCli:"Verify Devin CLI",welcomeTitle:"How can I help in this workspace?",welcomeText:"Select model, agent, skills, tools, and Bypass before sending. Recent chats remain available to continue.",recent:"Recent chats",reviewDiff:"Review diff",reviewDiffDesc:"Analyzes local changes.",planTask:"Plan task",planTaskDesc:"Objective plan before coding.",explainContext:"Explain context",explainContextDesc:"Uses the open file or selection.",planPrompt:"Plan the next task implementation in small steps, with risks, tests, and rollback strategy.",selectModel:"Select a model",beforeChat:"before starting the chat.",placeholder:"Write your message...",attach:"Attach",attachTitle:"Attach context",model:"Model",agent:"Agent",bypass:"Bypass",bypassTitle:"Bypass mode (--permission-mode dangerous)",cancel:"Cancel execution",send:"Send"}};function Ge(t){let e=ne();return P[e]&&P[e][t]||P.en[t]||t}function b(){return c.workspace.workspaceFolders&&c.workspace.workspaceFolders[0]?c.workspace.workspaceFolders[0].uri.fsPath:void 0}function j(){return c.workspace.workspaceFolders&&c.workspace.workspaceFolders[0]?c.workspace.workspaceFolders[0].name:"sem pasta aberta"}function Ve(t){if(!t)return t;let e=String(t);return e==="~"?M.homedir():e.startsWith("~/")||e.startsWith("~\\")?d.join(M.homedir(),e.slice(2)):e}function k(t){let e=Ve(t);return e&&(d.isAbsolute(e)?e:d.join(b()||M.homedir(),e))}function Se(t){try{return!!t&&m.existsSync(t)}catch{return!1}}function f(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Ue(){return vt.randomBytes(18).toString("base64")}function L(t,e){if(typeof t!="string")return;let o=e||2e4;return t.length>o?t.slice(0,o):t}function me(t){return typeof t=="boolean"?t:void 0}function wt(t){return typeof t=="string"&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(t)}function Ke(t){if(!t||typeof t!="object"||Array.isArray(t))return null;let e=L(t.type,40);if(new Set(["ready","cancelRun","verifyCli","requestSelection","attachMenu","attachFiles","pickWorkspaceFiles","manualModel","refreshModels","review","selection","insertSelection","newChat","getHistory","clearHistory","importAgentFile","importSkillFile","importToolFile"]).has(e))return{type:e};if(e==="clientError")return{type:e,text:L(t.text,2e3)||""};if(e==="send"){let n=L(t.text,2e5);if(n===void 0)return null;let a={type:e,text:n},s=L(t.displayText,2e5),i=me(t.echo),r=me(t.hasExplicitContext);return s!==void 0&&(a.displayText=s),i!==void 0&&(a.echo=i),r!==void 0&&(a.hasExplicitContext=r),a}if(e==="searchWorkspaceFiles")return{type:e,query:L(t.query||"",200)||""};if(e==="setBypass"){let n=me(t.value);return n===void 0?null:{type:e,value:n}}if(e==="setModel"||e==="setEffort"||e==="setAgent"||e==="toggleSkill"||e==="toggleTool"){let n=L(t.value,200);return n===void 0?null:{type:e,value:n}}if(e==="listWorkspace"||e==="attachFolder"||e==="attachWorkspacePath"){let n=L(t.path||"",2e3);return n===void 0?null:{type:e,path:n}}return(e==="loadSession"||e==="deleteSession"||e==="exportSession")&&wt(t.id)?{type:e,id:t.id}:null}function Ze(t){let e=String(t||"").trim();if(!e.startsWith("/"))return null;let n=(e.slice(1).split(/\s+/).shift()||"").toLowerCase(),s=e.slice(n.length+2).trim()||"o contexto atual",r={review:"Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.",tests:`Proponha e implemente testes para ${s}. Priorize cobertura de comportamento, regressao e caminhos de erro.`,plan:`Crie um plano tecnico objetivo para ${s}. Agrupe por impacto, risco e ordem de execucao.`,explain:`Explique ${s} com foco em arquitetura, fluxo de dados e pontos de manutencao.`,security:`Revise ${s} com foco em riscos de seguranca, entrada nao confiavel, execucao de comandos e exposicao de dados.`,docs:`Gere documentacao pratica para ${s}, incluindo objetivo, uso, limites e exemplos.`,"commit-msg":"Gere uma mensagem de commit convencional para as mudancas atuais, com escopo claro e resumo curto."}[n];return r?{command:n,text:r,displayText:e}:null}function G(t){return String(t??"").replace(/\r?\n/g," ").trim()}function Qe(t){let e=t||{},o=[];o.push("# "+(G(e.title)||"Sessao Devin")),o.push(""),o.push("- Workspace: "+(G(e.workspace)||j())),o.push("- Modelo: "+(G(e.model)||"auto")),o.push("- Agente: "+(G(e.agent)||"auto")),o.push("- Modo: "+(G(e.mode)||"resposta-integrada")),e.createdAt&&o.push("- Criada em: "+new Date(e.createdAt).toISOString()),e.updatedAt&&o.push("- Atualizada em: "+new Date(e.updatedAt).toISOString()),o.push("");let n=Array.isArray(e.messages)?e.messages:[];for(let a of n){let s=String(a&&a.role||"message").toLowerCase();o.push("## "+s.charAt(0).toUpperCase()+s.slice(1)),a&&a.ts&&o.push("_"+new Date(a.ts).toISOString()+"_"),o.push(""),o.push(String(a&&a.text||"").trim()),o.push("")}return o.join(`
`).trim()+`
`}function H(t){return`'${String(t).replace(/'/g,"'\\''")}'`}function Je(t){return String(t??"").replace(/\u0000/g,"")}function A(t){let e=String(t||"").trim().toLowerCase();return!e||e==="default"||e==="padrao"||e==="padr\xE3o"?"auto":ke(e)?e:"auto"}function W(t){let e=String(t||"").trim().toLowerCase();return!e||e==="default"||e==="padrao"||e==="padr\xE3o"?"auto":Ce(e)?e:"auto"}function Xe(t){return A(t)}function kt(){return[...he]}function Ct(t){try{return Se(t)?JSON.parse(m.readFileSync(t,"utf8")):void 0}catch{return}}function St(){if(process.platform==="win32"){let t=process.env.APPDATA||d.join(M.homedir(),"AppData","Roaming");return d.join(t,"devin","config.json")}return d.join(M.homedir(),".config","devin","config.json")}function Me(){let t=Ct(St());return t&&t.agent?Xe(t.agent.model):void 0}function T(){let t=p().get("modeloAtual");return Xe(t??(Me()||"auto"))}function Ye(){let t=p().get("modeloAtual");return A(t??(Me()||"auto"))}function $(){return W(p().get("effortAtual")||"auto")}function oe(){return String(p().get("agenteAtual")||"auto")}function ge(){return"resposta-integrada"}function D(){let t=p().get("skillsSelecionadas")||[];return Array.isArray(t)?t.map(String).filter(Boolean):[]}function R(){let t=p().get("toolsSelecionadas")||[];return Array.isArray(t)?t.map(String).filter(Boolean):[]}function Mt(){return!!p().get("usarBypass",!1)}function C(){return String(p().get("caminhoDevin")||"devin")}function I(){return b()||M.homedir()}function je(t){try{if(m.existsSync(t))return m.realpathSync.native?m.realpathSync.native(t):m.realpathSync(t)}catch{}return d.resolve(t)}function Et(t,e){let o=d.relative(t,e);return o===""||!!o&&!o.startsWith("..")&&!d.isAbsolute(o)}function te(t){let e=b();if(!e)return null;let o=je(e),n=String(t||"").replace(/\\/g,d.sep).trim(),a=d.isAbsolute(n)?d.resolve(n):d.resolve(o,n),s=je(a);return Et(o,s)?s:null}function et(){return[Ve(p().get("gitBashPath")),process.env.GIT_BASH_PATH,"C:\\Program Files\\Git\\bin\\bash.exe","C:\\Program Files\\Git\\usr\\bin\\bash.exe","C:\\Program Files (x86)\\Git\\bin\\bash.exe",d.join(M.homedir(),"AppData","Local","Programs","Git","bin","bash.exe")].filter(Boolean).find(Se)}function Tt(){return process.platform==="win32"&&p().get("usarGitBashNoWindows",!0)?et():process.env.SHELL||void 0}function re(){let t=[...(p().get("argumentosPadrao")||[]).map(String).filter(Boolean)],e=String(p().get("argumentoModelo")||"").trim(),o=Ye();e&&o&&o!=="auto"&&t.push(e,o);let n=$(),a=it();if(a&&n&&n!=="auto"&&t.push(a,n),p().get("usarBypass",!1)){let s=String(p().get("argumentoBypass")||"--permission-mode").trim(),i=String(p().get("valorBypass")||"dangerous").trim();s&&i&&t.push(s,i)}return t}function q(t){let e=p().get("prefixoPromptPadrao"),o=e==null||String(e).trim()===""?Ge("defaultPromptPrefix"):String(e),n=Ye()||T()||"auto",a=$(),s=oe(),i=D(),r=R(),l=[`Workspace VS Code: ${j()}`,b()?`Diretorio raiz: ${b()}`:"Diretorio raiz: nao ha pasta aberta",`Modelo selecionado: ${n}`,a!=="auto"?`Effort selecionado: ${a}`:"",`Agente selecionado: ${s}`,i.length?`Skills disponiveis: ${i.join(", ")}`:"",r.length?`Tools disponiveis: ${r.join(", ")}`:""].filter(Boolean).join(`
`),u=s!=="auto"?`Use o perfil/subagente Devin chamado "${s}" quando aplicavel. Se a CLI nao aceitar selecao direta de agente nesta chamada, trate este agente como persona operacional e siga as instrucoes do respectivo AGENT.md.`:"",h=i.length?`Invoque a skill via tool 'skill' quando aplicavel: ${i.map(y=>`"${y}"`).join(", ")}. Siga as instrucoes do respectivo SKILL.md.`:"",w=r.length?`Use as tools selecionadas quando aplicavel: ${r.map(y=>`"${y}"`).join(", ")}. Siga as instrucoes do respectivo TOOL.md.`:"";return Je([o,l,u,h,w,t].filter(Boolean).join(`

`))}function At(t){let e=H(C()),o=re().map(H).join(" ");return t?[e,o,"-p","--",H(q(t))].filter(Boolean).join(" "):[e,o].filter(Boolean).join(" ")}function It(t){return t?String(t).split(/\r?\n/).filter(e=>!/were not migrated because they already exist/i.test(e)).filter(e=>!/migration.*already exist/i.test(e)).join(`
`).trim():""}function tt(t,e,o){let n=It(e),a=[t||"",n||"",o&&o.message?o.message:""].join(`
`);if(/No active model set in cog manager/i.test(a))return["Modelo Devin nao configurado para esta execucao.","","A extensao tentou enviar o alias selecionado, mas o Devin CLI informou que nao ha modelo ativo no cog manager.","","Acoes recomendadas:",`1. Execute no terminal: devin model set ${T()||"auto"}`,"2. Se houver conflito de migracao de config, mantenha apenas o valor desejado em agent.model no config.json do Devin.","3. No chat, reabra o seletor de modelo e escolha um dos aliases validos: auto, sonnet, opus, swe, gpt."].join(`
`);let s=[];return t&&t.trim()&&s.push(t.trim()),n&&s.push(`STDERR:
${n}`),o&&s.push(`Falha ao executar Devin CLI: ${o.message}`),s.join(`

`)||"Sem saida do Devin CLI."}function Lt(t){let e=Tt(),o=c.window.createTerminal({name:p().get("nomeTerminal")||"Devin Cli Chat",cwd:I(),shellPath:e,shellArgs:process.platform==="win32"&&e?["--login","-i"]:void 0});o.show(!0),o.sendText(At(t))}function ee(t){return t||"__default__"}function Ee(t,e){let o=ee(t);return Y.set(o,Object.assign({sessionId:o,cancelRequested:!1,startedAt:Date.now()},e||{})),Y.get(o)}function Q(t){return Y.get(ee(t))}function Te(t){Y.delete(ee(t))}function nt(){return Array.from(Y.keys())}function Ae(t){let e=Q(t);if(!e)return!1;e.cancelRequested=!0;let o=e.process;if(!o||o.killed)return!1;try{return o.kill(),!0}catch(n){return g(`cancelIntegratedRun erro: ${n&&n.message?n.message:String(n)}`),!1}}function ot(t,e){return new Promise(o=>{let n=ee(e&&e.sessionId),a=[...re(),"-p","--",q(t)];g(`runIntegrated: session=${n} ${C()} ${a.slice(0,-1).join(" ")} -- [prompt ${q(t).length} chars]`),g(`  cwd: ${I()}`);let s=!1;function i(r){s||(s=!0,Te(n),o(r))}try{let r=F.execFile(C(),a,{cwd:I(),timeout:Number(p().get("timeoutChatMs")||3e5),maxBuffer:16777216,windowsHide:!0},(l,u,h)=>{let w=Q(n);if(w&&w.cancelRequested){i("Execucao cancelada pelo usuario.");return}if(l&&g(`runIntegrated erro: code=${l.code} signal=${l.signal} killed=${l.killed} msg=${l.message}`),h&&h.trim()&&g(`runIntegrated stderr: ${h.slice(0,500)}`),u&&u.trim()&&g(`runIntegrated stdout: ${u.slice(0,200)}...`),l&&process.platform==="win32"){fe(t,l,{sessionId:n}).then(i);return}i(tt(u,h,l))});Ee(n,{process:r,mode:"integrated"}),r.on("error",l=>{g(`runIntegrated child error: ${l.message}`);let u=Q(n);if(u&&u.cancelRequested){i("Execucao cancelada pelo usuario.");return}process.platform==="win32"?fe(t,l,{sessionId:n}).then(i):i(`Falha ao iniciar Devin CLI: ${l.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)})}catch(r){g(`runIntegrated catch: ${r.message}`);let l=Q(n);if(l&&l.cancelRequested){i("Execucao cancelada pelo usuario.");return}process.platform==="win32"?fe(t,r,{sessionId:n}).then(i):i(`Falha ao iniciar Devin CLI: ${r.message}

Valide o caminho em devinCliChat.caminhoDevin e execute "Devin Cli Chat: Verificar Devin CLI".`)}})}function fe(t,e,o){return new Promise(n=>{let a=ee(o&&o.sessionId),s=et();if(!s){n(`Falha ao executar Devin CLI: ${e.message}

Git Bash nao foi encontrado. Configure devinCliChat.gitBashPath ou ajuste devinCliChat.caminhoDevin.`);return}let i=re().map(H).join(" "),r=`${H(C())} ${i} -p -- ${H(q(t))}`,l=F.exec(r,{cwd:I(),shell:s,timeout:Number(p().get("timeoutChatMs")||3e5),maxBuffer:1024*1024*16},(u,h,w)=>{let y=Q(a);if(Te(a),y&&y.cancelRequested){n("Execucao cancelada pelo usuario.");return}let N=tt(h,w,u);n(N.replace("Falha ao executar Devin CLI:","Falha ao executar Devin CLI via Git Bash:"))});Ee(a,{process:l,mode:"bash"})})}async function x(t,e){await p().update(t,e,c.ConfigurationTarget.Workspace),E(),xe(),v&&v.refreshMeta()}function Bt(){let t=p().get("modelosDisponiveis")||[];return Array.isArray(t)?t.map(String).map(e=>e.trim()).filter(ae):[]}function Pt(){let t=p().get("arquivosCacheModelos")||[],e=Array.isArray(t)?t.map(k).filter(Boolean):[];if(process.platform==="win32"){let o=process.env.LOCALAPPDATA||d.join(M.homedir(),"AppData","Local");e.push(d.join(o,"Devin","CLI","team_settings.bin")),e.push(d.join(o,"Devin","CLI","model_configs.bin"))}else e.push(d.join(M.homedir(),".local","share","Devin","CLI","team_settings.bin")),e.push(d.join(M.homedir(),".local","share","Devin","CLI","model_configs.bin"));return Array.from(new Set(e))}function ae(t){let e=String(t||"").trim().toLowerCase();return!ke(e)||bt.has(e)?!1:/^(auto|sonnet|opus|codex|swe)$/.test(e)?!0:/^(claude|gpt|o[0-9]|codex[-_.]|sonnet[-_.]|opus[-_.]|openai[-_.]|anthropic[-_.])/.test(e)}function Ie(t){let e=[],o=String(t||""),n=o.match(/"([^"]{2,80})"/g)||[];for(let s of n){let i=s.slice(1,-1).trim();ae(i)&&e.push(i)}let a=o.match(/[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}/g)||[];for(let s of a)ae(s)&&e.push(s);return Array.from(new Set(e.map(A))).filter(Boolean)}function $t(){let t=p().get("effortsDisponiveis")||[];return Array.isArray(t)?t.map(String).map(e=>e.trim()).filter(Boolean):[]}function Dt(t){let e=String(t||"").trim().toLowerCase();return!Ce(e)||["effort","reasoning","level","value","default"].includes(e)?!1:Oe.includes(e)||/^(minimal|none|low|medium|high|xhigh|max|auto)$/.test(e)}function at(t){let e=String(t||""),o=e.match(/--(?:reasoning[-_]?)?effort\b|--effort\b/i);if(!o)return{flag:"",values:[]};let n=o[0].toLowerCase().replace("_","-"),a=[],s=e.slice(Math.max(0,o.index-250),Math.min(e.length,o.index+700)),i=s.match(/(?:possible values?|values?|op(?:ç|c)(?:ões|oes)?|choices?)\s*[:=]\s*([^\]\)\n.]+)/i);if(i){let l=i[1].match(/[a-zA-Z][a-zA-Z0-9._-]{1,40}/g)||[];a.push(...l)}let r=s.match(/"([^"]{2,40})"|'([^']{2,40})'|`([^`]{2,40})`/g)||[];for(let l of r)a.push(l.slice(1,-1));return a.length||a.push(...Oe),{flag:n,values:Array.from(new Set(a.map(W).filter(l=>l&&l!=="auto"&&Dt(l))))}}function st(){return new Promise(t=>{try{F.execFile(C(),["--help"],{cwd:I(),timeout:Number(p().get("timeoutDescobertaModelosMs")||2500),windowsHide:!0},(e,o,n)=>{let a=[o||"",n||""].join(`
`);if(e&&!a.trim()){t({flag:"",values:[]});return}t(at(a))})}catch{t({flag:"",values:[]})}})}function it(){let t=String(p().get("argumentoEffort")||"").trim();return t||S.flag||""}function se(){let t=qe(),e=Date.now();if(t>0&&S.values&&e-S.at<t)return S.values;let o=$(),n=$t().map(W).filter(l=>l&&l!=="auto"),a=(S.values||[]).filter(l=>l!=="auto"),i=!!it()||n.length?["auto",o,...n,...a]:[],r=Array.from(new Set(i.map(W).filter(Boolean)));return S={...S,at:e,values:r},r}function Ft(){let t=Number(p().get("limiteBytesCacheModelos")||5242880),e=[];for(let o of Pt())try{if(!Se(o))continue;let n=m.statSync(o);if(!n.isFile()||n.size>t)continue;let s=m.readFileSync(o).toString("utf8");e.push(...Ie(s))}catch{}return Array.from(new Set(e))}function ie(){return new Promise(t=>{let e=String(p().get("comandoDescobertaModelos")||"").trim(),o=e?e.split(/\s+/):["--help"];try{F.execFile(C(),o,{cwd:I(),timeout:Number(p().get("timeoutDescobertaModelosMs")||2500),windowsHide:!0},(n,a,s)=>{let i=[a||"",s||""].join(`
`);if(n&&!i.trim()){t([]);return}try{let r=JSON.parse(i),l=Array.isArray(r)?r:r&&r.models||[];t(l.map(u=>typeof u=="string"?u:u&&(u.name||u.id)).filter(ae).map(A));return}catch{}t(Ie(i))})}catch{t([])}})}function O(){let t=qe(),e=Date.now();if(t>0&&V.values&&e-V.at<t)return V.values;let o=T(),n=[Me(),...Bt(),...Ft()].map(A).filter(Boolean).filter(i=>i!=="auto"),a=n.length?["auto",o,...n]:["auto",o,...kt()],s=Array.from(new Set(a.map(A).filter(Boolean)));return V={at:e,values:s},s}function Le(){let t=Date.now();if(U.values&&t-U.at<we())return U.values;let e=[k(p().get("diretorioAgentesWorkspace")||".devin/agents"),k(p().get("diretorioAgentesGlobal")||"~/.config/devin/agents")],o=["auto"];for(let a of e)try{if(!a||!m.existsSync(a))continue;for(let s of m.readdirSync(a)){let i=d.join(a,s,"AGENT.md");m.existsSync(i)&&o.push(s)}}catch{}let n=Array.from(new Set(o));return U={at:t,values:n},n}function Be(){let t=Date.now();if(Z.values&&t-Z.at<we())return Z.values;let e=[k(p().get("diretorioToolsWorkspace")||".devin/tools"),k(p().get("diretorioToolsGlobal")||"~/.config/devin/tools")],o=[];for(let a of e)try{if(!a||!m.existsSync(a))continue;for(let s of m.readdirSync(a)){let i=d.join(a,s,"TOOL.md");m.existsSync(i)&&o.push(s)}}catch{}let n=Array.from(new Set(o)).sort();return Z={at:t,values:n},n}function Pe(){let t=Date.now();if(K.values&&t-K.at<we())return K.values;let e=[k(p().get("diretorioSkillsWorkspace")||".devin/skills"),k(p().get("diretorioSkillsGlobal")||"~/.config/devin/skills"),k(".claude/skills"),k("~/.claude/skills")],o=[];for(let a of e)try{if(!a||!m.existsSync(a))continue;for(let s of m.readdirSync(a)){let i=d.join(a,s,"SKILL.md");m.existsSync(i)&&o.push(s)}}catch{}let n=Array.from(new Set(o)).sort();return K={at:t,values:n},n}function rt(t){return d.basename(String(t||""),d.extname(String(t||""))).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^[._-]+|[._-]+$/g,"").replace(/-{2,}/g,"-")||"skill"}function Nt(){return k(p().get("diretorioSkillsWorkspace")||".devin/skills")}function zt(){return k(p().get("diretorioAgentesWorkspace")||".devin/agents")}function _t(){return k(p().get("diretorioToolsWorkspace")||".devin/tools")}function jt(t,e){let o=d.join(t,e),n=2;for(;m.existsSync(o);)o=d.join(t,`${e}-${n}`),n++;return o}function lt(t){return De(t,Nt(),"SKILL.md")}function ct(t){return De(t,zt(),"AGENT.md")}function $e(t){return De(t,_t(),"TOOL.md")}function De(t,e,o){let n=String(t||"");if(!n||d.extname(n).toLowerCase()!==".md")throw new Error("Selecione um arquivo .md para importar.");if(!m.existsSync(n)||!m.statSync(n).isFile())throw new Error("Arquivo markdown nao encontrado: "+n);if(!e)throw new Error("Diretorio padrao nao resolvido.");let a=rt(n),s=jt(e,a),i=d.basename(s);m.mkdirSync(s,{recursive:!0});let r=d.join(s,o);return m.copyFileSync(n,r),E(),{name:i,file:r,dir:s}}function ve(){let t=c.window.activeTextEditor;if(!t)return"Nenhum editor ativo.";let e=t.document,o=t.selection&&!t.selection.isEmpty?e.getText(t.selection):e.getText();return[`Arquivo: ${e.uri.fsPath}`,"Conteudo:","```",o.slice(0,6e4),"```"].join(`
`)}function He(t){return t?Math.max(1,Math.ceil(String(t).length/4)):0}function Ht(t){if(!t||!t.selection||t.selection.isEmpty)return null;let e=t.document,o=t.selection,n=e.getText(o);if(!n||!n.trim())return null;let a=e.uri.fsPath,s=d.basename(a),i=o.start.line+1,r=o.end.line+1;return{id:"sel-"+Date.now().toString(36),file:a,base:s,language:e.languageId,startLine:i,endLine:r,text:n,preview:n.split(`
`).slice(0,2).join(" ").slice(0,80),label:`${s}:${i}-${r}`}}function dt(){try{if(p().get("usarContextoEditorAutomatico")===!1)return null;let e=String(p().get("modoContextoEditorAutomatico")||"selecao-ou-arquivo");if(e==="desativado")return null;let o=c.window.activeTextEditor;if(!o)return null;let n=o.document;if(!n||!n.uri||n.uri.scheme!=="file")return null;let a=n.uri.fsPath,s=d.basename(a),i=n.languageId||d.extname(a).slice(1)||"",r="```",l=o.selection,u=!!(l&&!l.isEmpty);if(e!=="somente-arquivo"&&u){let de=n.getText(l);if(!de||!de.trim())return null;let ft=l.start.line+1,ht=l.end.line+1,_e=`${s}:${ft}-${ht}`,gt=["","",`[Contexto automatico do editor: ${_e}]`,r+i,de,r].join(`
`);return{label:_e,promptBlock:gt}}if(e==="somente-selecao")return null;let h=n.getText();if(!h||!h.trim())return null;let w=Number(p().get("limiteBytesContextoEditorAutomatico")),y=Number.isFinite(w)&&w>0?w:2e5,N=Buffer.from(h,"utf8"),ce=N.length>y,mt=ce?N.subarray(0,y).toString("utf8"):h,Ne=ce?`${s} (truncado)`:s,ze=["","",`[Contexto automatico do editor: ${Ne}]`,r+i,mt,r];return ce&&ze.push(`[NOTA: arquivo truncado em ${y} bytes para limitar o tamanho do contexto automatico.]`),{label:Ne,promptBlock:ze.join(`
`)}}catch{return null}}function be(){try{return F.execFileSync("git",["diff","--no-ext-diff"],{cwd:I(),encoding:"utf8",maxBuffer:1024*1024*8,windowsHide:!0})}catch(t){return`Nao foi possivel obter git diff: ${t.message}`}}function xe(){z||(z=c.window.createStatusBarItem(c.StatusBarAlignment.Right,90),z.command="devinCliChat.abrirPainel",z.show());let t=$();z.text=`Devin: ${T()}${t!=="auto"?" / "+t:""} / ${oe()}`,z.tooltip=`Workspace: ${j()} | Modo: ${ge()} | Effort: ${t} | Skills: ${D().length}`}async function Fe(){let t=await c.window.showInputBox({title:"Modelo Devin",prompt:"Informe um modelo aceito pelo seu Devin CLI, por exemplo claude-sonnet-4, claude-opus-4.6, opus ou codex.",value:T()==="auto"?"":T()});if(!t||!t.trim())return;let e=A(t);e!==String(t).trim().toLowerCase()&&c.window.showInformationMessage(`Modelo "${t.trim()}" foi normalizado para "${e}".`),await x("modeloAtual",e)}async function Rt(){E();let t=await ie();if(t.length){let o=Array.from(new Set([...p().get("modelosDisponiveis")||[],...t]));await p().update("modelosDisponiveis",o,c.ConfigurationTarget.Workspace),E()}let e=await c.window.showQuickPick([...O(),"+ Informar modelo manual"],{placeHolder:"Selecione o modelo Devin"});if(e){if(e.startsWith("+"))return Fe();await x("modeloAtual",e)}}async function Ot(){E();let t=await st();if(t&&t.flag&&(S={at:Date.now(),values:["auto",...t.values],flag:t.flag},t.values&&t.values.length)){let n=Array.from(new Set([...p().get("effortsDisponiveis")||[],...t.values]));await p().update("effortsDisponiveis",n,c.ConfigurationTarget.Workspace)}let e=se();if(!e.length){c.window.showInformationMessage("Este Devin CLI nao exp\xF5e selecao de Effort na ajuda local.");return}let o=await c.window.showQuickPick(e,{placeHolder:"Selecione o Effort do Devin"});o&&await x("effortAtual",o)}async function Wt(){let t=Pe(),e="+ Importar arquivo .md como skill",o=new Set(D()),n=[{label:e,description:"Copia para o diretorio padrao de skills"},...t.map(i=>({label:i,picked:o.has(i)}))],a=await c.window.showQuickPick(n,{canPickMany:!0,placeHolder:t.length?"Selecione skills disponiveis para o Devin":"Importe um .md ou selecione skills disponiveis"});if(!a)return;let s=a.filter(i=>i.label!==e).map(i=>i.label);if(a.some(i=>i.label===e)){let i=await pt({selectImported:!1});i&&s.push(i.name)}await x("skillsSelecionadas",Array.from(new Set(s)))}async function qt(){let t=Be(),e="+ Importar arquivo .md como tool",o=new Set(R()),n=[{label:e,description:"Copia para o diretorio padrao de tools"},...t.map(i=>({label:i,picked:o.has(i)}))],a=await c.window.showQuickPick(n,{canPickMany:!0,placeHolder:t.length?"Selecione tools disponiveis para o Devin":"Importe um .md ou selecione tools disponiveis"});if(!a)return;let s=a.filter(i=>i.label!==e).map(i=>i.label);if(a.some(i=>i.label===e)){let i=await le({kind:"tool",importer:$e,configKey:"toolsSelecionadas",selectImported:!1});i&&s.push(i.name)}await x("toolsSelecionadas",Array.from(new Set(s)))}async function pt(t){return le({kind:"skill",importer:lt,configKey:"skillsSelecionadas",selectImported:!t||t.selectImported!==!1})}async function ut(t){return await le({kind:"agente",importer:ct,configKey:"agenteAtual",singleValue:!0,selectImported:!t||t.selectImported!==!1})}async function Gt(t){return le({kind:"tool",importer:$e,configKey:"toolsSelecionadas",selectImported:!t||t.selectImported!==!1})}async function le(t){let e=await c.window.showOpenDialog({canSelectFiles:!0,canSelectFolders:!1,canSelectMany:!1,filters:{Markdown:["md"]},title:"Importar arquivo Markdown como "+t.kind+" Devin"});if(!e||!e.length)return null;try{let o=t.importer(e[0].fsPath);if(t.selectImported!==!1)if(t.singleValue)await x(t.configKey,o.name);else{let n=new Set(t.configKey==="toolsSelecionadas"?R():D());n.add(o.name),await x(t.configKey,Array.from(n))}return v&&v.refreshMeta(),c.window.showInformationMessage(`${t.kind} "${o.name}" importado para ${o.file}.`),o}catch(o){return c.window.showErrorMessage("Falha ao importar "+t.kind+": "+(o&&o.message?o.message:String(o))),null}}function B(){try{return X&&X.globalState.get(We)||[]}catch{return[]}}async function J(t){try{X&&await X.globalState.update(We,t.slice(0,xt))}catch{}}var ye=class{constructor(e){this.context=e,this.view=void 0,this.busy=!1,this.session=this.newSession()}newSession(){return{id:"sess-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6),title:"Nova conversa",createdAt:Date.now(),updatedAt:Date.now(),workspace:j(),model:T(),effort:$(),agent:oe(),mode:ge(),skills:D(),tools:R(),messages:[]}}async persistSession(){if(!this.session||!this.session.messages.length)return;let e=B(),o=e.findIndex(n=>n.id===this.session.id);if(this.session.updatedAt=Date.now(),!this.session.title||this.session.title==="Nova conversa"){let n=this.session.messages.find(a=>a.role==="user");n&&(this.session.title=String(n.text).slice(0,60).replace(/\s+/g," ").trim())}o>=0?e[o]=this.session:e.unshift(this.session),e.sort((n,a)=>(a.updatedAt||0)-(n.updatedAt||0)),await J(e)}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this.context.extensionUri]},e.webview.html=this.html(e.webview),g("WebView resolvida e HTML injetado."),e.webview.onDidReceiveMessage(async o=>{try{let n=Ke(o);if(!n){g("Mensagem webview rejeitada por validacao.");return}let a=n.type;if(g(`Mensagem recebida do webview: type=${a}`),a==="ready"){this.refreshMeta(),this.replaySession(),this.pushCurrentSelection();return}if(a==="clientError"){g(`ERRO no cliente webview: ${n.text||"sem detalhes"}`),this.post({type:"message",role:"assistant",text:"Falha no painel: "+(n.text||"erro sem detalhes")});return}if(a==="cancelRun"){let s=Ae(this.session&&this.session.id);this.post({type:"action",ok:s,text:s?"Cancelamento solicitado.":"Nenhuma execucao integrada ativa para cancelar."});return}if(a==="verifyCli"){this.verifyCli();return}if(a==="requestSelection"){this.pushCurrentSelection(!0);return}if(a==="attachMenu"){await this.chooseAttachSource();return}if(a==="attachFiles"){await this.attachFiles();return}if(a==="pickWorkspaceFiles"){await this.pickWorkspaceFiles();return}if(a==="listWorkspace"){this.listWorkspaceDir(n.path||"");return}if(a==="attachFolder"){await this.attachFolder(n.path||"");return}if(a==="attachWorkspacePath"){await this.attachWorkspacePath(n.path||"");return}if(a==="searchWorkspaceFiles"){await this.searchWorkspaceFiles(n.query||"");return}if(a==="send"){await this.send(n.text||"",{echoUser:n.echo!==!1,displayText:n.displayText||n.text||"",hasExplicitContext:!!n.hasExplicitContext});return}if(a==="setModel"){await x("modeloAtual",A(n.value||"auto"));return}if(a==="setEffort"){await x("effortAtual",W(n.value||"auto"));return}if(a==="setBypass"){await x("usarBypass",!!n.value);return}if(a==="setAgent"){await x("agenteAtual",n.value||"auto");return}if(a==="importAgentFile"){let s=await ut();s&&this.post({type:"action",ok:!0,text:"Agente importado: "+s.name});return}if(a==="importSkillFile"){let s=await pt();s&&this.post({type:"action",ok:!0,text:"Skill importada: "+s.name});return}if(a==="importToolFile"){let s=await Gt();s&&this.post({type:"action",ok:!0,text:"Tool importada: "+s.name});return}if(a==="toggleSkill"){let s=new Set(D());n.value&&s.has(n.value)?s.delete(n.value):n.value&&s.add(n.value),await x("skillsSelecionadas",Array.from(s));return}if(a==="toggleTool"){let s=new Set(R());n.value&&s.has(n.value)?s.delete(n.value):n.value&&s.add(n.value),await x("toolsSelecionadas",Array.from(s));return}if(a==="manualModel"){await Fe();return}if(a==="refreshModels"){this.refreshMeta();let s=await ie();if(s.length){let i=Array.from(new Set([...p().get("modelosDisponiveis")||[],...s]));await p().update("modelosDisponiveis",i,c.ConfigurationTarget.Workspace)}this.refreshMeta(),this.post({type:"action",ok:!0,text:"Modelos atualizados ("+O().length+" disponiveis)."});return}if(a==="review"){await this.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+be()+"\n```",{echoUser:!0});return}if(a==="selection"){await this.send(`Analise o contexto do editor atual.

`+ve(),{echoUser:!0});return}if(a==="insertSelection"){this.post({type:"insertPrompt",text:`Analise o contexto do editor atual.

`+ve()});return}if(a==="newChat"){await this.persistSession(),this.session=this.newSession(),this.post({type:"clearThread"}),this.refreshMeta();return}if(a==="getHistory"){await this.openHistory();return}if(a==="exportSession"){await this.exportSession(n.id);return}if(a==="loadSession"){await this.persistSession();let i=B().find(r=>r.id===n.id);i&&(this.session=JSON.parse(JSON.stringify(i)),this.post({type:"clearThread"}),this.replaySession(),this.refreshMeta(),this.post({type:"action",ok:!0,text:"Sessao carregada: "+(i.title||i.id)}));return}if(a==="deleteSession"){let s=B().filter(i=>i.id!==n.id);await J(s),this.session&&this.session.id===n.id&&(this.session=this.newSession(),this.post({type:"clearThread"})),this.post({type:"history",sessions:s}),this.refreshMeta();return}if(a==="clearHistory"){await J([]),this.session=this.newSession(),this.post({type:"clearThread"}),this.post({type:"history",sessions:[]}),this.refreshMeta();return}this.post({type:"action",ok:!1,text:`Acao desconhecida: ${a}`})}catch(n){this.busy=!1,this.post({type:"busy",value:!1}),g(`ERRO no handler do webview: ${n&&n.message?n.message:String(n)}`),n&&n.stack&&g(n.stack),this.post({type:"message",role:"assistant",text:"Falha ao executar acao do painel: "+(n&&n.message?n.message:String(n))})}}),setTimeout(()=>this.refreshMeta(),50)}post(e){try{this.view&&this.view.webview.postMessage(e)}catch{}}async openHistory(){await this.persistSession();let e=B().filter(o=>o&&o.messages&&o.messages.length);this.post({type:"openHistory",sessions:e}),this.refreshMeta()}async exportSession(e){await this.persistSession();let o=B(),a=(e?o.find(i=>i.id===e):null)||this.session;if(!a||!a.messages||!a.messages.length){let i="Nao ha conversa com mensagens para exportar.";this.post({type:"action",ok:!1,text:i}),c.window.showInformationMessage(i);return}await c.env.clipboard.writeText(Qe(a));let s="Conversa exportada em Markdown para a area de transferencia.";this.post({type:"action",ok:!0,text:s}),c.window.showInformationMessage(s)}verifyCli(){_.show(!0),g(`Verificando Devin CLI pelo painel: ${C()}`),F.execFile(C(),["--version"],{cwd:I(),windowsHide:!0},(e,o,n)=>{if(e){let i=`Falha ao verificar Devin CLI: ${e.message}`;g(i),this.post({type:"message",role:"assistant",text:i}),this.post({type:"action",ok:!1,text:i});return}let s=`Devin CLI encontrado: ${(o||n||"ok").trim()}`;g(s),this.post({type:"message",role:"assistant",text:s}),this.post({type:"action",ok:!0,text:s})})}pushCurrentSelection(e){let o=c.window.activeTextEditor,n=Ht(o);n&&this.post({type:"selectionAvailable",selection:n})}attachmentId(e){return e+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}readFileItem(e,o){let n=m.statSync(e);if(n.size>pe)return{skipped:!0,reason:`Arquivo muito grande: ${d.basename(e)} (${n.size} bytes).`};let a=m.readFileSync(e,"utf8"),s=d.extname(e).slice(1);return{id:this.attachmentId("file"),file:e,base:d.basename(e),label:o||d.basename(e),type:"file",text:a,language:s,lines:a.split(`
`).length}}readFolderItem(e,o){let n=b(),a=o||d.basename(e)||"workspace",s=[],i=[e];for(;i.length&&s.length<ue;){let r=i.pop(),l;try{l=m.readdirSync(r,{withFileTypes:!0})}catch{continue}for(let u of l){let h=d.join(r,u.name);if(u.isDirectory())!yt.has(u.name)&&!u.name.startsWith(".")&&i.push(h);else if(u.isFile())try{if(m.statSync(h).size>pe)continue;let y=m.readFileSync(h,"utf8"),N=n&&h.startsWith(n)?d.relative(n,h):d.join(a,d.relative(e,h));if(s.push({file:h,rel:N.replace(/\\/g,"/"),base:d.basename(h),text:y,language:d.extname(h).slice(1),lines:y.split(`
`).length}),s.length>=ue)break}catch{}}}return{id:this.attachmentId("folder"),file:e,base:a,label:`${a} (${s.length})`,type:"folder",files:s,count:s.length,truncated:s.length>=ue}}async chooseAttachSource(){let e=await c.window.showQuickPick([{label:"$(folder) Pastas",description:"Anexar pasta recursivamente como chip unico",value:"folders"},{label:"$(file) Arquivos abertos",description:"Anexar arquivos atualmente abertos no editor",value:"openFiles"}],{placeHolder:"Anexar contexto ao Devin"});if(!e)return;if(e.value==="folders"){let r=await c.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!1,canSelectFolders:!0,defaultUri:b()?c.Uri.file(b()):void 0,openLabel:"Anexar pasta"});if(!r||!r.length)return;let l=[];for(let u of r)try{let h=this.readFolderItem(u.fsPath,d.basename(u.fsPath));h.files&&h.files.length&&l.push(h)}catch(h){this.post({type:"action",ok:!1,text:`Falha ao anexar pasta ${u.fsPath}: ${h.message}`})}l.length&&this.post({type:"attachItems",items:l}),this.post({type:"action",ok:!0,text:`Anexadas ${l.length} pasta(s).`});return}let o=c.workspace.textDocuments.filter(r=>r.uri&&r.uri.scheme==="file"&&!r.isUntitled);if(!o.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo aberto para anexar."});return}let n=b()||"",a=o.map(r=>({label:"$(file) "+d.basename(r.uri.fsPath),description:n?d.dirname(d.relative(n,r.uri.fsPath)):d.dirname(r.uri.fsPath),detail:r.uri.fsPath,doc:r})),s=await c.window.showQuickPick(a,{canPickMany:!0,placeHolder:"Selecione arquivos abertos para anexar"});if(!s||!s.length)return;let i=[];for(let r of s){let l=r.doc,u=l.getText();if(Buffer.byteLength(u,"utf8")>pe){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${d.basename(l.uri.fsPath)}.`});continue}i.push({id:this.attachmentId("file"),file:l.uri.fsPath,base:d.basename(l.uri.fsPath),label:d.basename(l.uri.fsPath),type:"file",text:u,language:l.languageId||d.extname(l.uri.fsPath).slice(1),lines:u.split(`
`).length})}i.length&&this.post({type:"attachItems",items:i})}async attachFiles(){try{let e=await c.window.showOpenDialog({canSelectMany:!0,canSelectFiles:!0,canSelectFolders:!1,defaultUri:b()?c.Uri.file(b()):void 0,openLabel:"Anexar ao chat"});if(!e||!e.length)return;let o=[];for(let n of e)try{let a=m.statSync(n.fsPath);if(a.size>1024*1024){o.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n.fsPath,base:d.basename(n.fsPath),label:d.basename(n.fsPath),type:"file",text:`Arquivo ${n.fsPath} muito grande (${a.size} bytes) - nao anexado.`,language:"",tooBig:!0});continue}let s=m.readFileSync(n.fsPath,"utf8"),i=d.extname(n.fsPath).slice(1);o.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n.fsPath,base:d.basename(n.fsPath),label:d.basename(n.fsPath),type:"file",text:s,language:i,lines:s.split(`
`).length})}catch(a){this.post({type:"action",ok:!1,text:`Falha ao ler ${n.fsPath}: ${a.message}`})}o.length&&this.post({type:"attachItems",items:o})}catch(e){this.post({type:"action",ok:!1,text:"Falha ao anexar: "+(e&&e.message?e.message:String(e))})}}async pickWorkspaceFiles(){try{let e=await c.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__}/**",5e3);if(!e.length){this.post({type:"action",ok:!1,text:"Nenhum arquivo encontrado."});return}let o=b()||"",n=e.map(i=>({label:d.relative(o,i.fsPath)||d.basename(i.fsPath),description:"",uri:i})),a=await c.window.showQuickPick(n,{placeHolder:"Selecione arquivos do workspace para anexar",canPickMany:!0,matchOnDescription:!0});if(!a||!a.length)return;let s=[];for(let i of a)try{if(m.statSync(i.uri.fsPath).size>1024*1024)continue;let l=m.readFileSync(i.uri.fsPath,"utf8"),u=d.extname(i.uri.fsPath).slice(1);s.push({id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:i.uri.fsPath,base:d.basename(i.uri.fsPath),label:d.basename(i.uri.fsPath),type:"file",text:l,language:u})}catch{}s.length&&this.post({type:"attachItems",items:s})}catch(e){this.post({type:"action",ok:!1,text:"Falha: "+(e&&e.message?e.message:String(e))})}}listWorkspaceDir(e){try{let o=b();if(!o){this.post({type:"workspaceList",path:e||"",entries:[],error:"Sem workspace aberto."});return}let n=te(e||"");if(!n){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio fora do workspace."});return}if(!m.existsSync(n)||!m.statSync(n).isDirectory()){this.post({type:"workspaceList",path:"",entries:[],error:"Diretorio invalido."});return}let a=d.relative(o,n).replace(/\\/g,"/"),s=new Set(["node_modules",".git","dist","build","out",".venv","__pycache__",".next",".nuxt",".cache","target",".idea"]),i=m.readdirSync(n,{withFileTypes:!0}).filter(r=>!r.name.startsWith(".")||[".cognition",".devin",".claude",".cursor",".vscode"].includes(r.name)).filter(r=>!(r.isDirectory()&&s.has(r.name))).map(r=>{let l=0;try{r.isFile()&&(l=m.statSync(d.join(n,r.name)).size)}catch{}return{name:r.name,isDir:r.isDirectory(),size:l}}).sort((r,l)=>l.isDir-r.isDir||r.name.localeCompare(l.name));this.post({type:"workspaceList",path:a,entries:i})}catch(o){this.post({type:"workspaceList",path:"",entries:[],error:o.message})}}async attachWorkspacePath(e){if(!b())return;let n=te(e||"");if(!n){this.post({type:"action",ok:!1,text:"Caminho fora do workspace."});return}if(!m.existsSync(n)){this.post({type:"action",ok:!1,text:"Caminho invalido."});return}if(m.statSync(n).isDirectory()){await this.attachFolder(e);return}try{let a=m.statSync(n);if(a.size>1024*1024){this.post({type:"action",ok:!1,text:`Arquivo muito grande: ${d.basename(n)} (${a.size} bytes).`});return}let s=m.readFileSync(n,"utf8"),i=d.extname(n).slice(1);this.post({type:"attachItems",items:[{id:"file-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),file:n,base:d.basename(n),label:d.basename(n),type:"file",text:s,language:i}]})}catch(a){this.post({type:"action",ok:!1,text:"Falha: "+a.message})}}async searchWorkspaceFiles(e){try{let o=b();if(!o){this.post({type:"workspaceFileSuggestions",query:e,files:[]});return}let n=String(e||"").toLowerCase(),s=(await c.workspace.findFiles("**/*","**/{node_modules,.git,dist,build,out,.venv,__pycache__,.next,.nuxt,.cache,target,.idea}/**",1e3)).map(i=>{let r=d.relative(o,i.fsPath).replace(/\\/g,"/");return{label:r,path:r,base:d.basename(i.fsPath)}}).filter(i=>!n||i.label.toLowerCase().includes(n)||i.base.toLowerCase().includes(n)).slice(0,20);this.post({type:"workspaceFileSuggestions",query:e,files:s})}catch(o){this.post({type:"workspaceFileSuggestions",query:e,files:[],error:o&&o.message?o.message:String(o)})}}async attachFolder(e){let o=b();if(!o)return;let n=te(e||"");if(!n){this.post({type:"action",ok:!1,text:"Pasta fora do workspace."});return}let a=d.relative(o,n).replace(/\\/g,"/");if(!m.existsSync(n)||!m.statSync(n).isDirectory()){this.post({type:"action",ok:!1,text:"Pasta invalida."});return}let s=this.readFolderItem(n,a?d.basename(n):j());s.files&&s.files.length&&this.post({type:"attachItems",items:[s]}),this.post({type:"action",ok:!0,text:`Pasta anexada como chip unico: ${s.label}.`})}replaySession(){if(!(!this.session||!this.session.messages.length))for(let e of this.session.messages)this.post({type:"message",role:e.role,text:e.text,replay:!0})}refreshMeta(){let e={type:"meta",models:he,model:T(),efforts:[],effort:$(),agents:["auto"],agent:oe(),skills:[],selectedSkills:D(),selectedTools:R(),bypass:Mt(),labels:P[ne()]||P.en,mode:ge(),workspace:j(),sessionId:this.session&&this.session.id,sessionTitle:this.session&&this.session.title,modelLocked:!1,hasMessages:!!(this.session&&this.session.messages&&this.session.messages.length),tokensTotal:this.session&&this.session.tokens||0,tokensIn:this.session&&this.session.tokensIn||0,tokensOut:this.session&&this.session.tokensOut||0,modelStatus:"modelo: auto"};try{e.models=O()}catch{e.models=he}try{e.efforts=se()}catch{e.efforts=[]}try{e.agents=Le()}catch{e.agents=["auto"]}try{e.skills=Pe()}catch{e.skills=[]}try{e.tools=Be()}catch{e.tools=[]}try{e.recentSessions=B().slice(0,3).map(o=>({id:o.id,title:o.title||"Sem titulo",updatedAt:o.updatedAt,messages:(o.messages||[]).length,model:o.model||"auto"}))}catch{e.recentSessions=[]}try{e.modelStatus=`${e.models.length} modelos | ${e.efforts.length?e.efforts.length+" efforts | ":""}${e.skills.length} skills | ${e.tools.length} tools`}catch{}this.post(e),this.refreshModelsFromCliInBackground(),this.refreshEffortsFromCliInBackground()}refreshModelsFromCliInBackground(){p().get("descobrirModelosAutomaticamente",!0)&&(this.refreshingModels||(this.refreshingModels=!0,ie().then(async e=>{if(e&&e.length){let o=Array.from(new Set([...p().get("modelosDisponiveis")||[],...e]));await p().update("modelosDisponiveis",o,c.ConfigurationTarget.Workspace),E();let n=O();this.post({type:"meta",models:n,model:T(),modelStatus:`${n.length} modelos do Devin CLI`})}}).catch(e=>{g("Falha ao descobrir modelos em background: "+(e&&e.message?e.message:String(e)))}).finally(()=>{this.refreshingModels=!1})))}refreshEffortsFromCliInBackground(){p().get("descobrirModelosAutomaticamente",!0)&&(this.refreshingEfforts||(this.refreshingEfforts=!0,st().then(async e=>{if(e&&e.flag){if(S={at:Date.now(),values:["auto",...e.values],flag:e.flag},e.values&&e.values.length){let o=Array.from(new Set([...p().get("effortsDisponiveis")||[],...e.values]));await p().update("effortsDisponiveis",o,c.ConfigurationTarget.Workspace)}this.post({type:"meta",efforts:se(),effort:$()})}}).catch(e=>{g("Falha ao descobrir efforts em background: "+(e&&e.message?e.message:String(e)))}).finally(()=>{this.refreshingEfforts=!1})))}async send(e,o){let n=String(e||"").trim();if(!n)return;let a=String(o&&o.displayText?o.displayText:n).trim(),s=Ze(n);s&&(n=s.text,s.command==="review"&&(n=n+"\n\n```diff\n"+be()+"\n```"),a=s.displayText||a);let i=null;if(!o||!o.hasExplicitContext){let l=dt();l&&l.promptBlock&&(n=n+l.promptBlock,a=a+`

[Contexto automatico: `+l.label+"]",i=l.label)}if(this.busy){this.post({type:"message",role:"assistant",text:"Ja existe uma execucao em andamento. A concorrencia permanece controlada no backend."});return}this.busy=!0;let r=He(q(n));this.session.tokensIn=(this.session.tokensIn||0)+r,this.session.tokens=(this.session.tokens||0)+r,(!o||o.echoUser!==!1)&&this.post({type:"message",role:"user",text:a}),this.session.messages.push({role:"user",text:a,fullText:n,ts:Date.now(),tokens:r}),this.post({type:"busy",value:!0}),i&&this.post({type:"ctxHint",text:"\u{1F4C4} Contexto automatico: "+i}),this.post({type:"action",ok:!0,text:"Enviando para o Devin CLI..."}),this.refreshMeta();try{g(`send: modo=resposta-integrada prompt=${n.length} chars`);let l=await ot(n,{sessionId:this.session.id});g(`send: resposta recebida (${l?l.length:0} chars)`);let u=He(l);this.session.tokensOut=(this.session.tokensOut||0)+u,this.session.tokens=(this.session.tokens||0)+u,this.post({type:"message",role:"assistant",text:l}),this.session.messages.push({role:"assistant",text:l,ts:Date.now(),tokens:u})}catch(l){g(`send ERRO: ${l&&l.message?l.message:String(l)}`);let u="Falha ao enviar para o Devin CLI: "+(l&&l.message?l.message:String(l));this.post({type:"message",role:"assistant",text:u}),this.session.messages.push({role:"assistant",text:u,ts:Date.now()})}finally{this.busy=!1,this.post({type:"busy",value:!1}),await this.persistSession(),this.refreshMeta()}}html(e){let o=Ue(),n={history:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.4 1.6"/></svg>',plus:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',refresh:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.55"/><path d="M13 3v3h-3"/></svg>',terminal:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7l2 1.5L5 10M8.5 10.5h3"/></svg>',lock:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',paperclip:'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',attach:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 6.5L6.8 11.2a2 2 0 0 1-2.8-2.8l5.4-5.4a3 3 0 0 1 4.2 4.2l-5.4 5.4a4 4 0 0 1-5.7-5.7L7.5 2.5"/></svg>',file:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13"/></svg>',folder:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>',close:'<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',send:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 13.5L14 8 2 2.5 2 7l8 1-8 1z"/></svg>',brain:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3a2 2 0 0 0-2 2 2 2 0 0 0-1 3.5 2 2 0 0 0 1.5 3 2 2 0 0 0 3.5 0V3.5A1.5 1.5 0 0 0 5.5 3z"/><path d="M10.5 3a2 2 0 0 1 2 2 2 2 0 0 1 1 3.5 2 2 0 0 1-1.5 3 2 2 0 0 1-3.5 0V3.5A1.5 1.5 0 0 1 10.5 3z"/></svg>',gauge:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a5.5 5.5 0 1 1 10 0"/><path d="M8 8l3-3"/><path d="M5 12h6"/></svg>',bot:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="10" height="7" rx="1.5"/><path d="M8 3v2.5M5.5 8.5h.01M10.5 8.5h.01M2 9.5v1.5M14 9.5v1.5"/></svg>',mode:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5h12M2 8h8M2 10.5h10"/></svg>',sparkle:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l1.2 3.4L12.5 6.5 9.2 7.6 8 11l-1.2-3.4L3.5 6.5 6.8 5.4z"/></svg>',wrench:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M10.8 2.2a3.2 3.2 0 0 0-3.7 4.1L2.6 10.8a1.7 1.7 0 0 0 2.4 2.4l4.5-4.5a3.2 3.2 0 0 0 4.1-3.7l-2.2 2.2-2.1-.5-.5-2.1z"/></svg>',caret:'<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l6 5-6 5z"/></svg>'},a=P[ne()]||P.en;return`<!doctype html><html lang="${f(a.htmlLang)}"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${e.cspSource} data:; style-src 'unsafe-inline' ${e.cspSource}; script-src 'nonce-${o}';"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
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
.chipBtn input{margin:0;accent-color:var(--accent)}
.chipBtn input:checked + .chipText{color:var(--fg)}
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
    <span>${f(a.product)}</span>
  </div>
  <div class="headerSpacer"></div>
  <button type="button" class="iconBtn" data-action="toggleHistory" title="${f(a.history)}">${n.history}</button>
  <button type="button" class="iconBtn" data-action="newChat" title="${f(a.newChat)}">${n.plus}</button>
  <button type="button" class="iconBtn" data-action="refreshModels" title="${f(a.refreshModels)}">${n.refresh}</button>
  <button type="button" class="iconBtn" data-action="verifyCli" title="${f(a.verifyCli)}">i</button>
</header>
<div id="historyPanel" class="panel"><header>${f(a.history)} <div class="barSpacer"></div><button data-action="clearHistory">${f(a.clear)}</button></header><div id="historyList"></div></div>

<main class="thread" id="thread">
  <section class="welcome" id="welcome">
    <div class="welcomeTitle">${f(a.welcomeTitle)}</div>
    <div class="welcomeText">${f(a.welcomeText)}</div>
    <div id="recentBlock" class="recentBlock" style="display:none">
      <div class="recentHead">${n.history} ${f(a.recent)}</div>
      <div id="recentList"></div>
    </div>
    <div class="starterGrid">
      <button type="button" class="starter" data-action="review"><b>${f(a.reviewDiff)}</b><span>${f(a.reviewDiffDesc)}</span></button>
      <button type="button" class="starter" data-action="starter" data-prompt="${f(a.planPrompt)}"><b>${f(a.planTask)}</b><span>${f(a.planTaskDesc)}</span></button>
      <button type="button" class="starter" data-action="selection"><b>${f(a.explainContext)}</b><span>${f(a.explainContextDesc)}</span></button>
    </div>
  </section>
</main>
<footer class="composerWrap">
  <div id="modelGate" class="modelGate"><b>${f(a.selectModel)}</b><span>${f(a.beforeChat)}</span></div>
  <div class="composer">
    <div id="contextChips" class="contextChips"></div>
    <div class="inputLine"><textarea id="prompt" placeholder="${f(a.placeholder)}"></textarea></div>
    <div class="composerBar">
      <button type="button" class="chipBtn" data-action="attachMenu" id="attachBtn" title="${f(a.attachTitle)}">${n.attach}<span class="chipText">${f(a.attach)}</span></button>
      <button type="button" class="chipBtn" data-action="openModelMenu" id="modelChip" title="${f(a.model)}">${n.brain}<span class="chipText" id="modelChipText">${f(a.model)}</span><span class="caret">${n.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openEffortMenu" id="effortChip" title="Effort" style="display:none">${n.gauge}<span class="chipText" id="effortChipText">Effort</span><span class="caret">${n.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openAgentMenu" id="agentChip" title="${f(a.agent)}">${n.bot}<span class="chipText" id="agentChipText">${f(a.agent)}</span><span class="caret">${n.caret}</span></button>
      <button type="button" class="chipBtn" data-action="openSkillsMenu" id="skillsBtn" title="Skills">${n.sparkle}<span class="chipText">Skills <span id="skillsCount">0</span></span></button>
      <button type="button" class="chipBtn" data-action="openToolsMenu" id="toolsBtn" title="Tools">${n.wrench}<span class="chipText">Tools <span id="toolsCount">0</span></span></button>
      <label class="chipBtn" id="bypassChip" title="${f(a.bypassTitle)}"><input type="checkbox" id="bypassToggle"><span class="chipText">${f(a.bypass)}</span></label>
      <span class="barSpacer"></span>
      <span class="busyDot"></span>
      <span class="tokenPie" id="tokenPie" title="Tokens"></span>
      <button class="stopBtn" id="cancel" type="button" data-action="cancelRun" title="${f(a.cancel)}">\xD7</button>
      <button class="sendBtn" id="send" type="button" data-action="send" title="${f(a.send)}">${n.send}</button>
    </div>
  </div>
</footer>
</div>
<script nonce="${o}">
(function(){
'use strict';
var vscode = acquireVsCodeApi();
var ICONS = ${JSON.stringify(n)};
var META = { models: ['auto'], efforts: [], skills: [], selectedSkills: [], tools: [], selectedTools: [], modelLocked: false, hasMessages: false, model: 'auto', effort: 'auto', agent: 'auto', bypass: false, mode: 'resposta-integrada', agents: ['auto'], tokensTotal: 0, tokensIn: 0, tokensOut: 0, recentSessions: [], labels: { model: '${f(a.model)}', agent: '${f(a.agent)}' } };
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

function buildMenu(items, anchor, onPick, level, selectedValue){
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
        var sub = buildMenu(it.children, row, onPick, level + 1, selectedValue);
        positionMenuBeside(sub, row);
      });
      row.addEventListener('click', function(ev){ ev.stopPropagation(); });
    } else {
      if(it.value === selectedValue) row.classList.add('selected');
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
  var models = META.models && META.models.length ? META.models : ['auto'];
  var items = models.map(function(model){ return { label: model, value: model }; });
  var menu = buildMenu(items, anchor, function(value){ post({ type: 'setModel', value: value || 'auto' }); }, 1, META.model || 'auto');
  positionMenuAnchor(menu, anchor);
  openMenu = 'model';
}

function openEffortMenu(){
  closeAllMenus();
  var anchor = byId('effortChip');
  var efforts = META.efforts && META.efforts.length ? META.efforts : [];
  if(!anchor || !efforts.length) return;
  var items = efforts.map(function(effort){ return { label: effort, value: effort }; });
  var menu = buildMenu(items, anchor, function(value){ post({ type: 'setEffort', value: value || 'auto' }); }, 1, META.effort || 'auto');
  positionMenuAnchor(menu, anchor);
  openMenu = 'effort';
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
  if(name === 'openEffortMenu') return openEffortMenu();
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
var bt = byId('bypassToggle');
if(bt){
  bt.addEventListener('change', function(){ post({ type: 'setBypass', value: !!bt.checked }); });
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
    if(m.models) META.models = m.models || ['auto'];
    if(m.labels) META.labels = m.labels || META.labels;
    if(m.efforts) META.efforts = m.efforts || [];
    if(m.skills) META.skills = m.skills || []; if(m.selectedSkills) META.selectedSkills = m.selectedSkills || [];
    if(m.tools) META.tools = m.tools || []; if(m.selectedTools) META.selectedTools = m.selectedTools || [];
    if('modelLocked' in m) META.modelLocked = !!m.modelLocked; if('hasMessages' in m) META.hasMessages = !!m.hasMessages;
    if('model' in m) META.model = m.model || 'auto'; if('effort' in m) META.effort = m.effort || 'auto'; if('agent' in m) META.agent = m.agent || 'auto'; if('bypass' in m) META.bypass = !!m.bypass; META.mode = 'resposta-integrada';
    if(m.agents) META.agents = m.agents || ['auto'];
    if('tokensTotal' in m) META.tokensTotal = m.tokensTotal || 0; if('tokensIn' in m) META.tokensIn = m.tokensIn || 0; if('tokensOut' in m) META.tokensOut = m.tokensOut || 0;
    if(m.recentSessions) META.recentSessions = m.recentSessions || [];

    var modelChip = byId('modelChip');
    var modelText = byId('modelChipText');
    if(modelText) modelText.textContent = META.model || META.labels.model || 'Model';
    if(modelChip){ modelChip.disabled = false; modelChip.classList.toggle('has', !!META.model); }
    var effortChip = byId('effortChip');
    var effortText = byId('effortChipText');
    var hasEfforts = !!(META.efforts && META.efforts.length);
    if(effortChip){ effortChip.style.display = hasEfforts ? 'inline-flex' : 'none'; effortChip.classList.toggle('has', META.effort && META.effort !== 'auto'); }
    if(effortText) effortText.textContent = META.effort === 'auto' ? 'Effort' : META.effort;
    var agentText = byId('agentChipText'); if(agentText) agentText.textContent = META.agent === 'auto' ? (META.labels.agent || 'Agent') : META.agent;
    var agentChip = byId('agentChip'); if(agentChip) agentChip.classList.toggle('has', META.agent !== 'auto');
    var bypassToggle = byId('bypassToggle'); if(bypassToggle) bypassToggle.checked = !!META.bypass;
    var bypassChip = byId('bypassChip'); if(bypassChip) bypassChip.classList.toggle('has', !!META.bypass);
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
</script></body></html>`}};async function Vt(t){X=t,_=c.window.createOutputChannel("Devin Cli Chat"),t.subscriptions.push(_),g(`Extens\xE3o ativando \u2014 VS Code ${c.version}, extens\xE3o ${t.extension.packageJSON.version}`),g(`Plataforma: ${process.platform} ${process.arch}`),g(`Devin CLI path configurado: ${C()}`),g(`Workspace: ${b()||"nenhum"}`),v=new ye(t),t.subscriptions.push(c.window.registerWebviewViewProvider("devinCliChat.chatView",v,{webviewOptions:{retainContextWhenHidden:!0}})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.abrirPainel",async()=>c.commands.executeCommand("workbench.view.extension.devinCliChat"))),t.subscriptions.push(c.commands.registerCommand("devinCliChat.abrirHistorico",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),setTimeout(()=>{v&&v.openHistory()},100)})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.exportarSessaoAtual",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),v&&await v.exportSession()})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.novaSessao",()=>Lt(""))),t.subscriptions.push(c.commands.registerCommand("devinCliChat.revisarDiff",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),v&&await v.send("Revise o git diff atual com foco em bugs, seguranca, testes, impacto produtivo e rollback.\n\n```diff\n"+be()+"\n```")})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.enviarSelecao",async()=>{await c.commands.executeCommand("workbench.view.extension.devinCliChat"),v&&await v.send(`Analise o contexto do editor atual.

`+ve())})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarModelo",Rt)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarEffort",Ot)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.definirModeloManual",Fe)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.atualizarModelos",async()=>{E(),v&&v.refreshMeta();let n=await ie();if(n.length){let a=Array.from(new Set([...p().get("modelosDisponiveis")||[],...n]));await p().update("modelosDisponiveis",a,c.ConfigurationTarget.Workspace),E()}v&&v.refreshMeta(),c.window.showInformationMessage(`Modelos atualizados (${O().length} disponiveis).`)})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarAgente",async()=>{let n="+ Importar arquivo .md como agente",a=await c.window.showQuickPick([n,...Le()],{placeHolder:"Selecione o agente Devin"});if(a){if(a===n){await ut();return}await x("agenteAtual",a)}})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarSkills",Wt)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.selecionarTools",qt)),t.subscriptions.push(c.commands.registerCommand("devinCliChat.limparHistorico",async()=>{await c.window.showWarningMessage("Limpar todo o historico de chats?",{modal:!0},"Limpar")==="Limpar"&&(await J([]),v&&v.post({type:"history",sessions:[]}))})),t.subscriptions.push(c.commands.registerCommand("devinCliChat.verificarCli",()=>{_.show(!0),g(`Verificando Devin CLI: ${C()}`),F.execFile(C(),["--version"],{cwd:I(),windowsHide:!0},(n,a,s)=>{if(n)g(`verificarCli ERRO: code=${n.code} msg=${n.message}`),c.window.showErrorMessage(`Falha ao verificar Devin CLI: ${n.message}`);else{let i=(a||s||"ok").trim();g(`verificarCli OK: ${i}`),c.window.showInformationMessage(`Devin CLI encontrado: ${i}`)}})}));let e,o=()=>{e&&clearTimeout(e),e=setTimeout(()=>{v&&v.pushCurrentSelection(!0)},150)};t.subscriptions.push(c.window.onDidChangeTextEditorSelection(o)),t.subscriptions.push(c.window.onDidChangeActiveTextEditor(o)),t.subscriptions.push(c.workspace.onDidChangeConfiguration(n=>{n.affectsConfiguration(Re)&&(E(),xe(),v&&v.refreshMeta())})),xe()}function Ut(){for(let t of nt())Ae(t)}module.exports={activate:Vt,deactivate:Ut,_internal:{baseArgs:re,fullPrompt:q,runIntegrated:ot,modelsForUi:O,parseModelsFromText:Ie,effortsForUi:se,parseEffortSpecFromText:at,scanAgents:Le,scanSkills:Pe,scanTools:Be,skillNameFromMarkdownFile:rt,importSkillMarkdownFile:lt,importAgentMarkdownFile:ct,importToolMarkdownFile:$e,loadHistory:B,saveHistory:J,sanitizeModel:A,sanitizeEffort:W,sanitizePromptText:Je,isSafeModelId:ke,isSafeEffortId:Ce,cancelIntegratedRun:Ae,automaticEditorContext:dt,resolveWorkspacePathSafe:te,registerRunState:Ee,unregisterRunState:Te,activeRunIds:nt,createNonce:Ue,validateWebviewMessage:Ke,expandSlashCommand:Ze,exportSessionMarkdown:Qe,uiLanguage:ne,tr:Ge}};
